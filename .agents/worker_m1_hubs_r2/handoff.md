# Handoff Report: Milestone 1 — Hubs Management Standardization (Iteration 2)

**Author**: Worker (`worker_m1_hubs_r2`)  
**Target Milestone**: Milestone 1: Hubs Management Standardization  
**Date**: 2026-08-18  

---

## 1. Observation

### 1.1 Invalidation Clobbering in Dialog & Action Components
In `frontend/src/features/hubs/components/hub-form-dialog.tsx` and `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`:
```typescript
// BEFORE:
const createMutation = useMutation({
  ...createHubMutation,
  onSuccess: (res) => {
    toast.success(`Tạo mới chi nhánh "${res.name}" thành công!`);
    setOpen(false);
  },
  onError: (err: any) => { ... }
});
```
Because object spreading with an inline `onSuccess` property overrides the `onSuccess` callback defined in `createHubMutation`, `getQueryClient().invalidateQueries({ queryKey: hubKeys.all })` was never called upon successful mutations.

### 1.2 Layout Height Collapse & Pointer Event Interception
In `frontend/src/features/hubs/components/hubs-listing.tsx`:
```tsx
// BEFORE:
<HydrationBoundary state={dehydrate(queryClient)}>
  <div className='space-y-6'>
    <HubsMetrics />
    <HubsTable />
  </div>
</HydrationBoundary>
```
The unconstrained `div.space-y-6` container caused the inner relative flex container in `DataTable` to collapse its calculated height to 0px, causing the pagination footer (`div.flex.flex-col.gap-2.5`) to overlap the top table rows and intercept mouse click events.

### 1.3 Test Flakiness in `10-hubs-management.spec.ts`
In `frontend/e2e/10-hubs-management.spec.ts`:
```typescript
// BEFORE:
const hanRow = page.locator('text=Andromeda Hub');
await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
```
When multiple test runs created additional test hubs in the database, the backend sorted by `createdAt DESC` with limit 10, pushing `Andromeda Hub` onto Page 2 and resulting in a test timeout on Page 1.

---

## 2. Logic Chain

1. **Defense-in-Depth React Query Invalidation**:
   - In `frontend/src/features/hubs/api/mutations.ts`, implemented and exported `useCreateHubMutation`, `useUpdateHubMutation`, `useToggleActiveHubMutation`, and `useDeleteHubMutation` which explicitly call `queryClient.invalidateQueries({ queryKey: hubKeys.all })`.
   - In `frontend/src/features/hubs/components/hub-form-dialog.tsx`, imported `useQueryClient` and `hubKeys`, initializing `const queryClient = useQueryClient();` and calling `queryClient.invalidateQueries({ queryKey: hubKeys.all })` in both `createMutation.onSuccess` and `updateMutation.onSuccess`.
   - In `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`, imported `useQueryClient` and `hubKeys`, initializing `const queryClient = useQueryClient();` and calling `queryClient.invalidateQueries({ queryKey: hubKeys.all })` in both `toggleMutation.onSuccess` and `deleteMutation.onSuccess`.
   - Standardized Vietnamese toast messages across all actions adhering to project toast rules.

2. **Flexbox Layout Standardization**:
   - In `frontend/src/features/hubs/components/hubs-listing.tsx`, replaced `<div className='space-y-6'>` with `<div className='flex flex-1 flex-col space-y-4'>`.
   - This maintains the complete flex container chain from `PageContainer` down to `DataTable`, allowing the table content and pagination footer to sit in natural, non-overlapping document flow.

3. **E2E Test Suite Hardening**:
   - In `frontend/e2e/10-hubs-management.spec.ts`, updated step 4 & 5 to verify table row rendering (`tbody tr`) and resiliently search for seed hubs (`Andromeda Hub`, `Magellan Hub`) via `#hub-search-input`.
   - Added verification of persistence and cache invalidation after hub creation, followed by performing and asserting soft-delete.

---

## 3. Caveats

No caveats. All modifications strictly respect the exclusive file ownership list and require no changes outside of the authorized files.

---

## 4. Conclusion

All tasks for Milestone 1 (Iteration 2) are completed, verified, and passing 100%:
- Zero TypeScript compilation/type errors.
- 100% pass rate on official and challenger Playwright test suites.
- React Query cache invalidation operates reliably across all mutation operations.
- Table layout correctly renders without pointer-event collision.

---

## 5. Verification Method

To independently verify all changes:

1. **TypeScript Type Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Result*: Exited with code 0 (0 errors).

2. **Playwright Hubs Management E2E Test**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/10-hubs-management.spec.ts
   ```
   *Result*: 2 passed (27.0s).

3. **Playwright Challenger Workflow E2E Test**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/challenger-hubs-workflow.spec.ts
   ```
   *Result*: 4 passed (2.1m).

4. **Playwright Challenger Empirical E2E Test**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/challenger-m1-empirical.spec.ts
   ```
   *Result*: 4 passed (1.5m).

5. **Files to Inspect**:
   - `frontend/src/features/hubs/api/mutations.ts`
   - `frontend/src/features/hubs/components/hub-form-dialog.tsx`
   - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`
   - `frontend/src/features/hubs/components/hubs-listing.tsx`
   - `frontend/e2e/10-hubs-management.spec.ts`
