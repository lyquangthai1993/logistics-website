# Investigation Report: Milestone 2 — Fleet Management Standardization

## 1. Observation

### 1.1 Codebase Structure & File Inventory
The fleet management feature in the frontend is primarily implemented across the following files:
- **Main View / Page Component**: `frontend/src/app/dashboard/fleet/page.tsx` (1,050 lines, Client Component marked with `'use client'`).
- **Feature API Layer**: `frontend/src/features/fleet/api.ts` (92 lines) providing interfaces `Vehicle`, `Driver`, `CreateVehiclePayload`, `CreateDriverPayload`, and the `fleetApi` service wrapper over `apiClient`.
- **Hubs API Dependency**: `frontend/src/features/hubs/api.ts` providing `hubsApi.getActiveHubs()` and the `Hub` type used for the hub selection dropdown in the Vehicle modal.
- **RBAC & Routing**:
  - `frontend/src/proxy.ts` (Lines 8-9): `roleRouteMap['/dashboard/fleet'] = ['SUPER_ADMIN', 'FLEET_MANAGER']`.
  - `frontend/src/config/nav-config.ts` (Lines 50-57): Sidebar item `'Quản lý đội xe'` pointing to `/dashboard/fleet` with access restricted to `SUPER_ADMIN,FLEET_MANAGER`.
- **Backend Endpoints & Service Layer**:
  - `backend/src/vehicles/vehicles.controller.ts` & `backend/src/vehicles/vehicles.service.ts`: `@Controller('vehicles')` with endpoints `POST /api/v1/vehicles`, `GET /api/v1/vehicles`, `GET /api/v1/vehicles/:id`, `PATCH /api/v1/vehicles/:id`, `DELETE /api/v1/vehicles/:id` (using `softRemove`).
  - `backend/src/drivers/drivers.controller.ts` & `backend/src/drivers/drivers.service.ts`: `@Controller('drivers')` with endpoints `POST /api/v1/drivers`, `GET /api/v1/drivers`, `GET /api/v1/drivers/:id`, `PATCH /api/v1/drivers/:id`, `DELETE /api/v1/drivers/:id` (using `softRemove`).

### 1.2 State Management & UI Architecture
In `frontend/src/app/dashboard/fleet/page.tsx`, state is currently managed locally via standard React hooks:
1. **Core Data State**:
   - `vehicles`: `Vehicle[]` (loaded via `fleetApi.getVehicles()`)
   - `drivers`: `Driver[]` (loaded via `fleetApi.getDrivers()`)
   - `hubs`: `Hub[]` (loaded via `hubsApi.getActiveHubs().catch(() => [])`)
   - `loading`: `boolean` (initial `true`, set `false` in `finally`)
2. **Navigation & Tab State**:
   - `activeTab`: `'vehicles' | 'drivers'` (controlled via Shadcn `Tabs` with default `'vehicles'`, switching tabs triggers `setStatusFilter('ALL')`).
3. **Search & Filter State**:
   - `searchTerm`: `string` (bound to `#fleet-search-input`).
   - `statusFilter`: `string` (bound to `#fleet-status-filter`, default `'ALL'`).
     - When `activeTab === 'vehicles'`: options are `'ALL'`, `'AVAILABLE'` (Sẵn Sàng), `'IN_USE'` (Đang Chạy Chuyến), `'MAINTENANCE'` (Bảo Trì).
     - When `activeTab === 'drivers'`: options are `'ALL'`, `'AVAILABLE'` (Sẵn Sàng), `'ON_TRIP'` (Đang Đi Chuyến), `'OFF_DUTY'` (Nghỉ Phép).
4. **Client-side Filter Computation (`useMemo`)**:
   - `filteredVehicles`: filters `vehicles` against `searchTerm` (matched against `licensePlate`, `model`, `hub.name`, `currentHub`) and `statusFilter`.
   - `filteredDrivers`: filters `drivers` against `searchTerm` (matched against `fullName`, `phone`, `licenseNumber`) and `statusFilter`.
5. **KPI Metrics Cards**:
   - **Tổng Số Xe**: `vehicles.length`
   - **Xe Đang Chạy Chuyến**: `vehicles.filter((v) => v.status === 'IN_USE').length`
   - **Tổng Số Tài Xế**: `drivers.length`
   - **Xe Bảo Trì**: `vehicles.filter((v) => v.status === 'MAINTENANCE').length`
6. **Pagination**:
   - Currently **NOT implemented** in `fleet/page.tsx` — all filtered records are rendered directly in a basic HTML `<table>`.

### 1.3 Modal Dialogs & Form Field Mappings
`fleet/page.tsx` contains 3 distinct modal dialogs using Shadcn `Dialog`:

| Dialog | Dialog Container ID | Triggers | Form Fields & IDs | Action Buttons |
| :--- | :--- | :--- | :--- | :--- |
| **Add / Edit Vehicle** | `#vehicle-form-dialog` (`DialogContent`) | `#btn-add-vehicle`<br/>`button[data-testid^="btn-edit-vehicle-"]` | - `#input-license-plate` (`string`, required)<br/>- `#input-vehicle-model` (`string`)<br/>- `#select-vehicle-type` (`CONTAINER_40FT`, `CONTAINER_20FT`, `TRUCK_8T`, `TRUCK_5T`)<br/>- `#select-vehicle-status` (`AVAILABLE`, `IN_USE`, `MAINTENANCE`)<br/>- `#input-max-weight` (`number`, required)<br/>- `#input-max-volume` (`number`, step `0.1`, required)<br/>- `#select-current-hub` (when `hubs.length > 0`) or fallback `#input-current-hub`<br/>- `#input-is-external` (`checkbox`)<br/>- `#input-external-provider` (`string`, required if external) | - Hủy (`variant='outline'`)<br/>- `#btn-save-vehicle` (Text: `"Tạo Xe Mới"` or `"Cập Nhật Xe"`) |
| **Add / Edit Driver** | `#driver-form-dialog` (`DialogContent`) | `#btn-add-driver`<br/>`button[data-testid^="btn-edit-driver-"]` | - `#input-driver-name` (`string`, required)<br/>- `#input-driver-phone` (`string`, required)<br/>- `#input-driver-license-no` (`string`)<br/>- `#select-driver-license-class` (`FC`, `C`, `E`, `D`)<br/>- `#input-driver-exp` (`number`)<br/>- `#select-driver-status` (`AVAILABLE`, `ON_TRIP`, `OFF_DUTY`) | - Hủy (`variant='outline'`)<br/>- `#btn-save-driver` (Text: `"Tạo Tài Xế Mới"` or `"Cập Nhật Tài Xế"`) |
| **Delete Confirmation** | `#delete-confirm-dialog` (`DialogContent`) | `button[data-testid^="btn-delete-vehicle-"]`<br/>`button[data-testid^="btn-delete-driver-"]` | Context message with target item name: `deletingItem.name` | - Hủy (`variant='outline'`)<br/>- `#btn-confirm-delete` (Text: `"Xóa Ngay"`, `variant='destructive'`) |

### 1.4 Comprehensive E2E Selectors & Test ID Registry
From analyzing `frontend/e2e/04-fleet-crud-and-refresh.spec.ts`, `10-hubs-management.spec.ts`, and `07-capture-user-guide-screenshots.spec.ts`:

1. **Page & Navigation**:
   - Header Heading: `h2` with text matching `/Quản Lý Đội Xe/i`
   - Tab triggers:
     - `#tab-vehicles` (or `TabsTrigger[value="vehicles"]`)
     - `#tab-drivers` (or `TabsTrigger[value="drivers"]`)
   - Header Action Buttons:
     - `#btn-add-vehicle`
     - `#btn-add-driver`
2. **Search & Filter Controls**:
   - Search input: `#fleet-search-input`
   - Status dropdown: `#fleet-status-filter`
3. **Vehicles Table & Row Actions**:
   - Row test ID: `data-testid="vehicle-row-${vehicle.id}"`
   - Edit button: `button[data-testid="btn-edit-vehicle-${vehicle.id}"]` (or matching `button[data-testid^="btn-edit-vehicle-"]`)
   - Delete button: `button[data-testid="btn-delete-vehicle-${vehicle.id}"]` (or matching `button[data-testid^="btn-delete-vehicle-"]`)
4. **Drivers Table & Row Actions**:
   - Row test ID: `data-testid="driver-row-${driver.id}"`
   - Edit button: `button[data-testid="btn-edit-driver-${driver.id}"]` (or matching `button[data-testid^="btn-edit-driver-"]`)
   - Delete button: `button[data-testid="btn-delete-driver-${driver.id}"]` (or matching `button[data-testid^="btn-delete-driver-"]`)
5. **Vehicle Modal Selectors**:
   - Modal Container: `#vehicle-form-dialog`
   - Inputs: `#input-license-plate`, `#input-vehicle-model`, `#select-vehicle-type`, `#select-vehicle-status`, `#input-max-weight`, `#input-max-volume`, `#select-current-hub`, `#input-current-hub`, `#input-is-external`, `#input-external-provider`
   - Save Button: `#btn-save-vehicle`
6. **Driver Modal Selectors**:
   - Modal Container: `#driver-form-dialog`
   - Inputs: `#input-driver-name`, `#input-driver-phone`, `#input-driver-license-no`, `#select-driver-license-class`, `#input-driver-exp`, `#select-driver-status`
   - Save Button: `#btn-save-driver`
7. **Delete Dialog Selectors**:
   - Modal Container: `#delete-confirm-dialog`
   - Confirm Delete Button: `#btn-confirm-delete`

### 1.5 API & Error Handling Mapping
- Current API calls in `page.tsx`:
  - `loadData()` calls `Promise.all([fleetApi.getVehicles(), fleetApi.getDrivers(), hubsApi.getActiveHubs()])`.
  - Mutations directly call `fleetApi.createVehicle`, `fleetApi.updateVehicle`, `fleetApi.deleteVehicle`, `fleetApi.createDriver`, `fleetApi.updateDriver`, `fleetApi.deleteDriver`.
- **Existing Error Handling Deficiencies**:
  - All errors currently only invoke `console.error(...)` with 0 user-facing toast notifications.
  - Missing integration with `sonner` toast messages according to `ORIGINAL_REQUEST.md` (Vietnamese messages + API message first pattern: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || '...')`).

---

## 2. Logic Chain

1. **Premise 1: Standardization Architecture**
   - In accordance with R2 in `ORIGINAL_REQUEST.md` and Phase 1 Milestone 2, data listing tables must standardize on TanStack React Table (`@tanstack/react-table` v8) with `useDataTable`, `DataTable`, `DataTablePagination`, and `nuqs` URL search params (`page`, `perPage`, `search`, `status`, `tab`).
2. **Premise 2: Two Entity Types Under Single Page (Vehicles & Drivers)**
   - Unlike single-entity pages (`/dashboard/admin/hubs` or `/dashboard/product`), `/dashboard/fleet` hosts two distinct operational entities under tab switching (`vehicles` and `drivers`).
   - Standardizing this requires either:
     - A tabbed container hosting two separate `useDataTable` instances / `DataTable` views (e.g. `VehiclesTable` and `DriversTable` components in `src/features/fleet/components/fleet-tables/`), synchronized with a `tab` query state in `nuqs`.
     - Or a unified page layout where switching tabs seamlessly switches the active table and column definition while preserving test IDs and selectors.
3. **Premise 3: E2E Compatibility Preservation**
   - E2E tests `04-fleet-crud-and-refresh.spec.ts` and `10-hubs-management.spec.ts` rely strictly on exact DOM IDs (`#btn-add-vehicle`, `#tab-drivers`, `#vehicle-form-dialog`, `#select-current-hub`, `#delete-confirm-dialog`, etc.) and data-testid attributes (`[data-testid^="btn-edit-vehicle-"]`, etc.).
   - Standardizing table markup must retain table tags (`table`, `tr`, `td`) and ensure that row-level action buttons retain their exact `data-testid` attributes.
4. **Premise 4: Notification Standard Compliance**
   - Refactoring must introduce proper Vietnamese toast notifications (`toast.success` and `toast.error` with API message fallback) for all CRUD actions (Vehicle Create/Update/Delete and Driver Create/Update/Delete).

---

## 3. Caveats

1. **Hub Dropdown vs Input Selector Duality**:
   - `10-hubs-management.spec.ts` line 84 specifically tests `await page.locator('#select-current-hub').toBeVisible()`.
   - `04-fleet-crud-and-refresh.spec.ts` line 46 contains `await page.fill('#input-current-hub', 'Andromeda Hub (Hà Nội)')`.
   - *Risk/Mitigation*: If `hubs` are populated from `hubsApi.getActiveHubs()`, `#select-current-hub` will be rendered. If a test attempts `page.fill('#input-current-hub')`, it will fail unless `#input-current-hub` is either present in the DOM (e.g., hidden/fallback or both select/input supported) or if `#select-current-hub` has matching text. The modal should ensure both test patterns are satisfied or resiliently handled.
2. **Backend Unpaginated Response vs Table Pagination**:
   - `VehiclesService.findAll()` and `DriversService.findAll()` in the backend return full unpaginated arrays (`VehicleEntity[]` and `DriverEntity[]`).
   - `useDataTable` on the client can perform client-side pagination over the loaded dataset using `getPaginationRowModel()` or compute `pageCount = Math.ceil(total / perPage)` while syncing `page` and `perPage` with `nuqs`.
3. **Tab State in URL Search Params**:
   - Switching between `'vehicles'` and `'drivers'` should sync with `tab` parameter in `nuqs` (e.g. `?tab=vehicles` vs `?tab=drivers`) while ensuring `#tab-vehicles` and `#tab-drivers` triggers remain reactive and functional.
4. **Toast Message Consistency**:
   - All toast messages must be 100% Vietnamese.
   - Any error toast from API responses must extract `err?.response?.data?.message` first.

---

## 4. Conclusion

The `/dashboard/fleet` page is a dual-tab management interface handling Vehicles and Drivers with 4 KPI summary cards, 3 modals (Add/Edit Vehicle, Add/Edit Driver, Delete Confirmation), and full CRUD functionality. 

To achieve Milestone 2 standardization:
1. **Component Structure**:
   - Refactor `src/features/fleet/` to include canonical table components:
     - `src/features/fleet/components/fleet-tables/vehicles-table.tsx` & `columns-vehicles.tsx`
     - `src/features/fleet/components/fleet-tables/drivers-table.tsx` & `columns-drivers.tsx`
     - `src/features/fleet/components/vehicle-modal.tsx` (preserving `#vehicle-form-dialog` and all input IDs)
     - `src/features/fleet/components/driver-modal.tsx` (preserving `#driver-form-dialog` and all input IDs)
     - `src/features/fleet/components/delete-confirm-dialog.tsx` (preserving `#delete-confirm-dialog` and `#btn-confirm-delete`)
2. **State & URL Sync**:
   - Integrate `useDataTable` with `nuqs` for search params (`search`, `status`, `page`, `perPage`, `tab`).
3. **Notifications**:
   - Add Sonner toast notifications with Vietnamese messages and API message fallback.
4. **Zero Regression**:
   - Preserve 100% of selectors, test IDs, and RBAC guards (`SUPER_ADMIN`, `FLEET_MANAGER`).

---

## 5. Verification Method

To independently verify the investigation findings and test the future standardization implementation:

1. **TypeScript Build & Typecheck**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   npm run build
   # or
   npx tsc --noEmit
   ```
2. **E2E Playwright Test Suite Verification**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   # Run fleet CRUD & refresh rotation tests
   npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts --project=chromium --headed
   # Run hubs management test (which tests fleet hub selector)
   npx playwright test e2e/10-hubs-management.spec.ts --project=chromium --headed
   # Run RBAC route guard test
   npx playwright test e2e/03-rbac-routing.spec.ts --project=chromium --headed
   ```
3. **Manual DOM & Selector Inspection**:
   - Verify presence of `#btn-add-vehicle`, `#btn-add-driver`, `#tab-vehicles`, `#tab-drivers`, `#fleet-search-input`, `#fleet-status-filter`.
   - Verify modal IDs: `#vehicle-form-dialog`, `#driver-form-dialog`, `#delete-confirm-dialog`.
   - Verify row action test IDs: `data-testid="btn-edit-vehicle-${id}"`, `data-testid="btn-delete-vehicle-${id}"`, `data-testid="btn-edit-driver-${id}"`, `data-testid="btn-delete-driver-${id}"`.
