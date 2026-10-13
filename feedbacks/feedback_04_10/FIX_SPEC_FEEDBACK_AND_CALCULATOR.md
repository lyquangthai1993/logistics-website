# ĐÁNH GIÁ NGHIỆP VỤ & KẾ HOẠCH FIX TOÀN DIỆN CÁC ISSUE FEEDBACK 04/10
> **Tài liệu chuẩn hóa bởi**: TMS Domain Lead (`/leader`)  
> **Áp dụng cho**: Logistics TMS (Spider Express) — Backend NestJS & Frontend Next.js  
> **Mục tiêu**: Rà soát tận gốc mã nguồn hiện tại, bóc tách nguyên nhân kỹ thuật, dự trù chi tiết các công việc cần làm, xác định đầy đủ các Edge Cases, **đánh giá toàn diện số liệu trang Đơn hàng kho (`/dashboard/warehouse/orders`)** và chuẩn bị kịch bản kiểm thử tự động với mock data.

---

## 📑 MỤC LỤC
1. [Tổng quan Đánh giá Feedback 04/10](#1-tổng-quan-đánh-giá-feedback-0410)
2. [Rà soát Hiện trạng Codebase & Nguyên nhân Gốc rễ (7 Issues)](#2-rà-soát-hiện-trạng-codebase--nguyên-nhân-gốc-rễ-7-issues)
   - [Issue 1: Modal Tra Cứu & Chọn Đơn Xuất Kho](#issue-1-modal-tra-cứu--chọn-đơn-xuất-kho)
   - [Issue 2: Tối ưu Menu Sidebar cho SUPER_ADMIN](#issue-2-tối-ưu-menu-sidebar-cho-super_admin)
   - [Issue 3: Bảng Tổng Hợp Đơn Hàng Tại Kho (Gom Mã Đơn Hàng & Bỏ Cột Số Kiện)](#issue-3-bảng-tổng-hợp-đơn-hàng-tại-kho-gom-mã-đơn-hàng--bỏ-cột-số-kiện)
   - [Issue 4: Runtime TypeError `freshData.find is not a function`](#issue-4-runtime-typeerror-freshdatafind-is-not-a-function)
   - [Issue 5: Sai lệch Đếm Hàng Hóa, Chuyến Xe Đa Chặng & Trạm Xe Bo](#issue-5-sai-lệch-đếm-hàng-hóa-chuyến-xe-đa-chặng--trạm-xe-bo)
   - [Bổ sung Mục 5: Đánh Giá Toàn Diện Số Liệu Trang "Đơn Hàng Kho" (`/dashboard/warehouse/orders`)](#bổ-sung-mục-5-đánh-giá-toàn-diện-số-liệu-trang-đơn-hàng-kho-dashboardwarehouseorders)
   - [Issue 6: Lỗi Khóa Dòng Trùng Mã Đơn Hàng Trong Modal Tra Cứu (`✓ Đã ở Dòng #1`)](#issue-6-lỗi-khóa-dòng-trùng-mã-đơn-hàng-trong-modal-tra-cứu--đã-ở-dòng-1)
   - [Issue 7: Modal Phiếu Xuất Kho Gộp Chung 1 Dòng Sau Khi Tạo Thành Công](#issue-7-modal-phiếu-xuất-kho-gộp-chung-1-dòng-sau-khi-tạo-thành-công)
3. [Dự Trù & Phân Rã Công Việc Cần Thực Hiện (Action Plan)](#3-dự-trù--phân-rã-công-việc-cần-thực-hiện-action-plan)
4. [Các Edge Cases Cần Lưu Ý Đặc Biệt](#4-các-edge-cases-cần-lưu-ý-đặc-biệt)
5. [Quy Trình Reset Database & Kịch Bản Nghiệm Thu Đơn Hàng Kho (DoD)](#5-quy-trình-reset-database--kịch-bản-nghiệm-thu-đơn-hàng-kho-dod)

---

## 1. TỔNG QUAN ĐÁNH GIÁ FEEDBACK 04/10

Tập feedback ngày 04/10 phản ánh các vấn đề then chốt trong chu trình vận hành kho vận (Warehouse Inbound / Outbound / Inventory Ledger), chia thành 4 nhóm trọng tâm:
1. **Lỗi logic hiển thị & điều kiện lọc dữ liệu kho (UI/UX Logic)**: Modal xuất kho hiển thị cả đơn "Chờ nhập kho" (hàng chưa về kho đã cho xuất là sai nghiệp vụ vận hành); Menu Super Admin thừa các mục demo template.
2. **Lỗi Runtime sập trang (Bug Crash)**: Nút "Cập nhật lại thông số" ở trang Xuất kho bị crash do interceptor đóng gói response `{ statusCode: 200, data: [...] }`.
3. **Lỗi cấu trúc dữ liệu & hạch toán số kiện (Core Calculation & Multi-Stop Dispatch)**:
   - Trang Tổng Hợp Đơn Hàng Tại Kho (`/dashboard/warehouse/orders`) hiển thị rời rạc từng dòng hàng thay vì gom theo Mã đơn hàng (`orderCode`), đồng thời dư thừa cột `SỐ KIỆN`.
   - Vòng đời luân chuyển đa chặng trên cùng 1 chuyến xe (HCM ➔ Đà Nẵng ➔ Hưng Yên ➔ Xe Bo): Sự không đồng nhất giữa cột số lượng toàn cục `order.remainingQuantity` và tồn kho thực tế theo sổ cái `hubStock`, dẫn tới sai lệch số kiện giữa các kho trung chuyển và lỗi hiển thị thông tin tuyến Xe Bo.
   - **Yêu cầu bổ sung đặc biệt**: Đánh giá lại toàn bộ số liệu trên màn hình "Đơn hàng kho" (`/dashboard/warehouse/orders`) ở cả 3 kho (HCM, Đà Nẵng, Hưng Yên) xem đã chuẩn xác theo từng mốc thời gian luân chuyển hay chưa.
4. **Lỗi khóa chọn dòng & gộp dữ liệu phiếu xuất kho (Consignment Item Identity & Multi-line Receipt)**:
   - **Issue 6**: Modal tra cứu xuất kho khóa nhầm dòng hàng (`✓ Đã ở Dòng #1`) đối với các mặt hàng khác nhau nhưng có chung mã đơn hàng (`orderCode`).
   - **Issue 7**: Modal Phiếu Xuất Kho sau khi tạo thành công gộp toàn bộ các dòng hàng riêng biệt thành một dòng duy nhất ("Sữa, PLT" 50 kiện) do frontend không truyền mảng `items`.

---

## 2. RÀ SOÁT HIỆN TRẠNG CODEBASE & NGUYÊN NHÂN GỐC RỄ (7 ISSUES)

### Issue 1: Modal Tra Cứu & Chọn Đơn Xuất Kho
- **Hiện tượng**: Trong ảnh `feedback_04_10/list_order_wrong_when_create_outbound.png`, khi bấm "Tra Cứu & Chọn Đơn Hàng Từ Kho" tại trang Tạo xuất kho, tab "Tất cả (27)" hiển thị danh sách các đơn hàng có trạng thái **`Chờ nhập kho`** (`PENDING_INBOUND`).
- **Rà soát code**:
  - Tại `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`:
    - Khi gọi `fetch('/api/v1/warehouse/orders?...')`, component **không truyền tham số `flow=OUTBOUND`** hoặc cờ phân biệt ngữ cảnh xuất kho.
    - Dòng 346: `isDraftLike` gộp cả `PENDING_INBOUND` vào nhóm hiển thị.
    - Cột hiển thị số lượng hiện đang đọc `row.totalQuantity` thay vì số lượng tồn kho khả dụng (`row.hubStock ?? row.remainingQuantity`).
  - Tại `backend/src/orders/warehouse.service.ts`:
    - Khi `flow` không được truyền hoặc bằng `OUTBOUND`, dòng 213 kiểm tra `storedOrDispatched` gồm cả `DISPATCHED_STATUSES` (hàng đã xuất hết).
    - Bộ đếm tab `draftCount` lại tính trên `WAITING_STATUSES` (chứa cả `PENDING_INBOUND`), khiến con số thống kê và dữ liệu bảng bị trộn lẫn đơn hàng sắp về.
- **Nguyên nhân gốc rễ**: Khi xuất kho, thủ kho chỉ được phép chọn hàng **đang có sẵn trong kho** (`hubStock > 0` hoặc trạng thái `INBOUND`/`STORED`/`DRAFT` tại kho hiện tại). Đơn hàng đang trên đường tới kho (`PENDING_INBOUND`) chưa thực hiện bốc dỡ/nhập kho thì tuyệt đối không thể xuất đi.

---

### Issue 2: Tối ưu Menu Sidebar cho SUPER_ADMIN
- **Hiện tượng**: Trong ảnh `feedback_04_10/menu_super_admin_redundant_item.png`, menu của Super Admin có nhóm "Không gian làm việc" (chứa Kanban, Chat, AI Chat) và nhóm "Overview" (chỉ có duy nhất 1 mục Dashboard) gây lãng phí không gian màn hình và không thuộc phạm vi vận hành cốt lõi của TMS.
- **Rà soát code**:
  - Tại `frontend/src/config/nav-config.ts`:
    - Nhóm 1: `label: 'Overview'` bọc 1 item duy nhất là `Dashboard`.
    - Nhóm 4: `label: 'Không gian làm việc'` bọc các trang mẫu starter-kit (`/dashboard/kanban`, `/dashboard/chat`, `/dashboard/ai-chat`).
  - Tại `frontend/src/components/layout/app-sidebar.tsx`: Render mọi nhóm nếu có item, nhóm có label sẽ sinh thêm `<SidebarGroupLabel>` chiếm 1 dòng riêng.
- **Nguyên nhân gốc rễ**: Code mẫu demo của dashboard template chưa được loại bỏ triệt để, thiếu sự tinh gọn theo quy chuẩn UI Compact Density của TMS.

---

### Issue 3: Bảng Tổng Hợp Đơn Hàng Tại Kho (Gom Mã Đơn Hàng & Bỏ Cột Số Kiện)
- **Hiện tượng**: Trong ảnh `feedback_04_10/tong_hop_don_hang_khong_gom_ma_don_hang.png`, tại URL `/dashboard/warehouse/orders`:
  - Có cả 2 cột: `TỒN KHO` (ví dụ: `3 kiện`) và `SỐ KIỆN` (ví dụ: `3`).
  - Các dòng hàng có cùng mã đơn hàng (hoặc phát sinh trong cùng lô hàng) bị tách thành từng dòng riêng lẻ (`BAT2609-335TH` dòng 1, dòng 2; `NTC2610-004` dòng 1, dòng 2).
- **Rà soát code**:
  - Tại `backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts`: Cột `orderCode` có `unique: false` để phục vụ quy ước Master Contract hoặc nhập hàng theo kiện/lô.
  - Tại `backend/src/orders/warehouse.service.ts`: Query `getOrders` truy vấn thẳng `this.orderRepository.createQueryBuilder('order')` mà không có `GROUP BY order.orderCode`, dẫn đến việc mỗi record vật lý trong bảng `order` hiển thị thành 1 dòng riêng trên frontend.
  - Tại `frontend/src/app/dashboard/warehouse/orders/page.tsx`:
    - Dòng 190-193: Render song song cả cột `TỒN KHO` (`remainingQuantity`) và `SỐ KIỆN` (`totalQuantity`).
- **Nguyên nhân gốc rễ**: Người dùng quản lý đơn hàng ở cấp độ Mã vận đơn tổng thể (Consignment/Order Code Level). Nếu một đơn hàng gồm nhiều kiện hoặc nhiều lần cập nhật, thủ kho chỉ muốn nhìn thấy 1 dòng tổng hợp duy nhất cho Mã đơn đó, với tổng số kg, tổng số m³, tổng tồn kho gom lại, và bỏ cột "Số kiện" trùng lặp.

---

### Issue 4: Runtime TypeError `freshData.find is not a function`
- **Hiện tượng**: Khi đang tạo phiếu xuất kho tại `/dashboard/warehouse/outbound`, thêm dòng hàng rồi nhấn "Cập nhật lại thông số", giao diện sập với lỗi:
  ```text
  Runtime TypeError: freshData.find is not a function
  at WarehouseOutboundPage (src/app/dashboard/warehouse/outbound/page.tsx:311:41)
  ```
- **Rà soát code**:
  - Tại `frontend/src/app/dashboard/warehouse/outbound/page.tsx`:
    ```typescript
    // Dòng 306-311
    if (res.ok) {
      const freshData: any[] = await res.json();
      if (activeView === 'MODE1_CUSTOMER') {
        setMode1Rows((prev) =>
          prev.map((r) => {
            const fresh = freshData.find((f) => f.id === r.id); // <-- SẬP TẠI ĐÂY
    ```
  - Tại `backend/src/common/interceptors/response-transform.interceptor.ts`:
    - Interceptor bọc mọi kết quả trả về trong cấu trúc:
      ```json
      {
        "statusCode": 200,
        "message": "Success",
        "data": [ ... ],
        "timestamp": "..."
      }
      ```
    - Do đó, `res.json()` trả về một **Object**, không phải Array. Việc gọi trực tiếp `freshData.find` lập tức ném ra TypeError.
    - Đồng thời, code chỉ cập nhật cho `mode1Rows`, bỏ quên `mode2Rows` khi thủ kho đang thao tác ở tab `MODE2_TRANSFER`.
- **Nguyên nhân gốc rễ**: Frontend không chuẩn hóa lớp bóc tách ApiResponse (Envelope unwrap), giả định sai lệch cấu trúc dữ liệu trả về từ NestJS.

---

### Issue 5: Sai lệch Đếm Hàng Hóa, Chuyến Xe Đa Chặng & Trạm Xe Bo
- **Hiện tượng & Kịch bản**:
  - **Inbound HCM**: Tạo 3-4 dòng hàng ngẫu nhiên.
  - **Outbound HCM**: Xuất trên **CÙNG 1 CHUYẾN XE (1 TRIP)** đi 3 đích:
    - 10 kiện ➔ Đà Nẵng (Hub L1).
    - 7 kiện ➔ Hưng Yên (Hub L1).
    - 3 kiện ➔ Trạm Xe Bo (Hub L2).
  - Khi xe đến Đà Nẵng: Số kiện thực tế hiển thị không chính xác; chi tiết đơn hàng tại Đà Nẵng bị sai lệch thông tin Xe Bo; kiểm tra DB thấy số kiện của Xe Bo chưa chuẩn.
- **Rà soát code chuyên sâu**:
  1. **Lỗi phân loại Xe Bo tại UI (`warehouse-waybill-detail-modal.tsx`)**:
     - Dòng 569:
       ```typescript
       waybill.deliveryMode === 'HUB_L1' || waybill.destinationHub
         ? 'Hub Cấp 1'
         : waybill.deliveryMode === 'XE_BO'
         ? 'Xe bo'
         : 'Giao thẳng'
       ```
       Vì `waybill.destinationHub` lưu tên trạm xe bo (ví dụ: `"Xe bo Tuyến Đà Nẵng"`), điều kiện `waybill.destinationHub` là truthy ➔ **Luôn hiển thị là 'Hub Cấp 1'**, nuốt chửng nhãn `'Xe bo'`.
  2. **Lỗi ghi đè `deliveryMode` tại lưới nhập hàng (`warehouse-editable-grid.tsx`)**:
     - Dòng 614: Khi thủ kho chọn đơn hàng từ modal tra cứu, code ép cứng `deliveryMode: 'DIRECT_CUSTOMER'`, làm mất thông tin liên kết Xe Bo (`level = 2`) của Hub đích.
  3. **Lỗi cập nhật số lượng toàn cục (`order.remainingQuantity`) thay vì Sổ cái kho (`order_inventory_transaction`)**:
     - Trong `backend/src/orders/warehouse.service.ts` dòng 948-949 (hàm `confirmInbound`):
       ```typescript
       found.inboundQuantity = (Number(found.inboundQuantity) || 0) + actualQty;
       found.remainingQuantity = (Number(found.remainingQuantity) || 0) + actualQty;
       ```
       Khi Đà Nẵng nhận 10 kiện từ HCM, việc cộng thêm vào `remainingQuantity` trên bảng `order` khiến tổng tồn kho toàn hệ thống bị đội lên (HCM còn 10, Đà Nẵng nhận 10 ➔ biến thành 20), trong khi bản chất đây là lệnh chuyển kho (Transfer Receiving).
     - Nguồn sự thật duy nhất (Single Source of Truth) của tồn kho tại từng Hub bắt buộc phải tính theo sổ cái:
       $$\text{Tồn kho tại Hub } X = \sum \text{INBOUND} - \sum (\text{OUTBOUND} + \text{TRANSFER})$$
       được quản lý bởi `OperationalLedgerService.getHubStock(orderId, hubId)`.

---

### BỔ SUNG MỤC 5: ĐÁNH GIÁ TOÀN DIỆN SỐ LIỆU TRANG "ĐƠN HÀNG KHO" (`/dashboard/warehouse/orders`)

Người dùng đặc biệt yêu cầu: **"bổ sung mục số 5, là tôi cần đánh giá lại Đơn hàng kho nữa, số liệu xem đã đúng chưa"**.  
Dưới đây là bản đánh giá chuyên sâu 100% số liệu trên trang `/dashboard/warehouse/orders`:

#### 1. Hiện trạng Hiển thị Số liệu trên Trang Đơn Hàng Kho:
- **Cột TỒN KHO**:
  - Code hiện tại (`WarehouseOrdersPage.tsx:279`):
    ```tsx
    <td className='py-1 px-1.5 text-right font-bold text-emerald-600 ...'>
      {row.remainingQuantity ?? row.totalQuantity ?? 0} kiện
    </td>
    ```
  - **LỖI LỚN**: Đang đọc `row.remainingQuantity` (trường scalar toàn cục trên bảng `order`).
  - **Hệ quả**: Khi đơn hàng được luân chuyển một phần từ HCM ra Đà Nẵng (ví dụ 10 kiện chuyển đi, 5 kiện ở lại HCM):
    - Cả thủ kho HCM và thủ kho Đà Nẵng khi vào trang Đơn Hàng Kho đều nhìn thấy cùng một con số `row.remainingQuantity`, thay vì thấy tồn kho thực tế của kho mình!
    - **Khắc phục**: Bắt buộc phải hiển thị **`row.hubStock ?? 0`** (được backend tính toán độc lập cho từng kho dựa trên sổ cái giao dịch `order_inventory_transaction`).
- **Cột SỐ KIỆN**:
  - Dòng 282: `{row.totalQuantity ?? 1}` đứng song song với cột TỒN KHO ➔ Gây nhầm lẫn cho thủ kho giữa "Tổng số kiện hợp đồng ban đầu" và "Số kiện đang thực tế nằm trong kho".
  - **Khắc phục**: **Xóa bỏ hoàn toàn cột SỐ KIỆN** theo đúng yêu cầu Issue 3.
- **Cột SỐ KG & SỐ M³**:
  - Khi gom theo `orderCode`, số Kg và số $m^3$ phải tính bằng tổng của các dòng con thuộc mã đơn đó đang tồn tại kho: `SUM(totalWeight)`, `SUM(totalVolume)`.
- **Cột CHUYẾN XE / TRIP**:
  - Hiện tại chỉ hiển thị chuyến xe đầu tiên (`row.trips?.[0]`). Khi đơn hàng đi qua nhiều chặng (ví dụ: Chặng 1 HCM ➔ Đà Nẵng trên chuyến SD01; Chặng 2 Đà Nẵng giao Xe Bo trên chuyến SD05), cột này phải gom và hiển thị các chuyến xe liên quan kèm badge `+1`, `+2` để thủ kho tra cứu nhanh.
- **Cột TRẠNG THÁI (Status Badge)**:
  - Phải hiển thị theo trạng thái kho theo góc nhìn (`hubStatus`):
    - `LƯU KHO`: Khi kho đang giữ tồn (`hubStock > 0`).
    - `ĐÃ XUẤT KHO`: Khi kho đã xuất hết toàn bộ hàng của mã đơn đó (`hubStock == 0` và đã có phiếu xuất).
    - `DRAFT`: Đơn nháp đang lập tại kho.
- **Tính Nhất Quán Giữa Tab Counter & Danh Sách (1:1 Parity)**:
  - Bốn tab: `Tất cả`, `LƯU KHO`, `DRAFT`, `ĐÃ XUẤT KHO`. Số lượng hiển thị trên tab phải khớp chính xác 100% với số lượng bản ghi render trong bảng.

#### 2. Bảng Đối Chiếu Số Liệu Kỳ Vọng của "Đơn Hàng Kho" Qua Từng Mốc Luân Chuyển:
Giả định Kịch bản chuẩn: Đơn hàng tạo tại HCM gồm 4 dòng (Row 1: 15k, Row 2: 12k, Row 3: 8k, Row 4: 5k). Xuất 1 chuyến SD-01 chở: 10k đi Đà Nẵng, 7k đi Hưng Yên, 3k đi Xe Bo Đà Nẵng.

| Mốc Thời Gian Vận Hành | Kho Đang Xem | Trạng thái hiển thị trên Đơn Hàng Kho | Cột TỒN KHO hiển thị | Cột ĐÍCH ĐẾN | Cột CHUYẾN XE |
|---|:---:|:---:|:---:|:---:|:---:|
| **Mốc 1: Vừa Nhập Kho tại HCM** | HCM (Hub 1) | `LƯU KHO` (cả 4 dòng) | **15k, 12k, 8k, 5k** | Đích ban đầu | Biển số xe nhập vào |
| | Đà Nẵng (Hub 2) | *Chưa xuất hiện (hoặc ở Inbound Board)* | 0 kiện | — | — |
| | Hưng Yên (Hub 3) | *Chưa xuất hiện* | 0 kiện | — | — |
| **Mốc 2: HCM vừa Xuất Chuyến SD-01** | HCM (Hub 1) | Row 1, 2, 3: `LƯU KHO` (Đang xuất từng phần)<br>Row 4: `LƯU KHO` | **Row 1: 5k** (15-10)<br>**Row 2: 5k** (12-7)<br>**Row 3: 5k** (8-3)<br>**Row 4: 5k** (nguyên) | Đà Nẵng / Hưng Yên / Xe Bo | Chuyến xuất `SD-01` |
| | Đà Nẵng (Hub 2) | *Ở Inbound Board (`Chờ nhập kho`)* | 0 kiện (chưa dỡ) | — | Chuyến đến `SD-01` |
| | Hưng Yên (Hub 3) | *Ở Inbound Board (`Chờ nhập kho`)* | 0 kiện (chưa dỡ) | — | Chuyến đến `SD-01` |
| **Mốc 3: Đà Nẵng Bốc Dỡ & Nhận Hàng (10k Row 1 + 3k Xe Bo)** | Đà Nẵng (Hub 2) | **`LƯU KHO`** | **Row 1: 10k**<br>**Row 3: 3k** | Row 1: Đà Nẵng<br>Row 3: **`Xe bo Tuyến Đà Nẵng`** | Chuyến `SD-01` |
| | HCM (Hub 1) | `LƯU KHO` (tồn tại HCM không đổi) | **Row 1: 5k, Row 2: 5k, Row 3: 5k, Row 4: 5k** | — | Chuyến `SD-01` |
| | Hưng Yên (Hub 3) | *Hàng 7k vẫn in-transit trên xe* | 0 kiện (chưa nhận) | — | Chuyến `SD-01` |
| **Mốc 4: Hưng Yên Bốc Dỡ & Nhận Hàng (7k Row 2)** | Hưng Yên (Hub 3) | **`LƯU KHO`** | **Row 2: 7k** | Hưng Yên | Chuyến `SD-01` |
| | Đà Nẵng (Hub 2) | `LƯU KHO` (không đổi) | **Row 1: 10k, Row 3: 3k** | Đà Nẵng / Xe Bo | — |
| | HCM (Hub 1) | `LƯU KHO` (tồn tại HCM không đổi) | **Row 1: 5k, Row 2: 5k, Row 3: 5k, Row 4: 5k** | — | — |

---

### Issue 6: Lỗi Khóa Dòng Trùng Mã Đơn Hàng Trong Modal Tra Cứu (`✓ Đã ở Dòng #1`)
- **Hiện tượng**:
  - Trong ảnh bằng chứng `feedback_04_10/sai_da_o_dong_1_neu_giong_ma_don_hang.png`:
    - Tại modal "Tra Cứu & Chọn Đơn Hàng Từ Kho (Gán vào Dòng #2)", danh sách hiển thị 4 dòng hàng lưu kho tại Andromeda Hub - HCM:
      - Dòng 1: `NTC2610-004` (PLT, 30 kiện) ➔ nút `[Chọn đơn này ->]`
      - Dòng 2: `BAT2609-335TH` (Sữa, 20 kiện, 3 kg, 2 m³) ➔ badge `✓ Đã ở Dòng #1`
      - Dòng 3: `NTC2610-004` (PLT, 1 kiện) ➔ nút `[Chọn đơn này ->]`
      - Dòng 4: `BAT2609-335TH` (Sữa, 1 kiện, 0 kg, 0 m³) ➔ badge `✓ Đã ở Dòng #1`
  - **Nghịch lý vận hành**: Người dùng đã chọn bản ghi Dòng 2 (`BAT2609-335TH` lô 20 kiện) cho Dòng xuất kho #1. Nhưng khi mở modal để gán cho Dòng xuất kho #2, hệ thống **tự động khóa luôn cả Dòng 4** (`BAT2609-335TH` lô 1 kiện) với nhãn `✓ Đã ở Dòng #1`, khiến thủ kho không thể chọn dòng 1 kiện này để xuất kho tiếp!
- **Rà soát mã nguồn & Phân tích nguyên nhân gốc rễ**:
  - Tại `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` dòng 1844:
    ```typescript
    <WarehouseLookupModal
      isOpen={lookupRowIndex !== null}
      onClose={() => setLookupRowIndex(null)}
      onSelectOrder={handleSelectFromLookup}
      selectedOrderCodes={rows.map((r) => r.orderCode).filter(Boolean)}
      targetRowIndex={lookupRowIndex}
    />
    ```
    Bảng lưới chỉ truyền mảng các chuỗi `selectedOrderCodes: string[]`.
  - Tại `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx` dòng 341:
    ```typescript
    const selectedIndex = selectedOrderCodes.indexOf(row.orderCode);
    const isAlreadySelected = selectedIndex !== -1;
    ```
    Modal chỉ so khớp chuỗi `row.orderCode`. Do cả hai bản ghi cơ sở dữ liệu đều có `orderCode === 'BAT2609-335TH'`, hàm `indexOf('BAT2609-335TH')` trả về `0` cho cả hai dòng. Kết quả: cả hai dòng hàng đều bị đánh dấu là `isAlreadySelected = true` và `selectedIndex = 0` (`Đã ở Dòng #1`).
  - **Bản chất nghiệp vụ kho**: Trong mô hình Master Contract hoặc nhập hàng theo nhiều kiện/lô, nhiều bản ghi trong bảng `order` chia sẻ cùng một mã vận đơn cha `orderCode`, nhưng chúng là các **thực thể hàng hóa độc lập** (có `id` khóa chính khác nhau trong DB, số kiện khác nhau, quy cách khác nhau).
- **Giải pháp triệt để**:
  1. Thay thế việc kiểm tra thuần bằng `orderCode` sang **đối soát theo ID bản ghi cơ sở dữ liệu (`row.id`)**.
  2. Bổ sung prop `selectedItemIds?: (number | string)[]` (hoặc `selectedItems: Array<{ id?: number | string; orderCode: string }>`) vào `WarehouseLookupModal`.
  3. Trong `WarehouseLookupModal`: So khớp chính xác theo `row.id` nếu bản ghi có ID. Nếu `row.id` trùng với ID của dòng đã chọn trong lưới thì mới khóa `✓ Đã ở Dòng #X`. Nếu chỉ trùng `orderCode` nhưng khác ID, hiển thị nút `[Chọn đơn này ->]` bình thường kèm một badge nhỏ tinh tế `Cùng đơn BAT2609...` để thủ kho dễ nhận biết.
  4. Trong `warehouse-editable-grid.tsx` dòng 575: Trong hàm tìm kiếm nhanh `performSearch`, chỉ cảnh báo trùng khi trùng chính xác `other.id === foundOrder.id` (chọn cùng 1 dòng vật lý), không cảnh báo sai khi người dùng xuất 2 lô khác nhau của cùng 1 mã đơn hàng.

---

### Issue 7: Modal Phiếu Xuất Kho Gộp Chung 1 Dòng Sau Khi Tạo Thành Công
- **Hiện tượng**:
  - Trong ảnh bằng chứng `feedback_04_10/modal_phieu_xuat_kho_sau_khi_tao_thanh_cong.png`:
    - Sau khi người dùng lập phiếu xuất kho với **2 dòng hàng riêng biệt** (ví dụ: dòng 1 là Sữa 20 kiện, dòng 2 là PLT 30 kiện), hệ thống hiển thị modal xem trước và in ấn: "Phiếu Xuất Kho · Mã BAT2609-335TH".
    - Tuy nhiên, bảng chi tiết hàng hóa xuất kho chỉ có **duy nhất 1 dòng**:
      - STT: `1`
      - Mã Đơn Hàng: `BAT2609-335TH`
      - Tên mặt hàng: **`Sữa, PLT`** (bị gộp chuỗi)
      - Số lượng: **`50`** (bị cộng dồn)
      - Đơn vị: `Kiện`
  - **Phản hồi của người dùng**: *"đây là modal sau khi xuất kho tạo thành công, nó thể hiện sai, sao lại gom lại chung 1 dòng, vì khi tạo là 2 dòng riêng biệt mà"*.
- **Rà soát mã nguồn & Phân tích nguyên nhân gốc rễ**:
  - Tại `frontend/src/app/dashboard/warehouse/outbound/page.tsx` dòng 436-457:
    ```typescript
    // Open Outbound Receipt Modal for printing
    setSelectedReceiptData({
      orderCode: validRows[0]?.orderCode || 'WH-OUT',
      goodsDescription:
        validRows
          .map((r) => r.goodsDescription)
          .filter(Boolean)
          .join(', ') || 'Hàng xuất kho',
      totalQuantity: validRows.reduce((sum, r) => sum + (Number(r.totalQuantity) || 1), 0),
      outboundQuantity: validRows.reduce((sum, r) => sum + (Number(r.totalQuantity) || 1), 0),
      totalWeight: validRows.reduce((sum, r) => sum + (Number(r.totalWeight) || 0), 0),
      totalVolume: validRows.reduce((sum, r) => sum + (Number(r.totalVolume) || 0), 0),
      driverName: outboundDriverName,
      licensePlate: outboundLicensePlate,
      deliveryAddress: customerAddress,
      mode: 'CUSTOMER',
      dispatchDate: dispatchDate,
      notes:
        validRows
          .map((r) => r.notes)
          .filter(Boolean)
          .join('; ') || ''
      // THIẾU HOÀN TOÀN: items: validRows.map(...)
    });
    ```
    Frontend gộp thô bạo toàn bộ `goodsDescription` bằng `.join(', ')` và tổng `totalQuantity` thành 1 biến scalar duy nhất, và **không hề truyền thuộc tính `items`**!
  - Tại `frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx`:
    - Interface `OutboundReceiptData` và template in ấn HTML đã được thiết kế sẵn sàng cho cấu trúc nhiều dòng:
      ```typescript
      export interface OutboundReceiptData {
        ...
        items?: OutboundReceiptItem[];
      }
      ```
    - Dòng 548: Component kiểm tra:
      ```tsx
      {data.items && data.items.length > 0 ? (
        data.items.map((it, idx) => ( ... )) // Render từng dòng STT 1, 2, 3...
      ) : (
        <tr>... gộp thành 1 dòng fallback ...</tr>
      )}
      ```
    - Do `outbound/page.tsx` không truyền `items`, modal bắt buộc phải nhảy vào nhánh fallback 1 dòng duy nhất, dẫn đến việc nuốt chửng cấu trúc nhiều dòng của người dùng.
  - Ngoài ra, mã phiếu xuất đang lấy tạm `validRows[0]?.orderCode` thay vì lấy chính xác mã chứng từ phiếu xuất kho `invoiceCode` (ví dụ `PXK-HCM-2610-001`) trả về từ backend.
- **Giải pháp triệt để**:
  1. Trong `frontend/src/app/dashboard/warehouse/outbound/page.tsx`:
     - Bóc tách kết quả từ API `POST /api/v1/warehouse/outbound`:
       ```typescript
       const resData = await res.json().catch(() => ({}));
       const payload = resData?.data || resData;
       const invoiceCode = payload?.invoiceCode || validRows[0]?.orderCode || 'WH-OUT';
       const tripCode = payload?.tripCode || '';
       ```
     - Truyền đầy đủ mảng `items`:
       ```typescript
       items: validRows.map((r) => ({
         orderCode: r.orderCode,
         goodsDescription: r.goodsDescription || 'Hàng hóa xuất kho',
         quantity: Number(r.totalQuantity) || 1,
         unit: 'Kiện',
         deliveryAddress: customerAddress || r.deliveryAddress || r.destinationHub || '—',
         accompanyingDocs: r.accompanyingDocs || '01 BỘ CT',
         notes: r.notes || '',
       }))
       ```
     - Đặt `orderCode: invoiceCode` và `tripCode: tripCode` để tiêu đề phiếu xuất và mã QR phản ánh chính xác mã số chứng từ xuất kho chính thức.
  2. Kết quả: Màn hình modal sau khi xuất thành công và bản in khổ A4 (ngang/dọc) sẽ hiển thị chuẩn xác từng dòng hàng riêng biệt (STT 1: Sữa 20 kiện, STT 2: PLT 30 kiện, Tổng cộng: 50 kiện).

---

## 3. DỰ TRÙ & PHÂN RÃ CÔNG VIỆC CẦN THỰC HIỆN (ACTION PLAN)

> [!IMPORTANT]
> **Trạng thái triển khai (04/10, nhánh `feature/orders-master-contract`, chưa commit):** code đã sửa + `tsc` sạch; **chưa nghiệm thu runtime/E2E** (TC-01..05 chưa chạy). Các điểm lệch so với spec ban đầu:
> - **Task 4.1 KHÔNG làm**: `order.remainingQuantity` là *tồn toàn mạng lưới* (xuất ở Hub A trừ đi, Hub B nhận thì cộng lại) — không phải đếm đôi. Bỏ phần cộng lại sẽ làm `remainingQuantity` về 0 sai và kích hoạt nhầm `COMPLETED_INBOUND`. Thay vào đó, mọi màn hình theo kho dùng `hubStock` (ledger theo Hub) — xem `frontend/src/features/warehouse/lib/outbound-stock.ts`.
> - **Task 1.1**: endpoint `refresh-metrics` trả số liệu *hợp đồng*, ghi đè vào dòng sẽ biến số lượng xuất thành tổng hợp đồng → đổi sang `GET /warehouse/orders?ids=…` lấy `hubStock`, chỉ cập nhật tồn + kẹp số lượng xuất nếu vượt tồn.
> - **Task 2.1**: không đổi `flow=OUTBOUND` (bảng xuất kho cần thấy cả đơn đã xuất); thêm `flow=OUTBOUND_LOOKUP` riêng cho tra cứu (Lưu kho tại Hub + DRAFT). Dòng hết tồn vẫn hiện nhưng khóa nút chọn ("Hết tồn khả dụng").
> - **Task 4.2 (phần grid)**: `deliveryMode` trên lưới xuất kho là *lựa chọn điều chuyển của thủ kho* — không tự gán từ đơn để tránh dán nhãn sai; chỉ sửa nhãn trong modal chi tiết.
> - **Task 4.3**: `deliveryAddress`/`accompanyingDocs` không dùng giá trị giả (`'—'`, `'01 BỘ CT'`) — để trống nếu không có dữ liệu.

### Phase 1: Sửa Triệt Để Bug Crash & Tối Ưu Menu (Issue 2 & 4)
- [x] **Task 1.1 (Frontend - Outbound Crash)**:
  - Cập nhật hàm `handleRefreshMetrics` trong `frontend/src/app/dashboard/warehouse/outbound/page.tsx`:
    - Unwrap response: `const json = await res.json(); const freshData: any[] = Array.isArray(json) ? json : (json?.data || []);`
    - Cập nhật reactive state cho cả `mode1Rows` (khách lẻ) và `mode2Rows` (luân chuyển).
- [x] **Task 1.2 (Frontend - Sidebar Menu)**:
  - Cập nhật `frontend/src/config/nav-config.ts`:
    - Xóa bỏ nhóm `"Không gian làm việc"` (`/dashboard/kanban`, `/dashboard/chat`, `/dashboard/ai-chat`).
    - Bỏ label thừa `"Overview"`, giữ `Dashboard` làm top-level navigation item gọn gàng.
  - Đồng bộ `frontend/src/hooks/use-nav.ts` và Living Document `.agents/rules/rbac-matrix.md`.

### Phase 2: Chuẩn Hóa Modal Tra Cứu Xuất Kho & Lọc Đúng Kho (Issue 1 & 6)
- [x] **Task 2.1 (Backend - Warehouse Query Scope)**:
  - Cập nhật `backend/src/orders/warehouse.service.ts`:
    - Khi client gửi `flow=OUTBOUND` hoặc `flow=OUTBOUND_LOOKUP`:
      - Chỉ lấy đơn hàng có tồn kho thực tế tại kho hiện tại: `hubStock > 0` (hoặc `status` thuộc `STORED_STATUSES`) HOẶC `status = 'DRAFT'` được tạo tại kho này.
      - Loại bỏ hoàn toàn `PENDING_INBOUND` và `COMPLETED_INBOUND` (hàng đã xuất sạch) khỏi kết quả tìm kiếm tab "Tất cả".
      - Chuẩn hóa lại các con số `allCount`, `storedCount`, `draftCount` khớp 100% với logic lọc trên (đảm bảo Filter & Counter Parity 1:1).
- [x] **Task 2.2 (Frontend - Warehouse Lookup Modal)**:
  - Cập nhật `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`:
    - Truyền `flow=OUTBOUND` vào query params khi `isOutboundMode = true`.
    - Thay thế cột hiển thị "Số kiện" thành **"Tồn khả dụng"** (`row.hubStock ?? row.remainingQuantity`).
    - Disable nút "Chọn đơn này" và cảnh báo nếu `hubStock <= 0`.
    - Bỏ logic coi `PENDING_INBOUND` là draft.
- [x] **Task 2.3 (Frontend - Fix Duplicate OrderCode Row Selection Lock - Issue 6)**:
  - Cập nhật `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`:
    - Đổi kiểm tra `isAlreadySelected` từ `orderCode` sang đối soát theo ID bản ghi `row.id` (thông qua `selectedItemIds?: (number | string)[]` hoặc danh sách `selectedItems: Array<{ id?: number | string; orderCode: string }>`).
    - Cho phép chọn nhiều dòng hàng khác nhau thuộc cùng một mã hợp đồng/đơn hàng `orderCode` vào các dòng khác nhau của phiếu xuất (`Dòng #1`, `Dòng #2`).
  - Cập nhật `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
    - Truyền `selectedItemIds={rows.map(r => r.id).filter(Boolean)}` vào `WarehouseLookupModal`.
    - Trong hàm `performSearch`: Chỉ cảnh báo trùng khi trùng khớp chính xác ID vật lý (`other.id === foundOrder.id`).

### Phase 3: Gom Đơn Theo Mã Đơn Hàng & Bỏ Cột Số Kiện (Issue 3 & Bổ Sung Mục 5)
- [x] **Task 3.1 (Backend - Group By Order Code & Hub Stock Query)**:
  - Nâng cấp `getOrders` trong `backend/src/orders/warehouse.service.ts`:
    - Hỗ trợ cờ `groupBy=orderCode` (hoặc mặc định gom nhóm cho màn hình Tổng Hợp Đơn Hàng Tại Kho):
      - `orderCode`: Mã vận đơn định danh.
      - `goodsDescription`: Gom các mô tả hàng hóa của các dòng (ví dụ: gộp các lô `Lô 3A, Lô 3B...`).
      - `hubStock`: `SUM(hubStock)` tổng tồn khả dụng tại kho của mã đơn.
      - `totalWeight`: `SUM(totalWeight)`.
      - `totalVolume`: `SUM(totalVolume)`.
      - `trips`: Gom danh sách các chuyến xe liên quan (mã chuyến `SD...`, biển số xe).
      - `destinationHub`: Đích đến tổng hợp.
      - `hubStatus`: Trạng thái tổng hợp tại kho.
- [x] **Task 3.2 (Frontend - Warehouse Orders Table Refactor)**:
  - Cập nhật `frontend/src/app/dashboard/warehouse/orders/page.tsx`:
    - **Xóa bỏ cột `SỐ KIỆN`**.
    - Cột `TỒN KHO`: Hiển thị `row.hubStock ?? row.remainingQuantity ?? 0` (đảm bảo tính theo kho của user).
    - Cột `MÃ ĐƠN HÀNG`: Hiển thị mã đơn duy nhất kèm badge số dòng gộp nếu có.

### Phase 4: Xử Lý Logic Luân Chuyển Đa Chặng, Trạm Xe Bo & Phiếu Xuất Kho (Issue 5 & 7)
- [ ] **Task 4.1 (Backend - Selective Inbound & Ledger Stock)** — KHÔNG triển khai (xem ghi chú đầu mục 3):
  - Kiểm tra và chuẩn hóa hàm `confirmInbound` trong `warehouse.service.ts`:
    - Khi nhận hàng từ chuyến xe luân chuyển (Inter-hub Transfer Receiving), chỉ ghi tăng tồn kho của Hub nhận trong bảng `order_inventory_transaction` (`hubId = receivingHubId`, `type = INBOUND`).
    - Không cộng dồn thô bạo vào `order.remainingQuantity` làm sai lệch tồn kho toàn cục.
  - Xử lý trạm Xe Bo (`Hub.level = 2`):
    - Đơn hàng có đích đến là trạm Xe Bo thuộc địa bàn tỉnh của Hub nào (ví dụ: `Xe bo Tuyến Đà Nẵng` thuộc Đà Nẵng) sẽ được Hub đó nhận lưu kho trung gian và hiển thị chuẩn nhãn `'Xe bo'`.
- [x] **Task 4.2 (Frontend - Fix Xe Bo Label in Modal & Grid)**:
  - Sửa `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx`:
    - Sửa điều kiện xác định nhãn giao hàng: Kiểm tra `destinationHubEntity.level === 2 || waybill.deliveryMode === 'XE_BO' || destinationHub.includes('Xe bo')` để render badge `Xe bo` màu tím đặc trưng, không bị ép thành `Hub Cấp 1`.
  - Sửa `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
    - Khi chọn đơn hàng từ modal tra cứu, giữ nguyên `deliveryMode` và `destinationHubId` theo đúng bản ghi được chọn, không reset về `DIRECT_CUSTOMER`.
- [x] **Task 4.3 (Frontend - Preserve Multi-Row Items in Outbound Receipt Modal - Issue 7)**:
  - Cập nhật hàm `handleSubmitOutbound` trong `frontend/src/app/dashboard/warehouse/outbound/page.tsx`:
    - Bóc tách mã chứng từ chính thức `invoiceCode` và mã chuyến `tripCode` từ API response (`resData.data.invoiceCode` hoặc `resData.invoiceCode`).
    - Khi gọi `setSelectedReceiptData`, truyền đầy đủ mảng `items`:
      ```typescript
      items: validRows.map((r) => ({
        orderCode: r.orderCode,
        goodsDescription: r.goodsDescription || 'Hàng hóa xuất kho',
        quantity: Number(r.totalQuantity) || 1,
        unit: 'Kiện',
        deliveryAddress: customerAddress || r.deliveryAddress || r.destinationHub || '—',
        accompanyingDocs: r.accompanyingDocs || '01 BỘ CT',
        notes: r.notes || '',
      }))
      ```
    - Gán `orderCode: invoiceCode` và `tripCode: tripCode` để tiêu đề modal và mã QR phản ánh chính xác mã số chứng từ xuất kho.
    - Đảm bảo giao diện modal và mẫu in A4 (ngang/dọc) hiển thị chuẩn xác từng dòng hàng riêng lẻ, không bị gộp chung thành một dòng văn bản.

---

## 4. CÁC EDGE CASES CẦN LƯU Ý ĐẶC BIỆT

| STT | Tên Edge Case | Kịch Bản Nghiệp Vụ Thực Tế | Rủi Ro Kỹ Thuật & Cách Khắc Phục Chuẩn Chỉ |
|:---:|---|---|---|
| **E1** | **Dỡ hàng nhầm tại Hub trung chuyển (Misrouted / Excess Inbound)** | Xe HCM đi Hưng Yên dừng tại Đà Nẵng. Thủ kho Đà Nẵng dỡ 10 kiện của mình + dỡ nhầm 2 kiện gửi cho Hưng Yên. | Ghi phiếu nhập kho PNK tại Đà Nẵng ghi nhận thực nhận 2 kiện (Discrepancy +2, reason: "Dỡ nhầm hàng Hưng Yên"). Tồn kho Đà Nẵng tăng +2. Số lượng In-transit còn lại trên xe đi Hưng Yên tự động giảm từ 7 xuống còn 5. Khi đến Hưng Yên, bảng kê chuyến hiển thị còn 5 kiện, ghi nhận thiếu 2 kiện (Discrepancy -2). Không bị âm kho hay treo trạng thái. |
| **E2** | **Xuất kho từng phần qua nhiều đợt (Partial Outbound Spanning Multi-Batches)** | Đơn hàng 20 kiện. Đợt 1 xuất 10 kiện đi Đà Nẵng. Đợt 2 xuất 5 kiện giao khách lẻ. Đợt 3 xuất 5 kiện đi Hưng Yên. | Sau đợt 1: Trạng thái tại HCM là `INBOUND` (Lưu kho - Đang xuất từng phần), tồn kho khả dụng = 10 kiện. Đơn hàng vẫn xuất hiện trong modal tra cứu xuất kho với tồn 10 kiện. Sau đợt 3: Tồn khả dụng = 0, trạng thái chuyển thành `COMPLETED_INBOUND` (Đã xuất kho toàn bộ) và lập tức biến mất khỏi modal tra cứu xuất kho. |
| **E3** | **Đơn hàng có điểm đến là Trạm Xe Bo cùng tỉnh với Hub trung chuyển** | Xe chở hàng từ HCM ra miền Trung, trong đó có 3 kiện giao qua `Xe bo Tuyến Đà Nẵng` (Hub level 2). | Xe bo không phải là kho đường trục độc lập để xe tải lớn vào bốc dỡ trực tiếp. Chuyến xe đường trục dừng tại `Magellan Hub - Đà Nẵng` (Hub level 1). Tại đây, thủ kho Đà Nẵng tiếp nhận 3 kiện này vào khu vực trung chuyển xe bo. DB ghi nhận `destinationHubId = 6`, `trip_stop` của Đà Nẵng xác nhận xử lý, và modal chi tiết vận đơn hiển thị rõ nhãn `Xe bo`. |
| **E4** | **Trùng mã đơn hàng nhưng khác lô hàng (Consignment Multi-Line Grouping)** | Khách hàng gửi 1 lô hàng gồm 3 mặt hàng khác nhau dưới cùng mã hợp đồng `HCM-5670-T3`. | Khi hiển thị tại `/dashboard/warehouse/orders`, hệ thống gom nhóm theo `orderCode`, tính tổng `hubStock = 3 + 5 + 7 = 15 kiện`, tổng trọng lượng = 75 kg. Khi bấm mở modal chi tiết, hiển thị đầy đủ bảng kê 3 dòng hàng chi tiết bên trong. |
| **E5** | **Race Condition khi 2 thủ kho cùng xuất 1 đơn hàng lưu kho** | Tồn khả dụng còn 5 kiện. Thủ kho A lập lệnh xuất 5 kiện, thủ kho B cũng đồng thời bấm xác nhận xuất 5 kiện. | Giao dịch `dataSource.transaction` sử dụng kiểm tra tồn kho nghiêm ngặt: `qtyToExport > availableQty` ném ra lỗi `UnprocessableEntityException` kèm thông báo tiếng Việt thân thiện, ngăn chặn xuất âm kho tuyệt đối. |
| **E6** | **Nhiều dòng hàng trong kho có cùng mã vận đơn (`orderCode`) xuất cùng lúc** | Một lô hàng nhập gồm 2 mặt hàng (Sữa 20 kiện, PLT 30 kiện) cùng mã `BAT2609-335TH`. Thủ kho muốn xuất cả 2 dòng trên cùng 1 chuyến. | Dòng xuất kho #1 gán mặt hàng Sữa (id 11), Dòng xuất kho #2 gán mặt hàng PLT (id 13). Modal tra cứu phân biệt theo `row.id`, không bị khóa chùm `✓ Đã ở Dòng #1`. Sau khi xác nhận xuất, modal phiếu xuất kho hiển thị chuẩn xác 2 dòng riêng biệt: STT 1 (Sữa, 20 kiện), STT 2 (PLT, 30 kiện), tổng cộng 50 kiện. |

---

## 5. QUY TRÌNH RESET DATABASE & KỊCH BẢN NGHIỆM THU ĐƠN HÀNG KHO (DoD)

### 5.1. Quy Trình Reset Dữ Liệu An Toàn (Database Isolation)
Theo quy tắc an toàn trong `AGENTS.md` (Tuyệt đối không chạy `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` thô bạo):
- **Phạm vi reset**: Chỉ xóa các bản ghi thử nghiệm có prefix định danh (ví dụ `orderCode LIKE 'TEST-%'`) hoặc các chuyến xe sinh ra trong test session:
  ```sql
  DELETE FROM order_inventory_transaction WHERE "orderId" IN (SELECT id FROM "order" WHERE "orderCode" LIKE 'TEST-%');
  DELETE FROM trip_stop WHERE "tripCode" IN (SELECT "tripCode" FROM trip WHERE "notes" ILIKE '%TEST%');
  DELETE FROM trip WHERE "notes" ILIKE '%TEST%' OR "orderId" IN (SELECT id FROM "order" WHERE "orderCode" LIKE 'TEST-%');
  DELETE FROM "order" WHERE "orderCode" LIKE 'TEST-%';
  ```
- File mock data đã được tạo sẵn tại: [`feedback_04_10/mock_data_test_cases.json`](file:///d:/Projects/logistics-website/feedback_04_10/mock_data_test_cases.json) chứa đầy đủ 5 test case:
  1. `TC-01-STANDARD-SCENARIO`: Kịch bản chuẩn 4 dòng hàng HCM ➔ Đà Nẵng (10k) + Hưng Yên (7k) + Xe Bo Đà Nẵng (3k).
  2. `TC-02-RANDOMIZED-A`: Kịch bản mở rộng A (24, 18, 14, 9 kiện).
  3. `TC-03-RANDOMIZED-B`: Kịch bản mở rộng B (30, 25, 20 kiện).
  4. `TC-04-EDGE-CASE-MISROUTED-RECEIVING`: Edge case dỡ nhầm 2 kiện của Hưng Yên tại Đà Nẵng.
  5. `TC-05-MULTI-LINE-CONSIGNMENT-OUTBOUND`: Đơn hàng đa mặt hàng chung `orderCode`, kiểm tra chọn không khóa chùm (Issue 6) và in Phiếu Xuất Kho tách dòng chi tiết (Issue 7).

### 5.2. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)
> Code cho DoD 1–4, 6, 7 đã xong; tick khi nghiệm thu runtime trên dữ liệu thật (DoD 5 cần chạy TC-01..05).
- [ ] **DoD 1**: Khi tạo xuất kho, modal "Tra Cứu & Chọn Đơn Hàng Từ Kho" chỉ hiển thị đơn hàng thuộc kho hiện tại có tồn kho khả dụng (`hubStock > 0` hoặc `DRAFT`). Không còn bóng dáng đơn hàng `Chờ nhập kho` (`PENDING_INBOUND`).
- [ ] **DoD 2**: Menu Sidebar của `SUPER_ADMIN` sạch sẽ, triệt tiêu hoàn toàn mục "Không gian làm việc" (Kanban, Chat, AI Chat) và nhãn "Overview" thừa.
- [ ] **DoD 3**: Trang `/dashboard/warehouse/orders` đã loại bỏ cột `SỐ KIỆN`, gom nhóm các bản ghi theo `orderCode` chuẩn xác và hiển thị tổng tồn kho khả dụng theo từng kho.
- [ ] **DoD 4**: Nút "Cập nhật lại thông số" trong trang Tạo xuất kho hoạt động trơn tru 100%, không còn lỗi `freshData.find is not a function`.
- [ ] **DoD 5 (Kiểm tra chéo Đơn hàng kho & DB)**: Chạy thành công toàn bộ kịch bản test case trong `mock_data_test_cases.json`:
  - Tại HCM: Màn hình Đơn hàng kho hiển thị đúng số kiện giảm trừ sau khi xuất.
  - Tại Đà Nẵng: Màn hình Đơn hàng kho hiển thị chính xác số kiện tiếp nhận sau khi nhập kho, thông tin chuyến xe và hiển thị chuẩn nhãn `Xe bo`.
  - Tại Hưng Yên: Màn hình Đơn hàng kho hiển thị chính xác số kiện chuyến xe giao tới.
  - DB `order_inventory_transaction`, `trip`, `trip_stop` phản ánh chuẩn xác 100% số liệu.
- [ ] **DoD 6 (Khóa chọn theo ID - Issue 6)**: Trong modal "Tra Cứu & Chọn Đơn Hàng Từ Kho", việc chọn một dòng hàng có mã đơn `BAT2609-335TH` vào Dòng #1 không làm vô hiệu hóa các dòng hàng khác có cùng mã đơn. Thủ kho chọn được dòng thứ 2 vào Dòng #2 bình thường.
- [ ] **DoD 7 (Bảo toàn chi tiết nhiều dòng trên Phiếu Xuất Kho - Issue 7)**: Khi xuất kho một phiếu gồm nhiều dòng hàng, modal Phiếu Xuất Kho và bản in A4 hiển thị đúng danh sách từng dòng hàng (STT 1, STT 2...), tên mặt hàng riêng biệt, số lượng từng dòng và tổng cộng; không bị gộp chung thành một dòng text "Sữa, PLT" 50 kiện.
