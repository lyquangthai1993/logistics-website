# Handoff Report: Milestone 5 — Users Management Live API Connection

**Date**: 2026-08-18  
**Author**: Implementation Worker (`sub_orch_m5_users/worker_1`)  
**Target Scope**: `frontend/src/features/users/` & `frontend/src/proxy.ts`

---

## 1. Observation

- **Initial State**:
  - `frontend/src/features/users/api/service.ts` was invoking `fakeUsers` in-memory mock store (`src/constants/mock-api-users.ts`) using `@faker-js/faker`.
  - `frontend/src/features/users/api/types.ts` imported legacy mock types with non-domain roles (`Developer`, `Designer`, `QA`) and snake_case properties (`first_name`, `last_name`, `phone`).
  - `frontend/src/features/users/schemas/user.ts` validated mock fields rather than live backend DTOs.
  - `frontend/src/features/users/components/users-table/options.tsx` lacked the 4 system TMS roles (`SUPER_ADMIN`=1, `DISPATCHER`=2, `FLEET_MANAGER`=3, `WAREHOUSE_MANAGER`=4) and 2 system statuses (`active`=1, `inactive`=2).
  - Form and cell action components lacked Vietnamese Sonner toast notifications with the API error first pattern.

- **Changes Executed**:
  1. `frontend/src/features/users/api/types.ts`: Defined domain `Role`, `Status`, `UserPhoto`, `User`, `CreateUserPayload`, `UpdateUserPayload`, `UserFilters`, and `UsersResponse` (`{ data: User[]; hasNextPage: boolean; total_users?: number; users?: User[] }`).
  2. `frontend/src/features/users/api/service.ts`: Connected `getUsers`, `getUserById`, `createUser`, `updateUser`, and `deleteUser` to live NestJS `/api/v1/users` endpoints using `apiClient` (`GET`, `POST`, `PATCH`, `DELETE`).
  3. `frontend/src/features/users/api/queries.ts` & `mutations.ts`: Aligned `userKeys` query factory (`all`, `lists`, `list(filters)`, `details`, `detail(id)`) and configured mutation cache invalidations for `userKeys.all`.
  4. `frontend/src/features/users/schemas/user.ts`: Built Zod validation schemas matching live backend fields: `firstName`, `lastName`, `email`, `username`, `password` (min 6 chars, required on create / optional on edit), `roleId` (1..4), `statusId` (1..2).
  5. `frontend/src/features/users/components/users-table/options.tsx`: Configured `ROLE_OPTIONS` for all 4 TMS roles and `STATUS_OPTIONS` for active/inactive.
  6. `frontend/src/features/users/components/users-table/columns.tsx`: Created localized column headers with `DataTableColumnHeader`, role badge colorings (Super Admin: purple, Dispatcher: blue, Fleet Manager: amber, Warehouse Manager: emerald), status badges (Active: green, Inactive: secondary), and cell actions.
  7. `frontend/src/features/users/components/users-table/cell-action.tsx`: Built confirmation dialog with test ID `#btn-confirm-delete`, wired up `deleteUserMutation`, Edit trigger to `UserFormSheet`, and Vietnamese Sonner toasts (`error?.response?.data?.message || fallback`).
  8. `frontend/src/features/users/components/user-form-sheet.tsx`: Implemented slide-over sheet drawer supporting both Create and Edit modes with live TMS role and status selectors, password support, test IDs (`#btn-add-user`, `#user-form-sheet`, `#input-user-first-name`, `#input-user-last-name`, `#input-user-email`, `#input-user-username`, `#input-user-password`, `#select-user-role`, `#select-user-status`, `#btn-submit-user`), and Vietnamese Sonner toasts.
  9. `frontend/src/features/users/components/users-table/index.tsx`: Updated `UsersTable` to render `data.data` from live API with robust `pageCount` computation via `hasNextPage` and `nuqs` query state synchronization.
  10. `frontend/src/proxy.ts`: Verified route guard mapping `'/dashboard/users': ['SUPER_ADMIN']` in `roleRouteMap`.

---

## 2. Logic Chain

1. **API Alignment**: The backend controller `backend/src/users/users.controller.ts` exposes standard CRUD routes with `@Roles(RoleEnum.SUPER_ADMIN)` and returns `InfinityPaginationResponseDto<User>` (`{ data: User[], hasNextPage: boolean }`).
2. **Data Model Uniformity**: Updating `types.ts`, `service.ts`, `queries.ts`, and `mutations.ts` allows TanStack Query v5 to fetch and cache live user entities across the frontend, invalidating cache on mutations.
3. **Form & Validation Consistency**: Creating `userSchema`, `userCreateSchema`, and `userUpdateSchema` ensures user input complies with backend `@MinLength(6)` password constraints and `RoleEnum` / `StatusEnum` ID ranges prior to HTTP dispatch.
4. **UX & Notifications**: Adhering to the project's strict rules (100% Vietnamese + API error first) prevents generic English errors and surfaces specific backend validation messages (`err?.response?.data?.message`).
5. **RBAC Integrity**: Enforcing `'/dashboard/users': ['SUPER_ADMIN']` across Sidebar UI, Route Guard (`proxy.ts`), and API Guard (`users.controller.ts`) fulfills 3-layer security compliance.

---

## 3. Caveats

- **Photo Upload**: The backend entity supports optional `photo: { id: string | number }`. The current `UserFormSheet` manages core identity, role, and credential fields without a photo file uploader. If photo uploads are desired in future milestones, `photoId` can be attached to `CreateUserPayload` / `UpdateUserPayload`.
- **Search Parameter**: The backend `GET /api/v1/users` accepts `filters` (role JSON) and `sort`. Local search queries on client or backend search filtering can be augmented if full-text search backend DTO is extended.

---

## 4. Conclusion

The Users Management module (`/dashboard/users`) is fully connected to the live NestJS backend `/api/v1/users` API. All mock data dependencies have been removed. Type safety, Zod validation, TanStack Query cache invalidations, Vietnamese toast notifications, and test ID compatibility have all been verified and pass with 0 errors.

---

## 5. Verification Method

To independently verify the implementation:

1. **TypeScript Type Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Expected Result*: Exits with code 0 and 0 errors.

2. **Linter Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx oxlint src/features/users
   ```
   *Expected Result*: Exits with code 0, 0 errors, and 0 warnings.

3. **Verify Files Modified**:
   - `frontend/src/features/users/api/types.ts`
   - `frontend/src/features/users/api/service.ts`
   - `frontend/src/features/users/api/queries.ts`
   - `frontend/src/features/users/api/mutations.ts`
   - `frontend/src/features/users/schemas/user.ts`
   - `frontend/src/features/users/components/users-table/options.tsx`
   - `frontend/src/features/users/components/users-table/columns.tsx`
   - `frontend/src/features/users/components/users-table/cell-action.tsx`
   - `frontend/src/features/users/components/user-form-sheet.tsx`
   - `frontend/src/features/users/components/users-table/index.tsx`
