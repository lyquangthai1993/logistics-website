# Forensic Audit Report: Milestone 6 — Warehouse & Notifications Standardization

**Work Product**: `frontend/src/features/warehouse/`, `frontend/src/app/dashboard/warehouse/page.tsx`, `frontend/src/features/notifications/`, `frontend/src/app/dashboard/notifications/page.tsx`, `frontend/src/components/ui/notification-card.tsx`
**Profile**: General Project (Development Mode from `ORIGINAL_REQUEST.md`)
**Verdict**: **CLEAN**

---

### Phase Results
- **Hardcoded Test Output Detection**: PASS — 0 hardcoded test mocks, static stub returns, or fake values found in any source files.
- **Facade Implementation Detection**: PASS — Genuine state management with `nuqs`, real API requests via TanStack Query v5 & `apiClient`, and genuine WebSocket lifecycle in `useNotificationSocket`.
- **Pre-populated Artifact Detection**: PASS — No stale logs, fabricated mock fixtures, or pre-computed results.
- **Self-Certifying Tests Check**: PASS — All tests exercise live components, real URLs, and standard HTTP/WS endpoints.
- **Execution Delegation Check**: PASS — Target deliverables are genuinely built within the project's canonical architecture.
- **Toast Localization & API Error Extraction**: PASS — 100% Vietnamese toasts and strict adherence to the `err?.response?.data?.message` API-first error message extraction pattern.
- **Architecture & Component Reuse**: PASS — Canonical `DataTable`, `useDataTable`, `DataTablePagination`, `DataTableToolbar`, `DataTableColumnHeader`, `HydrationBoundary`, and `nuqs` searchParamsCache.
- **Build & Compilation Verification**: PASS — `npx tsc --noEmit` exited with code 0; `npm run build` compiled all 28 dynamic and static Next.js routes with code 0.

---

## 1. Observation

### Warehouse Feature (`src/features/warehouse/` & `/dashboard/warehouse/page.tsx`)
1. **Server Prefetching & Hydration (`components/warehouse-listing.tsx`)**:
   - Lines 30–41: Utilizes `getQueryClient()` to prefetch `tripsQueryOptions(filters)`, total KPI dataset `tripsQueryOptions({ limit: 100 })`, and `activeHubsQueryOptions()`.
   - Wraps client table in `<HydrationBoundary state={dehydrate(queryClient)}>`.
2. **Canonical Table Integration (`components/warehouse-tables/`)**:
   - `index.tsx`: Integrates `useDataTable`, `<DataTable>`, `<DataTableToolbar>`, `<DataTablePagination>` with `columnPinning: { right: ['actions'] }`.
   - `columns.tsx`: Implements `ColumnDef<Trip>[]` with `DataTableColumnHeader` on sortable columns, searchable meta (`id: 'warehouse-search-input'`, `placeholder: 'Tìm theo mã đơn, biển số, tài xế, nhà xe...'`), visible order code link (`/dashboard/orders/${trip.orderId}`), and status badges.
   - `cell-action.tsx`: Action dropdown and quick "Nhận Hàng" button utilizing `useUpdateTripMutation` with API message extraction:
     ```typescript
     const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
     toast.error(apiMessage || 'Không thể cập nhật trạng thái chuyến xe. Vui lòng thử lại.');
     ```
3. **URL State Synchronization (`params.ts`, `use-warehouse-table-filters.tsx`)**:
   - `warehouseSearchParamsCache` manages `page`, `perPage`, `search`, `name`, `hub`, `hubId`, `destinationHub`, `status`, `view`, `sort`.
   - `useWarehouseTableFilters` synchronizes `useQueryStates` seamlessly with both Table and Cards view modes.
4. **Dock Receiving UI (`components/warehouse-inbound-board.tsx`, `components/warehouse-kpi-cards.tsx`)**:
   - KPI cards compute real metrics (Tổng chuyến sắp đến, Xe thuê ngoài, Tổng tải trọng, Tổng thể tích).
   - Inbound Board renders responsive 3-column dock cards with partner vehicle indicators (`🚛 Xe ngoài`).

### Notifications Feature (`src/features/notifications/` & `/dashboard/notifications/page.tsx`)
1. **Real-time WebSocket Gateway (`hooks/use-notification-socket.ts`)**:
   - Implements singleton Socket.IO connection to `${API_URL}/notifications` with JWT auth token and ref counting.
   - On `notification:new`, triggers `queryClient.invalidateQueries({ queryKey: ['notifications'] })` and displays toast notification.
   - Disconnects cleanly when active listeners unmount (`mountCount === 0`).
2. **API Queries & Mutations (`hooks/use-notifications-query.ts`)**:
   - `useNotificationsQuery`: Calls `GET /api/v1/notifications?page=X&limit=Y` with `staleTime: 30000` and `refetchOnWindowFocus: true`.
   - `useUnreadCountQuery`: Calls `GET /api/v1/notifications/unread-count`.
   - `useMarkAsReadMutation`: Calls `PATCH /api/v1/notifications/:id/read`, invalidates `['notifications']`, and shows localized Vietnamese toast with API message extraction fallback.
   - `useMarkAllAsReadMutation`: Calls `PATCH /api/v1/notifications/read-all`, invalidates `['notifications']`, and shows localized toast.
3. **Tab & Pagination URL State (`params.ts`, `hooks/use-notifications-filters.ts`, `components/notifications-page.tsx`)**:
   - Synchronizes `tab` (`all` | `unread` | `read`), `page`, and `perPage` with `nuqs`.
   - Implements accessible Radix tabs (`All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`), "Mark all as read" button, and Next/Prev pagination controls.
4. **Header Popover (`components/notification-center.tsx`)**:
   - Integrates unread badge counter, direct link to `/dashboard/notifications`, "Mark all as read", and scrollable list with `NotificationCard`.

---

## 2. Logic Chain

1. **Empirical Verification of No Hardcoded Mocks**:
   - Ripgrep searches across `src/features/warehouse/` and `src/features/notifications/` for `mock`, `fake`, `dummy`, `fixture` returned 0 matches.
   - All components derive their state directly from `apiClient` or `@tanstack/react-query` query caches.
2. **Compliance with User Language & Error Handling Mandates**:
   - Verified every instance of `toast.` in Milestone 6 files. All user-facing notification strings are in Vietnamese (e.g. `'Đã xác nhận tiếp nhận hàng và hoàn thành chuyến xe!'`, `'Đã đánh dấu thông báo là đã đọc'`).
   - Every error catch block executes `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback');` as required by `ORIGINAL_REQUEST.md`.
3. **Architectural Parity & Reusability**:
   - The warehouse table follows the canonical structure (`useDataTable` + `DataTable` + `DataTableToolbar` + `DataTablePagination`), matching the architectural pattern set by `/dashboard/product` and earlier milestones.
   - `WarehouseListing` fulfills Next.js 15+ App Router Server Component prefetching best practices.
4. **Independent Build and Type Integrity**:
   - Running `npx tsc --noEmit` produced 0 errors.
   - Running `npm run build` completed in 11.1s + 16.1s type check, generating all 28 routes without compile errors or runtime warnings.

---

## 3. Caveats

- In test environments where the backend WebSocket service is not active, `useNotificationSocket` handles `connect_error` gracefully without crashing, and TanStack Query window-focus refetching provides automatic data freshness.
- No schema or backend changes were made; the implementation is strictly frontend-scoped.

---

## 4. Conclusion

The work products delivered for Milestone 6 (Warehouse & Notifications Standardization) are fully authentic, genuine, strictly compliant with project conventions and user rules, and free of any integrity violations.

**Verdict**: **CLEAN**

---

## 5. Verification Method

To independently verify this audit:

1. **TypeScript Typecheck**:
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
   *Verified Output*: Exited with code 0 (all 28 routes generated successfully).

3. **Grep Check for Mock Fixtures & English Error Toasts**:
   ```powershell
   cd d:\Projects\logistics-website\frontend\src\features
   rg "mock|dummy|fake|fixture" warehouse notifications
   ```
   *Verified Output*: 0 matches.
