# Scope: Milestone 2 — Fleet Management (Vehicles & Drivers) Standardization

## Architecture
- Target Page: `frontend/src/app/dashboard/fleet/page.tsx`
- Feature Folder: `frontend/src/features/fleet/`
- Pattern:
  - `src/app/dashboard/fleet/page.tsx`: Page with dual tabs (`vehicles`, `drivers`) and URL tab persistence
  - `src/features/fleet/components/vehicles-table/`: Canonical TanStack Table for Vehicles (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `use-vehicles-table-filters.tsx`)
  - `src/features/fleet/components/drivers-table/`: Canonical TanStack Table for Drivers (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `use-drivers-table-filters.tsx`)
  - Modals: Vehicle Modal, Driver Modal, Delete Confirmation Dialog
  - Feature API / Queries: `src/features/fleet/api/`, `api.ts` (backward compatibility)

## Critical E2E Selectors (MUST PRESERVE)
- Add Vehicle button: `#btn-add-vehicle`
- Edit vehicle button: `button[data-testid^="btn-edit-vehicle-"]`
- Delete vehicle button: `button[data-testid^="btn-delete-vehicle-"]`
- Drivers tab trigger: `#tab-drivers`
- Add Driver button: `#btn-add-driver`
- Edit driver button: `button[data-testid^="btn-edit-driver-"]`
- Delete driver button: `button[data-testid^="btn-delete-driver-"]`
- Search input: `#fleet-search-input`
- Delete confirm dialog: `#delete-confirm-dialog`
- Vehicle current hub select: `#select-current-hub`

## Acceptance Criteria
- [x] Both Vehicles and Drivers tables use `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`
- [x] URL search params (`page`, `perPage`, `search`, `tab`) synced via `nuqs`
- [x] Preserves all CRUD modals and interactive actions
- [x] `npm run build` succeeds with 0 TypeScript/compile errors in `frontend/`
- [x] Playwright spec `04-fleet-crud-and-refresh.spec.ts` passes (5/5 tests) & `10-hubs-management.spec.ts` passes (2/2 tests)

## Milestone Status: DONE
- Gate Result: PASS (Iteration 2)
- Typecheck: 0 errors (`npx tsc --noEmit`)
- Next.js Build: 28/28 routes compiled successfully
- E2E Tests: 7/7 passed in Chromium (100% pass rate)
- Forensic Integrity Audit: CLEAN
