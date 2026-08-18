## 2026-08-18T08:22:41Z
You are Explorer 2 for Milestone 3: Orders Intake & Dispatch Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_2
Orchestrator Conversation ID: dee921f5-f455-4453-8088-15f8ad184b01

MANDATORY READING:
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- Milestone Scope: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\SCOPE.md
- Canonical Architecture Survey: d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md
- Standardized Hubs Feature: frontend/src/features/hubs/ (look at table, searchParams, listing, columns, cell-action, modals)
- Generic Table Components: frontend/src/components/ui/table/ (data-table.tsx, data-table-pagination.tsx, etc.)

MISSION:
1. Analyze the canonical `@tanstack/react-table` v8 + `nuqs` architecture established in `frontend/src/features/hubs/`.
2. Design the complete file structure and component architecture for `frontend/src/features/orders/`:
   - `params.ts`: `searchParamsCache` and `ordersSearchParams` (search, status, dateRange, page, perPage)
   - `api.ts`: API client functions with axios/ky/fetch wrapper
   - `queries.ts`: TanStack Query hooks (`useOrdersQuery`, `useOrdersStatsQuery`, `ordersQueryOptions`, `ordersStatsQueryOptions`)
   - `mutations.ts`: `useCreateOrderMutation`, `useSubmitOrderToFleetMutation`, `useDeleteOrderMutation`
   - `components/orders-listing.tsx`: Server component for prefetching / Suspense wrapper
   - `components/orders-tables/use-orders-table-filters.tsx`: nuqs filter hook
   - `components/orders-tables/columns.tsx`: Column definitions with badges, formatters, sorting, and cell action
   - `components/orders-tables/cell-action.tsx`: Action menu & inline buttons (Submit to Fleet, Edit, Delete)
   - `components/orders-tables/index.tsx`: Orders table container with KPI cards, Date Preset Filter Bar, DataTableToolbar, and DataTable
   - `components/order-create-dialog.tsx`: Create order dialog with auto code generation and active hubs selection
   - `components/order-delete-dialog.tsx`: Delete draft confirmation dialog
3. Detail the exact component props, state hooks, and wiring.
4. Output your detailed report to `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_2\report.md` and send_message back to the orchestrator when done.
