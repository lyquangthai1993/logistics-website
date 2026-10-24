# Task Checklist — Issue 24/10: Order Activity Log Backfill & Super Admin Inline Transaction Quantity Edit (`✏️`) + Textarea Reason

## Overview
- **Module**: Warehouse Orders (`Lịch sử hàng hóa & Biến động kho` & `Nhật ký thao tác & Thay đổi dữ liệu`)
- **Route**: `/dashboard/warehouse/orders`
- **Modal**: `WarehouseWaybillDetailModal` (`frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx`)
- **Backend Services**: `WarehouseService`, `OrdersService`, `OrderActivityLogService`

## Checklist
- [x] **Task 1 — Hook `OrderActivityLogService.logActivity()` & Backfill Production/Dev DB**:
  - Hook `ORDER_CREATED`, `ORDER_UPDATED`, `ORDER_DELETED`, `INBOUND_CONFIRMED`, `OUTBOUND_CONFIRMED`, `DRAFT_CANCELLED`, and `TRANSACTION_UPDATED` into `OrdersService` and `WarehouseService`.
  - Backfill historical soft-deleted transaction logs into Production (`54 rows`) and Dev (`68 rows`) `order_activity_log`.
  - Add `order_activity_log` and `order_activity_log_id_seq` to `scripts/railway-db-sync.mjs`.
- [x] **Task 2 — Super Admin Inline Transaction Quantity Edit via Pencil Icon (`✏️`)**:
  - Add `PATCH /api/v1/warehouse/transactions/:id/quantity` guarded by `@Roles(RoleEnum.SUPER_ADMIN)`.
  - Enforce ACID invariant (`newTotalInbound >= newTotalOutbound`), recalculate chronological `remainingQuantity`, sync `TripEntity.quantityAllocated` and `OrderEntity` totals, and log `TRANSACTION_UPDATED`.
  - Render inline pencil button (`data-testid="btn-edit-tx-qty-{id}"`) next to package badge (`+27 kiện`) for `SUPER_ADMIN` only.
- [x] **Task 3 — Change "Lý do điều chỉnh" to `<Textarea />`**:
  - Replace `<Input />` with `<Textarea />` in both the Delete/Restore Transaction confirmation modal (`data-testid="textarea-action-reason"`) and the inline pencil quantity editor (`data-testid="input-edit-tx-reason-{id}"`).
