# Scope: Milestone 4 — Trips & Vehicle Capacity Standardization

## Architecture
- Target Page: `frontend/src/app/dashboard/trips/page.tsx`
- Feature Folder: `frontend/src/features/trips/`
- Pattern:
  - `src/app/dashboard/trips/page.tsx`: Next.js Server Component with `searchParamsCache.parse(searchParams)` and tab persistence (`tab=pending-orders|all-trips`)
  - `src/features/trips/components/trips-listing.tsx`: Server Component prefetching `tripsQueryOptions`, `tripStatsQueryOptions`, `pendingOrdersQueryOptions`, `rawVehiclesQueryOptions`, `rawDriversQueryOptions`
  - `src/features/trips/components/trips-tables/`:
    - `index.tsx`: Client Table Component for "All Trips" tab using `useDataTable`, `<DataTable>`, `<DataTableToolbar>`, `<DataTablePagination>`
    - `columns.tsx`: `ColumnDef<Trip>[]` with `DataTableColumnHeader`, trip code, vehicle info, driver info, route, capacity fill bar, status badge, action buttons
    - `cell-action.tsx`: Action dropdown / Confirm Trip button (`button:has-text("Xác nhận Trip")`), Complete Trip, Cancel Trip
    - `use-trips-table-filters.tsx`: `nuqs` search params parser (`tab`, `search`, `status`, `page`, `perPage`, `preset`, `fromDate`, `toDate`, `sort`)
  - `src/features/trips/components/pending-orders-view.tsx`:
    - Tab 1: Dispatch queue with Assign Vehicle button (`[data-testid^="btn-assign-order-"]`)
    - Assign Vehicle Dialog with live interactive Vehicle Capacity Gauge & overload alert (weight & volume %)
    - Split Shipment mode (split order across 2-5 trips)
    - No-Vehicle Declaration Dialog with categorized reasons (`BUSY`, `MAINTENANCE`, `OVER_CAPACITY`, `HUB_UNAVAILABLE`, `CUSTOM`)
  - Feature API & Queries: `src/features/trips/api.ts`, `api/service.ts`, `api/queries.ts`, `api/mutations.ts`

## Critical E2E Selectors & Requirements (MUST PRESERVE)
- Assign Order button: `[data-testid^="btn-assign-order-"]`
- Confirm Trip action: `button:has-text("Xác nhận Trip")`
- Vehicle select & capacity gauge live rendering
- 100% Vietnamese toasts and API-first error message extraction
- RBAC permissions: `SUPER_ADMIN`, `FLEET_MANAGER`

## Acceptance Criteria
- [x] All Trips table refactored to canonical `@tanstack/react-table` v8 + `nuqs`
- [x] Preserves all rich dispatch workflows (Capacity Gauge, Split Shipment, No-Vehicle Modal, Confirm Trip)
- [x] `npm run build` in `frontend/` succeeds with 0 TypeScript/compile errors
- [x] Playwright E2E spec `06-order-dispatch-workflow.spec.ts` passes 100%
