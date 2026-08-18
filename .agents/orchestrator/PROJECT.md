# Project: Frontend Toast Notification Standardization & Audit

## Architecture
- **Frontend Stack**: Next.js 15+ App Router, React 19, Tailwind CSS v4, TanStack Query v5, Zustand, Sonner Toast.
- **Root Toaster Mount**: `frontend/src/app/layout.tsx:93` (`<Toaster />`).
- **Notification Mechanism**: Sonner (`import { toast } from 'sonner'`).
- **Global Error Handling**: `frontend/src/lib/api-client.ts` Axios instance (rejects promises, no global popup; local handlers manage user feedback).

## Feature Inventory
| # | Feature / File | Description | Target Changes | Milestone | Status |
|---|----------------|-------------|----------------|-----------|--------|
| 1 | `src/features/auth/components/user-auth-form.tsx` | Auth Sign In Form | L26: Translate English success toast to Vietnamese (`Đăng nhập thành công!`) | M1 | DONE |
| 2 | `src/features/users/components/user-form-sheet.tsx` | Admin User Create/Update Sheet Form | L42, L46, L52, L55: Translate to Vietnamese & implement API message first | M1 | DONE |
| 3 | `src/features/users/components/users-table/cell-action.tsx` | Admin User Table Row Action (Delete) | L31, L35: Translate to Vietnamese & implement API message first | M1 | DONE |
| 4 | `src/app/dashboard/warehouse/page.tsx` | Warehouse Inbound Trips Page | L43-45: Standardize API error toast to API message first | M2 | DONE |
| 5 | `src/app/dashboard/orders/[id]/page.tsx` | Order Detail & Action Page | L104-106, L122-124, L135-137: Standardize 3 error toasts to API message first | M2 | DONE |
| 6 | `src/app/dashboard/orders/page.tsx` | Order Management & Dispatch Creation Page | L193-195, L271-273, L307-309: Standardize 3 error toasts to API message first | M2 | DONE |
| 7 | `src/app/dashboard/trips/page.tsx` | Trip Dispatch & Assignment Page | L117-119, L216-218, L284-286, L301-303: Standardize 4 error toasts to API message first | M2 | DONE |
| 8 | Demo Files Isolation | `file-uploader.tsx`, `forms/**`, `products/**` | Verified as Demo/Template — PRESERVED UNTOUCHED | M3 | DONE |
| 9 | Static Type Verification | `frontend/` directory | `npx tsc --noEmit` clean compilation (0 errors) | M3 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Feature Modules Standardization | `src/features/auth/**` & `src/features/users/**` (7 toasts across 3 files) | Survey | DONE |
| 2 | App Dashboard Pages Standardization | `src/app/dashboard/orders/**`, `trips/**`, `warehouse/**` (11 toasts across 4 files) | Survey | DONE |
| 3 | Verification, TypeCheck & Integrity Audit | TypeScript compile (`npx tsc --noEmit`), multi-reviewer check, challenger stress check, forensic audit | M1, M2 | DONE |

## Interface Contracts & Rules
### Rule 1 — 100% Vietnamese in Business Domain
All toast messages in business domain files (`orders/`, `trips/`, `warehouse/`, `users/`, `auth/`, `profile/`) are in Vietnamese.

### Rule 2 — API Message First Error Toast Pattern
```typescript
const apiMessage = err?.response?.data?.message;
toast.error(apiMessage || 'Thông báo lỗi tiếng Việt dự phòng.');
```
Never use `toast.error('Tiêu đề cứng', { description: err.response?.data?.message })` in business domain files.

### Rule 3 — Success Toast Pattern
Keep clear, descriptive Vietnamese success messages (e.g. `toast.success('Đã xóa người dùng thành công');`).

### Rule 4 — Validation Toast Pattern
Client validation toasts remain in Vietnamese without requiring API error extraction.

## Code Layout
- `frontend/src/features/auth/components/user-auth-form.tsx`
- `frontend/src/features/users/components/user-form-sheet.tsx`
- `frontend/src/features/users/components/users-table/cell-action.tsx`
- `frontend/src/app/dashboard/warehouse/page.tsx`
- `frontend/src/app/dashboard/orders/[id]/page.tsx`
- `frontend/src/app/dashboard/orders/page.tsx`
- `frontend/src/app/dashboard/trips/page.tsx`
