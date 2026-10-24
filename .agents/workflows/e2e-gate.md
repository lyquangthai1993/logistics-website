---
description: Kích hoạt quy trình kiểm thử 2 tầng (Local E2E -> Cloud Dev Gate) và ghi nhận nhật ký nghiệm thu TMS
---

Bạn là **QA & E2E Verification Lead** của hệ thống Logistics TMS (Spider Express). Hãy thực hiện quy trình kiểm định chất lượng 2 tầng nghiêm ngặt (2-Tier Quality Gate) theo đúng quy chuẩn `RULE-ZERO-PREMATURE-REPORTING-01` trong `AGENTS.md`:

### Giai đoạn 0: Kiểm tra trạng thái Git & Tracking
1. Chạy tracking 3 repo để xác định nhánh hiện tại và tình trạng working tree:
   ```bash
   git status -sb; git -C backend status -sb; git -C frontend status -sb
   git branch -vv; git -C backend branch -vv; git -C frontend branch -vv
   ```
2. Đảm bảo nhánh làm việc xuất phát từ `dev`. Nếu có thay đổi chưa commit, lập danh sách file thay đổi trước khi chạy test.

---

### ⚡ Quy chuẩn Tìm Nhanh Mã Chuyến Xe (`TRIP` / `SD...`) trên Bảng Phân Trang (Zero-Stuck Pagination Protocol)

Khi bắt đầu test trên các màn hình danh sách của hệ thống (`/dashboard/warehouse/inbound`, `/dashboard/warehouse/outbound`, `/dashboard/warehouse/orders`, `/dashboard/trips`), dữ liệu luôn được **phân trang (`10–20 dòng/trang`)** và ưu tiên sắp xếp chuyến `PENDING` (`Đang đến` / `Chờ xuất`) lên trước chuyến `COMPLETED` (`Đã hoàn tất`). Do đó, mã `TRIP` cần tìm (ví dụ `SD365`, `SD328`, `SD49`) thường nằm ở **Trang 2, 3, 4...** chứ không nằm ở Trang 1.

Để **tìm mã TRIP cực nhanh (< 1 giây)** và **TUYỆT ĐỐI KHÔNG bị stuck/timeout ở Trang 1**:

1. **Ưu tiên dùng Helper Tìm Nhanh có sẵn trong `frontend/e2e/helpers/auth.ts`**:
   ```typescript
   import {
     loginAs,
     findTripFast,
     openTripFromPaginatedTable,
     findOrderInPaginatedTable,
     readTablePagination
   } from './helpers/auth';

   // Cách 1: Tìm nhanh mã TRIP và trả về Locator (tự động check Trang 1 -> Search + Enter -> Đọc "Trang X / Y" lật trang)
   const tripBtn = await findTripFast(page, 'SD365');
   await tripBtn.click();

   // Cách 2: Tìm nhanh mã TRIP, click mở trực tiếp Modal chi tiết và đợi dialog hiển thị
   const dialog = await openTripFromPaginatedTable(page, 'SD365');
   ```
2. **Quy tắc 4 Bước khi tìm mã TRIP trên UI có Pagination**:
   - **Bước 1 — Kiểm tra nhanh Trang 1 & Đọc thanh Pagination phía dưới bảng (`Trang X / Y`)**:
     + Chờ bảng tải xong (`tbody tr` hiển thị, spinner `.animate-spin` biến mất).
     + Nếu không thấy mã `TRIP` trên Trang 1, **nhìn ngay xuống thanh pagination phía dưới bảng** (`Trang X / Y` hoặc `Page X of Y`, tổng số `1–15 / N chuyến xe`) qua `await readTablePagination(page)` để biết bảng đang có bao nhiêu trang (`totalPages`) và có bao nhiêu bản ghi (`totalItems`).
   - **Bước 2 — Fast Path $O(1)$: Gõ ô Tìm kiếm + BẮT BUỘC bấm `Enter` (hoặc nút Kính lúp)**:
     + Điền mã `TRIP` vào `input[placeholder*="Tìm"]` rồi **phải gọi `await searchInput.press('Enter')`** (hoặc click `button[title="Nhấn để tìm kiếm"]`).
     + *Lưu ý cốt tử*: Chỉ gọi `.fill('SD365')` mà không bấm `Enter` sẽ **KHÔNG** kích hoạt state `appliedSearch` gọi API lọc dữ liệu!
   - **Bước 3 — Lật trang theo `Trang X / Y` ở dưới bảng (khi duyệt danh sách hoặc tìm chuyến thứ 2)**:
     + Nếu vừa tìm một chuyến trước đó (ví dụ tìm `SD365` xong chuyển sang tìm `SD328`), phải **xóa bộ lọc cũ** (`button[title="Xóa tìm kiếm"]` hoặc `fill('')` + `Enter`) và quay về `Trang đầu` (`button[title="Trang đầu"]`).
     + Đọc `totalPages` từ text `Trang X / Y` dưới đáy bảng, bấm `button[title="Trang sau"]` (`›`) duyệt tuần tự từ `Trang 1` đến `Trang Y` (tối đa `maxScanPages = 10` trang).
   - **Bước 4 — Mở rộng bộ lọc thời gian (`Tất cả`) nếu `totalItems === 0` hoặc `Trang 1 / 1` không có**:
     + Nếu thanh pagination dưới bảng báo chỉ có `Trang 1 / 1` mà không thấy mã `TRIP`, bấm ngay nút lọc thời gian `Tất cả` (thay vì mặc định `7 ngày` / `30 ngày`) hoặc kiểm tra lại đúng tài khoản Hub (`USER_WAREHOUSE_HCM`, `USER_WAREHOUSE_HYN`, `USER_WAREHOUSE_DAD`).

---

### Giai đoạn 1: Tầng 1 - Test Local First (Chốt chặn máy trạm)
1. **Kiểm tra máy chủ Local**:
   - Frontend Local: `http://localhost:4000`
   - Backend Local API: `http://localhost:4001/api/v1`
2. **Kích hoạt Playwright E2E Local**:
   - Nếu local server đang online, chạy Playwright trực tiếp trên máy trạm:
     ```bash
     $env:PLAYWRIGHT_BASE_URL="http://localhost:4000"
     $env:API_URL="http://localhost:4001/api/v1"
     npx playwright test frontend/e2e/<suite-can-test>.spec.ts --project=chromium
     ```
3. **Cơ chế Autonomous Local Self-Healing (Tối đa 3 lần retry)**:
   - Nếu có lỗi test thất bại, phân tích Root Cause Analysis (RCA) tại chỗ:
     + **Lỗi không tìm thấy mã TRIP / Đơn hàng do phân trang**: Thay thế ngay các lệnh `page.locator('text=SD...').click()` trần bằng `await findTripFast(page, tripCode)` hoặc `await openTripFromPaginatedTable(page, tripCode)` để tự động kiểm tra thanh pagination `Trang X / Y` phía dưới bảng và tìm bằng `Enter`.
     + Lỗi UI/DOM / timing selector -> Tinh chỉnh test selector hoặc thêm wait assertion.
     + Lỗi dữ liệu Hub / Scoping -> Đối soát tài khoản đăng nhập (`USER_WAREHOUSE_HCM`, `USER_DISPATCHER`,...).
     + Lỗi API / DTO backend -> Sửa mã nguồn trực tiếp trong submodule tương ứng.
   - Sửa và chạy lại test ngay tại máy trạm.
   - **LƯU Ý CỐT TỬ**: Nếu sau 3 lần retry local vẫn thất bại, DỪNG LẠI và báo cáo lỗi, TUYỆT ĐỐI KHÔNG commit/push code lỗi lên Cloud.

---

### Giai đoạn 2: Tầng 2 - Cloud Dev Quality Gate (Railway Primary)
1. **Commit & Push Submodules**:
   - Sau khi Tầng 1 PASS 100%, commit trực tiếp bên trong submodule (`backend/` và/hoặc `frontend/`), sau đó commit cập nhật pointer ở repo `root`.
   - Push lên nhánh `dev`:
     ```bash
     git -C backend push origin <branch-name>
     git -C frontend push origin <branch-name>
     ```
2. **Health Check Cloud Dev Deployment**:
   - Chờ Railway Cloud triển khai xong branch `dev`.
   - Kiểm tra Backend Dev Health Check (sử dụng bounded timeout chống treo):
     ```bash
     curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health
     ```
   - Kiểm tra Frontend Dev Health Check:
     ```bash
     curl.exe -m 15 -i https://frontend-tms-core-dev.up.railway.app
     ```
3. **Chạy Playwright E2E Suite trên Cloud Dev**:
   - Chạy kiểm thử trên Domain Dev của Railway:
     ```bash
     $env:PLAYWRIGHT_BASE_URL="https://frontend-tms-core-dev.up.railway.app"
     $env:API_URL="https://backend-tms-core-dev.up.railway.app/api/v1"
     npx playwright test frontend/e2e/<suite>.spec.ts --project=chromium
     ```
   - Hỗ trợ retry tối đa 3 lần nếu gặp network race condition.

---

### Giai đoạn 3: Đánh giá chéo (Cross-Evaluation Audit)
1. Chạy auditor script để chấm điểm chất lượng test:
   ```bash
   node scripts/e2e-auditor.mjs
   ```
2. Tiêu chuẩn đạt: Điểm $\ge$ 40/50, 0 lỗi Auto-FAIL (không timeout mù `waitForTimeout`, không `networkidle`, có assertion dữ liệu thực tế).

---

### Giai đoạn 4: Chụp bằng chứng Visual Evidence & Ghi nhận Ledger
1. **Visual Screenshot**:
   - Bắt buộc kiểm tra ảnh chụp màn hình nghiệm thu (`test-results/` hoặc `feedbacks/` dạng `screenshot_*_verified.png`).
   - Đảm bảo tuân thủ nguyên tắc **Non-Empty Visual Evidence Gate**: Bảng dữ liệu phải có ít nhất 1 dòng, không chụp bảng rỗng.
2. **Cập nhật Biên niên sử hệ thống (System Timeline)**:
   - Chạy lệnh ghi nhận tự động:
     ```bash
     npm run todo:record <task-folder>
     ```
   - Cập nhật `RESOLUTION.md` và đồng bộ vào `docs/SYSTEM_TIMELINE.md`.

---

### Báo cáo kết quả
Xuất báo cáo nghiệm thu theo định dạng thẻ ngắn gọn:
- **Tầng 1 (Local E2E)**: [PASS / SKIPPED] (Số bài test, thời gian)
- **Tầng 2 (Cloud Dev)**: [PASS] (Domain: `frontend-tms-core-dev.up.railway.app`)
- **Điểm Audit**: [Score/50]
- **Bằng chứng ảnh**: Đường dẫn file screenshot
- **Commit SHA**: Hash commit tại backend/frontend/root
