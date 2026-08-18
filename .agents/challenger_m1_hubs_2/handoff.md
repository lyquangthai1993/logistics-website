# Handoff Report: Challenger 2 — Milestone 1 Hubs Management Standardization

## Verdict: REJECT ❌

---

## 1. Observation

### 1.1 TypeScript Type Checking & Compilation
- **Command**: `npx tsc --noEmit` executed in `frontend/`
- **Result**: Exit code 0, 0 TypeScript errors.

### 1.2 Flaw 1: TanStack Query Cache Invalidation Overridden in Mutations
- **Files**:
  - `frontend/src/features/hubs/components/hub-form-dialog.tsx` (Lines 63-85)
  - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx` (Lines 27-52)
  - `frontend/src/features/hubs/api/mutations.ts` (Lines 7-34)
- **Observed Code**:
  In `frontend/src/features/hubs/api/mutations.ts`:
  ```ts
  export const createHubMutation = mutationOptions({
    mutationFn: (payload: CreateHubPayload) => createHub(payload),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
    }
  });
  ```
  In `frontend/src/features/hubs/components/hub-form-dialog.tsx`:
  ```tsx
  const createMutation = useMutation({
    ...createHubMutation,
    onSuccess: (res) => {
      toast.success(`Tạo mới chi nhánh "${res.name}" thành công!`);
      setOpen(false);
    }
  });
  const updateMutation = useMutation({
    ...updateHubMutation,
    onSuccess: (res) => {
      toast.success(`Cập nhật chi nhánh "${res.name}" thành công!`);
      setOpen(false);
    }
  });
  ```
  In `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`:
  ```tsx
  const toggleMutation = useMutation({
    ...toggleActiveHubMutation,
    onSuccess: (updated) => {
      toast.success(...);
    }
  });
  const deleteMutation = useMutation({
    ...deleteHubMutation,
    onSuccess: (res) => {
      toast.success(res.message || ...);
      setDeleteOpen(false);
    }
  });
  ```
- **Observed Behavior**:
  Spreading `...updateHubMutation` (or any other mutation) followed by an inline `onSuccess` in the object literal **overrides** the base `onSuccess` function. As a result, `getQueryClient().invalidateQueries({ queryKey: hubKeys.all })` is **never executed**.
  - Toggling active status sends the PATCH request to backend, but the table continues to render stale status (`Hoạt Động` remains `Hoạt Động` without updating the badge or KPI metrics).
  - Editing a hub saves changes to backend, but the table row retains outdated values.
  - Soft-deleting a hub updates backend, but the row is not removed from the query cache.

### 1.3 Flaw 2: Layout Height Collapse & Pointer Event Interception in `DataTable`
- **Files**:
  - `frontend/src/features/hubs/components/hubs-listing.tsx` (Lines 37-41)
  - `frontend/src/components/ui/table/data-table.tsx` (Lines 25-28, 77-80)
- **Observed Code**:
  In `hubs-listing.tsx`:
  ```tsx
  <div className='space-y-6'>
    <HubsMetrics />
    <HubsTable />
  </div>
  ```
  In `data-table.tsx`:
  ```tsx
  <div className='flex flex-1 flex-col space-y-4'>
    {children}
    <div className='relative flex flex-1'>
      <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
        <ScrollArea className='h-full w-full'>
          <Table>...</Table>
        </ScrollArea>
      </div>
    </div>
    <div className='flex flex-col gap-2.5'>
      <DataTablePagination table={table} />
    </div>
  </div>
  ```
- **Observed Behavior**:
  Because `space-y-6` is a block element without flex/height constraints, `DataTable`'s `<div className='relative flex flex-1'>` calculates a height of 0px. The absolute scroll area overflows, while the pagination bar (`<div className='flex flex-col gap-2.5'>`) renders directly over the first rows of the table.
  During Playwright testing:
  ```
  locator.click: Test timeout of 30000ms exceeded.
  <div class="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8">…</div> from <div class="flex flex-col gap-2.5">…</div> subtree intercepts pointer events
  ```

### 1.4 Flaw 3: Pagination Assumption in E2E Spec `10-hubs-management.spec.ts`
- **File**: `frontend/e2e/10-hubs-management.spec.ts` (Lines 25-26)
- **Observed Code**:
  ```ts
  const hanRow = page.locator('text=Andromeda Hub');
  await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
  ```
- **Observed Behavior**:
  When total hubs in the database exceed 10 (e.g. from previous tests creating hubs), `Andromeda Hub` is located on page 2. `10-hubs-management.spec.ts` fails because it checks visibility on page 1 without filtering by search keyword `#hub-search-input` first.

---

## 2. Logic Chain

1. In JavaScript/TypeScript object syntax `{ ...base, prop: value }`, `prop` replaces `base.prop`. In `hub-form-dialog.tsx` and `cell-action.tsx`, `useMutation({ ...createHubMutation, onSuccess: ... })` replaces the base `onSuccess` that contained `queryClient.invalidateQueries({ queryKey: hubKeys.all })`.
2. Because `invalidateQueries` is never invoked upon mutation success, TanStack Query maintains stale query data (`staleTime: 60 * 1000`), preventing the UI table and KPI metrics cards from synchronizing with server state after Create, Edit, Toggle Active, or Soft Delete operations.
3. In `hubs-listing.tsx`, placing `<HubsMetrics />` and `<HubsTable />` inside a block container `<div className='space-y-6'>` breaks the `flex flex-1 flex-col` parent chain. The `<div className='relative flex flex-1'>` in `<DataTable>` collapses to 0px, causing the absolute scroll container to overflow and placing the pagination toolbar directly on top of table rows, physically blocking mouse clicks and pointer events.
4. In `10-hubs-management.spec.ts`, assuming seed data will always appear on the first page without searching or setting `perPage` causes test suite fragility when the database has more than 10 records.

---

## 3. Caveats

- **Creation Dialog Validation**: Required HTML5 inputs (`#input-hub-code`, `#input-hub-city`, `#input-hub-name`) and optional fields (`address`, `contactPhone`, `managerName`) correctly match backend `CreateHubDto`.
- **Soft Delete Warning Dialog**: The alert modal properly checks `data.vehicles && data.vehicles.length > 0` and conditionally renders the vehicle detachment warning banner.
- **Role Guard Parity**: FLEET_MANAGER route restriction and dropdown integration in `/dashboard/fleet` continue to pass.

---

## 4. Conclusion

Milestone 1 Hubs Management **MUST BE REJECTED** due to two critical functional defects:
1. **Broken Query Cache Invalidation**: Create, Edit, Toggle Active, and Soft Delete mutations do not invalidate query cache because `onSuccess` is overwritten at the call site.
2. **UI Click Interception**: Table container height collapse inside `hubs-listing.tsx` causes the pagination footer to intercept pointer events on action buttons.

### Recommended Worker Fixes:
1. **Fix Mutation Invalidation**:
   Use `useQueryClient()` inside `hub-form-dialog.tsx` and `cell-action.tsx` or call invalidation within the component's `onSuccess`, or use `onSettled` / `onSuccess` hooks properly:
   ```tsx
   const queryClient = useQueryClient();
   // In onSuccess:
   queryClient.invalidateQueries({ queryKey: hubKeys.all });
   ```
2. **Fix `hubs-listing.tsx` Layout**:
   Provide a min-height or flex container for `HubsTable` so `<DataTable>` does not collapse its `relative flex-1` area:
   ```tsx
   <div className='flex flex-1 flex-col gap-4'>
     <HubsMetrics />
     <div className='min-h-[480px] flex-1'>
       <HubsTable />
     </div>
   </div>
   ```
3. **Harden `10-hubs-management.spec.ts`**:
   Filter with `#hub-search-input` before asserting specific hub names if total rows can exceed `perPage`.

---

## 5. Verification Method

1. Run TypeScript check:
   ```bash
   cd frontend && npx tsc --noEmit
   ```
2. Run empirical challenger test suite:
   ```bash
   cd frontend && npx playwright test e2e/challenger-hubs-workflow.spec.ts
   ```
3. Run existing hubs E2E test spec:
   ```bash
   cd frontend && npx playwright test e2e/10-hubs-management.spec.ts
   ```
