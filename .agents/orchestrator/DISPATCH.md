## 2026-08-18T07:13:14Z
You are the Project Orchestrator for the Logistics TMS frontend data listing table standardization and refactoring.

Your working directory is: d:\Projects\logistics-website\.agents\orchestrator
The authoritative original user request is located at: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md under header ## 2026-08-18T07:12:41Z.

Scope & Requirements:
1. Standardize and refactor data listing tables across the Logistics TMS frontend (`frontend/src/app/dashboard/`), adopting canonical TanStack React Table (`@tanstack/react-table` v8) + `nuqs` search params architecture established in `/dashboard/product`.
2. Phased Priority:
   - Core Phase 1:
     1. `/dashboard/admin/hubs` (Hubs Management)
     2. `/dashboard/fleet` (Fleet Vehicles & Drivers)
     3. `/dashboard/orders` (Orders Intake & Dispatch)
     4. `/dashboard/trips` (Trips & Vehicle Capacity)
     5. `/dashboard/users` (User Management)
   - Phase 2:
     6. `/dashboard/warehouse` (Warehouse Inbound/Outbound)
     7. `/dashboard/notifications` (System Notifications)
3. Canonical Architecture & Component Reuse:
   - `DataTable` (`src/components/ui/table/data-table.tsx`)
   - `DataTablePagination` (`src/components/ui/table/data-table-pagination.tsx`)
   - `DataTableToolbar` (`src/components/ui/table/data-table-toolbar.tsx`)
   - `DataTableColumnHeader` (`src/components/ui/table/data-table-column-header.tsx`)
   - `useDataTable` (`src/hooks/use-data-table.ts`)
4. Preserve all row-level actions (modals, delete confirmation, toggle active status, badges) and 3-layer RBAC permission guards.
5. Acceptance criteria:
   - All target listing tables use `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`.
   - Table column definitions utilize `ColumnDef<T>` with `DataTableColumnHeader`.
   - URL search parameters (`page`, `perPage`, `search`) reflect pagination state via `nuqs`.
   - Cursor pointer rules respected.
   - `npm run build` in `frontend/` succeeds with 0 TypeScript/compile errors.
   - Playwright E2E test specs pass 100%.
