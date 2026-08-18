# Scope: Milestone 1 — Hubs Management Standardization

## Architecture
- Target Page: `frontend/src/app/dashboard/admin/hubs/page.tsx`
- Feature Folder: `frontend/src/features/hubs/`
- Pattern:
  - `src/app/dashboard/admin/hubs/page.tsx`: Server Component wrapper with `searchParamsCache.parse(searchParams)`
  - `src/features/hubs/components/hubs-listing.tsx`: Server Component prefetching `hubsQueryOptions` (or direct query hydration)
  - `src/features/hubs/components/hubs-tables/index.tsx`: Client Component with `useDataTable`, `<DataTable>`, `<DataTableToolbar>`
  - `src/features/hubs/components/hubs-tables/columns.tsx`: `ColumnDef<Hub>[]` with `DataTableColumnHeader`, sortable headers, badges, selection
  - `src/features/hubs/components/hubs-tables/cell-action.tsx`: Action dropdown, Edit dialog, Delete confirmation alert dialog
  - `src/features/hubs/components/hubs-tables/use-hubs-table-filters.tsx`: `nuqs` search params hook
  - `src/features/hubs/components/hub-form-sheet.tsx` / `hub-modal.tsx`: Modal with form validation preserving `#hub-form-dialog`
  - `src/features/hubs/api.ts` / `queries.ts`: TanStack Query hooks

## Critical E2E Selectors (MUST PRESERVE)
- Search input: `#hub-search-input`
- Add Hub button: `#btn-add-hub`
- Hub modal dialog: `#hub-form-dialog`
- Active toggle & delete actions
- Table rows: standard `table` and `tr` markup rendered by `DataTable`

## Acceptance Criteria
- [x] Refactored into canonical `src/features/hubs/components/hubs-tables/`
- [x] Uses `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`
- [x] URL search params (`search`, `page`, `perPage`) synced with `nuqs`
- [x] `npm run build` succeeds with 0 TypeScript/compile errors in `frontend/`
- [x] Playwright spec `10-hubs-management.spec.ts` passes (12/12 test specs passed in suite)
