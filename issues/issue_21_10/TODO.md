# TODO: Điều Tra & Xử Lý Sai Lệch Tồn Kho Đơn Hàng (NDA2610-0213) & Hệ Thống Audit Log

## Bối Cảnh & Vấn Đề
- **Mã vận đơn**: `NDA2610-0213` (Order ID: 19, Andromeda Hub - HCM)
- **Hiện tượng**:
  * Khi xuất file Excel tồn kho: hiển thị đúng **161 kiện** (công thức sổ cái từ bảng giao dịch).
  * Trên giao diện hệ thống (Admin): hiển thị Tổng nhập **1405**, Tổng xuất **301**, Tồn khả dụng **1104**.
  * Khi dùng tài khoản admin mở lại chuyến xe để chỉnh sửa (xóa phiếu, giảm số lượng): số lượng tồn trên hệ thống không giảm theo do `order.totalQuantity` bị giữ ở mức đỉnh (High-Water Mark) và Admin không có Hub-scoping (`hubId = null`).
  * Backend trước đó chưa có cơ chế lưu vết thao tác người dùng (User Activity / Audit Log).

---

## Danh Sách Hạng Mục Thực Thi (6-Stage SDLC)

### Giai đoạn 1 & 2: Thiết Kế & Chuẩn Bị (PLAN & DESIGN)
- [x] Điều tra thực tế dữ liệu trong Database Dev (đã dump từ Production).
- [x] Xác định nguyên nhân gốc (RCA):
  * `rollbackTrip` không hoàn tác `totalQuantity`.
  * `aggregateOrderGroup` ép `normalizedTotalQty` theo `rawTotalQty` của `order.totalQuantity`.
  * Tài khoản Super Admin (`hubId = null`) fallback sai công thức khi không có ngữ cảnh Hub.
- [x] Lập kế hoạch kiến trúc: Bảng `order_activity_log`, cơ chế tái đồng bộ số lượng, Agent điều tra log.

### Giai đoạn 3: Xây Dựng (BUILD)
#### 1. Backend Core & Schema
- [x] Tạo Migration & Entity `OrderActivityLogEntity` (`order_activity_log`):
  * Cột: `id`, `orderId`, `orderCode`, `action`, `actorUserId`, `actorEmail`, `actorRole`, `hubId`, `hubName`, `tripCode`, `oldValues`, `newValues`, `quantity`, `reason`, `createdAt`.
- [x] Tạo `OrderActivityLogService` và đăng ký trong `OrdersModule`.
- [x] Tạo REST Endpoint: `GET /api/v1/orders/code/:orderCode/activity-logs` & `POST /api/v1/orders/code/:orderCode/reconcile`.
- [x] Hook lưu vết Audit Log vào các thao tác:
  * `rollbackTrip` (Admin rollback chuyến xe).
  * `cancelInboundDraft` & `cancelOutboundDraft` (Hủy chuyến nháp).
  * `confirmInbound` (Nhập kho lẻ, nhập kho chuyến, nhập kho hàng loạt).
  * `adminOverride` (Ghi đè hợp đồng vận tải).

#### 2. Sửa Lỗi Tính Toán & Hoàn Tác (Bugfix)
- [x] Sửa `rollbackTrip`: khi rollback chuyến nhập kho, trừ và tái tính toán `order.totalQuantity` & `order.inboundQuantity` tương ứng với số lượng giao dịch bị hủy, đồng thời tự động tái đồng bộ theo các giao dịch còn hiệu lực.
- [x] Sửa `aggregateOrderGroup` & `getOrders`:
  * Khi người dùng là Admin (`user.hubId = null`), tính toán tồn kho khả dụng dựa trên tổng giao dịch thực tế đang hoạt động (`active transactions`) thay vì fallback về `normalizedTotalQty - totalOutbound`.
  * Tính toán `inboundQuantity` (462) và `totalQuantity` (462) đồng bộ chính xác theo các giao dịch hợp lệ (`deletedAt IS NULL`).

#### 3. Data Reconciliation (Khôi Phục Dữ Liệu Chuẩn)
- [x] Đã áp dụng migration và chạy hiệu chỉnh dữ liệu trên Dev DB cho đơn hàng `NDA2610-0213`:
  * `totalQuantity`: 462
  * `inboundQuantity`: 462
  * `outboundQuantity`: 301
  * `remainingQuantity`: 161
  * `status`: 'INBOUND'
- [x] Ghi nhận bản ghi audit log id 1 đánh dấu thời điểm hiệu chỉnh dữ liệu.

#### 4. Frontend UI
- [x] Cập nhật `WarehouseWaybillDetailModal`:
  * Tích hợp phần hiển thị "Nhật ký thao tác & Thay đổi dữ liệu" (Audit Logs) bên cạnh "Lịch sử biến động kho".
  * Tính toán tồn luỹ kế theo dòng thời gian (running balance) giúp người dùng thấy biến động tăng/giảm chính xác.
  * Hiển thị chính xác các Stat Cards (Tổng đã nhập: 462 kiện, Tổng đã xuất: 301 kiện, Tồn khả dụng: 161 kiện) đối với cả Admin và Quản lý kho.
- [x] Cập nhật `WarehouseTripDetailModal`:
  * Đưa nút `Mở lại chuyến xe (Rollback)` ra thanh tác vụ của Quản trị viên để Admin có thể thực hiện hoàn tác ngay trong chế độ xem (`readOnly`).
  * Khắc phục độ nhạy nút xác nhận hoàn tác `Xác nhận Mở lại`.

#### 5. Log Investigation Agent (Agent Điều Tra Thao Tác)
- [x] Xây dựng công cụ Agent CLI `scripts/order-audit-agent.mjs` (`npm run order:audit <orderCode>`):
  * Tự động quét DB, phân tích toàn bộ lịch sử biến động kho và nhật ký thao tác.
  * Xuất bảng so sánh DB vs Sổ cái thực tế, timeline chi tiết, các giao dịch bị hủy/rollback.
  * Hỗ trợ cờ `--fix` để tự động khôi phục dữ liệu nếu phát hiện lệch tồn.
- [x] Đã tạo tài liệu hướng dẫn Agent tại `.agents/skills/order-audit-agent/SKILL.md`.

### Giai đoạn 4: Kiểm Thử (TEST)
- [x] Typecheck & Build Backend NestJS: PASS 100%.
- [x] Typecheck & Build Frontend Next.js: PASS 100%.
- [x] Kiểm thử trực tiếp với CLI Agent `node scripts/order-audit-agent.mjs NDA2610-0213`: PASS 100% khớp (462 nhập, 301 xuất, 161 tồn).
- [x] Thực thi Playwright E2E tự động mô phỏng luồng thao tác Quản trị viên Rollback chuyến xe (`frontend/e2e/99-admin-rollback-documentation.spec.ts`): PASS 100%.
- [x] Chụp và lưu trữ 4 ảnh chứng thực tế vào `issues/issue_21_10/`:
  * `screenshot_01_admin_rollback_button.png`: Vị trí nút Rollback trên chuyến xe hoàn tất.
  * `screenshot_02_rollback_reason_dialog.png`: Hộp thoại nhập lý do hoàn tác của Admin.
  * `screenshot_03_reopened_pending_trip.png`: Chuyến xe được mở khóa và đưa về trạng thái Chờ xử lý (PENDING).
  * `screenshot_04_audit_log_verified.png`: Sổ cái tồn chạy và Bảng nhật ký kiểm toán Audit Log.
- [x] Hoàn thiện tài liệu nghiệm thu & cẩm nang vận hành tại `issues/issue_21_10/RESOLUTION.md`.
