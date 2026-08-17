# 📋 LOGISTICS TMS — BIÊN BẢN KIỂM TRA SOURCE BASE

> **Tài liệu sống**: File này được cập nhật mỗi khi có module/nghiệp vụ mới được triển khai.
> Dùng skill `codebase-auditor` để cập nhật tự động.

---

## 📌 Thông tin biên bản

| Trường | Giá trị |
|---|---|
| **Phiên bản** | v0.5.0 |
| **Ngày audit** | 2026-08-17 |
| **Người thực hiện** | Antigravity Agent |
| **Môi trường** | Development / Staging |

---

## 🗂️ CHANGELOG PHIÊN BẢN

### v0.5.0 — 2026-08-17
- ✅ Backend Module `orders`: Entity `Order`, 7 endpoints (Tạo mới, danh sách lọc tuyến/trạng thái, chi tiết, cập nhật, submit lên Fleet, báo hết xe, xóa), bắt buộc `externalNote` khi yêu cầu xe ngoài
- ✅ Backend Module `trips`: Entity `Trip`, 6 endpoints (Gán xe đơn lẻ, chia chuyến Split Shipment, danh sách lọc hub/trạng thái, xác nhận chuyến Trip, cập nhật, xóa)
- ✅ TypeORM Migrations: `1786938300000-CreateOrderAndTripTables` & `1786938400000-AddExternalNoteToOrder` đã chạy trên database
- ✅ Backend Realtime & Mail: Tự động gửi In-app Notifications và Email (`trip-confirmed.hbs`) đến các bên liên quan khi Fleet Manager xác nhận chuyến xe
- ✅ Frontend Pages:
  - `/dashboard/orders`: Lập lệnh điều vận, nhập mô tả/ghi chú đa dòng (`Textarea`), modal yêu cầu xe ngoài bắt buộc ghi nhận lý do, gửi lệnh lên Đội xe
  - `/dashboard/orders/[id]`: Trang chi tiết đơn hàng trực quan
  - `/dashboard/trips`: Bảng điều phối chuyến xe, đồng hồ đo tải trọng trọng lượng/thể tích, chia đơn đa chuyến (Split shipment), xác nhận chuyến xe
  - `/dashboard/warehouse`: Inbound Hub & Kho Tiếp Nhận lọc chuyến xe theo hub đến
- ✅ Frontend Navigation: Cập nhật `nav-config.ts` gắn badge và phân quyền menu theo vai trò DISPATCHER, FLEET_MANAGER, WAREHOUSE_MANAGER
- ✅ E2E Testing & User Manual:
  - `frontend/e2e/06-order-dispatch-workflow.spec.ts`: Kiểm thử toàn trình liên tục qua 3 vai trò thành công 100%
  - `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`: Tự động chụp 13 ảnh HD theo luồng thao tác thực tế
  - `docs/user-guide/USER_MANUAL_HUONG_DAN_SU_DUNG.md`: Tài liệu hướng dẫn sử dụng chi tiết có hình ảnh minh họa

### v0.4.1 — 2026-08-17
- ✅ Backend: Thêm cột `username` (`UNIQUE`, `INDEX`) vào bảng `user` qua TypeORM Migration `1786938500000-AddUsernameToUser`
- ✅ Backend Auth & Users: Cập nhật `AuthService.validateLogin` & `UserRepository` cho phép đăng nhập linh hoạt bằng cả **Email** hoặc **Username**
- ✅ Backend Seed Data: Cập nhật `UserSeedService` sang dạng email số `lyquangthai1993+<x>@gmail.com` (`lyquangthai1993+1@gmail.com`..`+4`) cùng `username` tương ứng cho 4 vai trò
- ✅ Frontend: Cập nhật `LoginForm` nhận Email hoặc Username (input text, autocomplete `username`), cập nhật bảng Demo Accounts hiển thị & copy linh hoạt cả username lẫn email
- ✅ Testing: Cập nhật `TEST_USERS` trong E2E test suite và sửa lỗi mock testing cho `MailService`

### v0.4.0 — 2026-08-17
- ✅ Backend: Module `notifications` (Entity `Notification`, DB Table `notification`, REST API 5 endpoints: Tạo mới, danh sách phân trang, đếm chưa đọc, đánh dấu đọc 1/tất cả)
- ✅ Realtime WebSocket: `NotificationsGateway` (Socket.IO namespace `notifications`, JWT handshake auth, per-user room routing `user:${userId}`, push event `notification:new`)
- ✅ Migration: `1786938200000-CreateNotificationTable` (Tạo bảng `notification` + composite indexes `IDX_notification_userId`, `IDX_notification_userId_isRead`)
- ✅ Frontend Realtime: Hook `useNotificationSocket` kết nối Socket.IO qua JWT auth, tự động invalidate TanStack Query cache & hiển thị toast Sonner
- ✅ Frontend API Layer: Bộ hooks TanStack Query v5 (`useNotificationsQuery`, `useUnreadCountQuery`, `useMarkAsReadMutation`, `useMarkAllAsReadMutation`)
- ✅ Component: `NotificationCenter` (badge realtime + dropdown danh sách) & `NotificationsPage`
- ✅ Skills & Rules: Bổ sung bộ agent skills chuyên sâu (BullMQ/Redis, JWT/RBAC, TanStack Query, Zustand, Shadcn UI, Security rules, Codebase Auditor)

### v0.3.1 — 2026-08-17
- ✅ Backend: Mở rộng module `mail` thêm REST endpoints (`/api/v1/mail/send/dispatcher`, `fleet`, `warehouse`, `generic`) bảo mật RBAC với DTO validation & Swagger
- ✅ Handlebars templates: Bổ sung 4 mẫu email thông báo chuyên biệt cho Dispatcher, Fleet Manager, Warehouse Manager và Generic alert
- ✅ Development Fallback: Cấu hình `MailerService` tự động chuyển sang chế độ Dev Simulation khi mất kết nối SMTP, tránh lỗi HTTP 500 khi dev local
- ✅ Unit tests: Bổ sung `mail.controller.spec.ts` và `mail.service.spec.ts`
- ✅ Kiến trúc & Workflow: Tạo `docs/order-dispatch-workflow-plan.md` thiết kế chi tiết quy trình Order & Dispatch Management (Phân công xe, Split shipment, Inbound warehouse board)
- ✅ Agent Skills: Đăng ký skill `codebase-auditor` tự động rà soát và cập nhật biên bản kiểm tra source base

### v0.3.0 — 2026-08-17
- ✅ Hoàn thiện module `vehicles` + `drivers` (Fleet Management)
- ✅ Migration `CreateFleetTables` đã chạy trên production DB
- ✅ Frontend: `/dashboard/fleet` page (CRUD xe & tài xế)
- ✅ Middleware RBAC mở rộng: thêm guard cho `/dashboard/orders`, `/dashboard/trips`, `/dashboard/warehouse`
- ✅ File upload: thêm audit columns (`createdAt`, `updatedAt`, `deletedAt`, `createdBy`) vào bảng `file`
- ✅ Role entity mở rộng: thêm `displayName`, `description`
- ✅ Deploy: Backend → Render, Frontend → Vercel

### v0.2.0 — (trước 2026-08-17)
- ✅ Khởi tạo full authentication flow (JWT + Refresh Token + Cookie)
- ✅ Social login: Google, Facebook, Apple
- ✅ Module `users` CRUD (SUPER_ADMIN)
- ✅ Module `files` upload (Local/S3/S3-Presigned)
- ✅ Module `session` quản lý phiên đăng nhập
- ✅ Module `mail` / `mailer` (Nodemailer + Handlebars templates)
- ✅ Frontend: Dashboard overview, Product, Users, Kanban, Chat, AI Chat, Notifications, Profile
- ✅ DB Seeds: 4 roles, 2 statuses, admin user, mẫu vehicles & drivers

### v0.1.0 — (khởi tạo project)
- ✅ NestJS boilerplate + TypeORM + PostgreSQL (Neon Cloud)
- ✅ Next.js App Router + Tailwind CSS v4 + TanStack Query v5 + Zustand v5
- ✅ RBAC 4 vai trò: `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`
- ✅ Migration khởi tạo: bảng `role`, `status`, `file`, `user`, `session`

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

| Layer | Stack |
|---|---|
| **Backend** | NestJS 11, TypeORM, PostgreSQL (Neon), Custom JWT, Socket.IO WebSockets, Swagger, Nodemailer |
| **Frontend** | Next.js 16.2, React 19, Tailwind CSS v4, TanStack Query v5, Zustand v5, Socket.IO Client |
| **Auth** | JWT Access + Refresh Token (HTTP-only cookie), Middleware RBAC 2 lớp |
| **Deploy** | Frontend → Vercel, Backend → Render |
| **Monitoring** | Sentry (Frontend) |

---

## 🔐 HỆ THỐNG PHÂN QUYỀN (RBAC)

| ID | Role | Mô tả nghiệp vụ |
|---|---|---|
| 1 | `SUPER_ADMIN` | Toàn quyền hệ thống |
| 2 | `DISPATCHER` | Tiếp nhận đơn, gom hàng, lập chuyến xe |
| 3 | `FLEET_MANAGER` | Quản lý xe, tài xế, phê duyệt chuyến |
| 4 | `WAREHOUSE_MANAGER` | Xác nhận Inbound/Outbound tại hub |

### Route Guard Map (Frontend Middleware):
| Route | Roles |
|---|---|
| `/dashboard/admin` | `SUPER_ADMIN` |
| `/dashboard/orders` | `SUPER_ADMIN`, `DISPATCHER` |
| `/dashboard/trips` | `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER` |
| `/dashboard/fleet` | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `/dashboard/warehouse` | `SUPER_ADMIN`, `WAREHOUSE_MANAGER` |

---

## 🟦 BACKEND — MODULES & DB TABLES

### ✅ Modules đã có

| Module | DB Table | Endpoints | Roles |
|---|---|---|---|
| `orders` | `order` | 7 endpoints (Tạo mới, danh sách, chi tiết, cập nhật, gửi Fleet, báo hết xe, xóa) | `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER` |
| `trips` | `trip` | 6 endpoints (Gán xe, chia chuyến split, danh sách, chi tiết, cập nhật, xác nhận, xóa) | `SUPER_ADMIN`, `FLEET_MANAGER`, `DISPATCHER` |
| `auth` | `session` | 10 endpoints (login, register, confirm, forgot/reset, me, refresh, logout) | All |
| `auth-google/facebook/apple` | — | 3 endpoints social login | Public |
| `users` | `user` | CRUD + Pagination | `SUPER_ADMIN` |
| `vehicles` | `vehicle` | CRUD full | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `drivers` | `driver` | CRUD full | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `notifications` | `notification` | 5 endpoints (CRUD, unread count, mark read) + WebSocket Gateway (`/notifications`) | JWT required (All roles) |
| `files` | `file` | Upload (Local/S3/Presigned) + Serve | JWT required |
| `session` | `session` | Internal (auth only) | — |
| `roles` | `role` | DB Seed only | — |
| `statuses` | `status` | DB Seed only | — |
| `mail`/`mailer` | — | 4 REST endpoints (`/api/v1/mail/send/*`) | `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER` |
| `home` | — | `GET /` app info | Public |

### 📊 Migrations đã chạy (theo thứ tự)

| # | Tên Migration | Nội dung |
|---|---|---|
| 1 | `1715028537217-CreateUser` | Tạo bảng `role`, `status`, `file`, `user`, `session` |
| 2 | `1753407715000-AddRoleDescriptionAndDisplayName` | Thêm `displayName`, `description` vào `role` |
| 3 | `1753410000000-AddAuditColumnsToFile` | Thêm audit columns + `createdBy` vào `file` |
| 4 | `1786938138008-CreateFleetTables` | Tạo bảng `vehicle` và `driver` |
| 5 | `1786938200000-CreateNotificationTable` | Tạo bảng `notification` + indexes trên `userId` và `(userId, isRead)` |
| 6 | `1786938300000-CreateOrderAndTripTables` | Tạo bảng `order` và `trip` + foreign keys và composite indexes |
| 7 | `1786938400000-AddExternalNoteToOrder` | Thêm cột `externalNote` (text) vào bảng `order` |
| 8 | `1786938500000-AddUsernameToUser` | Thêm cột `username` (varchar unique) vào bảng `user` |

### 🔑 Enums đang dùng

```typescript
RoleEnum:                   SUPER_ADMIN=1, DISPATCHER=2, FLEET_MANAGER=3, WAREHOUSE_MANAGER=4
StatusEnum:                 active=1, inactive=2
OrderStatus:                'DRAFT' | 'PENDING_FLEET' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'NO_VEHICLE'
TripStatus:                 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
VehicleStatus:              'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'
DriverStatus:               'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY'
FileDriver:                 LOCAL | S3 | S3_PRESIGNED
AuthProvider:               email | google | facebook | apple
NotificationType:           'WAREHOUSE' | 'FLEET' | 'DISPATCHER' | 'GENERIC'
DispatcherNotificationType: 'NEW_ORDER' | 'ORDER_CANCELLED' | 'VEHICLE_ASSIGNED' | 'DELAY_ALERT'
FleetNotificationType:      'TRIP_ASSIGNED' | 'VEHICLE_MAINTENANCE' | 'OVERLOAD_ALERT' | 'DRIVER_STATUS_CHANGE'
WarehouseNotificationType:  'INBOUND_SHIPMENT' | 'OUTBOUND_SHIPMENT' | 'INVENTORY_ALERT' | 'CAPACITY_WARNING'
```

---

## 🟩 FRONTEND — PAGES & FEATURES

### ✅ Pages / Routes đã có

| Route | Mô tả | RBAC |
|---|---|---|
| `/auth/sign-in` | Đăng nhập (Quick Fill 4 vai trò + Email/Username) | Public |
| `/dashboard/overview` | KPI Dashboard (Area/Bar/Pie chart) | All |
| `/dashboard/orders` | Lập Lệnh Điều Vận (CRUD, textarea, xe ngoài) | `SUPER_ADMIN`, `DISPATCHER` |
| `/dashboard/orders/[id]` | Chi tiết Đơn Hàng Điều Vận | `SUPER_ADMIN`, `DISPATCHER` |
| `/dashboard/trips` | Phân Công Xe & Chia Chuyến Vận Tải | `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER` |
| `/dashboard/warehouse` | Inbound Hub & Kho Tiếp Nhận | `SUPER_ADMIN`, `WAREHOUSE_MANAGER` |
| `/dashboard/fleet` | Quản lý Xe & Tài xế (CRUD) | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `/dashboard/product` | Danh sách hàng hoá (TanStack Table) | All |
| `/dashboard/product/[id]` | Chi tiết/form hàng hoá | All |
| `/dashboard/users` | Quản trị người dùng | `SUPER_ADMIN` |
| `/dashboard/kanban` | Kanban Board (kéo thả dnd-kit) | All |
| `/dashboard/chat` | Chat nội bộ | All |
| `/dashboard/ai-chat` | AI Assistant | All |
| `/dashboard/notifications` | Trung tâm thông báo (Realtime WebSocket + REST) | All |
| `/dashboard/profile` | Hồ sơ cá nhân | All |
| `/dashboard/forms/*` | Showcase forms (basic, multi-step, sheet, advanced) | All |

### 📦 Zustand Stores

| Store | Persist | Nội dung |
|---|---|---|
| `useAuthStore` | `localStorage` | user, tokens, isAuthenticated, hasRole() |
| `useChatStore` | In-memory | conversations, draft, selectedConversationId |
| `useTaskStore` | In-memory | Kanban columns |
| `useNotificationStore` | In-memory | notifications, unreadCount |

### 🔌 API Layer

- **Axios client** (`src/lib/api-client.ts`): Auto refresh token (queue + retry on 401)
- **Orders API** (`src/features/orders/api.ts`): getOrders, getOrderById, createOrder, updateOrder, submitOrder, markNoVehicle, deleteOrder
- **Trips API** (`src/features/trips/api.ts`): getTrips, getTripById, createTrip, createSplitTrips, updateTrip, confirmTrip, deleteTrip
- **Notifications API & Socket**: `useNotificationSocket` (Socket.IO client), `useNotificationsQuery`, `useUnreadCountQuery`, `useMarkAsReadMutation`, `useMarkAllAsReadMutation`
- **Fleet API**: getVehicles, createVehicle, updateVehicle, deleteVehicle, getDrivers, ...
- **Products API**: query options, mutations (create/update/delete + invalidate)
- **Users API**: query options, mutations (create/update/delete + invalidate)

---

## 🔴 NGHIỆP VỤ CHƯA TRIỂN KHAI

| # | Nghiệp vụ | Backend | Frontend | Priority |
|---|---|---|---|---|
| 1 | **Cargo/Goods** — Quản lý danh mục hàng hóa TMS chi tiết | ❌ Chưa có | Partial (Product mock) | 🟡 Trung bình |
| 2 | **Reports & Analytics** — Báo cáo thống kê hiệu suất đội xe và kho | ❌ Chưa có | ❌ Chưa có | 🟢 Thấp |
| 3 | **Driver Mobile App / PWA** — Ứng dụng dành riêng cho tài xế nhận chuyến | ❌ Chưa có | ❌ Chưa có | 🟢 Thấp |

---

## 📐 CHUẨN BỊ CHO NGHIỆP VỤ MỚI

### Checklist khi thêm module backend mới:
- [ ] Tạo Entity + Migration (KHÔNG dùng synchronize)
- [ ] Tạo DTOs (Create, Update, Query, Response)
- [ ] Tạo Controller + Service + Module
- [ ] Gắn `@Roles()` + `AuthGuard('jwt')` + `RolesGuard`
- [ ] Đăng ký module trong `AppModule`
- [ ] Swagger tag + `@ApiBearerAuth()`
- [ ] Cập nhật file này (CODEBASE_AUDIT.md)

### Checklist khi thêm page frontend mới:
- [ ] Tạo `src/app/dashboard/<feature>/page.tsx`
- [ ] Thêm nav item vào `nav-config.ts` với `access.role`
- [ ] Tạo feature folder `src/features/<feature>/`
- [ ] Tạo API hooks (queryOptions + mutations)
- [ ] Cập nhật middleware `roleRouteMap` nếu cần phân quyền mới
- [ ] Cập nhật file này (CODEBASE_AUDIT.md)

