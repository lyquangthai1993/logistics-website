# Handoff Report: Survey Phase 2 Pages & E2E Test Suites

## 1. Observation
- **Phase 2 Pages**:
  - `/dashboard/warehouse`: Implemented in `src/app/dashboard/warehouse/page.tsx` (Lines 1–331) as `WarehouseInboundPage`. It reuses `tripsApi` from `@/features/trips/api` (no `src/features/warehouse/` directory). Currently presents incoming confirmed/in-transit trips in a 3-column Card Grid with 4 KPI summary cards and Hub/search filters. RBAC access is restricted to `SUPER_ADMIN,WAREHOUSE_MANAGER` in `src/config/nav-config.ts` (L65) and `src/proxy.ts` (L10).
  - `/dashboard/notifications`: Implemented in `src/app/dashboard/notifications/page.tsx` (Lines 1–10) rendering `NotificationsPage` from `src/features/notifications/components/notifications-page.tsx` (Lines 1–135). Uses TanStack Query (`use-notifications-query.ts`) and WebSocket (`use-notification-socket.ts`). UI features Radix Tabs (`All`, `Unread`, `Read`), `NotificationCard` components, and prev/next pagination. Open to all authenticated roles.
- **E2E Test Infrastructure**:
  - Located in `frontend/e2e/`, configured via `frontend/playwright.config.ts` (timeout: 30s, expect: 8s, baseURL: `http://localhost:3000`, headless Chromium).
  - Test helper in `frontend/e2e/helpers/auth.ts` provides `TEST_USERS` credentials for all 4 roles, `loginAs()`, `clearSession()`, and `collectConsoleLogs()`.
- **E2E Test Specs (12 files)**:
  - `01-console-health.spec.ts`: Checks browser console for errors on login/root.
  - `02-login-flow.spec.ts`: Validates login form, error messages, and per-role session redirect.
  - `03-rbac-routing.spec.ts`: Tests allowed/blocked routes for all 4 roles across `/dashboard/admin`, `/dashboard/orders`, `/dashboard/trips`, `/dashboard/fleet`, `/dashboard/warehouse`.
  - `04-fleet-crud-and-refresh.spec.ts`: Tests Vehicle CRUD, Driver CRUD, and 65s token auto-refresh (SPA + F5 reload). Relies on `table`, `tr`, `#btn-add-vehicle`, `button[data-testid^="btn-edit-vehicle-"]`, `button[data-testid^="btn-delete-vehicle-"]`, `#tab-drivers`, `#btn-add-driver`, `button[data-testid^="btn-edit-driver-"]`, `button[data-testid^="btn-delete-driver-"]`, `#fleet-search-input`, `#delete-confirm-dialog`.
  - `05-profile-avatar.spec.ts`: Tests profile avatar upload/delete.
  - `06-notification-system.spec.ts`: Tests notification bell, badge, popover, `/dashboard/notifications` page loading, tabs (`All`, `Unread`, `Read`), Mark all as read button, and REST/WebSocket contracts.
  - `06-order-dispatch-workflow.spec.ts`: Tests full workflow across Orders (`button: "Tạo lệnh điều vận mới"`, `row.locator('button:has-text("Gửi Fleet")')`), Trips (`[data-testid="btn-assign-order-*"]`, `button: "Xác nhận Trip"`), and Warehouse (`getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`, `input[placeholder*="Tìm theo mã đơn"]`).
  - `07-capture-user-guide-screenshots.spec.ts`: Captures screenshots for documentation across all pages.
  - `07-notification-ui-visual.spec.ts`: Visual screenshot tests for notification badge, popover, tabs, and mark as read.
  - `08-check-vercel-vs-local-signin.spec.ts` & `09-check-localhost-signin.spec.ts`: Checks demo account popover.
  - `10-hubs-management.spec.ts`: Tests hubs CRUD, `#hub-search-input`, `#btn-add-hub`, `#hub-form-dialog`, and Fleet Manager vehicle hub dropdown `#select-current-hub`.

## 2. Logic Chain
- Transforming existing pages (`admin/hubs`, `fleet`, `orders`, `trips`, `warehouse`, `notifications`) into canonical `DataTable` (`@tanstack/react-table` + `nuqs`) will replace custom table/card markup.
- Because existing E2E specs use specific locators (e.g. `page.locator('table')`, `page.locator('tr', { hasText: ... })`, `data-testid`, `#id`, button text), refactoring could break tests if these selectors are not preserved.
- The project's canonical `DataTable` component (`src/components/ui/table/data-table.tsx`) renders standard HTML `<table>`, `<tr>`, `<td>` elements, which naturally satisfies `page.locator('table')` and `page.locator('tr')`.
- Therefore, as long as row actions preserve `data-testid`, filter inputs preserve `#id` attributes (like `#fleet-search-input`, `#hub-search-input`), and page headings / button text match verbatim, 100% E2E test compatibility is guaranteed.

## 3. Caveats
- No live Playwright test execution was run during this survey turn (this was a read-only investigation).
- Warehouse currently has no backend CRUD endpoints of its own (it consumes `/api/v1/trips`). Creating a dedicated `src/features/warehouse/` will structure the frontend without needing backend changes.

## 4. Conclusion
- Phase 2 pages (`/dashboard/warehouse`, `/dashboard/notifications`) and all 12 E2E specs have been thoroughly analyzed.
- A detailed survey report has been generated at `d:\Projects\logistics-website\.agents\survey_phase2_e2e\survey_phase2_e2e.md`.
- A 7-point E2E compatibility checklist has been established to ensure zero test regressions during DataTable refactoring.

## 5. Verification Method
- Inspect survey report: `view_file` on `d:\Projects\logistics-website\.agents\survey_phase2_e2e\survey_phase2_e2e.md`.
- Test execution command (when backend & frontend servers are running):
  ```powershell
  cd d:\Projects\logistics-website\frontend
  npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/06-order-dispatch-workflow.spec.ts e2e/10-hubs-management.spec.ts
  ```
