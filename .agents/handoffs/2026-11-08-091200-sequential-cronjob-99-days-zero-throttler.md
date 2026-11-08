# Handoff: Super Admin Operational Reports, Sequential Day-by-Day Cronjob Runner (Zero ThrottlerException) & Daily Trips Glance View

## Session Metadata
- Created: 2026-11-08 09:12:00 +07:00
- Project: d:/Projects/logistics-website
- Branch: dev / feat/task-116-outbound-calc-deleted-trips-dates-excel-step0
- Continues from: 2026-11-08-084600-super-admin-reports-cronjobs-and-daily-trips.md
- Session duration: ~3 hours

## Current State Summary

All Super Admin Operational Report (`/dashboard/admin/reports`), 2-Level Cronjob Management (`/dashboard/admin/cronjobs` and `/dashboard/admin/cronjobs/[jobKey]`), and Single-Day Trip Tracking (`/dashboard/admin/reports/trips`) features—including the sequential day-by-day range runner (`01/08/2026` → `07/11/2026`, 99 days) and elimination of `ThrottlerException: Too Many Requests`—have been implemented and verified with Playwright E2E (`frontend/e2e/admin-operational-reports.spec.ts`, E2E Auditor score `50/50 PASS`, 117 assertions).

## Codebase Understanding

## Architecture Overview

The Spider Express Logistics TMS monorepo consists of 3 independent Git repositories:
- Root repository (`d:/Projects/logistics-website`): Orchestration scripts (`scripts/railway-db-sync.mjs`, `scripts/e2e-auditor.mjs`, `scripts/ensure-local-servers.mjs`), agent skills, and submodule pointers.
- Backend submodule (`backend/`): NestJS 11 + TypeORM + PostgreSQL, serving Super Admin operational report snapshots (`daily_hub_operational_report`), cronjob configuration (`cron_job_config`), execution logs (`cron_job_execution_log`), and single-day trip drilldowns in `backend/src/orders/admin-reports.service.ts` and `backend/src/orders/admin-reports.controller.ts`.
- Frontend submodule (`frontend/`): Next.js 16 (App Router) + React 19 + TanStack Query v5 + Tailwind CSS, rendering the Super Admin Operational Report (`frontend/src/features/admin-reports/components/super-admin-operational-report.tsx`), the 2-level Cronjob Manager (`frontend/src/features/admin-reports/components/super-admin-cronjob-manager.tsx`), and the Daily Trips Tracker (`frontend/src/features/admin-reports/components/super-admin-daily-trips-tracker.tsx`).

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `backend/src/app.module.ts` | Global NestJS module & `ThrottlerModule` configuration | Scopes the `auth` throttler (`15 req/min` in production) strictly to `AuthController` via `skipIf: (ctx) => ctx.getClass()?.name !== 'AuthController'` so non-auth controllers are never throttled at 15 req/min |
| `backend/src/orders/admin-reports.controller.ts` | REST endpoints under `/api/v1/admin/reports/*` guarded by `RoleEnum.SUPER_ADMIN` | Decorated with `@SkipThrottle({ default: true, auth: true })` and accepts `triggeredBy` (`MANUAL_RANGE` vs `MANUAL_RERUN`) so multi-day sequential runs (e.g., 99 days) never hit `ThrottlerException: Too Many Requests` |
| `backend/src/orders/admin-reports.service.ts` | Core Super Admin operational reports, cronjob runner, and daily trips detail service | Caches `activeHubs` (60s TTL) and `actorEmail` in memory, seeds default cron configs once per process, supports up to `366` days in `daysLimit` and `200` execution logs |
| `frontend/src/features/admin-reports/components/super-admin-cronjob-manager.tsx` | 2-Level Cronjob Registry list and Cronjob Detail & Operations view | Executes multi-day ranges (`Từ ngày` -> `Đến ngày`, e.g., `01/08/2026` -> `07/11/2026`) strictly sequentially one day at a time (`Đang chạy` -> `Xong`), appends each day's execution log row to `Nhật ký thực thi` in real time as each day completes, auto-retries on transient 429/network errors, and tracks `activeDayStr` locally |
| `frontend/src/lib/api-error.ts` | Frontend API error sanitizer | Sanitizes `ThrottlerException: Too Many Requests` and HTTP `429` into localized Vietnamese operational messages |
| `frontend/src/features/admin-reports/components/super-admin-daily-trips-tracker.tsx` | Single-Day Trip Tracking dashboard (`/dashboard/admin/reports/trips`) | Renders at-a-glance summary table (`daily-glance-summary-table`), TRIP badges with `(orderCount mã đơn • kg • m³)`, side-by-side Inbound vs Outbound tables, and 14-day summary table |
| `frontend/e2e/admin-operational-reports.spec.ts` | End-to-end Playwright test suite for Super Admin Reports, Cronjobs, and Daily Trips | Verifies all 4 core user journeys (`50/50` E2E Auditor score, 117 assertions) |

### Key Patterns Discovered

- **Why `ThrottlerException: Too Many Requests` Occurred on 99-Day Range Runs**: In `@nestjs/throttler`, `ThrottlerGuard` iterates over **every** named throttler in `ThrottlerModule.forRoot` (`default` AND `auth`) for every route unless skipped. Because `auth` had `limit: 15` when `NODE_ENV !== 'development'`, running >15 sequential requests in 60 seconds triggered `ThrottlerException: Too Many Requests`. Scoping `auth` via `skipIf` in `backend/src/app.module.ts` and adding `@SkipThrottle({ default: true, auth: true })` on `AdminReportsController` completely eliminates rate-limit errors during 99-day (or 366-day) sequential runs.
- **True Sequential Day-by-Day Execution with Real-Time Log Creation**: On `/dashboard/admin/cronjobs/DAILY_HUB_OPERATIONAL_REPORT`, selecting a multi-day range (`01/08/2026` → `07/11/2026`, 99 days) splits the range into 99 individual days. Day 1 (`01/08/2026`) runs (`Đang chạy`), completes (`Xong`), immediately prepends its log entry into `Nhật ký thực thi` and updates `Trạng thái dữ liệu`, pauses 80ms for UI paint, and then starts Day 2 (`02/08/2026`).

## Work Completed

### Tasks Finished

- [x] **Task 1**: Removed the `Theo Chi nhánh Kho (20 kho)` breakdown tab from `/dashboard/admin/reports`.
- [x] **Task 2**: Disabled automatic `BACKFILL` / `AUTO_SYNC` on GET in `backend/src/orders/admin-reports.service.ts` so `/dashboard/admin/reports` strictly reflects Cronjob execution results.
- [x] **Task 3**: Built the 2-level Cronjob management architecture (`/dashboard/admin/cronjobs` list with `ON | OFF` switch + `/dashboard/admin/cronjobs/[jobKey]` detail view).
- [x] **Task 4**: Implemented true sequential day-by-day execution (`chạy xong ngày 1, bắt đầu chạy ngày 2`) for large date ranges (`01/08/2026` → `07/11/2026`, 99 days) with real-time per-day log table updates, auto-retry on 429/network hiccups, and `SkipThrottle` + `auth` throttler scoping on Backend.
- [x] **Task 5**: Redesigned `/dashboard/admin/reports/trips` with `daily-glance-summary-table`, TRIP pills with `({orderCount} mã đơn • {weightKg} kg • {volumeCbm} m³)`, side-by-side Inbound/Outbound tables, and 14-day summary table.
- [x] **Task 6**: Verified all 4 E2E flows locally (`4 passed`, `50/50` E2E Auditor score, 117 assertions) and verified multi-day sequential burst execution (`100% HTTP 200 OK, 0 ThrottlerException`).

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `backend/src/app.module.ts` | Added `skipIf: (context) => context.getClass()?.name !== 'AuthController'` on the `auth` throttler and increased `default` limit to `600` | Prevents the 15 req/min `auth` throttler from blocking non-auth controllers in production/cloud environments |
| `backend/src/orders/admin-reports.controller.ts` | Added `@SkipThrottle({ default: true, auth: true })` and `triggeredBy` support (`MANUAL_RANGE` vs `MANUAL_RERUN`) | Guarantees 99-day (up to 366-day) sequential cronjob runs never hit `ThrottlerException: Too Many Requests` |
| `backend/src/orders/admin-reports.service.ts` | Cached `activeHubs` (60s TTL), cached `actorEmail`, guarded `defaultSeeds` with `defaultConfigsSeeded`, increased `daysLimit` max to `366` and `logs` `take` to `200` | Cuts per-day DB roundtrips from 10 down to 3 (~700ms/day over remote DB) and returns all logs/snapshots for 99-day ranges |
| `frontend/src/features/admin-reports/components/super-admin-cronjob-manager.tsx` | Added real-time per-day `data.logs` & `data.dailySnapshots` insertion as each day completes, `activeDayStr` local tracking, `80ms` sequential pacing between days, auto-scroll to active day pill, and 3-attempt retry on 429 | Ensures Day 1 finishes and creates its log row before Day 2 starts, and never leaves a pill stuck in `RUNNING` state |
| `frontend/src/lib/api-error.ts` | Added Vietnamese translation for `ThrottlerException: Too Many Requests` and HTTP `429` | Complies with the Frontend Error Sanitization Rule |
| `frontend/e2e/admin-operational-reports.spec.ts` | Added assertions for sequential day pill completion (`Xong`) and per-day `Chạy tách từng ngày` log entries | Verifies sequential day-by-day execution end-to-end (`50/50` E2E Auditor score) |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Scope `auth` throttler to `AuthController` and add `@SkipThrottle` on `AdminReportsController` | (1) Only add frontend delay between days, (2) Fix backend throttler scoping + frontend sequential state updates + retry | A 99-day range requires 99 sequential requests; fixing backend throttler scoping eliminates the root cause of `ThrottlerException: Too Many Requests` while keeping strict sequential execution (`Day 1 -> Day 2 -> ... -> Day 99`) |
| Prepend `result.log` into `data.logs` immediately after each day's `await apiClient.post(...)` resolves | (1) Refresh logs only after all 99 days finish, (2) Stream each completed day's log row into the UI table immediately after that day finishes | Gives operators immediate visual confirmation that Day 1 finished and its log was created before Day 2 starts |

## Pending Work

## Immediate Next Steps

1. Commit and push the latest `backend` and `frontend` changes to `dev` (or via the feature branch PR workflow) when ready to deploy the `ThrottlerException` and sequential 99-day runner update to Railway Cloud Dev.
2. When the user approves merging the Production release (`dev` -> `master`), merge the 3 open Pull Requests in submodule-first order:
   - First: `logistics-website-backend` PR #27 (`https://github.com/lyquangthai1993/logistics-website-backend/pull/27`)
   - Second: `logistics-website-frontend` PR #38 (`https://github.com/lyquangthai1993/logistics-website-frontend/pull/38`)
   - Third: `logistics-website` PR #24 (`https://github.com/lyquangthai1993/logistics-website/pull/24`)

### Blockers/Open Questions

- None. Local servers (`:4000` and `:4001`) are running and verified with 100% E2E pass (`4 passed`, `50/50` Auditor score).

### Deferred Items

- Local untracked utility files (`CHAY_DONG_BO_DU_PHONG.bat`, `MauBaoCaoSuperAdmin/`, and `screenshot_super_admin_*_verified.png`) remain untracked in the working directory as local reference/evidence artifacts.

## Context for Resuming Agent

## Important Context

- **3 Open Release PRs (`dev` -> `master`) — DO NOT MERGE WITHOUT EXPLICIT USER APPROVAL**:
  - Backend (`logistics-website-backend` PR #27): `https://github.com/lyquangthai1993/logistics-website-backend/pull/27`
  - Frontend (`logistics-website-frontend` PR #38): `https://github.com/lyquangthai1993/logistics-website-frontend/pull/38`
  - Root (`logistics-website` PR #24): `https://github.com/lyquangthai1993/logistics-website/pull/24`
- **Cronjob Report Data Principle**: `/dashboard/admin/reports` reads exclusively from `daily_hub_operational_report`.
- **Submodule-First Git Workflow**: Always commit and push inside `backend/` and `frontend/` submodules first before updating submodule pointers in `root`.

## Assumptions Made

- Assumption 1: When running a multi-day range (`Từ ngày` -> `Đến ngày`, e.g. `01/08/2026` -> `07/11/2026`), each day executes sequentially (`await`) one after another: Day 1 finishes (`Xong`) and creates its log row in `Nhật ký thực thi`, then Day 2 starts (`Đang chạy`).
- Assumption 2: Super Admin report and cronjob endpoints (`AdminReportsController`) are protected by `AuthGuard('jwt')` + `RolesGuard` (`RoleEnum.SUPER_ADMIN`) and skip rate-limiting (`@SkipThrottle`) so large sequential date ranges never fail with HTTP 429.

## Potential Gotchas

- Always pass `-c frontend/playwright.config.ts` when running Playwright E2E tests from the workspace root.
- Ensure local servers (`:4000` and `:4001`) are running via `node scripts/ensure-local-servers.mjs` before running E2E suites or pushing code.

## Environment State

### Tools/Services Used

- Local Servers (Active & Ready):
  - Frontend Local: `http://localhost:4000`
  - Backend Local: `http://localhost:4001`
- Railway Cloud Dev:
  - Frontend Dev: `https://frontend-tms-core-dev.up.railway.app` (Branch `dev`)
  - Backend Dev: `https://backend-tms-core-dev.up.railway.app` (Branch `dev`)
- Railway Cloud Production:
  - Frontend Pro: `https://frontend-tms-core-production.up.railway.app` (Branch `master`)
  - Backend Pro: `https://backend-tms-core-production.up.railway.app` (Branch `master`)

### Active Processes

- NestJS Backend running on `:4001` (HTTP 200)
- Next.js Frontend running on `:4000` (HTTP 307)

### Environment Variables

- `PLAYWRIGHT_BASE_URL`
- `API_URL`
- `GIT_TERMINAL_PROMPT`
- `CI`

## Related Resources

- `backend/src/app.module.ts`
- `backend/src/orders/admin-reports.controller.ts`
- `backend/src/orders/admin-reports.service.ts`
- `frontend/src/features/admin-reports/components/super-admin-cronjob-manager.tsx`
- `frontend/src/lib/api-error.ts`
- `frontend/e2e/admin-operational-reports.spec.ts`
