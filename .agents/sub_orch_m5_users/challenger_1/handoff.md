# Challenger 1 Report: Milestone 5 — Users Management Live API Connection

**Date**: 2026-08-18  
**Author**: Empirical Challenger 1 (`sub_orch_m5_users/challenger_1`)  
**Verdict**: **APPROVE**  
**Target Scope**: `frontend/src/features/users/` & `frontend/src/proxy.ts`

---

## 1. Observation

1. **Zod Validation Schemas (`frontend/src/features/users/schemas/user.ts`)**:
   - `userSchema` lines 3–16:
     - `firstName`: `z.string().trim().min(1).max(50)`
     - `lastName`: `z.string().trim().min(1).max(50)`
     - `email`: `z.string().trim().min(1).email()`
     - `username`: `z.string().trim().optional().or(z.literal(''))`
     - `password`: `z.string().optional().refine((val) => !val || val.length >= 6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })`
     - `roleId`: `z.coerce.number().min(1).max(4)`
     - `statusId`: `z.coerce.number().min(1).max(2)`
   - `userCreateSchema` lines 18–20:
     - `userSchema.extend({ password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự') })`
   - `userUpdateSchema` line 22:
     - `export const userUpdateSchema = userSchema;`

2. **API Service Contract (`frontend/src/features/users/api/service.ts`)**:
   - `getUsers(filters)` lines 10–36: Sets `params.page` and `params.limit`, parses `filters.roles` into `JSON.stringify({ roles: [{ id: roleId }] })` (matching backend `FilterUserDto.roles`), passes `params.sort`, calls `apiClient.get<UsersResponse>('/api/v1/users', { params })`, and normalizes `{ data, hasNextPage, total_users, users }`.
   - `getUserById(id)` lines 38–41: Calls `apiClient.get<User>('/api/v1/users/${id}')`.
   - `createUser(payload)` lines 43–46: Calls `apiClient.post<User>('/api/v1/users', payload)`.
   - `updateUser(id, payload)` lines 48–51: Calls `apiClient.patch<User>('/api/v1/users/${id}', payload)`.
   - `deleteUser(id)` lines 53–55: Calls `apiClient.delete('/api/v1/users/${id}')`.

3. **Backend Controller & DTO Contracts (`backend/src/users/`)**:
   - Controller `users.controller.ts`:
     - `@Roles(RoleEnum.SUPER_ADMIN)` with `@UseGuards(AuthGuard('jwt'), RolesGuard)`
     - `POST /api/v1/users` (`CreateUserDto`: `firstName`, `lastName`, `email`, `password` (min 6), `username`, `role?: RoleDto`, `status?: StatusDto`)
     - `GET /api/v1/users` (`QueryUserDto`: `page`, `limit`, `filters?: FilterUserDto` with `roles?: RoleDto[]`, `sort?: SortUserDto[]`)
     - `GET /api/v1/users/:id`
     - `PATCH /api/v1/users/:id` (`UpdateUserDto`)
     - `DELETE /api/v1/users/:id`
   - Enums:
     - `RoleEnum`: `SUPER_ADMIN = 1`, `DISPATCHER = 2`, `FLEET_MANAGER = 3`, `WAREHOUSE_MANAGER = 4`
     - `StatusEnum`: `active = 1`, `inactive = 2`

4. **Empirical Test Suite Execution (`.agents/sub_orch_m5_users/challenger_1/test-harness.mjs`)**:
   - Command: `node ..\.agents\sub_orch_m5_users\challenger_1\test-harness.mjs`
   - Output:
     ```text
     ================================================================
     🏁 STARTING EMPIRICAL CHALLENGER TEST SUITE: USERS MANAGEMENT (M5)
     ================================================================

     --- SUITE 1: Zod Schemas Edge Cases & Validation ---
       ✅ PASS: userCreateSchema: Valid full payload passes
       ✅ PASS: userCreateSchema: Missing password fails
       ✅ PASS: userCreateSchema: Short password (< 6 chars) fails
       ✅ PASS: userCreateSchema: Exactly 6 chars password passes
       ✅ PASS: userCreateSchema: Invalid email formats fail
       ✅ PASS: userCreateSchema: Empty / whitespace firstName & lastName fail with trim
       ✅ PASS: userCreateSchema: Names > 50 characters fail max constraint
       ✅ PASS: userCreateSchema: Role ID boundary enforcement (1..4)
       ✅ PASS: userCreateSchema: Status ID boundary enforcement (1..2)
       ✅ PASS: userCreateSchema: Coercion for string roleId and statusId from form select inputs
       ✅ PASS: userUpdateSchema: Valid payload without password passes (optional password in edit)
       ✅ PASS: userUpdateSchema: Valid payload with empty string password passes
       ✅ PASS: userUpdateSchema: Password provided but < 6 chars fails in edit mode
       ✅ PASS: userUpdateSchema: Password provided with >= 6 chars passes in edit mode

     --- SUITE 2: API Client Service Contract & Query Serialization ---
       ✅ PASS: getUsers: Default call sends GET /api/v1/users with page=1, limit=10
       ✅ PASS: getUsers: Role filter serializes to JSON string {"roles":[{"id":N}]}
       ✅ PASS: getUsers: Invalid role filter string does not emit invalid JSON
       ✅ PASS: getUsers: Sort param is forwarded correctly
       ✅ PASS: getUserById: Sends GET /api/v1/users/:id
       ✅ PASS: createUser: Sends POST /api/v1/users with correct DTO shape
       ✅ PASS: updateUser: Sends PATCH /api/v1/users/:id with correct DTO shape
       ✅ PASS: deleteUser: Sends DELETE /api/v1/users/:id

     --- SUITE 3: TanStack Query Key Factory Consistency ---
       ✅ PASS: userKeys: Key hierarchy structure matches TanStack Query v5 conventions

     --- SUITE 4: TMS Domain Roles & Statuses Alignment ---
       ✅ PASS: ROLE_OPTIONS: Exactly matches 4 system TMS roles with correct numeric IDs
       ✅ PASS: STATUS_OPTIONS: Matches active/inactive statuses with correct numeric IDs

     --- SUITE 5: RBAC Route Guard Integrity ---
       ✅ PASS: RBAC Route Guard: /dashboard/users restricted strictly to SUPER_ADMIN

     ================================================================
     📊 TEST RESULTS SUMMARY: Total: 26 | Passed: 26 | Failed: 0
     ================================================================
     🎉 ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!
     ```

5. **Type Checking, Linting & Build Verification**:
   - `npx tsc --noEmit` exited with code `0`.
   - `npx oxlint src/features/users` exited with code `0` (Found 0 warnings and 0 errors across 12 files).
   - `npm run build` completed successfully with code `0`, generating `/dashboard/users` as a server-rendered route.

---

## 2. Logic Chain

1. **Schema Integrity (Observation 1 & 4)**: The split between `userCreateSchema` (which requires `password` with min 6 chars) and `userUpdateSchema` (which makes `password` optional, but validates min 6 chars if provided) accurately enforces account creation vs credential update workflows without allowing blank or short passwords. The `z.coerce.number()` on `roleId` and `statusId` guarantees safe parsing from HTML `<select>` values.
2. **Contract Alignment (Observation 2, 3 & 4)**: The payload structures in `createUser` (`{ firstName, lastName, email, username?, password?, role: { id }, status: { id } }`) and `updateUser` strictly align with backend `CreateUserDto` / `UpdateUserDto`. The query filter serialization `{"roles":[{"id":N}]}` matches `FilterUserDto.roles` parsed by `plainToInstance(FilterUserDto, JSON.parse(value))` in `query-user.dto.ts`.
3. **Cache Synchronization (Observation 4)**: Mutation options for create, update, and delete in `mutations.ts` invalidate `userKeys.all` (`['users']`), guaranteeing that any listing queries (`['users', 'list', ...]`) and detail queries (`['users', 'detail', ...]`) are re-fetched immediately upon mutations.
4. **RBAC & Safety (Observation 3, 4 & 5)**: The proxy route guard (`/dashboard/users: ['SUPER_ADMIN']`) matches the backend API controller guard (`@Roles(RoleEnum.SUPER_ADMIN)`). Disallowed roles are redirected to `/dashboard/overview`.
5. **Toast Localization & Error Handling (Observation 2 & 5)**: All user actions (`CellAction`, `UserFormSheet`) use Sonner toasts formatted according to project rules: 100% Vietnamese and API error messages surfaced first (`err.response?.data?.message`).

---

## 3. Caveats

- **Photo Upload**: The backend entity supports an optional `photo?: FileDto | null` with `photoId`. The current `UserFormSheet` manages core identities, roles, credentials, and statuses without an avatar file picker. If profile photo management is required in the admin drawer in future phases, the payload interface already accommodates `photo: { id }`.
- **Search Query Parameter**: The client currently forwards `search` query parameter in `UserFilters`. Full-text search on user entities can be hooked into backend query filters if extended in backend DTO.

---

## 4. Conclusion

The implementation of Milestone 5 (`/dashboard/users`) completely replaces mock data with live NestJS `/api/v1/users` API calls, adheres to the TMS 4-role domain model, passes all 26 empirical stress tests, achieves 0 TypeScript errors, 0 linter warnings, and builds successfully.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce the empirical challenger verification:

1. **Run Empirical Test Harness**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   node ..\.agents\sub_orch_m5_users\challenger_1\test-harness.mjs
   ```
   *Expected Result*: 26/26 tests PASS with exit code 0.

2. **Run TypeScript Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Expected Result*: Exit code 0, 0 errors.

3. **Run Linter**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx oxlint src/features/users
   ```
   *Expected Result*: Exit code 0, 0 errors, 0 warnings.

4. **Run Production Build**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
   *Expected Result*: Exit code 0, build succeeds.
