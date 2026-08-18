# RBAC Matrix — Logistics TMS

> **Nguồn sự thật duy nhất (Single Source of Truth)** cho phân quyền theo vai trò.
> Mọi agent khi implement hoặc review tính năng liên quan đến phân quyền **PHẢI** tham chiếu tài liệu này.

> [!IMPORTANT]
> **Tài liệu này là living document** — sẽ thay đổi theo thời gian khi có role mới, module mới, hoặc điều chỉnh nghiệp vụ.
> Mỗi khi thay đổi phân quyền trong code, **PHẢI** cập nhật file này ngay trong cùng commit/PR.
> Xem hướng dẫn cập nhật ở cuối tài liệu → [Hướng dẫn cập nhật](#hướng-dẫn-cập-nhật-tài-liệu)

| Trường | Giá trị |
|---|---|
| **Phiên bản** | v1.1 |
| **Cập nhật lần cuối** | 2026-08-18 |
| **Cập nhật bởi** | Antigravity (audit — fix DISPATCHER vào Phân công xe) |

---

## Danh sách Roles

| Role | Mô tả | ID (DB) |
|------|--------|---------|
| `SUPER_ADMIN` | Toàn quyền hệ thống | 1 |
| `DISPATCHER` | Điều phối viên — quản lý lệnh điều vận (orders) | 2 |
| `FLEET_MANAGER` | Quản lý đội xe — phân công xe, tài xế, chuyến (trips) | 3 |
| `WAREHOUSE_MANAGER` | Quản lý kho — nhận hàng inbound | 4 |

---

## Ma trận Menu Sidebar (Frontend)

> **File**: `frontend/src/config/nav-config.ts`

| Menu | URL | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|------|-----|:-----------:|:----------:|:-------------:|:-----------------:|
| Dashboard | `/dashboard/overview` | ✅ | ✅ | ✅ | ✅ |
| Lệnh điều vận | `/dashboard/orders` | ✅ | ✅ | ❌ | ❌ |
| Phân công xe | `/dashboard/trips` | ✅ | ❌ | ✅ | ❌ |
| Quản lý đội xe | `/dashboard/fleet` | ✅ | ❌ | ✅ | ❌ |
| Inbound Kho | `/dashboard/warehouse` | ✅ | ❌ | ❌ | ✅ |
| Users | `/dashboard/users` | ✅ | ❌ | ❌ | ❌ |
| Kanban | `/dashboard/kanban` | ✅ | ✅ | ✅ | ✅ |
| Chat | `/dashboard/chat` | ✅ | ✅ | ✅ | ✅ |
| AI Chat | `/dashboard/ai-chat` | ✅ | ✅ | ✅ | ✅ |

---

## Ma trận Route Guard (Next.js Middleware)

> **File**: `frontend/src/proxy.ts`
> Nếu role không hợp lệ → redirect về `/dashboard/overview`.

| Route Prefix | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/dashboard/admin` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/orders` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard/trips` | ✅ | ❌ | ✅ | ❌ |
| `/dashboard/fleet` | ✅ | ❌ | ✅ | ❌ |
| `/dashboard/warehouse` | ✅ | ❌ | ❌ | ✅ |
| Các route khác | ✅ | ✅ | ✅ | ✅ |

> **Lưu ý**: Route guard dùng prefix matching (`startsWith`). Thêm route mới phải cập nhật `roleRouteMap` trong `proxy.ts`.

---

## Ma trận API Endpoints (Backend NestJS)

### Orders Controller
> **File**: `backend/src/orders/orders.controller.ts`
> Nghiệp vụ: DISPATCHER tạo và quản lý lệnh điều vận. FLEET_MANAGER chỉ được `no-vehicle`.

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/orders` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/orders/:id` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/orders` | POST | ✅ | ✅ | ❌ | ❌ |
| `/v1/orders/:id` | PATCH | ✅ | ✅ | ❌ | ❌ |
| `/v1/orders/:id/submit` | PATCH | ✅ | ✅ | ❌ | ❌ |
| `/v1/orders/:id/no-vehicle` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/orders/:id` | DELETE | ✅ | ✅ | ❌ | ❌ |

---

### Trips Controller
> **File**: `backend/src/trips/trips.controller.ts`
> Nghiệp vụ: FLEET_MANAGER toàn quyền. DISPATCHER chỉ được **đọc** (GET).

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/trips` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/trips/:id` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/trips` | POST | ✅ | ❌ | ✅ | ❌ |
| `/v1/trips/split` | POST | ✅ | ❌ | ✅ | ❌ |
| `/v1/trips/:id` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/trips/:id/confirm` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/trips/:id` | DELETE | ✅ | ❌ | ✅ | ❌ |

---

### Vehicles Controller
> **File**: `backend/src/vehicles/vehicles.controller.ts`
> Nghiệp vụ: Dữ liệu xe do FLEET_MANAGER quản lý hoàn toàn.

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/vehicles` | GET | ✅ | ❌ | ✅ | ❌ |
| `/v1/vehicles/:id` | GET | ✅ | ❌ | ✅ | ❌ |
| `/v1/vehicles` | POST | ✅ | ❌ | ✅ | ❌ |
| `/v1/vehicles/:id` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/vehicles/:id` | DELETE | ✅ | ❌ | ✅ | ❌ |

---

### Drivers Controller
> **File**: `backend/src/drivers/drivers.controller.ts`
> Nghiệp vụ: Dữ liệu tài xế do FLEET_MANAGER quản lý hoàn toàn.

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/drivers` | GET | ✅ | ❌ | ✅ | ❌ |
| `/v1/drivers/:id` | GET | ✅ | ❌ | ✅ | ❌ |
| `/v1/drivers` | POST | ✅ | ❌ | ✅ | ❌ |
| `/v1/drivers/:id` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/drivers/:id` | DELETE | ✅ | ❌ | ✅ | ❌ |

---

### Notifications Controller
> **File**: `backend/src/notifications/notifications.controller.ts`
> Nghiệp vụ: Tất cả authenticated user đều có thể xem/đọc notification của chính mình.

| Endpoint | Method | Ghi chú |
|---|---|---|
| `/v1/notifications` | POST | JWT only — mọi role (internal trigger) |
| `/v1/notifications` | GET | JWT only — trả về notification của `req.user.id` |
| `/v1/notifications/unread-count` | GET | JWT only |
| `/v1/notifications/:id/read` | PATCH | JWT only |
| `/v1/notifications/read-all` | PATCH | JWT only |

---

### Users Controller
> **File**: `backend/src/users/users.controller.ts`
> Nghiệp vụ: Quản lý user chỉ dành cho SUPER_ADMIN.

| Endpoint | Method | SUPER_ADMIN | Các role khác |
|---|---|:-----------:|:-------------:|
| `/v1/users` | GET | ✅ | ❌ |
| `/v1/users/:id` | GET | ✅ | ❌ |
| `/v1/users` | POST | ✅ | ❌ |
| `/v1/users/:id` | PATCH | ✅ | ❌ |
| `/v1/users/:id` | DELETE | ✅ | ❌ |

---

## Quy tắc triển khai (Implementation Rules)

> **PHẢI tuân thủ** khi thêm endpoint hoặc menu mới:

### Rule 1 — 3-Layer Consistency
Luôn cập nhật cả 3 nơi cùng lúc khi thay đổi quyền:
- `frontend/src/config/nav-config.ts` → Sidebar UI
- `frontend/src/proxy.ts` → Route Guard (Next.js middleware)
- `backend/src/.../controller.ts` → API Guard (NestJS `@Roles`)

### Rule 2 — DISPATCHER không ghi vào Trips
DISPATCHER chỉ được **đọc** trips (GET) để theo dõi lệnh. Không được `POST`, `PATCH`, `DELETE`.

### Rule 3 — FLEET_MANAGER không ghi vào Orders
FLEET_MANAGER chỉ được **đọc** orders và `PATCH /orders/:id/no-vehicle`.
Không được tạo, sửa tổng thể, hoặc xóa orders.

### Rule 4 — GET endpoints mở hơn WRITE endpoints
Các endpoint GET thường không cần `@Roles` chặt chẽ vì mọi authenticated user cần đọc dữ liệu liên quan.
Tuy nhiên **bắt buộc** phải có `@UseGuards(AuthGuard('jwt'))`.

### Rule 5 — Khi thêm Controller mới
Đặt `@Roles` ở **class level** nếu toàn bộ controller dùng cùng role (xem `vehicles.controller.ts`).
Đặt `@Roles` ở **method level** nếu từng action có quyền khác nhau (xem `trips.controller.ts`).

### Rule 6 — Least Privilege
Chỉ cấp quyền tối thiểu cần thiết cho nghiệp vụ.
Khi không chắc → tham chiếu skill `tms-domain-lead` trước khi implement.

---

## Hướng dẫn cập nhật tài liệu

> Áp dụng khi: thêm role mới, thêm module/controller mới, thay đổi nghiệp vụ phân quyền.

### Khi nào cần cập nhật?

| Sự kiện | Action |
|---|---|
| Thêm menu mới vào sidebar | Cập nhật bảng **Menu Sidebar** |
| Thêm route mới vào `proxy.ts` | Cập nhật bảng **Route Guard** |
| Thêm controller / endpoint mới | Cập nhật bảng **API Endpoints** |
| Thêm role mới vào hệ thống | Cập nhật **Danh sách Roles** + toàn bộ 3 bảng ma trận |
| Thay đổi quyền của endpoint hiện có | Cập nhật ô tương ứng trong bảng |
| Xóa endpoint / menu | Xóa dòng tương ứng khỏi bảng |

### Quy trình cập nhật (dành cho agent)

1. **Thực hiện thay đổi code** (controller, nav-config, proxy.ts) theo Rule 1 — 3-Layer Consistency.
2. **Cập nhật bảng ma trận** tương ứng trong file này.
3. **Cập nhật metadata** ở đầu tài liệu:
   - Tăng số phiên bản (`v1.1` → `v1.2`, hoặc `v1.x` → `v2.0` nếu thay đổi lớn)
   - Cập nhật ngày `Cập nhật lần cuối`
   - Ghi rõ lý do thay đổi ở `Cập nhật bởi`
4. **Ghi vào Changelog** bên dưới với format chuẩn.
5. Nếu có rule nghiệp vụ mới phát sinh → thêm **Rule mới** vào mục "Quy tắc triển khai".

### Quy ước đánh phiên bản

| Loại thay đổi | Phiên bản |
|---|---|
| Sửa lỗi phân quyền nhỏ, thêm endpoint đơn lẻ | `v1.x → v1.x+1` (patch) |
| Thêm module/controller mới hoàn chỉnh | `v1.x → v1.(x+1)` (minor) |
| Thêm role mới, tái cấu trúc toàn bộ ma trận | `v1.x → v2.0` (major) |

---

## Changelog

### v1.1 — 2026-08-18
**Sửa lỗi**: DISPATCHER bị cấp nhầm quyền vào module Trips.
- `nav-config.ts`: Xóa `DISPATCHER` khỏi menu "Phân công xe"
- `proxy.ts`: Xóa `DISPATCHER` khỏi route guard `/dashboard/trips`
- `trips.controller.ts`: Xóa `DISPATCHER` khỏi `POST /trips` và `PATCH /trips/:id`

### v1.0 — 2026-08-18
**Khởi tạo**: Tạo tài liệu RBAC Matrix lần đầu từ audit codebase.
- Ghi nhận toàn bộ phân quyền hiện tại của 6 controllers: Orders, Trips, Vehicles, Drivers, Notifications, Users.
- Thiết lập 6 Implementation Rules.

