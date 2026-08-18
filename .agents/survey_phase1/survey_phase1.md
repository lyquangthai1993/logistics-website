# Codebase Explorer Survey: Core Phase 1 Data Listing Tables

**Target Scope**: Next.js 16+ Frontend (`d:\Projects\logistics-website\frontend`)  
**Auditor**: Explorer Agent (Phase 1 Survey)  
**Date**: 2026-08-18  
**Status**: Completed Investigation  

---

## 1. Executive Summary & Architectural Overview

The investigation of Core Phase 1 data listing tables reveals two contrasting architectural paradigms currently existing side-by-side in the frontend codebase:

1. **Monolithic Page Architecture (Custom Raw HTML Tables)**:
   - Pages: `/dashboard/admin/hubs`, `/dashboard/fleet`, `/dashboard/orders`, `/dashboard/trips`.
   - Characteristics: Single large page component files (from 689 lines up to 1,688 lines) containing raw `<table>` markup, manual `useState`/`useEffect` lifecycles, direct `axios` API calls (no TanStack Query caching), and zero URL search parameter synchronization.
   - Strengths: Highly customized domain workflows (e.g., Capacity Gauge, Split Shipment builder, Date range preset pickers, No-Vehicle reason modals).
   - Weaknesses: Code duplication, lack of URL shareability (back/forward browser buttons do not preserve search/filters), inconsistent table primitives, and no query cache revalidation.

2. **Modern Modular Architecture (TanStack Table v8 + TanStack Query v5 + nuqs)**:
   - Pages: `/dashboard/users` (and reference page `/dashboard/product`).
   - Characteristics: Strict feature folder structure (`api/`, `components/`, `schemas/`), server component search param parsing via `nuqs`, server-side prefetching with `<HydrationBoundary>`, `useDataTable` hook with column pinning and faceted filtering, and `<Sheet>` forms with `@tanstack/react-form` and Zod validation.
   - Weakness in Current State: `/dashboard/users` is currently connected to starter in-memory mock data (`fakeUsers`), not the live NestJS backend API (`/api/v1/users`).

---

## 2. Comprehensive Comparison Matrix

| Feature / Metric | 1. Hubs (`/dashboard/admin/hubs`) | 2. Fleet (`/dashboard/fleet`) | 3. Orders (`/dashboard/orders`) | 4. Trips (`/dashboard/trips`) | 5. Users (`/dashboard/users`) |
|---|---|---|---|---|---|
| **Page Route** | `src/app/dashboard/admin/hubs/page.tsx` | `src/app/dashboard/fleet/page.tsx` | `src/app/dashboard/orders/page.tsx` | `src/app/dashboard/trips/page.tsx` | `src/app/dashboard/users/page.tsx` |
| **Feature Folder** | `src/features/hubs/` | `src/features/fleet/` | `src/features/orders/` | `src/features/trips/` | `src/features/users/` |
| **Table Rendering Type** | Raw HTML `<table>` in `<Card>` | Raw HTML `<table>` in `<TabsContent>` | Raw HTML `<table>` in `<Card>` | Tab 1: Custom card list; Tab 2: Raw HTML `<table>` | Modern `@tanstack/react-table` via `<DataTable>` |
| **State Management** | Local `useState` + `useCallback` | Local `useState` + `useMemo` | Local `useState` + `useRef` (debounce) | Local `useState` + `useRef` (debounce) | TanStack Query v5 + `nuqs` URL state |
| **URL Search Params Sync (`nuqs`)** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ `nuqs` (page, perPage, name, role, sort) |
| **Data Fetching Pattern** | Direct `hubsApi.getHubs()` in `useEffect` | Direct `fleetApi.*` via `Promise.all` | Direct `ordersApi.*` in `useEffect` | Direct `tripsApi.*` in `useEffect` | Server `prefetchQuery` + `useSuspenseQuery` |
| **Pagination Implementation** | Server-side with custom inline controls | ❌ None (loads all items into memory) | Server-side with `<TablePaginationBar>` | Server-side with `<TablePaginationBar>` (both tabs) | Server-side with `<DataTablePagination>` (via TanStack) |
| **Search / Filter Strategy** | Server query params (`search`, `isActive`) | Purely Client-side (`useMemo`) | Server query params + 300ms debounce | Server query params + 300ms debounce | URL state + TanStack faceted & text filter |
| **Date Range / KPI Filtering** | Client computed metrics via limit: 100 query | Client computed metrics | Server `/orders/stats` + Date Preset Bar | Server `/trips/stats` + Date Preset Bar | Standard table header stats |
| **Modals / Dialogs / Sheets** | Add/Edit Hub Dialog, Soft-Delete Warning Dialog | Add/Edit Vehicle Dialog, Add/Edit Driver Dialog, Delete Confirm Dialog | Create Order Dialog (with Code Gen), External Vehicle note | Assign Vehicle / Split Shipment Dialog (2-5 trips), No-Vehicle Modal | `UserFormSheet` (`<Sheet>`), `AlertModal` (`<AlertDialog>`) |
| **Route Guard & RBAC** | Middleware `proxy.ts` (`SUPER_ADMIN`) | Middleware `proxy.ts` (`SUPER_ADMIN`, `FLEET_MANAGER`) | Middleware `proxy.ts` (`SUPER_ADMIN`, `DISPATCHER`) | Middleware `proxy.ts` (`SUPER_ADMIN`, `FLEET_MANAGER`) | Nav config (`SUPER_ADMIN`), Backend JWT |
| **Data Source Status** | Real NestJS Backend (`/api/v1/hubs`) | Real NestJS Backend (`/api/v1/vehicles`, `/drivers`) | Real NestJS Backend (`/api/v1/orders`) | Real NestJS Backend (`/api/v1/trips`) | ⚠️ Mock Data (`mock-api-users.ts`) |

---

## 3. Deep Dive Page 1: `/dashboard/admin/hubs` (Hubs Management)

### 3.1 Component & File Structure
- **Page Component**: `frontend/src/app/dashboard/admin/hubs/page.tsx` (689 lines, single client component).
- **Feature Folder**: `frontend/src/features/hubs/api.ts` (API client and TypeScript interfaces).
- **Sub-components**: None (everything inline inside `page.tsx`).

### 3.2 Table Rendering
- Raw HTML table (`<table className='w-full text-sm text-left'>`) wrapped in a Shadcn `<Card className='border-border/60 shadow-xs overflow-hidden'>`.
- Table columns (7 columns):
  1. `Mã Hub`: Hub code formatted in a mono pill badge (`hub.code`).
  2. `Tên Chi Nhánh & Tỉnh/Thành`: Hub name with warehouse icon + city name with pin icon.
  3. `Địa Chỉ Chi Tiết`: Truncated address text.
  4. `Người Quản Lý & SĐT`: Manager name and contact phone.
  5. `Xe Trực Thuộc`: Blue badge showing `hub.vehicles.length`.
  6. `Trạng Thái`: Emerald badge for `ACTIVE` ("Hoạt Động") vs Amber badge for `INACTIVE` ("Tạm Ngưng").
  7. `Thao Tác`: Action buttons (Toggle active icon button, Edit button, Delete button).

### 3.3 State Management
- Local states:
  - `hubs: Hub[]`, `loading: boolean`, `searchTerm: string`, `statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'`.
  - Pagination: `page: number`, `limit: number` (options: 5, 10, 20, 50), `total: number`, `totalPages: number`.
  - Metrics: `metrics: { total, active, inactive, totalVehicles }`.
  - Modals: `isModalOpen`, `editingHub`, `submitting`, `deletingHub`, `deleteLoading`.
  - Form fields: `formCode`, `formName`, `formCity`, `formAddress`, `formPhone`, `formManager`, `formIsActive`.
- **API Interaction**:
  - `hubsApi.getHubs({ page, limit, search, isActive })`
  - `hubsApi.getHubs({ limit: 100 })` (invoked on every load to calculate high-level KPI cards)
  - `hubsApi.createHub`, `hubsApi.updateHub`, `hubsApi.toggleActive`, `hubsApi.deleteHub`

### 3.4 Interactive Actions & Modals
- **Add Hub Button**: Triggers `openAddModal()` opening `<Dialog>` with code, city, name, address, manager, phone, isActive checkbox.
- **Edit Hub Button**: Triggers `openEditModal(hub)` prefilling dialog state.
- **Status Toggle Button**: Direct inline call to `handleToggleActive(hub)` calling `hubsApi.toggleActive(id)`.
- **Soft Delete Modal**: Opens `<Dialog>` warning user if hub currently has assigned vehicles (`hub.vehicles.length > 0`), explaining soft-delete behavior before executing `hubsApi.deleteHub(id)`.

### 3.5 RBAC & Guards
- **Route Guard**: `src/proxy.ts` restricts `/dashboard/admin` exclusively to `SUPER_ADMIN`.
- **Sidebar Nav**: `src/config/nav-config.ts` assigns `access: { role: 'SUPER_ADMIN' }`.
- **In-Page Guards**: None explicitly inside `page.tsx` (relies completely on route middleware and backend NestJS `@Roles('SUPER_ADMIN')` on write routes).

### 3.6 Quirks & Optimization Opportunities
- Every table refresh invokes two requests: one paginated request + one unpaginated `limit: 100` request for metric calculation.
- Search input is not debounced (fires on every keystroke, resetting page to 1).
- Filters and pagination are not synced to URL query parameters.

---

## 4. Deep Dive Page 2: `/dashboard/fleet` (Fleet Vehicles & Drivers)

### 4.1 Component & File Structure
- **Page Component**: `frontend/src/app/dashboard/fleet/page.tsx` (1,050 lines, single client component).
- **Feature Folder**: `frontend/src/features/fleet/api.ts` (API client and interfaces for `Vehicle`, `Driver`, `CreateVehiclePayload`, `CreateDriverPayload`).
- **External Integration**: Uses `hubsApi.getActiveHubs()` from `frontend/src/features/hubs/api.ts` to populate the hub selection dropdown.

### 4.2 Table Rendering & Multi-Tab Layout
- Uses Shadcn `<Tabs defaultValue='vehicles'>` with two tabs:
  1. **Tab 1: Danh Sách Xe (`vehicles`)**:
     - Raw HTML `<table>` (7 columns: Biển Số Xe, Mẫu Xe & Loại, Tải Trọng Tối Đa (kg), Thể Tích Tối Đa (m³), Kho / Hub Trực Thuộc, Trạng Thái, Thao Tác).
     - Inline features: Badge for external vehicles (`🚛 Xe thuê ngoài (Provider)`), status badges (`AVAILABLE` - Sẵn sàng, `IN_USE` - Đang chạy chuyến, `MAINTENANCE` - Bảo trì).
  2. **Tab 2: Danh Sách Tài Xế (`drivers`)**:
     - Raw HTML `<table>` (6 columns: Họ Và Tên, Số Điện Thoại, Số GPLX & Hạng, Kinh Nghiệm, Trạng Thái, Thao Tác).
     - Inline features: License class pill (`Hạng FC`, `Hạng C`, etc.), status badges (`AVAILABLE`, `ON_TRIP`, `OFF_DUTY`).

### 4.3 State Management
- Local states:
  - `vehicles: Vehicle[]`, `drivers: Driver[]`, `hubs: Hub[]`, `loading: boolean`, `activeTab: 'vehicles' | 'drivers'`.
  - Search & filter: `searchTerm: string`, `statusFilter: string`.
  - Filter computation: Computed via `useMemo` over client-side in-memory arrays (`filteredVehicles`, `filteredDrivers`).
  - Vehicle modal state: `isVehicleModalOpen`, `editingVehicle`, `vLicensePlate`, `vModel`, `vType`, `vMaxWeight`, `vMaxVolume`, `vHubId`, `vCurrentHub`, `vStatus`, `vIsExternal`, `vExternalProvider`.
  - Driver modal state: `isDriverModalOpen`, `editingDriver`, `dFullName`, `dPhone`, `dLicenseNumber`, `dLicenseClass`, `dExperienceYears`, `dStatus`.
  - Delete dialog: `deletingItem: { type: 'vehicle' | 'driver', id, name } | null`.
- **API Interaction**:
  - `fleetApi.getVehicles()`, `fleetApi.getDrivers()`, `hubsApi.getActiveHubs()` via `Promise.all` in `loadData()`.
  - `fleetApi.createVehicle`, `fleetApi.updateVehicle`, `fleetApi.deleteVehicle`.
  - `fleetApi.createDriver`, `fleetApi.updateDriver`, `fleetApi.deleteDriver`.

### 4.4 Interactive Actions & Modals
- **Header Actions**: "Thêm Xe Mới" (opens Vehicle dialog) and "Thêm Tài Xế Mới" (opens Driver dialog).
- **Vehicle Form Dialog**: Includes dynamic inputs for vehicle specifications, hub attachment, and a dedicated partner sub-section for "Xe thuê ngoài (External Partner Vehicle)".
- **Driver Form Dialog**: Includes license number, license class (`FC`, `C`, `E`, `D`), experience years, and availability status.
- **Delete Confirmation Dialog**: Generic dialog for confirming vehicle/driver deletion.

### 4.5 RBAC & Guards
- **Route Guard**: `src/proxy.ts` restricts `/dashboard/fleet` to `SUPER_ADMIN` and `FLEET_MANAGER`.
- **Sidebar Nav**: `src/config/nav-config.ts` assigns `access: { role: 'SUPER_ADMIN,FLEET_MANAGER' }`.
- **Backend API**: `@Roles('SUPER_ADMIN', 'FLEET_MANAGER')` on Vehicles and Drivers controllers.

### 4.6 Quirks & Optimization Opportunities
- **No Pagination**: The backend endpoints return full arrays without pagination metadata. As the fleet grows to hundreds of vehicles and drivers, performance and rendering will degrade.
- Pure client-side filtering via `useMemo` without URL preservation.

---

## 5. Deep Dive Page 3: `/dashboard/orders` (Orders Intake & Dispatch)

### 5.1 Component & File Structure
- **Page Component**: `frontend/src/app/dashboard/orders/page.tsx` (1,176 lines, single client component).
- **Detail Page Component**: `frontend/src/app/dashboard/orders/[id]/page.tsx` (871 lines, single client component).
- **Feature Folder**: `frontend/src/features/orders/api.ts` (API client, order statuses, stats interfaces).
- **Shared Components**: `src/components/ui/table/table-pagination-bar.tsx`.

### 5.2 Table Rendering
- Raw HTML table wrapped in `<Card className='shadow-sm border-slate-200/80 ... overflow-hidden'>`.
- Table columns (7 columns):
  1. `Mã đơn hàng`: Order code as link to `/dashboard/orders/${order.id}`, date created, "Split Nx" badge (if multiple trips), and "Xe ngoài" badge.
  2. `Tuyến đường & Hub`: Origin hub $\rightarrow$ Destination hub formatted with arrow icon.
  3. `Khối lượng / Thể tích`: Weight (kg), volume ($m^3$), and total package quantity (kiện).
  4. `Loại hàng`: Goods description + external vehicle requirement note (`🚛 Lý do xe ngoài`).
  5. `Trạng thái`: Status badge (`DRAFT`, `PENDING_FLEET`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `NO_VEHICLE`, `CANCELLED`).
  6. `Xe phân công`: List of assigned vehicle license plates or external provider tags.
  7. `Thao tác`: Eye icon (view details), "Xe ngoài" action button, "Gửi Fleet" submit button (with per-row loading spinner), and Delete draft button.

### 5.3 State Management
- Local states:
  - `orders: Order[]`, `loading: boolean`, `searchTerm: string`, `debouncedSearch: string`, `statusFilter: string`, `hubFilter: string`.
  - Pagination: `page: number`, `totalPages: number`, `total: number` (fixed `PAGE_SIZE = 20`).
  - Metric stats: `stats: OrderStats | null`, `statsLoading: boolean`, `datePreset: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'custom'`, `dateRange: { from, to }`.
  - Per-row submit tracking: `submittingOrderIds: Set<number>` to prevent duplicate submissions.
  - Create Order modal: `isCreateModalOpen`, `submitting`, `generatingCode`, form fields (`orderCode`, `originHub`, `destinationHub`, `totalQuantity`, `totalWeight`, `totalVolume`, `goodsDescription`, `notes`, `isExternalNeeded`, `externalNote`).
- **User Store**: Uses `useAuthStore()` to extract the logged-in user's initials (`suggestedInitials`) for auto-generating temporary order codes (`handleGenerateCode` $\rightarrow$ `ordersApi.generateOrderCode`).

### 5.4 Interactive Actions & Modals
- **Date Preset Bar**: Allows instantaneous switching between `Hôm nay`, `7 ngày qua`, `Tháng này`, `Tháng trước`, or custom start/end date pickers with live refresh button.
- **Metric KPI Cards**: 4 cards reflecting server-calculated statistics (`Tổng số đơn hàng`, `Chờ điều phối xe`, `Đã phân công xe`, `Hết / Chưa có xe`).
- **Create Order Dialog**: Comprehensive modal with:
  - Instant Code Generation button (`<IconSparkles />` $\rightarrow$ calls `/orders/generate-code`).
  - Origin & Destination Hub dropdowns (with validation preventing origin == destination).
  - Weight & Volume capacity inputs.
  - External fleet requirement toggle with mandatory justification note (`externalNote`).
- **Row Submit to Fleet**: `handleSubmitToFleet(order.id)` triggers `ordersApi.submitOrder(id)` with isolated row loading indicator.

### 5.5 RBAC & Guards
- **Route Guard**: `src/proxy.ts` restricts `/dashboard/orders` to `SUPER_ADMIN` and `DISPATCHER`.
- **Sidebar Nav**: `src/config/nav-config.ts` assigns `access: { role: 'SUPER_ADMIN,DISPATCHER' }`.
- **Backend API**: DISPATCHER has full write access; FLEET_MANAGER only has `PATCH /orders/:id/no-vehicle`.

### 5.6 Quirks & Optimization Opportunities
- **Hardcoded Hubs List**: Uses a static in-file constant `HUBS = ['Andromeda Hub (Hà Nội)', 'Magellan Hub (Đà Nẵng)', ...]` instead of fetching live hubs dynamically from `hubsApi.getActiveHubs()`.
- Uses custom `TablePaginationBar` rather than standard TanStack table pagination.

---

## 6. Deep Dive Page 4: `/dashboard/trips` (Trips & Vehicle Capacity)

### 6.1 Component & File Structure
- **Page Component**: `frontend/src/app/dashboard/trips/page.tsx` (1,688 lines, largest single client component in the project).
- **Feature Folder**: `frontend/src/features/trips/api.ts` (API client, trip types, split shipment payloads, stats interfaces).
- **Integrated Features**: Consumes `ordersApi`, `fleetApi` (vehicles & drivers), and `TablePaginationBar`.

### 6.2 Table Rendering & Multi-Tab Layout
- Divided into two distinct views via `<Tabs defaultValue='pending-orders'>`:
  1. **Tab 1: Đơn Cần Phân Xe (`pending-orders`)**:
     - Custom responsive list layout (`<div className='divide-y divide-slate-200'>`).
     - Displays pending orders requiring fleet allocation with route badges, weight/volume gauges, external fleet alerts, and action buttons (`Báo hết xe`, `Phân công xe`).
  2. **Tab 2: Danh Sách Chuyến Xe (`all-trips`)**:
     - Raw HTML `<table>` (7 columns: Chuyến xe / Mã đơn, Phương tiện, Tài xế, Khối lượng / $m^3$, Lịch trình lấy/giao hàng, Trạng thái, Thao tác).
     - Row action: "Xác nhận Trip" (`handleConfirmTrip`) for `PENDING` trips.

### 6.3 State Management & Workflows
- Massive state footprint:
  - `trips: Trip[]`, `pendingOrders: Order[]`, `vehicles: Vehicle[]`, `drivers: Driver[]`.
  - Dual pagination states: `pendingPage`/`pendingTotalPages`/`pendingTotal` (size 10) AND `tripsPage`/`tripsTotalPages`/`tripsTotal` (size 10).
  - Stats & Date Range: `datePreset`, `dateRange`, `stats: TripStats | null`.
  - Assign Modal State: `isAssignModalOpen`, `selectedOrder`, `isSplitMode: boolean`, `selectedVehicleId`, `selectedDriverId`, `pickupDate`, `pickupTime`, `estimatedDeliveryDate`, `weightAllocated`, `volumeAllocated`, `tripNotes`.
  - Split Shipment Rows: `splitRows: SplitRow[]` (array of trip segment configurations).
  - No Vehicle Modal State: `isNoVehicleModalOpen`, `noVehicleOrder`, `noVehicleReasonCategory: 'BUSY' | 'MAINTENANCE' | 'OVER_CAPACITY' | 'HUB_UNAVAILABLE' | 'CUSTOM'`, `noVehicleCustomReason`.

### 6.4 Interactive Actions & Modals
- **Vehicle Assignment Dialog with Real-time Capacity Gauge**:
  - Automatically calculates `selectedOrder.totalWeight / selectedVehicle.maxWeight * 100%`.
  - Renders visual progress bar (emerald $\le 100\%$, rose $> 100\%$) with overload warning advising Split Shipment.
  - Highlights external partner vehicles with custom amber warning banners.
- **Split Shipment Mode**:
  - Dynamically splits an order across 2 to 5 vehicles.
  - Automatically verifies that all assigned vehicle weights and volumes match the order totals before submitting to `tripsApi.createSplitTrips(payload)`.
- **No-Vehicle Declaration Dialog**:
  - Categorized reason selection (`Xe đang trong lộ trình`, `Bảo dưỡng`, `Quá tải trọng`, `Không có xe tại Hub`).
  - Calls `ordersApi.markNoVehicle(id, reason)` which alerts Dispatchers in real-time.

### 6.5 RBAC & Guards
- **Route Guard**: `src/proxy.ts` restricts `/dashboard/trips` to `SUPER_ADMIN` and `FLEET_MANAGER`.
- **Sidebar Nav**: `src/config/nav-config.ts` assigns `access: { role: 'SUPER_ADMIN,FLEET_MANAGER' }`.
- **Backend API**: FLEET_MANAGER has full trip creation and confirmation rights; DISPATCHER is read-only (GET).

### 6.6 Quirks & Optimization Opportunities
- The file is 1,688 lines long with deeply nested modal markup and complex math.
- Splitting into sub-components (`TripsTable`, `PendingOrdersList`, `AssignVehicleDialog`, `NoVehicleDialog`, `CapacityGauge`) will dramatically improve maintainability.

---

## 7. Deep Dive Page 5: `/dashboard/users` (User Management)

### 7.1 Component & File Structure (Clean Architecture Reference)
- **App Route**: `frontend/src/app/dashboard/users/page.tsx` (Server Component) & `loading.tsx`.
- **Feature Structure**:
  ```
  src/features/users/
  ├── api/
  │   ├── mutations.ts       # TanStack Query mutations with cache invalidation
  │   ├── queries.ts         # TanStack Query queryOptions and queryKeys
  │   ├── service.ts         # Data access layer (DAL)
  │   └── types.ts           # User, filters, and API response types
  ├── components/
  │   ├── user-form-sheet.tsx # Slide-out Sheet form with @tanstack/react-form
  │   ├── user-listing.tsx    # Server prefetch + HydrationBoundary
  │   └── users-table/
  │       ├── cell-action.tsx # Dropdown action menu (Edit Sheet, Delete AlertModal)
  │       ├── columns.tsx     # TanStack Table column definitions
  │       ├── index.tsx       # Table container with useDataTable hook
  │       └── options.tsx     # Role filter faceted options
  ├── schemas/
  │   └── user.ts            # Zod validation schema
  └── info-content.ts        # Infobar contextual documentation
  ```

### 7.2 Table Rendering
- Implemented using `@tanstack/react-table` (v8) wrapped inside `<DataTable>` and `<DataTableToolbar>`.
- Column configuration (`columns.tsx`):
  - `name`: Combined accessor (`${first_name} ${last_name}`), email sub-text, sortable column header, text search input.
  - `phone`: User phone number.
  - `role`: Capitalized badge with faceted multi-select dropdown filter (`ROLE_OPTIONS`).
  - `status`: Status badge (`Active` $\rightarrow$ default, `Inactive` $\rightarrow$ secondary, `Invited` $\rightarrow$ outline).
  - `actions`: Pin to right (`columnPinning: { right: ['actions'] }`), rendering `<CellAction>`.

### 7.3 State Management & Data Flow
- **URL Synchronization via `nuqs`**:
  - `useQueryStates({ page, perPage, name, role, sort })`
  - In server component `page.tsx`: `searchParamsCache.parse(searchParams)`.
- **TanStack Query v5**:
  - Server prefetch in `user-listing.tsx`: `queryClient.prefetchQuery(usersQueryOptions(filters))`.
  - Client consumption in `users-table/index.tsx`: `useSuspenseQuery(usersQueryOptions(filters))`.
  - Mutations (`createUserMutation`, `updateUserMutation`, `deleteUserMutation`) automatically call `queryClient.invalidateQueries({ queryKey: userKeys.all })`.
- **Form Handling**: `@tanstack/react-form` + `zod` schema validator inside `<Sheet>`.

### 7.4 Interactive Actions & Modals
- **Header Action**: "Add User" button (`<UserFormSheetTrigger />`) opening `<UserFormSheet>`.
- **Row Actions Dropdown (`CellAction`)**:
  - `Update`: Opens `<UserFormSheet>` preloaded with user data.
  - `Delete`: Opens `<AlertModal>` with confirmation prompt and mutation execution.

### 7.5 RBAC & Guards
- **Sidebar Nav**: `src/config/nav-config.ts` assigns `access: { role: 'SUPER_ADMIN' }`.
- **Route Guard**: Currently open in `proxy.ts` (needs explicit `/dashboard/users` entry for `SUPER_ADMIN` or route grouping under `/dashboard/admin/users`).
- **Backend API**: Backend `/api/v1/users` is strictly guarded by `@Roles('SUPER_ADMIN')`.

### 7.6 Quirks & Discrepancies
- **Mock Data Layer**: `src/features/users/api/service.ts` currently connects to `fakeUsers` from `@/constants/mock-api-users.ts` instead of calling `apiClient.get('/api/v1/users')`.
- **Role Mismatch**: Uses generic template roles (`Developer`, `Designer`, `Manager`, `QA`, `DevOps`, `Product Owner`) instead of Logistics TMS business roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).

---

## 8. Summary of Findings & Modernization Recommendations

### 8.1 Key Findings Summary
1. **Tables 1-4 (`hubs`, `fleet`, `orders`, `trips`)** contain complete, production-ready logistics business logic (Split shipment, Capacity gauges, External fleets, No-vehicle workflows, Date presets, KPI metrics), but are implemented using monolithic raw HTML tables with local `useState`.
2. **Table 5 (`users`)** possesses the ideal, state-of-the-art UI/UX architecture (TanStack Table v8, `nuqs` URL search params, TanStack Query v5 suspense & hydration, Sheet forms), but is currently tethered to starter mock data.
3. **RBAC Protection**: All pages are securely protected at the middleware (`proxy.ts`), sidebar (`nav-config.ts`), and backend NestJS controller layers.

### 8.2 Strategic Phase 1 Modernization Plan
To bring all Phase 1 pages up to the standard architectural level without regressing any existing logistics workflows:
1. **Refactor Users Module (`/dashboard/users`)**:
   - Update `service.ts` to connect to real backend `/api/v1/users`.
   - Align TypeScript types and `ROLE_OPTIONS` with the TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
2. **Migrate Hubs, Orders, Trips, Fleet to Modular Feature Architecture**:
   - Extract column definitions into `columns.tsx` using `ColumnDef<T>`.
   - Replace raw `<table>` elements with `<DataTable>` and `<DataTablePagination>`.
   - Wrap API calls in `queries.ts` and `mutations.ts` using `queryOptions` and `mutationOptions`.
   - Adopt `nuqs` for search, status filter, and pagination URL persistence.
   - Separate complex modals (`AssignVehicleDialog`, `NoVehicleDialog`, `SplitShipmentForm`) into dedicated sub-components under `features/<module>/components/`.
