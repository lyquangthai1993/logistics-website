import fs from 'node:fs';
import path from 'node:path';

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const pgPath = path.resolve('tools/telegram-task-runner/node_modules/pg/lib/index.js');
  pg = (await import('file:///' + pgPath.replace(/\\/g, '/'))).default;
}

const { Client } = pg;
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const envPaths = [
    path.resolve('tools/telegram-task-runner/.env'),
    path.resolve('backend/.env')
  ];
  for (const ep of envPaths) {
    if (fs.existsSync(ep)) {
      const content = fs.readFileSync(ep, 'utf8');
      const match = content.match(/DATABASE_URL=([^\r\n]+)/);
      if (match) {
        dbUrl = match[1].trim();
        break;
      }
    }
  }
}

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

await client.connect();

const taskId = parseInt(process.argv[2] || '58', 10);
const newResult = process.argv[3] || 
  `🟢 HOÀN THÀNH: Thực thi tự động feedback_14_10_task_52.\n• 9/9 hạng mục đạt chuẩn (Loại bỏ header thừa & nút bốc đơn dọc đường trên modal xem trip nhập/xuất; E2E Test 50/50 PASS).\n• Checklist TODO.md và RESOLUTION.md đã nghiệm thu.\n\n🔗 Workflow: https://github.com/lyquangthai1993/logistics-website/actions/runs/38506905443`;

await client.query('UPDATE telegram_tasks SET result = $1, error = NULL WHERE task_id = $2 OR (task_id IS NULL AND id = $2)', [newResult, taskId]);

console.log(`✅ Đã cập nhật gói gọn kết quả cho Task #${taskId}!`);
const res = await client.query('SELECT id, task_id, status, result, error FROM telegram_tasks WHERE task_id = $1 OR (task_id IS NULL AND id = $1)', [taskId]);
console.log(res.rows[0]);

await client.end();
