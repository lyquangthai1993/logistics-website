# Technical Analysis: Hubs Management Test Resilience & Backend/Frontend Coordination

**Author**: Explorer 3 (Iteration 2)  
**Target Milestone**: Milestone 1 — Hubs Management Standardization  
**Focus**: E2E Test Suite Flakiness, Backend Sort/Pagination Capabilities, and Cross-Stack Coordination Strategy  
**Date**: 2026-08-18  

---

## 1. Problem Statement & Root Cause Diagnosis

### 1.1 The Failure in `10-hubs-management.spec.ts`
In `frontend/e2e/10-hubs-management.spec.ts`:
```typescript
// Lines 24-26:
// 4. Verify table rendered seed hubs
const hanRow = page.locator('text=Andromeda Hub');
await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
```

#### Mechanism of Failure:
1. **Initial Seed State**: The database is seeded with 5 hubs:
   - `HUB-HAN-01`: Andromeda Hub (Hà Nội)
   - `HUB-DAD-01`: Magellan Hub (Đà Nẵng)
   - `HUB-SGN-01`: Centaurus Hub (TP.HCM)
   - `HUB-VTH-01`: Pegasus Hub (Cần Thơ)
   - `HUB-HPH-01`: Vela Hub (Hải Phòng)
   *(All created at migration/seed execution time)*.

2. **Backend Query Default**:
   In `backend/src/hubs/hubs.service.ts` (L55):
   ```typescript
   const qb = this.hubRepository
     .createQueryBuilder('hub')
     .leftJoinAndSelect('hub.vehicles', 'vehicle')
     .orderBy('hub.createdAt', 'DESC');
   ```
   Default pagination limit is `limit: 10`.

3. **Accumulation of Test Artifacts**:
   - `10-hubs-management.spec.ts` creates `HUB-E2E-xxxx` on every run.
   - Challenger test specs (`challenger-m1-empirical.spec.ts`, `challenger-hubs-workflow.spec.ts`) create additional test hubs (`HUB-EMP-xxxx`, `HUB-CH2-xxxx`, `HUB-DEL-xxxx`).
   - Each created hub receives a fresh `createdAt` timestamp (`NOW()`), placing it at the front of the `createdAt DESC` sort order.
   - Once total hubs exceed 10 (which happens after 6+ test runs), the original 5 seed hubs (including `Andromeda Hub`) are pushed to records 11–15 (Page 2).

4. **The Flake**:
   When `10-hubs-management.spec.ts` navigates to `/dashboard/admin/hubs` (default `page=1, perPage=10`), Page 1 only displays the 10 newest test hubs. `Andromeda Hub` is located on Page 2. Checking `expect(hanRow.first()).toBeVisible()` fails with a 10-second timeout.

---

## 2. Deep Dive: Backend Hubs Module (`backend/src/hubs/`)

### 2.1 Query DTO (`backend/src/hubs/dto/query-hub.dto.ts`)
```typescript
export class QueryHubDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã kho, tên kho, thành phố, địa chỉ, quản lý' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái hoạt động' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
```
**Findings**:
- ✅ `page` and `limit` are properly validated with numeric transformations, min/max bounds.
- ✅ `search` is supported and passed to the service.
- ✅ `isActive` is supported with boolean string transforms (`'true'` / `'false'`).
- ❌ `sort` is **NOT defined** in `QueryHubDto`. Any `sort` query parameter sent from the frontend is discarded.

### 2.2 Hubs Service Query Execution (`backend/src/hubs/hubs.service.ts`)
```typescript
async findAll(query: QueryHubDto = {}): Promise<PaginatedResult<HubEntity>> {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const qb = this.hubRepository
    .createQueryBuilder('hub')
    .leftJoinAndSelect('hub.vehicles', 'vehicle')
    .orderBy('hub.createdAt', 'DESC');

  if (typeof query.isActive === 'boolean') {
    qb.andWhere('hub.isActive = :isActive', { isActive: query.isActive });
  }

  if (query.search && query.search.trim()) {
    const search = `%${query.search.trim()}%`;
    qb.andWhere(
      '(hub.code ILIKE :search OR hub.name ILIKE :search OR hub.city ILIKE :search OR hub.address ILIKE :search OR hub.managerName ILIKE :search)',
      { search },
    );
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
```
**Findings**:
- Search logic uses PostgreSQL `ILIKE` across 5 fields (`code`, `name`, `city`, `address`, `managerName`), supporting case-insensitive Vietnamese diacritics and partial matches effectively.
- Sorting is hardcoded to `hub.createdAt DESC`. Dynamic sorting requested by the frontend DataTable headers (e.g. `code ASC`, `name ASC`) has no effect on returned rows.

---

## 3. Frontend Hubs Feature Analysis (`frontend/src/features/hubs/`)

### 3.1 Table State & URL Filter Synchronization (`use-hubs-table-filters.tsx`)
- The hook parses `page`, `perPage`, `name`/`search`, `status`/`isActive`, and `sort` via `nuqs`.
- It serializes `params.sort` as `JSON.stringify(params.sort)` (e.g. `[{"id":"name","desc":false}]`).
- When a user filters by text, `useDataTable` automatically resets `page = 1`.

### 3.2 Key Frontend Bugs Identified by Challengers:
1. **Mutation Invalidation Clobbered**:
   In `hub-form-dialog.tsx` (L63-85) and `cell-action.tsx` (L27-52), `useMutation({ ...createHubMutation, onSuccess: ... })` overrides the base `onSuccess` where `queryClient.invalidateQueries({ queryKey: hubKeys.all })` was defined. This prevents UI tables and KPI metrics from updating on create, edit, toggle, or soft-delete.
2. **Container Height Collapse**:
   In `hubs-listing.tsx` (L37-41), wrapping the table in `<div className='space-y-6'>` collapses the inner `<DataTable>` relative flex container to 0px height, causing the pagination footer to overlap table rows and intercept click events.

---

## 4. Recommended Remediation & Coordination Strategy

### 4.1 Remediation for `10-hubs-management.spec.ts` (Test Hardening)
The test spec should never assume a specific seed record is located on Page 1 when the database can grow arbitrarily.

#### Concrete Changes to `10-hubs-management.spec.ts`:
```typescript
// BEFORE (Fragile):
// 4. Verify table rendered seed hubs
const hanRow = page.locator('text=Andromeda Hub');
await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });

// 5. Test search filter
const searchInput = page.locator('#hub-search-input');
await searchInput.fill('Đà Nẵng');
await page.waitForTimeout(500);
const dadRow = page.locator('text=Magellan Hub');
await expect(dadRow.first()).toBeVisible();

// Clear search
await searchInput.fill('');
await page.waitForTimeout(500);
```

```typescript
// AFTER (Resilient & Deterministic):
// 4. Verify table rendered rows on initial load
const tableRows = page.locator('tbody tr');
await expect(tableRows.first()).toBeVisible({ timeout: 10_000 });

// 5. Test search filter with seed hubs (verifies search works AND locates seed records regardless of page count)
const searchInput = page.locator('#hub-search-input');

// 5a. Search for Andromeda Hub (Hà Nội)
await searchInput.fill('Andromeda');
const hanRow = page.locator('tbody tr', { hasText: 'Andromeda Hub' });
await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });

// 5b. Search for Magellan Hub (Đà Nẵng)
await searchInput.fill('Đà Nẵng');
const dadRow = page.locator('tbody tr', { hasText: 'Magellan Hub' });
await expect(dadRow.first()).toBeVisible({ timeout: 10_000 });

// 5c. Clear search to restore full table
await searchInput.fill('');
await expect(tableRows.first()).toBeVisible({ timeout: 10_000 });

// 6. Test opening Add Hub Modal & creation
// ... (fill form with uniqueCode) ...
// Submit and verify:
await expect(dialog).not.toBeVisible({ timeout: 10_000 });
// Search for the newly created hub to deterministically verify persistence and cache invalidation
await searchInput.fill(uniqueCode);
await expect(page.locator('tbody tr', { hasText: uniqueCode }).first()).toBeVisible({ timeout: 10_000 });
```

**Why this is 100% resilient**:
- Does not care whether the DB has 5 hubs, 50 hubs, or 500 hubs.
- Tests the exact user journey: viewing data, searching by name/code/city, resetting search, creating a new item, and searching for the newly created item.
- Explicitly tests table presence (`tbody tr`) rather than arbitrary pagination offsets.

---

### 4.2 Backend Coordination Strategy (`backend/src/hubs/`)

To fully satisfy the TanStack Table standardization contract and enable server-side sorting:

#### Step 1: Update `QueryHubDto` (`backend/src/hubs/dto/query-hub.dto.ts`)
Add the `sort` parameter:
```typescript
@ApiPropertyOptional({ description: 'Sắp xếp dạng JSON string e.g. [{"id":"name","desc":false}] hoặc tên cột' })
@IsOptional()
@IsString()
sort?: string;
```

#### Step 2: Implement Dynamic Sorting in `HubsService.findAll` (`backend/src/hubs/hubs.service.ts`)
```typescript
const ALLOWED_SORT_FIELDS: Record<string, string> = {
  code: 'hub.code',
  name: 'hub.name',
  city: 'hub.city',
  createdAt: 'hub.createdAt',
  updatedAt: 'hub.updatedAt',
  isActive: 'hub.isActive',
};

let hasCustomOrder = false;
if (query.sort) {
  try {
    const parsedSort = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
    if (Array.isArray(parsedSort) && parsedSort.length > 0) {
      for (const s of parsedSort) {
        const field = ALLOWED_SORT_FIELDS[s.id];
        if (field) {
          qb.addOrderBy(field, s.desc ? 'DESC' : 'ASC');
          hasCustomOrder = true;
        }
      }
    }
  } catch {
    // Fallback if not valid JSON
  }
}

if (!hasCustomOrder) {
  qb.orderBy('hub.createdAt', 'DESC');
}
```

---

### 4.3 Frontend Coordination Strategy (`frontend/src/features/hubs/`)

1. **Fix Mutation Invalidation** in `hub-form-dialog.tsx` and `cell-action.tsx`:
   Call `const queryClient = useQueryClient();` and invoke `queryClient.invalidateQueries({ queryKey: hubKeys.all })` inside `onSuccess` alongside toast notifications.
2. **Fix Container Layout** in `hubs-listing.tsx`:
   Ensure table container does not collapse height:
   ```tsx
   <div className='flex flex-1 flex-col gap-4'>
     <HubsMetrics />
     <div className='min-h-[420px] flex-1'>
       <HubsTable />
     </div>
   </div>
   ```

---

## 5. Summary Table of Proposed Fixes

| Component | Target File | Issue | Proposed Remediation |
|---|---|---|---|
| **E2E Test** | `frontend/e2e/10-hubs-management.spec.ts` | Page 1 assumption for `Andromeda Hub` | Check `tbody tr` visibility, search for `Andromeda` before asserting, search for `uniqueCode` after creation |
| **Backend DTO** | `backend/src/hubs/dto/query-hub.dto.ts` | Missing `sort` property | Add `@ApiPropertyOptional() sort?: string` |
| **Backend Service** | `backend/src/hubs/hubs.service.ts` | Hardcoded `createdAt DESC` | Whitelist `ALLOWED_SORT_FIELDS`, parse JSON `sort`, apply `addOrderBy` |
| **Frontend Form** | `frontend/src/features/hubs/components/hub-form-dialog.tsx` | Invalidation clobbered by spread | Use `useQueryClient().invalidateQueries({ queryKey: hubKeys.all })` in `onSuccess` |
| **Frontend Actions** | `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx` | Invalidation clobbered by spread | Use `useQueryClient().invalidateQueries({ queryKey: hubKeys.all })` in `onSuccess` |
| **Frontend Layout** | `frontend/src/features/hubs/components/hubs-listing.tsx` | Layout height collapse & click interception | Use flex column container with `min-h-[420px]` wrapper around `HubsTable` |
