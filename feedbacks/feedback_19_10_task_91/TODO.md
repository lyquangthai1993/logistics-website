# Feedback 19/10 (Task #91) — Gom 1 Dòng Duy Nhất Cho Đơn Hàng Nhập Nhiều Lần, Cộng Dồn Số Lượng/Kg/Khối & Khóa Cứng Thông Tin Gốc Khi Nhập Mới Trùng Mã Vận Đơn

## 1. Bối cảnh Nghiệp vụ Thực tế & Nguyên văn Phản hồi (Operational Context)

### Trích dẫn hội thoại vận hành (Zalo 19/10/2026)
- **[19/10/2026 19:30:40] Mai Công Đức**: *"mấy cái đơn mà mình nhập từ 2 lần trở lên (sáng xe 1 đưa về một ít, chiều xe 2 đưa về một ít,...) ông gom nó lại thành 1 dòng, và cộng tổng số lượng, số kg, số khối trong màn hình đơn hàng kho. Hiện tại nó đang tách làm nhiều dòng tương ứng với số lần nhập đến lúc xuất nó cũng bắt mình phải xuất đủ số dòng như lúc nhập."*
- **[19/10/2026 19:37:00] Lý Quang Thái**: *"ok để xem, cũng khó xử lí chỗ mà địa điểm đích đến thì không giống với nhau, nên không đồng nhất dữ liệu"*
- **[19/10/2026 19:38:07] Mai Công Đức**: *"thự tế 1 đơn nó sẽ chỉ đến 1 đích, cái này do mình để mở cho sửa nên bạn A nhập 1 đường, bạn B nhập 1 nẻo"*
- **[19/10/2026 19:38:33] Mai Công Đức**: *"tương tự như chỗ tên hàng cũng vậy. cùng 1 mã vận đơn thì cho dù nhập bao nhiêu lần thì cũng chỉ 1 tên"*
- **[19/10/2026 19:39:51] Mai Công Đức**: *"t nghĩ ra 1 cách như vầy. khi nhập mới, nếu mã vận đơn đã tồn tại thì chỉ cho chỉnh sửa địa điểm lấy, số lượng, số kg, số khối. các thông tin còn lại khóa cứng theo thông tin lần đầu nhập."*
- **[19/10/2026 19:45:42] Lý Quang Thái**: *"lúc cho chỉnh sửa địa điểm nó sẽ đè lên cái gốc, ông xem cách này khả thi k nha => cái gốc ở đây là Mã vận đơn gốc khi tạo ví dụ là địa chỉ giao Bình Thạnh, HCM đi sau đó nhập mới, người thao tác sẽ nhập mới là Bình Dương => thông tin 'Bình Thạnh, HCM' sẽ bị thay thế bởi chữ 'Bình Dương' ... còn hiện tại thì bị chia dòng 1, dòng 2, ... dòng 6 là những phiên bản khác nhau"*
- **[19/10/2026 19:49:20] Mai Công Đức**: *"Cái địa điểm giao thì k thay đổi được. Thay đổi địa điểm lấy ở chỗ tạo nhập kho thôi."*

---

## 2. Giải mã Bằng chứng Hình ảnh (Multimodal OCR & Hub Extraction)

1. **`screenshot_01.png` (`Tổng Hợp Đơn Hàng Tại Kho · Andromeda Hub - HCM`)**:
   - Hub thực tế: **Andromeda Hub - HCM** $\rightarrow$ Tài khoản kiểm thử chuẩn: `USER_WAREHOUSE_HCM` (`warehouse_hcm`).
   - Mã vận đơn `HQA2610-0060` hiển thị badge `2 dòng` và xổ ra `Dòng 1` (Đơn nháp `0/214`), `Dòng 2` (Lưu kho `214/214`).
   - Mã vận đơn `NDA2610-0213` hiển thị badge `6 dòng` (`200/201` kiện, `580` kg, `6` CBM) và xổ ra `Dòng 1` đến `Dòng 6`.
   - Mã vận đơn `NMT2610-328` hiển thị badge `2 dòng`, cột Tên hàng hóa bị nối chuỗi `MASAN, Nhập muối ớt BBGH`.
2. **`screenshot_02.png` (Màn hình Bảng kê Tạo Chuyến Xuất Kho)**:
   - Cùng 1 mã vận đơn `NMT2610-328` nhưng khi xuất kho phải chọn thành **2 dòng riêng biệt** trên bảng kê:
     - Dòng `04`: `NMT2610-328` — `Nhập muối ớt BBGH` — `11` kiện (`Tồn: 11`), `1` kg, `0.01` $m^3$.
     - Dòng `07`: `NMT2610-328` — `MASAN` — `35` kiện (`Tồn: 35`), `426.66` kg, `0.75136` $m^3$.
3. **`screenshot_03.png` (Chi tiết 6 dòng của `NDA2610-0213`)**:
   - Cột **ĐÍCH ĐẾN** không đồng nhất giữa các lần nhập: `Dòng 1, 4, 5, 6` là `HCM`, trong khi `Dòng 2, 3` là `Cảng Cát Lái`.

---

## 3. Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)

1. **Tại Backend (`backend/src/orders/orders.service.ts` & `backend/src/orders/warehouse.service.ts`)**:
   - Hàm `findOne(idOrCode)` trong `orders.service.ts` đang truy vấn theo `order: { id: 'DESC' }` (lấy bản ghi nhập sau cùng thay vì bản ghi gốc lần đầu nhập `id: 'ASC'`).
   - Hàm `quickCreateInboundOrder` và `batchCreateInboundOrders` trong `warehouse.service.ts` luôn gọi `orderRepo.create(...)` tạo mới một dòng `OrderEntity` độc lập mỗi lần nhập kho, thay vì kiểm tra mã vận đơn (`orderCode`) đã tồn tại để khóa thông tin gốc (`goodsDescription`, `destinationHub`, `destinationHubId`, `province`, `accompanyingDocs`, địa chỉ giao) và cộng dồn số lượng/kg/khối vào đơn gốc.
   - Hàm `aggregateOrderGroup` trong `warehouse.service.ts` đang dùng `distinctJoin` nối chuỗi nhiều tên hàng và nhiều đích đến khác nhau (`MASAN, Nhập muối ớt BBGH` / `HCM, Cảng Cát Lái`), thay vì lấy cố định theo bản ghi gốc lần đầu nhập (`items[0]`). Ngoài ra, khi một mã đơn vừa có dòng `DRAFT` vừa có dòng `INBOUND` (như `HQA2610-0060`), việc cộng cả dòng `DRAFT` vào dòng `INBOUND` làm nhân đôi tổng kiện (`214 + 214 = 428`).
   - Luồng tra cứu Xuất kho (`flow=OUTBOUND_LOOKUP`) trong `getWarehouseOrders` chưa gom nhóm theo `orderCode`, và `confirmOutbound` / `saveOutboundDraft` chỉ trừ tồn trên 1 `order.id` đơn lẻ nên bắt người dùng phải chọn đủ N dòng như lúc nhập.
2. **Tại Frontend (`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` & `frontend/src/app/dashboard/warehouse/orders/page.tsx`)**:
   - Trong `WarehouseEditableGrid` (chế độ Nhập kho): Khi gõ/dán `orderCode` đã tồn tại trên hệ thống (hoặc trùng với dòng phía trên trong cùng bảng kê), các cột `Tên hàng hóa`, `Địa chỉ giao / Điểm giao`, `Tỉnh/TP`, `Chứng từ` vẫn cho phép sửa tự do, dẫn đến người A nhập 1 đằng, người B nhập 1 nẻo.
   - Trong màn hình `Tổng Hợp Đơn Hàng Tại Kho` (`orders/page.tsx`): Đang hiển thị badge `{members.length} dòng`, nút `Xem dòng / Thu gọn` và xổ ra danh sách dòng con `Dòng 1`, `Dòng 2`... `Dòng 6`.

---

## 4. Kiến trúc Giải pháp & Phạm vi File (Execution Blueprint)

### Danh sách File cần sửa đổi
- **Backend (`backend/`)**:
  1. `backend/src/orders/orders.service.ts`:
     - Trong `findOne(idOrCode)`: Đổi thứ tự tìm theo `orderCode` sang `order: { id: 'ASC' }` để luôn trả về thông tin gốc của lần nhập đầu tiên, đồng thời gộp danh sách `trips` và `inventoryTransactions` của các bản ghi cùng `orderCode` (nếu có dữ liệu lịch sử bị tách dòng).
  2. `backend/src/orders/warehouse.service.ts`:
     - Trong `quickCreateInboundOrder` và `batchCreateInboundOrders`: Khi `finalOrderCode` đã tồn tại trong DB (`orderRepo.findOne({ where: { orderCode: finalOrderCode }, order: { id: 'ASC' } })`), khóa cứng và giữ nguyên các thông tin gốc (`goodsDescription`, `destinationHub`, `destinationHubId`, `province`, `accompanyingDocs`, địa chỉ giao trong `route`); chỉ nhận `pickupAddress` mới cho chuyến xe/giao dịch nhập kho đó và cộng dồn `totalQuantity`, `inboundQuantity`, `remainingQuantity`, `totalWeight`, `totalVolume` vào đơn gốc (nếu đơn gốc đang là `DRAFT` và lần nhập mới là `INBOUND` thì nâng cấp đơn gốc lên `INBOUND` với số lượng thực nhập).
     - Trong `aggregateOrderGroup`: Lấy `goodsDescription`, `destinationHub`, `originalDestination`, `province`, `accompanyingDocs` theo bản ghi gốc lần đầu nhập (`first = items[0]`). Loại trừ dòng `DRAFT` trùng lặp nếu mã vận đơn đó đã có dòng `INBOUND` thực tế. Gộp đầy đủ `inventoryTransactions` của tất cả `items` vào dòng tổng hợp để Modal chi tiết hiển thị trọn vẹn các đợt xe nhập.
     - Trong `getWarehouseOrders` (`flow=OUTBOUND_LOOKUP`), `confirmOutbound`, và `saveOutboundDraft`: Gom nhóm theo `orderCode` khi tra cứu xuất kho (`OUTBOUND_LOOKUP`) để mỗi mã vận đơn chỉ hiện **1 dòng tổng duy nhất** (cộng tổng tồn khả dụng, tổng kg, tổng khối). Khi xác nhận xuất kho (`confirmOutbound`) hoặc lưu nháp xuất kho (`saveOutboundDraft`), tự động phân bổ trừ tồn FIFO qua các bản ghi cùng `orderCode` (hỗ trợ tương thích ngược 100% cho các đơn cũ đã bị tách dòng trong DB như `NMT2610-328`, `NDA2610-0213`).
- **Frontend (`frontend/`)**:
  1. `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
     - Bổ sung cờ `isExistingOrder?: boolean` trên `WarehouseRowItem`.
     - Khi nhập kho (`!isOutboundMode`), nếu `orderCode` được tìm thấy từ API `/api/v1/orders/:code` hoặc trùng với dòng phía trên trong cùng bảng kê:
       - Tự động điền và **khóa cứng (`disabled` / `readOnly`)** các cột: `Tên hàng hóa` (`goodsDescription`), `Địa chỉ giao / Điểm giao` (`deliveryAddress`, `deliveryMode`, `destinationHubId`), `Tỉnh/TP` (`province`), `Chứng từ` (`accompanyingDocs`).
       - **Chỉ cho phép chỉnh sửa**: `Địa chỉ nhận / Điểm lấy hàng` (`pickupAddress`), `Số kiện` (`totalQuantity`), `Số kg` (`totalWeight`), `Số khối (m³)` (`totalVolume`), và `Ghi chú` (`notes`).
  2. `frontend/src/app/dashboard/warehouse/orders/page.tsx`:
     - Gom hiển thị mỗi Mã vận đơn thành **1 dòng duy nhất** trên bảng `Tổng Hợp Đơn Hàng Tại Kho` (cộng tổng số lượng, số kg, số khối; xóa bỏ badge `{members.length} dòng`, nút `Xem dòng / Thu gọn` và các dòng con `Dòng 1..6`).
     - Hiển thị đầy đủ các nút thao tác trực tiếp trên dòng duy nhất (`Xem chi tiết vận đơn`, `In tem nhận diện A4`, `Xóa đơn nháp`).
     - Đồng bộ xuất Excel (`handleExportStoredOrdersExcel`) xuất 1 dòng tổng hợp duy nhất cho mỗi mã vận đơn.

---

## 5. Danh sách Công việc Chi tiết (Task Checklist)

- [x] **Task 1 (Backend - Canonical First-Entry Lookup)**: Cập nhật `OrdersService.findOne(idOrCode)` tại `backend/src/orders/orders.service.ts` dùng `order: { id: 'ASC' }` khi tra cứu theo `orderCode` để trả về thông tin gốc lần đầu nhập.
- [x] **Task 2 (Backend - Inbound Consolidation & Master Field Lock)**: Cập nhật `quickCreateInboundOrder` và `batchCreateInboundOrders` tại `backend/src/orders/warehouse.service.ts` để khi `orderCode` đã tồn tại thì giữ nguyên tên hàng & địa điểm giao gốc, chỉ cập nhật điểm lấy cho chuyến xe mới và cộng dồn số lượng, số kg, số khối vào đơn gốc (thay vì tách thêm dòng `OrderEntity` mới).
- [x] **Task 3 (Backend - Single-Row Aggregation & Outbound Multi-Line FIFO)**: Cập nhật `aggregateOrderGroup`, `getWarehouseOrders` (`OUTBOUND_LOOKUP`), `confirmOutbound` và `saveOutboundDraft` tại `backend/src/orders/warehouse.service.ts` để lấy tên hàng/đích đến theo lần nhập đầu, gom 1 dòng khi tra cứu xuất kho và tự động trừ tồn FIFO qua các bản ghi cùng `orderCode`.
- [x] **Task 4 (Frontend - Lock Master Fields on Existing Waybill in Inbound Grid)**: Cập nhật `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` để khi nhập mã vận đơn đã tồn tại thì khóa cứng `Tên hàng hóa`, `Địa chỉ giao / Đích đến`, `Tỉnh/TP`, `Chứng từ` theo lần đầu nhập; chỉ mở cho sửa `Địa chỉ nhận (Điểm lấy)`, `Số kiện`, `Số kg`, `Số m³`, `Ghi chú`.
- [x] **Task 5 (Frontend - Single Unified Row in Warehouse Orders Screen)**: Cập nhật `frontend/src/app/dashboard/warehouse/orders/page.tsx` để hiển thị 1 dòng tổng hợp duy nhất cho mỗi mã vận đơn, loại bỏ xổ dòng con `Dòng 1..N` và badge `N dòng`, đồng bộ nút thao tác và xuất Excel.
- [x] **Task 6 (Verification - Build, Typecheck & Playwright E2E)**: Chạy `npm run build` ở cả `backend/` và `frontend/`, viết và chạy Playwright E2E test kiểm chứng thực tế với tài khoản `warehouse_hcm` (`Andromeda Hub - HCM`), chụp ảnh bằng chứng nghiệm thu và ghi `RESOLUTION.md`.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản & Phân quyền**: `USER_WAREHOUSE_HCM` (`warehouse_hcm` — thuộc `Andromeda Hub - HCM`).
- **Tiền điều kiện dữ liệu**:
  - Các đơn hàng nhập nhiều lần tại `Andromeda Hub - HCM` (hoặc tạo mới 1 mã vận đơn nhập 2 đợt xe sáng/chiều).
- **Các bước tương tác UI & Assertion**:
  1. Đăng nhập với `USER_WAREHOUSE_HCM`, truy cập `/dashboard/warehouse/inbound`, bấm mở tạo phiếu nhập kho mới.
  2. Nhập mã vận đơn đã tồn tại trong kho: Kiểm tra API `/api/v1/orders/:code` trả về `200 OK`, hệ thống tự động điền thông tin lần đầu nhập và **khóa cứng (`disabled`)** ô `Tên hàng hóa`, `Địa chỉ giao`, `Tỉnh/TP`, `Chứng từ`, trong khi ô `Địa chỉ nhận (Điểm lấy)`, `Số kiện`, `Số kg`, `Số m³` vẫn cho phép chỉnh sửa.
  3. Lưu phiếu nhập kho đợt 2 với điểm lấy mới và số lượng/kg/m³ bổ sung $\rightarrow$ Thành công.
  4. Truy cập `/dashboard/warehouse/orders` (`Tổng Hợp Đơn Hàng Tại Kho · Andromeda Hub - HCM`):
     - Assert bảng có dữ liệu (`expect(rowCount).toBeGreaterThan(0)`).
     - Assert mã vận đơn nhập nhiều lần chỉ hiển thị **1 dòng duy nhất**, không còn badge `2 dòng` / `6 dòng`, không còn dòng con `Dòng 1`, `Dòng 2`.
     - Assert Số lượng, Số kg, CBM được cộng tổng chính xác; Tên hàng hóa và Đích đến hiển thị đồng nhất theo lần nhập đầu tiên.
  5. Truy cập `/dashboard/warehouse/outbound`, mở tạo chuyến xuất kho và gõ/chọn mã vận đơn vừa nhập nhiều lần:
     - Assert chỉ cần chọn **1 dòng duy nhất** với tổng số kiện khả dụng đã cộng dồn của tất cả các lần nhập.
  6. Chụp ảnh màn hình bằng chứng `screenshot_task_91_verified.png`.

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
| :--- | :--- | :--- | :--- | :--- |
| **EC-01** | Nhập mã vận đơn đã tồn tại trong DB ở màn hình Tạo Nhập Kho | Gõ mã vận đơn đã có (VD: `NDA2610-0213`) rồi nhấn Tab/Enter/Blur | Tự động điền thông tin gốc lần 1; khóa cứng Tên hàng, Địa chỉ giao, Tỉnh/TP, Chứng từ; mở Địa chỉ nhận, Số kiện, Số kg, Số khối | `expect(goodsInput).toBeDisabled()`, `expect(pickupInput).toBeEnabled()` |
| **EC-02** | Nhập 2 dòng trùng mã vận đơn ngay trong cùng 1 bảng kê tạo mới | Dòng 1 nhập mã mới `TEST-01`, Dòng 2 gõ lại `TEST-01` | Dòng 2 tự động kế thừa & khóa Tên hàng, Địa chỉ giao theo Dòng 1; khi lưu gộp tổng vào 1 đơn | DB chỉ có 1 bản ghi `OrderEntity` với tổng kiện = Dòng 1 + Dòng 2 |
| **EC-03** | Đơn nháp (`DRAFT`) được nhập kho chính thức (`INBOUND`) | Mã vận đơn đang ở trạng thái `DRAFT` (`0/214`), sau đó xe chở hàng về nhập `INBOUND` (`214`) | Nâng cấp đơn `DRAFT` lên `INBOUND`, tổng kiện là `214/214` (không bị nhân đôi thành `214/428`) | Hiển thị `214 / 214` và trạng thái `LƯU KHO` |
| **EC-04** | Hiển thị đơn cũ đã bị tách 6 dòng trong DB (`NDA2610-0213`) trên màn Đơn hàng kho | Mở `/dashboard/warehouse/orders` tìm `NDA2610-0213` | Gom thành 1 dòng duy nhất, không có badge `6 dòng`, Đích đến lấy theo dòng 1 (`HCM`), cộng tổng kiện/kg/CBM | Không tồn tại text `Dòng 1`, `6 dòng` trên UI |
| **EC-05** | Xuất kho đơn hàng được nhập từ nhiều đợt xe (bao gồm đơn lịch sử đã tách dòng) | Chọn mã vận đơn nhập nhiều lần trên màn hình Xuất kho | Chỉ hiện 1 dòng tổng tồn khả dụng; khi bấm Xuất kho trừ tồn FIFO thành công trong 1 lần | API `confirmOutbound` trả về `200/201`, tồn kho về `0` |
| **EC-06** | Đổi sang mã vận đơn mới hoàn toàn sau khi đã gõ mã vận đơn cũ | Đang ở dòng bị khóa do mã cũ, người dùng sửa lại `orderCode` thành mã mới chưa tồn tại | Mở khóa (`enabled`) lại toàn bộ các trường Tên hàng, Địa chỉ giao, Tỉnh/TP, Chứng từ | `expect(goodsInput).toBeEnabled()` |
