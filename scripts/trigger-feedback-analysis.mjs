import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.resolve('tools/telegram-task-runner/package.json'));
const pg = require('pg');

process.loadEnvFile(path.resolve('tools/telegram-task-runner/.env'));
const dbUrl = process.env.DATABASE_URL;
const isSsl = dbUrl.includes('neon.tech') || dbUrl.includes('sslmode=require');
const client = new pg.Client({ connectionString: dbUrl, ssl: isSsl ? { rejectUnauthorized: false } : false });
await client.connect();

// Reset Task 91 về PENDING
const updateRes = await client.query(
  'UPDATE telegram_tasks SET status = $1, started_at = NULL, completed_at = NULL, error = NULL WHERE id = 91 RETURNING *',
  ['PENDING']
);
const task = updateRes.rows[0];
console.log('✅ Đã cập nhật Task 91 (task_id ' + task.task_id + ') về PENDING.');

const pat = process.env.GH_PAT_TOKEN;
const taskId = String(task.task_id || task.id);
const prompt = (task.analysis || task.raw_prompt).replace(/<id>/g, taskId);

console.log('🚀 Đang gửi repository_dispatch với event_type: telegram-feedback cho Task #' + taskId + ' (db_id: 91)...');

const ghRes = await fetch('https://api.github.com/repos/lyquangthai1993/logistics-website/dispatches', {
  method: 'POST',
  headers: {
    Authorization: 'token ' + pat,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Antigravity-Assistant'
  },
  body: JSON.stringify({
    event_type: 'telegram-feedback',
    client_payload: {
      task_id: taskId,
      db_id: '91',
      prompt: prompt,
      mode: 'leader',
      sender_name: task.sender_name || 'User'
    }
  })
});

console.log('GitHub Dispatch Response Status:', ghRes.status);
if (ghRes.status === 204) {
  console.log('🎉 Dispatch thành công! GitHub Actions workflow đã được kích hoạt.');
} else {
  const errText = await ghRes.text();
  console.error('❌ Dispatch thất bại:', errText);
}

await client.end();
