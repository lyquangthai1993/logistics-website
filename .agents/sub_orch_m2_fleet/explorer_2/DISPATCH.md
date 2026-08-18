## 2026-08-18T07:18:30Z
You are Explorer 2 (Spec Miner) for Milestone 2: Fleet Management Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_2
Your parent conversation ID is: 7172e926-cfe8-4b9c-8361-0f7ee6c930b0

MANDATORY FIRST STEP: Read the original user request at:
d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md

READ ALSO:
- Canonical Architecture: d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md
- Reference implementations: `frontend/src/features/products/`, `frontend/src/features/users/`, `frontend/src/components/ui/table/`, `frontend/src/hooks/use-data-table.ts`, `frontend/src/lib/searchparams.ts`

YOUR TASK:
Design the precise canonical target architecture for `frontend/src/features/fleet/`:
1. File and directory structure matching the canonical pattern:
   - `src/features/fleet/components/vehicles-table/` (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `use-vehicles-table-filters.tsx`)
   - `src/features/fleet/components/drivers-table/` (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `use-drivers-table-filters.tsx`)
   - `src/features/fleet/components/` (modal components, dual-tab layout / listing)
   - `src/features/fleet/api/` or `queries.ts` (query options, prefetching, mutations)
   - `src/app/dashboard/fleet/page.tsx` (Server Component with nuqs `searchParamsCache` and tab persistence)
2. How nuqs URL search parameters should be handled for dual tabs (e.g. `tab=vehicles|drivers`, `page`, `perPage`, `search`, `status`, etc.).
3. How `@tanstack/react-table` v8 column definitions (`ColumnDef<Vehicle>`, `ColumnDef<Driver>`) should be structured with sortable headers (`DataTableColumnHeader`), badges, and action menus.
4. Define the exact migration plan and code contracts for the Worker to follow.

Write a complete, structured architecture and specification report to:
`d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_2\handoff.md`

When complete, call `send_message` to parent (ID: 7172e926-cfe8-4b9c-8361-0f7ee6c930b0) with a summary.
