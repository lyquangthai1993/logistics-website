# Báo Cáo Nghiệm Thu Kỹ Thuật (RESOLUTION.md)
**Nhiệm vụ**: Bảo toàn danh sách đơn hàng lịch sử trên Phiếu Nhập Kho khi đơn đã xuất đi và loại bỏ nút thừa "In phiếu xe" trong Modal Chi tiết Chuyến xe  
**Ngày thực hiện**: 19/10/2026  
**Môi trường kiểm thử**: Railway Cloud Dev (`https://frontend-tms-core-dev.up.railway.app`) & Production (`https://frontend-tms-core-production.up.railway.app`)

---

## 1. Bối Cảnh & Vấn Đề (Feedback)
- **Tình huống thực tế**:
  Chuyến xe nhập `SD62` tại Andromeda Hub - HCM nhập 6 đơn hàng với tổng cộng 232 kiện (2.260 kg, 15,88 m³) theo Phiếu nhập `PNK-HCM-2610-044`.
  Sau đó, 4 đơn hàng trong chuyến này đã được xuất kho trung chuyển đi trên chuyến `SD94` (`PGH-HCM-2610-026`).
  Khi thủ kho bấm in lại Phiếu Nhập Kho của chuyến xe `SD62`, hệ thống chỉ hiển thị có 2 đơn hàng (73 kiện) còn tồn tại Hub, làm mất 4 đơn hàng đã xuất đi.
- **Yêu cầu bổ sung**:
  Loại bỏ hoàn toàn nút "In phiếu xe" trong [`WarehouseTripDetailModal`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) (khi bấm gây toast lỗi: *"Không có đơn hàng nào cần dỡ nhập kho tại trạm này để in"*).

---

## 2. Nguyên Nhân Gốc (Root Cause Analysis - RCA)
1. **Frontend Inbound Receipt Filtering**:
   - Trong hàm `handleOpenReceiptForVehicle` tại [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx), danh sách đơn hàng của chuyến được lọc qua hàm `isDestMatchingHub(o)`.
   - Hàm này kiểm tra điều kiện `o.currentHubId === userHubId`.
   - Khi 4 đơn hàng đã được xuất kho trên chuyến `SD94`, backend đã cập nhật `currentHubId = null` và `remainingQuantity = 0`.
   - Do đó, điều kiện `o.currentHubId === userHubId` trả về `false`, loại bỏ 4 đơn hàng lịch sử khỏi Phiếu Nhập Kho.
2. **Quy chuẩn Kế toán Kho (Inventory Audit Invariant)**:
   - Phiếu Nhập Kho là chứng từ lịch sử pháp lý bất biến phản ánh thực tế giao nhận hàng hóa của chuyến xe tại thời điểm nhập kho. Việc hàng hóa sau đó xuất đi không được làm suy giảm hoặc biến mất dòng đơn trên phiếu nhập của xe.
3. **Nút "In phiếu xe" thừa**:
   - Modal chi tiết chuyến xe (`WarehouseTripDetailModal`) vốn là màn hình xem chi tiết/kiểm tra, nút "In phiếu xe" ở footer gọi logic in phiếu theo các đơn cần dỡ nhưng chuyến xe đã hoàn thành thì không còn đơn chờ dỡ, gây lỗi không cần thiết.

---

## 3. Giải Pháp & Thay Đổi Mã Nguồn
1. **Backend**:
   - File: [`backend/src/orders/warehouse.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)
   - Trong `getInboundTrips`, bổ sung join relation:
     ```ts
     .leftJoinAndSelect('order.inventoryTransactions', 'inventoryTransactions')
     ```
     nhằm cung cấp đầy đủ số lượng kiện thực tế đã nhập kho ban đầu cho từng đơn hàng của chuyến xe.
2. **Frontend**:
   - File: [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)
     - Sửa điều kiện `isDestMatchingHub`: Khi chuyến xe đã hoàn thành (`grp.status === 'COMPLETED'`), luôn bảo toàn toàn bộ đơn hàng đã nhập của chuyến (`if (grp.status === 'COMPLETED') return true;`).
     - Bổ sung hàm `getOrderTripInboundQty(o)`: Ưu tiên đọc số lượng kiện nhập từ `inventoryTransactions` của giao dịch `INBOUND` thuộc chuyến xe đó, đảm bảo phản ánh chính xác số lượng nhập ban đầu kể cả khi `remainingQuantity = 0`.
   - File: [`frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)
     - Loại bỏ nút "In phiếu xe" khỏi footer của modal chi tiết chuyến xe.
3. **E2E Test Suite**:
   - File: [`frontend/e2e/91-feedback-19-10-inbound-receipt-historical-orders.spec.ts`](file:///d:/Projects/logistics-website/frontend/e2e/91-feedback-19-10-inbound-receipt-historical-orders.spec.ts)
     - `CASE-01`: Static Code Audit xác nhận không còn nút "In phiếu xe", logic bảo toàn chuyến `COMPLETED` và hàm `getOrderTripInboundQty`.
     - `CASE-02`: E2E Live Test đăng nhập Quản lý kho HCM, tìm kiếm `SD62`, mở Phiếu Nhập Kho và assert đủ 6 đơn hàng và tổng cộng 232 kiện.

---

## 4. Kết Quả Nghiệm Thu (Verification Evidence)
- **Local / Dev E2E Test**: PASS 100% (2/2 test cases).
- **Production E2E Test**: PASS 100% (2/2 test cases).
- **Ảnh minh chứng thực tế trên Production**:
  - Chuyến xe: `SD62` (Biển số `75H04173 SPIDER`, Tài xế `ĐỖ VĂN HUY`, Nhập tại `ANDROMEDA HUB - HCM`).
  - Danh sách đơn hàng trong Phiếu Nhập:
    1. `NQT2610-070` - 23 kiện
    2. `NMC2610-077` - 50 kiện
    3. `NQT2610-071` - 64 kiện
    4. `NQT2610-076` - 20 kiện
    5. `NQT2610-078` - 59 kiện
    6. `PML2610-219` - 16 kiện
  - **Tổng cộng**: **232 kiện** (Đầy đủ 6/6 đơn hàng).
