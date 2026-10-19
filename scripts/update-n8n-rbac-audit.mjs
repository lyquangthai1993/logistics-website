import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../tools/telegram-task-runner/.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-automation-production-d298.up.railway.app';
const WORKFLOW_ID = 'M1IVf9rAsyFD5TYq';
const email = process.env.N8N_EMAIL;
const password = process.env.N8N_PASSWORD;
const GH_PAT_TOKEN = process.env.GH_PAT_TOKEN;

if (!email || !password) {
  throw new Error('Thiếu biến môi trường N8N_EMAIL hoặc N8N_PASSWORD. Vui lòng cấu hình trong tools/telegram-task-runner/.env');
}
if (!GH_PAT_TOKEN) {
  throw new Error('Thiếu biến môi trường GH_PAT_TOKEN. Vui lòng cấu hình trong tools/telegram-task-runner/.env');
}

async function main() {
  console.log('1. Đăng nhập vào n8n Cloud...');
  const loginRes = await fetch(`${BASE_URL}/rest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrLdapLoginId: email, password }),
    signal: AbortSignal.timeout(10000)
  });

  if (!loginRes.ok) {
    throw new Error(`Đăng nhập thất bại: ${loginRes.status} ${loginRes.statusText}`);
  }
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Đăng nhập thành công!');

  console.log('2. Lấy workflow chi tiết hiện tại...');
  const getRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    headers: { 'Cookie': cookie },
    signal: AbortSignal.timeout(10000)
  });
  if (!getRes.ok) {
    throw new Error(`Lấy workflow thất bại: ${getRes.status} ${getRes.statusText}`);
  }
  const currentWf = (await getRes.json()).data;

  console.log('3. Cập nhật cấu hình các node bị lỗi...');
  const updatedNodes = currentWf.nodes.map(node => {
    // 0. Node Code: Cập nhật text thông báo không hardcode số lượng 59 API
    if (node.name === 'Chuẩn Bị Payload & Lịch Trình') {
      console.log('  -> Fix node: Chuẩn Bị Payload & Lịch Trình (Bỏ hardcode 59 API)');
      const newJsCode = `const now = new Date();
const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

const initText = \`<b>🛡️ N8N CRON: KHỞI CHẠY AUDIT RBAC & BẢO MẬT (22:00)</b>\\n\` +
  \`━━━━━━━━━━━━━━━━━━━━\\n\` +
  \`⏰ <b>Thời gian kích hoạt:</b> \${timeStr} - \${dateStr}\\n\` +
  \`⚡ <b>Mục tiêu:</b> Rà soát 7 ngày biến động trong <code>SYSTEM_TIMELINE.md</code> & Đối soát toàn bộ API endpoints với RBAC Matrix.\\n\` +
  \`🚀 <b>Điều phối:</b> Kích hoạt tự động GitHub Actions CI/CD và Script Auditor.\`;

return [{\n  json: {\n    chat_id: '-5509877448',\n    text: initText,\n    parse_mode: 'HTML',\n    timestamp: now.toISOString(),\n    cron: '0 22 * * *'\n  }\n}];`;
      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsCode: newJsCode
        }
      };
    }

    // 1. Node Telegram: Sửa jsonBody dùng JSON.stringify để escape ký tự điều khiển \n
    if (node.name === 'Thông Báo Telegram Bắt Đầu') {
      console.log('  -> Fix node: Thông Báo Telegram Bắt Đầu (JSON.stringify)');
      return {
        ...node,
        parameters: {
          ...node.parameters,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify({\n  chat_id: $json.chat_id,\n  text: $json.text,\n  parse_mode: "HTML"\n}) }}'
        }
      };
    }

    // 2. Node GitHub Actions: Thêm Authorization Bearer token & JSON.stringify
    if (node.name === 'Kích Hoạt GitHub Actions Worker') {
      console.log('  -> Fix node: Kích Hoạt GitHub Actions Worker (Authorization & JSON.stringify)');
      return {
        ...node,
        parameters: {
          ...node.parameters,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Accept', value: 'application/vnd.github+json' },
              { name: 'Authorization', value: `Bearer ${GH_PAT_TOKEN}` },
              { name: 'User-Agent', value: 'n8n-Automation-TMS' }
            ]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify({\n  event_type: "rbac-audit",\n  client_payload: {\n    task_id: "n8n-daily-rbac-22pm",\n    sender_name: "n8n Scheduler",\n    mode: "rbac"\n  }\n}) }}'
        }
      };
    }

    return node;
  });

  console.log('4. Cập nhật workflow lên n8n Cloud via PATCH...');
  const patchRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      nodes: updatedNodes,
      connections: currentWf.connections
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    throw new Error(`Cập nhật workflow thất bại: ${patchRes.status} ${errText}`);
  }
  const patchData = await patchRes.json();
  const newVersionId = patchData.data?.versionId;
  console.log(`Cập nhật thành công! Version ID mới: ${newVersionId}`);

  console.log('5. Tái kích hoạt workflow...');
  const actRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ versionId: newVersionId }),
    signal: AbortSignal.timeout(10000)
  });
  const actData = await actRes.json();
  console.log(`Trạng thái Active: ${actData.data?.active}`);

  console.log('\n✅ Hoàn tất sửa lỗi workflow Daily RBAC & Security Audit trên n8n Cloud!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
