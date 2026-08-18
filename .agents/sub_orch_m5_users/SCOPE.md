# Scope: Milestone 5 — Users Management Live API & TMS Role Mapping

## Architecture
- Target Page: `frontend/src/app/dashboard/users/page.tsx`
- Feature Folder: `frontend/src/features/users/`
- Pattern:
  - Connect `src/features/users/api/service.ts` to live NestJS backend `/api/v1/users` (supported by backend `backend/src/users/users.controller.ts`)
  - Update user roles in schema and form sheet to match TMS roles: `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`
  - Ensure canonical DataTable, `UserFormSheet`, `CellAction`, and `AlertModal` operate seamlessly with live API data and mutations

## Acceptance Criteria
- [x] Connected to live `/api/v1/users` backend endpoints (no mock data)
- [x] User role selection and badges updated to match system TMS roles (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`) and statuses (`active`, `inactive`)
- [x] `npm run build` succeeds with 0 TypeScript/compile errors in `frontend/`
- [x] 100% Vietnamese toast notifications with API message first error extraction
- [x] 3-layer RBAC route guard enforced (`SUPER_ADMIN` only)
- [x] Existing auth, login, and RBAC specs pass (56/56 Playwright tests passed)

## Status: DONE
