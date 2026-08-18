# Milestone 1: Hubs Management Standardization — E2E Specification Analysis Report

**Explorer**: Explorer 3 (E2E Test & Selector Analysis)  
**Target Spec**: `frontend/e2e/10-hubs-management.spec.ts` (and related cross-feature specs: `03-rbac-routing.spec.ts`, `04-fleet-crud-and-refresh.spec.ts`, `06-order-dispatch-workflow.spec.ts`, `07-capture-user-guide-screenshots.spec.ts`)  
**Target Feature**: Hubs Management (`/dashboard/admin/hubs` -> `src/features/hubs/`)  
**Status**: COMPLETE

---

## 1. Executive Summary

This report provides an exhaustive, field-by-field and step-by-step opaque-box analysis of all Playwright E2E tests covering the Hubs Management feature. It establishes the concrete contracts, DOM IDs, testids, text labels, action sequences, toast behaviors, RBAC routing constraints, and edge cases necessary for the Milestone 1 Worker to achieve a 100% test pass rate upon standardizing Hubs with TanStack React Table v8, `nuqs`, and TanStack Query v5.

---

## 2. Playwright E2E Test Suite Analysis: `10-hubs-management.spec.ts`

The primary test spec `frontend/e2e/10-hubs-management.spec.ts` contains two comprehensive E2E tests:

### 2.1. Test 1: `Super Admin can view, search and manage Hubs`

```typescript
test('Super Admin can view, search and manage Hubs', async ({ page }) => {
  // 1. Login as SUPER_ADMIN
  await loginAs(page, superAdmin);

  // 2. Navigate to /dashboard/admin/hubs
  await page.goto('/dashboard/admin/hubs');
  await page.waitForLoadState('networkidle');

  // 3. Check page header
  const heading = page.locator('h2', { hasText: 'Quản Lý Chi Nhánh Kho' });
  await expect(heading).toBeVisible({ timeout: 10_000 });

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

  // 6. Test opening Add Hub Modal
  const addBtn = page.locator('#btn-add-hub');
  await addBtn.click();

  const dialog = page.locator('#hub-form-dialog');
  await expect(dialog).toBeVisible();

  // Fill form
  const uniqueCode = `HUB-E2E-${Date.now().toString().slice(-4)}`;
  await page.fill('#input-hub-code', uniqueCode);
  await page.fill('#input-hub-city', 'Hải Phòng');
  await page.fill('#input-hub-name', `Kho E2E Test ${uniqueCode}`);
  await page.fill('#input-hub-address', 'KCN Đình Vũ, Hải Phòng');
  await page.fill('#input-hub-manager', 'Tester E2E');
  await page.fill('#input-hub-phone', '0901234567');

  // Submit
  await page.click('button[type="submit"]:has-text("Thêm Chi Nhánh")');

  // Dialog should close and new hub should be listed
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator(`text=${uniqueCode}`).first()).toBeVisible({ timeout: 10_000 });
});
```

#### Step-by-Step Test Sequence Breakdown:
1. **Authentication**: Logs in with `SUPER_ADMIN` credentials (`admin@logistics.vn` / `secret` or `lyquangthai1993@gmail.com`).
2. **Navigation**: Visits `/dashboard/admin/hubs` and waits for `networkidle`.
3. **Heading Assertion**: Asserts `page.locator('h2', { hasText: 'Quản Lý Chi Nhánh Kho' })` is visible within 10s.
4. **Seed Hubs Assertion**: Asserts `page.locator('text=Andromeda Hub').first()` is visible within 10s (seeded `HUB-HAN-01`, "Andromeda Hub (Hà Nội)").
5. **Search Filter Interaction**:
   - Locates `#hub-search-input`.
   - Fills with `'Đà Nẵng'`.
   - Waits 500ms.
   - Asserts `page.locator('text=Magellan Hub').first()` is visible (seeded `HUB-DAD-01`, "Magellan Hub (Đà Nẵng)").
   - Clears search input with `''` and waits 500ms.
6. **Modal Trigger**:
   - Locates and clicks `#btn-add-hub`.
   - Asserts dialog `#hub-form-dialog` is visible.
7. **Form Fill & Submission**:
   - Generates unique code `uniqueCode = HUB-E2E-${Date.now().toString().slice(-4)}`.
   - Fills `#input-hub-code` with `uniqueCode`.
   - Fills `#input-hub-city` with `'Hải Phòng'`.
   - Fills `#input-hub-name` with `'Kho E2E Test ' + uniqueCode`.
   - Fills `#input-hub-address` with `'KCN Đình Vũ, Hải Phòng'`.
   - Fills `#input-hub-manager` with `'Tester E2E'`.
   - Fills `#input-hub-phone` with `'0901234567'`.
   - Submits form via `button[type="submit"]:has-text("Thêm Chi Nhánh")`.
8. **Post-Submission Assertions**:
   - Asserts `#hub-form-dialog` is hidden/not visible within 10s.
   - Asserts newly created code `uniqueCode` text is visible in table within 10s.

---

### 2.2. Test 2: `FLEET_MANAGER is blocked from /dashboard/admin/hubs and can select Hub in fleet page`

```typescript
test('FLEET_MANAGER is blocked from /dashboard/admin/hubs and can select Hub in fleet page', async ({
  page
}) => {
  // 1. Login as FLEET_MANAGER
  await loginAs(page, fleetManager);

  // 2. Try to visit /dashboard/admin/hubs -> should redirect to /dashboard/overview
  await page.goto('/dashboard/admin/hubs');
  await page.waitForURL(/\/dashboard\/overview/, { timeout: 10_000 });

  // 3. Visit /dashboard/fleet
  await page.goto('/dashboard/fleet');
  await page.waitForLoadState('networkidle');

  // 4. Open Add Vehicle Modal
  const addVehicleBtn = page.locator('#btn-add-vehicle');
  await expect(addVehicleBtn).toBeVisible({ timeout: 10_000 });
  await addVehicleBtn.click();

  // 5. Check that Hub Select dropdown is present with options
  const hubSelect = page.locator('#select-current-hub');
  await expect(hubSelect).toBeVisible();

  const optionsCount = await hubSelect.locator('option').count();
  expect(optionsCount).toBeGreaterThan(1); // Should have placeholder + seeded active hubs
});
```

#### Step-by-Step Test Sequence Breakdown:
1. **Authentication**: Logs in with `FLEET_MANAGER` credentials (`fleet@logistics.vn` / `secret` or `lyquangthai1993+3@gmail.com`).
2. **RBAC Guard Enforcement**: Navigates to `/dashboard/admin/hubs` and asserts that Next.js middleware / route guard redirects the URL to `/\/dashboard\/overview/` within 10s.
3. **Fleet Integration Verification**:
   - Navigates to `/dashboard/fleet`.
   - Clicks `#btn-add-vehicle` to open vehicle modal.
   - Asserts vehicle modal contains `#select-current-hub` dropdown.
   - Asserts `#select-current-hub` contains active hub options (`optionsCount > 1`).

---

## 3. Comprehensive Selector & DOM Inventory

The following table provides the exhaustive catalog of all locators, DOM IDs, testids, input attributes, and text requirements:

| Element / Action | Precise Locator / Selector | Element Type | Verified Value / Description | File & Line in Test Spec |
|---|---|---|---|---|
| **Page Heading** | `h2:has-text("Quản Lý Chi Nhánh Kho")` | `<h2>` Heading | Text must contain `'Quản Lý Chi Nhánh Kho'` | `10-hubs-management.spec.ts:21` |
| **Search Input** | `#hub-search-input` | `<Input>` | ID MUST be `hub-search-input`. Handles search queries (e.g. `'Đà Nẵng'`). | `10-hubs-management.spec.ts:29` |
| **Add Hub Button** | `#btn-add-hub` | `<Button>` | ID MUST be `btn-add-hub`. Triggers opening of `#hub-form-dialog`. | `10-hubs-management.spec.ts:41` |
| **Add/Edit Modal Dialog** | `#hub-form-dialog` | `<DialogContent>` | ID MUST be `hub-form-dialog`. Visible when open; closes upon submit. | `10-hubs-management.spec.ts:44,60` |
| **Form Code Input** | `#input-hub-code` | `<Input>` | ID: `input-hub-code`. Value: e.g. `HUB-E2E-1234`. | `10-hubs-management.spec.ts:49` |
| **Form City Input** | `#input-hub-city` | `<Input>` | ID: `input-hub-city`. Value: e.g. `'Hải Phòng'`. | `10-hubs-management.spec.ts:50` |
| **Form Name Input** | `#input-hub-name` | `<Input>` | ID: `input-hub-name`. Value: e.g. `'Kho E2E Test HUB-E2E-1234'`. | `10-hubs-management.spec.ts:51` |
| **Form Address Input** | `#input-hub-address` | `<Input>` | ID: `input-hub-address`. Value: e.g. `'KCN Đình Vũ, Hải Phòng'`. | `10-hubs-management.spec.ts:52` |
| **Form Manager Input** | `#input-hub-manager` | `<Input>` | ID: `input-hub-manager`. Value: e.g. `'Tester E2E'`. | `10-hubs-management.spec.ts:53` |
| **Form Phone Input** | `#input-hub-phone` | `<Input>` | ID: `input-hub-phone`. Value: e.g. `'0901234567'`. | `10-hubs-management.spec.ts:54` |
| **Form Active Checkbox** | `#input-hub-is-active` | `<input type="checkbox">` | ID: `input-hub-is-active`. Checkbox for active state. | `admin/hubs/page.tsx:601` |
| **Submit Button** | `button[type="submit"]:has-text("Thêm Chi Nhánh")` | `<Button type="submit">` | Type `submit`, contains text `'Thêm Chi Nhánh'`. | `10-hubs-management.spec.ts:57` |
| **Seed Hub Row 1** | `text=Andromeda Hub` | Table row / cell | Verifies seed hub `Andromeda Hub (Hà Nội)` is visible. | `10-hubs-management.spec.ts:25` |
| **Seed Hub Filtered** | `text=Magellan Hub` | Table row / cell | Verifies search for `'Đà Nẵng'` displays `Magellan Hub`. | `10-hubs-management.spec.ts:33` |
| **Created Hub Row** | `text=${uniqueCode}` | Table row / cell | Verifies newly added hub appears in table list. | `10-hubs-management.spec.ts:61` |
| **Row TestID (Parity)** | `[data-testid="hub-row-${hub.id}"]` | `<tr>` | Row identifier for individual hubs. | `admin/hubs/page.tsx:347` |
| **Edit Button TestID** | `[data-testid="btn-edit-hub-${hub.id}"]` | `<button>` | Opens edit modal for hub. | `admin/hubs/page.tsx:420` |
| **Delete Button TestID** | `[data-testid="btn-delete-hub-${hub.id}"]` | `<button>` | Opens soft delete confirmation dialog for hub. | `admin/hubs/page.tsx:430` |
| **Status Filter Dropdown**| `#hub-status-filter` | `<select>` / filter | Filter dropdown by ALL, ACTIVE, INACTIVE status. | `admin/hubs/page.tsx:300` |
| **Fleet Hub Dropdown** | `#select-current-hub` | `<select>` | In `/dashboard/fleet` Add Vehicle modal; verifies active hubs. | `10-hubs-management.spec.ts:84` |

---

## 4. Toast Notification & Error Handling Matrix

In accordance with project-wide Toast Standardization rules:
- **Rule 1 (100% Vietnamese in Business Domain)**: All toasts must be Vietnamese.
- **Rule 2 (API Message First)**: Error toasts must use `err.response?.data?.message || fallback`.

| Action | Success Toast Pattern | Error Toast Pattern |
|---|---|---|
| **Load Hubs List** | N/A (silent) | `toast.error(err?.response?.data?.message \|\| 'Không thể tải danh sách chi nhánh kho')` |
| **Create Hub** | `toast.success('Tạo mới chi nhánh "${payload.name}" thành công!')` | `toast.error(err?.response?.data?.message \|\| 'Có lỗi xảy ra khi tạo mới chi nhánh')` |
| **Update Hub** | `toast.success('Cập nhật chi nhánh "${payload.name}" thành công!')` | `toast.error(err?.response?.data?.message \|\| 'Có lỗi xảy ra khi cập nhật chi nhánh')` |
| **Toggle Active** | `toast.success(updated.isActive ? 'Đã kích hoạt hoạt động chi nhánh "${hub.name}"' : 'Đã tạm ngưng hoạt động chi nhánh "${hub.name}"')` | `toast.error(err?.response?.data?.message \|\| 'Không thể chuyển đổi trạng thái chi nhánh kho')` |
| **Soft Delete** | `toast.success(res.message \|\| 'Đã xóa mềm chi nhánh "${deletingHub.name}" thành công!')` | `toast.error(err?.response?.data?.message \|\| 'Có lỗi xảy ra khi xóa chi nhánh')` |

---

## 5. Edge Cases & Validation Rules

1. **Unique Code Collision (`409 Conflict`)**:
   - Backend `HubsService.create` enforces unique `code`. If a code exists, backend throws `ConflictException('Hub với mã "..." đã tồn tại trong hệ thống')`.
   - Frontend must catch this and display the backend message via `toast.error(err.response?.data?.message)`.
2. **Vietnamese Diacritic Search**:
   - Typing `'Đà Nẵng'`, `'Hà Nội'`, or `'Hải Phòng'` into `#hub-search-input` queries backend via `ILIKE` on `code`, `name`, `city`, `address`, `managerName`.
   - The test waits 500ms after filling search input; debounce time must be <= 500ms (standard 300ms or instant state sync).
3. **Soft Delete Safety & Vehicle Relation**:
   - If a hub has associated vehicles (`hub.vehicles.length > 0`), the confirmation dialog warns that vehicle relations will be unlinked safely without data loss.
   - Deleting soft-deletes the hub in backend (`deletedAt` populated, `isActive: false`).
4. **Active Hubs Dropdown for Fleet Management**:
   - Backend endpoint `GET /api/v1/hubs/active` returns only hubs with `isActive: true`.
   - `/dashboard/fleet` vehicle modal uses `#select-current-hub` which relies on `GET /api/v1/hubs/active`.
5. **RBAC Middleware Routing Guard**:
   - `src/proxy.ts` (Next.js middleware) restricts `/dashboard/admin/*` to `SUPER_ADMIN`.
   - Any non-admin role (such as `FLEET_MANAGER`) navigating to `/dashboard/admin/hubs` is redirected to `/dashboard/overview`.

---

## 6. Critical Invariants Checklist for Worker Implementation

The Worker implementing Milestone 1 MUST strictly maintain the following checklist to ensure 100% test pass:

- [ ] **1. Heading**: Render `<h2 ...>` containing text `"Quản Lý Chi Nhánh Kho"` (via `PageContainer` `pageTitle='Quản Lý Chi Nhánh Kho (Hubs)'` or `Heading` component).
- [ ] **2. Add Button ID**: Add Hub button has exact ID `#btn-add-hub`.
- [ ] **3. Search Input ID & Behavior**: Search input has exact ID `#hub-search-input`. Searching `'Đà Nẵng'` renders `'Magellan Hub'` within 500ms; clearing restores `'Andromeda Hub'`.
- [ ] **4. Dialog ID**: Modal dialog content / container has exact ID `#hub-form-dialog`.
- [ ] **5. Form Input IDs**:
  - Code: `#input-hub-code`
  - City: `#input-hub-city`
  - Name: `#input-hub-name`
  - Address: `#input-hub-address`
  - Manager: `#input-hub-manager`
  - Phone: `#input-hub-phone`
  - Active: `#input-hub-is-active`
- [ ] **6. Submit Button Locator**: Button inside form has `type="submit"` and contains text `"Thêm Chi Nhánh"` when creating a new hub.
- [ ] **7. Instant Invalidation / Refresh**: On successful create/update/delete/toggle, TanStack Query query client invalidates `['hubs']` so the new hub code appears in the table within 10 seconds and dialog closes.
- [ ] **8. Action TestIDs**: Preserve `data-testid="btn-edit-hub-${hub.id}"` and `data-testid="btn-delete-hub-${hub.id}"`.
- [ ] **9. Active Hubs API**: Preserve `/api/v1/hubs/active` for `/dashboard/fleet` vehicle assignment.
- [ ] **10. Strict RBAC**: Keep `/dashboard/admin` protected for `SUPER_ADMIN` only in `src/proxy.ts`.
- [ ] **11. Toast Rules**: 100% Vietnamese toasts with API-message-first error handling.
- [ ] **12. TypeScript Build**: `npm run build` passes with 0 type errors.
