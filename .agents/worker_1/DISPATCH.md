## 2026-08-18T03:27:22Z
You are Worker 1 assigned to implement the frontend toast standardization across the business domain files in `frontend/src/`.
Your working directory is `d:\Projects\logistics-website\.agents\worker_1`.

Exclusively Owned Files to Modify:
1. `d:\Projects\logistics-website\frontend\src\features\auth\components\user-auth-form.tsx`
2. `d:\Projects\logistics-website\frontend\src\features\users\components\user-form-sheet.tsx`
3. `d:\Projects\logistics-website\frontend\src\features\users\components\users-table\cell-action.tsx`
4. `d:\Projects\logistics-website\frontend\src\app\dashboard\warehouse\page.tsx`
5. `d:\Projects\logistics-website\frontend\src\app\dashboard\orders\[id]\page.tsx`
6. `d:\Projects\logistics-website\frontend\src\app\dashboard\orders\page.tsx`
7. `d:\Projects\logistics-website\frontend\src\app\dashboard\trips\page.tsx`

Strict Rules:
1. Rule 1: 100% Vietnamese in business domain toast messages.
2. Rule 2: API message first pattern for error toasts:
   ```typescript
   const apiMessage = err.response?.data?.message;
   toast.error(apiMessage || 'Thông báo lỗi tiếng Việt dự phòng.');
   ```
   Do NOT use `toast.error('Static Title', { description: ... })`.
3. DO NOT modify demo/example files (`advanced-form-patterns.tsx`, `sheet-form-demo.tsx`, `file-uploader.tsx`, `product-form.tsx`, `cell-action.tsx` in products).
4. Run `npx tsc --noEmit` in `d:\Projects\logistics-website\frontend` using run_command to verify that all TypeScript types compile cleanly with 0 errors.
5. Document all changes, files touched, before/after diffs, and verification commands/results in `d:\Projects\logistics-website\.agents\worker_1\handoff.md`.
6. Update your `progress.md` as you work.
7. Send a message back to the orchestrator when complete.
