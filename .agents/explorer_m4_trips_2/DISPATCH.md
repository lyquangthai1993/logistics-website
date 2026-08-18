## 2026-08-18T09:10:34Z
You are Explorer 2 for Milestone 4 (Trips & Vehicle Capacity Standardization).
Your working directory is: d:\Projects\logistics-website\.agents\explorer_m4_trips_2
Your parent is the Milestone 4 Sub-Orchestrator.

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md, SCOPE.md at d:\Projects\logistics-website\.agents\sub_orch_m4_trips\SCOPE.md, and PROJECT.md at d:\Projects\logistics-website\.agents\PROJECT.md.

TASK:
Investigate the canonical architecture and reference modules to design the standard `src/features/trips/` modular structure:
1. Examine the canonical patterns in:
   - `frontend/src/components/ui/table/` (`data-table.tsx`, `data-table-pagination.tsx`, `data-table-toolbar.tsx`, `data-table-column-header.tsx`, etc.)
   - `frontend/src/hooks/use-data-table.ts`
   - Completed modules: `frontend/src/features/hubs/`, `frontend/src/features/fleet/`, `frontend/src/features/orders/`
   - Server Component prefetch patterns (`page.tsx`, `<feature>-listing.tsx`, `searchParamsCache`, `useQueryStates`, `prefetchQuery`, `HydrationBoundary`)
2. Define the exact target file architecture for `src/features/trips/`:
   - `src/app/dashboard/trips/page.tsx` (Server Component with `searchParamsCache.parse(searchParams)`)
   - `src/features/trips/components/trips-listing.tsx` (Server Component prefetching queries)
   - `src/features/trips/components/trips-tables/`:
     - `index.tsx` (Client DataTable for "All Trips" tab)
     - `columns.tsx` (`ColumnDef<Trip>[]` with sortable headers, trip code, vehicle/driver info, route, capacity bar, status badge, actions)
     - `cell-action.tsx` (Confirm Trip, Complete Trip, Cancel Trip, dropdown actions)
     - `use-trips-table-filters.tsx` (`nuqs` state parser for `tab`, `search`, `status`, `page`, `perPage`, `dateRange`)
   - `src/features/trips/components/pending-orders-view.tsx` (Dispatch queue with Assign Vehicle dialog, interactive Capacity Gauge, Split Shipment mode, No-Vehicle declaration modal)
   - `src/features/trips/api.ts`, `queries.ts`, `mutations.ts`
3. Detail how the tab switching between "Đơn chờ gán xe" (Pending Orders) and "Tất cả chuyến xe" (All Trips) should be coordinated via `nuqs` search params (`tab=pending|all`).
4. Output a comprehensive report to `d:\Projects\logistics-website\.agents\explorer_m4_trips_2\report.md` and write a standard `handoff.md`.
5. Send a message back to parent with summary and artifact path.
