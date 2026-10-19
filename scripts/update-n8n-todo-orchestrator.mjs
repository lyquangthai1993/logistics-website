import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.loadEnvFile(
  path.resolve(__dirname, "../tools/telegram-task-runner/.env"),
);

const BASE_URL =
  process.env.N8N_BASE_URL ||
  "https://n8n-automation-production-d298.up.railway.app";
const WORKFLOW_ID = "npbnCeqRGuBWPNjI";
const email = process.env.N8N_EMAIL;
const password = process.env.N8N_PASSWORD;

async function main() {
  console.log("1. Đăng nhập vào n8n Cloud...");
  const loginRes = await fetch(`${BASE_URL}/rest/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrLdapLoginId: email, password }),
  });
  const cookie = loginRes.headers.get("set-cookie");

  console.log("2. Lấy workflow chi tiết hiện tại...");
  const getRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    headers: { Cookie: cookie },
  });
  const currentWf = (await getRes.json()).data;

  console.log('3. Cập nhật các node dùng "id" sang "task_id"...');
  const nodes = currentWf.nodes.map((node) => {
    // 1. Node Query Pending Feedback
    if (node.name === "Query Pending Feedback") {
      return {
        ...node,
        alwaysOutputData: true,
        parameters: {
          ...node.parameters,
          query: `SELECT DISTINCT ON (t.task_id)
  t.id, 
  t.task_id,
  COALESCE(
    NULLIF(t.feedback_dir, ''),
    'feedbacks/feedback_' || to_char(t.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD_MM') || '_task_' || t.task_id
  ) AS feedback_dir, 
  t.raw_prompt, 
  t.sender_name, 
  t.status,
  t.created_at
FROM telegram_tasks t
WHERE t.task_id IS NOT NULL
  AND t.status = 'TODO_CREATED'
  AND t.raw_prompt NOT ILIKE '%/force%'
  AND t.raw_prompt NOT ILIKE '%/todo%'
  AND t.raw_prompt NOT ILIKE '%todo-agent%'
  AND NOT EXISTS (
    SELECT 1 FROM telegram_tasks t2
    WHERE t2.task_id = t.task_id
      AND t2.id <> t.id
      AND t2.status IN ('COMPLETED', 'IN_PROGRESS', 'VERIFYING_LOCAL', 'VERIFYING_DEV')
  )
ORDER BY t.task_id ASC, t.id DESC;`,
        },
      };
    }

    // 2. Node Format Todo-Agent Task
    if (node.name === "Format Todo-Agent Task") {
      const updatedJsCode = `const items = $input.all();
const validItems = items.filter(i => i.json && (i.json.task_id != null || i.json.id));

const now = new Date();
const vnHour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', hour12: false }).format(now));

let timeLabel = "12:00 PM";
if (vnHour >= 14 && vnHour <= 16) {
  timeLabel = "3:00 PM";
} else if (vnHour >= 17 && vnHour <= 21) {
  timeLabel = "7:00 PM";
} else if (vnHour >= 11 && vnHour <= 13) {
  timeLabel = "12:00 PM";
} else {
  timeLabel = "On Demand";
}

if (!validItems || validItems.length === 0) {
  return [{
    json: {
      has_task: false,
      chat_id: "-5509877448",
      time_label: timeLabel,
      message: "⏰ <b>[Trigger " + timeLabel + "]</b> Không có feedback tổng hợp nào đang chờ thực thi hôm nay."
    }
  }];
}

const taskIds = validItems.map(i => '#' + (i.json.task_id || i.json.id)).join(', ');
const taskCount = validItems.length;
const firstDir = validItems[0].json.feedback_dir || 'D:\\\\Projects\\\\logistics-website';

const todoPrompt = "/todo-agent quét và thực thi toàn bộ feedback ngày hôm nay (" + timeLabel + ")";
const analysis = "Kích hoạt skill /todo-agent kết hợp AGY CLI quét toàn bộ " + taskCount + " thư mục task phát sinh trong ngày hôm nay (" + taskIds + ") lúc " + timeLabel + ", kiểm tra file TODO.md, sửa code submodules backend/ và frontend/ theo chuẩn UI Compact Density, chạy build/typecheck và đánh dấu [x] hoàn thành.";

function sqlEscape(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

const senderName = "Schedule Trigger (" + timeLabel + ")";
const sql = "INSERT INTO telegram_tasks (chat_id, sender_name, raw_prompt, analysis, feedback_dir, status, created_at) VALUES ('-5509877448', '" + sqlEscape(senderName) + "', '" + sqlEscape(todoPrompt) + "', '" + sqlEscape(analysis) + "', '" + sqlEscape(firstDir) + "', 'PENDING', NOW()) RETURNING id, task_id;";

return [{
  json: {
    has_task: true,
    chat_id: "-5509877448",
    time_label: timeLabel,
    task_count: taskCount,
    task_ids: taskIds,
    feedback_dir: firstDir,
    sql: sql
  }
}];`;
      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsCode: updatedJsCode,
        },
      };
    }

    // 3. Node Notify Telegram Success
    if (node.name === "Notify Telegram Success") {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          text: `={{ \`⏰ <b>[Trigger \${$('Format Todo-Agent Task').item.json.time_label} - Kích hoạt Todo Agent]</b>\\n\\n📋 <b>Tổng hợp Feedback ngày hôm nay:</b>\\n• <b>Số lượng:</b> \${$('Format Todo-Agent Task').item.json.task_count} feedback (\${$('Format Todo-Agent Task').item.json.task_ids})\\n• <b>Thư mục mục tiêu:</b> Toàn bộ thư mục <code>feedback_DD_MM*</code> hôm nay\\n\\n🚀 <b>Hành động:</b> Đã kích hoạt tiến trình <b>todo-agent</b> vào hàng đợi!\\n💻 <b>Tiến trình AGY Cloud:</b> Đang kích hoạt <b>GitHub Actions Cloud Runner</b> để thực thi:\\n  1️⃣ Quét toàn bộ checklist <code>TODO.md</code> hôm nay.\\n  2️⃣ Thực thi sửa đổi mã nguồn trong <code>backend/</code> và <code>frontend/</code>.\\n  3️⃣ Kiểm tra biên dịch (<code>npm run build</code>, <code>tsc --noEmit</code>) & cập nhật <code>- [x]</code>.\\n  4️⃣ Tự động commit/push lên nhánh <code>dev</code> và báo cáo Git Diff về Telegram.\` }}`,
        },
      };
    }

    // 4. Node Trigger GitHub Actions
    if (node.name === "Trigger GitHub Actions") {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsonBody: `={{ JSON.stringify({
  event_type: "telegram-task",
  client_payload: {
    task_id: $("Enqueue Todo Task to DB").item.json.task_id != null ? $("Enqueue Todo Task to DB").item.json.task_id.toString() : ($("Enqueue Todo Task to DB").item.json.id?.toString() || "schedule"),
    db_id: $("Enqueue Todo Task to DB").item.json.id?.toString() || "",
    prompt: "Hãy kích hoạt skill todo-agent để quét toàn bộ checklist TODO.md hôm nay trong các thư mục feedback_DD_MM*, kiểm tra mã nguồn backend/ và frontend/, sửa code theo checklist, chạy build/typecheck và cập nhật [-] sang [x]",
    sender_name: "Schedule (" + $("Format Todo-Agent Task").item.json.time_label + ")",
    mode: "todo"
  }
}) }}`,
        },
      };
    }

    return node;
  });

  console.log("4. Gửi PATCH cập nhật workflow...");
  const updateRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      nodes: nodes,
      connections: currentWf.connections,
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Update failed: ${updateRes.status} ${errText}`);
  }
  const updateData = await updateRes.json();
  const versionId = updateData.data?.versionId;
  console.log(`✅ Cập nhật thành công! VersionId mới: ${versionId}`);

  console.log("5. Tái kích hoạt workflow...");
  const actRes = await fetch(
    `${BASE_URL}/rest/workflows/${WORKFLOW_ID}/activate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ versionId }),
    },
  );
  const actData = await actRes.json();
  console.log("Active state:", actData.data?.active);

  console.log(
    '\n🎉 Đã nâng cấp 100% các node trong workflow "Daily Todo-Agent Orchestrator" sang task_id chuẩn!',
  );
}

main().catch(console.error);
