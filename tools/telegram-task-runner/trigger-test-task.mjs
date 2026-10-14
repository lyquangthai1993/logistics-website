import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => envContent.match(new RegExp(`${key}=([^\\r\\n]+)`))?.[1]?.trim();

const dbUrl = getEnv('DATABASE_URL');
const pat = getEnv('GH_PAT_TOKEN');
const chatId = getEnv('TELEGRAM_ALLOWED_CHAT_ID');

if (!dbUrl || !pat) {
  console.error('Missing DB_URL or GH_PAT_TOKEN in .env');
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: false });
await client.connect();

// Tạo một test task thực sự để kiểm thử toàn diện pipeline GitHub Actions
const prompt = "Kiểm tra và xác nhận đồng bộ hệ thống TMS, ghi nhận tiến độ vào feedbacks/feedback_14_10_task_test_live/TODO.md và lưu ảnh screenshot_01_verified.png";

const insertRes = await client.query(
  `INSERT INTO telegram_tasks (chat_id, sender_name, raw_prompt, status, created_at)
   VALUES ($1, $2, $3, 'PENDING', NOW()) RETURNING id`,
  [chatId, 'TestRunner', prompt]
);

const newTaskId = insertRes.rows[0].id;
console.log(`✅ Đã tạo test task #${newTaskId} trong Database`);

await client.end();

// Kích hoạt GitHub Action workflow qua repository_dispatch
console.log(`🚀 Đang kích hoạt GitHub Actions repository_dispatch cho Task #${newTaskId}...`);
const ghRes = await fetch('https://api.github.com/repos/lyquangthai1993/logistics-website/dispatches', {
  method: 'POST',
  headers: {
    Authorization: `token ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Telegram-Task-Runner'
  },
  body: JSON.stringify({
    event_type: 'telegram-task',
    client_payload: {
      task_id: String(newTaskId),
      prompt: prompt,
      mode: 'leader',
      sender_name: 'TestRunner'
    }
  })
});

if (ghRes.status === 204) {
  console.log(`🎉 Repository Dispatch thành công (Status 204)! GitHub Actions đang khởi chạy Task #${newTaskId}...`);
} else {
  const errText = await ghRes.text();
  console.error(`❌ Dispatch thất bại: ${ghRes.status}`, errText);
}
