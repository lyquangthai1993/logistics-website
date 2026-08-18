# Empirical Challenge & Verification Report: Milestone 4 (Trips & Vehicle Capacity Standardization)

**Agent**: Challenger 1 (`challenger_m4_trips_1`)  
**Target Milestone**: Milestone 4 — Trips & Vehicle Capacity Standardization Frontend & E2E  
**Final Verdict**: **APPROVE**

---

## 1. Observation

Direct empirical observations from code inspection, production build, and Playwright E2E executions:

### A. Critical DOM Selectors Verification (Verbatim in Source)
1. **Assign Order Button (`data-testid`)**:
   - Location: `frontend/src/features/trips/components/pending-orders-view.tsx:181`
   - Code: `data-testid={`btn-assign-order-${order.orderCode}`}` (matches `[data-testid^="btn-assign-order-"]`)
2. **Assign Vehicle Form Selectors**:
   - `#select-trip-vehicle`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:335`
   - `#select-trip-driver`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:369`
   - `#trip-pickup-date`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:403`
   - `#trip-pickup-time`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:419`
   - `#trip-eta-date`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:435`
   - `#trip-notes-input`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:453`
   - `button[type="submit"]:has-text("Xác nhận phân công")`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:704`
3. **Tab Switching Selectors**:
   - `button:has-text("Đơn Cần Phân Xe")`: `frontend/src/features/trips/components/trips-client-view.tsx:181`
   - `button:has-text("Danh Sách Chuyến Xe")`: `frontend/src/features/trips/components/trips-client-view.tsx:193`
4. **Trip Table Actions**:
   - `button:has-text("Xác nhận Trip")`: `frontend/src/features/trips/components/trips-tables/cell-action.tsx:107`
5. **Split Shipment Mode Selectors**:
   - `button:has-text("Chuyển sang Split")` / `button:has-text("Đang chia nhiều xe")`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:317`
   - `#split-vehicle-${idx}`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:513`
   - `#split-driver-${idx}`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:544`
   - `#split-weight-${idx}`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:574`
   - `#split-volume-${idx}`: `frontend/src/features/trips/components/assign-vehicle-dialog.tsx:598`
6. **No-Vehicle Declaration Modal**:
   - `input[name="noVehicleReason"]`: `frontend/src/features/trips/components/no-vehicle-dialog.tsx:176` (supports values `BUSY`, `MAINTENANCE`, `OVER_CAPACITY`, `HUB_UNAVAILABLE`, `CUSTOM`)
   - `#no-vehicle-custom-reason`: `frontend/src/features/trips/components/no-vehicle-dialog.tsx:197`
   - `button:has-text("Xác nhận báo hết xe")`: `frontend/src/features/trips/components/no-vehicle-dialog.tsx:237`

### B. Production Build Status
- `npm run build` in `frontend/`:
  - Compiler: Next.js 16 (Turbopack)
  - Result: **PASSED (exit code 0)**
  - TypeScript compilation: 0 errors (`Finished TypeScript in 17.3s`)
  - Route tree: 28 static & dynamic routes generated cleanly including `/dashboard/trips` (Server Component + Nuqs search params).

### C. Playwright E2E Verification Results
1. `npx playwright test e2e/06-order-dispatch-workflow.spec.ts`:
   - Full 3-role workflow (Dispatcher creates & submits -> Fleet Manager assigns trip & confirms -> Warehouse Manager checks Inbound board)
   - Result: **PASSED (43.7s)**
2. `npx playwright test e2e/challenger-m4-trips-selectors.spec.ts`:
   - Dedicated selector & dialog verification
   - Result: **PASSED (7.0s)**
3. `npx playwright test e2e/03-rbac-routing.spec.ts`:
   - All 4 roles route guard enforcement (Super Admin, Dispatcher, Fleet Manager, Warehouse Manager)
   - Result: **PASSED (19/19 route checks)**
   - Specifically: `ALLOW SUPER_ADMIN → /dashboard/trips`, `ALLOW FLEET_MANAGER → /dashboard/trips`, `BLOCK DISPATCHER → /dashboard/trips`, `BLOCK WAREHOUSE_MANAGER → /dashboard/trips`.
4. `npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts`:
   - Vehicles/Drivers CRUD and JWT Token Rotation (SPA & F5 reload)
   - Result: **PASSED (5/5 tests)**

---

## 2. Logic Chain

1. **Selector Parity**: Every selector mandated in `SCOPE.md` and `worker_m4_trips_1/handoff.md` was verified with line-numbered code references and executed successfully in live Playwright tests without DOM lookup failures.
2. **Build Integrity**: Next.js 16 Turbopack build succeeded with 0 errors, validating that all components, hooks (`useQueryState`, `useToast`), and type definitions adhere strictly to TypeScript strict mode.
3. **Capacity Gauge & Split Calculations**: 
   - Single assign mode computes capacity dynamically (`weightAllocated / maxWeight * 100`, `volumeAllocated / maxVolume * 100`) and displays green (<80%), yellow (80-100%), and red (>100%) badges.
   - Split mode enforces minimum boundary (2 vehicles, cannot delete below 2) and maximum boundary (5 vehicles, hides "Thêm xe" button at 5).
4. **Toast & Error Handling Standards**:
   - 100% Vietnamese user messaging across all modal confirmations, deletes, and status transitions.
   - API-first error message extraction implemented across all mutations (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || fallback)`).
5. **Backend Dependency Resolution**:
   - A runtime circular import between `OrderEntity` and `TripEntity` in TypeORM entity decorator evaluation was resolved by referencing string entity names (`@OneToMany('TripEntity', ...)` / `@ManyToOne('OrderEntity', ...)`), allowing the backend to start cleanly on port 3001 and support end-to-end integration testing.

---

## 3. Caveats

1. **Playwright Parallelism**: When running tests that mutate live database records with shared test user accounts (`FLEET_MANAGER`, `DISPATCHER`), running with `--workers=1` is required to avoid concurrent session cookie collisions.
2. **Base-UI Tabs vs Legacy Radix**: The frontend uses modern Base-UI Tabs which exposes `data-active=""` and `aria-selected="true"` rather than legacy `data-state="active"`. Tests targeting tab active state should use `data-active` or `aria-selected`.
3. **Clean URL nuqs Behavior**: When the active tab matches the default value (`tab=pending-orders`), `nuqs` automatically cleans the URL parameter (normal App Router behavior).

---

## 4. Conclusion

Milestone 4 (Trips & Vehicle Capacity Standardization) is **fully compliant**, robust, and meets all functional, UI/UX, and technical requirements outlined in `ORIGINAL_REQUEST.md` and `SCOPE.md`.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Verify Frontend Build**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
2. **Verify Milestone 4 DOM Selectors & E2E Dispatch Flow**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/06-order-dispatch-workflow.spec.ts e2e/challenger-m4-trips-selectors.spec.ts --workers=1
   ```
3. **Verify RBAC Route Protection**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/03-rbac-routing.spec.ts --workers=1
   ```
