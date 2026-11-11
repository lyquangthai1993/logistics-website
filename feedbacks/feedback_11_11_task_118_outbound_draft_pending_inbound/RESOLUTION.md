# RESOLUTION — Task #118: Cho phép Tạo Đơn Nháp Xuất cho Mã Vận Đơn Đang Trong Trip Nhập Nháp (Khóa Xác Nhận Xuất)

- **Ngày thực hiện**: 11/11/2026
- **Branch**: `fix/task-118-warehouse-outbound-draft`
- **PRs merged vào `dev`**:
  - Backend: [logistics-website-backend#34](https://github.com/lyquangthai1993/logistics-website-backend/pull/34) (`08bb980`)
  - Frontend: [logistics-website-frontend#57](https://github.com/lyquangthai1993/logistics-website-frontend/pull/57) (`a699016`)

## 1. Tóm tắt nguyên nhân & Giải pháp
- **Nguyên nhân**: Đơn hàng mới tạo trên chuyến nhập nháp (`status = 'DRAFT'`) có `remainingQuantity = 0` (khác `null`). Toán tử `order.remainingQuantity ?? order.totalQuantity ?? 0` trong `WarehouseService.saveOutboundDraft` trả về `0`, còn `availableOutboundStock` phía Frontend ưu tiên đọc `effectiveHubStock = 0` trước khi tính `pendingInboundQuantity`, gây lỗi từ chối lưu nháp (`0/0 kiện`).
- **Giải pháp**:
  1. Cập nhật `OperationalLedgerService.getBatchPendingInboundAllocations` hỗ trợ `PENDING`/`WAITING` và loại trừ các dòng đã có phiếu `INBOUND` xác nhận.
  2. Cập nhật `WarehouseService.saveOutboundDraft` và `availableOutboundStock` cộng hạn mức `pendingInboundQuantity` (trừ `pendingOutboundQuantity` đã giữ chỗ ở chuyến nháp xuất khác) khi lưu nháp.
  3. Bổ sung chốt chặn `BadRequestException` trong `WarehouseService.confirmOutbound` và bảo toàn trạng thái khóa nút **Xác nhận xuất kho** trên UI (Mode 1, Resume Draft, Mode 2 Transfer) khi đơn còn chuyến nhập nháp chưa hoàn tất.

## 2. Bằng chứng kiểm thử
- **E2E Code Audit**: `frontend/e2e/118-outbound-draft-from-pending-inbound-trip.spec.ts` -> **50/50 (PASS)**
- **Screenshots**:
  - `screenshot_01_outbound_draft_ready_verified.png`
  - `screenshot_02_outbound_draft_saved_verified.png`
