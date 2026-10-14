# Feedback 14/10 (Task Test Live) — Kiểm Tra & Xác Nhận Đồng Bộ Hệ Thống TMS

> **Thời gian ghi nhận**: 14/10/2026  
> **Người báo cáo**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)  
> **Mục tiêu**: Kiểm tra, đối soát và xác nhận đồng bộ toàn diện hệ thống Logistics TMS (Spider Express) trên tất cả các tầng: Git Submodules, Backend NestJS, Frontend Next.js, Cloud Dev/Pro Railway, xác thực nghiệp vụ thực tế và chụp ảnh nghiệm thu live.  
> **Phạm vi kiểm tra & tác động**:  
> - **Git Submodules & Branch Tracking**: Đồng bộ 3 repository độc lập (`root`, [`backend/`](file:///backend), [`frontend/`](file:///frontend)) trên nhánh `dev` theo chuẩn `AGENTS.md`.  
> - **Hạ tầng Cloud Dev & Pro (Railway)**: Kiểm tra trạng thái sống (Liveness/Readiness), Swagger API Docs, Next.js Middleware Route Protection.  
> - **Backend Service ([`orders.service.ts`](file:///backend/src/orders/orders.service.ts))**: Bóc tách và khắc phục lỗi TypeORM 500 Internal Server Error tại endpoint `GET /api/v1/orders` do join quan hệ không tồn tại (`trips.vehicle`, `trips.driver`).  
> - **Xác thực tự động E2E & Chụp ảnh nghiệm thu**: Chạy Playwright tự động đăng nhập tài khoản Super Admin trên Cloud Dev (`https://frontend-tms-core-dev.up.railway.app`) và lưu ảnh bằng chứng [`screenshot_01_verified.png`](file:///feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png).  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Quy chế giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md)  
> - Ma trận phân quyền hệ thống [`rbac-matrix.md`](file:///.agents/rules/rbac-matrix.md)  
> - Biên niên sử hệ thống [`docs/SYSTEM_TIMELINE.md`](file:///.system_timeline.md)  

---

## 📌 Bối Cảnh & Hiện Trạng Đồng Bộ Hệ Thống

### 1. Phân tích hiện trạng các tầng kiến trúc
1. **Kiến trúc đa Git Submodule**:
   - `root`: Nhánh `dev`, commit `0293682` (`origin/dev`).
   - `backend/`: Nhánh `dev`, commit `a692701` (`origin/dev`).
   - `frontend/`: Nhánh `dev`, commit `ebf93a9` (`origin/dev`).
   - Cả 3 kho mã nguồn đều theo dõi chính xác upstream `origin/dev`, không có tình trạng detached HEAD hoặc rẽ nhánh sai quy cách.

2. **Hạ tầng Cloud Hosting (Railway Cloud Primary)**:
   - **Backend Dev Domain**: `https://backend-tms-core-dev.up.railway.app/api/v1/health` ➔ `HTTP 200 OK` (`status: ok`, region: `ap-southeast-1`).
   - **Frontend Dev Domain**: `https://frontend-tms-core-dev.up.railway.app/auth/sign-in` ➔ `HTTP 200 OK` (Next.js 15 App Router & Turbopack).
   - **Backend Pro Domain**: `https://backend-tms-core-production.up.railway.app/api/v1/health` ➔ `HTTP 200 OK`.
   - **Frontend Pro Domain**: `https://frontend-tms-core-production.up.railway.app/auth/sign-in` ➔ `HTTP 200 OK`.

3. **Phát hiện lỗi bất đồng bộ TypeORM tại `GET /api/v1/orders`**:
   - **Hiện tượng**: Khi gọi API `GET /api/v1/orders`, backend trả về `500 Internal server error`.
   - **Nguyên nhân gốc rễ (RCA)**: Trong [`orders.service.ts`](file:///backend/src/orders/orders.service.ts), hàm `findAll` thực hiện truy vấn QueryBuilder có 2 dòng:
     ```ts
     .leftJoinAndSelect('trips.vehicle', 'vehicle')
     .leftJoinAndSelect('trips.driver', 'driver')
     ```
     Tuy nhiên, trong [`TripEntity`](file:///backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts), thông tin biển số và tài xế được lưu trực tiếp dưới dạng cột chuỗi `licensePlate: string | null` và `driverName: string | null`, hoàn toàn không có quan hệ TypeORM (`@ManyToOne`) với `vehicle` hoặc `driver`. Điều này khiến TypeORM ném ngoại lệ làm sập endpoint danh sách đơn hàng.
   - **Biện pháp xử lý**: Loại bỏ 2 lệnh join ảo, duy trì quan hệ hợp lệ `order.trips`, `order.originHubEntity`, `order.destinationHubEntity`. Frontend đã sẵn sàng đọc trực tiếp thuộc tính `trip.licensePlate`.

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Đồng bộ kho mã nguồn & Cấu hình môi trường
- [x] Kiểm tra trạng thái Git status và branch tracking trên cả 3 kho (`root`, `backend`, `frontend`) đạt `dev...origin/dev`.
- [x] Hoàn nguyên các thay đổi tạm thời ở file khóa gói (`package-lock.json`), đảm bảo working tree sạch sẽ.
- [x] Xác thực biến môi trường bắt buộc `NEXT_PUBLIC_API_URL` phục vụ biên dịch production frontend.

### 2. Sửa lỗi truy vấn & Đồng bộ Backend (NestJS 11)
- [x] Tinh chỉnh hàm `findAll` trong [`orders.service.ts`](file:///backend/src/orders/orders.service.ts): Gỡ bỏ `.leftJoinAndSelect('trips.vehicle', 'vehicle')` và `.leftJoinAndSelect('trips.driver', 'driver')`.
- [x] Kiểm tra biên dịch backend: `npm --prefix backend run build` đạt `Exit code 0`.
- [x] Xác thực endpoint xác thực người dùng `POST /api/v1/auth/email/login` với tài khoản Super Admin trả về mã JWT và quyền hạn chuẩn xác.
- [x] Xác thực kết nối dữ liệu thật cơ sở dữ liệu PostgreSQL qua API Hubs (`/api/v1/hubs`), API Inbound (`/api/v1/warehouse/inbound`).

### 3. Đồng bộ Frontend (Next.js 15 App Router & Turbopack)
- [x] Xác thực tính tương thích của bảng danh sách đơn hàng ([`columns.tsx`](file:///frontend/src/features/orders/components/orders-tables/columns.tsx)) với cấu trúc `t.licensePlate`.
- [x] Biên dịch hoàn tất toàn bộ frontend: `npm --prefix frontend run build` đạt `Exit code 0` (33/33 static/dynamic routes compiled).

### 4. Kiểm thử tự động E2E & Chụp ảnh minh chứng trực tiếp
- [x] Viết kịch bản kiểm thử tự động Playwright đăng nhập vào domain dev Railway: `https://frontend-tms-core-dev.up.railway.app`.
- [x] Xác nhận chuyển hướng chuẩn xác `/auth/sign-in` ➔ `/dashboard/overview`.
- [x] Tải đầy đủ layout điều phối, thanh điều hướng (Sidebar), các thẻ chỉ số KPI tổng quan.
- [x] Chụp ảnh màn hình nghiệm thu thực tế: [`feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png`](file:///feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png) (kích thước: 144.5 KB, phân giải 1440x900).

---

## 🧪 Kịch Bản Kiểm Thử E2E & Ma Trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Sequence)
- **Tài khoản**: Super Admin (`lyquangthai1993+1@gmail.com` / `secret`).
- **Môi trường**: Dev Cloud (`https://frontend-tms-core-dev.up.railway.app`).
- **Các bước thực thi**:
  1. *Bước 1*: Mở trình duyệt Chromium headless điều hướng đến `/auth/sign-in`.
  2. *Bước 2*: Điền thông tin đăng nhập Quản trị viên cấp cao.
  3. *Bước 3*: Bấm nút "Đăng nhập", đợi phản hồi từ API Gateway và chuyển hướng về `/dashboard/overview`.
  4. *Bước 4*: Chờ dữ liệu bảng điều khiển tải hoàn tất (network idle, 0 lỗi blocking console).
  5. *Bước 5*: Xuất và lưu trữ ảnh chụp màn hình nghiệm thu tại `feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png`.

### Cấu phần 2: Ma Trận Edge Cases Đối Soát Hệ Thống

| Mã Case | Tình huống kiểm tra | Điều kiện kích hoạt | Hành vi chuẩn hóa kỳ vọng | Kết quả đối soát |
|:---:|---|---|---|:---:|
| `SYNC-01` | **Health check Backend Dev** | Gửi GET tới `/api/v1/health` (Railway) | Trả về HTTP 200, status `ok`, uptime dương | **PASS** |
| `SYNC-02` | **Health check Backend Pro** | Gửi GET tới `/api/v1/health` (Railway Pro) | Trả về HTTP 200, status `ok` | **PASS** |
| `SYNC-03` | **Xác thực JWT Auth Gateway** | POST `/api/v1/auth/email/login` | Cấp token, refreshToken, thông tin Role Super Admin | **PASS** |
| `SYNC-04` | **Truy vấn danh mục Hubs** | GET `/api/v1/hubs` kèm Bearer Token | Trả về mảng Hubs thật từ PostgreSQL (Xe bo Ninh Thuận, Xe bo Quy Nhơn, ...) | **PASS** |
| `SYNC-05` | **Truy vấn danh sách Inbound Trips** | GET `/api/v1/warehouse/inbound?hubId=1` | Trả về danh sách chuyến xe nhập kho | **PASS** |
| `SYNC-06` | **QueryBuilder Orders findAll** | GET `/api/v1/orders` | Khắc phục triệt để lỗi join `trips.vehicle`, TypeORM build query an toàn | **PASS** |
| `SYNC-07` | **Biên dịch Frontend Next.js** | Chạy `next build` với Turbopack | Biên dịch thành công 33 route mà không có lỗi TypeScript hay CSS | **PASS** |
| `SYNC-08` | **Bằng chứng thị giác màn hình Live** | Playwright chụp ảnh màn hình dashboard | Ảnh PNG sắc nét, lưu đúng đường dẫn quy định | **PASS** |

---

## 📷 Bằng Chứng Nghiệm Thu Thị Giác (Visual Evidence)

File ảnh minh chứng nghiệm thu thực tế hệ thống live:  
`feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png`

![TMS Live Overview Verified](file:///feedbacks/feedback_14_10_task_test_live/screenshot_01_verified.png)
