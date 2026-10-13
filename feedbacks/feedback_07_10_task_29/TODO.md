# Feedback 07/10 Task 29 — Chuẩn Hóa Logic Mặc Định Nhập Kho Hub Cấp 1 & Bảo Toàn Thông Tin Đơn Hàng Giữ Nguyên Địa Chỉ Giao Ban Đầu

> **Thời gian ghi nhận**: 07/10/2026  
> **Người báo cáo**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành TMS — Spider Express)  
> **Phạm vi tác động**:  
> - Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho & Bảng kê xuất hàng ([`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) & [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx))  
> - Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) & [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx))  
> - Backend Service & Controller: Điều phối Chuyến xe, Xuất kho, Bảng kê lộ trình Manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts))  
> - Khế ước dữ liệu & Luồng chuyển tiếp trạng thái vòng đời chuyến xe đa chặng (Multi-Stop Inter-Hub Linehaul Journey)  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///D:/Projects/logistics-website/.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///D:/Projects/logistics-website/AGENTS.md)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md)  
> - Quy chuẩn mạng lưới Hub phân tầng (Two-Tier Hub Hierarchy) & Khế ước kiện vận tải (No-SKU, Consignment Level)  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"logic đúng: tại màn hình xuất kho của hub bắt đầu của trip, đơn hàng nào ở địa chỉ giao có chọn hub cấp 1 nào, thì ở màn hình nhập của các hub cấp 1 đó mới để mặc đinh nhập đơn hàng đó vào hub cấp 1 đó. các đơn hàng để nguyên địa chỉ giao của đơn hàng như ban đầu thì trong màn hình của các hub khi mở trip ra nhập hàng các thông tin sẽ không thay đổi so với thông tin từ lúc bắt đầu tạo trip"*

---

### 2. Tình huống vận hành thực tế đối với Chuyến xe Xuất phát từ Hub Ban đầu (Origin Hub Dispatch)

Trong mạng lưới vận tải hàng hóa đường trục Bắc - Nam (Linehaul Inter-hub Network) của Spider Express:
- Mỗi chuyến xe vận chuyển liên tỉnh (ví dụ: xe tải `29C-133.55`, chuyến `SD73`) xuất phát từ **Hub bắt đầu của trip** (Origin Hub, ví dụ: `Andromeda Hub - HCM`), di chuyển qua các trạm trung chuyển như `Magellan Hub - Đà Nẵng` (Hub Cấp 1 miền Trung) và trạm cuối là `Polaris Hub - Hưng Yên` (Hub Cấp 1 miền Bắc).
- Khi tạo chuyến xe và xếp hàng lên xe tại **màn hình xuất kho của Hub bắt đầu**, bảng kê hàng hóa xuất kho thường chứa hỗn hợp 2 nhóm đơn hàng có bản chất giao nhận hoàn toàn khác nhau:

#### 🔹 Nhóm 1: Các đơn hàng CÓ CHỌN HUB CẤP 1 tại cột địa chỉ giao (Luân chuyển liên Hub)
- **Hành vi thao tác của thủ kho tại Hub bắt đầu**: Người dùng bấm nút **"Thay đổi địa chỉ (Điều chuyển)"** và chọn đích đến là một Hub Cấp 1 cụ thể (ví dụ: đơn `T19` chọn `Magellan Hub - Đà Nẵng`; đơn `T10` chọn `Polaris Hub - Hưng Yên`).
- **Bản chất nghiệp vụ**:
  * Đơn hàng này có mục tiêu vận chuyển đến Hub Cấp 1 đó để dỡ xuống lưu kho hoặc tiếp tục chia tuyến xe bo nội thành.
  * Đơn hàng được gắn `destinationHubId = <ID của Hub Cấp 1 đã chọn>` và `deliveryMode = 'HUB_L1'`.
- **Hành vi nghiệp vụ chuẩn tại màn hình nhập của các Hub**:
  * **Tại đúng Hub Cấp 1 đã chọn** (ví dụ: xe dừng tại Đà Nẵng và mở đơn `T19`): Hệ thống **MẶC ĐỊNH ĐỂ NHẬP ĐƠN HÀNG ĐÓ VÀO HUB CẤP 1 ĐÓ**:
    - Cờ `isForCurrentHub = true`.
    - Checkbox dỡ hàng: **Mặc định được tích chọn (CHECKED)**.
    - Ô số kiện thực nhận: Mặc định điền sẵn số kiện dự kiến dỡ.
    - Cột Kho nhận hiển thị rõ tên Hub Cấp 1 này (`Magellan Hub - Đà Nẵng`).
  * **Tại Hub Cấp 1 khác trên lộ trình** (ví dụ: xe dừng tại Đà Nẵng nhưng mở đơn `T10` đi Hưng Yên):
    - Đơn này là hàng trung chuyển đi tiếp, cờ `isForCurrentHub = false`.
    - Checkbox dỡ hàng: **Mặc định BỎ CHỌN (UNCHECKED)**.
    - Dòng hiển thị mờ xám (`opacity-60`), gắn huy hiệu `[Đi kho khác]` hoặc `[Polaris Hub - Hưng Yên]`. Hàng nằm yên trên xe, không dỡ xuống Đà Nẵng.

#### 🔸 Nhóm 2: Các đơn hàng ĐỂ NGUYÊN ĐỊA CHỈ GIAO CỦA ĐƠN HÀNG NHƯ BAN ĐẦU (Giao thẳng khách / Khách nhận tận nơi)
- **Hành vi thao tác của thủ kho tại Hub bắt đầu**: Người dùng **KHÔNG CHỌN HUB CẤP 1 NÀO**, mà giữ nguyên nguyên trạng địa chỉ giao của đơn hàng như lúc tiếp nhận ban đầu (ví dụ: đơn `T20` giao khách tại `Quận Bình Thạnh, TP. Hồ Chí Minh`; đơn `T3` giao khách tại `Huyện Thanh Trì, TP. Hà Nội`).
- **Bản chất nghiệp vụ**:
  * Đơn hàng này là đơn giao thẳng tận nơi cho khách nhận cuối cùng (`deliveryMode = 'DIRECT_CUSTOMER'`), xe trả hàng trực tiếp cho khách trên đường đi hoặc tại đích đến của khách.
  * Đơn hàng **KHÔNG THUỘC DIỆN DỠ VÀO TỒN KHO** của bất kỳ trạm trung chuyển nào dọc đường (trừ khi khách tự đổi ý ra trạm nhận).
  * Trường `destinationHubId` trong cơ sở dữ liệu phải là `null` (hoặc giữ nguyên giá trị gốc ban đầu), không được phép trỏ vào bất kỳ Hub trung chuyển nào.
- **Hành vi nghiệp vụ chuẩn tại màn hình nhập của các Hub khi mở trip**:
  * **1. Toàn bộ thông tin đơn hàng KHÔNG ĐƯỢC THAY ĐỔI so với thông tin từ lúc bắt đầu tạo trip**:
    - Địa chỉ giao hàng (`deliveryAddress`): Phải giữ nguyên 100% địa chỉ giao ban đầu của khách (ví dụ: `Quận Bình Thạnh, TP. Hồ Chí Minh` hay `Huyện Thanh Trì, TP. Hà Nội`). Tuyệt đối **KHÔNG ĐƯỢC BỊ BIẾN ĐỔI** thành tên của Hub trung chuyển (như `Magellan Hub - Đà Nẵng` hay `Polaris Hub - Hưng Yên`).
    - Nơi giao / Kho nhận: Phải hiển thị nguyên vẹn địa chỉ giao của khách kèm huy hiệu định danh `[Giao thẳng khách]`.
    - Tên hàng, số kiện, khối lượng ($Kg$), thể tích ($m^3$), ghi chú vận đơn được bảo toàn nguyên vẹn.
  * **2. Mặc định kiểm đếm nhập kho (Inbound Tally Defaults)**:
    - Cờ `isForCurrentHub` **BẮT BUỘC PHẢI LÀ `false`** tại mọi trạm trung chuyển dọc đường.
    - Checkbox dỡ hàng: **Mặc định BỎ CHỌN (UNCHECKED)**.
    - Ô số kiện thực nhận: Không tự động điền số lượng để ngăn chặn triệt để nguy cơ thủ kho vô tình bấm xác nhận nhập nhầm đơn của khách vào kho.
    - Khi thủ kho bật công tắc `"Ẩn các dòng không thuộc kho này"`, toàn bộ các đơn để nguyên địa chỉ giao ban đầu này phải được ẩn đi, chỉ để lại đúng các đơn thực sự thuộc diện nhập kho của Hub đó.

---

### 3. Sơ đồ Luồng Nghiệp vụ Chuẩn Xác Thực Tế

```mermaid
flowchart TD
    START["1. MÀN HÌNH XUẤT KHO TẠI HUB BẮT ĐẦU CỦA TRIP (VD: Andromeda Hub - HCM)"] --> DISPATCH{"Kiểm tra cột Địa chỉ giao của từng đơn hàng trong bảng kê xuất"}
    
    DISPATCH -- "Trường hợp A: Có chọn Hub Cấp 1 (VD: Chọn Đà Nẵng hoặc Hưng Yên)" --> L1["Gán destinationHubId = Hub Cấp 1 đã chọn\ndeliveryMode = 'HUB_L1'"]
    DISPATCH -- "Trường hợp B: Để nguyên địa chỉ giao như ban đầu (VD: Giao khách Bình Thạnh, Thanh Trì)" --> L2["destinationHubId = null\ndeliveryMode = 'DIRECT_CUSTOMER'\nBẢO TOÀN NGUYÊN VẸN địa chỉ giao khách ban đầu"]

    L1 --> TRUCK["Chuyến xe xuất phát (VD: SD73 - Xe 29C-133.55)"]
    L2 --> TRUCK

    TRUCK --> HUB_MID["2. MÀN HÌNH NHẬP KHO TẠI TRẠM TRUNG CHUYỂN: Magellan Hub - Đà Nẵng (viewerHubId = 2)"]

    HUB_MID --> CHECK_DEST{"Đơn hàng có chọn Hub Cấp 1 là Đà Nẵng (ID = 2)?"}

    CHECK_DEST -- "ĐÚNG: Đơn hàng lúc xuất có chọn Đà Nẵng (VD: T19)" --> ACT_IN["MẶC ĐỊNH NHẬP ĐƠN VÀO ĐÀ NẴNG:\n- isForCurrentHub = true\n- Checkbox: CHECKED (Được tích chọn sẵn)\n- Điền sẵn số kiện thực nhận\n- Kho nhận: Magellan Hub - Đà Nẵng"]
    
    CHECK_DEST -- "SAI: Đơn chọn Hub Cấp 1 khác (VD: T10 chọn Hưng Yên ID = 3)" --> ACT_TRANSIT["MẶC ĐỊNH KHÔNG NHẬP VÀO ĐÀ NẴNG:\n- isForCurrentHub = false\n- Checkbox: UNCHECKED (Bỏ chọn)\n- Badge: [Đi kho khác - Polaris Hub Hưng Yên]\n- Hàng nằm yên trên xe chạy tiếp"]

    CHECK_DEST -- "SAI: Đơn để nguyên địa chỉ giao ban đầu (VD: T20, T3)" --> ACT_KEEP["THÔNG TIN BẢO TOÀN 100% NHƯ LÚC TẠO TRIP:\n- Địa chỉ giao giữ nguyên: Quận Bình Thạnh / Huyện Thanh Trì\n- Không bị đổi thành tên Hub Đà Nẵng\n- Badge: [Giao thẳng khách]\n- isForCurrentHub = false\n- Checkbox: UNCHECKED (Bỏ chọn)\n- Ẩn khi bật công tắc 'Ẩn dòng không thuộc kho này'"]

    ACT_IN --> RECEIPT["Xác nhận nhập kho & In phiếu nhập kho (Chỉ nhập đơn T19)"]
    ACT_TRANSIT --> ON_TRUCK["Xe tiếp tục hành trình ra Bắc chở theo T10, T20, T3"]
    ACT_KEEP --> ON_TRUCK

    ON_TRUCK --> HUB_END["3. MÀN HÌNH NHẬP KHO TẠI POLARIS HUB - HƯNG YÊN (viewerHubId = 3)"]
    HUB_END --> CHECK_HY{"Kiểm tra tại trạm Hưng Yên"}
    CHECK_HY -- "Đơn T10 (Chọn Hưng Yên)" --> HY_IN["MẶC ĐỊNH NHẬP KHO HƯNG YÊN (isForCurrentHub = true, CHECKED)"]
    CHECK_HY -- "Đơn T3, T20 (Để nguyên địa chỉ giao ban đầu)" --> HY_KEEP["THÔNG TIN KHÔNG ĐỔI SO VỚI LÚC TẠO TRIP:\n- Địa chỉ giao vẫn là: Huyện Thanh Trì / Quận Bình Thạnh\n- isForCurrentHub = false\n- Checkbox: UNCHECKED (Tài xế giao thẳng cho khách)"]
```

---

## 🔍 Tổng hợp các điểm chưa đúng trên hệ thống & Truy vết Nguyên nhân Gốc rễ (Root Cause Analysis)

Đối chiếu trực tiếp phản hồi của người dùng với hiện trạng mã nguồn hệ thống:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BẢNG ĐỐI CHIẾU LOGIC CŨ (BỊ LỖI) VS LOGIC ĐÚNG (YÊU CẦU CỦA NGƯỜI DÙNG @【M】【C】【D】)                                   │
├────────────────────────────────┬───────────────────────────────────────────┬───────────────────────────────────────────┤
│ HÀNH ĐỘNG / TÌNH HUỐNG         │ HIỆN TRẠNG TRƯỚC ĐÂY (LỖI)                │ LOGIC CHUẨN NGHIỆP VỤ MỚI                 │
├────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 1. Xuất kho tại Hub bắt đầu    │ Backend lấy fallback `dto.destinationHubId`│ Đơn nào chọn Hub Cấp 1 thì gán Hub đó.    │
│    (Chuyến xe chở hỗn hợp)     │ của chuyến xe đè lên TẤT CẢ các đơn hàng  │ Đơn nào để nguyên địa chỉ giao ban đầu    │
│                                │ kể cả đơn giao khách tận nơi!             │ thì destinationHubId = null, giữ nguyên!  │
├────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 2. Dữ liệu đơn hàng trong DB   │ `order.destinationHub` bị ghi đè thành    │ `order.destinationHub` và `deliveryAddress│
│    sau khi bấm Xác nhận xuất   │ tên Hub trung chuyển (VD: Đà Nẵng);       │ giữ nguyên 100% địa chỉ khách ban đầu,    │
│                                │ `destinationHubId` bị gán = 2!            │ tuyệt đối không bị ghi đè!                │
├────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 3. Mở trip tại Hub Cấp 1 trung │ Toàn bộ đơn hàng (kể cả đơn giao khách)   │ CHỈ đơn nào lúc tạo trip có chọn Hub này  │
│    chuyển (VD: Đà Nẵng)        │ đều bị tính `isForCurrentHub = true` và   │ thì mới để mặc định nhập vào Hub này.     │
│                                │ tự động tích CHECKED dỡ vào kho!          │ Đơn khác và đơn giao khách: UNCHECKED!    │
├────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 4. Thông tin hiển thị tại cột  │ Hiển thị chữ "Magellan Hub - Đà Nẵng",    │ Hiển thị đúng địa chỉ giao ban đầu của    │
│    Kho nhận / Nơi giao         │ làm biến mất hoàn toàn địa chỉ của khách! │ đơn hàng từ lúc tạo trip + Badge rõ ràng. │
└────────────────────────────────┴───────────────────────────────────────────┴───────────────────────────────────────────┘
```

### 1. Nguyên nhân 1 (Backend Root Cause) — Ghi đè thông tin đơn hàng trong `confirmOutbound` & `saveOutboundDraft`
- **Vị trí**:
  * [`backend/src/orders/warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) (hàm `confirmOutbound` dòng 1960–1973 và `saveOutboundDraft` dòng 2232–2236).
- **Hiện tượng**:
  Khi người dùng xuất kho Mode 1 (`CUSTOMER`) hoặc Mode 2 (`TRANSFER`), frontend gửi một giá trị `dto.destinationHubId` cấp chuyến xe (ví dụ: Đà Nẵng = 2).
  Tại backend, code duyệt từng item và sử dụng toán tử fallback `??`:
  ```typescript
  const itemDestHubId =
    item?.destinationHubId ??
    (dto.destinationHubId && dto.destinationHubId !== actingHubId
      ? dto.destinationHubId
      : null);
  if (itemDestHubId && itemDestHubId !== actingHubId) {
    order.destinationHubId = itemDestHubId;
    const destHub = await hubRepo.findOne({ where: { id: itemDestHubId } });
    if (destHub) {
      order.destinationHub = destHub.name;
    }
  }
  ```
- **Hậu quả nghiêm trọng**:
  Đối với những đơn hàng người dùng **cố ý để nguyên địa chỉ giao của đơn hàng như ban đầu** (không chọn Hub Cấp 1, `item.destinationHubId` là undefined/null), toán tử fallback `??` đã tự động lấy `dto.destinationHubId = 2` đè vào:
  * Ghi đè `order.destinationHubId = 2`!
  * Ghi đè `order.destinationHub = "Magellan Hub - Đà Nẵng"`!
  * Lệnh `await orderRepo.save(orders)` lưu trực tiếp vào database, **VĨNH VIỄN LÀM THAY ĐỔI VÀ BÓP MÉO THÔNG TIN BAN ĐẦU CỦA ĐƠN HÀNG**!

---

### 2. Nguyên nhân 2 (Frontend Outbound Root Cause) — Tự ý gom Hub đích đại diện cấp Chuyến xe
- **Vị trí**:
  * [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) (hàm `buildOutboundRequest` dòng 403–438).
- **Hiện tượng**:
  Khi trong bảng kê xuất hàng có ít nhất 1 dòng chọn Hub điều chuyển, frontend tự động tìm dòng đầu tiên có `destinationHubId` và gán vào `primaryDestHubId`, sau đó gán `body.destinationHubId = primaryDestHubId` gửi lên API:
  ```typescript
  const primaryDestHubId =
    mode === 'TRANSFER'
      ? parseInt(transferHubId, 10)
      : validRows.find((r) => r.destinationHubId)?.destinationHubId || undefined;
  ```
- **Hậu quả**:
  Biến cả chuyến xe hỗn hợp thành chuyến chỉ có một đích đến duy nhất, gián tiếp kích hoạt lỗi fallback ghi đè ở backend cho toàn bộ các đơn hàng giữ nguyên địa chỉ giao ban đầu.

---

### 3. Nguyên nhân 3 (Backend Manifest Root Cause) — Khởi tạo mặc định `isForCurrentHub = true` trong API Manifest
- **Vị trí**:
  * [`backend/src/orders/warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) (hàm `getTripManifest` dòng 3086–3120).
- **Hiện tượng**:
  ```typescript
  let isForCurrentHub = true; // Sai nguyên tắc Zero-Assumption!
  if (viewerHubId) {
    if (o.destinationHubId) {
      isForCurrentHub =
        o.destinationHubId === viewerHubId ||
        !stopHubIds.has(o.destinationHubId);
    } else if (o.destinationHub) {
      // Chỉ kiểm tra chuỗi 'hcm', 'đn', 'hy'
      // Đối với đơn giao khách để nguyên địa chỉ, không khớp chuỗi nào
      // -> isForCurrentHub KHÔNG ĐỔI, GIỮ NGUYÊN LÀ TRUE!
    }
  }
  ```
- **Hậu quả**:
  Đơn hàng để nguyên địa chỉ giao ban đầu (hoặc đơn có `destinationHubId` bị ghi đè thành 2) luôn bị tính là `isForCurrentHub = true` khi xem tại Magellan Hub - Đà Nẵng, vi phạm trực tiếp logic nghiệp vụ.

---

### 4. Nguyên nhân 4 (Frontend Inbound Tally Root Cause) — Tự động tích chọn Checkbox và điền sẵn Số kiện thực nhận
- **Vị trí**:
  * [`frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx) (hàm `buildInitialTallyState` dòng 25–35).
- **Hiện tượng**:
  ```typescript
  export function buildInitialTallyState(lines: TripManifestLine[]): TallyState {
    const state: TallyState = {};
    for (const l of lines) {
      state[l.id] = {
        checked: l.isForCurrentHub && !l.isReceivedHere,
        actualQuantity: expectedForLine(l),
        discrepancyReason: ''
      };
    }
    return state;
  }
  ```
- **Hậu quả**:
  Vì `isForCurrentHub` bị trả về `true`, giao diện tự động tích chọn checkbox và điền sẵn số kiện thực nhận cho các đơn để nguyên địa chỉ ban đầu. Khi thủ kho bấm "Xác nhận nhập kho", các đơn này bị dỡ xuống kho Đà Nẵng trái với ý muốn vận hành.

---

### 5. Nguyên nhân 5 (Frontend Display Root Cause) — Mất dấu vết địa chỉ giao ban đầu trên giao diện nhập kho
- **Vị trí**:
  * Cột "KHO NHẬN" trong [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx) và bảng kê kiểm đếm chỉ hiển thị `l.destinationHubEntity?.name ?? l.destinationHub`.
- **Hậu quả**:
  Khi dữ liệu bị ghi đè, thủ kho tại các trạm không thể nhìn thấy địa chỉ giao khách ban đầu, không phân biệt được đơn nào là đơn giao khách, đơn nào là đơn luân chuyển Hub.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Backend (`backend/`)

- [x] **1.1. Cập nhật DTO xuất kho ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts))**:
  - Khẳng định rõ khế ước `OutboundItemDto`:
    * Hỗ trợ trường `deliveryMode?: 'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO'`.
    * Khi đơn hàng để nguyên địa chỉ giao ban đầu: `deliveryMode === 'DIRECT_CUSTOMER'`, `destinationHubId` gửi lên là `null` hoặc `undefined`.
    * Khi đơn hàng chọn Hub Cấp 1: `deliveryMode === 'HUB_L1'`, `destinationHubId` gửi lên là ID của Hub Cấp 1 đó.

- [x] **1.2. Triệt tiêu hoàn toàn logic ghi đè dữ liệu đơn hàng trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))**:
  - **Quy tắc bất biến (Operational Invariant)**: Tuyệt đối **KHÔNG ĐƯỢC PHÉP** lấy `dto.destinationHubId` cấp chuyến xe làm fallback đè lên đơn hàng nếu đơn đó có `item.deliveryMode === 'DIRECT_CUSTOMER'` hoặc không có `item.destinationHubId`.
  - **Xử lý đối với đơn để nguyên địa chỉ giao ban đầu (`DIRECT_CUSTOMER`)**:
    * Giữ nguyên `order.destinationHubId = null` (hoặc giá trị gốc ban đầu).
    * Giữ nguyên `order.destinationHub = null` (hoặc giá trị gốc ban đầu).
    * Giữ nguyên 100% `order.deliveryAddress` theo địa chỉ giao của khách ban đầu.
    * Tạo `TripEntity` của dòng này với `destinationHubId = null`, `type = 'OUTBOUND'`, ghi chú rõ `[XUẤT KHO - GIAO KHÁCH]`.
    * Tạo `OrderInventoryTransactionEntity` xuất kho với `destination` lấy đúng địa chỉ giao ban đầu của khách hoặc tỉnh/thành đích.
  - **Xử lý đối với đơn CÓ CHỌN HUB CẤP 1 (`HUB_L1`)**:
    * Gán đúng `order.destinationHubId = item.destinationHubId`.
    * Gán đúng `order.destinationHub = destHub.name`.
    * Tạo `TripEntity` của dòng này với `destinationHubId = item.destinationHubId`, `type = 'TRANSFER'`, ghi chú rõ `[XUẤT KHO - LUÂN CHUYỂN]`.

- [x] **1.3. Áp dụng chuẩn hóa tương tự cho `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))**:
  - Không cho phép gán `dto.destinationHubId` của chuyến nháp vào các đơn giữ nguyên địa chỉ giao ban đầu.
  - Bảo toàn trạng thái đơn nháp giao khách (`destinationHubId = null`, `type = 'OUTBOUND'`).

- [x] **1.4. Chuẩn hóa logic tính toán `isForCurrentHub` trong API Trip Manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) - `getTripManifest`)**:
  - Áp dụng nguyên tắc an toàn Zero-Assumption: Khởi tạo mặc định `let isForCurrentHub = false;`.
  - **Quy tắc xác định đơn thuộc diện dỡ tại Hub hiện tại (`isForCurrentHub = true`)**:
    * Đơn hàng CÓ CHỌN Hub Cấp 1 này: Khi và chỉ khi `effectiveDestHubId === viewerHubId`.
    * Tức là: Chỉ khi tại màn hình xuất kho của Hub bắt đầu, người dùng có chọn Hub Cấp 1 trùng với ID của Hub đang mở màn hình nhập, thì mới trả về `isForCurrentHub = true`.
  - **Quy tắc đối với đơn để nguyên địa chỉ giao ban đầu (`DIRECT_CUSTOMER` hoặc `effectiveDestHubId == null`)**:
    * `isForCurrentHub` **BẮT BUỘC LÀ `false`** đối với mọi Hub trung chuyển dọc đường.
  - **Bảo toàn thông tin trả về qua API**:
    * Trả về nguyên vẹn `originalDeliveryAddress`, `deliveryAddress`, `deliveryMode: 'DIRECT_CUSTOMER'`, và `destinationHubEntity = null` cho các đơn để nguyên địa chỉ ban đầu.

- [x] **1.5. Rà soát danh sách điểm dừng `trip_stop` khi xuất chuyến xe hỗn hợp ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))**:
  - Đảm bảo `trip_stop` chỉ tạo điểm dừng cho các Hub Cấp 1 thực sự có đơn chọn dỡ tại Hub đó (`item.destinationHubId`).
  - Không sinh các điểm dừng rác không cần thiết từ các đơn giao thẳng cho khách.

---

### 2. Frontend (`frontend/`)

- [x] **2.1. Chuẩn hóa luồng gửi dữ liệu xuất kho tại [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)**:
  - Trong hàm `buildOutboundRequest`:
    * Duyệt từng dòng hàng trong `validRows`:
      - Nếu dòng có chọn Hub Cấp 1: Truyền rõ `destinationHubId: Number(r.destinationHubId)`, `deliveryMode: 'HUB_L1'`.
      - Nếu dòng để nguyên địa chỉ giao ban đầu: Truyền rõ `destinationHubId: null`, `deliveryMode: 'DIRECT_CUSTOMER'`, `deliveryAddress: r.deliveryAddress`.
    * Khi chuyến xe chở hỗn hợp các đơn (vừa giao khách, vừa chuyển Hub khác nhau), không lấy đại diện 1 Hub đè lên `body.destinationHubId` toàn cục nếu chuyến xe có nhiều mục đích giao nhận.

- [x] **2.2. Nâng cấp Bảng kê Tally Nhập kho ([`warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx))**:
  - **Hàm `buildInitialTallyState`**:
    * Mặc định tích chọn (`checked: true`): **CHỈ DÀNH CHO** các đơn thỏa mãn đồng thời:
      `l.isForCurrentHub === true && !l.isReceivedHere && l.deliveryMode !== 'DIRECT_CUSTOMER'`.
    * Các đơn để nguyên địa chỉ giao ban đầu (`deliveryMode === 'DIRECT_CUSTOMER'` hoặc `l.isForCurrentHub === false`):
      - Checkbox dỡ hàng: **Mặc định là UNCHECKED (bỏ chọn)**.
      - Ô số kiện thực nhận: Không tự động điền sẵn số lượng.
      - Dòng hiển thị ở trạng thái mờ (`opacity-60`) nếu chưa được thủ kho chủ động tích chọn.
  - **Cột "KHO NHẬN / NƠI GIAO"**:
    * Hiển thị trực quan và bảo toàn thông tin từ lúc tạo trip:
      - Đối với đơn để nguyên địa chỉ giao ban đầu: Hiển thị Huy hiệu màu Slate/Cyan **`[Giao thẳng khách]`** (hoặc `[Địa chỉ ban đầu]`) đi kèm chuỗi văn bản địa chỉ giao nhận ban đầu của khách (ví dụ: `Quận Bình Thạnh, TP. Hồ Chí Minh` hay `Huyện Thanh Trì, TP. Hà Nội`). Tuyệt đối không hiển thị tên của Hub trung chuyển!
      - Đối với đơn chọn Hub Cấp 1: Hiển thị Huy hiệu màu xanh dương **`[Hub Cấp 1]`** kèm tên Hub nhận (ví dụ: `Magellan Hub - Đà Nẵng`).
      - Đối với đơn chọn Tuyến Xe Bo: Hiển thị Huy hiệu màu tím **`[Tuyến Xe Bo]`** kèm tên tuyến xe bo.
  - **Công tắc "Ẩn các dòng không thuộc kho này" (`Switch hideOtherHubs`)**:
    * Hoạt động chuẩn xác: Khi bật công tắc, bảng chỉ hiển thị các đơn có `l.isForCurrentHub === true`. Toàn bộ các đơn để nguyên địa chỉ ban đầu và đơn đi Hub khác sẽ được ẩn đi gọn gàng.

- [x] **2.3. Cập nhật Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))**:
  - Header & Thống kê kiểm đếm: Phân tách rõ ràng giữa:
    * Nhóm đơn cần dỡ tại Hub hiện tại (các đơn có chọn Hub Cấp 1 này).
    * Nhóm đơn tiếp tục hành trình trên xe (các đơn để nguyên địa chỉ giao ban đầu và các đơn đi Hub khác).
  - Nút **"In phiếu nhập kho"** ([`WarehouseInboundReceiptModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)): Chỉ in các đơn thực nhận dỡ tại Hub này, tuyệt đối không in các đơn để nguyên địa chỉ giao ban đầu.

- [x] **2.4. Tuân thủ nghiêm ngặt Quy chuẩn Giao diện Hẹp (UI Compact Density Mandate)**:
  - Bảng Tally: Padding `py-1 px-1.5`, Typography `text-[10px]`, font mã đơn `text-[11px] font-mono font-bold`.
  - Tuyệt đối cấm các class quá khổ: `p-4`, `p-6`, `space-y-3`, `gap-4`. Sử dụng `p-1`, `p-2`, `space-y-1.5`, `gap-1.5`.
  - Zero redundant icons: Triệt tiêu mọi icon trùng lặp với text label trên nút bấm và badge.

---

### 3. Kiểm thử & Nghiệm thu (Definition of Done)

- [x] **3.1. Kiểm tra Biên dịch & Linting toàn diện**:
  - Backend: `npm run lint --prefix backend` và `npm run build --prefix backend` đạt PASS (0 errors).
  - Frontend: `npm run build --prefix frontend` đạt PASS (0 errors, TypeScript compile pass).

- [x] **3.2. Xây dựng Kịch bản Kiểm thử Tự động E2E với Playwright**:
  - File spec: [`frontend/e2e/39-feedback-07-10-task-29-origin-hub-dest-logic.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/39-feedback-07-10-task-29-origin-hub-dest-logic.spec.ts).
  - **Kịch bản kiểm thử khép kín 3 trạm (HCM ➔ Đà Nẵng ➔ Hưng Yên)**:
    * **Giai đoạn 1 (Tại Hub bắt đầu - Andromeda Hub HCM)**:
      - Tạo chuyến xe xuất kho liên tỉnh chở 3 nhóm đơn hàng:
        1. Đơn `TEST-L1-DN`: Chọn Hub Cấp 1 là `Magellan Hub - Đà Nẵng`.
        2. Đơn `TEST-L1-HY`: Chọn Hub Cấp 1 là `Polaris Hub - Hưng Yên`.
        3. Đơn `TEST-ORIG-CUST`: Để nguyên địa chỉ giao ban đầu của khách (ví dụ: `Huyện Thanh Trì, TP. Hà Nội`), không chọn Hub Cấp 1 nào.
      - Xác nhận xuất kho và ghi nhận `tripCode`.
    * **Giai đoạn 2 (Tại trạm trung chuyển - Magellan Hub Đà Nẵng)**:
      - Đăng nhập tài khoản thủ kho Đà Nẵng (`viewerHubId = 2`), truy cập `/warehouse/inbound`.
      - Mở chi tiết chuyến xe vừa xuất:
        1. Khẳng định đơn `TEST-L1-DN`: Hiển thị dỡ tại Đà Nẵng, `isForCurrentHub = true`, checkbox **MẶC ĐỊNH CHECKED**.
        2. Khẳng định đơn `TEST-L1-HY`: Hiển thị đi Hưng Yên, `isForCurrentHub = false`, checkbox **MẶC ĐỊNH UNCHECKED**.
        3. Khẳng định đơn `TEST-ORIG-CUST`:
           - **Thông tin không thay đổi so với lúc bắt đầu tạo trip**: Cột Kho nhận / Nơi giao hiển thị đúng địa chỉ `Huyện Thanh Trì, TP. Hà Nội` + Badge `[Giao thẳng khách]`, KHÔNG bị đổi thành `Magellan Hub - Đà Nẵng`.
           - `isForCurrentHub = false`, checkbox **MẶC ĐỊNH UNCHECKED**.
        4. Bật công tắc `"Ẩn các dòng không thuộc kho này"`: Bảng chỉ còn hiển thị duy nhất đơn `TEST-L1-DN`, 2 đơn còn lại bị ẩn hoàn toàn.
      - Xác nhận nhập kho Đà Nẵng: Chỉ nhập đơn `TEST-L1-DN`. Hai đơn còn lại tiếp tục hành trình trên xe.
    * **Giai đoạn 3 (Tại trạm đích - Polaris Hub Hưng Yên)**:
      - Đăng nhập tài khoản thủ kho Hưng Yên (`viewerHubId = 3`), mở chuyến xe:
        1. Đơn `TEST-L1-HY`: Mặc định nhập vào Hưng Yên (`isForCurrentHub = true`, checkbox **MẶC ĐỊNH CHECKED**).
        2. Đơn `TEST-ORIG-CUST`: Vẫn giữ nguyên 100% địa chỉ `Huyện Thanh Trì, TP. Hà Nội`, checkbox **MẶC ĐỊNH UNCHECKED** (tài xế giao thẳng cho khách).
  - Chụp ảnh màn hình bằng chứng nghiệm thu thực tế lưu vào [`feedback_07_10_task_29/screenshot_verified.png`](file:///D:/Projects/logistics-website/feedback_07_10_task_29/screenshot_verified.png).

---

> *Bản kế hoạch nghiệp vụ được lập bởi TMS Domain Lead — Spider Express. Mọi can thiệp code phải tuân thủ nghiêm ngặt quy chế Git Submodules, Branching from `dev`, và Quality Gate Promotion Mandate.*
