# Dispatch: auditor_m7_1

## Objective
Forensic Integrity Audit across the entire codebase, refactored components, and Playwright test suites.

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Forensic Checks (Zero Tolerance)
1. **No Test Hardcoding / Bypasses**:
   - Check that Playwright test files perform genuine DOM queries and assertions, with no dummy `expect(true).toBe(true)` bypasses.
   - Check that table components perform genuine data mapping and state management, not hardcoded mock strings in production paths.
2. **No Dummy / Facade Implementations**:
   - Verify that all 7 features (`hubs`, `fleet`, `orders`, `trips`, `users`, `warehouse`, `notifications`) contain genuine interactive logic, genuine TanStack table configurations, and proper API client integrations.
3. **Safety & Governance Rules Compliance**:
   - Verify no committed secrets or `.env` files.
   - Verify no destructive database commands.
   - Verify no git push or unauthorized git manipulations.

## Verdict Requirement
Write `handoff.md` in `d:\Projects\logistics-website\.agents\auditor_m7_1` with explicit binary verdict: **CLEAN** or **INTEGRITY VIOLATION**, with complete supporting evidence.
