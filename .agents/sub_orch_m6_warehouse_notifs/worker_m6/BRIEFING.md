# BRIEFING — 2026-08-18T10:14:00Z

## Mission
Implement Milestone 6: Warehouse Inbound & Notifications Standardization according to Explorer 1, 2, and 3 blueprints, ensuring 100% compliance with E2E tests, zero TypeScript errors, 100% Vietnamese toasts with API error first, and canonical DataTable + nuqs synchronization.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\worker_m6
- Original parent: af93523f-2f4b-4994-a080-d775348bcace
- Milestone: Milestone 6 (Warehouse & Notifications Standardization)

## 🔒 Key Constraints
- DO NOT CHEAT. All implementations must be genuine.
- Strict compliance with Explorer 1, Explorer 2, and Explorer 3 handoffs.
- Heading: `Inbound Hub & Kho Tiếp Nhận`
- Search placeholder contains `Tìm theo mã đơn`
- Hub select id `#warehouse-hub-filter`
- Visible `trip.order?.orderCode`
- 4 KPI summary cards (Total Inbound, In-Transit, Arrived, Received)
- Dual view support (Table with canonical `DataTable` & Card Board view)
- Notifications tabs: accessible names matching `/all/i`, `/unread/i`, `/read/i` (`All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`)
- Mark all as read button matching `getByRole('button', { name: /mark all as read/i })`
- Mark single item button with `aria-label="Mark as read"`
- Notification items carry `data-testid="notification-item"`
- 100% Vietnamese toasts with API error first: `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || '...')`
- URL synchronization with `nuqs`
- Verify 0 TypeScript / compilation errors with `npx tsc --noEmit` and `npm run build`

## Current Parent
- Conversation ID: af93523f-2f4b-4994-a080-d775348bcace
- Updated: 2026-08-18T10:14:00Z

## Task Summary
- **What to build**: Standardized `src/features/warehouse/` package, refactored `/dashboard/warehouse/page.tsx`, standardized `src/features/notifications/` with `use-notifications-filters.ts`, `params.ts`, `info-content.ts`, and updated `/dashboard/notifications/page.tsx`.
- **Success criteria**: Full build success, 0 TypeScript errors, 100% selector and behavior compatibility with E2E tests.

## Key Decisions Made
- Implemented dual-view switcher (Table with canonical `DataTable` & Card Board) in Warehouse feature to satisfy both `ORIGINAL_REQUEST.md` Table standardization and Inbound dock card UX.
- Connected `useUnreadCountQuery()` to header notification badge to display accurate global unread count.
- Added `data-testid="notification-item"` and `cursor-pointer` to `NotificationCard`.
- Maintained 100% Vietnamese toasts with API-first error message extraction across all mutations.

## Change Tracker
- **Files modified**:
  - `frontend/src/features/warehouse/params.ts` (Created)
  - `frontend/src/features/warehouse/info-content.ts` (Created)
  - `frontend/src/features/warehouse/components/warehouse-tables/options.ts` (Created)
  - `frontend/src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-tables/columns.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-tables/cell-action.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-kpi-cards.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-tables/index.tsx` (Created)
  - `frontend/src/features/warehouse/components/warehouse-listing.tsx` (Created)
  - `frontend/src/features/warehouse/components/index.ts` (Created)
  - `frontend/src/features/warehouse/index.ts` (Created)
  - `frontend/src/app/dashboard/warehouse/page.tsx` (Refactored)
  - `frontend/src/features/notifications/params.ts` (Created)
  - `frontend/src/features/notifications/info-content.ts` (Created)
  - `frontend/src/features/notifications/hooks/use-notifications-filters.ts` (Created)
  - `frontend/src/features/notifications/hooks/use-notifications-query.ts` (Updated)
  - `frontend/src/features/notifications/components/notifications-page.tsx` (Updated)
  - `frontend/src/features/notifications/components/notification-center.tsx` (Updated)
  - `frontend/src/features/notifications/index.ts` (Created)
  - `frontend/src/app/dashboard/notifications/page.tsx` (Refactored)
  - `frontend/src/components/ui/notification-card.tsx` (Updated for testid & a11y)
  - `frontend/src/components/icons.tsx` (Added icon exports)
- **Build status**: Pass (`npx tsc --noEmit` code 0, `npm run build` code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (0 errors)
- **Lint status**: 0 violations
- **Tests added/modified**: Verified compliance with E2E locators and workflows

## Loaded Skills
- `tms-domain-lead`: Business domain knowledge for dispatch, warehouse inbound and notifications
- `nextjs-best-practices`: Next.js 15+ App Router, nuqs, TanStack Query v5, Zustand
- `shadcn-ui-patterns`: Radix UI, Tailwind CSS, DataTable, Sonner toasts
