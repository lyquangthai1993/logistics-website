# 📋 TODO: Ghi Rõ Tên Chi Nhánh Kho (Hub Name) Trong Log Vận Hành Kho Bãi Trên Railway (Task #112)

> **Ngày tiếp nhận**: 03/11/2026
> **Phân loại**: Backend Logging & Activity Audit Enhancement (`backend/src/orders/warehouse.service.ts`, `backend/src/orders/order-activity-log.service.ts`)
> **Vai trò điều phối**: `/todo-agent` + `/railway-ops` (6-Stage SDLC Pipeline)

---

## 1. Ngữ cảnh Vận hành & Yêu cầu Người dùng (Operational Context)

- **Trích dẫn yêu cầu người dùng**:
  > `"[OUTBOUND CONFIRMED] Chuyến SD966 (xe 75H03246 SPIDER) xuất kho thành công 4 đơn (341 kiện) bởi phuthanh@gmail.com tại Hub 1:..."`
  > `"log trong railway đang thế này"`
  > `"tôi cần ghi rõ ra Hub 1 là hub tên gì"`
- **Bối cảnh vận hành thực tế**:
  - Khi theo dõi log vận hành thời gian thực trên Railway Cloud (`backend-tms-core`), các dòng log `[OUTBOUND CONFIRMED]`, `[INBOUND CONFIRMED]`, `[INBOUND CREATED]`, `[INBOUND BATCH CREATED]`, và `[AUDIT]` hiện chỉ in ra mã số định danh `tại Hub 1`, `tại Hub 2`, `tại Hub 3` thay vì ghi rõ tên chi nhánh kho kèm theo (ví dụ: `tại Hub 1 (Andromeda Hub - HCM)` hoặc `tại Hub 1 (Polaris Hub - Hưng Yên)`).
  - Việc thiếu tên Hub khiến đội ngũ vận hành / quản trị viên phải tự đối chiếu ID thủ công khi kiểm tra log xuất/nhập kho trên Railway.

---

## 2. Giải mã Ngữ cảnh Hub & Tài khoản Kiểm thử (Hub-Scoped Account Mapping)

- **Danh mục Hub chuẩn trên hệ thống**:
  - `Andromeda Hub - HCM` (Tài khoản kiểm thử: `USER_WAREHOUSE_HCM` / `warehouse_hcm`)
  - `Magellan Hub - Đà Nẵng` (Tài khoản kiểm thử: `USER_WAREHOUSE_DAD` / `warehouse_dad`)
  - `Polaris Hub - Hưng Yên` (Tài khoản kiểm thử: `USER_WAREHOUSE_HYN` / `warehouse_hyn`)
  - Toàn hệ thống ➔ `USER_ADMIN` (`admin`)

---

## 3. Phân tích Nguyên nhân Gốc rễ (Technical Root Cause Analysis - RCA)

1. **`confirmOutbound` trong `backend/src/orders/warehouse.service.ts` (Dòng 3686)**:
   - Hiện tại chỉ nối chuỗi `tại Hub ${originHubId || 'N/A'}: ${orderSummaryList}` mà chưa truy vấn tên Hub (`HubEntity.name`) tương ứng với `originHubId`.
   - Đồng thời ở dòng 3660, khi ghi `safeLogActivity` cho sự kiện `OUTBOUND_CONFIRMED`, trường `hubName` đang lấy `ord.originHub || 'N/A Hub'` (vốn là kho gốc của đơn hàng, có thể sai lệch nếu đơn hàng đang xuất kho trung chuyển tại Hub trung gian).
2. **`confirmInbound`, `quickCreateInbound`, `batchCreateInbound` trong `backend/src/orders/warehouse.service.ts` (Các dòng 1575, 2011, 3129)**:
   - Đều đang ghi `tại Hub ${originHubId || 'N/A'}` hoặc `tại Hub ${hubId || 'N/A'}` dù đã có biến `originHubName` / `hubRepo` trong transaction.
3. **`logActivity` trong `backend/src/orders/order-activity-log.service.ts` (Dòng 116)**:
   - Dòng log `[AUDIT]` đang ghi `Hub=${resolvedHubId}` mà không kèm tên Hub `(${resolvedHubName})`, và khi `dto.hubName` bị truyền giá trị mặc định `'N/A Hub'` hoặc `'Kho'`, hệ thống chưa tự động tra cứu tên chuẩn từ bảng `hub` theo `resolvedHubId`.

---

## 4. Danh sách Công việc Nguyên tử (Atomic Task Checklist)

- [x] **Task 1**: Bổ sung hàm tiện ích `formatHubLogLabel(hubRepo, hubId, fallbackHubName)` trong `backend/src/orders/warehouse.service.ts` để chuẩn hóa định dạng hiển thị `<hubId> (<hubName>)` (ví dụ: `1 (Andromeda Hub - HCM)`).
- [x] **Task 2**: Cập nhật `confirmOutbound` trong `backend/src/orders/warehouse.service.ts` để phân giải chính xác tên Hub xuất kho từ `originHubId`, ghi vào cả `safeLogActivity.hubName` và log `[OUTBOUND CONFIRMED] ... tại Hub <id> (<name>): ...`.
- [x] **Task 3**: Cập nhật đồng bộ các log `[INBOUND CREATED]`, `[INBOUND BATCH CREATED]`, và `[INBOUND CONFIRMED]` trong `backend/src/orders/warehouse.service.ts` để hiển thị rõ `tại Hub <id> (<name>)`.
- [x] **Task 4**: Cập nhật `logActivity` trong `backend/src/orders/order-activity-log.service.ts` để tự động phân giải `hubName` từ `HubEntity` khi thiếu và in rõ `Hub=<id> (<name>)` trong log `[AUDIT]`.
- [x] **Task 5**: Viết và chạy bộ kiểm thử Playwright E2E `frontend/e2e/112-warehouse-hub-name-logs.spec.ts` kết hợp thẩm định `scripts/e2e-auditor.mjs` ($\ge 40/50$), triển khai lên Railway (`dev` & `master`) và ghi nhận biên niên sử `RESOLUTION.md`.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### Phần 1: Chuỗi Hành động Kiểm thử E2E (Step-by-Step Action Sequence)
1. **Đăng nhập**: Sử dụng tài khoản `USER_WAREHOUSE_HCM` (`warehouse_hcm` — `Andromeda Hub - HCM`) và `USER_ADMIN` (`admin`).
2. **Tiền điều kiện & Thao tác thực tế**:
   - Tạo tiếp nhận đơn hàng nhập kho mới (`POST /api/v1/warehouse/inbound/quick-create`) và thực hiện xuất kho (`POST /api/v1/warehouse/outbound/confirm`) tại chi nhánh kho thực tế.
   - Kiểm tra trực tiếp nhật ký hoạt động đơn hàng (`GET /api/v1/orders/code/:orderCode/activity-logs`) xác nhận `hubId` đi kèm `hubName` đầy đủ (`Andromeda Hub - HCM`, không bao giờ là `'N/A Hub'` hay chỉ có số ID).
   - Mở giao diện bảng Đơn hàng kho (`/dashboard/warehouse/orders`) và modal Chi tiết vận đơn để xác nhận lịch sử hoạt động hiển thị đúng tên Hub và chụp ảnh bằng chứng nghiệm thu `screenshot_01_verified.png`.

### Phần 2: Ma trận 10 Trường hợp Biên (Edge Cases Matrix)
- **EC-01 (Zero-state)**: Đơn hàng mới khởi tạo chưa có lịch sử xuất kho vẫn hiển thị đúng tên Hub nhập ban đầu.
- **EC-02 (Boundary = 0)**: Khi `hubId` không xác định (`0` hoặc `null`), hiển thị an toàn tên fallback hoặc `'N/A'` không gây lỗi `null (null)`.
- **EC-03 (Hub Isolation)**: Thủ kho từng chi nhánh khi thao tác đều ghi nhận đúng ID và tên Hub của kho mình.
- **EC-04 (Idempotency)**: Nhiều đơn hàng cùng xuất trên 1 chuyến xe chỉ truy vấn `HubEntity` 1 lần duy nhất cho toàn bộ chuyến xuất kho.
- **EC-05 (Missing Optional Fields)**: Khi `dto.hubName` truyền vào `logActivity` là `'N/A Hub'` hoặc `'Kho'`, tự động tra cứu tên thật từ bảng `hub` qua `resolvedHubId`.
- **EC-06 (Live Filters)**: Bộ lọc đơn hàng kho hoạt động bình thường sau khi cập nhật log.
- **EC-07 (Partial Actions)**: Xuất kho từng phần (`partial outbound`) ghi nhận đúng số kiện xuất và tên Hub thực hiện xuất kho.
- **EC-08 (Admin Override)**: Khi `SUPER_ADMIN` thao tác xác nhận nhập/xuất thay cho một Hub, tên Hub vẫn được phân giải chính xác theo `originHubId` / `hubId` của chuyến/đơn hàng.
- **EC-09 (Concurrency)**: Tra cứu `hubRepo.findOne` nằm gọn trong transaction hiện hành, không tạo deadlock hay chậm hiệu năng.
- **EC-10 (Cache Invalidation)**: Sau khi xuất kho, cache KPI và danh sách đơn được làm mới tức thì.

### Phần 3: Tệp kiểm thử Playwright mục tiêu
- `frontend/e2e/112-warehouse-hub-name-logs.spec.ts`
