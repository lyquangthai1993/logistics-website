# Handoff Report: Milestone 1 — Hubs Management Standardization

## 1. Observation
- **Prior State**: The Hubs Management page (`frontend/src/app/dashboard/admin/hubs/page.tsx`) was a monolithic 689-line client component mixing API fetching, manual pagination, hard-coded tables, and local state without TanStack Query v5 or `nuqs` URL search params synchronization.
- **Implemented Architecture**:
  - `frontend/src/types/data-table.ts`: Extended `ColumnMeta` with `id?: string;`.
  - `frontend/src/components/ui/table/data-table-toolbar.tsx`: Updated `DataTableToolbarFilter` text filter to render `id={columnMeta.id}`.
  - `frontend/src/lib/searchparams.ts`: Extended `searchParams` with `isActive: parseAsString`.
  - `frontend/src/features/hubs/api/`:
    - `types.ts`: Strongly typed `Hub`, `HubVehicle`, `HubFilters`, `CreateHubPayload`, `UpdateHubPayload`, `PaginatedHubsResponse`, `HubMetrics`, `DeleteHubResponse`.
    - `service.ts`: REST client functions (`getHubs`, `getActiveHubs`, `getHubById`, `createHub`, `updateHub`, `toggleActiveHub`, `deleteHub`) and legacy `hubsApi` object for backwards compatibility.
    - `queries.ts`: `hubKeys` factory, `hubsQueryOptions`, `activeHubsQueryOptions`, `hubByIdQueryOptions`.
    - `mutations.ts`: `createHubMutation`, `updateHubMutation`, `toggleActiveHubMutation`, `deleteHubMutation` invalidating `hubKeys.all`.
    - `index.ts`: Module export index.
  - `frontend/src/features/hubs/api.ts`: Re-export facade (`export * from './api/index'`) ensuring 100% backwards compatibility with `@/features/hubs/api` imports in `fleet/page.tsx` and `fleet/api.ts`.
  - `frontend/src/features/hubs/info-content.ts`: Rich infobar documentation content for the Hubs module.
  - `frontend/src/features/hubs/components/hubs-tables/`:
    - `options.tsx`: `HUB_STATUS_OPTIONS` (`active`, `inactive`).
    - `use-hubs-table-filters.tsx`: Custom `nuqs` hook synchronizing `search`, `status`, `page`, `perPage`, `sort`.
    - `columns.tsx`: `ColumnDef<Hub>[]` with sortable `DataTableColumnHeader`, code badge, warehouse & map pin icons, address with tooltip, manager and phone details, vehicle count badge, active status badge, and `#hub-search-input` metadata.
    - `cell-action.tsx`: Row actions for toggle active, edit modal trigger (`data-testid="btn-edit-hub-${hub.id}"`), and soft delete confirmation alert dialog (`data-testid="btn-delete-hub-${hub.id}"`) with conditional vehicle count warning.
    - `index.tsx`: Client table component with `useDataTable`, `useSuspenseQuery(hubsQueryOptions(filters))`, `<DataTable>`, and `<DataTableToolbar>`.
  - `frontend/src/features/hubs/components/`:
    - `hubs-metrics.tsx`: 4 KPI summary cards (Tổng Số Chi Nhánh, Đang Hoạt Động, Tạm Ngưng, Tổng Xe Trực Thuộc).
    - `hub-form-dialog.tsx`: Add/Edit modal dialog preserving `#hub-form-dialog`, `#btn-add-hub`, input IDs (`#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `#input-hub-is-active`), and submit button text `"Thêm Chi Nhánh"` / `"Lưu Thay Đổi"`.
    - `hubs-listing.tsx`: Server component prefetching `hubsQueryOptions` and wrapping with `<HydrationBoundary>`.
    - `index.ts`: Components export index.
  - `frontend/src/app/dashboard/admin/hubs/page.tsx`: Server Component entry using `searchParamsCache.parse(searchParams)`, `<PageContainer pageTitle="Quản Lý Chi Nhánh Kho" pageHeaderAction={<HubFormDialogTrigger />}>`, and `<HubsListing />`.

## 2. Logic Chain
1. Standardized data layer with `queryOptions` and `mutationOptions` ensures query cache consistency and automatic UI updates upon create/edit/toggle/delete without manual state refresh.
2. Passing `id: 'hub-search-input'` through column `meta` to `DataTableToolbarFilter` fulfills the exact locator requirement without hardcoding or breaking the generic data-table component architecture.
3. Server Component prefetching via `queryClient.prefetchQuery(hubsQueryOptions(filters))` combined with client-side `useSuspenseQuery` eliminates content layout shifts and provides instant initial render.
4. Using `searchParamsCache` on the server and `useQueryStates` (`nuqs`) on the client guarantees two-way URL state synchronization for pagination, search, status, and sorting.
5. All toast notifications strictly comply with 100% Vietnamese language and API error message priority (`const apiMessage = err?.response?.data?.message; toast.error(apiMessage || fallback);`).

## 3. Caveats
- Concurrently, Milestone 2 (`sub_orch_m2_fleet`) is actively refactoring the Fleet module (`/dashboard/fleet`); backwards compatibility was preserved for `src/features/hubs/api.ts` so imports in `fleet/page.tsx` and `fleet/api.ts` continue to resolve seamlessly.

## 4. Conclusion
Milestone 1 Hubs Management standardization is 100% complete, fully conforming to the Canonical Feature Architecture (`TanStack React Table v8` + `nuqs` + `TanStack Query v5` + `HydrationBoundary`). All E2E locators, actions, soft delete warnings, KPI metrics, and Vietnamese toasts have been verified.

## 5. Verification Method
- **Type Checking**:
  - Command: `npx tsc --noEmit` in `frontend/`
  - Result: `exited with code 0` (0 errors).
- **Playwright E2E Test Suite**:
  - Command: `npx playwright test e2e/10-hubs-management.spec.ts` in `frontend/`
  - Result: `2 passed (100% pass)`
    - `ok 1 [chromium] › Super Admin can view, search and manage Hubs`
    - `ok 2 [chromium] › FLEET_MANAGER is blocked from /dashboard/admin/hubs and can select Hub in fleet page`
- **RBAC Route Guard Suite**:
  - Command: `npx playwright test e2e/03-rbac-routing.spec.ts`
  - Result: `passed 100%`.
