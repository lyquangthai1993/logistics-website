# Dispatch: worker_m7_e2e_runner

## Objective
Execute the full Playwright E2E test suite in `frontend/` and verify production build with 0 TypeScript errors.

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. In `d:\Projects\logistics-website\frontend`:
   Run `npx tsc --noEmit` and verify 0 TypeScript errors.
2. Run `npm run build` and verify all routes compile cleanly.
3. Run all Playwright test specs:
   - `npx playwright test e2e/01-console-health.spec.ts`
   - `npx playwright test e2e/02-login-flow.spec.ts`
   - `npx playwright test e2e/03-rbac-routing.spec.ts`
   - `npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts`
   - `npx playwright test e2e/05-profile-avatar.spec.ts`
   - `npx playwright test e2e/06-notification-system.spec.ts`
   - `npx playwright test e2e/06-order-dispatch-workflow.spec.ts`
   - `npx playwright test e2e/07-notification-ui-visual.spec.ts`
   - `npx playwright test e2e/10-hubs-management.spec.ts`
   (or `npx playwright test` for all specs)
4. Record test pass/fail counts, execution times, and full output logs in `handoff.md`.
