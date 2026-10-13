# Feedback 09/10 Task 7 — Tái Cấu Trúc Bảng Dữ Liệu Đơn Hàng Kho Theo Chuẩn Nghiệp Vụ Vận Hành (7 Cột Chuẩn Mực)

> **Thời gian ghi nhận**: 09/10/2026  
> **Người báo cáo**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead  
> **Phạm vi tác động**:  
> - Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx))  
> - Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))  
> - Dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts))  
> - Modal Chi tiết Vận đơn & Sổ cái ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx))  
> - Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///D:/Projects/logistics-website/.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///D:/Projects/logistics-website/AGENTS.md)  
> - Quy chuẩn kiểm soát kiện vận tải (No-SKU, Consignment Level)  
> **Ảnh minh chứng đính kèm trong thư mục**:  
> - [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_7/screenshot_01.jpg): Giao diện màn hình "Tổng Hợp Đơn Hàng Tại Kho • Andromeda Hub - HCM" đang hiển thị 10 cột rườm rà (`STT`, `MÃ ĐƠN HÀNG`, `TÊN HÀNG HÓA`, `CHUYẾN XE / TRIP`, `TỒN KHO`, `SỐ KG`, `SỐ M³`, `ĐÍCH ĐẾN`, `TRẠNG THÁI`, `THAO TÁC`), thiếu hoàn toàn 2 trường then chốt là "Ngày nhập" và "Ngày xuất", thứ tự cột chưa đúng với luồng kiểm soát vòng đời tồn kho của thủ kho.  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"màn hình đơn hàng kho hãy sửa lại nội dung hiện thị các nội dung theo mô tả sau:  STT  Ngày nhập  Mã vận đơn  Số lượng tồn kho  Trạng thái  Ngày xuất   Thao tác"*

---

### 2. Tình huống vận hành thực tế tại Kho hàng (Warehouse Ledger Context)

Trong hệ thống Logistics TMS (Spider Express), màn hình **Đơn hàng kho** (`/dashboard/warehouse/orders`) đóng vai trò là **"Sổ cái hàng hóa lưu bãi & luân chuyển tại Hub"** (Hub Inventory & Storage Ledger). 

Đây là màn hình trọng yếu mà Thủ kho (Warehouse Manager / Operator) truy cập liên tục trong ca trực để trả lời 4 câu hỏi nghiệp vụ cốt lõi:
1. **Lô hàng này vào kho từ thời điểm nào?** (`Ngày nhập` ➔ Xác định tuổi hàng tồn kho, kiểm soát thời gian lưu bãi FIFO).
2. **Mã vận đơn theo dõi là gì?** (`Mã vận đơn` ➔ Định danh duy nhất để đối soát, quét mã, tra cứu phiếu).
3. **Thực tế trong kho còn bao nhiêu kiện để xuất?** (`Số lượng tồn kho` ➔ Kiểm soát khả dụng xuất kho, tránh xuất khống hoặc thiếu hàng).
4. **Vòng đời hàng hóa đang ở giai đoạn nào & đã xuất đi khi nào?** (`Trạng thái` + `Ngày xuất` ➔ Nắm bắt tức thì hàng đã rời kho chưa, xuất đi vào chuyến xe nào).

```mermaid
flowchart LR
    A["Hàng vào kho"] --> B["1. Ngày nhập\n(Ghi nhận thời điểm)"]
    B --> C["2. Mã vận đơn\n(Định danh kiện No-SKU)"]
    C --> D["3. Số lượng tồn kho\n(Số kiện thực tế tại Hub)"]
    D --> E["4. Trạng thái\n(LƯU KHO / ĐÃ XUẤT...)"]
    E --> F["5. Ngày xuất\n(Thời điểm xuất xe / giao)"]
    F --> G["6. Thao tác\n(Chi tiết / In tem A4)"]
```

#### Tại sao bảng 10 cột cũ không phù hợp với thực tế vận hành?
1. **Thiếu 2 mốc thời gian sống còn (`Ngày nhập` và `Ngày xuất`)**:
   - Thủ kho không thể biết đơn hàng đã nằm ở kho bao nhiêu ngày nếu không bấm vào xem chi tiết từng đơn một.
   - Với các đơn đã xuất kho (`COMPLETED_INBOUND`, `Đã xuất kho`), thủ kho hoàn toàn không biết đơn đã được bốc lên xe và xuất khỏi kho vào lúc nào.
2. **Tràn lan thông tin phân tán làm giảm hiệu suất quan sát**:
   - Giao diện cũ hiển thị tới 10 cột: `TÊN HÀNG HÓA`, `CHUYẾN XE / TRIP`, `SỐ KG`, `SỐ M³`, `ĐÍCH ĐẾN` chiếm tới hơn 50% diện tích chiều ngang bảng.
   - Tại màn hình quản lý tồn kho, thủ kho chỉ cần quan tâm tổng thể kiện hàng. Các thông số phụ về mặt hàng No-SKU (`goodsDescription`) và tải trọng (`kg`, `m³`) hoàn toàn có thể gom gọn vào dòng phụ (subline) ngay dưới Mã vận đơn hoặc xem trong modal chi tiết, vừa giữ trọn vẹn thông tin vừa triệt tiêu việc bảng bị kéo ngang quá mức.
3. **Thứ tự cột cũ đi ngược quy trình tự nhiên**:
   - Giao diện cũ đặt `MÃ ĐƠN HÀNG` ngay đầu, sau đó đến một loạt thông số hàng hóa, rồi mới đến `TỒN KHO`, mãi cuối mới đến `TRẠNG THÁI`.
   - Luồng nghiệp vụ chuẩn hóa do người dùng yêu cầu: **`STT` ➔ `Ngày nhập` ➔ `Mã vận đơn` ➔ `Số lượng tồn kho` ➔ `Trạng thái` ➔ `Ngày xuất` ➔ `Thao tác`**. Đây là trình tự đúng chuẩn của một sổ cái xuất nhập tồn hàng hóa kho bãi.

---

### 3. Quy chuẩn đặc tả chi tiết 7 cột hiển thị chuẩn mực

Sau khi tái cấu trúc theo yêu cầu của người dùng, bảng danh sách Đơn hàng kho sẽ sở hữu đúng 7 cột chuẩn mực với quy cách kỹ thuật chi tiết:

| STT | Tên cột hiển thị | Độ rộng đề xuất | Căn lề | Quy chuẩn hiển thị & Nguồn dữ liệu |
|:---:|---|:---:|:---:|---|
| **1** | **STT** | `w-[45px]` | Căn giữa | Số thứ tự phân trang: `((page - 1) * pageSize + idx + 1).toString().padStart(2, '0')`. Font monospace mờ `text-gray-400 text-[10px]`. |
| **2** | **Ngày nhập** | `w-[130px]` | Căn trái | **Thời điểm nhập hàng vào Hub hiện tại** (`inboundAt`):<br>- Lấy từ `createdAt` của giao dịch `order_inventory_transaction` loại `INBOUND` tại kho của tài khoản thao tác (fallback về `order.createdAt` nếu tạo trực tiếp tại Hub).<br>- Định dạng chuẩn Việt Nam: Dòng 1 `DD/MM/YYYY` (`text-[10px] font-medium text-slate-800 dark:text-slate-200`), Dòng 2 `HH:mm` (`text-[9px] text-slate-400`). |
| **3** | **Mã vận đơn** | `min-w-[200px]` | Căn trái | **Định danh vận đơn chuẩn TMS** (`orderCode`):<br>- Dòng 1: Mã vận đơn font monospace in đậm màu xanh (`text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline`). Nhấp chuột để mở [`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx).<br>- Huy hiệu phụ nếu đơn có nhiều dòng: Badge `{members.length} dòng hàng` kèm nút mở rộng/thu gọn sub-rows.<br>- Dòng 2 (Subline thông tin phụ trợ No-SKU): `{goodsDescription}` · `{(totalWeight).toLocaleString('vi-VN')} kg` · `{(totalVolume).toLocaleString('vi-VN')} m³` (`text-[9px] text-slate-500 truncate max-w-[260px]`). |
| **4** | **Số lượng tồn kho** | `w-[130px]` | Căn phải | **Số kiện hàng hóa thực tế đang lưu tại Hub** (`hubStock` / `remainingQuantity`):<br>- Dòng 1: Số kiện tồn kho nổi bật: `<span class="font-bold text-emerald-600 text-xs">{stock}</span> <span class="text-slate-400 text-[10px]">kiện</span>`.<br>- Dòng 2 (Ngữ cảnh hợp đồng): `<span class="text-[9px] text-slate-400">Tổng đơn: {total} kiện</span>` (hoặc nếu hết tồn: badge `<Badge variant="outline" class="text-[9px] text-slate-400">Hết tồn kho</Badge>`). |
| **5** | **Trạng thái** | `w-[120px]` | Căn giữa | **Trạng thái vòng đời hàng hóa theo góc nhìn kho hiện tại** (Hub-scoped status):<br>- Gọi component chuẩn `renderWarehouseOrderStatusBadge(resolveDisplayStatus(row))`.<br>- Các trạng thái chính: `LƯU KHO` (Xanh lá), `ĐƠN NHÁP` (Xám/Vàng), `ĐÃ XUẤT KHO` (Tím/Lam), `ĐANG VẬN CHUYỂN` (Xanh dương).<br>- Tự động kích hoạt trạng thái `COMPLETED_INBOUND` (Đã xuất kho) khi tồn kho tại Hub bằng 0. |
| **6** | **Ngày xuất** | `w-[130px]` | Căn trái / Căn giữa | **Thời điểm xuất hàng khỏi Hub hiện tại** (`outboundAt`):<br>- Lấy từ `createdAt` của giao dịch `order_inventory_transaction` loại `OUTBOUND` hoặc `TRANSFER` tại kho của tài khoản thao tác.<br>- Nếu **đã xuất**: Dòng 1 `DD/MM/YYYY`, Dòng 2 `HH:mm` kèm tooltip/badge chuyến xe xuất (`outboundTripCode` / `licensePlate`).<br>- Nếu **chưa xuất** (hàng đang lưu kho hoặc đơn nháp): Hiển thị dấu gạch ngang mờ `—` (`text-slate-400 font-mono text-center text-xs`). |
| **7** | **Thao tác** | `w-[90px]` | Căn giữa | Cụm nút thao tác nhanh gọn (Icon Buttons h-7 w-7):<br>1. Nút Xem chi tiết: `<IconEye />` (mở [`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)).<br>2. Nút In tem nhãn Pallet A4: `<IconPrinter />` (mở [`PalletLabelA4Modal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)).<br>3. Nút Xóa đơn nháp: `<IconTrash />` (chỉ hiển thị khi đơn ở trạng thái `DRAFT`). |

---

## 🔍 Tổng hợp các điểm chưa đúng trên giao diện cũ (Đối chiếu chi tiết với `screenshot_01.jpg`)

Đối chiếu trực tiếp với ảnh chụp màn hình thực tế [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_7/screenshot_01.jpg):

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CẤU TRÚC BẢNG CŨ (10 CỘT RƯỜM RÀ, THIẾU NGÀY NHẬP/XUẤT TRÊN SCREENSHOT_01.JPG):                       │
│ [STT] [MÃ ĐƠN HÀNG] [TÊN HÀNG HÓA] [CHUYẾN XE / TRIP] [TỒN KHO] [SỐ KG] [SỐ M³] [ĐÍCH ĐẾN] [TRẠNG THÁI] [THAO TÁC]│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CẤU TRÚC 7 CỘT CHUẨN MỰC THEO YÊU CẦU NGƯỜI DÙNG (@【M】【C】【D】):                                    │
│ [STT] [Ngày nhập] [Mã vận đơn] [Số lượng tồn kho] [Trạng thái] [Ngày xuất] [Thao tác]                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Điểm lỗi 1: Hoàn toàn thiếu cột `Ngày nhập`**:
   - Trên [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_7/screenshot_01.jpg), bảng không có bất kỳ cột nào hiển thị ngày nhập kho của lô hàng.
   - Thủ kho không thể biết đơn `BAT2610-934` hay `PML2610-673` đã nhập vào kho từ ngày nào.
2. **Điểm lỗi 2: Hoàn toàn thiếu cột `Ngày xuất`**:
   - Trên [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_7/screenshot_01.jpg), dòng số 10 (`NMT2610-238`) mang trạng thái `Đã xuất kho` nhưng trên dòng không có bất kỳ thông tin nào cho biết ngày xuất kho thực tế diễn ra khi nào.
3. **Điểm lỗi 3: Tên gọi cột chưa chuẩn xác nghiệp vụ vận tải kho bãi**:
   - Cột 2 cũ dùng `MÃ ĐƠN HÀNG`: Người dùng yêu cầu chuẩn hóa thành **`Mã vận đơn`**.
   - Cột 5 cũ dùng `TỒN KHO`: Người dùng yêu cầu chuẩn hóa thành **`Số lượng tồn kho`**.
4. **Điểm lỗi 4: Thứ tự các cột bị xáo trộn, không theo luồng tác nghiệp tự nhiên**:
   - Cũ: `MÃ ĐƠN HÀNG` (cột 2) ➔ `TỒN KHO` (cột 5) ➔ `TRẠNG THÁI` (cột 9).
   - Yêu cầu người dùng: `STT` (1) ➔ `Ngày nhập` (2) ➔ `Mã vận đơn` (3) ➔ `Số lượng tồn kho` (4) ➔ `Trạng thái` (5) ➔ `Ngày xuất` (6) ➔ `Thao tác` (7).
5. **Điểm lỗi 5: Quá tải 5 cột phân tán (`TÊN HÀNG HÓA`, `CHUYẾN XE / TRIP`, `SỐ KG`, `SỐ M³`, `ĐÍCH ĐẾN`)**:
   - Chiếm dụng hơn 500px chiều ngang màn hình nhưng không phải là các trường trọng tâm của sổ cái kho.
   - Cần tinh gọn các thông tin này: Hàng hóa No-SKU và trọng lượng đưa vào subline của `Mã vận đơn`, chi tiết chuyến xe và lộ trình có thể xem tức thì trong [`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx).
6. **Điểm lỗi 6: Backend API chưa bóc tách và trả về `inboundAt` & `outboundAt`**:
   - Trong [`WarehouseService.aggregateOrderGroup`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L564-L675) và [`enrichWarehouseRows`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L438-L477), đối tượng trả về hiện chỉ có `createdAt`, `updatedAt` của bảng `order`.
   - Chưa trích xuất trường `inboundAt` (thời điểm phát sinh giao dịch nhập kho `INBOUND` tại Hub) và `outboundAt` (thời điểm phát sinh giao dịch xuất kho `OUTBOUND` hoặc `TRANSFER` tại Hub) từ mảng quan hệ `inventoryTransactions`.
7. **Điểm lỗi 7: Đồng bộ cấu trúc bảng con mở rộng (Sub-rows)**:
   - Khi một mã vận đơn có nhiều dòng hàng (`members.length > 1`), bảng con mở rộng hiện tại đang render theo cấu trúc 10 cột cũ.
   - Cần đồng bộ cấu trúc bảng con mở rộng về đúng 7 cột để đảm bảo tính thẳng hàng (alignment) hoàn hảo giữa dòng cha và dòng con.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Backend (`backend/`)
- [x] **1.1. Cập nhật `WarehouseService.enrichWarehouseRows`**:
  - Đối với mỗi bản ghi `OrderEntity`, duyệt qua mảng quan hệ `item.inventoryTransactions` để bóc tách:
    * `inboundAt`: Lấy `tx.createdAt` của giao dịch `type === 'INBOUND'` tại `userHubId` (nếu không có, fallback về `item.createdAt` nếu đơn tạo tại Hub này).
    * `outboundAt`: Lấy `tx.createdAt` của giao dịch `type IN ('OUTBOUND', 'TRANSFER')` gần nhất tại `userHubId` (trả về `null` nếu chưa có giao dịch xuất).
    * `outboundTripCode` / `outboundLicensePlate`: Lấy thông tin chuyến xe xuất hoặc biển số xe xuất tương ứng với giao dịch xuất đó.
- [x] **1.2. Cập nhật `WarehouseService.aggregateOrderGroup` (Chế độ Gom nhóm `groupBy=orderCode`)**:
  - Tổng hợp các mốc thời gian cho dòng đại diện của mã vận đơn:
    * `inboundAt`: Lấy thời điểm nhập sớm nhất (hoặc muộn nhất) trong số các items thuộc mã đơn.
    * `outboundAt`: Lấy thời điểm xuất muộn nhất nếu các items đã được xuất kho (hoặc `null` nếu còn tồn kho).
    * `outboundTripCode` & `outboundLicensePlate`: Lưu thông tin chuyến xe xuất để phục vụ hiển thị.
  - Bổ sung `inboundAt`, `outboundAt`, `outboundTripCode`, `outboundLicensePlate` vào kết quả trả về của đối tượng tổng hợp và từng item trong mảng `items`.
- [x] **1.3. Cập nhật Type Definitions & Interface trong Backend**:
  - Bổ sung các trường `inboundAt?: Date | string | null`, `outboundAt?: Date | string | null`, `outboundTripCode?: string | null`, `outboundLicensePlate?: string | null` vào interface `WarehouseOrdersResult` và các DTO liên quan.
- [x] **1.4. Kiểm tra Typecheck & Build Backend**:
  - Chạy `npm run typecheck` và `npm run build` trong `backend/`, đảm bảo 0 lỗi TypeScript compilation.

---

### 2. Frontend (`frontend/`)
- [x] **2.1. Cập nhật hằng số & tiêu đề cột tại `frontend/src/app/dashboard/warehouse/orders/page.tsx`**:
  - Đổi `COLUMN_COUNT = 7` (thay thế hằng số cũ `10`).
  - Cập nhật thẻ `<thead>` hiển thị chính xác 7 cột theo đúng thứ tự người dùng yêu cầu:
    ```tsx
    <tr>
      <th className='py-1 px-1.5 w-[45px] text-center'>STT</th>
      <th className='py-1 px-1.5 w-[130px]'>Ngày nhập</th>
      <th className='py-1 px-1.5 min-w-[200px]'>Mã vận đơn</th>
      <th className='py-1 px-1.5 w-[130px] text-right'>Số lượng tồn kho</th>
      <th className='py-1 px-1.5 w-[120px] text-center'>Trạng thái</th>
      <th className='py-1 px-1.5 w-[130px] text-center'>Ngày xuất</th>
      <th className='py-1 px-1.5 w-[90px] text-center'>Thao tác</th>
    </tr>
    ```
- [x] **2.2. Xây dựng hàm định dạng Ngày/Giờ chuẩn Việt Nam**:
  - Tạo helper định dạng `formatDateTime(dateValue?: string | Date | null)`:
    * Nếu có giá trị hợp lệ: Hiển thị 2 dòng (dòng 1: `DD/MM/YYYY`, dòng 2: `HH:mm` mờ `text-[9px] text-slate-400`).
    * Nếu `null` / `undefined`: Trả về dấu gạch ngang mờ `—` (`text-slate-400 font-mono text-center`).
- [x] **2.3. Tái cấu trúc Render dòng dữ liệu cha (`row`)**:
  - Cột 1 (`STT`): Hiển thị số thứ tự chuẩn phân trang.
  - Cột 2 (`Ngày nhập`): Render `formatDateTime(row.inboundAt || row.createdAt)`.
  - Cột 3 (`Mã vận đơn`):
    * Dòng chính: Mã vận đơn font monospace in đậm màu xanh (`text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400`).
    * Badge mở rộng số dòng nếu đơn có nhiều dòng (`{members.length} dòng hàng`).
    * Subline thông tin hàng hóa No-SKU: `{row.goodsDescription}` · `{(row.totalWeight)} kg` · `{(row.totalVolume)} m³`.
  - Cột 4 (`Số lượng tồn kho`):
    * Hiển thị số kiện tồn kho khả dụng tại Hub: `<span className="font-bold text-emerald-600 text-xs">{stock}</span> <span className="text-slate-400 text-[10px]">kiện</span>`.
    * Subline tổng kiện hợp đồng: `Tổng: {total} kiện`.
  - Cột 5 (`Trạng thái`):
    * Render qua `renderWarehouseOrderStatusBadge(resolveDisplayStatus(row))`.
  - Cột 6 (`Ngày xuất`):
    * Nếu có `row.outboundAt`: Render `formatDateTime(row.outboundAt)` kèm tooltip mã chuyến xe/biển số xe xuất.
    * Nếu không có: Render `—`.
  - Cột 7 (`Thao tác`):
    * Cụm nút: Xem chi tiết (`<IconEye />`), In tem A4 (`<IconPrinter />`), Xóa nháp (`<IconTrash />` với đơn DRAFT).
- [x] **2.4. Đồng bộ cấu trúc bảng con mở rộng (Sub-rows `members.map`)**:
  - Tái cấu trúc các dòng con khi người dùng bấm mở rộng đơn hàng nhiều dòng để khớp đúng 7 cột:
    * Cột 1: STT dòng con (`Dòng 1`, `Dòng 2`...).
    * Cột 2: Ngày nhập của từng dòng con.
    * Cột 3: Tên hàng hóa chi tiết của dòng con.
    * Cột 4: Số lượng tồn kho của dòng con.
    * Cột 5: Trạng thái của dòng con.
    * Cột 6: Ngày xuất của dòng con.
    * Cột 7: Thao tác của dòng con.
- [x] **2.5. Tuân thủ Quy chuẩn Giao diện Hẹp (UI Compact Density Mandate)**:
  - Giữ vững quy tắc: Typography `text-[10px]` cho cells, `text-[11px]` font-mono font-bold cho mã vận đơn, padding `py-1 px-1.5`.
  - Tuyệt đối không sinh các class bị cấm (`p-4`, `p-6`, `gap-4`, `space-y-4`).
- [x] **2.6. Kiểm tra Typecheck & Build Frontend**:
  - Chạy `npm run typecheck` trong `frontend/`, đảm bảo 0 lỗi TypeScript compilation.

---

### 3. Kiểm thử & Nghiệm thu
- [x] **3.1. Type check & Lint Verification**:
  - Chạy `npm run check:all` kiểm tra toàn bộ workspace (backend + frontend).
- [x] **3.2. Viết Kịch bản Kiểm thử Tự động Playwright E2E**:
  - Tạo file `frontend/e2e/43-feedback-09-10-task-7-warehouse-orders-columns.spec.ts`.
  - Kiểm thử các ca kiểm thử chính:
    1. Truy cập màn hình Đơn hàng kho (`/dashboard/warehouse/orders`) với quyền `WAREHOUSE_MANAGER`.
    2. Xác minh bảng dữ liệu có đúng **7 cột** với tiêu đề chính xác: `STT`, `Ngày nhập`, `Mã vận đơn`, `Số lượng tồn kho`, `Trạng thái`, `Ngày xuất`, `Thao tác`.
    3. Xác minh cột `Ngày nhập` hiển thị đúng định dạng ngày tháng (`DD/MM/YYYY`).
    4. Xác minh cột `Ngày xuất` hiển thị đúng ngày xuất đối với các đơn đã xuất (`COMPLETED_INBOUND`, `Đã xuất kho`) và hiển thị dấu gạch ngang `—` đối với các đơn đang lưu kho (`LƯU KHO`, `DRAFT`).
    5. Xác minh cột `Số lượng tồn kho` hiển thị số kiện tồn kho khả dụng tại Hub.
    6. Xác minh thao tác bấm vào Mã vận đơn hoặc nút Con mắt mở đúng modal [`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx).
    7. Chụp ảnh màn hình minh chứng nghiệm thu: `screenshot_verified_warehouse_orders_7_columns.png`.
- [x] **3.3. Đánh giá chất lượng qua Audit Scripts**:
  - Chạy `node scripts/e2e-auditor.mjs` đạt điểm số $\ge 40/50$, 0 FAIL.
  - Chạy kiểm tra UI Compact Density đảm bảo không phát sinh class bị cấm.
