# Task 119 follow-up: Regional chart order status filters

Date: 2026-11-12 (Asia/Saigon)
Scope: Regional dispatch charts on /dashboard/admin/reports.
Status: Verified locally. No cloud deployment requested.

## Requirements
- Always render both volume (m3) and weight (kg) charts.
- Replace metric selection with Stored / Expected receipts / Combined buttons.
- Default to Combined. Expected receipts must include DRAFT orders, not in-transit truck totals.
- Remove the regional detail table, its national total row and table-only drilldown actions, per the follow-up screenshot. Keep exports and snapshot business rules unchanged.

## Implementation
- [x] Frontend: update `frontend/src/features/admin-reports/components/super-admin-regional-dispatch-table.tsx` to derive chart totals and regional shares from the selected status.
- [x] Backend: extend the existing report response in `backend/src/orders/admin-reports.service.ts` with draft order weights and volumes by destination region, excluding deleted orders and respecting the Hub filter.
- [x] Testing: backend build and frontend production build including TypeScript pass.
- [x] Testing: `frontend/e2e/119-regional-dispatch-report.spec.ts` audits at 50/50 with no mocks.
- [x] Testing: browser verification of default selection, both charts, and totals for all three states against live API data.

## Verification notes
The local dev server on port 4000 had corrupted generated Next.js route types and returned 404 for existing pages. Generated types were restored from production type generation. Browser verification uses a production frontend and the freshly built backend on separate local ports without cancelling existing servers.

## Data rules
Stored values use existing onhand metrics, including proportional remaining weight and volume. Draft values sum real DRAFT order totalWeight and totalVolume. Hub scoping uses currentHubId, falling back to originHubId for draft orders. Destination region resolves from destinationRegion, then province, then destinationHub; unresolved rows remain in the unknown-region bucket. Combined charts sum the stored and draft buckets. No schema changes or migrations.

Local E2E: 1/1 PASS (10.4s), production frontend localhost:4010 and rebuilt backend localhost:4002. Audit: 50/50 PASS. Evidence: `frontend/e2e/screenshots/screenshot_regional_status_charts_verified.png`. No deployment or cloud verification performed.

Follow-up removal verified: regional detail table and national total row are absent; both charts and all three status buttons continue to pass E2E.

Release Gate 1 rerun: localhost:4000 / localhost:4001, 1/1 E2E PASS (10.9s), audit 50/50. Frontend and backend builds PASS.
