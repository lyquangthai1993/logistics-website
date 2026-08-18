# Handoff Report: Milestone 6 — Warehouse & Notifications Standardization

## 1. Observation
- Successfully implemented the modular `src/features/warehouse/` package and refactored `/dashboard/warehouse/page.tsx`:
  - `frontend/src/features/warehouse/params.ts`: Configured `warehouseSearchParams` with `page`, `perPage`, `search`, `name`, `hub`, `hubId`, `destinationHub`, `status`, `view`, `sort`, along with `warehouseSearchParamsCache` and `warehouseSerialize`.
  - `frontend/src/features/warehouse/info-content.ts`: Infobar guide content `warehouseInfoContent` for warehouse inbound dock management.
  - `frontend/src/features/warehouse/components/warehouse-tables/options.ts`: Defined `DEFAULT_HUBS`, `WAREHOUSE_STATUS_OPTIONS`, and `WAREHOUSE_VIEW_OPTIONS`.
  - `frontend/src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx`: URL synchronization hook with `nuqs` `useQueryStates`.
  - `frontend/src/features/warehouse/components/warehouse-tables/columns.tsx`: Defined table columns with searchable meta (`placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe..."`), visible order code (`trip.order?.orderCode`), status badges, and action cell.
  - `frontend/src/features/warehouse/components/warehouse-tables/cell-action.tsx`: Action dropdown and quick "Nhận Hàng" button with 100% Vietnamese toasts and API-first error message extraction.
  - `frontend/src/features/warehouse/components/warehouse-kpi-cards.tsx`: 4 KPI summary cards (Tổng chuyến sắp đến, Xe thuê ngoài, Tổng tải trọng dự kiến, Tổng thể tích hàng).
  - `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx`: Visual 3-column card board view for dock receiving.
  - `frontend/src/features/warehouse/components/warehouse-tables/index.tsx`: Main client view with `useDataTable`, `DataTable`, `DataTableToolbar`, `DataTablePagination`, Hub dropdown (`id="warehouse-hub-filter"`), and view toggle (Table / Cards).
  - `frontend/src/features/warehouse/components/warehouse-listing.tsx`: Async Server Component prefetching `tripsQueryOptions`, full dataset for KPI metrics, and `activeHubsQueryOptions`.
  - `frontend/src/features/warehouse/components/index.ts` & `frontend/src/features/warehouse/index.ts`: Modular barrel exports.
  - `frontend/src/app/dashboard/warehouse/page.tsx`: Server page wrapping `PageContainer` (`pageTitle="Inbound Hub & Kho Tiếp Nhận"`) and `WarehouseListing`.

- Standardized `src/features/notifications/` and refactored `/dashboard/notifications/page.tsx`:
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

## 2. Logic Chain
1. **URL State Synchronization**: Replacing local `useState` in both Warehouse and Notifications with `nuqs` (`useQueryStates` and server `createSearchParamsCache`) ensures search filters, active tabs, hub selection, view modes, and pagination persist across page reloads and deep links.
2. **E2E Compatibility & Accessibility**:
   - `06-order-dispatch-workflow.spec.ts` requires heading `Inbound Hub & Kho Tiếp Nhận` and input `placeholder*="Tìm theo mã đơn"`. `PageContainer` + `Heading` provides the exact heading role and string, and `columns.tsx` meta sets the placeholder.
   - `06-notification-system.spec.ts` & `07-notification-ui-visual.spec.ts` require accessible tab names matching `/all/i`, `/unread/i`, `/read/i`, header popover string `"Notifications"`, single item mark-as-read `aria-label="Mark as read"`, button `/mark all as read/i`, and items matching `[data-testid="notification-item"]`. All selectors and accessibility contracts were preserved.
3. **Dual View UX**: Integrating both canonical `DataTable` and `WarehouseInboundBoard` behind a seamless toolbar view switcher gives operators the optimal interface for both structured data audits and dock receiving without violating the standardized `DataTable` mandate.
4. **Toast Localization & API Error Fallback**: All mutations follow `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt');` ensuring clear, localized user feedback.

## 3. Caveats
- Real-time notification updates rely on WebSocket gateway when running; if the backend socket is disconnected, TanStack Query `staleTime: 30000` with `refetchOnWindowFocus: true` acts as the reliable fallback.
- No schema or backend changes were required; all work is self-contained in frontend.

## 4. Conclusion
Milestone 6 (Warehouse & Notifications Standardization) is completely implemented, cleanly modularized, and fully verified against TypeScript compilation and Next.js production build.

## 5. Verification Method
1. **TypeScript Type Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Result*: Exited with code 0 (0 errors).
2. **Next.js Production Build**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
   *Result*: Exited with code 0 (all 28 routes compiled successfully, including dynamic `/dashboard/warehouse` and `/dashboard/notifications`).
