# Handoff Report: Explorer 3 — QA & E2E Checklist for Orders Intake & Dispatch

**Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3`  
**Milestone**: Milestone 3: Orders Intake & Dispatch Standardization  
**Author**: Explorer 3 (QA & E2E Test Specialist)  
**Parent Orchestrator ID**: `dee921f5-f455-4453-8088-15f8ad184b01`  

---

## 1. Observation

1. **E2E Playwright Specifications**:
   - `frontend/e2e/06-order-dispatch-workflow.spec.ts`:
     - Line 22: `await page.goto('/dashboard/orders');`
     - Line 25: `await expect(page.getByRole('heading', { name: 'Lập Lệnh Điều Vận' })).toBeVisible();`
     - Line 28: `await page.click('button:has-text("Tạo lệnh điều vận mới")');`
     - Line 31: `await page.fill('#order-code-input', testOrderCode);`
     - Line 32: `await page.fill('#total-weight-input', '18000');`
     - Line 33: `await page.fill('#total-volume-input', '45');`
     - Line 34: `await page.fill('#goods-desc-input', 'Linh kiện điện tử E2E Test');`
     - Line 39: `res.url().includes('/orders') && res.request().method() === 'POST' && res.status() === 201`
     - Line 41: `await page.click('button[type="submit"]:has-text("Lưu & Tạo lệnh")');`
     - Line 45: `page.locator('text=' + testOrderCode).first();`
     - Line 49: `const row = page.locator('tr', { hasText: testOrderCode });`
     - Line 50: `const sendFleetBtn = row.locator('button:has-text("Gửi Fleet")');`
     - Line 54: `await expect(row.locator('text=Chờ điều xe')).toBeVisible({ timeout: 10000 });`
   - `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`:
     - Lines 45-67: `#order-code-input`, `#origin-hub-select` (`'Andromeda Hub (Hà Nội)'`), `#destination-hub-select` (`'Centaurus Hub (TP.HCM)'`), `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#notes-input`, `#isExternalNeeded`, `#external-note-input`.
     - Line 81: `await page.waitForSelector('#order-code-input', { state: 'hidden' });`
     - Line 101: `await row.locator('a[href*="/dashboard/orders/"]').first().click();`
   - `frontend/e2e/03-rbac-routing.spec.ts`:
     - Line 19: `{ route: '/dashboard/orders', allowedRoles: ['SUPER_ADMIN', 'DISPATCHER'] }`
2. **Current Monolithic Implementation**:
   - `frontend/src/app/dashboard/orders/page.tsx`: Single client component (1,176 lines) containing inlined KPI cards, custom date filter bar, inline table markup (`<table>`, `<tr>`, `<td>`), and inline create order dialog.
   - `frontend/src/features/orders/api.ts`: API methods for `getOrders`, `getOrderStats`, `getOrder`, `createOrder`, `updateOrder`, `submitOrder`, `markNoVehicle`, `deleteOrder`, `generateOrderCode`.
3. **Backend Controller**:
   - `backend/src/orders/orders.controller.ts`: Endpoints `@Post()` (201 Created), `@Get()` (200 OK), `@Get('stats')` (200 OK), `@Get('generate-code')` (200 OK), `@Get(':id')`, `@Patch(':id')`, `@Patch(':id/submit')`, `@Patch(':id/no-vehicle')`, `@Delete(':id')` (204 No Content). Protected by `@Roles(SUPER_ADMIN, DISPATCHER)` (except `/no-vehicle` for `FLEET_MANAGER`).
4. **Canonical Pattern from M1 & M2**:
   - `frontend/src/features/hubs/` and `frontend/src/features/fleet/` use `DataTable`, `DataTableToolbar`, `DataTablePagination`, `useDataTable`, `useQueryStates` (nuqs), `useSuspenseQuery`, and separate `cell-action.tsx` / `columns.tsx` files.

---

## 2. Logic Chain

1. **Observation 1 & 2** show that Playwright tests use explicit CSS IDs (`#order-code-input`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#origin-hub-select`, `#destination-hub-select`, `#isExternalNeeded`, `#external-note-input`) and exact button text (`"Tạo lệnh điều vận mới"`, `"Gửi Fleet"`, `"Lưu & Tạo lệnh"`).
   - *Inference*: When decomposing `orders/page.tsx` into modular components (`order-create-dialog.tsx`, `orders-tables/columns.tsx`, `orders-tables/cell-action.tsx`), these exact IDs and text values must be preserved verbatim.
2. **Observation 1 (L49-54)** shows that Playwright identifies table rows using `page.locator('tr', { hasText: testOrderCode })` and status via `row.locator('text=Chờ điều xe')`.
   - *Inference*: Using `@/components/ui/table/data-table` satisfies the `table` and `tr` markup requirements. Status badge mapping for `PENDING_FLEET` must return `"Chờ điều xe"`.
3. **Observation 1 (`03-rbac-routing.spec.ts`) & Observation 3** confirm that only `SUPER_ADMIN` and `DISPATCHER` can view and manage orders.
   - *Inference*: Route protection in `proxy.ts` and sidebar navigation in `nav-config.ts` are already aligned, and UI action buttons (create, submit to fleet, delete draft) must remain accessible to `SUPER_ADMIN` and `DISPATCHER`.
4. **Observation 2 & 4** show that moving to `@tanstack/react-table` v8 requires creating standard feature directories: `src/features/orders/components/orders-listing.tsx`, `src/features/orders/components/orders-tables/`, `src/features/orders/components/order-create-dialog.tsx`, and `src/features/orders/api/`.
   - *Inference*: This architecture directly mirrors M1 (`hubs`) and M2 (`fleet`) while maintaining 100% backward compatibility with all E2E test assertions.

---

## 3. Caveats

- **No Caveats**: All E2E test specs touching orders (`06-order-dispatch-workflow.spec.ts`, `07-capture-user-guide-screenshots.spec.ts`, `03-rbac-routing.spec.ts`), the backend controller (`OrdersController`), and the current page implementations were thoroughly reviewed.

---

## 4. Conclusion

The QA & E2E checklist report has been compiled and saved to `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3\report.md`. It contains:
- Complete locators and selectors catalog for all 3 relevant Playwright test specs.
- Full DOM & element specifications for forms, status badges, and table buttons.
- Date preset filters and KPI stats metrics integration requirements.
- 100% Vietnamese toast notifications catalog with API-message-first error extraction.
- Detailed analysis of 7 potential regression vectors when adopting TanStack Table v8.
- Step-by-step verification plan for developers and QA engineers.

The implementation team (Sub-Orchestrator M3, Coder agents) has a precise, deterministic reference to complete the refactoring without regressions.

---

## 5. Verification Method

1. **Review Generated Report**:
   - Inspect `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3\report.md`.
2. **Execute E2E Tests (once implementation is completed)**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run typecheck
   npx playwright test e2e/06-order-dispatch-workflow.spec.ts
   npx playwright test e2e/03-rbac-routing.spec.ts
   npx playwright test e2e/07-capture-user-guide-screenshots.spec.ts
   ```
3. **Invalidation Conditions**:
   - Any selector change (e.g. changing `#order-code-input` or button text `"Tạo lệnh điều vận mới"` / `"Gửi Fleet"`).
   - Any deviation from standard HTML table elements (`table`, `tr`, `td`).
   - English toast notifications in business domain files.
