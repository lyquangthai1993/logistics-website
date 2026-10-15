# Feedback 15/10 (Task #87) — Chuyển Hướng Đăng Nhập Thẳng Vào Màn Hình Đơn Hàng Kho & Loại Bỏ Màn Hình Dashboard Tổng Quan

> **Thời gian ghi nhận**: 15/10/2026  
> **Người báo cáo**: @Thai / Quản trị Vận hành TMS  
> **Mã Task Database**: `Task #87`  
> **Màn hình liên quan**:  
> - Đăng nhập ([`login-form.tsx`](file:///frontend/src/features/auth/components/login-form.tsx), [`sign-in/page.tsx`](file:///frontend/src/app/auth/sign-in/page.tsx))  
> - Màn hình Tổng quan Dashboard ([`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx)) ➔ Chuyển hướng triệt để sang Đơn hàng kho  
> - Trang Điều hướng Gốc ([`page.tsx`](file:///frontend/src/app/page.tsx), [`dashboard/page.tsx`](file:///frontend/src/app/dashboard/page.tsx))  
> - Quản lý Đơn hàng kho ([`warehouse/orders/page.tsx`](file:///frontend/src/app/dashboard/warehouse/orders/page.tsx))  
> - Cấu hình Thanh điều hướng Navigation ([`nav-config.ts`](file:///frontend/src/config/nav-config.ts))  
> - Middleware Proxy ([`proxy.ts`](file:///frontend/src/proxy.ts))  
> **Ảnh minh chứng gốc**: [`screenshot_01.png`](file:///feedbacks/feedback_15_10_task_87/screenshot_01.png) (Màn hình Dashboard Overview với dữ liệu demo mẫu không phục vụ nghiệp vụ kho)  
> **Tài liệu tham chiếu**:  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md) (Zero Technical Jargon, Compact Density, Real DB Data)  
> - Kỹ năng Todo Agent ([`todo-agent/SKILL.md`](file:///.agents/skills/todo-agent/SKILL.md))  

---

## 📌 Bối cảnh nghiệp vụ & Phân tích nguyên nhân gốc rễ (RCA)

### 1. Bối cảnh nghiệp vụ thực tế
- Người dùng vận hành hệ thống Logistics TMS (Spider Express) sau khi đăng nhập thành công vào hệ thống bị chuyển hướng về màn hình `/dashboard/overview` ("Dashboard / Overview").
- Màn hình này hiện đang hiển thị các biểu đồ mẫu (template starter) với nội dung tiếng Anh ("Hi, Welcome back 👋", "Total Revenue $1,250.00", "New Customers 1,234", "Recent Sales"...), hoàn toàn là dữ liệu mẫu giả định và không phục vụ nghiệp vụ vận hành thực tế của chuỗi kho bãi bốc dỡ hàng hóa Spider Express.
- Người dùng vận hành yêu cầu dứt khoát:
  > *"đừng cho hiện cái này nữa nha ông, đăng nhập vào sẽ vào thẳng màn hình đơn hàng kho luôn. không hiện màn hình dasboard"* (kèm ảnh chụp màn hình `/dashboard/overview`).
- **Mục tiêu**:
  1. Khi người dùng đăng nhập thành công, hệ thống chuyển hướng thẳng 100% vào màn hình **Đơn hàng kho** (`/dashboard/warehouse/orders`).
  2. Bất kỳ khi nào người dùng truy cập vào trang chủ `/`, `/dashboard` hoặc `/dashboard/overview`, hệ thống tự động redirect sang `/dashboard/warehouse/orders`.
  3. Loại bỏ mục menu "Dashboard" khỏi cấu hình thanh điều hướng (`navGroups` trong `nav-config.ts`) để triệt tiêu hoàn toàn sự xuất hiện của màn hình dashboard mẫu.

### 2. Phân tích nguyên nhân kỹ thuật (RCA)
- Trong [`login-form.tsx`](file:///frontend/src/features/auth/components/login-form.tsx), biến `targetUrl` mặc định là `'/dashboard/overview'`.
- Trong [`page.tsx`](file:///frontend/src/app/page.tsx), [`dashboard/page.tsx`](file:///frontend/src/app/dashboard/page.tsx), [`sign-in/page.tsx`](file:///frontend/src/app/auth/sign-in/page.tsx), hệ thống gọi `redirect('/dashboard/overview')` khi người dùng đã có token hợp lệ.
- Trong [`proxy.ts`](file:///frontend/src/proxy.ts), khi người dùng truy cập các public auth routes hoặc bị chặn quyền, middleware chuyển hướng về `'/dashboard/overview'`.
- Trong [`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx), component trả về giao diện `<OverViewPage />` thay vì chuyển tiếp sang trang nghiệp vụ kho.

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Phân Tích & Quản Trị Nhánh
- [x] Tạo nhánh `feature/task-87-direct-warehouse-orders-redirect` từ `dev` trên repository frontend và root.
- [x] Thu thập và đối soát ảnh chụp màn hình gốc của task vào `feedbacks/feedback_15_10_task_87/screenshot_01.png`.

### 2. Triển Khai Mã Nguồn Giao Diện & Điều Hướng (Frontend)
- [x] Cập nhật [`login-form.tsx`](file:///frontend/src/features/auth/components/login-form.tsx): Đổi đích chuyển hướng mặc định sau đăng nhập thành `/dashboard/warehouse/orders`.
- [x] Cập nhật [`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx): Thiết lập `redirect('/dashboard/warehouse/orders')` khi truy cập `/dashboard/overview`.
- [x] Cập nhật [`page.tsx`](file:///frontend/src/app/page.tsx) & [`dashboard/page.tsx`](file:///frontend/src/app/dashboard/page.tsx): Chuyển hướng người dùng đã xác thực thẳng vào `/dashboard/warehouse/orders`.
- [x] Cập nhật [`sign-in/page.tsx`](file:///frontend/src/app/auth/sign-in/page.tsx), [`reset-password/page.tsx`](file:///frontend/src/app/auth/reset-password/page.tsx), [`forgot-password/page.tsx`](file:///frontend/src/app/auth/forgot-password/page.tsx): Chuyển hướng token hợp lệ sang `/dashboard/warehouse/orders`.
- [x] Cập nhật [`proxy.ts`](file:///frontend/src/proxy.ts): Điều chỉnh middleware chuyển hướng fallback sang `/dashboard/warehouse/orders`.
- [x] Cập nhật [`nav-config.ts`](file:///frontend/src/config/nav-config.ts): Loại bỏ mục menu Dashboard mẫu (`/dashboard/overview`).

### 3. Kiểm Định & Xác Minh Chất Lượng
- [x] Kiểm tra lỗi kiểu TypeScript: `node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit` đạt 0 lỗi.
- [x] Biên dịch ứng dụng Next.js: `npm --prefix frontend run build` 34/34 routes pass.
- [x] Xây dựng test suite Playwright E2E chuyên biệt: `frontend/e2e/87-feedback-15-10-task-87-direct-warehouse-orders-redirect.spec.ts`.
- [x] Thực thi test suite E2E và ghi lại ảnh chụp màn hình bằng chứng thực tế: `feedbacks/feedback_15_10_task_87/screenshot_01_verified.png`.
- [x] Đánh giá chéo chất lượng test qua `node scripts/e2e-auditor.mjs` đạt điểm tối đa (50/50).

### 4. Báo Cáo & Biên Niên Sử Kỹ Thuật
- [x] Tạo tài liệu nghiệm thu kỹ thuật `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md` qua `npm run todo:record feedback_15_10_task_87`.
- [x] Merge nhánh tính năng vào `dev` và cập nhật báo cáo nghiệm thu mobile-first.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản kiểm thử**: `USER_WAREHOUSE_HCM` (username `warehouse_hcm`) hoặc bất kỳ tài khoản vận hành nào.
- **Các bước thực hiện**:
  1. Mở trang đăng nhập `/auth/sign-in`.
  2. Điền thông tin đăng nhập và bấm "Đăng nhập".
  3. **Assertion 1**: Hệ thống chuyển hướng người dùng thẳng vào URL `/dashboard/warehouse/orders` (KHÔNG bao giờ chuyển hướng đến `/dashboard/overview`).
  4. **Assertion 2**: Màn hình hiển thị tiêu đề và nội dung của Quản lý Đơn hàng kho ("Đơn hàng kho" / Bảng kê danh sách đơn hàng).
  5. **Assertion 3**: Điều hướng trực tiếp bằng URL tới `/dashboard/overview` ➔ Hệ thống tự động chuyển tiếp ngay lập tức về `/dashboard/warehouse/orders`.
  6. **Assertion 4**: Thanh sidebar menu không còn hiển thị mục "Dashboard" mẫu.
  7. Chụp ảnh màn hình nghiệm thu thực tế lưu vào `feedbacks/feedback_15_10_task_87/screenshot_01_verified.png`.

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Chuyển Hướng Sau Đăng Nhập Mặc Định** | Người dùng đăng nhập không có tham số `redirect`. | Vào thẳng `/dashboard/warehouse/orders`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/orders/)` |
| `EC-02` | **Chặn Truy Cập Trực Tiếp Dashboard** | Người dùng gõ URL `/dashboard/overview` vào thanh địa chỉ. | Tự động redirect về `/dashboard/warehouse/orders`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/orders/)` |
| `EC-03` | **Truy Cập Trang Gốc `/` Khi Đã Đăng Nhập** | Người dùng mở `https://<domain>/`. | Tự động redirect về `/dashboard/warehouse/orders`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/orders/)` |
| `EC-04` | **Truy Cập Trang `/dashboard`** | Người dùng mở `https://<domain>/dashboard`. | Tự động redirect về `/dashboard/warehouse/orders`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/orders/)` |
| `EC-05` | **Bảo Toàn Deep Link Hợp Lệ** | Đăng nhập với query `?redirect=/dashboard/warehouse/outbound`. | Chuyển đến đúng trang yêu cầu `/dashboard/warehouse/outbound`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/outbound/)` |
| `EC-06` | **Khử Deep Link Dashboard Cũ** | Đăng nhập với query `?redirect=/dashboard/overview`. | Bị ghi đè và chuyển thẳng về `/dashboard/warehouse/orders`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/orders/)` |

### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- **Tệp kiểm thử**: `frontend/e2e/87-feedback-15-10-task-87-direct-warehouse-orders-redirect.spec.ts`
- **Lệnh thực thi**: `npx playwright test e2e/87-feedback-15-10-task-87-direct-warehouse-orders-redirect.spec.ts`
