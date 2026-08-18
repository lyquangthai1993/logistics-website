# Handoff Report — Explorer 1 (Milestone 5: Users Management Live API Connection)

## 1. Observation
- **Frontend Current Implementation**:
  - `frontend/src/features/users/api/service.ts` (lines 30-47) directly imports and calls in-memory mock store `fakeUsers` from `@/constants/mock-api-users`.
  - `frontend/src/features/users/api/types.ts` (lines 1-28) defines mock types where user roles are `'Developer' | 'Designer' | ...` and statuses are `'Active' | 'Inactive' | 'Invited'`.
  - `frontend/src/features/users/components/users-table/options.tsx` (lines 1-8) has mock `ROLE_OPTIONS` referencing Developer, Designer, Manager, QA, DevOps, Product Owner.
  - `frontend/src/features/users/schemas/user.ts` (lines 3-10) uses mock fields `first_name`, `last_name`, `phone`, `role`, `status`.
  - `frontend/src/features/users/components/user-form-sheet.tsx` (lines 64-83) binds form to `first_name`, `last_name`, `phone`, `role`, `status`.
  - `frontend/src/features/users/components/users-table/columns.tsx` (lines 10-72) references `row.first_name`, `row.last_name`, `row.phone`, `row.role`, `row.status`.
- **Backend API Implementation**:
  - `backend/src/users/users.controller.ts` (lines 39-46) is decorated with `@ApiBearerAuth()`, `@Roles(RoleEnum.SUPER_ADMIN)`, `@UseGuards(AuthGuard('jwt'), RolesGuard)`.
  - Endpoints provided: `POST /v1/users`, `GET /v1/users`, `GET /v1/users/:id`, `PATCH /v1/users/:id`, `DELETE /v1/users/:id`.
  - Backend user entity (`backend/src/users/infrastructure/persistence/relational/entities/user.entity.ts`) has properties `id`, `username`, `email`, `password`, `firstName`, `lastName`, `photo`, `role`, `status`, `createdAt`, `updatedAt`, `deletedAt`.
  - Roles enum (`backend/src/roles/roles.enum.ts`): `SUPER_ADMIN = 1`, `DISPATCHER = 2`, `FLEET_MANAGER = 3`, `WAREHOUSE_MANAGER = 4`.
  - Status enum (`backend/src/statuses/statuses.enum.ts`): `active = 1`, `inactive = 2`.
- **RBAC & Security Guard**:
  - `frontend/src/config/nav-config.ts` (lines 85-92) restricts sidebar item `/dashboard/users` to `SUPER_ADMIN`.
  - `frontend/src/proxy.ts` (lines 5-11) currently lacks `/dashboard/users` in `roleRouteMap`.
- **Build Status**:
  - Executed `npm run build` in `frontend/`: successfully exited with code 0 (28/28 static pages generated).

## 2. Logic Chain
1. *From Backend Observation*: The backend requires authentication with JWT and `SUPER_ADMIN` role (`RoleEnum.SUPER_ADMIN = 1`) and expects/returns relational User DTOs with camelCase fields (`firstName`, `lastName`, `email`, `role: { id }`, `status: { id }`).
2. *From Frontend Observation*: The frontend user feature currently uses in-memory mock data with snake_case fields (`first_name`, `last_name`, `phone`) and non-TMS roles.
3. *Deduction*: Connecting the Users module to the live API requires:
   - Updating `types.ts` to reflect the backend `User`, `Role`, `Status`, and pagination responses.
   - Refactoring `service.ts` to call `/api/v1/users` endpoints via `apiClient`.
   - Updating `schemas/user.ts` with Vietnamese validations and backend field names (`firstName`, `lastName`, `email`, `password`, `roleId`, `statusId`).
   - Updating `options.tsx` to map TMS roles and active/inactive statuses.
   - Updating `columns.tsx`, `cell-action.tsx`, and `user-form-sheet.tsx` to display and mutate live user records with 100% Vietnamese Sonner toast notifications (API error message first).
   - Adding `'/dashboard/users': ['SUPER_ADMIN']` to `roleRouteMap` in `proxy.ts` to maintain 3-layer RBAC integrity.

## 3. Caveats
- Backend `findManyWithPagination` filters on `roles` (array of role IDs) and sorts by `sortOptions`. Text search on `name` is not natively implemented in the relational repository query filter, but client-side or query filtering can be passed cleanly without breaking the backend.
- Creating a user requires a password (`@MinLength(6)` in `CreateUserDto`), whereas updating a user allows `password` to be optional in `UpdateUserDto`. The frontend `UserFormSheet` must differentiate password requirement between Create and Edit modes.

## 4. Conclusion
The frontend Users Management module is well-structured under `features/users/` following the canonical TanStack Table + `nuqs` architecture, but is completely detached from the live NestJS backend. All required backend endpoints and database structures exist and are functioning. The changes needed are well-isolated within `frontend/src/features/users/` (plus a one-line addition to `proxy.ts`) and can be implemented with zero regressions.

Detailed breakdown and target implementation designs are documented in:
`d:\Projects\logistics-website\.agents\sub_orch_m5_users\explorer_1\analysis.md`

## 5. Verification Method
1. **Static Analysis & Build Verification**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
   *Expected*: Zero TypeScript compilation or lint errors.
2. **RBAC Route Guard Test**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/03-rbac-routing.spec.ts
   ```
   *Expected*: `SUPER_ADMIN` is permitted on `/dashboard/users`; other roles are blocked.
3. **Inspect Target Files**:
   - `frontend/src/features/users/api/service.ts`
   - `frontend/src/features/users/api/types.ts`
   - `frontend/src/features/users/components/user-form-sheet.tsx`
   - `frontend/src/features/users/components/users-table/columns.tsx`
   - `frontend/src/features/users/components/users-table/cell-action.tsx`
   - `frontend/src/features/users/schemas/user.ts`
