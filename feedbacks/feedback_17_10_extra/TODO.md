# 📋 Kế hoạch Thực thi & Báo cáo Tiến độ: Feedback 17/10 Extra (Warehouse Grid, Trip Board & Outbound Receipt)

> **Thư mục**: `feedbacks/feedback_17_10_extra`
> **Nguồn**: `feedbacks/feedback_17_10_extra/TODO_raw.md` + 5 ảnh minh họa (`1.png`, `2.png`, `2_1.png`, `2_3.png`, `3.png`)
> **Phạm vi**: `frontend/` (Warehouse Editable Grid, Inbound Trip Board, Outbound Trip Board & Outbound Receipt) & `backend/` (`WarehouseService` outbound trips/draft/manifest destination resolution)
> **Hub Ngữ cảnh (OCR từ ảnh)**: `Andromeda Hub - HCM` (`warehouse_hcm`)

---

## 🔍 Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)

### 1. Task 1 (`1.png`) — Ô nhập `MÃ VẬN ĐƠN *` tự động tìm kiếm khi đang gõ tay
- **Hiện trạng**: Trong [`OrderCodeCell`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L499-L916) của `warehouse-editable-grid.tsx`, hai hàm `handleOutboundChange` (dòng 803–817) và `handleInboundChange` (dòng 819–833) đang đặt bộ đếm tự động `searchTimerRef.current = setTimeout(..., 1200)` sau mỗi phím gõ. Khi nhân viên kho gõ tay mã vận đơn và ngừng tay khoảng 1.2s–3s để nhìn giấy tờ, hệ thống tự động gọi API tìm kiếm với mã vận đơn chưa gõ xong (báo lỗi hoặc tạo nhầm dòng).
- **Giải pháp**:
  - Loại bỏ hoàn toàn `setTimeout` tự động tìm kiếm trong `handleOutboundChange` và `handleInboundChange`.
  - Chỉ kích hoạt tìm kiếm (`performSearch` ở màn Xuất kho / `performInboundSearch` ở màn Nhập kho) khi nhân viên kho nhấn phím **`Enter`** hoặc **`Tab`** trong `handleKeyDown` (hoặc khi `onBlur` rời ô input), kèm cơ chế khóa chống gọi đúp (`inFlightCodeRef` / `lastSearchedCodeRef`) khi nhấn `Tab` làm kích hoạt đồng thời `onKeyDown` và `onBlur`.

### 2. Task 2 (`2.png`, `2_1.png`, `2_3.png`) — Bố cục cột `XE & TÀI XẾ` và bổ sung cột `MÃ VẬN ĐƠN` trên Bảng quản lý Chuyến xe
- **Hiện trạng**: Trên bảng `Danh sách Chuyến xe Nhập kho` ([`inbound/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx#L967-L1108)) và `Danh sách Chuyến xe Xuất kho` ([`outbound/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1005-L1150)), 5 cột hiện tại đều gắn độ rộng cố định nhỏ (`w-[150px]`, `w-[150px]`, `w-[130px]`, `w-[100px]`, `w-[180px]`) trên bảng `w-full`, khiến trình duyệt tự giãn rộng khoảng trắng lớn giữa `CHUYẾN XE / TRIP` và `XE & TÀI XẾ`, đồng thời thiếu cột hiển thị danh sách các mã vận đơn trong chuyến.
- **Giải pháp**:
  - Thu gọn độ rộng cột `CHUYẾN XE / TRIP` (`w-[115px] whitespace-nowrap`) và đặt cột `XE & TÀI XẾ` (`w-[160px]`) nằm sát ngay bên cạnh.
  - Ở khoảng trống lớn giữa `XE & TÀI XẾ` và `SỐ KIỆN / TẢI TRỌNG`, bổ sung cột mới **`MÃ VẬN ĐƠN`** (`min-w-[240px]`) hiển thị đầy đủ tất cả các mã vận đơn (`orderCode`) thuộc chuyến xe đó (cách nhau bằng khoảng trắng, ví dụ: `NAV2610-0094 CTB2610-052 NMC26010-069...`).
  - Định dạng danh sách mã vận đơn bằng cỡ chữ nhỏ và màu sắc đồng bộ với tên tài xế dưới biển số xe (`text-[10px] text-gray-500 dark:text-slate-400 leading-snug break-words`) để hiển thị toàn bộ mã vận đơn của chuyến xe nhiều đơn mà không bị cắt khuất.

### 3. Task 3 (`3.png`) — In Phiếu Xuất Kho cột `Kho đích / Nơi giao` phải in theo địa chỉ hiển thị ở màn hình Xuất kho
- **Hiện trạng**: Sau khi áp dụng bất biến `Master Contract Destination Invariance` (Task 41), trường `order.destinationHub` trên `OrderEntity` luôn giữ địa chỉ giao hàng gốc trên hợp đồng của khách hàng. Do đó:
  1. Khi mở lại Phiếu xuất nháp (`handleResumeDraft` trong `outbound/page.tsx`), mặc dù ô `ĐỊA CHỈ GIAO HÀNG *` hiển thị đúng thẻ Trạm đích / Tuyến Xe Bo đã chọn (`Polaris Hub - Hưng Yên`, `Xe Bo Kom Tum`) nhờ `plannedDestinationHubId`, nhưng state `row.deliveryAddress` và `row.destinationHub` vẫn bị gán bằng `o.deliveryAddress || o.destinationHub` (địa chỉ gốc của khách hàng). Khi bấm `Xác nhận xuất kho` và in phiếu, cột `Kho đích / Nơi giao` lấy `r.deliveryAddress` nên in ra địa chỉ khách hàng gốc thay vì địa chỉ kho đích/xe bo trên màn hình xuất kho.
  2. Khi bấm nút `In Phiếu` trên bảng danh sách chuyến xe xuất kho (`handleOpenReceiptForVehicle` trong `outbound/page.tsx`) hoặc trong modal chi tiết chuyến (`getTripManifest` trong `warehouse.service.ts`), biểu thức `o.destinationHub || ...` luôn ưu tiên lấy địa chỉ gốc của khách hàng thay vì địa chỉ xuất kho thực tế của chuyến (`tripTx.destination`, `outboundDestination`, hoặc tên Hub đích / Xe Bo của dòng xuất kho).
- **Giải pháp**:
  - **Backend (`warehouse.service.ts`)**:
    - Trong `confirmOutbound`: Tra cứu `destHub` cho mọi dòng xuất kho không phải `DIRECT_CUSTOMER` có `itemDestHubId` (bao gồm cả Hub Cấp 1 và Tuyến Xe Bo Cấp 2), lưu chính xác tên/địa chỉ đích xuất kho vào `WarehouseTransaction.destination` và `TripOrderEntity.destinationHubId`.
    - Trong `saveOutboundDraft`: Lưu `destHubId` vào `TripOrderEntity.destinationHubId` cho mọi dòng có chọn Hub đích / Tuyến Xe Bo (`!isLineDirectCustomer && destHubId`).
    - Trong `getOutboundTrips`: Join `t.destinationHub` trên cả `draftLines` và `orderEntities`, trả về `outboundDestination`, `destinationHubId`, và `outboundDestinationHubEntity` trên từng dòng đơn hàng của chuyến xuất kho.
    - Trong `getTripManifest`: Khi dòng xuất kho có `deliveryMode !== 'DIRECT_CUSTOMER'` và có `destinationHub` trên chuyến (`t.destinationHub`), trả về `destinationHub` và `deliveryAddress` theo đúng Hub đích / Tuyến Xe Bo của chuyến xuất kho.
  - **Frontend (`outbound/page.tsx`)**:
    - Trong `handleResumeDraft`: Khi dòng đơn hàng thuộc chế độ luân chuyển (`HUB_TRANSFER` / có `plannedDestinationHubId`), khôi phục `row.destinationHub` và `row.deliveryAddress` theo đúng Trạm đích / Tuyến Xe Bo hiển thị trên màn hình xuất kho.
    - Trong `handleSubmitOutbound`: Khi tạo dữ liệu `receiptOrders` cho `WarehouseOutboundReceiptModal`, nếu dòng đơn hàng là luân chuyển Hub / Xe Bo (`deliveryMode !== 'DIRECT_CUSTOMER'` hoặc có `destinationHubId`), gán `destinationHub` và `deliveryAddress` theo tên Trạm đích / Tuyến Xe Bo đã chọn trên màn hình xuất kho.
    - Trong `handleOpenReceiptForVehicle`: Ưu tiên lấy địa chỉ xuất kho của chuyến (`tripTx?.destination || o.outboundDestination || o.outboundDestinationHubEntity?.name || ...`) thay vì địa chỉ hợp đồng gốc `o.destinationHub`.

---

## ✅ Danh sách Công việc (Task Checklist)

- [x] **Task 1**: Tắt tự động tìm kiếm theo timer (`setTimeout`) khi đang gõ tay ở ô `MÃ VẬN ĐƠN *` trong [`warehouse-editable-grid.tsx`](file:///c:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx); chỉ kích hoạt tìm kiếm khi nhấn `Enter` hoặc `Tab` (hoặc `onBlur` sau khi nhập xong).
- [x] **Task 2**: Thu hẹp khoảng cách giữa cột `CHUYẾN XE / TRIP` và `XE & TÀI XẾ`, đồng thời thêm cột `MÃ VẬN ĐƠN` hiển thị toàn bộ mã vận đơn trong chuyến với font nhỏ đồng bộ tên tài xế (`text-[10px] text-gray-500`) trên bảng chuyến xe [`inbound/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx) và [`outbound/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx).
- [x] **Task 3**: Đồng bộ cột `Kho đích / Nơi giao` trên Phiếu Xuất Kho (`WarehouseOutboundReceiptModal`) tại [`outbound/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) và [`warehouse.service.ts`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) để luôn in đúng địa chỉ xuất kho hiển thị trên màn hình Xuất kho (Hub Cấp 1, Tuyến Xe Bo, hoặc địa chỉ giao khách).
- [x] **Task 4**: Kiểm tra Typecheck, Build (`backend` & `frontend`), chạy bộ kiểm thử Playwright E2E (`frontend/e2e/91-feedback-17-10-extra.spec.ts`), chấm điểm qua `scripts/e2e-auditor.mjs` ($50/50$ 🟢 PASS), chụp ảnh bằng chứng nghiệm thu và ghi nhận `RESOLUTION.md` + `docs/SYSTEM_TIMELINE.md`.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### 1. Phạm vi & Tài khoản Kiểm thử (Hub-Scoped Account Selection)
- **File E2E**: `frontend/e2e/91-feedback-17-10-extra.spec.ts`
- **Tài khoản kiểm thử chính**: `USER_WAREHOUSE_HCM` (`warehouse_hcm` — thuộc `Andromeda Hub - HCM`, khớp 100% với ngữ cảnh trên cả 5 ảnh `1.png` -> `3.png`) và kiểm tra phân quyền chéo với `USER_ADMIN` (`admin`).

### 2. Các Kịch bản E2E (Test Scenarios)
1. **Scenario 1 (Task 1 — Không tự động search khi gõ tay, chỉ search khi nhấn `Enter` hoặc `Tab`)**:
   - Đăng nhập bằng `USER_WAREHOUSE_HCM`, mở màn hình `Nhập kho` (`/dashboard/warehouse/inbound`) và `Xuất kho` (`/dashboard/warehouse/outbound`).
   - Mở form lập phiếu, nhập một mã vận đơn vào ô `MÃ VẬN ĐƠN *` và chờ hơn 2 giây (`2200ms`) mà **không** nhấn `Enter` hay `Tab`.
   - **Assert**: Không có request tra cứu đơn hàng nào được tự động bắn đi trong lúc đang gõ/chờ; ô input giữ nguyên giá trị đang gõ.
   - Nhấn phím `Enter` (hoặc `Tab` ở dòng tiếp theo):
   - **Assert**: Request tra cứu được kích hoạt ngay lập tức và tự động điền thông tin đơn hàng (hoặc mở dòng sẵn sàng nhập liệu) chính xác, không bị gọi đúp API khi nhấn `Tab`.
2. **Scenario 2 (Task 2 — Cột `XE & TÀI XẾ` sát `CHUYẾN XE / TRIP` và cột `MÃ VẬN ĐƠN` hiển thị đầy đủ mã vận đơn)**:
   - Tại bảng `Danh sách Chuyến xe Nhập kho` (`/dashboard/warehouse/inbound`) và `Danh sách Chuyến xe Xuất kho` (`/dashboard/warehouse/outbound`), kiểm tra cấu trúc 6 cột: `CHUYẾN XE / TRIP`, `XE & TÀI XẾ`, `MÃ VẬN ĐƠN`, `SỐ KIỆN / TẢI TRỌNG`, `TRẠNG THÁI`, `THAO TÁC`.
   - **Assert Non-Empty**: Bảng có ít nhất 1 dòng dữ liệu thực tế (`expect(rowCount).toBeGreaterThan(0)`).
   - **Assert Khoảng cách & Hiển thị**: Khoảng cách ngang từ cột `CHUYẾN XE / TRIP` tới `XE & TÀI XẾ` gọn sát nhau; cột `MÃ VẬN ĐƠN` hiển thị đầy đủ danh sách các mã vận đơn thuộc chuyến xe với class `text-[10px] text-gray-500` (không bị cắt `...`).
3. **Scenario 3 (Task 3 — In Phiếu Xuất Kho hiển thị đúng `Kho đích / Nơi giao` theo màn hình Xuất kho)**:
   - Tại màn hình `Xuất kho` (`/dashboard/warehouse/outbound`), kiểm tra luồng mở Phiếu xuất nháp / tạo phiếu xuất kho có chọn Trạm đích (`Polaris Hub - Hưng Yên` / Tuyến Xe Bo) và bấm in Phiếu Xuất Kho (`WarehouseOutboundReceiptModal`).
   - **Assert**: Cột `Kho đích / Nơi giao` trên bản xem trước / in Phiếu Xuất Kho hiển thị đúng tên Trạm đích / Tuyến Xe Bo đã chọn ở màn hình xuất kho (không bị in nhầm địa chỉ hợp đồng gốc của khách hàng).

### 3. Ma trận Edge Cases (Edge Cases Matrix)
| # | Tình huống biên (Edge Case) | Kỳ vọng xử lý (Expected Behavior) |
|---|---|---|
| 1 | Người dùng gõ mã vận đơn rồi dừng lại 2–3 giây để đọc phiếu giấy | Không tự động bắn API tìm kiếm khi chưa nhấn `Enter` hoặc `Tab`. |
| 2 | Người dùng nhấn `Tab` để chuyển sang ô tiếp theo | Kích hoạt tìm kiếm đúng 1 lần duy nhất; sự kiện `onBlur` diễn ra ngay sau `Tab` không bắn trùng request lần 2. |
| 3 | Chuyến xe có nhiều mã vận đơn (5–15 mã vận đơn) | Cột `MÃ VẬN ĐƠN` tự động xuống dòng (`break-words leading-snug`) với chữ `text-[10px] text-gray-500`, hiển thị đầy đủ mọi mã vận đơn không bị khuất. |
| 4 | Đơn hàng có địa chỉ hợp đồng gốc là địa chỉ khách lẻ nhưng xuất kho luân chuyển đi Hub Cấp 1 hoặc Tuyến Xe Bo | Cột `Kho đích / Nơi giao` trên Phiếu Xuất Kho hiển thị đúng tên Hub Cấp 1 / Tuyến Xe Bo đã chọn trên màn hình xuất kho, đồng thời vẫn bảo toàn địa chỉ gốc trên hợp đồng của đơn hàng. |
| 5 | Mở lại Phiếu xuất nháp (`DRAFT`) rồi xác nhận xuất kho hoặc bấm `In Phiếu` từ danh sách chuyến xe đã xuất | Cả hai luồng đều hiển thị nhất quán địa chỉ `Kho đích / Nơi giao` theo đúng đích xuất kho của chuyến. |
