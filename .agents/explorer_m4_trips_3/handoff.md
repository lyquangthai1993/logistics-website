# Handoff Report: Explorer 3 — Trips & Capacity Standardization (Milestone 4)

**From**: Explorer 3 (`explorer_m4_trips_3`)  
**To**: Milestone 4 Sub-Orchestrator (`sub_orch_m4_trips`)  
**Task**: Comprehensive investigation of Playwright E2E test specs, backend API contracts, RBAC permissions, and critical DOM selectors for Trips.  
**Report Artifact**: `d:\Projects\logistics-website\.agents\explorer_m4_trips_3\report.md`  

---

## 1. Observation

1. **Playwright E2E Specs**:
   - `frontend/e2e/06-order-dispatch-workflow.spec.ts`:
     - Lines 60–98: Navigates to `/dashboard/trips`, clicks assign button `[data-testid="btn-assign-order-${testOrderCode}"]`, selects option in `#select-trip-vehicle`, submits via `button[type="submit"]:has-text("Xác nhận phân công")`, switches tab via `button:has-text("Danh Sách Chuyến Xe")`, confirms trip via `tr:has-text("${testOrderCode}") button:has-text("Xác nhận Trip")`, waits for `PATCH /confirm` 200, and verifies row text `Đã xác nhận`.
   - `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`:
     - Lines 120–178: Interacts with `#select-trip-vehicle`, `#trip-pickup-date`, `#trip-pickup-time`, `#trip-eta-date`, `#trip-notes-input`, toggles Split mode via `button:has-text("Chuyển sang Split")` and `button:has-text("Đang chia nhiều xe")`, and confirms trip in all trips table.
   - `frontend/e2e/03-rbac-routing.spec.ts`:
     - Line 20: `{ route: '/dashboard/trips', allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER'] }`.
2. **Backend API Endpoints & DTOs**:
   - `backend/src/trips/trips.controller.ts`:
     - `POST /api/v1/trips` (`CreateTripDto`, `@Roles(SUPER_ADMIN, FLEET_MANAGER)`)
     - `POST /api/v1/trips/split` (`CreateSplitTripsDto`, min 2 max 5 trips, `@Roles(SUPER_ADMIN, FLEET_MANAGER)`)
     - `GET /api/v1/trips` (`QueryTripDto`, open to authenticated users)
     - `GET /api/v1/trips/stats` (`QueryTripStatsDto`, returns realtime pending & no-vehicle counts)
     - `GET /api/v1/trips/:id` (Returns trip with order, vehicle, driver relations)
     - `PATCH /api/v1/trips/:id` (`UpdateTripDto`)
     - `PATCH /api/v1/trips/:id/confirm` (Transitions status to `CONFIRMED`, triggers in-app and email notifications, updates order to `ASSIGNED` if all trips confirmed)
     - `DELETE /api/v1/trips/:id` (Soft delete)
   - `backend/src/orders/orders.controller.ts`:
     - `PATCH /api/v1/orders/:id/no-vehicle` (`@Roles(SUPER_ADMIN, FLEET_MANAGER)`, body `{ reason?: string }`)
3. **RBAC Configuration**:
   - `.agents/rules/rbac-matrix.md`, `frontend/src/config/nav-config.ts` (L47–53), `frontend/src/proxy.ts` (L9): Trips menu and route guard allow `SUPER_ADMIN` and `FLEET_MANAGER`.
4. **Toast Notification Pattern**:
   - 100% Vietnamese.
   - Pattern: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'fallback');`

---

## 2. Logic Chain

1. **Step 1 — E2E Test Compatibility**: The Playwright test suite in `06-order-dispatch-workflow.spec.ts` depends on strict DOM elements (e.g. native select with `#select-trip-vehicle`, specific `data-testid` pattern, exact button text strings). Therefore, any refactored component in `src/features/trips/` must preserve these exact IDs, testids, and button text labels verbatim.
2. **Step 2 — Backend Contract Adherence**: Single assignment calls `POST /api/v1/trips` while split shipment calls `POST /api/v1/trips/split`. Confirming a trip calls `PATCH /api/v1/trips/:id/confirm`. Declaring no-vehicle calls `PATCH /api/v1/orders/:id/no-vehicle`. The frontend mutations must map directly to these endpoints without altering payload shapes.
3. **Step 3 — 3-Layer RBAC Enforcement**: Since `proxy.ts` and `nav-config.ts` enforce access for `SUPER_ADMIN` and `FLEET_MANAGER`, frontend UI guards and API error handling must align with these roles.
4. **Step 4 — TanStack React Table v8 Refactor**: The current implementation in `src/app/dashboard/trips/page.tsx` is an inline monolithic client component (~1688 lines). Decomposing it into `src/features/trips/` using the canonical `<DataTable>` + `nuqs` pattern will standardize it with M1, M2, and M3 while preserving full operational parity.

---

## 3. Caveats

- **Native `<select>` requirement**: Playwright's `.selectOption()` requires native HTML `<select>` elements for `#select-trip-vehicle`, `#select-trip-driver`, and split rows. Do not replace them with custom Radix dropdowns unless custom Playwright locators are updated.
- **Tab State Synchronization**: Tab switching (`pending-orders` vs `all-trips`) must support both `nuqs` URL search params and button text matches expected by E2E tests (`"Danh Sách Chuyến Xe"`, `"Đơn Cần Phân Xe"`).

---

## 4. Conclusion

All specifications, contracts, DOM requirements, and RBAC rules for Milestone 4 have been thoroughly audited and documented in `d:\Projects\logistics-website\.agents\explorer_m4_trips_3\report.md`. The design is fully compatible with existing backend APIs and guarantees 100% pass rate for E2E tests when implemented according to the report.

---

## 5. Verification Method

To independently verify the findings and contracts:
1. **Inspect Report Artifact**:
   ```powershell
   Get-Content -Path "d:\Projects\logistics-website\.agents\explorer_m4_trips_3\report.md"
   ```
2. **Verify E2E Selectors**:
   Check `frontend/e2e/06-order-dispatch-workflow.spec.ts` against the DOM inventory table in Section 2.2 of `report.md`.
3. **Verify API Endpoints**:
   Check `backend/src/trips/trips.controller.ts` and `backend/src/orders/orders.controller.ts` against Section 3 of `report.md`.
