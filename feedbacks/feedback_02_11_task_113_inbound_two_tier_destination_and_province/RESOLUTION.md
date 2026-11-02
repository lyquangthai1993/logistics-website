# Resolution: Task 113 - Inbound Two-Tier Destination & Province Display

## 1. Thông tin tổng quan
- **Task ID**: Task 113
- **Chủ đề**: Hiển thị phân rã 2 tầng Đích đến (Dỡ kho vs Lưu xe) & Tỉnh/TP chặng tiếp theo tại màn hình Nhập kho
- **Mã nhánh**: `fix/task-113-inbound-two-tier-destination-and-province`
- **Mã chuyến xe kiểm thử thực tế**: `SD537` (448 kiện = 315 kiện dỡ kho Hưng Yên + 133 kiện lưu xe đi Hải Phòng / Phú Yên)
- **Tài khoản kiểm thử**: `warehouse_hyn` (Polaris Hub - Hưng Yên)

## 2. Nguyên nhân kỹ thuật gốc (Root Cause)
1. **Lệch pha hiển thị giữa Điểm dừng trung chuyển và Đích cuối khách hàng**:
   - Khi tạo chuyến xuất kho từ HCM đi các tỉnh phía Bắc, các đơn hàng trung chuyển qua Hưng Yên có `destinationHubId = 3` (Polaris Hub - Hưng Yên).
   - Tuy nhiên trên màn hình Nhập kho tại Hưng Yên, giao diện lấy `order.route` hoặc `order.deliveryAddress` là địa chỉ khách nhận chặng cuối (`STAR FASHION - Hà Nội`, `MINH TRÍ - Thái Bình`, `AMT - Bắc Ninh`), hoàn toàn thiếu nhãn chỉ định kiện này dỡ tại Hưng Yên để nhập tồn kho.
   - Khiến thủ kho tưởng rằng xe không mang hàng cho Hưng Yên và bối rối vì Tỉnh/TP hiển thị Hà Nội, Thái Bình, Bắc Ninh.
2. **Thiếu số liệu bóc tách kiện dỡ / kiện lưu xe trên danh sách Inbound**:
   - Bảng danh sách chuyến xe đến trạm chỉ hiển thị `totalQuantity` (448 kiện) mà không phân rã số kiện dỡ thực tế tại Hub hiện tại vs số kiện lưu xe tiếp tục hành trình.

## 3. Các thay đổi đã thực hiện
### Backend:
- `backend/src/orders/warehouse.service.ts`:
  - Trong `getInboundTrips`: Thêm phép tính `unloadQuantity` và `stayQuantity` vào khối CTE `agg` dựa trên `COALESCE(t."destinationHubId", o."destinationHubId") = ts."hubId"`, bóc tách chính xác số kiện dỡ xuống Hub hiện tại và số kiện lưu xe.
  - Đưa `agg."unloadQuantity"` và `agg."stayQuantity"` vào danh sách SELECT của truy vấn phân trang `pageSql`.
  - Trong `getTripManifest`: Trả về trường `destinationHubName` cho từng dòng hàng trong manifest.

### Frontend:
- `frontend/src/features/warehouse/api/trip-manifest.ts`: Bổ sung `destinationHubName?: string | null;` vào `TripManifestLine`.
- `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
  - Thêm `destinationHubName` và `isForCurrentHub` vào `WarehouseRowItem`.
  - Hiển thị badge 2 tầng trong ô Địa chỉ giao: `Dỡ kho này (Luân chuyển)` (màu xanh lục) vs `Lưu xe (Không dỡ)` (màu xám).
- `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`:
  - Bổ sung thanh tổng hợp thông tin phân loại dỡ hàng phía trên bảng hàng hóa: `🟢 Dỡ tại kho này: X đơn (Y kiện)` và `⚪ Tiếp tục trên xe: Z đơn (W kiện: chi tiết các đơn đi tiếp)`.
  - Hiển thị đầy đủ badge hành trình phân loại và giữ nguyên Tỉnh/TP chuẩn xác của địa chỉ đích.
- `frontend/src/app/dashboard/warehouse/inbound/page.tsx`:
  - Thêm hiển thị phân rã `Dỡ: X • Lưu xe: Y` trên cột Số kiện / Tải trọng ở cả giao diện Desktop và Mobile.

## 4. Kết quả nghiệm thu & Bằng chứng
- **Playwright E2E**: Chạy thành công 100% qua file kiểm thử `frontend/e2e/113-inbound-two-tier-destination-and-province.spec.ts`.
- **Ảnh chụp bằng chứng**: `feedbacks/feedback_02_11_task_113_inbound_two_tier_destination_and_province/screenshot_01_verified.png`.
