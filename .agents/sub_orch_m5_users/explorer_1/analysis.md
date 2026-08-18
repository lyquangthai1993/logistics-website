# Milestone 5: Users Management Live API Connection — Technical Investigation Report

**Document Version**: 1.0.0  
**Author**: Explorer 1  
**Target Page**: `/dashboard/users` (`frontend/src/app/dashboard/users/page.tsx`)  
**Target Feature Folder**: `frontend/src/features/users/`  
**Backend Reference**: `backend/src/users/`  
**Date**: 2026-08-18  

---

## 1. Executive Summary

The Users Management module (`/dashboard/users`) is designed for system administrators (`SUPER_ADMIN`) to view, search, create, update, and soft-delete user accounts within the Logistics TMS ecosystem.

### Current Status
- The frontend UI uses a mock data layer powered by `fakeUsers` (`src/constants/mock-api-users.ts`) using `@faker-js/faker`.
- User roles in the frontend are generic mock roles (`Developer`, `Designer`, `Manager`, `QA`, `DevOps`, `Product Owner`) instead of the four canonical TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
- User statuses are mock strings (`Active`, `Inactive`, `Invited`) rather than relational status entities (`Active = 1`, `Inactive = 2`).
- The backend NestJS API (`backend/src/users/users.controller.ts`) is fully implemented with TypeORM, `@Roles(RoleEnum.SUPER_ADMIN)`, and standard REST endpoints:
  - `GET /api/v1/users` (with infinity pagination, role filtering, sorting)
  - `POST /api/v1/users` (create user with email, name, password, role, status)
  - `GET /api/v1/users/:id` (find user by ID)
  - `PATCH /api/v1/users/:id` (update user profile, role, status, password)
  - `DELETE /api/v1/users/:id` (soft delete user)
- The canonical table architecture (`@tanstack/react-table` v8 + `nuqs` + TanStack Query v5 + `<DataTable>`) is already scaffolded in `features/users/components/users-table/`, but requires updates to map live API payloads and handle live mutations seamlessly.

---

## 2. Codebase Architecture & File Mapping

| Layer / File Path | Current Role / Behavior | Changes Needed for Live API Connection |
|---|---|---|
| `frontend/src/app/dashboard/users/page.tsx` | Next.js Server Page. Parses searchParams via `searchParamsCache` and renders `PageContainer` + `UserListingPage`. | Update title/description to Vietnamese; ensure `UserFormSheetTrigger` operates seamlessly. |
| `frontend/src/app/dashboard/users/loading.tsx` | Loading skeleton using `DataTableSkeleton`. | Keep as is (already canonical). |
| `frontend/src/features/users/info-content.ts` | Info bar description explaining TanStack Query + nuqs. | Update content to reflect live TMS user management. |
| `frontend/src/features/users/api/types.ts` | Imports `User` type from `mock-api-users.ts`; defines mock `UsersResponse` & `UserMutationPayload`. | **Complete rewrite**: Define live types (`User`, `Role`, `Status`, `UsersResponse`, `QueryUserParams`, `CreateUserPayload`, `UpdateUserPayload`). |
| `frontend/src/features/users/api/service.ts` | Calls mock functions on `fakeUsers`. | **Complete rewrite**: Connect to NestJS `/api/v1/users` via `apiClient` (`axios`). |
| `frontend/src/features/users/api/queries.ts` | Defines `userKeys` and `usersQueryOptions`. | Update type signatures and query filters serialization. |
| `frontend/src/features/users/api/mutations.ts` | Defines `createUserMutation`, `updateUserMutation`, `deleteUserMutation`. | Update mutation signatures to match live DTO payloads. |
| `frontend/src/features/users/schemas/user.ts` | Zod schema with mock fields (`first_name`, `last_name`, `phone`, `role`, `status`). | **Update**: Match live fields (`firstName`, `lastName`, `email`, `password`, `roleId`, `statusId`), Vietnamese error messages. |
| `frontend/src/features/users/components/user-listing.tsx` | Server Component prefetching `usersQueryOptions`. | Ensure search params filter mapping aligns with live query parameters. |
| `frontend/src/features/users/components/users-table/options.tsx` | Contains mock `ROLE_OPTIONS` (Developer, etc.). | **Update**: Map TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`) and status options (`ACTIVE`, `INACTIVE`). |
| `frontend/src/features/users/components/users-table/columns.tsx` | Column definitions using `first_name`, `phone`, mock role badge. | **Update**: Map `firstName`/`lastName`/`email`, role display badges, status badges, formatted `createdAt`, cell actions. |
| `frontend/src/features/users/components/users-table/cell-action.tsx` | Row actions dropdown with Edit and Delete modal. | **Update**: Toast notification standardization (100% Vietnamese + API error first), cursor-pointer. |
| `frontend/src/features/users/components/users-table/index.tsx` | Client table wrapper with `useDataTable` & `<DataTable>`. | **Update**: Handle live data structure (`data.data` / `data.hasNextPage` or `data.users`), pagination, sorting. |
| `frontend/src/features/users/components/user-form-sheet.tsx` | Sheet drawer form for Add/Edit user. | **Update**: Fields (`firstName`, `lastName`, `email`, `password`, `role`, `status`), TMS role select, 100% Vietnamese toast notifications. |
| `frontend/src/proxy.ts` | Middleware route guard with `roleRouteMap`. | **Update**: Ensure `'/dashboard/users': ['SUPER_ADMIN']` is protected at the route guard level. |
| `frontend/src/constants/mock-api-users.ts` | In-memory faker store. | Can remain as unused legacy demo or be marked deprecated. |
| `frontend/src/app/api/users/route.ts` & `[id]/route.ts` | Next.js API route handlers wrapping `fakeUsers`. | Direct API client calls bypass Next.js route handlers. Can be cleaned up or bypassed. |

---

## 3. Deep Analysis of Backend Contract (`backend/src/users/`)

### 3.1 Domain Model & Relational Entity
From `backend/src/users/domain/user.ts` and `user.entity.ts`:
```typescript
export interface Role {
  id: number;
  name: string;
  displayName?: string | null;
  description?: string | null;
}

export interface Status {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username?: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  photo?: { id: string; path: string } | null;
  role?: Role | null;
  status?: Status | null;
  provider: string;
  socialId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
```

### 3.2 Role and Status Reference Enums
- **RoleEnum** (`backend/src/roles/roles.enum.ts`):
  - `1`: `SUPER_ADMIN` (DisplayName: "Quản trị viên cấp cao")
  - `2`: `DISPATCHER` (DisplayName: "Điều phối viên")
  - `3`: `FLEET_MANAGER` (DisplayName: "Quản lý đội xe")
  - `4`: `WAREHOUSE_MANAGER` (DisplayName: "Quản lý kho")

- **StatusEnum** (`backend/src/statuses/statuses.enum.ts`):
  - `1`: `active` (DisplayName: "Hoạt động")
  - `2`: `inactive` (DisplayName: "Tạm ngưng")

### 3.3 Endpoints Specification
All endpoints require `Authorization: Bearer <accessToken>` with `SUPER_ADMIN` role (`@Roles(RoleEnum.SUPER_ADMIN)`).

1. **`GET /api/v1/users`**
   - **Query Parameters**:
     - `page`: number (1-indexed, default: 1)
     - `limit`: number (default: 10, max: 50)
     - `filters`: JSON string, e.g. `{"roles":[{"id":1}]}`
     - `sort`: JSON string, e.g. `[{"orderBy":"createdAt","order":"DESC"}]`
   - **Response Format**:
     ```json
     {
       "data": [
         {
           "id": 1,
           "email": "admin@example.com",
           "firstName": "Super",
           "lastName": "Admin",
           "username": "admin",
           "provider": "email",
           "role": {
             "id": 1,
             "name": "Super Admin",
             "displayName": "Quản trị viên cấp cao"
           },
           "status": {
             "id": 1,
             "name": "Active"
           },
           "createdAt": "2026-08-18T00:00:00.000Z",
           "updatedAt": "2026-08-18T00:00:00.000Z"
         }
       ],
       "hasNextPage": false
     }
     ```

2. **`POST /api/v1/users`**
   - **Request Body** (`CreateUserDto`):
     ```json
     {
       "email": "user@example.com",
       "password": "Password123!",
       "firstName": "Nguyễn",
       "lastName": "Văn A",
       "username": "nguyenvana",
       "role": { "id": 2 },
       "status": { "id": 1 }
     }
     ```
   - **Response Format**: Created `User` object (`201 Created`).
   - **Validation Constraints**:
     - `email`: valid email, lowercase transformed, unique (`422 Unprocessable Entity` if duplicate).
     - `firstName`: string, required.
     - `lastName`: string, required.
     - `password`: string, min 6 chars (`@MinLength(6)`).
     - `role`: object `{ id: number }` (must be 1, 2, 3, or 4).
     - `status`: object `{ id: number }` (must be 1 or 2).

3. **`PATCH /api/v1/users/:id`**
   - **Request Body** (`UpdateUserDto`): Partial of `CreateUserDto`. If `password` is omitted or empty, existing password remains unchanged.
   - **Response Format**: Updated `User` object (`200 OK`).

4. **`DELETE /api/v1/users/:id`**
   - **Action**: Soft deletes user record by setting `deletedAt` timestamp.
   - **Response Format**: `204 No Content`.

---

## 4. Gap Analysis: Current Mock vs Target Implementation

### 4.1 Data Access Layer (`features/users/api/`)

#### `service.ts`
- **Current**: Direct invocation of `fakeUsers` methods.
- **Target**:
  ```typescript
  import { apiClient } from '@/lib/api-client';
  import type {
    User,
    UserFilters,
    UsersResponse,
    CreateUserPayload,
    UpdateUserPayload
  } from './types';

  export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
    const params: Record<string, any> = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10
    };

    if (filters.roles) {
      const roleId = Number(filters.roles);
      if (!isNaN(roleId)) {
        params.filters = JSON.stringify({ roles: [{ id: roleId }] });
      }
    }

    if (filters.sort) {
      params.sort = filters.sort;
    }

    const res = await apiClient.get<UsersResponse>('/api/v1/users', { params });
    return res.data;
  }

  export async function createUser(payload: CreateUserPayload): Promise<User> {
    const res = await apiClient.post<User>('/api/v1/users', payload);
    return res.data;
  }

  export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const res = await apiClient.patch<User>(`/api/v1/users/${id}`, payload);
    return res.data;
  }

  export async function deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/users/${id}`);
  }
  ```

#### `types.ts`
- **Target**:
  ```typescript
  export interface Role {
    id: number;
    name: string;
    displayName?: string | null;
    description?: string | null;
  }

  export interface Status {
    id: number;
    name: string;
  }

  export interface User {
    id: number;
    username?: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    photo?: { id: string; path: string } | null;
    role?: Role | null;
    status?: Status | null;
    provider: string;
    socialId?: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  }

  export type UserFilters = {
    page?: number;
    limit?: number;
    roles?: string;
    search?: string;
    sort?: string;
  };

  export type UsersResponse = {
    data: User[];
    hasNextPage: boolean;
  };

  export type CreateUserPayload = {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    username?: string | null;
    role?: { id: number };
    status?: { id: number };
  };

  export type UpdateUserPayload = {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    username?: string | null;
    role?: { id: number };
    status?: { id: number };
  };
  ```

---

### 4.2 Form Management & Validation (`user-form-sheet.tsx` & `schemas/user.ts`)

#### Schema Update (`schemas/user.ts`)
```typescript
import * as z from 'zod';

export const userCreateSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ và tên đệm'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  roleId: z.coerce.number().min(1, 'Vui lòng chọn vai trò'),
  statusId: z.coerce.number().min(1, 'Vui lòng chọn trạng thái')
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ và tên đệm'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().optional(),
  roleId: z.coerce.number().min(1, 'Vui lòng chọn vai trò'),
  statusId: z.coerce.number().min(1, 'Vui lòng chọn trạng thái')
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
```

#### Form Sheet Component (`user-form-sheet.tsx`)
1. Handle both Create & Update modes:
   - In Create mode: `password` field is required, with `type="password"`.
   - In Edit mode: `password` field is optional (placeholder: "Để trống nếu không muốn đổi mật khẩu").
2. Role Select Options:
   - `1`: "Quản trị viên cấp cao (SUPER_ADMIN)"
   - `2`: "Điều phối viên (DISPATCHER)"
   - `3`: "Quản lý đội xe (FLEET_MANAGER)"
   - `4`: "Quản lý kho (WAREHOUSE_MANAGER)"
3. Status Select Options:
   - `1`: "Hoạt động (Active)"
   - `2`: "Tạm ngưng (Inactive)"
4. Submitting Payload Conversion:
   ```typescript
   const payload = {
     firstName: value.firstName.trim(),
     lastName: value.lastName.trim(),
     email: value.email.trim().toLowerCase(),
     ...(value.password ? { password: value.password } : {}),
     role: { id: Number(value.roleId) },
     status: { id: Number(value.statusId) }
   };
   ```

---

### 4.3 Table & Column Definition (`users-table/`)

#### Role Badges Mapping
| Role ID | Role Enum | Display Name | Badge Style |
|---|---|---|---|
| 1 | `SUPER_ADMIN` | Quản trị viên | `bg-purple-500/15 text-purple-600 border-purple-500/20` |
| 2 | `DISPATCHER` | Điều phối viên | `bg-blue-500/15 text-blue-600 border-blue-500/20` |
| 3 | `FLEET_MANAGER` | Quản lý đội xe | `bg-emerald-500/15 text-emerald-600 border-emerald-500/20` |
| 4 | `WAREHOUSE_MANAGER` | Quản lý kho | `bg-amber-500/15 text-amber-600 border-amber-500/20` |

#### Status Badges Mapping
| Status ID | Name | Display Name | Badge Style |
|---|---|---|---|
| 1 | `Active` | Hoạt động | `bg-emerald-500/15 text-emerald-600 border-emerald-500/20` |
| 2 | `Inactive` | Tạm ngưng | `bg-zinc-500/15 text-zinc-600 border-zinc-500/20` |

#### Columns Specification
1. **`name`** (Họ và tên & Email):
   - Accessor: `firstName` + `lastName`
   - Secondary text: `email`
   - Sortable & Filterable
2. **`role`** (Vai trò):
   - Cell: Badge with Role displayName and color styling.
   - Filterable with `ROLE_OPTIONS`.
3. **`status`** (Trạng thái):
   - Cell: Badge with Status name and color styling.
4. **`createdAt`** (Ngày tạo):
   - Format: `DD/MM/YYYY HH:mm`
   - Sortable
5. **`actions`** (Thao tác):
   - `CellAction` with Update and Soft Delete modals.

---

### 4.4 Toast Notifications Compliance Audit

According to `ORIGINAL_REQUEST.md`:
- **Rule 1 (100% Vietnamese)**: No English toast messages.
- **Rule 2 (API Error Message First)**: Always extract `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Fallback tiếng Việt')`.

#### Toast Matrix for Users Module:

| Event | Toast Type | Target Message Pattern |
|---|---|---|
| Create User Success | Success | `toast.success('Tạo người dùng thành công!')` |
| Create User Error | Error | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Không thể tạo người dùng. Vui lòng thử lại.')` |
| Update User Success | Success | `toast.success('Cập nhật người dùng thành công!')` |
| Update User Error | Error | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Không thể cập nhật người dùng. Vui lòng thử lại.')` |
| Delete User Success | Success | `toast.success('Đã xóa người dùng thành công!')` |
| Delete User Error | Error | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Không thể xóa người dùng. Vui lòng thử lại.')` |

---

### 4.5 Security & 3-Layer RBAC Alignment

1. **Sidebar UI Layer** (`frontend/src/config/nav-config.ts`):
   - Menu item for `/dashboard/users` has `access: { role: 'SUPER_ADMIN' }` (Already verified).
2. **Route Guard Layer** (`frontend/src/proxy.ts`):
   - Add `'/dashboard/users': ['SUPER_ADMIN']` to `roleRouteMap`.
3. **API Guard Layer** (`backend/src/users/users.controller.ts`):
   - `@Roles(RoleEnum.SUPER_ADMIN)` at controller class level with `@UseGuards(AuthGuard('jwt'), RolesGuard)` (Already verified).

---

## 5. Proposed Implementation Plan & File Modifications

1. **`frontend/src/features/users/api/types.ts`**:
   - Define exact interfaces for `User`, `Role`, `Status`, `UsersResponse`, `QueryUserParams`, `CreateUserPayload`, `UpdateUserPayload`.
2. **`frontend/src/features/users/api/service.ts`**:
   - Implement `getUsers`, `createUser`, `updateUser`, `deleteUser` using `apiClient`.
3. **`frontend/src/features/users/api/mutations.ts`**:
   - Adapt mutation signatures and cache invalidations for `userKeys.all`.
4. **`frontend/src/features/users/schemas/user.ts`**:
   - Export `userCreateSchema`, `userUpdateSchema`, and form types.
5. **`frontend/src/features/users/components/users-table/options.tsx`**:
   - Export `ROLE_OPTIONS` and `STATUS_OPTIONS` with TMS values.
6. **`frontend/src/features/users/components/users-table/columns.tsx`**:
   - Update ColumnDef with TMS fields, badges, Vietnamese headers.
7. **`frontend/src/features/users/components/users-table/cell-action.tsx`**:
   - Implement AlertModal confirmation, Sonner toasts (Vietnamese + API error first), button cursors.
8. **`frontend/src/features/users/components/user-form-sheet.tsx`**:
   - Form fields for `firstName`, `lastName`, `email`, `password`, `roleId`, `statusId`, Vietnamese labels, Sonner toasts.
9. **`frontend/src/features/users/components/users-table/index.tsx`**:
   - Wire `useDataTable` with `data.data`, `pageCount`, column pinning.
10. **`frontend/src/proxy.ts`**:
    - Add `'/dashboard/users': ['SUPER_ADMIN']` to `roleRouteMap`.

---

## 6. Verification and Validation Strategy

1. **TypeScript Static Check**:
   - Execute `npm run build` in `frontend/` to confirm 0 TypeScript / compile errors.
2. **RBAC Route Guard Spec**:
   - Run `npx playwright test e2e/03-rbac-routing.spec.ts` to ensure route protection holds for all 4 roles.
3. **End-to-End Functional Verification**:
   - Verify listing, sorting, pagination, role filtering, creation, updating, and soft-deletion against live NestJS backend.
