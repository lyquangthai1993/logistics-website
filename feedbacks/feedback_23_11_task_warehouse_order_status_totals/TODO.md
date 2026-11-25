# Warehouse Order Status Totals

## Scope

Update the warehouse orders metric row so its quantity, weight, and volume totals follow the selected status tab for every warehouse.

## Checklist

- [x] Add status-bucketed warehouse snapshot rows for `ALL`, `INBOUND`, `DRAFT`, and `COMPLETED_INBOUND`.
- [x] Make the summary API read only from `warehouse_hub_order_summary` by `hubId + status`.
- [x] Recalculate frontend totals when the status tab changes.
- [x] Preserve Hub scoping and grouped-order normalization rules.
- [x] Add parity coverage for HCM, Hưng Yên, and Đà Nẵng.
- [x] Verify frontend typecheck, backend build, and live local API parity.
