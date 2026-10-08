import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (fs.existsSync(path.join(__dirname, '.env'))) {
  process.loadEnvFile(path.join(__dirname, '.env'));
}

const BASE_URL = 'https://n8n-n0al.onrender.com';
const WORKFLOW_ID = 'IL2EeeayDVec4jHl';
const PG_CRED_ID = '98mf2JbtaLmz0J3J';
const TG_CRED_ID = 'TuI6c4213DQZTZ5X';

async function main() {
  console.log('1. Logging into n8n Cloud...');
  const email = process.env.N8N_EMAIL;
  const password = process.env.N8N_PASSWORD;
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

  console.log('\n2. Fetching current workflow...');
  const wfRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    headers: { 'Cookie': cookie }
  });
  const wfData = await wfRes.json();
  const currentWf = wfData.data;

  // Code lọc nghiêm ngặt: CHỈ /feedback HOẶC /force... MỚI ĐƯỢC XỬ LÝ LÀ TASK!
  const jsCode = `
const msg = $input.item.json.body?.message;
if (!msg) return [];

const rawText = (msg.text || msg.caption || '').trim();

let photoFileId = null;
if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
  photoFileId = msg.photo[msg.photo.length - 1].file_id;
} else if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/')) {
  photoFileId = msg.document.file_id;
}

const sender = msg.from?.first_name || msg.from?.username || 'User';
const cId = msg.chat.id.toString();
const mId = msg.message_id ? msg.message_id.toString() : '';
const mediaGroupId = msg.media_group_id ? msg.media_group_id.toString() : '';

// 1. Phân loại lệnh Trợ giúp / Bắt đầu (HELP)
const isHelp = /^\\s*(\\/help|\\/start)(@\\w+)?/i.test(rawText);
if (isHelp) {
  return [{
    json: {
      route: 'HELP',
      chat_id: cId,
      message_id: mId,
      sender_name: sender
    }
  }];
}

// 2. Kiểm tra chặt chẽ: CHỈ /feedback HOẶC /force... MỚI ĐƯỢC XỬ LÝ LÀ TASK
const isFeedback = /^\\s*\\/feedback(@\\w+)?/i.test(rawText);
const isForce = /^\\s*\\/force(@\\w+)?/i.test(rawText);

// NẾU KHÔNG PHẢI /feedback VÀ KHÔNG PHẢI /force -> BỎ QUA HOÀN TOÀN (KHÔNG GHI VÀO DB)
if (!isFeedback && !isForce) {
  return [];
}

let modeBadge = '';
let modeGoal = '';
let cleanText = '';
let promptForDB = '';

if (isForce) {
  const folderMatch = rawText.match(/feedback_\\d{1,2}_\\d{1,2}[a-zA-Z0-9_]*/i);
  modeBadge = '<code>todo-agent</code> (Thực thi code & kiểm thử)';
  modeGoal = folderMatch 
    ? 'Thực thi checklist riêng cho thư mục <code>' + folderMatch[0] + '</code>, sửa code & kiểm thử'
    : 'Quét toàn bộ checklist <code>TODO.md</code> hôm nay, sửa code & chạy build test';
  cleanText = rawText;
  promptForDB = rawText;
} else if (isFeedback) {
  cleanText = rawText.replace(/^\\/feedback(@\\w+)?\\s*/i, '').trim() || (photoFileId ? '(Ảnh chụp màn hình từ người dùng)' : rawText);
  modeBadge = '<code>/leader</code> (TMS Business Lead)';
  modeGoal = 'Khảo sát nghiệp vụ, tổng hợp <code>TODO.md</code> vào thư mục <code>feedback_DD_MM</code>';
  promptForDB = 'Hãy kích hoạt skill /leader để đóng vai trò Team Lead nghiệp vụ TMS của dự án logistics-website.\\n' +
    'Bạn vừa tiếp nhận feedback / yêu cầu mới từ người dùng' + (photoFileId ? ' kèm theo ảnh chụp màn hình' : '') + ':\\n\\\"' + cleanText + '\\\"\\n\\n' +
    'NHIỆM VỤ ĐẦU RA BẮT BUỘC:\\n' +
    '1. Đọc và phân tích kỹ phản hồi và các hình ảnh chụp màn hình đính kèm (sử dụng view_file).\\n' +
    '2. Khảo sát cấu trúc nghiệp vụ và mã nguồn trong D:\\\\Projects\\\\logistics-website.\\n' +
    '3. Tổng hợp thành 1 file TODO.md chuẩn mực đặt tại thư mục feedback (ví dụ: D:\\\\Projects\\\\logistics-website\\\\feedback_DD_MM\\\\TODO.md) theo đúng cấu trúc chuẩn như trong D:\\\\Projects\\\\logistics-website\\\\feedback_06_10\\\\TODO.md:\\n' +
    '   - Header: Tiêu đề Feedback + Thời gian ghi nhận + Người báo cáo + Màn hình liên quan + Tài liệu tham chiếu\\n' +
    '   - 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)\\n' +
    '   - 🔍 Tổng hợp các điểm chưa đúng trên giao diện cũ (đối chiếu ảnh chụp màn hình)\\n' +
    '   - 📋 Danh sách công việc triển khai (Action Checklist) chi tiết cho Backend, Frontend, Kiểm thử.\\n' +
    '4. Báo cáo lại đường dẫn file TODO.md và tóm tắt toàn bộ kế hoạch thực hiện.';
}

function sqlEscape(str) {
  if (!str) return '';
  return String(str).replace(/'/g, \"''\");
}

const sql = \"SELECT add_telegram_task('\" + 
  sqlEscape(cId) + \"', '\" + 
  sqlEscape(mId) + \"', '\" + 
  sqlEscape(sender) + \"', '\" + 
  sqlEscape(cleanText) + \"', '\" + 
  sqlEscape(promptForDB) + \"', \" + 
  (mediaGroupId ? (\"'\" + sqlEscape(mediaGroupId) + \"'\") : \"NULL\") + \", \" + 
  (photoFileId ? (\"'\" + sqlEscape(photoFileId) + \"'\") : \"NULL\") + 
\") AS id;\";

return [{
  json: {
    route: 'TASK',
    chat_id: cId,
    message_id: mId,
    sender_name: sender,
    raw_prompt: cleanText,
    has_photo: !!photoFileId,
    media_group_id: mediaGroupId,
    analysis: promptForDB,
    sql: sql,
    mode_badge: modeBadge,
    mode_goal: modeGoal
  }
}];
`.trim();

  const newNodes = [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'telegram-agent',
        responseMode: 'onReceived',
        options: {}
      },
      id: 'webhook-trigger-node',
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [200, 300]
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
            version: 2
          },
          conditions: [
            {
              leftValue: '={{ $json.body?.message?.chat?.id?.toString() }}',
              rightValue: '-5509877448',
              operator: {
                type: 'string',
                operation: 'equals'
              }
            }
          ],
          combinator: 'and'
        }
      },
      id: 'filter-chat-node',
      name: 'Filter Allowed Chat',
      type: 'n8n-nodes-base.filter',
      typeVersion: 2.2,
      position: [420, 300]
    },
    {
      parameters: {
        jsCode: jsCode
      },
      id: 'format-leader-node',
      name: 'Format Leader Prompt',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [640, 300]
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
            version: 2
          },
          conditions: [
            {
              leftValue: '={{ $json.route }}',
              rightValue: 'TASK',
              operator: {
                type: 'string',
                operation: 'equals'
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'is-task-route-node',
      name: 'Is Task Route?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [860, 300]
    },
    {
      parameters: {
        operation: 'executeQuery',
        query: '={{ $json.sql }}'
      },
      id: 'enqueue-task-node',
      name: 'Enqueue Task to Neon DB',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.5,
      position: [1100, 200],
      credentials: {
        postgres: {
          id: PG_CRED_ID,
          name: 'Neon Singapore PostgreSQL'
        }
      }
    },
    {
      parameters: {
        resource: 'message',
        operation: 'sendMessage',
        chatId: '={{ $("Format Leader Prompt").item.json.chat_id }}',
        text: '={{ `⏳ <b>[Task #${$json.id} Đã ghi nhận vào hàng đợi]</b>\\n\\n👤 <b>Người gửi:</b> ${$("Format Leader Prompt").item.json.sender_name}\\n${$("Format Leader Prompt").item.json.has_photo ? \'📸 <i>Đã nhận ảnh chụp màn hình đính kèm</i>\\n\' : \'\'}📝 <b>Nội dung:</b> <i>"${$("Format Leader Prompt").item.json.raw_prompt}"</i>\\n\\n🤖 <b>Chế độ:</b> ${$("Format Leader Prompt").item.json.mode_badge}\\n📁 <b>Mục tiêu đầu ra:</b> ${$("Format Leader Prompt").item.json.mode_goal}\\n💻 <b>Trạng thái:</b> <code>PENDING</code> ➔ Local Agent trên laptop đang mở <code>D:\\\\Projects\\\\logistics-website</code> để thực hiện...` }}',
        additionalFields: {
          parse_mode: 'HTML'
        }
      },
      id: 'notify-tg-node',
      name: 'Notify Telegram',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: [1340, 200],
      credentials: {
        telegramApi: {
          id: TG_CRED_ID,
          name: 'Telegram Bot Account'
        }
      }
    },
    {
      parameters: {
        resource: 'message',
        operation: 'sendMessage',
        chatId: '={{ $json.chat_id }}',
        text: '={{ `🤖 <b>ANTIGRAVITY AI TASK RUNNER</b>\\n<i>Hệ thống điều khiển AI Agent tự động qua Telegram.</i>\\n\\n📌 <b>CÁC LỆNH ĐƯỢC XỬ LÝ VÀ ĐẨY VÀO HÀNG ĐỢI:</b>\\n\\n1️⃣ <b>Ghi nhận Feedback / Yêu cầu mới:</b>\\n• Cú pháp: <code>/feedback &lt;nội dung yêu cầu&gt;</code>\\n  <i>(hoặc gửi ảnh chụp màn hình kèm caption bắt đầu bằng <code>/feedback</code>)</i>\\n• <b>Nhiệm vụ:</b> Kích hoạt <code>/leader</code> khảo sát mã nguồn TMS và tự động tổng hợp file <code>TODO.md</code> vào thư mục <code>feedback_DD_MM</code>.\\n\\n2️⃣ <b>Thực thi công việc ngay:</b>\\n• Cú pháp: <code>/force</code> hoặc <code>/force &lt;tên thư mục task&gt;</code>\\n• <b>Nhiệm vụ:</b> Kích hoạt <code>todo-agent</code> quét checklist <code>TODO.md</code> hôm nay, sửa code submodules và chạy build/test.\\n\\n────────────────────\\n🌐 <b>Dev Web:</b> <a href="https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app">Frontend Dev</a> | <a href="https://logistics-website-backend-1jho.onrender.com/docs">Swagger API</a>\\n🚀 <b>Pro Web:</b> <a href="https://logistics-website-frontend-kappa.vercel.app">Frontend Pro</a> | <a href="https://logistics-website-backend-1.onrender.com/docs">Swagger API</a>\\n\\n💡 <i>Lưu ý: Mọi tin nhắn trao đổi thông thường không bắt đầu bằng <code>/feedback</code> hoặc <code>/force</code> sẽ được bỏ qua và không đưa vào hàng đợi xử lý.</i>` }}',
        additionalFields: {
          parse_mode: 'HTML'
        }
      },
      id: 'send-help-node',
      name: 'Send Help Message',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: [1100, 420],
      credentials: {
        telegramApi: {
          id: TG_CRED_ID,
          name: 'Telegram Bot Account'
        }
      }
    }
  ];

  const newConnections = {
    'Webhook Trigger': {
      main: [
        [
          {
            node: 'Filter Allowed Chat',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Filter Allowed Chat': {
      main: [
        [
          {
            node: 'Format Leader Prompt',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Format Leader Prompt': {
      main: [
        [
          {
            node: 'Is Task Route?',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Is Task Route?': {
      main: [
        // Index 0: TRUE (Task -> Enqueue)
        [
          {
            node: 'Enqueue Task to Neon DB',
            type: 'main',
            index: 0
          }
        ],
        // Index 1: FALSE (Help -> Send Help Message)
        [
          {
            node: 'Send Help Message',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Enqueue Task to Neon DB': {
      main: [
        [
          {
            node: 'Notify Telegram',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  };

  console.log('\n3. Updating workflow on n8n via PATCH...');
  const updateRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      nodes: newNodes,
      connections: newConnections
    })
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Update failed: ${updateRes.status} ${errText}`);
  }
  console.log('Update success!');

  console.log('\n4. Reactivating workflow...');
  const actRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: { 'Cookie': cookie }
  });
  const actData = await actRes.json();
  console.log('Active state:', actData.data?.active);

  console.log('\n🚀 Hoàn tất nâng cấp workflow Telegram Task Orchestrator trên n8n Cloud!');
}

main().catch(console.error);
