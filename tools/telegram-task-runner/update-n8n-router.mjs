import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (fs.existsSync(path.join(__dirname, '.env'))) {
  process.loadEnvFile(path.join(__dirname, '.env'));
}

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-automation-production-d298.up.railway.app';
const WORKFLOW_ID = 'IL2EeeayDVec4jHl';
const PG_CRED_ID = '98mf2JbtaLmz0J3J';
const TG_CRED_ID = 'TuI6c4213DQZTZ5X';
const GH_PAT_TOKEN = process.env.GH_PAT_TOKEN || '';

async function main() {
  console.log('1. Logging into n8n Cloud...');
  const email = process.env.N8N_EMAIL || 'lyquangthai1993@gmail.com';
  const password = process.env.N8N_PASSWORD || 'Admin@123456!';

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

  const jsCode = `
const msg = $input.item.json.body?.message || $input.item.json.body?.callback_query?.message;
const callbackQuery = $input.item.json.body?.callback_query;
if (!msg && !callbackQuery) return [];

const rawText = (callbackQuery ? callbackQuery.data : (msg.text || msg.caption || '')).trim();

let photoFileId = null;
if (msg?.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
  photoFileId = msg.photo[msg.photo.length - 1].file_id;
} else if (msg?.document && msg?.document.mime_type && msg.document.mime_type.startsWith('image/')) {
  photoFileId = msg.document.file_id;
}

const sender = (callbackQuery ? callbackQuery.from?.first_name : msg?.from?.first_name) || 'User';
const cId = (callbackQuery ? callbackQuery.message?.chat?.id : msg?.chat?.id)?.toString() || '-5509877448';
const mId = (callbackQuery ? callbackQuery.message?.message_id : msg?.message_id)?.toString() || '';
const mediaGroupId = msg?.media_group_id ? msg.media_group_id.toString() : '';

// 1. Phân loại lệnh Báo cáo nhanh hôm nay (REPORT_TODAY)
const reportMatch = rawText.match(/^\\s*(?:\\/report[-_]?today|\\/today|\\/report)(?:[@\\w]+)?(?:\\s+([0-9\\/\\-_\\.]+)|_([0-9\\/\\-_\\.]+))?/i);
if (reportMatch) {
  const rawDate = (reportMatch[1] || reportMatch[2] || '').trim();
  let targetSqlDate = '(CURRENT_TIMESTAMP AT TIME ZONE \\'Asia/Ho_Chi_Minh\\')::date';
  let targetDisplayDate = 'hôm nay';
  let isCustomDate = false;

  if (rawDate && rawDate.toLowerCase() !== 'today') {
    const cleaned = rawDate.replace(/[\\/\\-\\.]/g, '_');
    const parts = cleaned.split('_').filter(Boolean);
    const currentYear = 2026;

    let d, m, y;
    if (parts.length === 2) {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = currentYear;
    } else if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else {
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        let rawY = parseInt(parts[2], 10);
        y = rawY < 100 ? 2000 + rawY : rawY;
      }
    }

    if (d && m && y && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const pad = (n) => String(n).padStart(2, '0');
      targetSqlDate = "'" + y + "-" + pad(m) + "-" + pad(d) + "'::date";
      targetDisplayDate = pad(d) + "/" + pad(m) + "/" + y;
      isCustomDate = true;
    }
  }

  return [{
    json: {
      route: 'REPORT_TODAY',
      chat_id: cId,
      message_id: mId,
      sender_name: sender,
      is_custom_date: isCustomDate,
      target_display_date: targetDisplayDate,
      raw_date: rawDate,
      sql: "SELECT id, task_id, sender_name, substring(raw_prompt from 1 for 70) as task_name, status, " +
           "to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as created_time, " +
           "to_char(completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') as completed_time, " +
           "substring(error from 1 for 100) as error_msg " +
           "FROM telegram_tasks " +
           "WHERE task_id IS NOT NULL AND ((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = " + targetSqlDate + " " +
           "   OR (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = " + targetSqlDate + ") " +
           "ORDER BY task_id ASC;"
    }
  }];
}

// 2. Phân loại lệnh Trợ giúp / Bắt đầu (HELP)
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

// 3. Kiểm tra: CHỈ /feedback HOẶC /force... MỚI ĐƯỢC XỬ LÝ LÀ TASK
const isFeedback = /^\\s*\\/feedback(@\\w+)?/i.test(rawText);
const isForce = /^\\s*\\/force(@\\w+)?/i.test(rawText);

if (!isFeedback && !isForce) {
  return [];
}

let modeBadge = '';
let modeGoal = '';
let cleanText = '';
let promptForDB = '';

if (isForce) {
  const folderMatch = rawText.match(/(?:feedbacks[\\/])?feedback_\\d{1,2}_\\d{1,2}[a-zA-Z0-9_]*/i);
  modeBadge = '<code>todo-agent</code> (Thực thi code & kiểm thử)';
  modeGoal = folderMatch 
    ? 'Thực thi checklist riêng cho thư mục <code>' + folderMatch[0] + '</code>, sửa code & kiểm thử'
    : 'Quét toàn bộ checklist <code>TODO.md</code> hôm nay, sửa code & chạy build test';
  cleanText = rawText;
  const targetFolder = folderMatch ? folderMatch[0] : '';
  promptForDB = 'Hãy kích hoạt skill todo-agent để thực thi công việc phát triển và kiểm thử hệ thống Spider Express Logistics TMS.\\n' +
    (targetFolder ? ('MỤC TIÊU ƯU TIÊN: Tập trung giải quyết checklist trong thư mục: ' + targetFolder + '\\n\\n') : 'MỤC TIÊU: Quét và giải quyết các checklist TODO.md hôm nay.\\n\\n') +
    'QUY TRÌNH THỰC THI BẮT BUỘC:\\n' +
    '1. Sử dụng list_dir và view_file để đọc kỹ file TODO.md trong thư mục feedback mục tiêu.\\n' +
    '2. Khảo sát chính xác các file mã nguồn liên quan trong backend/ (NestJS) và frontend/ (Next.js App Router).\\n' +
    '3. Thực hiện sửa đổi mã nguồn theo đúng các mục việc chưa hoàn thành (- [ ]).\\n' +
    '4. Kiểm tra biên dịch (build / typecheck / lint) để đảm bảo không phát sinh lỗi.\\n' +
    '5. Cập nhật lại checklist trong TODO.md từ (- [ ]) sang (- [x]), ghi lại bằng chứng kỹ thuật và tóm tắt những file đã thay đổi.';
} else if (isFeedback) {
  const strippedText = rawText.replace(/^\\/feedback(@\\w+)?\\s*/i, '').trim();
  const isEmptyCommand = !strippedText && !photoFileId;
  cleanText = strippedText || (photoFileId ? '(Ảnh chụp màn hình từ người dùng)' : 'Khảo sát & kiểm tra sức khỏe nghiệp vụ toàn diện hệ thống TMS');
  modeBadge = '<code>/leader</code> (TMS Business Lead)';
  modeGoal = isEmptyCommand
    ? 'Khảo sát sức khỏe nghiệp vụ toàn diện & rà soát các màn hình TMS (Lệnh rỗng)'
    : 'Khảo sát nghiệp vụ, tổng hợp <code>TODO.md</code> vào thư mục <code>feedbacks/feedback_DD_MM_task_&lt;id&gt;</code>';
  promptForDB = 'Hãy kích hoạt skill /leader để đóng vai trò Team Lead nghiệp vụ TMS của dự án logistics-website.\\n' +
    'Bạn vừa tiếp nhận feedback / yêu cầu mới từ người dùng' + (photoFileId ? ' kèm theo ảnh chụp màn hình' : '') + ':\\n\\\"' + cleanText + '\\\"\\n\\n' +
    (isEmptyCommand ? 'LƯU Ý ĐẶC BIỆT (LỆNH RỖNG): Người dùng gửi lệnh /feedback mà chưa đính kèm mô tả chi tiết hoặc ảnh màn hình. Hãy:\\n1. Khảo sát toàn diện sức khỏe hệ thống TMS sau chuỗi hotfix gần nhất (Nhập kho, Xuất kho, Tem nhãn A4, Phiếu in).\\n2. Gửi phản hồi kèm thông điệp hướng dẫn tương tác rõ ràng:\\n   \\\"💡 Bạn vừa gửi lệnh /feedback. Vui lòng gửi kèm mô tả chi tiết hoặc gửi ảnh màn hình lỗi với caption /feedback <nội dung> để AI phân tích chính xác từng màn hình cụ thể.\\\"\\n\\n' : '') +
    'NHIỆM VỤ ĐẦU RA BẮT BUỘC:\\n' +
    '1. Đọc và phân tích kỹ phản hồi và các hình ảnh chụp màn hình đính kèm (sử dụng view_file).\\n' +
    '2. Khảo sát cấu trúc nghiệp vụ và mã nguồn trong dự án (backend/ NestJS và frontend/ Next.js App Router).\\n' +
    '3. BẮT BUỘC sử dụng công cụ write_to_file để tạo ngay file TODO.md chuẩn mực đặt tại thư mục feedback tương ứng: feedbacks/feedback_DD_MM_task_<id>/TODO.md (với DD_MM là ngày hôm nay và <id> là ID của task) theo đúng cấu trúc chuẩn như trong feedbacks/feedback_06_10/TODO.md:\\n' +
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

const sql = "SELECT * FROM add_telegram_task('" + 
  sqlEscape(cId) + "', '" + 
  sqlEscape(mId) + "', '" + 
  sqlEscape(sender) + "', '" + 
  sqlEscape(cleanText) + "', '" + 
  sqlEscape(promptForDB) + "', " + 
  (mediaGroupId ? ("'" + sqlEscape(mediaGroupId) + "'") : "NULL") + ", " + 
  (photoFileId ? ("'" + sqlEscape(photoFileId) + "'") : "NULL") + 
");";

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

  const formatReportCode = `
const rows = $input.all().map(item => item.json).filter(r => r.id && r.task_id != null);
const promptNode = $('Format Leader Prompt').first().json;
const chatId = promptNode?.chat_id || '-5509877448';

const doneTasks = rows.filter(r => r.status === 'COMPLETED');
const failTasks = rows.filter(r => ['FAILED', 'DEV_E2E_FAILED', 'DEV_DEPLOY_TIMEOUT'].includes(r.status));
const runningTasks = rows.filter(r => ['IN_PROGRESS', 'PENDING', 'VERIFYING_LOCAL', 'VERIFYING_DEV'].includes(r.status));
const cancelTasks = rows.filter(r => r.status === 'CANCELLED');

const now = new Date();
const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

const isCustom = promptNode?.is_custom_date;
const targetDisplay = promptNode?.target_display_date;

let text = '';
if (isCustom) {
  text += '📊 <b>BÁO CÁO TIẾN ĐỘ TASK NGÀY ' + targetDisplay + ' (Xuất lúc ' + timeStr + ')</b>\\n';
} else {
  text += '📊 <b>BÁO CÁO TIẾN ĐỘ TASK HÔM NAY (' + dateStr + ' ' + timeStr + ')</b>\\n';
}
text += '━━━━━━━━━━━━━━━━━━━━\\n';
text += '🎯 <b>Tổng số task:</b> <b>' + rows.length + '</b>\\n';
text += '✅ <b>Hoàn thành (DONE):</b> <b>' + doneTasks.length + '</b>\\n';
text += '❌ <b>Thất bại (FAIL):</b> <b>' + failTasks.length + '</b>\\n';
if (runningTasks.length > 0) {
  text += '⏳ <b>Đang thực thi:</b> <b>' + runningTasks.length + '</b>\\n';
}
if (cancelTasks.length > 0) {
  text += '🚫 <b>Đã hủy / Gộp:</b> <b>' + cancelTasks.length + '</b>\\n';
}
text += '━━━━━━━━━━━━━━━━━━━━\\n\\n';

if (rows.length === 0) {
  if (isCustom) {
    text += '<i>Không có task nào được ghi nhận trên hệ thống trong ngày ' + targetDisplay + '.</i>\\n';
  } else {
    text += '<i>Hôm nay chưa có task nào được ghi nhận trên hệ thống.</i>\\n';
  }
} else {
  text += '<b>📋 DANH SÁCH CHI TIẾT CÁC TASK:</b>\\n';
  for (const t of rows) {
    let icon = '⚪';
    let statusLabel = t.status;
    if (t.status === 'COMPLETED') {
      icon = '✅';
      statusLabel = 'DONE';
    } else if (['FAILED', 'DEV_E2E_FAILED', 'DEV_DEPLOY_TIMEOUT'].includes(t.status)) {
      icon = '❌';
      statusLabel = 'FAIL';
    } else if (['IN_PROGRESS', 'PENDING', 'VERIFYING_LOCAL', 'VERIFYING_DEV'].includes(t.status)) {
      icon = '⏳';
      statusLabel = 'RUNNING';
    } else if (t.status === 'CANCELLED') {
      icon = '🚫';
      statusLabel = 'CANCEL';
    }

    const time = t.completed_time || t.created_time || '';
    const safeTitle = (t.task_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text += icon + ' <b>#' + (t.task_id || t.id) + ' [' + statusLabel + ']</b> <code>(' + time + ')</code>: ' + safeTitle + '\\n';
    if (t.error_msg && icon === '❌') {
      const safeErr = t.error_msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 100);
      text += '   ⚠️ <i>Lỗi: ' + safeErr + '</i>\\n';
    }
  }
}

text += '\\n━━━━━━━━━━━━━━━━━━━━\\n';
text += '🌐 <a href="https://frontend-tms-core-dev.up.railway.app">Frontend Dev</a> | 🚀 <a href="https://frontend-tms-core-production.up.railway.app">Frontend Pro</a>';

return [{
  json: {
    chat_id: chatId,
    report_text: text
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
      position: [200, 300],
      webhookId: '2e963c75-8854-420f-998e-ea9950cf11a8'
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
              leftValue: '={{ $json.body?.message?.chat?.id?.toString() || $json.body?.callback_query?.message?.chat?.id?.toString() }}',
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
        rules: {
          values: [
            {
              conditions: {
                options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
                conditions: [{ leftValue: '={{ $json.route }}', rightValue: 'TASK', operator: { type: 'string', operation: 'equals' } }],
                combinator: 'and'
              },
              renameOutput: true,
              outputKey: 'Task Route'
            },
            {
              conditions: {
                options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
                conditions: [{ leftValue: '={{ $json.route }}', rightValue: 'REPORT_TODAY', operator: { type: 'string', operation: 'equals' } }],
                combinator: 'and'
              },
              renameOutput: true,
              outputKey: 'Report Route'
            },
            {
              conditions: {
                options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
                conditions: [{ leftValue: '={{ $json.route }}', rightValue: 'HELP', operator: { type: 'string', operation: 'equals' } }],
                combinator: 'and'
              },
              renameOutput: true,
              outputKey: 'Help Route'
            }
          ]
        },
        options: {}
      },
      id: 'route-switch-node',
      name: 'Route Switch',
      type: 'n8n-nodes-base.switch',
      typeVersion: 3.2,
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
      position: [1120, 160],
      credentials: {
        postgres: {
          id: PG_CRED_ID,
          name: 'Neon Singapore PostgreSQL'
        }
      }
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://api.github.com/repos/lyquangthai1993/logistics-website/dispatches',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Accept', value: 'application/vnd.github+json' },
            { name: 'Authorization', value: `Bearer ${GH_PAT_TOKEN}` },
            { name: 'User-Agent', value: 'n8n-telegram-task-runner' }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({\n  event_type: ($("Format Leader Prompt").first().json.mode_badge || "").indexOf("todo-agent") !== -1 ? "telegram-todo" : "telegram-feedback",\n  client_payload: {\n    task_id: ($("Enqueue Task to Neon DB").first().json.task_id != null ? String($("Enqueue Task to Neon DB").first().json.task_id) : String($("Enqueue Task to Neon DB").first().json.id || "manual")),\n    db_id: String($("Enqueue Task to Neon DB").first().json.id || ""),\n    prompt: String(($("Format Leader Prompt").first().json.analysis || $("Format Leader Prompt").first().json.raw_prompt) || "").split("<id>").join(String($("Enqueue Task to Neon DB").first().json.task_id != null ? $("Enqueue Task to Neon DB").first().json.task_id : ($("Enqueue Task to Neon DB").first().json.id || ""))),\n    sender_name: $("Format Leader Prompt").first().json.sender_name,\n    mode: ($("Format Leader Prompt").first().json.mode_badge || "").indexOf("todo-agent") !== -1 ? "todo" : "leader"\n  }\n}) }}',
        options: {}
      },
      id: 'trigger-github-actions-node',
      name: 'Trigger GitHub Actions',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1360, 160]
    },
    {
      parameters: {
        operation: 'executeQuery',
        query: '={{ $json.sql }}'
      },
      id: 'query-today-tasks-node',
      name: 'Query Today Tasks',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.5,
      position: [1120, 320],
      credentials: {
        postgres: {
          id: PG_CRED_ID,
          name: 'Neon Singapore PostgreSQL'
        }
      }
    },
    {
      parameters: {
        jsCode: formatReportCode
      },
      id: 'format-today-report-node',
      name: 'Format Today Report',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1360, 320]
    },
    {
      parameters: {
        resource: 'message',
        operation: 'sendMessage',
        chatId: '={{ $json.chat_id }}',
        text: '={{ $json.report_text }}',
        additionalFields: {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Cập nhật /report-today', callback_data: '/report-today' },
                { text: '🌐 Mở Dev Web', url: 'https://frontend-tms-core-dev.up.railway.app' }
              ]
            ]
          }
        }
      },
      id: 'send-today-report-node',
      name: 'Send Today Report',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: [1600, 320],
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
        text: '={{ `🤖 <b>ANTIGRAVITY AI TASK RUNNER</b>\\n<i>Hệ thống điều khiển AI Agent tự động qua Telegram.</i>\\n\\n📌 <b>CÁC LỆNH ĐƯỢC HỖ TRỢ:</b>\\n\\n📊 <b>Báo cáo nhanh hôm nay:</b>\\n• Cú pháp: <code>/report-today</code> hoặc <code>/today</code>\\n• <b>Nhiệm vụ:</b> Báo cáo tổng hợp số lượng task DONE, FAIL và danh sách chi tiết các task đã thực thi trong ngày.\\n\\n1️⃣ <b>Ghi nhận Feedback / Yêu cầu mới:</b>\\n• Cú pháp: <code>/feedback &lt;nội dung&gt;</code>\\n  <i>(hoặc gửi ảnh chụp kèm caption bắt đầu bằng <code>/feedback</code>)</i>\\n• <b>Nhiệm vụ:</b> Kích hoạt <code>/leader</code> khảo sát mã nguồn TMS và tổng hợp <code>TODO.md</code>.\\n\\n2️⃣ <b>Thực thi công việc ngay:</b>\\n• Cú pháp: <code>/force</code> hoặc <code>/force &lt;tên thư mục task&gt;</code>\\n• <b>Nhiệm vụ:</b> Kích hoạt <code>todo-agent</code> quét checklist <code>TODO.md</code> hôm nay, sửa code và chạy test.\\n\\n────────────────────\\n🌐 <b>Dev Web:</b> <a href="https://frontend-tms-core-dev.up.railway.app">Frontend Dev</a> | <a href="https://backend-tms-core-dev.up.railway.app/docs">Swagger API</a>\\n🚀 <b>Pro Web:</b> <a href="https://frontend-tms-core-production.up.railway.app">Frontend Pro</a> | <a href="https://backend-tms-core-production.up.railway.app/docs">Swagger API</a>` }}',
        additionalFields: {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Báo Cáo Hôm Nay (/report-today)', callback_data: '/report-today' }
              ]
            ]
          }
        }
      },
      id: 'send-help-node',
      name: 'Send Help Message',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: [1120, 480],
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
        [{ node: 'Filter Allowed Chat', type: 'main', index: 0 }]
      ]
    },
    'Filter Allowed Chat': {
      main: [
        [{ node: 'Format Leader Prompt', type: 'main', index: 0 }]
      ]
    },
    'Format Leader Prompt': {
      main: [
        [{ node: 'Route Switch', type: 'main', index: 0 }]
      ]
    },
    'Route Switch': {
      main: [
        // Output 0: Task Route
        [{ node: 'Enqueue Task to Neon DB', type: 'main', index: 0 }],
        // Output 1: Report Route
        [{ node: 'Query Today Tasks', type: 'main', index: 0 }],
        // Output 2: Help Route
        [{ node: 'Send Help Message', type: 'main', index: 0 }]
      ]
    },
    'Enqueue Task to Neon DB': {
      main: [
        // Connect directly to Trigger GitHub Actions without spamming Telegram!
        [{ node: 'Trigger GitHub Actions', type: 'main', index: 0 }]
      ]
    },
    'Query Today Tasks': {
      main: [
        [{ node: 'Format Today Report', type: 'main', index: 0 }]
      ]
    },
    'Format Today Report': {
      main: [
        [{ node: 'Send Today Report', type: 'main', index: 0 }]
      ]
    }
  };

  console.log('\n2. Updating workflow on n8n via PATCH...');
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
  const updateData = await updateRes.json();
  console.log('Update success! New versionId:', updateData.data?.versionId);

  console.log('\n3. Reactivating workflow...');
  const actRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ versionId: updateData.data?.versionId })
  });
  const actData = await actRes.json();
  console.log('Active state:', actData.data?.active);

  console.log('\n🚀 Hoàn tất nâng cấp workflow Telegram Task Orchestrator trên n8n Cloud!');
}

main().catch(console.error);
