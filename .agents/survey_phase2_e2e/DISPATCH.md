## 2026-08-18T07:13:41Z

Mission:
Investigate Phase 2 data listing pages and all E2E test suites in `d:\Projects\logistics-website\frontend`.

TASKS:
1. Investigate Phase 2 pages:
   - `/dashboard/warehouse` (Warehouse Inbound/Outbound) - locate page, components, feature folder, types, API calls, modals, actions, RBAC checks.
   - `/dashboard/notifications` (System Notifications) - locate page, components, feature folder, types, API calls, modals, actions, RBAC checks.
2. Investigate E2E test infrastructure and existing Playwright specs:
   - Locate test directories (e.g. `frontend/e2e/`, `frontend/tests/`, etc.) and `playwright.config.ts`.
   - Inspect specs mentioned in acceptance criteria: `04-fleet-crud-and-refresh.spec.ts`, `06-order-dispatch-workflow.spec.ts`, `10-hubs-management.spec.ts`, and any user/trip/warehouse/notification specs.
   - How tests locate tables, rows, pagination, search, filter, actions (selectors used: data-testid, role, text, class).
   - Identify what selectors might break if tables are refactored to canonical DataTable (e.g. class names, testids, table structure) so we can preserve test compatibility.
3. Write comprehensive report to `d:\Projects\logistics-website\.agents\survey_phase2_e2e\survey_phase2_e2e.md` and `handoff.md`.
