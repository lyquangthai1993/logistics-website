# RESOLUTION - Feedback 14/10 Task #53: Thay Thế Cột "ĐIỂM BỐC HÀNG" Bằng "BIỂN SỐ XE NHẬP DỰ KIẾN" Trong Màn Hình Xem Đơn Trip Xuất Hàng

## 1. Yêu Cầu Nghiệp Vụ
- **Ảnh đính kèm feedback**: `feedbacks/feedback_14_10_task_53/screenshot_01.jpg`
- Đối với màn hình xem đơn trong trip xuất hàng (`WarehouseTripDetailModal` ở chế độ xuất hàng `mode='OUTBOUND'`):
  - Thay thế cột khoanh đỏ (**"ĐIỂM BỐC HÀNG"**) bằng cột **"BIỂN SỐ XE NHẬP DỰ KIẾN"**.
  - **Quy tắc hiển thị**:
    - **Các đơn nháp** (`DRAFT`, `WAITING`, `PENDING`): Hiển thị thông tin biển số xe của trip nhập đơn hàng đang ở trạng thái chờ xử lý (`PENDING`), kèm biểu tượng xe tải trực quan.
    - **Các đơn đã có trạng thái lưu kho** (`INBOUND`, `STORED`, `LUU_KHO`, `IN_WAREHOUSE`): Để trống (`—`) vì hàng đã nằm sẵn trong kho, không cần chờ xe nhập.

## 2. Chi Tiết Thay Đổi Kỹ Thuật

### 2.1 Backend (NestJS 11 - `backend/src/orders/warehouse.service.ts`)
- **Trong `enrichWarehouseRows`**:
  - Bổ sung logic tính toán trường `expectedInboundLicensePlate`:
    - Nếu đơn đã lưu kho (`isStored = true`): Trả về `null`.
    - Nếu đơn là đơn nháp (`isStored = false`): Quét danh sách chuyến xe của đơn (`item.trips`) để tìm chuyến xe nhập hàng (`type === 'INBOUND'` hoặc không phải `OUTBOUND`/`TRANSFER`) đang ở trạng thái chờ xử lý (`status === 'PENDING'` hoặc `'WAITING'`), lấy biển số xe (`licensePlate`).
    - Bổ sung các tầng fallback an toàn: bất kỳ trip pending nào khác chuyến xuất, `inboundLicensePlate`, hoặc `vehicleLicensePlate`.
  - Bổ sung `expectedInboundLicensePlate` vào đối tượng đơn hàng trả về.
- **Trong `getOutboundTrips`**:
  - Đảm bảo `expectedInboundLicensePlate` được truyền tải nguyên vẹn trong mảng `orders` của mỗi chuyến xe xuất kho.

### 2.2 Frontend (Next.js 15 App Router - `frontend/`)
- **`src/features/warehouse/components/warehouse-editable-grid.tsx`**:
  - Bổ sung `expectedInboundLicensePlate?: string | null;` vào interface `WarehouseRowItem`.
- **`src/features/warehouse/components/warehouse-trip-detail-modal.tsx`**:
  - Khi map dữ liệu từ `tripGroup.orders` sang `mappedRows`: Tính toán `expectedInboundLicensePlate` đồng bộ (ưu tiên `o.expectedInboundLicensePlate`, fallback tìm trip nhập PENDING nếu đơn chưa lưu kho; đơn lưu kho trả về `null`).
  - Khi modal hiển thị chuyến xe xuất hàng (`mode === 'OUTBOUND'`):
    - Cột tiêu đề: Hiển thị `<th className='py-1 px-1.5 min-w-[140px]'>BIỂN SỐ XE NHẬP DỰ KIẾN</th>` thay cho `ĐIỂM BỐC HÀNG`.
    - Ô dữ liệu: Nếu có biển số xe nhập dự kiến, hiển thị icon xe tải + biển số dạng font-mono chữ hoa màu xanh (`IconTruck` + uppercase); nếu để trống (đơn đã lưu kho), hiển thị gạch ngang `—`.
    - Tiêu đề modal: Hiển thị `"Chi tiết chuyến xe xuất kho"`.
    - Nhãn ngày: Hiển thị `"1. Ngày xuất kho"`.
    - Banner trạng thái: Hiển thị `"Chuyến xe xuất kho tại trạm này."`.

### 2.3 Kiểm Thử Tự Động (Playwright E2E)
- File kiểm thử: `frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`
  - Kiểm tra hợp đồng API `GET /warehouse/outbound-trips`: các đơn lưu kho có `expectedInboundLicensePlate = null`.
  - Kiểm tra giao diện người dùng: Khi mở modal chi tiết chuyến xe xuất hàng, cột tiêu đề hiển thị chính xác `"BIỂN SỐ XE NHẬP DỰ KIẾN"`, loại bỏ hoàn toàn `"ĐIỂM BỐC HÀNG"`.
  - Lưu ảnh chụp bằng chứng vào `feedbacks/feedback_14_10_task_53/screenshot_01_verified.png`.
