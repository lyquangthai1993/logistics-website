import fs from 'node:fs';
import path from 'node:path';

// 1. Tự động tìm pg driver
let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const pgPath = path.resolve('tools/telegram-task-runner/node_modules/pg/lib/index.js');
  pg = (await import('file:///' + pgPath.replace(/\\/g, '/'))).default;
}

const { Client } = pg;

// 2. Tự động load DATABASE_URL và cấu hình Telegram
let dbUrl = process.env.DATABASE_URL;
let botToken = process.env.TELEGRAM_BOT_TOKEN;
let chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID || '-5509877448';

const envFiles = [
  path.resolve('tools/telegram-task-runner/.env'),
  path.resolve('backend/.env')
];

for (const ef of envFiles) {
  if (fs.existsSync(ef)) {
    const content = fs.readFileSync(ef, 'utf8');
    if (!dbUrl) {
      const matchDb = content.match(/DATABASE_URL=([^\r\n]+)/);
      if (matchDb) dbUrl = matchDb[1].trim();
    }
    if (!botToken) {
      const matchBot = content.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
      if (matchBot) botToken = matchBot[1].trim();
    }
    if (!chatId) {
      const matchChat = content.match(/TELEGRAM_ALLOWED_CHAT_ID=([^\r\n]+)/);
      if (matchChat) chatId = matchChat[1].trim();
    }
  }
}

if (!dbUrl) {
  console.error('❌ Không tìm thấy DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

await client.connect();

const sql = `
  SELECT id, sender_name, substring(raw_prompt from 1 for 70) as task_name, status, 
         to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as created_time,
         to_char(completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as completed_time,
         substring(error from 1 for 100) as error_msg
  FROM telegram_tasks 
  WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
     OR (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ORDER BY id ASC;
`;

const res = await client.query(sql);
const rows = res.rows;
await client.end();

const doneTasks = rows.filter(r => r.status === 'COMPLETED');
const failTasks = rows.filter(r => ['FAILED', 'DEV_E2E_FAILED', 'DEV_DEPLOY_TIMEOUT'].includes(r.status));
const runningTasks = rows.filter(r => ['IN_PROGRESS', 'PENDING', 'VERIFYING_LOCAL', 'VERIFYING_DEV'].includes(r.status));
const cancelTasks = rows.filter(r => r.status === 'CANCELLED');

const now = new Date();
const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

let text = `📊 <b>BÁO CÁO TIẾN ĐỘ TASK HÔM NAY (${dateStr} ${timeStr})</b>\n`;
text += `━━━━━━━━━━━━━━━━━━━━\n`;
text += `🎯 <b>Tổng số task:</b> <b>${rows.length}</b>\n`;
text += `✅ <b>Hoàn thành (DONE):</b> <b>${doneTasks.length}</b>\n`;
text += `❌ <b>Thất bại (FAIL):</b> <b>${failTasks.length}</b>\n`;
if (runningTasks.length > 0) {
  text += `⏳ <b>Đang thực thi:</b> <b>${runningTasks.length}</b>\n`;
}
if (cancelTasks.length > 0) {
  text += `🚫 <b>Đã hủy / Gộp:</b> <b>${cancelTasks.length}</b>\n`;
}
text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

if (rows.length === 0) {
  text += `<i>Hôm nay chưa có task nào được ghi nhận trên hệ thống.</i>\n`;
} else {
  text += `<b>📋 DANH SÁCH CHI TIẾT CÁC TASK:</b>\n`;
  for (const t of rows) {
    let icon = '⚪';
    let statusLabel = t.status;
    if (t.status === 'COMPLETED') {
      icon = '✅';
      statusLabel = 'DONE';
    } else if (['FAILED', 'DEV_E2E_FAILED', 'DEV_DEPLOY_TIMEOUT'].includes(t.status)) {
      icon = '❌';
      statusLabel = 'FAIL';
    } else if (['IN_PROGRESS', 'PENDING', 'VERIFYING_LOCAL', 'VERIFYING_DEV'].includes(t.status)) {
      icon = '⏳';
      statusLabel = 'RUNNING';
    } else if (t.status === 'CANCELLED') {
      icon = '🚫';
      statusLabel = 'CANCEL';
    }

    const time = t.completed_time || t.created_time || '';
    const safeTitle = (t.task_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text += `${icon} <b>#${t.id} [${statusLabel}]</b> <code>(${time})</code>: ${safeTitle}\n`;
    if (t.error_msg && icon === '❌') {
      const safeErr = t.error_msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 100);
      text += `   ⚠️ <i>Lỗi: ${safeErr}</i>\n`;
    }
  }
}

text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
text += `🌐 <a href="https://frontend-tms-core-dev.up.railway.app">Frontend Dev</a> | 🚀 <a href="https://frontend-tms-core-production.up.railway.app">Frontend Pro</a>`;

console.log(text.replace(/<[^>]+>/g, ''));

const shouldSend = process.argv.includes('--send');
if (shouldSend && botToken && chatId) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Cập nhật /report-today', callback_data: '/report-today' },
          { text: '🌐 Mở Dev Web', url: 'https://frontend-tms-core-dev.up.railway.app' }
        ]
      ]
    }
  };

  const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  console.log('Telegram send status:', data.ok ? '✅ Gửi thành công!' : `❌ Lỗi: ${data.description}`);
}
