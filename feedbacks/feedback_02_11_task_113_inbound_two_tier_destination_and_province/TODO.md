# Task 113: Inbound Two-Tier Destination & Province Display

## Bối cảnh & Yêu cầu bài toán
- **Hiện tượng**: Khi tài khoản thủ kho Hưng Yên (`warehouse_hyn`) kiểm tra chuyến xe `SD537` (ngày 26/10/2026 mang 448 kiện):
  1. Ngoài bảng danh sách chỉ hiển thị tổng `448 kiện` mà không bóc tách được bao nhiêu kiện cần dỡ xuống kho Hưng Yên và bao nhiêu kiện lưu trên xe đi tiếp trạm khác.
  2. Khi mở chi tiết kiểm đếm chuyến xe, các đơn hàng trung chuyển luân chuyển về Hưng Yên lại chỉ hiển thị tên khách nhận và tỉnh/thành đích đến cuối cùng (`Hà Nội`, `Thái Bình`, `Bắc Ninh`), khiến thủ kho lầm tưởng chuyến xe không chở hàng về Hưng Yên và bối rối về cột Tỉnh/TP.
- **Giải pháp**:
  1. Bóc tách 2 tầng hiển thị tại cột "ĐỊA CHỈ GIAO":
     - Đối với các đơn hàng luân chuyển dỡ tại kho hiện tại: Gắn badge xanh `🟢 Dỡ kho Polaris Hub - Hưng Yên (Luân chuyển)` và hiển thị địa chỉ tuyến tiếp theo bên dưới.
     - Đối với các đơn hàng đi tiếp các chặng sau: Gắn badge xám mờ `⚪ Lưu xe (Không dỡ)` và hiển thị địa chỉ chặng kế tiếp.
  2. Cột "TỈNH / TP" giữ nguyên tỉnh đích cuối cùng của khách hàng để điều phối viên và thủ kho nắm rõ vùng miền phát hàng chặng sau.
  3. Bổ sung thanh tổng hợp phân loại đầu bảng:
     - `🟢 Dỡ tại kho này: X đơn (Y kiện)`
     - `⚪ Tiếp tục trên xe: Z đơn (W kiện)`
  4. Ngoài danh sách Nhập kho (Bảng Inbound):
     - Hiển thị phân rã kiện: `448 kiện (Dỡ: 315 • Lưu xe: 133)`.

## Checklist thực thi
- [x] Backend: Thêm `unloadQuantity` và `stayQuantity` vào truy vấn `getInboundTrips` (`orders/warehouse.service.ts`).
- [x] Backend: Bổ sung `destinationHubName` vào danh sách manifest `getTripManifest`.
- [x] Frontend: Cập nhật kiểu `TripManifestLine` và `InboundVehicleGroup`.
- [x] Frontend: Cập nhật `WarehouseTripDetailModal` và `WarehouseEditableGrid` hiển thị badge 2 tầng và banner tổng hợp phân loại dỡ kho vs lưu xe.
- [x] Frontend: Cập nhật danh sách bảng Nhập kho hiển thị `Dỡ: X • Lưu xe: Y`.
- [x] Playwright E2E Test: `frontend/e2e/113-inbound-two-tier-destination-and-province.spec.ts` PASS 100%.
- [x] Chụp ảnh bằng chứng nghiệm thu trực quan `screenshot_01_verified.png`.
