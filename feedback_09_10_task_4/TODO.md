# Feedback 09/10 (Task 4) — Loại Bỏ Nút "Xem Tài Khoản Demo" & Cụm Banner Thử Nghiệm Tại Màn Hình Đăng Nhập

> **Thời gian ghi nhận**: 09/10/2026  
> **Người báo cáo**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS — Spider Express)  
> **Yêu cầu gốc**: *"loại bỏ nút xem tài khoản demo ở màn hình đăng nhập"*  
> **Phạm vi tác động**:  
> - Frontend Authentication UI: Trang Đăng nhập (`/auth/sign-in`) ➔ Form Đăng nhập ([`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx))  
> - E2E Testing Suite: Cập nhật kịch bản kiểm thử giao diện đăng nhập ([`08-check-vercel-vs-local-signin.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/08-check-vercel-vs-local-signin.spec.ts) và tạo mới suite kiểm định [`40-feedback-09-10-task-4-remove-demo-accounts.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts))  
> **Tài liệu tham chiếu**:  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///D:/Projects/logistics-website/AGENTS.md)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md)  
> - /todo-agent Skill Guidelines ([`SKILL.md`](file:///D:/Projects/logistics-website/.agents/skills/todo-agent/SKILL.md))  
> **Ảnh minh chứng đính kèm trong thư mục**:  
> - [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_4/screenshot_01.jpg): Giao diện màn hình đăng nhập `/auth/sign-in` với nút `[🔑 Xem tài khoản Demo]` và popup "Tài khoản Demo có sẵn" được khoanh đỏ yêu cầu loại bỏ.  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"loại bỏ nút xem tài khoản demo ở màn hình đăng nhập"*

---

### 2. Bản chất nghiệp vụ & Lý do kỹ thuật
1. **Mục đích giai đoạn phát triển ban đầu (Dev/Staging Preview)**:
   - Trước đây, khi hệ thống Logistics TMS mới được đưa vào thử nghiệm nội bộ, một banner kèm Popover danh sách tài khoản mẫu (`DEMO_ACCOUNTS`) gồm Super Admin, Thủ kho các Hub (Hưng Yên, Đà Nẵng, TP.HCM) và nút "Điền form / Copy mật khẩu" được nhúng trực tiếp ngay trên form đăng nhập để hỗ trợ các tester và dev đăng nhập nhanh.
2. **Yêu cầu chuẩn hóa môi trường Vận hành Thực tế (Production / Professional TMS)**:
   - Hệ thống TMS hiện đã đi vào giai đoạn vận hành chính thức (v1.0.0+), kết nối cơ sở dữ liệu thật với phân quyền RBAC đa chi nhánh nghiêm ngặt.
   - Việc hiển thị công khai thông tin tài khoản mẫu, email, mật khẩu mẫu (`secret`, `Warehouse@123`, `Admin@123`) và nút "Xem tài khoản Demo" ngay trên giao diện đăng nhập công khai là không phù hợp với chuẩn bảo mật doanh nghiệp (Security Hardening), gây rối mắt và làm mất tính chuyên nghiệp của sản phẩm.
   - Người dùng vận hành (Thủ kho, Điều phối viên, Tài xế, Quản trị viên) phải tự sử dụng tài khoản được cấp phát chính thức để đăng nhập.

---

## 🔍 Phân tích hiện trạng mã nguồn & Nguyên nhân gốc rễ (Root Cause Analysis - RCA)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HIỆN TRẠNG TRƯỚC ĐÂY (CẦN LOẠI BỎ) VS YÊU CẦU MỚI (CHUẨN HÓA SẠCH GIAO DIỆN)                    │
├──────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│ KHỐI MÃ NGUỒN CŨ                     │ ĐỀ XUẤT ĐIỀU CHỈNH                                        │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 1. `DEMO_ACCOUNTS` constant (41 dòng)│ Xóa bỏ mảng khai báo thông tin credentials tài khoản mẫu. │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 2. State & Handlers Popover:         │ Xóa bỏ các state và hàm không còn dùng:                   │
│    `popoverOpen`, `copiedField`,     │ `handleQuickFill`, `handleCopy`, `setPopoverOpen`.        │
│    `handleQuickFill`, `handleCopy`   │                                                           │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 3. Khối Banner & Popover UI:         │ Loại bỏ hoàn toàn khối `div` banner                       │
│    `<div className="flex items-center│ `💡 Thử nghiệm phiên bản Demo?` cùng cụm PopoverTrigger   │
│    justify-between rounded-lg ...">` │ nút `[🔑 Xem tài khoản Demo]` và toàn bộ `PopoverContent`.│
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 4. Unused Icons & UI Components      │ Dọn sạch các import thừa: `Popover`, `PopoverContent`,    │
│                                      │ `Badge`, `IconKey`, `IconCopy`, `IconUserCheck`, v.v.     │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

1. **Vị trí tệp tin**: [`frontend/src/features/auth/components/login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx)
   - Dòng 31–72: Định nghĩa hằng số `DEMO_ACCOUNTS` chứa danh sách email/username/password thô.
   - Dòng 80–94: Khởi tạo state `popoverOpen`, `copiedField` và các hàm `handleQuickFill`, `handleCopy`.
   - Dòng 174–299: Render khối banner `💡 Thử nghiệm phiên bản Demo?` kèm nút `[🔑 Xem tài khoản Demo]` và Popover chứa danh sách tài khoản demo.
2. **Ảnh hưởng tới E2E Tests**:
   - Tệp [`frontend/e2e/08-check-vercel-vs-local-signin.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/08-check-vercel-vs-local-signin.spec.ts) có bước click nút `Xem tài khoản Demo`. Tệp này cần được cập nhật khẳng định ngược lại: nút `Xem tài khoản Demo` **không còn tồn tại** trên trang đăng nhập.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Frontend (`frontend/`)

- [x] **1.1. Loại bỏ khối Demo Accounts trong [`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx)**:
  - Xóa mảng `DEMO_ACCOUNTS`.
  - Xóa các state `popoverOpen`, `copiedField` và handlers `handleQuickFill`, `handleCopy`.
  - Xóa toàn bộ khối JSX banner và Popover (dòng 174–299).
  - Dọn dẹp các import không còn sử dụng (`Popover*`, `Badge`, `IconKey`, `IconCopy`, `IconCheck`, `IconUserCheck`, `IconUser`).
  - Đảm bảo form đăng nhập trực diện, tinh gọn, căn giữa với tiêu đề "Đăng nhập", trường Email/Username, Mật khẩu, Ghi nhớ đăng nhập và Nút Đăng nhập.

- [x] **1.2. Kiểm tra biên dịch TypeScript & Next.js App Router**:
  - Chạy `npx --prefix frontend tsc --noEmit` để đảm bảo 0 lỗi type (ĐÃ PASS 0 ERRORS).
  - Chạy `npm run build --prefix frontend` để đảm bảo Next.js build thành công 100% (ĐÃ PASS 100% Turbopack build, 33/33 static pages).

---

### 2. Kiểm thử Tự động E2E (`frontend/e2e/`)

- [x] **2.1. Cập nhật và bổ sung E2E Spec**:
  - Tạo mới suite [`frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts):
    * Kiểm tra màn hình `/auth/sign-in`:
      - Khẳng định nút `Xem tài khoản Demo` hoàn toàn biến mất (`toBeHidden()` / count = 0).
      - Khẳng định banner `Thử nghiệm phiên bản Demo?` hoàn toàn biến mất.
      - Khẳng định không còn bất kỳ Popover chứa thông tin tài khoản demo nào.
      - Kiểm tra luồng form client validation, toggle password, forgot password link.
  - Cập nhật [`frontend/e2e/08-check-vercel-vs-local-signin.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/08-check-vercel-vs-local-signin.spec.ts) khẳng định nút demo đã bị loại bỏ.
  - Chạy `npm run e2e` đạt PASS 100% (4/4 tests passed) và điểm Auditor 50/50.
  - Chụp ảnh màn hình nghiệm thu thực tế lưu vào [`screenshot_verified.png`](file:///D:/Projects/logistics-website/feedback_09_10_task_4/screenshot_verified.png).

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)

- **Môi trường**: Dev Frontend (`https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app/auth/sign-in`) hoặc Local (`http://localhost:3000/auth/sign-in`).
- **Các bước thực hiện**:
  - **Bước 1**: Điều hướng trình duyệt tới URL `/auth/sign-in`.
  - **Bước 2**: Chờ form đăng nhập tải hoàn tất (`#email`, `#password`, `button[type="submit"]` sẵn sàng).
  - **Bước 3**: Assert kiểm tra sự vắng mặt của nút Demo:
    ```typescript
    await expect(page.getByRole('button', { name: /Xem tài khoản Demo/i })).toHaveCount(0);
    await expect(page.getByText('Thử nghiệm phiên bản Demo?')).toHaveCount(0);
    ```
  - **Bước 4**: Thử tìm kiếm popup/popover tài khoản demo:
    ```typescript
    await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
    ```
  - **Bước 5**: Nhập thông tin tài khoản hợp lệ:
    - Email/Username: `admin` (hoặc `lyquangthai1993+1@gmail.com`)
    - Password: `secret`
  - **Bước 6**: Nhấp nút "Đăng nhập".
  - **Bước 7**: Chờ chuyển hướng thành công tới `/dashboard/overview` và chụp ảnh màn hình nghiệm thu thực tế lưu vào `feedback_09_10_task_4/screenshot_verified.png`.

---

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Zero Demo Button Presence** | Tải trang `/auth/sign-in` ở bất kỳ độ phân giải nào (Desktop 1920x1080, Tablet 768px, Mobile 375px). | Nút "Xem tài khoản Demo" và icon chìa khóa `IconKey` không được phép xuất hiện. | `expect(page.getByRole('button', { name: /Xem tài khoản Demo/i })).toHaveCount(0)` |
| `EC-02` | **Zero Demo Banner Presence** | Màn hình đăng nhập hiển thị. | Banner màu vàng nhạt `💡 Thử nghiệm phiên bản Demo?` biến mất hoàn toàn. | `expect(page.getByText(/Thử nghiệm phiên bản Demo/i)).toHaveCount(0)` |
| `EC-03` | **Responsive Layout Alignment** | Thu hẹp màn hình về Mobile (375x667). | Form đăng nhập không bị lệch khoảng trắng do xóa banner, padding gọn gàng `p-4 sm:p-6`. | Form hiển thị cân đối giữa khung hình, không bị tràn ngang. |
| `EC-04` | **Normal Manual Login** | Người dùng gõ tay username/password chuẩn. | Đăng nhập mượt mà, lưu token vào Cookie/LocalStorage và chuyển hướng vào trang chính. | `await page.waitForURL('**/dashboard/**')` |
| `EC-05` | **Failed Login Error Handling** | Người dùng nhập sai mật khẩu. | Hiển thị thông báo lỗi thân thiện tiếng Việt bằng `formatApiError()`, không làm vỡ layout. | `expect(page.getByText(/Tài khoản hoặc mật khẩu không chính xác/i)).toBeVisible()` |

---

### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- **File Test Suite**: `frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts`
- **Lệnh thực thi**:
  ```bash
  PLAYWRIGHT_BASE_URL=https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app API_URL=https://logistics-website-backend-1jho.onrender.com/api/v1 npx playwright test e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts --project=chromium
  ```
- **Tiêu chí Gate**: 100% test cases passed, kiểm định qua `node scripts/e2e-auditor.mjs` đạt score ≥ 40/50.

---

> *Tài liệu kiểm soát tiến độ được khởi tạo tự động bởi Todo Agent theo đúng chuẩn mực hệ thống Spider Express Logistics TMS.*
