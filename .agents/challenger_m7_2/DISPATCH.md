# Dispatch: challenger_m7_2

## Objective
Adversarial stress testing and boundary analysis for Admin, Warehouse & Notifications: Users (`/dashboard/users`), Warehouse (`/dashboard/warehouse`), and Notifications (`/dashboard/notifications`).

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Focus Areas (Tier 5 Hardening)
1. **Users Management (`src/features/users/`)**:
   - Connection to live NestJS `/api/v1/users` API.
   - TMS 4 roles display and role switching/filters: `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`.
   - User creation, update, delete modal operations & Vietnamese toast messages.
2. **Warehouse Inbound/Outbound (`src/features/warehouse/`)**:
   - Inbound shipment table, status badges (`PENDING`, `RECEIVING`, `COMPLETED`).
   - Search filter, pagination bounds, tab switching, and action handlers.
3. **Notifications System (`src/features/notifications/`)**:
   - Notification tabs (All, Unread, System, Alerts).
   - "Mark all as read" action, pagination sync, unread badge counter consistency.
   - Vietnamese toast feedback on actions.
4. Run empirical Playwright checks / unit assertions where relevant.

## Verdict Requirement
Write `handoff.md` in `d:\Projects\logistics-website\.agents\challenger_m7_2` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**, complete with verified evidence.
