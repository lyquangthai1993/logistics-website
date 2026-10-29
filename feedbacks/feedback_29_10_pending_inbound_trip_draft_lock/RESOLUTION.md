# RESOLUTION: Feedback 29/10 — Xử Lý Chuyến Nhập Nháp & Khóa Xuất Kho Theo Quy Chuẩn Vận Hành

## 1. Bối cảnh & Yêu cầu Nghiệp vụ
1. **Khóa Xác nhận xuất kho khi đơn hàng còn chuyến xe nhập nháp (PENDING)**:
   - Một đơn hàng có thể về nhiều đợt (nhiều chuyến xe nhập kho khác nhau, ví dụ đơn 31 kiện về 19 kiện hôm qua và 12 kiện hôm nay).
   - Khi tạo phiếu xuất kho (khách nhận hoặc luân chuyển Hub), nếu phát hiện trong phiếu có đơn hàng mà một phần số kiện vẫn đang nằm ở chuyến xe nhập kho trạng thái **Chờ xử lý (PENDING)**:
     - Hệ thống **CHỈ CHO PHÉP LƯU NHÁP** để lập kế hoạch xe trước.
     - Nút **"Xác nhận xuất kho"** bị vô hiệu hóa (disabled).
     - Hiển thị badge cảnh báo trực quan: `⚠️ Còn chuyến nhập nháp — Chỉ được Lưu nháp`.
     - Khi chuyến nhập nháp được xác nhận nhập kho đầy đủ, chức năng Xác nhận xuất kho sẽ tự động mở khóa.
2. **Không khóa dòng / mở nút tiếp nhận đơn lẻ trên chuyến xe nhập kho Chờ xử lý**:
   - Trong modal chi tiết chuyến xe nhập kho (trạng thái Chờ xử lý / PENDING), các dòng đơn hàng không bị làm mờ hay vô hiệu hóa nút thao tác tiếp nhận đơn lẻ (`Nhập kho đơn hàng này`), cho phép thủ kho tiếp nhận riêng từng đơn hàng của chuyến xe đó bình thường.

---

## 2. Các Thay Đổi Kiến Trúc & Code

### Backend (`logistics-website-backend`)
- [`src/orders/operational-ledger.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts):
  - Bổ sung hàm `getBatchPendingInboundAllocations(orderIds, hubId)` truy vấn các chuyến xe `type = 'INBOUND'` và `status = 'PENDING'` còn hiệu lực (`deletedAt IS NULL`).
- [`src/orders/warehouse.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/warehouse.service.ts):
  - Tích hợp tính toán `hasPendingInboundTrip`, `pendingInboundTripCodes`, `pendingInboundQuantity` vào `computeHubView` và `enrichOrderHubContext`.
  - Cập nhật bộ lọc truy vấn tìm kiếm xuất kho (`OUTBOUND_LOOKUP`), đảm bảo các đơn hàng có chuyến nhập nháp vẫn được tra cứu và đưa vào bảng xuất nháp bình thường.
- [`src/orders/orders.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/orders.service.ts):
  - Trong `findOne(idOrCode)`, tính toán và trả về thuộc tính `hasPendingInboundTrip` từ các chuyến xe liên kết.

### Frontend (`logistics-website-frontend`)
- [`src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx):
  - Cập nhật giao diện `WarehouseRowItem` với `hasPendingInboundTrip`, `pendingInboundTripCodes`, `pendingInboundQuantity`.
  - Tinh chỉnh hàm `isRowInboundLocked`: khi chuyến xe đang ở chế độ Chờ xử lý (`isInboundTripMode = true`), **không khóa mờ dòng** kể cả khi đơn đó đã từng nhập một phần trước đó. Nút thao tác tiếp nhận đơn lẻ (`IconBuildingWarehouse`) luôn hiển thị và hoạt động chính xác.
- [`src/app/dashboard/warehouse/outbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx):
  - Bổ sung cờ `hasPendingInboundInNote` và gộp vào `isOutboundConfirmationBlocked`.
  - Hiển thị badge cảnh báo màu vàng cam `⚠️ Còn chuyến nhập nháp — Chỉ được Lưu nháp`.
  - Vô hiệu hóa nút **"Xác nhận xuất kho"**, giữ nút **"Lưu nháp (Chờ xử lý)"** màu cam nổi bật sẵn sàng.
- [`src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx):
  - Đồng bộ logic khóa tương tự cho luồng Xuất luân chuyển liên Hub (Bước 3).

---

## 3. Bằng Chứng Nghiệm Thu (2-Tier Quality Gate)

### Tầng 1: Local E2E Gate (Port 4000 & 4001)
- File test: [`frontend/e2e/98-feedback-29-10-pending-inbound-trip-draft-lock.spec.ts`](file:///d:/Projects/logistics-website/frontend/e2e/98-feedback-29-10-pending-inbound-trip-draft-lock.spec.ts)
- Kết quả: **2/2 PASS 100%** (24.4s).
- Điểm đánh giá mã kiểm thử (`e2e-auditor.mjs`): **41/50 - 🟢 PASS**.

### Tầng 2: Cloud Dev Quality Gate (Railway Cloud)
- Domain Backend Dev: `https://backend-tms-core-dev.up.railway.app/api/v1/health` (HTTP 200 OK)
- Domain Frontend Dev: `https://frontend-tms-core-dev.up.railway.app` (HTTP 307 -> /auth/sign-in)
- Kết quả kiểm thử trực tiếp trên Cloud Dev: **2/2 PASS 100%** (28.5s).

### Ảnh Chụp Màn Hình Bằng Chứng (Visual Evidence)
- **CASE-01 (Khóa xuất kho, chỉ cho lưu nháp khi có chuyến nhập nháp)**:
  - Tệp: `feedbacks/feedback_29_10_pending_inbound_trip_draft_lock/step_01_outbound_locked_draft_only.png`
- **CASE-02 (Modal nhập kho chuyến chờ xử lý hiển thị đầy đủ nút tiếp nhận đơn lẻ)**:
  - Tệp: `feedbacks/feedback_29_10_pending_inbound_trip_draft_lock/step_02_inbound_single_buttons_active.png`
