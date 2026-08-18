## 2026-08-18T09:13:49Z

You are Worker 1 for Milestone 4 (Trips & Vehicle Capacity Standardization).
Your working directory is: d:\Projects\logistics-website\.agents\worker_m4_trips_1
Your parent is the Milestone 4 Sub-Orchestrator.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP: Read the following specification & investigation files before writing code:
- ORIGINAL_REQUEST.md at d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- SCOPE.md at d:\Projects\logistics-website\.agents\sub_orch_m4_trips\SCOPE.md
- PROJECT.md at d:\Projects\logistics-website\.agents\PROJECT.md
- Explorer 1 Report at d:\Projects\logistics-website\.agents\explorer_m4_trips_1\report.md
- Explorer 2 Report at d:\Projects\logistics-website\.agents\explorer_m4_trips_2\report.md
- Explorer 3 Report at d:\Projects\logistics-website\.agents\explorer_m4_trips_3\report.md
- Reference canonical modules: `frontend/src/features/hubs/`, `frontend/src/features/fleet/`, `frontend/src/features/orders/`

WRITE OWNERSHIP:
You own exclusively:
- `frontend/src/app/dashboard/trips/page.tsx`
- `frontend/src/features/trips/**` (all files in this directory)

TASK SPECIFICATION:
Refactor and standardize `/dashboard/trips` from the legacy monolithic file into the modular `src/features/trips/` architecture:
1. `src/app/dashboard/trips/page.tsx`:
   - Next.js Server Component with `tripsSearchParamsCache.parse(searchParams)` from `nuqs/server`
   - PageContainer with Vietnamese title ("Phân Công Xe & Quản Lý Chuyến"), description, infoContent popover, and Header Action button ("Quản lý đội xe" -> `/dashboard/fleet`)
   - Suspense fallback wrapping `<TripsListing />`
2. `src/features/trips/params.ts`:
   - `nuqs` searchParams parser for `tab` (`pending-orders` | `all-trips`, default `pending-orders`), `search`, `status`, `page`, `perPage`, `preset`, `fromDate`, `toDate`, `sort`
3. `src/features/trips/info-content.ts`:
   - Comprehensive Vietnamese operational documentation for PageContainer info popover
4. `src/features/trips/date-range.ts`:
   - Date range presets (`today`, `7days`, `thisMonth`, `lastMonth`, `custom`) and helper functions
5. `src/features/trips/api/`:
   - `types.ts`: Trip, TripStatus, CreateTripPayload, CreateSplitTripsPayload, TripStats, etc.
   - `service.ts`: API methods for trips, stats, split, confirm, etc.
   - `queries.ts`: TanStack Query queryOptions (`tripsQueryOptions`, `tripStatsQueryOptions`, `pendingOrdersQueryOptions`, `rawVehiclesQueryOptions`, `rawDriversQueryOptions`) and custom hooks
   - `mutations.ts`: TanStack Query mutations (`useCreateTripMutation`, `useCreateSplitTripsMutation`, `useConfirmTripMutation`, `useNoVehicleMutation`) with proper `queryClient.invalidateQueries`
   - `index.ts`: Barrel export
6. `src/features/trips/api.ts`:
   - Re-export for backward compatibility
7. `src/features/trips/components/`:
   - `trips-listing.tsx`: Server Component prefetching queries with `HydrationBoundary`
   - `trips-client-view.tsx`: Client coordinator with Tabs, Date Preset Bar, KPI summary cards, Tab 1 ("Đơn Cần Phân Xe"), Tab 2 ("Danh Sách Chuyến Xe")
   - `trips-date-preset-bar.tsx`: Preset buttons + custom date inputs
   - `trips-kpi-cards.tsx`: 4 KPI summary cards (Đơn cần phân xe, Chuyến xe đã xác nhận, Xe thuê ngoài, Đơn báo không có xe)
   - `pending-orders-view.tsx`: Tab 1 dispatch queue with order cards, badges, external vehicle banners, `[data-testid^="btn-assign-order-"]`, and "Báo hết xe" triggers
   - `assign-vehicle-dialog.tsx`: Modal supporting Single assignment and Split Shipment mode (2-5 trips), vehicle select (`#select-trip-vehicle`), driver select (`#select-trip-driver`), pickup date (`#trip-pickup-date`), pickup time (`#trip-pickup-time`), ETA date (`#trip-eta-date`), notes (`#trip-notes-input`), submit button (`button[type="submit"]:has-text("Xác nhận phân công")`), split toggle (`button:has-text("Chuyển sang Split")` / `button:has-text("Đang chia nhiều xe")`), split vehicle selects (`#split-vehicle-${idx}`), split driver selects (`#split-driver-${idx}`), split weights (`#split-weight-${idx}`), split volumes (`#split-volume-${idx}`)
   - `no-vehicle-dialog.tsx`: Categorized reason radio buttons (`input[name="noVehicleReason"]`), custom textarea (`#no-vehicle-custom-reason`), and submit button (`button:has-text("Xác nhận báo hết xe")`)
   - `capacity-gauge.tsx`: Interactive real-time capacity gauge with weight and volume utilization calculations, emerald / rose visual progress bar, and overload alert banner
   - `trips-tables/`:
     - `index.tsx`: Client TanStack Table v8 component with `useDataTable`, `<DataTable>`, `<DataTableToolbar>`, `<DataTablePagination>`
     - `columns.tsx`: `ColumnDef<Trip>[]` with `DataTableColumnHeader`, trip code, vehicle/driver info, route, capacity fill bar, status badge, action column
     - `cell-action.tsx`: Confirm trip button (`button:has-text("Xác nhận Trip")`), dropdown menu with row actions
     - `options.tsx`: Faceted filter status options
     - `use-trips-table-filters.tsx`: nuqs hook for table search, status, and filters

STRICT INVARIANTS:
- Preserve all E2E testids and text selectors (see Explorer 1 and Explorer 3 reports)
- 100% Vietnamese Sonner toast notifications and API error extraction (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || '...')`)
- RBAC permissions: `SUPER_ADMIN`, `FLEET_MANAGER`
- Interactive buttons and links must specify `cursor-pointer`
- Must execute `npm run build` in `frontend/` and verify that there are 0 TypeScript/build errors.
