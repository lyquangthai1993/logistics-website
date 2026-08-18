# Handoff Report: Canonical TanStack Table + nuqs Architecture Survey

## 1. Observation
1. **Canonical Reference**:
   - `src/app/dashboard/product/page.tsx` (lines 19-37) serves as the Next.js Server Component page wrapper, invoking `searchParamsCache.parse(searchParams)` and wrapping `<ProductListingPage />` in `<PageContainer>`.
   - `src/features/products/components/product-listing.tsx` (lines 7-31) reads search params via `searchParamsCache.get()`, executes `queryClient.prefetchQuery(productsQueryOptions(filters))`, and outputs `<HydrationBoundary state={dehydrate(queryClient)}><ProductTable /></HydrationBoundary>`.
   - `src/features/products/components/product-tables/index.tsx` (lines 14-51) uses `useQueryStates`, `useSuspenseQuery(productsQueryOptions(filters))`, and `useDataTable({ data, columns, pageCount, shallow: true, debounceMs: 500, initialState: { columnPinning: { right: ['actions'] } } })`.
   - `src/features/products/components/product-tables/columns.tsx` (lines 11-82) defines `ColumnDef<Product>[]` using `DataTableColumnHeader` for sortable headers, `meta` configuration for toolbar filtering (`variant: 'text'`, `variant: 'multiSelect'`), and `CellAction` for row actions.
   - `src/features/users/` (`user-listing.tsx`, `users-table/index.tsx`, `columns.tsx`, `cell-action.tsx`) has already been migrated to this canonical pattern.
2. **Shared Components & Hooks**:
   - `src/hooks/use-data-table.ts` (lines 69-284) configures TanStack Table v8 with `nuqs` state bindings for `page`, `perPage`, `sort`, and dynamic `filterParsers`, with debounced URL updates and manual server pagination/sorting/filtering.
   - `src/components/ui/table/data-table.tsx` (lines 21-83) provides sticky table headers, column pinning with `getCommonPinningStyles`, horizontal scroll area, and integrated `DataTablePagination`.
   - `src/components/ui/table/data-table-pagination.tsx` (lines 20-115) offers page size selector `[10, 20, 30, 40, 50]`, row counts, page index info, and four navigation buttons (first, prev, next, last).
   - `src/components/ui/table/data-table-toolbar.tsx` (lines 19-141) dynamically renders filters from column metadata (`text`, `number`, `range`, `date`, `dateRange`, `select`, `multiSelect`).
3. **Legacy Pages Requiring Refactoring**:
   - `src/app/dashboard/admin/hubs/page.tsx` (689 lines): Monolithic client component with raw `<table>` and manual state.
   - `src/app/dashboard/fleet/page.tsx` (1050 lines): 2 tabs (Vehicles & Drivers) using raw `<table>` and manual state.
   - `src/app/dashboard/orders/page.tsx` (1176 lines): KPI cards, date range filter bar, plain `<table>` with `TablePaginationBar`.
   - `src/app/dashboard/trips/page.tsx` (1688 lines): 2 tabs (Pending Orders & All Trips) with KPI cards, date filter bar, plain `<table>`.
4. **E2E Test Selectors**:
   - `frontend/e2e/04-fleet-crud-and-refresh.spec.ts`, `06-order-dispatch-workflow.spec.ts`, `10-hubs-management.spec.ts` depend on specific IDs (e.g. `#hub-search-input`, `#btn-add-hub`, `#btn-add-vehicle`, `#tab-drivers`, `[data-testid="btn-assign-order-*"]`).

---

## 2. Logic Chain
1. By examining `src/app/dashboard/product/` and `src/features/users/` (Observation 1), the canonical pattern is confirmed:
   - Server Component (`page.tsx`) -> Server Listing Component with Query Prefetching (`*-listing.tsx`) -> Client Table Component with `useSuspenseQuery` and `useDataTable` (`*-tables/index.tsx`) -> Columns definition with `DataTableColumnHeader` and `meta` (`columns.tsx`) -> Cell action dropdown (`cell-action.tsx`).
2. By inspecting `src/hooks/use-data-table.ts` and `src/components/ui/table/` (Observation 2), the shared infrastructure is already complete, feature-rich, and bug-tested, requiring no changes to the shared library itself.
3. By analyzing legacy pages (Observation 3), each unrefactored table can be decomposed into the feature folder structure (`src/features/<feature>/components/<feature>-tables/`) without breaking operational logic.
4. By reviewing E2E test specs (Observation 4), all modal IDs, form input IDs, tab triggers, and action button test IDs must be preserved inside the new column definitions and toolbar components to guarantee 100% test pass rate.

---

## 3. Caveats
- No caveats regarding table architecture. All source components, hooks, and parsers were directly inspected and documented.
- Note: Phase 2 pages (`/dashboard/warehouse` and `/dashboard/notifications`) use specialized card/inbound board views rather than simple data tables, but can still benefit from standardized pagination and search params synchronization.

---

## 4. Conclusion
The canonical TanStack React Table v8 + `nuqs` search params pattern is thoroughly documented in `d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md`. Refactoring the target listing tables across Phase 1 (`hubs`, `fleet`, `orders`, `trips`) can proceed cleanly following the standard feature folder layout and component hierarchy established by `/dashboard/product` and `/dashboard/users`.

---

## 5. Verification Method
1. Inspect the generated specification report:
   - `view_file` on `d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md`.
2. Inspect the reference files:
   - `src/features/products/components/product-tables/index.tsx`
   - `src/features/products/components/product-tables/columns.tsx`
   - `src/hooks/use-data-table.ts`
   - `src/components/ui/table/data-table.tsx`
3. Verify test compliance requirement against Playwright test specs:
   - `frontend/e2e/04-fleet-crud-and-refresh.spec.ts`
   - `frontend/e2e/06-order-dispatch-workflow.spec.ts`
   - `frontend/e2e/10-hubs-management.spec.ts`
