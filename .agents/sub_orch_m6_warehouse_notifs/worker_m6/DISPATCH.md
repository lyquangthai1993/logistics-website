# Dispatch Log

## 2026-08-18T10:08:48Z

You are the Worker for Milestone 6: Warehouse & Notifications Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\worker_m6

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ THESE FIRST:
- ORIGINAL_REQUEST.md: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: d:\Projects\logistics-website\.agents\PROJECT.md
- SCOPE.md: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\SCOPE.md
- Explorer 1 (Warehouse Architecture): d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp1_warehouse\handoff.md
- Explorer 2 (Notifications Architecture): d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp2_notifs\handoff.md
- Explorer 3 (E2E Compatibility Audit): d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp3_e2e\handoff.md

YOUR TASKS:
1. Implement the standardized `src/features/warehouse/` modular feature in `frontend/`:
   - `frontend/src/features/warehouse/params.ts`
   - `frontend/src/features/warehouse/info-content.ts`
   - `frontend/src/features/warehouse/components/warehouse-tables/options.ts`
   - `frontend/src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx`
   - `frontend/src/features/warehouse/components/warehouse-tables/columns.tsx`
   - `frontend/src/features/warehouse/components/warehouse-tables/cell-action.tsx`
   - `frontend/src/features/warehouse/components/warehouse-kpi-cards.tsx`
   - `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx`
   - `frontend/src/features/warehouse/components/warehouse-tables/index.tsx`
   - `frontend/src/features/warehouse/components/warehouse-listing.tsx`
   - `frontend/src/features/warehouse/components/index.ts`
   - `frontend/src/features/warehouse/index.ts`
   - Refactor `frontend/src/app/dashboard/warehouse/page.tsx`
   Ensure exact compliance with Explorer 1 and Explorer 3 specifications:
   - Heading: `Inbound Hub & Kho Tiếp Nhận` (matches `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`)
   - Search placeholder contains `Tìm theo mã đơn`
   - Hub select id `#warehouse-hub-filter`
   - Visible `trip.order?.orderCode` text
   - 4 KPI summary cards (Total Inbound, In-Transit, Arrived, Received)
   - Dual view support (Table with canonical `DataTable` & Card Board view)

2. Standardize `src/features/notifications/` in `frontend/`:
   - `frontend/src/features/notifications/params.ts`
   - `frontend/src/features/notifications/info-content.ts`
   - `frontend/src/features/notifications/hooks/use-notifications-filters.ts`
   - Update `frontend/src/features/notifications/hooks/use-notifications-query.ts`
   - Update `frontend/src/features/notifications/components/notifications-page.tsx`
   - Update `frontend/src/features/notifications/components/notification-center.tsx`
   - `frontend/src/features/notifications/index.ts`
   - Refactor `frontend/src/app/dashboard/notifications/page.tsx`
   Ensure exact compliance with Explorer 2 and Explorer 3 specifications:
   - Tabs with accessible names matching `/all/i`, `/unread/i`, `/read/i` (`All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`)
   - Mark all as read button matching `getByRole('button', { name: /mark all as read/i })`
   - Mark single item button with `aria-label="Mark as read"`
   - Items carry `data-testid="notification-item"`
   - 100% Vietnamese toasts with API error first: `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || '...')`
   - URL synchronization with `nuqs` (`tab`, `page`, `perPage`)

3. Verification:
   - Run `npx tsc --noEmit` in `frontend/`
   - Run `npm run build` in `frontend/`
   - Verify 0 TypeScript / compilation errors.

4. Write your full report to `d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\worker_m6\handoff.md` and send_message back.
