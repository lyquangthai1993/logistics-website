# 📐 Pencil Workspace - Logistics TMS

Thư mục làm việc tập trung cho các tài nguyên thiết kế UI/UX, file `.pen`, assets và xuất file đồ họa thông qua Pencil MCP.

---

## 📁 Cấu trúc Thư mục

```text
pencil-workspace/
├── README.md               # Hướng dẫn cấu trúc & quy ước làm việc
├── assets/                 # Hình ảnh, icon, texture phụ trợ cho thiết kế
│   └── auth-hero.jpg       # Ảnh nền Hero Cyber Logistics
├── pens/                   # 📐 TẬP TRUNG TOÀN BỘ FILE .PEN THIẾT KẾ
│   ├── UI_UX.pen           # ⭐ MASTER COMPONENT REFERENCE (Design System & Reusable Components)
│   ├── SHADCN_UI.pen       # Thư viện gốc Shadcn UI Design Kit (88+ Components)
│   ├── AUTH_FLOWS.pen      # 🔐 Luồng Xác thực & Khôi phục mật khẩu (4 Screens)
│   ├── DASHBOARDS.pen      # 📊 4 Màn hình Dashboard theo vai trò RBAC
│   └── WAREHOUSE_FLOWS.pen # 📦 Luồng Quản lý Kho Hub & Inbound Lifecycle (4 Screens)
├── scripts/                # Procedural generation scripts (clock.js, radar.js)
└── exports/                # Thư mục chứa các file chụp và xuất đồ họa
    ├── 01-super-admin-overview.png
    ├── 02-dispatcher-orders.png
    ├── 03-fleet-manager-trips.png
    └── 04-warehouse-manager-inbound.png
```

---

## 🎨 Master Component Reference: `pens/UI_UX.pen`

File [`pens/UI_UX.pen`](file:///d:/Projects/logistics-website/pencil-workspace/pens/UI_UX.pen) đóng vai trò là **Thư viện Master Components & Design Tokens tập trung** của toàn dự án Logistics TMS.

Tại đây chỉ lưu trữ:
1. **Master Design System (`GqqVr` / `jTJYV`)**: 22+ Reusable Components (`reusable: true`) chuẩn hóa riêng cho TMS (*Buttons, 6 Status Badges, Metric Cards, Search Box, Dropdown Hubs, Table Cells, Tabs, Topbar, User Avatar*).
2. **AI Prompt Node (`Pt5lC`)**: Thẻ prompt canvas điều khiển AI.

---

## 🖥️ Danh sách Màn hình Phân chia theo File Chuyên biệt

### 🔐 1. File `pens/AUTH_FLOWS.pen` (Authentication & Security Flows)
- `1. Logistics TMS - Auth Sign In (1440x900)`
- `1.1. Logistics TMS - Forgot Password (1440x900)`
- `1.2. Logistics TMS - Forgot Password (Success State)`
- `1.3. Logistics TMS - Email Template: Forgot & Reset Password (1440x900)`

### 📊 2. File `pens/DASHBOARDS.pen` (TMS Operational Dashboards)
- `1. SUPER_ADMIN — Dashboard Overview (1440x900)`
- `2. DISPATCHER — Lập Lệnh Điều Vận (1440x900)`
- `3. FLEET_MANAGER — Phân Công Xe & Chuyến (1440x900)`
- `4. WAREHOUSE_MANAGER — Inbound Hub Kho (1440x900)`

#### Danh sách màn hình trong `pens/AUTH_FLOWS.pen`:
- **1. Sign In (`gh4zM`)**: Giao diện đăng nhập Next.js (`/auth/sign-in`)
- **1.1. Forgot Password (`KQv4r`)**: Màn hình quên mật khẩu với xác thực 2FA OTP
- **1.2. Forgot Password Success (`DmaVu`)**: Màn hình thông báo gửi email thành công
- **1.3. Email Template (`JMwWM`)**: Mẫu email reset password gửi đến tài xế & nhân sự

#### Danh sách màn hình trong `pens/DASHBOARDS.pen`:
- **1. Super Admin Overview (`wM9FR`)**: Báo cáo tài chính, 7 menu sidebar, biểu đồ doanh thu
- **2. Dispatcher Lệnh Điều Vận (`q2JXz3`)**: Quản lý 144 đơn hàng, TanStack table, nút Gửi Fleet
- **3. Fleet Manager Phân Xe (`Kpbq6`)**: Hàng đợi phân công, nút Báo hết xe (NO_VEHICLE) & Phân công xe
- **4. Warehouse Inbound Hub Kho (`UiZGP`)**: Lọc theo Hub Andromeda, lịch xe cập cảng (ETA) & Check-in

### 📦 3. File `pens/WAREHOUSE_FLOWS.pen` (Warehouse Hub Inbound & Lifecycle Flows)
- **1. Case 1: Mới hoàn toàn — Khách đưa vào kho (`WH_CASE_01`)**: Web Desktop 1440x980. Nhập tay thông tin xe/tài xế, địa chỉ nhận hàng Free-text, thanh công cụ Excel Ctrl+V & Import. **Vẽ rõ 3 cards chi tiết cho cột Địa chỉ giao hàng**: (1) Free text, (2) Dropdown Hub Cấp 1, (3) Dropdown Hub Cấp 2 ("Xe bo" KH/WT).
- **2. Case 2: Luân chuyển nội bộ — Từ Hub khác (`WH_CASE_02`)**: Web Desktop 1440x980. Thông tin xe khóa Readonly trích xuất từ TRIP_ID, Địa chỉ nhận hàng tự động điền (Auto-fill Readonly) từ Hub hiện tại, nút nổi bật `+ Thêm item trong lúc nhập hàng` bổ sung hàng phát sinh dọc đường.
- **3. Modal: Chọn đơn từ TRIP_ID (`WH_CASE_03_MODAL`)**: 1440x960. Tìm kiếm realtime theo mã Trip/biển số/tài xế, danh sách đơn thuộc trip `IN_TRANSIT` có checkbox multi-select.
- **4. In ấn: Phiếu nhập kho & Tem dán kiện pallet (`WH_CASE_04_PRINT`)**: 1440x960. Mẫu A4 Phiếu Nhập Kho mã `DDMMYY-xxxx` (chuẩn scan `mau_phieu_nhap_kho.JPG`) và Tem nhận diện kiện dán pallet định dạng ba chấm `... / 50 KIỆN HÀNG (TỔNG)`.


---

## 🛠️ Quy trình Làm việc với Pencil MCP
1. **Đọc trạng thái Canvas**: Sử dụng `get_app_state` hoặc `execute` với `Get(...)`.
2. **Convert từ Live Web**: Sử dụng `browser` tool hoặc Playwright E2E runner kết hợp `execute` layout.
3. **Chỉnh sửa / Bổ sung**: Sử dụng `execute` tool theo chuẩn pen schema.
4. **Xuất file**: Sử dụng `TakeScreenshot` hoặc `Export([nodeIds], format, "./pencil-workspace/exports")`.
