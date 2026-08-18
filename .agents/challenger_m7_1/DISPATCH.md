# Dispatch: challenger_m7_1

## Objective
Adversarial stress testing and boundary analysis for Core Domain tables: Hubs (`/dashboard/admin/hubs`), Fleet (`/dashboard/fleet`), Orders (`/dashboard/orders`), and Trips (`/dashboard/trips`).

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Focus Areas (Tier 5 Hardening)
1. **Hubs Table (`src/features/hubs/`)**:
   - URL search parameter sync with `nuqs` (`page`, `perPage`, `search`).
   - `#hub-search-input` real-time debounce & filter behavior.
   - `#btn-add-hub` create sheet/dialog, active toggle, soft delete confirmation alert dialog.
2. **Fleet Vehicles & Drivers (`src/features/fleet/`)**:
   - Tab switching between Vehicles & Drivers preserving state.
   - `#fleet-search-input`, license plate search, driver license category badges.
   - Vehicle assignment and driver status transitions.
3. **Orders Table & Dispatch (`src/features/orders/`)**:
   - Date range presets & stats summary cards.
   - "Tạo lệnh điều vận", "Gửi Fleet", draft deletion.
   - Multi-select actions and row selection checkboxes.
4. **Trips Table & Capacity (`src/features/trips/`)**:
   - Capacity Gauge computation (kg / volume / percentage).
   - "Phân công chuyến xe" modal, Split Shipment bounds (2-5 shipments validation).
   - "Báo hết xe" status declaration.
5. Run empirical Playwright checks / unit assertions where relevant.

## Verdict Requirement
Write `handoff.md` in `d:\Projects\logistics-website\.agents\challenger_m7_1` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**, complete with verified evidence.

## 2026-08-18T10:25:48Z
Task received from parent:
You are Challenger 1 for Milestone 7 (Adversarial Coverage Verifier - Core Domain).
Working directory: d:\Projects\logistics-website\.agents\challenger_m7_1
Tasks:
1. Conduct deep adversarial analysis and stress tests on the core domain tables and components:
   - Hubs Management (`src/features/hubs/` and `/dashboard/admin/hubs`)
   - Fleet Vehicles & Drivers (`src/features/fleet/` and `/dashboard/fleet`)
   - Orders Intake & Dispatch (`src/features/orders/` and `/dashboard/orders`)
   - Trips & Vehicle Capacity (`src/features/trips/` and `/dashboard/trips`)
2. Stress test boundary conditions:
   - URL search parameter sync with `nuqs` (`page`, `perPage`, `search`).
   - Rapid pagination, sorting, debounce on search inputs.
   - Split shipment bounds (2-5 shipments validation) and capacity gauge arithmetic.
   - Delete confirmation dialogs and active toggles.
3. Write your findings and explicit verdict (**APPROVE** or **REQUEST_CHANGES**) in `handoff.md` in your working directory.
4. Send message to your parent with your completion status and verdict.

