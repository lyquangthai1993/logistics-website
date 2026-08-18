# Scope: Milestone 7 — Full E2E Verification & Adversarial Coverage Hardening (Tier 5)

## Architecture
- Target Scope: Entire Logistics TMS Frontend (`frontend/src/app/dashboard/` and `src/features/`)
- Reference: `d:\Projects\logistics-website\.agents\TEST_READY.md`

## Tasks & Phases
### Phase 1: E2E Test Pass (Tiers 1-4)
- Run complete Playwright test suite in `frontend/`:
  - `01-console-health.spec.ts` (3/3 passed)
  - `02-login-flow.spec.ts` (11/11 passed)
  - `03-rbac-routing.spec.ts` (20/20 passed)
  - `03b-users-rbac.spec.ts` (5/5 passed)
  - `04-fleet-crud-and-refresh.spec.ts` (5/5 passed)
  - `05-profile-avatar.spec.ts` (1/1 passed)
  - `06-notification-system.spec.ts` (11/11 passed)
  - `06-order-dispatch-workflow.spec.ts` (1/1 passed)
  - `07-notification-ui-visual.spec.ts` (6/6 passed)
  - `07-capture-user-guide-screenshots.spec.ts` (1/1 passed)
  - `10-hubs-management.spec.ts` (2/2 passed)
  - `challenger-hubs-workflow.spec.ts` (4/4 passed)
  - `challenger-m3-orders-empirical.spec.ts` (6/6 passed)
- 100% test pass rate achieved.

### Phase 2: Adversarial Coverage Hardening (Tier 5)
- Challenger 1 adversarial verification on Core Domain tables (`hubs`, `fleet`, `orders`, `trips`): APPROVE
- Challenger 2 adversarial verification on Admin, Warehouse, Notifications (`users`, `warehouse`, `notifications`): APPROVE (10/10 tests passed in `challenger-m7-admin-warehouse-notifications.spec.ts`)
- Reviewer 1 audit (UI uniformity, pointer cursor rule, Vietnamese Sonner toasts): APPROVE
- Reviewer 2 audit (3-layer RBAC, `nuqs` synchronization, folder structure): APPROVE
- Forensic Auditor audit (Authentic DOM testing, no dummy facades, no secrets/destructive DB commands): CLEAN
- Production build & TypeScript check: 0 TS errors, 28/28 Next.js routes compiled cleanly.

## Acceptance Criteria
- [x] 100% of all Playwright test specs pass cleanly (86+ tests total)
- [x] 0 TypeScript errors (`npx tsc --noEmit`)
- [x] `npm run build` succeeds (28/28 routes compiled in 11.6s)
- [x] Reviewer 1 & 2 APPROVE, Challenger 1 & 2 APPROVE, Forensic Auditor CLEAN
