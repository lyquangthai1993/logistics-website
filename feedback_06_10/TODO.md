# Feedback 06/10 — Nghiệp vụ bốc thêm đơn dọc đường nhập vào kho hiện tại

> **Thời gian ghi nhận**: 06/10/2026  
> **Người báo cáo**: Người dùng (Thủ kho / Vận hành)  
> **Màn hình**: Quản lý Nhập kho ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa (`WarehouseTripDetailModal`) ➔ Bốc thêm đơn dọc đường (`WarehouseAppendOrderModal`)  
> **Tài liệu tham chiếu**: `/leader` Business Rules & TMS Freight Logistics Operations

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Tình huống vận hành thực tế
- Một chuyến xe liên tỉnh/nội bộ (ví dụ chuyến `SD22`, xe `29C12354`) đang di chuyển trên đường.
- Dọc đường đi, tài xế **bốc thêm hàng của khách dọc đường** (không qua tạo đơn trước ở Hub xuất phát).
- Chuyến xe về tới kho của tài khoản đang thao tác (ví dụ `Magellan Hub - Đà Nẵng`).
- Khi thủ kho mở màn hình **"Chi tiết chuyến xe & Kiểm đếm hàng hóa"**, tài xế thông báo có thêm hàng bốc dọc đường chuyển về kho này.
- Thủ kho bấm nút **"Bốc thêm đơn lên xe"** để nhập thông tin kiện hàng bốc dọc đường này vào chuyến xe `SD22`.

### 2. Các quy định về trường thông tin trên popup Bốc thêm đơn
1. **Nơi bốc hàng**: Là **Điểm bốc dọc đường — Nhập tay (Freetext input)**.
   - Ví dụ: `Cây xăng Hòa Cầm`, `Dọc QL1A Bình Định`, `Ngã 3 Trị An`, `KCN Hòa Khánh`...
   - Người dùng tự gõ nơi bốc, không ép chọn từ danh sách Hub nội bộ vì hàng lấy ngoài đường.
2. **Kho nhập (đổi từ "Kho bốc")**:
   - Đổi nhãn từ `Kho bốc` thành **`Kho nhập`**.
   - Giá trị: **Kho hiện tại của tài khoản đang đăng nhập / thao tác** (ví dụ `Magellan Hub - Đà Nẵng`).
   - Trường này hiển thị cố định / chỉ đọc (read-only), vì hàng lấy dọc đường được chở về để nhập vào kho hiện tại này.
3. **Đích đến đơn hàng**:
   - Là **Điểm giao của khách (Địa chỉ giao hàng tận nơi cho khách nhận cuối)**.
   - Nhập thông tin người nhận, địa chỉ giao hàng và tỉnh/thành phố nhận hàng của khách.
4. **Quy chuẩn thông tin kiện hàng (No-SKU)**:
   - Mã vận đơn (Tùy chọn, để trống hệ thống tự cấp theo chuẩn `HUB-INIT-YYMM-SEQ`).
   - Tên mặt hàng (VD: Bạt cuộn, Hạt nhựa, May mặc...).
   - Số kiện (bắt buộc, $\ge 1$).
   - Khối lượng ($Kg$) & Thể tích ($m^3$).
   - Chứng từ đi kèm & Ghi chú vận hành.

### 3. Luồng xử lý sau khi bấm "Xác nhận thêm đơn"
1. Hệ thống ghi nhận đơn hàng mới vào cơ sở dữ liệu:
   - `originHub`: Điểm bốc dọc đường (nhập tay).
   - `originHubId`: `null` (do lấy dọc đường, không phải Hub nội bộ).
   - `destinationHub`: Tên kho hiện tại (`user.hub.name`).
   - `destinationHubId`: ID kho hiện tại (`user.hubId`).
   - `deliveryAddress`: Điểm giao của khách.
   - `status`: `IN_TRANSIT` (gắn liền vào chuyến xe `SD22`).
2. Đóng popup và tự động làm mới bảng kê chuyến xe:
   - **Xuất hiện thêm 1 dòng cho đơn mới** ở màn hình chuyến xe (`WarehouseTripDetailModal`).
   - Do có `destinationHubId` trùng với kho hiện tại, dòng này thuộc diện hàng dỡ tại kho này (`isForCurrentHub = true`).
3. Thủ kho tích chọn kiểm đếm đơn mới cùng với các đơn sẵn có trên chuyến xe ➔ Bấm **"Xác nhận nhập kho"** để chính thức nhập tất cả đơn vào tồn kho!

---

## 🔍 Tổng hợp các điểm chưa đúng trên giao diện cũ

1. **Hiển thị sai hướng luồng bốc/nhập**:
   - Giao diện cũ hiểu nhầm là kho hiện tại bốc hàng lên xe gửi đi kho khác (`Kho hiện tại -> Đích dỡ hàng`).
   - Đúng nghiệp vụ: Hàng bốc từ **Điểm bốc dọc đường** chở về nhập vào **Kho hiện tại (Kho nhập)**, giao đến **Điểm giao của khách**.
2. **Trường "Đích dỡ hàng" bị lỗi hiển thị số `3`**:
   - Dropdown Base UI bị lỗi fallback render ID `3` và co rúm thành một ô vuông nhỏ `3 [^v]`.
   - Với luồng mới: Kho nhập là cố định (Kho hiện tại), Đích giao hàng là Điểm giao của khách (nhập tay / địa chỉ khách).
3. **Trùng lặp 2 nút "Bốc thêm đơn"**:
   - Header có `+ Bốc thêm đơn` và toolbar bảng có `+ Bốc thêm đơn lên xe`.
   - Cần giữ 1 nút duy nhất, rõ ràng, đặt ở toolbar bảng kê hàng hóa hoặc header.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Backend (`backend/`)
- [x] **Cập nhật DTO `AppendOrderToTripDto`**:
  - `pickupAddress`: Bắt buộc nhập (hoặc mặc định 'Điểm bốc dọc đường'), mô tả nơi tài xế lấy hàng dọc đường.
  - `destinationHubId`: Tùy chọn, mặc định lấy kho hiện tại của người thao tác (`userWithHub.hubId`).
  - `deliveryAddress`: Điểm giao hàng cho khách.
- [x] **Cập nhật Logic `appendOrderToTrip` trong `WarehouseService`**:
  - Gán `originHub`: Điểm bốc dọc đường do người dùng nhập.
  - Gán `originHubId`: `null` (hoặc ID kho hiện tại nếu bốc tại kho).
  - Gán `destinationHubId`: `userWithHub.hubId` (Kho hiện tại nhập hàng).
  - Gán `destinationHub`: `userWithHub.hub.name`.
  - Gán `deliveryAddress`: Điểm giao khách (lưu trong transaction & notes/route).
  - Tạo `TripEntity` liên kết vào `tripCode` hiện tại với `destinationHubId = userWithHub.hubId`.
  - Upsert `TripStopEntity` cho kho hiện tại (trạng thái `PENDING` nếu chưa nhập, hoặc giữ nguyên stop đang kiểm đếm).
  - Trả về thông tin đơn hàng và chuyến xe vừa tạo.

### 2. Frontend (`frontend/`)
- [x] **Thiết kế lại Modal `WarehouseAppendOrderModal` theo chuẩn mới**:
  - Header: `Bốc thêm đơn dọc đường lên chuyến xe {tripCode}`
  - Subtitle: `Xe: {licensePlate} • Kho nhập: {currentHubName}` (đổi từ "Kho bốc" sang "Kho nhập").
  - Khung lộ trình đơn hàng:
    - **Điểm bốc hàng dọc đường (Nhập tay)**: Input text, placeholder: `VD: Cây xăng Hòa Cầm, Ngã 3 Trị An, Dọc QL1A...` (Bắt buộc).
    - Mũi tên chuyển tiếp ➔
    - **Kho nhập hàng**: Box hiển thị tên kho hiện tại (`{currentHubName}`), có huy hiệu `[Kho hiện tại]` cố định, không chọn nhầm sang kho khác, triệt tiêu lỗi ID `3`.
  - Phần địa chỉ giao hàng:
    - Nhãn: **Điểm giao của khách (Địa chỉ giao hàng)**.
    - Placeholder: `Số nhà, tên đường, KCN, Phường/Xã...`
  - Các trường quy chuẩn kiện hàng:
    - Mã vận đơn (Tùy chọn - để trống tự cấp).
    - Tên mặt hàng (Bắt buộc).
    - Số kiện (Bắt buộc, $\ge 1$).
    - Khối lượng ($Kg$) & Thể tích ($m^3$).
    - Chứng từ & Ghi chú vận hành.
  - Nút bấm xác nhận: `<IconPackage /> Xác nhận bốc lên xe`.
- [x] **Làm mới bảng kê sau khi thêm thành công**:
  - Gọi `onSuccess` để trigger `refetchManifest()` của `WarehouseTripDetailModal`.
  - Dòng đơn mới tự động xuất hiện trong bảng kê với Kho nhận = `{currentHubName}`.
  - Cho phép thủ kho tích chọn đơn này để nhập kho cùng lượt với chuyến xe.
- [x] **Tinh gọn nút bấm trong `WarehouseTripDetailModal`**:
  - Giữ lại 1 nút bấm duy nhất trên Toolbar bảng kê hàng hóa: `<Button><IconPlus /> Bốc thêm đơn lên xe</Button>`.
  - Loại bỏ nút trùng lặp ở Header trên cùng bên phải.

### 3. Kiểm thử & Nghiệm thu
- [x] Type check backend: `npm run lint` & `npm run build` PASS (0 errors).
- [x] Type check frontend: `npx tsc --noEmit` & `npm run build` PASS (0 errors, Next.js Turbopack compiled successfully).
- [x] Lint check frontend: `oxlint` trên các file chỉnh sửa PASS (0 errors).
