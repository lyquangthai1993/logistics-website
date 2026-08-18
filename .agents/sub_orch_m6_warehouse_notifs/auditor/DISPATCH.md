## 2026-08-18T10:20:20Z

You are the Forensic Auditor for Milestone 6: Warehouse & Notifications Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\auditor

Your objective:
1. Conduct exhaustive forensic audit on all files created/modified for Milestone 6.
2. Check for ANY integrity violations:
   - Hardcoded test outputs or return values tailored only to pass specific test scripts
   - Facade or dummy implementations that pretend to handle real data but do not
   - Bypassing TanStack Query or `apiClient` with fake responses
   - Fabricated logs or fake build/test reports
   - Circumvention of Vietnamese toast requirements or API error message extraction
3. Confirm genuine implementation of:
   - Server Component prefetching and hydration in `warehouse-listing.tsx`
   - Canonical `DataTable` with `useDataTable`, `columns.tsx`, `DataTablePagination`, and `DataTableToolbar`
   - Real-time WebSocket connection and invalidation in `useNotificationSocket`
   - Two-way URL synchronization with `nuqs`
4. Deliver your explicit binary verdict: CLEAN or INTEGRITY VIOLATION.
5. Write your complete forensic audit report to `d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\auditor\handoff.md` and send_message back with your verdict.
