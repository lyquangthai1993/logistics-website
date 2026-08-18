# Handoff Report: Milestone 1 — Hubs Management Standardization

## 1. Observation
- **Existing Page**: `frontend/src/app/dashboard/admin/hubs/page.tsx` (Lines 1–689) is a monolithic `'use client'` component. It implements:
  - Custom API fetch cycle using `useState`, `useEffect`, `useCallback` with `hubsApi.getHubs`.
  - 4 KPI metric cards (Total hubs, Active hubs, Inactive hubs, Total vehicles).
  - Search input `#hub-search-input` and status dropdown `#hub-status-filter`.
  - HTML `<table>` element with custom pagination footer and page size select (`5, 10, 20, 50`).
  - Add/Edit Hub modal (`#hub-form-dialog`, input IDs: `#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `#input-hub-is-active`).
  - Soft delete warning dialog with conditional warning when `deletingHub.vehicles.length > 0`.
- **Existing API & Types**: `frontend/src/features/hubs/api.ts` (Lines 1–83) exports `Hub`, `PaginatedResult<T>`, `QueryHubParams`, `CreateHubPayload`, `UpdateHubPayload`, and `hubsApi` object (`getHubs`, `getActiveHubs`, `getHub`, `createHub`, `updateHub`, `toggleActive`, `deleteHub`).
- **Backend Protection & Logic**: `backend/src/hubs/hubs.controller.ts` (Lines 31–37) enforces `@Roles(RoleEnum.SUPER_ADMIN)` and returns paginated `PaginatedResult<HubEntity>`. `backend/src/hubs/hubs.service.ts` (Lines 38–41, 107–110) returns `ConflictException` (409) on duplicate hub code and soft deletes hubs with associated vehicle notification.
- **E2E Test Requirements**: `frontend/e2e/10-hubs-management.spec.ts` (Lines 1–91) asserts:
  - Header text `Quản Lý Chi Nhánh Kho`
  - Seed row `Andromeda Hub`
  - Search input `#hub-search-input` filtering by `Đà Nẵng` -> `Magellan Hub`
  - Add hub button `#btn-add-hub` opening `#hub-form-dialog`
  - Form submission with `button[type="submit"]:has-text("Thêm Chi Nhánh")`
  - Visibility of newly created hub code.
- **Toast Notifications**: Current toasts in `frontend/src/app/dashboard/admin/hubs/page.tsx`:
  - L102: `toast.error('Không thể tải danh sách chi nhánh kho')` (lacks API message first)
  - L152/155: `toast.success(...)` (valid)
  - L162: `const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin kho'; toast.error(msg);` (valid)
  - L172: `toast.success(...)` (valid)
  - L180: `toast.error('Không thể chuyển đổi trạng thái chi nhánh kho')` (lacks API message first)
  - L189: `toast.success(...)` (valid)
  - L194: `const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi xóa chi nhánh'; toast.error(msg);` (valid).

---

## 2. Logic Chain
1. **From Page Monolith to Canonical Feature Architecture**: The target structure in `SCOPE.md` requires refactoring the 689-line page into `src/app/dashboard/admin/hubs/page.tsx` (Server Component) + `src/features/hubs/components/hubs-listing.tsx` (Server prefetch) + `src/features/hubs/components/hubs-tables/` (Client DataTable v8 with `useDataTable`).
2. **From Custom Table to `@tanstack/react-table`**: The HTML table must be replaced by `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`, while keeping all custom cell formatters (monospace badge for code, warehouse/pin icons for name/city, truck badge for vehicle count, emerald/amber badge for status).
3. **From useState Pagination/Search to `nuqs`**: The `searchTerm`, `page`, and `limit` state variables must migrate to `nuqs` search params (`search`, `page`, `perPage`) via `useDataTable` and `searchParamsCache`, while ensuring `#hub-search-input` is preserved for E2E tests.
4. **Preserving Actions & Modals**: The inline buttons (`toggleActive`, edit modal trigger, delete dialog trigger) must be housed in `cell-action.tsx` while keeping `#hub-form-dialog`, `#input-hub-*` IDs, and the vehicle warning alert in the delete dialog.
5. **Enforcing Toast Rules**: The two missing API message fallbacks (L102, L180) must be updated to `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || fallback);` according to `ORIGINAL_REQUEST.md` Rule 2.

---

## 3. Caveats
- **Search Input ID**: The canonical `DataTableToolbar` renders generic filter inputs. The text search filter input MUST be assigned `id='hub-search-input'` (or a dedicated search bar in the toolbar) so that `page.locator('#hub-search-input')` in `10-hubs-management.spec.ts` continues to pass without modification.
- **KPI Metrics Query**: In the monolithic page, metrics were calculated from an extra call `hubsApi.getHubs({ limit: 100 })`. In the standardized architecture, this can be handled via a dedicated `hubsMetricsQueryOptions` query or derived cleanly from the query client cache.

---

## 4. Conclusion
The Hubs Management page is ready for standardizing into `src/features/hubs/`. All states, form validation, dialogs, action handlers, icons, badges, E2E locators, and toast notification rules have been extracted, cataloged, and specified in `analysis.md`.

---

## 5. Verification Method
1. **Static Analysis**: Verify TypeScript compilation with `npm run build` in `frontend/`.
2. **E2E Playwright Verification**:
   ```bash
   npx playwright test e2e/10-hubs-management.spec.ts
   ```
3. **Selector & ID Check**: Inspect the refactored JSX to ensure the following exist:
   - `#hub-search-input`
   - `#btn-add-hub`
   - `#hub-form-dialog`
   - `#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `#input-hub-is-active`
   - `[data-testid="hub-row-${id}"]`, `[data-testid="btn-edit-hub-${id}"]`, `[data-testid="btn-delete-hub-${id}"]`
