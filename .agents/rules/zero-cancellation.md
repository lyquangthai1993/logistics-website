# Zero Mid-Execution Cancellation Mandate (Quy chuẩn Tuyệt đối Không Hủy Tác Vụ Giữa Chừng)

## 1. Nguyên Tắc Cốt Lõi (Core Invariant)
Mọi quy trình CI/CD (GitHub Actions workflow), Local daemon / Background task runner (`neon-worker.mjs`, `bot.mjs`), và các phiên thực thi của agent BẮT BUỘC phải chạy trọn vẹn từ đầu đến cuối cho đến khi ra kết quả thực tế cuối cùng (`DONE` / `COMPLETED` / `TODO_CREATED`) hoặc thất bại rõ ràng (`FAILED`).

**Tuyệt đối KHÔNG có cơ chế hủy giữa chừng** dưới mọi hình thức.

---

## 2. Các Hành Vi Nghiêm Cấm Tuyệt Đối (Strictly Prohibited)

1. **Không Tự Động Hủy / Abort Tiến Trình**:
   - Nghiêm cấm thiết lập hoặc gọi bất kỳ cơ chế, API, hook, hay lệnh tự động nào để hủy ngang tiến trình đang chạy (`conclusion: cancelled`, `kill PID`, `abort`, `process.kill()`, `cancel-in-progress: true`).
   - Khi một tác vụ đã được đưa vào hàng đợi hoặc bắt đầu chạy, nó phải được hoàn tất 100%.

2. **Không Bố Trí Nút / Lệnh Hủy Trên Giao Diện & Bot**:
   - Nghiêm cấm hiển thị hoặc gán các nút bấm hủy (`/cancel`, `🛑 Hủy task`, `🛑 Hủy yêu cầu này`) trên Telegram Bot, giao diện điều khiển và workflow.
   - Tác vụ một khi đã kích hoạt sẽ không bị can thiệp hủy ngang để bảo đảm tính toàn vẹn của dữ liệu và hàng đợi trong PostgreSQL (`telegram_tasks`).

3. **Bảo Toàn Hàng Đợi Tuần Tự (Strict FIFO Queue Execution)**:
   - Nghiêm cấm hủy bỏ tác vụ đang xếp hàng (`PENDING`) hoặc đang chạy (`IN_PROGRESS`) chỉ vì có tác vụ mới tới.
   - Mọi tác vụ phải được xếp hàng và xử lý tuần tự từng task một một cách triệt để (`cancel-in-progress: false`).
