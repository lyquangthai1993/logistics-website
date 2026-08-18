# Handoff Report: Explorer 1 (Milestone 4 - Trips & Vehicle Capacity Standardization)

**Agent ID**: `explorer_m4_trips_1`  
**Parent ID**: `1f99beda-cda9-4822-9af5-33ecadc4ad09` (Milestone 4 Sub-Orchestrator)  
**Target Module**: Trips & Vehicle Capacity Standardization (`frontend/src/app/dashboard/trips/` -> `frontend/src/features/trips/`)  
**Artifact**: `d:\Projects\logistics-website\.agents\explorer_m4_trips_1\report.md`  

---

## 1. Observation

- **Monolithic Implementation**: `frontend/src/app/dashboard/trips/page.tsx` is a 1,688-line client component (79,518 bytes) handling all views, state management, modals, and client-side data fetching directly via `useEffect`.
- **Existing Features & Workflows**:
  - **Dual-Tab Workspace**:
    - Tab 1: `"Đơn Cần Phân Xe"` (Pending Orders Dispatch Queue) querying `ordersApi.getOrders({ status: 'PENDING_ASSIGNMENT' })` (`backend/src/orders/orders.service.ts` line 102 maps `PENDING_ASSIGNMENT` to `IN ('PENDING_FLEET', 'NO_VEHICLE')`).
    - Tab 2: `"Danh Sách Chuyến Xe"` (All Trips Table) querying `tripsApi.getTrips(...)`.
  - **Assign Vehicle Modal**:
    - Button trigger: `[data-testid^="btn-assign-order-"]` (`btn-assign-order-${order.orderCode}`).
    - Order summary banner with highlighted gradient amber dispatch notes (`selectedOrder.notes`) and external vehicle notice (`selectedOrder.isExternalVehicleNeeded`).
    - Single mode: Vehicle dropdown (`#select-trip-vehicle`), Driver dropdown (`#select-trip-driver`), live interactive Capacity Gauge (`selectedOrder.totalWeight / selectedVehicle.maxWeight`), visual progress bar, overload warning (`"Cảnh báo: Khối lượng đơn vượt quá tải trọng xe. Khuyến nghị bật Split Shipment để chia tải."`), dates (`#trip-pickup-date`, `#trip-pickup-time`, `#trip-eta-date`), notes (`#trip-notes-input`).
    - Split shipment mode: Toggled by `button:has-text("Chuyển sang Split")` / `button:has-text("Đang chia nhiều xe")`, allows 2–5 split trips (`splitRows`), displays live total allocated weight and volume vs order totals, per-row vehicle (`#split-vehicle-${idx}`), driver (`#split-driver-${idx}`), weight (`#split-weight-${idx}`), volume (`#split-volume-${idx}`), pickup date (`#split-pickup-${idx}`), delivery date (`#split-delivery-${idx}`).
  - **No-Vehicle Declaration Modal**:
    - Button trigger: `button:has-text("Báo hết xe")`.
    - Radio options: 5 categories (`BUSY`, `MAINTENANCE`, `OVER_CAPACITY`, `HUB_UNAVAILABLE`, `CUSTOM`).
    - Textarea: `#no-vehicle-custom-reason`.
    - Submits to `ordersApi.markNoVehicle(order.id, finalReason)` and warns via toast.
  - **Trip Actions & Badges**:
    - Confirm trip action: `button:has-text("Xác nhận Trip")` calls `tripsApi.confirmTrip(trip.id)`. Backend transitions trip to `CONFIRMED`, marks order as `ASSIGNED` if all trips confirmed, dispatches in-app notifications and email notifications to Warehouse Manager, Dispatcher, Fleet Manager.
    - Badges: `PENDING` ("Chờ xác nhận"), `CONFIRMED` ("Đã xác nhận"), `IN_TRANSIT` ("Đang chạy"), `COMPLETED` ("Hoàn thành"), `CANCELLED` ("Đã hủy"), `[Xe ngoài]` badge for external vehicles.
  - **KPI Summary Cards**:
    - 4 Cards: "Đơn hàng cần phân xe" (`ordersAwaitingFleet`), "Chuyến xe đã xác nhận" (`tripsConfirmed + tripsInTransit`), "Xe thuê ngoài (External)" (`vehicles.filter(v => v.isExternal).length`), "Đơn báo không có xe" (`ordersNoVehicle`).
  - **Toasts & Error Extraction**:
    - All toasts are 100% Vietnamese.
    - API error extraction: `const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message; toast.error(apiMessage || 'Fallback tiếng Việt')`.
- **E2E Test Specifications**:
  - `frontend/e2e/06-order-dispatch-workflow.spec.ts` and `frontend/e2e/07-capture-user-guide-screenshots.spec.ts` test this full workflow end-to-end.

---

## 2. Logic Chain

1. **Architecture Parity**: Following Milestones 1–3 (Hubs, Fleet, Orders), the trips module must transition from a monolithic client component into a modular `features/trips/` package with Server Component prefetching and canonical TanStack Table v8.
2. **Backwards Compatibility**: Other pages (such as `frontend/src/app/dashboard/warehouse/page.tsx`) import `{ tripsApi, Trip }` from `@/features/trips/api`. Thus, `@/features/trips/api.ts` must continue to export the exact same functions and types, delegating to `@/features/trips/api/index.ts`.
3. **E2E Invariant Preservation**: Automated test suites rely on exact selectors (`[data-testid^="btn-assign-order-"]`, `#select-trip-vehicle`, `#select-trip-driver`, `#trip-pickup-date`, `#trip-pickup-time`, `#trip-eta-date`, `#trip-notes-input`, `button:has-text("Xác nhận Trip")`, `button:has-text("Danh Sách Chuyến Xe")`, `button:has-text("Xác nhận phân công")`). All selectors, IDs, and button texts must be retained verbatim.
4. **State Synchronization**: Using `nuqs` ensures that active tab (`tab=pending-orders` vs `tab=all-trips`), search filter (`search`), pagination (`page`, `perPage`), status filter (`status`), and date range (`preset`, `fromDate`, `toDate`) are synchronized with the URL.

---

## 3. Caveats

- **External Vehicle Flagging**: When a trip is created with an external vehicle (`vehicle.isExternal === true`), the backend automatically updates `order.isExternalVehicleNeeded = true`. The frontend must reflect this with the amber `[Xe ngoài]` badge and external alert callouts.
- **Pending Orders Query Alias**: Tab 1 queries `ordersApi.getOrders({ status: 'PENDING_ASSIGNMENT' })`. Do not change `PENDING_ASSIGNMENT` to `PENDING_FLEET`, as `PENDING_ASSIGNMENT` is the backend's explicit alias that returns both `PENDING_FLEET` and `NO_VEHICLE` orders.
- **No Direct Source Changes by Explorer**: This investigation is strictly read-only. Implementation must be carried out by the Milestone 4 implementer subagents.

---

## 4. Conclusion

The investigation of the Trips & Vehicle Capacity Management feature is complete. All workflows, UI states, calculations, validations, Vietnamese toasts, and E2E selectors have been cataloged and mapped into a proposed modular structure. The full findings are documented in `report.md`.

---

## 5. Verification Method

- Inspect `report.md` at `d:\Projects\logistics-website\.agents\explorer_m4_trips_1\report.md`.
- Cross-reference with `frontend/src/app/dashboard/trips/page.tsx` and `backend/src/trips/trips.service.ts`.
- Verify E2E selectors against `frontend/e2e/06-order-dispatch-workflow.spec.ts` and `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`.
