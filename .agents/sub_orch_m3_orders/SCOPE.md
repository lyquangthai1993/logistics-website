# Scope: Milestone 3 — Orders Intake & Dispatch Standardization

## Architecture
- Target Page: `frontend/src/app/dashboard/orders/page.tsx`
- Feature Folder: `frontend/src/features/orders/`
- Pattern:
  - `src/app/dashboard/orders/page.tsx`: Server Component wrapper with `searchParamsCache.parse(searchParams)`
  - `src/features/orders/components/orders-listing.tsx`: Server listing prefetching `ordersQueryOptions` + KPI statistics
  - `src/features/orders/components/orders-tables/`:
    - `index.tsx`: Client Table Component with `useDataTable`, `<DataTable>`, `<DataTableToolbar>`, Date Preset Filter Bar, KPI Summary Cards
    - `columns.tsx`: `ColumnDef<Order>[]` with `DataTableColumnHeader`, sortable headers, order code, status badge, hub route badge, weights/volumes, row submit action
    - `cell-action.tsx`: Action dropdown / buttons for Submit to Fleet, View Details, Edit Draft, Delete Draft
    - `use-orders-table-filters.tsx`: `nuqs` search params parser (`search`, `status`, `dateRange`, `page`, `perPage`)
  - Modals / Dialogs:
    - `src/features/orders/components/order-create-dialog.tsx`: Create order modal with auto code generation and dynamic active hubs dropdown
    - Delete Draft confirmation dialog
  - API & Queries: `src/features/orders/api.ts`, `queries.ts`, `mutations.ts`

## Critical E2E Selectors & Requirements (MUST PRESERVE)
- Create Order button: `button:has-text("Tạo lệnh điều vận mới")`
- Submit to Fleet action: `button:has-text("Gửi Fleet")`
- Standard table markup: `table` and `tr` rendered by `DataTable`
- Date preset filters: `today`, `7days`, `thisMonth`, `lastMonth`
- 100% Vietnamese toasts and API-message-first error extraction
- RBAC permissions: `SUPER_ADMIN`, `DISPATCHER`

## Acceptance Criteria
- [ ] Converted to canonical `@tanstack/react-table` v8 + `nuqs` search params architecture
- [ ] Uses `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`
- [ ] Preserves all KPI cards, date filters, create order modal, and row submit actions
- [ ] `npm run build` succeeds with 0 TypeScript/compile errors in `frontend/`
- [ ] Playwright E2E spec `06-order-dispatch-workflow.spec.ts` passes
