# BRIEFING — 2026-08-18T15:00:35+07:00

## Mission
Investigate and remediate the mutation cache invalidation bug in Hubs Management (frontend), where component-level onSuccess overrides mutation option base onSuccess, causing stale query cache.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer (Read-only investigation & synthesis)
- Working directory: d:\Projects\logistics-website\.agents\explorer_m1_hubs_r2_1
- Original parent: 5d5e5cf7-7d86-4788-95d6-70b6cf3bbfc9
- Milestone: Milestone 1 - Hubs Management Standardization (Iteration 2)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in source files during exploration
- Output analysis and handoff reports in working directory

## Current Parent
- Conversation ID: 5d5e5cf7-7d86-4788-95d6-70b6cf3bbfc9
- Updated: 2026-08-18T15:00:35+07:00

## Investigation State
- **Explored paths**:
  - `frontend/src/features/hubs/api/mutations.ts`
  - `frontend/src/features/hubs/components/hub-form-dialog.tsx`
  - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`
  - `frontend/src/features/hubs/api/queries.ts`
  - `frontend/src/features/hubs/components/hubs-listing.tsx`
  - `frontend/src/features/hubs/components/hubs-metrics.tsx`
  - `frontend/src/features/fleet/components/vehicles-table/cell-action.tsx`
  - `frontend/e2e/10-hubs-management.spec.ts`
  - `frontend/e2e/challenger-hubs-workflow.spec.ts`
  - `frontend/e2e/challenger-m1-empirical.spec.ts`
- **Key findings**:
  - `{ ...createHubMutation, onSuccess: ... }` in components overwrites the base `onSuccess` containing `invalidateQueries({ queryKey: hubKeys.all })`.
  - TanStack Query cache `['hubs', ...]` remains cached with stale data across table and KPI metrics.
  - Formulated dual-layer fix: custom mutation hooks in `mutations.ts` and explicit `useQueryClient().invalidateQueries({ queryKey: hubKeys.all })` calls inside component `onSuccess` callbacks.
- **Unexplored areas**: None. Investigation complete.

## Key Decisions Made
- Provided exact code modifications for `mutations.ts`, `hub-form-dialog.tsx`, `cell-action.tsx`, and `10-hubs-management.spec.ts`.
- Documented full analysis in `analysis.md` and 5-component handoff in `handoff.md`.

## Artifact Index
- DISPATCH.md — Task dispatch record
- analysis.md — Full deep-dive analysis and exact code changes
- handoff.md — 5-component handoff report
