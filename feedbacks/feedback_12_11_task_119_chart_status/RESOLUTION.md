# Task 119 follow-up: Regional chart status filters

Date: 2026-11-12 (Asia/Saigon). Implementation and verification are local only. No commit, push, deployment, cloud health check, or cloud E2E was performed.

## Result
Both regional charts remain visible, with weight in kg and volume in m3. Three buttons select stored orders, expected receipts (DRAFT orders), or their sum. Combined is selected initially. The previous chart-collapse action and metric selector were removed.

The existing regional report API now supplies draftRegions: weight and volume grouped by destination region. Deleted orders are excluded; the Hub filter matches currentHubId, falling back to originHubId. Region resolution follows destinationRegion, province, and destinationHub, retaining unresolved orders in the unknown bucket. Stored values use existing onhand metrics and proportional remaining quantities. No migrations or schema changes were made.

A subsequent request removed the regional detail table, its national total row, and its table-only drilldown dialog. Both charts and their status controls remain. Exports, cron snapshots and backend in-transit truck totals retain their existing behavior.

## Validation
- Backend NestJS build: PASS.
- Frontend production build, including TypeScript: PASS.
- Local Playwright: 1/1 PASS; both charts and totals verified for all three buttons against real API responses. Stored-order data was asserted non-empty.
- E2E code audit: 50/50 PASS, no mocks.
- [Verified screenshot](../../frontend/e2e/screenshots/screenshot_regional_status_charts_verified.png).

The original dev server on port 4000 had corrupted generated Next.js route types and returned 404 for existing routes. Generated types were repaired from production generation. Browser verification used separate local production servers without cancelling existing processes.

## Files
- `backend/src/orders/admin-reports.service.ts`
- `frontend/src/features/admin-reports/components/super-admin-regional-dispatch-table.tsx`
- `frontend/e2e/119-regional-dispatch-report.spec.ts`

See [TODO.md](TODO.md) for acceptance criteria.

## Subsequent presentation changes
The regional section heading is now "Tình hình hàng hóa". The monthly line charts were moved above that section, below the global filters and KPI cards. The daily bar chart follows the regional section. The screenshot and E2E result above predate these title/layout-only edits.

Regional bars and numeric labels now use a consistent palette in both charts: North blue, Central amber, South purple, unresolved gray. Status selection and calculations are unchanged.

The user subsequently confirmed removal of both monthly line charts. The monthly parallel-route page and default now render null, and the layout/fallback no longer mount MonthlyOperationalTrendsSlot. Daily bars and regional status charts remain. This supersedes the earlier monthly-chart reordering.

## Latest full-page capture
All subsequent UI changes were verified together: title updated, regional table removed, North/Central/South colors distinct, monthly line charts absent, daily bars retained, all three status filters and kg/m3 totals correct. Frontend build/typecheck PASS; local E2E 1/1 PASS (11.5s) at localhost:4012 against real backend localhost:4002. [Latest 1920px-wide full-page screenshot](../../frontend/e2e/screenshots/screenshot_report_full_updated_verified.png). No cloud deployment performed.

## Release preparation
Canonical local Gate 1 passed at localhost:4000 / localhost:4001: 1/1 Playwright PASS (10.9s). Backend build, frontend production build and TypeScript PASS; targeted frontend lint has 0 warnings/errors; E2E audit 50/50; independent staged security audit PASS. The frontend proof screenshot is tracked in its repository.

Review of the root task branch also removed the unsafe direct-dev merge fallback: a failed GitHub PR workflow now stops with an actionable error. The existing rollback test script now bounds each request at 15 seconds; that mutating fixture test was not run during release preparation. Both scripts passed node --check.

## Submodule release
- Backend: [PR #40](https://github.com/lyquangthai1993/logistics-website-backend/pull/40), merged into dev at `8f431ae`.
- Frontend: [PR #68](https://github.com/lyquangthai1993/logistics-website-frontend/pull/68), merged into dev at `43f958d`.
- GitGuardian checks passed on both PRs. Root pointers track these merged commits. Railway cutover and cloud E2E verification follow the merges; earlier local-only notes describe verification at the time they were recorded.
