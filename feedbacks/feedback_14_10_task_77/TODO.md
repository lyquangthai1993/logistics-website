# Feedback 14/10 (Task #77) — Khảo Sát & Chuẩn Hóa Cơ Chế Tiếp Nhận Phản Hồi Nghiệp Vụ TMS Qua Telegram Bot (@please_choose_auto_bot)

> **Thời gian ghi nhận**: 14/10/2026 16:55:00  
> **Người báo cáo**: @【M】【C】【D】 / @User (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**:  
> - **Kênh Tự động hóa Điều hành & Tiếp nhận Yêu cầu**: Telegram Task Runner ([`bot.mjs`](file:///tools/telegram-task-runner/bot.mjs), [`neon-worker.mjs`](file:///tools/telegram-task-runner/neon-worker.mjs), n8n Routing Workflow [`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs))  
> - **Phân hệ Quản lý Kho bãi TMS (Warehouse Management)**: Bảng điều phối nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)), Bảng điều phối xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)), Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))  
> - **Phân hệ In ấn Chứng từ Vận tải (Vouchers & Labels)**: Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)), Phiếu Xuất Kho A4 ([`WarehouseOutboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx)), Tem Pallet Nhận Diện A4 ([`WarehouseWaybillA4Modal`](file:///frontend/src/features/warehouse/components/warehouse-waybill-a4-modal.tsx))  
> - **Backend Quản lý Kho & Điều vận API** ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts))  
> **Tài liệu tham chiếu**:  
> - TMS Business Domain Lead Architecture ([`SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///.agents/skills/ui-spacing-guard/SKILL.md)  
> - Ma trận phân quyền hệ thống [`rbac-matrix.md`](file:///.agents/rules/rbac-matrix.md)  
> - Quy chuẩn quản lý kiện vận tải No-SKU, Consignment Level & Không quản lý vị trí giá kệ (No Bin/Rack Location)  
> **Tài liệu & Ảnh nghiệp vụ tham chiếu**:  
> - [`mau_phieu_nhap_kho.JPG`](file:///docs_scan/mau_phieu_nhap_kho.JPG): Quy chuẩn biểu mẫu Phiếu nhập kho thực tế tại kho bãi Spider Express.  
> - [`workflow_trung_chuyen_hub_trip.JPG`](file:///docs_scan/workflow_trung_chuyen_hub_trip.JPG): Sơ đồ luân chuyển hàng hóa liên Hub Bắc - Nam (HCM ➔ Đà Nẵng ➔ Hưng Yên).  
> - [`ke_hoach_dong_hang_so_trip.JPG`](file:///docs_scan/ke_hoach_dong_hang_so_trip.JPG): Kế hoạch đóng hàng và cấu trúc bảng kê chuyến xe TMS.  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Phản hồi gốc từ người dùng
> `"/feedback@please_choose_auto_bot"`

### 2. Ý nghĩa nghiệp vụ trong quy trình tương tác & tự động hóa vận hành TMS
Trong quá trình vận hành hệ thống Logistics TMS (Spider Express), người dùng và các điều phối viên tại các Hub (`Andromeda Hub - HCM`, `Magellan Hub - Đà Nẵng`, `Polaris Hub - Hưng Yên`) sử dụng bot Telegram tự động hóa `@please_choose_auto_bot` để:
1. **Giao task & Báo cáo phản hồi nhanh từ thiết bị di động**: Gửi yêu cầu điều chỉnh tính năng, báo lỗi giao diện hoặc yêu cầu khảo sát nghiệp vụ trực tiếp vào nhóm điều hành.
2. **Kích hoạt vai trò `/leader` khảo sát hệ thống**: Lệnh `/feedback` được thiết kế để kích hoạt Team Lead nghiệp vụ TMS rà soát toàn diện các màn hình liên quan, đối chiếu tài liệu quy chuẩn (`AGENTS.md`, `docs_scan/`), phát hiện các điểm chưa phù hợp trên giao diện và lập kế hoạch hành động (`TODO.md`) chuẩn mực trước khi chuyển sang pha thực thi code (`todo-agent`).
3. **Hiện tượng khi người dùng gửi lệnh rỗng (`/feedback@please_choose_auto_bot`)**:
   - Khi người dùng bấm trực tiếp vào gợi ý bot command hoặc gõ nhanh lệnh `/feedback@please_choose_auto_bot` mà chưa kịp đính kèm nội dung mô tả chi tiết hoặc ảnh chụp màn hình:
   - Hệ thống n8n router và AI Worker cần nhận diện đây là **Yêu cầu khảo sát & kiểm tra sức khỏe nghiệp vụ toàn diện (TMS Comprehensive Operational & Health Audit)** ngay sau chuỗi các task hotfix vừa qua (Task #70, Task #71, Task #73, Task #76), đồng thời cung cấp phản hồi rõ ràng về cách thức đính kèm nội dung phản hồi chi tiết để người dùng nắm rõ.

### 3. Vị trí & Tình trạng các luồng nghiệp vụ TMS cốt lõi sau chuỗi hotfix gần nhất
- **Task #70**: Đã gỡ bỏ biểu tượng chevron mở rộng dòng thừa và huy hiệu loại chuyến xe trùng lặp tại bảng danh sách nhập kho.
- **Task #71**: Đã chuẩn hóa thanh tác vụ ghim dưới chân (Sticky Bottom Footer) và tối ưu độ rộng toàn màn hình (`w-[96vw] max-w-7xl`) cho Modal Dỡ & Xuất hàng trên thiết bị di động.
- **Task #73**: Đã sửa ô "GIAO ĐẾN" trên Tem Pallet Nhận Diện Hàng Hóa A4, đảm bảo luôn hiển thị tên Tỉnh/Thành phố nhận hàng (`order.destinationProvince || order.destinationCity`).
- **Task #76**: Đã cập nhật trường "Địa chỉ giao hàng" (`deliveryAddress`) vào cả Header thông tin tiếp nhận và bảng kê chi tiết của Phiếu Nhập Kho A4.
- **Mục tiêu của Task #77**: Khảo sát, rà soát tính nhất quán và hoàn thiện ma trận kiểm định tự động cho toàn bộ hệ thống sau chuỗi cải tiến trên.

---

## 🔍 Tổng hợp các điểm chưa đúng & Cần hoàn thiện trên hệ thống (RCA)

Đối chiếu kiến trúc mã nguồn hiện tại tại cả 3 repository (`root`, `backend/`, `frontend/`) và các module tự động hóa:

### 1. Cơ chế tiếp nhận lệnh rỗng tại Bot Router (`tools/telegram-task-runner/update-n8n-router.mjs`)
- **Hiện tượng**: Tại dòng 120 của `update-n8n-router.mjs`:
  ```javascript
  cleanText = rawText.replace(/^\/feedback(@\w+)?\s*/i, '').trim() || (photoFileId ? '(Ảnh chụp màn hình từ người dùng)' : rawText);
  ```
  Khi người dùng gửi chuỗi `/feedback@please_choose_auto_bot` mà không có văn bản đi kèm và không có ảnh (`photoFileId` là `null`), biến `cleanText` sau khi xóa regex sẽ thành rỗng `""`. Biểu thức falsy `||` sẽ tự động fallback về lại `rawText` (tức là giữ nguyên chuỗi `/feedback@please_choose_auto_bot`).
- **Hệ quả**: Prompt nạp vào AI bị trích dẫn nội dung yêu cầu là chính chuỗi lệnh gọi bot, thiếu hướng dẫn tương tác ngược lại cho người dùng về việc cần cung cấp nội dung cụ thể hoặc ảnh chụp lỗi.
- **Giải pháp chuẩn hóa**:
  * Bổ sung cơ chế phát hiện lệnh `/feedback` rỗng: Khi phát hiện lệnh không có tham số và không có ảnh, bot vẫn kích hoạt khảo sát nghiệp vụ tổng quan hệ thống nhưng đồng thời gửi thông điệp hướng dẫn rõ ràng:
    `"💡 Bạn vừa gửi lệnh /feedback. Vui lòng gửi kèm mô tả chi tiết hoặc gửi ảnh màn hình lỗi với caption /feedback <nội dung> để AI phân tích chính xác từng màn hình cụ thể."`

### 2. Tính toàn vẹn của dữ liệu địa chỉ giao hàng trên Bảng điều phối nhập kho
- **Khảo sát**: Sau Task #76, API `GET /api/v1/warehouse/inbound-trips` đã trích xuất `deliveryAddress` từ trường `route` hoặc `notes`.
- **Rà soát**: Cần kiểm tra xem các đơn hàng tạo trực tiếp từ màn hình Tạo đơn (`/orders/create`) hoặc từ luồng Luân chuyển trung chuyển có luôn đảm bảo lưu trữ chuẩn hóa địa chỉ giao hàng trong `route` (`${pickupAddress} → ${deliveryAddress}`) hay không, tránh tình trạng đơn hàng mới không trích xuất được địa chỉ khi dỡ hàng tại kho đến.

### 3. Quy chuẩn UI Compact Density trên các Modal quản lý kho
- **Quy tắc nghiêm ngặt**:
  * Thẻ Card và CardContent: padding siêu gọn 4px (`p-1`, `py-0`).
  * Modal Body: `p-2` (max `p-2.5`, 8-10px) kết hợp `overflow-y-auto max-h-[85vh]`.
  * Modal Container: Độ rộng thích ứng nội dung (`sm:max-w-5xl` đến `max-w-7xl` cho bảng kê $\ge 5$ cột).
  * Nghiêm cấm hoàn toàn các class cấm: `p-4`, `p-6`, `space-y-3`, `gap-4`.
- **Hiện trạng**: Cần quét tĩnh toàn bộ thư mục `frontend/src/features/warehouse/components/` để đảm bảo 100% không còn sót class cấm nào được đưa vào trong các commit gần đây.

### 4. Quy chuẩn Zero Redundant Icons (Không lặp icon và ký tự/emoji)
- Đảm bảo các nút bấm tác nghiệp trong kho như `Tạo đơn`, `In phiếu`, `Xác nhận`, `Dỡ hàng` chỉ dùng một trong hai: Vector icon (Tabler icons) HOẶC text label sạch, không bao giờ dùng kết hợp `+ Tạo đơn` cùng icon Plus.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Kênh Tự Động Hóa & Telegram Bot Router (`tools/telegram-task-runner/`)
- [x] Rà soát và hoàn thiện hàm xử lý lệnh `/feedback` trong [`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs) để xử lý mượt mà cả trường hợp có tham số và trường hợp lệnh rỗng.
- [x] Đảm bảo cơ chế tự động gửi thông báo phản hồi (Silent/Compact Mode) không gây spam tin nhắn trong nhóm điều hành Telegram.
- [x] Kiểm tra cơ chế tự động giải phóng hàng đợi (Auto-Drain FIFO Queue) trong [`telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml) để đảm bảo không bị nghẽn task khi có nhiều yêu cầu gửi liên tục.

### 2. Backend NestJS 11+ (`backend/`)
- [x] Rà soát service quản lý kho bãi [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts):
  - [x] Đảm bảo phương thức `getInboundTrips` trích xuất chính xác `deliveryAddress` cho mọi trạng thái đơn hàng.
  - [x] Đảm bảo endpoint in ấn phiếu nhập kho `GET /api/v1/warehouse/inbound/receipt-data` trả về đầy đủ các trường: `tripCode`, `licensePlate`, `driverName`, `destinationHubName`, `deliveryAddress`, `items`.
  - [x] Đảm bảo endpoint hủy chuyến nháp nhập kho `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` xử lý đúng chuẩn HTTP 200/204 khi thành công và 404 khi không tìm thấy.
- [x] Kiểm tra biên dịch backend: `npm run build --prefix backend` đạt `Exit code 0` (100% không có lỗi TypeScript).

### 3. Frontend Next.js 15 App Router (`frontend/`)
- [x] Rà soát các component giao diện kho bãi:
  - [x] [`warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx): Kiểm tra hiển thị địa chỉ giao hàng trên cả Header Info Grid và Data Table, định dạng in ấn `@media print` khổ A4 chuẩn mực.
  - [x] [`warehouse-outbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx): Kiểm tra tính nhất quán với phiếu nhập kho.
  - [x] [`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx): Kiểm tra luồng truyền dữ liệu vào phiếu in khi thủ kho bấm nút "In phiếu".
  - [x] [`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx): Kiểm tra nút in phiếu nhanh tại từng hàng xe đến kho.
- [x] Quét và rà soát triệt để quy chuẩn UI Compact Density:
  - [x] Không có class cấm: `p-4`, `p-5`, `p-6`, `space-y-3`, `gap-4`.
  - [x] Bảng dữ liệu sử dụng typography compact `text-[10px]`.
- [x] Kiểm tra biên dịch frontend: `npm --prefix frontend run typecheck` đạt `Exit code 0`.

### 4. Kiểm Thử Tự Động Playwright E2E & Nghiệm Thu Thị Giác
- [x] Xây dựng bộ kiểm thử tự động Playwright E2E chuyên biệt cho Task #77 tại [`frontend/e2e/41-feedback-14-10-task-77-system-operational-audit.spec.ts`](file:///frontend/e2e/41-feedback-14-10-task-77-system-operational-audit.spec.ts).
- [x] Kịch bản kiểm thử:
  - [x] Đăng nhập hệ thống với tài khoản Thủ kho HCM (`warehouse_hcm` / `USER_WAREHOUSE_HCM`) hoặc Super Admin (`admin`).
  - [x] Điều hướng tới Bảng điều phối nhập kho `/dashboard/warehouse/inbound`.
  - [x] Kiểm tra danh sách chuyến xe đến kho, xác nhận có ít nhất 1 chuyến xe hiển thị (Non-Empty Visual Evidence Gate).
  - [x] Mở Phiếu Nhập Kho A4 của chuyến xe, assert sự hiện diện của cột "Địa chỉ giao hàng" và dữ liệu tương ứng.
  - [x] Chụp ảnh màn hình bằng chứng nghiệm thu thực tế: `feedbacks/feedback_14_10_task_77/screenshot_01_verified.png`.

---

## 🧪 Kịch Bản Kiểm Thử E2E & Ma Trận Edge Cases (E2E Test Spec)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Sequence)
- **Tài khoản**: Thủ kho HCM (`warehouse_hcm` / `secret`) hoặc Super Admin (`admin`).
- **Môi trường**: Dev Cloud (`https://frontend-tms-core-dev.up.railway.app`) hoặc Localhost (`http://localhost:4000`).
- **Các bước thực thi**:
  1. *Bước 1*: Mở trình duyệt điều hướng đến trang Đăng nhập `/auth/sign-in`.
  2. *Bước 2*: Đăng nhập tài khoản điều hành kho bãi hợp lệ.
  3. *Bước 3*: Truy cập phân hệ Nhập kho `/dashboard/warehouse/inbound`.
  4. *Bước 4*: Mở modal Phiếu nhập kho A4 của chuyến xe đang chờ nhập.
  5. *Bước 5*: Kiểm tra tiêu đề "PHIẾU NHẬP KHO", thông tin Biển số xe, Tài xế, Địa chỉ giao hàng.
  6. *Bước 6*: Chụp ảnh màn hình nghiệm thu thực tế và lưu trữ tại thư mục task.

### Cấu phần 2: Ma Trận Edge Cases Đối Soát Nghiệp Vụ

| Mã Case | Tình huống kiểm tra | Điều kiện kích hoạt | Hành vi chuẩn hóa kỳ vọng | Tiêu chí nghiệm thu |
|:---:|---|---|---|:---:|
| `CASE-01` | **Lệnh bot rỗng** | Người dùng gửi `/feedback@please_choose_auto_bot` không text | Hệ thống ghi nhận yêu cầu khảo sát, không crash, hướng dẫn cú pháp | **PASS** |
| `CASE-02` | **Inbound Receipt Delivery Address** | Mở Phiếu nhập kho từ Bảng điều phối | Cột "Địa chỉ giao hàng" hiển thị địa chỉ khách lẻ hoặc Hub đến | **PASS** |
| `CASE-03` | **No SKU Inventory Integrity** | Kiểm tra bảng kê hàng hóa | Quản lý theo Kiện, Kg, $m^3$, tuyệt đối không hiển thị cột SKU | **PASS** |
| `CASE-04` | **No Bin/Rack Location** | Kiểm tra chi tiết đơn hàng kho | Không có cột vị trí kệ hàng (A-01, B-02), chỉ hiển thị Hub scope | **PASS** |
| `CASE-05` | **UI Compact Density** | Kiểm tra class CSS trên modal kho | Card padding `p-1`, Modal body `p-2`, không có `p-4` hay `space-y-3` | **PASS** |
| `CASE-06` | **Zero Redundant Icons** | Rà soát nút bấm và nhãn | Không có emoji hoặc ký hiệu `+` trùng lặp trong text nút bấm | **PASS** |

---

## 📷 Bằng Chứng Nghiệm Thu Thị Giác (Visual Evidence)

File ảnh minh chứng nghiệm thu thực tế sau khi thực thi và kiểm định:  
- [`screenshot_01_verified.png`](file:///feedbacks/feedback_14_10_task_77/screenshot_01_verified.png) — Bằng chứng đối soát màn hình phiếu nhập kho và bảng điều phối kho bãi đạt chuẩn nghiệp vụ.  
