# Report Data Source and Snapshot Workflow

Apply this workflow to every task that reads, answers, changes, or verifies values shown on reports, charts, KPI cards, status tabs, or report exports.

## Workflow

1. Trace the displayed value to the page's canonical API request and backend query. Preserve the same hub, date range, status, and permission scope as the page.
2. Identify whether that source is live or snapshot-based. Read snapshots through their owning API and include the returned calculatedAt when reporting figures.
3. Refresh data only through a refresh mechanism that belongs to that exact snapshot. If no manual refresh API exists, read the latest snapshot and report its timestamp. Never use another report's sync endpoint as a substitute.
4. Do not recompute report values from raw orders or paginated screen rows when the page uses an existing snapshot or aggregation API.
5. For other report types, use their own canonical API and refresh semantics. If a repeated query has no suitable script, add a small read-only script that calls that API and preserves its filters.

## Warehouse Orders Snapshot

For current values on /dashboard/warehouse/orders, use:

~~~powershell
npm run report:warehouse-orders -- --hub hcm
npm run report:warehouse-orders -- --hub hyn
npm run report:warehouse-orders -- --hub dad
npm run report:warehouse-orders -- --hub all --json
~~~

The CLI dynamically resolves Hub IDs from GET /hubs/active?level=1, then reads the page's snapshot API, GET /warehouse/orders/summary, for INBOUND (Lưu kho) and DRAFT (Đơn nháp). It returns orderCount, quantity (kiện), weightKg, volumeCbm, and calculatedAt. Use a Super Admin account for --hub all.

The WAREHOUSE_HUB_ORDER_TOTALS job refreshes these snapshots every five minutes. There is no public manual refresh endpoint for this snapshot. POST /admin/reports/operational/sync refreshes a different report and must not be used for warehouse-order totals. The CLI reads the latest available snapshot and displays its calculation time.

Authentication uses TMS_ACCESS_TOKEN or TMS_USERNAME plus TMS_PASSWORD; TMS_API_BASE_URL overrides the default Dev API URL.

