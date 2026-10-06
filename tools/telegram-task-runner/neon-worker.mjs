import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Tự động load biến môi trường từ .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// Fallback: Tự động tìm DATABASE_URL từ backend/.env nếu chưa có
if (!process.env.DATABASE_URL) {
  const backendEnv = path.resolve(__dirname, '../../backend/.env');
  if (fs.existsSync(backendEnv)) {
    process.loadEnvFile(backendEnv);
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID;
const WORKSPACE_DIR = process.env.WORKSPACE_PATH || 'C:\\Projects\\logistics-website';
const DATABASE_URL = process.env.DATABASE_URL;
const AGY_MODEL = process.env.AGY_MODEL;

if (!BOT_TOKEN) {
  console.error('❌ Lỗi: Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Lỗi: Chưa cấu hình DATABASE_URL trong file .env');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Phím bấm thao tác nhanh đính kèm tin nhắn Telegram
const TASK_ACTIONS_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🌐 Mở Dev Web', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
      { text: '🚀 Mở Pro Web', url: 'https://logistics-website-frontend-kappa.vercel.app' },
    ],
    [
      { text: '📚 Swagger Dev', url: 'https://logistics-website-backend-1jho.onrender.com/docs' },
      { text: '📚 Swagger Pro', url: 'https://logistics-website-backend-1.onrender.com/docs' },
    ],
  ],
};

// Tìm đường dẫn agy executable trên Windows
function findAgyBinary() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const defaultPath = path.join(localAppData, 'agy', 'bin', 'agy.exe');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  return 'agy'; // fallback to PATH
}

const AGY_BIN = findAgyBinary();

// Escape ký tự HTML an toàn cho Telegram
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Chuyển đổi Markdown chuẩn sang Telegram HTML
function markdownToTelegramHtml(markdown) {
  if (!markdown) return '';
  let text = String(markdown);

  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang, code: escapeHtml(code.trimEnd()) });
    return `@@@TELEGRAM_CODE_BLOCK_${idx}@@@`;
  });

  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(escapeHtml(code));
    return `@@@TELEGRAM_INLINE_CODE_${idx}@@@`;
  });

  text = text.replace(/<br\s*\/?>/gi, '@@@TELEGRAM_BR@@@');
  text = escapeHtml(text);

  // Markdown Tables
  text = text.replace(/((?:^[ \t]*\|.*\|[ \t]*(?:\r?\n|$))+)/gm, (tableMatch) => {
    const lines = tableMatch.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return tableMatch;

    const parseRow = (row) => row.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
    const headers = parseRow(lines[0]);
    const dataRows = lines.slice(1).filter(l => !/^\|?\s*[-:]+[-| :]*\|?$/.test(l));

    if (dataRows.length === 0) return tableMatch;

    let formattedTable = '\n';
    for (const row of dataRows) {
      const cells = parseRow(row);
      if (cells.length === 0) continue;

      const firstCol = cells[0].replace(/@@@TELEGRAM_BR@@@/g, ' ');
      const otherCols = cells.slice(1).map((val, i) => {
        const headerName = headers[i + 1] ? `${headers[i + 1]}: ` : '';
        const cleanVal = val.replace(/@@@TELEGRAM_BR@@@/g, '\n    ');
        return `  ▫️ <b>${headerName}</b>${cleanVal}`;
      }).join('\n');

      formattedTable += `🔹 <b>${firstCol}</b>\n${otherCols}\n\n`;
    }
    return formattedTable;
  });

  text = text.replace(/@@@TELEGRAM_BR@@@/g, '\n');
  text = text.replace(/\[([^\]]+)\]\((file:\/\/[^\)]+)\)/g, '<code>$1</code>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/^[ \t]*#{1,6}[ \t]+(.+)$/gm, '\n<b>$1</b>');
  text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '────────────────────');
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  text = text.replace(/__(.*?)__/g, '<b>$1</b>');
  text = text.replace(/(?<![a-zA-Z0-9])\*([^*\n]+)\*(?![a-zA-Z0-9])/g, '<i>$1</i>');
  text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');

  text = text.replace(/@@@TELEGRAM_CODE_BLOCK_(\d+)@@@/g, (m, idx) => {
    const item = codeBlocks[Number(idx)];
    if (!item) return '';
    return `\n<pre>${item.code}</pre>\n`;
  });

  text = text.replace(/@@@TELEGRAM_INLINE_CODE_(\d+)@@@/g, (m, idx) => {
    const item = inlineCodes[Number(idx)];
    if (!item) return '';
    return `<code>${item}</code>`;
  });

  return text.trim();
}

// Gửi tin nhắn Telegram (chia nhỏ nếu vượt quá 4000 ký tự)
async function sendTelegramMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  if (!text) return null;
  const MAX_LEN = 3900;
  const chunks = [];

  if (text.length <= MAX_LEN) {
    chunks.push(text);
  } else {
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LEN) {
        chunks.push(remaining);
        break;
      }
      let splitIdx = remaining.lastIndexOf('\n\n', MAX_LEN);
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = remaining.lastIndexOf('\n', MAX_LEN);
      }
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = MAX_LEN;
      }
      chunks.push(remaining.slice(0, splitIdx).trim());
      remaining = remaining.slice(splitIdx).trim();
    }
  }

  let lastRes = null;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLast = i === chunks.length - 1;
    const payload = {
      chat_id: chatId,
      text: chunk,
    };
    if (parseMode) payload.parse_mode = parseMode;
    if (isLast && replyMarkup) payload.reply_markup = replyMarkup;

    try {
      const res = await fetch(`${API_BASE}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn('sendTelegramMessage non-ok, retrying without parse_mode:', data.description);
        delete payload.parse_mode;
        payload.text = chunk.replace(/<[^>]+>/g, '');
        const retryRes = await fetch(`${API_BASE}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        lastRes = await retryRes.json();
      } else {
        lastRes = data;
      }
    } catch (err) {
      console.error('sendTelegramMessage network error:', err.message);
    }
  }
  return lastRes;
}

// Sửa nội dung tin nhắn Telegram đã gửi (dùng cho live update tiến độ)
async function editTelegramMessage(chatId, messageId, text, parseMode = 'HTML', replyMarkup = null) {
  if (!messageId || !text) return null;
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text.slice(0, 4000),
    };
    if (parseMode) payload.parse_mode = parseMode;
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const res = await fetch(`${API_BASE}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('editTelegramMessage failed:', err.message);
  }
}

// Tải file ảnh từ Telegram về thư mục đích trên máy local
async function downloadTelegramFile(fileId, targetDir, defaultName = 'screenshot.png') {
  const getFileUrl = `${API_BASE}/getFile?file_id=${fileId}`;
  const res = await fetch(getFileUrl);
  const data = await res.json();
  if (!data.ok || !data.result.file_path) {
    throw new Error(`Telegram getFile failed: ${JSON.stringify(data)}`);
  }

  const remotePath = data.result.file_path;
  const ext = path.extname(remotePath) || '.png';
  const baseNoExt = defaultName.replace(/\.[^/.]+$/, '');
  const localFilename = `${baseNoExt}${ext}`;
  const localFilePath = path.join(targetDir, localFilename);

  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${remotePath}`;
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to download image: ${fileRes.statusText}`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
  return localFilePath;
}

// Xác định thư mục feedback theo ngày (ví dụ feedback_06_10)
function getFeedbackDirectory(taskId) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const baseName = `feedback_${dd}_${mm}`;
  const baseDir = path.join(WORKSPACE_DIR, baseName);

  // Nếu baseDir chưa tồn tại, tạo mới và dùng
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    return baseDir;
  }

  // Nếu baseDir đã có TODO.md hoàn chỉnh, tạo folder riêng cho task này để không ghi đè
  const baseTodo = path.join(baseDir, 'TODO.md');
  if (!fs.existsSync(baseTodo)) {
    return baseDir;
  }

  const taskDir = path.join(WORKSPACE_DIR, `${baseName}_task_${taskId}`);
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }
  return taskDir;
}

// Lấy Git Diff Stat
function getGitDiffStat() {
  try {
    const rootDiff = execSync('git diff --stat', { cwd: WORKSPACE_DIR, encoding: 'utf-8' }).trim();
    let backendDiff = '';
    let frontendDiff = '';

    const backendDir = path.join(WORKSPACE_DIR, 'backend');
    if (fs.existsSync(backendDir)) {
      backendDiff = execSync('git diff --stat', { cwd: backendDir, encoding: 'utf-8' }).trim();
    }

    const frontendDir = path.join(WORKSPACE_DIR, 'frontend');
    if (fs.existsSync(frontendDir)) {
      frontendDiff = execSync('git diff --stat', { cwd: frontendDir, encoding: 'utf-8' }).trim();
    }

    let result = '';
    if (rootDiff) result += `Root Repo:\n${rootDiff}\n`;
    if (backendDiff) result += `Backend:\n${backendDiff}\n`;
    if (frontendDiff) result += `Frontend:\n${frontendDiff}\n`;

    return result.trim() ? result.trim() : null;
  } catch (err) {
    return null;
  }
}

// Xây dựng prompt chuẩn hóa với vai trò Team Lead nghiệp vụ /leader để tổng hợp TODO.md
function buildTaskPrompt(rawPrompt, feedbackDir, imagePaths = [], senderName = 'User') {
  const relativeFeedbackDir = path.relative(WORKSPACE_DIR, feedbackDir);
  const targetTodoPath = path.join(feedbackDir, 'TODO.md');
  const referenceTodoPath = path.join(WORKSPACE_DIR, 'feedback_06_10', 'TODO.md');

  let imagesSection = '';
  if (imagePaths.length > 0) {
    imagesSection = `
[DANH SÁCH ẢNH CHỤP MÀN HÌNH ĐÍNH KÈM CỦA NGƯỜI DÙNG]:
Đã tải về và lưu trữ ${imagePaths.length} ảnh trong thư mục ${feedbackDir}:
${imagePaths.map((p, idx) => `  - Ảnh ${idx + 1}: ${p}`).join('\n')}

HƯỚNG DẪN BẮT BUỘC:
- Dùng công cụ view_file để đọc và quan sát chi tiết từng hình ảnh trên.
- Phân tích chi tiết lỗi hiển thị, điểm chưa đúng trên giao diện cũ, và đối chiếu với mã nguồn thực tế.
`;
  }

  return `
BẮT BUỘC KÍCH HOẠT VAI TRÒ TMS DOMAIN LEAD:
1. Bạn BẮT BUỘC đọc và tuân thủ file AGENTS.md, skill .agents/skills/leader/SKILL.md tại workspace D:\\Projects\\logistics-website.
2. Bạn đóng vai trò là Team Lead / Kỹ sư trưởng nghiệp vụ của hệ thống Logistics TMS (Spider Express).

3. MỤC TIÊU CỐT LÕI CỦA WORKFLOW NÀY:
Bạn vừa tiếp nhận FEEDBACK / YÊU CẦU MỚI TỪ NGƯỜI DÙNG (@${senderName}):
"${rawPrompt}"
${imagesSection}

4. NHIỆM VỤ ĐẦU RA BẮT BUỘC (FINAL DELIVERABLE):
Nhiệm vụ cuối cùng của bạn là TỔNG HỢP LẠI 1 FILE TODO.MD đặt tại:
${targetTodoPath}

File TODO.md này PHẢI theo đúng cấu trúc chuẩn nghiệp vụ như tại file tham chiếu mẫu:
${referenceTodoPath}

Cấu trúc file ${targetTodoPath} BẮT BUỘC có các phần:
- Header: Tiêu đề Feedback + Thời gian ghi nhận + Người báo cáo (@${senderName}) + Màn hình liên quan + Tài liệu tham chiếu (/leader).
- 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng): Tình huống vận hành thực tế, các quy định trường thông tin, luồng xử lý chi tiết.
- 🔍 Tổng hợp các điểm chưa đúng trên giao diện cũ: Phân tích chi tiết từng lỗi đối chiếu trực tiếp với các ảnh chụp màn hình đính kèm đã lưu trong thư mục.
- 📋 Danh sách công việc triển khai (Action Checklist) chi tiết và cụ thể cho 3 phần:
  * 1. Backend (backend/): DTO, Entities, Service, Controller, Migrations...
  * 2. Frontend (frontend/): Components, Modals, State, API calls, Tailwind compact density...
  * 3. Kiểm thử & Nghiệm thu: Type check, Build test, Lint test, Kịch bản kiểm thử...

5. CÁC BƯỚC THỰC HIỆN CỦA AGENT:
- BƯỚC 1: Dùng view_file để xem kỹ các ảnh chụp màn hình (nếu có) và đọc file tham chiếu ${referenceTodoPath}.
- BƯỚC 2: Khảo sát mã nguồn thực tế tại D:\\Projects\\logistics-website (kiểm tra các component, modal, service liên quan đến màn hình được phản hồi).
- BƯỚC 3: Dùng write_to_file để tạo file ${targetTodoPath} với đầy đủ nội dung nghiệp vụ sâu sắc, chuẩn mực.
- BƯỚC 4: Báo cáo kết quả trực tiếp về Telegram:
  * Dòng đầu tiên BẮT BUỘC là: "🟢 HOÀN THÀNH (TỔNG HỢP TODO.MD): [Tiêu đề feedback]"
  * Trích dẫn đường link file vừa tạo: [TODO.md](file:///${targetTodoPath.replace(/\\/g, '/')})
  * Tóm tắt ngắn gọn các lỗi phát hiện và Action Checklist các đầu việc cần làm.
  * TUYỆT ĐỐI KHÔNG viết các câu kết bài thừa thãi (như "Bạn muốn làm gì tiếp theo...", "Hệ thống đã sẵn sàng...").
`.trim();
}

// Quản lý kết nối Neon PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let activeProcess = null;

// Thực thi tác vụ thông qua Antigravity CLI (agy)
async function executeAgyTask(task) {
  const taskId = task.id;
  const chatId = task.chat_id || ALLOWED_CHAT_ID;
  const rawPrompt = task.raw_prompt;
  const senderName = task.sender_name || 'User';
  const startTime = Date.now();

  console.log(`\n========================================`);
  console.log(`🚀 [Task #${taskId}] Bắt đầu thực thi cho @${senderName}: "${rawPrompt}"`);
  console.log(`📂 Workspace: ${WORKSPACE_DIR}`);
  console.log(`========================================`);

  // 1. Tạo thư mục feedback (feedback_DD_MM)
  const feedbackDir = getFeedbackDirectory(taskId);
  console.log(`📁 Feedback Dir: ${feedbackDir}`);

  // 2. Tải tất cả ảnh đính kèm từ Telegram vào feedbackDir
  const savedImagePaths = [];
  const imageIds = Array.isArray(task.image_file_ids) ? task.image_file_ids : [];
  if (imageIds.length > 0) {
    console.log(`📸 Đang tải ${imageIds.length} ảnh đính kèm từ Telegram vào ${feedbackDir}...`);
    for (let i = 0; i < imageIds.length; i++) {
      const fid = imageIds[i];
      try {
        const imgName = `screenshot_${String(i + 1).padStart(2, '0')}.png`;
        const localPath = await downloadTelegramFile(fid, feedbackDir, imgName);
        savedImagePaths.push(localPath);
        console.log(`  ✅ Đã lưu: ${localPath}`);
      } catch (err) {
        console.error(`  ❌ Lỗi khi tải ảnh ${fid}:`, err.message);
      }
    }
  }

  // 3. Gửi thông báo bắt đầu lên Telegram
  const startMsg =
    `⏳ <b>[Antigravity /leader] Đang tiếp nhận Task #${taskId}...</b> <code>(⏱️ 0s)</code>\n\n` +
    `👤 <b>Người gửi:</b> ${escapeHtml(senderName)}\n` +
    (savedImagePaths.length > 0 ? `📸 <b>Hình ảnh:</b> <code>${savedImagePaths.length} ảnh đã lưu vào feedback dir</code>\n` : '') +
    `📝 <b>Yêu cầu:</b> <i>"${escapeHtml(rawPrompt)}"</i>\n` +
    `🤖 <b>Chế độ:</b> <code>/leader</code> (TMS Business Lead)\n` +
    `📁 <b>Thư mục đầu ra:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}/TODO.md</code>\n\n` +
    `💡 <i>Tiến trình AI đang rà soát ảnh chụp, kiểm tra codebase và tổng hợp TODO.md trên laptop. Tự động cập nhật mỗi 25s...</i>`;

  const startRes = await sendTelegramMessage(chatId, startMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
  const progressMsgId = startRes?.result?.message_id || null;

  // 4. Chuẩn bị prompt và đối số agy
  const finalPrompt = buildTaskPrompt(rawPrompt, feedbackDir, savedImagePaths, senderName);
  const args = [
    '--output-format', 'stream-json',
    '--add-dir', WORKSPACE_DIR,
    '--dangerously-skip-permissions',
    '--print', finalPrompt,
    '--print-timeout', '30m'
  ];

  if (AGY_MODEL) {
    args.push('--model', AGY_MODEL);
  }

  // 5. Khởi chạy agy
  const child = spawn(AGY_BIN, args, {
    cwd: WORKSPACE_DIR,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env },
  });

  activeProcess = child;

  let stdoutBuffer = '';
  let stderrBuffer = '';
  let stdoutLineBuffer = '';
  let conversationId = null;
  let latestToolAction = '';
  let currentStepIndex = 0;
  let finalResultResponse = '';

  // Typing action trên Telegram
  const typingTimer = setInterval(async () => {
    try {
      await fetch(`${API_BASE}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      });
    } catch {}
  }, 4500);

  // Phân tích stream-json từ agy
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdoutBuffer += text;
    process.stdout.write(text);

    stdoutLineBuffer += text;
    const lines = stdoutLineBuffer.split(/\r?\n/);
    stdoutLineBuffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('{') || !trimmed.endsWith('}')) continue;

      try {
        const parsed = JSON.parse(trimmed);

        const convId = parsed.conversation_id || parsed.init?.conversation_id || parsed.result?.conversation_id || parsed.step_update?.conversation_id;
        if (convId && !conversationId) {
          conversationId = convId;
          console.log(`[Session Captured] Conversation ID: ${convId}`);
        }

        if (parsed.event === 'step_update' && parsed.step_update) {
          const su = parsed.step_update;
          if (typeof su.step_index === 'number') currentStepIndex = su.step_index;
          if (su.step_type === 'tool' && su.tool_info) {
            const toolName = su.tool_name || su.tool_info.name || 'tool';
            const action = su.tool_info.parameters?.toolAction || su.tool_info.parameters?.toolSummary || su.tool_info.parameters?.CommandLine || '';
            latestToolAction = `[${toolName}] ${typeof action === 'string' ? action.replace(/^"|"$/g, '') : ''}`.trim();
          }
        }

        if (parsed.event === 'result' && parsed.result) {
          if (typeof parsed.result.response === 'string') {
            finalResultResponse = parsed.result.response;
          }
          if (parsed.result.conversation_id) {
            conversationId = parsed.result.conversation_id;
          }
        }
      } catch {}
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuffer += text;
    process.stderr.write(text);
  });

  // Live progress update mỗi 25s
  const progressTimer = setInterval(async () => {
    if (!progressMsgId) return;
    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

      let progressText =
        `⏳ <b>[Antigravity /leader] Đang tổng hợp TODO.md Task #${taskId}...</b> <code>(⏱️ ${timeStr})</code>\n\n` +
        `📝 <i>"${escapeHtml(rawPrompt.length > 100 ? rawPrompt.slice(0, 97) + '...' : rawPrompt)}"</i>\n` +
        `📁 <b>Thư mục:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n`;

      if (conversationId) {
        progressText += `🆔 <b>Session:</b> <code>${conversationId.slice(0, 8)}...</code>\n`;
      }

      if (latestToolAction) {
        progressText += `📍 <b>Bước hiện tại (#${currentStepIndex}):</b> <code>${escapeHtml(latestToolAction)}</code>\n`;
      } else {
        progressText += `📍 <b>Trạng thái:</b> <i>Đang rà soát ảnh chụp và đối chiếu mã nguồn...</i>\n`;
      }

      progressText += `\n💡 <i>Tự động cập nhật mỗi 25s...</i>`;

      await editTelegramMessage(chatId, progressMsgId, progressText, 'HTML', TASK_ACTIONS_KEYBOARD);
    } catch (err) {
      console.warn('Progress update error:', err.message);
    }
  }, 25000);

  // Đợi agy hoàn tất
  return new Promise((resolve) => {
    child.on('close', async (exitCode) => {
      clearInterval(typingTimer);
      clearInterval(progressTimer);
      activeProcess = null;

      const durationSec = Math.round((Date.now() - startTime) / 1000);
      const m = Math.floor(durationSec / 60);
      const s = durationSec % 60;
      const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

      console.log(`[Task #${taskId}] Kết thúc với exitCode: ${exitCode} (${timeStr})`);

      const todoFile = path.join(feedbackDir, 'TODO.md');
      const hasTodoCreated = fs.existsSync(todoFile);

      if (exitCode === 0) {
        let cleanOutput = (finalResultResponse || stdoutBuffer).trim();
        cleanOutput = cleanOutput.replace(/^(Tôi đã tiếp nhận.*?\n+|Chào bạn.*?\n+)/gi, '').trim();
        cleanOutput = cleanOutput.replace(/(\n+.*?(Bạn muốn thực hiện bước nào|Hệ thống đã sẵn sàng|Hệ thống đã được tối ưu|Chúc bạn|Nếu bạn cần thêm)[\s\S]*$)/gi, '').trim();

        const formattedHtml = markdownToTelegramHtml(cleanOutput);
        const gitDiff = getGitDiffStat();

        let finalReport =
          `🎯 <b>[KẾT QUẢ TASK #${taskId}] - TỔNG HỢP TODO.MD HOÀN TẤT</b> <code>(⏱️ ${timeStr})</code>\n\n` +
          `📁 <b>Thư mục Feedback:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
          (hasTodoCreated ? `📄 <b>File TODO:</b> <code>${path.relative(WORKSPACE_DIR, todoFile)}</code> (✅ Đã tạo thành công)\n` : '') +
          (savedImagePaths.length > 0 ? `📸 <b>Hình ảnh:</b> <code>${savedImagePaths.length} ảnh đã lưu trữ kèm TODO</code>\n` : '') +
          (conversationId ? `🆔 <b>Session:</b> <code>${conversationId}</code>\n\n` : '\n') +
          formattedHtml;

        if (gitDiff) {
          finalReport += `\n\n📊 <b>THAY ĐỔI MÃ NGUỒN (GIT DIFF):</b>\n<pre>${escapeHtml(gitDiff)}</pre>`;
        }

        if (progressMsgId) {
          await editTelegramMessage(chatId, progressMsgId, `✅ <b>[Task #${taskId}] Đã hoàn thành tổng hợp TODO.md trong ${timeStr}!</b>`, 'HTML');
        }

        await sendTelegramMessage(chatId, finalReport, 'HTML', TASK_ACTIONS_KEYBOARD);

        await pool.query(`
          UPDATE telegram_tasks 
          SET status = 'COMPLETED', feedback_dir = $1, result = $2, completed_at = NOW() 
          WHERE id = $3;
        `, [feedbackDir, cleanOutput, taskId]);

        resolve({ success: true, taskId });
      } else {
        const errorText = (stderrBuffer || stdoutBuffer).slice(-1000).trim();
        const failMsg =
          `❌ <b>[Task #${taskId}] THẤT BẠI (Mã lỗi: ${exitCode})</b> <code>(⏱️ ${timeStr})</code>\n\n` +
          `📝 <b>Yêu cầu:</b> <i>"${escapeHtml(rawPrompt)}"</i>\n\n` +
          `⚠️ <b>Chi tiết lỗi:</b>\n<pre>${escapeHtml(errorText || 'Tiến trình agy kết thúc bất thường')}</pre>`;

        if (progressMsgId) {
          await editTelegramMessage(chatId, progressMsgId, `❌ <b>[Task #${taskId}] Đã gặp lỗi (${timeStr})</b>`, 'HTML');
        }
        await sendTelegramMessage(chatId, failMsg, 'HTML', TASK_ACTIONS_KEYBOARD);

        await pool.query(`
          UPDATE telegram_tasks 
          SET status = 'FAILED', feedback_dir = $1, error = $2, completed_at = NOW() 
          WHERE id = $3;
        `, [feedbackDir, errorText, taskId]);

        resolve({ success: false, taskId, exitCode });
      }
    });
  });
}

// Tự động kiểm tra và khởi tạo bảng hàng đợi telegram_tasks nếu chưa có
async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_tasks (
      id SERIAL PRIMARY KEY,
      chat_id VARCHAR(50),
      sender_name VARCHAR(100),
      raw_prompt TEXT NOT NULL,
      image_file_ids JSONB DEFAULT '[]'::jsonb,
      media_group_id VARCHAR(100),
      status VARCHAR(20) DEFAULT 'PENDING',
      feedback_dir TEXT,
      result TEXT,
      error TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_tasks_status ON telegram_tasks(status, id ASC);
  `);
}

// Vòng lặp lắng nghe hàng đợi tác vụ từ Neon PostgreSQL (Worker Loop)
async function startWorker() {
  console.log(`=======================================================`);
  console.log(`🤖 ANTIGRAVITY LOCAL WORKER DAEMON (FEEDBACK & TODO.MD) READY`);
  console.log(`📂 Target Workspace: ${WORKSPACE_DIR}`);
  console.log(`⚡ AGY Binary:        ${AGY_BIN}`);
  console.log(`💬 Allowed Chat ID:   ${ALLOWED_CHAT_ID}`);
  console.log(`🐘 Neon DB Queue:     Connected`);
  console.log(`📋 Output Goal:       TODO.md in feedback_DD_MM folder`);
  console.log(`=======================================================\n`);

  try {
    await initDatabase();
  } catch (err) {
    console.warn('⚠️ Lỗi kiểm tra/khởi tạo bảng telegram_tasks:', err.message);
  }

  while (true) {
    try {
      // Truy vấn và claim task PENDING theo thứ tự FIFO
      // Với media_group, cho 3 giây để mọi ảnh trong album kịp tới
      const res = await pool.query(`
        UPDATE telegram_tasks 
        SET status = 'IN_PROGRESS', started_at = NOW() 
        WHERE id = (
          SELECT id FROM telegram_tasks 
          WHERE status = 'PENDING'
            AND (media_group_id IS NULL OR created_at <= NOW() - INTERVAL '3 seconds')
          ORDER BY id ASC 
          LIMIT 1
        ) 
        RETURNING *;
      `);

      if (res.rows && res.rows.length > 0) {
        const task = res.rows[0];
        await executeAgyTask(task);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (err) {
      console.error('❌ Lỗi worker loop (sẽ thử lại sau 5s):', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Đang dừng Antigravity Worker...');
  if (activeProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${activeProcess.pid} /T /F`);
      } else {
        activeProcess.kill();
      }
    } catch {}
  }
  await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Safety] Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Safety] Uncaught Exception:', err?.message || err);
});

startWorker();
