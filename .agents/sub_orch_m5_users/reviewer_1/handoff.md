# Review & Adversarial Challenge Report: Milestone 5 — Users Management Live API

**Target Scope**: `frontend/src/features/users/` & `frontend/src/app/dashboard/users/page.tsx`  
**Reviewer**: Reviewer 1 (`sub_orch_m5_users/reviewer_1`)  
**Gate Verdict**: **APPROVE**  
**Integrity Status**: **CLEAN (0 Integrity Violations)**  

---

## 1. Observation

Direct code inspections, linting, compilation, and automated test execution across the workspace:

1. **Absence of Mock Data**:
   - Grep search for `fakeUsers`, `@faker-js/faker`, and `mock-api-users` in `frontend/src/features/users/` and `frontend/src/app/dashboard/users/` returned 0 occurrences.
   - All mock references have been removed in favor of real HTTP requests via `apiClient`.

2. **API Service & DTO Contracts**:
   - `frontend/src/features/users/api/service.ts`:
     - `getUsers(filters)` maps `page`, `limit`, `sort`, and `filters.roles` into `JSON.stringify({ roles: [{ id: roleId }] })`, precisely matching backend NestJS `QueryUserDto.filters` (`FilterUserDto` with `roles: RoleDto[]`).
     - `getUserById(id)` invokes `GET /api/v1/users/:id`.
     - `createUser(payload)` invokes `POST /api/v1/users`.
     - `updateUser(id, payload)` invokes `PATCH /api/v1/users/:id`.
     - `deleteUser(id)` invokes `DELETE /api/v1/users/:id`.
   - `frontend/src/features/users/api/types.ts`: Domain models `Role`, `Status`, `UserPhoto`, `User`, `CreateUserPayload`, `UpdateUserPayload`, `UserFilters`, and `UsersResponse` match backend relational entity schemas.

3. **TanStack Query v5 Keys & Cache Invalidation**:
   - `frontend/src/features/users/api/queries.ts`: Hierarchical query keys defined (`userKeys.all`, `userKeys.lists()`, `userKeys.list(filters)`, `userKeys.details()`, `userKeys.detail(id)`).
   - `frontend/src/features/users/api/mutations.ts`: `createUserMutation`, `updateUserMutation`, and `deleteUserMutation` all call `getQueryClient().invalidateQueries({ queryKey: userKeys.all })` upon `onSuccess`.

4. **TMS Roles & Localization**:
   - `frontend/src/features/users/components/users-table/options.tsx` & `columns.tsx`:
     - All 4 TMS roles configured: `SUPER_ADMIN` (ID 1, purple badge), `DISPATCHER` (ID 2, blue badge), `FLEET_MANAGER` (ID 3, amber badge), `WAREHOUSE_MANAGER` (ID 4, emerald badge).
     - System statuses configured: `active` (ID 1, green badge), `inactive` (ID 2, gray badge).
     - 100% Vietnamese toast messages with API-error-first extraction (`error?.response?.data?.message || ... || fallback`).

5. **Test ID & Element Preservation**:
   - Preserved all required test IDs and interactive identifiers: `#btn-add-user`, `#user-form-sheet`, `#input-user-first-name`, `#input-user-last-name`, `#input-user-email`, `#input-user-username`, `#input-user-password`, `#select-user-role`, `#select-user-status`, `#btn-submit-user`, `#delete-user-dialog`, `#btn-confirm-delete`.

6. **Static Analysis & Build Verification**:
   - `npx tsc --noEmit` in `frontend/`: Exit code 0, 0 errors.
   - `npx oxlint src/features/users` in `frontend/`: Exit code 0, 0 errors, 0 warnings across 12 files.
   - `npm run build` in `frontend/`: Next.js 16.2.12 production build succeeded with static page generation (28/28 routes compiled, dynamic route `ƒ /dashboard/users` registered).
   - Playwright E2E test suite (`02-login-flow.spec.ts` & `03-rbac-routing.spec.ts`): 31/31 tests passed (100%).

---

## 2. Logic Chain

1. **Contract Compatibility**: The frontend service payload parameters and response mappings match the NestJS `UsersController` (`backend/src/users/users.controller.ts`) and DTO specifications (`create-user.dto.ts`, `update-user.dto.ts`, `query-user.dto.ts`).
2. **Cache Integrity**: Invalidating `userKeys.all` immediately upon any mutation (`create`, `update`, `delete`) ensures that both table listings and user detail caches are refreshed without stale data anomalies.
3. **Form & Security Logic**: `UserFormSheet` cleanly separates create vs. edit modes. In edit mode, password fields are optional; leaving the password blank avoids passing empty strings to the backend `UpdateUserDto`.
4. **Adversarial Resilience**:
   - *Null names/usernames*: `columns.tsx` safely falls back to `${firstName} ${lastName}` -> `username` -> `'Không tên'` / `email`.
   - *API error responses*: Toasts safely inspect both `err.response.data.message` and `err.response.data.errors` (string or object format) before falling back to Vietnamese defaults.
   - *Table pagination*: `pageCount` handles cases where total user count is absent by checking `hasNextPage`.
5. **No Regressions**: Full E2E suite passes for login and RBAC routing, maintaining 3-layer authorization.

---

## 3. Caveats

- **Photo Upload Integration**: Backend `User` supports optional `photo: { id: string | number }`. The current form covers text attributes, credentials, role, and status. Attaching an S3 / local file uploader can be added in a dedicated media-management iteration.
- **Backend Search**: Currently, client-side searching is bound to table filters; if backend provides a global search query parameter in future revisions, `service.ts` can propagate it directly.

---

## 4. Conclusion & Verdict

**Verdict**: **APPROVE**

The code changes implemented by `worker_1` for Milestone 5 fulfill all architectural, typing, validation, and domain requirements. No mock leakage or integrity shortcuts exist. Static typing, linter, production build, and E2E routing verification all pass with 0 errors.

---

## 5. Verification Method

To independently reproduce the verification:

```powershell
# 1. Type Check
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit

# 2. Linter
npx oxlint src/features/users

# 3. Next.js Production Build
npm run build

# 4. Playwright E2E Tests
npx playwright test e2e/02-login-flow.spec.ts e2e/03-rbac-routing.spec.ts
```
