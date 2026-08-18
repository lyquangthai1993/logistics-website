# Specification Document: Milestone 5 — Users Management Live API Connection & TMS Role Mapping

> **Author**: Spec Miner 1  
> **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m5_users\spec_miner_1\`  
> **Date**: 2026-08-18  
> **Target Path**: `frontend/src/app/dashboard/users/page.tsx` & `frontend/src/features/users/`  
> **Authoritative Specification Sources**:
> - Backend Users Module (`backend/src/users/users.controller.ts`, `users.service.ts`, `dto/create-user.dto.ts`, `dto/update-user.dto.ts`, `dto/query-user.dto.ts`, `entities/user.entity.ts`)
> - Backend Roles & Statuses (`backend/src/roles/roles.enum.ts`, `backend/src/statuses/statuses.enum.ts`, `backend/src/database/seeds/relational/role/role-seed.service.ts`, `status-seed.service.ts`, `user-seed.service.ts`)
> - Authoritative RBAC Matrix (`.agents/rules/rbac-matrix.md`, `frontend/src/config/nav-config.ts`, `frontend/src/proxy.ts`)
> - Toast Notification Guidelines (`.agents/ORIGINAL_REQUEST.md`)
> - Playwright E2E Test Suite (`frontend/e2e/helpers/auth.ts`, `02-login-flow.spec.ts`, `03-rbac-routing.spec.ts`, `10-hubs-management.spec.ts`)

---

## 1. TMS Roles & Permissions, Badges, Labels, and Form Selection Options

### 1.1 Enumeration of TMS Roles
The Logistics TMS system recognizes exactly 4 authoritative business roles as defined in `RoleEnum` (`backend/src/roles/roles.enum.ts`), seed services, and `rbac-matrix.md`:

| Role Enum | ID (DB) | English Name | Vietnamese Display Name | Description | Badge Variant & Styling |
|---|---|---|---|---|---|
| `SUPER_ADMIN` | `1` | Super Admin | Quản trị viên cấp cao | Toàn quyền truy cập tất cả các phân hệ, cấu hình hệ thống, quản lý người dùng (`/dashboard/users`), quản lý kho hub (`/dashboard/admin/hubs`). | `default` (primary/indigo) — "Super Admin" / "Quản trị viên" |
| `DISPATCHER` | `2` | Dispatcher | Điều phối viên | Quản lý và lập lệnh điều vận (`/dashboard/orders`), theo dõi chuyến xe (read-only), điều phối tuyến đường và xử lý sự cố vận hành. | `secondary` (blue/sky) — "Dispatcher" / "Điều phối viên" |
| `FLEET_MANAGER` | `3` | Fleet Manager | Quản lý đội xe | Giám sát toàn bộ đội xe (`/dashboard/fleet`), phân công xe và tài xế cho chuyến hàng (`/dashboard/trips`), khai báo hết xe (`no-vehicle`). | `outline` (amber/orange) — "Fleet Manager" / "Quản lý đội xe" |
| `WAREHOUSE_MANAGER` | `4` | Warehouse Manager | Quản lý kho | Điều hành hoạt động kho bãi, tiếp nhận và xác nhận hàng hóa nhập kho inbound (`/dashboard/warehouse`). | `secondary` (emerald/teal) — "Warehouse Manager" / "Quản lý kho" |

### 1.2 User Statuses
Defined in `StatusEnum` (`backend/src/statuses/statuses.enum.ts`):

| Status Enum | ID (DB) | Name | Vietnamese Label | Badge Variant |
|---|---|---|---|---|
| `active` | `1` | Active | Hoạt động | `default` (green / success) |
| `inactive` | `2` | Inactive | Ngừng hoạt động | `destructive` / `secondary` |

### 1.3 Form & Table Filter Selection Options
Replaces mock roles (`Developer`, `Designer`, `Manager`, `QA`, `DevOps`, `Product Owner`) with authoritative TMS roles in `options.tsx`:

```typescript
export const ROLE_OPTIONS = [
  { value: '1', label: 'Super Admin (Quản trị viên cấp cao)', code: 'SUPER_ADMIN' },
  { value: '2', label: 'Dispatcher (Điều phối viên)', code: 'DISPATCHER' },
  { value: '3', label: 'Fleet Manager (Quản lý đội xe)', code: 'FLEET_MANAGER' },
  { value: '4', label: 'Warehouse Manager (Quản lý kho)', code: 'WAREHOUSE_MANAGER' },
];

export const STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động (Active)', code: 'active' },
  { value: '2', label: 'Ngừng hoạt động (Inactive)', code: 'inactive' },
];
```

### 1.4 RBAC 3-Layer Access Enforcement for Users Management
1. **Sidebar UI** (`frontend/src/config/nav-config.ts`):
   - Menu item "Users" (`/dashboard/users`) has `access: { role: 'SUPER_ADMIN' }`. Only visible to `SUPER_ADMIN`.
2. **Route Guard** (`frontend/src/proxy.ts`):
   - Protected route entry: `'/dashboard/users': ['SUPER_ADMIN']` (redirects unauthorized roles to `/dashboard/overview`).
3. **API Guard** (`backend/src/users/users.controller.ts`):
   - Class-level guard: `@Roles(RoleEnum.SUPER_ADMIN)` + `@UseGuards(AuthGuard('jwt'), RolesGuard)` on `/api/v1/users`.

---

## 2. Exact Field Validation Rules (Backend vs Frontend)

### 2.1 Backend Class-Validator DTO Specifications

#### Create User (`CreateUserDto` — `backend/src/users/dto/create-user.dto.ts`)
| Field | Type | Required? | Constraints & Transformers | Backend Error Code / Exception |
|---|---|---|---|---|
| `email` | string | **Yes** | `@IsNotEmpty()`, `@IsEmail()`, `@Transform(lowerCaseTransformer)` | 422: `{ errors: { email: 'emailAlreadyExists' } }` if duplicate |
| `firstName` | string | **Yes** | `@IsNotEmpty()`, string | 422 / 400 validation error if empty |
| `lastName` | string | **Yes** | `@IsNotEmpty()`, string | 422 / 400 validation error if empty |
| `password` | string | No (Optional) | `@MinLength(6)`, hashed with bcrypt before persist | 400 validation error if `< 6` chars |
| `username` | string | No (Optional) | `@IsOptional()`, `@Transform(lowerCaseTransformer)` | 422: `{ errors: { username: 'usernameAlreadyExists' } }` if duplicate |
| `role` | `RoleDto` (`{ id: number }`) | No (Optional) | `@IsOptional()`, `@Type(() => RoleDto)`, validated against `RoleEnum` (1..4) | 422: `{ errors: { role: 'roleNotExists' } }` |
| `status` | `StatusDto` (`{ id: number }`) | No (Optional) | `@IsOptional()`, `@Type(() => StatusDto)`, validated against `StatusEnum` (1..2) | 422: `{ errors: { status: 'statusNotExists' } }` |
| `photo` | `FileDto` (`{ id: string \| number }`) | No (Optional) | `@IsOptional()`, validated against `filesService.findById(id)` | 422: `{ errors: { photo: 'imageNotExists' } }` |
| `provider` | string | No (Optional) | Defaults to `'email'` (`AuthProvidersEnum.email`) | N/A |
| `socialId` | string | No (Optional) | Nullable string | N/A |

#### Update User (`UpdateUserDto` — `backend/src/users/dto/update-user.dto.ts`)
| Field | Type | Required? | Constraints & Transformers | Backend Error Code / Exception |
|---|---|---|---|---|
| `email` | string | No (Optional) | `@IsOptional()`, `@IsEmail()`, lowercased, checks uniqueness excluding current `id` | 422: `{ errors: { email: 'emailAlreadyExists' } }` |
| `firstName` | string | No (Optional) | `@IsOptional()`, string | 400 if invalid type |
| `lastName` | string | No (Optional) | `@IsOptional()`, string | 400 if invalid type |
| `password` | string | No (Optional) | `@IsOptional()`, `@MinLength(6)`, re-hashed if changed | 400 if `< 6` chars |
| `username` | string | No (Optional) | `@IsOptional()`, lowercased, checks uniqueness excluding current `id` | 422: `{ errors: { username: 'usernameAlreadyExists' } }` |
| `role` | `RoleDto` (`{ id: number }`) | No (Optional) | `@IsOptional()`, validated against `RoleEnum` (1..4) | 422: `{ errors: { role: 'roleNotExists' } }` |
| `status` | `StatusDto` (`{ id: number }`) | No (Optional) | `@IsOptional()`, validated against `StatusEnum` (1..2) | 422: `{ errors: { status: 'statusNotExists' } }` |
| `photo` | `FileDto` (`{ id: string \| number }`) | No (Optional) | `@IsOptional()`, validated against `filesService.findById(id)` | 422: `{ errors: { photo: 'imageNotExists' } }` |

### 2.2 Frontend Zod Form Schema Specification
Mapped directly to live backend payload structure (using camelCase attributes or payload mappers):

```typescript
import * as z from 'zod';

export const userFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Vui lòng nhập tên').max(50, 'Tên tối đa 50 ký tự'),
  lastName: z.string().trim().min(1, 'Vui lòng nhập họ').max(50, 'Họ tối đa 50 ký tự'),
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  username: z.string().trim().optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .optional()
    .or(z.literal('')),
  roleId: z.coerce.number().min(1, 'Vui lòng chọn vai trò hợp lệ').max(4, 'Vai trò không hợp lệ'),
  statusId: z.coerce.number().min(1, 'Vui lòng chọn trạng thái').max(2, 'Trạng thái không hợp lệ'),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
```

---

## 3. Playwright Test Selectors & E2E Requirements

### 3.1 Existing Seed Users & Credentials (`frontend/e2e/helpers/auth.ts`)
| Role | Email | Password | Seeded Name |
|---|---|---|---|
| `SUPER_ADMIN` | `lyquangthai1993+1@gmail.com` | `secret` | Super Admin (Admin) |
| `DISPATCHER` | `lyquangthai1993+2@gmail.com` | `secret` | Đức Anh (Dispatcher) |
| `FLEET_MANAGER` | `lyquangthai1993+3@gmail.com` | `secret` | Quản lý Đội Xe |
| `WAREHOUSE_MANAGER` | `lyquangthai1993+4@gmail.com` | `secret` | Quản lý Kho |

### 3.2 Canonical User Management Test Selectors
To guarantee test stability and maintain consistency with other modules (`hubs`, `fleet`, `orders`), the following standard IDs and selectors must be maintained:

| Element | Recommended Selector / ID | Fallback Selector | Purpose |
|---|---|---|---|
| Page Heading | `h2:has-text("Users")` or `h2:has-text("Người dùng")` | `[data-testid="page-heading"]` | Page title verification |
| Search Input | `#user-search-input` | `input[placeholder*="Search users..."]` / `input[placeholder*="Tìm kiếm người dùng..."]` | Nuqs search filtering |
| Role Facet Filter | `[data-testid="role-filter-button"]` | `button:has-text("Role")` / `button:has-text("Vai trò")` | Multi-select facet popover |
| Add User Button | `#btn-add-user` | `button:has-text("Add User")` / `button:has-text("Thêm người dùng")` | Trigger create form sheet |
| User Form Sheet | `#user-form-sheet` | `[role="dialog"]` | Create/Edit slide-over sheet |
| Input: First Name | `#input-user-first-name` | `input[name="firstName"]` | Form field |
| Input: Last Name | `#input-user-last-name` | `input[name="lastName"]` | Form field |
| Input: Email | `#input-user-email` | `input[name="email"]` | Form field |
| Input: Username | `#input-user-username` | `input[name="username"]` | Optional form field |
| Input: Password | `#input-user-password` | `input[name="password"]` | Optional on edit / min 6 chars |
| Select: Role | `#select-user-role` | `select[name="roleId"]` / combobox | TMS Role selection |
| Select: Status | `#select-user-status` | `select[name="statusId"]` / combobox | Status selection |
| Submit Button | `#btn-submit-user` | `button[type="submit"]:has-text("Create User")` / `button[type="submit"]:has-text("Update User")` | Save action |
| Row Action Trigger | `[data-testid="user-row-actions-${id}"]` | `button:has-text("Open menu")` | Open dropdown actions |
| Action Edit Item | `[data-testid="btn-edit-user-${id}"]` | `[role="menuitem"]:has-text("Update")` / `[role="menuitem"]:has-text("Chỉnh sửa")` | Open edit modal |
| Action Delete Item | `[data-testid="btn-delete-user-${id}"]` | `[role="menuitem"]:has-text("Delete")` / `[role="menuitem"]:has-text("Xóa")` | Open confirm dialog |
| Confirm Delete Dialog | `[role="alertdialog"]` | `#alert-modal` | Soft-delete modal |
| Confirm Delete Button | `#btn-confirm-delete` | `button:has-text("Continue")` / `button:has-text("Xác nhận")` | Confirm delete |

---

## 4. Toast Notification Messages (100% Vietnamese + API Message First)

### 4.1 Strict Policy Standards
Per `ORIGINAL_REQUEST.md`:
1. **100% Vietnamese**: Zero English strings in business user actions.
2. **API Message First Pattern**:
   ```typescript
   const apiMessage = err?.response?.data?.message || (err?.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : undefined);
   toast.error(apiMessage || '<Fallback Vietnamese message>');
   ```
3. **No hardcoded error overriding**: Never bury `err.response?.data?.message` inside `{ description: ... }` while hardcoding a generic title.

### 4.2 Toast Catalog for User Management
| Action / Event | Toast Type | Implementation Pattern | Message Content |
|---|---|---|---|
| Create User (Success) | `toast.success` | Custom Vietnamese string | `toast.success('Tạo người dùng thành công!')` |
| Create User (Error) | `toast.error` | API message first + Fallback | `toast.error(apiMessage \|\| 'Không thể tạo người dùng. Vui lòng thử lại.')` |
| Update User (Success) | `toast.success` | Custom Vietnamese string | `toast.success('Cập nhật người dùng thành công!')` |
| Update User (Error) | `toast.error` | API message first + Fallback | `toast.error(apiMessage \|\| 'Không thể cập nhật người dùng. Vui lòng thử lại.')` |
| Delete User (Success) | `toast.success` | Custom Vietnamese string | `toast.success('Đã xóa người dùng thành công')` |
| Delete User (Error) | `toast.error` | API message first + Fallback | `toast.error(apiMessage \|\| 'Không thể xóa người dùng. Vui lòng thử lại.')` |
| Fetch Users (Error) | `toast.error` | API message first + Fallback | `toast.error(apiMessage \|\| 'Không thể tải danh sách người dùng.')` |

---

## 5. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Users API | Live Users Pagination (`GET /api/v1/users`) | Returns paginated list of system users with roles and statuses. | `QueryUserDto` (`page`, `limit`, `filters` JSON string e.g. `{ roles: [{ id: 1 }] }`, `sort` JSON string) | `InfinityPaginationResponseDto<User>` (`{ data: User[], hasNextPage: boolean }`) | 401 Unauthorized if missing token; 403 Forbidden if not `SUPER_ADMIN`. | `backend/src/users/users.controller.ts` |
| 2 | Users API | User Detail Lookup (`GET /api/v1/users/:id`) | Retrieves single user profile by ID. | `id` (string / number) in URL param | `User` domain entity object | 404 Not Found / null if non-existent; 403 Forbidden if not `SUPER_ADMIN`. | `backend/src/users/users.controller.ts` |
| 3 | Users API | Create User (`POST /api/v1/users`) | Creates new user record with role and status relations and hashed password. | `CreateUserDto` (`email`, `firstName`, `lastName`, `password`, `username`, `role: { id }`, `status: { id }`, `photo`) | `201 Created` with `User` domain entity object | 422 Unprocessable Entity (`emailAlreadyExists`, `usernameAlreadyExists`, `roleNotExists`, `statusNotExists`, `imageNotExists`). | `backend/src/users/users.service.ts` |
| 4 | Users API | Update User (`PATCH /api/v1/users/:id`) | Updates user details, role, status, or changes password. | `id` in param, `UpdateUserDto` in body | `200 OK` with updated `User` entity | 422 if updated email/username belongs to another user; 404 if user not found. | `backend/src/users/users.service.ts` |
| 5 | Users API | Soft Delete User (`DELETE /api/v1/users/:id`) | Soft-deletes user record setting `deletedAt` timestamp. | `id` in param | `204 No Content` | 404 / error if user does not exist or deletion fails. | `backend/src/users/users.controller.ts` |
| 6 | RBAC & Roles | TMS Role Mapping | 4 predefined system roles (`SUPER_ADMIN`=1, `DISPATCHER`=2, `FLEET_MANAGER`=3, `WAREHOUSE_MANAGER`=4) with distinct responsibilities. | Role ID or Enum code | Role entity `{ id, name, displayName, description }` | 422 if invalid role ID passed in user creation/update. | `backend/src/roles/roles.enum.ts` & `rbac-matrix.md` |
| 7 | RBAC & Roles | User Status Enum | 2 statuses (`active`=1, `inactive`=2) controlling login access. | Status ID or Enum code | Status entity `{ id, name }` | 422 if invalid status ID passed. | `backend/src/statuses/statuses.enum.ts` |
| 8 | RBAC & Navigation | 3-Layer Access Control for `/dashboard/users` | Restricts Users Management strictly to `SUPER_ADMIN` across Sidebar, Middleware Route Guard, and API Guard. | User JWT role | Allowed navigation or redirected to `/dashboard/overview` / 403 Forbidden | Redirect to `/dashboard/overview` if non-admin attempts web access; 403 if API called. | `rbac-matrix.md`, `nav-config.ts`, `proxy.ts`, `users.controller.ts` |
| 9 | Frontend Table | Canonical Users DataTable (`useDataTable` + `nuqs`) | Table with search, role multi-select filter, sortable column headers, pagination controls (`[10, 20, 30, 40, 50]`). | URL search params (`page`, `perPage`, `search`/`name`, `role`, `sort`) | Rendered `<DataTable>` with sticky headers and pinned action column | Falls back to empty table state or skeleton loader during query transitions. | `src/features/users/components/users-table/index.tsx` |
| 10 | Frontend Form | User Form Slide-Over Sheet (`UserFormSheet`) | Slide-over drawer form for adding new user or editing existing user with Zod validation. | User data or empty form | `createUserMutation` / `updateUserMutation` triggers | Client validation errors shown inline; API errors shown via Sonner toast. | `src/features/users/components/user-form-sheet.tsx` |
| 11 | Frontend Actions | Row Actions Menu (`CellAction` + `AlertModal`) | Action dropdown with "Update" and "Delete" actions; soft-delete confirmation alert modal. | Selected row item `User` | Opens `UserFormSheet` or triggers `deleteUserMutation` | Error toast if delete API fails; auto-closes modal on success. | `src/features/users/components/users-table/cell-action.tsx` |
| 12 | Frontend Toast | Vietnamese + API-first Notification Protocol | Standardized notifications for all CRUD operations displaying API message first. | Mutation response or Axios error object | Sonner toast in Vietnamese | API error message displayed; Vietnamese fallback if network/generic error. | `ORIGINAL_REQUEST.md` & `src/features/users/` |

---

## 6. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Create User | Duplicate email that already exists in DB | Backend throws `UnprocessableEntityException` with `{ errors: { email: 'emailAlreadyExists' } }`. Frontend must extract error message and show toast: `toast.error('Email đã tồn tại' || apiMessage)`. |
| 2 | Create User | Duplicate username that already exists in DB | Backend throws `UnprocessableEntityException` with `{ errors: { username: 'usernameAlreadyExists' } }`. |
| 3 | Create User | Password shorter than 6 characters (`password: '123'`) | Backend class-validator rejects with `@MinLength(6)` 400 Bad Request. Frontend Zod schema catches this pre-submit with message "Mật khẩu phải có ít nhất 6 ký tự". |
| 4 | Create User | Missing `firstName` or `lastName` | Backend rejects with 422/400. Frontend Zod schema marks required. |
| 5 | Update User | Submitting update with same unchanged email | Backend `UsersService.update` checks `if (userObject && userObject.id !== id)` — correctly permits user to keep their current email without triggering duplicate error. |
| 6 | Update User | Leave password blank on edit | If `password` is empty string or undefined, backend leaves existing password hash untouched. |
| 7 | Update User / Delete User | Target User ID does not exist in DB (e.g. `99999`) | Backend throws `404 Not Found` or `User not found`. Frontend displays API error toast. |
| 8 | Pagination & Search | Search parameter with special characters or empty string | Backend and TanStack table handle empty search gracefully without crashing; nuqs strips empty query params. |
| 9 | Non-Admin Access | Authenticated `DISPATCHER` or `FLEET_MANAGER` navigates to `/dashboard/users` | Frontend `proxy.ts` middleware redirects user to `/dashboard/overview`; if direct API call made, NestJS returns `403 Forbidden`. |
| 10 | Unauthenticated Access | Anonymous request to `/dashboard/users` or `/api/v1/users` | Frontend middleware redirects to `/auth/sign-in`; backend returns `401 Unauthorized`. |

---

## 7. Migration & Connection Checklist for Implementation Agents

1. **Remove Mock Data**: Deprecate dependencies on `@/constants/mock-api-users` in `src/features/users/`.
2. **Update Service Layer** (`src/features/users/api/service.ts`):
   - Replace `fakeUsers` calls with `apiClient.get('/api/v1/users', ...)`
   - Replace `fakeUsers.createUser` with `apiClient.post('/api/v1/users', ...)`
   - Replace `fakeUsers.updateUser` with `apiClient.patch('/api/v1/users/${id}', ...)`
   - Replace `fakeUsers.deleteUser` with `apiClient.delete('/api/v1/users/${id}')`
3. **Update Types** (`src/features/users/api/types.ts`):
   - Replace mock `User` interface with live backend `User` entity (`id`, `email`, `firstName`, `lastName`, `username`, `role: { id, name }`, `status: { id, name }`, `createdAt`).
4. **Update Options & Badges** (`options.tsx`, `columns.tsx`):
   - Update `ROLE_OPTIONS` to reflect 4 TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
   - Update `STATUS_OPTIONS` to reflect `Active` (1) and `Inactive` (2).
   - Format role badge with localized display names and appropriate colors.
5. **Update Form Sheet** (`user-form-sheet.tsx`):
   - Align form inputs with backend schema (`firstName`, `lastName`, `email`, `username`, `password`, `roleId`, `statusId`).
   - Enforce 100% Vietnamese toast messages with API message first pattern.
6. **Update Route Guard** (`proxy.ts`):
   - Ensure `roleRouteMap['/dashboard/users'] = ['SUPER_ADMIN']` for full 3-layer RBAC consistency.
