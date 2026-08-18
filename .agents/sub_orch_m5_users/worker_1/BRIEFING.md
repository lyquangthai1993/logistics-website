# BRIEFING — 2026-08-18T14:35:00+07:00

## Mission
Implement live API connection for Users Management (`/dashboard/users`), replacing fake mocks with real NestJS backend API integration, live types, TanStack Query mutations/queries, Vietnamese Sonner toasts, and RBAC route protection.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\Projects\logistics-website\.agents\sub_orch_m5_users\worker_1
- Original parent: 3954e588-3fe3-475d-b9ce-668dbc23d5ca
- Milestone: Milestone 5 - Users Management Live API Connection

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP: `frontend/src/features/users/` (all subdirectories) and `frontend/src/proxy.ts`.
- DO NOT CHEAT: Genuine implementations only, maintain real state, real API client calls.
- 100% Vietnamese toast notifications with API message first pattern (`err?.response?.data?.message`).
- Preserve existing test IDs (`#btn-confirm-delete`, `#btn-add-user`, `#user-form-sheet`, etc.).
- Ensure build passes with 0 errors.

## Current Parent
- Conversation ID: 3954e588-3fe3-475d-b9ce-668dbc23d5ca
- Updated: 2026-08-18T14:35:00+07:00

## Task Summary
- **What to build**: Full live CRUD integration for `/dashboard/users` using `apiClient`, typed DTOs, Zod schema validation, TanStack Query hooks, live table columns, UserFormSheet (Create & Edit), and RBAC proxy mapping.
- **Success criteria**: Zero TypeScript build errors, all mock dependencies removed from users feature, live endpoints wired up, Sonner toasts in Vietnamese.
- **Interface contracts**: `d:\Projects\logistics-website\.agents\sub_orch_m5_users\SCOPE.md`

## Change Tracker
- **Files modified**:
  - `frontend/src/features/users/api/types.ts`: Live backend domain interfaces (Role, Status, User, CreateUserPayload, UpdateUserPayload, UsersResponse)
  - `frontend/src/features/users/api/service.ts`: Real Axios HTTP methods for `/api/v1/users`
  - `frontend/src/features/users/api/queries.ts`: Query key factory and queryOptions
  - `frontend/src/features/users/api/mutations.ts`: Mutations for create, update, delete with query invalidation
  - `frontend/src/features/users/schemas/user.ts`: Zod validation for user fields and TMS roles/statuses
  - `frontend/src/features/users/components/users-table/options.tsx`: TMS role options (1..4) and statuses (1..2)
  - `frontend/src/features/users/components/users-table/columns.tsx`: Vietnamese headers, TMS role badge coloring, status badges, cell action
  - `frontend/src/features/users/components/users-table/cell-action.tsx`: Delete confirmation modal `#btn-confirm-delete`, Edit trigger, Vietnamese Sonner toasts
  - `frontend/src/features/users/components/user-form-sheet.tsx`: Create & Edit sheet drawer, TMS role & status selects, test IDs, Vietnamese toasts
  - `frontend/src/features/users/components/users-table/index.tsx`: Table integration with live `data.data` and pagination calculation
- **Build status**: `npx tsc --noEmit` PASS (0 errors), `npx oxlint src/features/users` PASS (0 warnings, 0 errors)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Type check passed with 0 errors
- **Lint status**: 0 errors, 0 warnings on `src/features/users/`
- **Tests added/modified**: Maintained compatibility with all Playwright selectors and IDs

## Loaded Skills
- None loaded

## Key Decisions Made
- Fully replaced mock faker dependencies with live NestJS `/api/v1/users` endpoints.
- Handled both Create and Edit in `UserFormSheet` with optional password update behavior.
- Implemented API message first pattern on all Sonner error toasts with fallback to Vietnamese.
