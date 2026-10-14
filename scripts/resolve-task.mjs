import fs from 'node:fs';
import path from 'node:path';

const taskId = process.argv[2];
const newStatus = process.argv[3] || 'COMPLETED';

if (!taskId) {
  console.log('Cách dùng: node scripts/resolve-task.mjs <taskId> [STATUS]');
  process.exit(1);
}

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
await client.query(
  'UPDATE telegram_tasks SET status = $1, completed_at = NOW(), error = NULL WHERE id = $2',
  [newStatus, parseInt(taskId, 10)]
);
console.log(`✅ Đã cập nhật Task #${taskId} sang trạng thái ${newStatus}`);
await client.end();
