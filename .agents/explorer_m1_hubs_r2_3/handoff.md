# Handoff Report: Explorer 3 — Hubs Management Test Resilience & Stack Coordination

**Agent**: Explorer 3 (Iteration 2)  
**Milestone**: Milestone 1 — Hubs Management Standardization  
**Focus**: E2E Test Suite Resilience, Backend Sorting/Pagination, and Frontend Coordination Strategy  
**Date**: 2026-08-18  

---

## 1. Observation

### 1.1 Test Suite Failure in `10-hubs-management.spec.ts`
- **File**: `frontend/e2e/10-hubs-management.spec.ts` (Lines 24–26)
- **Observed Code**:
  ```typescript
  // 4. Verify table rendered seed hubs
  const hanRow = page.locator('text=Andromeda Hub');
  await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
  ```
- **Observed Error**:
  ```
  Error: expect(locator).toBeVisible() failed
  Locator: locator('text=Andromeda Hub').first()
  Expected: visible
  Timeout: 10000ms
  Error: element(s) not found
  ```
- **Database Seed State**: `backend/src/database/seeds/relational/hub/hub-seed.service.ts` seeds exactly 5 hubs (`Andromeda`, `Magellan`, `Centaurus`, `Pegasus`, `Vela`).
- **Data Accumulation**: Each test execution in `10-hubs-management.spec.ts` (L48–58) and challenger specs creates new hubs (`HUB-E2E-xxxx`, `HUB-CH2-xxxx`, `HUB-EMP-xxxx`).
- **Backend Sort Order**: `backend/src/hubs/hubs.service.ts` L55 hardcodes `.orderBy('hub.createdAt', 'DESC')` with default `limit: 10`.

### 1.2 Backend Sorting & Pagination Capabilities
- **File**: `backend/src/hubs/dto/query-hub.dto.ts` (Lines 5–35)
  - `page?: number = 1`
  - `limit?: number = 10`
  - `search?: string`
  - `isActive?: boolean`
  - `sort` property is **absent**.
- **File**: `backend/src/hubs/hubs.service.ts` (Lines 47–80)
  - Search uses `ILIKE` across `hub.code`, `hub.name`, `hub.city`, `hub.address`, `hub.managerName`.
  - Sorting is hardcoded to `hub.createdAt DESC`. Dynamic column header sorting triggered from frontend table is ignored by the backend.

### 1.3 Frontend Table & Mutation State
- **File**: `frontend/src/features/hubs/components/hubs-tables/use-hubs-table-filters.tsx` (Lines 9–37)
  - Sends `sort: JSON.stringify(params.sort)` (e.g. `[{"id":"name","desc":false}]`).
- **File**: `frontend/src/features/hubs/components/hub-form-dialog.tsx` (Lines 63–85) & `cell-action.tsx` (Lines 27–52)
  - Spreading `{ ...createHubMutation, onSuccess: ... }` overrides `onSuccess` from `api/mutations.ts`, dropping `queryClient.invalidateQueries({ queryKey: hubKeys.all })`.
- **File**: `frontend/src/features/hubs/components/hubs-listing.tsx` (Lines 37–41)
  - `<div className='space-y-6'>` causes `<DataTable>` container height to collapse to 0px, causing the pagination footer to intercept pointer events.

---

## 2. Logic Chain

1. In `10-hubs-management.spec.ts`, Step 4 checks for `Andromeda Hub` on the initial table view with default `page=1, perPage=10`.
2. Because backend sorts by `hub.createdAt DESC`, every newly created test hub in the database is placed ahead of the original seed hubs.
3. Once total hubs in the live database reach $\ge 11$, all 5 seed hubs are displaced to Page 2 (offset $\ge 10$).
4. Because Step 4 does not perform a search filter prior to asserting visibility of `Andromeda Hub`, the locator fails to find `Andromeda Hub` on Page 1, causing a deterministic failure whenever the database contains accumulated test data.
5. Furthermore, backend `HubsService.findAll` lacks support for sorting by name, code, or city, so sorting cannot be used to force seed hubs to Page 1 without search.
6. Refactoring `10-hubs-management.spec.ts` to (a) assert row visibility on initial load, (b) use `#hub-search-input` to locate seed hubs deterministically, and (c) use `#hub-search-input` to verify newly created hubs decouples test success from database record count.
7. Implementing dynamic sorting in `backend/src/hubs/` and fixing cache invalidation & container layout in `frontend/src/features/hubs/` ensures complete end-to-end reliability and compliance with project architectural standards.

---

## 3. Caveats

- **Database Cleanup / Teardown**: E2E test runs do not currently run a post-test database rollback/cleanup. Therefore, tests MUST be designed to be resilient against monotonically growing database rows.
- **Search Debounce**: Frontend `useDataTable` debounces search input by 300ms. Test assertions should use Playwright locators with built-in auto-waiting (`toBeVisible({ timeout: 10_000 })`) rather than arbitrary `waitForTimeout` calls.
- **Scope Boundary**: As an Explorer, this report provides the exact investigation, logic, and remediation code for downstream implementers / workers without modifying production files directly.

---

## 4. Conclusion

The failure in `10-hubs-management.spec.ts` is caused by **unfiltered pagination displacement** under accumulated test data, compounded by frontend cache invalidation and layout collapse bugs.

### Key Remediation Steps:
1. **E2E Spec Hardening (`10-hubs-management.spec.ts`)**:
   - Step 4: Verify generic row rendering (`tbody tr`).
   - Step 5: Test search filter explicitly using `#hub-search-input` for `Andromeda` and `Đà Nẵng`.
   - Step 6: After form submission, search for `uniqueCode` to verify deterministic persistence and rendering.
2. **Backend Sorting Support (`backend/src/hubs/`)**:
   - Add `@ApiPropertyOptional() sort?: string` to `QueryHubDto`.
   - Parse `sort` JSON string and apply `qb.addOrderBy(field, direction)` against whitelisted fields (`code`, `name`, `city`, `createdAt`, `updatedAt`, `isActive`) in `HubsService.findAll`.
3. **Frontend Cache Invalidation & Layout Fixes (`frontend/src/features/hubs/`)**:
   - Explicitly call `useQueryClient().invalidateQueries({ queryKey: hubKeys.all })` in `hub-form-dialog.tsx` and `cell-action.tsx`.
   - Wrap `HubsTable` in a flex container with `min-h-[420px]` in `hubs-listing.tsx`.

---

## 5. Verification Method

To independently verify these findings and validate the remediation:

1. **Verify Current Spec Failure Under Large DB**:
   ```bash
   cd frontend
   npx playwright test e2e/10-hubs-management.spec.ts
   ```

2. **Verify Frontend Type Safety**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```

3. **Verify Backend Type Safety & Build**:
   ```bash
   cd backend
   npm run build
   ```

4. **Verify Empirical Edge Cases**:
   ```bash
   cd frontend
   npx playwright test e2e/challenger-m1-empirical.spec.ts
   npx playwright test e2e/challenger-hubs-workflow.spec.ts
   ```
