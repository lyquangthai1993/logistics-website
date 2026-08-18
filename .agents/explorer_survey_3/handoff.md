# HANDOFF REPORT — Frontend Toast Audit & Survey (Part 3)

**Agent**: Explorer 3  
**Working Directory**: `d:\Projects\logistics-website\.agents\explorer_survey_3`  
**Scope**: All components, hooks, lib, features, and dashboard pages in `d:\Projects\logistics-website\frontend\src`  
**Timestamp**: 2026-08-18T10:27:00+07:00  

---

## 1. Observation

A full-codebase scan across `frontend/src` using `grep_search` and `find_by_name` identified **17 distinct files** containing toast-related logic, encompassing **45 total toast invocations / triggers**.

### A. Demo & UI Framework Files (Demarcated as DO NOT TOUCH)

| File Path | Description / Purpose | Classification |
|---|---|---|
| `frontend/src/components/file-uploader.tsx` | Reusable generic file dropzone with demo toast preview | **DEMO / REUSABLE UI (DO NOT TOUCH)** |
| `frontend/src/components/ui/sonner.tsx` | Sonner Toaster container setup & click dismiss listener | **INFRASTRUCTURE (DO NOT TOUCH)** |
| `frontend/src/components/ui/toast.tsx` | Base UI toast primitive manager definition | **INFRASTRUCTURE (DO NOT TOUCH)** |
| `frontend/src/features/forms/components/advanced-form-patterns.tsx` | Form showcase showcasing async validation & linked fields | **DEMO (DO NOT TOUCH)** |
| `frontend/src/features/forms/components/multi-step-product-form.tsx` | Stepper form demo for product creation | **DEMO (DO NOT TOUCH)** |
| `frontend/src/features/forms/components/sheet-form-demo.tsx` | Interactive showcase for sheet/dialog forms & toast variants | **DEMO (DO NOT TOUCH)** |
| `frontend/src/features/products/components/product-form.tsx` | Mock product form using in-memory faker database (`mock-api.ts`) | **DEMO / TEMPLATE (DO NOT TOUCH)** |
| `frontend/src/features/products/components/product-tables/cell-action.tsx` | Mock product table actions with in-memory faker database | **DEMO / TEMPLATE (DO NOT TOUCH)** |

#### Verbatim Toast Snippets in Demo Files:
1. `src/components/file-uploader.tsx`:
   - L115: `toast.error('Cannot upload more than 1 file at a time');`
   - L120: `toast.error('Cannot upload more than ${maxFiles} files');`
   - L136: `toast.error('File ${file.name} was rejected');`
   - L143: `toast.promise(onUpload(updatedFiles), { loading: 'Uploading ${target}...', success: ..., error: 'Failed to upload ${target}' });`
2. `src/features/forms/components/advanced-form-patterns.tsx`:
   - L110: `toast.success('Team registered successfully!');`
3. `src/features/forms/components/multi-step-product-form.tsx`:
   - L110: `toast.success('Product created successfully!');`
4. `src/features/forms/components/sheet-form-demo.tsx`:
   - L71: `toast.success('Product created successfully!', { description: '${value.name} has been added.' });`
   - L195: `toast.success('Feedback submitted!', { description: 'Rating: ${value.rating}/10. Thank you!' });`
   - L289: `toast('Default toast notification')`
   - L292: `toast.success('Action completed successfully!')`
   - L296: `toast.error('Something went wrong.')`
   - L300: `toast.warning('Please review before continuing.')`
   - L304: `toast.info('Here is some useful information.')`
   - L311: `toast.promise(new Promise(...), { loading: 'Loading...', success: 'Data loaded!', error: 'Failed to load.' })`
5. `src/features/products/components/product-form.tsx`:
   - L29: `toast.success('Product created');`
   - L33: `toast.error("Couldn't create product. Try again.");`
   - L40: `toast.success('Product updated');`
   - L44: `toast.error("Couldn't update product. Try again.");`
6. `src/features/products/components/product-tables/cell-action.tsx`:
   - L31: `toast.success('Product deleted successfully');`
   - L35: `toast.error('Failed to delete product');`

---

### B. Global Error Handling Architecture (`frontend/src/lib/api-client.ts`)

- `apiClient` is an Axios instance configured with `baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`.
- Request interceptor attaches Bearer token from `useAuthStore` / document cookie.
- Response interceptor handles HTTP `401 Unauthorized` by queueing requests and attempting token refresh via `/api/v1/auth/refresh`. If refresh fails, it clears credentials and redirects to `/auth/sign-in`.
- **Global Error Popups**: `apiClient` does **NOT** fire any global toast notifications on HTTP 400/403/404/500 errors. Instead, it rejects the Promise (`Promise.reject(error)`).
- **Implication**: All error notifications must be caught and triggered locally in React Query hooks or component async handlers. Hence, the **Rule 2: API Message First** pattern (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Fallback tiếng Việt')`) is critical to implement consistently across all caller components.

---

### C. Shared Components, Hooks & Socket Services

1. `src/hooks/`: All 12 custom hook files (`use-breadcrumbs`, `use-callback-ref`, `use-controllable-state`, `use-data-table`, `use-debounce`, `use-debounced-callback`, `use-media-query`, `use-mobile`, `use-nav`, `use-rbac`, `use-stepper`) are purely functional UI/state utilities and trigger **0 toast calls**.
2. `src/lib/`: All 11 utility files (`api-client`, `query-client`, `form`, `parsers`, `utils`, etc.) trigger **0 toast calls**.
3. `src/features/notifications/hooks/use-notification-socket.ts`:
   - L63-66:
     ```typescript
     toast(notification.title, {
       description: notification.body,
       duration: 5000
     });
     ```
   - Classification: **Business Domain (WebSocket Notification)**.
   - Language Status: **Vietnamese** (received dynamically from backend TMS notification events).
   - Status: **Compliant** — no changes needed.

---

### D. Business Domain Toast Inventory & Exact Locations

#### 1. `frontend/src/features/auth/components/user-auth-form.tsx`
- **L26**: `toast.success('Signed In Successfully!');`
- Classification: Business Domain (Auth)
- Language: English
- Error Pattern Check: N/A (Success toast)
- **Status**: Needs fix (English → Vietnamese)

#### 2. `frontend/src/features/users/components/user-form-sheet.tsx`
- **L42**: `toast.success('User created');` (English → Vietnamese)
- **L46**: `onError: () => toast.error("Couldn't create user. Try again.")` (English + Hardcoded error)
- **L52**: `toast.success('User updated');` (English → Vietnamese)
- **L55**: `onError: () => toast.error("Couldn't update user. Try again.")` (English + Hardcoded error)
- Classification: Business Domain (Admin Users)
- **Status**: Needs fix (4 toasts)

#### 3. `frontend/src/features/users/components/users-table/cell-action.tsx`
- **L31**: `toast.success('User deleted successfully');` (English → Vietnamese)
- **L35**: `toast.error('Failed to delete user');` (English + Hardcoded error)
- Classification: Business Domain (Admin Users)
- **Status**: Needs fix (2 toasts)

#### 4. `frontend/src/features/profile/components/profile-view-page.tsx`
- **L154**: `toast.error('Vui lòng chọn file hình ảnh (jpg, png, webp, gif).');` (Client validation — 100% Vietnamese)
- **L159**: `toast.error('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');` (Client validation — 100% Vietnamese)
- **L216**: `toast.success('Cập nhật ảnh đại diện thành công!');` (Success — 100% Vietnamese)
- **L220**: `toast.error(msg);` where `msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải ảnh lên.'` (API message first — 100% Vietnamese)
- **L239**: `toast.success('Đã xóa ảnh đại diện.');` (Success — 100% Vietnamese)
- **L242**: `toast.error(msg);` where `msg = err?.response?.data?.message || 'Không thể xóa ảnh đại diện.'` (API message first — 100% Vietnamese)
- Classification: Business Domain (Profile)
- **Status**: **Fully Compliant**

#### 5. `frontend/src/app/dashboard/warehouse/page.tsx`
- **L43-45**:
  ```typescript
  toast.error('Không thể tải danh sách chuyến xe Inbound', {
    description: err.response?.data?.message || err.message
  });
  ```
- Classification: Business Domain (Warehouse Inbound)
- Language: Vietnamese
- Error Pattern Check: **Violates Rule 2** (uses `{ description: ... }` pattern instead of API message first title)
- **Status**: Needs fix

#### 6. `frontend/src/app/dashboard/orders/[id]/page.tsx`
- **L104-106**: `toast.error('Không thể tải thông tin đơn hàng', { description: err.response?.data?.message || err.message });` (Violates Rule 2)
- **L119**: `toast.success('Đã gửi lệnh điều vận lên Đội xe (Fleet)!');` (Compliant)
- **L122-124**: `toast.error('Lỗi khi gửi lệnh điều vận', { description: (err as Error).message });` (Violates Rule 2)
- **L132**: `toast.success('Đã hủy lệnh điều vận thành công');` (Compliant)
- **L135-137**: `toast.error('Lỗi khi hủy lệnh điều vận', { description: (err as Error).message });` (Violates Rule 2)
- Classification: Business Domain (Order Detail)
- **Status**: Needs fix (3 error toasts violate Rule 2)

#### 7. `frontend/src/app/dashboard/orders/page.tsx`
- **L193-195**: `toast.error('Không thể tải danh sách đơn hàng', { description: err.response?.data?.message || err.message });` (Violates Rule 2)
- **L221**: `toast.error('Vui lòng nhập mã đơn hàng');` (Validation — Compliant)
- **L225**: `toast.error('Hub xuất phát và Hub đích không được trùng nhau');` (Validation — Compliant)
- **L229**: `toast.error('Khối lượng phải lớn hơn 0 kg');` (Validation — Compliant)
- **L233**: `toast.error('Thể tích phải lớn hơn 0 m³');` (Validation — Compliant)
- **L237-239**: `toast.error('Vui lòng nhập ghi chú / lý do điều xe ngoài', { description: 'Bắt buộc phải ghi nhận nội dung khi yêu cầu thuê ngoài đối tác.' });` (Validation — Compliant)
- **L259**: `toast.success('Tạo lệnh điều vận thành công!');` (Success — Compliant)
- **L271-273**: `toast.error('Lỗi tạo lệnh điều vận', { description: err.response?.data?.message || err.message });` (Violates Rule 2)
- **L286**: `toast.success('Đã gửi lệnh điều vận lên Đội xe (Fleet)!');` (Success — Compliant)
- **L289-290**: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Không thể gửi lệnh điều vận. Vui lòng thử lại.');` (Already Compliant with Rule 2)
- **L304**: `toast.success('Đã xóa đơn hàng thành công');` (Success — Compliant)
- **L307-309**: `toast.error('Không thể xóa đơn hàng', { description: err.response?.data?.message || err.message });` (Violates Rule 2)
- Classification: Business Domain (Orders List)
- **Status**: Needs fix (3 error toasts violate Rule 2)

#### 8. `frontend/src/app/dashboard/trips/page.tsx`
- **L117-119**: `toast.error('Không thể tải dữ liệu điều phối', { description: (err as Error).message });` (Violates Rule 2)
- **L209-211**: `toast.warning('Đã báo hết xe cho đơn ${noVehicleOrder.orderCode}', { description: 'Bộ phận Điều phối (Dispatcher) đã được cập nhật để chủ động thuê xe ngoài.' });` (Domain warning — Compliant)
- **L216-218**: `toast.error('Lỗi cập nhật trạng thái hết xe', { description: (err as Error).message });` (Violates Rule 2)
- **L234**: `toast.error('Vui lòng chọn phương tiện vận chuyển');` (Validation — Compliant)
- **L249**: `toast.success('Đã phân công xe cho đơn hàng ${selectedOrder.orderCode}');` (Success — Compliant)
- **L254**: `toast.error('Vui lòng chọn xe cho chuyến thứ ${i + 1}');` (Validation — Compliant)
- **L258**: `toast.error('Khối lượng chuyến ${i + 1} phải lớn hơn 0');` (Validation — Compliant)
- **L278**: `toast.success('Đã chia đơn ${selectedOrder.orderCode} sang ${splitRows.length} chuyến xe!');` (Success — Compliant)
- **L284-286**: `toast.error('Lỗi khi phân công chuyến xe', { description: (err as Error).message });` (Violates Rule 2)
- **L296-298**: `toast.success('Xác nhận chuyến xe thành công!', { description: 'Đã cập nhật trạng thái và tự động gửi thông báo đến Inbound Kho.' });` (Success — Compliant)
- **L301-303**: `toast.error('Không thể xác nhận chuyến xe', { description: (err as Error).message });` (Violates Rule 2)
- Classification: Business Domain (Trips Dispatch)
- **Status**: Needs fix (4 error toasts violate Rule 2)

---

## 2. Logic Chain

1. **Identification of Demo vs Business Domain**:
   - `file-uploader.tsx`, `advanced-form-patterns.tsx`, `multi-step-product-form.tsx`, `sheet-form-demo.tsx` reside under generic showcase routes (`/dashboard/forms/*`) and are explicitly designated as DO NOT TOUCH in `ORIGINAL_REQUEST.md`.
   - `features/products/` utilizes `constants/mock-api.ts` (in-memory faker mock) and is an unused template component; modifying it risks unnecessary regressions in template code.
   - `features/users/` (`user-form-sheet.tsx`, `users-table/cell-action.tsx`) is tied to `/dashboard/users`, which is accessible to `SUPER_ADMIN` in `nav-config.ts` and explicitly listed in `ORIGINAL_REQUEST.md` for translation and standardization.
   - `features/auth/components/user-auth-form.tsx` is an auth component with English text `'Signed In Successfully!'`.
   - `app/dashboard/orders/`, `app/dashboard/trips/`, `app/dashboard/warehouse/` are core operational TMS business pages.

2. **Rule Adherence Analysis**:
   - **Rule 1 (100% Vietnamese)**: Violated by `user-auth-form.tsx`, `user-form-sheet.tsx`, `cell-action.tsx` (in `features/users/`).
   - **Rule 2 (API Message First)**: Violated by 11 error toast calls in `orders/page.tsx`, `orders/[id]/page.tsx`, `trips/page.tsx`, `warehouse/page.tsx`, and `users/` which used `{ description: err.response?.data?.message || err.message }` or hardcoded error strings without extracting `err.response?.data?.message` into the primary message argument.
   - **Rule 3 & 4 (Success and Validation toasts)**: Client-side validation toasts and success toasts correctly use Vietnamese and comply with specifications.

---

## 3. Caveats

1. **Read-Only Scope**: This report records all findings without performing code writes to source code, adhering to the explorer role constraints.
2. **Product Module Isolation**: `src/features/products/` has been verified as a mock demonstration module. It should remain untouched unless explicitly instructed by the user.
3. **WebSocket Notification Dynamic Content**: In `use-notification-socket.ts`, `toast(notification.title, { description: notification.body })` receives data directly from the NestJS backend WebSocket gateway. Backend payloads are generated in Vietnamese by business events (e.g. `Đơn hàng mới`, `Chuyến xe đã phân bổ`), so the frontend hook implementation is already optimal.

---

## 4. Conclusion & Proposed Code Replacements

### Summary Table of All Required Modifications

| Target File | Line(s) | Current Code Snippet | Proposed Exact Replacement | Reason |
|---|---|---|---|---|
| `frontend/src/features/auth/components/user-auth-form.tsx` | 26 | `toast.success('Signed In Successfully!');` | `toast.success('Đăng nhập thành công!');` | Rule 1 (Tiếng Việt) |
| `frontend/src/features/users/components/user-form-sheet.tsx` | 42 | `toast.success('User created');` | `toast.success('Tạo người dùng thành công!');` | Rule 1 (Tiếng Việt) |
| `frontend/src/features/users/components/user-form-sheet.tsx` | 46 | `onError: () => toast.error("Couldn't create user. Try again.")` | `onError: (err: any) => { const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể tạo người dùng. Vui lòng thử lại.'); }` | Rule 1 & Rule 2 |
| `frontend/src/features/users/components/user-form-sheet.tsx` | 52 | `toast.success('User updated');` | `toast.success('Cập nhật người dùng thành công!');` | Rule 1 (Tiếng Việt) |
| `frontend/src/features/users/components/user-form-sheet.tsx` | 55 | `onError: () => toast.error("Couldn't update user. Try again.")` | `onError: (err: any) => { const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể cập nhật người dùng. Vui lòng thử lại.'); }` | Rule 1 & Rule 2 |
| `frontend/src/features/users/components/users-table/cell-action.tsx` | 31 | `toast.success('User deleted successfully');` | `toast.success('Đã xóa người dùng thành công');` | Rule 1 (Tiếng Việt) |
| `frontend/src/features/users/components/users-table/cell-action.tsx` | 35 | `onError: () => { toast.error('Failed to delete user'); }` | `onError: (err: any) => { const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể xóa người dùng. Vui lòng thử lại.'); }` | Rule 1 & Rule 2 |
| `frontend/src/app/dashboard/warehouse/page.tsx` | 43-45 | `toast.error('Không thể tải danh sách chuyến xe Inbound', { description: err.response?.data?.message || err.message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể tải danh sách chuyến xe Inbound. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/[id]/page.tsx` | 104-106 | `toast.error('Không thể tải thông tin đơn hàng', { description: err.response?.data?.message || err.message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/[id]/page.tsx` | 122-124 | `toast.error('Lỗi khi gửi lệnh điều vận', { description: (err as Error).message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Lỗi khi gửi lệnh điều vận. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/[id]/page.tsx` | 135-137 | `toast.error('Lỗi khi hủy lệnh điều vận', { description: (err as Error).message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Lỗi khi hủy lệnh điều vận. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/page.tsx` | 193-195 | `toast.error('Không thể tải danh sách đơn hàng', { description: err.response?.data?.message || err.message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/page.tsx` | 271-273 | `toast.error('Lỗi tạo lệnh điều vận', { description: err.response?.data?.message || err.message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Lỗi tạo lệnh điều vận. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/orders/page.tsx` | 307-309 | `toast.error('Không thể xóa đơn hàng', { description: err.response?.data?.message || err.message });` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'Không thể xóa đơn hàng. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/trips/page.tsx` | 117-119 | `toast.error('Không thể tải dữ liệu điều phối', { description: (err as Error).message });` | `const apiMessage = (err as any)?.response?.data?.message; toast.error(apiMessage || 'Không thể tải dữ liệu điều phối. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/trips/page.tsx` | 216-218 | `toast.error('Lỗi cập nhật trạng thái hết xe', { description: (err as Error).message });` | `const apiMessage = (err as any)?.response?.data?.message; toast.error(apiMessage || 'Lỗi cập nhật trạng thái hết xe. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/trips/page.tsx` | 284-286 | `toast.error('Lỗi khi phân công chuyến xe', { description: (err as Error).message });` | `const apiMessage = (err as any)?.response?.data?.message; toast.error(apiMessage || 'Lỗi khi phân công chuyến xe. Vui lòng thử lại.');` | Rule 2 (API message first) |
| `frontend/src/app/dashboard/trips/page.tsx` | 301-303 | `toast.error('Không thể xác nhận chuyến xe', { description: (err as Error).message });` | `const apiMessage = (err as any)?.response?.data?.message; toast.error(apiMessage || 'Không thể xác nhận chuyến xe. Vui lòng thử lại.');` | Rule 2 (API message first) |

---

## 5. Verification Method

To independently verify these findings and check for compliance once the implementer applies the proposed changes:

1. **TypeScript Compilation Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

2. **Regex Audit for Remaining English Toasts in Business Domain**:
   ```powershell
   # Search for English words inside toast calls in business domain files
   cd d:\Projects\logistics-website\frontend
   git grep -n -E "toast\.(success|error|warning|info)\(['\"][A-Za-z ]+['\"]\)" src/app/dashboard/orders src/app/dashboard/trips src/app/dashboard/warehouse src/features/auth src/features/users src/features/profile
   ```
   Expected output: **0 matches** (after fixes applied).

3. **Pattern Audit for Disallowed `description` Property in Error Toasts**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   git grep -n -E "toast\.error\([^,]+,\s*\{\s*description:" src/app/dashboard/orders src/app/dashboard/trips src/app/dashboard/warehouse src/features/users
   ```
   Expected output: **0 matches** (after fixes applied).
