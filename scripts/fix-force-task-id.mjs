import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.resolve('tools/telegram-task-runner/package.json'));
const pg = require('pg');

process.loadEnvFile(path.resolve('tools/telegram-task-runner/.env'));
const isSsl = process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('sslmode=require');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: isSsl ? { rejectUnauthorized: false } : false });
await client.connect();

// 1. Cập nhật add_telegram_task để tự động trích xuất task_id khi có lệnh /force
const sqlFunction = `
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

  -- Tính toán task_id: Nếu là /force kèm tên folder hoặc task id, trích xuất ID thực tế thay vì để NULL
  IF p_raw_prompt ILIKE '%/force%' THEN
    SELECT (substring(p_raw_prompt from '(?i)task[_\-#\s]*([0-9]+)'))::integer INTO v_task_id;
    IF v_task_id IS NULL THEN
      SELECT (substring(p_raw_prompt from '(?i)/force(?:@\\w+)?\\s+([0-9]+)'))::integer INTO v_task_id;
    END IF;
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
`;

await client.query(sqlFunction);
console.log('✅ Đã cập nhật function add_telegram_task với logic trích xuất task_id cho /force!');

// 2. Chuẩn hóa task_id cho row 92 và 93
await client.query("UPDATE telegram_tasks SET task_id = 85 WHERE id = 92 AND task_id IS NULL");
await client.query("UPDATE telegram_tasks SET task_id = 86 WHERE id = 93 AND task_id IS NULL");
console.log('✅ Đã gán task_id = 85 cho id 92 và task_id = 86 cho id 93 trong database!');

const check = await client.query("SELECT id, task_id, status, raw_prompt FROM telegram_tasks WHERE id IN (92, 93)");
console.table(check.rows);

await client.end();
