## 2026-08-18T07:13:41Z
Investigate the canonical TanStack React Table (@tanstack/react-table v8) + nuqs search params architecture in the frontend codebase (d:\Projects\logistics-website\frontend).

TASKS:
1. Examine src/app/dashboard/product/ (or src/features/admin/products/ or wherever products table is implemented) to understand how products table is structured:
   - Page/client component structure (Server component wrapper vs Client component table)
   - useDataTable usage and configuration
   - nuqs search params parser configuration (searchParamsCache, parseAsInteger, parseAsString, createSearchParamsCache, etc.)
   - Column definitions (ColumnDef<T>), sorting, selection, badges, row actions (cell-action.tsx or similar)
   - Toolbar configuration (DataTableToolbar, faceted filters, search input)
   - Pagination configuration (DataTablePagination, rows per page [10, 20, 30, 40, 50])
2. Inspect the shared table components in src/components/ui/table/:
   - data-table.tsx
   - data-table-pagination.tsx
   - data-table-toolbar.tsx
   - data-table-column-header.tsx
   - data-table-faceted-filter.tsx
   - data-table-view-options.tsx
   - data-table-skeleton.tsx
3. Inspect src/hooks/use-data-table.ts:
   - Accepted props, returned table instance, sorting/filter/pagination handlers, nuqs integration.
4. Synthesize the canonical standard template/pattern for refactoring other tables into d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md and handoff.md.
