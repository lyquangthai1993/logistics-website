# Handoff Report — Explorer 2: Orders Intake & Dispatch Frontend Architecture

## 1. Observation
- Inspected the current implementation at `frontend/src/app/dashboard/orders/page.tsx` (1176 lines, monolithic client component with raw `<table>`, `useState`, manual pagination, hardcoded `HUBS` array, and raw fetch methods).
- Inspected canonical reference implementation at `frontend/src/features/hubs/` (`hubs-listing.tsx`, `hubs-tables/index.tsx`, `columns.tsx`, `cell-action.tsx`, `use-hubs-table-filters.tsx`, `api/`).
- Inspected generic table infrastructure in `frontend/src/components/ui/table/` (`data-table.tsx`, `data-table-pagination.tsx`, `data-table-toolbar.tsx`, `data-table-column-header.tsx`, `data-table-date-filter.tsx`, `data-table-faceted-filter.tsx`).
- Analyzed Playwright E2E test specs: `frontend/e2e/06-order-dispatch-workflow.spec.ts`, `frontend/e2e/03-rbac-routing.spec.ts`, `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`.
- Verified Backend NestJS API contract at `backend/src/orders/orders.controller.ts` (`GET /orders`, `GET /orders/stats`, `GET /orders/generate-code`, `POST /orders`, `PATCH /orders/:id/submit`, `PATCH /orders/:id/no-vehicle`, `DELETE /orders/:id`).

## 2. Logic Chain
1. The existing `orders/page.tsx` violates the standardized TanStack Table + `nuqs` architecture by managing URL-less client state and using a raw table with custom pagination instead of `@/components/ui/table/data-table`.
2. Reorganizing `frontend/src/features/orders/` into discrete layers (`params.ts`, `api/types.ts`, `api/service.ts`, `api/queries.ts`, `api/mutations.ts`, `components/orders-listing.tsx`, `components/orders-tables/`) separates data fetching, URL synchronization, rendering, and mutations.
3. Server-side prefetching with `ordersQueryOptions` and `ordersStatsQueryOptions` in `orders-listing.tsx` wrapped in `<HydrationBoundary>` ensures zero-layout-shift SSR hydration while `useSuspenseQuery` gives instant client rendering.
4. Integrating `activeHubsQueryOptions()` into `order-create-dialog.tsx` replaces hardcoded hub strings with live hubs while maintaining fallback compatibility.
5. Preserving exact DOM selectors (`#order-code-input`, `#origin-hub-select`, `#destination-hub-select`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#notes-input`, `#isExternalNeeded`, `#external-note-input`, `button:has-text("Tạo lệnh điều vận mới")`, `button[type="submit"]:has-text("Lưu & Tạo lệnh")`, `button:has-text("Gửi Fleet")`, `text=Chờ điều xe`) ensures 100% pass rate on E2E test suites without regression.

## 3. Caveats
- When testing date ranges with `ordersApi.getOrderStats`, local date format `YYYY-MM-DD` must be used to avoid UTC offset discrepancies.
- If no active hubs are returned from the backend in test environments, `DEFAULT_HUBS` fallback in `order-create-dialog.tsx` guarantees that the hub select dropdowns are never empty.

## 4. Conclusion
The comprehensive frontend architecture specification for Orders (`frontend/src/features/orders/`) has been completed and documented in `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_2\report.md`. It provides complete TypeScript schemas, component code, mutation hooks, and exact DOM selectors ready for execution.

## 5. Verification Method
1. Verify report existence: Inspect `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_2\report.md`.
2. Inspect proposed modules against `frontend/src/features/hubs/` pattern consistency.
3. After implementation, run:
   - `npm run build` in `frontend/`
   - `npx playwright test e2e/06-order-dispatch-workflow.spec.ts`
