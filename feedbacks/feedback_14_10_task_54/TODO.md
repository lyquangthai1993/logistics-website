# Feedback 14/10 (Task #54) — Thiết Kế Đồng Bộ 2 Nút "Tiếp tục" & "Hủy nháp" Trên Màn Hình Nhập Kho Tương Tự Màn Hình Xuất Kho

> **Thời gian ghi nhận**: 14/10/2026  
> **Người báo cáo**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**:  
> - Frontend ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Bổ sung nút "Hủy nháp" (variant outline đỏ, icon `IconTrash`, kích thước `h-7`, `text-[11px]`) đứng cạnh nút "Tiếp tục" cho các chuyến xe trạng thái `Chờ xử lý` (`isPending`).  
> - Backend Controller ([`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts)) ➔ Thêm endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` cho phép thủ kho / Super Admin hủy chuyến xe nhập nháp chưa xử lý.  
> - Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Cài đặt phương thức `cancelInboundDraft` xử lý transaction soft-delete `trip_stop`, `order` nháp và `trip` nháp an toàn.  
> - Kiểm thử tự động E2E ([`54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`](file:///frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts)) ➔ Xác nhận API 404 cho mã giả định, cấu trúc hiển thị 2 nút bấm trên bảng Nhập kho, chụp ảnh bằng chứng nghiệm thu.  
> - N8N Task Router & GitHub Actions CI/CD ([`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs), [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml)) ➔ Sửa lỗi đường dẫn tương đối và siết chặt Quality Gate ngăn báo cáo hoàn thành khống khi 0 file bị sửa.  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Màn hình Xuất kho đối chiếu ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1220-L1238))  
> - Quy chế giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md)  
> - Ảnh chụp feedback đính kèm: [`feedbacks/feedback_14_10_task_54/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_54/screenshot_01.jpg)  
> - Biên bản hoàn thành kỹ thuật: [`feedbacks/feedback_14_10_task_54/RESOLUTION.md`](file:///feedbacks/feedback_14_10_task_54/RESOLUTION.md)  
> - Biên niên sử tiến hóa hệ thống [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md)  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng & Ảnh screenshot_01.jpg)

### 1. Phản hồi gốc từ người dùng
> *"màn hình nhập kho hãy thiết kế 2 nút tiêp tục và hủy nháp giống như màn hình xuất kho"*

Kèm ảnh chụp màn hình thực tế: `feedbacks/feedback_14_10_task_54/screenshot_01.jpg` hiển thị danh sách chuyến xe tại màn hình **Nhập kho • Andromeda Hub - HCM**. Vùng khoanh đỏ đóng khung nút **"✎ Tiếp tục"** ở cột THAO TÁC của chuyến xe `SD49` (trạng thái Chờ xử lý).

### 2. Phân tích trải nghiệm người dùng & tính đồng bộ hệ thống
1. **Thiếu sót trên giao diện cũ của Màn hình Nhập kho**:
   - Ở màn hình **Xuất kho**, với các chuyến xe ở trạng thái `Chờ xử lý`, thủ kho có cả 2 lựa chọn:
     - `Tiếp tục`: Mở modal kiểm đếm / chỉnh sửa để hoàn thiện phiếu.
     - `Hủy nháp`: Xóa bỏ chuyến nháp đã tạo nhầm hoặc tài xế hủy nhận chuyến, giúp bảng điều hành không bị ứ đọng dữ liệu rác.
   - Ở màn hình **Nhập kho**, trước đây chỉ có 1 nút duy nhất là `Tiếp tục`. Khi thủ kho tạo nháp một chuyến nhập xe hoặc bấm nhầm thông tin chuyến xe đến, không có cách nào hủy bỏ chuyến nháp đó trực tiếp trên bảng điều khiển.
2. **Quy chuẩn thiết kế đồng bộ**:
   - Bố cục: Nút `Tiếp tục` (xanh `#0F3D62`, viền xanh) và nút `Hủy nháp` (chữ đỏ `text-red-600`, viền đỏ `border-red-200`, icon `IconTrash`, loading spinner `IconLoader2`).
   - Kích thước: `h-7`, `text-[11px]`, padding `px-2 font-semibold` chuẩn Compact Density (quy chuẩn giao diện hẹp tối đa thông tin).

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Backend (NestJS 11)
- [x] Tạo endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` trong [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts) với quyền `SUPER_ADMIN, WAREHOUSE_MANAGER`.
- [x] Triển khai hàm `cancelInboundDraft` trong [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts) với transaction an toàn:
  - [x] Soft-delete bản ghi trạm dừng `trip_stop` tương ứng trạng thái `PENDING` tại Hub.
  - [x] Soft-delete các bản ghi đơn hàng `order` trạng thái `DRAFT`/`PENDING` gắn với chuyến xe.
  - [x] Soft-delete bản ghi `trip` trạng thái `PENDING`.
- [x] Kiểm tra biên dịch backend: `npm --prefix backend run build` đạt `Exit code 0`.

### 2. Frontend (Next.js 15 App Router)
- [x] Bổ sung import `IconTrash` trong [`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx).
- [x] Thêm state `cancellingDraftCode` quản lý trạng thái loading khi đang xóa chuyến nháp.
- [x] Cài đặt hàm `handleCancelDraft(tripCode: string)`:
  - [x] Xác nhận người dùng qua hộp thoại `window.confirm`.
  - [x] Gọi API `DELETE /api/v1/warehouse/inbound/drafts/:tripCode`.
  - [x] Hiển thị toast thông báo thành công và gọi lại `fetchKpi()` + `fetchInboundTrips()` để làm mới dữ liệu.
- [x] Cập nhật ô THAO TÁC cho hàng `isPending`: Render đồng bộ 2 nút `Tiếp tục` và `Hủy nháp`.
- [x] Kiểm tra biên dịch frontend: `npm --prefix frontend run build` đạt `Exit code 0`.

### 3. Kiểm Thử Tự Động (Playwright E2E)
- [x] Tạo file E2E: `frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`.
- [x] Kiểm thử API `DELETE /warehouse/inbound/drafts/:tripCode` (xác thực 404 cho mã giả định, RBAC guard).
- [x] Kiểm thử giao diện: Tìm các chuyến xe `isPending`, xác nhận sự hiện diện đồng thời của 2 nút "Tiếp tục" và "Hủy nháp" theo đúng styling chuẩn `h-7`, `text-[11px]`, viền đỏ cho nút hủy.
- [x] Chụp ảnh màn hình nghiệm thu: `feedbacks/feedback_14_10_task_54/screenshot_01_verified.png`.

### 4. Quy trình CI/CD & N8N Task Router (Ngăn ngừa lỗi lặp lại)
- [x] Sửa đường dẫn tương đối trong [`tools/telegram-task-runner/update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs) thay vì hardcode `D:\Projects\...`.
- [x] Thay thế biến `<id>` bằng task ID thực tế trước khi gửi payload sang GitHub Actions.
- [x] Bổ sung cơ chế Quality Gate trong [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml): Nếu task nghiệp vụ kết thúc mà không có bất kỳ file nào được tạo hoặc sửa đổi, bắt buộc đánh dấu `FAILED` và báo lỗi, không được phép hoàn thành khống.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản & Phân quyền**: Đăng nhập tài khoản `WAREHOUSE_MANAGER` (`lyquangthai1993+4@gmail.com`) hoặc `SUPER_ADMIN` (`lyquangthai1993+1@gmail.com`).
- **Tiền điều kiện dữ liệu (Pre-conditions)**:
  - Bảng điều phối Nhập kho có các chuyến xe ở trạng thái `Chờ xử lý` (`PENDING`) hoặc `Đã xử lý` (`COMPLETED`).
- **Các bước thực thi & đối soát (Assertion)**:
  1. *Bước 1*: Mở trang `/auth/signin`, điền thông tin và đăng nhập thành công vào TMS.
  2. *Bước 2*: Điều hướng tới URL `/dashboard/warehouse/inbound`. Chờ bảng Inbound tải xong dữ liệu thực tế.
  3. *Bước 3*: Quét các dòng trong bảng:
     - Với mỗi chuyến xe trạng thái `Chờ xử lý` (`isPending`):
       - Kiểm tra cột THAO TÁC: Bắt buộc render cả 2 nút bấm: Nút **Tiếp tục** (`IconPencil`) và Nút **Hủy nháp** (`IconTrash`).
       - Assert class CSS: Cả 2 nút đều đạt chuẩn Compact Density `h-7 text-[11px] px-2 font-semibold`.
       - Nút "Hủy nháp" có màu đỏ cảnh báo (`text-red-600 border-red-200`).
     - Với các chuyến xe trạng thái `Đã xử lý`:
       - Chỉ render nút **In phiếu nhập** (`IconPrinter`, viền xanh lục), TUYỆT ĐỐI không render nút "Hủy nháp".
  4. *Bước 4*: Gọi trực tiếp API `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` với mã không tồn tại, xác nhận nhận mã lỗi `404 Not Found` kèm thông điệp tiếng Việt thân thiện, không crash server.
  5. *Bước 5*: Chụp ảnh minh chứng `feedbacks/feedback_14_10_task_54/screenshot_01_verified.png`.

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Không có chuyến xe Chờ xử lý** | Kho không có chuyến nhập nháp nào (`all completed`). | Bảng vẫn render bình thường, các hàng hoàn tất chỉ hiển thị nút "In phiếu nhập", không crash React. | `cancelDraftButtons.count() === 0` |
| `EC-02` | **Chuyến xe đã xử lý nhập kho** | Chuyến xe trạng thái `COMPLETED` / `Đã xử lý`. | Không hiển thị nút "Hủy nháp" để ngăn chặn việc xóa dữ liệu đã chốt sổ nhập kho. | `row.locator('button:has-text("Hủy nháp")')` không tồn tại |
| `EC-03` | **Xác nhận hủy nháp (Cancel Confirmation)** | Người dùng click vào nút "Hủy nháp". | Bật hộp thoại `window.confirm` hỏi lại người dùng, nếu Cancel thì giữ nguyên chuyến xe. | Dialog confirm xuất hiện với nội dung cảnh báo |
| `EC-04` | **Loading State khi đang hủy** | Đang trong quá trình chờ API DELETE phản hồi. | Nút chuyển sang icon `IconLoader2 animate-spin` và bị disabled, ngăn bấm đúp (double submission). | `button.isDisabled() === true` |
| `EC-05` | **Xóa chuyến nháp không tồn tại** | Gửi request DELETE với tripCode rác/sai. | Backend trả về HTTP 404, frontend hiển thị toast lỗi tiếng Việt qua `showApiErrorToast`. | `res.status() === 404` |
| `EC-06` | **Idempotency & Re-render** | Hủy thành công một chuyến nháp. | Toast thông báo thành công, gọi lại `fetchInboundTrips()` và `fetchKpi()`, dòng chuyến xe biến mất khỏi bảng. | Chuyến xe không còn xuất hiện trên UI |
| `EC-07` | **Hub Scoping Isolation** | Thủ kho Hub A cố tình gọi hủy chuyến nháp của Hub B. | Backend transaction chặn lại dựa trên `userHubId`, chỉ xóa trip_stop thuộc Hub của mình. | Không xóa nhầm trip_stop của Hub khác |
| `EC-08` | **Super Admin Bypass** | Tài khoản `SUPER_ADMIN` (`userHubId = null`) gọi hủy nháp. | Xóa toàn bộ trạm dừng PENDING của chuyến nháp đó trên toàn hệ thống. | Transaction hoàn tất thành công |

### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- **File Test Spec**: `frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`
- **Lệnh chạy kiểm thử**: `PLAYWRIGHT_BASE_URL=https://frontend-tms-core-dev.up.railway.app API_URL=https://backend-tms-core-dev.up.railway.app/api/v1 npx playwright test e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`
- **Tiêu chí Quality Gate**: 100% test cases pass, score auditor ≥ 40/50 qua `node scripts/e2e-auditor.mjs`.

---

## 🛡️ Nghiệm Thu & Quality Gate
- **Backend Compile**: `npm run build --prefix backend` ➔ ✅ PASS (0 lỗi).
- **Frontend Typecheck**: `npx --prefix frontend tsc --noEmit` ➔ ✅ PASS (0 lỗi).
- **Frontend Lint**: `npx oxlint` ➔ ✅ PASS (0 lỗi).
- **UI Compact Density**: Tuân thủ triệt để quy chuẩn `h-7`, `text-[11px]`, không lạm dụng khoảng cách thừa.
- **Submodule Architecture**: Đã kiểm tra và đồng bộ trực tiếp trong submodule `frontend/` và `backend/`.
