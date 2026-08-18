# BRIEFING — 2026-08-18T07:46:00Z

## Mission
Standardize Hubs Management (/dashboard/admin/hubs) into the Canonical Feature Architecture with TanStack Query v5, nuqs, HydrationBoundary prefetching, sortable columns, KPI metrics, Add/Edit Hub modal preserving exact E2E DOM locators and 100% Vietnamese toasts.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa
- Working directory: d:\Projects\logistics-website\.agents\worker_m1_hubs
- Original parent: 5d5e5cf7-7d86-4788-95d6-70b6cf3bbfc9
- Milestone: Milestone 1 - Hubs Management Standardization

## 🔒 Key Constraints
- Follow Canonical Feature Architecture (api/types.ts, api/service.ts, api/queries.ts, api/mutations.ts, components/hubs-tables/, components/hubs-listing.tsx, components/hubs-metrics.tsx, components/hub-form-dialog.tsx).
- Page route: Server Component at `frontend/src/app/dashboard/admin/hubs/page.tsx` with `searchParamsCache` and `<HydrationBoundary>`.
- Support column meta `id` in `frontend/src/types/data-table.ts` and `frontend/src/components/ui/table/data-table-toolbar.tsx` so `#hub-search-input` is passed to the input element.
- Preserve 100% E2E test locators: `#btn-add-hub`, `#hub-form-dialog`, `#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `#input-hub-is-active`, buttons `"Thêm Chi Nhánh"` / `"Lưu Thay Đổi"`, `#hub-search-input`.
- 100% Vietnamese toast notifications with backend error message fallback (`const apiMessage = err?.response?.data?.message; toast.error(apiMessage || '...');`).
- Zero build/type errors.

## Current Parent
- Conversation ID: 5d5e5cf7-7d86-4788-95d6-70b6cf3bbfc9
- Updated: 2026-08-18T07:46:00Z

## Task Summary
- **What to build**: Full canonical feature module `frontend/src/features/hubs/` and page `frontend/src/app/dashboard/admin/hubs/page.tsx`.
- **Success criteria**: Zero TypeScript/build errors, exact E2E compatibility, full TanStack Query cache invalidation, responsive UI with KPI cards.
- **Interface contracts**: `PROJECT.md`, `sub_orch_m1_hubs/SCOPE.md`.
- **Code layout**: Canonical Feature Layout.

## Change Tracker
- **Files modified/created**:
  - `frontend/src/types/data-table.ts`: added `id?: string;` to `ColumnMeta`.
  - `frontend/src/components/ui/table/data-table-toolbar.tsx`: bound `id={columnMeta.id}` to text filter input.
  - `frontend/src/lib/searchparams.ts`: added `isActive: parseAsString`.
  - `frontend/src/features/hubs/api/types.ts`: TypeScript contracts (`Hub`, `HubVehicle`, `HubFilters`, `CreateHubPayload`, `UpdateHubPayload`, `PaginatedHubsResponse`, `HubMetrics`, `DeleteHubResponse`).
  - `frontend/src/features/hubs/api/service.ts`: Data access layer for NestJS `/api/v1/hubs`.
  - `frontend/src/features/hubs/api/queries.ts`: `hubKeys` query factory & `hubsQueryOptions`.
  - `frontend/src/features/hubs/api/mutations.ts`: mutations with automatic `queryClient.invalidateQueries({ queryKey: hubKeys.all })`.
  - `frontend/src/features/hubs/api/index.ts`: module index.
  - `frontend/src/features/hubs/api.ts`: backwards compatibility re-export.
  - `frontend/src/features/hubs/info-content.ts`: documentation infobar content.
  - `frontend/src/features/hubs/components/hubs-tables/options.tsx`: `HUB_STATUS_OPTIONS`.
  - `frontend/src/features/hubs/components/hubs-tables/use-hubs-table-filters.tsx`: nuqs URL search params hook.
  - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`: row actions, quick toggle active, edit modal trigger, soft delete alert dialog.
  - `frontend/src/features/hubs/components/hubs-tables/columns.tsx`: `ColumnDef<Hub>[]` with sortable headers, badges, icons, and `#hub-search-input` metadata.
  - `frontend/src/features/hubs/components/hubs-tables/index.tsx`: Client table component with `useDataTable` & `useSuspenseQuery`.
  - `frontend/src/features/hubs/components/hubs-metrics.tsx`: 4 KPI cards (Total Hubs, Active, Inactive, Total Vehicles).
  - `frontend/src/features/hubs/components/hub-form-dialog.tsx`: Add/Edit Hub modal strictly preserving `#hub-form-dialog`, `#btn-add-hub`, input IDs, buttons `"Thêm Chi Nhánh"` / `"Lưu Thay Đổi"`.
  - `frontend/src/features/hubs/components/hubs-listing.tsx`: Server Component prefetching `hubsQueryOptions` + `<HydrationBoundary>`.
  - `frontend/src/features/hubs/components/index.ts`: component index.
  - `frontend/src/app/dashboard/admin/hubs/page.tsx`: Server Component entry with `searchParamsCache` and `<PageContainer>`.
- **Build status**: `npx tsc --noEmit` PASS (0 errors), `e2e/10-hubs-management.spec.ts` PASS (2/2 passed).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Passed.
- **Lint status**: Passed.
- **Tests added/modified**: `e2e/10-hubs-management.spec.ts` 100% verified.

## Artifact Index
- `handoff.md` — Final handoff report.
- `progress.md` — Progress tracker.
