import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPaths = [
  path.resolve(__dirname, '../tools/telegram-task-runner/.env'),
  path.resolve(__dirname, '../backend/.env')
];

for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    process.loadEnvFile(ep);
    if (process.env.TELEGRAM_BOT_TOKEN) break;
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ Không tìm thấy TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${token}`;

async function main() {
  console.log('1. Lấy danh sách lệnh hiện tại từ Telegram...');
  const getRes = await fetch(`${API_BASE}/getMyCommands`);
  const current = await getRes.json();
  console.log('Current commands:', current.result);

  const newCommands = [
    { command: 'report', description: '📊 Báo cáo tổng hợp tiến độ task hôm nay' },
    { command: 'report_today', description: '📊 Báo cáo chi tiết các task hôm nay' },
    { command: 'today', description: '📅 Báo cáo nhanh tiến độ công việc trong ngày' },
    { command: 'feedback', description: '📝 Ghi nhận phản hồi nghiệp vụ & lập TODO.md' },
    { command: 'force', description: '⚡ Kích hoạt thực thi task / quét checklist' },
    { command: 'help', description: 'ℹ️ Hướng dẫn sử dụng hệ thống bot' }
  ];

  console.log('\n2. Đăng ký danh sách lệnh mới với Telegram Bot API...');
  const setRes = await fetch(`${API_BASE}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: newCommands })
  });

  const setResult = await setRes.json();
  if (setResult.ok) {
    console.log('✅ Đã cập nhật thành công danh sách lệnh Bot trên Telegram!');
    console.log('Danh sách lệnh mới:');
    newCommands.forEach(c => console.log(`   /${c.command} - ${c.description}`));
  } else {
    console.error('❌ Lỗi khi gọi setMyCommands:', setResult.description);
  }
}

main().catch(console.error);
