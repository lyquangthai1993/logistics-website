## 2026-08-18T10:04:57Z
You are Explorer 2 for Milestone 6: Notifications Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp2_notifs
You must read:
- ORIGINAL_REQUEST.md: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: d:\Projects\logistics-website\.agents\PROJECT.md
- SCOPE.md: d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\SCOPE.md
- Existing Notifications files:
  - d:\Projects\logistics-website\frontend\src\app\dashboard\notifications\page.tsx
  - d:\Projects\logistics-website\frontend\src\features\notifications\components\notifications-page.tsx
  - d:\Projects\logistics-website\frontend\src\features\notifications\components\notification-center.tsx
  - d:\Projects\logistics-website\frontend\src\features\notifications\hooks\use-notifications-query.ts
  - d:\Projects\logistics-website\frontend\src\features\notifications\hooks\use-notification-socket.ts
  - d:\Projects\logistics-website\frontend\src\components\ui\notification-card.tsx

Your objective:
1. Deeply analyze the notifications feature in `frontend/src/features/notifications/`.
2. Inspect how TanStack Query `useNotificationsQuery`, pagination (`page`, `limit`), mark as read / mark all as read mutations, and WebSocket invalidations work.
3. Check URL query state synchronization with `nuqs` (`tab=all|unread|read`, `page`, `perPage`).
4. Ensure 100% Vietnamese toasts with API-first error message extraction pattern (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || '...')`).
5. Ensure accessibility and seamless UI integration with Radix Tabs and `<PageContainer>`.
6. Formulate concrete implementation blueprints with exact TypeScript interfaces, file paths, and migration steps for the Worker.
7. Write your complete analysis report to `d:\Projects\logistics-website\.agents\sub_orch_m6_warehouse_notifs\exp2_notifs\handoff.md` and send_message back with your findings.
