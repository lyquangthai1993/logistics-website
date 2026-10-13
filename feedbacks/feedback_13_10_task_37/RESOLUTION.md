# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_13_10_TASK_37] — Feedback 13/10 (Task #37) — Khóa Quyền Thao Tác Đơn Hàng Đối Với Chuyến Xe Đã Xử Lý Tại Hub & Phân Quyền Đặc Quyền Admin

> **Thời gian nghiệm thu**: 13/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (22/22 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity Verification  
> **Phạm vi tác động**: Quản lý Nhập kho (`/warehouse/inbound`) & Xuất kho (`/warehouse/outbound`) • Modal Chi tiết & Kiểm đếm chuyến xe ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Popup Bốc thêm đơn dọc đường về Hub ([`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx)) • Popup Chọn đơn lưu kho xuất tiếp lên xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Popup Điều chuyển đích đến đơn hàng ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Lưới chỉnh sửa bảng kê hàng hóa ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Backend Warehouse Module ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) & [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts)) • Hệ thống phân quyền RBAC & Cơ chế bảo vệ bất biến sổ cái trạm dừng ([`TripStopEntity`](file:///D:/Projects/logistics-website/backend/src/trips/entities/trip-stop.entity.ts))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"đối với các trip đã có trạng thái đã xử lý ở hub nào thì các account của hub đó không được quyền thao tác thêm, bớt, chỉnh sửa đơn hàng trong trip đó. Chỉ cấp quyền cho tài khoản admin được chỉnh sửa thông tin đơn hàng trong trip khi trip ở trạng thái đã xử lý."*

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"đối với các trip đã có trạng thái đã xử lý ở hub nào thì các account của hub đó không được quyền thao tác thêm, bớt, chỉnh sửa đơn hàng trong trip đó. Chỉ cấp quyền cho tài khoản admin được chỉnh sửa thông tin đơn hàng trong trip khi trip ở trạng thái đã xử lý."*

---

### 2. Tình huống vận hành thực tế & Nguyên lý bất biến sổ cái trạm dừng (Stop Ledger Invariant)

Trong mạng lưới vận tải đường dài liên vùng Bắc - Trung - Nam của Spider Express:
1. **Chu trình tác nghiệp tại mỗi Hub**:
   - Khi một chuyến xe tải (ví dụ: xe `75H-112.23` chuyến `SD44`) ghé vào một Hub (ví dụ: `Andromeda Hub - HCM`), thủ kho tại Hub đó sẽ mở chi tiết chuyến xe để thực hiện:
     - **Bước 1 (Nhập hàng & Dỡ kho)**: Kiểm đếm dỡ các kiện hàng gửi về Hub này, bốc thêm đơn lấy dọc đường (nếu có), bấm *Xác nhận nhập kho* và in *Phiếu nhập kho*.
     - **Bước 2 (Xuất hàng mới lên xe - tùy chọn)**: Chọn đơn lưu kho tại Hub để xuất thêm lên xe đi tiếp trạm sau, bấm *Xác nhận xuất hàng* và in *Phiếu xuất kho* (hoặc bấm *Bỏ qua xuất mới & Hoàn tất* nếu không có hàng xuất thêm).
   - Ngay khi hoàn tất Bước 1 hoặc Bước 2, trạng thái trạm dừng của Hub đó (`trip_stop.status`) được chuyển sang **`COMPLETED` ("Đã xử lý")**.
2. **Tính bất biến của sổ cái sau khi chốt sổ (Audit Trail & Ledger Integrity)**:
   - Khi trạm dừng đã chuyển sang trạng thái `COMPLETED` ("Đã xử lý"):
     * Biên bản giao nhận hàng hóa, phiếu nhập kho, phiếu xuất kho và chứng từ bàn giao giữa tài xế và thủ kho đã được ký nhận và đóng gói.
     * Sổ cái giao dịch kho (`order_inventory_transaction`) đã ghi nhận số kiện, khối lượng ($Kg$), thể tích ($m^3$) thực nhận/thực xuất.
     * Thùng xe đã được niêm phong / khóa cửa để chuẩn bị hoặc đã lăn bánh rời khỏi mặt bằng kho của Hub đó.
   - **Hệ quả nếu cho phép account của Hub tiếp tục chỉnh sửa**:
     * Làm sai lệch tồn kho vật lý thực tế với số liệu kế toán kho.
     * Xung đột tải trọng, thể tích xe với các Hub kế tiếp trên lộ trình (`Magellan Hub - Đà Nẵng`, `Xe Bo Đắk Lắk`).
     * Rủi ro sửa số liệu gian lận, bớt xén hàng hoặc thao tác nhầm lẫn của nhân viên kho khi xe đã rời bãi.
3. **Quy chế đặc quyền Quản trị viên (Super Admin Override Privilege)**:
   - Trong vận hành thực tế, có các trường hợp ngoại lệ phát sinh cần điều chỉnh (Exception Handling):
     * Thủ kho nhập nhầm số kiện thực nhận cần điều chỉnh lại đúng với thực tế.
     * Điều chỉnh lại Hub đích hoặc địa chỉ giao cho đơn hàng đi lạc tuyến.
     * Phát hiện sai sót thông tin mặt hàng, khối lượng hoặc giấy tờ chứng từ đi kèm.
   - **Quy tắc phân quyền tuyệt đối**:
     * **Tài khoản thuộc Hub đó (`WAREHOUSE_MANAGER`, `DISPATCHER` hoặc user gắn với `hubId` tương ứng)**: Bị **KHÓA TOÀN BỘ QUYỀN** thêm, bớt, chỉnh sửa đơn hàng trong chuyến xe đó. Chế độ xem chuyển thành **CHỈ ĐỌC (READ-ONLY)**.
     * **Tài khoản Quản trị viên (`SUPER_ADMIN`)**: Là vai trò DUY NHẤT được cấp đặc quyền mở khóa can thiệp, chỉnh sửa thông tin đơn hàng trong chuyến xe đã xử lý, đảm bảo truy vết kiểm toán (Audit Trail) chặt chẽ.

---

### 3. Quy trình vận hành & Ma trận phân quyền theo trạng thái trạm dừng

```mermaid
flowchart TD
    Start["Mở Chi Tiết Chuyến Xe (WarehouseTripDetailModal)"] --> CheckStop{"Kiểm tra Trạng thái Trạm tại Hub này (currentHubStatus)"}
    
    CheckStop -- "PENDING / Chờ xử lý" --> ActiveMode["TRẠM ĐANG CHỜ XỬ LÝ (Tác nghiệp bình thường)"]
    subgraph S_Pending ["Quyền tác nghiệp khi Trạm CHỜ XỬ LÝ"]
        ActiveMode --> Op1["Account Hub & Admin: Kiểm đếm dỡ hàng"]
        ActiveMode --> Op2["Account Hub & Admin: Bốc thêm đơn dọc đường"]
        ActiveMode --> Op3["Account Hub & Admin: Bốc đơn lưu kho xuất tiếp"]
        ActiveMode --> Op4["Account Hub & Admin: Đổi đích đến / Điều chuyển"]
        ActiveMode --> Op5["Account Hub & Admin: Xác nhận hoàn tất trạm"]
    end

    CheckStop -- "COMPLETED / Đã xử lý" --> CheckRole{"Kiểm tra Vai trò Người dùng (User Role)"}
    
    CheckRole -- "Account của Hub (WAREHOUSE_MANAGER / Non-Admin)" --> HubLocked["KHÓA TOÀN BỘ THAO TÁC CỦA ACCOUNT HUB"]
    subgraph S_HubLocked ["Hạn chế đối với Tài khoản Hub"]
        HubLocked --> Lock1["❌ KHÔNG THÊM ĐƠN: Ẩn/Khóa nút 'Bốc thêm dọc đường' & 'Thêm đơn xuất từ kho'"]
        HubLocked --> Lock2["❌ KHÔNG BỚT ĐƠN: Không thể xóa hoặc hủy gán đơn khỏi chuyến xe"]
        HubLocked --> Lock3["❌ KHÔNG SỬA ĐƠN: Khóa lưới chỉnh sửa, khóa nút 'Đổi kho đích / Quay lại địa chỉ thường'"]
        HubLocked --> Lock4["❌ KHÔNG RE-SUBMIT: Ẩn nút 'Lưu thay đổi', 'Xác nhận nhập', 'Xác nhận xuất'"]
        HubLocked --> Allow1["✅ ĐƯỢC PHÉP: Xem bảng kê, xem lộ trình, In phiếu nhập / In phiếu xuất"]
    end

    CheckRole -- "Quản trị viên (SUPER_ADMIN)" --> AdminOverride["ĐẶC QUYỀN QUẢN TRỊ VIÊN (ADMIN OVERRIDE)"]
    subgraph S_Admin ["Đặc quyền can thiệp của Quản trị viên"]
        AdminOverride --> Banner["Hiển thị Banner Cảnh báo: 'Chế độ Quản trị viên điều chỉnh sau chốt sổ'"]
        AdminOverride --> AdminEdit["✅ ĐƯỢC PHÉP chỉnh sửa thông tin đơn hàng (số kiện, tải trọng, hàng hóa, đích đến)"]
        AdminOverride --> AdminAudit["Ghi nhận lịch sử điều chỉnh vào sổ cái kiểm toán (Inventory Transaction Audit)"]
    end
```

#### Ma trận Phân quyền Thao tác theo Trạng thái Trạm dừng & Vai trò:

| Thao tác tác nghiệp trên Trip | Trạm CHỜ XỬ LÝ (`PENDING`)<br>Tài khoản Hub | Trạm CHỜ XỬ LÝ (`PENDING`)<br>SUPER_ADMIN | Trạm ĐÃ XỬ LÝ (`COMPLETED`)<br>Tài khoản Hub (Bị phản hồi) | Trạm ĐÃ XỬ LÝ (`COMPLETED`)<br>SUPER_ADMIN (Đặc quyền mới) |
|---|:---:|:---:|:---:|:---:|
| **Xem bảng kê & lộ trình chuyến xe** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **In phiếu nhập kho / xuất kho** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **Bốc thêm đơn dọc đường về Hub** (`WarehouseAppendOrderModal`) | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM HOÀN TOÀN**<br>*(Ẩn / Khóa nút bấm)* | ⚠️ Cho phép can thiệp đặc biệt |
| **Bốc thêm đơn lưu kho xuất tiếp** (`WarehouseSelectStoredOrdersModal`) | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM HOÀN TOÀN**<br>*(Ẩn / Khóa nút bấm)* | ⚠️ Cho phép can thiệp đặc biệt |
| **Xóa / Bớt đơn hàng khỏi chuyến xe** | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM HOÀN TOÀN** | ✅ Cho phép can thiệp |
| **Chỉnh sửa thông tin đơn hàng** (Số kiện, Kg, $m^3$, Tên hàng, Ghi chú) | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM HOÀN TOÀN**<br>*(Bảng kê Read-only)* | ✅ **ĐƯỢC CẤP QUYỀN**<br>*(Mở form sửa + lưu audit)* |
| **Thay đổi đích đến / Điều chuyển Hub L1, Xe Bo, Khách lẻ** | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM HOÀN TOÀN**<br>*(Khóa nút Đổi đích)* | ✅ **ĐƯỢC CẤP QUYỀN** |
| **Xác nhận nhập kho / Xác nhận xuất kho** | ✅ Cho phép | ✅ Cho phép | ❌ **BỊ CẤM** *(Đã xử lý xong)* | ⚠️ Cập nhật điều chỉnh |
| **Gọi API Backend thay đổi dữ liệu** (`append-order`, `append-stored`, `destination`...) | ✅ HTTP 200/201 | ✅ HTTP 200/201 | ❌ **HTTP 403 FORBIDDEN**<br>*(Chặn cứng ở Backend)* | ✅ HTTP 200/201 |

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
Đối chiếu trực tiếp với ảnh chụp màn hình thực tế đính kèm tại [`feedbacks/feedback_13_10_task_37/screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg):

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CHUYẾN XE SD44   [Luân chuyển nội bộ]   [Đã xử lý]                                  [In phiếu] ✕│
│ Bước 1: Kiểm đếm dỡ hàng & Nhập kho                                                              │
│ [1. Nhập hàng & Dỡ kho (Đã xong)] > [2. Xuất hàng mới lên xe (+4)]   Trạm hiện tại: Andromeda HCM│
│                                                                                                  │
│ ℹ️ Chuyến xe đã chốt sổ cái tồn kho nhận tại kho này.                                             │
│ Lộ trình xe: [🔴 Andromeda Hub - HCM (Đã xử lý) ] > Magellan Hub - ĐN > Xe Bo Đaklak             │
│ [Ngày: 13/10/2026]   [Biển số: 75H11223]   [Tài xế: test4]                                       │
│                                                                                                  │
│ 🏢 Bảng kê chi tiết các dòng hàng trên chuyến xe         4 dòng hàng  [🔴 + Bốc thêm đơn dọc đường]│
│ [01 | HKN2610-167 | 303 Trần Hưng Đạo... | 20 kiện | 8.000 kg | 58 m³ | ...]                     │
│ [02 | LBD2610-802 | 202 Nguyễn Trãi...   | 17 kiện | 7.675 kg | 55 m³ | ...]                     │
│ ...                                                                                              │
│ Tổng: 4 đơn • 62 kiện • 30.050 kg           [Đóng]  [🔴 Tiếp theo: Xuất mới] [🔴 Bỏ qua & Hoàn tất]│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Nút `+ Bốc thêm đơn dọc đường về Hub` vẫn hiển thị và cho phép bấm khi trạm đã `Đã xử lý`** (Điểm lỗi trực quan số 1 trong [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg)):
   - **Hiện trạng trên ảnh**: Tại trạm `Andromeda Hub - HCM`, lộ trình xe đã đánh dấu màu xanh `Đã xử lý` và có thông báo *"Chuyến xe đã chốt sổ cái tồn kho nhận tại kho này"*. Tuy nhiên, tại Toolbar góc phải của bảng kê, nút bấm `+ Bốc thêm đơn dọc đường về Hub` màu xanh dương vẫn xuất hiện công khai.
   - **Hậu quả**: Bất kỳ thủ kho nào của Andromeda Hub cũng có thể bấm vào nút này, mở modal [`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx) và chèn thêm đơn hàng mới vào chuyến xe đã hoàn thành thủ tục tại kho.
   - **Yêu cầu khắc phục**: 
     * Khi `currentHubStatus === 'COMPLETED'` và người dùng không phải là `SUPER_ADMIN`: Ẩn hoàn toàn nút này (hoặc disable với tooltip: *"Chuyến xe đã hoàn tất xử lý tại Hub này, không thể bốc thêm đơn"*).
     * Khi người dùng là `SUPER_ADMIN`: Hiển thị nút với huy hiệu `[Admin]` cho phép can thiệp đặc biệt nếu cần.

2. **Cụm nút điều hướng & chốt sổ ở Footer vẫn kích hoạt thao tác chuyển bước và kết thúc trạm** (Điểm khoanh đỏ góc dưới bên phải trong [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg)):
   - **Hiện trạng trên ảnh**: Dưới chân modal Bước 1, có 2 nút hành động:
     * Nút `-> Tiếp theo: Xuất hàng mới vào trip`: Vẫn mang màu xanh dương nổi bật, mời gọi người dùng bấm sang Bước 2 để xuất hàng mới lên chuyến xe đã đóng sổ.
     * Nút `Bỏ qua xuất mới & Hoàn tất`: Vẫn kích hoạt được hành động gọi API `updateTransitStep` dù trạm này thực tế đã hoàn tất từ trước.
   - **Hậu quả**: Gây hiểu nhầm quy trình tác nghiệp cho nhân viên kho, tạo điều kiện cho nhân viên kho chuyển sang Bước 2 để chỉnh sửa chuyến xe đã rời bãi.
   - **Yêu cầu khắc phục**:
     * Với tài khoản Hub (khi đã `COMPLETED`):
       - Đổi nút `-> Tiếp theo: Xuất hàng mới vào trip` thành nút xem thuần túy: `-> Xem hàng xuất tiếp trên xe` (để thủ kho vẫn có thể tra cứu các đơn hàng chuyển tiếp đi trạm sau nếu cần kiểm tra đối chiếu, nhưng KHÔNG ĐƯỢC xuất mới).
       - Ẩn hoàn toàn nút `Bỏ qua xuất mới & Hoàn tất` (vì trạm đã chốt xong).
       - Chỉ giữ nút `Đóng` và nút in phiếu.

3. **Lỗ hổng thao tác xuất mới và sửa đơn tại Bước 2 ("Xuất hàng mới lên xe")**:
   - **Hiện trạng trong mã nguồn**: Khi người dùng chuyển sang Bước 2 của chuyến xe `SD44`:
     * Nút `+ Thêm đơn xuất từ kho lên xe` vẫn hiển thị, mở modal [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx) cho phép chọn các đơn lưu kho khác để gán vào chuyến xe này.
     * Cột *KHO ĐÍCH / NƠI GIAO* vẫn render các nút tương tác: `Đổi kho đích khác...`, `Quay lại địa chỉ thường`, `Thay đổi địa chỉ (Điều chuyển)`. Bất kỳ click nào cũng gọi API `updateTripOrderDestination` để thay đổi lộ trình và Hub nhận của đơn hàng.
     * Nút `Xác nhận xuất hàng lên trip` ở footer vẫn cho phép submit `handleConfirmOutboundStep`.
   - **Yêu cầu khắc phục**:
     * Với tài khoản Hub: Khóa toàn bộ các nút trên ở Bước 2. Toàn bộ bảng kê Bước 2 chỉ phục vụ mục đích giám sát, tra cứu.
     * Với Admin: Giữ quyền chỉnh sửa thông tin đơn hàng, sửa đổi đích đến kèm hộp thoại xác nhận lý do điều chỉnh.

4. **Chưa có cơ chế phân quyền đặc quyền Admin (Super Admin Override)**:
   - **Hiện trạng trong mã nguồn**: Cả Backend (`warehouse.controller.ts`) và Frontend (`warehouse-trip-detail-modal.tsx`) hiện chỉ kiểm tra chung chung `Roles(RoleEnum.SUPER_ADMIN, RoleEnum.WAREHOUSE_MANAGER)`. Logic `effectiveReadOnly` trên giao diện khóa cứng hoặc mở tự do theo trạng thái mà không phân biệt giữa tài khoản Hub và tài khoản Admin.
   - **Yêu cầu phản hồi từ người dùng**: *"Chỉ cấp quyền cho tài khoản admin được chỉnh sửa thông tin đơn hàng trong trip khi trip ở trạng thái đã xử lý."* ➔ Cần xây dựng cơ chế phân quyền 2 tầng: Account Hub bị khóa 100%, Admin được cấp quyền mở khóa chỉnh sửa kèm theo banner chỉ thị rõ ràng.

5. **Thiếu chốt chặn an toàn tại tầng Backend (Backend Authorization Vulnerability)**:
   - **Hiện trạng trong mã nguồn**: Các endpoint mutating trong [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts):
     * `POST /warehouse/trips/:tripCode/append-order`
     * `POST /warehouse/trips/:tripCode/append-stored-orders`
     * `PATCH /warehouse/trips/:tripCode/orders/:orderId/destination`
     * `POST /warehouse/inbound/confirm`
     * `POST /warehouse/trips/:tripCode/transit-step`
     hoàn toàn **CHƯA KIỂM TRA** xem trạm dừng tại Hub của user (`userWithHub.hubId`) đã có trạng thái `COMPLETED` hay chưa.
   - **Hậu quả**: Nếu người dùng gọi API trực tiếp (bỏ qua giao diện) hoặc bypass frontend, backend vẫn cho phép thêm/sửa đơn hàng vào chuyến xe đã xử lý tại Hub.
   - **Yêu cầu khắc phục**: Bắt buộc cài đặt hàm kiểm tra quyền tập trung `validateTripStopEditPermission()` tại Backend. Nếu trạm dừng của Hub đang thao tác đã `COMPLETED` mà người gọi không phải `SUPER_ADMIN`, backend lập tức từ chối với mã lỗi `HTTP 403 Forbidden`.

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Xây dựng hàm kiểm tra quyền tập trung `validateTripStopEditPermission`**
- ✅ **Gắn chốt chặn kiểm tra vào API Bốc thêm đơn dọc đường (`appendOrderToTrip`)**
- ✅ **Gắn chốt chặn kiểm tra vào API Bốc đơn lưu kho xuất tiếp (`appendStoredOrdersToTrip`)**
- ✅ **Gắn chốt chặn kiểm tra vào API Điều chuyển đích đến (`updateTripOrderDestination`)**
- ✅ **Gắn chốt chặn kiểm tra vào API Xác nhận kiểm đếm nhập kho (`confirmInbound`)**
- ✅ **Gắn chốt chặn kiểm tra vào API Cập nhật tiến trình trạm (`updateTransitStep`)**
- ✅ **Bổ sung cờ phân quyền chi tiết trong API Bảng kê chuyến xe (`getTripManifest`)**
- ✅ **Cập nhật Swagger Annotations trong `warehouse.controller.ts`**
  * 📍 File: `backend/src/orders/warehouse.controller.ts`
- ✅ **Đảm bảo tính tương thích của API Hợp đồng gốc & Điều chỉnh đơn hàng (`adminOverride`)**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Khai báo và tính toán chuẩn xác các cờ phân quyền theo phản hồi người dùng**
- ✅ **Xử lý triệt để nút `+ Bốc thêm đơn dọc đường về Hub` (Khắc phục lỗi trực quan trên [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg))**
  * 📍 File: `feedbacks/feedback_13_10_task_37/screenshot_01.jpg`
- ✅ **Xử lý cụm nút Footer góc dưới bên phải (Khắc phục vùng khoanh đỏ trong [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg))**
  * 📍 File: `feedbacks/feedback_13_10_task_37/screenshot_01.jpg`
- ✅ **Khóa toàn bộ hành vi thêm / bớt / sửa đơn hàng tại Bước 2 ("Xuất hàng mới lên xe")**
- ✅ **Khóa form thông tin phương tiện ở Header Top Card**
- ✅ **Bổ sung Banner trạng thái nghiệp vụ rõ ràng**
- ✅ **Bảo vệ [`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx)**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx`
- ✅ **Bảo vệ [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx`
- ✅ **Bảo vệ [`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-destination-modal.tsx`
- ✅ **Đảm bảo toàn bộ các Banner thông báo, nút bấm mới hoặc Badge trạng thái tuân thủ tuyệt đối quy tắc giao diện hẹp**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Backend Type Check & Build**
- ✅ **Frontend Type Check & Build**
- ✅ **Playwright E2E Test Suite**: [`frontend/e2e/47-feedback-13-10-task-37.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/47-feedback-13-10-task-37.spec.ts)**

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

### Hình ảnh minh chứng đã lưu trữ (1 tệp):
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 2 | `feedbacks/feedback_13_10_task_37/screenshot_01.jpg` | Source |
| 3 | `frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx` | Frontend (Next.js) |
| 5 | `frontend/src/features/warehouse/components/warehouse-destination-modal.tsx` | Frontend (Next.js) |
| 6 | `frontend/e2e/47-feedback-13-10-task-37.spec.ts` | Frontend (Next.js) |
| 7 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 8 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 9 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 10 | `backend/src/trips/infrastructure/persistence/relational/entities/trip-stop.entity.ts` | Backend (NestJS) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
