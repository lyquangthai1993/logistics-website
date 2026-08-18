# Handoff Report: Orders Intake & Dispatch Investigation (Milestone 3)

## 1. Observation
- **Backend Orders Module**:
  - Controller: `backend/src/orders/orders.controller.ts` (endpoints: `POST /`, `GET /`, `GET /stats`, `GET /generate-code`, `GET /:id`, `PATCH /:id`, `PATCH /:id/submit`, `PATCH /:id/no-vehicle`, `DELETE /:id`).
  - Service: `backend/src/orders/orders.service.ts` (implements query builder with date filters, pagination, orderCode generator with Vietnamese diacritics stripping, email and in-app notifications).
  - Entity: `backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts` (fields: `orderCode`, `status`, `route`, `originHub`, `destinationHub`, `totalQuantity`, `totalWeight`, `totalVolume`, `goodsDescription`, `isExternalVehicleNeeded`, `externalNote`, `notes`, `trips`).
- **Backend Hubs Module**:
  - `GET /api/v1/hubs/active` in `backend/src/hubs/hubs.controller.ts` returns active hubs list (`HubEntity[]`).
- **Frontend Orders Page**:
  - `frontend/src/app/dashboard/orders/page.tsx`: 1,176 lines client-side monolithic component with custom table, manual state management, and static HUBS array.
  - `frontend/src/features/orders/api.ts`: exports `ordersApi`, `Order`, `OrderStatus`, `CreateOrderPayload`, `OrderStats`. Referenced by `trips/page.tsx` and `orders/[id]/page.tsx`.
- **E2E Playwright Spec**:
  - `frontend/e2e/06-order-dispatch-workflow.spec.ts` tests order creation (`#order-code-input`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `button[type="submit"]:has-text("Lưu & Tạo lệnh")`), submission to Fleet (`button:has-text("Gửi Fleet")`), and status check (`Chờ điều xe`).

## 2. Logic Chain
1. Milestone 3 requires refactoring the Orders page to match the canonical architecture established in M1 (`features/hubs`) and M2 (`features/fleet`).
2. Splitting `features/orders/` into `api/` (types, service, queries, mutations), `components/orders-tables/` (index, columns, cell-action, options, use-orders-table-filters), and dialogs (`order-create-dialog`, `order-delete-dialog`) provides clean separation of concerns and SSR hydration.
3. Keeping `features/orders/api.ts` with `export * from './api/index'` ensures zero regressions for existing imports in `orders/[id]/page.tsx` and `trips/page.tsx`.
4. Integrating `useQuery(activeHubsQueryOptions())` in `order-create-dialog.tsx` replaces hardcoded hub strings with real DB data.

## 3. Caveats
- The Trips page (`app/dashboard/trips/page.tsx`) and Order Detail page (`app/dashboard/orders/[id]/page.tsx`) are separate pages that interact with `ordersApi`. They do not need to be refactored in Milestone 3, but their API imports must remain intact.
- The Date Range Preset filter bar affects both the KPI stats cards (`/api/v1/orders/stats`) and the table listing (`/api/v1/orders`). `useOrdersTableFilters` and `nuqs` should handle `fromDate`, `toDate`, and `datePreset`.

## 4. Conclusion
- Investigation is complete. All endpoints, data contracts, status enums, UI behaviors, and test requirements have been thoroughly documented in `report.md`.
- The codebase is ready for Planner / Code Implementer agents to begin scaffold and migration.

## 5. Verification Method
- Review `report.md` at `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_1\report.md`.
- Test commands to be used by implementers:
  - Frontend type check: `npm run build` or `npx tsc --noEmit` in `frontend/`
  - Playwright E2E test: `npx playwright test e2e/06-order-dispatch-workflow.spec.ts` in `frontend/`
