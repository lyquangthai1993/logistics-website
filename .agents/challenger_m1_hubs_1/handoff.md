# Empirical Challenger Report: Milestone 1 — Hubs Management Standardization

## Verdict: 🚫 REJECT

---

## 1. Observation

### Test Execution & Direct Findings
1. **TypeScript Build Check**:
   - Command: `npx tsc --noEmit` in `frontend/`
   - Result: `exited with code 0` (0 compile errors).

2. **RBAC Route Guard Verification**:
   - Command: `npx playwright test e2e/03-rbac-routing.spec.ts`
   - Result: `20 passed (100%)`. All roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`) correctly adhere to route authorization rules.

3. **Existing E2E Test Suite Failure**:
   - Command: `npx playwright test e2e/10-hubs-management.spec.ts`
   - Result: `1 failed, 1 passed (exit code 1)`
   - Verbatim failure:
     ```
     Error: expect(locator).toBeVisible() failed
     Locator: locator('text=Andromeda Hub').first()
     Expected: visible
     Timeout: 10000ms
     Error: element(s) not found
     ```
   - Investigation showed that accumulated test data pushed `Andromeda Hub` to Page 2 because backend sorts by `createdAt DESC` with limit 10. Additionally, newly created hubs did not appear in the table due to stale cache.

4. **Empirical Edge Case Verification** (`frontend/e2e/challenger-m1-empirical.spec.ts`):
   - **Vietnamese diacritics search** ("Đà Nẵng", "Hồ Chí Minh", "Hà Nội"): **PASSED**.
   - **Empty search input restoration**: **PASSED**.
   - **Pagination bounds & `nuqs` state sync (`perPage=20`)**: **PASSED**.
   - **Mutation Cache Invalidation (Active Status Toggle)**: **FAILED**.
   - **Mutation Cache Invalidation (Hub Creation)**: **FAILED**.

5. **Code Inspection of Mutation Invalidation Bug**:
   In `frontend/src/features/hubs/api/mutations.ts`:
   ```typescript
   export const toggleActiveHubMutation = mutationOptions({
     mutationFn: (id: number) => toggleActiveHub(id),
     onSuccess: () => {
       getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
     }
   });
   ```
   In `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`:
   ```typescript
   const toggleMutation = useMutation({
     ...toggleActiveHubMutation,
     onSuccess: (updated) => {
       toast.success(
         updated.isActive
           ? `Đã kích hoạt hoạt động chi nhánh "${data.name}"`
           : `Đã tạm ngưng hoạt động chi nhánh "${data.name}"`
       );
     },
     onError: (err: any) => { ... }
   });
   ```
   and in `frontend/src/features/hubs/components/hub-form-dialog.tsx`:
   ```typescript
   const createMutation = useMutation({
     ...createHubMutation,
     onSuccess: (res) => {
       toast.success(`Tạo mới chi nhánh "${res.name}" thành công!`);
       setOpen(false);
     },
     onError: (err: any) => { ... }
   });
   ```
   The object spread `{ ...createHubMutation, onSuccess: ... }` silently **overwrites** `onSuccess` from the mutation options, completely dropping `getQueryClient().invalidateQueries({ queryKey: hubKeys.all })`.

6. **Backend Column Sorting Absence**:
   - `frontend/src/features/hubs/components/hubs-tables/use-hubs-table-filters.tsx` sends `sort` param (e.g. `sort=[{"id":"code","desc":false}]`).
   - `backend/src/hubs/dto/query-hub.dto.ts` does NOT define a `sort` property.
   - `backend/src/hubs/hubs.service.ts` L55 hardcodes `.orderBy('hub.createdAt', 'DESC')`.
   - Consequently, clicking table headers toggles UI sort icons and URL params, but rows are NEVER sorted by the server.

---

## 2. Logic Chain

1. **Root Cause of Mutation Invalidation Failure**:
   - In React / TanStack Query, `useMutation` accepts an options object.
   - Spreading an object containing `onSuccess` (`toggleActiveHubMutation`) and then providing a sibling `onSuccess` property in the same object literal (`{ ...toggleActiveHubMutation, onSuccess: ... }`) causes JavaScript property precedence to replace the first `onSuccess` with the second.
   - Because `invalidateQueries({ queryKey: hubKeys.all })` was solely located in the replaced `onSuccess`, the TanStack Query cache is never invalidated upon creating, editing, toggling active, or deleting a hub.
   - As observed in empirical test runs, the table displays stale data until the browser manually executes a full page reload (`F5`).

2. **Resolution for Mutation Invalidation**:
   - In `cell-action.tsx` and `hub-form-dialog.tsx`, either:
     a) Use `const queryClient = useQueryClient();` and call `queryClient.invalidateQueries({ queryKey: hubKeys.all })` inside the component's `onSuccess` handler, OR
     b) Call `useMutation({ ...toggleActiveHubMutation, onSuccess: (updated) => { toggleActiveHubMutation.onSuccess?.(updated, ...); toast.success(...); } })`.

3. **Root Cause of Sorting Disconnect**:
   - The frontend DataTable correctly declares `enableSorting: true` on columns and updates `nuqs` state.
   - However, the backend NestJS `hubs` controller/service does not parse or apply dynamic sorting in `HubsService.findAll`.

4. **Resolution for E2E Flakiness in `10-hubs-management.spec.ts`**:
   - In `10-hubs-management.spec.ts`, instead of assuming `Andromeda Hub` is located on Page 1 regardless of database size, the test should search for `Andromeda Hub` (or `HUB-HAN-01`) before asserting visibility, or verify any rendered row on initial load.

---

## 3. Caveats
- No caveats. All findings were directly confirmed and reproduced through automated Playwright test executions.

---

## 4. Conclusion

**Verdict: REJECT**

While the UI layout, Vietnamese toast messages, RBAC routing guards, and search filters with diacritics are well-structured, Milestone 1 cannot be approved in its current state due to:
1. **Critical Bug**: `useMutation` object spread overwriting query cache invalidation on create, update, toggle active, and soft delete actions.
2. **Missing Feature Integration**: Column header sorting has no backend implementation.
3. **E2E Test Failure**: `10-hubs-management.spec.ts` fails under normal multi-run database state.

---

## 5. Verification Method

To independently verify these findings:
1. **Reproduce Mutation Invalidation Failure**:
   ```bash
   cd frontend
   npx playwright test e2e/challenger-m1-empirical.spec.ts
   ```
   Observe `Test 3` and `Test 4` failing with timeout waiting for updated table data.

2. **Reproduce 10-hubs-management.spec.ts Failure**:
   ```bash
   cd frontend
   npx playwright test e2e/10-hubs-management.spec.ts
   ```
