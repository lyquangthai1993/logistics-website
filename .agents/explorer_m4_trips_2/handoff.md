# Milestone 4: Trips & Vehicle Capacity Standardization — Handoff Report

**Agent**: Explorer 2 (Frontend Architecture & Code Investigator)  
**Recipient**: Milestone 4 Sub-Orchestrator  
**Working Directory**: `d:\Projects\logistics-website\.agents\explorer_m4_trips_2`  
**Date**: 2026-08-18  

---

## 1. Observation

1. **Legacy Trips Implementation**:
   - File: `frontend/src/app/dashboard/trips/page.tsx` (1,688 lines).
   - Architecture: Client component with `'use client'`, 16 `useState` hooks, raw HTML `<table>`, local `TablePaginationBar`, monolithic in-page modal dialogs (lines 976–1684), imperative `useEffect` API calls.
   - External dependencies: `tripsApi` from `@/features/trips/api`, `ordersApi` from `@/features/orders/api`, `fleetApi` from `@/features/fleet/api`.

2. **Completed Reference Modules & Canonical Patterns**:
   - `frontend/src/app/dashboard/orders/page.tsx` (lines 1–43) & `frontend/src/features/orders/`:
     - Server Component `OrdersPage` parses `searchParams` with `ordersSearchParamsCache.parse(searchParams)`.
     - `orders-listing.tsx` pre-fetches `ordersQueryOptions` and `ordersStatsQueryOptions`, dehydrates to `<HydrationBoundary>`.
     - `OrdersTable` uses `useDataTable` with `columns`, `pageCount`, and `<DataTableToolbar>`.
     - Nuqs hook `useOrdersTableFilters` manages URL state for `page`, `perPage`, `search`, `status`, `preset`, `fromDate`, `toDate`, `sort`.
   - `frontend/src/app/dashboard/fleet/page.tsx` & `frontend/src/features/fleet/`:
     - Dual-tab structure (`vehicles` vs `drivers`) synced to URL search param `tab` via `useQueryState('tab', parseAsString.withDefault('vehicles'))`.
     - `rawVehiclesQueryOptions()` and `rawDriversQueryOptions()` exported from `@/features/fleet/api/queries`.
   - `frontend/src/components/ui/table/`:
     - `data-table.tsx`: `<DataTable>` with column pinning, scroll area, and pagination.
     - `data-table-toolbar.tsx`: Dynamic search input and faceted filters driven by `column.columnDef.meta`.
     - `data-table-pagination.tsx`: Rows per page `[10, 20, 30, 40, 50]` and total record indicator.
     - `data-table-column-header.tsx`: Sortable column headers.

3. **Backend Trips & Orders API Endpoints**:
   - `backend/src/trips/trips.controller.ts`:
     - `POST /api/v1/trips` (Create trip)
     - `POST /api/v1/trips/split` (Create split trips)
     - `GET /api/v1/trips` (Paginated list with `search`, `status`, `fromDate`, `toDate`, `page`, `limit`)
     - `GET /api/v1/trips/stats` (Trip KPI stats with `fromDate`, `toDate`)
     - `PATCH /api/v1/trips/:id/confirm` (Confirm trip)
     - `DELETE /api/v1/trips/:id` (Delete trip)
   - `backend/src/orders/orders.service.ts` (lines 101–103):
     - `status === 'PENDING_ASSIGNMENT'` queries `order.status IN ('PENDING_FLEET', 'NO_VEHICLE')` to return all dispatch queue candidates.
     - `PATCH /api/v1/orders/:id/no-vehicle` records no-vehicle declaration with reason string.

4. **Playwright E2E Test Contract (`frontend/e2e/06-order-dispatch-workflow.spec.ts`)**:
   - Assign button selector: `[data-testid="btn-assign-order-${testOrderCode}"]` (line 64).
   - Vehicle dropdown selector: `#select-trip-vehicle` (line 69).
   - Form submit button: `button[type="submit"]:has-text("Xác nhận phân công")` (line 74).
   - Tab switch button: `button:has-text("Danh Sách Chuyến Xe")` (line 80).
   - Confirm trip button: `tr:has-text("${testOrderCode}") button:has-text("Xác nhận Trip")` (line 85).
   - Confirmed row status assertion: `tr:has-text("${testOrderCode}"):has-text("Đã xác nhận")` (line 97).

---

## 2. Logic Chain

1. **Step 1 (Architectural Alignment)**: The existing 1,688-line `app/dashboard/trips/page.tsx` violates the modular App Router architecture adopted in Milestones 1–3 (`hubs/`, `fleet/`, `orders/`). Converting `page.tsx` to a thin Server Component with `tripsSearchParamsCache.parse(searchParams)` and prefetching queries into `<HydrationBoundary>` provides immediate SEO, performance, and caching benefits.
2. **Step 2 (Feature Directory Decomposition)**: Decomposing `trips` into `src/features/trips/` with dedicated layers (`api/`, `components/`, `trips-tables/`) decouples data fetching, business workflows, and presentation.
3. **Step 3 (Dual-Tab State Coordination)**: Using `nuqs` parameter `tab=pending|all` ensures tab switching preserves URL bookmarking, browser back/forward navigation, and seamless E2E interaction.
4. **Step 4 (Workflow Preservation)**: Splitting the giant modal logic into modular `<AssignVehicleDialog />`, `<NoVehicleDialog />`, and `<CapacityGauge />` components preserves all rich interactions (live capacity utilization, overload alerts, 2–5 split shipment rows, categorized no-vehicle reasons) while ensuring code maintainability and testability.
5. **Step 5 (E2E & Governance Parity)**: Retaining all verbatim element IDs (`#select-trip-vehicle`, `[data-testid^="btn-assign-order-"]`, `button:has-text("Xác nhận Trip")`) and enforcing 100% Vietnamese API-first toasts satisfies all safety and testing constraints.

---

## 3. Caveats

1. **Backend Trips Table Query**: The backend `GET /api/v1/trips` supports `search`, `status`, `fromDate`, `toDate`, `page`, `limit`. Sorting parameters are handled via client/server pagination integration.
2. **Orders Alias**: The backend accepts `status: 'PENDING_ASSIGNMENT'` to fetch both `PENDING_FLEET` and `NO_VEHICLE` orders. The frontend pending queue should continue querying `status: 'PENDING_ASSIGNMENT'` so orders flagged as `NO_VEHICLE` can still be assigned if external vehicles become available.
3. **Scope Boundary**: As Explorer 2, no code files in `frontend/src/` were modified; only exploration, verification, and architecture design were performed.

---

## 4. Conclusion

The architectural design for `src/features/trips/` is complete, validated against reference modules (`orders/`, `fleet/`, `hubs/`), and fully documented in `d:\Projects\logistics-website\.agents\explorer_m4_trips_2\report.md`. 

The target layout consists of:
- Entry point: `src/app/dashboard/trips/page.tsx` (Server Component).
- Feature root: `src/features/trips/params.ts`, `info-content.ts`, `date-range.ts`, `api.ts`.
- API layer: `src/features/trips/api/` (`types.ts`, `service.ts`, `queries.ts`, `mutations.ts`, `index.ts`).
- Presentation layer: `src/features/trips/components/` (`trips-listing.tsx`, `trips-client-view.tsx`, `trips-date-preset-bar.tsx`, `trips-kpi-cards.tsx`, `pending-orders-view.tsx`, `assign-vehicle-dialog.tsx`, `no-vehicle-dialog.tsx`, `capacity-gauge.tsx`).
- Table layer: `src/features/trips/components/trips-tables/` (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `options.tsx`, `use-trips-table-filters.tsx`).

The implementer can proceed with direct implementation following the detailed blueprints in `report.md`.

---

## 5. Verification Method

1. **Document Inspection**:
   - Review architectural specifications in `d:\Projects\logistics-website\.agents\explorer_m4_trips_2\report.md`.
2. **Post-Implementation Compilation**:
   - Run `npm run build` in `frontend/` to ensure zero TypeScript errors.
3. **Post-Implementation E2E Test**:
   - Run `npx playwright test e2e/06-order-dispatch-workflow.spec.ts` in `frontend/` to confirm 100% test pass rate across the full Dispatcher -> Fleet Manager -> Warehouse Manager operational workflow.
