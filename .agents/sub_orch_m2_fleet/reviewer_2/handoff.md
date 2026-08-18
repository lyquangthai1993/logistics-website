# Review Report — Milestone 2: Fleet Management Standardization

- **Reviewer**: Reviewer 2 (E2E Locators, Contract Compatibility & Adversarial QA Critic)
- **Role**: Reviewer / Critic
- **Target Feature**: `frontend/src/features/fleet/` & `frontend/src/app/dashboard/fleet/`
- **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\reviewer_2`
- **Parent Conversation ID**: `7172e926-cfe8-4b9c-8361-0f7ee6c930b0`
- **Date**: 2026-08-18
- **Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

### 1.1 Direct Static Code Inspection
1. **Critical DOM Selectors & Locators**:
   - `#btn-add-vehicle`: Present in `frontend/src/features/fleet/components/fleet-listing.tsx` (L29).
   - `#btn-add-driver`: Present in `frontend/src/features/fleet/components/fleet-listing.tsx` (L37).
   - `#tab-vehicles`: Present in `frontend/src/features/fleet/components/fleet-listing.tsx` (L59).
   - `#tab-drivers`: Present in `frontend/src/features/fleet/components/fleet-listing.tsx` (L67).
   - `#fleet-search-input`: Present in both `frontend/src/features/fleet/components/vehicles-table/index.tsx` (L59) and `drivers-table/index.tsx` (L58).
   - `#delete-confirm-dialog` & `#btn-confirm-delete`: Present in `frontend/src/features/fleet/components/delete-confirm-dialog.tsx` (L31, L52).
   - Action Buttons: `button[data-testid^="btn-edit-vehicle-"]` and `button[data-testid^="btn-delete-vehicle-"]` present in `vehicles-table/cell-action.tsx` (L57, L67). `button[data-testid^="btn-edit-driver-"]` and `button[data-testid^="btn-delete-driver-"]` present in `drivers-table/cell-action.tsx` (L57, L67).
   - Vehicle Dialog & Inputs: `#vehicle-form-dialog` (L144), `#input-license-plate` (L162), `#input-vehicle-model` (L177), `#select-vehicle-type` (L194), `#select-vehicle-status` (L213), `#input-max-weight` (L234), `#input-max-volume` (L249), `#select-current-hub` (L269), `#input-current-hub` (L298), `#input-is-external` (L311), `#input-external-provider` (L333), `#btn-save-vehicle` (L355).
   - Driver Dialog & Inputs: `#driver-form-dialog` (L103), `#input-driver-name` (L121), `#input-driver-phone` (L136), `#input-driver-license-no` (L154), `#select-driver-license-class` (L168), `#input-driver-exp` (L190), `#select-driver-status` (L204), `#btn-save-driver` (L227).

2. **Native `<select>` Elements**:
   - `#select-vehicle-type`, `#select-vehicle-status`, `#select-current-hub`, `#select-driver-license-class`, and `#select-driver-status` are implemented as native `<select>` elements, matching `page.selectOption(...)` requirements.

3. **External Contract Compatibility**:
   - `frontend/src/features/fleet/api.ts` exports `* from './api/index'`.
   - `frontend/src/app/dashboard/trips/page.tsx` imports `{ fleetApi, Vehicle, Driver } from '@/features/fleet/api'` and passes typecheck with 0 errors.

### 1.2 Live Build & Test Suite Verification
1. **TypeScript Typecheck**:
   Command: `npx tsc --noEmit` in `frontend/`
   Result: **Exit Code 0** (0 compile / type errors).

2. **Playwright E2E Test Suite Execution**:
   Command: `npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts --project=chromium`
   Result: **Exit Code 1 (3 Failed, 4 Passed)**.
   
   - `10-hubs-management.spec.ts`:
     - `Super Admin can view, search and manage Hubs`: **Passed** (ok)
     - `FLEET_MANAGER is blocked from /dashboard/admin/hubs and can select Hub in fleet page`: **Passed** (ok)
   
   - `04-fleet-crud-and-refresh.spec.ts`:
     - `1. Renders Fleet Dashboard & Seeded Data`: **Passed** (ok)
     - `2. Vehicle CRUD: Create, Edit, Delete`: **FAILED** (x)
     - `3. Driver CRUD: Create, Edit, Delete`: **FAILED** (x)
     - `4. SPA API Auto-Refresh (Access Token Expires in 1m)`: **FAILED** (x)
     - `5. Page Reload / F5 Auto-Refresh (Access Token Expires in 1m)`: **Passed** (ok)

### 1.3 Verbatim Error Logs

#### Error 1 (Test 4): Heading Strict Mode Violation
```
Error: strict mode violation: getByRole('heading', { name: /Quản Lý Đội Xe/i }) resolved to 2 elements:
    1) <h2 class="text-3xl font-bold tracking-tight">Quản Lý Đội Xe</h2> aka getByRole('heading', { name: 'Quản Lý Đội Xe', exact: true })
    2) <h2 class="text-lg font-semibold wrap-break-word">Quản Lý Đội Xe — TanStack Table & nuqs Pattern</h2> aka getByRole('heading', { name: 'Quản Lý Đội Xe — TanStack' })
```

#### Error 2 (Test 2 & Test 3): Pointer Events Intercepted on Row Action Buttons
```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('tr').filter({ hasText: '75H-825.99' }).locator('button[data-testid^="btn-edit-vehicle-"]')
    - locator resolved to <button ... data-testid="btn-edit-vehicle-10" ...>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - scrolling into view if needed
    - <div class="absolute inset-0 flex overflow-hidden rounded-lg border">…</div> intercepts pointer events
    - <div class="flex flex-1 flex-col space-y-4">…</div> intercepts pointer events
    - <div class="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8">…</div> from <div class="flex flex-col gap-2.5">…</div> subtree intercepts pointer events
```

#### Error 3 (Test 2): Vehicle Form State Reset Race Condition
```
Error: expect(locator).toContainText(expected) failed
Locator: locator('table')
Expected substring: "75H-226.99"
```

---

## 2. Logic Chain & Root Cause Analysis

1. **Root Cause for Error 1 (Heading Collision in Test 4)**:
   - In `frontend/src/app/dashboard/fleet/page.tsx` (L20-23), `PageContainer` receives `infoContent={fleetInfoContent}`.
   - In `frontend/src/features/fleet/info-content.ts` (L4), `title` is `'Quản Lý Đội Xe — TanStack Table & nuqs Pattern'`.
   - `PageContainer` renders both the page title (`<h2>Quản Lý Đội Xe</h2>`) and the Infobar drawer title (`<h2>Quản Lý Đội Xe — TanStack Table & nuqs Pattern</h2>`).
   - Because both `<h2>` elements match the regex `/Quản Lý Đội Xe/i`, Playwright throws a strict mode violation error when locating `getByRole('heading', { name: /Quản Lý Đội Xe/i })`.

2. **Root Cause for Error 2 (Pointer Events Interception in Test 2 & Test 3)**:
   - In `frontend/src/components/ui/table/data-table.tsx` (L25-27), the table is rendered inside `<div className='relative flex flex-1'><div className='absolute inset-0 flex overflow-hidden rounded-lg border'>`.
   - In `frontend/src/features/fleet/components/fleet-listing.tsx` and `TabsContent`, the parent container does not enforce an explicit minimum height or flex container constraint.
   - This causes the `relative flex flex-1` container to have a height of 0 or collapse, resulting in `<div className='flex flex-col gap-2.5'>` (which wraps `DataTablePagination`) sitting on top of and overlapping the table rows.
   - When Playwright attempts to click `button[data-testid^="btn-edit-vehicle-*"]` or `button[data-testid^="btn-edit-driver-*"]`, the click action is intercepted by the pagination container, triggering a timeout.

3. **Root Cause for Error 3 (Vehicle Modal Reset Race Condition in Test 2)**:
   - In `frontend/src/features/fleet/components/vehicle-form-dialog.tsx` (L61-86), `useEffect` resets form state (`setLicensePlate('')`, `setModel('')`, etc.) whenever its dependency array `[vehicle, hubs, open]` triggers.
   - `hubs` is fetched asynchronously in a separate `useEffect` (L43-58).
   - When a user/test opens the modal and begins typing the license plate, the `hubs` promise resolves shortly afterward, triggering `setHubs(data)`.
   - The dependency change in `hubs` causes the reset `useEffect` to re-execute, clearing `licensePlate` to `''` while the form is open.
   - Consequently, form submission either submits an empty string or is blocked by browser validation, preventing the vehicle from being created.

---

## 3. Caveats

- **No Caveats**: The issues were directly reproduced in a live execution of Playwright E2E tests and isolated to specific lines of code.

---

## 4. Conclusion & Required Changes

The implementation has solid architecture and passes all TypeScript typecheck and selector naming requirements. However, it fails live E2E test execution due to 3 specific layout and lifecycle bugs.

### Required Actions (Must Fix):
1. **Fix Heading Collision in `info-content.ts`**:
   - In `frontend/src/features/fleet/info-content.ts` (L4), change `title` to:
     `'Đội Xe & Phương Tiện — Hướng Dẫn & Kiến Trúc'`
     (Matches the pattern used by `hubsInfoContent.title = 'Chi Nhánh Kho (Hubs) — Hướng Dẫn & Kiến Trúc'`).

2. **Fix Form Reset Race Condition in `vehicle-form-dialog.tsx`**:
   - In `frontend/src/features/fleet/components/vehicle-form-dialog.tsx`, decouple the form initialization/reset `useEffect` from `hubs` updates (e.g. dependency array `[vehicle, open]`), and only set the default hub when opening in create mode if no hub has been chosen yet.

3. **Fix Table Pointer Interception / Layout Height in `DataTable` or `fleet-listing.tsx`**:
   - In `frontend/src/components/ui/table/data-table.tsx` or `frontend/src/features/fleet/components/fleet-listing.tsx`, ensure the table container provides a stable min-height (e.g. `min-h-[380px]` or `relative min-h-[360px] flex-1 rounded-lg border overflow-hidden`) so `DataTablePagination` does not overlap table action buttons.

4. **Default Sorting in `service.ts`**:
   - In `frontend/src/features/fleet/api/service.ts`, when `filters.sort` is not provided, sort by `id DESC` or `createdAt DESC` so newly created records appear on page 1 of the paginated table.

---

## 5. Verification Method

Once Worker 1 applies the fixes, independently verify by running:

```powershell
cd d:\Projects\logistics-website\frontend
npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts --project=chromium
```

**Expected Result**: All 7 tests in `04-fleet-crud-and-refresh.spec.ts` and `10-hubs-management.spec.ts` must pass (7/7 passed).
