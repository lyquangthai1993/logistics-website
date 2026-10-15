# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_14_10_TASK_65] — Feedback 14/10 (Task #65) — Khảo Sát Nghiệp Vụ TMS Toàn Diện & Chuẩn Hóa Danh Mục Kiểm Soát Chất Lượng Sau Chuỗi Cải Tiến Vận Hành Kho Bãi

> **Thời gian nghiệm thu**: 14/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (27/27 tasks)  
> **Người báo cáo / Nghiệp vụ**: @Thai (Quản lý nghiệp vụ / Vận hành TMS) & @Antigravity Verification  
> **Phạm vi tác động**: Quản lý Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Kiểm đếm dỡ hàng, theo dõi chuyến xe đến, đồng bộ 2 nút "Tiếp tục" & "Hủy nháp" cho chuyến xe `Chờ xử lý`. • Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Lập phiếu xuất giao khách hàng lẻ & xuất luân chuyển liên Hub, quản lý chuyến xe nháp. • Modal Chi tiết Chuyến xe & Xem đơn hàng ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Hiển thị cột "BIỂN SỐ XE NHẬP DỰ KIẾN" cho đơn nháp chuyến xuất, ẩn tiêu đề dỡ hàng & nút bốc dọc đường khi xem chuyến tạo mới từ Hub nội bộ. • Lưới nhập & Chỉnh sửa đơn hàng kho ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) & Modal Tra cứu đơn hàng ([`warehouse-lookup-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)) ➔ Cho phép chọn đơn nháp `DRAFT` khi lập chuyến xuất, tính toán tồn khả dụng. • Backend Controller & Service ([`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`orders.service.ts`](file:///backend/src/orders/orders.service.ts)) ➔ Xử lý soft-delete draft trip an toàn, tính toán `expectedInboundLicensePlate`, bảo vệ chống lỗi join ảo TypeORM. • Bộ định tuyến Tác vụ Tự động n8n & Telegram Bot ([`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs), [`bot.mjs`](file:///tools/telegram-task-runner/bot.mjs), [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml)) ➔ Tiếp nhận lệnh `/feedback`, định tuyến sang vai trò `/leader` và tự động lập checklist.  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"*Thời gian ghi nhận"*

### 1. Phản hồi gốc từ người dùng (@Thai)
> `"/feedback@please_choose_auto_bot"`

*Phân tích ngữ cảnh*:
Lệnh `/feedback` được quản lý nghiệp vụ kích hoạt trực tiếp từ menu lệnh của Telegram Bot (`@please_choose_auto_bot`) nhằm yêu cầu Team Lead nghiệp vụ TMS (`/leader`) thực hiện một phiên **Khảo sát nghiệp vụ tổng thể (Comprehensive Business Survey & Quality Audit)** sau chuỗi 5 nhiệm vụ cải tiến quan trọng hoàn tất trong ngày 14/10/2026:
1. **Task #51**: Cho phép chọn đơn hàng nháp (`DRAFT`) khi lập chuyến xuất kho, khóa trạng thái chuyến xe ở `PENDING`, chặn bấm "Xác nhận xuất kho" nếu còn đơn hàng chưa nhập kho (`WAITING`).
2. **Task #52**: Loại bỏ tiêu đề phụ "Kiểm đếm dỡ hàng & Nhập kho" và nút "+ Bốc thêm đơn dọc đường về Hub" khi xem chi tiết đơn hàng chuyến xe xuất/nhập tạo mới trực tiếp tại Hub tài khoản thao tác (`isTripOriginHere = true`).
3. **Task #53**: Thay thế cột "ĐIỂM BỐC HÀNG" bằng cột "BIỂN SỐ XE NHẬP DỰ KIẾN" khi xem đơn trong chuyến xe xuất kho, hiển thị biển số xe nhập đang `PENDING` cho đơn nháp và gạch ngang `—` cho đơn đã lưu kho.
4. **Task #54**: Thiết kế đồng bộ 2 nút "Tiếp tục" (xanh `#0F3D62`) & "Hủy nháp" (đỏ `text-red-600 border-red-200`) trên bảng Nhập kho tương tự màn hình Xuất kho cho các chuyến xe ở trạng thái `Chờ xử lý`.
5. **Task #63**: Kiểm tra đồng bộ live môi trường Railway Cloud, khắc phục triệt để lỗi join quan hệ ảo `trips.vehicle`/`trips.driver` trong `orders.service.ts` gây crash API `GET /api/v1/orders`.

---

### 2. Hiện trạng và mục tiêu nghiệp vụ chuỗi vận hành kho bãi TMS (Spider Express)

Mạng lưới kho vận TMS vận hành theo mô hình phân tầng 2 cấp (`Hub Cấp 1` trung chuyển vùng: HCM, Hưng Yên, Đà Nẵng; `Hub Cấp 2` xe bo gom giao nội tỉnh):

```mermaid
flowchart TD
    A["Đơn hàng mới tạo (DRAFT / Nháp)"] --> B{"Lập chuyến xe xuất kho"}
    B -->|Gom đơn nháp| C["Gán vào Chuyến xuất kho (PENDING)"]
    B -->|Chọn đơn đã lưu kho| D["Đơn lưu kho sẵn sàng xuất"]
    
    C --> E{"Kiểm tra trước khi Xác nhận xuất"}
    D --> E
    
    E -->|Có đơn nháp chờ xe nhập| F["Khóa nút Xác nhận - Bắt buộc Chờ xử lý"]
    E -->|100% đơn đã nhập kho| G["Cho phép Xác nhận xuất kho (IN_TRANSIT)"]
    
    subgraph S1 ["Tác nghiệp Chuyến xe Chờ xử lý (isPending)"]
        H1["Màn hình Nhập kho & Xuất kho"]
        H2["Nút 1: 'Tiếp tục' (Mở modal kiểm đếm / chỉnh sửa)"]
        H3["Nút 2: 'Hủy nháp' (Soft-delete trip_stop, order, trip)"]
        H1 --> H2
        H1 --> H3
    end
    
    subgraph S2 ["Xem chi tiết chuyến xe xuất kho"]
        K1["Bảng kê đơn hàng trong chuyến"]
        K2["Cột 'BIỂN SỐ XE NHẬP DỰ KIẾN'"]
        K3["Đơn nháp -> Hiện Biển số xe tải nhập"]
        K4["Đơn lưu kho -> Hiện gạch ngang '—'"]
        K1 --> K2 --> K3
        K2 --> K4
    end
```

---

### 3. Các quy chuẩn bất biến (Core Invariants) bắt buộc tuân thủ

1. **Quy chuẩn kiểm soát kiện vận tải (No-SKU Rule)**:
   - Hệ thống **KHÔNG quản lý mã SKU hay danh mục sản phẩm chi tiết**.
   - Quản lý hàng hóa thuần túy theo thông số kiện vận tải: Tên mặt hàng, Số kiện, Khối lượng ($Kg$), Thể tích ($m^3$).
2. **Quy chuẩn không quản lý vị trí kho (No Bin/Rack Location)**:
   - Hàng hóa chỉ quản lý theo phạm vi Hub (`currentHubId`) và Trạng thái tồn kho (`IN_WAREHOUSE`, `DRAFT`, `IN_TRANSIT`).
   - Tuyệt đối không thêm cột hay trường `binLocation`, `rackNumber`, `zoneId`.
3. **Quy chuẩn mật độ giao diện hẹp (UI Compact Density & Zero Oversized Spacing)**:
   - Banned classes: Không sử dụng `p-4`, `p-6`, `space-y-3`, `gap-4`.
   - Card base padding 4px (`p-1`/`py-0`), modal body `p-2`, gap nội bộ `<= 8px` (`gap-1.5` đến `gap-2`).
   - Cỡ chữ ô bảng dữ liệu: `text-[10px]`, chiều cao dòng ~26px (`py-1 px-1.5`).
4. **Quy chuẩn triệt tiêu icon trùng lặp (Zero Redundant Icons Rule)**:
   - Không lặp ký tự emoji hay ký hiệu bên cạnh icon vector (ví dụ dùng `<Button><IconPlus /> Tạo đơn</Button>`, cấm `<Button><IconPlus /> + Tạo đơn</Button>`).
5. **Dữ liệu thật 100% (Zero Mock Data Mandate)**:
   - Mọi thao tác kết nối trực tiếp với Database PostgreSQL trên Neon qua REST API. Không dùng mảng giả hay fallback fake data.

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
1. **Thiếu nút "Hủy nháp" trên Màn hình Nhập kho** (Đối chiếu [`feedbacks/feedback_14_10_task_54/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_54/screenshot_01.jpg)):
   - **Hiện tượng cũ**: Tại cột THAO TÁC của chuyến xe trạng thái `Chờ xử lý`, hệ thống chỉ hiển thị nút duy nhất `✎ Tiếp tục`.
   - **Hệ quả**: Khi thủ kho tạo nhầm một chuyến nhập hoặc tài xế báo hủy chuyến, thủ kho không thể xóa bỏ chuyến nháp đó, dẫn đến bảng điều độ ứ đọng dữ liệu rác.
   - **Giải pháp chuẩn hóa**: Bổ sung nút `Hủy nháp` (variant outline đỏ, icon `IconTrash`, kích thước `h-7`, `text-[11px]`) đứng cạnh nút `Tiếp tục`.

2. **Cột thông tin không phù hợp "ĐIỂM BỐC HÀNG" trên Modal Chuyến Xuất** (Đối chiếu [`feedbacks/feedback_14_10_task_53/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_53/screenshot_01.jpg)):
   - **Hiện tượng cũ**: Khi xem chi tiết chuyến xe xuất kho, bảng kê hiển thị cột `ĐIỂM BỐC HÀNG`.
   - **Hệ quả**: Với các đơn hàng xuất từ Hub trung tâm, thông tin điểm bốc không giúp ích cho việc điều độ. Thủ kho cần biết đơn nháp gom chuyển tiếp đang nằm trên xe nhập nào dự kiến về Hub.
   - **Giải pháp chuẩn hóa**: Đổi tên cột thành `BIỂN SỐ XE NHẬP DỰ KIẾN`. Các đơn nháp hiển thị biển số xe nhập đang `PENDING`; đơn đã lưu kho hiển thị `—`.

3. **Tiêu đề phụ và nút bốc dọc đường hiển thị sai ngữ cảnh** (Đối chiếu [`feedbacks/feedback_14_10_task_52/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_52/screenshot_01.jpg)):
   - **Hiện tượng cũ**: Modal xem đơn của chuyến xe xuất/nhập tạo mới từ Hub hiện tại lại hiển thị tiêu đề `Kiểm đếm dỡ hàng & Nhập kho` và nút `+ Bốc thêm đơn dọc đường về Hub`.
   - **Hệ quả**: Gây hiểu nhầm rằng chuyến xe này là xe ghé trạm trung chuyển để dỡ hàng.
   - **Giải pháp chuẩn hóa**: Kiểm tra cờ `isTripOriginHere = true` để ẩn hoàn toàn khối tiêu đề dỡ hàng và ẩn nút bốc thêm đơn dọc đường.

4. **Bộ định tuyến n8n xử lý lệnh `/feedback` rỗng**:
   - **Hiện tượng**: Khi người dùng gõ `/feedback@please_choose_auto_bot` từ menu bot mà không nhập thêm text, bộ lọc regex loại bỏ phần lệnh khiến biến prompt rỗng, fallback về chính chuỗi `/feedback@please_choose_auto_bot`.
   - **Khắc phục**: Thiết lập kịch bản tự động phân loại đây là yêu cầu tổng rà soát nghiệp vụ, kích hoạt `/leader` thiết lập bộ checklist kiểm soát chất lượng hoàn chỉnh.

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Xác thực API Hủy chuyến nháp Nhập kho (`warehouse.controller.ts` & `warehouse.service.ts`)**
  * 📍 File: `backend/src/orders/warehouse.controller.ts`
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` được bảo vệ bằng `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.WAREHOUSE_MANAGER)`.**
- ✅ **Logic `cancelInboundDraft`: Sử dụng transaction soft-delete bản ghi `trip_stop` tương ứng trạng thái `PENDING`, soft-delete các đơn `order` nháp gắn với chuyến xe, và soft-delete `trip` nháp.**
- ✅ **Xác thực API Hủy chuyến nháp Xuất kho (`warehouse.controller.ts` & `warehouse.service.ts`)**
  * 📍 File: `backend/src/orders/warehouse.controller.ts`
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Endpoint `DELETE /api/v1/warehouse/outbound/drafts/:tripCode` hoạt động ổn định, không làm suy giảm tồn kho thực tế.**
- ✅ **Xác thực trường DTO `expectedInboundLicensePlate` (`warehouse.service.ts`)**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Hàm `enrichWarehouseRows` quét tìm `licensePlate` từ các chuyến xe nhập `PENDING` cho đơn chưa lưu kho (`isStored = false`).**
- ✅ **Đơn đã lưu kho (`isStored = true`) trả về `null`.**
- ✅ **Xác thực Endpoint Danh sách Đơn hàng (`orders.service.ts`)**
  * 📍 File: `backend/src/orders/orders.service.ts`
- ✅ **Gỡ bỏ triệt để các lệnh join ảo `trips.vehicle` và `trips.driver` (lỗi 500 đã được xử lý ở Task #63).**
- ✅ **Kiểm tra biên dịch Backend**: `npm --prefix backend run build` đạt `Exit code 0`.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Đồng bộ giao diện Màn hình Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx))**
  * 📍 File: `frontend/src/app/dashboard/warehouse/inbound/page.tsx`
- ✅ **Cột THAO TÁC cho chuyến `Chờ xử lý` hiển thị cặp nút**
- ✅ **Hàm `handleCancelDraft` có hộp thoại xác nhận `window.confirm` và gọi API `DELETE /warehouse/inbound/drafts/:tripCode`.**
- ✅ **Đồng bộ giao diện Màn hình Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx))**
  * 📍 File: `frontend/src/app/dashboard/warehouse/outbound/page.tsx`
- ✅ **Đảm bảo cấu trúc nút `Tiếp tục` và `Hủy nháp` hoàn toàn tương đồng về kích thước (`h-7`), font (`text-[11px]`) và khoảng cách (`gap-1.5`).**
- ✅ **Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`
- ✅ **Header cột bảng kê hiển thị `BIỂN SỐ XE NHẬP DỰ KIẾN` khi `mode === 'OUTBOUND'`.**
- ✅ **Ẩn khối tiêu đề phụ "Kiểm đếm dỡ hàng" và nút "Bốc thêm đơn dọc đường" khi `isTripOriginHere = true`.**
- ✅ **Tuân thủ quy chuẩn UI Compact Density**
- ✅ **Tuyệt đối không sinh class cấm (`p-4`, `space-y-3`, `gap-4`).**
- ✅ **Font chữ bảng dữ liệu đạt chuẩn `text-[10px]`, chiều cao dòng gọn gàng.**
- ✅ **Kiểm tra biên dịch Frontend**: `npm --prefix frontend run build` đạt `Exit code 0`.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Kịch bản kiểm thử đồng bộ 2 nút Nhập kho**: [`frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`](file:///frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts).**
- ✅ **Kịch bản kiểm thử biển số xe nhập dự kiến**: [`frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`](file:///frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts).**
- ✅ **Kịch bản kiểm thử clean header & loại bỏ bốc dọc đường**: [`frontend/e2e/52-trip-detail-view-clean-header-and-no-roadside.spec.ts`](file:///frontend/e2e/52-trip-detail-view-clean-header-and-no-roadside.spec.ts).**
- ✅ **Xác thực ảnh nghiệm thu verified**: Ghi nhận bằng chứng thực tế tại [`screenshot_01_verified.png`](file:///feedbacks/feedback_14_10_task_65/screenshot_01_verified.png).**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).
- **Môi trường Dev Live**:
  * Frontend: `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app`
  * Backend: `https://logistics-website-backend-1jho.onrender.com`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://logistics-website-backend-1jho.onrender.com/api/v1/health` -> HTTP 200 OK.

### Hình ảnh minh chứng đã lưu trữ (1 tệp):
- 📸 **screenshot_01_verified.png**: [Xem hình ảnh](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_65/screenshot_01_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 2 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 3 | `backend/src/orders/orders.service.ts` | Backend (NestJS) |
| 4 | `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Frontend (Next.js) |
| 5 | `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Frontend (Next.js) |
| 6 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 7 | `frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts` | Frontend (Next.js) |
| 8 | `frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts` | Frontend (Next.js) |
| 9 | `frontend/e2e/52-trip-detail-view-clean-header-and-no-roadside.spec.ts` | Frontend (Next.js) |
| 10 | `feedbacks/feedback_14_10_task_65/screenshot_01_verified.png` | Source |
| 11 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 12 | `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx` | Frontend (Next.js) |
| 13 | `docs/SYSTEM_TIMELINE.md` | Documentation |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_65/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
