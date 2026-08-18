# Project: Logistics TMS Frontend Data Listing Table Standardization

## Architecture
- **Framework**: Next.js 15+ App Router (`frontend/src/app/dashboard/`)
- **Table Primitive**: `@tanstack/react-table` v8 via canonical wrapper `<DataTable>` (`src/components/ui/table/data-table.tsx`)
- **URL Search Params**: `nuqs` (`src/hooks/use-data-table.ts`, `searchParamsCache`, `useQueryStates`)
- **Data Fetching & Cache**: TanStack Query v5 (`useSuspenseQuery`, `useQuery`, `prefetchQuery`, `HydrationBoundary`)
- **Shared Table Components**:
  - `DataTable` (`src/components/ui/table/data-table.tsx`)
  - `DataTablePagination` (`src/components/ui/table/data-table-pagination.tsx`)
  - `DataTableToolbar` (`src/components/ui/table/data-table-toolbar.tsx`)
  - `DataTableColumnHeader` (`src/components/ui/table/data-table-column-header.tsx`)
  - `DataTableFacetedFilter` (`src/components/ui/table/data-table-faceted-filter.tsx`)
  - `DataTableViewOptions` (`src/components/ui/table/data-table-view-options.tsx`)
- **Feature Folder Convention**: `src/features/<feature>/components/<feature>-tables/`
  - `<feature>-listing.tsx` (Server prefetch wrapper)
  - `index.tsx` (Client table with `useDataTable`, `<DataTable>`, `<DataTableToolbar>`)
  - `columns.tsx` (`ColumnDef<T>[]` with `DataTableColumnHeader`, sortable headers, badges)
  - `cell-action.tsx` (Row action menu, edit dialog, delete confirmation alert dialog)
  - `use-<feature>-table-filters.tsx` (nuqs parser state hooks)

## Code Layout
- `frontend/src/app/dashboard/admin/hubs/` -> `src/features/hubs/`
- `frontend/src/app/dashboard/fleet/` -> `src/features/fleet/`
- `frontend/src/app/dashboard/orders/` -> `src/features/orders/`
- `frontend/src/app/dashboard/trips/` -> `src/features/trips/`
- `frontend/src/app/dashboard/users/` -> `src/features/users/`
- `frontend/src/app/dashboard/warehouse/` -> `src/features/warehouse/`
- `frontend/src/app/dashboard/notifications/` -> `src/features/notifications/`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Hubs DataTable | Standardize Hubs listing with DataTable, columns, sorting, pagination, search filter `#hub-search-input`, toggle active, delete confirmation, `#btn-add-hub` | M1 | Survey |
| 2 | Fleet Vehicles DataTable | Standardize Vehicles listing tab with DataTable, column sorting, pagination, search `#fleet-search-input`, status badges, CRUD modals | M2 | Survey |
| 3 | Fleet Drivers DataTable | Standardize Drivers listing tab with DataTable, column sorting, pagination, search, license badges, CRUD modals | M2 | Survey |
| 4 | Orders DataTable & KPI | Standardize Orders intake table with DataTable, date presets, stats summary, "Tạo lệnh điều vận", "Gửi Fleet", delete draft | M3 | Survey |
| 5 | Trips DataTable & Workflows | Standardize Trips table with DataTable, Capacity Gauge, Assign Vehicle modal, Split Shipment mode, No-Vehicle declaration | M4 | Survey |
| 6 | Users Live API & Roles | Connect canonical Users DataTable to live NestJS `/api/v1/users` API and TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`) | M5 | Survey |
| 7 | Warehouse Inbound Listing | Standardize Warehouse inbound board into modular feature with DataTable / grid view and nuqs search sync | M6 | Survey |
| 8 | Notifications Listing | Standardize Notifications page with nuqs pagination sync, tabs, mark all as read | M6 | Survey |
| 9 | 100% E2E Test Suite & Adversarial Hardening | Verify all 12 Playwright test specs pass 100% + Tier 5 adversarial stress tests | M7 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Hubs Management | `/dashboard/admin/hubs` standardization into `src/features/hubs/` | none | DONE |
| M2 | Fleet Vehicles & Drivers | `/dashboard/fleet` standardization (Vehicles & Drivers tabs) into `src/features/fleet/` | none | DONE |
| M3 | Orders Intake & Dispatch | `/dashboard/orders` standardization into `src/features/orders/` | M1 | DONE |
| M4 | Trips & Capacity | `/dashboard/trips` standardization into `src/features/trips/` | M2, M3 | DONE |
| M5 | Users Management Live API | `/dashboard/users` connection to NestJS `/api/v1/users` & TMS roles | none | DONE |
| M6 | Warehouse & Notifications | `/dashboard/warehouse` & `/dashboard/notifications` standardization | M4 | DONE |
| M7 | E2E Verification & Hardening | Full E2E test verification (Tiers 1-4) & Tier 5 adversarial hardening | M1-M6 | DONE |

## Interface Contracts
### Common Table Contract
- All table components use `ColumnDef<T>[]` from `@tanstack/react-table`.
- All table headers use `DataTableColumnHeader` for sortable columns.
- All pagination uses `DataTablePagination` with `[10, 20, 30, 40, 50]` row selection.
- All URL parameters use `nuqs` (`page`, `perPage`, `search`, filters).
- Interactive buttons and links must specify `cursor-pointer`.
- Critical E2E element IDs and testids MUST be preserved verbatim.
