# Milestone 5 — Deep Technical Analysis: Backend User APIs & Frontend Integration

**Target Feature**: Users Management Live API Connection (`/dashboard/users`)  
**Investigator**: Explorer 2 (Sub-agent of Milestone 5)  
**Date**: 2026-08-18  
**Scope**: `backend/src/users/`, `backend/src/roles/`, `backend/src/statuses/`, `backend/src/auth/`, `frontend/src/lib/api-client.ts`, `frontend/src/features/users/`

---

## 1. Executive Summary

The Logistics TMS backend provides a full CRUD `/api/v1/users` suite built on NestJS 11+ and TypeORM (PostgreSQL on Neon), protected by JWT authentication and strict `SUPER_ADMIN` RBAC guards.

Currently, `frontend/src/features/users/` uses a mock in-memory store (`fakeUsers` from `@/constants/mock-api-users.ts`) with legacy snake_case fields (`first_name`, `last_name`, `phone`) and non-domain roles (`Developer`, `Designer`, `QA`, etc.).

This document details the exact backend endpoint contracts, data schemas, authentication lifecycle, and provides production-ready TypeScript interfaces, API service functions, Zod validation schemas, and UI components to seamlessly connect the frontend Users module to the live NestJS backend.

---

## 2. Backend User APIs Deep Dive

### 2.1 Architecture & Directory Structure
```
backend/src/users/
├── domain/
│   └── user.ts                                  # Domain model class with class-transformer serialization
├── dto/
│   ├── create-user.dto.ts                       # DTO for POST /api/v1/users
│   ├── query-user.dto.ts                        # DTO for GET /api/v1/users (pagination, filters, sort)
│   ├── update-user.dto.ts                       # DTO for PATCH /api/v1/users/:id
│   └── user.dto.ts                              # Base identifier DTO
├── infrastructure/
│   └── persistence/
│       └── relational/
│           ├── entities/user.entity.ts          # TypeORM User entity (mapped to table "user")
│           ├── mappers/user.mapper.ts           # Mapper between TypeORM entity and Domain model
│           ├── relational-persistence.module.ts # Persistence DI module
│           └── repositories/user.repository.ts  # TypeORM relational repository implementation
├── users.controller.ts                          # REST Controller for /api/v1/users
├── users.module.ts                              # Users NestJS module
└── users.service.ts                             # Business logic & repository coordinator
```

### 2.2 Authentication & RBAC Guard Pipeline
In `backend/src/users/users.controller.ts`:
```typescript
@ApiBearerAuth()
@Roles(RoleEnum.SUPER_ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
```
- **JWT Auth**: Every request must carry an `Authorization: Bearer <accessToken>` HTTP header.
- **Roles Guard**: Evaluated by `RolesGuard` (`backend/src/roles/roles.guard.ts`). Only authenticated users with `role.id === 1` (`RoleEnum.SUPER_ADMIN`) are allowed. Non-admin users receive HTTP `403 Forbidden`.

---

### 2.3 Endpoint Specifications

#### Endpoint 1: `GET /api/v1/users` (List Users with Pagination & Filtering)
- **Method**: `GET`
- **Path**: `/api/v1/users`
- **Access**: `SUPER_ADMIN` only
- **Query Parameters** (`QueryUserDto`):
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `page` | `number` | No | `1` | Page number (1-based index) |
  | `limit` | `number` | No | `10` | Page size (capped at `50` by controller) |
  | `filters` | `string` (JSON) | No | `undefined` | JSON string of `FilterUserDto`, e.g. `{"roles":[{"id":1},{"id":2}]}` |
  | `sort` | `string` (JSON) | No | `undefined` | JSON string of `SortUserDto[]`, e.g. `[{"orderBy":"createdAt","order":"DESC"}]` |

- **Response Body** (`InfinityPaginationResponseDto<User>`):
  ```json
  {
    "data": [
      {
        "id": 1,
        "username": "admin",
        "email": "lyquangthai1993+1@gmail.com",
        "provider": "email",
        "socialId": null,
        "firstName": "Super",
        "lastName": "Admin",
        "photo": null,
        "role": {
          "id": 1,
          "name": "Super Admin",
          "displayName": "Quản trị viên cấp cao",
          "description": "Có toàn quyền truy cập vào tất cả các phân hệ, cài đặt hệ thống và quản lý người dùng."
        },
        "status": {
          "id": 1,
          "name": "Active"
        },
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z",
        "deletedAt": null
      }
    ],
    "hasNextPage": false
  }
  ```

---

#### Endpoint 2: `GET /api/v1/users/:id` (Get Single User)
- **Method**: `GET`
- **Path**: `/api/v1/users/:id`
- **Access**: `SUPER_ADMIN` only
- **URL Param**: `id` (`number` in relational PostgreSQL)
- **Response**: `User` object (Status `200 OK`) or `null` (Status `200` with empty body / `404`).

---

#### Endpoint 3: `POST /api/v1/users` (Create User)
- **Method**: `POST`
- **Path**: `/api/v1/users`
- **Access**: `SUPER_ADMIN` only
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body** (`CreateUserDto`):
  ```json
  {
    "email": "dispatcher.user@example.com",
    "password": "Password123!",
    "firstName": "Văn",
    "lastName": "Nguyễn",
    "username": "dispatcher_van",
    "role": {
      "id": 2
    },
    "status": {
      "id": 1
    },
    "photo": null,
    "provider": "email"
  }
  ```
- **Validation Rules**:
  - `email`: Required, valid email format, auto lowercased. Must be unique across active users.
  - `firstName`: Required, string.
  - `lastName`: Required, string.
  - `password`: Optional on create, minimum 6 characters. Hashed via bcrypt salt.
  - `username`: Optional, string, auto lowercased. Must be unique if provided.
  - `role`: Optional `{ id: number }`. If provided, `id` must be in `[1, 2, 3, 4]`.
  - `status`: Optional `{ id: number }`. If provided, `id` must be in `[1, 2]`.
  - `photo`: Optional `{ id: string }` (must exist in `files` table if provided).
- **Response**: Created `User` object (Status `201 Created`).
- **Error Codes**:
  - `422 Unprocessable Entity`:
    - `errors.email = "emailAlreadyExists"`
    - `errors.username = "usernameAlreadyExists"`
    - `errors.role = "roleNotExists"`
    - `errors.status = "statusNotExists"`
    - `errors.photo = "imageNotExists"`
  - `400 Bad Request`: Validation failure (e.g. malformed email or password < 6 chars).

---

#### Endpoint 4: `PATCH /api/v1/users/:id` (Update User)
- **Method**: `PATCH`
- **Path**: `/api/v1/users/:id`
- **Access**: `SUPER_ADMIN` only
- **URL Param**: `id` (`number`)
- **Request Body** (`UpdateUserDto` - all fields optional):
  ```json
  {
    "email": "updated.email@example.com",
    "password": "NewPassword123!",
    "firstName": "Văn A",
    "lastName": "Nguyễn",
    "username": "dispatcher_vana",
    "role": {
      "id": 2
    },
    "status": {
      "id": 1
    }
  }
  ```
- **Response**: Updated `User` object (Status `200 OK`).
- **Behavior**:
  - If `password` is provided, re-hashed via bcrypt only if different.
  - If `email` or `username` is changed, uniqueness check excludes the current user ID.

---

#### Endpoint 5: `DELETE /api/v1/users/:id` (Soft Delete User)
- **Method**: `DELETE`
- **Path**: `/api/v1/users/:id`
- **Access**: `SUPER_ADMIN` only
- **URL Param**: `id` (`number`)
- **Response**: Status `204 No Content` (empty body).
- **Behavior**: TypeORM `softDelete(id)` sets `deletedAt = NOW()`. Records are excluded from future `find` queries.

---

## 3. Role & Status Model in Backend

### 3.1 Role Hierarchy & Identifiers
Defined in `backend/src/roles/roles.enum.ts` and seeded by `role-seed.service.ts`:

| Role Enum | ID (DB) | Code | Display Name (VI) | Description |
|---|---|---|---|---|
| `SUPER_ADMIN` | `1` | `SUPER_ADMIN` | Quản trị viên cấp cao | Toàn quyền truy cập tất cả hệ thống |
| `DISPATCHER` | `2` | `DISPATCHER` | Điều phối viên | Quản lý và phân công đơn hàng vận chuyển |
| `FLEET_MANAGER` | `3` | `FLEET_MANAGER` | Quản lý đội xe | Giám sát xe, bảo dưỡng, phân công tài xế |
| `WAREHOUSE_MANAGER` | `4` | `WAREHOUSE_MANAGER` | Quản lý kho | Quản lý kho bãi, hàng tồn, xuất/nhập kho |

### 3.2 Status Identifiers
Defined in `backend/src/statuses/statuses.enum.ts` and seeded by `status-seed.service.ts`:

| Status Enum | ID (DB) | Code | Name | Display Label (VI) |
|---|---|---|---|---|
| `active` | `1` | `active` | `Active` | Hoạt động |
| `inactive` | `2` | `inactive` | `Inactive` | Tạm ngưng |

---

## 4. Frontend API Client & Auth Integration

### 4.1 Axios Client Configuration (`frontend/src/lib/api-client.ts`)
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`
- **Credentials**: `withCredentials: true` (cookies forwarded)
- **Request Interceptor**:
  - Checks `useAuthStore.getState().accessToken`.
  - Fallback: reads `access_token` from `document.cookie`.
  - Injects `Authorization: Bearer <token>`.
- **Response Interceptor (401 Auto Refresh)**:
  - Intercepts HTTP 401 Unauthorized.
  - Queues pending requests.
  - Calls `POST /api/v1/auth/refresh` using refresh token (from Zustand store or cookie).
  - Updates store and cookies with new tokens.
  - Retries queued requests with new token.
  - If refresh fails, triggers `logout()` and redirects to `/auth/sign-in`.

### 4.2 Handling Server Prefetch vs Client Execution
- In Next.js Server Components (e.g. `UserListingPage`):
  - `queryClient.prefetchQuery(usersQueryOptions(filters))` can be executed.
  - On the client side, `<UsersTable />` calls `useSuspenseQuery(usersQueryOptions(filters))`.
  - The client query key matches `['users', 'list', filters]`, allowing TanStack Query to hydrate the prefetched data or fetch client-side if needed.

---

## 5. Frontend Migration Specifications

### 5.1 Field Mapping Comparison

| Feature Field | Mock Version (`mock-api-users.ts`) | Live NestJS Backend (`User`) | Action Required |
|---|---|---|---|
| Identifier | `id: number` | `id: number` | Retain `number` |
| First Name | `first_name: string` | `firstName: string \| null` | Rename to `firstName` |
| Last Name | `last_name: string` | `lastName: string \| null` | Rename to `lastName` |
| Username | *(none)* | `username?: string \| null` | Add `username` to forms & table |
| Email | `email: string` | `email: string \| null` | Match `email` |
| Phone | `phone: string` | *(none in base User entity)* | Remove required phone validation; optional UI |
| Role | `role: string` ('Developer', etc.) | `role?: { id: number, name: string, displayName?: string }` | Update to TMS roles (`1..4`) |
| Status | `status: string` ('Active', etc.) | `status?: { id: number, name: string }` | Update to Status (`1..2`) |
| Timestamps | `created_at`, `updated_at` | `createdAt: string`, `updatedAt: string` | Update to camelCase |
| List Response | `{ users: User[], total_users: number }` | `{ data: User[], hasNextPage: boolean }` | Adapt `UsersResponse` & pagination |

---

### 5.2 Exact TypeScript Interfaces (`frontend/src/features/users/api/types.ts`)

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

export interface UserPhoto {
  id: string;
  path: string;
}

export interface User {
  id: number;
  username?: string | null;
  email: string | null;
  provider?: string;
  socialId?: string | null;
  firstName: string | null;
  lastName: string | null;
  photo?: UserPhoto | null;
  role?: Role | null;
  status?: Status | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roles?: string;
  sort?: string;
}

export interface UsersResponse {
  data: User[];
  hasNextPage: boolean;
  total_users?: number;
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  role?: { id: number } | null;
  status?: { id: number } | null;
  photo?: { id: string } | null;
  provider?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}
```

---

### 5.3 Exact API Service Functions (`frontend/src/features/users/api/service.ts`)

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

  // Convert role filter to backend JSON structure if present
  if (filters.roles) {
    const roleId = Number(filters.roles);
    if (!isNaN(roleId) && roleId > 0) {
      params.filters = JSON.stringify({ roles: [{ id: roleId }] });
    }
  }

  // Pass sort JSON if provided
  if (filters.sort) {
    params.sort = filters.sort;
  }

  const res = await apiClient.get<UsersResponse>('/api/v1/users', { params });
  return res.data;
}

export async function getUserById(id: number): Promise<User> {
  const res = await apiClient.get<User>(`/api/v1/users/${id}`);
  return res.data;
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  const res = await apiClient.post<User>('/api/v1/users', data);
  return res.data;
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<User> {
  const res = await apiClient.patch<User>(`/api/v1/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/users/${id}`);
}
```

---

### 5.4 Exact TanStack Query Keys & Hooks (`frontend/src/features/users/api/queries.ts`)

```typescript
import { queryOptions } from '@tanstack/react-query';
import { getUsers, getUserById } from './service';
import type { User, UserFilters } from './types';

export type { User };

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });

export const userDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id
  });
```

---

### 5.5 Exact TanStack Mutation Hooks (`frontend/src/features/users/api/mutations.ts`)

```typescript
import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createUser, updateUser, deleteUser } from './service';
import { userKeys } from './queries';
import type { CreateUserPayload, UpdateUserPayload } from './types';

export const createUserMutation = mutationOptions({
  mutationFn: (data: CreateUserPayload) => createUser(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateUserMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateUserPayload }) =>
    updateUser(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: number) => deleteUser(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});
```

---

### 5.6 UI Options & TMS Role Badges (`frontend/src/features/users/components/users-table/options.tsx`)

```typescript
export const ROLE_OPTIONS = [
  { value: '1', label: 'Quản trị viên (Super Admin)', roleCode: 'SUPER_ADMIN' },
  { value: '2', label: 'Điều phối viên (Dispatcher)', roleCode: 'DISPATCHER' },
  { value: '3', label: 'Quản lý Đội xe (Fleet Manager)', roleCode: 'FLEET_MANAGER' },
  { value: '4', label: 'Quản lý Kho (Warehouse Manager)', roleCode: 'WAREHOUSE_MANAGER' }
];

export const STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động (Active)' },
  { value: '2', label: 'Tạm ngưng (Inactive)' }
];
```

---

### 5.7 Zod Validation Schema (`frontend/src/features/users/schemas/user.ts`)

```typescript
import * as z from 'zod';

export const userSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên (First Name)'),
  lastName: z.string().min(1, 'Vui lòng nhập họ (Last Name)'),
  username: z.string().optional(),
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    }),
  roleId: z.coerce.number().min(1, 'Vui lòng chọn vai trò'),
  statusId: z.coerce.number().min(1, 'Vui lòng chọn trạng thái')
});

export type UserFormValues = z.infer<typeof userSchema>;
```

---

### 5.8 Error Handling & Toast Notification Compliance
Per system workspace rules, all error toasts must extract `err?.response?.data?.message` with Vietnamese fallbacks:

```typescript
onError: (err: any) => {
  const apiMessage =
    err?.response?.data?.errors
      ? Object.values(err.response.data.errors).join(', ')
      : err?.response?.data?.message;
  toast.error(apiMessage || 'Có lỗi xảy ra. Vui lòng thử lại.');
}
```

---

## 6. Implementation Checklist for Sub-Orchestrator & Implementer

- [ ] **Step 1**: Update `frontend/src/features/users/api/types.ts` with domain `User`, `Role`, `Status`, `CreateUserPayload`, `UpdateUserPayload`.
- [ ] **Step 2**: Update `frontend/src/features/users/api/service.ts` to call `apiClient.get/post/patch/delete` on `/api/v1/users`.
- [ ] **Step 3**: Update `frontend/src/features/users/schemas/user.ts` to use `firstName`, `lastName`, `username`, `email`, `password`, `roleId`, `statusId`.
- [ ] **Step 4**: Update `frontend/src/features/users/components/users-table/options.tsx` with TMS roles `1..4` and statuses `1..2`.
- [ ] **Step 5**: Update `frontend/src/features/users/components/users-table/columns.tsx` to display `firstName`, `lastName`, `username`, `email`, role badge with localized display names, and status badge.
- [ ] **Step 6**: Update `frontend/src/features/users/components/users-table/index.tsx` to parse `data.data` and calculate `pageCount` gracefully with `hasNextPage`.
- [ ] **Step 7**: Update `frontend/src/features/users/components/user-form-sheet.tsx` with updated form fields, password support, and localized Vietnamese toasts.
- [ ] **Step 8**: Run `npm run build` in `frontend/` to confirm 0 TypeScript / compile errors.
