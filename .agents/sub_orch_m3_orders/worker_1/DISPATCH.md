## 2026-08-18T08:34:56Z
You are Worker 1 for Milestone 3: Orders Intake & Dispatch Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\worker_1
Orchestrator Conversation ID: dee921f5-f455-4453-8088-15f8ad184b01

MANDATORY READING:
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- Milestone Scope: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\SCOPE.md
- Project Architecture: d:\Projects\logistics-website\.agents\PROJECT.md
- Explorer 1 Report (API & Backend): d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_1\report.md
- Explorer 2 Report (Canonical Architecture): d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_2\report.md
- Explorer 3 Report (QA & E2E Checklist): d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3\report.md
- Reference canonical feature: frontend/src/features/hubs/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
You exclusively own and may edit:
- `frontend/src/app/dashboard/orders/page.tsx`
- `frontend/src/app/dashboard/orders/loading.tsx`
- `frontend/src/features/orders/**` (all files within this directory: `api/`, `components/`, `params.ts`, `api.ts`, etc.)
- `frontend/src/lib/searchparams.ts`

TASKS & IMPLEMENTATION BLUEPRINT:
1. Create/Standardize `frontend/src/features/orders/`:
   - `params.ts`: `ordersSearchParams`, `ordersSearchParamsCache`, `ordersSerialize` with `page`, `perPage`, `search`, `name`, `status`, `hub`, `originHub`, `destinationHub`, `fromDate`, `toDate`, `preset`, `sort`.
   - `api/types.ts`: Order entity, OrderStatus, CreateOrderPayload, UpdateOrderPayload, PaginatedOrdersResponse, OrderFilters, OrderStats, GenerateCodeResponse.
   - `api/service.ts`: API methods (`getOrders`, `getOrderStats`, `getOrderById`, `createOrder`, `updateOrder`, `submitOrder`, `markNoVehicle`, `deleteOrder`, `generateOrderCode`, `ordersApi`).
   - `api/queries.ts`: Query keys (`orderKeys`), queryOptions (`ordersQueryOptions`, `ordersStatsQueryOptions`, `orderByIdQueryOptions`), hooks (`useOrdersQuery`, `useOrdersStatsQuery`, `useOrderQuery`).
   - `api/mutations.ts`: Mutation hooks (`useCreateOrderMutation`, `useUpdateOrderMutation`, `useSubmitOrderToFleetMutation`, `useMarkNoVehicleMutation`, `useDeleteOrderMutation`).
   - `api/index.ts`: Barrel export.
   - `api.ts`: Re-export for backward compatibility.
   - `components/orders-listing.tsx`: Server component for prefetching orders, stats, and active hubs into `<HydrationBoundary>`.
   - `components/orders-kpi-cards.tsx`: KPI Metric summary cards (Total Orders, Pending Fleet, Assigned/In-Transit, No Vehicle).
   - `components/orders-date-preset-bar.tsx`: Date preset filter buttons (Hôm nay, 7 ngày qua, Tháng này, Tháng trước, Tùy chọn) and date range inputs.
   - `components/order-create-dialog.tsx`: Create order modal with auto code generation and dynamic active hubs.
   - `components/order-delete-dialog.tsx`: Soft delete confirmation dialog.
   - `components/order-edit-dialog.tsx`: Edit draft order modal.
   - `components/order-external-dialog.tsx`: External vehicle modal.
   - `components/orders-tables/`:
     - `index.tsx`: Main Client Table component with `useDataTable`, `<DataTableToolbar>`, `<DataTable>`.
     - `columns.tsx`: Declarative `ColumnDef<Order>[]` with sorting, badges, routes, and `CellAction`.
     - `cell-action.tsx`: Row actions with View Detail, Submit to Fleet (`button:has-text("Gửi Fleet")`), External Vehicle, Edit, Delete.
     - `options.tsx`: Faceted filter status and hub options.
     - `use-orders-table-filters.tsx`: nuqs filter and pagination hook.
2. Standardize `frontend/src/app/dashboard/orders/page.tsx`:
   - Server Component with `ordersSearchParamsCache.parse(searchParams)`.
   - Renders `<PageContainer scrollable>`, page header with title "Lập Lệnh Điều Vận" and Create button `button:has-text("Tạo lệnh điều vận mới")`, `<Suspense fallback={<DataTableSkeleton ... />}>`, `<OrdersListing />`.
3. Create `frontend/src/app/dashboard/orders/loading.tsx` with `<DataTableSkeleton>`.
4. STRICT COMPLIANCE:
   - Preserve all E2E selectors (`button:has-text("Tạo lệnh điều vận mới")`, `button:has-text("Gửi Fleet")`, `#order-code-input`, `#origin-hub-select`, `#destination-hub-select`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#notes-input`, `#isExternalNeeded`, `#external-note-input`, `button[type="submit"]:has-text("Lưu & Tạo lệnh")`, `text=Chờ điều xe`).
   - 100% Vietnamese toasts and API-message-first error extraction.
   - Standard HTML `table`, `thead`, `tbody`, `tr`, `th`, `td` via `@/components/ui/table/data-table`.
5. VERIFICATION:
   - Run `npm run typecheck` in `frontend/` (0 errors).
   - Run `npm run build` in `frontend/` (0 compile errors).
   - Run `npx playwright test e2e/06-order-dispatch-workflow.spec.ts` in `frontend/` if feasible.
   - Document all verification commands and exact results in `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\worker_1\handoff.md`.
   - Send message back to orchestrator upon completion.
