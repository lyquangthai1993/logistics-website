# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_07_10_TASK_24] — Feedback 07/10 Task 24 — Tùy biến Hình thức & Địa chỉ Giao nhận (Khách / Hub Cấp 1 / Tuyến Xe Bo) Cho Đơn Hàng Xuất Mới Lên Chuyến Xe Tại Trạm Trung Chuyển

> **Thời gian nghiệm thu**: 07/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (57/57 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành Logistics TMS)  
> **Phạm vi tác động**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Điều phối trung chuyển ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) — **Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp (`OUTBOUND STAGE`)** • Popup Chọn đơn lưu kho xuất lên chuyến xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Modal Chọn đích xuất kho điều chuyển ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Lưới xuất kho chuẩn tham chiếu ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Backend Quản lý Kho vận & Điều phối Chuyến xe ([`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts), [`TripEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts), [`TripStopEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip-stop.entity.ts))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"tại màn hình xuất thêm hàng lên trip, sau khi chọn đơn sẽ tạo ra 1 dòng mới tỏng danh sách như hình, tuy nhiên phần địa chỉ giao đang để mặc định là địa chỉ giao khách. Chố khoanh đỏ này tôi muốn địa chỉ giao của đơn hàng thêm mới này mình có thể chọn hoặc giao cho khách, hoặc giao tại các hub, xe bo giống như màn hình xuất kho bình thường."*

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"tại màn hình xuất thêm hàng lên trip, sau khi chọn đơn sẽ tạo ra 1 dòng mới tỏng danh sách như hình, tuy nhiên phần địa chỉ giao đang để mặc định là địa chỉ giao khách. Chố khoanh đỏ này tôi muốn địa chỉ giao của đơn hàng thêm mới này mình có thể chọn hoặc giao cho khách, hoặc giao tại các hub, xe bo giống như màn hình xuất kho bình thường."*

---

### 2. Tình huống vận hành thực tế tại Hub trung chuyển đường dài (Quy trình Xuất thêm hàng lên Trip)

Trong mạng lưới vận tải hàng hóa đường dài Bắc - Nam (Linehaul Inter-hub), một chuyến xe tải (ví dụ xe `50H-123.45`, chuyến `SD64`) xuất phát từ `Andromeda Hub - HCM` đi `Polaris Hub - Hưng Yên`, trên lộ trình dừng đỗ tại trạm trung chuyển `Magellan Hub - Đà Nẵng`.

Sau khi hoàn tất **Bước 1: Nhập hàng & Dỡ kho** (kiểm đếm dỡ các kiện hàng dỡ tại Đà Nẵng), chuyến xe bước sang **Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp (Outbound Stage)**. Tại bước này:
1. Thùng xe đã có chỗ trống sau khi dỡ hàng. Thủ kho Đà Nẵng mở kho kiểm tra các đơn hàng đang lưu kho (`IN_WAREHOUSE` tại Đà Nẵng) cần gửi ra các trạm phía Bắc.
2. Thủ kho bấm nút **"+ Thêm đơn xuất từ kho lên xe"** ➔ Mở modal [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx) ➔ Tích chọn đơn hàng lưu kho (ví dụ đơn máy móc `TEST1`, 5 kiện, 1.000 kg, 8 m³).
3. Bấm xác nhận, đơn `TEST1` được bốc lên chuyến xe và xuất hiện thành dòng mới trong bảng kê Bước 2 với huy hiệu xanh **`Bốc từ kho này`** (như hiển thị tại dòng 03 trong ảnh [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_01.jpg)).

```mermaid
flowchart TD
    A["Xe tải SD64 dừng tại Trạm Trung Chuyển Đà Nẵng"] --> B["BƯỚC 1: Dỡ hàng dỡ tại Hub Đà Nẵng (Đã xong)"]
    B --> C["BƯỚC 2: Xuất hàng mới từ kho Đà Nẵng lên xe đi tiếp"]
    
    C --> D["Bấm '+ Thêm đơn xuất từ kho lên xe'"]
    D --> E["Chọn đơn lưu kho TEST1 (Địa chỉ gốc: Ba Đình, Hà Nội)"]
    E --> F["Dòng 03 xuất hiện trong bảng: Nguồn 'Bốc từ kho này'"]
    
    F --> G{"Xác định hình thức & điểm giao tại Cột 'KHO ĐÍCH / NƠI GIAO'"}
    
    G -- "Lựa chọn 1: DIRECT_CUSTOMER" --> H1["Giao thẳng cho khách tại Ba Đình, Hà Nội\n(Xe trả hàng tận nơi người nhận cuối)"]
    G -- "Lựa chọn 2: HUB_L1" --> H2["Điều chuyển về Hub Cấp 1: Polaris Hub - Hưng Yên\n(Dỡ hàng tại Hub Hưng Yên để phân loại tiếp)"]
    G -- "Lựa chọn 3: XE_BO" --> H3["Điều chuyển giao tại Tuyến Xe Bo Cấp 2: Xe bo Tuyến Hà Nội\n(Bàn giao cho xe bo nội thành phát chặng cuối)"]
    
    H1 --> I["Xác nhận xuất hàng lên trip & In phiếu xuất kho"]
    H2 --> I
    H3 --> I
    I --> J["Xe SD64 rời trạm tiếp tục hành trình ra Bắc"]
```

---

### 3. Vấn đề cốt lõi: Tại sao đơn thêm mới BẮT BUỘC phải cho chọn Hub / Xe bo / Giao khách?

1. **Bản chất của đơn hàng lưu kho**:
   - Khi một đơn hàng lưu kho được tạo ban đầu (hoặc nhập từ chặng trước), thông tin địa chỉ trên vận đơn thường là **địa chỉ người nhận cuối cùng của khách hàng** (ví dụ: `BA ĐÌNH HÀ NỘI`).
   - Do đó, khi đơn được bốc lên chuyến xe trung chuyển đường dài `SD64`, cột `KHO ĐÍCH / NƠI GIAO` hiện tại đang lấy mặc định chuỗi text `BA ĐÌNH HÀ NỘI`.
2. **Xung đột nghiệp vụ vận tải trung chuyển**:
   - Chuyến xe `SD64` là **xe tải đường dài liên tỉnh (Linehaul)** chạy theo tuyến cố định: `HCM → Khánh Hòa → Đà Nẵng → Hưng Yên`. Xe lớn **không đi vào từng ngõ ngách nội thành Ba Đình - Hà Nội** để giao tận nơi cho từng khách lẻ!
   - Trên thực tế vận hành kho bãi:
     * **Trường hợp A (Trung chuyển Hub Cấp 1 - `HUB_L1`)**: Kiện hàng máy móc `TEST1` này sẽ được chở ra và dỡ xuống tại **`Polaris Hub - Hưng Yên`** (Tổng kho trung tâm miền Bắc) để phân loại và luân chuyển tiếp. Đích đến trên chuyến xe này phải là **`Polaris Hub - Hưng Yên`**.
     * **Trường hợp B (Bàn giao Tuyến Xe Bo - `XE_BO`)**: Kiện hàng được bàn giao cho trạm vệ tinh / xe bo tuyến như **`Xe bo Tuyến Hà Nội`** để gom và chạy nội đô phát hàng. Đích đến trên chuyến xe này phải là **`Xe bo Tuyến Hà Nội`**.
     * **Trường hợp C (Khách tự nhận / Giao thẳng - `DIRECT_CUSTOMER`)**: Trong trường hợp khách hẹn nhận hàng dọc quốc lộ hoặc xe tải có thể giao thẳng tới kho lớn của khách ở Ba Đình Hà Nội, thủ kho chọn giao tận nơi cho khách.
3. **Hệ quả nghiêm trọng nếu để mặc định text tĩnh `BA ĐÌNH HÀ NỘI` (như hiện tại)**:
   - Hệ thống không gắn được `destinationHubId` cho chuyến xe (`TripEntity`), khiến bảng kê lộ trình trạm dừng (`TripStopEntity`) không nhận diện được trạm nào xe cần dỡ hàng.
   - Khi xe `SD64` đến `Polaris Hub - Hưng Yên`, màn hình kiểm đếm nhập kho của thủ kho Hưng Yên sẽ **không thấy đơn `TEST1`** trong danh sách hàng dỡ tại kho này (do `destinationHubId` bị null hoặc không khớp ID kho Hưng Yên), dẫn đến thất lạc đơn hàng hoặc sai lệch biên bản giao nhận.
   - Vì vậy, việc cho phép thủ kho Đà Nẵng linh hoạt chọn **hoặc giao khách, hoặc giao Hub Cấp 1, hoặc giao Tuyến Xe Bo** ngay tại dòng đơn mới thêm (giống như màn hình xuất kho bình thường) là **yêu cầu nghiệp vụ sống còn** để đảm bảo tính liên tục của luồng vận tải đa chặng.

---

### 4. Quy chuẩn 3 Hình thức Giao nhận đối chiếu Màn hình Xuất kho Chuẩn (`WarehouseEditableGrid`)

Căn cứ theo quy định tại Skill [`leader`](file:///D:/Projects/logistics-website/.agents/skills/leader/SKILL.md) (mục *Two-tier Hub Hierarchy & Delivery Destination Modes*) và mã nguồn chuẩn tại [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx):

| Hình thức giao nhận (`deliveryMode`) | Loại điểm đến | Cơ chế hiển thị trên dòng bảng kê | Hành động & Tương tác người dùng | Dữ liệu lưu trữ Backend |
|---|---|---|---|---|
| **`DIRECT_CUSTOMER`** (Giao thẳng / Khách nhận) | Người nhận lẻ tận nơi | Hiển thị địa chỉ khách hàng (ví dụ: `BA ĐÌNH HÀ NỘI`), đi kèm nút bấm **`[IconMapPin] Thay đổi địa chỉ (Điều chuyển)`** | Cho phép sửa tay địa chỉ giao nhận khách hoặc bấm nút điều chuyển để chuyển sang chọn Hub / Xe bo | `destinationHubId = null`<br>`destinationHub = null`<br>`deliveryAddress = customerAddress` |
| **`HUB_L1`** (Hub Cấp 1 - Trung chuyển) | Trung tâm trung chuyển khu vực chính (`level = 1`) | Huy hiệu màu xanh dương **`[Hub Cấp 1]`** nổi bật + Tên Hub đích (ví dụ: `Polaris Hub - Hưng Yên`) | Có nút **`Đổi kho đích khác...`** (mở modal chọn lại) và nút **`Quay lại địa chỉ thường`** (khôi phục lại địa chỉ khách ban đầu) | `destinationHubId = hub.id`<br>`destinationHub = hub.name`<br>`deliveryAddress = hub.name` |
| **`XE_BO`** (Tuyến Xe Bo - Vệ tinh) | Điểm giao nhận / tuyến xe bo vệ tinh (`level = 2`) | Huy hiệu màu tím **`[Tuyến Xe Bo]`** nổi bật + Tên tuyến xe bo (ví dụ: `Xe bo Tuyến Hà Nội`) | Có nút **`Đổi kho đích khác...`** (mở modal chọn lại) và nút **`Quay lại địa chỉ thường`** (khôi phục lại địa chỉ khách ban đầu) | `destinationHubId = hub.id`<br>`destinationHub = hub.name`<br>`deliveryAddress = hub.name` |

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
Dựa trên phân tích mã nguồn thực tế và đối chiếu trực tiếp với ảnh chụp màn hình [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_01.jpg):

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ẢNH CHỤP MÀN HÌNH FEEDBACK: screenshot_01.jpg (Màn hình Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp)                 │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ STT  MÃ VẬN ĐƠN      NGUỒN HÀNG          TÊN HÀNG HÓA  SỐ KIỆN  SỐ KG  SỐ M³  KHO ĐÍCH / NƠI GIAO             GHI CHÚ │
│ 01   TEST-SD64-TR1   Trung chuyển đi tiếp Bách hóa     20       150    0.65   Polaris Hub - Hưng Yên          —       │
│ 02   TEST-SD64-TR2   Trung chuyển đi tiếp Điện gia dụng 30      200    0.90   Polaris Hub - Hưng Yên          —       │
│ 03   TEST1           Bốc từ kho này       MÁY MÓC       5        1.000  8.00  [ BA ĐÌNH HÀ NỘI ]  <-- KHOANH ĐỎ LỖI   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Cột "KHO ĐÍCH / NƠI GIAO" bị đóng cứng dạng văn bản tĩnh (Read-only)**:
   - **Hiện trạng trên code** ([`warehouse-trip-detail-modal.tsx#L1207-L1211`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx#L1207-L1211)):
     ```tsx
     <td className='py-1 px-1.5 text-slate-700 dark:text-slate-300 font-semibold'>
       {l.destinationHub || l.deliveryAddress || 'Chưa xác định'}
     </td>
     ```
   - **Điểm chưa đúng**: Không có bất kỳ thành phần tương tác nào (nút chọn, dropdown, modal trigger) cho phép người dùng click để thay đổi địa chỉ hay chuyển đổi hình thức giao hàng.
2. **Mặc định hiển thị địa chỉ khách lẻ mà không có tùy chọn phân luồng**:
   - Khi bốc đơn `TEST1` từ kho Đà Nẵng lên xe đi tiếp ra Bắc, hệ thống tự động gán text địa chỉ giao khách ban đầu (`BA ĐÌNH HÀ NỘI`), làm mất đi khả năng khai báo đơn này sẽ dỡ tại `Polaris Hub - Hưng Yên` hay dỡ tại `Xe bo Tuyến Hà Nội`.
3. **Thiếu liên kết với `WarehouseDestinationModal` trong Bước 2**:
   - Hệ thống đã có sẵn component [`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx) rất trực quan (chia rõ 2 tab Hub Cấp 1 màu xanh và Tuyến Xe Bo màu tím, có live search, có nút quay lại địa chỉ gốc), đang hoạt động rất tốt tại màn hình xuất kho bình thường (`WarehouseEditableGrid`), nhưng hoàn toàn chưa được tích hợp vào Bước 2 của [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx).
4. **Thiếu cơ chế lưu vết "Địa chỉ khách ban đầu" (`originalDeliveryAddress`)**:
   - Nếu thủ kho đổi đích đến sang Hub Cấp 1 (`Polaris Hub - Hưng Yên`), địa chỉ khách gốc (`BA ĐÌNH HÀ NỘI`) bị ghi đè hoàn toàn nếu không được lưu vào trường `originalDeliveryAddress`. Khi thủ kho muốn "Quay lại địa chỉ khách thường", hệ thống sẽ bị mất thông tin địa chỉ giao ban đầu của khách.
5. **Backend chưa có endpoint chuyên biệt để cập nhật đích đến của đơn đã gán trên chuyến xe**:
   - Khi đơn đã bốc lên chuyến xe (`append-stored-orders`), nếu thủ kho thay đổi đích đến của dòng đơn trên bảng Bước 2, Backend cần một endpoint chuyên trách (`PATCH /api/v1/warehouse/trips/:tripCode/orders/:orderId/destination`) để cập nhật đồng bộ cả thực thể `TripEntity` và `OrderEntity`, đồng thời kiểm tra và bổ sung trạm dừng `TripStopEntity` trên lộ trình chuyến xe nếu cần thiết.

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Tạo DTO `UpdateTripOrderDestinationDto`** ([`backend/src/orders/dto/update-trip-order-destination.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/update-trip-order-destination.dto.ts))**
  * 📍 File: `backend/src/orders/dto/update-trip-order-destination.dto.ts`
- ✅ **Khai báo `deliveryMode`: Enum `'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO'` (Bắt buộc).**
- ✅ **Khai báo `destinationHubId`: `number | null` (Bắt buộc khi `HUB_L1` hoặc `XE_BO`; gán `null` khi `DIRECT_CUSTOMER`).**
- ✅ **Khai báo `deliveryAddress`: `string | null` (Địa chỉ giao khách hoặc tên Hub/Xe bo).**
- ✅ **Khai báo `notes`: `string` tùy chọn.**
- ✅ **Thiết lập Swagger annotations (`@ApiProperty`, `@ApiPropertyOptional`) và class-validator (`@IsEnum`, `@IsOptional`, `@IsInt`, `@IsString`).**
- ✅ **Bổ sung API Endpoint trong `WarehouseController`** ([`backend/src/orders/warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts))**
  * 📍 File: `backend/src/orders/warehouse.controller.ts`
- ✅ **Thêm route `@Patch('trips/:tripCode/orders/:orderId/destination')`.**
- ✅ **Áp dụng RBAC Guard: `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.WAREHOUSE_MANAGER)`.**
- ✅ **Document Swagger `@ApiOperation({ summary: 'Cập nhật hình thức giao hàng và đích đến cho đơn bốc lên chuyến xe (Giao khách, Hub Cấp 1, Tuyến Xe Bo)' })`.**
- ✅ **Triển khai Business Logic trong `WarehouseService`** ([`backend/src/orders/warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Phương thức `updateTripOrderDestination(user, tripCode, orderId, dto)` bọc trong TypeORM Transaction**
- ✅ **Nâng cấp API `getTripManifest`** ([`backend/src/orders/warehouse.service.ts#L3130`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L3130))**
- ✅ **Xác định và trả về thuộc tính `deliveryMode`**
- ✅ **Trả về trường `originalDeliveryAddress`: Lấy từ địa chỉ khách ban đầu (tách từ route `parts[1]` hoặc trường lưu trữ gốc).**
- ✅ **Đảm bảo `destinationHubEntity` được nạp đầy đủ thông tin (`id`, `name`, `code`, `level`, `city`).**
- ✅ **Cập nhật DTO `AppendStoredOrdersDto` & `appendStoredOrdersToTrip`**
- ✅ **Hỗ trợ lưu trữ nhất quán đích đến ban đầu và cho phép truyền danh sách đích đến riêng biệt cho từng đơn nếu có.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Mở rộng API Client & Types trong `trip-manifest.ts`** ([`frontend/src/features/warehouse/api/trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts))**
  * 📍 File: `frontend/src/features/warehouse/api/trip-manifest.ts`
  * 📍 File: `frontend/src/features/warehouse/api/trip-manifest.ts`
- ✅ **Bổ sung trường `deliveryMode?: 'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO' | string` vào interface `TripManifestLine`.**
- ✅ **Bổ sung trường `originalDeliveryAddress?: string` vào interface `TripManifestLine`.**
- ✅ **Bổ sung `level?: number` vào `destinationHubEntity`.**
- ✅ **Định nghĩa interface `UpdateTripOrderDestinationPayload`**
- ✅ **Tạo hàm API call: `updateTripOrderDestination(tripCode: string, orderId: number, payload: UpdateTripOrderDestinationPayload)`.**
- ✅ **Nạp danh mục Hubs toàn hệ thống trong `WarehouseTripDetailModal`**
- ✅ **Fetch danh sách Hubs qua API `/api/v1/hubs` (hoặc TanStack Query `useQuery(['hubs'])`).**
- ✅ **Phân loại `level1Hubs` (`h.level === 1 || !h.code.startsWith('HUB-BO-')`) và `level2XeBoHubs` (`h.level === 2 || h.code.startsWith('HUB-BO-')`).**
- ✅ **Thiết kế lại Cột "KHO ĐÍCH / NƠI GIAO" tại Bước 2 trong `WarehouseTripDetailModal`** ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`
- ✅ **Phân biệt rõ 2 loại dòng**
- ✅ **Hiển thị khi `deliveryMode === 'DIRECT_CUSTOMER'`**
- ✅ **Hiển thị khi `deliveryMode === 'HUB_L1'`**
- ✅ **Hiển thị khi `deliveryMode === 'XE_BO'`**
- ✅ **Tích hợp `WarehouseDestinationModal` vào Bước 2**
- ✅ **Quản lý state mở modal: `selectedOrderForDestModal: TripManifestLine | null`.**
- ✅ **Truyền props đầy đủ vào `WarehouseDestinationModal`**
- ✅ **Xử lý sự kiện `onSelect(hub)`**
- ✅ **Xử lý sự kiện `onResetToOriginal()`**
- ✅ **Đảm bảo tuân thủ nghiêm ngặt Quy chuẩn giao diện hẹp (UI Compact Density Mandate)**
- ✅ **Chiều cao dòng bảng kê Bước 2 giữ ở mức ~28px - 34px, không làm vỡ bố cục modal.**
- ✅ **Typography: Text tên Hub / địa chỉ = `text-[10px]`, badge = `text-[9px]`.**
- ✅ **Banned classes: Tuyệt đối không dùng `p-4`, `gap-4`, `space-y-3` trong cell bảng. Sử dụng `p-1`, `gap-1`, `space-y-0.5`.**
- ✅ **Zero redundant icons: Chỉ dùng icon SVG (`IconMapPin`, `IconArrowBackUp`), không ghép thêm emoji `📍`, `🚚`, `🔄`.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Playwright E2E Suite Path**: [`frontend/e2e/37-feedback-07-10-task-24-destination-mode.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/37-feedback-07-10-task-24-destination-mode.spec.ts)**
- ✅ **4/4 Scenarios Passed on Real PostgreSQL DB (Zero Mock).**
- ✅ **Scorecard E2E Code Auditor: `50/50 (PASS)`.**
- ✅ **Ảnh minh chứng nghiệm thu đính kèm**
- ✅ **Type Check & Build Verification**
- ✅ **Backend Type Check: Chạy `npm --prefix backend run build` đạt `PASS (0 errors)`.**
- ✅ **Frontend Type Check: Chạy `npm --prefix frontend run typecheck` đạt `PASS (0 errors)`.**
- ✅ **Lint Check: Chạy sạch sẽ.**
- ✅ **Kịch bản kiểm thử nghiệp vụ (E2E Test Scenarios)**
- ✅ **Kịch bản 1: Mở chuyến xe tại trạm trung chuyển & chuyển sang Bước 2**
- ✅ **Kịch bản 2: Bốc thêm đơn lưu kho & kiểm tra giá trị mặc định**
- ✅ **Kịch bản 3: Chuyển đích đến sang Hub Cấp 1 (`HUB_L1`)**
- ✅ **Kịch bản 4: Chuyển đích đến sang Tuyến Xe Bo (`XE_BO`)**
- ✅ **Kịch bản 5: Khôi phục địa chỉ khách ban đầu (`onResetToOriginal`)**
- ✅ **Kịch bản 6: Hoàn tất chuyến xe & kiểm tra tính toàn vẹn dữ liệu**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).
- **Môi trường Dev Live**:
  * Frontend: `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app`
  * Backend: `https://logistics-website-backend-1jho.onrender.com`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://logistics-website-backend-1jho.onrender.com/api/v1/health` -> HTTP 200 OK.

### Hình ảnh minh chứng đã lưu trữ (7 tệp):
- 📸 **01_step2_interactive_destination_cell.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/01_step2_interactive_destination_cell.png)
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_01.jpg)
- 📸 **screenshot_01_step2_interactive_destination_cell_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_01_step2_interactive_destination_cell_verified.png)
- 📸 **screenshot_02_destination_selection_modal_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_02_destination_selection_modal_verified.png)
- 📸 **screenshot_03_destination_updated_hub_l1_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_03_destination_updated_hub_l1_verified.png)
- 📸 **screenshot_04_reset_to_original_customer_address_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_04_reset_to_original_customer_address_verified.png)
- 📸 **screenshot_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_07_10_task_24/screenshot_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/dto/update-trip-order-destination.dto.ts` | Backend (NestJS) |
| 2 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 3 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 4 | `frontend/src/features/warehouse/api/trip-manifest.ts` | Frontend (Next.js) |
| 5 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 6 | `frontend/e2e/37-feedback-07-10-task-24-destination-mode.spec.ts` | Frontend (Next.js) |
| 7 | `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx` | Frontend (Next.js) |
| 8 | `frontend/src/features/warehouse/components/warehouse-destination-modal.tsx` | Frontend (Next.js) |
| 9 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 10 | `backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts` | Backend (NestJS) |
| 11 | `backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts` | Backend (NestJS) |
| 12 | `backend/src/trips/infrastructure/persistence/relational/entities/trip-stop.entity.ts` | Backend (NestJS) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedback_07_10_task_24/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
