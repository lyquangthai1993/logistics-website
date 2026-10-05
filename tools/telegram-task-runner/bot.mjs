import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Tự động load biến môi trường từ .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID;
const WORKSPACE_DIR = process.env.WORKSPACE_PATH || path.resolve(__dirname, '../..');
const AGY_MODEL = process.env.AGY_MODEL;

if (!BOT_TOKEN) {
  console.error('❌ Lỗi: Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Thư mục lưu ảnh đính kèm từ Telegram
const IMAGES_DIR = path.join(__dirname, 'task-images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// File lưu trữ hàng đợi tác vụ trên đĩa cứng vật lý
const QUEUE_FILE = path.join(__dirname, 'task-queue.json');

// Đọc trạng thái hàng đợi từ file vật lý (Persistent Queue)
function loadQueueState() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        currentTask: data.currentTask || null,
        queue: Array.isArray(data.queue) ? data.queue : [],
        history: Array.isArray(data.history) ? data.history : [],
      };
    }
  } catch (err) {
    console.error('Lỗi khi đọc file task-queue.json, khởi tạo mới:', err.message);
  }
  return { currentTask: null, queue: [], history: [] };
}

// Ghi trạng thái hàng đợi xuống file vật lý an toàn
function saveQueueState(state) {
  try {
    const payload = {
      currentTask: state.currentTask
        ? {
            id: state.currentTask.id,
            chatId: state.currentTask.chatId,
            rawPrompt: state.currentTask.rawPrompt,
            taskMode: state.currentTask.taskMode,
            taskBadge: state.currentTask.taskBadge,
            imagePaths: state.currentTask.imagePaths || [],
            startTime: state.currentTask.startTime,
            status: state.currentTask.status || 'running',
          }
        : null,
      queue: state.queue || [],
      history: (state.history || []).slice(-10),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi khi ghi file task-queue.json:', err.message);
  }
}

// Khởi tạo state từ đĩa cứng
const queueState = loadQueueState();
saveQueueState(queueState); // Tạo file ngay nếu chưa tồn tại
let currentTask = null; // Quản lý tiến trình trong RAM: { ...currentTask, process, wasCancelled }
const taskQueue = queueState.queue; // Con trỏ tham chiếu đến queueState.queue
const mediaGroupBuffers = new Map(); // media_group_id -> { chatId, photos: [], caption: '', timer }

// Khôi phục task khi bot khởi động lại (Crash Recovery từ file vật lý)
async function recoverInterruptedTasks() {
  try {
    // 1. Kiểm tra xem task đang chạy trước khi tắt có bị ngắt ngang không
    if (queueState.currentTask && queueState.currentTask.status === 'running') {
      const interrupted = queueState.currentTask;
      console.warn(`[Crash Recovery] Phát hiện task bị ngắt: "${interrupted.rawPrompt}"`);

      // Thông báo cho người dùng trên Telegram
      await sendTelegramMessage(
        interrupted.chatId || ALLOWED_CHAT_ID,
        `⚠️ <b>PHÁT HIỆN TASK BỊ GIÁN ĐOẠN GIỮA CHỪNG:</b>\n\n` +
        `📝 <i>${escapeHtml(interrupted.rawPrompt)}</i>\n\n` +
        `🔄 <i>Hệ thống vừa khởi động lại. Đang tự động khôi phục và tiếp tục phiên làm việc (agy --continue)...</i>`,
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );

      // Đưa task này vào đầu hàng đợi với chế độ continue để nối tiếp phiên làm việc
      taskQueue.unshift({
        id: interrupted.id || `task_${Date.now()}`,
        chatId: interrupted.chatId || ALLOWED_CHAT_ID,
        rawPrompt: interrupted.rawPrompt,
        taskMode: 'continue',
        imagePaths: interrupted.imagePaths || [],
        timestamp: Date.now(),
        isRecovered: true,
      });

      queueState.currentTask = null;
      saveQueueState(queueState);
    }

    // 2. Nếu trong hàng đợi còn task tồn đọng trên đĩa
    if (taskQueue.length > 0) {
      console.log(`[Queue Recovery] Đã khôi phục ${taskQueue.length} task từ file task-queue.json.`);
      await sendTelegramMessage(
        ALLOWED_CHAT_ID,
        `📋 <b>Khôi phục hàng đợi tác vụ (${taskQueue.length} task tồn đọng từ đĩa cứng):</b>\n` +
        taskQueue.map((t, idx) => `${idx + 1}. [${t.taskMode || 'task'}] <i>${escapeHtml(t.rawPrompt)}</i>`).join('\n') +
        `\n\n▶️ <i>Đang tự động thực thi lần lượt theo thứ tự FIFO...</i>`,
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );

      // Kích hoạt chạy task đầu tiên sau 1.5s
      setTimeout(() => {
        processNextQueueItem();
      }, 1500);
    }
  } catch (err) {
    console.error('Lỗi khi khôi phục task từ file:', err.message);
  }
}

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

// Escape ký tự đặc biệt cho Telegram HTML parse mode
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Chuyển đổi Markdown chuẩn sang Telegram HTML an toàn tuyệt đối
function markdownToTelegramHtml(markdown) {
  if (!markdown) return '';
  let text = String(markdown);

  // 1. Tách và bảo vệ Code Blocks (```lang ... ```)
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang, code: escapeHtml(code.trimEnd()) });
    return `@@@TELEGRAM_CODE_BLOCK_${idx}@@@`;
  });

  // 2. Tách và bảo vệ Inline Code (`...`)
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(escapeHtml(code));
    return `@@@TELEGRAM_INLINE_CODE_${idx}@@@`;
  });

  // 3. Tạm thời chuyển <br> thành token để không làm gãy dòng của Markdown Table
  text = text.replace(/<br\s*\/?>/gi, '@@@TELEGRAM_BR@@@');

  // 4. Thoát tất cả ký tự HTML lạ (&, <, >) trong văn bản thông thường
  text = escapeHtml(text);

  // 5. Xử lý Markdown Tables thành danh sách khối dễ đọc và đẹp mắt trên mobile
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

  // 6. Chuyển đổi mọi @@@TELEGRAM_BR@@@ còn lại thành \n
  text = text.replace(/@@@TELEGRAM_BR@@@/g, '\n');

  // 7. Chuyển đổi Markdown links: [title](url)
  // Chỉ chấp nhận https?:// và tg://; file:// thì hiển thị code text
  text = text.replace(/\[([^\]]+)\]\((file:\/\/[^\)]+)\)/g, '<code>$1</code>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2">$1</a>');

  // 8. Headers (#, ##, ###, ####)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+(.+)$/gm, '\n<b>$1</b>');

  // 9. Horizontal rules (---, ***)
  text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '────────────────────');

  // 10. Bold (**text** hoặc __text__)
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  text = text.replace(/__(.*?)__/g, '<b>$1</b>');

  // 11. Italic (*text* hoặc _text_)
  text = text.replace(/(?<![a-zA-Z0-9])\*([^*\n]+)\*(?![a-zA-Z0-9])/g, '<i>$1</i>');

  // 12. Strikethrough (~~text~~)
  text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // 13. Phục hồi Code Blocks & Inline Code
  text = text.replace(/@@@TELEGRAM_CODE_BLOCK_(\d+)@@@/g, (m, idx) => {
    const item = codeBlocks[Number(idx)];
    if (!item) return '';
    return `\n<pre>${item.code}</pre>\n`;
  });

  text = text.replace(/@@@TELEGRAM_INLINE_CODE_(\d+)@@@/g, (m, idx) => {
    return `<code>${inlineCodes[Number(idx)] || ''}</code>`;
  });

  // 14. Dọn dẹp các thẻ b lồng nhau nếu có
  text = text.replace(/<b>\s*<b>(.*?)<\/b>\s*<\/b>/gi, '<b>$1</b>');

  // 15. Làm sạch các thẻ HTML không hợp lệ mà Telegram không hỗ trợ
  // Telegram chỉ hỗ trợ: b, strong, i, em, u, ins, s, strike, del, span, tg-spoiler, a, code, pre, blockquote
  text = text.replace(/<(?!(\/?(b|strong|i|em|u|ins|s|strike|del|span|tg-spoiler|a|code|pre|blockquote)(\s+[^>]*)?))\/?([a-zA-Z0-9_-]+)[^>]*>/gi, '');

  // 16. Làm sạch các dòng trống dư thừa
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// Chia nhỏ văn bản an toàn nếu vượt quá giới hạn 4096 ký tự của Telegram
function splitTextIntoChunks(text, maxChunkLength = 3800) {
  if (!text || text.length <= maxChunkLength) return [text || ''];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkLength) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf('\n\n', maxChunkLength);
    if (splitIdx < maxChunkLength - 800) {
      splitIdx = remaining.lastIndexOf('\n', maxChunkLength);
    }
    if (splitIdx < maxChunkLength - 800) {
      splitIdx = maxChunkLength;
    }

    chunks.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }

  return chunks;
}

// Bàn phím nút bấm thao tác nhanh dưới tin nhắn Telegram
const TASK_ACTIONS_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '⚡ Tiến độ (Log)', callback_data: '/log' },
      { text: '📋 Hàng đợi', callback_data: '/queue' },
      { text: '🛑 Hủy task', callback_data: '/cancel' },
    ],
    [
      { text: '📊 Git Status', callback_data: '/status' },
      { text: '📁 Git Diff', callback_data: '/diff' },
    ],
    [
      { text: '🌐 Mở Dev Web', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
      { text: '🚀 Mở Pro Web', url: 'https://logistics-website-frontend-kappa.vercel.app' },
    ],
  ],
};

// Đăng ký danh sách menu lệnh nhanh (Bot Commands) trên ứng dụng Telegram
async function registerBotCommands() {
  try {
    const commands = [
      { command: 'proweb', description: '🚀 Mở nhanh Web Production (Pro)' },
      { command: 'devweb', description: '🌐 Mở nhanh Web Development (Dev)' },
      { command: 'fix', description: '🔧 Sửa lỗi tính năng (giữ nguyên kiến trúc)' },
      { command: 'task', description: '🚀 Giao task / tính năng mới' },
      { command: 'continue', description: '🔄 Tiếp tục phiên làm việc trước' },
      { command: 'log', description: '⚡ Xem tiến độ & nhật ký agy đang chạy' },
      { command: 'status', description: '📊 Trạng thái Git (branch & uncommitted)' },
      { command: 'diff', description: '📁 Xem code vừa sửa (git diff --stat)' },
      { command: 'queue', description: '📋 Xem hàng đợi tác vụ' },
      { command: 'clearqueue', description: '🗑️ Xóa sạch hàng đợi tác vụ' },
      { command: 'cancel', description: '🛑 Hủy task đang chạy' },
      { command: 'help', description: 'ℹ️ Hướng dẫn sử dụng & danh sách lệnh' },
    ];

    const res = await fetch(`${API_BASE}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log('✅ Đã đăng ký thành công danh sách lệnh Bot Commands với Telegram.');
    } else {
      console.warn('⚠️ Cảnh báo: setMyCommands thất bại:', data.description);
    }
  } catch (err) {
    console.warn('⚠️ Cảnh báo: Không thể gọi setMyCommands:', err.message);
  }
}

// Gửi 1 message Telegram đơn lẻ với fallback tự bóc HTML nếu Telegram parse thất bại
async function sendSingleTelegramMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram sendMessage error:', data);
      // Fallback an toàn tuyệt đối: bóc sạch mọi thẻ HTML và gửi text thuần
      if (parseMode) {
        const plainText = text.replace(/<[^>]+>/g, '').slice(0, 4000);
        await fetch(`${API_BASE}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: plainText, reply_markup: replyMarkup }),
        });
      }
    }
    return data;
  } catch (err) {
    console.error('sendSingleTelegramMessage failed:', err.message);
  }
}

// Gửi tin nhắn Telegram (tự động phân chunk nếu vượt quá giới hạn độ dài, gắn phím bấm vào chunk cuối)
async function sendTelegramMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  if (!text) return null;
  const chunks = splitTextIntoChunks(text, 3800);
  let lastResult = null;
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    lastResult = await sendSingleTelegramMessage(chatId, chunks[i], parseMode, isLast ? replyMarkup : null);
  }
  return lastResult;
}

// Sửa trực tiếp nội dung tin nhắn Telegram đã gửi (dùng cho cơ chế Live Update tiến độ 30s)
async function editTelegramMessage(chatId, messageId, text, parseMode = 'HTML', replyMarkup = null) {
  if (!messageId || !text) return null;
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text.slice(0, 4000),
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${API_BASE}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      // Bỏ qua lỗi nếu message chưa thay đổi
      if (data.description && data.description.includes('message is not modified')) {
        return data;
      }
      console.warn('Telegram editMessageText non-ok:', data.description);
    }
    return data;
  } catch (err) {
    console.error('editTelegramMessage failed:', err.message);
  }
}

// Tải file ảnh từ Telegram về máy local
async function downloadTelegramFile(fileId, defaultExt = '.png') {
  const getFileUrl = `${API_BASE}/getFile?file_id=${fileId}`;
  const res = await fetch(getFileUrl);
  const data = await res.json();
  if (!data.ok || !data.result.file_path) {
    throw new Error(`Cannot get file_path: ${JSON.stringify(data)}`);
  }

  const remotePath = data.result.file_path;
  const ext = path.extname(remotePath) || defaultExt;
  const filename = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
  const localFilePath = path.join(IMAGES_DIR, filename);

  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${remotePath}`;
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to download image from Telegram: ${fileRes.statusText}`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
  return localFilePath;
}

// Lấy trạng thái Git của cả 3 repository
function getGitStatusSummary() {
  try {
    const rootStatus = execSync('git status -sb', { cwd: WORKSPACE_DIR, encoding: 'utf-8' }).trim();
    let backendStatus = '';
    let frontendStatus = '';

    const backendDir = path.join(WORKSPACE_DIR, 'backend');
    if (fs.existsSync(backendDir)) {
      backendStatus = execSync('git status -sb', { cwd: backendDir, encoding: 'utf-8' }).trim();
    }

    const frontendDir = path.join(WORKSPACE_DIR, 'frontend');
    if (fs.existsSync(frontendDir)) {
      frontendStatus = execSync('git status -sb', { cwd: frontendDir, encoding: 'utf-8' }).trim();
    }

    return (
      `<b>📁 Root Repo:</b>\n<code>${escapeHtml(rootStatus)}</code>\n\n` +
      `<b>⚙️ Backend (Submodule):</b>\n<code>${escapeHtml(backendStatus)}</code>\n\n` +
      `<b>💻 Frontend (Submodule):</b>\n<code>${escapeHtml(frontendStatus)}</code>`
    );
  } catch (err) {
    return `❌ Lỗi khi lấy Git status: ${escapeHtml(err.message)}`;
  }
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
    if (rootDiff) result += `Root:\n${rootDiff}\n`;
    if (backendDiff) result += `Backend:\n${backendDiff}\n`;
    if (frontendDiff) result += `Frontend:\n${frontendDiff}\n`;

    return result.trim() ? result.trim() : null;
  } catch (err) {
    return null;
  }
}

// Trích xuất n dòng log cuối từ buffer (loại bỏ escape code ANSI màu)
function getTailLog(buffer, maxLines = 6) {
  if (!buffer) return '';
  const clean = buffer.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

// Phân tích thông minh: Nên bắt đầu Session mới sạch sẽ hay tiếp tục (--continue) phiên trước
function determineSessionStrategy(prompt, explicitMode, state) {
  // 1. Nếu người dùng dùng rõ lệnh /continue:
  if (explicitMode === 'continue') {
    const lastHistory = state.history && state.history[state.history.length - 1];
    if (lastHistory && lastHistory.completedAt) {
      const elapsedMins = (Date.now() - new Date(lastHistory.completedAt).getTime()) / 60000;
      if (elapsedMins > 30) {
        return {
          isContinue: false,
          reason: `Phiên trước đã dừng > ${Math.round(elapsedMins)} phút. Tự động mở session mới để tránh lỗi stale context.`,
          sessionBadge: '✨ Phiên mới (Auto-Reset)',
        };
      }
    }
    return {
      isContinue: true,
      reason: 'Lệnh /continue chỉ định tiếp tục phiên làm việc trước',
      sessionBadge: '🔄 Nối tiếp phiên trước',
    };
  }

  // 2. Nếu người dùng dùng lệnh /task: Luôn bắt đầu session mới 100% sạch sẽ
  if (explicitMode === 'task') {
    return {
      isContinue: false,
      reason: 'Lệnh /task luôn bắt đầu phiên mới sạch (Zero Context Bloat)',
      sessionBadge: '✨ Phiên mới (Clean)',
    };
  }

  // 3. Với lệnh /fix hoặc tin nhắn thông thường / caption ảnh:
  const lower = (prompt || '').toLowerCase();
  const continueKeywords = [
    'tiếp tục', 'làm tiếp', 'sửa tiếp', 'tiếp theo', 'bổ sung thêm',
    'vừa nãy', 'cái nãy', 'chỗ vừa rồi', 'vừa làm', 'sửa lại cái đó',
    'đổi lại thành', 'bước tiếp', 'tiếp nha', 'làm nốt'
  ];

  const hasContinueKeyword = continueKeywords.some((kw) => lower.includes(kw));

  const lastHistory = state.history && state.history[state.history.length - 1];
  let isRecent = false;
  if (lastHistory && lastHistory.completedAt) {
    const elapsedMins = (Date.now() - new Date(lastHistory.completedAt).getTime()) / 60000;
    isRecent = elapsedMins <= 10; // Trong vòng 10 phút
  }

  if (hasContinueKeyword && isRecent) {
    return {
      isContinue: true,
      reason: 'Phát hiện từ khóa nối tiếp công việc vừa làm (<10 phút)',
      sessionBadge: '🔄 Nối tiếp phiên trước',
    };
  }

  // Mặc định cho mọi trường hợp: Khởi tạo Session mới sạch sẽ
  return {
    isContinue: false,
    reason: 'Mặc định phiên mới (Tối ưu tốc độ, zero context bloat)',
    sessionBadge: '✨ Phiên mới (Clean)',
  };
}

// Trích xuất thông tin tiến độ và hành động mới nhất của Antigravity AI từ brain transcript
function getLatestAgyProgress(taskStartTime = 0, isContinue = false) {
  let stepInfo = null;
  let totalSteps = 0;

  try {
    const brainDir = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain');
    if (fs.existsSync(brainDir)) {
      const entries = fs.readdirSync(brainDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== 'tempmediaStorage')
        .map((d) => {
          const full = path.join(brainDir, d.name);
          try {
            return { name: d.name, mtime: fs.statSync(full).mtimeMs, full };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.mtime - a.mtime);

      if (entries.length > 0) {
        const newest = entries[0];
        // Chỉ lấy transcript nếu là phiên continue HOẶC thư mục này được tạo/sửa trong phiên chạy hiện tại
        const isCurrentSessionFolder = isContinue || (taskStartTime > 0 && newest.mtime >= taskStartTime - 3000);

        if (isCurrentSessionFolder) {
          const transcriptPath = path.join(newest.full, '.system_generated', 'logs', 'transcript.jsonl');
          if (fs.existsSync(transcriptPath)) {
            const raw = fs.readFileSync(transcriptPath, 'utf-8');
            const lines = raw.trim().split(/\r?\n/).filter(Boolean);
            totalSteps = lines.length;

            for (let i = lines.length - 1; i >= Math.max(0, lines.length - 20); i--) {
              try {
                const item = JSON.parse(lines[i]);
                if (item.tool_calls && Array.isArray(item.tool_calls) && item.tool_calls.length > 0) {
                  const tc = item.tool_calls[0];
                  const toolName = tc.name || 'tool';
                  const action = tc.args?.toolAction || tc.args?.toolSummary || tc.args?.CommandLine || '';
                  stepInfo = {
                    stepIndex: item.step_index || i,
                    toolName,
                    action: typeof action === 'string' ? action.replace(/^"|"$/g, '') : '',
                  };
                  break;
                }
              } catch {}
            }
          }
        }
      }
    }
  } catch (err) {
    // Không làm gián đoạn nếu đọc transcript gặp trục trặc
  }

  return { stepInfo, totalSteps };
}

// Xây dựng prompt kèm Leader skill và AGENTS.md cho Antigravity AI
function buildTaskPrompt(rawPrompt, imagePaths = [], taskMode = 'task') {
  let modeSpecificPrompt = '';
  if (taskMode === 'fix') {
    modeSpecificPrompt = `
[CHẾ ĐỘ SỬA LỖI - FIX BUG MODE]:
- ĐÂY LÀ TÍNH NĂNG ĐÃ HOẠT ĐỘNG NHƯNG BỊ LỖI, CRASH, TRÀN LAYOUT HOẶC SAI DỮ LIỆU.
- NHIỆM VUY DUY NHẤT LÀ SỬA LỖI: Tuyệt đối KHÔNG viết lại toàn bộ tính năng, KHÔNG thay đổi cấu trúc kiến trúc lớn, KHÔNG tự ý sửa logic nghiệp vụ ngoài phạm vi lỗi.
- TẬP TRUNG TÌM NGUYÊN NHÂN GỐC RỄ (Root Cause) và thực hiện sửa chữa chính xác (surgical fix) đúng file/component bị lỗi.
- Đảm bảo tính tương thích ngược, không làm hỏng các tính năng xung quanh.
- Dòng đầu tiên của kết quả BẮT BUỘC là: "🟢 HOÀN THÀNH (SỬA LỖI): [Mô tả ngắn lỗi và nguyên nhân đã fix]".
`;
  }

  let promptText = `
BẮT BUỘC KÍCH HOẠT VAI TRÒ TMS DOMAIN LEAD:
1. Bạn BẮT BUỘC đọc và tuân thủ file AGENTS.md, skill .agents/skills/leader/SKILL.md và skill .agents/skills/telegram-task-responder/SKILL.md tại workspace c:\\Projects\\logistics-website.
2. Bạn đóng vai trò là Leader / Kỹ sư trưởng của hệ thống Logistics TMS (Spider Express). Mọi thông tin về môi trường Dev/Pro (Domain Dev: Vercel https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app, Render https://logistics-website-backend-1jho.onrender.com, Swagger https://logistics-website-backend-1jho.onrender.com/docs), Git submodules, RBAC, và quy tắc nghiệp vụ đều nằm trong AGENTS.md và skill leader.
3. TUYỆT ĐỐI KHÔNG CHÀO HỎI VU VƠ, KHÔNG NÉ TRÁNH, KHÔNG TRẢ LỜI KIỂU CHATBOT LÝ THUYẾT ("Chào bạn tôi có thể giúp gì...").
4. BẮT TAY THỰC THI NGAY: Hãy sử dụng các công cụ trong workspace (chạy lệnh powershell/curl để test kết nối, đọc file mã nguồn, sửa file code, chạy test) để giải quyết dứt điểm yêu cầu dưới đây:
${modeSpecificPrompt}
5. NGUYÊN TẮC TRẢ LỜI TELEGRAM (BẮT BUỘC - GỌN GÀNG, ĐÚNG TRỌNG TÂM):
- Dòng đầu tiên BẮT BUỘC là Badge trạng thái + kết luận 1 câu (ví dụ: 🟢 HOÀN THÀNH: ..., 🔴 THẤT BẠI: ..., ℹ️ TRẠNG THÁI: ...).
- Trả lời trực diện vào kết quả hoặc câu hỏi, không lan man, không triết lý.
- TUYỆT ĐỐI KHÔNG mở bài máy móc (không "Tôi đã tiếp nhận và đang...", không "Chào bạn...", không lặp lại câu hỏi của người dùng).
- TUYỆT ĐỐI KHÔNG KẾT BÀI VU VƠ Ở CUỐI: Cấm viết bất kỳ câu kết luận thừa thãi, slogan, lời cảm ơn hay câu hỏi tiếp theo (CẤM viết những câu như "Hệ thống đã được tối ưu...", "Hệ thống đã sẵn sàng...", "Bạn muốn thực hiện bước nào tiếp theo...", "Nếu bạn cần thêm hỗ trợ...").
- Báo cáo xong đúng kết quả là DỪNG LẠI NGAY LẬP TỨC.
- TUYỆT ĐỐI KHÔNG xuất hàng trăm dòng mã nguồn vào câu trả lời Telegram; chỉ trích dẫn diff ngắn (tối đa 15-20 dòng) và tên file kèm link.
- Nếu yêu cầu là kiểm tra/tra cứu thông tin (như kiểm tra server, kiểm tra git, tra cứu code), hãy kiểm tra trực tiếp và trả lời ngay, TUYỆT ĐỐI KHÔNG tự ý chạy toàn bộ quy trình build dự án (nest build / next build) gây tốn thời gian.
- Dùng gạch đầu dòng ngắn, bảng biểu nhỏ gọn, trạng thái rõ ràng (PASS/FAIL/READY, số liệu cụ thể) để tối ưu cho việc đọc nhanh trên điện thoại.

YÊU CẦU CỦA NGƯỜI DÙNG:
"${rawPrompt}"
`.trim();

  if (imagePaths && imagePaths.length > 0) {
    const listImages = imagePaths.map((p, idx) => `  - Ảnh đính kèm ${idx + 1}: ${p}`).join('\n');
    promptText += `\n\n[HÌNH ẢNH GIAO DIỆN / LỖI ĐÍNH KÈM]:
Người dùng gửi kèm ${imagePaths.length} hình ảnh:
${listImages}

HƯỚNG DẪN BẮT BUỘC:
- Dùng công cụ view_file để đọc và quan sát chi tiết từng hình ảnh trên.
- Phân tích lỗi hiển thị, chi tiết sai lệch trong ảnh và đối chiếu với mã nguồn để sửa chữa chuẩn xác theo quy định compact UI trong AGENTS.md.`;
  }

  promptText += `\n\nHãy tiến hành thực thi bằng các công cụ và báo cáo kết quả chi tiết, rõ ràng, có căn cứ kỹ thuật cho người dùng.`;
  return promptText;
}

// Điều phối thực thi task tiếp theo từ hàng đợi (lấy từ RAM và đồng bộ đĩa cứng)
async function processNextQueueItem() {
  if (currentTask || taskQueue.length === 0) return;

  const next = taskQueue.shift();
  saveQueueState(queueState); // Cập nhật hàng đợi đĩa cứng ngay sau khi lấy task ra

  let modeLabel = 'Task mới';
  if (next.taskMode === 'fix') modeLabel = '🔧 Sửa lỗi (Fix Bug)';
  else if (next.taskMode === 'continue') modeLabel = '🔄 Tiếp tục';

  await sendTelegramMessage(
    next.chatId,
    `▶️ <b>Bắt đầu thực thi [${modeLabel}] từ hàng đợi (còn lại ${taskQueue.length} task)...</b>`
  );
  await runAgyTask(next.chatId, next.rawPrompt, next.imagePaths, next.taskMode, next.id);
}

// Đẩy task vào hàng đợi hoặc chạy ngay nếu bot đang rảnh (lưu đĩa cứng tức thì)
async function enqueueTask(chatId, rawPrompt, imagePathsOrContinue = [], maybeTaskMode = 'task') {
  let imagePaths = [];
  let taskMode = 'task';

  if (typeof imagePathsOrContinue === 'boolean') {
    taskMode = imagePathsOrContinue ? 'continue' : (maybeTaskMode || 'task');
    imagePaths = Array.isArray(arguments[3]) ? arguments[3] : [];
  } else if (Array.isArray(imagePathsOrContinue)) {
    imagePaths = imagePathsOrContinue;
    taskMode = maybeTaskMode || 'task';
  } else {
    taskMode = maybeTaskMode || 'task';
  }

  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const taskItem = {
    id: taskId,
    chatId,
    rawPrompt,
    taskMode,
    imagePaths,
    timestamp: Date.now(),
  };

  if (currentTask) {
    taskQueue.push(taskItem);
    saveQueueState(queueState); // Lưu ngay lập tức vào file task-queue.json

    const queuePos = taskQueue.length;
    let modeLabel = 'Task mới';
    if (taskMode === 'fix') modeLabel = '🔧 Sửa lỗi (Fix Bug)';
    else if (taskMode === 'continue') modeLabel = '🔄 Tiếp tục';

    await sendTelegramMessage(
      chatId,
      `📥 <b>Đã lưu vào hàng đợi (#${queuePos}) - [${modeLabel}]</b>\n\n` +
      `📝 <i>${escapeHtml(rawPrompt)}</i>${imagePaths.length > 0 ? ` <i>(${imagePaths.length} ảnh)</i>` : ''}\n\n` +
      `💾 <i>Đã lưu xuống file vật lý (task-queue.json) - an toàn tuyệt đối khi bot restart!</i>`,
      'HTML',
      TASK_ACTIONS_KEYBOARD
    );
    return;
  }

  await runAgyTask(chatId, rawPrompt, imagePaths, taskMode, taskId);
}

// Thực thi task qua Antigravity CLI (agy)
async function runAgyTask(chatId, rawPrompt, imagePaths = [], taskMode = 'task', taskId = null) {
  const sessionStrategy = determineSessionStrategy(rawPrompt, taskMode, queueState);
  const isContinue = sessionStrategy.isContinue;
  const startTime = Date.now();
  const id = taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const finalPrompt = buildTaskPrompt(rawPrompt, imagePaths, taskMode);

  let taskBadge = '🚀 Task mới';
  if (taskMode === 'fix') {
    taskBadge = '🔧 Sửa lỗi (Fix Bug)';
  } else if (taskMode === 'continue') {
    taskBadge = '🔄 Tiếp tục';
  }

  const startMsg =
    `⏳ <b>[${taskBadge}] Đang thực thi...</b> <code>(⏱️ 0s)</code>\n` +
    `⚙️ <b>Ngữ cảnh:</b> <i>${sessionStrategy.sessionBadge}</i> <code>(${escapeHtml(sessionStrategy.reason)})</code>\n\n` +
    `📝 <i>${escapeHtml(rawPrompt)}</i>${imagePaths.length > 0 ? ` <i>(${imagePaths.length} ảnh)</i>` : ''}\n\n` +
    `💡 <i>Tự động cập nhật mỗi 30s | Bấm <b>[⚡ Tiến độ]</b> bên dưới để tra cứu ngay.</i>`;
  const sentStartRes = await sendTelegramMessage(chatId, startMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
  const progressMessageId = sentStartRes?.result?.message_id || null;

  // Chuẩn bị tham số gọi agy (luôn gắn --add-dir vào workspace)
  const args = [
    '--add-dir', WORKSPACE_DIR,
    '--dangerously-skip-permissions',
    '--print', finalPrompt,
    '--print-timeout', '30m'
  ];

  if (isContinue) {
    args.unshift('--continue');
  }

  if (AGY_MODEL) {
    args.push('--model', AGY_MODEL);
  }

  console.log(`[Task Start] [${taskBadge}] [ID: ${id}] [Session: ${sessionStrategy.sessionBadge}] Executing agy in ${WORKSPACE_DIR} (Images: ${imagePaths.length})`);

  // Bật hiệu ứng "đang gõ..." liên tục trên Telegram để người dùng biết bot đang hoạt động
  const typingInterval = setInterval(async () => {
    try {
      await fetch(`${API_BASE}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      });
    } catch {}
  }, 4000);

  const child = spawn(AGY_BIN, args, {
    cwd: WORKSPACE_DIR,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env },
  });

  currentTask = {
    id,
    chatId,
    rawPrompt,
    taskMode,
    taskBadge,
    startTime,
    isContinue,
    process: child,
    imagePaths,
    status: 'running',
    progressMessageId,
    stdoutBuffer: '',
    stderrBuffer: '',
  };

  // Cập nhật trạng thái running xuống file vật lý
  queueState.currentTask = currentTask;
  saveQueueState(queueState);

  let stdoutBuffer = '';
  let stderrBuffer = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutBuffer += text;
    if (currentTask) currentTask.stdoutBuffer = (currentTask.stdoutBuffer || '') + text;
    process.stdout.write(text);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    stderrBuffer += text;
    if (currentTask) currentTask.stderrBuffer = (currentTask.stderrBuffer || '') + text;
    process.stderr.write(text);
  });

  // Live Progress Heartbeat: Cập nhật tin nhắn tiến độ trực tiếp mỗi 30s
  const progressInterval = setInterval(async () => {
    if (!currentTask || !currentTask.progressMessageId) return;

    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

      const { stepInfo, totalSteps } = getLatestAgyProgress(startTime, isContinue);
      const tail = getTailLog(currentTask.stdoutBuffer || stdoutBuffer, 5);

      let progressText =
        `⏳ <b>[${taskBadge}] Đang thực thi...</b> <code>(⏱️ ${timeStr})</code>\n\n` +
        `📝 <i>${escapeHtml(rawPrompt.length > 120 ? rawPrompt.slice(0, 117) + '...' : rawPrompt)}</i>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n`;

      if (stepInfo) {
        progressText += `📍 <b>Bước hiện tại (#${stepInfo.stepIndex}):</b> <code>${escapeHtml(stepInfo.toolName)}</code>\n`;
        if (stepInfo.action) {
          progressText += `⚡ <i>${escapeHtml(stepInfo.action)}</i>\n`;
        }
      } else {
        progressText += `📍 <b>Ngữ cảnh:</b> <i>${sessionStrategy.sessionBadge}</i>\n`;
      }

      if (tail) {
        progressText += `\n📄 <b>Nhật ký gần nhất:</b>\n<pre>${escapeHtml(tail)}</pre>\n`;
      } else {
        progressText += `\n⚙️ <i>Tiến trình đang khởi chạy và kiểm tra workspace...</i>\n`;
      }

      progressText += `\n💡 <i>Tự động cập nhật mỗi 30s | Bấm các nút bên dưới để thao tác</i>`;

      await editTelegramMessage(chatId, currentTask.progressMessageId, progressText, 'HTML', TASK_ACTIONS_KEYBOARD);
    } catch (err) {
      console.warn('Progress update interval error:', err.message);
    }
  }, 30000);

  child.on('close', async (code) => {
    clearInterval(typingInterval);
    clearInterval(progressInterval);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const m = Math.floor(duration / 60);
    const s = duration % 60;
    const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

    console.log(`[Task End] Process exited with code ${code} (${timeStr})`);

    const wasCancelled = currentTask?.wasCancelled;
    const targetMsgId = currentTask?.progressMessageId || progressMessageId;
    
    // Ghi vào lịch sử và xóa currentTask trên file vật lý
    if (currentTask) {
      queueState.history.push({
        id: currentTask.id,
        rawPrompt: currentTask.rawPrompt || rawPrompt,
        taskMode: currentTask.taskMode || taskMode,
        exitCode: code,
        duration: timeStr,
        completedAt: new Date().toISOString(),
        status: wasCancelled ? 'cancelled' : (code === 0 ? 'completed' : 'failed'),
      });
    }
    currentTask = null;
    queueState.currentTask = null;
    saveQueueState(queueState);

    // Cập nhật trạng thái hoàn thành vào tin nhắn tiến độ trực tiếp
    if (targetMsgId) {
      const finishBadge = wasCancelled
        ? `🛑 <b>[${taskBadge}] Đã bị hủy bởi người dùng</b> <code>(⏱️ ${timeStr})</code>`
        : (code === 0
            ? `✅ <b>[${taskBadge}] Đã hoàn thành!</b> <code>(⏱️ ${timeStr})</code>`
            : `❌ <b>[${taskBadge}] Kết thúc với lỗi (Mã: ${code})</b> <code>(⏱️ ${timeStr})</code>`);
      await editTelegramMessage(chatId, targetMsgId, finishBadge, 'HTML');
    }

    if (wasCancelled) {
      await sendTelegramMessage(chatId, `🛑 <b>Task đã bị hủy bởi người dùng!</b> (⏱️ ${timeStr})`, 'HTML', TASK_ACTIONS_KEYBOARD);
    } else if (code === 0) {
      let cleanOutput = stdoutBuffer.trim();

      // Loại bỏ các câu mở đầu máy móc thừa nếu có
      cleanOutput = cleanOutput.replace(/^(Tôi đã tiếp nhận.*?\n+|Chào bạn.*?\n+)/gi, '').trim();

      // Loại bỏ triệt để mọi câu kết vu vơ, câu hỏi tiếp theo, slogan thừa ở cuối
      cleanOutput = cleanOutput.replace(/(\n+.*?(Bạn muốn thực hiện bước nào|Hệ thống đã sẵn sàng|Hệ thống đã được tối ưu|Chúc bạn|Nếu bạn cần thêm|Vui lòng cho tôi biết|Bạn có muốn)[\s\S]*$)/gi, '').trim();

      // Giới hạn an toàn tối đa nếu output quá khổng lồ (> 12000 ký tự ~ 3 tin nhắn Telegram)
      if (cleanOutput.length > 12000) {
        cleanOutput = cleanOutput.slice(0, 11500) + '\n\n...<i>[Nội dung quá dài, đã rút gọn để tránh spam Telegram]</i>';
      }

      // Chuyển đổi Markdown sang định dạng Telegram HTML chuẩn
      const formattedHtml = markdownToTelegramHtml(cleanOutput);

      let messageText = `🎯 <b>KẾT QUẢ THỰC HIỆN</b> <i>(⏱️ ${timeStr})</i>\n\n${formattedHtml}`;

      const diffStat = getGitDiffStat();
      if (diffStat) {
        messageText += `\n\n📁 <b>Files thay đổi:</b>\n<pre>${escapeHtml(diffStat)}</pre>`;
      }

      await sendTelegramMessage(chatId, messageText, 'HTML', TASK_ACTIONS_KEYBOARD);
    } else {
      const errorMsg = (stderrBuffer || stdoutBuffer).trim().slice(-600) || `Exit code ${code}`;
      await sendTelegramMessage(
        chatId,
        `❌ <b>TASK LỖI (Mã: ${code} - ⏱️ ${timeStr})</b>\n\n<pre>${escapeHtml(errorMsg)}</pre>`,
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
    }

    // Tự động kiểm tra và thực thi task kế tiếp trong hàng đợi sau 1s
    setTimeout(() => {
      processNextQueueItem();
    }, 1000);
  });

  child.on('error', async (err) => {
    clearInterval(typingInterval);
    clearInterval(progressInterval);
    console.error('[Task Error]', err);
    if (currentTask) {
      queueState.history.push({
        id: currentTask.id,
        rawPrompt: currentTask.rawPrompt || rawPrompt,
        taskMode: currentTask.taskMode || taskMode,
        error: err.message,
        status: 'error',
        completedAt: new Date().toISOString(),
      });
    }
    currentTask = null;
    queueState.currentTask = null;
    saveQueueState(queueState);

    await sendTelegramMessage(
      chatId,
      `💥 <b>Không thể khởi chạy Antigravity CLI!</b>\n\n<code>${escapeHtml(err.message)}</code>`,
      'HTML',
      TASK_ACTIONS_KEYBOARD
    );

    setTimeout(() => {
      processNextQueueItem();
    }, 1000);
  });
}

// Xử lý hủy task
async function cancelCurrentTask(chatId) {
  if (!currentTask || !currentTask.process) {
    if (taskQueue.length > 0) {
      const count = taskQueue.length;
      taskQueue.length = 0;
      saveQueueState(queueState);
      await sendTelegramMessage(chatId, `🗑️ Đã xóa sạch <b>${count}</b> task trong hàng đợi (đã đồng bộ file vật lý).`, 'HTML', TASK_ACTIONS_KEYBOARD);
    } else {
      await sendTelegramMessage(chatId, 'ℹ️ Hiện tại không có task nào đang chạy hoặc chờ.', 'HTML', TASK_ACTIONS_KEYBOARD);
    }
    return;
  }

  try {
    currentTask.wasCancelled = true;
    const pid = currentTask.process.pid;
    console.log(`[Task Cancel] Killing PID: ${pid}`);

    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`);
    } else {
      currentTask.process.kill('SIGTERM');
    }

    await sendTelegramMessage(
      chatId,
      `🛑 <b>Đã gửi lệnh hủy task:</b> <i>${escapeHtml(currentTask.rawPrompt || currentTask.prompt)}</i>`,
      'HTML',
      TASK_ACTIONS_KEYBOARD
    );
  } catch (err) {
    console.error('Error cancelling task:', err.message);
    await sendTelegramMessage(chatId, `⚠️ Lỗi khi hủy task: ${escapeHtml(err.message)}`, 'HTML', TASK_ACTIONS_KEYBOARD);
  }
}

// Trích xuất file_id ảnh tốt nhất từ message (photo hoặc document ảnh)
function extractPhotoFileId(msg) {
  if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
    // Phần tử cuối cùng trong mảng photo là ảnh có độ phân giải cao nhất
    return msg.photo[msg.photo.length - 1].file_id;
  }
  if (msg.document && msg.document.mime_type?.startsWith('image/')) {
    return msg.document.file_id;
  }
  return null;
}

// Xử lý task gửi kèm ảnh sau khi gom đủ (cho cả ảnh đơn và album ảnh)
async function processTaskWithImages(chatId, rawCaption, fileIds) {
  let prompt = (rawCaption || '').trim();
  let taskMode = 'task';

  if (prompt.startsWith('/continue')) {
    taskMode = 'continue';
    prompt = prompt.replace(/^\/continue(@\w+)?\s*/i, '').trim();
  } else if (prompt.startsWith('/fix')) {
    taskMode = 'fix';
    prompt = prompt.replace(/^\/fix(@\w+)?\s*/i, '').trim();
  } else if (prompt.startsWith('/task')) {
    taskMode = 'task';
    prompt = prompt.replace(/^\/task(@\w+)?\s*/i, '').trim();
  }

  // Nếu người dùng không nhập caption
  if (!prompt) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Đã nhận được ${fileIds.length} ảnh, nhưng chưa có mô tả yêu cầu!</b>\n\n` +
      `💡 Bạn vui lòng gửi lại ảnh kèm chú thích (caption) mô tả những gì cần làm.\n` +
      `Ví dụ sửa lỗi: <code>/fix Bị tràn ngang nút bấm và sai padding như trong ảnh</code>\n` +
      `Ví dụ tính năng mới: <code>/task Thêm bộ lọc trạng thái xe như mockup</code>`,
      'HTML',
      TASK_ACTIONS_KEYBOARD
    );
    return;
  }

  // Tải các ảnh về máy local
  await sendTelegramMessage(chatId, `📥 Đang tải ${fileIds.length} ảnh đính kèm vào workspace...`);
  const downloadedPaths = [];
  for (const fid of fileIds) {
    try {
      const localPath = await downloadTelegramFile(fid);
      downloadedPaths.push(localPath);
    } catch (err) {
      console.error('Failed to download photo:', err.message);
    }
  }

  if (downloadedPaths.length === 0) {
    await sendTelegramMessage(chatId, '❌ Không thể tải ảnh từ Telegram. Vui lòng thử lại!');
    return;
  }

  // Thực thi task kèm ảnh qua hàng đợi
  await enqueueTask(chatId, prompt, downloadedPaths, taskMode);
}

// Xử lý tin nhắn đến
async function handleMessage(msg) {
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();
  const caption = (msg.caption || '').trim();

  // Kiểm tra bảo mật Chat ID
  if (ALLOWED_CHAT_ID && chatId !== String(ALLOWED_CHAT_ID)) {
    console.warn(`[Security Warning] Message from unauthorized chat_id: ${chatId}`);
    return;
  }

  const photoFileId = extractPhotoFileId(msg);

  // 1. Trường hợp người dùng gửi ẢNH (Ảnh chụp màn hình, ảnh bug, ảnh thiết kế)
  if (photoFileId) {
    const mediaGroupId = msg.media_group_id;

    if (mediaGroupId) {
      // Gom nhóm album ảnh (Media Group)
      if (!mediaGroupBuffers.has(mediaGroupId)) {
        mediaGroupBuffers.set(mediaGroupId, {
          chatId,
          photos: [photoFileId],
          caption: caption || '',
          timer: setTimeout(async () => {
            const groupData = mediaGroupBuffers.get(mediaGroupId);
            mediaGroupBuffers.delete(mediaGroupId);
            if (groupData) {
              await processTaskWithImages(groupData.chatId, groupData.caption, groupData.photos);
            }
          }, 1500), // Đợi 1.5s để gom đủ các ảnh trong album
        });
      } else {
        const groupData = mediaGroupBuffers.get(mediaGroupId);
        groupData.photos.push(photoFileId);
        if (!groupData.caption && caption) {
          groupData.caption = caption;
        }
      }
      return;
    }

    // Ảnh đơn lẻ
    await processTaskWithImages(chatId, caption, [photoFileId]);
    return;
  }

  // 2. Trường hợp tin nhắn văn bản thông thường
  if (!text) return;

  console.log(`[Telegram Msg] [${msg.chat.title || msg.from?.username || chatId}]: ${text}`);

  if (text.startsWith('/start') || text.startsWith('/help')) {
    const helpMsg =
      `🤖 <b>ANTIGRAVITY AI TASK RUNNER</b>\n` +
      `<i>Hệ thống điều khiển AI Agent tự động code từ xa qua Telegram.</i>\n\n` +
      `📌 <b>DANH SÁCH LỆNH & CÁCH GIAO TASK:</b>\n\n` +
      `🖼️ <b>GIAO TASK KÈM HÌNH ẢNH (Khuyên dùng):</b>\n` +
      `<i>Gửi trực tiếp ảnh chụp màn hình bug / giao diện vào nhóm, kèm dòng chú thích (caption) mô tả yêu cầu.</i>\n` +
      `Ví dụ caption: <code>/fix Sửa nút bấm bị tràn màn hình như trong ảnh</code>\n` +
      `<i>AI sẽ tự động đọc và phân tích ảnh trước khi code!</i>\n\n` +
      `🔧 <code>/fix &lt;mô tả lỗi hoặc log&gt;</code>\n` +
      `<i><b>Chuyên sửa lỗi:</b> Dùng khi tính năng đã chạy nhưng gặp lỗi, crash, sai dữ liệu hoặc vỡ layout. AI sẽ tập trung tìm root cause và fix đúng lỗi, không đổi kiến trúc cũ.</i>\n\n` +
      `🚀 <code>/task &lt;yêu cầu&gt;</code>\n` +
      `<i><b>Task chung / Tính năng mới:</b> Làm thêm tính năng mới, module mới hoặc nâng cấp nghiệp vụ.</i>\n\n` +
      `🔄 <code>/continue &lt;yêu cầu&gt;</code>\n` +
      `<i>Tiếp tục phiên làm việc trước để sửa thêm hoặc bổ sung yêu cầu.</i>\n\n` +
      `⚡ <code>/log</code> (hoặc <code>/progress</code>)\n` +
      `<i>Xem tiến độ trực tiếp, bước công cụ AI đang chạy và log stdout mới nhất.</i>\n\n` +
      `📋 <code>/queue</code>\n` +
      `<i>Xem danh sách task đang chạy và các task đang chờ trong hàng đợi.</i>\n\n` +
      `🗑️ <code>/clearqueue</code>\n` +
      `<i>Xóa toàn bộ các task đang chờ trong hàng đợi.</i>\n\n` +
      `📊 <code>/status</code>\n` +
      `<i>Xem trạng thái Git branch & file thay đổi của cả 3 repository.</i>\n\n` +
      `📁 <code>/diff</code>\n` +
      `<i>Xem thống kê các dòng code vừa sửa gần nhất (git diff --stat).</i>\n\n` +
      `🚀 <code>/proweb</code> (hoặc <code>/pro</code>)\n` +
      `<i>Mở nhanh link Web Production (Pro) & Swagger API Docs.</i>\n\n` +
      `🌐 <code>/devweb</code> (hoặc <code>/dev</code>)\n` +
      `<i>Mở nhanh link Web Development (Dev) & Swagger API Docs.</i>\n\n` +
      `🛑 <code>/cancel</code>\n` +
      `<i>Hủy task đang chạy ngay lập tức.</i>\n\n` +
      `📂 <b>Workspace:</b> <code>${escapeHtml(WORKSPACE_DIR)}</code>`;

    await sendTelegramMessage(chatId, helpMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
    return;
  }

  // Lệnh /fix chuyên biệt: Sửa lỗi tính năng đã chạy nhưng gặp bug/crash/sai lệch
  if (text.startsWith('/fix')) {
    const prompt = text.replace(/^\/fix(@\w+)?\s*/i, '').trim();
    if (!prompt) {
      await sendTelegramMessage(
        chatId,
        '⚠️ <b>Thiếu nội dung lỗi cần fix!</b>\n\n' +
        'Cú pháp: <code>/fix &lt;mô tả lỗi hoặc dán log lỗi&gt;</code>\n' +
        'Ví dụ: <code>/fix Nút xác nhận nhập kho không bấm được khi chọn xe</code>\n\n' +
        '💡 <i>Chế độ /fix tập trung sửa dứt điểm lỗi của tính năng đã chạy, không viết lại hay thay đổi kiến trúc cũ.</i>',
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
      return;
    }
    await enqueueTask(chatId, prompt, [], 'fix');
    return;
  }

  if (text.startsWith('/task')) {
    const prompt = text.replace(/^\/task(@\w+)?\s*/i, '').trim();
    if (!prompt) {
      await sendTelegramMessage(
        chatId,
        '⚠️ <b>Thiếu nội dung task!</b>\n\nCú pháp: <code>/task &lt;nội dung yêu cầu&gt;</code>\nVí dụ: <code>/task Thêm validation số điện thoại khi tạo đơn</code>',
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
      return;
    }
    await enqueueTask(chatId, prompt, [], 'task');
    return;
  }

  if (text.startsWith('/continue')) {
    const prompt = text.replace(/^\/continue(@\w+)?\s*/i, '').trim();
    if (!prompt) {
      await sendTelegramMessage(
        chatId,
        '⚠️ <b>Thiếu nội dung yêu cầu tiếp tục!</b>\n\nCú pháp: <code>/continue &lt;nội dung bổ sung&gt;</code>',
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
      return;
    }
    await enqueueTask(chatId, prompt, [], 'continue');
    return;
  }

  // Tra cứu tiến độ và log tức thì của Antigravity AI
  if (text.startsWith('/log') || text.startsWith('/progress')) {
    if (!currentTask) {
      await sendTelegramMessage(
        chatId,
        '🟢 <b>Hiện không có task nào đang chạy!</b>\n\nBạn có thể gửi task mới bất kỳ lúc nào bằng <code>/task</code> hoặc <code>/fix</code>.',
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
      return;
    }

    const elapsed = Math.round((Date.now() - currentTask.startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

    const { stepInfo, totalSteps } = getLatestAgyProgress(currentTask.startTime, currentTask.isContinue);
    const tail = getTailLog(currentTask.stdoutBuffer || '', 8) || 'Đang xử lý ngầm (chưa có output mới)...';

    let logMsg =
      `⚡ <b>TIẾN ĐỘ THỰC THI HIỆN TẠI</b> <code>(⏱️ ${timeStr})</code>\n\n` +
      `🎯 <b>Task [${currentTask.taskBadge || 'Task'}]:</b>\n` +
      `<i>${escapeHtml(currentTask.rawPrompt || currentTask.prompt)}</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n`;

    if (stepInfo) {
      logMsg += `📍 <b>Bước hiện tại:</b> <code>${escapeHtml(stepInfo.toolName)}</code> (#${stepInfo.stepIndex})\n`;
      if (stepInfo.action) {
        logMsg += `🔹 <b>Hành động:</b> <i>${escapeHtml(stepInfo.action)}</i>\n`;
      }
    } else {
      const modeText = currentTask.isContinue ? '🔄 Nối tiếp phiên trước' : '✨ Phiên mới sạch (Zero Context Bloat)';
      logMsg += `📍 <b>Ngữ cảnh:</b> <i>${modeText}</i>\n`;
    }
    if (totalSteps > 0) {
      logMsg += `📊 <b>Số bước ghi nhận:</b> ${totalSteps} bước\n`;
    }

    logMsg += `\n📄 <b>8 dòng log stdout/stderr mới nhất:</b>\n<pre>${escapeHtml(tail)}</pre>`;

    await sendTelegramMessage(chatId, logMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
    return;
  }

  if (text.startsWith('/queue')) {
    if (!currentTask && taskQueue.length === 0) {
      await sendTelegramMessage(chatId, '🟢 <b>Hàng đợi trống!</b> Hiện không có task nào đang chạy hoặc chờ.', 'HTML', TASK_ACTIONS_KEYBOARD);
      return;
    }
    let msg = '📋 <b>TRẠNG THÁI HÀNG ĐỢI TÁC VỤ (Persistent Queue):</b>\n\n';
    if (currentTask) {
      const elapsed = Math.round((Date.now() - currentTask.startTime) / 1000);
      msg += `▶️ <b>Đang chạy [${currentTask.taskBadge || 'Task'}]:</b> <i>${escapeHtml(currentTask.rawPrompt || currentTask.prompt)}</i> <code>(⏱️ ${elapsed}s)</code>\n\n`;
    }
    if (taskQueue.length > 0) {
      msg += `⏳ <b>Đang chờ trong hàng đợi (${taskQueue.length} task - lưu trên đĩa):</b>\n`;
      taskQueue.forEach((t, i) => {
        let mode = 'Task';
        if (t.taskMode === 'fix') mode = 'Fix';
        else if (t.taskMode === 'continue') mode = 'Continue';
        msg += `${i + 1}. [${mode}] <i>${escapeHtml(t.rawPrompt)}</i>\n`;
      });
    } else {
      msg += '<i>Hàng đợi đang trống (0 task chờ).</i>';
    }
    await sendTelegramMessage(chatId, msg, 'HTML', TASK_ACTIONS_KEYBOARD);
    return;
  }

  if (text.startsWith('/clearqueue')) {
    const count = taskQueue.length;
    taskQueue.length = 0;
    saveQueueState(queueState);
    await sendTelegramMessage(chatId, `🗑️ Đã xóa sạch <b>${count}</b> task đang chờ trong hàng đợi (đã đồng bộ file đĩa cứng).`, 'HTML', TASK_ACTIONS_KEYBOARD);
    return;
  }

  if (text.startsWith('/status')) {
    const statusMsg = `📊 <b>TRẠNG THÁI GIT HIỆN TẠI:</b>\n\n${getGitStatusSummary()}`;
    await sendTelegramMessage(chatId, statusMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
    return;
  }

  if (text.startsWith('/diff')) {
    const diffStat = getGitDiffStat();
    if (!diffStat) {
      await sendTelegramMessage(chatId, '📁 <b>Không có thay đổi nào chưa commit (Working tree clean).</b>', 'HTML', TASK_ACTIONS_KEYBOARD);
    } else {
      await sendTelegramMessage(
        chatId,
        `📁 <b>CÁC THAY ĐỔI CHƯA COMMIT (GIT DIFF STAT):</b>\n\n<pre>${escapeHtml(diffStat)}</pre>`,
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
    }
    return;
  }

  if (text.startsWith('/proweb') || text === '/pro' || text.toLowerCase() === 'mở pro web') {
    const proMsg =
      `🚀 <b>MÔI TRƯỜNG PRODUCTION (PRO)</b>\n\n` +
      `🌐 <b>Frontend (Vercel):</b>\n<a href="https://logistics-website-frontend-kappa.vercel.app">https://logistics-website-frontend-kappa.vercel.app</a>\n\n` +
      `⚙️ <b>Backend (Render):</b>\n<a href="https://logistics-website-backend-1.onrender.com">https://logistics-website-backend-1.onrender.com</a>\n\n` +
      `📚 <b>Swagger Docs:</b>\n<a href="https://logistics-website-backend-1.onrender.com/docs">https://logistics-website-backend-1.onrender.com/docs</a>\n\n` +
      `<i>Nhánh Git: <code>master</code></i>`;

    await sendTelegramMessage(chatId, proMsg, 'HTML', {
      inline_keyboard: [
        [
          { text: '🚀 Mở Pro Web', url: 'https://logistics-website-frontend-kappa.vercel.app' },
          { text: '📚 Swagger Pro', url: 'https://logistics-website-backend-1.onrender.com/docs' },
        ],
        [
          { text: '🌐 Mở Dev Web', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
          { text: '📊 Git Status', callback_data: '/status' },
        ],
      ],
    });
    return;
  }

  if (text.startsWith('/devweb') || text === '/dev' || text.toLowerCase() === 'mở dev web') {
    const devMsg =
      `🌐 <b>MÔI TRƯỜNG DEVELOPMENT (DEV)</b>\n\n` +
      `🌐 <b>Frontend (Vercel):</b>\n<a href="https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app">https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app</a>\n\n` +
      `⚙️ <b>Backend (Render):</b>\n<a href="https://logistics-website-backend-1jho.onrender.com">https://logistics-website-backend-1jho.onrender.com</a>\n\n` +
      `📚 <b>Swagger Docs:</b>\n<a href="https://logistics-website-backend-1jho.onrender.com/docs">https://logistics-website-backend-1jho.onrender.com/docs</a>\n\n` +
      `<i>Nhánh Git: <code>dev</code></i>`;

    await sendTelegramMessage(chatId, devMsg, 'HTML', {
      inline_keyboard: [
        [
          { text: '🌐 Mở Dev Web', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
          { text: '📚 Swagger Dev', url: 'https://logistics-website-backend-1jho.onrender.com/docs' },
        ],
        [
          { text: '🚀 Mở Pro Web', url: 'https://logistics-website-frontend-kappa.vercel.app' },
          { text: '📊 Git Status', callback_data: '/status' },
        ],
      ],
    });
    return;
  }

  if (text.startsWith('/cancel')) {
    await cancelCurrentTask(chatId);
    return;
  }

  // Tin nhắn riêng 1-1
  if (msg.chat.type === 'private') {
    await sendTelegramMessage(
      chatId,
      '💡 Để giao task cho AI, bạn hãy gửi ảnh kèm chú thích hoặc dùng lệnh:\n<code>/task &lt;nội dung yêu cầu&gt;</code>\n\nHoặc gõ <code>/help</code> để xem hướng dẫn.',
      'HTML',
      TASK_ACTIONS_KEYBOARD
    );
  }
}

// Xử lý sự kiện bấm nút Inline Keyboard
async function handleCallbackQuery(cb) {
  try {
    // Xác nhận ngay với Telegram để tắt icon loading trên phím bấm
    await fetch(`${API_BASE}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cb.id }),
    });

    const chatId = cb.message?.chat?.id || ALLOWED_CHAT_ID;
    const commandText = cb.data;

    if (ALLOWED_CHAT_ID && String(chatId) !== String(ALLOWED_CHAT_ID)) {
      return;
    }

    if (commandText) {
      await handleMessage({
        chat: cb.message.chat,
        from: cb.from,
        text: commandText,
      });
    }
  } catch (err) {
    console.error('handleCallbackQuery error:', err.message);
  }
}

// Vòng lặp Long Polling nhận cập nhật từ Telegram
async function startPolling() {
  console.log('🤖 Antigravity AI Task Runner is running (Image Support: Enabled)...');
  console.log(`📂 Workspace: ${WORKSPACE_DIR}`);
  console.log(`📁 Task Images Dir: ${IMAGES_DIR}`);
  console.log(`🔑 Bot Token: ...${BOT_TOKEN.slice(-8)}`);
  console.log(`🛡️ Whitelist Chat ID: ${ALLOWED_CHAT_ID}`);
  console.log(`⚡ AGY Binary: ${AGY_BIN}`);

  let offset = 0;

  // Đăng ký danh sách menu lệnh nhanh trên Telegram Bot
  await registerBotCommands();

  // Gửi thông báo khởi động vào group
  await sendTelegramMessage(
    ALLOWED_CHAT_ID,
    `🟢 <b>Antigravity AI Task Runner đã sẵn sàng!</b>\n\n` +
    `⚡ <b>Đã kích hoạt:</b> Hàng đợi đĩa cứng (task-queue.json), Tự động khôi phục khi gián đoạn (Crash Recovery), Bàn phím thao tác nhanh, Phím tắt Pro Web, skill <code>telegram-task-responder</code>.\n` +
    `Gõ <code>/help</code> hoặc bấm các nút bên dưới để bắt đầu:`,
    'HTML',
    TASK_ACTIONS_KEYBOARD
  );

  // Kiểm tra và khôi phục tác vụ bị gián đoạn từ file đĩa cứng
  await recoverInterruptedTasks();

  while (true) {
    try {
      const url = `${API_BASE}/getUpdates?offset=${offset}&timeout=25&allowed_updates=["message","callback_query"]`;
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          }
        }
      } else if (!data.ok) {
        console.error('getUpdates returned non-ok:', data);
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (err) {
      if (err.name !== 'TimeoutError') {
        console.error('Polling error (will retry in 3s):', err.message);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Xử lý tắt bot an toàn
process.on('SIGINT', async () => {
  console.log('\n🛑 Đang dừng Telegram Task Runner...');
  if (currentTask && currentTask.process) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${currentTask.process.pid} /T /F`);
      } else {
        currentTask.process.kill();
      }
    } catch {}
  }
  process.exit(0);
});

// Bắt lỗi không mong muốn để bảo vệ bot không bao giờ crash ngầm
process.on('unhandledRejection', (reason) => {
  console.error('[Safety] Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Safety] Uncaught Exception:', err?.message || err);
});

startPolling();
