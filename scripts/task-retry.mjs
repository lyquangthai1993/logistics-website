import fs from 'node:fs';
import path from 'node:path';

// Lấy task_id từ tham số dòng lệnh: node scripts/task-retry.mjs <taskId>
const targetTaskId = process.argv[2];

if (!targetTaskId || isNaN(Number(targetTaskId))) {
  console.log('📌 Cách sử dụng: node scripts/task-retry.mjs <taskId>');
  console.log('Ví dụ: node scripts/task-retry.mjs 52');
  process.exit(1);
}

const taskId = parseInt(targetTaskId, 10);

// Nạp PostgreSQL client
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

try {
  await client.connect();
  const res = await client.query('SELECT * FROM telegram_tasks WHERE id = $1', [taskId]);

  if (!res.rows || res.rows.length === 0) {
    console.error(`❌ Không tìm thấy Task #${taskId} trong bảng telegram_tasks!`);
    await client.end();
    process.exit(1);
  }

  const task = res.rows[0];
  console.log(`\n========================================`);
  console.log(`📋 THÔNG TIN TASK #${task.id}`);
  console.log(`========================================`);
  console.log(`👤 Người gửi: ${task.sender_name || 'N/A'}`);
  console.log(`📊 Trạng thái hiện tại: ${task.status}`);
  console.log(`📝 Yêu cầu: "${task.raw_prompt}"`);
  if (task.error) {
    console.log(`\n⚠️ LỖI GHI NHẬN TRƯỚC ĐÓ:\n${task.error}\n`);
  } else {
    console.log(`ℹ️ Không có lỗi trước đó (error: NULL)`);
  }

  // Cập nhật trạng thái về PENDING và xóa error/result cũ để retry
  await client.query(`
    UPDATE telegram_tasks 
    SET status = 'PENDING', error = NULL, result = NULL, started_at = NULL, completed_at = NULL 
    WHERE id = $1;
  `, [taskId]);

  console.log(`✅ Đã reset Task #${taskId} về trạng thái PENDING sẵn sàng retry!`);

  // Tìm token GitHub PAT để dispatch workflow nếu có
  let ghPat = process.env.GH_PAT_TOKEN;
  if (!ghPat) {
    for (const ep of [path.resolve('tools/telegram-task-runner/.env'), path.resolve('.env')]) {
      if (fs.existsSync(ep)) {
        const content = fs.readFileSync(ep, 'utf8');
        const match = content.match(/GH_PAT_TOKEN=([^\r\n]+)/);
        if (match) {
          ghPat = match[1].trim();
          break;
        }
      }
    }
  }

  if (ghPat) {
    console.log(`🚀 Đang kích hoạt GitHub Actions Worker chạy lại Task #${taskId}...`);
    // Kiểm tra xem task có ảnh trong folder feedback không
    let imageRel = '';
    const fbDir = path.resolve(`feedbacks/feedback_14_10_task_${taskId}`);
    if (fs.existsSync(fbDir)) {
      const files = fs.readdirSync(fbDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
      if (files.length > 0) {
        imageRel = `feedbacks/feedback_14_10_task_${taskId}/${files[0]}`;
      }
    }

    let promptWithImage = task.raw_prompt;
    if (imageRel) {
      promptWithImage = `Ảnh đính kèm feedback: ${imageRel}\n\n` + task.raw_prompt;
    }

    const payload = {
      ref: 'master',
      inputs: {
        task_id: String(taskId),
        prompt: promptWithImage,
        sender_name: task.sender_name || 'User',
        mode: 'leader'
      }
    };

    const dispatchRes = await fetch(
      'https://api.github.com/repos/lyquangthai1993/logistics-website/actions/workflows/telegram-agy-worker.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghPat}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'node-task-retry'
        },
        body: JSON.stringify(payload)
      }
    );

    if (dispatchRes.ok || dispatchRes.status === 204) {
      console.log(`🟢 Đã kích hoạt GitHub Actions workflow cho Task #${taskId} thành công!`);
      console.log(`🔗 Theo dõi tại: https://github.com/lyquangthai1993/logistics-website/actions`);
    } else {
      const errText = await dispatchRes.text();
      console.warn(`⚠️ Không thể dispatch tự động qua GitHub API (${dispatchRes.status}):`, errText);
    }
  } else {
    console.log(`ℹ️ Không có GH_PAT_TOKEN, task đã ở trạng thái PENDING trong database, worker sẽ tự nhận.`);
  }

  await client.end();
} catch (err) {
  console.error('❌ Lỗi khi thực hiện retry:', err.message);
  process.exit(1);
}
