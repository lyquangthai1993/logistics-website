# Feedback 14/10 - Task #67: Cải Thiện Cơ Chế Reply Telegram (Chia Nhỏ / Tinh Gọn) & Quét Hàng Đợi Task DB

**Thời gian ghi nhận:** 14/10/2026  
**Người yêu cầu:** Thai (`-5509877448`)  
**Màn hình / Module liên quan:** Telegram Bot Task Runner, GitHub Actions Workflow (`telegram-agy-worker.yml`), Local Daemon (`neon-worker.mjs`), n8n Task Orchestrator  
**Tài liệu tham chiếu:** [`AGENTS.md`](../../AGENTS.md), [`telegram-task-responder`](../../.agents/skills/telegram-task-responder/SKILL.md)

---

## 📌 1. Bối Cảnh Nghiệp Vụ Thực Tế & Phản Hồi Người Dùng
- **Yêu cầu từ người dùng:**
  > *"cải thiện khả năng reply vào telegram khi nội dung tin nhắn vượt quá giới hạn, có thể tinh gọn hoặc tách ra nhiều đợt reply"*
  > *"bonus thêm cải thiện cách quét task để không bị tình trạng 'Nguyên Nhân Task #67 Bị Bỏ Sót / Chưa Được Chạy'"*
- **Thực trạng phát sinh:**
  1. Khi kết quả thực thi AI (agy output, test log, bảng DoD) hoặc Git Diff dài, GitHub Actions Worker trước đây cắt cụt thô bạo (`slice(0, 1500)` và `slice(0, 1200)`) kèm dòng thông báo `...[cắt bớt do giới hạn Telegram]`. Người dùng nhận báo cáo bị mất thông tin quan trọng.
  2. Khi Local Daemon (`neon-worker.mjs`) chia tin nhắn, thuật toán cắt chuỗi theo độ dài vô tình xẻ đôi các thẻ HTML (`<pre>`, `<code>`, `<b>`), khiến Telegram Bot API từ chối (`can't parse entities`), buộc phải fallback xóa toàn bộ thẻ và hiển thị văn bản thô mất thẩm mỹ.
  3. Khi có nhiều task gửi liên tiếp (như Task #67 gửi lúc 12:32:29 và Task #68 gửi lúc 12:32:32), GitHub Actions Worker nhận `client_payload.task_id` đơn lẻ. Do concurrency hoặc hủy run, Task #67 bị bỏ sót ở trạng thái `PENDING` vĩnh viễn trong Database vì worker không có cơ chế quét hàng đợi FIFO từ Neon DB.

---

## 🔍 2. Phân Tích Kỹ Thuật & Nguyên Nhân Gốc Rễ (RCA)

1. **Giới hạn Telegram Bot API**:
   - `sendMessage`: Tối đa **4,096 ký tự**.
   - `sendPhoto` caption: Tối đa **1,024 ký tự**.
2. **Thiếu Modular Dispatching**:
   - Worker trước đây dồn cả Header, Error, Result và Diff vào 1 tin nhắn duy nhất, khiến dung lượng vượt 4096 ký tự ngay cả với các task vừa phải.
3. **Thuật toán Chunking không nhận thức ngữ cảnh HTML (HTML-unaware slicing)**:
   - Cắt chuỗi thuần túy tại vị trí byte/ký tự mà không kiểm tra stack thẻ HTML đang mở.
4. **Cơ chế nạp Task bị lệ thuộc vào Webhook Payload thay vì Database Queue**:
   - GitHub Actions `telegram-agy-worker.yml` chỉ đọc `TASK_ID` từ `github.event.inputs` hoặc `github.event.client_payload`.
   - Nếu workflow run bị bỏ lỡ, task trong DB sẽ không bao giờ được tự động phục hồi hay quét lại.

---

## 📋 3. Danh Sách Công Việc Triển Khai (Action Checklist)

### A. Module Telegram Reply & HTML-Safe Chunking (Task #67 Core)
- [x] **A1. Xây dựng hàm `splitTelegramHtml(text, maxLen = 3800, options)`**:
  - Tạo module [`tools/telegram-task-runner/split-html.mjs`](../../tools/telegram-task-runner/split-html.mjs).
  - Tách nội dung theo ranh giới khối (`\n\n`, `\n`, space).
  - Quét stack và theo dõi trạng thái các thẻ HTML (`<pre>`, `<code>`, `<b>`, `<i>`, `<a>`, `<blockquote>`).
  - Tự động đóng thẻ ở cuối chunk và mở lại thẻ ở đầu chunk tiếp theo kèm nhãn `📄 [Phần X/Y]`.
- [x] **A2. Cải tiến cấu trúc báo cáo kết quả trên GitHub Actions (`telegram-agy-worker.yml`)**:
  - **Đợt 1 (Executive Summary Card + Photo)**: Gửi thẻ tóm tắt qua `sendPhoto` (kèm ảnh nghiệm thu nếu có) hoặc `sendMessage` ($\le 800$ ký tự, đảm bảo không bao giờ chạm trần 1024 ký tự caption).
  - **Đợt 2 (Kết quả thực thi chi tiết / Bảng DoD / Log lỗi)**: Gửi toàn bộ log kết quả sử dụng `splitTelegramHtml`. Xóa bỏ hoàn toàn cơ chế cắt cụt `...[cắt bớt do giới hạn Telegram]`, giữ tới 80 dòng kết quả gần nhất.
  - **Đợt 3 (Thống kê Git Diff)**: Nếu có thay đổi mã nguồn, gửi riêng khối `<pre>Git Diff</pre>` (chunking nếu dài).
- [x] **A3. Đồng bộ hóa logic sang Local Daemon (`tools/telegram-task-runner/neon-worker.mjs`)**:
  - Nhúng module `splitTelegramHtml` vào `sendTelegramMessage` trong `neon-worker.mjs`.

### B. Module Quét Hàng Đợi Thông Minh (Bonus Requirement)
- [x] **B1. Chuyển đổi GitHub Actions Worker sang cơ chế Database-Driven Task Claiming**:
  - Tại bước `intake-task`:
    - Truy vấn Neon DB để claim task `PENDING` theo thứ tự FIFO (`ORDER BY id ASC LIMIT 1`).
    - Nếu có `TASK_ID` được truyền vào, kiểm tra xem task đó có tồn tại và hợp lệ không; nếu có task `PENDING` cũ hơn bị kẹt, ưu tiên hoàn thành task cũ trước theo thứ tự FIFO.
    - Đọc `raw_prompt`, `analysis`, `mode`, `sender_name` trực tiếp từ Neon DB thay vì tin tưởng 100% vào payload.
    - Xuất thông tin task được claim ra `$GITHUB_OUTPUT` (`task_id`, `prompt`, `sender_name`, `mode`, `has_task`) để các bước sau sử dụng.
- [x] **B2. Tự động kích hoạt task kế tiếp (Auto-Drain Queue)**:
  - Khi hoàn thành hoặc thất bại một task trong `finalize-task`, kiểm tra xem trong Neon DB còn task nào có `status = 'PENDING'` không.
  - Nếu còn task `PENDING`, tự động gọi GitHub Dispatch API để kích hoạt run mới xử lý task tiếp theo, triệt tiêu hoàn toàn tình trạng sót task.

### C. Kiểm Thử & Nghiệm Thu
- [x] **C1. Viết script kiểm thử gửi tin nhắn dài (`test-telegram-live-split.mjs`)**:
  - Gửi nội dung mẫu dài 5,908 ký tự có chứa bảng log, thẻ `<pre>`, `<code>`, `<b>` về Telegram bot.
  - Xác nhận gửi thành công 4 tin nhắn liên tiếp (Message IDs: 805, 806, 807, 808), format HTML hiển thị chuẩn, không có lỗi parser.
- [x] **C2. Cập nhật và nghiệm thu Task #67 trong Database**:
  - Cập nhật bản ghi Task #67 trong `telegram_tasks` sang `COMPLETED` với đầy đủ kết quả kỹ thuật.

---

## 📸 4. Bằng Chứng Kỹ Thuật & Nhật Ký Kiểm Thử

```
🚀 Đang kiểm thử trực tiếp cơ chế chia nhỏ tin nhắn an toàn HTML trên Telegram...
✅ Gửi tin nhắn thành công, Message ID: 805 (Executive Summary Card)
Độ dài nội dung dài: 5908 ký tự (vượt ngưỡng Telegram 4096 ký tự)
Thuật toán đã chia thành 3 phần.
Đang gửi phần 1/3 (độ dài 2451 ký tự)...
✅ Gửi tin nhắn thành công, Message ID: 806
Đang gửi phần 2/3 (độ dài 2435 ký tự)...
✅ Gửi tin nhắn thành công, Message ID: 807
Đang gửi phần 3/3 (độ dài 1107 ký tự)...
✅ Gửi tin nhắn thành công, Message ID: 808
🎉 Hoàn tất toàn bộ kịch bản kiểm thử trực tiếp lên Telegram!
```
