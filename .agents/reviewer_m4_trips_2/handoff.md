# Reviewer 2 Handoff Report: Milestone 4 (Trips & Vehicle Capacity Standardization)

**Reviewer**: Reviewer 2 (Roles: Reviewer, Critic)  
**Target Milestone**: Milestone 4 — Trips & Vehicle Capacity Standardization  
**Working Directory**: `d:\Projects\logistics-website\.agents\reviewer_m4_trips_2`  
**Date**: 2026-08-18  
**Verdict**: **APPROVE**  
**Integrity Status**: **CLEAN (No integrity violations detected)**  

---

## 1. Observation

Direct code inspection and tool outputs across `frontend/src/features/trips/` and `frontend/src/app/dashboard/trips/`:

### A. `<CapacityGauge />` (`src/features/trips/components/capacity-gauge.tsx`)
1. **Utilization Math** (lines 25–44):
   - `maxWeight = Number(vehicle.maxWeight)`
   - `weightRatio = Math.round((allocatedWeight / maxWeight) * 100)`
   - `isOverweight = allocatedWeight > maxWeight`
   - `volumeRatio = Math.round((allocatedVolume / maxVolume) * 100)` when `maxVolume > 0 && allocatedVolume > 0`
   - `isOvervolume = allocatedVolume > maxVolume`
2. **Progress Bar Visuals** (lines 88–95):
   - Dynamic class: `isOverweight ? 'bg-rose-500' : 'bg-emerald-500'` (emerald for $\le$ 100%, rose for $>$ 100%).
   - Width style: `style={{ width: `${Math.min(100, weightRatio)}%` }}`.
3. **Overload Warning Banner** (lines 107–114):
   - Condition: `showOverloadWarning && isOverloaded` (where `isOverloaded = isOverweight || isOvervolume`).
   - Renders `IconAlertTriangle` with Vietnamese warning: `"Cảnh báo: Khối lượng đơn vượt quá tải trọng xe. Khuyến nghị bật Split Shipment để chia tải."`
4. **External Vehicle Banner** (lines 65–76):
   - Condition: `vehicle.isExternal && ...`
   - Renders Amber alert box with `IconAlertCircle`: `"🚛 XE THUÊ NGOÀI: Xe này thuộc nhà xe đối tác {vehicle.externalProvider || 'Đối tác ngoài'}. Khi xác nhận, hệ thống sẽ gửi thông báo đến các bên liên quan."`

### B. `<AssignVehicleDialog />` (`src/features/trips/components/assign-vehicle-dialog.tsx`)
1. **Mode Switcher** (lines 300–319):
   - Button toggle: `button:has-text("Chuyển sang Split")` $\leftrightarrow$ `button:has-text("Đang chia nhiều xe")`.
2. **Single Assignment Mode** (lines 322–461):
   - Vehicle selector `#select-trip-vehicle`, Driver selector `#select-trip-driver` (auto-selected when vehicle has `assignedDriverId`).
   - Dates `#trip-pickup-date`, `#trip-pickup-time`, `#trip-eta-date`, Notes `#trip-notes-input`.
   - Highlighted dispatch note banner (`order.notes`) with `"Lưu ý quan trọng"` badge.
   - Interactive live `<CapacityGauge />` bound to `selectedVehicle`, `weightAllocated`, `volumeAllocated`.
3. **Split Shipment Mode** (lines 462–686):
   - Initialized with 2 vehicles (50/50 split).
   - Bounds: Min 2 vehicles (delete button only rendered when `splitRows.length > 2`), Max 5 vehicles (`Thêm xe chở hàng (${splitRows.length}/5)` button hidden when `splitRows.length >= 5`).
   - Live total summary bar: `{splitTotalWeight.toLocaleString()} / {order.totalWeight.toLocaleString()} kg` and `{splitTotalVolume} / {order.totalVolume} m³`.
   - Selectors: `#split-vehicle-${idx}`, `#split-driver-${idx}`, `#split-weight-${idx}`, `#split-volume-${idx}`, `#split-pickup-${idx}`, `#split-delivery-${idx}`.
4. **Validation & Toast Governance** (lines 160–196):
   - Checks vehicle selection for all rows: `"Vui lòng chọn xe cho chuyến thứ ${i + 1}"`.
   - Checks weight $> 0$: `"Khối lượng chuyến ${i + 1} phải lớn hơn 0"`.
   - API error handling: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Lỗi khi phân công chuyến xe. Vui lòng thử lại.')`.

### C. `<NoVehicleDialog />` (`src/features/trips/components/no-vehicle-dialog.tsx`)
1. **5 Categorized Reason Options** (lines 26–47, 165–186):
   - `BUSY`: "Toàn bộ xe nội bộ phù hợp đang trong lộ trình vận chuyển"
   - `MAINTENANCE`: "Xe đang trong kế hoạch bảo dưỡng, kiểm định kỹ thuật"
   - `OVER_CAPACITY`: "Khối lượng / thể tích vượt quá tải trọng của xe khả dụng"
   - `HUB_UNAVAILABLE`: "Không có xe khả dụng tại Hub xuất phát này"
   - `CUSTOM`: "Lý do khác / Khuyến nghị điều xe ngoài cụ thể"
2. **Form Controls & Payload** (lines 59–95, 174–237):
   - Radio input: `input[name="noVehicleReason"]`.
   - Custom reason textarea: `#no-vehicle-custom-reason`.
   - Submit button: `button:has-text("Xác nhận báo hết xe")`.
   - Payload: maps selected reason + custom note (`${baseReason}. Chi tiết: ${customReason.trim()}`), invokes `ordersApi.markNoVehicle(order.id, reason)`.

### D. Confirm Trip Workflow & Action Cell (`src/features/trips/components/trips-tables/cell-action.tsx`)
1. **Confirm Trip Button** (lines 100–109):
   - Rendered when `data.status === 'PENDING'` with text `Xác nhận Trip` (`button:has-text("Xác nhận Trip")`).
   - Invokes `useConfirmTripMutation` $\rightarrow$ `PATCH /api/v1/trips/:id/confirm`.
   - Invalidation: invalidates both `tripKeys.all` and `orderKeys.all`.
   - Toast: `toast.success('Xác nhận chuyến xe thành công!', { description: 'Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho.' })`.
2. **Row Action Dropdown** (lines 111–158):
   - View order detail: `router.push('/dashboard/orders/' + data.orderId)`.
   - Mark completed (when `IN_TRANSIT`): invokes `updateTripMutation({ id, payload: { status: 'COMPLETED' } })`.
   - Cancel trip (when not `COMPLETED` and not `CANCELLED`): `<AlertDialog>` confirmation triggering `deleteTripMutation(data.id)`.

### E. Build & Type Checking
- `npx tsc --noEmit` executed in `frontend/`: Exit code 0 (0 TypeScript errors).
- Clean Next.js production build: Dynamic route `/dashboard/trips` and prefetching HydrationBoundary verified.

---

## 2. Logic Chain

1. **Requirement Fulfillment**:
   - Every requirement defined in `SCOPE.md`, `PROJECT.md`, and `ORIGINAL_REQUEST.md` has been faithfully implemented without dummy facades or hardcoded shortcuts.
2. **Adversarial Integrity Check**:
   - No mock test data or hardcoded return values embedded in source code.
   - All interactive actions communicate with backend APIs via Axios `apiClient` with proper error trapping.
   - Toasts are 100% Vietnamese and follow the mandatory API-first error message extraction pattern.
3. **Dispatch Operational Fidelity**:
   - The dual-tab coordinator (`TripsClientView`) accurately supports both queue intake (`PendingOrdersView`) and all trips monitoring (`TripsTable`).
   - URL search parameters are bidirectionally synchronized with `nuqs`, supporting backward compatibility with legacy tab query strings (`tab=pending` and `tab=all`).
4. **Boundary & Edge Case Robustness**:
   - `<CapacityGauge />` safely handles missing `vehicle.maxWeight` or `maxVolume <= 0`.
   - `<AssignVehicleDialog />` enforces 2 to 5 split rows, preventing deletion of rows when only 2 remain.
   - `<NoVehicleDialog />` correctly bundles the categorized reason and freeform dispatch advice.

---

## 3. Caveats

1. **`tsconfig.json` Clean CI Build Recommendation**:
   - In `frontend/tsconfig.json`, `".next/dev/types/**/*.ts"` is listed in `"include"`. In a completely clean CI environment where `next dev` has never run, `next build`'s type checking may report that this directory is not yet present. Removing `".next/dev/types/**/*.ts"` (leaving only `".next/types/**/*.ts"`) is recommended for pristine CI pipeline builds.
2. **Backend Server Dependency**:
   - Full live E2E test runs (`e2e/06-order-dispatch-workflow.spec.ts`) require a running NestJS backend on `localhost:3001` or database seeding to complete multi-role dispatch hops.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 4 (Trips & Vehicle Capacity Standardization) fully satisfies all functional, architectural, operational, and UX requirements:
- Monolith completely decomposed into 17 clean, typed modules.
- Canonical `@tanstack/react-table` v8 + `nuqs` + TanStack Query v5 HydrationBoundary.
- Live `<CapacityGauge />`, dual-mode `<AssignVehicleDialog />` (Single + Split 2..5), 5-reason `<NoVehicleDialog />`, and `"Xác nhận Trip"` action fully implemented.
- 0 TypeScript errors.

---

## 5. Verification Method

To independently verify this implementation:

1. **TypeScript Type Verification**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
2. **Check Key Files**:
   - `frontend/src/features/trips/components/capacity-gauge.tsx`
   - `frontend/src/features/trips/components/assign-vehicle-dialog.tsx`
   - `frontend/src/features/trips/components/no-vehicle-dialog.tsx`
   - `frontend/src/features/trips/components/trips-tables/cell-action.tsx`
   - `frontend/src/app/dashboard/trips/page.tsx`
3. **Run E2E Dispatch Test**:
   ```bash
   cd frontend
   npx playwright test e2e/06-order-dispatch-workflow.spec.ts
   ```
