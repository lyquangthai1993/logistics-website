# Antigravity AI Telegram Task Runner

Công cụ cho phép điều khiển và giao việc cho Antigravity AI Agent tự động phân tích code, fix bug, chạy test trong dự án `logistics-website` từ xa thông qua ứng dụng Telegram trên điện thoại/máy tính.

---

## 1. Cấu hình (`.env`)

File cấu hình được đặt tại `tools/telegram-task-runner/.env` (đã được cấu hình sẵn và tự động git-ignore để bảo mật):

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ALLOWED_CHAT_ID=your_chat_or_group_id_here
WORKSPACE_PATH=c:\Projects\logistics-website
```

---

## 2. Cách khởi động Bot

Chạy một trong hai lệnh sau từ thư mục gốc dự án:

```powershell
npm run telegram:bot
```

Hoặc:

```powershell
node tools/telegram-task-runner/bot.mjs
```

Khi bot khởi động thành công, nó sẽ gửi tin nhắn thông báo màu xanh `🟢 Antigravity AI Task Runner đã sẵn sàng!` vào nhóm Telegram `N8N Notification`.

---

## 3. Danh sách lệnh trên Telegram

| Lệnh | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| **Gửi ảnh + Chú thích** *(Khuyên dùng)* | Gửi ảnh chụp bug / giao diện kèm dòng chữ mô tả | Gửi ảnh chụp màn hình + chú thích: `Sửa lỗi căn giữa nút này và thu gọn padding như trong ảnh` |
| `/task <yêu cầu>` | Giao task mới cho AI Agent thực hiện tự động | `/task Sửa lỗi layout mobile bảng xe trên trang waybills` |
| `/continue <yêu cầu>` | Tiếp tục phiên làm việc trước để sửa thêm (hỗ trợ kèm ảnh) | `/continue Viết thêm unit test cho hàm vừa tạo` |
| `/status` | Xem branch và trạng thái Git của cả 3 repo (`root`, `backend`, `frontend`) | `/status` |
| `/diff` | Xem thống kê các file và dòng code vừa sửa (`git diff --stat`) | `/diff` |
| `/proweb` | Mở nhanh link Web Production (Pro), Backend & Swagger API | `/proweb` (hoặc bấm `🚀 Mở Pro Web`) |
| `/devweb` | Mở nhanh link Web Development (Dev), Backend & Swagger API | `/devweb` (hoặc bấm `🌐 Mở Dev Web`) |
| `/cancel` | Hủy ngay lập tức task đang chạy | `/cancel` |
| `/help` | Xem danh sách hướng dẫn lệnh | `/help` |

---

## 4. Cơ chế hoạt động & An toàn

1. **Long Polling**: Bot kết nối trực tiếp đến máy chủ Telegram mà không cần cấu hình Port Forwarding, Domain hay Webhook.
2. **Whitelist Chat ID**: Bot chỉ chấp nhận lệnh từ duy nhất Group/User được cấu hình (`-5509877448`), ngăn chặn truy cập trái phép.
3. **Antigravity CLI (`agy`)**: Thực thi trong môi trường an toàn của workspace, tự động gửi báo cáo tóm tắt và diff file sau khi hoàn tất.
