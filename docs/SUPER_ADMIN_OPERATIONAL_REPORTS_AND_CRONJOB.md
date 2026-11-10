# 📊 TÀI LIỆU KIẾN TRÚC & NGHIỆP VỤ: BÁO CÁO VẬN HÀNH HUB, THEO DÕI MÃ TRIP THEO NGÀY & QUẢN TRỊ CRONJOB (SUPER ADMIN)

> **Cập nhật lần cuối**: `07/11/2026`  
> **Phân quyền truy cập (RBAC)**: Dành riêng cho `SUPER_ADMIN` (`RoleEnum.SUPER_ADMIN`)  
> **Trạng thái kiểm thử**: Playwright E2E `4/4 PASS (100%)` • E2E Code Auditor `50/50 (🟢 PASS)`

---

## 1. Quy tắc Nghiệp vụ Cốt lõi (Business Invariants)

### 1.1. Quy chuẩn Khung giờ Chốt sổ Hàng ngày (`18:00 D-1 → 18:00 D`)
- Báo cáo vận hành của một **ngày báo cáo `D`** (`YYYY-MM-DD`) **không** cắt theo `00:00 → 23:59`, mà tổng hợp chính xác theo ca vận hành kho bãi thực tế:
  $$\text{Window}(D) = [\text{18:00:00 ngày } (D - 1),\ \text{18:00:00 ngày } D) \quad (\text{Múi giờ } \text{Asia/Ho\_Chi\_Minh, GMT+7})$$
- **Ví dụ minh họa**:
  - Báo cáo cho ngày **`02/11/2026`** tổng hợp toàn bộ chuyến xe xác nhận từ **`18:00:00 (6:00 PM) ngày 01/11/2026`** đến **`18:00:00 (6:00 PM) ngày 02/11/2026`**.
- **Lý do nghiệp vụ**: Trong vận hành Cross-dock / Hub đường trục, ca tối hôm trước nối tiếp sang chiều hôm sau và khóa sổ lúc `18:00` để xe đường dài xuất bến chạy đêm.

### 1.2. Quy chuẩn Thời điểm Xác nhận Chuyến xe (`TRIP Confirmation Timestamp`)
- Một chuyến xe (`TRIP`) chỉ được tính vào kỳ báo cáo khi **đã bấm Xác nhận Nhập kho hoặc Xác nhận Xuất kho thực tế**.
- Mốc thời gian phân bổ chuyến xe vào ngày báo cáo `D` dựa tuyệt đối vào **thời điểm xác nhận giao dịch sổ cái kho** (`order_inventory_transaction.createdAt` của giao dịch `INBOUND` / `OUTBOUND` / `TRANSFER`), **tuyệt đối không** dựa vào thời gian khởi tạo lệnh hay thời gian lưu nháp chuyến xe (`trip.createdAt`).
- **Loại trừ tuyệt đối**:
  1. Các chuyến xe đang ở trạng thái nháp (`DRAFT` / chưa xác nhận nhập hoặc xuất).
  2. Các giao dịch đã bị xóa mềm hoặc hoàn tác (`deletedAt IS NOT NULL` khi Admin mở lại / rollback chuyến xe).

---

## 2. Kiến trúc Cơ sở dữ liệu & Backend (`backend/src/orders/`)

### 2.1. Các Bảng Dữ liệu (Database Entities & Migration)
Được khởi tạo trong migration [`1779200000000-CreateDailyHubOperationalReport.ts`](file:///d:/Projects/logistics-website/backend/src/database/migrations/1779200000000-CreateDailyHubOperationalReport.ts) và đồng bộ trong [`scripts/railway-db-sync.mjs`](file:///d:/Projects/logistics-website/scripts/railway-db-sync.mjs):

1. **`daily_hub_operational_report`** ([`daily-hub-operational-report.entity.ts`](file:///d:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/daily-hub-operational-report.entity.ts)):
   - Lưu trữ snapshot sản lượng đã chốt cho từng cặp `(reportDate, hubId)` (Unique Index `UQ_daily_hub_report_date_hub`).
   - Chỉ số lưu trữ:
     - **Chiều Nhập kho (`Inbound`)**: `inboundCbm`, `inboundWeightKg`, `inboundTripCount`, `inboundOrderCount`, `inboundPackageCount`.
     - **Chiều Xuất kho (`Outbound`)**: `outboundCbm`, `outboundWeightKg`, `outboundTripCount`, `outboundOrderCount`, `outboundPackageCount`.
     - **Metadata kiểm toán**: `windowStart`, `windowEnd`, `triggeredBy` (`CRON_SCHEDULED`, `MANUAL_RERUN`, `AUTO_SYNC`), `calculatedAt`.
2. **`cron_job_config`** ([`cron-job-config.entity.ts`](file:///d:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/cron-job-config.entity.ts)):
   - Lưu cấu hình lịch chạy tự động của tác vụ `DAILY_HUB_OPERATIONAL_REPORT`: `isEnabled`, `cronTime` (mặc định `18:05` GMT+7), `cutoffHour` (`18`), `notifySuperAdmins`, `lastRunAt`, `lastRunStatus`, `lastReportDate`.
3. **`cron_job_execution_log`** ([`cron-job-execution-log.entity.ts`](file:///d:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/cron-job-execution-log.entity.ts)):
   - Lưu nhật ký từng lượt thực thi Cronjob (cả tự động lẫn chạy lại thủ công): `targetDate`, `targetEndDate`, `windowLabel`, `triggeredBy`, `actorUserId`, `actorEmail`, `status` (`SUCCESS` / `FAILED`), `upsertedHubRows`, `durationMs`, `errorMessage`, `startedAt`, `finishedAt`.

### 2.2. Hệ thống REST API Endpoints ([`admin-reports.controller.ts`](file:///d:/Projects/logistics-website/backend/src/orders/admin-reports.controller.ts))

| Phương thức & Endpoint | Mô tả chức năng | Phân quyền |
| :--- | :--- | :---: |
| `GET /api/v1/admin/reports/operational` | Truy vấn dữ liệu Báo cáo vận hành theo khoảng ngày (`fromDate`, `toDate`, `hubId`, `direction`): trả về `summary`, `dailySeries` (Slide 2), `monthlySeries` (Slide 3), `hubBreakdown`, `confirmedTrips`. | `SUPER_ADMIN` |
| `POST /api/v1/admin/reports/operational/sync` | Đồng bộ lại snapshot báo cáo cho khoảng ngày đang chọn. | `SUPER_ADMIN` |
| `GET /api/v1/admin/reports/operational/daily-trips` | Truy vấn chi tiết toàn bộ chuyến xe (`TRIP`) xác nhận trong **1 ngày cụ thể `D`** (`18:00 D-1 → 18:00 D`), kèm số lượng xe nhập/xuất, phân bổ theo Hub, dải 14 ngày gần nhất và danh sách đơn hàng (`orders`) trong từng `TRIP`. | `SUPER_ADMIN` |
| `GET /api/v1/admin/reports/cronjobs` | Lấy cấu hình Cronjob hiện tại, thông tin kỳ chốt tiếp theo và danh sách lịch sử thực thi (`logs`). | `SUPER_ADMIN` |
| `PATCH /api/v1/admin/reports/cronjobs/config` | Cập nhật trạng thái bật/tắt (`isEnabled`), giờ chạy hàng ngày (`cronTime`) và cấu hình thông báo (`notifySuperAdmins`). | `SUPER_ADMIN` |
| `POST /api/v1/admin/reports/cronjobs/rerun` | Thực thi chạy lại (Re-run) báo cáo cho 1 ngày cụ thể `reportDate` (hoặc khoảng ngày) và ghi nhận vào `cron_job_execution_log`. | `SUPER_ADMIN` |

---

## 3. Kiến trúc 3 Màn hình Giao diện Frontend (`frontend/src/`)

### 3.1. Trang 1: Báo cáo Kết quả Hoạt động Vận hành (`/dashboard/admin/reports`)
- **Áp dụng kỹ thuật Next.js Parallel Routes**:
  - Layout điều phối: [`frontend/src/app/dashboard/admin/reports/layout.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/reports/layout.tsx) bọc `AdminOperationalReportLayoutShell` và `AdminOperationalReportProvider`.
  - Slot chính (`page.tsx`): Render **1 Bộ lọc Chung Global duy nhất trên cùng** (`Từ ngày` – `Đến ngày`, nút chọn nhanh `Tháng này` / `Tháng trước` / `7 ngày` / `30 ngày`, bộ lọc `Chi nhánh Kho`, nút chuyển chiều `Tổng lưu thông` / `Xe nhập kho` / `Xe xuất kho`) + 4 thẻ KPI tổng hợp.
  - Slot `@daily_stats` ([`@daily_stats/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/reports/@daily_stats/page.tsx)): Biểu đồ cột sản lượng `CBM` theo từng ngày trong kỳ (**Slide 2**) + dòng chốt **`TỔNG SẢN LƯỢNG`** và **`TRUNG BÌNH CBM/NGÀY`**.
  - Slot `@monthly_trends` ([`@monthly_trends/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/reports/@monthly_trends/page.tsx)): Cặp biểu đồ đường xu hướng qua các tháng cho **`SỐ KHỐI (CBM)`** và **`SỐ TẤN`** (**Slide 3**).
  - Slot `@drilldown_table` ([`@drilldown_table/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/reports/@drilldown_table/page.tsx)): **Widget Theo dõi mã TRIP & Bảng đối soát theo ngày / theo Chi nhánh Kho**, gắn liên kết 1 chạm mở sang trang chuyên biệt `/dashboard/admin/reports/trips?date=YYYY-MM-DD`.

### 3.2. Trang 2: Theo dõi Chi tiết Mã TRIP Nhập/Xuất Theo Ngày (`/dashboard/admin/reports/trips`)
- **Files**: [`frontend/src/app/dashboard/admin/reports/trips/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/reports/trips/page.tsx) & [`super-admin-daily-trips-tracker.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/admin-reports/components/super-admin-daily-trips-tracker.tsx).
- **Chức năng cốt lõi**:
  - Cho phép chọn **1 ngày báo cáo cụ thể `D`** kèm dải **14 ngày chọn nhanh** (`N:x • X:y xe`) và nút **`Xuất Excel`** (`Bang_Ke_Chuyen_Xe_TRIP_YYYY-MM-DD.xlsx` gồm 3 sheet: *Danh sách TRIP xác nhận*, *Chi tiết đơn hàng trong TRIP*, và *Chuyến xe chưa xác nhận*).
  - Hiển thị **4 thẻ KPI trong ngày**: Tổng số chuyến xe (`TRIP`), Số lượng **Xe nhập kho**, Số lượng **Xe xuất kho**, và Tổng khối lượng (`CBM / Tấn`).
  - **Bảng phân bổ số xe Nhập / Xuất theo từng Chi nhánh Kho (Hub)** trong ngày.
  - **Khung Kiểm soát & Cảnh báo Chuyến xe Chưa xác nhận trước giờ Cut-off 18:00 (`pending-trips-alert-card`)**: Liệt kê các chuyến xe đang ở trạng thái nháp / chờ xử lý (`PENDING`) chưa được xác nhận vào sổ cái kho để đôn đốc kho xử lý trước `18:00`.
  - **Danh sách chi tiết từng mã `TRIP` xác nhận trong ngày**: Bấm vào bất kỳ dòng `TRIP` nào sẽ bung bảng kê chi tiết các vận đơn (`Mã vận đơn`, `Mô tả hàng hóa`, `Hành trình Kho đi → Kho đến`, `Kiện xác nhận / Tổng kiện`, `Số Khối CBM`, `Trọng lượng Kg`, `Giờ xác nhận`).

### 3.3. Trang 3: Quản trị Cronjob Thuần túy (`/dashboard/admin/cronjobs`)
- **Files**: [`frontend/src/app/dashboard/admin/cronjobs/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/admin/cronjobs/page.tsx) & [`super-admin-cronjob-manager.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/admin-reports/components/super-admin-cronjob-manager.tsx).
- **Thiết kế tinh gọn thuần túy**:
  1. **Bảng Danh mục Tác vụ Cronjob Hệ thống (`cron-job-registry-table`)**: Quản lý tập trung 3 tác vụ định kỳ:
     - `DAILY_HUB_OPERATIONAL_REPORT` (*Tổng hợp Báo cáo Vận hành Hub Hàng ngày* — `18:05 GMT+7`)
     - `PENDING_DRAFT_TRIPS_CUTOFF_REMINDER` (*Cảnh báo Chuyến xe Nháp chưa xác nhận trước Cut-off 18:00* — `17:30 GMT+7`)
     - `STALE_WAREHOUSE_INVENTORY_AUDIT` (*Kiểm toán Vận đơn Tồn kho Quá hạn & Đối soát Sổ cái Hub* — `08:00 GMT+7`)
     - Cho phép bật/tắt nhanh từng job (`ĐANG BẬT` / `ĐANG TẮT`), bấm **`Cấu hình`** hoặc **`Chạy ngay`** trực tiếp trên từng dòng.
  2. **Cấu hình Lịch chạy & Chạy lại Cronjob cho 1 Ngày cụ thể**: Chọn chính xác ngày trên lịch (`<Input type="date" />`), xem khung giờ quét `18:00 D-1 → 18:00 D` và bấm **`Chạy lại ngày DD/MM/YYYY`**.
  3. **Bảng Nhật ký lịch sử thực thi Cronjob kèm Bộ lọc**: Bộ lọc trạng thái (`Tất cả` / `Thành công` / `Lỗi`), bộ lọc theo Mã tác vụ (`jobKey`), ô tìm kiếm nhanh và nút **`Chạy lại`** từng lượt.

---

## 4. Đánh giá Đối chuẩn Hệ thống Thực tế & Trạng thái Triển khai

Dựa trên khảo sát các hệ thống **Enterprise TMS/WMS** và **Job Scheduler Dashboard** (Airflow, Hangfire, BullMQ Board):

### 4.1. Hạng mục Quản trị Cronjob (`/dashboard/admin/cronjobs`) — ✅ Đã triển khai
- **Danh mục Đa tác vụ (`cron-job-registry-table`)**: Quản lý tập trung toàn bộ các cronjob vận hành của hệ thống (`DAILY_HUB_OPERATIONAL_REPORT`, `PENDING_DRAFT_TRIPS_CUTOFF_REMINDER`, `STALE_WAREHOUSE_INVENTORY_AUDIT`).
- **Bộ lọc Nhật ký thực thi**: Lọc theo trạng thái (`Tất cả` / `Thành công` / `Lỗi`), lọc theo Mã tác vụ (`jobKey`) và tìm kiếm nhanh.

### 4.2. Hạng mục Theo dõi TRIP theo ngày (`/dashboard/admin/reports/trips`) — ✅ Đã triển khai
- **Cảnh báo Chuyến xe Chưa xác nhận trước giờ Cut-off 18:00 (`pending-trips-alert-card`)**: Hiển thị danh sách các chuyến xe nháp (`PENDING`) chưa bấm xác nhận nhập/xuất trước giờ khóa sổ `18:00`.
- **Xuất Excel Bảng kê Chi tiết TRIP & Vận đơn theo Ngày (`btn-export-daily-trips-excel`)**: Xuất file `.xlsx` đa sheet gồm danh sách TRIP xác nhận, chi tiết vận đơn trong từng TRIP và danh sách chuyến xe chưa xác nhận.
