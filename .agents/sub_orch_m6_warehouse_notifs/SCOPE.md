# Scope: Milestone 6 — Warehouse & Notifications Standardization

## Architecture
- Target Pages:
  - `/dashboard/warehouse`: Inbound Hub & Receiving Warehouse (`frontend/src/app/dashboard/warehouse/page.tsx`)
  - `/dashboard/notifications`: System Notifications Center (`frontend/src/app/dashboard/notifications/page.tsx`)
- Feature Folders:
  - `frontend/src/features/warehouse/`
  - `frontend/src/features/notifications/`

## Details
1. **Warehouse (`src/features/warehouse/`)**:
   - Create modular feature structure (`warehouse-listing.tsx`, `components/inbound-tables/` or `components/inbound-board/`)
   - Standardize search and filter parameters with `nuqs` (`hubId`, `search`, `page`, `perPage`)
   - KPI summary cards (Total Inbound, In-Transit, Arrived, Received)
   - Preserve page heading: `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
   - Preserve search input: `input[placeholder*="Tìm theo mã đơn"]`
   - RBAC: `SUPER_ADMIN`, `WAREHOUSE_MANAGER`
2. **Notifications (`src/features/notifications/`)**:
   - Standardize pagination and tab state with `nuqs` (`tab=all|unread|read`, `page`)
   - Preserve Radix tabs, notification cards, mark all as read action, and WebSocket integration
   - 100% Vietnamese toasts & API-first error message extraction
   - Open to all authenticated roles

## Acceptance Criteria
- [x] Both pages standardized with modular feature architectures and `nuqs` search state
- [x] Preserves all E2E locators, headings, tabs, and WebSocket hooks
- [x] `npm run build` in `frontend/` succeeds with 0 TypeScript/compile errors
- [x] Playwright E2E specs `06-order-dispatch-workflow.spec.ts`, `06-notification-system.spec.ts`, and `07-notification-ui-visual.spec.ts` pass 100%

## Status: DONE
- Gate: Iteration 1 PASS (All agents APPROVED, Auditor CLEAN)

