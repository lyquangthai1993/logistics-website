# Feedback 15/10 (Task #88) — Chặn Tuyệt Đối '/dashboard/overview' & Tự Động Chuyển Hướng Đến Màn Hình Nhập Kho

> **Thời gian ghi nhận**: 15/10/2026  
> **Người báo cáo**: @Thai / Quản trị Vận hành TMS  
> **Mã Task Database**: `Task #88`  
> **Màn hình liên quan**:  
> - Chuyển hướng Dashboard Tổng quan ([`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx)) ➔ Chuyển hướng ngay đến Nhập kho (`/dashboard/warehouse/inbound`)  
> - Middleware Proxy ([`proxy.ts`](file:///frontend/src/proxy.ts))  
> - Cấu hình Next.js Redirects ([`next.config.ts`](file:///frontend/next.config.ts))  
> - Chi tiết đơn hàng quay lại ([`orders/[id]/page.tsx`](file:///frontend/src/app/dashboard/orders/[id]/page.tsx))  
> **Tài liệu tham chiếu**:  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md) (Zero Technical Jargon, Compact Density, Real DB Data)  
> - Kỹ năng Todo Agent ([`todo-agent/SKILL.md`](file:///.agents/skills/todo-agent/SKILL.md))  

---

## 📌 Bối cảnh nghiệp vụ & Phân tích nguyên nhân gốc rễ (RCA)

### 1. Bối cảnh nghiệp vụ thực tế
- Người dùng vận hành hệ thống Logistics TMS (Spider Express) yêu cầu:
  > *"chặn luôn nếu lỡ mà vào '/dashboard/overview' => chuyển ngay đến màn hình nhập kho"*
- Trước đó, việc đăng nhập thông thường đã được chuyển hướng thẳng vào màn hình Đơn hàng kho (`/dashboard/warehouse/orders`).
- Tuy nhiên, trong trường hợp người dùng lỡ bấm vào liên kết cũ, bookmark trình duyệt hoặc gõ trực tiếp URL `/dashboard/overview`, người dùng mong muốn hệ thống chặn tuyệt đối đường dẫn này và chuyển hướng ngay lập tức đến **Màn hình Nhập kho** (`/dashboard/warehouse/inbound`).

### 2. Phân tích nguyên nhân kỹ thuật (RCA)
- Trước đó ở Task #87, `/dashboard/overview` được chuyển tiếp về `/dashboard/warehouse/orders`.
- Cần cập nhật đa tầng (3-tier interception) từ Next.js redirects (`next.config.ts`), Next.js Middleware Proxy (`proxy.ts`), đến Server Component route handler (`overview/page.tsx`) để bảo đảm 100% các request (cả SSR, Client Navigation, Direct Browser URL bar, hoặc Edge Request) đến `/dashboard/overview` đều được chuyển ngay tức thì về `/dashboard/warehouse/inbound`.

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Phân Tích & Quản Trị Nhánh
- [x] Tạo nhánh `feature/task-88-redirect-overview-to-inbound` từ `dev` trên repository frontend và root.
- [x] Khởi tạo hồ sơ công việc `feedbacks/feedback_15_10_task_88/TODO.md`.

### 2. Triển Khai Mã Nguồn Điều Hướng (Frontend)
- [x] Cập nhật [`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx): Thiết lập `redirect('/dashboard/warehouse/inbound')`.
- [x] Cập nhật [`proxy.ts`](file:///frontend/src/proxy.ts): Chặn đường dẫn `/dashboard/overview` và chuyển ngay tức thì về `/dashboard/warehouse/inbound`.
- [x] Cập nhật [`next.config.ts`](file:///frontend/next.config.ts): Bổ sung `async redirects()` chuyển hướng `/dashboard/overview` về `/dashboard/warehouse/inbound`.
- [x] Cập nhật [`orders/[id]/page.tsx`](file:///frontend/src/app/dashboard/orders/[id]/page.tsx): Thay thế `router.push('/dashboard/overview')` thành `router.push('/dashboard/warehouse/inbound')`.

### 3. Kiểm Định & Xác Minh Chất Lượng
- [x] Kiểm tra lỗi kiểu TypeScript: `node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit` đạt 0 lỗi.
- [x] Biên dịch ứng dụng Next.js: `npm --prefix frontend run build` 34/34 routes pass.
- [x] Xây dựng test suite Playwright E2E chuyên biệt: `frontend/e2e/88-feedback-15-10-task-88-redirect-overview-to-inbound.spec.ts`.
- [x] Thực thi test suite E2E và ghi lại ảnh chụp màn hình bằng chứng thực tế: `feedbacks/feedback_15_10_task_88/screenshot_01_verified.png`.
- [x] Đánh giá chéo chất lượng test qua `node scripts/e2e-auditor.mjs` đạt điểm tối đa (50/50).

### 4. Báo Cáo & Biên Niên Sử Kỹ Thuật
- [x] Tạo tài liệu nghiệm thu kỹ thuật `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md` qua `npm run todo:record feedback_15_10_task_88`.
- [x] Merge nhánh tính năng vào `dev` và cập nhật báo cáo nghiệm thu mobile-first.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản kiểm thử**: `USER_WAREHOUSE_HCM` (username `warehouse_hcm`).
- **Các bước thực hiện**:
  1. Đăng nhập vào hệ thống TMS.
  2. Cố tình truy cập trực tiếp bằng URL tới `/dashboard/overview`.
  3. **Assertion 1**: Hệ thống chặn truy cập `/dashboard/overview` và chuyển ngay tức thì tới URL `/dashboard/warehouse/inbound`.
  4. **Assertion 2**: Trang hiển thị tiêu đề và nội dung màn hình Nhập kho ("Tiếp Nhận Xe Hàng & Nhập Kho" / "Nhập kho").
  5. Chụp ảnh màn hình nghiệm thu thực tế lưu vào `feedbacks/feedback_15_10_task_88/screenshot_01_verified.png`.

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Truy cập trực tiếp URL Overview** | Người dùng đã đăng nhập mở `/dashboard/overview`. | Chuyển ngay tức thì sang `/dashboard/warehouse/inbound`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/inbound/)` |
| `EC-02` | **Truy cập Overview có Trailing Slash** | Người dùng mở `/dashboard/overview/`. | Chuyển ngay tức thì sang `/dashboard/warehouse/inbound`. | `expect(page).toHaveURL(/.*\/dashboard\/warehouse\/inbound/)` |
| `EC-03` | **Hiển thị đúng màn hình Nhập kho** | Chuyển hướng hoàn tất. | Tiêu đề và giao diện Nhập kho hiển thị đầy đủ, không báo lỗi. | `expect(page.locator('main h1, h1')).toContainText(/Nhập kho/i)` |

### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- **Tệp kiểm thử**: `frontend/e2e/88-feedback-15-10-task-88-redirect-overview-to-inbound.spec.ts`
- **Lệnh thực thi**: `npx playwright test e2e/88-feedback-15-10-task-88-redirect-overview-to-inbound.spec.ts`
