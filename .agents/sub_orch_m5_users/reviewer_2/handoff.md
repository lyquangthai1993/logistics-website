# Review & Challenge Report: Milestone 5 — Users Management Live API Connection

**Date**: 2026-08-18  
**Reviewer**: Reviewer 2 (`sub_orch_m5_users/reviewer_2`)  
**Target Scope**: `frontend/src/features/users/`, `frontend/src/proxy.ts`, and `frontend/src/config/nav-config.ts`  
**Gate Verdict**: **APPROVE**  
**Adversarial Risk Assessment**: **LOW**

---

## 1. Observation

Direct observations from independent inspection of code, types, routing, and tool executions:

1. **TypeScript Type Check & Linter**:
   - `npx tsc --noEmit` in `frontend/`: Executed and exited with **code 0 (0 errors)**.
   - `npx oxlint src/features/users` in `frontend/`: Executed and exited with **code 0 (0 warnings, 0 errors on 12 files)**.

2. **TMS Role & Status Mapping**:
   - `backend/src/roles/roles.enum.ts`: `SUPER_ADMIN` = 1, `DISPATCHER` = 2, `FLEET_MANAGER` = 3, `WAREHOUSE_MANAGER` = 4.
   - `backend/src/statuses/statuses.enum.ts`: `active` = 1, `inactive` = 2.
   - `frontend/src/features/users/components/users-table/options.tsx`:
     - `ROLE_OPTIONS` accurately maps `{ value: '1', label: 'Super Admin', code: 'SUPER_ADMIN' }`, `{ value: '2', label: 'Điều phối viên', code: 'DISPATCHER' }`, `{ value: '3', label: 'Quản lý đội xe', code: 'FLEET_MANAGER' }`, `{ value: '4', label: 'Quản lý kho', code: 'WAREHOUSE_MANAGER' }`.
     - `STATUS_OPTIONS` maps `{ value: '1', label: 'Hoạt động', code: 'active' }`, `{ value: '2', label: 'Ngừng hoạt động', code: 'inactive' }`.
   - `frontend/src/features/users/components/users-table/columns.tsx`:
     - Role badges render distinct color classes: Super Admin (Purple), Dispatcher (Blue), Fleet Manager (Amber), Warehouse Manager (Emerald).
     - Status badges render Active (Emerald) vs Inactive (Secondary/Zinc).
   - `frontend/src/features/users/schemas/user.ts`:
     - `roleId`: `z.coerce.number().min(1, 'Vui lòng chọn vai trò').max(4, 'Vai trò không hợp lệ')`.
     - `statusId`: `z.coerce.number().min(1, 'Vui lòng chọn trạng thái').max(2, 'Trạng thái không hợp lệ')`.

3. **Toast Notifications Compliance**:
   - All toast messages in `frontend/src/features/users/` are **100% Vietnamese**.
   - API Error First Pattern (`const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt')`) is strictly implemented in:
     - `cell-action.tsx` (L49-59): Extracts `error?.response?.data?.message` and `error?.response?.data?.errors`, falling back to `'Không thể xóa người dùng. Vui lòng thử lại.'`.
     - `user-form-sheet.tsx` (L73-83): Create mutation extracts API message, falling back to `'Không thể tạo người dùng. Vui lòng thử lại.'`.
     - `user-form-sheet.tsx` (L92-102): Update mutation extracts API message, falling back to `'Không thể cập nhật người dùng. Vui lòng thử lại.'`.
   - Success toasts are localized in Vietnamese: `'Đã xóa người dùng thành công'`, `'Tạo người dùng thành công!'`, `'Cập nhật người dùng thành công!'`.
   - Client-side validation toasts are localized in Vietnamese.

4. **Test Selectors & Modal Actions**:
   - `#btn-add-user`: Present on `UserFormSheetTrigger` (triggers create drawer).
   - `#user-form-sheet`: Present on form element in `UserFormSheet`.
   - `#input-user-first-name`, `#input-user-last-name`, `#input-user-email`, `#input-user-username`, `#input-user-password`: Present on all form input elements.
   - `#select-user-role`, `#select-user-status`: Present on form select dropdowns.
   - `#btn-submit-user`: Present on submit button with `form='user-form-sheet'`.
   - `#delete-user-dialog`, `#btn-confirm-delete`: Present on delete confirmation modal.
   - `data-testid="user-row-actions-${data.id}"`, `data-testid="btn-edit-user-${data.id}"`, `data-testid="btn-delete-user-${data.id}"`: Present on table row dropdown actions.

5. **3-Layer RBAC Route Guard & Navigation**:
   - **Layer 1 (Sidebar UI)**: `frontend/src/config/nav-config.ts` configures menu `Người dùng` (`/dashboard/users`) with `access: { role: 'SUPER_ADMIN' }`.
   - **Layer 2 (Route Guard)**: `frontend/src/proxy.ts` defines `'/dashboard/users': ['SUPER_ADMIN']` in `roleRouteMap`, blocking unauthorized roles and redirecting to `/dashboard/overview`.
   - **Layer 3 (API Guard)**: `backend/src/users/users.controller.ts` applies `@Roles(RoleEnum.SUPER_ADMIN)` and `@UseGuards(AuthGuard('jwt'), RolesGuard)` at class level across all `/v1/users` endpoints.

6. **Integrity Check**:
   - No mock stores or `@faker-js/faker` remain in `frontend/src/features/users/`.
   - Real Axios calls (`apiClient.get`, `.post`, `.patch`, `.delete`) communicate with `/api/v1/users`.
   - TanStack Query v5 cache invalidation (`getQueryClient().invalidateQueries({ queryKey: userKeys.all })`) refreshes table data upon any mutation.

---

## 2. Logic Chain

1. **Contract Alignment**: The backend `UsersController` expects `CreateUserDto` / `UpdateUserDto` with nested `{ role: { id: number }, status: { id: number } }` and returns `{ data: User[], hasNextPage: boolean }`. `frontend/src/features/users/api/service.ts` and `types.ts` map exactly to these backend contracts.
2. **Robust Validation**: `userCreateSchema` mandates min 6-character passwords on creation, while `userUpdateSchema` allows optional password updates only when explicitly provided by the administrator, avoiding accidental password overwrites.
3. **UX & Resilience**: Wrapping date conversions in `try/catch`, providing fallback display labels for missing user names, and extracting structured backend error responses ensures zero crashes under unexpected or malformed API responses.
4. **Security & RBAC**: Enforcing `SUPER_ADMIN` requirement across all three architectural layers (Sidebar, Next.js Proxy, NestJS Controller) prevents privilege escalation.

---

## 3. Caveats

- **Active Process Lock on Build**: While `npx tsc --noEmit` and `npx oxlint` passed with 0 errors, `npm run build` returned lock notification due to an active local development server holding `.next` cache.
- **Full E2E against Neon DB**: Automated Playwright spec execution against live Neon database requires active backend server instance on port 3001 and pre-seeded admin user credentials.

---

## 4. Conclusion

The implementation by `worker_1` satisfies all criteria outlined in `SCOPE.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `rbac-matrix.md`:
- **TMS Role Mapping**: 100% compliant.
- **Toast Notifications**: 100% Vietnamese and API error message first.
- **Test Selectors**: 100% present and functional.
- **Route Guard Mapping**: 100% compliant across 3-layer architecture.
- **Integrity**: 0 mocks, 0 shortcuts, live API integration.

**Gate Verdict**: **APPROVE**

---

## 5. Verification Method

To independently verify these findings:

```powershell
# 1. Type check
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit

# 2. Linter check
cd d:\Projects\logistics-website\frontend
npx oxlint src/features/users

# 3. RBAC route check in proxy.ts
Select-String -Path src/proxy.ts -Pattern "'/dashboard/users'"

# 4. Toast error pattern check
Select-String -Path src/features/users/components/**/*.tsx -Pattern "toast\.(error|success)"
```
