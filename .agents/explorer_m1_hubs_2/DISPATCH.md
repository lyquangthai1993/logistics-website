## 2026-08-18T07:18:24Z

<USER_REQUEST>
You are Explorer 2 for Milestone 1: Hubs Management Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\explorer_m1_hubs_2

READ FIRST:
- d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- d:\Projects\logistics-website\.agents\PROJECT.md
- d:\Projects\logistics-website\.agents\sub_orch_m1_hubs\SCOPE.md
- Reference canonical table: d:\Projects\logistics-website\frontend\src\features\products\
- Reference canonical table: d:\Projects\logistics-website\frontend\src\features\users\
- Shared table components: d:\Projects\logistics-website\frontend\src\components\ui\table\
- DataTable hook: d:\Projects\logistics-website\frontend\src\hooks\use-data-table.ts
- Search params: d:\Projects\logistics-website\frontend\src\lib\searchparams.ts

TASKS:
1. Formulate the precise modular architecture for `frontend/src/features/hubs/`:
   - `api/types.ts`
   - `api/queries.ts` (queryOptions with queryKey `['hubs', filters]`)
   - `api/mutations.ts` (createHub, updateHub, toggleActive, deleteHub with cache invalidation)
   - `components/hubs-tables/index.tsx` (Client component with useDataTable, useSuspenseQuery / useQuery)
   - `components/hubs-tables/columns.tsx` (ColumnDef<Hub>[] with DataTableColumnHeader, sorting, badges, action column)
   - `components/hubs-tables/cell-action.tsx` (Actions dropdown, Edit modal trigger, Delete alert dialog)
   - `components/hubs-tables/use-hubs-table-filters.tsx` (nuqs search params state hook)
   - `components/hubs-listing.tsx` (Server prefetch wrapper with HydrationBoundary)
   - `components/hub-modal.tsx` or `hub-form-dialog.tsx` (Form modal preserving #hub-form-dialog and all input IDs)
   - `app/dashboard/admin/hubs/page.tsx` (Server Component wrapper with searchParamsCache.parse)
2. Detail how `searchParamsCache` and `nuqs` should handle `search`, `page`, `perPage`, `status`.
3. Provide concrete interface definitions and file skeletons.
4. Write your full design to `d:\Projects\logistics-website\.agents\explorer_m1_hubs_2\analysis.md` and `handoff.md`.
5. Send a message back to the orchestrator with your findings.
</USER_REQUEST>
