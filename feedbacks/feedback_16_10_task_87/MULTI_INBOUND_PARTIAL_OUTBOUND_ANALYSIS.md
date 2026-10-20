# 🔬 BÁO CÁO ĐIỀU TRA & KIỂM CHỨNG THỰC TẾ (LIVE API + CODEBASE)
## Kịch Bản: Nhập 2 Xe Sáng (`49 kiện`) & Chiều (`22 kiện`) Cùng 1 Mã Đơn Hàng ➔ Xuất Lẻ `30 kiện`

> **Thời gian điều tra & kiểm chứng**: 20/10/2026  
> **Người yêu cầu**: Quản lý Vận hành TMS (@Thai)  
> **Vai trò thực hiện**: Business Domain Team Lead & System Architect (`/leader`)  
> **Môi trường kiểm chứng thực tế**: Railway Cloud Dev (`https://backend-tms-core-dev.up.railway.app/api/v1`)  
> **Tài liệu liên quan**: [`feedbacks/feedback_16_10_task_87/RESOLUTION.md`](file:///c:/Projects/logistics-website/feedbacks/feedback_16_10_task_87/RESOLUTION.md)

---

## 1. 🎯 Câu Hỏi Nghiệp Vụ Cốt Lõi

> *"Khi nhập 2 xe sáng và chiều, cùng 1 mã đơn hàng, ví dụ sáng nhập 49 kiện, chiều nhập 22 kiện, vậy khi xuất ra, có điền số lượng xuất ra 30 kiện thôi được không? Điều tra bằng cách dò xét thật, kiểm chứng thật, không đoán."*

---

## 2. ✅ Kết Luận Ngắn Gọn

**ĐƯỢC — NHƯNG TÙY LUỒNG THAO TÁC TRÊN GIAO DIỆN:**

1. **Tại màn hình chính Tạo Phiếu Xuất Kho (`/dashboard/warehouse/outbound` ➔ nút `+ Xuất kho` sử dụng bảng [`WarehouseEditableGrid`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx))**:
   - **HOÀN TOÀN ĐƯỢC.**
   - Khi nhập xe sáng `49 kiện` và xe chiều `22 kiện` cùng 1 mã đơn hàng, hệ thống tự động cộng dồn tồn kho khả dụng của mã đơn đó lên **`71 kiện`**.
   - Khi tra cứu đơn ở màn hình Tạo Phiếu Xuất Kho, ô `SỐ LƯỢNG` (`QuantityCell`) cho phép gõ trực tiếp số **`30`** (hợp lệ trong khoảng `1 .. 71`, hiển thị nhãn `Tồn: 71`).
   - Sau khi bấm **Xác nhận xuất kho** (hoặc **Lưu nháp**), hệ thống xuất `30 kiện` và tự động giữ lại **`41 kiện`** ở trạng thái **`Lưu kho` (`INBOUND`)** tại Hub hiện tại để xuất tiếp ở các chuyến xe sau.
2. **Tại 2 luồng phụ chọn đơn bằng Checkbox**:
   - **KHÔNG ĐIỀN ĐƯỢC SỐ LẺ `30 KIỆN`** (mặc định bốc toàn bộ `71 kiện` tồn kho vì giao diện chỉ có checkbox chọn đơn, chưa có ô nhập số lượng xuất từng phần).

---

## 3. 🧪 Bằng Chứng Thực Nghiệm Trực Tiếp Trên Live Dev API

Kịch bản đã được chạy thật trên `https://backend-tms-core-dev.up.railway.app/api/v1` bằng tài khoản Thủ kho HCM (`warehouse_hcm` — `Andromeda Hub - HCM`, `hubId = 1`) với mã vận đơn thực nghiệm `VERIFY87-56055` (`orderId = 182`):

### Bảng Tóm Tắt Chuỗi Sự Kiện Thực Nghiệm

| Bước | Nghiệp vụ thực hiện | API Endpoint gọi thật | Kết quả thực tế trả về từ Database |
| :--- | :--- | :--- | :--- |
| **Bước 1** | **Xe sáng (`51C-870.01`) nhập `49 kiện`** (`490 kg`, `4.9 m³`) | `POST /api/v1/warehouse/inbound/batch-create` (`initialStatus: 'INBOUND'`) | Sinh chuyến `SD125` ➔ Tạo đơn `id: 182`, `orderCode: "VERIFY87-56055"`, `status: "INBOUND"`, `inboundQuantity: 49`, `remainingQuantity: 49`. |
| **Bước 2** | **Xe chiều (`51C-870.02`) nhập `22 kiện`** (`220 kg`, `2.2 m³`, cùng mã `VERIFY87-56055`) | `POST /api/v1/warehouse/inbound/batch-create` (`initialStatus: 'INBOUND'`) | Sinh chuyến `SD126` ➔ Tự động gộp vào cùng `orderId: 182` (`sameOrderIdAsMorning: true`). Sổ cái (`order_inventory_transaction`) ghi nhận 2 bút toán `INBOUND`: `49 kiện` (`SD125`) + `22 kiện` (`SD126`) = **tồn kho lũy kế `71 kiện`**. |
| **Bước 3** | **Kiểm tra trạng thái đơn trước khi xuất** | `GET /api/v1/orders/182` & `GET /api/v1/orders/182/ledger` | `status: "INBOUND"`, **`inboundQuantity: 71`**, `outboundQuantity: 0`, **`remainingQuantity: 71`**. |
| **Bước 4** | **Xuất kho lẻ `30 kiện` lên xe `51D-888.30`** (`300 kg`, `3.0 m³`) | `POST /api/v1/warehouse/outbound/confirm` (`mode: 'CUSTOMER'`, `items: [{ orderId: 182, quantityToExport: 30, weightToExport: 300, volumeToExport: 3 }]`) | Trả về `HTTP 200 OK`: Sinh chuyến xuất `SD128` (`invoiceCode: "PGH-HCM-2610-035"`, `quantityAllocated: 30`). Bản ghi đơn `182` cập nhật: **`inboundQuantity: 71`**, **`outboundQuantity: 30`**, **`remainingQuantity: 41`**, **`status: "INBOUND"`**, **`currentHubId: 1`**. |

### JSON Response Thực Tế Từ Backend Khi Xuất 30 Kiện (`step4_confirmOutbound30`)

```json
{
  "step3_orderStateBeforeOutbound": {
    "id": 182,
    "orderCode": "VERIFY87-56055",
    "status": "INBOUND",
    "inboundQuantity": 71,
    "outboundQuantity": 0,
    "remainingQuantity": 71
  },
  "step4_confirmOutbound30": {
    "updatedCount": 1,
    "orders": [
      {
        "id": 182,
        "orderCode": "VERIFY87-56055",
        "status": "INBOUND",
        "inboundQuantity": 71,
        "outboundQuantity": 30,
        "remainingQuantity": 41,
        "goodsDescription": "Thùng linh kiện điện tử",
        "originHubId": 1,
        "currentHubId": 1
      }
    ],
    "trip": {
      "id": 489,
      "orderId": 182,
      "tripCode": "SD128",
      "licensePlate": "51D-888.30",
      "driverName": "Tài xế Xuất 30 Kiện",
      "status": "IN_TRANSIT",
      "type": "OUTBOUND",
      "quantityAllocated": 30,
      "weightAllocated": 300,
      "volumeAllocated": 3,
      "notes": "[XUẤT KHO - GIAO KHÁCH] Xuất 30 kiện giao khách"
    },
    "tripCode": "SD128",
    "invoiceCode": "PGH-HCM-2610-035"
  }
}
```
*(Ghi chú: Bản ghi kiểm thử `id = 182` đã được dọn dẹp khỏi môi trường Dev sau khi hoàn tất kiểm chứng).*

---

## 4. 🔍 Giải Phẫu Cơ Chế Trong Codebase (Backend & Frontend)

### 4.1. Khi Nhập 2 Xe Cùng Mã Đơn Hàng (`49 kiện` + `22 kiện` = `71 kiện`)
- **Backend — [`WarehouseService.batchCreateInboundOrders`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1569-L1743)**:
  - Khi xe chiều nhập mã đơn trùng với xe sáng, hàm [`findExistingOrderForInbound`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1579-L1582) tìm thấy `OrderEntity` đang lưu kho của xe sáng.
  - Hệ thống giữ nguyên các thông tin hợp đồng gốc (tên hàng, đích đến, chứng từ gốc của lần nhập đầu) và **cộng dồn số lượng trực tiếp vào `OrderEntity`** ([`warehouse.service.ts#L1622-L1630`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1622-L1630)):
    - `activeEntry.totalQuantity = prevTotalQty + qty` (`49 + 22 = 71`)
    - `activeEntry.inboundQuantity = prevInQty + qty` (`49 + 22 = 71`)
    - `activeEntry.remainingQuantity = prevRemQty + qty` (`49 + 22 = 71`)
  - Đồng thời tạo thêm 1 dòng `TripEntity` cho xe chiều (`quantityAllocated = 22`) và ghi thêm 1 bút toán sổ cái `OrderInventoryTransactionEntity` (`transactionType = 'INBOUND'`, `quantity = 22`, `remainingQuantity = 71`) tại [`warehouse.service.ts#L1717-L1729`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1717-L1729).
- **Tính toán Tồn kho Sổ cái — [`OperationalLedgerService.getHubStock`](file:///c:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts#L149-L165)**:
  - Công thức sổ cái tại Hub: `SUM(INBOUND) - SUM(OUTBOUND / TRANSFER) = (49 + 22) - 0 = 71 kiện`.
- **Hợp nhất các dòng cùng `orderCode` khi tra cứu — [`aggregateOrderGroup`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L855-L1111) & [`consolidateSiblingOrdersByCode`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L2889-L2966)**:
  - Khi màn hình Xuất kho gọi `GET /api/v1/warehouse/orders?flow=OUTBOUND_LOOKUP`, Backend gom nhóm theo `orderCode` và trả về 1 dòng duy nhất có `hubStock = 71`, `effectiveHubStock = 71`.

### 4.2. Khi Điền `30 kiện` Trên Màn Hình Xuất Kho Và Bấm Xác Nhận
- **Frontend — [`OrderCodeCell`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L580-L716) & [`QuantityCell`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L1074-L1138)**:
  - Khi chọn mã đơn từ dropdown gợi ý hoặc [`WarehouseLookupModal`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx#L285-L292), hàm [`availableOutboundStock`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/lib/outbound-stock.ts#L6-L32) lấy `effectiveHubStock = 71` gán vào `row.maxStock = 71`.
  - Cột `SỐ LƯỢNG` (`QuantityCell`) render `<Input type="number" min={1} max={71} />` kèm badge `Tồn: 71`. Thủ kho nhập `30` hoàn toàn hợp lệ (`1 <= 30 <= 71`).
  - Khi bấm **Xác nhận xuất kho** (hoặc **Lưu nháp**), hàm [`buildOutboundRequest`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L498-L558) kiểm tra `qty > 0 && qty <= r.maxStock` và gửi payload `items: [{ orderId, quantityToExport: 30, ... }]`.
- **Backend — [`confirmOutbound`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L2987-L3173) & [`saveOutboundDraft`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L3280-L3500)**:
  - **Nếu Lưu nháp (`saveOutboundDraft`)**: Hệ thống ghi nhận `quantityAllocated = 30` trên chuyến xuất nháp (`PENDING`). Lúc này `pendingOutboundQuantity = 30`, nên `effectiveHubStock` khả dụng cho các chuyến xe khác tự động giảm còn `71 - 30 = 41 kiện`.
  - **Nếu Xác nhận xuất kho (`confirmOutbound`)**:
    - Tính `hubStockAfter = Math.max(0, hubStockBefore - requestedQty) = 71 - 30 = 41` ([`warehouse.service.ts#L3084-L3092`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L3084-L3092)).
    - Cập nhật `order.outboundQuantity = 30`, `order.remainingQuantity = 41`.
    - Do `order.remainingQuantity === 41 > 0`, đơn hàng **vẫn giữ trạng thái `INBOUND` (`Lưu kho`)** và `order.currentHubId` vẫn ở lại Hub hiện tại ([`warehouse.service.ts#L3095-L3105`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L3095-L3105)). Chỉ khi xuất nốt `41 kiện` cuối cùng (`remainingQuantity === 0`), trạng thái đơn mới chuyển sang `OUTBOUND` / `IN_TRANSIT`.

---

## 5. ⚠️ 3 Điểm Hạn Chế / Edge Cases Phát Hiện Qua Dò Xét Thật (Đề Xuất Cải Tiến)

Qua quá trình rà soát từng dòng code, có **3 điểm hạn chế thực tế** cần lưu ý để quyết định có nâng cấp tiếp hay không:

### Hạn chế 1: Khi gõ tay sửa `SỐ LƯỢNG` từ `71` xuống `30` trên lưới xuất kho, cột `SỐ KG` và `SỐ M³` chưa tự động co theo tỷ lệ `30/71`
- **Hiện trạng trong code**:
  - Khi chọn đơn `71 kiện` (`710 kg`, `7.1 m³`) vào lưới [`WarehouseEditableGrid`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx), dòng hàng nạp mặc định `totalQuantity = 71`, `totalWeight = 710`, `totalVolume = 7.1`.
  - Nếu thủ kho **dán từ Excel** vào lưới ([`hydrateOutboundRows`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L394-L413)), code **đã có** gọi hàm [`proportionalMetric`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/lib/outbound-stock.ts#L37-L47) để tự nhân tỷ lệ `30/71` ra `300 kg` và `3.0 m³`.
  - Tuy nhiên, nếu thủ kho **gõ tay** số `30` vào ô [`QuantityCell`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L1084-L1091), hàm `updateData(row.index, 'totalQuantity', 30)` chỉ cập nhật mỗi `totalQuantity = 30` mà **không** tự tính lại `totalWeight` và `totalVolume`. Nếu thủ kho quên không sửa tay 2 cột `SỐ KG` và `SỐ M³`, [`buildOutboundRequest`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L533-L535) sẽ gửi nguyên `710 kg` và `7.1 m³` của 71 kiện vào chuyến xuất 30 kiện.
- **Hướng khắc phục đề xuất**:
  - Lưu `unitWeight` / `fullWeight` và `fullVolume` theo `maxStock` khi chọn đơn; khi người dùng đổi `totalQuantity` trong `QuantityCell` ở chế độ Xuất kho, tự động tính lại `totalWeight = proportionalMetric(fullWeight, newQty, maxStock)` và `totalVolume = proportionalMetric(fullVolume, newQty, maxStock)` (vẫn cho phép thủ kho sửa tay lại `SỐ KG` / `SỐ M³` nếu muốn).

### Hạn chế 2: Hai luồng chọn đơn bằng Checkbox chưa có ô nhập số lượng xuất lẻ (`30 kiện`)
- **Hiện trạng trong code**:
  1. Trong Modal Chi tiết Chuyến xe (`SD...`) ➔ Bước 2 ➔ Nút **"Chọn đơn lưu kho bốc lên chuyến xe"** ([`WarehouseSelectStoredOrdersModal`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx#L174-L178) gọi API [`appendStoredOrdersToTrip`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L5248-L5297)): Chỉ gửi mảng `orderIds: number[]`, mặc định bốc toàn bộ `71 kiện` tồn kho lên xe, không có ô nhập `30 kiện`.
  2. Trong component [`WarehouseOutboundTransferFlow`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx#L304-L318): Chỉ gửi `orderIds` (bốc toàn bộ `71 kiện`). *(Lưu ý: Nếu xuất luân chuyển từ màn hình chính `+ Xuất kho` bằng cách chọn `ĐỊA CHỈ GIAO` là Hub/Xe Bo thì vẫn điền `30 kiện` bình thường).*
- **Hướng khắc phục đề xuất**:
  - Bổ sung ô input `Số kiện bốc` (mặc định = `Tồn khả dụng`, cho phép sửa `1 .. maxStock`) ngay trên từng dòng được tick chọn trong [`WarehouseSelectStoredOrdersModal`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx) và hỗ trợ `items?: { orderId, quantityToExport }[]` trong [`appendStoredOrdersToTrip`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L5248-L5297).

### Hạn chế 3: Edge Case khi Xe Sáng (`49 kiện`) đã Nhập kho (`INBOUND`), nhưng Xe Chiều (`22 kiện`) bấm "Lưu nháp" (`DRAFT`) trước rồi mới mở Chuyến Nháp lên bấm "Xác nhận nhập kho"
- **Hiện trạng trong code**:
  - Tại [`batchCreateInboundOrders`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1622-L1630), khi Xe Chiều (`22 kiện`, cùng mã đơn với Xe Sáng đã `INBOUND`) bấm **"Lưu nháp"** (`initialStatus = 'DRAFT'`), code vẫn cộng ngay `+22` vào `activeEntry.totalQuantity`, `inboundQuantity`, `remainingQuantity` (lên `71`) trên bản ghi `OrderEntity` đang mang `status = 'INBOUND'` của Xe Sáng.
  - **Hệ quả 1 (Giao diện)**: Khi mở chuyến nháp Xe Chiều lên trong [`WarehouseTripDetailModal`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx), hàm [`isRowInboundLocked`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L487-L490) kiểm tra `row.status === 'INBOUND'` (trạng thái chung của `OrderEntity`) nên làm mờ (`opacity-50`) và khóa luôn dòng hàng của Xe Chiều dù chuyến Xe Chiều đang là chuyến nháp `Chờ xử lý`!
  - **Hệ quả 2 (Số liệu)**: Khi bấm **"Xác nhận nhập kho"** cho chuyến nháp Xe Chiều ([`confirmInbound`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L2395-L2410)), vì `found.status === 'INBOUND'` (không nằm trong `DRAFT_LIKE_STATUSES`), code nhảy vào nhánh `else if (!isKeepStatus)` và cộng thêm `actualQty` một lần nữa vào `found.inboundQuantity`.
- **Hướng khắc phục đề xuất**:
  - Khi `initialStatus === 'DRAFT'` trong `batchCreateInboundOrders`, chưa cộng vào `inboundQuantity` / `remainingQuantity` (chỉ ghi `quantityAllocated = 22` trên `TripEntity` nháp), và trong `getTripManifest` / `isRowInboundLocked` kiểm tra theo giao dịch `INBOUND` của riêng `tripCode` đó thay vì chỉ nhìn `order.status` tổng.
