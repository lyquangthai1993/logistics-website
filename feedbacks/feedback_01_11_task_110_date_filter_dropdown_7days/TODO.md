# 📋 TODO: Chuẩn Hóa Bộ Lọc Ngày Nhập Kho & Xuất Kho Thành Dropdown Thu Gọn & Mặc Định 7 Ngày Gần Nhất (Task #110)

> **Mã công việc**: `TASK-110-DATE-FILTER-DROPDOWN-7DAYS`  
> **Phân hệ**: `Kho bãi (Warehouse) - Nhập kho (/dashboard/warehouse/inbound) & Xuất kho (/dashboard/warehouse/outbound)`  
> **Chỉ đạo kiến trúc**: `/leader` & `/todo-agent` (Quy trình chuẩn 6 bước SDLC: `PLAN ➔ DESIGN ➔ BUILD ➔ TEST ➔ DEPLOY ➔ MAINTAIN`)  
> **Kiểm thử**: `/e2e-test-runner` & `/e2e-code-auditor` (Chế độ Kiểm thử 2 Tầng: Localhost Gate 1 ➔ Railway Cloud Dev Gate 2)  
> **Nhánh Git dự kiến**: `feat/task-110-warehouse-date-filter-dropdown-7days` (Base từ `dev`)  

---

## 📌 1. Bối Cảnh Vận Hành & Yêu Cầu Thực Tế (Operational Context & User Quotes)

1. **Nguyên văn yêu cầu từ người dùng (User Quote)**:
   > *"trong inbound và outbound, filter default lại là 7 ngày gần nhất (bao gồm ngày hôm nay)*  
   > *cái lọc ngày này nên để 1 dropdown, khi cần thì mới mở ra*  
   > */todo-agent và /leader thực hiện nhé"*

2. **Đối tượng tác nghiệp & Nỗi đau vận hành kho bãi (Warehouse Pain Points)**:
   - **Đối tượng sử dụng**: Thủ kho (`WAREHOUSE_MANAGER` tại `Andromeda Hub - HCM`, `Polaris Hub - Hưng Yên`, `Magellan Hub - Đà Nẵng`) và Quản trị viên hệ thống (`SUPER_ADMIN`).
   - **Bất cập hiện tại**:
     1. **Khoảng thời gian mặc định từ đầu tháng (`YYYY-MM-01` đến hôm nay) quá rộng về cuối tháng**: Khi về cuối tháng (25–31 ngày), bảng Nhập kho và Xuất kho phải tải hàng trăm chuyến xe lịch sử của cả tháng trong khi thủ kho thực tế chỉ cần theo dõi và xử lý các chuyến xe trong **7 ngày gần nhất (bao gồm ngày hôm nay)**. Ngược lại, vào ngày mùng 1 đầu tháng (ví dụ `01/11/2026`), mặc định đầu tháng chỉ lấy đúng 1 ngày (`01/11` đến `01/11`), làm ẩn mất các chuyến xe của 6 ngày cuối tháng trước (`26/10` – `31/10`) đang chờ xử lý!
     2. **Cụm lọc ngày hiển thị cố định chiếm nhiều diện tích ngang**: Cụm `Từ: [input] đến: [input] [Áp dụng] [Đặt lại]` luôn phơi bày trên thanh Toolbar ở cả màn hình Nhập kho và Xuất kho, chiếm ~340px chiều ngang, làm chật không gian của ô Tìm kiếm (`Search Box`) và các Tab trạng thái (`Tất cả`, `Chờ xử lý`, `Đã xử lý`), trong khi thủ kho chỉ thỉnh thoảng mới cần mở bộ lọc ngày để tra cứu lịch sử.

3. **Giải pháp chuẩn hóa nghiệp vụ**:
   - **Mặc định 7 ngày gần nhất (bao gồm ngày hôm nay)**:
     - `toDate` = ngày hôm nay (`today`, định dạng `YYYY-MM-DD`).
     - `fromDate` = lùi 6 ngày tính từ hôm nay (`today - 6 days`, định dạng `YYYY-MM-DD`). Tổng số ngày bao gồm cả `fromDate` và `toDate` đúng bằng **7 ngày lịch liên tiếp** (ví dụ hôm nay `01/11/2026` ➔ mặc định từ `26/10/2026` đến `01/11/2026`).
   - **Thu gọn bộ lọc ngày vào Dropdown (`Popover`)**:
     - Trên thanh Toolbar của cả **Nhập kho** (`/dashboard/warehouse/inbound`) và **Xuất kho** (`/dashboard/warehouse/outbound`), thay thế cụm input ngày trải ngang bằng **1 nút Dropdown gọn gàng** (`Bộ lọc ngày` / `7 ngày gần nhất (dd/mm - dd/mm)` hoặc `dd/mm/yyyy – dd/mm/yyyy`).
     - Chỉ khi người dùng nhấp vào nút Dropdown thì khung chọn ngày (`Từ ngày`, `Đến ngày`, các nút chọn nhanh `7 ngày gần nhất`, `Hôm nay`, `Tháng này`, cùng nút `Áp dụng` và `Đặt lại`) mới mở ra.

---

## 🖼️ 2. Multimodal OCR & Khớp Tài Khoản Kiểm Thử Theo Hub (Hub-Scoped Account Selection)

- **Phân hệ áp dụng**: Màn hình Nhập kho (`/dashboard/warehouse/inbound`) & Xuất kho (`/dashboard/warehouse/outbound`).
- **Hub kiểm thử chuẩn**: `Andromeda Hub - HCM` (kho có lưu lượng chuyến xe thực tế cao nhất trên PostgreSQL Dev & Prod).
- **Tài khoản kiểm thử bắt buộc (`frontend/e2e/helpers/auth.ts`)**:
  - `USER_WAREHOUSE_HCM` (`warehouse_hcm` / `123456`) — Thủ kho Andromeda Hub - HCM.
  - Kết hợp kiểm chứng đa vai trò với `USER_ADMIN` (`admin`).

---

## 🔍 3. Phân Tích Nguyên Nhân Kỹ Thuật (Technical Root Cause Analysis - RCA)

1. **Tại `frontend/src/app/dashboard/warehouse/inbound/page.tsx` (Dòng 99–140 & 1040–1088)**:
   - Hàm `getDefaultFromDate()` đang tính ngày đầu tháng:
     ```ts
     const d = new Date();
     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
     ```
   - Hàm `handleResetDateRange()` cũng đặt lại `defFrom` về ngày `-01` của tháng hiện tại.
   - Phần JSX dòng `1040–1088` đang render trực tiếp 2 thẻ `<input type="date" />` và nút `<Button>Áp dụng</Button>` nằm cố định trên thanh công cụ thay vì đặt trong `Popover` dropdown.

2. **Tại `frontend/src/app/dashboard/warehouse/outbound/page.tsx` (Dòng 149–190 & 1272–1320)**:
   - Hàm `getDefaultFromDate()` và `handleResetDateRange()` tương tự đang tính ngày đầu tháng (`-01`).
   - Phần JSX dòng `1272–1320` cũng đang render trực tiếp 2 thẻ `<input type="date" />` và nút `<Button>Áp dụng</Button>` cố định trên thanh công cụ.

---

## ✅ 4. Danh Sách Đầu Việc Nguyên Tử (Atomic Task Checklist)

### 👤 Stage 1 & 2: PLAN (PM) & DESIGN (Architect)
- [x] **Task 1 (PM - Đặc tả `TODO.md`)**: Thiết lập tài liệu tại `feedbacks/feedback_01_11_task_110_date_filter_dropdown_7days/TODO.md` với đầy đủ RCA, kịch bản E2E từng bước và ma trận 10 Edge Cases.
- [x] **Task 2 (Architect - Thiết kế Dropdown Lọc Ngày & Compact Density)**: Thiết kế nút Trigger Dropdown (`PopoverTrigger`) chiều cao `h-8`, hiển thị icon lịch (`IconCalendar`), nhãn tóm tắt khoảng ngày đang áp dụng (`7 ngày gần nhất` kèm `dd/mm – dd/mm` khi ở mặc định, hoặc `dd/mm/yyyy – dd/mm/yyyy` khi tùy chỉnh) và icon mũi tên (`IconChevronDown`); thiết kế nội dung `PopoverContent` tuân thủ **UI Compact Density Mandate** (`p-2`, `space-y-2`, `gap-1.5`).

### 👤 Stage 3: BUILD (Engineer)
- [x] **Task 3 (Engineer - Khởi tạo nhánh Git trên Submodule)**: Chạy `npm run repo:status` và `npm run repo:tracking`, tạo nhánh `feat/task-110-warehouse-date-filter-dropdown-7days` từ `dev` trong submodule `frontend`.
- [x] **Task 4 (Engineer - Cập nhật Màn hình Nhập kho `frontend/src/app/dashboard/warehouse/inbound/page.tsx`)**: Cập nhật `getDefaultFromDate()` và `handleResetDateRange()` về **7 ngày gần nhất (bao gồm ngày hôm nay)**: `today - 6 days` đến `today` (ưu tiên `URLSearchParams` nếu có) và chuyển đổi cụm lọc ngày trên Toolbar sang `Popover` dropdown thu gọn.
- [x] **Task 5 (Engineer - Cập nhật Màn hình Xuất kho `frontend/src/app/dashboard/warehouse/outbound/page.tsx`)**: Cập nhật `getDefaultFromDate()` và `handleResetDateRange()` về **7 ngày gần nhất (bao gồm ngày hôm nay)**: `today - 6 days` đến `today` (ưu tiên `URLSearchParams` nếu có) và chuyển đổi cụm lọc ngày trên Toolbar sang `Popover` dropdown đồng bộ 100% với màn hình Nhập kho.
- [x] **Task 6 (Engineer - Đồng bộ các bài test E2E liên quan & Kiểm tra biên dịch)**: Cập nhật `frontend/e2e/101-mobile-responsive-warehouse-boards.spec.ts` và `frontend/e2e/102-inbound-tablet-filter-responsive.spec.ts` tương thích với nút Dropdown lọc ngày mới; chạy `npx --prefix frontend tsc --noEmit` và `npm run build --prefix frontend` đảm bảo 0 lỗi biên dịch.

### 👤 Stage 4: TEST (QA — Kiểm thử 2 Tầng)
- [x] **Task 7 (QA - Viết & Chạy E2E Test Tầng 1 trên Localhost)**: Xây dựng và thực thi file test `frontend/e2e/103-warehouse-date-filter-dropdown-7days.spec.ts` kiểm chứng mặc định 7 ngày gần nhất, hành vi đóng/mở Dropdown lọc ngày, chọn khoảng ngày mới & bấm Áp dụng / Đặt lại trên cả Inbound & Outbound; chạy `node scripts/e2e-auditor.mjs frontend/e2e/103-warehouse-date-filter-dropdown-7days.spec.ts` đạt >= 40/50 điểm.

### 👤 Stage 5 & 6: DEPLOY (Release) & MAINTAIN (Vận hành)
- [x] **Task 8 (Release - Commit, Push, Tạo & Merge PR lên `dev`)**: Commit code trong submodule `frontend`, push nhánh, tạo PR vào `dev` kèm bằng chứng Tầng 1 Local E2E PASS, và merge PR.
- [x] **Task 9 (QA - Chạy E2E Test Tầng 2 trên Railway Cloud Dev)**: Chờ Railway Cloud Dev (`https://frontend-tms-core-dev.up.railway.app`) cập nhật bản mới (`HTTP 200`), chạy lại `frontend/e2e/103-warehouse-date-filter-dropdown-7days.spec.ts` trực tiếp trên môi trường Dev và chụp ảnh bằng chứng `feedbacks/feedback_01_11_task_110_date_filter_dropdown_7days/screenshot_01_verified.png`.
- [x] **Task 10 (Vận hành - Ghi nhận Biên niên sử `docs/SYSTEM_TIMELINE.md`)**: Đánh dấu hoàn tất `[x]` toàn bộ checklist, chạy `npm run todo:record feedback_01_11_task_110_date_filter_dropdown_7days` để sinh `RESOLUTION.md` và cập nhật `docs/SYSTEM_TIMELINE.md`.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### Phần 1: Chuỗi Hành Động Kiểm Thử E2E Từng Bước (Step-by-Step E2E Action Sequence)

1. **Đăng nhập & Khởi tạo**:
   - Sử dụng `loginAs(page, USER_WAREHOUSE_HCM)` (`warehouse_hcm` — `Andromeda Hub - HCM`).
2. **Kiểm chứng Màn hình Nhập kho (`/dashboard/warehouse/inbound`)**:
   - Lắng nghe request `GET /api/v1/warehouse/inbound-trips` khi tải trang.
   - Kiểm tra query params `fromDate` và `toDate` của request đầu tiên:
     - `toDate` === ngày hôm nay (`YYYY-MM-DD`).
     - `fromDate` === `today - 6 days` (`YYYY-MM-DD`), tức trọn vẹn 7 ngày gần nhất bao gồm hôm nay.
   - Khẳng định nút Dropdown lọc ngày (`[data-testid="date-filter-dropdown-trigger"]`) hiển thị rõ ràng với nhãn `7 ngày gần nhất`, trong khi ô `input[aria-label="Từ ngày"]` đang ở trạng thái ẩn (`toBeHidden()`).
   - Nhấp vào nút Dropdown lọc ngày ➔ Khẳng định Popover mở ra, `input[aria-label="Từ ngày"]` và `input[aria-label="Đến ngày"]` hiển thị (`toBeVisible()`) và có giá trị đúng bằng `expectedFromDate` và `expectedToDate`.
   - Thay đổi `Từ ngày` sang khoảng rộng hơn (ví dụ 30 ngày gần nhất) để bao phủ toàn bộ dữ liệu chuyến xe lịch sử trên kho HCM, sau đó nhấn nút `Áp dụng`.
   - Khẳng định Popover tự động đóng lại (`input[aria-label="Từ ngày"]` ẩn đi), API `/api/v1/warehouse/inbound-trips` được gọi lại với `fromDate` mới, và bảng dữ liệu hiển thị các dòng chuyến xe thực tế (`expect(rowCount).toBeGreaterThan(0)`).
   - Mở lại Dropdown lọc ngày và nhấn `Đặt lại` ➔ Khẳng định giá trị quay về đúng 7 ngày gần nhất.
3. **Kiểm chứng Màn hình Xuất kho (`/dashboard/warehouse/outbound`)**:
   - Điều hướng tới `/dashboard/warehouse/outbound` và lắng nghe request `GET /api/v1/warehouse/outbound-trips`.
   - Kiểm tra query params mặc định `fromDate` (`today - 6 days`) và `toDate` (`today`).
   - Kiểm tra nút Dropdown lọc ngày mặc định đóng (`input[aria-label="Từ ngày"]` ẩn).
   - Nhấp mở Dropdown lọc ngày, kiểm tra giá trị mặc định 7 ngày gần nhất, thử chọn khoảng ngày và nhấn `Áp dụng`, khẳng định Popover đóng lại và dữ liệu tải thành công.
4. **Chụp ảnh bằng chứng nghiệm thu**:
   - Mở Dropdown lọc ngày trên màn hình Nhập kho với dữ liệu bảng phía dưới (`expect(rowCount).toBeGreaterThan(0)`) và chụp ảnh lưu tại `feedbacks/feedback_01_11_task_110_date_filter_dropdown_7days/screenshot_01_verified.png`.

### Phần 2: Ma Trận 10 Ca Kiểm Thử Biên (10 Edge Cases Matrix)

| Mã Ca | Tên Tình Huống Biên | Đầu Vào / Thao Tác | Kết Quả Kỳ Vọng |
| :--- | :--- | :--- | :--- |
| **`EC-01`** | **Mặc định ngày đầu tháng (ví dụ 01/11/2026)** | Truy cập `/dashboard/warehouse/inbound` vào ngày 01/11/2026 | Hệ thống tự động lùi sang tháng trước (`fromDate = 2026-10-26`, `toDate = 2026-11-01`), đảm bảo đủ 7 ngày liên tiếp bao gồm hôm nay. |
| **`EC-02`** | **Ràng buộc `min` / `max` giữa Từ ngày & Đến ngày** | Mở Dropdown, chọn `Từ ngày` lớn hơn `Đến ngày` | Thuộc tính `max={toDate}` trên `Từ ngày` và `min={fromDate}` trên `Đến ngày` ngăn chọn khoảng ngày đảo ngược. |
| **`EC-03`** | **Cách ly theo Hub (`Hub Isolation`)** | Đăng nhập bằng `USER_WAREHOUSE_HCM` và lọc ngày | Chỉ trả về các chuyến xe thuộc `Andromeda Hub - HCM` trong khoảng ngày đã chọn. |
| **`EC-04`** | **Tính lũy đẳng khi bấm Áp dụng nhiều lần (`Idempotency`)** | Mở Dropdown và nhấn `Áp dụng` liên tiếp với cùng khoảng ngày | Không làm sai lệch bộ đếm tab (`Tất cả`, `Chờ xử lý`, `Đã xử lý`) hay nhân bản dòng dữ liệu. |
| **`EC-05`** | **Ưu tiên URL Search Params (`?fromDate=...&toDate=...`)** | Truy cập URL có sẵn `?fromDate=2026-10-15&toDate=2026-10-31` | Hệ thống ưu tiên khởi tạo theo URL params, hiển thị khoảng ngày tùy chỉnh trên nút Dropdown và cho phép bấm `Đặt lại` về 7 ngày gần nhất. |
| **`EC-06`** | **Kết hợp đồng thời Tìm kiếm từ khóa + Lọc ngày + Tab trạng thái** | Chọn khoảng ngày, chuyển sang tab `Chờ xử lý` và tìm kiếm mã chuyến `SD` | Cả 3 tham số (`search`, `status`, `fromDate`/`toDate`) được gửi đồng bộ lên API, phân trang tự động reset về `page = 1`. |
| **`EC-07`** | **Thao tác thay đổi ngày nhưng đóng Dropdown mà không bấm Áp dụng** | Mở Dropdown, sửa `fromDate` nhưng nhấn ra ngoài (chưa bấm `Áp dụng`) | `appliedFromDate` không bị thay đổi, không kích hoạt gọi API thừa cho đến khi người dùng thực sự nhấn `Áp dụng` (hoặc chọn preset nhanh). |
| **`EC-08`** | **Tương thích đa vai trò (`SUPER_ADMIN` vs `WAREHOUSE_MANAGER`)** | Đăng nhập bằng `admin` và `warehouse_hcm` | Cả 2 vai trò đều sử dụng được Dropdown lọc ngày mượt mà trên cả Inbound và Outbound. |
| **`EC-09`** | **Đáp ứng giao diện Mobile (390px) & Tablet (820px)** | Thu nhỏ màn hình về 390px và 820px | Nút Dropdown thu gọn giúp thanh Toolbar thông thoáng, không chồng chéo lên các Tab trạng thái; khi mở Popover không bị tràn khỏi màn hình. |
| **`EC-10`** | **Làm mới dữ liệu (`Làm mới` / `Cập nhật`) giữ nguyên khoảng ngày đã chọn** | Chọn khoảng ngày tùy chỉnh, bấm `Áp dụng`, sau đó bấm nút `Làm mới` trên Toolbar | Hệ thống tải lại danh sách chuyến xe nhưng vẫn giữ nguyên `appliedFromDate` và `appliedToDate` đang chọn. |

### Phần 3: Đường Dẫn File Test Playwright Mục Tiêu

- **Spec File**: `frontend/e2e/103-warehouse-date-filter-dropdown-7days.spec.ts`
- **Ảnh bằng chứng**: `feedbacks/feedback_01_11_task_110_date_filter_dropdown_7days/screenshot_01_verified.png`
