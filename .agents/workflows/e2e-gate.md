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
