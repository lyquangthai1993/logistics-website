import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (fs.existsSync(path.join(__dirname, '.env'))) {
  process.loadEnvFile(path.join(__dirname, '.env'));
}

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-automation-production-d298.up.railway.app';
const WORKFLOW_ID = 'npbnCeqRGuBWPNjI';
const GH_PAT_TOKEN = process.env.GH_PAT_TOKEN || '';

async function main() {
  console.log('1. Logging into n8n Cloud...');
  const email = process.env.N8N_EMAIL || 'lyquangthai1993@gmail.com';
  const password = process.env.N8N_PASSWORD || 'Admin@123456!';
  if (!email || !password) {
    throw new Error('Missing N8N_EMAIL or N8N_PASSWORD in environment');
  }

  const loginRes = await fetch(`${BASE_URL}/rest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrLdapLoginId: email,
      password: password
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
  }
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login successful.');

  console.log('\n2. Fetching current schedule workflow...');
  const wfRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    headers: { 'Cookie': cookie }
  });
  const wfData = await wfRes.json();
  const currentWf = wfData.data;

  // 1. Update text of 'Notify Telegram Success' to show Cloud runner
  const notifySuccessNode = currentWf.nodes.find(n => n.name === 'Notify Telegram Success');
  if (notifySuccessNode) {
    notifySuccessNode.parameters.text = '={{ `⏰ <b>[Trigger ${$(\'Format Todo-Agent Task\').item.json.time_label} - Kích hoạt Todo Agent]</b>\\n\\n📋 <b>Tổng hợp Feedback ngày hôm nay:</b>\\n• <b>Số lượng:</b> ${$(\'Format Todo-Agent Task\').item.json.task_count} feedback (${$(\'Format Todo-Agent Task\').item.json.task_ids})\\n• <b>Thư mục mục tiêu:</b> Toàn bộ thư mục <code>feedback_DD_MM*</code> hôm nay\\n\\n🚀 <b>Hành động:</b> Đã tạo <b>Task #${$json.id}</b> (<code>/todo-agent</code>) vào hàng đợi!\\n💻 <b>Tiến trình AGY Cloud:</b> Đang kích hoạt <b>GitHub Actions Cloud Runner</b> để thực thi:\\n  1️⃣ Quét toàn bộ checklist <code>TODO.md</code> hôm nay.\\n  2️⃣ Thực thi sửa đổi mã nguồn trong <code>backend/</code> và <code>frontend/</code>.\\n  3️⃣ Kiểm tra biên dịch (<code>npm run build</code>, <code>tsc --noEmit</code>) & cập nhật <code>- [x]</code>.\\n  4️⃣ Tự động commit/push lên nhánh <code>dev</code> và báo cáo Git Diff về Telegram.` }}';
  }

  // 2. Add Trigger GitHub Actions node if not present
  let triggerNode = currentWf.nodes.find(n => n.name === 'Trigger GitHub Actions');
  if (!triggerNode) {
    triggerNode = {
      parameters: {
        method: 'POST',
        url: 'https://api.github.com/repos/lyquangthai1993/logistics-website/dispatches',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'Accept',
              value: 'application/vnd.github+json'
            },
            {
              name: 'Authorization',
              value: `Bearer ${GH_PAT_TOKEN}`
            },
            {
              name: 'User-Agent',
              value: 'n8n-telegram-task-runner'
            }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({\n  event_type: "telegram-task",\n  client_payload: {\n    task_id: String($("Enqueue Todo Task to DB").first().json.id || "schedule"),\n    prompt: "Hãy kích hoạt skill todo-agent để quét toàn bộ checklist TODO.md hôm nay trong các thư mục feedback_DD_MM*, kiểm tra mã nguồn backend/ và frontend/, sửa code theo checklist, chạy build/typecheck và cập nhật [-] sang [x]",\n    sender_name: "Schedule (" + $("Format Todo-Agent Task").first().json.time_label + ")",\n    mode: "todo"\n  }\n}) }}',
        options: {}
      },
      id: 'trigger-github-actions-schedule-node',
      name: 'Trigger GitHub Actions',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1580, 272]
    };
    currentWf.nodes.push(triggerNode);
  }

  // 3. Connect 'Notify Telegram Success' -> 'Trigger GitHub Actions'
  currentWf.connections['Notify Telegram Success'] = {
    main: [
      [
        {
          node: 'Trigger GitHub Actions',
          type: 'main',
          index: 0
        }
      ]
    ]
  };

  console.log('\n3. Updating schedule workflow on n8n via PATCH...');
  const updateRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      nodes: currentWf.nodes,
      connections: currentWf.connections
    })
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Update failed: ${updateRes.status} ${errText}`);
  }
  const updateData = await updateRes.json();
  const newVersionId = updateData.data?.versionId;
  console.log('Update success! New versionId:', newVersionId);

  console.log('\n4. Reactivating schedule workflow...');
  const actRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ versionId: newVersionId })
  });
  const actData = await actRes.json();
  console.log('Active state:', actData.data?.active);

  console.log('\n🚀 Hoàn tất nâng cấp workflow Daily Todo-Agent Orchestrator trên n8n Cloud!');
}

main().catch(console.error);
