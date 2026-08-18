# BRIEFING — 2026-08-18T14:21:00Z

## Mission
Design the precise canonical target architecture, file structure, dual-tab nuqs search params handling, TanStack Table v8 column definitions, API queries/mutations, and Worker migration plan for `frontend/src/features/fleet/` in Milestone 2: Fleet Management Standardization.

## 🔒 My Identity
- Archetype: SPECIFICATION MINER
- Roles: Teamwork specialist, external domain expert
- Working directory: d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_2
- Original parent: 7172e926-cfe8-4b9c-8361-0f7ee6c930b0
- Milestone: Milestone 2 - Fleet Management Standardization

## 🔒 Key Constraints
- Read-only: Do NOT implement or mutate project source code directly, produce exhaustive architectural blueprint and migration contracts for Worker.
- Adhere strictly to Canonical Architecture defined in `survey_canonical.md` and reference modules (`products`, `users`).
- Support dual-tab nuqs search parameter management (`vehicles` vs `drivers`).
- Full TanStack Table v8 integration with `useDataTable`, `DataTableColumnHeader`, faceted filters, badges, and action dropdowns.
- 100% backward compatibility with Playwright E2E tests (`04-fleet-crud-and-refresh.spec.ts`, `10-hubs-management.spec.ts`).

## Current Parent
- Conversation ID: 7172e926-cfe8-4b9c-8361-0f7ee6c930b0
- Updated: 2026-08-18T14:21:00Z

## Task Summary
- **What to build**: Complete architectural blueprint, dual-tab nuqs synchronization strategy, TanStack Table v8 column definitions, React Query options & mutations, and step-by-step worker checklist.
- **Success criteria**: Detailed handoff.md created.
- **Status**: Completed.

## Key Decisions Made
- Dual-tab state synchronized with URL via `nuqs` (`?tab=vehicles|drivers`), allowing clean tab persistence on reload or deep linking.
- Sub-tables split into `vehicles-table/` and `drivers-table/` each with dedicated `columns.tsx`, `cell-action.tsx`, `options.tsx`, and `index.tsx`.
- All DOM IDs (`#btn-add-vehicle`, `#tab-drivers`, `#vehicle-form-dialog`, `#select-current-hub`, etc.) and `data-testid` attributes preserved to maintain 100% Playwright test compatibility.
- Backward compatibility for `trips/page.tsx` guaranteed by re-exporting `fleetApi`, `Vehicle`, `Driver` from `api.ts`.

## Artifact Index
- `handoff.md` — Complete architectural blueprint and migration contracts for Worker
- `DISPATCH.md` — Dispatch log
- `progress.md` — Progress log
