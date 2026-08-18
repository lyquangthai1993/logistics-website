# Handoff Report — Explorer 3: Fleet Management Test & Verification Specification

- **Role**: Explorer 3 (Test & Verification Specialist)
- **Milestone**: Milestone 2 — Fleet Management (Vehicles & Drivers) Standardization
- **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_3`
- **Target Page**: `frontend/src/app/dashboard/fleet/page.tsx`
- **Feature Directory**: `frontend/src/features/fleet/`
- **Date**: 2026-08-18

---

## 1. Observation

A comprehensive line-by-line inspection of all E2E test suites in `frontend/e2e/`, backend controllers/entities, and frontend fleet components was conducted.

### 1.1 Line-by-Line Catalog of `frontend/e2e/04-fleet-crud-and-refresh.spec.ts`

| Test Case | Lines | Action / Step | Selector / Locator | Expected Assertion / Timing |
|---|---|---|---|---|
| **Setup** | L14–24 | `loginAs(page, fleetUser)` then `page.goto('/dashboard/fleet')` | N/A | Authenticates as `FLEET_MANAGER` (`lyquangthai1993+3@gmail.com`), navigates to `/dashboard/fleet`, waits for `domcontentloaded`. |
| **Test 1: Dashboard Render & Seeded Data** | L26–33 | Verify page title and seeded vehicles | `page.getByRole('heading', { name: /Quản Lý Đội Xe/i })`<br>`page.locator('table')` | Heading is visible within 10s.<br>Table contains `'75H-051.21'` within 10s.<br>Table contains `'43H-212.48'` within 10s. |
| **Test 2: Vehicle Create** | L39–48 | Open Add Vehicle modal and submit form | `#btn-add-vehicle`<br>`#vehicle-form-dialog`<br>`#input-license-plate`<br>`#input-vehicle-model`<br>`#select-vehicle-type`<br>`#input-max-weight`<br>`#input-max-volume`<br>`#input-current-hub`<br>`#btn-save-vehicle` | Modal appears.<br>Fills plate `75H-XXX.99`, model `'Volvo FMX Heavy'`, selects `'CONTAINER_40FT'`, weight `30000`, volume `70`, current hub `'Andromeda Hub (Hà Nội)'`.<br>Clicks Save button. |
| **Test 2: Vehicle Verify Created** | L49–51 | Check table contains created vehicle | `page.locator('table')` | Table contains `testLicensePlate` within 10s. |
| **Test 2: Vehicle Edit** | L52–60 | Locate created row, click edit, change status to MAINTENANCE, save | `tr:hasText(testLicensePlate)`<br>`button[data-testid^="btn-edit-vehicle-"]`<br>`#vehicle-form-dialog`<br>`#select-vehicle-status`<br>`#btn-save-vehicle`<br>`page.locator('table')` | Clicks edit button in row.<br>Modal opens.<br>Selects option `'MAINTENANCE'`.<br>Clicks Save.<br>Table contains badge text `'Bảo Trì'` within 10s. |
| **Test 2: Vehicle Delete** | L61–68 | Locate updated row, click delete, confirm in dialog | `tr:hasText(testLicensePlate)`<br>`button[data-testid^="btn-delete-vehicle-"]`<br>`#delete-confirm-dialog`<br>`#btn-confirm-delete`<br>`page.locator('table')` | Clicks delete button in row.<br>Confirm dialog appears.<br>Clicks delete confirm.<br>Table does **not** contain `testLicensePlate` within 10s. |
| **Test 3: Driver Tab Switch & Seeded Data** | L70–76 | Switch to Drivers tab and verify seeded driver | `#tab-drivers`<br>`page.locator('table')` | Clicks Drivers tab trigger, waits 500ms.<br>Table contains `'Nguyễn Văn Tài'` within 10s. |
| **Test 3: Driver Create** | L78–90 | Open Add Driver modal and submit form | `#btn-add-driver`<br>`#driver-form-dialog`<br>`#input-driver-name`<br>`#input-driver-phone`<br>`#input-driver-license-no`<br>`#select-driver-license-class`<br>`#input-driver-exp`<br>`#btn-save-driver` | Modal appears.<br>Fills name `Tài Xế Test XXX`, phone `09XXXXXXXX`, license `'790888777666'`, selects class `'FC'`, exp `7`.<br>Clicks Save. |
| **Test 3: Driver Verify Created** | L91–93 | Check table contains created driver | `page.locator('table')` | Table contains `testDriverName` within 10s. |
| **Test 3: Driver Edit** | L94–102 | Locate created driver row, click edit, change status to ON_TRIP, save | `tr:hasText(testDriverName)`<br>`button[data-testid^="btn-edit-driver-"]`<br>`#driver-form-dialog`<br>`#select-driver-status`<br>`#btn-save-driver`<br>`page.locator('table')` | Clicks edit button in row.<br>Modal opens.<br>Selects option `'ON_TRIP'`.<br>Clicks Save.<br>Table contains badge text `'Đang Đi Chuyến'` within 10s. |
| **Test 3: Driver Delete** | L103–110 | Locate updated driver row, click delete, confirm in dialog | `tr:hasText(testDriverName)`<br>`button[data-testid^="btn-delete-driver-"]`<br>`#delete-confirm-dialog`<br>`#btn-confirm-delete`<br>`page.locator('table')` | Clicks delete button in row.<br>Confirm dialog appears.<br>Clicks delete confirm.<br>Table does **not** contain `testDriverName` within 10s. |
| **Test 4: SPA Refresh Token Rotation** | L112–129 | Wait 65s for 1-minute JWT access token to expire, trigger API search | `#fleet-search-input`<br>`page.getByRole('heading', { name: /Quản Lý Đội Xe/i })` | Timeout 120s.<br>Waits 65s.<br>Types `'75H'` into search.<br>Asserts page is NOT redirected to `/auth/sign-in`.<br>Asserts heading remains visible. |
| **Test 5: Page Reload (F5) Refresh Token** | L131–152 | Wait 65s for 1-minute JWT access token to expire, trigger full browser reload (F5) | `page.reload()`<br>`page.getByRole('heading', { name: /Quản Lý Đội Xe/i })`<br>`page.locator('table')` | Timeout 120s.<br>Waits 65s.<br>Full page reload.<br>Asserts page is NOT redirected to `/auth/sign-in`.<br>Heading visible within 15s.<br>Table contains `'75H-051.21'` within 10s. |

---

### 1.2 Cross-Suite E2E Reference Matrix

| E2E Spec File | Lines | Reference & Expected Behavior |
|---|---|---|
| `frontend/e2e/03-rbac-routing.spec.ts` | L20–21 | Route `/dashboard/fleet`: Permitted for `SUPER_ADMIN` and `FLEET_MANAGER`. Blocked (redirects to `/dashboard/overview`) for `DISPATCHER` and `WAREHOUSE_MANAGER`. |
| `frontend/e2e/10-hubs-management.spec.ts` | L74–89 | FLEET_MANAGER visits `/dashboard/fleet`, clicks `#btn-add-vehicle`, verifies `#select-current-hub` dropdown is visible and has `option.count() > 1` (populated with seeded active hubs). |
| `frontend/e2e/07-capture-user-guide-screenshots.spec.ts` | L183–189 | Navigates to `/dashboard/fleet`, waits for `networkidle`, takes screenshot `11_fleet_vehicles_management.png`. |
| `frontend/e2e/06-order-dispatch-workflow.spec.ts` | L63–77 | FLEET_MANAGER visits `/dashboard/trips` and assigns trip vehicle using `#select-trip-vehicle` dropdown populated from vehicles API. |
| `frontend/e2e/01-console-health.spec.ts` | L13–58 | Zero console errors allowed on all navigated pages. |

---

### 1.3 Backend API Endpoints & RBAC Guards

- **Vehicles API** (`backend/src/vehicles/vehicles.controller.ts`):
  - `GET /api/v1/vehicles`: Guarded by `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.FLEET_MANAGER)`. Returns `VehicleEntity[]`.
  - `POST /api/v1/vehicles`: Creates vehicle. Returns `VehicleEntity`.
  - `PATCH /api/v1/vehicles/:id`: Updates vehicle. Returns `VehicleEntity`.
  - `DELETE /api/v1/vehicles/:id`: Soft deletes vehicle. Returns `HttpStatus.NO_CONTENT`.
- **Drivers API** (`backend/src/drivers/drivers.controller.ts`):
  - `GET /api/v1/drivers`: Guarded by `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.FLEET_MANAGER)`. Returns `DriverEntity[]`.
  - `POST /api/v1/drivers`: Creates driver. Returns `DriverEntity`.
  - `PATCH /api/v1/drivers/:id`: Updates driver. Returns `DriverEntity`.
  - `DELETE /api/v1/drivers/:id`: Soft deletes driver. Returns `HttpStatus.NO_CONTENT`.

---

## 2. Logic Chain: Verification Criteria & Potential Pitfalls

### Step 2.1: Critical Selectors & ID Preservation

```
Observation: E2E test scripts rely on exact element IDs and data-testids.
Logic: Any refactoring to TanStack Table or Shadcn components that alters or omits these attributes will cause immediate test failures.
```

1. **Search Input ID `#fleet-search-input`**:
   - Canonical `DataTableToolbarFilter` renders an input with dynamic aria attributes but does NOT by default add `id="fleet-search-input"`.
   - **Requirement**: The search input in the vehicles and drivers toolbar wrapper MUST explicitly include `id="fleet-search-input"`.

2. **Row Action Buttons (`data-testid`)**:
   - In `04-fleet-crud-and-refresh.spec.ts`, Playwright executes:
     - `row.locator('button[data-testid^="btn-edit-vehicle-"]').click()`
     - `row.locator('button[data-testid^="btn-delete-vehicle-"]').click()`
     - `row.locator('button[data-testid^="btn-edit-driver-"]').click()`
     - `row.locator('button[data-testid^="btn-delete-driver-"]').click()`
   - **Pitfall**: In standard boilerplate tables (like `features/products/cell-action.tsx`), actions are hidden inside a closed `DropdownMenu` trigger. If placed behind a dropdown, the test cannot find the button directly without clicking the dropdown trigger first.
   - **Requirement**: In `cell-action.tsx` for both Vehicles and Drivers, render the action buttons directly in the table cell with `data-testid={`btn-edit-vehicle-${vehicle.id}`}` / `data-testid={`btn-delete-vehicle-${vehicle.id}`}` (and driver equivalents), or keep them as direct visible buttons.

3. **Native `<select>` for Form Dropdowns**:
   - Playwright uses `page.selectOption('#select-vehicle-type', ...)` and `page.selectOption('#select-vehicle-status', ...)` as well as `#select-driver-license-class` and `#select-driver-status`.
   - `page.selectOption` requires native HTML `<select>` elements.
   - **Pitfall**: Replacing these with Radix UI `<Select>` primitives will trigger `Error: Element is not a <select> element`.
   - **Requirement**: Keep these four dropdowns as native `<select id="...">` elements.

4. **Dual Hub Selector Support (`#select-current-hub` & `#input-current-hub`)**:
   - `10-hubs-management.spec.ts` asserts:
     `const hubSelect = page.locator('#select-current-hub'); await expect(hubSelect).toBeVisible(); expect(optionsCount).toBeGreaterThan(1);`
   - `04-fleet-crud-and-refresh.spec.ts` executes:
     `await page.fill('#input-current-hub', 'Andromeda Hub (Hà Nội)');`
   - **Pitfall**: If only `<select id="select-current-hub">` is rendered, `page.fill('#input-current-hub')` times out. If only `<Input id="input-current-hub">` is rendered, `10-hubs-management.spec.ts` fails.
   - **Requirement**: Provide `<select id="select-current-hub">` populated with active hubs, AND ensure `#input-current-hub` is present in the DOM (e.g. as an input field or fallback/synced input).

5. **Tab Navigation IDs**:
   - Tab triggers must retain `id="tab-vehicles"` and `id="tab-drivers"`.

6. **Modal & Confirm Dialog IDs**:
   - Vehicle Dialog: `#vehicle-form-dialog`
   - Driver Dialog: `#driver-form-dialog`
   - Delete Dialog: `#delete-confirm-dialog`
   - Save Vehicle Button: `#btn-save-vehicle`
   - Save Driver Button: `#btn-save-driver`
   - Confirm Delete Button: `#btn-confirm-delete`

---

### Step 2.2: Table Uniformity & State Synchronization

```
Observation: Milestone 2 requires canonical TanStack Table (@tanstack/react-table v8) + nuqs URL sync.
Logic: Table state (search, pagination, filters) must synchronize with URL search params while preserving active tab isolation.
```

- When switching tabs between `vehicles` and `drivers`, pagination state must either:
  1. Use isolated query keys (or reset `page` to 1 on tab change) to prevent invalid page offsets when switching from a long vehicle list to a short driver list.
  2. Maintain `tab=vehicles` and `tab=drivers` in URL state so deep-linking directly opens the correct tab.
- Badge text mapping must match exact Vietnamese strings:
  - Vehicles: `'Sẵn Sàng'` (`AVAILABLE`), `'Đang Chạy Chuyến'` (`IN_USE`), `'Bảo Trì'` (`MAINTENANCE`).
  - Drivers: `'Sẵn Sàng'` (`AVAILABLE`), `'Đang Đi Chuyến'` (`ON_TRIP`), `'Nghỉ Phép'` (`OFF_DUTY`).

---

### Step 2.3: Toast Notifications Compliance

```
Observation: ORIGINAL_REQUEST.md mandates 100% Vietnamese toast messages and API-message-first error handling.
Logic: Any new mutations (create, update, delete) in features/fleet/ must adhere strictly to Rule 1 and Rule 2.
```

- **Success**:
  - `toast.success('Tạo xe mới thành công!')`
  - `toast.success('Cập nhật thông tin xe thành công!')`
  - `toast.success('Xóa xe thành công!')`
  - `toast.success('Tạo tài xế mới thành công!')`
  - `toast.success('Cập nhật thông tin tài xế thành công!')`
  - `toast.success('Xóa tài xế thành công!')`
- **Error (API Message First)**:
  - `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Có lỗi xảy ra khi lưu thông tin.');`

---

## 3. Caveats

1. **Test Environment Dependency**:
   - `04-fleet-crud-and-refresh.spec.ts` Tests 4 & 5 test 65-second token expiration. When executing full test suites, these tests have 120s timeout and require backend JWT configuration (1-minute token TTL in test environment).
2. **Pre-Seeded Data**:
   - Tests expect `75H-051.21`, `43H-212.48`, and `Nguyễn Văn Tài` to exist in the database upon startup. If testing on a clean database, database seed scripts must be run first.
3. **No Caveats on Architecture**:
   - All locator contracts and business rules are fully mapped and cross-verified against all 19 E2E test files in `frontend/e2e/`.

---

## 4. Conclusion

The standardization of Fleet Management (`/dashboard/fleet`) into canonical TanStack Tables (`@tanstack/react-table` + `nuqs`) is fully feasible and high-impact. To ensure 100% pass rate on existing and updated Playwright test suites, the implementation MUST adhere to the following master verification specifications:

### Master Verification Specification Matrix

| Component | Target Location | Mandatory Contract / Element ID / Test ID |
|---|---|---|
| **Header** | `src/app/dashboard/fleet/page.tsx` | Heading matching `/Quản Lý Đội Xe/i`<br>`#btn-add-vehicle`<br>`#btn-add-driver` |
| **Tabs** | `src/app/dashboard/fleet/page.tsx` | `#tab-vehicles`<br>`#tab-drivers` |
| **Toolbar** | `src/features/fleet/components/*/` | `#fleet-search-input`<br>`#fleet-status-filter` (or faceted filters) |
| **Vehicles Table** | `src/features/fleet/components/vehicles-table/` | Canonical `DataTable` + `DataTablePagination`<br>Direct row buttons: `button[data-testid^="btn-edit-vehicle-"]`, `button[data-testid^="btn-delete-vehicle-"]`<br>Badges: `'Sẵn Sàng'`, `'Đang Chạy Chuyến'`, `'Bảo Trì'` |
| **Drivers Table** | `src/features/fleet/components/drivers-table/` | Canonical `DataTable` + `DataTablePagination`<br>Direct row buttons: `button[data-testid^="btn-edit-driver-"]`, `button[data-testid^="btn-delete-driver-"]`<br>Badges: `'Sẵn Sàng'`, `'Đang Đi Chuyến'`, `'Nghỉ Phép'` |
| **Vehicle Modal** | `src/features/fleet/components/vehicle-modal.tsx` | `#vehicle-form-dialog`<br>`#input-license-plate`<br>`#input-vehicle-model`<br>`#select-vehicle-type` (native select)<br>`#select-vehicle-status` (native select)<br>`#input-max-weight`<br>`#input-max-volume`<br>`#select-current-hub` (with active hub options)<br>`#input-current-hub` (DOM present)<br>`#input-is-external`<br>`#input-external-provider`<br>`#btn-save-vehicle` |
| **Driver Modal** | `src/features/fleet/components/driver-modal.tsx` | `#driver-form-dialog`<br>`#input-driver-name`<br>`#input-driver-phone`<br>`#input-driver-license-no`<br>`#select-driver-license-class` (native select)<br>`#input-driver-exp`<br>`#select-driver-status` (native select)<br>`#btn-save-driver` |
| **Delete Dialog** | `src/features/fleet/components/delete-confirm-dialog.tsx` | `#delete-confirm-dialog`<br>`#btn-confirm-delete` |

---

## 5. Verification Method

To independently verify the Fleet Management implementation, execute the following steps in sequence:

### 5.1 Type & Build Verification
```powershell
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit
npm run build
```
- **Pass Criteria**: Exit code 0, 0 TypeScript errors, 0 build errors.

### 5.2 Specific Fleet E2E Test Execution
```powershell
cd d:\Projects\logistics-website\frontend
npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts --project=chromium
```
- **Pass Criteria**: All 5 test cases pass (Dashboard render, Vehicle CRUD, Driver CRUD, SPA Refresh, F5 Reload).

### 5.3 Cross-Suite Dependent E2E Test Execution
```powershell
cd d:\Projects\logistics-website\frontend
npx playwright test e2e/03-rbac-routing.spec.ts e2e/10-hubs-management.spec.ts e2e/01-console-health.spec.ts --project=chromium
```
- **Pass Criteria**: All RBAC route guards, Hub-Vehicle relation checks, and Console Health checks pass 100%.

### 5.4 Manual Review Checklist for Reviewers & Challengers
- [ ] Check `frontend/src/features/fleet/components/vehicles-table/columns.tsx` for `DataTableColumnHeader` sorting and `CellAction` direct button testids.
- [ ] Check `frontend/src/features/fleet/components/drivers-table/columns.tsx` for `DataTableColumnHeader` sorting and `CellAction` direct button testids.
- [ ] Verify `#fleet-search-input` exists on both tabs and updates `search` query parameter in real-time.
- [ ] Verify all form modal dropdowns are native `<select>` elements with exact matching IDs.
- [ ] Verify both `#select-current-hub` and `#input-current-hub` exist in the vehicle modal.
- [ ] Verify 0 English toast notifications in `features/fleet/`.
