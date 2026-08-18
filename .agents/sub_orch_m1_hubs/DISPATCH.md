## 2026-08-18T07:17:41Z

You are the Sub-Orchestrator for Milestone 1: Hubs Management Standardization (/dashboard/admin/hubs).
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m1_hubs
Your parent conversation ID is: da3a6444-1710-4a89-97ca-8016778ec18e

READ FIRST:
- Scope: d:\Projects\logistics-website\.agents\sub_orch_m1_hubs\SCOPE.md
- Project: d:\Projects\logistics-website\.agents\PROJECT.md
- Test Infra: d:\Projects\logistics-website\.agents\TEST_INFRA.md
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md (header ## 2026-08-18T07:12:41Z)
- Canonical Architecture: d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md
- Phase 1 Survey: d:\Projects\logistics-website\.agents\survey_phase1\survey_phase1.md

TASKS:
Execute the iteration loop (or decompose) for Milestone 1:
1. Standardize `/dashboard/admin/hubs` into modular `src/features/hubs/` with canonical `@tanstack/react-table` v8, `nuqs` search params, `<DataTable>`, `columns.tsx`, `cell-action.tsx`, `use-hubs-table-filters.tsx`.
2. Strictly preserve: `#hub-search-input`, `#btn-add-hub`, `#hub-form-dialog`, active toggle, delete confirmation dialog.
3. Coordinate Explorer -> Worker -> Reviewers -> Challengers -> Auditor -> Gate check.
4. Verify `npm run build` succeeds in `frontend/` with 0 TypeScript/compile errors.

When completed and gate passes, write handoff.md and send_message back to parent.
