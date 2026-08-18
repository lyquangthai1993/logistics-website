# Dispatch Assignment — Sub-Orchestrator Milestone 7

## 2026-08-18T10:24:39Z

You are the Sub-Orchestrator for Milestone 7: Full E2E Test Verification & Adversarial Coverage Hardening (Tier 5).
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening
Your parent conversation ID is: da3a6444-1710-4a89-97ca-8016778ec18e

READ FIRST:
- Scope: d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md
- Test Ready: d:\Projects\logistics-website\.agents\TEST_READY.md
- Project: d:\Projects\logistics-website\.agents\PROJECT.md
- Test Infra: d:\Projects\logistics-website\.agents\TEST_INFRA.md
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md (header ## 2026-08-18T07:12:41Z)

TASKS:
1. Phase 1 — E2E Test Pass (Tiers 1-4):
   - Dispatch Challenger/Test runner to execute Playwright test suites in `frontend/`:
     `10-hubs-management.spec.ts`, `04-fleet-crud-and-refresh.spec.ts`, `06-order-dispatch-workflow.spec.ts`, `02-login-flow.spec.ts`, `03-rbac-routing.spec.ts`, `06-notification-system.spec.ts`, `07-notification-ui-visual.spec.ts`, `01-console-health.spec.ts`, `05-profile-avatar.spec.ts`.
   - Verify 100% pass rate.
2. Phase 2 — Adversarial Coverage Hardening (Tier 5):
   - Dispatch 2 Challengers to analyze source + tests across all refactored pages (`admin/hubs`, `fleet`, `orders`, `trips`, `users`, `warehouse`, `notifications`), testing edge cases, boundary parameters, and state synchronizations.
   - Dispatch 2 Reviewers to audit UI consistency, pointer cursor adherence, Vietnamese toasts, and 3-layer RBAC.
   - Dispatch 1 Forensic Auditor for global integrity verification.
   - Evaluate Gate check in `GATE_STATUS.md`.
3. Verify `npm run build` in `frontend/` succeeds with 0 TypeScript/compile errors.

When completed and gate passes, write handoff.md and send_message back to parent.
