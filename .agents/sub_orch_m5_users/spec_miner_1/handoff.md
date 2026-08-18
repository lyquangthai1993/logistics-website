# Handoff Report — Spec Miner 1 (Milestone 5: Users Management Live API)

## 1. Observation
- **Backend Role & Status Entities & DTOs**:
  - `backend/src/roles/roles.enum.ts`: `SUPER_ADMIN = 1`, `DISPATCHER = 2`, `FLEET_MANAGER = 3`, `WAREHOUSE_MANAGER = 4`.
  - `backend/src/statuses/statuses.enum.ts`: `active = 1`, `inactive = 2`.
  - `backend/src/users/users.controller.ts` L40-47: Endpoint `/api/v1/users` is guarded at class level with `@Roles(RoleEnum.SUPER_ADMIN)` and `@UseGuards(AuthGuard('jwt'), RolesGuard)`.
  - `backend/src/users/dto/create-user.dto.ts` & `update-user.dto.ts`: Fields include `email` (`@IsNotEmpty()`, `@IsEmail()`), `firstName` (`@IsNotEmpty()`), `lastName` (`@IsNotEmpty()`), `password` (`@MinLength(6)` optional/hashed), `username` (optional), `role` (`RoleDto`), `status` (`StatusDto`).
  - `backend/src/users/users.service.ts` L47-70, L96-131: Validates uniqueness of `username` and `email` (`422 UnprocessableEntityException` with `usernameAlreadyExists`, `emailAlreadyExists`), checks existence of `role.id` (`roleNotExists`) and `status.id` (`statusNotExists`).
- **Frontend Current State**:
  - `frontend/src/features/users/schemas/user.ts`: Currently uses mock fields (`first_name`, `last_name`, `email`, `phone`, `role`, `status`).
  - `frontend/src/features/users/components/users-table/options.tsx`: Currently has mock roles (`Developer`, `Designer`, `Manager`, `QA`, `DevOps`, `Product Owner`).
  - `frontend/src/features/users/api/service.ts`: Calls mock `fakeUsers` from `@/constants/mock-api-users`.
  - `frontend/src/config/nav-config.ts` L91: Menu item `/dashboard/users` has `access: { role: 'SUPER_ADMIN' }`.
  - `frontend/src/proxy.ts`: Contains `roleRouteMap` for other modules; needs explicit `/dashboard/users` entry for complete 3-layer consistency.
- **Toast Requirements**:
  - `.agents/ORIGINAL_REQUEST.md` L48-73: Strict requirement for 100% Vietnamese toasts and API-message-first error handling (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'fallback')`).
- **Playwright Test Selectors**:
  - `frontend/e2e/helpers/auth.ts`: Contains 4 seed accounts (`lyquangthai1993+1@gmail.com` through `+4@gmail.com` with password `secret`).

## 2. Logic Chain
1. **Role Identification**: The backend codebase and `rbac-matrix.md` strictly define 4 TMS roles. The frontend `options.tsx` and `columns.tsx` currently display generic tech demo roles (`Developer`, `Designer`, etc.). These must be replaced with the 4 TMS roles with IDs `1..4`.
2. **Schema & API Contract Alignment**: The live backend DTOs use `firstName`, `lastName`, `email`, `username`, `password`, `role` (`{ id }`), `status` (`{ id }`). The frontend Zod schema, types, and form sheet must align with these field names and validation rules (e.g. min length 6 for password, valid email, required role ID).
3. **Live API Integration**: `frontend/src/features/users/api/service.ts` must replace mock calls with `apiClient` HTTP requests (`GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`).
4. **Toast Notification Standardization**: Error handling in `UserFormSheet` and `CellAction` must adhere to Vietnamese + API message first pattern.
5. **Selector Preservation**: Key element IDs (`#user-search-input`, `#btn-add-user`, `#user-form-sheet`, `#btn-confirm-delete`) allow stable E2E testing.

## 3. Caveats
- Backend `UserEntity` does not have a `phone` column in TypeORM schema, unlike the old mock data. Any frontend form field for phone should either be removed or treated as optional client metadata if backend is not modified.
- `GET /api/v1/users` returns `{ data: User[], hasNextPage: boolean }` from `infinityPagination`. The table page count calculation should adapt to this structure.

## 4. Conclusion
The authoritative specification discovery for Milestone 5 (Users Management Live API Connection) is complete and documented in `spec.md`. The design, backend endpoints, DTO validation rules, TMS roles, Vietnamese toast catalog, and Playwright selector mappings are fully probed and ready for the implementation agent.

## 5. Verification Method
- Inspect specification file: `view_file AbsolutePath="d:/Projects/logistics-website/.agents/sub_orch_m5_users/spec_miner_1/spec.md"`
- Validate against backend DTOs: `view_file AbsolutePath="d:/Projects/logistics-website/backend/src/users/dto/create-user.dto.ts"`
- Validate against RBAC matrix: `view_file AbsolutePath="d:/Projects/logistics-website/.agents/rules/rbac-matrix.md"`
- Validate against toast rules: `view_file AbsolutePath="d:/Projects/logistics-website/.agents/ORIGINAL_REQUEST.md"`
