# Milestone 4: Trips & Vehicle Capacity Standardization — Architectural Report

**Author**: Explorer 2 (Frontend Architecture & Code Investigator)  
**Target Milestone**: Milestone 4 — Trips & Vehicle Capacity Standardization  
**Working Directory**: `d:\Projects\logistics-website\.agents\explorer_m4_trips_2`  
**Date**: 2026-08-18  

---

## 1. Executive Summary

This report establishes the comprehensive, production-grade architectural specification for refactoring `/dashboard/trips` and modularizing `src/features/trips/` in the Logistics TMS frontend (`frontend/src/`).

The legacy implementation of `/dashboard/trips` is a monolithic 1,688-line client component (`src/app/dashboard/trips/page.tsx`) that manages all state via manual `useState`/`useEffect`, custom non-standard table markup, local pagination, and monolithic modals. 

This refactoring transitions the Trips module into the canonical fullstack pattern established in Milestones 1–3 (`hubs/`, `fleet/`, `orders/`), featuring:
1. **Next.js 15 Server Component Architecture**: `page.tsx` parses URL search params on the server via `nuqs/server` and pre-fetches data via TanStack Query v5 hydration.
2. **Canonical DataTable Integration**: Standard `@tanstack/react-table` v8 table with `useDataTable`, `<DataTable>`, `<DataTableToolbar>`, `<DataTablePagination>`, sortable `<DataTableColumnHeader>`, and column pinning.
3. **`nuqs` URL State Synchronization**: Full URL synchronization for `tab` (`pending` vs `all`), `search`, `status`, `page`, `perPage`, `preset`, `fromDate`, `toDate`, and `sort`.
4. **Rich Dispatch Workflows Preservation**:
   - Real-time interactive **Capacity Gauge** calculating weight and volume utilization with overload alerts.
   - **Split Shipment Mode** supporting distribution across 2–5 vehicles with live allocation validation.
   - **No-Vehicle Declaration Dialog** with structured reason taxonomies (`BUSY`, `MAINTENANCE`, `OVER_CAPACITY`, `HUB_UNAVAILABLE`, `CUSTOM`).
   - **Trip Confirmation Action** with 100% E2E test parity (`button:has-text("Xác nhận Trip")`).
5. **Vietnamese Toast & API-First Governance**: Strict adherence to the `const apiMessage = err.response?.data?.message; toast.error(apiMessage || '...')` pattern.

---

## 2. Current State vs. Target State Analysis

| Dimension | Legacy Implementation (`trips/page.tsx`) | Target Architecture (`features/trips/`) |
|---|---|---|
| **File Structure** | 1 monolithic 1,688-line client file | 16 focused, decoupled modules across `api/`, `components/`, and `trips-tables/` |
| **Rendering Strategy** | 100% Client-rendered with initial loading spinners | Next.js Server Component + `prefetchQuery` + `<HydrationBoundary>` |
| **URL State** | Ephemeral `useState` (resets on page reload / loss of URL context) | Type-safe URL sync with `nuqs` (`tab`, `page`, `perPage`, `search`, `status`, `dateRange`) |
| **Table Engine** | Hard-coded `<table>` with manual pagination slice and local `TablePaginationBar` | Canonical `@tanstack/react-table` v8 wrapped in `@/components/ui/table/data-table` |
| **Data Fetching** | Raw imperative `useEffect` API calls | Declarative TanStack Query v5 (`useQuery`, `useMutation`, `queryOptions`) |
| **Cache Invalidation** | Manual `refreshAll()` function calling multiple loaders | Systematic `queryClient.invalidateQueries` for `trips`, `orders`, `fleet` |
| **Capacity Gauge** | Inline styling embedded in giant modal JSX | Modular `<CapacityGauge />` component with reusable utilization math |
| **Modals & Dialogs** | 600+ lines of nested modal forms in main file | Dedicated `<AssignVehicleDialog />` and `<NoVehicleDialog />` components |
| **E2E Compatibility** | Selectors tightly coupled to ad-hoc markup | 100% preservation of all E2E test IDs and text selectors |

---

## 3. Shared Infrastructure & Canonical Reference Patterns

### 3.1 Shared Table Components (`src/components/ui/table/`)
The Trips table must strictly reuse the project's standard table library:
- **`DataTable`** (`src/components/ui/table/data-table.tsx`): Renders table headers with pinning styles (`getCommonPinningStyles`), body rows, `<ScrollArea>` with horizontal scroll bar, and footer pagination.
- **`DataTableToolbar`** (`src/components/ui/table/data-table-toolbar.tsx`): Automatically parses column `meta` definitions to render text search inputs, select/multi-select dropdowns (`DataTableFacetedFilter`), date filters, view options (`DataTableViewOptions`), and reset button.
- **`DataTablePagination`** (`src/components/ui/table/data-table-pagination.tsx`): Displays selected row count, total rows, page navigation (First, Prev, Next, Last), and page size selector `[10, 20, 30, 40, 50]`.
- **`DataTableColumnHeader`** (`src/components/ui/table/data-table-column-header.tsx`): Provides ascending, descending, and hide options with sort indicator icons.

### 3.2 `useDataTable` Hook (`src/hooks/use-data-table.ts`)
Manages table state and synchronizes pagination (`page`, `perPage`), sorting (`sort`), and column filters with `nuqs`.
```typescript
const { table } = useDataTable({
  data: tripsData?.data ?? [],
  columns,
  pageCount,
  shallow: true,
  debounceMs: 300,
  initialState: {
    columnPinning: { right: ['actions'] }
  }
});
```

### 3.3 Server Prefetch & Hydration Pattern (from `features/orders/` & `features/hubs/`)
The Server Component pre-fetches all initial datasets on the server:
```typescript
// src/features/trips/components/trips-listing.tsx
const queryClient = getQueryClient();

await Promise.all([
  queryClient.prefetchQuery(tripsQueryOptions(filters)),
  queryClient.prefetchQuery(tripsStatsQueryOptions(dateRange.from, dateRange.to)),
  queryClient.prefetchQuery(pendingOrdersQueryOptions({ status: 'PENDING_ASSIGNMENT', ... })),
  queryClient.prefetchQuery(rawVehiclesQueryOptions()),
  queryClient.prefetchQuery(rawDriversQueryOptions()),
]);

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <TripsClientView />
  </HydrationBoundary>
);
```

---

## 4. Target Modular Architecture for `src/features/trips/`

### 4.1 Target Directory Layout

```
frontend/src/
├── app/
│   └── dashboard/
│       └── trips/
│           └── page.tsx                         # Next.js Server Component (Entry point)
└── features/
    └── trips/
        ├── params.ts                            # nuqs search params cache & serializer
        ├── info-content.ts                      # PageContainer header metadata & documentation
        ├── date-range.ts                        # Shared date range helpers & presets
        ├── api.ts                               # Root re-export for backwards compatibility
        ├── api/
        │   ├── types.ts                         # Trip interfaces, enums, payload DTOs
        │   ├── service.ts                       # Axios HTTP client calls to /api/v1/trips
        │   ├── queries.ts                       # TanStack Query queryOptions & custom hooks
        │   ├── mutations.ts                     # TanStack Query mutations with cache invalidation
        │   └── index.ts                         # Barrel re-export for api/
        └── components/
            ├── trips-listing.tsx                # Server Component prefetching queries
            ├── trips-client-view.tsx            # Client coordinator (Tabs, FilterBar, KPIs)
            ├── trips-date-preset-bar.tsx        # Date preset bar (Hôm nay, 7 ngày, Tháng này, etc.)
            ├── trips-kpi-cards.tsx              # 4 KPI cards with live stats & pulse skeleton
            ├── pending-orders-view.tsx          # Tab 1: Dispatch queue for pending orders
            ├── assign-vehicle-dialog.tsx        # Assign Vehicle modal dialog (Single + Split)
            ├── no-vehicle-dialog.tsx            # No-Vehicle declaration modal with reason taxonomy
            ├── capacity-gauge.tsx               # Visual interactive capacity utilization gauge
            └── trips-tables/
                ├── index.tsx                    # Tab 2: Client DataTable for All Trips
                ├── columns.tsx                  # ColumnDef<Trip>[] with headers & badges
                ├── cell-action.tsx              # Confirm Trip button & dropdown actions
                ├── options.tsx                  # Trip status options & badge renderers
                └── use-trips-table-filters.tsx  # nuqs URL search params hook
```

---

## 5. Detailed Component Specifications

### 5.1 `frontend/src/app/dashboard/trips/page.tsx`
- **Type**: Server Component (`async`)
- **Responsibilities**:
  - Awaits `props.searchParams`.
  - Invokes `tripsSearchParamsCache.parse(searchParams)`.
  - Renders `<PageContainer>` with title "Phân Công Xe & Quản Lý Chuyến", description, and `tripsInfoContent`.
  - Header action: `<Link href='/dashboard/fleet'><Button variant='outline'><IconTruck className='mr-2 h-4 w-4' /> Quản lý đội xe</Button></Link>`.
  - Wraps `<TripsListing />` inside `<Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />}>`.

### 5.2 `frontend/src/features/trips/params.ts`
Defines the `nuqs` search parameters schema:
```typescript
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const tripsSearchParams = {
  tab: parseAsString.withDefault('pending'),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString,
  status: parseAsString,
  vehicleId: parseAsString,
  driverId: parseAsString,
  preset: parseAsString.withDefault('thisMonth'),
  fromDate: parseAsString,
  toDate: parseAsString,
  sort: parseAsString
};

export const tripsSearchParamsCache = createSearchParamsCache(tripsSearchParams);
export const tripsSerialize = createSerializer(tripsSearchParams);
```

### 5.3 `frontend/src/features/trips/api/`

#### `types.ts`
Defines:
- `TripStatus`: `'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'`
- `TripOrderSummary`: Order snippet embedded in Trip object.
- `Trip`: Complete trip entity including `vehicle`, `driver`, `order`.
- `CreateTripPayload`: Single trip assignment payload.
- `CreateSplitTripsPayload`: Multi-trip split assignment payload.
- `UpdateTripPayload`: Partial update payload.
- `QueryTripParams`: Query filter params (`status`, `orderId`, `hub`, `search`, `fromDate`, `toDate`, `page`, `limit`).
- `TripStats`: KPI statistics (`tripsTotal`, `tripsPending`, `tripsConfirmed`, `tripsInTransit`, `tripsCompleted`, `tripsCancelled`, `ordersAwaitingFleet`, `ordersNoVehicle`, `fromDate`, `toDate`).

#### `service.ts`
Implements API client functions:
- `getTrips(params?: QueryTripParams): Promise<PaginatedResponse<Trip>>` (`GET /api/v1/trips`)
- `getTripStats(fromDate?: string, toDate?: string): Promise<TripStats>` (`GET /api/v1/trips/stats`)
- `getTripById(id: number): Promise<Trip>` (`GET /api/v1/trips/:id`)
- `createTrip(payload: CreateTripPayload): Promise<Trip>` (`POST /api/v1/trips`)
- `createSplitTrips(payload: CreateSplitTripsPayload): Promise<Trip[]>` (`POST /api/v1/trips/split`)
- `confirmTrip(id: number): Promise<Trip>` (`PATCH /api/v1/trips/:id/confirm`)
- `updateTrip(id: number, payload: Partial<CreateTripPayload>): Promise<Trip>` (`PATCH /api/v1/trips/:id`)
- `deleteTrip(id: number): Promise<void>` (`DELETE /api/v1/trips/:id`)

#### `queries.ts`
Defines `tripKeys` and `queryOptions`:
```typescript
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: QueryTripParams) => [...tripKeys.lists(), filters] as const,
  stats: () => [...tripKeys.all, 'stats'] as const,
  stat: (fromDate?: string, toDate?: string) =>
    [...tripKeys.stats(), { fromDate, toDate }] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: number) => [...tripKeys.details(), id] as const,
};

export const tripsQueryOptions = (filters: QueryTripParams = {}) =>
  queryOptions({
    queryKey: tripKeys.list(filters),
    queryFn: () => tripsApi.getTrips(filters),
  });

export const tripsStatsQueryOptions = (fromDate?: string, toDate?: string) =>
  queryOptions({
    queryKey: tripKeys.stat(fromDate, toDate),
    queryFn: () => tripsApi.getTripStats(fromDate, toDate),
  });
```

#### `mutations.ts`
Provides React Query mutation hooks that automatically invalidate relevant caches across trips, orders, and fleet:
- `useCreateTripMutation()` -> invalidates `tripKeys.all`, `orderKeys.all`, `fleetKeys.all`
- `useCreateSplitTripsMutation()` -> invalidates `tripKeys.all`, `orderKeys.all`, `fleetKeys.all`
- `useConfirmTripMutation()` -> invalidates `tripKeys.all`, `orderKeys.all`
- `useUpdateTripMutation()` -> invalidates `tripKeys.all`
- `useDeleteTripMutation()` -> invalidates `tripKeys.all`, `orderKeys.all`

---

## 6. Nuqs Tab Coordination & Dual-View Specification

### 6.1 Tab URL State Management
The dual tabs "Đơn Cần Phân Xe" (Pending Orders Queue) and "Danh Sách Chuyến Xe" (All Trips Table) are controlled via `nuqs` parameter `tab`:
- `tab=pending` (default): Renders `PendingOrdersView`.
- `tab=all`: Renders `TripsTable`.

In `trips-client-view.tsx`:
```typescript
const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('pending'));
```

### 6.2 E2E Selector & Tab Trigger Compatibility
To ensure 100% pass rate in Playwright E2E spec `06-order-dispatch-workflow.spec.ts`, the tab triggers MUST have exact button texts:
```tsx
<Tabs value={tab} onValueChange={(val) => setTab(val as 'pending' | 'all')}>
  <TabsList className='bg-slate-100 dark:bg-slate-800'>
    <TabsTrigger value='pending' id='tab-pending-orders' className='relative cursor-pointer'>
      Đơn Cần Phân Xe
      {pendingTotal > 0 && (
        <span className='ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white'>
          {pendingTotal}
        </span>
      )}
    </TabsTrigger>
    <TabsTrigger value='all' id='tab-all-trips' className='cursor-pointer'>
      Danh Sách Chuyến Xe ({tripsTotal})
    </TabsTrigger>
  </TabsList>

  <TabsContent value='pending'>
    <PendingOrdersView />
  </TabsContent>

  <TabsContent value='all'>
    <TripsTable />
  </TabsContent>
</Tabs>
```

---

## 7. Dispatch Workflows & UI Component Specs

### 7.1 Tab 1: `PendingOrdersView` (Dispatch Queue)
Displays orders awaiting vehicle assignment (`ordersApi.getOrders({ status: 'PENDING_ASSIGNMENT', ... })`).

#### Order Card Elements:
- Order code (`order.orderCode`) with status badge (`Chờ phân xe` or `Không có xe`).
- Route (`order.originHub` &rarr; `order.destinationHub`), total weight (`totalWeight` kg), total volume (`totalVolume` m³).
- External vehicle request banner if `order.isExternalVehicleNeeded`.
- Dispatcher's special notes banner (highlighted with amber border & icon).
- **"Báo hết xe" Button**: Opens `NoVehicleDialog` (hidden if already `NO_VEHICLE`).
- **"Phân công xe" Button**: Has attribute `data-testid={`btn-assign-order-${order.orderCode}`}`. Opens `AssignVehicleDialog`.

### 7.2 `AssignVehicleDialog` & Interactive `CapacityGauge`
The Assign Vehicle dialog supports both **Single Vehicle Assignment** and **Split Shipment Mode**:

#### Critical Form Inputs & Element IDs (Required for E2E and operational accuracy):
- Vehicle Select: `<select id="select-trip-vehicle" ...>`
- Driver Select: `<select id="select-trip-driver" ...>`
- Pickup Date: `<Input id="trip-pickup-date" type="date" ...>`
- Pickup Time: `<Input id="trip-pickup-time" type="time" ...>`
- ETA Date: `<Input id="trip-eta-date" type="date" ...>`
- Trip Notes: `<Textarea id="trip-notes-input" ...>`
- Submit Button: `<Button type="submit">Xác nhận phân công</Button>`

#### Interactive `CapacityGauge`:
When a vehicle is selected, the capacity gauge computes live utilization metrics:
```typescript
const weightRatio = Math.round((allocatedWeight / selectedVehicle.maxWeight) * 100);
const volumeRatio = selectedVehicle.maxVolume 
  ? Math.round((allocatedVolume / selectedVehicle.maxVolume) * 100) 
  : 0;
const isOverweight = allocatedWeight > selectedVehicle.maxWeight;
const isOvervolume = selectedVehicle.maxVolume ? allocatedVolume > selectedVehicle.maxVolume : false;
```
Visual feedback includes:
- Color-coded progress bar: Green (`bg-emerald-500`) if within capacity, Red (`bg-rose-500`) if overloaded.
- Overload warning banner recommending Split Shipment when weight or volume exceeds 100%.

#### Split Shipment Mode:
- Toggled via "Chia nhiều xe (Split Shipment)" button.
- Allows configuring 2 to 5 vehicle allocations (`splitRows`).
- Live aggregation displays total weight and volume allocated vs. total order weight and volume.
- Validation prevents submission if any row is missing a vehicle or allocated weight is $\le 0$.

### 7.3 `NoVehicleDialog` (No-Vehicle Declaration)
- Allows Fleet Manager to report that no internal fleet vehicle is available for the order.
- Structured reason options (radio buttons):
  1. `BUSY`: "Toàn bộ xe nội bộ phù hợp đang trong lộ trình vận chuyển"
  2. `MAINTENANCE`: "Xe đang trong kế hoạch bảo dưỡng, kiểm định kỹ thuật"
  3. `OVER_CAPACITY`: "Khối lượng / thể tích vượt quá tải trọng của xe khả dụng"
  4. `HUB_UNAVAILABLE`: "Không có xe khả dụng tại Hub xuất phát này"
  5. `CUSTOM`: "Lý do khác / Khuyến nghị điều xe ngoài cụ thể"
- Textarea for detailed notes / recommendations (`#no-vehicle-custom-reason`).
- Calls `ordersApi.markNoVehicle(order.id, finalReason)` and updates order status to `NO_VEHICLE`.

### 7.4 Tab 2: `TripsTable` & Columns (`src/features/trips/components/trips-tables/`)

#### Table Columns Definition (`columns.tsx`):
1. **`sequenceNumber` / `tripCode`**:
   - Header: `DataTableColumnHeader` ("Chuyến Xe / Mã Đơn")
   - Cell: Displays `Chuyến #{trip.sequenceNumber || trip.id}`, `Xe ngoài` badge if `trip.vehicle?.isExternal`, and link to `/dashboard/orders/${trip.orderId}` with `orderCode`.
   - Meta: Text search filter (`trips-search-input`).
2. **`vehicle`**:
   - Header: `DataTableColumnHeader` ("Phương Tiện")
   - Cell: License plate in bold monospace, vehicle type/model, external provider tag if external.
3. **`driver`**:
   - Header: `DataTableColumnHeader` ("Tài Xế")
   - Cell: Driver name, contact phone number, license class badge.
4. **`capacity` / `weights`**:
   - Header: `DataTableColumnHeader` ("Khối Lượng / m³")
   - Cell: Monospace allocated weight (`weightAllocated.toLocaleString() kg`) and volume (`volumeAllocated m³`), plus miniature visual capacity progress indicator.
5. **`schedule`**:
   - Header: "Lịch Trình"
   - Cell: Pickup date/time and estimated delivery date.
6. **`status`**:
   - Header: `DataTableColumnHeader` ("Trạng Thái")
   - Cell: Status badge (`CONFIRMED` -> "Đã xác nhận", `IN_TRANSIT` -> "Đang chạy", `PENDING` -> "Chờ xác nhận", `COMPLETED` -> "Hoàn thành", `CANCELLED` -> "Đã hủy").
   - Meta: Select filter with `TRIP_STATUS_OPTIONS`.
7. **`actions`**:
   - Header: "Thao Tác"
   - Cell: `CellAction` component.

#### `CellAction` Component (`cell-action.tsx`):
- **Inline Action**: For `trip.status === 'PENDING'`, renders:
  ```tsx
  <Button
    size='sm'
    onClick={() => handleConfirmTrip(trip.id)}
    className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5 cursor-pointer'
  >
    <IconCheck className='h-3.5 w-3.5 mr-1' />
    Xác nhận Trip
  </Button>
  ```
- **Dropdown Menu**: For all trips, provides "Xem chi tiết", "Đánh dấu hoàn thành" (if `IN_TRANSIT`), and "Hủy chuyến xe" with confirmation dialog.

---

## 8. Toast Notifications & Error Handling Rules

In strict compliance with Workspace Safety & Governance Rules:
1. **100% Vietnamese**: All toast messages must be in Vietnamese.
2. **API Message First**: For all API errors, extract the backend message:
   ```typescript
   try {
     await tripsApi.confirmTrip(tripId);
     toast.success('Xác nhận chuyến xe thành công!', {
       description: 'Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho.'
     });
   } catch (err: unknown) {
     const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
     toast.error(apiMessage || 'Không thể xác nhận chuyến xe. Vui lòng thử lại.');
   }
   ```

---

## 9. Verification & E2E Validation Plan

### 9.1 Build Verification
- Command: `npm run build` in `frontend/`
- Expected: 0 TypeScript errors, successful Next.js static/dynamic route generation for `/dashboard/trips`.

### 9.2 Playwright E2E Test Suite
- Command: `npx playwright test e2e/06-order-dispatch-workflow.spec.ts`
- Verification Steps:
  1. Dispatcher creates order `$testOrderCode` -> Submits to Fleet -> Status `Chờ điều xe`.
  2. Fleet Manager logs in -> Visits `/dashboard/trips` -> Sees `[data-testid="btn-assign-order-$testOrderCode"]` -> Selects `#select-trip-vehicle` -> Submits with `Xác nhận phân công`.
  3. Clicks `button:has-text("Danh Sách Chuyến Xe")` -> Locates row `tr:has-text("$testOrderCode")` -> Clicks `button:has-text("Xác nhận Trip")`.
  4. Asserts status changes to `Đã xác nhận`.
  5. Warehouse Manager logs in -> Visits `/dashboard/warehouse` -> Confirms trip appears on Inbound Board.

---

## 10. Conclusion & Recommendations

The target architecture provides a complete, modular, and resilient structure for Milestone 4. By standardizing `src/features/trips/` into standard components, hooks, queries, and mutations, the Trips feature will attain full parity with the canonical DataTable pattern, improve maintainability, and ensure 100% reliable operational workflows.
