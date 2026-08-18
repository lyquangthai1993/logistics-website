# Sub-Orchestrator Handoff: Milestone 6 — Warehouse & Notifications Standardization

**Author**: Sub-Orchestrator Milestone 6  
**Parent**: Project Orchestrator (`da3a6444-1710-4a89-97ca-8016778ec18e`)  
**Scope**: `/dashboard/warehouse` (`src/features/warehouse/`) & `/dashboard/notifications` (`src/features/notifications/`)  
**Date**: 2026-08-18  
**Status**: **COMPLETED (Gate Result: PASS)**  

---

## 1. Observation
- Successfully standardized and modularized both Phase 2 data listing pages in `frontend/`:
  1. **Warehouse Feature (`src/features/warehouse/`)**:
     - `frontend/src/features/warehouse/params.ts`: Configured `warehouseSearchParams` with `page`, `perPage`, `search`, `name`, `hub`, `hubId`, `destinationHub`, `status`, `view`, `sort`, along with `warehouseSearchParamsCache` and `warehouseSerialize`.
     - `frontend/src/features/warehouse/info-content.ts`: Infobar guide content `warehouseInfoContent` for dock receiving operations.
     - `frontend/src/features/warehouse/components/warehouse-tables/options.ts`: Hub, status, and view options.
     - `frontend/src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx`: URL synchronization hook with `nuqs` `useQueryStates`.
     - `frontend/src/features/warehouse/components/warehouse-tables/columns.tsx`: Defined table columns with searchable meta (`placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe..."`), visible order code (`trip.order?.orderCode`), status badges, and action cell.
     - `frontend/src/features/warehouse/components/warehouse-tables/cell-action.tsx`: Action dropdown and quick "Nhận Hàng" button with 100% Vietnamese toasts and API-first error message extraction.
     - `frontend/src/features/warehouse/components/warehouse-kpi-cards.tsx`: 4 KPI summary cards (Tổng chuyến sắp đến, Xe thuê ngoài, Tổng tải trọng dự kiến, Tổng thể tích hàng).
     - `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx`: Visual 3-column card board view for dock receiving.
     - `frontend/src/features/warehouse/components/warehouse-tables/index.tsx`: Main client view with `useDataTable`, `DataTable`, `DataTableToolbar`, `DataTablePagination`, Hub dropdown (`id="warehouse-hub-filter"`), and view toggle (Table / Cards).
     - `frontend/src/features/warehouse/components/warehouse-listing.tsx`: Async Server Component prefetching `tripsQueryOptions`, full dataset for KPI metrics, and `activeHubsQueryOptions`.
     - `frontend/src/features/warehouse/components/index.ts` & `frontend/src/features/warehouse/index.ts`: Modular barrel exports.
     - `frontend/src/app/dashboard/warehouse/page.tsx`: Server page wrapping `PageContainer` (`pageTitle="Inbound Hub & Kho Tiếp Nhận"`) and `WarehouseListing`.

  2. **Notifications Feature (`src/features/notifications/`)**:
     - `frontend/src/features/notifications/params.ts`: `notificationsSearchParams` with `tab` (`all` | `unread` | `read`), `page`, `perPage`, and cache serializer.
     - `frontend/src/features/notifications/info-content.ts`: `notificationsInfoContent` for Infobar documentation.
     - `frontend/src/features/notifications/hooks/use-notifications-filters.ts`: Hook for URL parameter management with `nuqs`.
     - `frontend/src/features/notifications/hooks/use-notifications-query.ts`: Queries and mutations with 100% Vietnamese toasts and API-first error extraction.
     - `frontend/src/features/notifications/components/notifications-page.tsx`: Full notifications page with accessible tabs (`All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`), "Mark all as read" button, pagination controls, and WebSocket singleton connection.
     - `frontend/src/features/notifications/components/notification-center.tsx`: Header bell popover with accurate unread badge (`useUnreadCountQuery()`), "Mark all as read", and scrollable list.
     - `frontend/src/features/notifications/index.ts`: Barrel exports.
     - `frontend/src/app/dashboard/notifications/page.tsx`: Server page with `Suspense` and `notificationsSearchParamsCache`.
     - `frontend/src/components/ui/notification-card.tsx`: Added `data-testid="notification-item"` and `cursor-pointer`.
     - `frontend/src/components/icons.tsx`: Registered `eye`, `copy`, `refresh`, `table`, `layoutGrid`, `box` icons.

---

## 2. Logic Chain
1. **Canonical Architecture Parity**: Adopting `useDataTable` + `DataTable` + `DataTableToolbar` + `DataTablePagination` aligns `/dashboard/warehouse` with the canonical standard established in M1–M5 (`/dashboard/hubs`, `/dashboard/fleet`, `/dashboard/orders`, `/dashboard/trips`, `/dashboard/users`).
2. **URL State Synchronization**: Replacing raw local `useState` in both pages with `nuqs` provides real-time URL state synchronization (`search`, `hub`, `status`, `view`, `tab`, `page`, `perPage`) that survives refresh and enables bookmarking.
3. **E2E & RBAC Preservation**:
   - `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })` -> Preserved via `PageContainer`.
   - `input[placeholder*="Tìm theo mã đơn"]` -> Preserved via `columns.tsx` filter meta.
   - `#warehouse-hub-filter` -> Preserved on Hub filter select element.
   - `getByRole('tab', { name: /all/i })`, `/unread/i`, `/read/i` -> Preserved on Radix Tabs.
   - `getByRole('button', { name: /mark all as read/i })` -> Preserved.
   - `[data-testid="notification-item"]` -> Preserved on `NotificationCard`.
   - `aria-label="Mark as read"` -> Preserved on individual notification checkmark.
   - RBAC rules in `src/proxy.ts` and `src/config/nav-config.ts` confirmed (`SUPER_ADMIN`, `WAREHOUSE_MANAGER` for warehouse; all authenticated roles for notifications).
4. **Toast Localization & API Error Fallback**: All mutations follow `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt');`.

---

## 3. Multi-Agent Iteration & Gate Review Verdicts
| Agent | Role | Verdict | Key Evidence |
|---|---|---|---|
| exp1_warehouse | Explorer (Warehouse) | COMPLETED | Full 12-file modular architecture designed |
| exp2_notifs | Explorer (Notifications) | COMPLETED | URL state sync & Vietnamese toast blueprint |
| exp3_e2e | Explorer (E2E Compatibility) | COMPLETED | Cataloged all E2E locators & selectors |
| worker_m6 | Worker | DONE | Implemented all files, `npm run build` code 0 |
| reviewer1_code | Reviewer (Code Quality) | **APPROVE** | Clean modular design, 0 lint/type issues |
| reviewer2_e2e | Reviewer (E2E & RBAC) | **APPROVE** | 100% locators & Vietnamese toasts verified |
| challenger1 | Challenger (Logic & Stress) | **APPROVE** | 43/43 empirical stress test assertions passed |
| challenger2 | Challenger (Build & E2E) | **APPROVE** | Full build & DOM selector validation passed |
| auditor | Forensic Auditor | **CLEAN** | 0 hardcoded mocks, 100% authentic logic |

**Final Gate Result**: **PASS**

---

## 4. Caveats
- Real-time WebSocket connection handles offline backend gracefully via TanStack Query window-focus refetching fallback.
- No backend schema or migration changes were required.

---

## 5. Verification Method & Commands
1. **TypeScript Type Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Verified Output*: Exited with code 0 (0 errors).

2. **Next.js Production Build**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
   *Verified Output*: Exited with code 0 (all 28 routes compiled dynamically and statically).
