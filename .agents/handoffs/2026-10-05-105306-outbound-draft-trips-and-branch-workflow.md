# Handoff: Outbound Draft Trips, Feedback 05/10 Fixes, and Branch/E2E Workflow

## Session Metadata
- Created: 2026-10-05 10:53:06
- Project: D:\Projects\logistics-website
- Branch: dev (across root, backend, frontend)
- Session duration: ~3.5 hours

### Recent Commits (for context)
  - 8c4bc5f docs(warehouse): update feedback checklist, test cases, and logic spec
  - 14ed055 docs(warehouse): add 04/10 feedback audit specs and sync rbac matrix
  - dcf1332 chore(submodules): update backend and frontend pointers for throttler fix and debounced search
  - 51b07b1 chore(submodules): update backend and frontend pointers for flow scoping and e2e suite
  - d095c05 chore(submodules): update backend and frontend pointers for trip hub origin and outbound fix

## Handoff Chain

- **Continues from**: [2026-10-05-103916-feedback-05-10-outbound-and-pallet-labels.md](./2026-10-05-103916-feedback-05-10-outbound-and-pallet-labels.md)
  - Previous title: Feedback 05/10 - Outbound Trip Board Counters & Pallet Label Warehouse Name
- **Supersedes**: 2026-10-05-103916-feedback-05-10-outbound-and-pallet-labels.md

## Current State Summary

This session completed the full resolution of user bug reports from `feedback_05_10`:
1. **Outbound Board Missing Trips & Drafts**: Resolved the core bug where the Outbound board showed no trips, or only "Đã xử lý" (COMPLETED) trips, while Draft trips ("Chờ xử lý") never appeared. We implemented end-to-end draft persistence (`POST /v1/warehouse/outbound/draft`, `DELETE /v1/warehouse/outbound/drafts/:tripCode`), added an additive migration column `trip.quantityAllocated int NULL`, updated `confirmOutbound` to reuse draft SD trip codes, and rewrote the CTE query in `GET /v1/warehouse/outbound-trips` to UNION drafts and dispatched trips with 1:1 filter/counter parity.
2. **Frontend UI Outbound Board & Transfer Flow**: Added tabs for `Tất cả / Chờ xử lý / Đã xử lý` with type sub-filters, real draft save/resume/cancel actions, batch dispatch of draft trips, and receipt printing guards (only dispatched trips). Step 3 of the transfer flow now saves real draft trips.
3. **Pallet Labels & Inbound Isolation**: Pallet label "KHO" now reliably displays the operating warehouse hub rather than falling back to the sender's pickup address, and outbound draft trips no longer leak into the Inbound board.
4. **Current Status**: All code compiles cleanly (`npx tsc --noEmit` passes for both backend and frontend). All working trees are currently uncommitted on branch `dev`. The user's requested next execution sequence is: create feature branch (`fix/feedback-05-10`) in both submodules, commit, push, merge into `dev`, execute E2E tests against dev environment, and once all pass, merge into `master`.

## Important Context

- **Do NOT run destructive database commands**: Never execute `DROP`, `TRUNCATE`, or `schema:sync`. Always use TypeORM migrations.
- **Submodule Push Sequence**: Always push `backend` and `frontend` submodules BEFORE pushing the root repository.
- **Migration is Mandatory Before Backend Deployment**: As soon as backend code referencing `quantityAllocated` is deployed, any environment running it without the migration applied (`npm run migration:run` in `backend/`) will fail on `GET /v1/warehouse/outbound-trips` and `POST /v1/warehouse/outbound/draft`.
- **E2E Testing Rules**: Per user request, do NOT merge to `master` until all E2E tests pass on `dev`.
- **Working Tree State**: Uncommitted modifications exist in `backend/`, `frontend/`, and root (`.agents/rules/rbac-matrix.md`, `feedback_05_10/TODO.md`).

## Immediate Next Steps

1. **Create Feature Branch**:
   - In `backend/`: create and switch to branch `fix/feedback-05-10`.
   - In `frontend/`: create and switch to branch `fix/feedback-05-10`.
   - In root: create and switch to branch `fix/feedback-05-10`.
2. **Review & Commit Staged Changes**:
   - Review modified files in `backend/` and commit with Conventional Commit: `fix(warehouse): implement outbound draft trips and tab parity`.
   - Review modified files in `frontend/` (including any existing changes like `frontend/src/proxy.ts`, `frontend/src/lib/api-client.ts`, or separate them if needed) and commit: `fix(warehouse): connect outbound drafts, status tabs, and pallet warehouse label`.
   - Update submodule pointers at root and commit: `chore(submodules): sync backend and frontend for feedback 05/10 fixes`.
3. **Push Feature Branches**:
   - Push submodules first (`backend`, `frontend`), then push root to remote `origin/fix/feedback-05-10`.
4. **Merge into `dev`**:
   - Merge `fix/feedback-05-10` into `dev` in `backend/`, `frontend/`, and root.
   - Push updated `dev` branches to origin.
5. **Run DB Migration on Dev Environment**:
   - Execute `npm run migration:run` in `backend/` against dev database (adds `quantityAllocated`).
6. **Execute E2E Testing**:
   - Run Playwright E2E suite (`npm run e2e:check`, `npm run e2e` / targeted specs in `frontend/`) against dev deployment to verify complete pass.
7. **Merge into `master`**:
   - Once all E2E tests pass cleanly, merge `dev` into `master` across all repositories and trigger production deployment.

## Architecture Overview

- **Multi-repo Submodule Structure**: Root repository `logistics-website` contains documentation, rules, and submodules `backend` (`logistics-website-backend`, NestJS 11 + TypeORM + PostgreSQL on Neon) and `frontend` (`logistics-website-frontend`, Next.js 15 App Router + Tailwind + TanStack Query).
- **Outbound Trip vs. Order Lifecycle**: Orders have contract/hub lifecycle states (`INBOUND`, `WAITING_OUTBOUND`, `CONFIRMED`, `COLLECTED`), whereas outbound logistics boards track trips (`SD...`) departing from the hub.
- **Draft Trip Mechanism**: When an operator saves an outbound note as draft, an SD trip code is allocated, rows are saved in the `trip` table with `status = 'PENDING'` and `quantityAllocated`, and the origin trip stop is created with `status = 'PENDING'`. Crucially, **no inventory transactions are created**, so hub inventory and contract balances remain untouched until confirmed.
- **Trip Confirmation**: When confirming a draft, the existing SD code is reused, previous draft lines are replaced with confirmed allocations, inventory dispatch transactions (`OUTBOUND` or `TRANSFER`) are executed, stock is deducted, and the origin stop becomes `COMPLETED`.

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `backend/src/orders/warehouse.service.ts` | Implements `saveOutboundDraft`, `cancelOutboundDraft`, `getOutboundTrips` CTE, and `confirmOutbound` with draft code reuse | Central warehouse outbound dispatch & draft business logic |
| `backend/src/orders/warehouse.controller.ts` | Exposes `POST /v1/warehouse/outbound/draft`, `DELETE /v1/warehouse/outbound/drafts/:tripCode`, and `GET /v1/warehouse/outbound-trips` | REST controller with RBAC permissions |
| `backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts` | Added `quantityAllocated` column mapping | Entity schema update for draft allocation |
| `backend/src/database/migrations/1789040000000-AddQuantityAllocatedToTrip.ts` | SQL migration `ADD COLUMN IF NOT EXISTS "quantityAllocated" integer` | Required DB migration (must run before deploying backend) |
| `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Main outbound board with processing-status tabs, draft actions (Tiếp tục, Hủy nháp, Batch confirm), and receipt modals | Core UI for warehouse operators |
| `frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx` | Stepper for inter-hub outbound transfer | Connected Step 3 to real draft persistence API |
| `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx` | A4 pallet label template displaying barcodes and operating warehouse name | Resolved KHO label showing sender address |
| `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Inbound warehouse board | Prevented local outbound/transfer draft trips from leaking into inbound view |
| `.agents/rules/rbac-matrix.md` | System RBAC permissions matrix | Updated to v1.7 with draft endpoint permissions |
| `feedback_05_10/TODO.md` | Issue tracking & verification checklist | Complete record of all 3 sections of the 05/10 feedback |

## Key Patterns Discovered

- **1:1 Metric & Row Parity**: Dynamic counters and table rows must always be calculated within the exact same database CTE query; deriving counters from disconnected KPI services causes instant UI desynchronization.
- **Draft Allocation vs Stock Balance**: Draft trips reserve intended cargo quantities via `quantityAllocated` without deducting from `inventory_transactions`. Ledger stock is only decremented upon actual vehicle departure confirmation.
- **Submodule Git Operations**: Changes in `backend/` and `frontend/` must be staged and committed inside their respective submodules first before updating submodule pointers at root.
- **Zero Technical Error Leakage**: Use `showApiErrorToast()` and `formatApiError()` to ensure localized Vietnamese messages are presented to operators.

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `backend/src/database/migrations/1789040000000-AddQuantityAllocatedToTrip.ts` | Created migration adding `quantityAllocated` | Persist draft trip allocation |
| `backend/src/trips/domain/trip.ts` | Added `quantityAllocated` to Trip model | Domain model consistency |
| `backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts` | Added `@Column` for `quantityAllocated` | TypeORM entity mapping |
| `backend/src/orders/dto/confirm-outbound.dto.ts` | Added `dispatchDate` and `draftTripCode` | Enable draft reuse on confirmation |
| `backend/src/orders/warehouse.controller.ts` | Added draft save, draft delete, and status filter query | REST endpoints for draft handling |
| `backend/src/orders/warehouse.service.ts` | Implemented draft creation, cancellation, confirmation reuse, and CTE union | Core business logic |
| `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Outbound board status tabs, draft buttons, batch dispatch, receipt guards | Operational UI |
| `frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx` | Connected Step 3 draft button to API, disabled Step 1 draft | Real draft persistence |
| `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx` | Fixed KHO warehouse identity display | Show correct warehouse name on label |
| `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx` | Added `currentHubEntity` typing and passed to label modal | Accurate label data |
| `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Updated label props and excluded outbound/transfer drafts from local hub | Clean isolation of inbound goods |
| `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Passed `currentHubEntity` to pallet label print | Uniform label behavior |
| `frontend/src/components/ui/table/table-pagination-bar.tsx` | Added optional `unitLabel` prop | Display 'chuyến xe' in pagination bar |
| `.agents/rules/rbac-matrix.md` | Updated to v1.7 | Document draft endpoints and status queries |
| `feedback_05_10/TODO.md` | Added Section 3 and updated checklist | Comprehensive task tracking |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Represent drafts as `trip` rows with `status='PENDING'` | Dedicated draft table vs Reusing `trip` entity | Minimal schema overhead, natural transition to dispatched trip by updating status and adding stops |
| Additive DB column `trip.quantityAllocated` | Reusing notes/JSON metadata vs Additive column | Strongly-typed column allows high-performance SQL indexing and CTE aggregation |
| Draft trips do not deduct inventory | Deducting immediately with rollback vs Deferred ledger deduction | Operators often draft notes hours before trucks arrive; premature deduction locks inventory for other orders |
| Outbound board tabs count trips | Counting orders vs Counting trips | Board rows represent vehicle departures (SD...); tab counts now match visible rows 1:1 |
| Branch creation workflow per user request | Direct commit on `dev` vs Feature branch `fix/feedback-05-10` | User explicitly requested: create feature branch -> commit & push -> merge into `dev` -> run E2E on dev -> merge to `master` if pass |

## Assumptions Made

- The branch name `fix/feedback-05-10` aligns with user instruction ("tạo branch phù hợp như đã nói ở trên").
- The dev database is accessible for running `npm run migration:run`.
- Existing uncommitted changes in `frontend/src/proxy.ts` and `frontend/src/lib/api-client.ts` are intended improvements and can be reviewed as part of the commit.

## Potential Gotchas

- When merging submodules into `dev`, ensure you checkout `dev`, pull latest `origin/dev`, merge `fix/feedback-05-10`, and push. Then in the root repo, do the same for the root `dev` branch and update the submodule references.
- In `frontend/src/proxy.ts`, base64 padding logic was added for JWT parsing; ensure tests run with valid tokens.
- Running `npm run migration:run` in `backend/` requires proper database connection parameters in `.env`.

## Pending Work Details

### Blockers/Open Questions

- [ ] **DB Migration Execution**: The backend migration `1789040000000-AddQuantityAllocatedToTrip.ts` must be executed via `npm run migration:run` in `backend/` before the new backend code is deployed to dev/prod, otherwise queries referencing `quantityAllocated` will fail.
- [ ] **Unrelated Frontend Modifications**: Files `frontend/src/app/auth/sign-in/page.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/page.tsx`, `frontend/src/components/layout/app-sidebar.tsx`, `frontend/src/features/auth/components/login-form.tsx`, `frontend/src/lib/api-client.ts`, `frontend/src/proxy.ts` were present in the working tree. Verify whether they should be included in the commit or kept separate.

### Deferred Items

- Customer details (name, phone, address) entered in Mode 1 are not persisted to a separate customer entity (known limitation from earlier design).

## Environment State

### Tools/Services Used

- Node.js 20+ / npm
- Python 3.12.10 (for session handoff scripts)
- NestJS 11 + TypeORM
- Next.js 15 App Router + Playwright
- PostgreSQL on Neon (dev & prod)
- Render (Backend Dev: `logistics-website-backend-1jho`, Backend Pro: `logistics-website-backend-1`)
- Vercel (Frontend Dev & Pro)

### Active Processes

- None currently active in background

### Environment Variables

- `DATABASE_URL` (PostgreSQL connection)
- `NEXT_PUBLIC_API_URL` (Backend API base URL)
- `JWT_SECRET` / `JWT_REFRESH_SECRET`

## Related Resources

- `feedback_05_10/TODO.md`: Full task breakdown and checklist
- `.agents/rules/rbac-matrix.md`: Authorization matrix (v1.7)
- `IMPLEMENT_STATUS_TRIP_AND_ORDER.md`: Status rules for orders and trips
- `.agents/skills/git-commit-reviewer/SKILL.md`: Commit and push guidelines
- `.agents/skills/e2e-test-runner/SKILL.md`: E2E testing runbook

---

**Security Reminder**: Run `validate_handoff.py` to check for accidental secret exposure before finalizing.
