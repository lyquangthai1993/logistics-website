# Handoff Report — Frontend Toast Audit (`src/features`)

**Explorer**: Explorer 2  
**Date**: 2026-08-18  
**Scope**: `d:\Projects\logistics-website\frontend\src\features`  

---

## 1. Observation

A full scan of all 15 feature directories in `d:\Projects\logistics-website\frontend\src\features` identified **10 files** containing Sonner `toast` calls (totaling 23 `toast` invocations).

Below is the exhaustive observation table:

| # | File Path | Line(s) | Current Toast Code Snippet | Classification | Language Status | Error Pattern Compliance |
|---|-----------|---------|----------------------------|----------------|-----------------|--------------------------|
| 1 | `src/features/users/components/users-table/cell-action.tsx` | 31, 35 | `toast.success('User deleted successfully')`<br>`toast.error('Failed to delete user')` | **Business Domain** (User Management) | English (❌ Non-compliant) | ❌ Does NOT extract `err.response?.data?.message`; ignores `err` parameter |
| 2 | `src/features/users/components/user-form-sheet.tsx` | 42, 46, 52, 55 | `toast.success('User created')`<br>`onError: () => toast.error("Couldn't create user. Try again.")`<br>`toast.success('User updated')`<br>`onError: () => toast.error("Couldn't update user. Try again.")` | **Business Domain** (User Drawer Form) | English (❌ Non-compliant) | ❌ Does NOT extract `err.response?.data?.message`; ignores `err` parameter |
| 3 | `src/features/auth/components/user-auth-form.tsx` | 26 | `toast.success('Signed In Successfully!')` | **Business Domain** (Authentication) | English (❌ Non-compliant) | N/A (Success toast) |
| 4 | `src/features/profile/components/profile-view-page.tsx` | 154, 159, 216, 220, 239, 242 | L154: `toast.error('Vui lòng chọn file hình ảnh (jpg, png, webp, gif).')`<br>L159: `toast.error('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.')`<br>L216: `toast.success('Cập nhật ảnh đại diện thành công!')`<br>L220: `toast.error(msg)` (`msg = err?.response?.data?.message ...`)<br>L239: `toast.success('Đã xóa ảnh đại diện.')`<br>L242: `toast.error(msg)` (`msg = err?.response?.data?.message ...`) | **Business Domain** (User Profile) | Vietnamese (✅ 100% Compliant) | ✅ Extracts `err.response?.data?.message` first with fallback. |
| 5 | `src/features/notifications/hooks/use-notification-socket.ts` | 63 | `toast(notification.title, { description: notification.body, duration: 5000 })` | **Business Domain** (WebSocket Event Listener) | Dynamic (Backend payload in Vietnamese) | ✅ Real-time server-push toast; not an API error handler. |
| 6 | `src/features/products/components/product-tables/cell-action.tsx` | 31, 35 | `toast.success('Product deleted successfully')`<br>`toast.error('Failed to delete product')` | **Demo / Mock Boilerplate** | English | Demo mock API (`fakeProducts`) |
| 7 | `src/features/products/components/product-form.tsx` | 29, 33, 40, 44 | `toast.success('Product created')`<br>`toast.error("Couldn't create product. Try again.")`<br>`toast.success('Product updated')`<br>`toast.error("Couldn't update product. Try again.")` | **Demo / Mock Boilerplate** | English | Demo mock API (`fakeProducts`) |
| 8 | `src/features/forms/components/advanced-form-patterns.tsx` | 110 | `toast.success('Team registered successfully!')` | **Demo / Example** (Showcase) | English | Demo form pattern |
| 9 | `src/features/forms/components/multi-step-product-form.tsx` | 110 | `toast.success('Product created successfully!')` | **Demo / Example** (Showcase) | English | Demo form pattern |
| 10 | `src/features/forms/components/sheet-form-demo.tsx` | 71, 195, 289, 292, 296, 300, 304, 311 | Multiple demo variant toasts (Default, Success, Error, Warning, Info, Promise) | **Demo / Example** (Showcase) | English | Demo showcase page |

---

### Non-toast Feature Modules Checked
- `src/features/orders/`: Contains `api.ts` (API client functions only; no UI/toast calls). Order UI pages are in `src/app/dashboard/orders/`.
- `src/features/trips/`: Contains `api.ts` (API client functions only; no UI/toast calls). Trip UI pages are in `src/app/dashboard/trips/`.
- `src/features/fleet/`: Contains `api.ts` (API client functions only; no UI/toast calls).
- `src/features/kanban/`, `src/features/chat/`, `src/features/ai-chat/`, `src/features/elements/`, `src/features/react-query-demo/`: Zero toast calls found.
- `src/features/overview/`: Contains `stats-error.tsx` (uses shadcn `Alert` component for error boundaries, not Sonner toast).

---

## 2. Logic Chain

1. **Path Alignment**:
   - The user request mentions `src/features/admin/users/` and `src/features/admin/products/`.
   - In the actual file structure, these modules reside directly under `src/features/users/` and `src/features/products/`.

2. **Classification of `src/features/products/`**:
   - Inspection of `src/features/products/api/service.ts` reveals:
     `// Current: Mock (in-memory fake data for demo/prototyping)`
     `import { fakeProducts } from '@/constants/mock-api';`
   - The Logistics TMS backend has no `products` module (the business entities are orders, trips, vehicles, drivers, hubs/warehouses, users, notifications).
   - Therefore, `src/features/products/` is confirmed to be **Demo / Template boilerplate**.
   - As per `ORIGINAL_REQUEST.md` Rule: *"Demo files (`advanced-form-patterns.tsx`, `sheet-form-demo.tsx`, `file-uploader.tsx`, `product-form.tsx`, `cell-action.tsx` trong products nếu là demo) KHÔNG bị sửa"*.

3. **Classification of `src/features/users/`**:
   - Manages system user accounts and roles. Even though `service.ts` currently connects to `fakeUsers`, `users` is an active business domain component explicitly required in `ORIGINAL_REQUEST.md`.
   - The toasts in `cell-action.tsx` and `user-form-sheet.tsx` are in English and do not extract `err.response?.data?.message`.
   - They MUST be updated to 100% Vietnamese with the API message first pattern.

4. **Classification of `src/features/auth/` (`user-auth-form.tsx`)**:
   - Directly in the authentication business flow.
   - Contains English toast `'Signed In Successfully!'`.
   - MUST be translated to `'Đăng nhập thành công!'`.

5. **Evaluation of `src/features/profile/` (`profile-view-page.tsx`)**:
   - Already 100% Vietnamese.
   - Already extracts `err?.response?.data?.message` (e.g. `const msg = err?.response?.data?.message || ...`).
   - Compliant with Rule 1 and Rule 2.

6. **Evaluation of `src/features/notifications/` (`use-notification-socket.ts`)**:
   - Real-time socket event listener for backend notifications.
   - Displays `notification.title` and `notification.body` which are emitted dynamically from the backend in Vietnamese.
   - Compliant.

---

## 3. Caveats

1. **Path Mapping**:
   - The prompt references `src/features/admin/users/` and `src/features/admin/products/`. Implementers must apply edits to `src/features/users/` and `src/features/products/` (or confirm if any aliases exist).
2. **Demo Exclusion**:
   - `src/features/products/components/product-tables/cell-action.tsx` and `src/features/products/components/product-form.tsx` must NOT be edited to prevent unnecessary churn in starter demo code.
3. **Type Safety with TanStack Query `onError`**:
   - In `useMutation`, `onError: (err: any) => { ... }` requires typing `(err: any)` or `(err: AxiosError<{ message?: string }>)` so that `err.response?.data?.message` compiles cleanly without TypeScript strict errors.

---

## 4. Conclusion & Proposed Replacements

### Summary of Actions:
- **Files to Modify (3 files)**:
  1. `src/features/users/components/users-table/cell-action.tsx`
  2. `src/features/users/components/user-form-sheet.tsx`
  3. `src/features/auth/components/user-auth-form.tsx`
- **Files Compliant / No Change Needed (2 files)**:
  4. `src/features/profile/components/profile-view-page.tsx`
  5. `src/features/notifications/hooks/use-notification-socket.ts`
- **Demo Files to Skip (5 files)**:
  6. `src/features/products/components/product-tables/cell-action.tsx`
  7. `src/features/products/components/product-form.tsx`
  8. `src/features/forms/components/advanced-form-patterns.tsx`
  9. `src/features/forms/components/multi-step-product-form.tsx`
  10. `src/features/forms/components/sheet-form-demo.tsx`

---

### Detailed Proposed Code Changes

#### File 1: `d:\Projects\logistics-website\frontend\src\features\users\components\users-table\cell-action.tsx`

**Lines 28–37:**
```typescript
<<<< BEFORE
  const deleteMutation = useMutation({
    ...deleteUserMutation,
    onSuccess: () => {
      toast.success('User deleted successfully');
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete user');
    }
  });
====
>>>> AFTER
  const deleteMutation = useMutation({
    ...deleteUserMutation,
    onSuccess: () => {
      toast.success('Đã xóa người dùng thành công');
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      const apiMessage = err.response?.data?.message;
      toast.error(apiMessage || 'Không thể xóa người dùng. Vui lòng thử lại.');
    }
  });
====
```

---

#### File 2: `d:\Projects\logistics-website\frontend\src\features\users\components\user-form-sheet.tsx`

**Lines 39–56:**
```typescript
<<<< BEFORE
  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('User created');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error("Couldn't create user. Try again.")
  });

  const updateMutation = useMutation({
    ...updateUserMutation,
    onSuccess: () => {
      toast.success('User updated');
      onOpenChange(false);
    },
    onError: () => toast.error("Couldn't update user. Try again.")
  });
====
>>>> AFTER
  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('Tạo người dùng thành công!');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: any) => {
      const apiMessage = err.response?.data?.message;
      toast.error(apiMessage || 'Không thể tạo người dùng. Vui lòng thử lại.');
    }
  });

  const updateMutation = useMutation({
    ...updateUserMutation,
    onSuccess: () => {
      toast.success('Cập nhật người dùng thành công!');
      onOpenChange(false);
    },
    onError: (err: any) => {
      const apiMessage = err.response?.data?.message;
      toast.error(apiMessage || 'Không thể cập nhật người dùng. Vui lòng thử lại.');
    }
  });
====
```

---

#### File 3: `d:\Projects\logistics-website\frontend\src\features\auth\components\user-auth-form.tsx`

**Lines 24–28:**
```typescript
<<<< BEFORE
    onSubmit: () => {
      startTransition(() => {
        toast.success('Signed In Successfully!');
      });
    }
====
>>>> AFTER
    onSubmit: () => {
      startTransition(() => {
        toast.success('Đăng nhập thành công!');
      });
    }
====
```

---

## 5. Verification Method

To independently verify after changes are applied:

1. **Static Type Check**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   Ensures `(err: any)` parameter in `onError` and string payloads have no TypeScript compilation errors.

2. **Grep Search Verification**:
   ```powershell
   # Ensure no English toast remains in business domain features
   git grep -n -i "User deleted" src/features/users/
   git grep -n -i "Couldn't create user" src/features/users/
   git grep -n -i "Signed In Successfully" src/features/auth/
   ```

3. **Check Demo Isolation**:
   Verify that `src/features/products/` and `src/features/forms/` remain unmodified.
