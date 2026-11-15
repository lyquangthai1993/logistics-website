# Regional Dispatch Future Snapshot Guard

Date: 2026-11-15 (Asia/Saigon)
Scope: Admin regional dispatch report synchronization and live date-range reads.
Status: Completed and verified locally. No cloud deployment requested.

## Backend
- [x] Reject manual regional-dispatch snapshot dates after the current Vietnam operational date.
- [x] Keep report range reads independent from the manual snapshot execution date while excluding stale future snapshots from live mode.
- [x] Bound orders, inventory transactions, drafts, and incoming trips by the snapshot date.
- [x] Aggregate all snapshot rows across a multi-day report range.

## Frontend
- [x] Keep the report filter range separate from the manual snapshot date.

## Testing
- [x] Add regression coverage for default, historical, and future sync dates.
- [x] Pass backend build, targeted lint, frontend typecheck, and local API verification.
