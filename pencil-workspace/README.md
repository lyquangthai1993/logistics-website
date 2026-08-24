# 📐 Pencil Workspace - Logistics TMS

Thư mục làm việc tập trung cho các tài nguyên thiết kế UI/UX, file `.pen`, assets và xuất file đồ họa thông qua Pencil MCP.

---

## 📁 Cấu trúc Thư mục

```text
pencil-workspace/
├── README.md               # Hướng dẫn cấu trúc & quy ước làm việc
├── UI_UX.pen               # File thiết kế chính (Pencil Infinite Canvas)
├── assets/                 # Hình ảnh, icon, texture phụ trợ cho thiết kế
│   └── auth-hero.jpg       # Ảnh nền Hero Cyber Logistics
└── exports/                # Thư mục chứa các file chụp và xuất đồ họa
    ├── 01-super-admin-overview.png
    ├── 02-dispatcher-orders.png
    ├── 03-fleet-manager-trips.png
    └── 04-warehouse-manager-inbound.png
```

---

## 🖥️ Danh sách Màn hình Full Scale (1440x900px) trong `UI_UX.pen`

### 1. `Logistics TMS - Auth Sign In` (`gh4zM`)
- **Tọa độ**: `x: 0, y: 0`
- **Mô tả**: Tái hiện 1:1 giao diện đăng nhập chuẩn Next.js (`http://localhost:3000/auth/sign-in`).

### 2. `1. SUPER_ADMIN — Dashboard Overview (1440x900)` (`wM9FR`)
- **Tọa độ**: `x: 1600, y: 0`
- **Mô tả**: Màn hình toàn diện sau khi Super Admin đăng nhập (`/dashboard/overview`) với 7 nhóm menu Sidebar, thẻ KPI hệ thống ($1,250.00 Doanh thu, 45,678 tài khoản) và biểu đồ phân tích.

### 3. `2. DISPATCHER — Lập Lệnh Điều Vận (1440x900)` (`q2JXz3`)
- **Tọa độ**: `x: 3150, y: 0`
- **Mô tả**: Màn hình không gian làm việc của Điều Phối Viên (`/dashboard/orders`), hiển thị 144 đơn hàng, nút `+ Tạo lệnh điều vận mới`, bảng TanStack Data Table với các nút hành động `Gửi Fleet` và `Xe ngoài 3PL`.

### 4. `3. FLEET_MANAGER — Phân Công Xe & Chuyến (1440x900)` (`Kpbq6`)
- **Tọa độ**: `x: 4700, y: 0`
- **Mô tả**: Màn hình tiếp nhận lệnh và điều phối chuyến của Quản Lý Đội Xe (`/dashboard/trips`), hiển thị 51 đơn chờ phân xe, danh sách hàng với nút `⚠️ Báo hết xe` (gán `NO_VEHICLE`) và `🚛 Phân công xe`.

### 5. `4. WAREHOUSE_MANAGER — Inbound Hub Kho (1440x900)` (`UiZGP`)
- **Tọa độ**: `x: 6250, y: 0`
- **Mô tả**: Màn hình bảng điều độ hàng đến của Quản Lý Kho (`/dashboard/warehouse`), lọc theo Hub được gán (Andromeda Hub), nút `Quét Barcode / Nhận hàng`, lịch xe đến (ETA) và xác nhận kiện hàng nhập kho.

---

## 🛠️ Quy trình Làm việc với Pencil MCP
1. **Đọc trạng thái Canvas**: Sử dụng `get_app_state` hoặc `execute` với `Get(...)`.
2. **Convert từ Live Web**: Sử dụng `browser` tool hoặc Playwright E2E runner kết hợp `execute` layout.
3. **Chỉnh sửa / Bổ sung**: Sử dụng `execute` tool theo chuẩn pen schema.
4. **Xuất file**: Sử dụng `TakeScreenshot` hoặc `Export([nodeIds], format, "./pencil-workspace/exports")`.
