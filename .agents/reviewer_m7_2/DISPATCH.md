# Dispatch: reviewer_m7_2

## Objective
Objective and adversarial code quality review focusing on 3-layer RBAC permissions, nuqs URL synchronization, and interface conformance.

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Audit Criteria
1. **3-Layer RBAC Architecture**:
   - Layer 1 (Sidebar UI): Menu items visible only to authorized roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
   - Layer 2 (Route Guards): `middleware.ts` / page-level guards protect dashboard routes appropriately.
   - Layer 3 (Action Guards): API/button-level guards prevent unauthorized operations (e.g. non-super-admin deleting hubs/users).
2. **nuqs State Synchronization**:
   - Check `use-*-table-filters.tsx` across modules.
   - Ensure `page`, `perPage`, and `search` synchronize with URL query strings seamlessly without unhandled NaN/empty string bugs.
3. **Module & Interface Contracts**:
   - Verify all feature folders strictly follow `src/features/<feature>/components/<feature>-tables/`.

## Verdict Requirement
Write `handoff.md` in `d:\Projects\logistics-website\.agents\reviewer_m7_2` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**, complete with verified evidence.
