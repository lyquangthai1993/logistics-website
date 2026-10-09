import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('tools/telegram-task-runner/.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || process.env.ALLOWED_CHAT_ID || '-5509877448';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

const BUTTONS = {
  inline_keyboard: [
    [
      { text: '🌐 Domain Pro', url: 'https://logistics-website-frontend-kappa.vercel.app' },
      { text: '🌐 Domain Dev', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
    ],
    [
      { text: '📚 Swagger Pro', url: 'https://logistics-website-backend-1.onrender.com/docs' },
      { text: '📚 Swagger Dev', url: 'https://logistics-website-backend-1jho.onrender.com/docs' },
    ],
  ],
};

async function sendMessage(text, replyMarkup = null) {
  const payload = {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

async function main() {
  console.log(`Sending sync notification to Telegram chat: ${CHAT_ID}...`);

  const messageText = `<b>🟢 ĐỒNG BỘ HOÀN TẤT NHÁNH DEV ➔ MASTER (PRODUCTION SYNC)</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Toàn bộ mã nguồn và hồ sơ kỹ thuật đã được đồng bộ 100% giữa <code>dev</code> và <code>master</code> trên cả 3 repositories:\n\n` +
    `🔹 <b>1. Backend Submodule (logistics-website-backend)</b>\n` +
    `  ▫️ <b>Commit đồng bộ:</b> <code>c9772de</code> (dev ↔ master)\n` +
    `  ▫️ <b>Nội dung:</b> Partial Unique Index giải quyết triệt để lỗi 500 tạo user, chuẩn hóa DTO Swagger, ràng buộc ngày xuất kho và phân loại chuyến xe nhập trực tiếp.\n\n` +
    `🔹 <b>2. Frontend Submodule (logistics-website-frontend)</b>\n` +
    `  ▫️ <b>Commit đồng bộ:</b> <code>00973cd</code> (dev ↔ master)\n` +
    `  ▫️ <b>Nội dung:</b> Bảng Quản lý đơn hàng kho chuẩn 7 cột & 11 cột No-SKU, guard ngày xuất (để trống khi lưu kho), xóa nút Demo, form user chống autofill + gợi ý username thông minh.\n\n` +
    `🔹 <b>3. Root Repository (logistics-website)</b>\n` +
    `  ▫️ <b>Commit đồng bộ:</b> <code>c4ec82f</code> (dev ↔ master)\n` +
    `  ▫️ <b>Nội dung:</b> Cập nhật submodule pointers, đồng bộ 8/8 hồ sơ <code>RESOLUTION.md</code>, biên niên sử <code>SYSTEM_TIMELINE.md</code> và ảnh minh chứng Playwright E2E.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🚀 <b>TRẠNG THÁI TRIỂN KHAI CLOUD:</b>\n` +
    `• <b>Frontend Pro (Vercel):</b> Đang tự động build từ commit <code>00973cd</code>\n` +
    `• <b>Backend Pro (Render):</b> Đang tự động build từ commit <code>c9772de</code>\n` +
    `• <b>Kiểm thử chất lượng:</b> 100% E2E Playwright test suites đã pass trên Dev trước khi promote lên Production.`;

  const res = await sendMessage(messageText, BUTTONS);
  console.log('Sync notification sent:', res.ok);
}

main().catch(console.error);
