import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('tools/telegram-task-runner/.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || process.env.ALLOWED_CHAT_ID || '-5509877448';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

const DEV_BUTTONS = {
  inline_keyboard: [
    [
      { text: '🌐 Domain Dev', url: 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app' },
      { text: '🌐 Domain Pro', url: 'https://logistics-website-frontend-kappa.vercel.app' },
    ],
    [
      { text: '📚 Swagger Dev', url: 'https://logistics-website-backend-1jho.onrender.com/docs' },
      { text: '📚 Swagger Pro', url: 'https://logistics-website-backend-1.onrender.com/docs' },
    ],
  ],
};

async function sendPhoto(imagePath, caption) {
  if (!fs.existsSync(imagePath)) return null;
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('photo', blob, path.basename(imagePath));
  if (caption) {
    formData.append('caption', caption.slice(0, 1020));
    formData.append('parse_mode', 'HTML');
  }
  const res = await fetch(`${API_BASE}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
}

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
  console.log(`Sending daily report to Telegram chat: ${CHAT_ID}...`);

  // 1. Send photo with summary caption
  const photoPath = path.resolve('feedback_09_10_task_10/screenshot_verified.png');
  const photoCaption = `<b>🟢 BÁO CÁO TIẾN ĐỘ & NGHIỆM THU NGÀY 09/10</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Tổng tiến độ:</b> 8/8 Task Feedback (100% Hoàn thành)\n` +
    `📋 <b>Checklist TODO:</b> 98/98 mục đã kiểm tra & tích xanh\n` +
    `🚀 <b>Môi trường Dev:</b> Vercel & Render đã triển khai READY\n` +
    `🧪 <b>Playwright E2E:</b> 8/8 tests PASSED (0 FAIL)`;

  const photoRes = await sendPhoto(photoPath, photoCaption);
  console.log('Photo sent:', photoRes.ok);

  // 2. Send detailed card list message
  const detailedText = `<b>📋 CHI TIẾT CÁC TASK HOÀN THÀNH HÔM NAY (09/10):</b>\n\n` +
    `🔹 <b>Task 1 (feedback_09_10): Phân Định Chuyến Xe Nhập Kho</b>\n` +
    `  ▫️ <b>Phạm vi:</b> Chuyến xe Nhập trực tiếp vs. Trung chuyển liên Hub\n` +
    `  ▫️ <b>Kết quả:</b> Ẩn hoàn toàn Step 2 và các nút "Xuất mới vào trip", "Bỏ qua xuất mới" đối với chuyến nhập trực tiếp.\n\n` +
    `🔹 <b>Task 4 (feedback_09_10_task_4): Xóa Nút Xem Tài Khoản Demo</b>\n` +
    `  ▫️ <b>Phạm vi:</b> Màn hình Đăng nhập (/auth/sign-in)\n` +
    `  ▫️ <b>Kết quả:</b> Loại bỏ 100% nút Demo, popup tài khoản và banner dùng thử. E2E verified 4/4 passed.\n\n` +
    `🔹 <b>Task 5 (feedback_09_10_task_5): Chống Autofill & Gợi Ý Username</b>\n` +
    `  ▫️ <b>Phạm vi:</b> Form Thêm Người Dùng (/dashboard/users)\n` +
    `  ▫️ <b>Kết quả:</b> Thuộc tính <code>autocomplete='off'</code>, nút "Gợi ý" tự sinh username chuẩn từ Họ & Tên.\n\n` +
    `🔹 <b>Task 6 (feedback_09_10_task_6): Chuẩn Hóa Bảng Con Dỡ Hàng</b>\n` +
    `  ▫️ <b>Phạm vi:</b> Bảng con kiện hàng nhập kho (/dashboard/warehouse/inbound)\n` +
    `  ▫️ <b>Kết quả:</b> Loại bỏ cột Trạng thái thừa, bảng đạt chuẩn 6 cột tinh gọn.\n\n` +
    `🔹 <b>Task 7, 8, 9, 10: Tái Cấu Trúc Bảng Đơn Hàng Kho 7 Cột</b>\n` +
    `  ▫️ <b>Phạm vi:</b> Quản lý Đơn hàng kho (/dashboard/warehouse/orders)\n` +
    `  ▫️ <b>Cấu trúc:</b> STT | NGÀY NHẬP | MÃ VẬN ĐƠN | SỐ LƯỢNG TỒN | TRẠNG THÁI | NGÀY XUẤT | THAO TÁC\n` +
    `  ▫️ <b>Ràng buộc:</b> Đơn <code>LƯU KHO</code> bắt buộc để trống cột Ngày xuất (<code>—</code>).\n` +
    `  ▫️ <b>Density:</b> Chuẩn giao diện hẹp, padding <code>p-1</code>, font <code>text-[10px]</code>.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>🔍 KIỂM THỬ & ĐỐI SOÁT CHẤT LƯỢNG:</b>\n` +
    `• <b>Backend Build:</b> NestJS 11 Passed (Exit 0)\n` +
    `• <b>Frontend Typecheck:</b> Next.js 15 App Router Passed (Exit 0)\n` +
    `• <b>Playwright E2E Suite:</b> <code>e2e/41-feedback-09-10-suite.spec.ts</code> (4/4 Passed)\n` +
    `• <b>Playwright Sign-In:</b> <code>e2e/40-feedback-09-10-task-4...</code> (4/4 Passed)\n` +
    `• <b>Hồ sơ kỹ thuật:</b> 8/8 <code>RESOLUTION.md</code> và <code>SYSTEM_TIMELINE.md</code> đã đồng bộ.`;

  const msgRes = await sendMessage(detailedText, DEV_BUTTONS);
  console.log('Message sent:', msgRes.ok);
}

main().catch(console.error);
