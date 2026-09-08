# TODO: Kế Hoạch Cải Tiến & Triển Khai Phân Hệ Quản Lý Kho (Warehouse Operations)

> **Cơ quan ban hành / Thẩm quyền**: `/leader` (TMS Business Architecture Lead)  
> **Căn cứ nghiệp vụ**: Commit `740b7780fd1eb674d325c610f09c5917fe101d32` & Các chỉ đạo nghiệp vụ cập nhật  
> **Tài liệu tham chiếu**:  
> - [`Task_Warehouse_Design_UI.md`](./Task_Warehouse_Design_UI.md)  
> - [`WAREHOUSE_IMPLEMENTATION_PLAN.md`](./WAREHOUSE_IMPLEMENTATION_PLAN.md)  
> - Canvas thiết kế: [`pencil-workspace/pens/WAREHOUSE_FLOWS.pen`](./pencil-workspace/pens/WAREHOUSE_FLOWS.pen)  
> - RBAC Matrix: [`.agents/rules/rbac-matrix.md`](./.agents/rules/rbac-matrix.md)  
> - Hướng dẫn in tem nhận diện: [`docs_scan/TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx`](./docs_scan/TEM%20NHẬN%20DIỆN%20HÀNG%20HÓA%20THÀNH%20A4.xlsx)

---

## 📌 Bảng Tóm Tắt Thay Đổi Yêu Cầu Cốt Lõi

| Hạng mục | Quy cách CŨ | Quy cách MỚI (Thực chiến sàn kho) |
| :--- | :--- | :--- |
| **Menu Phân Hệ Kho** | Menu phức hợp nhiều cấp | **3 mục chính duy nhất**: `Nhập kho` \| `Xuất kho` \| `Đơn hàng` |
| **Header `WH_CASE_01`** | Bắt buộc Nhà thầu, Điện thoại, Kế hoạch đóng hàng, Hotline | ❌ Bỏ Nhà thầu, Điện thoại, Kế hoạch đóng hàng, Hotline.<br>✅ Giữ: Ngày nhận, Biển số xe, Họ tên tài xế / người giao. |
| **Bảng Hàng `WH_CASE_01`** | 15 cột cồng kềnh, nhiều thông tin điều phối văn phòng | ❌ Bỏ 5 cột: `Điều hành`, `Khách hàng`, `Ngày cần bốc`, `Ngày cần giao`, `Đã soạn`.<br>✅ Bảng rút gọn 10 cột, hỗ trợ **Inline Editable Table**, nén gọn hàng để hiển thị nhiều dòng hơn. |
| **Cột Thao Tác** | Menu thao tác rời rạc | ✅ Đưa nút **`[🖨️ In tem nhận dạng]`** trực tiếp vào từng dòng hàng để in tem dán Pallet/Kiện (A4) 1-click. |
| **Quy Cách Tem A4** | Mẫu in cố định hoặc chưa rõ ràng biến động | ✅ **Dựa chuẩn theo `docs_scan/TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx`**:<br>• Các trường `xxx` thay bằng biến động: `KHO` (Hub hiện tại), `TÊN HÀNG` (từ dòng), `MÃ ĐƠN HÀNG` (orderCode + barcode), `NGÀY NHẬP` (DD/MM/YYYY), `NGƯỜI NHẬP` (Thủ kho tiếp nhận), `GIAO ĐẾN` (Điểm đích).<br>• `SỐ LƯỢNG`: Dạng `[Số kiện trên tem/pallet] / [Tổng số lượng tạo của đơn]`, ví dụ: `10/80` (với `/80` là tổng số lượng kiện được tạo của đơn).<br>• `PALET SỐ`: `[Số pallet] / TỔNG SỐ PALET: [Tổng pallet]`. |
| **Thêm Dòng Mới** | Thao tác nhiều bước | ✅ Nút `[+ Thêm 1 dòng đơn mới]`: Nhập xong vừa thêm dòng vào bảng, vừa tự động gọi API tạo đơn mới cho kho. |
| **Màn Hình Xuất Kho** | Chỉ tìm đơn đã qua chu kỳ inbound | ✅ **Tìm kiếm được cả các đơn ở trạng thái `DRAFT`**.<br>✅ Có **NÚT LOAD `[🔄 Cập nhật lại thông số]`** để tải lại cân nặng (Kg), thể tích ($m^3$) mới nhất trước khi xuất. |
| **Thuật Ngữ Trạng Thái** | Dùng thuật ngữ kỹ thuật tiếng Anh (`INBOUND`, `COMPLETED_INBOUND`) | ✅ Map nhãn nghiệp vụ thuần Việt:<br>• Tạo Draft ➔ Xác nhận là `Pending` luôn.<br>• `INBOUND` ➔ **`LƯU KHO`** (*Hàng đã nhập vô kho*).<br>• `COMPLETED_INBOUND` ➔ **`ĐÃ XUẤT KHO`** (*Đã xuất ra khỏi kho*).<br>• Tab lịch sử kiểm toán Read-only chỉ dành cho **Quản trị viên (Super Admin)**. |

---

## 📋 Danh Sách Công Việc Cần Thực Hiện (Actionable Checklist)

### 📂 Phase 1: Cập Nhật Tài Liệu Kỹ Thuật & Nghiệp Vụ (Documentation & Contracts)
- [x] **1.1. Cập nhật `Task_Warehouse_Design_UI.md`**:
  - [x] Điều chỉnh cấu trúc Navigation: `Nhập kho | Xuất kho | Đơn hàng`.
  - [x] Cập nhật bảng cột `WH_CASE_01`: Bỏ 5 cột (*Điều hành, Khách hàng, Ngày cần bốc, Ngày cần giao, Đã soạn*).
  - [x] Tinh gọn Header: Bỏ Nhà thầu, Điện thoại, Kế hoạch đóng hàng.
  - [x] Thêm quy cách Cột Thao tác: Nút in tem nhận dạng từng dòng.
  - [x] Thêm đặc tả màn hình Xuất kho: Hỗ trợ tìm đơn `DRAFT` và nút `[🔄 Cập nhật lại thông số]`.
  - [x] Cập nhật danh mục Trạng thái: `LƯU KHO` & `ĐÃ XUẤT KHO`.
- [x] **1.2. Cập nhật `WAREHOUSE_IMPLEMENTATION_PLAN.md`**:
  - [x] Đồng bộ lại Data model & Entity fields: **Bỏ hẳn** các trường `subContractor` và `driverPhone` khỏi `WaybillEntity` và DTOs.
  - [x] Cập nhật API contract và kế hoạch Sprint.

---

### 🎨 Phase 2: Cập Nhật File Thiết Kế Vector Canvas (`pencil-workspace/pens/WAREHOUSE_FLOWS.pen`)
- [x] **2.1. Cập nhật Sidebar Navigation**:
  - [x] Đồng bộ Sidebar trên tất cả các Frames sang 3 menu: `Nhập kho` (`#0F3D62`), `Xuất kho`, `Đơn hàng`.
- [x] **2.2. Điều chỉnh Frame `WH_CASE_01` & Toàn Bộ Các Frame Trên Canvas**:
  - [x] Xóa bỏ cụm "Điều hành và hotline" và concept "Kế hoạch đóng hàng".
  - [x] **Rà soát & Bỏ hẳn 100% các trường/input `Nhà thầu *` (`subContractor`) và `Điện thoại *` (`driverPhone`)** trên toàn bộ các frames:
    - Đã gỡ khỏi `WH_CASE_01` (Tạo đơn mới - Mode 1).
    - Đã gỡ khỏi `WH_VIEWPORT_SCROLL_VIEW` (`VPort_In2 [Nhà thầu *]` & `VPort_In5 [Điện thoại *]`).
    - Đã gỡ khỏi `WH_FULLSCREEN_TABLE` (`FS_In2 [Nhà thầu *]` & `FS_In5 [Điện thoại *]`).
    - Đã gỡ khỏi `WH_CASE_02_TRANSFER_LOADED` (`s3_NtlHA [Nhà thầu]` & `s3_EW0nd [Điện thoại]`).
    - Đã gỡ khỏi `WH_CASE_05_LOADING_PLAN` (`LP_Veh_Contractor` & `LP_Veh_Phone`).
  - [x] Tinh gọn khối thông tin xe: Chỉ giữ Ngày tháng, Biển số xe, Họ tên tài xế/người giao.
  - [x] Xóa 5 cột khỏi `Header Row` và các `Cargo Row`: `Điều hành`, `Khách hàng`, `Ngày cần bốc`, `Ngày cần giao`, `Đã soạn`.
  - [x] Chuyển bảng sang dạng **Inline Editable Table** nhỏ gọn, thu hẹp width các cột để tăng mật độ dòng.
  - [x] Bổ sung nút bấm `[+ Thêm 1 dòng đơn mới]` tại Toolbar/Footer bảng.
  - [x] Cập nhật ô Thao tác trên từng dòng hàng: Thêm nút `[🖨️ In tem]`.
- [x] **2.3. Thiết Kế Trọn Bộ 3 Màn Hình Phân Hệ "Xuất Kho" (Outbound Screens trên Canvas)**:
  - [x] **Frame `WH_OUTBOUND_BOARD` (x=0, y=3435)**: `Danh sách xuất kho · Andromeda Hub - HCM` (Màn hình chính khi click menu "Xuất kho" trên Sidebar):
    - Đồng bộ Sidebar với menu `Xuất kho` active (`#F1F5F9` & `#020618`), chuẩn hóa với `sq2P6`.
    - 4 Khối Stat Cards: `Chờ xuất kho` (48 đơn · 1.850 kiện · 28.5T), `Xuất cho khách hàng` (28 đơn), `Luân chuyển nội bộ` (20 đơn), `Đã xuất kho hôm nay` (17 đơn).
    - Status Tabs: `Tất cả (65)`, `Chờ xuất kho (48)`, `Xuất khách hàng (28)`, `Xuất luân chuyển (20)`, `Đã xuất kho (17)`.
    - Thanh tìm kiếm kèm nút **`[🔄 Cập nhật lại thông số]`**.
    - Hai nút điều hướng chính: **`[+ Xuất cho khách hàng]`** (Mở Mode 1) và **`[🚚 Xuất luân chuyển nội bộ]`** (Mở Mode 2).
    - Bảng danh sách đơn xuất chuẩn 5 cột (bỏ Dự kiến & Thao tác): `MÃ VẬN ĐƠN`, `KHÁCH HÀNG / HUB ĐÍCH`, `TRẠNG THÁI`, `SỐ KIỆN / TẢI TRỌNG`, `LOẠI XUẤT KHO`.
  - [x] **Frame `WH_OUTBOUND_CUSTOMER` (x=1860, y=3435)**: `Tạo phiếu xuất kho · Khách hàng (Mode 1)`:
    - Giao nhận hàng trực tiếp cho khách lẻ hoặc trả xe bo chặng cuối.
    - Form thông tin nhận: Khách hàng, Số điện thoại, Địa chỉ giao hàng.
    - Bảng hàng xuất dạng Inline Editable Table nén gọn hiển thị nhiều dòng, nút in tem/phiếu `[🖨️]`, và nút `[🔄 Cập nhật lại thông số]`.
  - [x] **Frame `WH_OUTBOUND_CREATE_TRIP` (x=3645, y=3435)**: `Tạo phiếu xuất kho · Luân chuyển nội bộ (Mode 2)`:
    - Xuất hàng sang Hub khác (Hub-to-Hub transfer).
    - 3 Bước tinh gọn: Chọn Hub nhận & Thông tin xe ➔ Chọn hàng trong kho (hỗ trợ cả DRAFT + nút Cập nhật lại thông số) ➔ Xác nhận phiếu xuất & In Loading Plan bàn giao xe.
- [x] **2.4. Đồng bộ Nhãn Trạng Thái & Quyền Kiểm Toán**:
  - [x] Cập nhật nhãn trạng thái trực quan: `LƯU KHO` (Vàng/Cam), `ĐÃ XUẤT KHO` (Xanh lá).
- [x] **2.5. Điều Chỉnh Flow Xuất Kho & Áp Dụng Toàn Diện 4 Điểm Feedback Người Dùng**:
  - [x] **Feedback 1 (Đối soát bắt buộc)**: Tạm hoãn / chưa phát triển các tính năng "Đối soát bắt buộc", gỡ bỏ các khối so sánh lệch số liệu cứng nhắc (`Lệch -3`, `Lệch -4`) gây rào cản thao tác sàn kho.
  - [x] **Feedback 2 (Đồng bộ Menu Active)**: Đồng bộ màu sắc active menu item giữa `sq2P6` (`Nhập kho`) và `WH_OUTBOUND_BOARD` (`Xuất kho`) cùng dùng chuẩn Shadcn Clean Light Theme (`fill: #F1F5F9`, chữ & icon `#020618`, font-weight 600).
  - [x] **Feedback 3 (Bảng `o8eBC`)**: Bỏ hẳn 2 cột `Dự kiến` và `Thao tác` khỏi Header `KcrAi` và 5 dòng dữ liệu của `o8eBC`, dàn đều 5 cột còn lại (`MÃ VẬN ĐƠN`, `KHÁCH HÀNG`, `TRẠNG THÁI`, `SỐ KIỆN`, `NGUỒN / TRIP`) phủ kín độ rộng bảng 1136px.
  - [x] **Feedback 4 (Bảng `ODCk5`)**: Thay thế toàn bộ khối so sánh cũ của `ODCk5` thành bảng hàng nén gọn hiển thị nhiều dòng hàng như lúc nhập (`WH_CASE_01`), gồm Toolbar có nút `[🔄 Cập nhật lại thông số]` + `[+ Thêm hàng phát sinh]`, Header 9 cột, 4 dòng hàng thực tế (Mã đơn, Tên hàng, Số kiện, Kg, m³, Đích đến, Ghi chú, Nút in tem `[🖨️]`), và dòng Footer tổng kết (130 kiện · 3.230 kg · 12,8 m³).
  - [x] **Đồng Bộ Hoàn Toàn `sq2P6` (Danh Sách Nhập Kho) Theo Layout Chuẩn Của `WH_OUTBOUND_BOARD`**:
    - Nâng cấp `sq2P6` sở hữu cấu trúc, padding, khoảng cách và visual đồng nhất 100% với `WH_OUTBOUND_BOARD`.
    - Header 2 nút hành động phân rõ 2 Mode: **`[+ Tạo đơn nhập mới]`** (Mode 1: Khách hàng) và **`[🚚 Nhận luân chuyển nội bộ]`** (Mode 2: Luân chuyển).
    - 4 Thẻ Stat Cards chỉ số nhập kho (Chờ nhập, Khách gửi, Luân chuyển, Đã nhập kho hôm nay) với chiều cao 88px, góc bo 10px tinh gọn.
    - Thanh lọc 5 tabs, ô tìm kiếm 320px và nút **`[🔄 Cập nhật lại thông số]`**.
    - Bảng danh sách `o8eBC` 5 cột chuẩn không có Dự kiến & Thao tác, có badges trực quan và phân trang.
  - [x] **Xử Lý Triệt Để Tràn Layout Tại `vXik7` & Tích Hợp Nút Toggle Tại `F08wc`**:
    - Bọc bảng hàng 9 cột (860px) vào container cuộn ngang chuyên dụng `od_scroll_viewport` với thuộc tính `clip: true`.
    - Đặt thanh cuộn ngang Native (`od_inside_scrollbar`) **nằm bên trong bảng và ngay trên dòng tổng kết `od_tbl_summary`**.
    - Khóa tràn layout với `clip: true` trên `vXik7` và `ODCk5`, đảm bảo tuyệt đối không bị đè hay lấn sang Evidence Panel `F08wc`.
    - **Nút Toggle Thu Gọn / Mở Rộng `F08wc`**: Thiết kế nút icon toggle `panel-right-close` ngay tại góc phải Header của `F08wc` (`btn_toggle_evidence_panel`) và nút `panel-right` trên Toolbar bảng hàng để thủ kho dễ dàng ẩn/hiện bảng ảnh chứng từ khi cần tối đa không gian xem bảng hàng.
  - [x] **Chuyển Đổi `fAiwM` (Màn Hình `J2W764`) Sang Thông Tin Chuyến Xe (TRIP INFO - Phương Án A)**:
    - **Header**: Icon xe tải `truck` + Tiêu đề `Thông tin chuyến xe tiếp nhận · Inbound Trip` + Badge `Mã chuyến: TRIP-202609-0028`.
    - **Dòng 1**: Biển số xe & Loại xe (`29C-888.99 · Tải thùng 5T Kín`) &bull; Đơn vị vận tải (`Vận Tải Miền Bắc #HD-2026`).
    - **Dòng 2**: Tài xế tiếp nhận (`Nguyễn Văn Tuấn`) &bull; SĐT liên hệ (`0988 234 567`).
    - **Dòng 3**: Tuyến luân chuyển (`Hub Đà Nẵng ➔ Andromeda Hub HCM`) &bull; Thời gian cập bến & Cửa tiếp nhận (`08/09/2026 · 10:15 · Cửa Dock 03`).
    - **Dòng 4**: Quy mô đơn hàng trên chuyến (`12 đơn hàng · Chờ dỡ & hạ tải vào kho`) &bull; Tổng kiện / Tải trọng (`185 kiện · 3.450 kg · 14,2 m³`).
    - **Đồng bộ màn hình `J2W764`**: Cập nhật breadcrumb `INBOUND KHO / CHUYẾN TRIP-202609-0028`, Tiêu đề `Tiếp nhận chuyến xe TRIP-202609-0028`, Trạng thái `CHỜ DỠ HÀNG · PENDING_INBOUND`, và Drawer `Niêm phong Seal chì #VN-9821 nguyên vẹn`.

---

### 💻 Phase 3: Triển Khai Mã Nguồn Frontend (`frontend/`)
- [ ] **3.1. Cấu trúc Routing & Navigation Menu**:
  - [ ] Cập nhật `WarehouseSidebar` trong `frontend/src/features/warehouse/components/`:
    - Menu 1: `Nhập kho` (`/dashboard/warehouse/inbound`)
    - Menu 2: `Xuất kho` (`/dashboard/warehouse/outbound`)
    - Menu 3: `Đơn hàng` (`/dashboard/warehouse/orders`)
  - [ ] Kiểm tra Route Guard RBAC tại `frontend/src/proxy.ts` cho các route kho mới.
- [ ] **3.2. Xây dựng Component `InlineEditableWarehouseTable`**:
  - [ ] Tạo bảng 10 cột rút gọn, hỗ trợ click sửa trực tiếp trên cell (Cell Inline Editing).
  - [ ] Tối ưu CSS nén gọn chiều cao dòng (row height $\le 40px$, font size 12-13px) để hiển thị nhiều dòng hàng cùng lúc.
  - [ ] Hỗ trợ phím `Tab` chuyển ô thông minh và phím `Enter` lưu dòng.
  - [ ] Nút `[+ Thêm 1 dòng đơn mới]`: Sinh dòng trống trên grid, nhập xong trigger mutation tạo đơn kho.
- [ ] **3.3. Tích hợp In Tem Nhận Diện Từng Dòng (Template `TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx`)**:
  - [ ] Tại cột `Thao tác`, thêm action icon `Printer` ("In tem nhận dạng").
  - [ ] Khi click, mở popup xem/in nhanh mẫu **Tem Nhận Diện A4**:
    - `KHO : [Hub Name]` (Hub tiếp nhận)
    - `TÊN HÀNG : [Tên hàng]`
    - `MÃ ĐƠN HÀNG : [orderCode]` (Kèm barcode/QR)
    - `NGÀY NHẬP : [DD/MM/YYYY]`
    - `SỐ LƯỢNG : [Số kiện trên tem/pallet] / [Tổng số lượng tạo của đơn]`, ví dụ: `10/80` (với `/80` là tổng số lượng kiện được tạo của đơn)
    - `PALET SỐ : [Pallet Index] / TỔNG SỐ PALET : [Total Pallets]`
    - `NGƯỜI NHẬP : [Tên thủ kho]`
    - `GIAO ĐẾN : [Địa chỉ giao / Tỉnh thành / Tuyến Xe bo]`
- [ ] **3.4. Xây dựng Giao Diện Xuất Kho (`/dashboard/warehouse/outbound`)**:
  - [ ] Bộ lọc và bảng danh sách đơn xuất: Cho phép chọn/tìm đơn hàng kể cả trạng thái `DRAFT`.
  - [ ] Thêm nút **`[🔄 Cập nhật lại thông số]`**: Kích hoạt hàm invalidate queries hoặc refetch dữ liệu tải trọng (Kg, $m^3$) mới nhất từ server.
- [ ] **3.5. Hiển Thị Nhãn Trạng Thái Tiếng Việt**:
  - [ ] Map badge: `INBOUND` ➔ `LƯU KHO`, `COMPLETED_INBOUND` ➔ `ĐÃ XUẤT KHO`.
  - [ ] Ẩn lịch sử kiểm toán đối với `WAREHOUSE_MANAGER`, chỉ mở cho `SUPER_ADMIN`.

---

### ⚙️ Phase 4: Triển Khai Mã Nguồn Backend (`backend/`)
- [ ] **4.1. Entity & DTOs**:
  - [ ] Chỉnh sửa `CreateWaybillDto` & `WaybillEntity`: **Bỏ hẳn** các trường `subContractor`, `driverPhone`.
  - [ ] Tạo endpoint hoặc tối ưu DTO tạo nhanh đơn từ 1 dòng hàng của kho.
- [ ] **4.2. Logic Nghiệp Vụ Tạo & Đổi Trạng Thái (`WaybillsService`)**:
  - [ ] Luồng tạo nhanh: Tạo Draft ➔ Bấm xác nhận tự động chuyển sang `PENDING_INBOUND` / `INBOUND` (Lưu kho).
- [ ] **4.3. API Tìm Kiếm & Lọc Đơn Xuất Kho**:
  - [ ] Cập nhật query endpoint xuất kho: Cho phép query các đơn có trạng thái `['DRAFT', 'PENDING_FLEET', 'ASSIGNED', 'INBOUND']`.
  - [ ] Tạo endpoint làm mới thông số: `POST /v1/orders/refresh-metrics` hoặc hỗ trợ batch get fresh metrics theo danh sách `orderIds`.
- [ ] **4.4. Phân Quyền API Audit History**:
  - [ ] Bảo vệ endpoint `GET /v1/waybills/:id/audit-logs` bằng Decorator `@Roles(RoleEnum.SUPER_ADMIN)`.

---

### 🧪 Phase 5: Kiểm Thử E2E Luân Chuyển Liên Kho & Nghiệm Thu (E2E Multi-Hub Testing & Handover)

#### 👥 Ma Trận Tài Khoản & Hub Kiểm Thử (Seed Credentials)
| Vai trò / Hub | Tài khoản (Username / Email) | Password | Hub Quản Lý | Phạm vi kiểm thử |
| :--- | :--- | :--- | :--- | :--- |
| **Thủ kho Miền Bắc** | `warehouse_hyn` / `lyquangthai1993+4@gmail.com` | `secret` | `HUB-HYN-01` (Polaris Hub - Hưng Yên) | Tạo đơn Mode 1, In tem A4 Hưng Yên, Xuất xe tuyến Bắc ➔ Trung |
| **Thủ kho Miền Trung** | `warehouse_dad` / `lyquangthai1993+5@gmail.com` | `secret` | `HUB-DAD-01` (Magellan Hub - Đà Nẵng) | Nhận luân chuyển Mode 2, Dỡ đơn từ Trip, Lưu kho, Xuất tiếp Xe bo |
| **Thủ kho Miền Nam** | `warehouse_hcm` / `lyquangthai1993+6@gmail.com` | `secret` | `HUB-HCM-01` (Andromeda Hub - HCM) | Kiểm thử cách ly dữ liệu (Strict Hub Scoping - 0 rò rỉ dữ liệu) |
| **Super Admin** | `admin` / `lyquangthai1993+1@gmail.com` | `secret` | Toàn hệ thống | Kiểm toán vòng đời toàn trình (Audit Trail) & Timeline Stepper N-Hubs |

---

#### 🧪 Danh Mục Kịch Bản Kiểm Thử E2E Chi Tiết (File: `frontend/e2e/12-warehouse-inter-hub-transfer.spec.ts`)

- [ ] **5.1. Test Case TC-WH-01: Khởi tạo đơn & Lưu kho tại Hub nguồn (Hưng Yên - `warehouse_hyn`)**:
  - [ ] Đăng nhập `warehouse_hyn`, điều hướng đến `/dashboard/warehouse/inbound`.
  - [ ] Kiểm tra Header hiển thị Hub hiện tại: `Polaris Hub - Hưng Yên`.
  - [ ] Bấm `[+ Thêm 1 dòng đơn mới]`, nhập dữ liệu: *Tên hàng: Vải cuộn may mặc, Số thùng: 50, Số kg: 1,280, Số khối: 5.0, Địa chỉ nhận: KCN Thăng Long II, Địa chỉ giao: Magellan Hub - Đà Nẵng*.
  - [ ] Bấm nút `[🖨️ In tem]` tại cột Thao tác của dòng:
    - Kiểm tra popup/preview tem A4 hiển thị đúng: `KHO : Polaris Hub - Hưng Yên`, `SỐ LƯỢNG : 10/80` (với `/80` là tổng số lượng tạo), Barcode `orderCode`.
  - [ ] Bấm `[Xác nhận tiếp nhận]`: Đơn chuyển trạng thái sang `LƯU KHO` tại Hub Hưng Yên.
- [ ] **5.2. Test Case TC-WH-02: Xuất kho chuyển Hub tại Hưng Yên (Outbound Hưng Yên ➔ Đà Nẵng)**:
  - [ ] Tại `warehouse_hyn`, chuyển sang menu `Xuất kho` (`/dashboard/warehouse/outbound`).
  - [ ] Tìm kiếm và chọn đơn hàng vừa lưu kho (kiểm tra bộ lọc tìm thấy cả đơn `DRAFT`).
  - [ ] Click nút **`[🔄 Cập nhật lại thông số]`**: Xác nhận hệ thống refetch thành công dữ liệu tải trọng tươi mới.
  - [ ] Gán đơn vào chuyến xe tuyến chuyển Hub `Hưng Yên ➔ Đà Nẵng` và bấm `[Xác nhận xuất kho]`.
  - [ ] Kiểm tra trạng thái: Đơn hàng chuyển sang `ĐÃ XUẤT KHO` tại Hưng Yên; Chuyến xe chuyển trạng thái `IN_TRANSIT`.
- [ ] **5.3. Test Case TC-WH-03: Kiểm thử Strict Hub Scoping & Cách ly dữ liệu giữa các kho**:
  - [ ] Đăng nhập `warehouse_hcm` (Hub TP.HCM):
    - Kiểm tra danh sách Nhập kho, Xuất kho, Đơn hàng: Tuyệt đối **KHÔNG** thấy đơn hàng và chuyến xe đang chạy giữa Hưng Yên và Đà Nẵng (Data isolation = 100%).
  - [ ] Đăng nhập `warehouse_dad` (Hub Đà Nẵng):
    - Kiểm tra danh sách: **CHỈ** nhìn thấy các chuyến xe và đơn hàng có đích đến là Hub Đà Nẵng.
- [ ] **5.4. Test Case TC-WH-04: Tiếp nhận luân chuyển tại Hub đích (Đà Nẵng - `warehouse_dad`) - Mode 2**:
  - [ ] Tại `warehouse_dad`, vào menu `Nhập kho` ➔ Tab `Luân chuyển nội bộ` (Mode 2).
  - [ ] Bấm `[🚚 Chọn chuyến hàng ➔]`: Modal hiển thị chuyến xe từ Hưng Yên đang đến (`IN_TRANSIT`, còn hàng cần dỡ).
  - [ ] Chọn chuyến xe ➔ Modal Bước 2 hiển thị danh sách đơn trên chuyến: Tích chọn đơn hàng từ Hưng Yên.
  - [ ] Nạp đơn vào bảng kiểm đếm, thử nghiệm bấm `[+ Thêm hàng phát sinh]` để nhận bổ sung kiện hàng gom dọc đường.
  - [ ] Bấm `[Xác nhận tiếp nhận]`:
    - Đơn hàng chính thức nhập kho Đà Nẵng, chuyển trạng thái sang **`LƯU KHO`** tại Hub Đà Nẵng.
  - [ ] Bấm nút `[🖨️ In tem]` tại Đà Nẵng:
    - Xác nhận thông tin in tem được tự động cập nhật: `KHO : Magellan Hub - Đà Nẵng`, `NGƯỜI NHẬP : Trần Đình Kho / Thủ kho DAD`.
- [ ] **5.5. Test Case TC-WH-05: Xuất kho chặng cuối bàn giao Xe bo (Đà Nẵng ➔ Xe bo Tuyến Đà Nẵng)**:
  - [ ] Tại `warehouse_dad`, vào menu `Xuất kho`.
  - [ ] Chọn đơn hàng đang `LƯU KHO` tại Đà Nẵng.
  - [ ] Chọn đơn vị tiếp nhận: `Xe bo Tuyến Đà Nẵng` (Hub cấp 2 vệ tinh).
  - [ ] Bấm `[Xác nhận xuất kho]`: Đơn hàng chuyển trạng thái **`ĐÃ XUẤT KHO`** tại Đà Nẵng, bàn giao cho tài xế xe bo đi giao chặng cuối.
- [ ] **5.6. Test Case TC-WH-06: Xác thực quyền hạn & Lịch sử kiểm toán độc quyền Super Admin**:
  - [ ] Kiểm tra tại các tài khoản `warehouse_hyn`, `warehouse_dad`, `warehouse_hcm`:
    - Tab/Nút `[Lịch sử kiểm toán]` bị ẩn hoàn toàn trên giao diện.
    - Gọi trực tiếp API `/v1/waybills/:id/audit-logs` trả về `403 Forbidden`.
  - [ ] Đăng nhập `admin` (Super Admin):
    - Mở chi tiết đơn hàng: Xem trọn vẹn toàn bộ **Timeline Stepper 3 chặng** & **Audit Trail**:
      `Khởi tạo (Hưng Yên) ➔ Lưu kho (Hưng Yên) ➔ Xuất kho (Hưng Yên) ➔ Luân chuyển (Trip) ➔ Nhập kho (Đà Nẵng) ➔ Lưu kho (Đà Nẵng) ➔ Xuất kho Xe bo (Đà Nẵng)`.
    - Dữ liệu lịch sử thể hiện chính xác từng mốc thời gian, người thực hiện, và thay đổi trạng thái qua từng kho.
- [ ] **5.7. Tự động hóa Playwright & Regression**:
  - [ ] Viết và chạy thành công file test Playwright: `npx playwright test frontend/e2e/12-warehouse-inter-hub-transfer.spec.ts`.
  - [ ] Chụp ảnh bằng chứng màn hình luân chuyển liên Hub lưu vào `frontend/e2e/screenshots/`.
