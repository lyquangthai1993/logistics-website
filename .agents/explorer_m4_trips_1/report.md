# Deep-Dive Analysis: Trips & Vehicle Capacity Standardization (Milestone 4)

**Working Directory**: `frontend/src/app/dashboard/trips/` & `frontend/src/features/trips/`  
**Date**: 2026-08-18  
**Author**: Explorer 1 (Milestone 4 - Trips & Vehicle Capacity Standardization)  
**Status**: COMPLETE

---

## 1. Executive Summary

The **Trips & Vehicle Capacity Management** module (`/dashboard/trips`) is the core operational bridge between **Order Dispatch (Dispatcher)**, **Fleet Operations (Fleet Manager)**, and **Inbound Receiving (Warehouse Manager)**.

Currently, the frontend implementation lives inside a single monolithic client component:
- File: `frontend/src/app/dashboard/trips/page.tsx` (1,688 lines, 79.5 KB, `'use client'`).
- Handles dual-tab workspace ("Pending Orders" queue vs "All Trips" table), live interactive vehicle capacity gauge, split shipment (2–5 vehicles per order), no-vehicle declaration dialog, trip confirmation with in-app/email dispatch, date preset filtering, and fleet KPI cards.

To conform with the canonical architecture established in Milestones 1–3 (Hubs, Fleet, Orders), Milestone 4 refactors this page into a modular feature package located at `frontend/src/features/trips/` leveraging:
1. **Server Component** (`src/app/dashboard/trips/page.tsx`) with `nuqs` searchParamsCache and Suspense fallback.
2. **Server Prefetch Wrapper** (`src/features/trips/components/trips-listing.tsx`) using `@tanstack/react-query` v5 (`prefetchQuery`, `HydrationBoundary`).
3. **Canonical TanStack Table v8** (`src/features/trips/components/trips-tables/`) with `<DataTable>`, `<DataTableToolbar>`, `<DataTablePagination>`, and `useDataTable`.
4. **Interactive Dispatch Components** (`pending-orders-view.tsx`, `assign-vehicle-dialog.tsx`, `no-vehicle-dialog.tsx`, `trips-kpi-cards.tsx`, `trips-date-preset-bar.tsx`).
5. **100% Vietnamese Sonner Toasts** with API-first error message extraction.

---

## 2. Workspace & Tab Architecture

The Trips dashboard is split into two operational views accessible via top tabs:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Page Header: "Phân Công Xe & Quản Lý Chuyến" | Button: "Quản lý đội xe" -> /dashboard/fleet     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Date Range Filter Bar: [Hôm nay] [7 ngày qua] [Tháng này] [Tháng trước] | From -> To | [Refresh]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Summary KPI Cards (4 Cards):                                                                    │
│ 1. Đơn cần phân xe    2. Chuyến xe đã xác nhận   3. Xe thuê ngoài (External)  4. Báo hết xe     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tabs Navigation:                                                                                │
│ [ Đơn Cần Phân Xe (N) ]        [ Danh Sách Chuyến Xe (M) ]          [ Search input ]            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 1 CONTENT: Pending Orders Queue       │ TAB 2 CONTENT: All Trips Table                      │
│ - Order cards with weight, volume, route  │ - TanStack Table v8 with ColumnDef<Trip>            │
│ - External vehicle required indicator     │ - Vehicle & Driver info, load % bar                 │
│ - "Báo hết xe" & "Phân công xe" buttons   │ - Status badges & "Xác nhận Trip" action            │
└───────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

### URL Search Params & Tab State Sync
- In standardizing to `nuqs`, tab state is synced via `tab=pending-orders` or `tab=all-trips` (default: `pending-orders`).
- Search query (`search`), pagination (`page`, `perPage`), status filter (`status`), and date filters (`preset`, `fromDate`, `toDate`) are synced to the URL.

---

## 3. Detailed Feature Breakdown & Workflows

### 3.1. Tab 1: "Đơn Cần Phân Xe" (Pending Orders Dispatch Queue)

#### Purpose & Data Source
- Fetches unassigned or reassigned orders submitted by Dispatcher.
- **API Endpoint**: `GET /api/v1/orders`
- **Filter**: `status: 'PENDING_ASSIGNMENT'` (Backend alias: queries `order.status IN ('PENDING_FLEET', 'NO_VEHICLE')`).
- **Additional Params**: `search`, `fromDate`, `toDate`, `page`, `limit: 10`.

#### Visual Card Representation
Each pending order is rendered as an interactive card displaying:
1. **Order Code**: Bold monospace (e.g. `ORD-2026-001`).
2. **Status Badges**:
   - `Chờ phân xe` (Blue badge): Standard pending dispatch.
   - `Không có xe nội bộ` (Rose destructive badge): Order previously declared as `NO_VEHICLE`.
   - `🚛 Yêu cầu xe thuê ngoài` (Amber outline badge): Active if `order.isExternalVehicleNeeded === true`.
3. **Route & Metrics**:
   - Route: `{originHub} → {destinationHub}`.
   - Weight: `{totalWeight.toLocaleString()} kg`.
   - Volume: `{totalVolume} m³`.
4. **Goods Description & Order Notes**:
   - `Hàng: {goodsDescription} ({notes})`.
5. **External Vehicle Note (if applicable)**:
   - Amber callout banner: `🚛 Yêu cầu xe ngoài: {order.externalNote}`.
6. **Action Buttons**:
   - **"Báo hết xe"** (`variant="outline" text-rose-600`): Visible if `order.status !== 'NO_VEHICLE'`. Opens No-Vehicle Declaration Modal.
   - **"Phân công xe"** (`data-testid="btn-assign-order-${order.orderCode}"`): Opens Assign Vehicle Modal.

---

### 3.2. Assign Vehicle Modal & Interactive Workflows

**Trigger**: Click on `[data-testid="btn-assign-order-${order.orderCode}"]`.

#### Order Summary Header & Dispatch Notes
- Displays route, total weight, total volume, receiving hub, goods description.
- **Highlighted Dispatch Note Banner**:
  - If `order.notes` exists: Displays an eye-catching gradient amber callout (`from-amber-50 to-amber-100/60`, border-2 `border-amber-400`) titled **"GHI CHÚ ĐIỀU VẬN (TỪ LỆNH ĐIỀU HÀNH)"** with badge **"Lưu ý quan trọng"**.
  - If `order.notes` is empty: Renders a dashed gray box stating `"Không có ghi chú đặc biệt từ Điều hành"`.
- **External Vehicle Notice**: Displays amber alert banner if `order.isExternalVehicleNeeded === true`.

#### Dual-Mode Switcher
- Button: `"Chia nhiều xe (Split Shipment)"` / `"Chuyển sang Split"` / `"Đang chia nhiều xe"`.
- Toggles between **Single Assignment Mode** and **Split Shipment Mode**.

---

### 3.3. Single Assignment Mode & Real-Time Capacity Gauge

#### Form Fields
1. **Vehicle Select (`#select-trip-vehicle`)**:
   - Lists all vehicles (`fleetApi.getVehicles()`).
   - Format: `{licensePlate} ({type}) - Max {maxWeight.toLocaleString()}kg [🚛 XE NGOÀI: provider]`.
   - On vehicle change: Auto-selects default driver if `vehicle.assignedDriverId` exists.
2. **Driver Select (`#select-trip-driver`)**:
   - Lists all drivers (`fleetApi.getDrivers()`).
   - Format: `{fullName} ({phone}) - Hạng {licenseClass}`.
3. **Schedule Inputs**:
   - Pickup Date: `#trip-pickup-date` (`type="date"`, defaults to today).
   - Pickup Time: `#trip-pickup-time` (`type="time"`, defaults to `'08:00'`).
   - Estimated Delivery Date: `#trip-eta-date` (`type="date"`, defaults to today + 2 days).
4. **Trip Notes**:
   - `#trip-notes-input` (`<Textarea rows={2}>`).

#### Real-Time Capacity Gauge Calculation & Warnings
When a vehicle is selected, the capacity gauge renders live utilization metrics:
```typescript
const weightRatio = selectedOrder.totalWeight / selectedVehicle.maxWeight;
const weightPercent = Math.round(weightRatio * 100);
const isOverloaded = selectedOrder.totalWeight > selectedVehicle.maxWeight;
```
- **Visual Progress Bar**:
  - Normal (`<= 100%`): Emerald green (`bg-emerald-500`), width `${Math.min(100, weightPercent)}%`.
  - Overload (`> 100%`): Rose red (`bg-rose-500`), width `100%`.
- **Overload Warning Text**:
  - `IconAlertTriangle` + `"Cảnh báo: Khối lượng đơn vượt quá tải trọng xe. Khuyến nghị bật Split Shipment để chia tải."`
- **External Vehicle Provider Alert**:
  - If `selectedVehicle.isExternal === true`: Shows amber callout stating the vehicle belongs to external partner `{externalProvider}`.

#### API Submission (Single Mode)
- Endpoint: `POST /api/v1/trips`
- Payload (`CreateTripPayload`):
  ```json
  {
    "orderId": 123,
    "vehicleId": 4,
    "driverId": 2,
    "pickupDate": "2026-08-20",
    "pickupTime": "08:00",
    "estimatedDeliveryDate": "2026-08-22",
    "weightAllocated": 18000,
    "volumeAllocated": 45,
    "sequenceNumber": 1,
    "notes": "Kiểm tra seal chì"
  }
  ```
- Toast: `toast.success('Đã phân công xe cho đơn hàng ' + order.orderCode)`.

---

### 3.4. Split Shipment Mode (Chia 2–5 Chuyến Xe)

#### Initialization & Metric Tracking
- On opening or switching to split mode: Initializes 2 rows with a 50/50 split of `order.totalWeight` and `order.totalVolume`.
- **Live Allocation Summary Bar**:
  - Total Weight: `{splitTotalWeight.toLocaleString()} / {order.totalWeight.toLocaleString()} kg`
  - Total Volume: `{splitTotalVolume} / {order.totalVolume} m³`

#### Multi-Trip Rows (Cards)
- Allows between **2 and 5** trip allocations.
- Each row contains:
  - Row Header: `Xe #{idx + 1}` + Delete button ("Xóa xe này", visible when rows > 2).
  - Vehicle Select: `#split-vehicle-${idx}`
  - Driver Select: `#split-driver-${idx}`
  - Allocated Weight: `#split-weight-${idx}` (`type="number"`, `min="1"`)
  - Allocated Volume: `#split-volume-${idx}` (`type="number"`, `step="0.1"`, `min="0.1"`)
  - Pickup Date: `#split-pickup-${idx}`
  - Estimated Delivery Date: `#split-delivery-${idx}`
- **"Thêm xe chở hàng (${splitRows.length}/5)"** button: Appends a new split row (disabled when count = 5).

#### Validation Rules
1. Every row must have a vehicle selected (`vehicleId` is non-empty).
2. Every row must have allocated weight `> 0`.
3. Error toast: `"Vui lòng chọn xe cho chuyến thứ X"` or `"Khối lượng chuyến X phải lớn hơn 0"`.

#### API Submission (Split Mode)
- Endpoint: `POST /api/v1/trips/split`
- Payload (`CreateSplitTripsPayload`):
  ```json
  {
    "orderId": 123,
    "trips": [
      {
        "vehicleId": 4,
        "driverId": 2,
        "pickupDate": "2026-08-20",
        "pickupTime": "08:00",
        "estimatedDeliveryDate": "2026-08-22",
        "weightAllocated": 9000,
        "volumeAllocated": 22.5,
        "notes": "Chuyến xe 1"
      },
      {
        "vehicleId": 5,
        "driverId": 3,
        "pickupDate": "2026-08-20",
        "pickupTime": "08:00",
        "estimatedDeliveryDate": "2026-08-22",
        "weightAllocated": 9000,
        "volumeAllocated": 22.5,
        "notes": "Chuyến xe 2"
      }
    ]
  }
  ```
- Backend logic: Deletes previous `PENDING` trips for that order, saves all split trips, updates `order.isExternalVehicleNeeded = true` if any vehicle is external.
- Toast: `toast.success('Đã chia đơn ' + order.orderCode + ' sang ' + splitRows.length + ' chuyến xe!')`.

---

### 3.5. No-Vehicle Declaration Modal (Báo Hết Xe Nội Bộ)

**Trigger**: Click on `"Báo hết xe"` on any order card in Tab 1.

#### Form Structure
1. **Order Summary**: Code, route, weight, volume, goods description.
2. **5 Categorized Reason Radio Options**:
   - `BUSY`: *"Toàn bộ xe nội bộ phù hợp đang trong lộ trình vận chuyển"*
   - `MAINTENANCE`: *"Xe đang trong kế hoạch bảo dưỡng, kiểm định kỹ thuật"*
   - `OVER_CAPACITY`: *"Khối lượng / thể tích vượt quá tải trọng của xe khả dụng"*
   - `HUB_UNAVAILABLE`: *"Không có xe khả dụng tại Hub xuất phát này"*
   - `CUSTOM`: *"Lý do khác / Khuyến nghị điều xe ngoài cụ thể"*
3. **Detail Textarea**: `#no-vehicle-custom-reason`
   - Placeholder: *"VD: Toàn bộ xe tải 15T đang chạy tuyến Huế - SG đến 20/08. Đề nghị Dispatcher chủ động thuê xe ngoài..."*
4. **Operational Guidance Callout**:
   - Explains that upon confirmation, the order transitions to `NO_VEHICLE` so the Dispatcher is prompted to procure external vehicles or adjust the schedule.

#### API Submission
- Endpoint: `PATCH /api/v1/orders/:id/no-vehicle`
- Payload: `{ "reason": "Lý do..." }`
- Toast Warning:
  - Title: `Đã báo hết xe cho đơn {orderCode}`
  - Description: `Bộ phận Điều phối (Dispatcher) đã được cập nhật để chủ động thuê xe ngoài.`

---

### 3.6. Tab 2: "Danh Sách Chuyến Xe" (All Trips Table) & Actions

#### TanStack Table Columns Definition (`ColumnDef<Trip>[]`)
| Column ID | Title | Render / Accessor Logic |
|-----------|-------|-------------------------|
| `tripSequence` | Chuyến xe / Mã đơn | `Chuyến #{sequenceNumber || id}`, `[Xe ngoài]` badge if `vehicle.isExternal`, Order Code link |
| `vehicle` | Phương tiện | License plate (`vehicle.licensePlate`), Type / `externalProvider` name |
| `driver` | Tài xế | Full name (`driver.fullName`), Phone (`driver.phone`) |
| `capacity` | Khối lượng / Thể tích | `{weightAllocated.toLocaleString()} kg` / `{volumeAllocated} m³` |
| `schedule` | Lịch trình | Lấy: `{pickupDate} {pickupTime}` \| Đích: `{estimatedDeliveryDate}` |
| `status` | Trạng thái | Badges: `PENDING` (Chờ xác nhận), `CONFIRMED` (Đã xác nhận), `IN_TRANSIT` (Đang chạy), `COMPLETED` (Hoàn thành), `CANCELLED` (Đã hủy) |
| `actions` | Thao tác | If `PENDING`: `button:has-text("Xác nhận Trip")`; Dropdown menu with row actions |

#### Confirm Trip Action (`button:has-text("Xác nhận Trip")`)
- **API Endpoint**: `PATCH /api/v1/trips/:id/confirm`
- **Backend Cascade**:
  1. Updates `trip.status = 'CONFIRMED'`.
  2. If all trips for this order are confirmed/completed, updates `order.status = 'ASSIGNED'`.
  3. Sends real-time in-app notifications and email notifications to `WAREHOUSE_MANAGER`, `DISPATCHER`, `FLEET_MANAGER`, `SUPER_ADMIN`.
- **Toast**: `toast.success('Xác nhận chuyến xe thành công!', { description: 'Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho.' })`.

---

### 3.7. KPI Summary Cards (4 Cards)

1. **Đơn hàng cần phân xe** (Blue):
   - Value: `stats.ordersAwaitingFleet` (Real-time count of `PENDING_FLEET` orders).
   - Subtitle: *"Đang chờ Fleet xử lý"*.
2. **Chuyến xe đã xác nhận** (Emerald):
   - Value: `stats.tripsConfirmed + stats.tripsInTransit` (Filtered by selected date range).
   - Subtitle: *"Trong kỳ thống kê"*.
3. **Xe thuê ngoài (External)** (Amber):
   - Value: `vehicles.filter(v => v.isExternal).length` (Available partner vehicles).
   - Subtitle: *"Xe đối tác khả dụng"*.
4. **Đơn báo không có xe** (Rose):
   - Value: `stats.ordersNoVehicle` (Real-time count of `NO_VEHICLE` orders).
   - Subtitle: *"Cần Dispatcher thuê xe ngoài"*.

---

### 3.8. Date Preset & Date Range Filter Bar

- Presets: `today` (Hôm nay), `7days` (7 ngày qua), `thisMonth` (Tháng này, default), `lastMonth` (Tháng trước), `custom`.
- Custom Inputs: From date (`type="date"`), To date (`type="date"`).
- Period Label: `"Kỳ thống kê: DD/MM/YYYY – DD/MM/YYYY"`.
- Refresh Button: Triggers refetching of stats, pending orders, and trips.

---

## 4. 100% Vietnamese Toast Notifications & Error Handling Audit

### Standardized Error Pattern
```typescript
try {
  // async API call
} catch (err: unknown) {
  const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  toast.error(apiMessage || 'Fallback tiếng Việt tương ứng');
}
```

### Complete Toast Inventory
| Action / Event | Toast Type | Message Content | Fallback / Description |
|----------------|------------|-----------------|------------------------|
| Load Pending Orders Failure | `error` | API error message | `"Không thể tải danh sách đơn hàng chờ phân xe."` |
| Load Trips Failure | `error` | API error message | `"Không thể tải danh sách chuyến xe."` |
| Assign Single Trip Success | `success` | `"Đã phân công xe cho đơn hàng {orderCode}"` | — |
| Assign Single Trip Validation (no vehicle) | `error` | `"Vui lòng chọn phương tiện vận chuyển"` | Client-side validation |
| Assign Split Trips Success | `success` | `"Đã chia đơn {orderCode} sang {count} chuyến xe!"` | — |
| Assign Split Validation (missing vehicle) | `error` | `"Vui lòng chọn xe cho chuyến thứ {idx}"` | Client-side validation |
| Assign Split Validation (weight <= 0) | `error` | `"Khối lượng chuyến {idx} phải lớn hơn 0"` | Client-side validation |
| Assign Trip API Failure | `error` | API error message | `"Lỗi khi phân công chuyến xe. Vui lòng thử lại."` |
| Confirm Trip Success | `success` | `"Xác nhận chuyến xe thành công!"` | Description: `"Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho."` |
| Confirm Trip API Failure | `error` | API error message | `"Không thể xác nhận chuyến xe. Vui lòng thử lại."` |
| Mark No Vehicle Success | `warning` | `"Đã báo hết xe cho đơn {orderCode}"` | Description: `"Bộ phận Điều phối (Dispatcher) đã được cập nhật để chủ động thuê xe ngoài."` |
| Mark No Vehicle API Failure | `error` | API error message | `"Lỗi cập nhật trạng thái hết xe. Vui lòng thử lại."` |

---

## 5. Critical E2E Test Selectors & Invariants

Playwright test specifications (`06-order-dispatch-workflow.spec.ts`, `07-capture-user-guide-screenshots.spec.ts`, `03-rbac-routing.spec.ts`) rely strictly on these element selectors:

| Selector | Element Description | Invariant Requirement |
|----------|---------------------|-----------------------|
| `[data-testid^="btn-assign-order-"]` | "Phân công xe" button on pending order card | Format: `btn-assign-order-${order.orderCode}` |
| `#select-trip-vehicle` | Vehicle select dropdown in assign modal | Must have `id="select-trip-vehicle"` |
| `#select-trip-driver` | Driver select dropdown in assign modal | Must have `id="select-trip-driver"` |
| `#trip-pickup-date` | Pickup date input in assign modal | Must have `id="trip-pickup-date"` |
| `#trip-pickup-time` | Pickup time input in assign modal | Must have `id="trip-pickup-time"` |
| `#trip-eta-date` | ETA date input in assign modal | Must have `id="trip-eta-date"` |
| `#trip-notes-input` | Trip notes textarea in assign modal | Must have `id="trip-notes-input"` |
| `button[type="submit"]:has-text("Xác nhận phân công")` | Submit button in assign modal | Exact Vietnamese button text |
| `button:has-text("Danh Sách Chuyến Xe")` | Tab trigger for All Trips | Exact Vietnamese tab trigger text |
| `button:has-text("Đơn Cần Phân Xe")` | Tab trigger for Pending Orders | Exact Vietnamese tab trigger text |
| `button:has-text("Xác nhận Trip")` | Confirm trip action button in table row | Exact Vietnamese button text |
| `button:has-text("Chuyển sang Split")` / `button:has-text("Đang chia nhiều xe")` | Split mode toggle button | Exact Vietnamese toggle text |
| `#no-vehicle-custom-reason` | Reason textarea in no-vehicle modal | Must have `id="no-vehicle-custom-reason"` |
| `input[name="noVehicleReason"]` | Reason radio buttons in no-vehicle modal | Exact radio input name |
| `button:has-text("Báo hết xe")` | Open no-vehicle modal button | Exact button text |
| `button:has-text("Xác nhận báo hết xe")` | Confirm no-vehicle button | Exact button text |

---

## 6. Proposed Target Modular Feature Architecture

To modularize `src/app/dashboard/trips/page.tsx` cleanly into `src/features/trips/`:

```
frontend/src/
├── app/
│   └── dashboard/
│       └── trips/
│           └── page.tsx                         # Next.js Server Component (searchParamsCache, PageContainer, Suspense)
└── features/
    └── trips/
        ├── api/
        │   ├── types.ts                         # Trip, TripStatus, CreateTripPayload, CreateSplitTripsPayload, TripStats, etc.
        │   ├── service.ts                       # getTrips, getTripStats, getTripById, createTrip, createSplitTrips, confirmTrip, updateTrip, deleteTrip
        │   ├── queries.ts                       # TanStack Query options (tripsQueryOptions, tripStatsQueryOptions, pendingOrdersQueryOptions)
        │   ├── mutations.ts                     # useCreateTripMutation, useCreateSplitTripsMutation, useConfirmTripMutation, useNoVehicleMutation
        │   └── index.ts                         # Re-exports all types, services, queries, mutations
        ├── api.ts                               # Backwards-compatibility wrapper re-exporting api/index
        ├── params.ts                            # nuqs searchParamsCache & parse definitions (tab, search, status, page, perPage, preset, fromDate, toDate, sort)
        ├── info-content.ts                      # PageContainer info popover content (Vietnamese guide for Fleet Dispatch)
        ├── components/
        │   ├── trips-listing.tsx                # Server Component prefetching queries & HydrationBoundary
        │   ├── trips-kpi-cards.tsx              # 4 KPI summary cards (Orders Awaiting Fleet, Confirmed Trips, External Vehicles, No Vehicle)
        │   ├── trips-date-preset-bar.tsx        # Quick date preset buttons + custom from/to date inputs
        │   ├── pending-orders-view.tsx          # Tab 1: Dispatch queue, order cards, badges, assign & no-vehicle triggers
        │   ├── assign-vehicle-dialog.tsx        # Modal: Single & Split Shipment modes, Capacity Gauge, External warnings
        │   ├── no-vehicle-dialog.tsx            # Modal: 5 Categorized reason radio options + notes + API submission
        │   └── trips-tables/
        │       ├── index.tsx                    # Tab 2: Client TanStack Table v8 with useDataTable, DataTable, DataTableToolbar, DataTablePagination
        │       ├── columns.tsx                  # ColumnDef<Trip>[] with DataTableColumnHeader, capacity metrics, badges
        │       ├── cell-action.tsx              # Row action menu + "Xác nhận Trip" button
        │       ├── options.tsx                  # Status filter faceted options (PENDING, CONFIRMED, IN_TRANSIT, COMPLETED, CANCELLED)
        │       └── use-trips-table-filters.tsx  # nuqs table filter hooks
```

---

## 7. Conclusion & Next Steps

1. The current trips implementation has rich operational logic (Capacity Gauge, Split Shipment, No-Vehicle Declaration, Confirm Trip) that is 100% functional and tested by Playwright E2E.
2. The refactoring into `features/trips/` must strictly maintain all element IDs, testids, button texts, Vietnamese toasts, and API contracts.
3. Once implemented, full build validation (`npm run build`) and E2E verification (`06-order-dispatch-workflow.spec.ts`) must pass with 0 errors.
