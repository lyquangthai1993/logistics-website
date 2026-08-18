# Forensic Audit & Handoff Report: Milestone 5 — Users Management Live API Connection

**Date**: 2026-08-18  
**Auditor**: Forensic Auditor (`sub_orch_m5_users/auditor_1`)  
**Target Scope**: `frontend/src/features/users/`  
**Verdict**: **CLEAN**

---

## Forensic Audit Summary

```markdown
## Forensic Audit Report

**Work Product**: frontend/src/features/users/ & Live API Integration
**Profile**: General Project (Development Mode)
**Verdict**: CLEAN

### Phase Results
- [Hardcoded output detection]: PASS — No hardcoded mock data, fake promises, or test bypasses in `src/features/users/`.
- [Facade detection]: PASS — Real HTTP methods (GET, POST, PATCH, DELETE) via `apiClient` connect to NestJS `/api/v1/users`.
- [Pre-populated artifact detection]: PASS — No pre-populated test results or fabrication artifacts found.
- [Dependency & API alignment]: PASS — DTOs, Zod schemas, and TanStack Query keys strictly align with NestJS backend `backend/src/users/users.controller.ts`.
- [3-Layer RBAC compliance]: PASS — `SUPER_ADMIN` restriction strictly maintained across `nav-config.ts`, `proxy.ts`, and `users.controller.ts`.
- [Notification standard]: PASS — 100% Vietnamese toast messages with API-error-first fallback pattern.
- [Static Analysis & Type Check]: PASS — `npx tsc --noEmit` exited with code 0 (0 errors); `oxlint` exited with 0 errors / 0 warnings.
```

---

## 1. Observation

1. **API Service Implementation (`frontend/src/features/users/api/service.ts`)**:
   - `getUsers(filters)` issues `apiClient.get<UsersResponse>('/api/v1/users', { params })` with pagination (`page`, `limit`), sort, and role filter serialization.
   - `getUserById(id)` issues `apiClient.get<User>('/api/v1/users/${id}')`.
   - `createUser(payload)` issues `apiClient.post<User>('/api/v1/users', payload)`.
   - `updateUser(id, payload)` issues `apiClient.patch<User>('/api/v1/users/${id}', payload)`.
   - `deleteUser(id)` issues `apiClient.delete('/api/v1/users/${id}')`.
   - Zero references to `@faker-js/faker` or `mock-api-users.ts` exist within `frontend/src/features/users/`.

2. **React Query & Cache State (`frontend/src/features/users/api/mutations.ts` & `queries.ts`)**:
   - All mutations (`createUserMutation`, `updateUserMutation`, `deleteUserMutation`) invoke `getQueryClient().invalidateQueries({ queryKey: userKeys.all })` on success.
   - `userKeys` factory correctly encapsulates `list(filters)` and `detail(id)`.

3. **Validation & Role Schema (`frontend/src/features/users/schemas/user.ts` & `options.tsx`)**:
   - `ROLE_OPTIONS` maps IDs 1 to 4 to `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`.
   - `STATUS_OPTIONS` maps IDs 1 to 2 to `active`, `inactive`.
   - Zod schemas validate field lengths and allow optional password update on edit while enforcing min 6 characters on creation.

4. **UI Components & UX Standards**:
   - `UserFormSheet` and `CellAction` implement complete Vietnamese Sonner notifications with the API error first pattern:
     ```typescript
     const apiMessage = error?.response?.data?.message || ...;
     toast.error(apiMessage || 'Fallback tiếng Việt');
     ```
   - Standard E2E test IDs (`#btn-add-user`, `#user-form-sheet`, `#btn-submit-user`, `#btn-confirm-delete`, `#delete-user-dialog`, `#input-user-*`, `#select-user-*`) are fully present.

5. **Static Verification Commands**:
   - `npx tsc --noEmit` executed in `frontend/`: Exit Code 0, 0 errors.
   - `npx oxlint src/features/users` executed in `frontend/`: Exit Code 0, 0 errors, 0 warnings across 12 files.

---

## 2. Logic Chain

1. **Authentic Data Flow**: The worker replaced the in-memory mock store with live NestJS endpoints (`/api/v1/users`) accessed through `apiClient` (`frontend/src/lib/api-client.ts`), which automatically attaches the JWT Bearer token and handles 401 refresh rotation.
2. **Contract Integrity**: The NestJS controller `backend/src/users/users.controller.ts` expects `CreateUserDto` / `UpdateUserDto` with `firstName`, `lastName`, `email`, `role: { id: number }`, `status: { id: number }`, and `password`. The frontend payload structures in `src/features/users/api/types.ts` and `schemas/user.ts` correspond directly to these backend DTO definitions.
3. **RBAC Guard Enforcement**: In accordance with `rbac-matrix.md`, Users Management is restricted exclusively to `SUPER_ADMIN`. This is verified across all 3 architectural layers:
   - Sidebar UI: `frontend/src/config/nav-config.ts` (`access: { role: 'SUPER_ADMIN' }`)
   - Route Guard: `frontend/src/proxy.ts` (`'/dashboard/users': ['SUPER_ADMIN']`)
   - API Guard: `backend/src/users/users.controller.ts` (`@Roles(RoleEnum.SUPER_ADMIN)`)
4. **No Evasion or Cheat Detected**: All CRUD hooks and components perform authentic state mutations against the backend API and maintain cache synchronization without bypasses or hardcoded responses.

---

## 3. Adversarial Review & Challenge Report

### Risk Assessment: LOW

### Challenges & Stress-Testing

1. **Password Mutation on User Edit**:
   - *Challenge*: Will submitting an edit without changing the password send an empty string or null that overrides the user's existing password hash?
   - *Finding*: In `UserFormSheet.tsx`, `...(password ? { password } : {})` conditionally attaches the password field only if a non-empty string was entered. The backend `UpdateUserDto` marks `password` as optional (`@IsOptional()`). Thus, existing passwords remain untouched on normal profile edits.
2. **Pagination Fallback when Backend does not return total count**:
   - *Challenge*: What if backend `InfinityPaginationResponseDto` returns only `data` and `hasNextPage` without `total_users`?
   - *Finding*: `UsersTable` in `index.tsx` computes `pageCount` with fallback logic:
     `data.total_users ? Math.ceil(data.total_users / params.perPage) : data.hasNextPage ? params.page + 1 : params.page;`
     This prevents table pagination crashes.
3. **Deleted User Visibility**:
   - *Challenge*: What happens when a user is soft-deleted?
   - *Finding*: Backend executes soft-delete (`this.usersService.remove(id)` -> `HttpStatus.NO_CONTENT`). The mutation triggers `invalidateQueries`, causing TanStack Query to refetch the active list.

---

## 4. Caveats

- **Photo File Upload**: Backend supports `photo?: FileDto` (`/api/v1/files/upload`). The current `UserFormSheet` focuses on core user attributes (Name, Email, Username, Password, Role, Status) without a file dropzone. This does not violate Milestone 5 requirements and is standard for the current phase.
- **Backend Search**: Full-text name search via `filters.search` relies on backend query parameter support. Role filtering is formatted as JSON filter objects (`JSON.stringify({ roles: [{ id: roleId }] })`) matching NestJS `QueryUserDto`.

---

## 5. Conclusion

**Verdict**: **CLEAN**  
Milestone 5 implementation in `frontend/src/features/users/` adheres strictly to architectural guidelines, integrates cleanly with the live NestJS backend `/api/v1/users`, preserves 3-layer RBAC compliance, and exhibits 0 integrity violations.

---

## 6. Verification Method

To independently reproduce the audit checks:

```powershell
# 1. Verify TypeScript compiles with 0 errors
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit

# 2. Verify Linter passes with 0 warnings/errors
npx oxlint src/features/users

# 3. Check for any mock references
Get-ChildItem -Path src/features/users -Recurse | Select-String "mock-api-users"
# Expected: Empty / 0 matches
```
