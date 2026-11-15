# Regional Dispatch Date Range and Warehouse Status Parity

Date: 2026-11-12 (Asia/Saigon)
Scope: `/dashboard/admin/reports`, regional dispatch snapshot cronjob, and `/dashboard/warehouse/orders` status filters.
Status: Verified locally. No cloud deployment requested.

## Backend
- [x] Extend the regional dispatch API to accept `fromDate`, `toDate`, and `hubId`, and return per-day snapshots without relabeling current inventory as future history.
- [x] Persist daily draft metrics and the order codes counted for stored and draft statuses.
- [x] Match warehouse hub stock and draft visibility semantics in regional dispatch snapshots.
- [x] Add the TypeORM migration and document the database sync behavior.

## Frontend
- [x] Pass the shared report header date range and hub selection to the regional dispatch API.
- [x] Render the per-day series and stored/draft order codes for the selected snapshot.

## Testing
- [x] Backend build and frontend typecheck pass.
- [x] Regional dispatch Playwright E2E passes, including filter query assertions.
- [x] Capture the real application screenshot at `frontend/e2e/screenshots/screenshot_regional_dispatch_range_verified.png`.
- [x] Confirm the unauthenticated Railway API probe returns 401; no authenticated cloud verification or deployment was performed.
