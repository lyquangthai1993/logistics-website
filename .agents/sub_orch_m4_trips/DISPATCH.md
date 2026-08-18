## 2026-08-18T09:10:01Z
You are the Sub-Orchestrator for Milestone 4: Trips & Vehicle Capacity Standardization (/dashboard/trips).
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m4_trips
Your parent conversation ID is: da3a6444-1710-4a89-97ca-8016778ec18e

READ FIRST:
- Scope: d:\Projects\logistics-website\.agents\sub_orch_m4_trips\SCOPE.md
- Project: d:\Projects\logistics-website\.agents\PROJECT.md
- Test Infra: d:\Projects\logistics-website\.agents\TEST_INFRA.md
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md (header ## 2026-08-18T07:12:41Z)
- Canonical Architecture: d:\Projects\logistics-website\.agents\survey_canonical\survey_canonical.md
- Phase 1 Survey: d:\Projects\logistics-website\.agents\survey_phase1\survey_phase1.md

TASKS:
Execute the iteration loop for Milestone 4:
1. Standardize `/dashboard/trips` into modular `src/features/trips/` with:
   - Server Component prefetch (`trips-listing.tsx`, `app/dashboard/trips/page.tsx`)
   - Canonical `@tanstack/react-table` v8 for "All Trips" tab (`trips-tables/`, `columns.tsx`, `cell-action.tsx`, `use-trips-table-filters.tsx`)
   - Tab 1 "Pending Orders" dispatch queue with Assign Vehicle dialog, interactive Capacity Gauge, Split Shipment mode (2-5 trips), and No-Vehicle declaration modal with categorized reasons
   - `nuqs` search params for `tab`, `search`, `status`, `page`, `perPage`, `dateRange`
2. Strictly preserve:
   - Assign Order button: `[data-testid^="btn-assign-order-"]`
   - Confirm Trip action: `button:has-text("Xác nhận Trip")`
   - Real-time capacity gauge rendering & calculations
   - 100% Vietnamese toasts and API-message-first error extraction
   - RBAC: `SUPER_ADMIN`, `FLEET_MANAGER`
3. Multi-agent iteration loop: Explorer (3) -> Worker (1) -> Reviewers (2) -> Challengers (2) -> Auditor (1) -> Gate check.
4. Verify `npm run build` in `frontend/` succeeds with 0 TypeScript/compile errors.

When completed and gate passes, write handoff.md and send_message back to parent.
