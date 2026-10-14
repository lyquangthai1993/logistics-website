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

if (!dbUrl) {
  console.error('❌ Không tìm thấy DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

await client.connect();

// Query chuẩn xác lọc các task nghiệp vụ thực tế chưa hoàn thành (loại trừ task_id null và các task đã COMPLETED/CANCELLED)
const query = `
  SELECT id, task_id, message_id, sender_name, raw_prompt, status, created_at,
         jsonb_array_length(image_file_ids) as photo_count
  FROM telegram_tasks
  WHERE task_id IS NOT NULL
    AND status NOT IN ('COMPLETED', 'CANCELLED')
    AND raw_prompt NOT ILIKE '/help%'
    AND raw_prompt NOT ILIKE '/start%'
    AND raw_prompt NOT ILIKE '/cancel%'
  ORDER BY task_id ASC
`;

const res = await client.query(query);

console.log(`========================================`);
console.log(`📋 DANH SÁCH TASK CHƯA HOÀN THÀNH THỰC TẾ (${res.rows.length} tasks)`);
console.log(`========================================`);

for (const t of res.rows) {
  console.log(`\n🔹 Task #${t.task_id || t.id} [${t.status}] - Người gửi: ${t.sender_name} | Ảnh: ${t.photo_count}`);
  console.log(`   ⏰ Ghi nhận: ${t.created_at}`);
  console.log(`   📝 Nội dung: ${t.raw_prompt}`);
}

await client.end();
