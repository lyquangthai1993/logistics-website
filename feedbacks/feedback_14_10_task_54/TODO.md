# Feedback 14/10 (Task #54) — Thiết Kế Đồng Bộ 2 Nút "Tiếp tục" & "Hủy nháp" Trên Màn Hình Nhập Kho Tương Tự Màn Hình Xuất Kho

> **Thời gian ghi nhận**: 14/10/2026  
> **Người báo cáo**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**:  
> - Frontend ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Bổ sung nút "Hủy nháp" (variant outline đỏ, icon `IconTrash`, kích thước `h-7`, `text-[11px]`) đứng cạnh nút "Tiếp tục" cho các chuyến xe trạng thái `Chờ xử lý` (`isPending`).  
> - Backend Controller ([`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts)) ➔ Thêm endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` cho phép thủ kho / Super Admin hủy chuyến xe nhập nháp chưa xử lý.  
> - Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Cài đặt phương thức `cancelInboundDraft` xử lý transaction soft-delete `trip_stop`, `order` nháp và `trip` nháp an toàn.  
> - N8N Task Router & GitHub Actions CI/CD ([`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs), [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml)) ➔ Sửa lỗi đường dẫn tuyệt đối Windows và siết chặt Quality Gate ngăn báo cáo hoàn thành khống khi 0 file bị sửa.  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Màn hình Xuất kho đối chiếu ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1220-L1238))  
> - Quy chế giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md)  
> - Ảnh chụp feedback đính kèm: [`feedbacks/feedback_14_10_task_54/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_54/screenshot_01.jpg)  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng & Ảnh screenshot_01.jpg)

### 1. Phản hồi gốc từ người dùng
> *"màn hình nhập kho hãy thiết kế 2 nút tiêp tục và hủy nháp giống như màn hình xuất kho"*

Kèm ảnh chụp màn hình thực tế: `feedbacks/feedback_14_10_task_54/screenshot_01.jpg` hiển thị danh sách chuyến xe tại màn hình **Nhập kho • Andromeda Hub - HCM**. Vùng khoanh đỏ đóng khung nút **"✎ Tiếp tục"** ở cột THAO TÁC của chuyến xe `SD49` (trạng thái Chờ xử lý).

### 2. Phân tích trải nghiệm người dùng & tính đồng bộ hệ thống
1. **Thiếu sót trên giao diện cũ của Màn hình Nhập kho**:
   - Ở màn hình **Xuất kho**, với các chuyến xe ở trạng thái `Chờ xử lý`, thủ kho có cả 2 lựa chọn:
     - `Tiếp tục`: Mở modal kiểm đếm / chỉnh sửa để hoàn thiện phiếu.
     - `Hủy nháp`: Xóa bỏ chuyến nháp đã tạo nhầm hoặc tài xế hủy nhận chuyến, giúp bảng điều hành không bị ứ đọng dữ liệu rác.
   - Ở màn hình **Nhập kho**, trước đây chỉ có 1 nút duy nhất là `Tiếp tục`. Khi thủ kho tạo nháp một chuyến nhập xe hoặc bấm nhầm thông tin chuyến xe đến, không có cách nào hủy bỏ chuyến nháp đó trực tiếp trên bảng điều khiển.
2. **Quy chuẩn thiết kế đồng bộ**:
   - Bố cục: Nút `Tiếp tục` (xanh `#0F3D62`, viền xanh) và nút `Hủy nháp` (chữ đỏ `text-red-600`, viền đỏ `border-red-200`, icon `IconTrash`, loading spinner `IconLoader2`).
   - Kích thước: `h-7`, `text-[11px]`, padding `px-2 font-semibold` chuẩn Compact Density (quy chuẩn giao diện hẹp tối đa thông tin).

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Backend (NestJS 11)
- [x] Tạo endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` trong [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts) với quyền `SUPER_ADMIN, WAREHOUSE_MANAGER`.
- [x] Triển khai hàm `cancelInboundDraft` trong [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts) với transaction an toàn:
  - [x] Soft-delete bản ghi trạm dừng `trip_stop` tương ứng trạng thái `PENDING` tại Hub.
  - [x] Soft-delete các bản ghi đơn hàng `order` trạng thái `DRAFT`/`PENDING` gắn với chuyến xe.
  - [x] Soft-delete bản ghi `trip` trạng thái `PENDING`.
- [x] Kiểm tra biên dịch backend: `npm --prefix backend run build` đạt `Exit code 0`.

### 2. Frontend (Next.js 15 App Router)
- [x] Bổ sung import `IconTrash` trong [`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx).
- [x] Thêm state `cancellingDraftCode` quản lý trạng thái loading khi đang xóa chuyến nháp.
- [x] Cài đặt hàm `handleCancelDraft(tripCode: string)`:
  - [x] Xác nhận người dùng qua hộp thoại `window.confirm`.
  - [x] Gọi API `DELETE /api/v1/warehouse/inbound/drafts/:tripCode`.
  - [x] Hiển thị toast thông báo thành công và gọi lại `fetchKpi()` + `fetchInboundTrips()` để làm mới dữ liệu.
- [x] Cập nhật ô THAO TÁC cho hàng `isPending`: Render đồng bộ 2 nút `Tiếp tục` và `Hủy nháp`.
- [x] Kiểm tra biên dịch frontend: `npm --prefix frontend run build` đạt `Exit code 0`.

### 3. Quy trình CI/CD & N8N Task Router (Ngăn ngừa lỗi lặp lại)
- [x] Sửa đường dẫn tương đối trong [`tools/telegram-task-runner/update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs) thay vì hardcode `D:\Projects\...`.
- [x] Thay thế biến `<id>` bằng task ID thực tế trước khi gửi payload sang GitHub Actions.
- [x] Bổ sung cơ chế Quality Gate trong [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml): Nếu task nghiệp vụ kết thúc mà không có bất kỳ file nào được tạo hoặc sửa đổi, bắt buộc đánh dấu `FAILED` và báo lỗi, không được phép hoàn thành khống.
