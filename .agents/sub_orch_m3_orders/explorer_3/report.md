# QA & E2E Checklist Report: Milestone 3 — Orders Intake & Dispatch Standardization

**Audited by**: Explorer 3 (QA & E2E Test Specialist)  
**Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3`  
**Target Feature**: Orders Intake & Dispatch (`/dashboard/orders`, `frontend/src/features/orders/`)  
**Target Milestone**: Milestone 3: Orders Intake & Dispatch Standardization  
**Date**: 2026-08-18  

---

## 1. Executive Summary

Milestone 3 standardizes the Orders Intake & Dispatch module (`frontend/src/app/dashboard/orders/page.tsx` and `frontend/src/features/orders/`) from a legacy 1,176-line monolithic client component into the canonical **TanStack React Table (`@tanstack/react-table` v8) + `nuqs` search params + TanStack Query v5** architecture established in Milestone 1 (Hubs) and Milestone 2 (Fleet).

This report performs a comprehensive audit of all E2E test specifications (`06-order-dispatch-workflow.spec.ts`, `07-capture-user-guide-screenshots.spec.ts`, `03-rbac-routing.spec.ts`), the RBAC Matrix (`rbac-matrix.md`), and the backend API (`OrdersController`) to define the strict QA and E2E requirements. **Zero test regressions are permitted.**

### Core Invariants to Preserve:
1. **Critical Playwright Locators**: `button:has-text("Tạo lệnh điều vận mới")`, `button:has-text("Gửi Fleet")`, `button[type="submit"]:has-text("Lưu & Tạo lệnh")`, `#order-code-input`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#origin-hub-select`, `#destination-hub-select`, `#isExternalNeeded`, `#external-note-input`.
2. **DOM Hierarchy**: Standard HTML `table`, `thead`, `tbody`, `tr`, `th`, `td` elements rendered by `@/components/ui/table/data-table`.
3. **Status Badge Values**: Exact Vietnamese text matching Playwright assertions: `Nháp` (`DRAFT`), `Chờ điều xe` (`PENDING_FLEET`), `Đã phân xe` (`ASSIGNED`), `Đang vận chuyển` (`IN_TRANSIT`), `Đã giao hàng` (`DELIVERED`), `Không có xe` (`NO_VEHICLE`), `Đã hủy` (`CANCELLED`).
4. **Toast Standards**: 100% Vietnamese notifications with the **API-message-first** extraction pattern for all API errors.
5. **RBAC Guard Enforcement**: Strict access for `SUPER_ADMIN` and `DISPATCHER`; automatic redirect to `/dashboard/overview` for `FLEET_MANAGER` and `WAREHOUSE_MANAGER`.

---

## 2. E2E Test Specs & Locators Catalog

### 2.1. `frontend/e2e/06-order-dispatch-workflow.spec.ts` (Dispatcher Phase)

| Step | Action in Spec | Exact Locator / Selector | Expected Value / Event | Spec Line |
|---|---|---|---|:---:|
| 1 | Navigate to Orders | `page.goto('/dashboard/orders')` | Network idle | L22-23 |
| 2 | Check Page Heading | `page.getByRole('heading', { name: 'Lập Lệnh Điều Vận' })` | `toBeVisible()` | L25 |
| 3 | Trigger Create Modal | `page.click('button:has-text("Tạo lệnh điều vận mới")')` | Opens dialog | L28 |
| 4 | Fill Order Code | `#order-code-input` | `E2E${timestamp}` | L31 |
| 5 | Fill Total Weight | `#total-weight-input` | `'18000'` | L32 |
| 6 | Fill Total Volume | `#total-volume-input` | `'45'` | L33 |
| 7 | Fill Goods Description | `#goods-desc-input` | `'Linh kiện điện tử E2E Test'` | L34 |
| 8 | Submit Create Form | `button[type="submit"]:has-text("Lưu & Tạo lệnh")` | Click | L41 |
| 9 | Intercept API Call | `waitForResponse((res) => res.url().includes('/orders') && res.request().method() === 'POST' && res.status() === 201)` | Status 201 Created | L37-40 |
| 10 | Verify Order in Table | `page.locator('text=' + testOrderCode).first()` | `toBeVisible({ timeout: 10000 })` | L45-46 |
| 11 | Locate Order Row | `page.locator('tr', { hasText: testOrderCode })` | Matches row container | L49 |
| 12 | Submit to Fleet Button | `row.locator('button:has-text("Gửi Fleet")')` | Click | L50-51 |
| 13 | Verify Status Update | `row.locator('text=Chờ điều xe')` | `toBeVisible({ timeout: 10000 })` | L54 |

---

### 2.2. `frontend/e2e/07-capture-user-guide-screenshots.spec.ts` (Dispatcher & Detail Views)

| Step | Action in Spec | Exact Locator / Selector | Expected Value / Event | Spec Line |
|---|---|---|---|:---:|
| 1 | Navigate to Orders | `page.goto('/dashboard/orders')` | Screenshot: `02_dispatcher_orders_list.png` | L37-42 |
| 2 | Open Create Modal | `button:has-text("Tạo lệnh điều vận mới")` | Click | L45 |
| 3 | Wait for Modal Input | `#order-code-input` | `waitForSelector({ state: 'visible' })` | L46 |
| 4 | Fill Order Code | `#order-code-input` | `DOCS${timestamp}` | L49 |
| 5 | Select Origin Hub | `#origin-hub-select` | Option: `'Andromeda Hub (Hà Nội)'` | L50 |
| 6 | Select Destination Hub | `#destination-hub-select` | Option: `'Centaurus Hub (TP.HCM)'` | L51 |
| 7 | Fill Total Weight | `#total-weight-input` | `'22000'` | L52 |
| 8 | Fill Total Volume | `#total-volume-input` | `'58.5'` | L53 |
| 9 | Fill Goods Description | `#goods-desc-input` | Multi-line text string | L54-57 |
| 10 | Fill Dispatch Notes | `#notes-input` | Multi-line instructions string | L58-61 |
| 11 | Check External Vehicle | `#isExternalNeeded` | Checkbox checked | L62 |
| 12 | Wait for External Note | `#external-note-input` | `waitForSelector({ state: 'visible' })` | L63 |
| 13 | Fill External Note | `#external-note-input` | Partner fleet rental reason | L64-67 |
| 14 | Submit Modal Form | `button[type="submit"]:has-text("Lưu & Tạo lệnh")` | Click & Wait for POST 201 | L75-80 |
| 15 | Wait Modal Closed | `#order-code-input` | `waitForSelector({ state: 'hidden' })` | L81 |
| 16 | Locate Order Row | `page.locator('tr', { hasText: testOrderCode }).first()` | `toBeVisible({ timeout: 10000 })` | L85-86 |
| 17 | Submit to Fleet | `row.locator('button:has-text("Gửi Fleet")')` | Click | L91-92 |
| 18 | Verify Status Badge | `row.locator('text=Chờ điều xe')` | `toBeVisible({ timeout: 10000 })` | L93 |
| 19 | Navigate to Detail | `row.locator('a[href*="/dashboard/orders/"]').first()` | Click -> `/dashboard/orders/[id]` | L101 |

---

### 2.3. `frontend/e2e/03-rbac-routing.spec.ts` (Orders Route Access)

| Role | Target Route | Expected Outcome | Assertion / Behavior |
|---|---|---|---|
| `SUPER_ADMIN` | `/dashboard/orders` | ✅ **ALLOW** | `expect(page).toHaveURL(/\/dashboard\/orders/)` |
| `DISPATCHER` | `/dashboard/orders` | ✅ **ALLOW** | `expect(page).toHaveURL(/\/dashboard\/orders/)` |
| `FLEET_MANAGER` | `/dashboard/orders` | 🚫 **BLOCK** | Redirected to `/\/dashboard\/overview/` |
| `WAREHOUSE_MANAGER` | `/dashboard/orders` | 🚫 **BLOCK** | Redirected to `/\/dashboard\/overview/` |

---

## 3. DOM & Element Specification Matrix

### 3.1. Form Inputs & Interactive Controls

| Element ID / Selector | Tag / Role | Type / Prop | Required | Default / Placeholder | Notes / E2E Impact |
|---|---|---|:---:|---|---|
| `button:has-text("Tạo lệnh điều vận mới")` | `<Button>` | `button` | - | `"Tạo lệnh điều vận mới"` | Header action trigger in `PageContainer` |
| `#order-code-input` | `<Input>` | `text` | Yes | `VD: ORD-0826-001` | Uppercase formatted order code |
| `#origin-hub-select` | `<select>` | `select` | Yes | `Andromeda Hub (Hà Nội)` | Must include full hub name with city |
| `#destination-hub-select` | `<select>` | `select` | Yes | `Centaurus Hub (TP.HCM)` | Must include full hub name with city |
| `#total-quantity-input` | `<Input>` | `number` | No | `VD: 3000 (kiện/cái)` | Optional item count |
| `#total-weight-input` | `<Input>` | `number` | Yes | `VD: 18000` | Mandatory gross weight in kg |
| `#total-volume-input` | `<Input>` | `number` | Yes | `VD: 45.5` | Mandatory volume in m³ |
| `#goods-desc-input` | `<Textarea>` | `textarea` | No | Description placeholder | Multiline goods specification |
| `#notes-input` | `<Textarea>` | `textarea` | No | Dispatch notes placeholder | Multiline dispatch instructions |
| `#isExternalNeeded` | `<input>` | `checkbox` | No | `false` | Toggles `#external-note-input` visibility |
| `#external-note-input` | `<Textarea>` | `textarea` | Cond | Reason for external fleet rental | Rendered only when `#isExternalNeeded` is checked |
| `button[type="submit"]:has-text("Lưu & Tạo lệnh")` | `<Button>` | `submit` | - | `"Lưu & Tạo lệnh"` | Create modal submission button |

---

### 3.2. Order Status Badge Values & Styling

| OrderStatus (Enum) | Display Text in UI | Variant / Badge Style | Assertion in E2E Specs |
|---|---|---|---|
| `DRAFT` | **Nháp** | `bg-slate-100 text-slate-700` | Default after creation |
| `PENDING_FLEET` | **Chờ điều xe** | `bg-blue-100 text-blue-700 border-blue-200` | **Crucial E2E assertion** (`text=Chờ điều xe`) |
| `ASSIGNED` | **Đã phân xe** | `bg-emerald-100 text-emerald-700 border-emerald-200` | After vehicle assigned |
| `IN_TRANSIT` | **Đang vận chuyển** | `bg-amber-100 text-amber-700 border-amber-200` | Trip in progress |
| `DELIVERED` | **Đã giao hàng** | `bg-green-100 text-green-800 border-green-200` | Successfully delivered |
| `NO_VEHICLE` | **Không có xe** | `bg-rose-100 text-rose-700 border-rose-200` | Rejection from fleet |
| `CANCELLED` | **Đã hủy** | `variant="outline" text-slate-400` | Soft-cancelled order |

---

### 3.3. Table Row Action Buttons & Triggers

| Action | Button Text / Icon | Tooltip / Title | Visibility Condition | Permitted Roles |
|---|---|---|---|---|
| **Xem chi tiết** | `<IconEye>` inside `<Link href="/dashboard/orders/[id]">` | "Xem chi tiết đơn hàng" | Always | `SUPER_ADMIN`, `DISPATCHER` |
| **Gửi Fleet** | `<IconSend>` + `"Gửi Fleet"` | "Gửi lệnh điều vận lên Đội xe" | `status === 'DRAFT' \|\| status === 'NO_VEHICLE'` | `SUPER_ADMIN`, `DISPATCHER` |
| **Xử lý xe ngoài** | `<IconTruck>` + `"Xe ngoài"` | "Xử lý thuê xe ngoài" | `status === 'NO_VEHICLE'` | `SUPER_ADMIN`, `DISPATCHER` |
| **Xóa đơn nháp** | `<IconTrash>` (or Soft Delete Dialog) | "Xóa đơn nháp" | `status === 'DRAFT'` | `SUPER_ADMIN`, `DISPATCHER` |

---

## 4. Date Preset Filters & KPI Metrics Integration

### 4.1. Date Range Presets Definition
The KPI metrics cards (and table filtering) require real-time date filtering using local time strings (`YYYY-MM-DD` without UTC timezone shifting):

```typescript
export type DatePreset = 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'custom';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

| Preset Key | Button Label | Start Date (`from`) | End Date (`to`) |
|---|---|---|---|
| `today` | **Hôm nay** | Current date (`YYYY-MM-DD`) | Current date (`YYYY-MM-DD`) |
| `7days` | **7 ngày qua** | Current date - 6 days | Current date |
| `thisMonth` | **Tháng này** (Default) | 1st of current month | Current date |
| `lastMonth` | **Tháng trước** | 1st of previous month | Last day of previous month |
| `custom` | **Tùy chọn** | Manual date picker (`<input type="date">`) | Manual date picker (`<input type="date">`) |

### 4.2. KPI Summary Cards Matrix (from `/api/v1/orders/stats`)

| Card Title | Metric Field | Display Icon | Color Accent |
|---|---|---|---|
| **Tổng số đơn hàng** | `stats.total` | `<IconFileText>` | Slate / Neutral |
| **Chờ điều phối xe** | `stats.pending` | `<IconClock>` | Blue (`text-blue-600`) |
| **Đã phân công xe** | `stats.assigned + stats.inTransit` | `<IconCircleCheck>` | Emerald (`text-emerald-600`) |
| **Hết / Chưa có xe** | `stats.noVehicle` | `<IconAlertTriangle>` | Rose (`text-rose-600`) |

---

## 5. Vietnamese Toast Notifications & Error Handling Matrix

All toasts in `frontend/src/features/orders/` and `frontend/src/app/dashboard/orders/` MUST follow **100% Vietnamese language** and the **API-message-first** error extraction pattern:

```typescript
// ✅ Mandatory Standard Pattern
try {
  await mutateAsync(payload);
  toast.success('Thông báo thành công!');
} catch (err: unknown) {
  const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  toast.error(apiMessage || 'Thông báo lỗi tiếng Việt dự phòng.');
}
```

### Toast Catalog:

| Trigger Scenario | Toast Type | Message Content | Fallback Message |
|---|:---:|---|---|
| Create Order Success | `toast.success` | `'Tạo lệnh điều vận thành công!'` | - |
| Submit to Fleet Success | `toast.success` | `'Đã gửi lệnh điều vận lên Đội xe (Fleet)!'` | - |
| Delete Draft Order Success | `toast.success` | `'Đã xóa đơn hàng thành công'` | - |
| Auto-generate Code Success | `toast.success` | ``Đã sinh mã: ${generated}`` | - |
| Load Orders API Error | `toast.error` | `apiMessage` | `'Không thể tải danh sách đơn hàng. Vui lòng thử lại.'` |
| Create Order API Error | `toast.error` | `apiMessage` | `'Lỗi tạo lệnh điều vận. Vui lòng thử lại.'` |
| Submit to Fleet API Error | `toast.error` | `apiMessage` | `'Không thể gửi lệnh điều vận. Vui lòng thử lại.'` |
| Delete Order API Error | `toast.error` | `apiMessage` | `'Không thể xóa đơn hàng. Vui lòng thử lại.'` |
| Code Generation API Error | `toast.error` | `apiMessage` | `'Không thể sinh mã đơn hàng. Vui lòng thử lại.'` |
| Validation: Empty Code | `toast.error` | `'Vui lòng nhập mã đơn hàng'` | Client validation |
| Validation: Duplicate Hubs | `toast.error` | `'Hub xuất phát và Hub đích không được trùng nhau'` | Client validation |
| Validation: Invalid Weight | `toast.error` | `'Khối lượng phải lớn hơn 0 kg'` | Client validation |
| Validation: Invalid Volume | `toast.error` | `'Thể tích phải lớn hơn 0 m³'` | Client validation |
| Validation: External Note | `toast.error` | `'Vui lòng nhập ghi chú / lý do điều xe ngoài'` | Client validation |

---

## 6. RBAC Permission & Visibility Matrix

### 6.1. 3-Layer Consistency Rule

| Layer | Implementation Location | Allowed Roles | Blocked Roles |
|---|---|---|---|
| **Layer 1: Sidebar UI** | `frontend/src/config/nav-config.ts` | `SUPER_ADMIN`, `DISPATCHER` | `FLEET_MANAGER`, `WAREHOUSE_MANAGER` (hidden) |
| **Layer 2: Route Guard** | `frontend/src/proxy.ts` (`roleRouteMap`) | `SUPER_ADMIN`, `DISPATCHER` | `FLEET_MANAGER`, `WAREHOUSE_MANAGER` (redirects to `/dashboard/overview`) |
| **Layer 3: API Guard** | `backend/src/orders/orders.controller.ts` | `SUPER_ADMIN`, `DISPATCHER` (POST, PATCH, DELETE, generate-code) | `FLEET_MANAGER` (GET, PATCH `/no-vehicle` only), `WAREHOUSE_MANAGER` (GET only) |

---

## 7. Potential Regression Vectors with `@tanstack/react-table` v8

| # | Regression Vector | Risk / Impact | Mitigation Strategy |
|:---:|---|---|---|
| **V1** | **DOM Hierarchy Mutation** | E2E tests locate rows via `page.locator('tr', { hasText: testOrderCode })` and button `row.locator('button:has-text("Gửi Fleet")')`. If table is converted to divs/grids, tests fail immediately. | Use `@/components/ui/table/data-table` which outputs semantic `<table>`, `<thead>`, `<tbody>`, `<TableRow>` (`<tr>`), and `<TableCell>` (`<td>`). |
| **V2** | **Button Text / Icon Mismatch** | Tests look for exact text `button:has-text("Tạo lệnh điều vận mới")` and `button:has-text("Gửi Fleet")`. | Preserve exact button text with leading icons (`<IconPlus>` / `<IconSend>`). Do NOT replace with icon-only or changed wording. |
| **V3** | **Dialog Dismissal Race Condition** | `07-capture-user-guide-screenshots.spec.ts` executes `await page.waitForSelector('#order-code-input', { state: 'hidden' })`. If modal does not close immediately upon mutation success, the test times out. | In `useMutation` `onSuccess`, explicitly set `setOpen(false)` and reset form state before refetching/invalidating queries. |
| **V4** | **Hub Option Format Incompatibility** | Tests execute `page.selectOption('#origin-hub-select', 'Andromeda Hub (Hà Nội)')`. If option values use raw IDs or omit city name, `selectOption` throws an option not found error. | Options must match string label: `${hub.name}` or `${hub.name} (${hub.city})` matching `Andromeda Hub (Hà Nội)`, `Centaurus Hub (TP.HCM)`, etc. |
| **V5** | **nuqs Search Params URL Desync** | When searching or changing status/hub filters, page must reset to 1. If page stays on page 2+, empty state will be displayed. | Manage filters through `useQueryStates` with `page: parseAsInteger.withDefault(1)` and automatic page reset on filter update. |
| **V6** | **Row Action Loading State** | Double-clicking "Gửi Fleet" could send parallel submit requests. During submission, button text changes to `"Đang gửi..."` with `<IconLoader2>`. | Maintain pending state via TanStack Mutation `isPending` / row-specific state to disable button gracefully without flashing. |
| **V7** | **Pointer Cursor Compliance** | Interactive elements missing `cursor-pointer` violate workspace UI/UX guidelines. | Apply `cursor-pointer` on all filter buttons, table headers, action buttons, and `cursor-not-allowed` on disabled states. |

---

## 8. Verification & QA Runbook

### Step 1: Type Checking
```powershell
cd d:\Projects\logistics-website\frontend
npm run typecheck
```
*Criteria*: 0 TypeScript errors.

### Step 2: Production Build
```powershell
cd d:\Projects\logistics-website\frontend
npm run build
```
*Criteria*: Build finishes successfully with all pages statically / dynamically optimized.

### Step 3: Run E2E Playwright Test Suite
```powershell
cd d:\Projects\logistics-website\frontend
npx playwright test e2e/06-order-dispatch-workflow.spec.ts
npx playwright test e2e/03-rbac-routing.spec.ts
npx playwright test e2e/07-capture-user-guide-screenshots.spec.ts
```
*Criteria*: All tests pass (100% green).

---

## 9. Handoff & Implementation Recommendations

1. **Folder Architecture**:
   - `frontend/src/app/dashboard/orders/page.tsx`: Server Component with `searchParamsCache.parse(searchParams)`.
   - `frontend/src/features/orders/components/orders-listing.tsx`: Server Component prefetching `ordersQueryOptions` and `orderStatsQueryOptions`.
   - `frontend/src/features/orders/components/orders-tables/`:
     - `index.tsx`: Client Table component with `useDataTable`, KPI Cards, Date Filter Bar.
     - `columns.tsx`: `ColumnDef<Order>[]` with sorting, formatting, and row actions.
     - `cell-action.tsx`: Row actions with View Detail, Submit to Fleet, Delete Draft.
     - `options.tsx`: Status and Hub faceted filter options.
     - `use-orders-table-filters.tsx`: `nuqs` search params parser.
   - `frontend/src/features/orders/components/order-create-dialog.tsx`: Modal dialog with trigger button and full input set.
   - `frontend/src/features/orders/api/`: `queries.ts`, `mutations.ts`, `types.ts`, `service.ts`.
2. **Component Reuse**: Strictly use `@/components/ui/table/data-table`, `@/components/ui/table/data-table-pagination`, `@/components/ui/table/data-table-toolbar`, `@/components/ui/table/data-table-column-header`.
3. **Preserve Legacy Order Detail Route**: Keep `/dashboard/orders/[id]` accessible and linked from table rows (`<Link href={`/dashboard/orders/${order.id}`}>`).
