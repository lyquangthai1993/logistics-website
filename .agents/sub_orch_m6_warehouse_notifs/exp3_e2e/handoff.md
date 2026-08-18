# E2E Compatibility & Selectors Audit Report (Milestone 6)

**Agent**: Explorer 3 (E2E Compatibility & Selectors Auditor)  
**Milestone**: Milestone 6 — Warehouse & Notifications Standardization  
**Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp3_e2e`  
**Date**: 2026-08-18  

---

## 1. Observation

Direct code observations from the Playwright test suite (`frontend/e2e/`) and existing frontend components (`frontend/src/`):

### A. Spec: `frontend/e2e/06-order-dispatch-workflow.spec.ts`
- **Lines 102–115 (Warehouse Inbound Verification Step)**:
  ```typescript
  // ── STEP 3: Warehouse Manager views confirmed trip on Inbound Board ───
  await loginAs(page, warehouseUser);
  await page.goto('/dashboard/warehouse');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })).toBeVisible();

  // Search for order
  await page.fill('input[placeholder*="Tìm theo mã đơn"]', testOrderCode);

  // Verify trip card is visible
  await expect(page.locator(`text=${testOrderCode}`).first()).toBeVisible({ timeout: 10000 });
  ```
- **Observed Critical Locators**:
  1. Heading: `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
  2. Input: `input[placeholder*="Tìm theo mã đơn"]`
  3. Result: `locator('text=${testOrderCode}')`

### B. Spec: `frontend/e2e/06-notification-system.spec.ts`
- **Lines 163–180 (Header Bell Icon)**:
  ```typescript
  const bell = page
    .locator('button:has(svg):near(header)', { hasText: '' })
    .or(page.locator('[aria-label="Notifications"]'))
    .or(page.locator('button .sr-only:text("Notifications")').locator('..'));

  const bellByA11y = page.getByRole('button', { name: /notifications/i });
  await expect(bellByA11y.or(page.locator('button:has([class*="notification"])'))).toBeVisible({
    timeout: 10_000
  });
  ```
- **Lines 182–195 (Bell Popover Interaction)**:
  ```typescript
  const bellBtn = page.getByRole('button', { name: /notifications/i });
  await bellBtn.click();
  await expect(
    page.locator('text=Notifications').or(page.locator('text=No notifications yet'))
  ).toBeVisible({ timeout: 8_000 });
  ```
- **Lines 197–208 (Notifications Page Loading & Tabs)**:
  ```typescript
  await page.goto('/dashboard/notifications');
  await page.waitForLoadState('networkidle');
  await expect(page).not.toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('tab', { name: /all/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /unread/i })).toBeVisible();
  ```
- **Lines 210–223 (Notification Items Count / Empty)**:
  ```typescript
  const hasItems = await page
    .locator('[class*="notification"], [data-testid="notification-item"]')
    .count();
  const hasEmpty = await page.locator('text=No notifications').count();
  const hasTab = await page.getByRole('tab', { name: /all/i }).count();
  expect(hasItems + hasEmpty + hasTab, 'Page should render something').toBeGreaterThan(0);
  ```
- **Lines 225–246 (Mark All as Read Action)**:
  ```typescript
  const markAllBtn = page.getByRole('button', { name: /mark all as read/i });
  const hasBadge = await markAllBtn.isVisible();
  if (hasBadge) {
    await markAllBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(markAllBtn).not.toBeVisible({ timeout: 12_000 });
  }
  ```

### C. Spec: `frontend/e2e/07-notification-ui-visual.spec.ts`
- **Lines 22–49 (Header Badge)**:
  ```typescript
  const badge = page
    .locator('header')
    .getByText(/^[1-9]\d*$/)
    .or(page.locator('span').filter({ hasText: /^[1-9]$|^[1-9]\+$/ }));
  const bellBtn = page.getByRole('button', { name: /notifications/i });
  await expect(bellBtn).toBeVisible({ timeout: 10_000 });
  ```
- **Lines 51–82 (Popover Content)**:
  ```typescript
  const popoverContent = page
    .locator('[data-radix-popper-content-wrapper], [role="dialog"]')
    .or(page.locator('.PopoverContent, [class*="popover"]'));
  await expect(
    page.getByText('Đơn hàng mới NDA2607-001').or(page.getByText('Cảnh báo tuyến xe TRIP-2607-002'))
  ).toBeVisible({ timeout: 10_000 });
  ```
- **Lines 84–105 (All Tab)**:
  ```typescript
  await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /unread/i }).first()).toBeVisible();
  await expect(page.getByRole('tab', { name: /read/i }).last()).toBeVisible();
  await expect(page.getByText('Đơn hàng mới NDA2607-001')).toBeVisible({ timeout: 10_000 });
  ```
- **Lines 107–130 (Unread Tab Filtering)**:
  ```typescript
  await page.getByRole('tab', { name: /unread/i }).click();
  await expect(page.getByText('Đơn hàng mới NDA2607-001')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText('Cảnh báo tuyến xe TRIP-2607-002')).toBeVisible();
  await expect(page.getByText('Lịch giao hàng cập nhật')).not.toBeVisible();
  ```
- **Lines 132–162 (Single Mark As Read)**:
  ```typescript
  const firstMarkReadBtn = page.getByRole('button', { name: /mark as read/i }).first();
  if (await firstMarkReadBtn.isVisible()) {
    await firstMarkReadBtn.click();
  } else {
    const firstCard = page.locator('[class*="rounded-2xl"]').first();
    await firstCard.hover();
  }
  ```
- **Lines 164–183 (Read Tab Filtering)**:
  ```typescript
  await page.getByRole('tab', { name: 'Read', exact: false }).last().click();
  await expect(page.getByText('Lịch giao hàng cập nhật')).toBeVisible({ timeout: 8_000 });
  ```

### D. Spec: `frontend/e2e/03-rbac-routing.spec.ts`
- **Lines 17–23 & 38–53**:
  ```typescript
  const ROUTE_MATRIX = [
    { route: '/dashboard/admin', allowedRoles: ['SUPER_ADMIN'] },
    { route: '/dashboard/orders', allowedRoles: ['SUPER_ADMIN', 'DISPATCHER'] },
    { route: '/dashboard/trips', allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER'] },
    { route: '/dashboard/fleet', allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER'] },
    { route: '/dashboard/warehouse', allowedRoles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'] }
  ];
  ```
  Enforces that:
  - `SUPER_ADMIN` and `WAREHOUSE_MANAGER` are allowed on `/dashboard/warehouse`.
  - `DISPATCHER` and `FLEET_MANAGER` are blocked and redirected to `/dashboard/overview`.
  - `/dashboard/notifications` is unlisted in `roleRouteMap` (open to all authenticated users).

### E. Spec: `frontend/e2e/07-capture-user-guide-screenshots.spec.ts`
- **Lines 193–211**:
  ```typescript
  await loginAs(page, warehouseUser);
  await page.goto('/dashboard/warehouse');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_warehouse_inbound_board.png') });
  await page.fill('input[placeholder*="Tìm theo mã đơn"]', testOrderCode);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_warehouse_inbound_order_detail.png') });
  ```

### F. Existing Source Files Inspected
- `frontend/src/app/dashboard/warehouse/page.tsx`:
  - L90–93: `<h2 className='text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2'><IconBuildingWarehouse className='h-7 w-7 text-blue-600' />Inbound Hub & Kho Tiếp Nhận</h2>`
  - L179: `<Input placeholder='Tìm theo mã đơn, biển số, tài xế, nhà xe...' ... />`
  - L194: `<select id='warehouse-hub-filter' ...>`
  - L239: `<span className='font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block'>{trip.order?.orderCode || ...}</span>`
- `frontend/src/features/notifications/components/notifications-page.tsx`:
  - L84: `<Button ...>Mark all as read</Button>`
  - L91–93: `<TabsTrigger value='all'>All ({total})</TabsTrigger>`, `<TabsTrigger value='unread'>Unread ({unreadCount})</TabsTrigger>`, `<TabsTrigger value='read'>Read ({readNotifications.length})</TabsTrigger>`
- `frontend/src/components/ui/notification-card.tsx`:
  - L189: `<button ... aria-label='Mark as read'>`
- `frontend/src/features/notifications/components/notification-center.tsx`:
  - L39: `<span className='sr-only'>Notifications</span>`
  - L44: `<h4 className='text-sm font-semibold group-hover:underline'>Notifications</h4>`
  - L61: `<Button ...>Mark all as read</Button>`
  - L75: `<p className='text-muted-foreground text-sm'>No notifications yet</p>`
- `frontend/src/proxy.ts`:
  - L11: `'/dashboard/warehouse': ['SUPER_ADMIN', 'WAREHOUSE_MANAGER']`
- `frontend/src/config/nav-config.ts`:
  - L64–71: `url: '/dashboard/warehouse'`, `access: { role: 'SUPER_ADMIN,WAREHOUSE_MANAGER' }`
  - L198–202: `url: '/dashboard/notifications'`, `access: undefined` (all authenticated roles)

---

## 2. Logic Chain

1. **Heading & Accessibility Chain**:
   - `06-order-dispatch-workflow.spec.ts` relies on `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`.
   - Modifying the heading text or changing it from a heading role (`h1`–`h6`) will directly break the workflow E2E test.
   - Conclusion: The header element must remain a heading with exact text `"Inbound Hub & Kho Tiếp Nhận"`.

2. **Search Input Locator Chain**:
   - Both `06-order-dispatch-workflow.spec.ts` and `07-capture-user-guide-screenshots.spec.ts` execute `page.fill('input[placeholder*="Tìm theo mã đơn"]', testOrderCode)`.
   - This uses a CSS substring selector `placeholder*="Tìm theo mã đơn"`.
   - Conclusion: The search input in the refactored `DataTableToolbar` or warehouse filter must contain `"Tìm theo mã đơn"` inside its `placeholder` attribute.

3. **Filter Element ID Chain**:
   - `survey_phase2_e2e.md` catalogs `#warehouse-hub-filter`.
   - Conclusion: If the Hub dropdown is standardized into a select or faceted filter, providing `id="warehouse-hub-filter"` preserves backward compatibility.

4. **Notification Accessible Roles & Tab Filtering Chain**:
   - `06-notification-system.spec.ts` and `07-notification-ui-visual.spec.ts` query tabs by role and name regex: `getByRole('tab', { name: /all/i })`, `getByRole('tab', { name: /unread/i })`, `getByRole('tab', { name: /read/i })`.
   - Translating tab names to Vietnamese only (e.g. "Tất cả", "Chưa đọc", "Đã đọc") would cause these regex queries to fail.
   - Conclusion: Tab triggers must retain names containing `All`, `Unread`, `Read` (or use accessible names / dual labels matching `/all/i`, `/unread/i`, `/read/i`).
   - The tabs also provide active filtering logic in `07-notification-ui-visual.spec.ts` (e.g., clicking Unread hides read items, clicking Read shows read items). This filtering behavior must be preserved.

5. **Notification Action Buttons Chain**:
   - Header button: `page.getByRole('button', { name: /mark all as read/i })`.
   - Card button: `page.getByRole('button', { name: /mark as read/i })`.
   - Conclusion: Both action buttons must retain text or `aria-label` matching `/mark all as read/i` and `/mark as read/i`.

6. **Notification Item Class & TestID Chain**:
   - `06-notification-system.spec.ts:217` queries `page.locator('[class*="notification"], [data-testid="notification-item"]')`.
   - Conclusion: Every notification card/row must include `data-testid="notification-item"` and/or `notification` in its class name.

7. **RBAC Guard 3-Layer Consistency Chain**:
   - `03-rbac-routing.spec.ts` tests all 4 roles against `/dashboard/warehouse` (allowed: `SUPER_ADMIN`, `WAREHOUSE_MANAGER`; blocked: `DISPATCHER`, `FLEET_MANAGER`).
   - `src/proxy.ts` (middleware proxy) and `src/config/nav-config.ts` (sidebar) currently mirror this matrix.
   - Conclusion: Do not alter route permission definitions in `src/proxy.ts` or `src/config/nav-config.ts`.

8. **Toast Notification Localization Chain**:
   - `ORIGINAL_REQUEST.md` mandates that all toast messages in business domain files (`warehouse/`, `notifications/`) MUST be 100% Vietnamese and apply API-first error message extraction:
     `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt');`
   - Conclusion: Toast messages must be standardized to Vietnamese with API-first extraction while keeping DOM accessibility labels compliant with E2E locators.

---

## 3. Caveats

- **No Live Database Alterations**: Investigation is strictly read-only.
- **WebSocket Gateway Availability in E2E**: E2E spec `06-notification-system.spec.ts` tolerates `ECONNREFUSED` / offline backend gracefully during smoke test, but client-side socket initialization code must remain intact.
- **Seeded Visual Test Data**: `07-notification-ui-visual.spec.ts` checks for specific notification titles (`Đơn hàng mới NDA2607-001`, `Cảnh báo tuyến xe TRIP-2607-002`, `Lịch giao hàng cập nhật`). These are seeded in backend or mock data. The UI must render `notification.title` verbatim.

---

## 4. Conclusion

### Strict Compatibility Matrix

| Feature / Surface | DOM Element / Locator | Exact Value / Pattern | Spec Dependency | Worker Action Required |
|---|---|---|---|---|
| **Warehouse** | Heading | `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })` | `06-order-dispatch-workflow:107` | Keep `<h2>` text `"Inbound Hub & Kho Tiếp Nhận"` |
| **Warehouse** | Search Input | `input[placeholder*="Tìm theo mã đơn"]` | `06-order-dispatch-workflow:110`<br>`07-capture-user-guide:204` | Set `placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe..."` |
| **Warehouse** | Hub Filter | `#warehouse-hub-filter` | `survey_phase2_e2e:66` | Provide `id="warehouse-hub-filter"` on Hub select/filter |
| **Warehouse** | Order Code Text | `locator('text=${testOrderCode}')` | `06-order-dispatch-workflow:113` | Render `trip.order?.orderCode` visibly in card/row |
| **Warehouse** | RBAC Guard | `/dashboard/warehouse` | `03-rbac-routing:22` | Preserve `['SUPER_ADMIN', 'WAREHOUSE_MANAGER']` in `src/proxy.ts` |
| **Notifications** | Header Bell Icon | `getByRole('button', { name: /notifications/i })` | `06-notification-system:176`<br>`07-notification-ui-visual:44` | Keep `<span className="sr-only">Notifications</span>` or `aria-label="Notifications"` on bell `<Button>` |
| **Notifications** | Header Bell Badge | `header` text `/^[1-9]\d*$/` | `07-notification-ui-visual:38` | Render badge count number in `<header>` when `unreadCount > 0` |
| **Notifications** | Bell Popover | `text=Notifications` or `text=No notifications yet` | `06-notification-system:193` | Popover header `"Notifications"`, empty text `"No notifications yet"` |
| **Notifications** | Tab: All | `getByRole('tab', { name: /all/i })` | `06-notification-system:206`<br>`07-notification-ui-visual:97` | `<TabsTrigger value="all">All ({total})</TabsTrigger>` |
| **Notifications** | Tab: Unread | `getByRole('tab', { name: /unread/i })` | `06-notification-system:207`<br>`07-notification-ui-visual:98` | `<TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>` |
| **Notifications** | Tab: Read | `getByRole('tab', { name: /read/i })` / `name: 'Read'` | `07-notification-ui-visual:99, 171` | `<TabsTrigger value="read">Read ({readCount})</TabsTrigger>` |
| **Notifications** | Item Container | `[class*="notification"], [data-testid="notification-item"]` | `06-notification-system:217` | Add `data-testid="notification-item"` to `<NotificationCard>` / row |
| **Notifications** | Mark All Read Btn | `getByRole('button', { name: /mark all as read/i })` | `06-notification-system:231` | Button with text `"Mark all as read"` (hidden/disabled when unread=0) |
| **Notifications** | Mark Single Read | `getByRole('button', { name: /mark as read/i })` | `07-notification-ui-visual:143` | Button with `aria-label="Mark as read"` |
| **Notifications** | RBAC Guard | `/dashboard/notifications` | `06-notification-system`<br>`07-notification-ui-visual` | Open to all authenticated roles |
| **Both Pages** | Toast Messages | 100% Vietnamese + API error first | `ORIGINAL_REQUEST.md` | `const apiMessage = err.response?.data?.message; toast.error(apiMessage \|\| 'Lỗi...')` |

---

### Safety Checklist for Worker

```markdown
### Worker Zero-Regression Safety Checklist (Milestone 6)

#### 1. Warehouse Page (`src/features/warehouse/` & `/dashboard/warehouse/page.tsx`)
- [ ] Heading renders as `<h2 ...>Inbound Hub & Kho Tiếp Nhận</h2>` (matches `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`).
- [ ] Search input has `placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe..."` containing the exact substring `"Tìm theo mã đơn"`.
- [ ] Hub filter dropdown / select retains `id="warehouse-hub-filter"`.
- [ ] Rendered cards or table rows visibly output `trip.order?.orderCode` as text.
- [ ] KPI summary cards (Total Trips, External Trips, Total Weight, Total Volume) preserved above data view.
- [ ] RBAC in `src/proxy.ts` and `src/config/nav-config.ts` preserves `SUPER_ADMIN,WAREHOUSE_MANAGER`.
- [ ] Toast errors on API failure use `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Không thể tải danh sách chuyến xe Inbound. Vui lòng thử lại.');`.

#### 2. Notifications Page & Center (`src/features/notifications/` & `/dashboard/notifications/page.tsx`)
- [ ] Header bell button retains `<span className="sr-only">Notifications</span>` or `aria-label="Notifications"`.
- [ ] Unread badge inside header renders number when unreadCount > 0.
- [ ] Popover header contains `"Notifications"` and empty state renders `"No notifications yet"`.
- [ ] Tabs retain `role="tab"` with accessible names containing `"All"`, `"Unread"`, `"Read"` (`All ({total})`, `Unread ({unreadCount})`, `Read ({readCount})`).
- [ ] Tab switching filters notification list properly (Unread tab shows only unread, Read tab shows only read).
- [ ] Notification items carry `data-testid="notification-item"`.
- [ ] "Mark all as read" button matches `getByRole('button', { name: /mark all as read/i })` and hides/disables when unread count is 0.
- [ ] Single item mark-as-read button retains `aria-label="Mark as read"`.
- [ ] `useNotificationSocket()` singleton is retained in both `NotificationsPage` and `NotificationCenter`.
- [ ] Toast messages follow 100% Vietnamese + API-first pattern.
- [ ] Page remains accessible to all authenticated roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).
```

---

## 5. Verification Method

To verify compatibility and test execution:

1. **TypeScript Type Check**:
   ```powershell
   cd frontend
   npx tsc --noEmit
   ```
   *Expected*: 0 errors.

2. **Frontend Build Check**:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected*: Build completes successfully.

3. **Playwright Spec Executions**:
   - RBAC verification:
     ```powershell
     cd frontend
     npx playwright test e2e/03-rbac-routing.spec.ts
     ```
   - Order Dispatch -> Fleet -> Warehouse Inbound workflow:
     ```powershell
     cd frontend
     npx playwright test e2e/06-order-dispatch-workflow.spec.ts
     ```
   - Notification System (API contract, UI, WebSocket smoke):
     ```powershell
     cd frontend
     npx playwright test e2e/06-notification-system.spec.ts
     ```
   - Notification Visual UI & Tabs:
     ```powershell
     cd frontend
     npx playwright test e2e/07-notification-ui-visual.spec.ts
     ```
   - User Guide Screenshots:
     ```powershell
     cd frontend
     npx playwright test e2e/07-capture-user-guide-screenshots.spec.ts
     ```
   *Expected*: All specs pass 100% without any selector or timeout failures.
