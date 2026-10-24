# RESOLUTION — Issue 24/10: Order Activity Log Backfill & Super Admin Inline Transaction Quantity Edit (`✏️`) + Textarea Reason

- **Status**: `COMPLETED` (`VERIFIED ON CLOUD DEV & PRODUCTION`)
- **Date**: `2026-10-24`
- **Audit Score**: `50/50 (PASS)` — [`frontend/e2e/99-admin-tx-quantity-pencil-edit.spec.ts`](../../frontend/e2e/99-admin-tx-quantity-pencil-edit.spec.ts)
- **Commits**:
  - `backend`: `6f48970` (`dev`) / `e2d5846` (`master`)
  - `frontend`: `9d96e0d` (`dev`) / `61a9d7e` (`master`)
  - `root`: `25061c3` (`dev`) / `8700139` (`master`)

## Root Cause & Summary of Changes
1. **Why `order_activity_log` was empty on Production**:
   - Only `deleteTransaction` and `restoreTransaction` previously invoked `OrderActivityLogService.logActivity()`. Operational actions (`ORDER_CREATED`, `INBOUND_CONFIRMED`, `OUTBOUND_CONFIRMED`, `ORDER_UPDATED`, `ORDER_DELETED`, `DRAFT_CANCELLED`) were not hooked up, and historical soft-deleted transactions (`deletedAt IS NOT NULL`) predated the table creation.
   - Hooked `safeLogActivity()` across [`OrdersService`](../../backend/src/orders/orders.service.ts) and [`WarehouseService`](../../backend/src/orders/warehouse.service.ts), backfilled **54 rows** on Production DB and **68 rows** on Dev DB, and added `order_activity_log` to [`scripts/railway-db-sync.mjs`](../../scripts/railway-db-sync.mjs).
2. **Super Admin Inline Transaction Quantity Edit via Pencil Icon (`✏️`)**:
   - Added `PATCH /api/v1/warehouse/transactions/:id/quantity` in [`WarehouseController`](../../backend/src/orders/warehouse.controller.ts) and `updateTransactionQuantity()` in [`WarehouseService`](../../backend/src/orders/warehouse.service.ts) with `@Roles(RoleEnum.SUPER_ADMIN)`, ACID transaction lock, `newTotalInbound >= newTotalOutbound` validation, chronological `remainingQuantity` recalculation, `TripEntity.quantityAllocated` sync, and `TRANSACTION_UPDATED` audit logging.
   - Added inline pencil button (`data-testid="btn-edit-tx-qty-{id}"`) next to each transaction's package badge in [`WarehouseWaybillDetailModal`](../../frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx) strictly visible to `SUPER_ADMIN`.
3. **Adjustment Reason (`Lý do điều chỉnh`) Upgraded to `<Textarea />`**:
   - Replaced `<Input />` with [`<Textarea />`](../../frontend/src/components/ui/textarea.tsx) in both the Delete/Restore Transaction confirmation modal (`data-testid="textarea-action-reason"`) and the inline pencil quantity editor (`data-testid="input-edit-tx-reason-{id}"`).

## Visual Evidence
- `screenshot_01_superadmin_pencil_icon_visible.png`
- `screenshot_02_inline_quantity_editor_open.png`
- `screenshot_03_quantity_updated_and_audit_logged.png`
- `screenshot_04_rbac_warehouse_manager_no_pencil_verified.png`
- `screenshot_05_delete_modal_reason_textarea_verified.png`
