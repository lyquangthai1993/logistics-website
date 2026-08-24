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

### 🔐 ROW 1: AUTHENTICATION & ACCESS CONTROL
#### 1. `Logistics TMS - Auth Sign In (1440x900)` (`gh4zM`)
- **Tọa độ**: `x: 0, y: 0`
- **Mô tả**: Giao diện đăng nhập chuẩn Next.js (`/auth/sign-in`), tích hợp nút CTA `Quên mật khẩu? →` dẫn trực tiếp tới luồng khôi phục tài khoản.

#### 1.1. `Logistics TMS - Forgot Password (1440x900)` (`KQv4r`)
- **Tọa độ**: `x: 1550, y: 0` (Đặt cạnh phải Login Frame trên cùng hàng Auth)
- **Mô tả**: Màn hình Quên mật khẩu / Khôi phục tài khoản (Trạng thái nhập form) với xác thực bảo mật OTP 2FA, trường nhập Email Doanh nghiệp, nút gửi liên kết khôi phục và nút quay lại trang Đăng nhập.

#### 1.2. `Logistics TMS - Forgot Password (Success State)` (`DmaVu`)
- **Tọa độ**: `x: 3100, y: 0` (Đặt cạnh Forgot Password Form trên hàng Auth)
- **Mô tả**: Màn hình hiển thị trạng thái khi đã gửi yêu cầu khôi phục thành công, bao gồm Thẻ Alert màu xanh ngọc (Emerald `#f0fdf4`), Huy hiệu checkmark thành công, địa chỉ email đã gửi `dispatcher@spiderexpress.vn`, hướng dẫn kiểm tra hòm thư và duy nhất 1 nút CTA chính `← Quay lại trang đăng nhập`.

#### 1.3. `Logistics TMS - Email Template: Forgot & Reset Password (1440x900)` (`JMwWM`)
- **Tọa độ**: `x: 4650, y: 0` (Đặt ở cuối hàng Auth & Security)
- **Mô tả**: Khung thiết kế Vector Canvas hiển thị bản mẫu Email Thông báo Khôi phục mật khẩu gửi đến người dùng, bao gồm Header Dark Navy/Cyan nhận diện Spider Express TMS, Thẻ tài khoản & TTL 15 phút, Nút CTA Đặt lại mật khẩu, Hộp cảnh báo an toàn & Chống giả mạo, Khối liên kết fallback sạch và Hotline Hỗ trợ Điều vận 1900-SPIDER.

---

### 📊 ROW 2: TMS OPERATIONAL DASHBOARDS (RBAC MATRIX)
#### 2. `1. SUPER_ADMIN — Dashboard Overview (1440x900)` (`wM9FR`)
- **Tọa độ**: `x: 0, y: 1050`
- **Mô tả**: Màn hình toàn diện sau khi Super Admin đăng nhập (`/dashboard/overview`) với 7 nhóm menu Sidebar, thẻ KPI hệ thống ($1,250.00 Doanh thu, 45,678 tài khoản) và biểu đồ phân tích.

#### 3. `2. DISPATCHER — Lập Lệnh Điều Vận (1440x900)` (`q2JXz3`)
- **Tọa độ**: `x: 1550, y: 1050`
- **Mô tả**: Màn hình không gian làm việc của Điều Phối Viên (`/dashboard/orders`), hiển thị 144 đơn hàng, nút `+ Tạo lệnh điều vận mới`, bảng TanStack Data Table với các nút hành động `Gửi Fleet` và `Xe ngoài 3PL`.

#### 4. `3. FLEET_MANAGER — Phân Công Xe & Chuyến (1440x900)` (`Kpbq6`)
- **Tọa độ**: `x: 3100, y: 1050`
- **Mô tả**: Màn hình tiếp nhận lệnh và điều phối chuyến của Quản Lý Đội Xe (`/dashboard/trips`), hiển thị 51 đơn chờ phân xe, danh sách hàng với nút `⚠️ Báo hết xe` (gán `NO_VEHICLE`) và `🚛 Phân công xe`.

#### 5. `4. WAREHOUSE_MANAGER — Inbound Hub Kho (1440x900)` (`UiZGP`)
- **Tọa độ**: `x: 4650, y: 1050`
- **Mô tả**: Màn hình bảng điều độ hàng đến của Quản Lý Kho (`/dashboard/warehouse`), lọc theo Hub được gán (Andromeda Hub), nút `Quét Barcode / Nhận hàng`, lịch xe đến (ETA) và xác nhận kiện hàng nhập kho.


---

## 🛠️ Quy trình Làm việc với Pencil MCP
1. **Đọc trạng thái Canvas**: Sử dụng `get_app_state` hoặc `execute` với `Get(...)`.
2. **Convert từ Live Web**: Sử dụng `browser` tool hoặc Playwright E2E runner kết hợp `execute` layout.
3. **Chỉnh sửa / Bổ sung**: Sử dụng `execute` tool theo chuẩn pen schema.
4. **Xuất file**: Sử dụng `TakeScreenshot` hoặc `Export([nodeIds], format, "./pencil-workspace/exports")`.
