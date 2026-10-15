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

// 3. Phân giải tham số ngày (hỗ trợ DD_MM, DD_MM_YY, DD_MM_YYYY, hôm nay mặc định theo múi giờ VN)
function parseDateArg(argv) {
  let rawDate = null;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--date=')) {
      rawDate = a.slice(7);
      break;
    }
    if (!a.startsWith('-')) {
      rawDate = a;
      break;
    }
  }

  const now = new Date();
  const currentYear = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now),
    10
  );
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now); // YYYY-MM-DD
  const todayDisplay = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);

  if (!rawDate || rawDate.toLowerCase() === 'today' || rawDate.toLowerCase() === 'hom_nay') {
    return {
      isoDate: todayIso,
      displayDate: todayDisplay,
      isToday: true,
      originalParam: null,
    };
  }

  const cleaned = rawDate.trim().replace(/[\/\-\.]/g, '_');
  const parts = cleaned.split('_').filter(Boolean);

  let day, month, year;

  if (parts.length === 2) {
    // DD_MM (vd: 14_10) -> năm hiện tại (2026)
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = currentYear;
  } else if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY_MM_DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // DD_MM_YY hoặc DD_MM_YYYY (vd: 14_10_26 -> 2026, 14_10_2026 -> 2026)
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      let rawY = parseInt(parts[2], 10);
      year = rawY < 100 ? 2000 + rawY : rawY;
    }
  } else {
    return {
      isoDate: todayIso,
      displayDate: todayDisplay,
      isToday: true,
      originalParam: rawDate,
    };
  }

  if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12) {
    return {
      isoDate: todayIso,
      displayDate: todayDisplay,
      isToday: true,
      originalParam: rawDate,
    };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const targetIso = `${year}-${pad(month)}-${pad(day)}`;
  const targetDisplay = `${pad(day)}/${pad(month)}/${year}`;
  const isToday = targetIso === todayIso;

  return {
    isoDate: targetIso,
    displayDate: targetDisplay,
    isToday,
    originalParam: rawDate,
  };
}

const dateInfo = parseDateArg(process.argv);

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

await client.connect();

const sql = `
  SELECT id, task_id, sender_name, substring(raw_prompt from 1 for 70) as task_name, status, 
         to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as created_time,
         to_char(completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as completed_time,
         substring(error from 1 for 100) as error_msg
  FROM telegram_tasks 
  WHERE task_id IS NOT NULL 
    AND ((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = $1::date
     OR (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = $1::date)
  ORDER BY task_id ASC;
`;

const res = await client.query(sql, [dateInfo.isoDate]);
const rows = res.rows;
await client.end();

const doneTasks = rows.filter(r => r.status === 'COMPLETED');
const failTasks = rows.filter(r => ['FAILED', 'DEV_E2E_FAILED', 'DEV_DEPLOY_TIMEOUT'].includes(r.status));
const runningTasks = rows.filter(r => ['IN_PROGRESS', 'PENDING', 'VERIFYING_LOCAL', 'VERIFYING_DEV'].includes(r.status));
const cancelTasks = rows.filter(r => r.status === 'CANCELLED');

const now = new Date();
const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

let text = '';
if (dateInfo.isToday) {
  text += `📊 <b>BÁO CÁO TIẾN ĐỘ TASK HÔM NAY (${dateInfo.displayDate} ${timeStr})</b>\n`;
} else {
  text += `📊 <b>BÁO CÁO TIẾN ĐỘ TASK NGÀY ${dateInfo.displayDate} (Xuất lúc ${timeStr})</b>\n`;
}
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
  if (dateInfo.isToday) {
    text += `<i>Hôm nay chưa có task nào được ghi nhận trên hệ thống.</i>\n`;
  } else {
    text += `<i>Không có task nào được ghi nhận trên hệ thống trong ngày ${dateInfo.displayDate}.</i>\n`;
  }
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
    text += `${icon} <b>#${t.task_id || t.id} [${statusLabel}]</b> <code>(${time})</code>: ${safeTitle}\n`;
    if (t.error_msg && icon === '❌') {
      const safeErr = t.error_msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 100);
      text += `   ⚠️ <i>Lỗi: ${safeErr}</i>\n`;
    }
  }
}

text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
text += `🌐 <a href="https://frontend-tms-core-dev.up.railway.app">Frontend Dev</a> | 🚀 <a href="https://frontend-tms-core-production.up.railway.app">Frontend Pro</a>`;

if (process.argv.includes('--raw-html')) {
  console.log(text);
} else {
  console.log(text.replace(/<[^>]+>/g, ''));
}

const shouldSend = process.argv.includes('--send');
if (shouldSend && botToken && chatId) {
  const refreshCallback = dateInfo.isToday ? '/report-today' : `/report ${dateInfo.displayDate.slice(0, 5).replace('/', '_')}`;
  const refreshText = dateInfo.isToday ? '📊 Cập nhật /report-today' : `📊 Cập nhật /report ${dateInfo.displayDate.slice(0, 5).replace('/', '_')}`;

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: refreshText, callback_data: refreshCallback },
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
