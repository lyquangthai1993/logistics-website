# Original User Request

## 2026-08-18T03:22:37Z

Audit và chuẩn hóa toàn bộ toast notification messages trong frontend của dự án Logistics TMS tại `d:\Projects\logistics-website\frontend\src`.

Working directory: d:\Projects\logistics-website\frontend

## Bối cảnh

Hệ thống hiện tại dùng Sonner toast (`import { toast } from 'sonner'`). Vấn đề phát hiện:
1. Lẫn lộn tiếng Việt và tiếng Anh trong cùng một ứng dụng
2. Một số toast hard-code message thay vì dùng API error message trả về
3. Không nhất quán giữa các page/feature

## Nguyên tắc cần áp dụng (BẮT BUỘC)

**Rule 1 — Ngôn ngữ**: Tất cả toast message trong các file thuộc business domain (`orders/`, `trips/`, `warehouses/`, `admin/`, `profile/`) PHẢI 100% tiếng Việt. Các file demo/example (`advanced-form-patterns.tsx`, `multi-step-product-form.tsx`, `sheet-form-demo.tsx`, `file-uploader.tsx`) KHÔNG cần sửa.

**Rule 2 — API message first**: Với error toast từ API call, pattern phải là:
```typescript
// ✅ Đúng — API message first
const apiMessage = err.response?.data?.message;
toast.error(apiMessage || 'Thông báo lỗi tiếng Việt dự phòng.');

// ❌ Sai — hard-code message, bỏ qua API message
toast.error('Không thể xóa', { description: err.response?.data?.message })
```

**Rule 3 — Success toast**: Success messages có thể giữ tiếng Việt custom vì không có API success message.

**Rule 4 — Validation toast** (client-side, không gọi API): giữ tiếng Việt, không cần thay đổi pattern.

## Files cần sửa (chỉ business domain)

### `src/app/dashboard/orders/page.tsx`
Toast cần sửa:
- L229: `toast.error('Lỗi tạo lệnh điều vận', { description: err.response?.data?.message || err.message })` → API message first
- L265: `toast.error('Không thể xóa đơn hàng', { description: ... })` → API message first

### `src/app/dashboard/trips/page.tsx`
Toast cần sửa:
- L117: `toast.error('Không thể tải dữ liệu điều phối', { description: ... })` → xem xét API message
- L216: `toast.error('Lỗi cập nhật trạng thái hết xe', { description: ... })` → API message first
- L284: `toast.error('Lỗi khi phân công chuyến xe', { description: ... })` → API message first
- L301: `toast.error('Không thể xác nhận chuyến xe', { description: ... })` → API message first

### `src/features/admin/users/` — cell-action.tsx, user-form-sheet.tsx
Toast cần sửa (tiếng Anh → tiếng Việt):
- `'User deleted successfully'` → `'Đã xóa người dùng thành công'`
- `'Failed to delete user'` → API message first + fallback tiếng Việt
- `"Couldn't create user. Try again."` → API message first + fallback tiếng Việt
- `'User created'` → `'Tạo người dùng thành công!'`
- `'User updated'` → `'Cập nhật người dùng thành công!'`
- `"Couldn't update user. Try again."` → API message first + fallback tiếng Việt

### `src/features/admin/products/` — cell-action.tsx, product-form.tsx (nếu đây là demo/example thì BỎ QUA)
Kiểm tra xem đây có phải business domain thực không hay chỉ là boilerplate demo. Nếu là demo → bỏ qua.

### `src/features/auth/` — user-auth-form.tsx
- `'Signed In Successfully!'` → `'Đăng nhập thành công!'`

## Acceptance Criteria

### Ngôn ngữ
- [ ] 0 toast message tiếng Anh trong các file business domain sau khi sửa
- [ ] `user-auth-form.tsx`: `Signed In Successfully!` đã được dịch sang tiếng Việt
- [ ] `cell-action.tsx` và `user-form-sheet.tsx` trong admin/users: tất cả toast là tiếng Việt

### API Message First
- [ ] Với mọi error toast từ async/API call: pattern `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt')` được áp dụng
- [ ] Không còn pattern `toast.error('hardcode', { description: err.response?.data?.message })` trong business domain files

### Không regression
- [ ] `src/app/dashboard/orders/page.tsx` build thành công (`npx tsc --noEmit` pass)
- [ ] Không có toast nào bị xóa, chỉ được sửa nội dung/pattern
- [ ] Demo files (`advanced-form-patterns.tsx`, `sheet-form-demo.tsx`, `file-uploader.tsx`, `product-form.tsx`, `cell-action.tsx` trong products nếu là demo) KHÔNG bị sửa

## 2026-08-18T07:12:41Z

Standardize and refactor data listing tables across the Logistics TMS frontend (`frontend/src/app/dashboard/`), adopting the canonical TanStack React Table (`@tanstack/react-table` v8) + `nuqs` search params architecture established in `/dashboard/product`.

Working directory: d:/Projects/logistics-website/frontend
Integrity mode: development

## Requirements

### R1. Target Scope & Modular Phasing
Refactor data listing pages in phased priority:
- **Core Phase 1**:
  1. `/dashboard/admin/hubs` (Hubs Management)
  2. `/dashboard/fleet` (Fleet Vehicles & Drivers)
  3. `/dashboard/orders` (Orders Intake & Dispatch)
  4. `/dashboard/trips` (Trips & Vehicle Capacity)
  5. `/dashboard/users` (User Management)
- **Phase 2**:
  6. `/dashboard/warehouse` (Warehouse Inbound/Outbound)
  7. `/dashboard/notifications` (System Notifications)

### R2. Canonical Architecture & Component Reuse
Each refactored table MUST strictly leverage the project's existing shared components and hooks located in `src/components/ui/table/` and `src/hooks/use-data-table.ts`:
- `DataTable` (`src/components/ui/table/data-table.tsx`) with sticky header, column pinning, and scroll area.
- `DataTablePagination` (`src/components/ui/table/data-table-pagination.tsx`) with rows per page selector (`[10, 20, 30, 40, 50]`), total count, and First/Prev/Next/Last navigation buttons.
- `DataTableToolbar` (`src/components/ui/table/data-table-toolbar.tsx`) with dynamic search input, faceted filter popovers, and view options.
- `DataTableColumnHeader` (`src/components/ui/table/data-table-column-header.tsx`) with sorting toggles.
- `useDataTable` (`src/hooks/use-data-table.ts`) managing table state with `nuqs` URL search params sync (`page`, `perPage`, `search`, filters).

### R3. Business Logic & Action Parity Preservation
- Preserve all existing row-level interactive actions: Edit modal, soft delete confirmation dialog with warnings, toggle active status, and inline badges.
- Preserve all 3-layer RBAC permission guards and role-based action visibility (`SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`).

## Acceptance Criteria

### Table Uniformity & UX Quality
- [ ] All target listing tables use `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`.
- [ ] Table column definitions utilize `ColumnDef<T>` with sortable headers (`DataTableColumnHeader`) where appropriate.
- [ ] URL search parameters (`page`, `perPage`, `search`) reflect and synchronize table pagination state in real time via `nuqs`.
- [ ] Interactive elements adhere to the pointer cursor rule (`cursor-pointer` on clickable elements, `cursor-not-allowed` on disabled states).

### Verification & Test Suite
- [ ] `npm run build` in `frontend/` succeeds with 0 TypeScript or compile errors.
- [ ] Existing and updated Playwright E2E test specs (including `04-fleet-crud-and-refresh.spec.ts`, `06-order-dispatch-workflow.spec.ts`, `10-hubs-management.spec.ts`) pass 100%.
