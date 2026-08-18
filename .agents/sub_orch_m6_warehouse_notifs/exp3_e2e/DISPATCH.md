## 2026-08-18T10:04:57Z
You are Explorer 3 for Milestone 6: E2E Compatibility & Selectors Audit.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp3_e2e
You must read:
- ORIGINAL_REQUEST.md: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: d:\Projects\logistics-website\.agents\PROJECT.md
- SCOPE.md: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\SCOPE.md
- Phase 2 Survey: d:\Projects\logistics-website\.agents\survey_phase2_e2e\survey_phase2_e2e.md
- Playwright E2E spec files:
  - d:\Projects\logistics-website\frontend\e2e\06-order-dispatch-workflow.spec.ts
  - d:\Projects\logistics-website\frontend\e2e\06-notification-system.spec.ts
  - d:\Projects\logistics-website\frontend\e2e\07-notification-ui-visual.spec.ts
  - d:\Projects\logistics-website\frontend\e2e\03-rbac-routing.spec.ts
  - d:\Projects\logistics-website\frontend\e2e\07-capture-user-guide-screenshots.spec.ts

Your objective:
1. Audit all DOM selectors, locators, headings, placeholders, testids, button labels, and accessibility attributes used in E2E tests targeting `/dashboard/warehouse` and `/dashboard/notifications`.
2. Specifically verify:
   - Warehouse heading: `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
   - Warehouse search input: `input[placeholder*="Tìm theo mã đơn"]`
   - Warehouse destination hub selector: `#warehouse-hub-filter`
   - Notification tabs: `role='tab'` with names matching `/all/i`, `/unread/i`, `/read/i`
   - Notification action buttons: `button:has-text("Mark all as read")` / `getByRole('button', { name: /mark all as read/i })`
   - Notification cards: `[data-testid="notification-item"]`, `[class*="notification"]`
   - RBAC route protection for `/dashboard/warehouse` (`SUPER_ADMIN`, `WAREHOUSE_MANAGER`) and `/dashboard/notifications` (all roles).
3. Produce a strict compatibility matrix and safety checklist for the Worker to ensure zero E2E regressions.
4. Write your complete analysis report to `d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp3_e2e\handoff.md` and send_message back with your findings.
