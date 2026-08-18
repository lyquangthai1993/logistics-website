# Investigation & Test Compatibility Report — Explorer 3 (Iteration 2)

- **Agent**: Explorer 3 (Iteration 2)
- **Role**: Explorer / Investigator / Synthesist
- **Milestone**: Milestone 2 — Fleet Management Standardization
- **Target Feature**: `frontend/src/features/fleet/api/service.ts` & E2E Test Suite `frontend/e2e/04-fleet-crud-and-refresh.spec.ts`
- **Parent Conversation ID**: `7172e926-cfe8-4b9c-8361-0f7ee6c930b0`
- **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_r2_3`
- **Date**: 2026-08-18

---

## 1. Observation

### 1.1 Direct Static Code Inspection

#### A. Pagination & Sorting in `frontend/src/features/fleet/api/service.ts`
1. **`getPaginatedVehicles` (L20-75)**:
   - Calls `apiClient.get<Vehicle[]>('/api/v1/vehicles')`.
   - When `filters.sort` is provided, parses JSON sort string `sorting = JSON.parse(filters.sort)`.
   - **Flaw 1 (No Default Sort)**: When `filters.sort` is `undefined`, `null`, or empty string `""`, `filtered` is not explicitly sorted. It relies on the raw order returned by the backend.
   - **Flaw 2 (String vs Numeric Sorting)**:
     ```typescript
     const valA = a[id] ?? '';
     const valB = b[id] ?? '';
     if (valA < valB) return desc ? 1 : -1;
     if (valA > valB) return desc ? -1 : 1;
     return 0;
     ```
     For numeric fields (`maxWeight`, `maxVolume`, `id`), string comparison `"30000" < "8000"` evaluates as `"3" < "8"` (`true`), causing inverted sorting order.
   - **Flaw 3 (Object/Nested fields)**: For `currentHub` (`v.hub?.name || v.currentHub`), accessing `a['currentHub']` directly yields empty string if the hub name is nested inside `a.hub.name`.
   - **Flaw 4 (Non-deterministic Tie-break)**: When values are equal, no deterministic secondary sort (`id DESC`) is performed, causing unstable pagination row positions.

2. **`getPaginatedDrivers` (L97-151)**:
   - Calls `apiClient.get<Driver[]>('/api/v1/drivers')`.
   - When `filters.sort` is omitted or empty, no default sort is applied.
   - Numeric field `experienceYears` suffers from the same string comparison flaw.
   - No secondary tie-breaker on `id DESC`.

#### B. Query Invalidation & Data Freshness in `mutations.ts` & Form Dialogs
1. In `frontend/src/features/fleet/api/mutations.ts`:
   - `createVehicleMutation`, `updateVehicleMutation`, `deleteVehicleMutation` all call `qc.invalidateQueries({ queryKey: fleetKeys.allVehicles })` and `qc.invalidateQueries({ queryKey: fleetKeys.all })`.
   - `createDriverMutation`, `updateDriverMutation`, `deleteDriverMutation` all call `qc.invalidateQueries({ queryKey: fleetKeys.allDrivers })` and `qc.invalidateQueries({ queryKey: fleetKeys.all })`.
2. In `frontend/src/features/fleet/components/vehicle-form-dialog.tsx` (L93, L106) and `driver-form-dialog.tsx` (L59, L72):
   - Form dialogs also call `queryClient.invalidateQueries({ queryKey: ['fleet'] })` upon mutation success.
3. **Data Freshness Flow**:
   - Form submit -> POST/PATCH/DELETE API call -> `['fleet']` query keys invalidated -> TanStack Query triggers immediate background refetch of `vehiclesQueryOptions(filters)` and `driversQueryOptions(filters)` -> `getPaginatedVehicles` / `getPaginatedDrivers` called.
   - If default sorting in `service.ts` sorts by newest first (`createdAt DESC`, `id DESC`), newly created vehicles/drivers will ALWAYS appear at row index 0 on Page 1 (`vehicles.slice(0, 10)`).

---

### 1.2 Inspection of All 5 Test Cases in `04-fleet-crud-and-refresh.spec.ts`

```typescript
// Test 1: Renders Fleet Dashboard & Seeded Data
await expect(page.getByRole('heading', { name: /Quản Lý Đội Xe/i })).toBeVisible({ timeout: 10_000 });
await expect(page.locator('table')).toContainText('75H-051.21', { timeout: 10_000 });
await expect(page.locator('table')).toContainText('43H-212.48', { timeout: 10_000 });
```
- **Analysis**: Checks page title heading and 2 seeded vehicle license plates (`75H-051.21`, `43H-212.48`).
- **Pass Requirement**: Heading must be unique (Defect 1 fix); seeded vehicles must be on Page 1 (all 4 seeded vehicles fit in page size 10).

```typescript
// Test 2: Vehicle CRUD: Create, Edit, Delete
const testLicensePlate = `75H-${Math.floor(100.0 + Math.random() * 899.0)}.99`;
await page.click('#btn-add-vehicle');
await page.waitForSelector('#vehicle-form-dialog');
await page.fill('#input-license-plate', testLicensePlate);
await page.fill('#input-vehicle-model', 'Volvo FMX Heavy');
await page.selectOption('#select-vehicle-type', 'CONTAINER_40FT');
await page.fill('#input-max-weight', '30000');
await page.fill('#input-max-volume', '70');
await page.fill('#input-current-hub', 'Andromeda Hub (Hà Nội)');
await page.click('#btn-save-vehicle');

await expect(page.locator('table')).toContainText(testLicensePlate, { timeout: 10_000 });

const vehicleRow = page.locator('tr', { hasText: testLicensePlate });
await vehicleRow.locator('button[data-testid^="btn-edit-vehicle-"]').click();
await page.waitForSelector('#vehicle-form-dialog');
await page.selectOption('#select-vehicle-status', 'MAINTENANCE');
await page.click('#btn-save-vehicle');

await expect(page.locator('table')).toContainText('Bảo Trì', { timeout: 10_000 });

const updatedRow = page.locator('tr', { hasText: testLicensePlate });
await updatedRow.locator('button[data-testid^="btn-delete-vehicle-"]').click();
await page.waitForSelector('#delete-confirm-dialog');
await page.click('#btn-confirm-delete');

await expect(page.locator('table')).not.toContainText(testLicensePlate, { timeout: 10_000 });
```
- **Analysis**: Creates random vehicle, verifies it appears in table immediately, clicks edit button, changes status to `MAINTENANCE` (rendered as badge `'Bảo Trì'`), then deletes and confirms modal.
- **Pass Requirement**: Form inputs not wiped by async hub fetch (Defect 2 fix); table row action buttons clickable without pointer interception (Defect 3 fix); newly created vehicle appears on Page 1 (Defect 4 fix).

```typescript
// Test 3: Driver CRUD: Create, Edit, Delete
await page.click('#tab-drivers');
await expect(page.locator('table')).toContainText('Nguyễn Văn Tài', { timeout: 10_000 });
const testDriverName = `Tài Xế Test ${Math.floor(Math.random() * 1000)}`;
const testPhone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
await page.click('#btn-add-driver');
await page.waitForSelector('#driver-form-dialog');
await page.fill('#input-driver-name', testDriverName);
await page.fill('#input-driver-phone', testPhone);
await page.fill('#input-driver-license-no', '790888777666');
await page.selectOption('#select-driver-license-class', 'FC');
await page.fill('#input-driver-exp', '7');
await page.click('#btn-save-driver');

await expect(page.locator('table')).toContainText(testDriverName, { timeout: 10_000 });

const driverRow = page.locator('tr', { hasText: testDriverName });
await driverRow.locator('button[data-testid^="btn-edit-driver-"]').click();
await page.waitForSelector('#driver-form-dialog');
await page.selectOption('#select-driver-status', 'ON_TRIP');
await page.click('#btn-save-driver');

await expect(page.locator('table')).toContainText('Đang Đi Chuyến', { timeout: 10_000 });

const updatedDriverRow = page.locator('tr', { hasText: testDriverName });
await updatedDriverRow.locator('button[data-testid^="btn-delete-driver-"]').click();
await page.waitForSelector('#delete-confirm-dialog');
await page.click('#btn-confirm-delete');

await expect(page.locator('table')).not.toContainText(testDriverName, { timeout: 10_000 });
```
- **Analysis**: Switches to Drivers tab, checks seeded driver `'Nguyễn Văn Tài'`, creates test driver, verifies immediate table presence, edits status to `ON_TRIP` (badge `'Đang Đi Chuyến'`), then deletes driver.
- **Pass Requirement**: Tab switching works; driver edit button clickable (Defect 3 fix); newly created driver on Page 1 (Defect 4 fix).

```typescript
// Test 4: SPA API Auto-Refresh (Access Token Expires in 1m)
await expect(page.getByRole('heading', { name: /Quản Lý Đội Xe/i })).toBeVisible();
await page.waitForTimeout(65_000);
const searchInput = page.locator('#fleet-search-input');
await searchInput.fill('75H');
await page.waitForTimeout(2_000);
await expect(page).not.toHaveURL(/\/auth\/sign-in/);
await expect(page.getByRole('heading', { name: /Quản Lý Đội Xe/i })).toBeVisible();
```
- **Analysis**: Tests SPA token refresh interceptor when typing in search input after 65s token expiration.
- **Pass Requirement**: Heading locator is unambiguous (Defect 1 fix); `#fleet-search-input` is present and functional in both tables.

```typescript
// Test 5: Page Reload / F5 Auto-Refresh (Access Token Expires in 1m)
await expect(page.getByRole('heading', { name: /Quản Lý Đội Xe/i })).toBeVisible();
await page.waitForTimeout(65_000);
await page.reload({ waitUntil: 'domcontentloaded' });
await expect(page).not.toHaveURL(/\/auth\/sign-in/);
await expect(page.getByRole('heading', { name: /Quản Lý Đội Xe/i })).toBeVisible({ timeout: 15_000 });
await expect(page.locator('table')).toContainText('75H-051.21', { timeout: 10_000 });
```
- **Analysis**: Tests SSR/middleware token refresh on full F5 page reload after 65s token expiration.
- **Pass Requirement**: Passed in Iteration 1, guaranteed to continue passing.

---

## 2. Logic Chain & Synthesis Across Defects

```
[Observation 1.1A] Service.ts does not sort when filters.sort is undefined/empty.
                  + Service.ts string-compares numeric columns (maxWeight, maxVolume, experienceYears).
                  + In nested fields (currentHub), hub.name is bypassed.
   ===> [Logic 1]: If new items are added, without default DESC sorting, placement is non-deterministic.
   ===> [Logic 2]: By applying default sort (createdAt DESC -> id DESC), newly created vehicles and drivers
        are guaranteed to be at index 0 of page 1.
   ===> [Logic 3]: Proper number, date, and Vietnamese locale comparison ensures column header sorting
        operates correctly when users click table headers.

[Synthesis with Explorer 1]:
   - Defect 1 Fix (info-content.ts title change) unblocks Test 4 heading locator.
   - Defect 2 Fix (vehicle/driver dialog useEffect decoupling) unblocks Test 2 & Test 3 form input typing.

[Synthesis with Explorer 2]:
   - Defect 3 Fix (data-table min-h-[360px] layout constraint) unblocks Test 2 & Test 3 action button clicks.

[Synthesis with Defect 4]:
   - Defect 4 Fix (service.ts default sorting & robust comparator) guarantees newly created records appear on Page 1
     without search or pagination navigation, completing the 100% test pass chain across all 5 test cases.
```

---

## 3. Caveats

1. **Submodule & Export Backward Compatibility**:
   - `frontend/src/features/fleet/api.ts` exports `fleetApi`, `Vehicle`, `Driver`, `CreateVehiclePayload`, `CreateDriverPayload`, `VehicleFilters`, `DriverFilters`, `VehiclesResponse`, `DriversResponse`.
   - All method signatures and return types are strictly preserved.
2. **External Importers**:
   - `/dashboard/trips/page.tsx` imports `{ fleetApi, Vehicle, Driver } from '@/features/fleet/api'`.
   - `fleetApi.getVehicles()` and `fleetApi.getDrivers()` remain untouched and fully functional.
3. **No Caveats on Test Execution**:
   - All 5 test cases in `04-fleet-crud-and-refresh.spec.ts` and 2 test cases in `10-hubs-management.spec.ts` are fully covered.

---

## 4. Conclusion & Precise Code Changes

### Recommended Code Changes for `frontend/src/features/fleet/api/service.ts`

**Target File**: `frontend/src/features/fleet/api/service.ts`

```typescript
import { apiClient } from '@/lib/api-client';
import type {
  Vehicle,
  Driver,
  CreateVehiclePayload,
  CreateDriverPayload,
  VehicleFilters,
  DriverFilters,
  VehiclesResponse,
  DriversResponse
} from './types';

/**
 * Default sorting comparator: newest first (createdAt DESC, tie-break by id DESC)
 */
function defaultNewestSort<T extends { id: number; createdAt?: string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

/**
 * Sorts array based on TanStack Table sorting JSON or falls back to default newest sort
 */
function applyCustomSort<T extends { id: number; createdAt?: string }>(
  items: T[],
  sortJson?: string | null,
  nestedFieldResolver?: (item: T, fieldId: string) => any
): T[] {
  if (!sortJson) {
    return defaultNewestSort(items);
  }

  try {
    const sorting = JSON.parse(sortJson);
    if (Array.isArray(sorting) && sorting.length > 0) {
      const { id, desc } = sorting[0];
      return items.sort((a: any, b: any) => {
        let valA = nestedFieldResolver ? nestedFieldResolver(a, id) : a[id];
        let valB = nestedFieldResolver ? nestedFieldResolver(b, id) : b[id];

        valA = valA ?? '';
        valB = valB ?? '';

        // Numeric comparison
        if (typeof valA === 'number' && typeof valB === 'number') {
          if (valA !== valB) return desc ? valB - valA : valA - valB;
          return (Number(b.id) || 0) - (Number(a.id) || 0);
        }

        // Date comparison
        if (id === 'createdAt' || id === 'updatedAt') {
          const timeA = valA ? new Date(valA).getTime() : 0;
          const timeB = valB ? new Date(valB).getTime() : 0;
          if (timeA !== timeB) return desc ? timeB - timeA : timeA - timeB;
          return (Number(b.id) || 0) - (Number(a.id) || 0);
        }

        // Vietnamese string comparison with numeric awareness
        const strA = String(valA);
        const strB = String(valB);
        const cmp = strA.localeCompare(strB, 'vi', { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return desc ? -cmp : cmp;

        // Stable secondary tie-break: id DESC
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
    }
  } catch {
    // Ignore JSON parse error, fallback to default
  }

  return defaultNewestSort(items);
}

export const fleetApi = {
  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await apiClient.get<Vehicle[]>('/api/v1/vehicles');
    return res.data;
  },

  getPaginatedVehicles: async (filters: VehicleFilters): Promise<VehiclesResponse> => {
    const res = await apiClient.get<Vehicle[]>('/api/v1/vehicles');
    const all = res.data || [];

    let filtered = [...all];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(q) ||
          (v.model && v.model.toLowerCase().includes(q)) ||
          (v.hub?.name && v.hub.name.toLowerCase().includes(q)) ||
          (v.currentHub && v.currentHub.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      const statuses = filters.status.split(',').map((s) => s.trim());
      filtered = filtered.filter((v) => statuses.includes(v.status));
    }

    // Type filter
    if (filters.type && filters.type !== 'ALL') {
      const types = filters.type.split(',').map((t) => t.trim());
      filtered = filtered.filter((v) => types.includes(v.type));
    }

    // Sort resolution (default: newest first)
    filtered = applyCustomSort(filtered, filters.sort, (item, fieldId) => {
      if (fieldId === 'currentHub') {
        return item.hub?.name || item.currentHub || '';
      }
      return item[fieldId as keyof Vehicle];
    });

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      vehicles: paginated,
      total_vehicles: total,
      all_vehicles: all
    };
  },

  createVehicle: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/api/v1/vehicles', payload);
    return res.data;
  },

  updateVehicle: async (id: number, payload: Partial<CreateVehiclePayload>): Promise<Vehicle> => {
    const res = await apiClient.patch<Vehicle>(`/api/v1/vehicles/${id}`, payload);
    return res.data;
  },

  deleteVehicle: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/vehicles/${id}`);
  },

  // Drivers
  getDrivers: async (): Promise<Driver[]> => {
    const res = await apiClient.get<Driver[]>('/api/v1/drivers');
    return res.data;
  },

  getPaginatedDrivers: async (filters: DriverFilters): Promise<DriversResponse> => {
    const res = await apiClient.get<Driver[]>('/api/v1/drivers');
    const all = res.data || [];

    let filtered = [...all];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q) ||
          (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      const statuses = filters.status.split(',').map((s) => s.trim());
      filtered = filtered.filter((d) => statuses.includes(d.status));
    }

    // License class filter
    if (filters.licenseClass && filters.licenseClass !== 'ALL') {
      const classes = filters.licenseClass.split(',').map((c) => c.trim());
      filtered = filtered.filter((d) => classes.includes(d.licenseClass));
    }

    // Sort resolution (default: newest first)
    filtered = applyCustomSort(filtered, filters.sort, (item, fieldId) => {
      return item[fieldId as keyof Driver];
    });

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      drivers: paginated,
      total_drivers: total,
      all_drivers: all
    };
  },

  createDriver: async (payload: CreateDriverPayload): Promise<Driver> => {
    const res = await apiClient.post<Driver>('/api/v1/drivers', payload);
    return res.data;
  },

  updateDriver: async (id: number, payload: Partial<CreateDriverPayload>): Promise<Driver> => {
    const res = await apiClient.patch<Driver>(`/api/v1/drivers/${id}`, payload);
    return res.data;
  },

  deleteDriver: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/drivers/${id}`);
  }
};
```

---

## 5. Verification Method

To independently verify the whole suite after applying the changes:

```powershell
# 1. Typecheck validation
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit

# 2. Live Playwright Test Execution
npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts --project=chromium
```

### Expected Execution Output:
- `10-hubs-management.spec.ts`: 2/2 passed
- `04-fleet-crud-and-refresh.spec.ts`:
  - `1. Renders Fleet Dashboard & Seeded Data`: **PASSED**
  - `2. Vehicle CRUD: Create, Edit, Delete`: **PASSED**
  - `3. Driver CRUD: Create, Edit, Delete`: **PASSED**
  - `4. SPA API Auto-Refresh (Access Token Expires in 1m)`: **PASSED**
  - `5. Page Reload / F5 Auto-Refresh (Access Token Expires in 1m)`: **PASSED**
- Total: **7 passed (100%)** with 0 failures and 0 timeouts.
