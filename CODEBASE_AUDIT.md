# 📋 LOGISTICS TMS — BIÊN BẢN KIỂM TRA SOURCE BASE

> **Tài liệu sống**: File này được cập nhật mỗi khi có module/nghiệp vụ mới được triển khai.
> Dùng skill `codebase-auditor` để cập nhật tự động.

---

## 📌 Thông tin biên bản

| Trường | Giá trị |
|---|---|
| **Phiên bản** | v0.3.0 |
| **Ngày audit** | 2026-08-17 |
| **Người thực hiện** | Antigravity Agent |
| **Môi trường** | Development / Staging |

---

## 🗂️ CHANGELOG PHIÊN BẢN

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
| **Backend** | NestJS 11, TypeORM, PostgreSQL (Neon), Custom JWT, Swagger, Nodemailer |
| **Frontend** | Next.js 16.2, React 19, Tailwind CSS v4, TanStack Query v5, Zustand v5 |
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
| `auth` | `session` | 10 endpoints (login, register, confirm, forgot/reset, me, refresh, logout) | All |
| `auth-google/facebook/apple` | — | 3 endpoints social login | Public |
| `users` | `user` | CRUD + Pagination | `SUPER_ADMIN` |
| `vehicles` | `vehicle` | CRUD full | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `drivers` | `driver` | CRUD full | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `files` | `file` | Upload (Local/S3/Presigned) + Serve | JWT required |
| `session` | `session` | Internal (auth only) | — |
| `roles` | `role` | DB Seed only | — |
| `statuses` | `status` | DB Seed only | — |
| `mail`/`mailer` | — | Internal (send email) | — |
| `home` | — | `GET /` app info | Public |

### 📊 Migrations đã chạy (theo thứ tự)

| # | Tên Migration | Nội dung |
|---|---|---|
| 1 | `1715028537217-CreateUser` | Tạo bảng `role`, `status`, `file`, `user`, `session` |
| 2 | `1753407715000-AddRoleDescriptionAndDisplayName` | Thêm `displayName`, `description` vào `role` |
| 3 | `1753410000000-AddAuditColumnsToFile` | Thêm audit columns + `createdBy` vào `file` |
| 4 | `1786938138008-CreateFleetTables` | Tạo bảng `vehicle` và `driver` |

### 🔑 Enums đang dùng

```typescript
RoleEnum:      SUPER_ADMIN=1, DISPATCHER=2, FLEET_MANAGER=3, WAREHOUSE_MANAGER=4
StatusEnum:    active=1, inactive=2
VehicleStatus: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'
DriverStatus:  'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY'
FileDriver:    LOCAL | S3 | S3_PRESIGNED
AuthProvider:  email | google | facebook | apple
```

---

## 🟩 FRONTEND — PAGES & FEATURES

### ✅ Pages / Routes đã có

| Route | Mô tả | RBAC |
|---|---|---|
| `/auth/sign-in` | Đăng nhập (Quick Fill 4 vai trò) | Public |
| `/dashboard/overview` | KPI Dashboard (Area/Bar/Pie chart) | All |
| `/dashboard/fleet` | Quản lý Xe & Tài xế (CRUD) | `SUPER_ADMIN`, `FLEET_MANAGER` |
| `/dashboard/product` | Danh sách hàng hoá (TanStack Table) | All |
| `/dashboard/product/[id]` | Chi tiết/form hàng hoá | All |
| `/dashboard/users` | Quản trị người dùng | `SUPER_ADMIN` |
| `/dashboard/kanban` | Kanban Board (kéo thả dnd-kit) | All |
| `/dashboard/chat` | Chat nội bộ | All |
| `/dashboard/ai-chat` | AI Assistant | All |
| `/dashboard/notifications` | Trung tâm thông báo | All |
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
- **Fleet API**: getVehicles, createVehicle, updateVehicle, deleteVehicle, getDrivers, ...
- **Products API**: query options, mutations (create/update/delete + invalidate)
- **Users API**: query options, mutations (create/update/delete + invalidate)

---

## 🔴 NGHIỆP VỤ CHƯA TRIỂN KHAI

| # | Nghiệp vụ | Backend | Frontend | Priority |
|---|---|---|---|---|
| 1 | **Orders** — Quản lý đơn hàng | ❌ Chưa có | ❌ Chưa có page (guard ✅) | 🔴 Cao |
| 2 | **Trips** — Quản lý chuyến xe | ❌ Chưa có | ❌ Chưa có page (guard ✅) | 🔴 Cao |
| 3 | **Warehouse/Hub** — Quản lý kho | ❌ Chưa có | ❌ Chưa có page (guard ✅) | 🟡 Trung bình |
| 4 | **Cargo/Goods** — Hàng hóa TMS | ❌ Chưa có | Partial (Product mock) | 🟡 Trung bình |
| 5 | **Reports** — Báo cáo thống kê | ❌ Chưa có | ❌ Chưa có | 🟢 Thấp |
| 6 | **Realtime** — WebSocket notify | ❌ Chưa có | ❌ Chưa có | 🟡 Trung bình |

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
