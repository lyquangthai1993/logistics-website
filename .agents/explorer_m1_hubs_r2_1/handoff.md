# Handoff Report: Explorer 1 — Milestone 1 (Iteration 2) Hubs Management Standardization

## 1. Observation

1. **Mutation Options Definition** (`frontend/src/features/hubs/api/mutations.ts`, Lines 7-34):
   ```typescript
   export const createHubMutation = mutationOptions({
     mutationFn: (payload: CreateHubPayload) => createHub(payload),
     onSuccess: () => {
       getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
     }
   });
   ```
   Similar options are defined for `updateHubMutation`, `toggleActiveHubMutation`, and `deleteHubMutation`.

2. **Component Overwrite at Call Sites**:
   - In `frontend/src/features/hubs/components/hub-form-dialog.tsx` (Lines 63-85):
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
   - In `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx` (Lines 27-52):
     ```typescript
     const toggleMutation = useMutation({
       ...toggleActiveHubMutation,
       onSuccess: (updated) => {
         toast.success(...);
       },
       onError: (err: any) => { ... }
     });
     ```

3. **Challenger 1 & 2 Test Results**:
   - `npx tsc --noEmit`: Code compiles with 0 errors.
   - `npx playwright test e2e/challenger-m1-empirical.spec.ts`: Tests 3 & 4 failed because active badge and newly created row do not update without full page reload.
   - `npx playwright test e2e/10-hubs-management.spec.ts`: Failed when seeded `Andromeda Hub` was pushed to page 2 by previous test creations.

4. **Reference Implementations**:
   - `frontend/src/features/fleet/components/vehicles-table/cell-action.tsx` (Lines 20-28) correctly uses `useQueryClient()` and calls `queryClient.invalidateQueries({ queryKey: ['fleet'] })` inside `onSuccess`.

---

## 2. Logic Chain

1. **Observation 1 & 2**: When an object literal `{ ...createHubMutation, onSuccess: (res) => { ... } }` is evaluated, JavaScript property assignment precedence causes the second `onSuccess` to replace the one in `createHubMutation`.
2. **Observation 1 & 2**: Because `createHubMutation.onSuccess` is replaced, `getQueryClient().invalidateQueries({ queryKey: hubKeys.all })` is never executed upon successful mutation.
3. **Observation 3**: TanStack Query's default `staleTime` (60 seconds) prevents automatic query refetching. Therefore, the UI table (`HubsTable`), KPI metric cards (`HubsMetrics`), and dependent selectors retain stale data until manual page refresh (F5).
4. **Resolution**:
   - In `hub-form-dialog.tsx` and `cell-action.tsx`: Import `useQueryClient` and `hubKeys`, and invoke `queryClient.invalidateQueries({ queryKey: hubKeys.all })` within each mutation's `onSuccess` callback.
   - In `mutations.ts`: Provide exported hooks (`useCreateHubMutation`, `useUpdateHubMutation`, `useToggleActiveHubMutation`, `useDeleteHubMutation`) with query invalidation built into their options.
   - In `10-hubs-management.spec.ts`: Harden initial row visibility assertion by filtering for the target hub if not present on page 1.

---

## 3. Caveats

- **Backend Column Sorting**: The backend `hubs.service.ts` hardcodes `.orderBy('hub.createdAt', 'DESC')` and does not implement dynamic column sorting. Frontend table column headers declare sortable icons (`DataTableColumnHeader`), but sorting will remain visual-only until backend adds `sort` parsing in `HubsService.findAll`. This does not block CRUD or caching fixes.

---

## 4. Conclusion

The stale query cache issue in Milestone 1 Hubs Management is caused exclusively by object spreading overwriting the `onSuccess` invalidation callback in `hub-form-dialog.tsx` and `cell-action.tsx`.

The remediation is fully specified in `analysis.md`:
1. Update `frontend/src/features/hubs/api/mutations.ts` to export custom mutation hooks.
2. Update `frontend/src/features/hubs/components/hub-form-dialog.tsx` to use `useQueryClient()` and invalidate `hubKeys.all` on `create` and `update`.
3. Update `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx` to use `useQueryClient()` and invalidate `hubKeys.all` on `toggleActive` and `delete`.
4. Harden `frontend/e2e/10-hubs-management.spec.ts` against pagination shift.

---

## 5. Verification Method

1. **Verify TypeScript type correctness**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
2. **Verify Playwright E2E suites**:
   ```bash
   cd frontend
   npx playwright test e2e/challenger-m1-empirical.spec.ts
   npx playwright test e2e/challenger-hubs-workflow.spec.ts
   npx playwright test e2e/10-hubs-management.spec.ts
   ```
3. **Inspect Modified Files**:
   - `frontend/src/features/hubs/api/mutations.ts`
   - `frontend/src/features/hubs/components/hub-form-dialog.tsx`
   - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`
   - `frontend/e2e/10-hubs-management.spec.ts`
