# Comprehensive Investigation Report: Trips & Vehicle Capacity Standardization (Milestone 4)

**Explorer**: Explorer 3 (Milestone 4 — Trips & Vehicle Capacity Standardization)  
**Date**: 2026-08-18  
**Working Directory**: `d:\Projects\logistics-website\.agents\explorer_m4_trips_3`  
**Target Milestone**: Milestone 4 (`frontend/src/app/dashboard/trips/page.tsx` & `frontend/src/features/trips/`)  

---

## 1. Executive Summary

This investigation report provides the complete specification, contract analysis, and implementation blueprint for **Milestone 4 (Trips & Vehicle Capacity Standardization)**. It covers:
1. **Playwright E2E Test Suite Contracts & Critical DOM Selectors**: Detailed step-by-step element requirements for `06-order-dispatch-workflow.spec.ts`, `07-capture-user-guide-screenshots.spec.ts`, and `03-rbac-routing.spec.ts`.
2. **Backend NestJS API Contracts**: Endpoints, DTO definitions, request payloads, response structures, and business logic side effects across `trips`, `orders`, `vehicles`, and `drivers`.
3. **3-Layer RBAC Enforcement**: Matrix verification across Sidebar Navigation UI, Next.js Proxy Route Guard (`proxy.ts`), and Backend Controller Guards (`@Roles`).
4. **Toast Notification System Rules**: 100% Vietnamese translation & API-first error message extraction standards.
5. **Architectural Blueprint for Refactoring**: TanStack React Table v8 + `nuqs` URL search params modular structure following the pattern established in Milestone 1-3.

---

## 2. Playwright E2E Test Specifications & Critical DOM Selectors

### 2.1 E2E Specs Interacting with `/dashboard/trips`

| Test File | Role | Key Interactions & Expectations |
|-----------|------|--------------------------------|
| `frontend/e2e/06-order-dispatch-workflow.spec.ts` | `FLEET_MANAGER` | 1. Navigates to `/dashboard/trips`<br>2. Finds pending order via `[data-testid="btn-assign-order-${testOrderCode}"]`<br>3. Opens assign modal, selects vehicle via native `<select id="select-trip-vehicle">`<br>4. Submits with `button[type="submit"]:has-text("Xác nhận phân công")`<br>5. Switches tab with `button:has-text("Danh Sách Chuyến Xe")`<br>6. Confirms trip via `tr:has-text("${testOrderCode}") button:has-text("Xác nhận Trip")`<br>7. Verifies table status row contains `"Đã xác nhận"`. |
| `frontend/e2e/07-capture-user-guide-screenshots.spec.ts` | `FLEET_MANAGER` | 1. Navigates to `/dashboard/trips`<br>2. Captures pending board screenshot (`07_fleet_trips_pending_board.png`)<br>3. Opens modal via `[data-testid="btn-assign-order-${testOrderCode}"]`<br>4. Fills inputs: `#select-trip-vehicle`, `#trip-pickup-date`, `#trip-pickup-time`, `#trip-eta-date`, `#trip-notes-input`<br>5. Toggles Split mode: `button:has-text("Chuyển sang Split")`<br>6. Toggles back: `button:has-text("Đang chia nhiều xe")`<br>7. Submits single assignment: `button[type="submit"]:has-text("Xác nhận phân công")`<br>8. Switches tab: `button:has-text("Danh Sách Chuyến Xe")`<br>9. Confirms trip: `tr:has-text("${testOrderCode}") button:has-text("Xác nhận Trip")`<br>10. Verifies `"Đã xác nhận"`. |
| `frontend/e2e/03-rbac-routing.spec.ts` | All Roles | Route `/dashboard/trips` allowed for `SUPER_ADMIN` and `FLEET_MANAGER`; blocked (redirect to `/dashboard/overview`) for `DISPATCHER` and `WAREHOUSE_MANAGER`. |

---

### 2.2 Critical DOM Selectors & Elements Inventory (MANDATORY TO PRESERVE)

```
========================================================================================================================
ELEMENT / COMPONENT             EXACT SELECTOR / LOCATOR                      PURPOSE / INTERACTION
========================================================================================================================
Tab: Đơn Cần Phân Xe            TabsTrigger value='pending-orders'            Switches to Pending Orders Dispatch Queue
                                OR button:has-text("Đơn Cần Phân Xe")
------------------------------------------------------------------------------------------------------------------------
Tab: Danh Sách Chuyến Xe        TabsTrigger value='all-trips'                 Switches to All Trips Table View
                                OR button:has-text("Danh Sách Chuyến Xe")
------------------------------------------------------------------------------------------------------------------------
Assign Vehicle Trigger Button   [data-testid^="btn-assign-order-"]            Opens Assign Vehicle Dialog
                                e.g. [data-testid="btn-assign-order-${code}"] (Must contain orderCode in testid!)
------------------------------------------------------------------------------------------------------------------------
No-Vehicle Trigger Button       button:has-text("Báo hết xe")                 Opens No-Vehicle Declaration Dialog
------------------------------------------------------------------------------------------------------------------------
Vehicle Dropdown (Modal)        #select-trip-vehicle                          Native <select> element for vehicle selection
                                                                              (Playwright uses .selectOption({ index: 1 }))
------------------------------------------------------------------------------------------------------------------------
Driver Dropdown (Modal)         #select-trip-driver                           Native <select> element for driver selection
------------------------------------------------------------------------------------------------------------------------
Pickup Date Input               #trip-pickup-date                             <input type="date"> for pickup schedule
------------------------------------------------------------------------------------------------------------------------
Pickup Time Input               #trip-pickup-time                             <input type="time"> for pickup time (e.g. 08:00)
------------------------------------------------------------------------------------------------------------------------
ETA Delivery Date Input         #trip-eta-date                                <input type="date"> for delivery date
------------------------------------------------------------------------------------------------------------------------
Trip Notes Textarea             #trip-notes-input                             <textarea> for driver/warehouse notes
------------------------------------------------------------------------------------------------------------------------
Toggle Split Mode Button        button:has-text("Chuyển sang Split")          Switches to Split Shipment mode (2-5 vehicles)
------------------------------------------------------------------------------------------------------------------------
Toggle Single Mode Button       button:has-text("Đang chia nhiều xe")         Switches back to single vehicle mode
------------------------------------------------------------------------------------------------------------------------
Split Row Vehicle Dropdown      #split-vehicle-${idx}                         Vehicle select for split row idx (0-4)
------------------------------------------------------------------------------------------------------------------------
Split Row Driver Dropdown       #split-driver-${idx}                          Driver select for split row idx (0-4)
------------------------------------------------------------------------------------------------------------------------
Split Row Weight Input          #split-weight-${idx}                          Weight input (kg) for split row idx
------------------------------------------------------------------------------------------------------------------------
Split Row Volume Input          #split-volume-${idx}                          Volume input (m³) for split row idx
------------------------------------------------------------------------------------------------------------------------
Split Row Pickup Date Input     #split-pickup-${idx}                          Pickup date input for split row idx
------------------------------------------------------------------------------------------------------------------------
Split Row ETA Date Input        #split-delivery-${idx}                        ETA date input for split row idx
------------------------------------------------------------------------------------------------------------------------
Split Add Vehicle Button        button:has-text("Thêm xe chở hàng")           Adds split row (up to max 5 rows)
------------------------------------------------------------------------------------------------------------------------
Split Remove Vehicle Button     button:has-text("Xóa xe này")                 Removes split row
------------------------------------------------------------------------------------------------------------------------
Submit Assignment Button        button[type="submit"]:has-text(               Submits single or split assignment
                                  "Xác nhận phân công")
------------------------------------------------------------------------------------------------------------------------
Confirm Trip Row Action Button  tr:has-text("${testOrderCode}")               Calls PATCH /api/v1/trips/:id/confirm
                                button:has-text("Xác nhận Trip")              (Only shown on PENDING trips)
------------------------------------------------------------------------------------------------------------------------
Status Text Badge in Row        tr:has-text("${testOrderCode}"):has-text(     Verifies status change after confirmation
                                  "Đã xác nhận")
------------------------------------------------------------------------------------------------------------------------
No-Vehicle Reason Radio         input[name="noVehicleReason"][value="..."]    Radio buttons (BUSY, MAINTENANCE, 
                                                                              OVER_CAPACITY, HUB_UNAVAILABLE, CUSTOM)
------------------------------------------------------------------------------------------------------------------------
No-Vehicle Custom Note          #no-vehicle-custom-reason                     <textarea> for dispatcher instructions
------------------------------------------------------------------------------------------------------------------------
Confirm No-Vehicle Button       button:has-text("Xác nhận báo hết xe")        Submits PATCH /api/v1/orders/:id/no-vehicle
========================================================================================================================
```

---

## 3. Backend API Contracts for Trips & Related Endpoints

### 3.1 Trips Endpoints (`backend/src/trips/trips.controller.ts`)

#### 1. `POST /api/v1/trips`
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Request Payload (`CreateTripDto`)**:
  ```json
  {
    "orderId": 101,
    "vehicleId": 5,
    "driverId": 2,
    "pickupDate": "2026-08-20",
    "pickupTime": "08:30",
    "estimatedDeliveryDate": "2026-08-22",
    "weightAllocated": 18000,
    "volumeAllocated": 45.0,
    "sequenceNumber": 1,
    "notes": "Lưu ý niêm phong chì seal cửa số 3"
  }
  ```
- **Response**: `201 Created` with `TripEntity`
- **Business Logic**:
  - Validates `orderId` exists.
  - If `vehicle.isExternal === true`, automatically sets `order.isExternalVehicleNeeded = true`.
  - Sets initial `status = 'PENDING'`.

#### 2. `POST /api/v1/trips/split`
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Request Payload (`CreateSplitTripsDto`)**:
  ```json
  {
    "orderId": 101,
    "trips": [
      {
        "vehicleId": 5,
        "driverId": 2,
        "weightAllocated": 9000,
        "volumeAllocated": 22.5,
        "pickupDate": "2026-08-20",
        "pickupTime": "08:00",
        "estimatedDeliveryDate": "2026-08-22",
        "notes": "Chuyến xe 1"
      },
      {
        "vehicleId": 6,
        "driverId": 3,
        "weightAllocated": 9000,
        "volumeAllocated": 22.5,
        "pickupDate": "2026-08-20",
        "pickupTime": "08:00",
        "estimatedDeliveryDate": "2026-08-22",
        "notes": "Chuyến xe 2"
      }
    ]
  }
  ```
- **Constraints**: Minimum 2 trips, maximum 5 trips (`@ArrayMinSize(2)`, `@ArrayMaxSize(5)`).
- **Response**: `201 Created` with `TripEntity[]`
- **Business Logic**:
  - Deletes any existing `PENDING` trips for that order.
  - Creates 2 to 5 trips with assigned `sequenceNumber` (1..N).
  - Flags order if any assigned vehicle is external.

#### 3. `GET /api/v1/trips`
- **Roles**: All authenticated users (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`)
- **Query Parameters (`QueryTripDto`)**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `status` (string, `PENDING | CONFIRMED | IN_TRANSIT | COMPLETED | CANCELLED | ALL`)
  - `orderId` (string)
  - `hub` (string: matches `order.originHub`, `order.destinationHub`, or `vehicle.currentHub`)
  - `search` (string: matches `orderCode`, `licensePlate`, `fullName`, `notes`)
  - `fromDate` (string: YYYY-MM-DD)
  - `toDate` (string: YYYY-MM-DD)
- **Response Schema (`PaginatedResult<TripEntity>`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "orderId": 101,
        "vehicleId": 5,
        "driverId": 2,
        "status": "CONFIRMED",
        "pickupDate": "2026-08-20",
        "pickupTime": "08:30",
        "estimatedDeliveryDate": "2026-08-22",
        "weightAllocated": 18000,
        "volumeAllocated": 45.0,
        "sequenceNumber": 1,
        "notes": "...",
        "order": {
          "id": 101,
          "orderCode": "E2E1234",
          "originHub": "Hub Hà Nội",
          "destinationHub": "Hub Đà Nẵng",
          "totalWeight": 18000,
          "totalVolume": 45.0,
          "goodsDescription": "Linh kiện điện tử"
        },
        "vehicle": {
          "id": 5,
          "licensePlate": "29C-12345",
          "type": "Tải 15T",
          "isExternal": false,
          "maxWeight": 20000,
          "maxVolume": 50.0
        },
        "driver": {
          "id": 2,
          "fullName": "Nguyễn Văn A",
          "phone": "0987654321",
          "licenseClass": "FC"
        },
        "createdAt": "2026-08-18T09:00:00.000Z",
        "updatedAt": "2026-08-18T09:15:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```

#### 4. `GET /api/v1/trips/stats`
- **Roles**: All authenticated users
- **Query Parameters (`QueryTripStatsDto`)**: `fromDate`, `toDate` (ISO date strings, defaults to current month)
- **Response Schema (`TripStatsResult`)**:
  ```json
  {
    "tripsTotal": 45,
    "tripsPending": 12,
    "tripsConfirmed": 20,
    "tripsInTransit": 8,
    "tripsCompleted": 5,
    "tripsCancelled": 0,
    "ordersAwaitingFleet": 7,
    "ordersNoVehicle": 2,
    "fromDate": "2026-08-01",
    "toDate": "2026-08-31"
  }
  ```
  *(Note: `ordersAwaitingFleet` counts live orders with `status='PENDING_FLEET'`; `ordersNoVehicle` counts live orders with `status='NO_VEHICLE'`)*.

#### 5. `PATCH /api/v1/trips/:id/confirm`
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Response**: `200 OK` with updated `TripEntity` (`status = 'CONFIRMED'`)
- **Business Logic Side Effects**:
  1. Sets `trip.status = 'CONFIRMED'`.
  2. Checks if all trips for `orderId` are confirmed/completed: if yes, updates `order.status = 'ASSIGNED'`.
  3. Creates In-App Notifications for `WAREHOUSE_MANAGER`, `DISPATCHER`, `FLEET_MANAGER`, `SUPER_ADMIN`.
  4. Triggers Mail Notification via `MailService.sendTripConfirmedNotification`.

#### 6. `PATCH /api/v1/trips/:id`
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Payload (`UpdateTripDto`)**: Partial of `CreateTripDto`
- **Response**: `200 OK` with updated `TripEntity`

#### 7. `DELETE /api/v1/trips/:id`
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Response**: `204 No Content` (Soft delete)

---

### 3.2 Auxiliary Endpoints Used by Trips Workflow

#### 1. Orders Dispatch Queue (`GET /api/v1/orders`)
- Used in Pending Orders tab:
  `ordersApi.getOrders({ status: 'PENDING_ASSIGNMENT', search, fromDate, toDate, page, limit })`
- Returns orders waiting for fleet assignment (`PENDING_FLEET` & `NO_VEHICLE`).

#### 2. Declare No-Vehicle (`PATCH /api/v1/orders/:id/no-vehicle`)
- **Roles**: `SUPER_ADMIN`, `FLEET_MANAGER`
- **Request Body**: `{ "reason": "Lý do hết xe..." }`
- **Response**: `200 OK` with `OrderEntity` (`status = 'NO_VEHICLE'`)
- **Business Logic**: Sets order status to `NO_VEHICLE`, updates notes, dispatches notifications to Dispatcher.

#### 3. Fleet Vehicles & Drivers
- `GET /api/v1/vehicles` (Returns available fleet vehicles, capacity, external provider info)
- `GET /api/v1/drivers` (Returns active drivers, license classes, phone numbers)

---

## 4. RBAC Permission Matrix & Route Guard Analysis

| Layer | Component | Permitted Roles | Blocked Roles | Behavior on Block |
|-------|-----------|-----------------|---------------|-------------------|
| **Layer 1: Sidebar UI** | `frontend/src/config/nav-config.ts` | `SUPER_ADMIN`, `FLEET_MANAGER` | `DISPATCHER`, `WAREHOUSE_MANAGER` | Menu item "Phân công xe" (`/dashboard/trips`) hidden from sidebar and Cmd+K bar |
| **Layer 2: Route Guard** | `frontend/src/proxy.ts` (Next.js Middleware) | `SUPER_ADMIN`, `FLEET_MANAGER` | `DISPATCHER`, `WAREHOUSE_MANAGER`, unauthenticated | Redirects unauthorized user to `/dashboard/overview` or `/auth/sign-in` |
| **Layer 3: API Guard** | `backend/src/trips/trips.controller.ts` | `POST /trips`, `POST /trips/split`, `PATCH /trips/:id`, `PATCH /trips/:id/confirm`, `DELETE /trips/:id`: `SUPER_ADMIN`, `FLEET_MANAGER` | Other roles forbidden (`403 Forbidden`) on WRITE operations. GET endpoints accessible with valid JWT. |

---

## 5. Toast Notification System Standard (100% Vietnamese & API-First)

All toast notifications across Trips feature components MUST strictly obey these rules:

1. **Rule 1 — 100% Vietnamese**: No English strings in business domain toasts.
2. **Rule 2 — API Message First**: Extract backend error messages before fallback.
   ```typescript
   // Standard Error Toast Pattern:
   const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
   toast.error(apiMessage || 'Thông báo lỗi tiếng Việt dự phòng.');
   ```
3. **Inventory of Canonical Toast Messages for Trips**:
   - `toast.success('Xác nhận chuyến xe thành công!', { description: 'Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho.' })`
   - `toast.success(`Đã phân công xe cho đơn hàng ${orderCode}`)`
   - `toast.success(`Đã chia đơn ${orderCode} sang ${count} chuyến xe!`)`
   - `toast.warning(`Đã báo hết xe cho đơn ${orderCode}`, { description: 'Bộ phận Điều phối (Dispatcher) đã được cập nhật để chủ động thuê xe ngoài.' })`
   - `toast.error(apiMessage || 'Không thể tải danh sách đơn hàng chờ phân xe.')`
   - `toast.error(apiMessage || 'Không thể tải danh sách chuyến xe.')`
   - `toast.error(apiMessage || 'Lỗi khi phân công chuyến xe. Vui lòng thử lại.')`
   - `toast.error(apiMessage || 'Không thể xác nhận chuyến xe. Vui lòng thử lại.')`
   - `toast.error(apiMessage || 'Lỗi cập nhật trạng thái hết xe. Vui lòng thử lại.')`

---

## 6. Recommended Target Architecture for Refactoring (`src/features/trips/`)

Following the architecture established in M1 (Hubs), M2 (Fleet), and M3 (Orders):

```
frontend/src/
├── app/dashboard/trips/
│   ├── page.tsx                           # Server Component parsing searchParamsCache
│   └── loading.tsx                        # Suspense fallback skeleton
├── features/trips/
│   ├── api/
│   │   ├── types.ts                       # Trip, TripStats, DTO interfaces
│   │   ├── service.ts                     # tripsApi HTTP methods
│   │   ├── queries.ts                     # TanStack Query queryOptions
│   │   ├── mutations.ts                   # useMutation hooks (create, split, confirm, update, delete)
│   │   └── index.ts                       # Barrel export
│   ├── components/
│   │   ├── trips-listing.tsx              # Server Component prefetching stats & trips
│   │   ├── trips-kpi-cards.tsx            # KPI Cards (Awaiting, Confirmed, External, No Vehicle)
│   │   ├── trips-date-preset-bar.tsx      # Date preset buttons & custom range picker
│   │   ├── pending-orders-view.tsx        # Tab 1: Dispatch queue with Assign Order & No-Vehicle triggers
│   │   ├── assign-vehicle-dialog.tsx      # Single & Split Assignment Dialog with Capacity Gauge
│   │   ├── no-vehicle-dialog.tsx          # No-Vehicle Declaration Dialog with categorized reasons
│   │   ├── trips-tables/
│   │   │   ├── index.tsx                  # Client Table Component with useDataTable & <DataTable>
│   │   │   ├── columns.tsx                # ColumnDef<Trip>[] with DataTableColumnHeader & badges
│   │   │   ├── cell-action.tsx            # Row Actions: Confirm Trip button, Action Menu
│   │   │   ├── options.tsx                # Faceted filter options (status, external)
│   │   │   └── use-trips-table-filters.tsx# nuqs filter state hook
│   │   └── index.ts
│   ├── params.ts                          # tripsSearchParamsCache definition
│   ├── date-range.ts                      # Date presets & helpers
│   └── info-content.ts                    # PageContainer info popover content
```

---

## 7. Verification & Invalidation Conditions

### Verification Method
1. **TypeScript Compile Check**:
   ```bash
   cd frontend && npx tsc --noEmit
   ```
2. **Build Check**:
   ```bash
   cd frontend && npm run build
   ```
3. **Playwright E2E Test Suite**:
   ```bash
   cd frontend && npx playwright test e2e/06-order-dispatch-workflow.spec.ts
   cd frontend && npx playwright test e2e/03-rbac-routing.spec.ts
   ```

### Invalidation Conditions
- Any changes to `#select-trip-vehicle`, `[data-testid^="btn-assign-order-"]`, or `button:has-text("Xác nhận Trip")` will cause E2E tests to fail.
- Missing role permissions in `frontend/src/proxy.ts` or `backend/src/trips/trips.controller.ts` will violate RBAC and break routing tests.
