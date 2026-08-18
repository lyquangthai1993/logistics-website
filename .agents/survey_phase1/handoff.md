# Handoff Report: Core Phase 1 Data Listing Tables Survey

**Agent**: explorer (Phase 1 Codebase Explorer)  
**Date**: 2026-08-18  
**Report Type**: Hard Handoff (Task Complete)  
**Full Survey Reference**: `d:\Projects\logistics-website\.agents\survey_phase1\survey_phase1.md`  

---

## 1. Observation

### 1.1 Page Locations & Implementations
1. **Hubs Management (`/dashboard/admin/hubs`)**:
   - File: `frontend/src/app/dashboard/admin/hubs/page.tsx` (689 lines).
   - Feature folder: `frontend/src/features/hubs/api.ts` (83 lines).
   - Table rendering: Raw HTML `<table>` (`<table className='w-full text-sm text-left'>`, line 318).
   - State management: Local `useState` for hubs, loading, pagination (page, limit, total, totalPages), filters, metrics, and modals (lines 35-70).
   - API: `hubsApi.getHubs()`, `hubsApi.toggleActive()`, `hubsApi.deleteHub()` in `loadData()` (lines 72-106).
   - RBAC: Route protected in `proxy.ts` (line 6: `'/dashboard/admin': ['SUPER_ADMIN']`).

2. **Fleet Management (`/dashboard/fleet`)**:
   - File: `frontend/src/app/dashboard/fleet/page.tsx` (1,050 lines).
   - Feature folder: `frontend/src/features/fleet/api.ts` (92 lines).
   - Table rendering: Raw HTML `<table>` under `<TabsContent value='vehicles'>` (line 466) and `<TabsContent value='drivers'>` (line 577).
   - State management: Local `useState` + `useMemo` client-side filtering (`filteredVehicles`, line 94; `filteredDrivers`, line 108).
   - Pagination: ❌ No pagination controls (loads full arrays from `/api/v1/vehicles` and `/api/v1/drivers`).
   - Modals: Vehicle Modal (lines 666-877), Driver Modal (lines 880-1015), Delete Modal (lines 1018-1046).
   - RBAC: Route protected in `proxy.ts` (line 9: `'/dashboard/fleet': ['SUPER_ADMIN', 'FLEET_MANAGER']`).

3. **Orders Intake & Dispatch (`/dashboard/orders`)**:
   - Files: `frontend/src/app/dashboard/orders/page.tsx` (1,176 lines) and `[id]/page.tsx` (871 lines).
   - Feature folder: `frontend/src/features/orders/api.ts` (129 lines).
   - Table rendering: Raw HTML `<table>` (line 680) with custom pagination bar `<TablePaginationBar>` (lines 893-900).
   - State management: Local `useState` + debounced search (`useRef`, line 177) + Date presets (`today`, `7days`, `thisMonth`, `lastMonth`, `custom`, line 154) + Server stats (`getOrderStats`, line 86).
   - Modals & Actions: Create Order modal with auto code generation (`generateOrderCode`, line 443), Submit to Fleet per-row loading tracking (`submittingOrderIds`, line 186), Delete draft order.
   - RBAC: Route protected in `proxy.ts` (line 7: `'/dashboard/orders': ['SUPER_ADMIN', 'DISPATCHER']`).

4. **Trips & Vehicle Capacity (`/dashboard/trips`)**:
   - File: `frontend/src/app/dashboard/trips/page.tsx` (1,688 lines).
   - Feature folder: `frontend/src/features/trips/api.ts` (144 lines).
   - Table rendering: Multi-tab layout (Tab 1: Responsive card list for pending orders, line 714; Tab 2: Raw HTML `<table>` for all trips, line 830) with `<TablePaginationBar>`.
   - State management: Local `useState` + dual pagination + date presets + stats calculation (`getTripStats`, line 107).
   - Modals & Actions: Assign Vehicle dialog with live Capacity Gauge (lines 1174-1212), Split Shipment toggle mode (lines 1073-1092), No-Vehicle declaration modal with categorized reasons (lines 352-388), Confirm trip action (line 458).
   - RBAC: Route protected in `proxy.ts` (line 8: `'/dashboard/trips': ['SUPER_ADMIN', 'FLEET_MANAGER']`).

5. **User Management (`/dashboard/users`)**:
   - File: `frontend/src/app/dashboard/users/page.tsx` (31 lines, Server Component).
   - Feature folder: `frontend/src/features/users/` (16 files across `api/`, `components/`, `schemas/`).
   - Table rendering: `@tanstack/react-table` v8 via `<DataTable>` and `<DataTableToolbar>` (lines 47-49 in `users-table/index.tsx`).
   - State management: `nuqs` URL search params (`useQueryStates`, line 15 in `users-table/index.tsx`) + TanStack Query v5 (`useSuspenseQuery`, line 31; server `prefetchQuery` in `user-listing.tsx`, line 24).
   - Modals & Actions: `<UserFormSheet>` (Sheet form with `@tanstack/react-form` + Zod), `<CellAction>` dropdown menu, `<AlertModal>`.
   - Discrepancy: `features/users/api/service.ts` imports and returns `fakeUsers` from `@/constants/mock-api-users` (line 30), not live NestJS backend.

---

## 2. Logic Chain

1. **Table Primitives Inconsistency**:
   - `users` is built on `@tanstack/react-table` with `useDataTable`, `<DataTable>`, and `<DataTableToolbar>`, whereas `hubs`, `fleet`, `orders`, and `trips` use raw `<table>` elements wrapped in `<Card>`.
   - Consequently, features like column pinning, dynamic column hiding, and standard faceted multi-select filters exist only on `users` and `product`.

2. **State & URL Synchronization Divide**:
   - `users` persists filtering, search, pagination, and sorting directly into browser URL search params via `nuqs` and parses them on the server (`searchParamsCache.parse(searchParams)`).
   - `hubs`, `fleet`, `orders`, and `trips` maintain all filter/page state strictly in local component `useState`. Reloading or sharing URLs loses all filter state.

3. **Data Caching & Invalidation Divide**:
   - `users` uses TanStack Query v5 keys (`userKeys.all`, `usersQueryOptions`), enabling instantaneous optimistic updates and automatic cache invalidation on create/update/delete mutations.
   - `hubs`, `fleet`, `orders`, and `trips` perform manual fetch lifecycles with imperative `loadData()` / `refreshAll()` invocations.

4. **Business Logic Maturity**:
   - While `hubs`, `fleet`, `orders`, and `trips` lack modern table abstraction, their business workflow implementations (capacity gauge calculations, split shipment payloads, external provider notes, dispatch status transitions, and date range metric cards) are robust and directly match the logistics domain specifications in `rbac-matrix.md` and `tms-domain-lead`.

---

## 3. Caveats

1. **Backend Integration for Users**: The backend NestJS already has a complete `/api/v1/users` controller (`backend/src/users/users.controller.ts`), but the frontend `src/features/users/api/service.ts` is still plugged into the starter template's mock `fakeUsers`.
2. **Hardcoded Hubs List in Orders**: `src/app/dashboard/orders/page.tsx` hardcodes an array of 5 hub names instead of pulling dynamically from `hubsApi.getActiveHubs()`.
3. **Fleet Pagination**: `/api/v1/vehicles` and `/api/v1/drivers` endpoints currently return flat arrays. When migrating to `<DataTable>`, server-side pagination may need corresponding backend query support or client-side pagination adapter.

---

## 4. Conclusion

The Phase 1 survey is complete. The frontend has a clear architectural reference pattern established in `src/features/users` and `src/features/products` (TanStack Table v8 + TanStack Query v5 + `nuqs` + `@tanstack/react-form` + Zod).
To elevate the Core Phase 1 data listing tables to enterprise standards, the recommended execution steps are:
1. Connect `features/users` to the live NestJS `/api/v1/users` endpoint and update user role options to TMS roles.
2. Refactor `hubs`, `fleet`, `orders`, and `trips` from single-file raw `<table>` implementations into modular feature folders (`columns.tsx`, `queries.ts`, `mutations.ts`, `<DataTable>`, `nuqs` state) while preserving all rich logistics domain workflows.

---

## 5. Verification Method

To independently verify these findings:
1. **Inspect Survey Report**:
   ```bash
   view_file AbsolutePath="d:\Projects\logistics-website\.agents\survey_phase1\survey_phase1.md"
   ```
2. **Inspect the 5 Phase 1 Pages**:
   - Hubs: `d:\Projects\logistics-website\frontend\src\app\dashboard\admin\hubs\page.tsx`
   - Fleet: `d:\Projects\logistics-website\frontend\src\app\dashboard\fleet\page.tsx`
   - Orders: `d:\Projects\logistics-website\frontend\src\app\dashboard\orders\page.tsx`
   - Trips: `d:\Projects\logistics-website\frontend\src\app\dashboard\trips\page.tsx`
   - Users: `d:\Projects\logistics-website\frontend\src\app\dashboard\users\page.tsx` & `src\features\users\`
3. **Check Frontend Typecheck & Build**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   bun run typecheck
   ```
