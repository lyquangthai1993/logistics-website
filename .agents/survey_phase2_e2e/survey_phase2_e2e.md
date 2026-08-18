# Phase 2 Pages and E2E Test Suite Survey Report

**Author**: Teamwork Explorer (Survey Phase 2 & E2E)  
**Date**: 2026-08-18  
**Scope**: 
1. Phase 2 Data Listing Pages: `/dashboard/warehouse`, `/dashboard/notifications`
2. E2E Test Infrastructure & All 12 Playwright Spec Suites (`frontend/e2e/`)
3. Breaking Change Risk Analysis for Canonical `DataTable` (`@tanstack/react-table` + `nuqs`) refactoring

---

## 1. Executive Summary

This report delivers an exhaustive audit of the **Phase 2 data listing pages** and the **entire E2E Playwright test suite** within `frontend/`. 

### Key Discoveries:
1. **Phase 2 Listing Pages Current State**:
   - `/dashboard/warehouse`: Currently implemented as a card grid (`WarehouseInboundPage`) rendering incoming confirmed/in-transit trips with KPI summary metrics. There is no dedicated `src/features/warehouse/` feature folder (it reuses `src/features/trips/api.ts`).
   - `/dashboard/notifications`: Implemented as a card-based feed with Radix Tabs (`All`, `Unread`, `Read`) and a custom prev/next button pagination bar. The feature is located in `src/features/notifications/` backed by TanStack Query (`use-notifications-query.ts`) and WebSocket (`use-notification-socket.ts`).
2. **E2E Test Infrastructure**:
   - 12 Playwright test specs reside in `frontend/e2e/`, configured via `frontend/playwright.config.ts` and supported by `frontend/e2e/helpers/auth.ts`.
   - Test suites span across critical operational workflows (Login, RBAC routing, Fleet CRUD with Token Auto-refresh, Order Dispatch -> Fleet Trip -> Warehouse Inbound, Hubs Management, Avatar upload, Notification System, and visual documentation captures).
3. **DataTable Refactoring Breaking Change Risks**:
   - Playwright specs rely on specific DOM structures (`table`, `tr`, `td`), specific `data-testid` attributes on row action buttons, specific HTML `#id` attributes on search/form elements, and precise text strings in headings, badges, and placeholders.
   - Refactoring to canonical `DataTable` (`src/components/ui/table/data-table.tsx` + `DataTableToolbar` + `DataTablePagination`) will succeed seamlessly provided the compatibility requirements identified in this report are preserved.

---

## 2. Phase 2 Pages Deep Dive

### 2.1. Page: `/dashboard/warehouse` (Inbound Hub & Kho Tiếp Nhận)

#### A. File & Component Architecture
- **Route File**: `frontend/src/app/dashboard/warehouse/page.tsx` (Lines 1–331)
- **Component**: `WarehouseInboundPage` (`'use client'`)
- **Feature Folder**: Currently **no dedicated** `src/features/warehouse/` folder exists.
- **Dependencies & APIs**:
  - Reuses `tripsApi` and `Trip` type from `frontend/src/features/trips/api.ts`.
  - Calls `tripsApi.getTrips({ limit: 100 })`.
  - Filters client-side for `t.status === 'CONFIRMED' || t.status === 'IN_TRANSIT'`.
- **RBAC Enforcement**:
  - **Nav Config** (`src/config/nav-config.ts` L59–66):
    ```typescript
    {
      title: 'Inbound Kho',
      url: '/dashboard/warehouse',
      icon: 'warehouse',
      shortcut: ['w', 'h'],
      isActive: false,
      items: [],
      access: { role: 'SUPER_ADMIN,WAREHOUSE_MANAGER' }
    }
    ```
  - **Proxy/Middleware Guard** (`src/proxy.ts` L10):
    `'/dashboard/warehouse': ['SUPER_ADMIN', 'WAREHOUSE_MANAGER']`

#### B. Current UI & Data Flow
1. **Header**: Title `"Inbound Hub & Kho Tiếp Nhận"`, description, and "Làm mới dữ liệu" refresh button.
2. **KPI Metric Cards** (4 cards):
   - *Tổng chuyến sắp đến*: `metrics.totalTrips`
   - *Xe thuê ngoài (Đối tác)*: `metrics.externalTrips` (amber badge)
   - *Tổng tải trọng dự kiến*: `metrics.totalWeight.toLocaleString()` kg
   - *Tổng thể tích hàng*: `metrics.totalVolume` m³
3. **Filter & Search Bar**:
   - Search input: `placeholder='Tìm theo mã đơn, biển số, tài xế, nhà xe...'`
   - Destination Hub dropdown selector: `id='warehouse-hub-filter'`, options for `ALL` and 5 seeded hubs (`Andromeda Hub (Hà Nội)`, `Magellan Hub (Đà Nẵng)`, `Centaurus Hub (TP.HCM)`, `Pegasus Hub (Cần Thơ)`, `Vela Hub (Hải Phòng)`).
4. **Data Presentation**:
   - Card grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
   - Each card displays: Order Code (`trip.order?.orderCode`), Trip sequence (`trip.sequenceNumber`), External vehicle badge (`🚛 Xe ngoài`), Status badge (`Đã xác nhận` / `Đang chạy`), Origin & Destination Hub route, Vehicle license plate & partner provider, Driver name & phone, Cargo payload (weight & volume), Estimated delivery date (`trip.estimatedDeliveryDate`).

#### C. Canonical DataTable Refactoring Blueprint for Warehouse
To align `/dashboard/warehouse` with the canonical TanStack Table architecture:
1. Create `src/features/warehouse/` with modular structure:
   - `src/features/warehouse/api/` (queries, service wrapping trips/warehouse inbound)
   - `src/features/warehouse/components/warehouse-tables/`
     - `columns.tsx`: Define `ColumnDef<Trip>[]` with sortable headers for Order Code, Trip Sequence, Origin/Destination Hubs, Vehicle Plate / External Badge, Driver, Payload (Weight & Volume), Estimated Delivery Date, Status.
     - `index.tsx`: Integrate `useDataTable`, `DataTable`, `DataTableToolbar`, `DataTablePagination`.
     - `options.ts`: Hub faceted filter options.
2. Preserve Top KPI Summary Cards above the `DataTable`.
3. Preserve Search input placeholder matching `Tìm theo mã đơn` for E2E spec compatibility.

---

### 2.2. Page: `/dashboard/notifications` (System Notifications)

#### A. File & Component Architecture
- **Route File**: `frontend/src/app/dashboard/notifications/page.tsx` (Lines 1–10)
- **Component**: `NotificationsPage` imported from `frontend/src/features/notifications/components/notifications-page.tsx` (Lines 1–135)
- **Feature Directory**: `frontend/src/features/notifications/`
  - `components/notifications-page.tsx`: Full notification management page
  - `components/notification-center.tsx`: Top navbar popover bell dropdown
  - `hooks/use-notifications-query.ts`: TanStack Query hooks & API client calls
  - `hooks/use-notification-socket.ts`: WebSocket client connection (`/notifications` namespace)
- **Shared UI Component**: `frontend/src/components/ui/notification-card.tsx` (NotificationCard with color themes, action buttons, mark as read)
- **RBAC Enforcement**:
  - Open to all authenticated roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
  - Located under Account navigation group in `src/config/nav-config.ts` (L183–187).

#### B. Types & API Layer
- **Types** (`use-notifications-query.ts` L6–23):
  ```typescript
  export type NotificationItem = {
    id: number;
    userId: number;
    title: string;
    body: string;
    type: 'WAREHOUSE' | 'FLEET' | 'DISPATCHER' | 'GENERIC';
    isRead: boolean;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  ```
- **API Endpoints**:
  - `GET /api/v1/notifications?page={page}&limit={limit}` (Paginated notifications)
  - `GET /api/v1/notifications/unread-count` (Badge counter)
  - `PATCH /api/v1/notifications/{id}/read` (Mark single notification as read)
  - `PATCH /api/v1/notifications/read-all` (Mark all notifications as read)
- **WebSocket Gateway**:
  - Socket.IO connection to `NEXT_PUBLIC_API_URL/notifications` with JWT handshake token.
  - Automatically invalidates query key `['notifications']` on incoming `notification:new` events.

#### C. Current UI & Data Flow
1. `PageContainer` with title `"Notifications"`, description, and optional header action `"Mark all as read"` button (`unreadCount > 0`).
2. Radix Tabs: `All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`.
3. Filtered card list rendering `NotificationCard` items.
4. Custom Prev/Next Pagination Bar (`page <= 1`, `page >= totalPages`).

#### D. Canonical DataTable Refactoring Blueprint for Notifications
1. Keep the high-fidelity feed / tabular view options:
   - Provide a `DataTable` representation with columns:
     - `type`: Badge/Icon (`DISPATCHER`, `FLEET`, `WAREHOUSE`, `GENERIC`)
     - `title`: Notification title & unread dot indicator
     - `body`: Notification text / description
     - `createdAt`: Formatted relative time (`DataTableColumnHeader` sortable)
     - `status`: Badge (`Read` / `Unread`) with filter options
     - `actions`: Mark as read button (`Icons.check`), view action button
2. Leverage `useDataTable` with `useNotificationsQuery` server-side pagination (`page`, `perPage`).
3. Retain Tabs (`all`, `unread`, `read`) or integrate them as faceted filters in `DataTableToolbar` while keeping accessible tab triggers for E2E tests.

---

## 3. E2E Test Infrastructure & Test Suite Inventory

### 3.1. Infrastructure Overview
- **Config**: `frontend/playwright.config.ts`
  - `testDir`: `./e2e`
  - `baseURL`: `http://localhost:3000`
  - `timeout`: `30_000ms`, `expect`: `8_000ms`
  - Browser: Chromium (Desktop Chrome)
  - Reporter: `list`, `html`, `json`
- **Helpers**: `frontend/e2e/helpers/auth.ts`
  - `TEST_USERS`: Seed credentials for all 4 roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
  - `loginAs(page, creds)`: Navigates to `/auth/sign-in`, fills `input[name="email"]`, `input[name="password"]`, clicks `button[type="submit"]`, waits for `/dashboard/*`.
  - `clearSession(page)`: Clears cookies and local/session storage.
  - `collectConsoleLogs(page)`: Collects browser errors and warnings.

---

### 3.2. Inventory of All 12 Playwright Spec Files

| # | Spec File | Purpose & Role | Key Routes Tested | Critical Selectors Used |
|---|---|---|---|---|
| 01 | `01-console-health.spec.ts` | Browser console error inspector | `/auth/sign-in`, `/` | `page.goto()`, `collectConsoleLogs()` |
| 02 | `02-login-flow.spec.ts` | Login UI & per-role authentication validator | `/auth/sign-in`, `/dashboard/overview` | `input[name="email"]`, `input[name="password"]`, `button[type="submit"]`, `[data-testid="login-error"]` |
| 03 | `03-rbac-routing.spec.ts` | Middleware RBAC route access validator | `/dashboard/admin`, `/dashboard/orders`, `/dashboard/trips`, `/dashboard/fleet`, `/dashboard/warehouse` | `page.goto()`, `page.waitForURL()` |
| 04 | `04-fleet-crud-and-refresh.spec.ts` | Fleet CRUD (Vehicle & Driver) + 65s Token Auto-refresh | `/dashboard/fleet` | `heading: "Quản Lý Đội Xe"`, `table`, `tr`, `#btn-add-vehicle`, `#btn-add-driver`, `button[data-testid^="btn-edit-vehicle-"]`, `button[data-testid^="btn-delete-vehicle-"]`, `button[data-testid^="btn-edit-driver-"]`, `button[data-testid^="btn-delete-driver-"]`, `#fleet-search-input`, `#delete-confirm-dialog`, `#btn-confirm-delete` |
| 05 | `05-profile-avatar.spec.ts` | Profile avatar upload & removal flow | `/dashboard/profile` | `input[type="file"]`, `button: "Lưu thay đổi"`, `button: "Hủy"`, `button: "Xóa ảnh"` |
| 06 | `06-notification-system.spec.ts` | Notification bell, popover, page, REST API & WebSocket | `/dashboard/notifications`, Header Bell | `button[aria-label="Notifications"]`, `role='tab' ("All", "Unread", "Read")`, `button: "Mark all as read"`, `[class*="notification"]`, `[data-testid="notification-item"]` |
| 06b| `06-order-dispatch-workflow.spec.ts` | Complete Dispatcher -> Fleet -> Warehouse E2E operational workflow | `/dashboard/orders`, `/dashboard/trips`, `/dashboard/warehouse` | `heading: "Lập Lệnh Điều Vận"`, `button: "Tạo lệnh điều vận mới"`, `#order-code-input`, `button: "Gửi Fleet"`, `[data-testid="btn-assign-order-*"]`, `#select-trip-vehicle`, `button: "Danh Sách Chuyến Xe"`, `button: "Xác nhận Trip"`, `heading: "Inbound Hub & Kho Tiếp Nhận"`, `input[placeholder*="Tìm theo mã đơn"]` |
| 07 | `07-capture-user-guide-screenshots.spec.ts` | Documentation screenshot capture for all 4 roles | Orders, Trips, Fleet, Warehouse | Forms, Modals, Split controls, Trip confirmation |
| 07b| `07-notification-ui-visual.spec.ts` | Visual verification of notification UI & tabs | `/dashboard/notifications`, Popover | Header badge, Popover dialog, Tabs All/Unread/Read, `button: "Mark as read"` |
| 08 | `08-check-vercel-vs-local-signin.spec.ts` | Vercel deployment demo accounts check | Vercel sign-in | `button: "Xem tài khoản Demo"` |
| 09 | `09-check-localhost-signin.spec.ts` | Localhost sign-in demo accounts check | Localhost sign-in | `button: "Xem tài khoản Demo"` |
| 10 | `10-hubs-management.spec.ts` | Hubs listing, search, create modal & Fleet vehicle Hub select | `/dashboard/admin/hubs`, `/dashboard/fleet` | `h2: "Quản Lý Chi Nhánh Kho"`, `text=Andromeda Hub`, `#hub-search-input`, `#btn-add-hub`, `#hub-form-dialog`, `#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `button: "Thêm Chi Nhánh"`, `#select-current-hub` |

---

## 4. E2E Selector Audit & Table Interaction Matrix

The following matrix documents **every DOM selector** used in existing E2E specs that touches tables, toolbars, search, filters, and row actions:

```
┌───────────────────────────┬────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────┐
│ Target Area               │ Exact Selector Used in Spec                            │ Spec Reference                           │
├───────────────────────────┼────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ Table Root                │ page.locator('table')                                                  │ 04-fleet-crud-and-refresh.spec.ts:31     │
│ Table Rows                │ page.locator('tr', { hasText: '...' })                                 │ 04-fleet-crud-and-refresh.spec.ts:53,95 │
│                           │ page.locator('tr:has-text("...")')                                     │ 06-order-dispatch-workflow.spec.ts:85,97 │
│ Row Edit Vehicle          │ vehicleRow.locator('button[data-testid^="btn-edit-vehicle-"]')         │ 04-fleet-crud-and-refresh.spec.ts:54     │
│ Row Delete Vehicle        │ updatedRow.locator('button[data-testid^="btn-delete-vehicle-"]')       │ 04-fleet-crud-and-refresh.spec.ts:63     │
│ Row Edit Driver           │ driverRow.locator('button[data-testid^="btn-edit-driver-"]')           │ 04-fleet-crud-and-refresh.spec.ts:96     │
│ Row Delete Driver         │ updatedDriverRow.locator('button[data-testid^="btn-delete-driver-"]') │ 04-fleet-crud-and-refresh.spec.ts:105    │
│ Row Assign Order (Trips)  │ page.locator('[data-testid="btn-assign-order-${orderCode}"]')          │ 06-order-dispatch-workflow.spec.ts:64    │
│ Row Send to Fleet (Orders)│ row.locator('button:has-text("Gửi Fleet")')                           │ 06-order-dispatch-workflow.spec.ts:50    │
│ Row Confirm Trip (Trips)  │ page.locator('tr:has-text("...") button:has-text("Xác nhận Trip")')   │ 06-order-dispatch-workflow.spec.ts:85    │
│ Fleet Search Input        │ page.locator('#fleet-search-input')                                    │ 04-fleet-crud-and-refresh.spec.ts:121    │
│ Hub Search Input          │ page.locator('#hub-search-input')                                      │ 10-hubs-management.spec.ts:29            │
│ Warehouse Search Input    │ page.fill('input[placeholder*="Tìm theo mã đơn"]', orderCode)          │ 06-order-dispatch-workflow.spec.ts:110   │
│ Driver Tab Trigger        │ page.click('#tab-drivers')                                             │ 04-fleet-crud-and-refresh.spec.ts:72     │
│ Trips Tab Trigger         │ page.click('button:has-text("Danh Sách Chuyến Xe")')                   │ 06-order-dispatch-workflow.spec.ts:80    │
│ Notification Tabs         │ page.getByRole('tab', { name: /all/i }) / unread / read                │ 06-notification-system.spec.ts:206-207   │
│ Notification Mark All Read│ page.getByRole('button', { name: /mark all as read/i })                │ 06-notification-system.spec.ts:231       │
│ Notification Mark Single  │ page.getByRole('button', { name: /mark as read/i })                    │ 07-notification-ui-visual.spec.ts:143    │
│ Add Vehicle Modal Trigger │ page.click('#btn-add-vehicle')                                         │ 04-fleet-crud-and-refresh.spec.ts:39     │
│ Add Driver Modal Trigger  │ page.click('#btn-add-driver')                                          │ 04-fleet-crud-and-refresh.spec.ts:82     │
│ Add Hub Modal Trigger     │ page.click('#btn-add-hub')                                             │ 10-hubs-management.spec.ts:41            │
│ Create Order Trigger      │ page.click('button:has-text("Tạo lệnh điều vận mới")')                 │ 06-order-dispatch-workflow.spec.ts:28    │
└───────────────────────────┴────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 5. Breaking Change Risk Analysis for Canonical DataTable Refactoring

When converting data listing pages (both Phase 1 and Phase 2) from custom table markup to canonical `DataTable` (`src/components/ui/table/data-table.tsx` + `useDataTable` + `DataTableToolbar` + `DataTablePagination`), the following **6 potential breaking points** must be guarded against:

### Risk 1: Missing HTML `<table>`, `<tr>`, `<td>` Elements
- **Mechanism**: If a page is refactored into a `div`-based list or grid without rendering semantic `<table>` elements, tests asserting `page.locator('table')` and `page.locator('tr', { hasText: ... })` will fail.
- **Safeguard**: The project's canonical `DataTable` (`src/components/ui/table/data-table.tsx`) uses Radix / Shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, which compiles directly to HTML `<table>`, `<tr>`, `<td>`. This provides native backward compatibility.

### Risk 2: Lost Action Button `data-testid` Attributes in `CellAction`
- **Mechanism**: E2E tests target buttons via:
  - `button[data-testid^="btn-edit-vehicle-"]`
  - `button[data-testid^="btn-delete-vehicle-"]`
  - `button[data-testid^="btn-edit-driver-"]`
  - `button[data-testid^="btn-delete-driver-"]`
  - `[data-testid="btn-assign-order-${orderCode}"]`
- **Safeguard**: When implementing `CellAction` components (or column cell renderers), every interactive edit, delete, or assign button **must carry the exact `data-testid` pattern** containing the entity's ID or code.

### Risk 3: Toolbar Filter Inputs Lacking Specific `#id` Attributes
- **Mechanism**: Canonical `DataTableToolbarFilter` renders an `<Input />` with `aria-label` and `placeholder`. However, `10-hubs-management.spec.ts` strictly queries `page.locator('#hub-search-input')` and `04-fleet-crud-and-refresh.spec.ts` queries `page.locator('#fleet-search-input')`.
- **Safeguard**: 
  - In `DataTableToolbar` or via column `meta`, pass the explicit `id` (e.g. `id='hub-search-input'`, `id='fleet-search-input'`) to the filter `<Input />`.
  - Alternatively, ensure custom toolbar controls preserve these element IDs.

### Risk 4: Heading Text Regressions
- **Mechanism**: Several specs assert page headers via `getByRole('heading', { name: ... })` or `h2`:
  - `/dashboard/fleet`: `getByRole('heading', { name: /Quản Lý Đội Xe/i })`
  - `/dashboard/orders`: `getByRole('heading', { name: 'Lập Lệnh Điều Vận' })`
  - `/dashboard/warehouse`: `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
  - `/dashboard/admin/hubs`: `locator('h2', { hasText: 'Quản Lý Chi Nhánh Kho' })`
- **Safeguard**: Do not alter page titles or headings during refactoring.

### Risk 5: Warehouse Search Input Placeholder Matching
- **Mechanism**: `06-order-dispatch-workflow.spec.ts` (L110) executes:
  `page.fill('input[placeholder*="Tìm theo mã đơn"]', testOrderCode)`
- **Safeguard**: The search input on `/dashboard/warehouse` must have a placeholder containing the substring `"Tìm theo mã đơn"`.

### Risk 6: Modal Dialog IDs & Form Submit Buttons
- **Mechanism**: Tests open and interact with dialogs using specific IDs:
  - `#vehicle-form-dialog`, `#btn-save-vehicle`
  - `#driver-form-dialog`, `#btn-save-driver`
  - `#hub-form-dialog`, `button[type="submit"]:has-text("Thêm Chi Nhánh")`
  - `#delete-confirm-dialog`, `#btn-confirm-delete`
  - `#select-trip-vehicle`, `button[type="submit"]:has-text("Xác nhận phân công")`
- **Safeguard**: All dialog wrappers, form input IDs, and submit button texts must remain unchanged.

---

## 6. Implementation Recommendations & Compatibility Checklist

When refactoring any table in Phase 1 or Phase 2, implementers must follow this strict checklist:

```markdown
### E2E Test Compatibility Checklist:
- [ ] 1. Preserved `data-testid` on row action buttons (`btn-edit-vehicle-${id}`, `btn-delete-vehicle-${id}`, `btn-edit-driver-${id}`, `btn-delete-driver-${id}`, `btn-assign-order-${code}`).
- [ ] 2. Preserved search input IDs (`#fleet-search-input`, `#hub-search-input`) and warehouse placeholder (`placeholder*="Tìm theo mã đơn"`).
- [ ] 3. Preserved tab switch IDs (`#tab-drivers`) and tab trigger button text (`Danh Sách Chuyến Xe`, `All`, `Unread`, `Read`).
- [ ] 4. Preserved action buttons text (`Tạo lệnh điều vận mới`, `Lưu & Tạo lệnh`, `Gửi Fleet`, `Xác nhận Trip`, `Thêm Chi Nhánh Mới`, `Thêm Chi Nhánh`, `Mark all as read`).
- [ ] 5. Preserved modal dialog container IDs (`#vehicle-form-dialog`, `#driver-form-dialog`, `#hub-form-dialog`, `#delete-confirm-dialog`) and save button IDs (`#btn-save-vehicle`, `#btn-save-driver`, `#btn-confirm-delete`).
- [ ] 6. Preserved page headings (`Lập Lệnh Điều Vận`, `Quản Lý Đội Xe`, `Inbound Hub & Kho Tiếp Nhận`, `Quản Lý Chi Nhánh Kho`).
- [ ] 7. Preserved status text strings in table cells (`Bảo Trì`, `Đang Đi Chuyến`, `Chờ điều xe`, `Đã xác nhận`).
```

---

## 7. Conclusion

Both Phase 2 pages (`/dashboard/warehouse` and `/dashboard/notifications`) have been fully surveyed alongside all 12 E2E test suites in `frontend/e2e/`. The exact selector footprints and backward compatibility constraints have been cataloged in this report, providing a clear blueprint for seamless canonical `DataTable` refactoring with zero test regressions.
