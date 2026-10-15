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

const inProgressRes = await client.query(`
  SELECT id, task_id, sender_name, substring(raw_prompt from 1 for 100) as prompt_preview, status, started_at
  FROM telegram_tasks
  WHERE status = 'IN_PROGRESS'
  ORDER BY id ASC
`);

console.log('=== [DATABASE] TASKS ĐANG IN_PROGRESS ===');
if (inProgressRes.rows.length === 0) {
  console.log('Không có task nào đang IN_PROGRESS trong DB.');
} else {
  for (const row of inProgressRes.rows) {
    console.log(`🔹 Task #${row.task_id || row.id} - Người gửi: ${row.sender_name} | Bắt đầu lúc: ${row.started_at}`);
    console.log(`   Nội dung: ${row.prompt_preview}`);
  }
}

const pendingRes = await client.query(`
  SELECT id, task_id, sender_name, substring(raw_prompt from 1 for 100) as prompt_preview, status, created_at
  FROM telegram_tasks
  WHERE task_id IS NOT NULL
    AND status = 'PENDING'
    AND raw_prompt NOT ILIKE '/help%'
    AND raw_prompt NOT ILIKE '/cancel%'
  ORDER BY task_id ASC
`);

console.log('\n=== [DATABASE] TASKS ĐANG PENDING ===');
if (pendingRes.rows.length === 0) {
  console.log('Không còn task nào PENDING.');
} else {
  for (const row of pendingRes.rows) {
    console.log(`⏳ Task #${row.task_id || row.id} - Người gửi: ${row.sender_name} | Tạo lúc: ${row.created_at}`);
    console.log(`   Nội dung: ${row.prompt_preview}`);
  }
}

await client.end();
