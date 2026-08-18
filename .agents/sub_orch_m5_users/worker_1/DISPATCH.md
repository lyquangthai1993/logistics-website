## 2026-08-18T07:23:14Z

You are the Implementation Worker for Milestone 5: Users Management Live API Connection (/dashboard/users).
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m5_users\worker_1\

READ FIRST:
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- Project Architecture: d:\Projects\logistics-website\.agents\PROJECT.md
- Scope Document: d:\Projects\logistics-website\.agents\sub_orch_m5_users\SCOPE.md
- RBAC Matrix: d:\Projects\logistics-website\.agents\rules\rbac-matrix.md
- Explorer 1 Analysis: d:\Projects\logistics-website\.agents\sub_orch_m5_users\explorer_1\analysis.md
- Explorer 2 Analysis: d:\Projects\logistics-website\.agents\sub_orch_m5_users\explorer_2\analysis.md
- Spec Miner Findings: d:\Projects\logistics-website\.agents\sub_orch_m5_users\spec_miner_1\spec.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own all files in:
- `frontend/src/features/users/` (all subdirectories: api, components, hooks, schemas, types)
- `frontend/src/proxy.ts` (adding '/dashboard/users' RBAC entry if needed)
Do NOT modify files outside your ownership.

TASKS:
1. Update `frontend/src/features/users/api/types.ts`:
   - Define live backend models: `Role` ({ id: number; name?: string }), `Status` ({ id: number; name?: string }), `User` ({ id: number; email: string; firstName: string; lastName: string; username?: string; role?: Role; status?: Status; createdAt?: string; updatedAt?: string; photo?: any; }), `CreateUserPayload`, `UpdateUserPayload`, `UsersQueryParams`, `UsersResponse` ({ data: User[]; hasNextPage: boolean }).
2. Update `frontend/src/features/users/api/service.ts`:
   - Replace all `fakeUsers` mock calls with real HTTP requests using `apiClient` (`/api/v1/users`).
   - `getUsers(params)` -> `apiClient.get('/api/v1/users', { params })`
   - `getUserById(id)` -> `apiClient.get('/api/v1/users/' + id)`
   - `createUser(payload)` -> `apiClient.post('/api/v1/users', payload)`
   - `updateUser(id, payload)` -> `apiClient.patch('/api/v1/users/' + id, payload)`
   - `deleteUser(id)` -> `apiClient.delete('/api/v1/users/' + id)`
3. Update `frontend/src/features/users/api/queries.ts` and `mutations.ts`:
   - Align query key factory `userKeys` (`all`, `lists`, `list(params)`, `details`, `detail(id)`).
   - Invalidate queries on successful create, update, delete mutations.
4. Update `frontend/src/features/users/schemas/user.ts`:
   - Zod schema matching TMS user fields: `firstName`, `lastName`, `email`, `username`, `password` (min 6 chars, required on create, optional on edit), `roleId` (number, 1..4), `statusId` (number, 1..2).
5. Update `frontend/src/features/users/components/users-table/options.tsx`:
   - `ROLE_OPTIONS`: `SUPER_ADMIN` (id: 1, label: 'Super Admin'), `DISPATCHER` (id: 2, label: 'Điều phối viên'), `FLEET_MANAGER` (id: 3, label: 'Quản lý đội xe'), `WAREHOUSE_MANAGER` (id: 4, label: 'Quản lý kho').
   - `STATUS_OPTIONS`: `active` (id: 1, label: 'Hoạt động'), `inactive` (id: 2, label: 'Ngừng hoạt động').
6. Update `frontend/src/features/users/components/users-table/columns.tsx`:
   - Display `firstName`, `lastName`, `email`, `role`, `status` using `DataTableColumnHeader`.
   - Role badges with distinct variant colors.
   - Status badges (`active` -> default/success, `inactive` -> secondary/destructive).
   - Row actions via `cell-action.tsx`.
7. Update `frontend/src/features/users/components/users-table/cell-action.tsx`:
   - Wire up `useDeleteUser` mutation with AlertModal.
   - Wire up Edit trigger to open `UserFormSheet` with existing user data.
   - 100% Vietnamese Sonner toast notifications with `apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback');`.
   - Preserve test ID `#btn-confirm-delete` and cursor styles.
8. Update `frontend/src/features/users/components/user-form-sheet.tsx`:
   - Create and Edit modes with `useCreateUser` and `useUpdateUser`.
   - Role and Status dropdown selectors with live options.
   - 100% Vietnamese toast notifications with API message first pattern.
   - Preserve `#btn-add-user`, `#user-form-sheet`, `#input-user-first-name`, `#input-user-last-name`, `#input-user-email`, `#select-user-role`, `#select-user-status`.
9. Update `frontend/src/features/users/components/users-table/index.tsx` & `users-listing.tsx`:
   - Ensure table pagination and filtering work seamlessly with TanStack Table + `nuqs`.
10. Update `frontend/src/proxy.ts`:
    - Ensure `'/dashboard/users': ['SUPER_ADMIN']` is in `roleRouteMap`.
11. VERIFICATION:
    - Run `npm run build` in `frontend/` directory. Ensure 0 TypeScript or compile errors.
    - Document build output and test results in your handoff report.
