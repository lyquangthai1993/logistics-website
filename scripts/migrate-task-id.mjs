import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const pgPath = path.resolve(__dirname, '../tools/telegram-task-runner/node_modules/pg/lib/index.js');
  pg = (await import('file:///' + pgPath.replace(/\\/g, '/'))).default;
}

const { Client } = pg;
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const envPaths = [
    path.resolve(__dirname, '../tools/telegram-task-runner/.env'),
    path.resolve(__dirname, '../backend/.env')
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

async function run() {
  await client.connect();
  console.log('1. Đã kết nối Neon PostgreSQL.');

  // 1. Thêm cột task_id nếu chưa có
  console.log('2. Đang thêm cột task_id vào telegram_tasks...');
  await client.query(`
    ALTER TABLE telegram_tasks ADD COLUMN IF NOT EXISTS task_id INTEGER;
    CREATE INDEX IF NOT EXISTS idx_telegram_tasks_task_id ON telegram_tasks(task_id);
  `);
  console.log('   ✅ Đã đảm bảo cột task_id và index tồn tại.');

  // 2. Cập nhật dữ liệu hiện có (Backfill)
  // Các dòng chứa /force -> task_id = NULL
  // Các dòng không chứa /force -> task_id = id (bảo toàn đúng mã task của các thư mục feedback_14_10_task_<id> đã tạo)
  console.log('3. Backfill task_id cho các dòng dữ liệu hiện tại...');
  const forceRes = await client.query(`
    UPDATE telegram_tasks 
    SET task_id = NULL 
    WHERE raw_prompt ILIKE '%/force%';
  `);
  console.log(`   - Đã gán task_id = NULL cho ${forceRes.rowCount} dòng lệnh /force.`);

  const taskRes = await client.query(`
    UPDATE telegram_tasks 
    SET task_id = id 
    WHERE raw_prompt NOT ILIKE '%/force%' 
      AND (task_id IS NULL OR task_id <> id);
  `);
  console.log(`   - Đã gán task_id = id cho ${taskRes.rowCount} dòng task nghiệp vụ thực tế.`);

  // 3. Tạo BEFORE INSERT trigger để tự động tính task_id kể cả khi insert trực tiếp
  console.log('4. Tạo trigger trg_set_telegram_task_id...');
  await client.query(`
    CREATE OR REPLACE FUNCTION set_telegram_task_id()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Nếu raw_prompt chứa /force -> không tính là task -> task_id = NULL
      IF NEW.raw_prompt ILIKE '%/force%' THEN
        NEW.task_id := NULL;
      ELSE
        -- Nếu là task thực tế và chưa được gán task_id
        IF NEW.task_id IS NULL THEN
          SELECT COALESCE(MAX(task_id), 0) + 1 INTO NEW.task_id FROM telegram_tasks;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_set_telegram_task_id ON telegram_tasks;
    CREATE TRIGGER trg_set_telegram_task_id
    BEFORE INSERT ON telegram_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_telegram_task_id();
  `);
  console.log('   ✅ Trigger trg_set_telegram_task_id đã sẵn sàng.');

  // 4. Cập nhật hàm add_telegram_task để trả về cả id và task_id
  console.log('5. Cập nhật hàm add_telegram_task...');
  await client.query(`
    DROP FUNCTION IF EXISTS public.add_telegram_task(text, text, text, text, text, text, text);
    
    CREATE OR REPLACE FUNCTION public.add_telegram_task(
      p_chat_id text, 
      p_message_id text, 
      p_sender_name text, 
      p_raw_prompt text, 
      p_analysis text, 
      p_media_group_id text DEFAULT NULL::text, 
      p_image_file_id text DEFAULT NULL::text
    )
    RETURNS TABLE(id integer, task_id integer)
    LANGUAGE plpgsql
    AS $function$
    DECLARE
      v_row_id INTEGER;
      v_task_id INTEGER;
      v_existing_id INTEGER;
      v_existing_task_id INTEGER;
    BEGIN
      -- Xử lý album ảnh (media_group_id)
      IF p_media_group_id IS NOT NULL AND p_media_group_id <> '' THEN
        SELECT t.id, t.task_id INTO v_existing_id, v_existing_task_id
        FROM telegram_tasks t
        WHERE t.media_group_id = p_media_group_id
          AND t.status = 'PENDING'
          AND t.created_at >= NOW() - INTERVAL '30 seconds'
        ORDER BY t.id DESC
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
          UPDATE telegram_tasks
          SET 
            raw_prompt = CASE 
              WHEN p_raw_prompt IS NOT NULL AND p_raw_prompt <> '' AND (raw_prompt IS NULL OR raw_prompt = '') 
              THEN p_raw_prompt 
              WHEN p_raw_prompt IS NOT NULL AND p_raw_prompt <> '' AND raw_prompt <> p_raw_prompt 
              THEN raw_prompt || E'\\n' || p_raw_prompt 
              ELSE raw_prompt 
            END,
            analysis = CASE 
              WHEN p_analysis IS NOT NULL AND p_analysis <> '' 
              THEN p_analysis 
              ELSE analysis 
            END,
            image_file_ids = CASE
              WHEN p_image_file_id IS NOT NULL AND p_image_file_id <> '' AND NOT (image_file_ids @> to_jsonb(p_image_file_id))
              THEN image_file_ids || to_jsonb(p_image_file_id)
              ELSE image_file_ids
            END
          WHERE telegram_tasks.id = v_existing_id;
          
          RETURN QUERY SELECT v_existing_id, v_existing_task_id;
          RETURN;
        END IF;
      END IF;

      -- Tính toán task_id nếu không phải /force
      IF p_raw_prompt ILIKE '%/force%' THEN
        v_task_id := NULL;
      ELSE
        SELECT COALESCE(MAX(telegram_tasks.task_id), 0) + 1 INTO v_task_id FROM telegram_tasks;
      END IF;

      INSERT INTO telegram_tasks (
        chat_id, 
        message_id, 
        sender_name, 
        raw_prompt, 
        analysis, 
        media_group_id,
        image_file_ids,
        status, 
        created_at,
        task_id
      )
      VALUES (
        p_chat_id, 
        p_message_id, 
        p_sender_name, 
        p_raw_prompt, 
        p_analysis, 
        p_media_group_id,
        CASE 
          WHEN p_image_file_id IS NOT NULL AND p_image_file_id <> '' 
          THEN jsonb_build_array(p_image_file_id)
          ELSE '[]'::jsonb 
        END,
        'PENDING', 
        NOW(),
        v_task_id
      )
      RETURNING telegram_tasks.id, telegram_tasks.task_id INTO v_row_id, v_task_id;

      RETURN QUERY SELECT v_row_id, v_task_id;
    END;
    $function$;
  `);
  console.log('   ✅ Hàm add_telegram_task đã cập nhật thành công.');

  // 5. Kiểm tra kết quả
  console.log('\n6. Kiểm tra dữ liệu 10 dòng gần nhất:');
  const sample = await client.query(`
    SELECT id, task_id, raw_prompt, status, created_at 
    FROM telegram_tasks 
    ORDER BY id DESC 
    LIMIT 10;
  `);
  for (const r of sample.rows) {
    const isForce = (r.raw_prompt || '').toLowerCase().includes('/force');
    console.log(`   [id: ${r.id}] -> task_id: ${r.task_id === null ? 'NULL (bỏ qua)' : '#' + r.task_id} | ${isForce ? '⚡ Lệnh /force' : '📋 Task'} | "${(r.raw_prompt || '').slice(0, 45)}..."`);
  }

  await client.end();
  console.log('\n🎉 Di chuyển dữ liệu & nâng cấp schema telegram_tasks HOÀN TẤT!');
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
