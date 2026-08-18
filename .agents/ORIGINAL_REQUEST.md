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
