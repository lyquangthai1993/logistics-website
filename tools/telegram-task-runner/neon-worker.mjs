import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import pg from 'pg';
import { getTodayTasksSummary } from '../../scripts/todo-agent.mjs';

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
const MAX_E2E_RETRIES = parseInt(process.env.MAX_E2E_RETRIES || '3', 10);

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

// Gửi file ảnh lên Telegram kèm caption và bàn phím thao tác (dùng cho bằng chứng nghiệm thu)
async function sendTelegramPhoto(chatId, imagePath, caption = '', replyMarkup = null) {
  if (!imagePath || !fs.existsSync(imagePath)) return null;
  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('photo', blob, path.basename(imagePath));
    if (caption) {
      formData.append('caption', caption.slice(0, 1020));
      formData.append('parse_mode', 'HTML');
    }
    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup));
    }

    const res = await fetch(`${API_BASE}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('sendTelegramPhoto non-ok:', data.description);
    }
    return data;
  } catch (err) {
    console.error('sendTelegramPhoto network error:', err.message);
    return null;
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
function buildLeaderPrompt(rawPrompt, feedbackDir, imagePaths = [], senderName = 'User') {
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

// Xây dựng prompt chuẩn hóa với vai trò todo-agent để thực thi triển khai code
function buildTodoAgentPrompt(rawPrompt, feedbackDir, senderName = 'User') {
  const hasSpecificFolder = /feedback_\d{1,2}_\d{1,2}[a-zA-Z0-9_]*/i.test(rawPrompt);
  const isTodayScan = !hasSpecificFolder && (/hôm nay|today|quét task|tất cả|all|force|todo|run|thực thi|triển khai/i.test(rawPrompt) || !feedbackDir || feedbackDir === WORKSPACE_DIR);
  const todaySummary = getTodayTasksSummary(WORKSPACE_DIR);

  let targetSection = '';
  if (!hasSpecificFolder && (isTodayScan || !feedbackDir || feedbackDir === WORKSPACE_DIR)) {
    let pendingDetails = '';
    if (todaySummary.pendingFolders.length > 0) {
      pendingDetails = todaySummary.pendingFolders.map((folder) => {
        const todoFile = path.join(folder.folderPath, 'TODO.md');
        const tasksList = [
          ...folder.tasks.byCategory.backend.filter(t => !t.completed).map(t => `    * [Backend] Dòng ${t.line}: ${t.text}`),
          ...folder.tasks.byCategory.frontend.filter(t => !t.completed).map(t => `    * [Frontend] Dòng ${t.line}: ${t.text}`),
          ...folder.tasks.byCategory.database.filter(t => !t.completed).map(t => `    * [DB] Dòng ${t.line}: ${t.text}`),
          ...folder.tasks.byCategory.testing.filter(t => !t.completed).map(t => `    * [Test/DoD] Dòng ${t.line}: ${t.text}`),
          ...folder.tasks.byCategory.general.filter(t => !t.completed).map(t => `    * [General] Dòng ${t.line}: ${t.text}`)
        ].join('\n');

        return `  📁 Thư mục: ${folder.folderName} — "${folder.title}"\n  📍 File TODO: ${todoFile}\n  Checklist còn tồn đọng (${folder.tasks.pending} việc):\n${tasksList}`;
      }).join('\n\n');
    } else {
      pendingDetails = `  🎉 Toàn bộ ${todaySummary.totalTasks} đầu việc trong ${todaySummary.totalFolders} thư mục của ngày hôm nay (${todaySummary.dateString}) đã được đánh dấu hoàn thành 100%!`;
    }

    targetSection = `
2. TỔNG QUAN RÀ SOÁT CÁC TASK PHÁT SINH TRONG NGÀY HÔM NAY (${todaySummary.dateString}):
- Tổng số thư mục feedback hôm nay: ${todaySummary.totalFolders}
- Tiến độ tổng hợp: ${todaySummary.totalCompleted}/${todaySummary.totalTasks} việc (${todaySummary.percent}%)
- Tổng số đầu việc còn tồn đọng (pending): ${todaySummary.totalPending} việc

3. CHI TIẾT CÁC THƯ MỤC FEEDBACK VÀ CHECKLIST NGÀY HÔM NAY:
${pendingDetails}

4. CÔNG CỤ HỖ TRỢ ĐÃ TÍCH HỢP TRONG WORKSPACE:
- Chạy 'node scripts/todo-agent.mjs today' để quét lại ma trận task hôm nay.
- Chạy 'node scripts/todo-agent.mjs today --plan' để xuất blueprint thực thi hợp nhất.
- Chạy 'node scripts/todo-agent.mjs toggle <folder_name> <dòng> done' để tự động tích [x] hoàn thành.
`;
  } else {
    const targetTodoPath = path.join(feedbackDir, 'TODO.md');
    let checklistDetails = '';
    if (fs.existsSync(targetTodoPath)) {
      const todoContent = fs.readFileSync(targetTodoPath, 'utf8');
      checklistDetails = `\n- Nội dung checklist trong TODO.md:\n${todoContent.slice(0, 3000)}`;
    }
    targetSection = `
2. THƯ MỤC FEEDBACK MỤC TIÊU CẦN THỰC THI:
- Đường dẫn thư mục: ${feedbackDir}
- File TODO.md: ${targetTodoPath}${checklistDetails}
`;
  }

  return `
BẮT BUỘC KÍCH HOẠT SKILL TODO-AGENT ĐỂ QUÉT VÀ THỰC THI TASK NGÀY HÔM NAY:
1. Bạn BẮT BUỘC đọc và tuân thủ file AGENTS.md và skill .agents/skills/todo-agent/SKILL.md tại workspace D:\\Projects\\logistics-website.
${targetSection}

5. QUY TRÌNH THỰC THI BẮT BUỘC (EXECUTION & DEV E2E PIPELINE):
   - BƯỚC 1: Sửa đổi mã nguồn TRỰC TIẾP trong các Git submodules (backend/ và/hoặc frontend/). TUYỆT ĐỐI không chỉ sửa ở root.
     Tuân thủ nghiêm ngặt UI Compact Density (.agents/rules/ui-compact-density.md):
     * Card padding: p-1; Modal body: p-2; Spacing: gap-1.5 đến gap-2; Bảng: font text-[10px]; Zero Redundant Icons.
     * Zero Mock Data: Kết nối trực tiếp PostgreSQL REST APIs.
     * Kiểm tra biên dịch local:
       + Backend: npm run build --prefix backend
       + Frontend: npx --prefix frontend tsc --noEmit
   - BƯỚC 2: Commit và push các submodules lên branch dev:
       + git -C backend push origin dev
       + git -C frontend push origin dev
   - BƯỚC 3: TẠO HOẶC CẬP NHẬT FILE PLAYWRIGHT E2E SPEC TRONG frontend/e2e/<spec_file>.spec.ts:
       + BẮT BUỘC ghi rõ đường dẫn file spec vào TODO.md (ví dụ: frontend/e2e/36-feedback-07-10-task-21.spec.ts).
       + BẮT BUỘC thiết kế test có lưu ảnh screenshot nghiệm thu: screenshot_*_verified.png vào thư mục feedback.
       + Test trên Real Database, Zero Mock, có assertions chặt chẽ.
   - BƯỚC 4: CẬP NHẬT CHECKLIST & BIÊN BẢN KỸ THUẬT:
       + Chuyển các mục - [ ] thành - [x] trong các file TODO.md tương ứng.
       + Ghi nhận RESOLUTION.md và timeline nếu hoàn tất milestone: npm run todo:record <folder_name>.
   - BƯỚC 5: ⚠️ LƯU Ý TỐI QUAN TRỌNG VỀ DEV E2E QUALITY GATE CỦA NEON WORKER:
       + Sau khi bạn hoàn tất, Neon Worker sẽ TỰ ĐỘNG chờ Vercel & Render build deploy (45-60s) và TỰ ĐỘNG CHẠY LẠI bộ Playwright E2E suite của bạn trực tiếp trên Domain Dev!
       + NẾU BẠN CHƯA TẠO FILE SPEC HOẶC TEST KHÔNG PASS TRÊN DEV, WORKER SẼ TỰ ĐỘNG ĐÁNH DẤU TASK THẤT BẠI (FAILED) VÀ BẮN CẢNH BÁO LỖI LÊN TELEGRAM.
       + TUYỆT ĐỐI KHÔNG tự tuyên bố nghiệm thu hoàn tất nếu chưa đảm bảo file test E2E hoạt động chính xác.

6. BÁO CÁO KẾT QUẢ VỀ TELEGRAM (BẮT BUỘC FORMAT NÀY):
   - Báo cáo chi tiết:
     • Hạng mục đã triển khai: [Tiêu đề Feedback / Nhiệm vụ]
     • File Playwright E2E Suite: frontend/e2e/<spec_file>.spec.ts
     • Bằng chứng nghiệm thu: Đường dẫn ảnh chụp screenshot_*_verified.png
     • Danh sách các file mã nguồn đã sửa đổi (Backend, Frontend).
     • Trích dẫn đường link các file TODO.md đã xử lý.
   - TUYỆT ĐỐI KHÔNG viết các câu kết bài thừa thãi (như "Bạn muốn làm gì tiếp theo...", "Hệ thống đã sẵn sàng...").
`.trim();
}

// Xây dựng prompt chuẩn hóa với vai trò /git-commit-reviewer để đồng bộ dev lên master
function buildSyncPrompt(rawPrompt, senderName = 'User') {
  return `
BẮT BUỘC KÍCH HOẠT SKILL /git-commit-reviewer ĐỂ ĐỒNG BỘ NHÁNH DEV LÊN MASTER:
1. Bạn BẮT BUỘC đọc và tuân thủ file AGENTS.md và skill .agents/skills/git-commit-reviewer/SKILL.md tại workspace D:\\Projects\\logistics-website.

2. MỤC TIÊU NHIỆM VỤ:
- Người dùng @${senderName} yêu cầu đồng bộ toàn bộ thay đổi đã hoàn thiện và kiểm thử trên nhánh 'dev' lên nhánh 'master' (Production) cho toàn bộ 3 Git repositories:
  (1) Backend submodule: D:\\Projects\\logistics-website\\backend
  (2) Frontend submodule: D:\\Projects\\logistics-website\\frontend
  (3) Root repository: D:\\Projects\\logistics-website

3. QUY TRÌNH THỰC HIỆN ĐỒNG BỘ AN TOÀN (SYNC & SUBMODULE-FIRST PUSH PROTOCOL):
   - BƯỚC 1: KIỂM TRA TRẠNG THÁI & COMMITS MỚI CỦA DEV:
     * Đảm bảo working tree ở CẢ 3 REPOSITORIES (backend/, frontend/, root) sạch sẽ. Nếu có uncommitted changes (như screenshots, files tạm), thực hiện 'git stash' trước khi checkout để tránh bị Git abort, và 'git stash pop' sau khi checkout lại về 'dev'.
     * Liệt kê các commit mới trên nhánh dev so với master:
       + git -C backend log master..dev --oneline
       + git -C frontend log master..dev --oneline
       + git log master..dev --oneline

   - BƯỚC 2: AUDIT BẢO MẬT & NGUYÊN TẮC (THEO SKILL /git-commit-reviewer):
     * Quét các commit và diff từ dev sẽ merge vào master:
       + TUYỆT ĐỐI không có secrets, API keys, credentials, token, private key.
       + TUYỆT ĐỐI không có file .env.*, MCP config files.
       + TUYỆT ĐỐI không có destructive SQL (DROP TABLE, TRUNCATE, raw DELETE không có WHERE).
       + TUYỆT ĐỐI không có synchronize: true trong TypeORM DataSource.
     * Nếu phát hiện bất kỳ vi phạm bảo mật nghiêm trọng nào: DỪNG LẠI NGAY LẬP TỨC và báo cáo, KHÔNG PUSH LÊN MASTER!

   - BƯỚC 3: MERGE VÀ PUSH THEO THỨ TỰ SUBMODULE-FIRST (BẮT BUỘC):
     * (1) Backend Submodule:
       + cd backend
       + git checkout master
       + git pull origin master --rebase || git pull origin master
       + git merge dev --no-ff -m "chore(sync): merge branch 'dev' into master"
       + Kiểm tra build backend: npm run build --prefix backend (bắt buộc pass)
       + git push origin master
       + cd ..
     * (2) Frontend Submodule:
       + cd frontend
       + git checkout master
       + git pull origin master --rebase || git pull origin master
       + git merge dev --no-ff -m "chore(sync): merge branch 'dev' into master"
       + Kiểm tra typecheck frontend: npx --prefix frontend tsc --noEmit (bắt buộc pass)
       + git push origin master
       + cd ..
     * (3) Root Repository:
       + git checkout master
       + git pull origin master --rebase || git pull origin master
       + git merge dev --no-ff -m "chore(sync): merge branch 'dev' into master"
       + Cập nhật con trỏ submodules trỏ tới commit mới nhất trên master:
         git add backend frontend
         git commit -m "chore(submodules): update backend and frontend pointers to latest master" --allow-empty
       + git push origin master

   - BƯỚC 4: CHUYỂN LẠI TOÀN BỘ CÁC REPOSITORY VỀ NHÁNH DEV:
     * Để môi trường làm việc local tiếp tục phát triển ở nhánh dev an toàn:
       + git -C backend checkout dev
       + git -C frontend checkout dev
       + git checkout dev
       + Nếu ở Bước 1 có thực hiện git stash, chạy 'git stash pop' để khôi phục.

   - BƯỚC 5: BÁO CÁO KẾT QUẢ VỀ TELEGRAM (BẮT BUỘC FORMAT NÀY):
     * Bắt đầu bằng: "🚀 ĐỒNG BỘ DEV ➔ MASTER THÀNH CÔNG (REVIEWED BY /git-commit-reviewer)"
     * Tóm tắt ngắn gọn các tính năng/sửa lỗi chính vừa được đưa lên master:
       - Backend: [Các API, Entities, Migrations đã đồng bộ]
       - Frontend: [UI components, Pages, E2E specs đã đồng bộ]
       - Root: [Cập nhật submodule pointers]
     * Trạng thái Git Remote:
       - Backend: origin/master [Up-to-date]
       - Frontend: origin/master [Up-to-date]
       - Root: origin/master [Up-to-date]
     * Trạng thái Workspace: Đã chuyển lại nhánh 'dev' an toàn.
`.trim();
}

// Hàm điều phối prompt tổng quát
function buildTaskPrompt(rawPrompt, feedbackDir, imagePaths = [], senderName = 'User') {
  const isSync = /^\s*(\/sync|sync-master|sync\s*dev|đồng\s*bộ\s*master|đồng\s*bộ\s*dev)/i.test(rawPrompt);
  if (isSync) {
    return buildSyncPrompt(rawPrompt, senderName);
  }
  const isTodoAgent = /^\s*(\/todo|\/force|\/run|\/exec|\/now|todo-agent|force-todo|run-todo|thực thi|triển khai|chạy ngay|làm ngay)/i.test(rawPrompt);
  if (isTodoAgent) {
    return buildTodoAgentPrompt(rawPrompt, feedbackDir, senderName);
  }
  return buildLeaderPrompt(rawPrompt, feedbackDir, imagePaths, senderName);
}

// -------------------------------------------------------------
// DEV E2E QUALITY GATE ENGINE (CHỐT CHẶN NGHIỆM THU ĐỘC LẬP)
// -------------------------------------------------------------

// Tự động nhận diện file test E2E liên quan đến task trong frontend/e2e/
function detectTaskE2ESpec(feedbackDir, taskId) {
  // 1. Quét file TODO.md trong feedbackDir
  const todoPath = path.join(feedbackDir, 'TODO.md');
  if (fs.existsSync(todoPath)) {
    try {
      const content = fs.readFileSync(todoPath, 'utf8');
      const specMatch = content.match(/(?:frontend\/)?e2e\/([a-zA-Z0-9_\-\.]+\.spec\.ts)/i);
      if (specMatch) {
        const candidate = path.join(WORKSPACE_DIR, 'frontend', 'e2e', specMatch[1]);
        if (fs.existsSync(candidate)) {
          return `e2e/${specMatch[1]}`;
        }
      }
    } catch {}
  }

  // 2. Quét thư mục frontend/e2e theo task ID hoặc tên feedback
  const e2eDir = path.join(WORKSPACE_DIR, 'frontend', 'e2e');
  if (fs.existsSync(e2eDir)) {
    try {
      const files = fs.readdirSync(e2eDir);
      if (taskId) {
        const idPattern = new RegExp(`task[-_]${taskId}\\.spec\\.ts$`, 'i');
        const match = files.find(f => idPattern.test(f));
        if (match) return `e2e/${match}`;
      }

      const folderBase = path.basename(feedbackDir).replace(/_/g, '-');
      // Ưu tiên file spec số thứ tự cao nhất (mới nhất)
      const sortedFiles = files.filter(f => f.endsWith('.spec.ts')).sort().reverse();
      const matchFolder = sortedFiles.find(f => f.includes(folderBase));
      if (matchFolder) return `e2e/${matchFolder}`;
    } catch {}
  }

  // 3. Quét git diff của submodule frontend xem có file spec nào vừa được tạo / sửa
  try {
    const gitDiffFiles = execSync('git -C frontend diff --name-only HEAD~1', { encoding: 'utf8', cwd: WORKSPACE_DIR });
    const specLine = gitDiffFiles.split(/\r?\n/).find(l => l.startsWith('e2e/') && l.endsWith('.spec.ts'));
    if (specLine) return specLine.trim();
  } catch {}

  return null;
}

// Tìm ảnh chụp bằng chứng nghiệm thu E2E đã tạo
function findVerificationEvidence(feedbackDir) {
  if (!feedbackDir || !fs.existsSync(feedbackDir)) return null;

  try {
    const files = fs.readdirSync(feedbackDir);
    // 1. Ưu tiên ảnh chứa verified
    const verifiedImg = files.find(f => /screenshot_.*verified\.(png|jpg|webp)$/i.test(f));
    if (verifiedImg) return path.join(feedbackDir, verifiedImg);

    // 2. Tìm trong test-evidence/
    const evidenceDir = path.join(feedbackDir, 'test-evidence');
    if (fs.existsSync(evidenceDir)) {
      const evFiles = fs.readdirSync(evidenceDir);
      const evImg = evFiles.find(f => /\.(png|jpg|webp)$/i.test(f));
      if (evImg) return path.join(evidenceDir, evImg);
    }

    // 3. Ảnh chụp mới nhất bất kỳ trong feedbackDir
    const anyImgs = files.filter(f => /screenshot_.*\.(png|jpg|webp)$/i.test(f));
    if (anyImgs.length > 0) {
      return path.join(feedbackDir, anyImgs[anyImgs.length - 1]);
    }
  } catch {}

  return null;
}

// Chờ Vercel và Render hoàn tất build deploy trên môi trường Dev (anti-hang timeout)
async function waitForDevDeployment(timeoutSec = 150, onProgress = null) {
  const backendHealthUrl = 'https://logistics-website-backend-1jho.onrender.com/api/v1/health';
  const frontendUrl = 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app';

  // Chờ 40s ban đầu cho GitHub webhook kích hoạt Cloud build
  if (onProgress) await onProgress('Đang chờ GitHub webhook kích hoạt Vercel & Render build (40s)...');
  await new Promise(r => setTimeout(r, 40000));

  const startTime = Date.now();
  let attempt = 0;

  while ((Date.now() - startTime) < timeoutSec * 1000) {
    attempt++;
    if (onProgress) await onProgress(`Đang kiểm tra kết nối Domain Dev (Lần ${attempt})...`);
    try {
      const [backendRes, frontendRes] = await Promise.all([
        fetch(backendHealthUrl, { signal: AbortSignal.timeout(15000) }),
        fetch(frontendUrl, { signal: AbortSignal.timeout(15000) })
      ]);

      if (backendRes.ok && (frontendRes.ok || frontendRes.status === 307)) {
        return { success: true, attempts: attempt };
      }
    } catch (err) {
      console.warn(`[Dev Health Polling] Lần ${attempt} chưa sẵn sàng:`, err.message);
    }
    await new Promise(r => setTimeout(r, 12000));
  }

  return { success: false, error: `Hết thời gian chờ Dev Deployment (${timeoutSec}s).` };
}

// Thực thi Playwright E2E suite trực tiếp trên Domain Dev
async function runDevE2EVerification(feedbackDir, specRelPath) {
  const frontendDir = path.join(WORKSPACE_DIR, 'frontend');
  console.log(`[Dev E2E Quality Gate] Kích hoạt Playwright: ${specRelPath} trên Domain Dev...`);

  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app',
    API_URL: 'https://logistics-website-backend-1jho.onrender.com/api/v1'
  };

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const testProc = spawn(`npx playwright test ${specRelPath} --project=chromium`, {
      cwd: frontendDir,
      env,
      shell: true,
      windowsHide: true
    });

    testProc.stdout.on('data', (d) => {
      const str = d.toString();
      stdout += str;
      process.stdout.write(str);
    });

    testProc.stderr.on('data', (d) => {
      const str = d.toString();
      stderr += str;
      process.stderr.write(str);
    });

    testProc.on('close', (testExitCode) => {
      console.log(`[Dev E2E Quality Gate] Playwright kết thúc với exitCode: ${testExitCode}`);

      let auditScore = null;
      try {
        const auditOutput = execSync(`node scripts/e2e-auditor.mjs frontend/${specRelPath}`, {
          cwd: WORKSPACE_DIR,
          encoding: 'utf8',
          timeout: 20000
        });
        const scoreMatch = auditOutput.match(/(\d+)\/50/);
        if (scoreMatch) auditScore = parseInt(scoreMatch[1], 10);
      } catch (err) {
        console.warn('[Dev E2E Quality Gate] Lỗi chạy e2e-auditor:', err.message);
      }

      const evidencePath = findVerificationEvidence(feedbackDir);

      resolve({
        success: testExitCode === 0,
        exitCode: testExitCode,
        stdout,
        stderr,
        auditScore,
        evidencePath
      });
    });
  });
}

// Trích xuất file error-context.md mới nhất từ Playwright test-results (nếu có)
function extractRecentPlaywrightErrorContext() {
  const testResultsDir = path.join(WORKSPACE_DIR, 'frontend', 'test-results');
  if (!fs.existsSync(testResultsDir)) return null;

  try {
    const errorContextFiles = [];
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name === 'error-context.md') {
          const stat = fs.statSync(fullPath);
          errorContextFiles.push({ fullPath, mtime: stat.mtimeMs });
        }
      }
    }
    scanDir(testResultsDir);

    if (errorContextFiles.length > 0) {
      errorContextFiles.sort((a, b) => b.mtime - a.mtime);
      const newest = errorContextFiles[0];
      const content = fs.readFileSync(newest.fullPath, 'utf8');
      return content.slice(0, 2500);
    }
  } catch (err) {
    console.warn('[E2E Error Context] Không thể đọc error-context.md:', err.message);
  }
  return null;
}

// Xây dựng prompt chuyên biệt để AI tự động phân tích RCA và fix code sau khi Dev E2E fail
function buildE2EAutoFixPrompt({ taskId, feedbackDir, specFile, attempt, maxAttempts, failDetails, errorContext }) {
  const relFeedback = path.relative(WORKSPACE_DIR, feedbackDir);
  const extraContextSection = errorContext
    ? `\n\nNỘI DUNG ERROR-CONTEXT.MD TỪ PLAYWRIGHT:\n\`\`\`markdown\n${errorContext}\n\`\`\``
    : '';

  return `
BẮT BUỘC KÍCH HOẠT QUY TRÌNH TỰ ĐỘNG FIX LỖI E2E (SELF-HEALING RETRY VÒNG ${attempt}/${maxAttempts}):
1. Bạn BẮT BUỘC đọc và tuân thủ file AGENTS.md và skill .agents/skills/todo-agent/SKILL.md tại workspace D:\\Projects\\logistics-website.

2. BỐI CẢNH LỖI:
- Task #${taskId} (Thư mục: ${relFeedback}) vừa chạy Playwright E2E kiểm thử trên Domain Dev nhưng THẤT BẠI ở vòng lặp thứ ${attempt}/${maxAttempts}.
- File test E2E mục tiêu: frontend/${specFile}
- Chi tiết lỗi nhận được từ Playwright:
\`\`\`
${failDetails}
\`\`\`${extraContextSection}

3. YÊU CẦU THỰC HIỆN TỰ SỬA LỖI (ROOT CAUSE ANALYSIS & CODE FIX):
- Bước 1 (RCA): Đọc kỹ thông báo lỗi trên (tìm selector sai, race condition button disabled, timeout chờ dữ liệu, định dạng số, hoặc lỗi logic API).
- Bước 2 (Sửa code): Sửa trực tiếp mã nguồn trong submodule tương ứng:
  * Nếu là lỗi giao diện/state/form: Sửa trong frontend/ (tuân thủ nghiêm UI Compact Density: p-1, p-2, gap-1.5, text-[10px], Zero Redundant Icons).
  * Nếu là lỗi backend/API/database/DTO: Sửa trong backend/ (tuân thủ TypeORM, DTO validation).
  * Nếu là do kịch bản test chưa đón đầu đúng luồng async/download/render: Cập nhật frontend/${specFile} theo đúng kịch bản nghiệp vụ.
- Bước 3 (Typecheck & Build Local):
  * Frontend: npx --prefix frontend tsc --noEmit
  * Backend (nếu có sửa): npm run build --prefix backend
- Bước 4 (Commit & Push lên dev):
  * Commit trực tiếp bên trong submodule (backend/ và/hoặc frontend/) với message chuẩn Conventional Commits (ví dụ: fix(e2e): resolve test failure on dev retry ${attempt}).
  * Push nhánh dev: git -C frontend push origin dev (và git -C backend push origin dev nếu có sửa backend).
  * KHÔNG force push. Không sửa ngoài phạm vi task.

4. BÁO CÁO NGẮN GỌN KẾT QUẢ ĐÃ SỬA:
- Liệt kê nguyên nhân gốc rễ (RCA).
- Danh sách file đã sửa đổi.
- Trạng thái commit và push lên nhánh dev.
`.trim();
}

// Khởi chạy session agy chuyên biệt để tự động fix lỗi E2E (timeout 15m)
async function runAgyAutoFixSession({ prompt, chatId, progressMsgId, taskId, attempt, maxAttempts }) {
  console.log(`\n========================================`);
  console.log(`🔧 [Task #${taskId}] Khởi chạy AI Auto-Fix Session (Vòng ${attempt}/${maxAttempts})...`);
  console.log(`========================================`);

  const args = [
    '--output-format', 'stream-json',
    '--add-dir', WORKSPACE_DIR,
    '--dangerously-skip-permissions',
    '--print', prompt,
    '--print-timeout', '15m'
  ];

  if (AGY_MODEL) {
    args.push('--model', AGY_MODEL);
  }

  const child = spawn(AGY_BIN, args, {
    cwd: WORKSPACE_DIR,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env },
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';
  let stdoutLineBuffer = '';
  let currentStep = '';

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
        if (parsed.event === 'step_update' && parsed.step_update?.tool_info) {
          const action = parsed.step_update.tool_info.parameters?.toolAction || parsed.step_update.tool_info.parameters?.CommandLine || '';
          if (action) currentStep = String(action).replace(/^"|"$/g, '');
        }
      } catch {}
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuffer += text;
    process.stderr.write(text);
  });

  const fixTimer = setInterval(async () => {
    if (!progressMsgId) return;
    try {
      await editTelegramMessage(
        chatId,
        progressMsgId,
        `🔧 <b>[Task #${taskId}] Đang tự động phân tích & sửa lỗi (Vòng ${attempt}/${maxAttempts})...</b>\n\n` +
        (currentStep ? `📍 <b>Thao tác:</b> <code>${escapeHtml(currentStep.slice(0, 100))}</code>\n` : '') +
        `💡 <i>AI đang kiểm tra error trace, sửa code và push lên dev...</i>`,
        'HTML',
        TASK_ACTIONS_KEYBOARD
      );
    } catch {}
  }, 20000);

  return new Promise((resolve) => {
    child.on('close', (exitCode) => {
      clearInterval(fixTimer);
      console.log(`[Task #${taskId}] Auto-Fix Vòng ${attempt}/${maxAttempts} hoàn tất với exitCode: ${exitCode}`);
      resolve({
        success: exitCode === 0,
        exitCode,
        stdout: stdoutBuffer,
        stderr: stderrBuffer
      });
    });
  });
}

// Quản lý kết nối Neon PostgreSQL (Hỗ trợ Serverless Auto-Reconnect & Cold-Start)
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000, // Giải phóng kết nối nhàn rỗi sau 10s để tránh giữ TCP socket chết
  connectionTimeoutMillis: 20000, // Cho phép tối đa 20s khi Neon cold-start
});

// Bắt lỗi rớt socket ngầm của client nhàn rỗi, tự động tái kết nối mà không crash tiến trình
pool.on('error', (err) => {
  console.warn('⚠️ [Neon Pool Notice] Socket kết nối nhàn rỗi bị ngắt (sẽ tự động tạo kết nối mới):', err.message);
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

  // Phân biệt chế độ /sync vs todo-agent vs /leader
  const isSyncMode = /^\s*(\/sync|sync-master|sync\s*dev|đồng\s*bộ\s*master|đồng\s*bộ\s*dev)/i.test(rawPrompt);
  const isTodoAgentMode = !isSyncMode && /^\s*(\/todo|\/force|\/run|\/exec|\/now|todo-agent|force-todo|run-todo|thực thi|triển khai|chạy ngay|làm ngay)/i.test(rawPrompt);

  // 1. Xác định thư mục feedback
  let feedbackDir = (task.feedback_dir && fs.existsSync(task.feedback_dir))
    ? task.feedback_dir
    : null;

  if (isSyncMode) {
    feedbackDir = WORKSPACE_DIR;
  } else if (isTodoAgentMode) {
    if (!feedbackDir) {
      const match = rawPrompt.match(/feedback_\d{1,2}_\d{1,2}[a-zA-Z0-9_]*/i);
      if (match) {
        const candidate = path.join(WORKSPACE_DIR, match[0]);
        if (fs.existsSync(candidate)) {
          feedbackDir = candidate;
        }
      }
    }
    if (!feedbackDir) {
      const todaySummary = getTodayTasksSummary(WORKSPACE_DIR);
      if (todaySummary.pendingFolders.length > 0) {
        feedbackDir = todaySummary.pendingFolders[0].folderPath;
      } else if (todaySummary.folders.length > 0) {
        feedbackDir = todaySummary.folders[0].folderPath;
      } else {
        feedbackDir = WORKSPACE_DIR;
      }
    }
  } else {
    if (!feedbackDir) {
      feedbackDir = getFeedbackDirectory(taskId);
    }
  }

  console.log(`📁 Feedback Dir: ${feedbackDir} (Mode: ${isSyncMode ? 'SYNC_MASTER' : (isTodoAgentMode ? 'TODO_AGENT' : 'LEADER')})`);

  // 2. Tải tất cả ảnh đính kèm từ Telegram vào feedbackDir (nếu có)
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
  const startMsg = isSyncMode
    ? `⏳ <b>[Antigravity /sync] Đang bắt đầu đồng bộ dev lên master...</b> <code>(⏱️ 0s)</code>\n\n` +
      `👤 <b>Người yêu cầu:</b> ${escapeHtml(senderName)}\n` +
      `📝 <b>Lệnh:</b> <code>${escapeHtml(rawPrompt)}</code>\n` +
      `🤖 <b>Chế độ:</b> <code>/sync</code> (Review qua <code>/git-commit-reviewer</code>)\n` +
      `🌿 <b>Mục tiêu:</b> Merge <code>dev</code> ➔ <code>master</code>, audit bảo mật, build check & push submodules\n\n` +
      `💡 <i>Tiến trình AI đang audit diff các submodules, merge nhánh và chuẩn bị push lên Production. Tự động cập nhật mỗi 25s...</i>`
    : (isTodoAgentMode
      ? `⏳ <b>[Antigravity todo-agent] Đang bắt đầu thực thi Task #${taskId}...</b> <code>(⏱️ 0s)</code>\n\n` +
        `👤 <b>Người gửi / Trigger:</b> ${escapeHtml(senderName)}\n` +
        `📁 <b>Thư mục mục tiêu:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
        `📝 <b>Yêu cầu:</b> <i>"${escapeHtml(rawPrompt)}"</i>\n` +
        `🤖 <b>Chế độ:</b> <code>todo-agent</code> (Thực thi code & kiểm thử)\n\n` +
        `💡 <i>Tiến trình AI đang đọc TODO.md, đối chiếu mã nguồn, thực thi sửa đổi và chạy build test trên laptop. Tự động cập nhật mỗi 25s...</i>`
      : `⏳ <b>[Antigravity /leader] Đang tiếp nhận Task #${taskId}...</b> <code>(⏱️ 0s)</code>\n\n` +
        `👤 <b>Người gửi:</b> ${escapeHtml(senderName)}\n` +
        (savedImagePaths.length > 0 ? `📸 <b>Hình ảnh:</b> <code>${savedImagePaths.length} ảnh đã lưu vào feedback dir</code>\n` : '') +
        `📝 <b>Yêu cầu:</b> <i>"${escapeHtml(rawPrompt)}"</i>\n` +
        `🤖 <b>Chế độ:</b> <code>/leader</code> (TMS Business Lead)\n` +
        `📁 <b>Thư mục đầu ra:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}/TODO.md</code>\n\n` +
        `💡 <i>Tiến trình AI đang rà soát ảnh chụp, kiểm tra codebase và tổng hợp TODO.md trên laptop. Tự động cập nhật mỗi 25s...</i>`);

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

      let progressText = isSyncMode
        ? `⏳ <b>[Antigravity /sync] Đang đồng bộ dev lên master Task #${taskId}...</b> <code>(⏱️ ${timeStr})</code>\n\n` +
          `🌿 <b>Nhánh:</b> <code>dev</code> ➔ <code>master</code> (Production)\n` +
          `🛡️ <b>Auditor:</b> <code>/git-commit-reviewer</code>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n`
        : (isTodoAgentMode
          ? `⏳ <b>[Antigravity todo-agent] Đang triển khai code Task #${taskId}...</b> <code>(⏱️ ${timeStr})</code>\n\n` +
            `📁 <b>Thư mục mục tiêu:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n`
          : `⏳ <b>[Antigravity /leader] Đang tổng hợp TODO.md Task #${taskId}...</b> <code>(⏱️ ${timeStr})</code>\n\n` +
            `📝 <i>"${escapeHtml(rawPrompt.length > 100 ? rawPrompt.slice(0, 97) + '...' : rawPrompt)}"</i>\n` +
            `📁 <b>Thư mục:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n`);

      if (conversationId) {
        progressText += `🆔 <b>Session:</b> <code>${conversationId.slice(0, 8)}...</code>\n`;
      }

      if (latestToolAction) {
        progressText += `📍 <b>Bước hiện tại (#${currentStepIndex}):</b> <code>${escapeHtml(latestToolAction)}</code>\n`;
      } else {
        progressText += isSyncMode
          ? `📍 <b>Trạng thái:</b> <i>Đang audit commit & merge submodules...</i>\n`
          : (isTodoAgentMode
            ? `📍 <b>Trạng thái:</b> <i>Đang đọc TODO.md và phân tích cấu trúc submodules...</i>\n`
            : `📍 <b>Trạng thái:</b> <i>Đang rà soát ảnh chụp và đối chiếu mã nguồn...</i>\n`);
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

        // NẾU LÀ TODO-AGENT MODE: KÍCH HOẠT DEV E2E QUALITY GATE TRƯỚC KHI BÁO CÁO TELEGRAM
        if (isTodoAgentMode) {
          console.log(`[Task #${taskId}] Tiến trình sửa code hoàn tất. Kích hoạt Dev E2E Quality Gate...`);

          // 1. Cập nhật trạng thái DB và Telegram
          await pool.query(`UPDATE telegram_tasks SET status = 'VERIFYING_DEV' WHERE id = $1;`, [taskId]);
          if (progressMsgId) {
            await editTelegramMessage(
              chatId,
              progressMsgId,
              `⏳ <b>[Task #${taskId}] Code đã commit & push lên Dev!</b>\n\n` +
              `🚀 <b>Trạng thái:</b> <i>Đang chờ Vercel & Render build deploy và chuẩn bị chạy Playwright E2E Suite...</i>`,
              'HTML',
              TASK_ACTIONS_KEYBOARD
            );
          }

          // 2. Chờ Dev Deployment sẵn sàng (khoảng 40s - 90s)
          const deployRes = await waitForDevDeployment(150, async (msg) => {
            if (progressMsgId) {
              await editTelegramMessage(
                chatId,
                progressMsgId,
                `⏳ <b>[Task #${taskId}] DEV QUALITY GATE ĐANG XỬ LÝ...</b>\n\n` +
                `🔄 <i>${escapeHtml(msg)}</i>\n` +
                `🌐 Backend Dev: <code>logistics-website-backend-1jho</code>\n` +
                `🌐 Frontend Dev: <code>logistics-website-frontend-git-dev</code>`,
                'HTML',
                TASK_ACTIONS_KEYBOARD
              );
            }
          });

          if (!deployRes.success) {
            console.error(`[Task #${taskId}] Dev Deployment wait failed:`, deployRes.error);
            const deployFailMsg =
              `⚠️ <b>[Task #${taskId}] CẢNH BÁO: DEV DEPLOYMENT TIMEOUT</b>\n\n` +
              `Mã nguồn đã được push lên nhánh <code>dev</code>, nhưng server Dev (Render/Vercel) chưa phản hồi trạng thái sẵn sàng trong thời gian quy định.\n` +
              `Lỗi: <code>${escapeHtml(deployRes.error)}</code>`;
            await sendTelegramMessage(chatId, deployFailMsg, 'HTML', TASK_ACTIONS_KEYBOARD);
            await pool.query(`UPDATE telegram_tasks SET status = 'DEV_DEPLOY_TIMEOUT', error = $1 WHERE id = $2;`, [deployRes.error, taskId]);
            resolve({ success: false, taskId, reason: 'DEPLOY_TIMEOUT' });
            return;
          }

          // 3. Tự động tìm file Playwright E2E spec tương ứng
          const specFile = detectTaskE2ESpec(feedbackDir, taskId);
          console.log(`[Task #${taskId}] Detected E2E Spec: ${specFile || 'NONE'}`);

          if (specFile) {
            if (progressMsgId) {
              await editTelegramMessage(
                chatId,
                progressMsgId,
                `⏳ <b>[Task #${taskId}] Đang chạy Playwright E2E trên Domain Dev...</b>\n\n` +
                `🧪 <b>Suite:</b> <code>frontend/${escapeHtml(specFile)}</code>\n` +
                `🎯 <b>Target:</b> <code>Vercel Dev & Render Dev</code>`,
                'HTML',
                TASK_ACTIONS_KEYBOARD
              );
            }

            // 4. Chạy Playwright E2E trên Domain Dev kèm cơ chế Auto-Fix Retry Loop (Tối đa MAX_E2E_RETRIES vòng lặp)
            let e2eResult = await runDevE2EVerification(feedbackDir, specFile);
            let e2eAttempt = 0;
            const retryHistory = [];

            while (!e2eResult.success && e2eAttempt < MAX_E2E_RETRIES) {
              e2eAttempt++;
              console.log(`\n⚠️ [Task #${taskId}] E2E Test FAIL lần ${e2eAttempt}/${MAX_E2E_RETRIES}. Kích hoạt Auto-Fix...`);

              // Lọc bỏ các cảnh báo npm/node vô hại để lấy đúng lỗi Playwright thực tế
              const cleanStderr = (e2eResult.stderr || '')
                .replace(/^npm warn.*$/gim, '')
                .replace(/^.*SECURITY WARNING.*$/gim, '')
                .trim();
              const failDetails = (cleanStderr || e2eResult.stdout || e2eResult.stderr || '').slice(-1200).trim();
              const errorContext = extractRecentPlaywrightErrorContext();

              retryHistory.push({
                attempt: e2eAttempt,
                exitCode: e2eResult.exitCode,
                failSummary: failDetails.slice(-300)
              });

              if (progressMsgId) {
                await editTelegramMessage(
                  chatId,
                  progressMsgId,
                  `🔄 <b>[Task #${taskId}] Dev E2E Fail (Lần ${e2eAttempt}/${MAX_E2E_RETRIES})...</b>\n\n` +
                  `🧪 <b>Suite:</b> <code>frontend/${escapeHtml(specFile)}</code>\n` +
                  `🤖 <b>Hành động:</b> <i>Đang khởi chạy AI phân tích RCA & tự động fix code...</i>`,
                  'HTML',
                  TASK_ACTIONS_KEYBOARD
                );
              }

              // Khởi chạy session AI sửa lỗi tự động
              const autoFixPrompt = buildE2EAutoFixPrompt({
                taskId,
                feedbackDir,
                specFile,
                attempt: e2eAttempt,
                maxAttempts: MAX_E2E_RETRIES,
                failDetails,
                errorContext
              });

              const fixSessionRes = await runAgyAutoFixSession({
                prompt: autoFixPrompt,
                chatId,
                progressMsgId,
                taskId,
                attempt: e2eAttempt,
                maxAttempts: MAX_E2E_RETRIES
              });

              console.log(`[Task #${taskId}] Auto-Fix Vòng ${e2eAttempt} hoàn tất (success: ${fixSessionRes.success}). Chờ deploy lại...`);

              // Đợi Vercel & Render redeploy sau khi AI đã push code fix lên nhánh dev
              const redeployRes = await waitForDevDeployment(150, async (msg) => {
                if (progressMsgId) {
                  await editTelegramMessage(
                    chatId,
                    progressMsgId,
                    `⏳ <b>[Task #${taskId}] DEV RETRY ${e2eAttempt}/${MAX_E2E_RETRIES} DEPLOYING...</b>\n\n` +
                    `🔄 <i>${escapeHtml(msg)}</i>\n` +
                    `🌐 Đang chuẩn bị chạy lại Playwright E2E...`,
                    'HTML',
                    TASK_ACTIONS_KEYBOARD
                  );
                }
              });

              if (!redeployRes.success) {
                console.warn(`[Task #${taskId}] Redeploy timeout ở vòng retry ${e2eAttempt}:`, redeployRes.error);
              }

              // Chạy lại Playwright E2E verification trên Domain Dev
              if (progressMsgId) {
                await editTelegramMessage(
                  chatId,
                  progressMsgId,
                  `⏳ <b>[Task #${taskId}] Đang chạy lại Playwright E2E (Vòng ${e2eAttempt}/${MAX_E2E_RETRIES})...</b>\n\n` +
                  `🧪 <b>Suite:</b> <code>frontend/${escapeHtml(specFile)}</code>\n` +
                  `🎯 <b>Target:</b> <code>Vercel Dev & Render Dev</code>`,
                  'HTML',
                  TASK_ACTIONS_KEYBOARD
                );
              }
              e2eResult = await runDevE2EVerification(feedbackDir, specFile);
            }

            // NẾU SAU MAX_E2E_RETRIES LẦN VẪN THẤT BẠI: BÁO CÁO TELEGRAM & ĐÁNH DẤU FAILED
            if (!e2eResult.success) {
              const cleanStderr = (e2eResult.stderr || '')
                .replace(/^npm warn.*$/gim, '')
                .replace(/^.*SECURITY WARNING.*$/gim, '')
                .trim();
              const failDetails = (cleanStderr || e2eResult.stdout || e2eResult.stderr || '').slice(-1200).trim();

              const retrySummaryText = retryHistory.length > 0
                ? `\n🔁 <b>Lịch sử thử lại:</b> Đã tự động phân tích & fix ${retryHistory.length}/${MAX_E2E_RETRIES} lần nhưng vẫn chưa vượt qua Quality Gate.\n`
                : '';

              const e2eFailMsg =
                `🔴 <b>[Task #${taskId}] DEV E2E TEST THẤT BẠI (ĐÃ VƯỢT QUÁ ${MAX_E2E_RETRIES} LẦN RETRY)</b> <code>(⏱️ ${timeStr})</code>\n\n` +
                `📁 <b>Thư mục:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
                `🧪 <b>File Test:</b> <code>frontend/${escapeHtml(specFile)}</code>\n` +
                retrySummaryText +
                `\n⚠️ <b>Chi tiết lỗi kiểm thử E2E trên Domain Dev (Lần cuối):</b>\n<pre>${escapeHtml(failDetails || 'Playwright E2E exit code non-zero')}</pre>\n\n` +
                `💡 <i>Vui lòng kiểm tra log hoặc chỉ dẫn AI can thiệp thủ công để giải quyết lỗi logic/dữ liệu.</i>`;

              if (progressMsgId) {
                await editTelegramMessage(chatId, progressMsgId, `🔴 <b>[Task #${taskId}] E2E Test trên Dev THẤT BẠI (Sau ${MAX_E2E_RETRIES} lần retry)!</b>`, 'HTML');
              }
              await sendTelegramMessage(chatId, e2eFailMsg, 'HTML', TASK_ACTIONS_KEYBOARD);

              await pool.query(`
                UPDATE telegram_tasks 
                SET status = 'DEV_E2E_FAILED', feedback_dir = $1, error = $2, completed_at = NOW() 
                WHERE id = $3;
              `, [feedbackDir, failDetails, taskId]);

              resolve({ success: false, taskId, exitCode: e2eResult.exitCode });
              return;
            }

            // E2E THÀNH CÔNG 100%: Gửi ảnh chụp nghiệm thu (nếu có)
            if (e2eResult.evidencePath) {
              const photoCaption =
                `📸 <b>[BẰNG CHỨNG NGHIỆM THU E2E TASK #${taskId}]</b>\n` +
                `✅ Đã kiểm thử thành công trên Domain Dev` +
                (e2eAttempt > 0 ? ` (Đã tự động sửa lỗi thành công sau ${e2eAttempt} lần retry)` : '') + `\n` +
                `🧪 Suite: <code>${escapeHtml(specFile)}</code>` +
                (e2eResult.auditScore ? ` (Audit: <b>${e2eResult.auditScore}/50</b> PASS)` : '');
              await sendTelegramPhoto(chatId, e2eResult.evidencePath, photoCaption, TASK_ACTIONS_KEYBOARD);
            }

            // Bổ sung thông tin E2E Pass vào báo cáo
            const retryNote = e2eAttempt > 0
              ? `• <b>Trạng thái Self-Healing:</b> 🔄 Tự động fix & vượt qua sau ${e2eAttempt}/${MAX_E2E_RETRIES} lần retry\n`
              : '';

            cleanOutput =
              `🟢 <b>THÔNG BÁO: ĐÃ TEST DEV XONG (E2E & ĐÁNH GIÁ CHÉO PASS 100%)</b>\n\n` +
              `• <b>Playwright E2E Test:</b> <code>${escapeHtml(specFile)}</code> (✅ PASS 100% trên Dev)\n` +
              retryNote +
              (e2eResult.auditScore ? `• <b>Điểm Audit E2E:</b> <b>${e2eResult.auditScore}/50</b> PASS\n` : '') +
              `• <b>Môi trường kiểm thử:</b> Domain Dev (Vercel & Render)\n\n` +
              cleanOutput;
          } else {
            console.warn(`[Task #${taskId}] Không tìm thấy file E2E spec riêng biệt cho task.`);
            cleanOutput =
              `⚠️ <b>CẢNH BÁO: Chưa tìm thấy file Playwright E2E spec riêng trong frontend/e2e/</b>\n` +
              `Server Dev đã sẵn sàng, nhưng cần bổ sung file spec E2E theo Section 5 của todo-agent.\n\n` +
              cleanOutput;
          }
        }

        const formattedHtml = markdownToTelegramHtml(cleanOutput);
        const gitDiff = getGitDiffStat();

        let finalReport = isSyncMode
          ? `🎯 <b>[KẾT QUẢ TASK #${taskId}] - ĐỒNG BỘ DEV ➔ MASTER HOÀN TẤT</b> <code>(⏱️ ${timeStr})</code>\n\n` +
            `👤 <b>Người yêu cầu:</b> ${escapeHtml(senderName)}\n` +
            `🛡️ <b>Auditor:</b> <code>/git-commit-reviewer</code> (Audit an toàn & Submodule-first push)\n` +
            `🌿 <b>Nhánh:</b> <code>dev</code> ➔ <code>master</code> (Production)\n` +
            (conversationId ? `🆔 <b>Session:</b> <code>${conversationId}</code>\n\n` : '\n') +
            formattedHtml
          : (isTodoAgentMode
            ? `🎯 <b>[KẾT QUẢ TASK #${taskId}] - TODO-AGENT HOÀN TẤT THỰC THI & DEV VERIFIED</b> <code>(⏱️ ${timeStr})</code>\n\n` +
              `📁 <b>Thư mục Feedback:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
              (hasTodoCreated ? `📄 <b>Checklist:</b> <code>${path.relative(WORKSPACE_DIR, todoFile)}</code>\n` : '') +
              (conversationId ? `🆔 <b>Session:</b> <code>${conversationId}</code>\n\n` : '\n') +
              formattedHtml
            : `🎯 <b>[KẾT QUẢ TASK #${taskId}] - TỔNG HỢP TODO.MD HOÀN TẤT</b> <code>(⏱️ ${timeStr})</code>\n\n` +
              `📁 <b>Thư mục Feedback:</b> <code>${path.relative(WORKSPACE_DIR, feedbackDir)}</code>\n` +
              (hasTodoCreated ? `📄 <b>File TODO:</b> <code>${path.relative(WORKSPACE_DIR, todoFile)}</code> (✅ Đã tạo thành công)\n` : '') +
              (savedImagePaths.length > 0 ? `📸 <b>Hình ảnh:</b> <code>${savedImagePaths.length} ảnh đã lưu trữ kèm TODO</code>\n` : '') +
              (conversationId ? `🆔 <b>Session:</b> <code>${conversationId}</code>\n\n` : '\n') +
              formattedHtml);

        if (gitDiff) {
          finalReport += `\n\n📊 <b>THAY ĐỔI MÃ NGUỒN (GIT DIFF):</b>\n<pre>${escapeHtml(gitDiff)}</pre>`;
        }

        if (progressMsgId) {
          const completionTitle = isSyncMode
            ? `Đã hoàn thành đồng bộ dev lên master`
            : (isTodoAgentMode
              ? `Đã hoàn thành thực thi & E2E Pass 100% trên Dev`
              : `Đã hoàn thành tổng hợp TODO.md`);
          await editTelegramMessage(chatId, progressMsgId, `✅ <b>[Task #${taskId}] ${completionTitle} trong ${timeStr}!</b>`, 'HTML');
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

  // Tự động thu hồi các task bị treo do worker trước đó bị kill/restart đột ngột
  try {
    const orphaned = await pool.query(`
      SELECT id, raw_prompt, sender_name FROM telegram_tasks 
      WHERE status IN ('IN_PROGRESS', 'VERIFYING_DEV')
        AND started_at < NOW() - INTERVAL '10 minutes';
    `);
    if (orphaned.rows && orphaned.rows.length > 0) {
      for (const row of orphaned.rows) {
        console.warn(`⚠️ Task #${row.id} ("${row.raw_prompt}") bị treo dở dang do worker trước đó restart. Đang cập nhật FAILED...`);
        await pool.query(`
          UPDATE telegram_tasks 
          SET status = 'FAILED', error = 'Tiến trình worker bị gián đoạn/restart trong khi đang xử lý tác vụ', completed_at = NOW() 
          WHERE id = $1;
        `, [row.id]);
      }
    }
  } catch (err) {
    console.warn('⚠️ Không thể kiểm tra orphan tasks:', err.message);
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
