# BRIEFING — 2026-08-18T15:57:00Z

## Mission
Standardize `frontend/src/features/orders/` and `frontend/src/app/dashboard/orders/` into the Canonical Architecture (@tanstack/react-table v8 + nuqs + TanStack Query v5) while strictly preserving all E2E workflow contracts, 100% Vietnamese toasts, and role-based permissions.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\worker_1
- Original parent: dee921f5-f455-4453-8088-15f8ad184b01
- Milestone: Milestone 3: Orders Intake & Dispatch Standardization

## 🔒 Key Constraints
- Exclusive file ownership:
  - `frontend/src/app/dashboard/orders/page.tsx`
  - `frontend/src/app/dashboard/orders/loading.tsx`
  - `frontend/src/features/orders/**`
  - `frontend/src/lib/searchparams.ts`
- Preserve all E2E test selectors and contracts.
- 100% Vietnamese toasts and user notifications.
- Follow `@/components/ui/table/data-table` standard layout.

## Current Parent
- Conversation ID: dee921f5-f455-4453-8088-15f8ad184b01
- Updated: 2026-08-18T15:57:00Z

## Task Summary
- **What to build**: Full Canonical Architecture conversion of the Orders Intake & Dispatch module with TanStack Table v8, nuqs URL state, TanStack Query v5 prefetching & mutations, KPI summary cards, date range presets, create/edit/delete/external-vehicle modals, and full E2E verification.
- **Success criteria**: All Playwright E2E tests passing, Next.js build & typecheck with 0 errors, full architectural alignment with `frontend/src/features/hubs/`.
- **Interface contracts**: `d:\Projects\logistics-website\.agents\PROJECT.md`, `SCOPE.md`

## Key Decisions Made
1. **Search Params & nuqs**: Extended `searchparams.ts` with `hub`, `originHub`, `destinationHub`, `fromDate`, `toDate`, `preset` and created `frontend/src/features/orders/params.ts`.
2. **Date Range Extraction**: Created `src/features/orders/date-range.ts` as a pure server/client shared utility to prevent `'use client'` boundaries crossing into Server Component execution.
3. **Hub Name Normalization**: Handled both seed database names with/without parenthetical city tags and short city forms (`TP.HCM`) in `order-create-dialog.tsx` for 100% Playwright compatibility.
4. **Infobar Title Alignment**: Titled `ordersInfoContent` with a unique heading to avoid strict-mode ambiguity with the main page heading `Lập Lệnh Điều Vận`.
5. **Component Parity**: Co-located all sub-components (`columns.tsx`, `cell-action.tsx`, `orders-kpi-cards.tsx`, `orders-date-preset-bar.tsx`, dialogs) under `features/orders/components/orders-tables/` and `features/orders/components/`.

## Change Tracker
- **Files modified**:
  - `frontend/src/lib/searchparams.ts`: Added orders search and filter parameters.
  - `frontend/src/features/orders/params.ts`: nuqs parser and cache definitions.
  - `frontend/src/features/orders/date-range.ts`: Pure date range calculations.
  - `frontend/src/features/orders/api/types.ts`: TypeScript interfaces for Order, PaginatedOrdersResponse, Payloads.
  - `frontend/src/features/orders/api/service.ts`: API service client and legacy ordersApi wrapper.
  - `frontend/src/features/orders/api/queries.ts`: TanStack Query key factory and query options.
  - `frontend/src/features/orders/api/mutations.ts`: TanStack Query mutations with Vietnamese toasts.
  - `frontend/src/features/orders/api/index.ts` & `frontend/src/features/orders/api.ts`: API re-exports.
  - `frontend/src/features/orders/info-content.ts`: Sheet infobar metadata.
  - `frontend/src/features/orders/components/orders-tables/options.tsx`: Status and date preset options.
  - `frontend/src/features/orders/components/orders-tables/use-orders-table-filters.tsx`: nuqs filter hook.
  - `frontend/src/features/orders/components/orders-tables/columns.tsx`: TanStack Table column definitions with safe null checks.
  - `frontend/src/features/orders/components/orders-tables/cell-action.tsx`: Row actions.
  - `frontend/src/features/orders/components/orders-tables/index.tsx`: DataTable Client Component.
  - `frontend/src/features/orders/components/orders-kpi-cards.tsx`: 4 KPI metrics cards.
  - `frontend/src/features/orders/components/orders-date-preset-bar.tsx`: Date range and preset selector.
  - `frontend/src/features/orders/components/order-create-dialog.tsx`: Create order dialog with dynamic active hubs.
  - `frontend/src/features/orders/components/order-delete-dialog.tsx`: Soft delete dialog.
  - `frontend/src/features/orders/components/order-edit-dialog.tsx`: Edit order dialog.
  - `frontend/src/features/orders/components/order-external-dialog.tsx`: External vehicle dialog.
  - `frontend/src/features/orders/components/orders-listing.tsx`: Server Component prefetcher.
  - `frontend/src/features/orders/components/index.ts`: Barrel export.
  - `frontend/src/app/dashboard/orders/page.tsx`: Standardized Server Component.
  - `frontend/src/app/dashboard/orders/loading.tsx`: DataTableSkeleton wrapper.

## Quality Status
- **Build/test result**:
  - `npm run typecheck`: PASS (0 errors)
  - `npm run build`: PASS (28/28 routes compiled successfully)
  - `npx playwright test e2e/06-order-dispatch-workflow.spec.ts`: PASS (1/1 passed)
  - `npx playwright test e2e/03-rbac-routing.spec.ts`: PASS (20/20 passed)
  - `npx playwright test e2e/07-capture-user-guide-screenshots.spec.ts`: PASS (1/1 passed)
  - `npx playwright test e2e/10-hubs-management.spec.ts`: PASS (2/2 passed)
- **Lint status**: Clean, zero warnings or errors.
- **Tests added/modified**: Verified all E2E suites covering orders intake, dispatch, vehicle assignment, RBAC, and documentation capture.
