# RBAC Matrix — Logistics TMS

> **Nguồn sự thật duy nhất (Single Source of Truth)** cho phân quyền theo vai trò.
> Mọi agent khi implement hoặc review tính năng liên quan đến phân quyền **PHẢI** tham chiếu tài liệu này.

> [!IMPORTANT]
> **Tài liệu này là living document** — sẽ thay đổi theo thời gian khi có role mới, module mới, hoặc điều chỉnh nghiệp vụ.
> Mỗi khi thay đổi phân quyền trong code, **PHẢI** cập nhật file này ngay trong cùng commit/PR.
> Xem hướng dẫn cập nhật ở cuối tài liệu → [Hướng dẫn cập nhật](#hướng-dẫn-cập-nhật-tài-liệu)

| Trường | Giá trị |
|---|---|
| **Phiên bản** | v1.7 |
| **Cập nhật lần cuối** | 2026-10-05 |
| **Cập nhật bởi** | Antigravity (Fix: Bảng chuyến xe xuất kho theo chuyến) |

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

| Nhóm | Menu | URL | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| *(không nhãn – top-level)* | Dashboard | `/dashboard/overview` | ✅ | ✅ | ✅ | ❌ |
| **Vận hành TMS** | Lệnh điều vận | `/dashboard/orders` | ✅ | ✅ | ❌ | ❌ |
| **Vận hành TMS** | Phân công xe | `/dashboard/trips` | ✅ | ❌ | ✅ | ❌ |
| **Vận hành TMS** | Quản lý đội xe | `/dashboard/fleet` | ✅ | ❌ | ✅ | ❌ |
| **Vận hành TMS** | Nhập kho | `/dashboard/warehouse/inbound` | ✅ | ❌ | ❌ | ✅ |
| **Vận hành TMS** | Xuất kho | `/dashboard/warehouse/outbound` | ✅ | ❌ | ❌ | ✅ |
| **Vận hành TMS** | Đơn hàng kho | `/dashboard/warehouse/orders` | ✅ | ❌ | ❌ | ✅ |
| **Quản trị hệ thống** | Chi Nhánh Kho (Hubs) | `/dashboard/admin/hubs` | ✅ | ❌ | ❌ | ❌ |
| **Quản trị hệ thống** | Người dùng | `/dashboard/users` | ✅ | ❌ | ❌ | ❌ |

> `WAREHOUSE_MANAGER` chỉ thấy đúng 3 trang kho (hard filter trong `frontend/src/hooks/use-nav.ts`).
> Nhóm demo "Không gian làm việc" (Kanban, Chat, AI Chat) và "Elements" đã bị gỡ khỏi sidebar (04/10); route mẫu vẫn còn trong source để tham khảo.

---

## Ma trận Route Guard (Next.js Middleware)

> **File**: `frontend/src/proxy.ts`
> Nếu role không hợp lệ → redirect về `/dashboard/overview`.

| Route Prefix | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/dashboard/admin` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/users` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/orders` | ✅ | ✅ | ✅ *(Read-Only)* | ✅ *(Read-Only)* |
| `/dashboard/trips` | ✅ | ❌ | ✅ | ❌ |
| `/dashboard/fleet` | ✅ | ❌ | ✅ | ❌ |
| `/dashboard/warehouse` | ✅ | ❌ | ❌ | ✅ |
| Các route khác | ✅ | ✅ | ✅ | ✅ |

> **Lưu ý**: 
> - Route guard dùng prefix matching (`startsWith`). Thêm route mới phải cập nhật `roleRouteMap` trong `proxy.ts`.
> - Route `/dashboard/orders` mở cho cả 4 vai trò để xem chi tiết đơn hàng (từ thông báo, liên kết deep-link). `FLEET_MANAGER` và `WAREHOUSE_MANAGER` xem ở chế độ **Read-Only**, các nút thao tác nghiệp vụ (sửa, xóa, gửi fleet, điều xe ngoài) tự động ẩn. Menu sidebar chỉ mở cho `SUPER_ADMIN` và `DISPATCHER`.

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
| `/v1/orders/:id` | PATCH | ✅ | ✅ *(Chỉ sửa hợp đồng khi DRAFT)* | ❌ | ❌ |
| `/v1/orders/:id/ledger` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/orders/:id/admin-override` | PATCH | ✅ *(Bắt buộc `auditReason`, ghi phiếu DCH)* | ❌ | ❌ | ❌ |
| `/v1/orders/:id/submit` | PATCH | ✅ | ✅ | ❌ | ❌ |
| `/v1/orders/:id/no-vehicle` | PATCH | ✅ | ❌ | ✅ | ❌ |
| `/v1/orders/:id` | DELETE | ✅ | ✅ | ❌ | ✅ *(Chỉ xóa đơn DRAFT)* |

> **Hợp đồng gốc bất biến**: Sau trạng thái DRAFT, mọi thay đổi trường hợp đồng (`totalQuantity/Weight/Volume`, kho đi/đến, địa chỉ, tên hàng...) qua `PATCH /orders/:id` đều bị chặn 403 — kể cả SUPER_ADMIN. SUPER_ADMIN chỉ điều chỉnh qua `PATCH /orders/:id/admin-override`.
> Frontend: nút "Điều chỉnh hợp đồng gốc" trên trang chi tiết đơn chỉ hiện với `isSuperAdmin`; nút "Sửa" chỉ hiện khi đơn ở DRAFT.

---

### Warehouse Controller
> **File**: `backend/src/orders/warehouse.controller.ts`
> Nghiệp vụ: WAREHOUSE_MANAGER nhập/xuất kho theo phạm vi kho được gán (`user.hubId`). Bảng kê chuyến mở đọc cho các vai trò vận hành.

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/warehouse/orders` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/warehouse/kpi` | GET | ✅ | ❌ | ❌ | ✅ |
| `/v1/warehouse/inbound-trips` | GET | ✅ | ❌ | ❌ | ✅ |
| `/v1/warehouse/outbound-trips` | GET | ✅ | ❌ | ❌ | ✅ *(Chỉ chuyến xuất từ kho được gán)* |
| `/v1/warehouse/trips/:tripCode/manifest` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/warehouse/inbound/quick-create` | POST | ✅ | ❌ | ❌ | ✅ |
| `/v1/warehouse/inbound/batch-create` | POST | ✅ | ❌ | ❌ | ✅ |
| `/v1/warehouse/inbound/confirm` | POST | ✅ | ❌ | ❌ | ✅ *(Kiểm đếm chọn lọc, ghi phiếu PNK)* |
| `/v1/warehouse/outbound/confirm` | POST | ✅ | ❌ | ❌ | ✅ *(Ghi phiếu PXK / PGH; `draftTripCode` = xác nhận chuyến nháp)* |
| `/v1/warehouse/outbound/draft` | POST | ✅ | ❌ | ❌ | ✅ *(Lưu nháp chuyến xuất — cấp mã SD, chưa trừ tồn)* |
| `/v1/warehouse/outbound/drafts/:tripCode` | DELETE | ✅ | ❌ | ❌ | ✅ *(Hủy nháp — chỉ nháp của kho được gán)* |

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

### Hubs Controller
> **File**: `backend/src/hubs/hubs.controller.ts`
> Nghiệp vụ: Quản lý Chi Nhánh Kho chỉ dành cho SUPER_ADMIN. Các role khác có quyền Đọc để chọn kho.

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|
| `/v1/hubs` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/hubs/active` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/hubs/:id` | GET | ✅ | ✅ | ✅ | ✅ |
| `/v1/hubs` | POST | ✅ | ❌ | ❌ | ❌ |
| `/v1/hubs/:id` | PATCH | ✅ | ❌ | ❌ | ❌ |
| `/v1/hubs/:id/toggle-active` | PATCH | ✅ | ❌ | ❌ | ❌ |
| `/v1/hubs/:id` | DELETE | ✅ | ❌ | ❌ | ❌ |

---

### Mail & Health Controller
> **Files**: `backend/src/mail/mail.controller.ts`, `backend/src/home/home.controller.ts`

| Endpoint | Method | SUPER_ADMIN | DISPATCHER | FLEET_MANAGER | WAREHOUSE_MANAGER | Ghi chú |
|---|---|:-----------:|:----------:|:-------------:|:-----------------:|---|
| `/health` | GET | ✅ | ✅ | ✅ | ✅ | Public (Uptime / Health check) |
| `/v1/mail/queue-status` | GET | ✅ | ❌ | ❌ | ❌ | SUPER_ADMIN only — Giám sát Redis/BullMQ |
| `/v1/mail/queue-clean` | POST | ✅ | ❌ | ❌ | ❌ | SUPER_ADMIN only — Dọn dẹp Redis |
| `/v1/mail/test-send` | POST | ✅ | ✅ | ❌ | ❌ | JWT + Roles Guard |

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

### Rule 7 — WAREHOUSE_MANAGER Hub Assignment
- Mỗi tài khoản `WAREHOUSE_MANAGER` **nên được gán vào đúng 1 Hub** (kho vận) cụ thể.
- Gán hub thực hiện qua field `hub: { id: number }` khi tạo/cập nhật user trong `POST /v1/users` và `PATCH /v1/users/:id`.
- Hub assignment là **optional** (nullable): WM không có hub vẫn hợp lệ — SUPER_ADMIN tự gán sau.
- Một Hub có thể có **nhiều tài khoản WM** (quan hệ 1 Hub : N Users).
- Các role khác (DISPATCHER, FLEET_MANAGER) **không được gán hub** — backend không validate nhưng form frontend ẩn field này.
- Khi Hub bị xóa mềm: `hubId` của user **SET NULL** (ON DELETE SET NULL) — user không bị ảnh hưởng.

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

### v1.7 — 2026-10-05
**Fix: Phiếu xuất nháp thật (feedback người dùng 05/10)**:
- Thêm `POST /v1/warehouse/outbound/draft` và `DELETE /v1/warehouse/outbound/drafts/:tripCode` (SUPER_ADMIN, WAREHOUSE_MANAGER — WM chỉ thao tác nháp của kho được gán).
- `GET /v1/warehouse/outbound-trips` thêm tham số `status` (`PENDING` = Chờ xử lý / `COMPLETED` = Đã xử lý). Sidebar/Route không đổi.

### v1.6 — 2026-10-05
**Fix: Bảng chuyến xe xuất kho theo chuyến (feedback 05/10)**:
- Thêm `GET /v1/warehouse/outbound-trips` (SUPER_ADMIN, WAREHOUSE_MANAGER — WM chỉ thấy chuyến xuất từ kho được gán). Sidebar/Route không đổi.

### v1.5 — 2026-10-04
**Feature: Hợp đồng gốc bất biến & Bảng kê chuyến theo kho** (branch `feature/orders-master-contract`):
- Thêm `GET /v1/orders/:id/ledger` (mọi vai trò đã đăng nhập) — sổ phiếu PNK/PXK/PGH/DCH của đơn.
- Thêm `PATCH /v1/orders/:id/admin-override` (chỉ SUPER_ADMIN, bắt buộc `auditReason`).
- `PATCH /v1/orders/:id`: chặn 403 sửa trường hợp đồng sau DRAFT cho mọi vai trò.
- Thêm `GET /v1/warehouse/trips/:tripCode/manifest` (SUPER_ADMIN, DISPATCHER, FLEET_MANAGER, WAREHOUSE_MANAGER).
- Bổ sung bảng Warehouse Controller vào ma trận API.
- Frontend: nút "Điều chỉnh hợp đồng gốc" chỉ hiện với SUPER_ADMIN; Route/Sidebar không đổi.

### v1.4 — 2026-08-20
**Feature: Gán Hub cho WAREHOUSE_MANAGER**:
- `user.entity.ts`: Thêm cột `hubId` (nullable FK → `hub.id`) và quan hệ `ManyToOne → HubEntity`.
- `create-user.dto.ts` / `update-user.dto.ts`: Thêm field `hub?: { id: number } | null` (optional).
- `users.service.ts`: Validate hub tồn tại trước khi gán; cập nhật `create()` và `update()`.
- `users.module.ts`: Đăng ký `TypeOrmModule.forFeature([HubEntity])`.
- `user-form-sheet.tsx` (frontend): Hiển thị dropdown Hub khi role = WAREHOUSE_MANAGER (lazy fetch).
- Migration DB: `1786938800000-AddHubIdToUser.ts` — thêm cột nullable, ON DELETE SET NULL.
- Thêm **Rule 7**: Hub Assignment cho WAREHOUSE_MANAGER.

### v1.3 — 2026-08-18
**Tái cấu trúc UX/UI & Phân nhóm Sidebar**:
- `nav-config.ts`: Gom nhóm lại thành 5 nhóm chức năng (Overview, Vận hành TMS, Quản trị hệ thống, Không gian làm việc, Elements, Account). Chuyển `Product Table` vào nhóm `Elements`.
- `proxy.ts`: Thêm route guard `/dashboard/users` bảo vệ cho `SUPER_ADMIN`.
- Cập nhật tài liệu Ma trận Menu Sidebar theo nhóm mới.

### v1.2 — 2026-08-18
**Tính năng mới**: Module Hubs (Chi Nhánh Kho) cho Super Admin.
- `nav-config.ts`: Thêm menu "Chi Nhánh Kho (Hubs)" (`/dashboard/admin/hubs`) cho `SUPER_ADMIN`.
- `proxy.ts`: Xác nhận route guard `/dashboard/admin` bảo vệ cho `SUPER_ADMIN`.
- `hubs.controller.ts`: Phân quyền `SUPER_ADMIN` cho Write, mở GET cho authenticated users.

### v1.1 — 2026-08-18
**Sửa lỗi**: DISPATCHER bị cấp nhầm quyền vào module Trips.
- `nav-config.ts`: Xóa `DISPATCHER` khỏi menu "Phân công xe"
- `proxy.ts`: Xóa `DISPATCHER` khỏi route guard `/dashboard/trips`
- `trips.controller.ts`: Xóa `DISPATCHER` khỏi `POST /trips` và `PATCH /trips/:id`

### v1.0 — 2026-08-18
**Khởi tạo**: Tạo tài liệu RBAC Matrix lần đầu từ audit codebase.
- Ghi nhận toàn bộ phân quyền hiện tại của 6 controllers: Orders, Trips, Vehicles, Drivers, Notifications, Users.
- Thiết lập 6 Implementation Rules.

