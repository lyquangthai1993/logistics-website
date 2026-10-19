# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_19_10_TASK_91] — Feedback 19/10 (Task #91) — Gom 1 Dòng Duy Nhất Cho Đơn Hàng Nhập Nhiều Lần, Cộng Dồn Số Lượng/Kg/Khối & Khóa Cứng Thông Tin Gốc Khi Nhập Mới Trùng Mã Vận Đơn

> **Thời gian nghiệm thu**: 19/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (6/6 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý vận hành)  
> **Phạm vi tác động**: Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Task 1 (Backend - Canonical First-Entry Lookup)**: Cập nhật `OrdersService.findOne(idOrCode)` tại `backend/src/orders/orders.service.ts` dùng `order: { id: 'ASC' }` khi tra cứu theo `orderCode` để trả về thông tin gốc lần đầu nhập.**
  * 📍 File: `backend/src/orders/orders.service.ts`
- ✅ **Task 2 (Backend - Inbound Consolidation & Master Field Lock)**: Cập nhật `quickCreateInboundOrder` và `batchCreateInboundOrders` tại `backend/src/orders/warehouse.service.ts` để khi `orderCode` đã tồn tại thì giữ nguyên tên hàng & địa điểm giao gốc, chỉ cập nhật điểm lấy cho chuyến xe mới và cộng dồn số lượng, số kg, số khối vào đơn gốc (thay vì tách thêm dòng `OrderEntity` mới).**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Task 3 (Backend - Single-Row Aggregation & Outbound Multi-Line FIFO)**: Cập nhật `aggregateOrderGroup`, `getWarehouseOrders` (`OUTBOUND_LOOKUP`), `confirmOutbound` và `saveOutboundDraft` tại `backend/src/orders/warehouse.service.ts` để lấy tên hàng/đích đến theo lần nhập đầu, gom 1 dòng khi tra cứu xuất kho và tự động trừ tồn FIFO qua các bản ghi cùng `orderCode`.**
  * 📍 File: `backend/src/orders/warehouse.service.ts`

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Task 4 (Frontend - Lock Master Fields on Existing Waybill in Inbound Grid)**: Cập nhật `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` để khi nhập mã vận đơn đã tồn tại thì khóa cứng `Tên hàng hóa`, `Địa chỉ giao / Đích đến`, `Tỉnh/TP`, `Chứng từ` theo lần đầu nhập; chỉ mở cho sửa `Địa chỉ nhận (Điểm lấy)`, `Số kiện`, `Số kg`, `Số m³`, `Ghi chú`.**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`
- ✅ **Task 5 (Frontend - Single Unified Row in Warehouse Orders Screen)**: Cập nhật `frontend/src/app/dashboard/warehouse/orders/page.tsx` để hiển thị 1 dòng tổng hợp duy nhất cho mỗi mã vận đơn, loại bỏ xổ dòng con `Dòng 1..N` và badge `N dòng`, đồng bộ nút thao tác và xuất Excel.**
  * 📍 File: `frontend/src/app/dashboard/warehouse/orders/page.tsx`

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Task 6 (Verification - Build, Typecheck & Playwright E2E)**: Chạy `npm run build` ở cả `backend/` và `frontend/`, viết và chạy Playwright E2E test kiểm chứng thực tế với tài khoản `warehouse_hcm` (`Andromeda Hub - HCM`), chụp ảnh bằng chứng nghiệm thu và ghi `RESOLUTION.md`.**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).
- **Môi trường Dev Live (Primary - Railway Cloud)**:
  * Frontend: `https://frontend-tms-core-dev.up.railway.app`
  * Backend: `https://backend-tms-core-dev.up.railway.app`
  * Swagger API Docs: `https://backend-tms-core-dev.up.railway.app/docs`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health` -> HTTP 200 OK.

### Hình ảnh minh chứng đã lưu trữ (4 tệp):
- 📸 **screenshot_01.png**: [Xem hình ảnh](./screenshot_01.png)
- 📸 **screenshot_02.png**: [Xem hình ảnh](./screenshot_02.png)
- 📸 **screenshot_03.png**: [Xem hình ảnh](./screenshot_03.png)
- 📸 **screenshot_feedback_19_10_task_91_verified.png**: [Xem hình ảnh](./screenshot_feedback_19_10_task_91_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/orders.service.ts` | Backend (NestJS) |
| 2 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 3 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Frontend (Next.js) |
| 5 | `frontend/src/app/auth/forgot-password/page.tsx` | Frontend (Next.js) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../../docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
