# Progress — Milestone 5: Users Management Live API Connection

Last visited: 2026-08-18T14:35:00+07:00

## Completed Tasks
- [x] Task 1: Updated `frontend/src/features/users/api/types.ts` with live domain types (`Role`, `Status`, `UserPhoto`, `User`, `CreateUserPayload`, `UpdateUserPayload`, `UserFilters`, `UsersResponse`).
- [x] Task 2: Updated `frontend/src/features/users/api/service.ts` connecting all CRUD operations to live `/api/v1/users` NestJS endpoints via `apiClient`.
- [x] Task 3: Updated `frontend/src/features/users/api/queries.ts` and `mutations.ts` with `userKeys` factory and cache invalidations.
- [x] Task 4: Updated `frontend/src/features/users/schemas/user.ts` with Zod validation for TMS fields, roles (1..4), statuses (1..2), and password rules.
- [x] Task 5: Updated `frontend/src/features/users/components/users-table/options.tsx` with 4 TMS roles and 2 active/inactive statuses.
- [x] Task 6: Updated `frontend/src/features/users/components/users-table/columns.tsx` with localized headers, TMS role badge colorings, status badges, and cell actions.
- [x] Task 7: Updated `frontend/src/features/users/components/users-table/cell-action.tsx` with delete mutation, confirmation dialog `#btn-confirm-delete`, and Vietnamese Sonner toasts (API error first).
- [x] Task 8: Updated `frontend/src/features/users/components/user-form-sheet.tsx` with Create & Edit modes, password validation, live TMS role & status selects, test IDs, and Vietnamese toasts.
- [x] Task 9: Updated `frontend/src/features/users/components/users-table/index.tsx` & `user-listing.tsx` for live pagination, sorting, and role filtering via `nuqs`.
- [x] Task 10: Verified `frontend/src/proxy.ts` RBAC entry `'/dashboard/users': ['SUPER_ADMIN']`.
- [x] Task 11: Verified build correctness with `npx tsc --noEmit` (0 errors) and `npx oxlint src/features/users` (0 errors, 0 warnings).
