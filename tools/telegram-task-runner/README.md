# Antigravity AI Telegram Task Runner

Công cụ cho phép điều khiển và giao việc cho Antigravity AI Agent tự động phân tích nghiệp vụ TMS, rà soát mã nguồn, fix bug, chạy test trong dự án `logistics-website` từ xa thông qua ứng dụng Telegram.

---

## 1. Kiến trúc Hai Phương Án (Architecture)

### Phương án 1 (Khuyên dùng - Cloud Webhook + Neon Queue + Local Worker)
```
Telegram Group (-5509877448) 
   │
   ▼ (Webhook)
n8n Cloud trên Render (https://n8n-n0al.onrender.com)
   │
   ▼ (Lọc chat, Format prompt & Kích hoạt role /leader)
Neon PostgreSQL (telegram_tasks queue)
   │
   ▼ (Polling FIFO, atomic status claim)
Local Worker Daemon (neon-worker.mjs trên laptop)
   │
   ▼ (Chạy agy trong D:\Projects\logistics-website với skill /leader)
Antigravity AI Engine
   │
   ▼ (Báo cáo trực tiếp tiến độ 25s, Git diff & Kết quả cuối cùng)
Telegram Group + Cập nhật trạng thái COMPLETED trong Neon DB
```

### Phương án 2 (Direct Local Long-Polling)
- Chạy trực tiếp `bot.mjs` trên máy local qua cơ chế `getUpdates`.

---

## 2. Cấu hình (`.env`)

File cấu hình đặt tại `tools/telegram-task-runner/.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ALLOWED_CHAT_ID=-5509877448
DATABASE_URL=postgresql://username:password@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
WORKSPACE_PATH=D:\Projects\logistics-website
```

---

## 3. Cách khởi động Local Worker (Phương án 1)

1. **Khởi động 1-click**: Double click vào file `start-neon-worker.bat`.
2. **Khởi động qua dòng lệnh**:
   ```powershell
   cd D:\Projects\logistics-website\tools\telegram-task-runner
   node neon-worker.mjs
   ```

Khi khởi động, worker sẽ:
- Kết nối tới hàng đợi Neon PostgreSQL.
- Tự động nhận diện `agy.exe` trên hệ thống.
- Lắng nghe các tác vụ `PENDING`, tự động chuyển sang `IN_PROGRESS`.
- Kích hoạt role `/leader` (TMS Domain Architecture Lead) để khảo sát codebase `D:\Projects\logistics-website`.
- Báo cáo kết quả trực tiếp và cập nhật `COMPLETED` trong Neon DB.

---

## 4. Cách sử dụng trên Telegram

Gửi tin nhắn hoặc yêu cầu trực tiếp vào nhóm Telegram `-5509877448`:
- Gõ tự do hoặc kèm tiền tố:
  - `/leader <yêu cầu>`
  - `/task <yêu cầu>`
  - `/fix <yêu cầu>`
- Hệ thống sẽ phản hồi:
  1. `⏳ [Task #X Đã ghi nhận vào hàng đợi]` (từ n8n Cloud).
  2. `⏳ [Antigravity /leader] Đang thực thi Task #X...` (từ Local Worker).
  3. Cập nhật tiến độ mỗi 25s (kèm bước công cụ đang chạy).
  4. `🎯 [KẾT QUẢ TASK #X] - /leader HOÀN THÀNH` (kèm Git diff và thông số kỹ thuật).
