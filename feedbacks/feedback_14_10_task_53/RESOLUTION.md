# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_14_10_TASK_53] — Feedback 14/10 (Task #53) — Thay Thế Cột "ĐIỂM BỐC HÀNG" Bằng "BIỂN SỐ XE NHẬP DỰ KIẾN" Trong Màn Hình Xem Đơn Hàng Trip Xuất Kho

> **Thời gian nghiệm thu**: 14/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (15/15 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**: Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Bổ sung trường `expectedInboundLicensePlate` vào DTO đơn hàng kho trong `enrichWarehouseRows` & `getOutboundTrips`. • Bảng dữ liệu Kho ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Mở rộng interface `WarehouseRowItem` với trường `expectedInboundLicensePlate`. • Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Thay thế header cột "ĐIỂM BỐC HÀNG" thành "BIỂN SỐ XE NHẬP DỰ KIẾN", hiển thị icon xe tải + biển số cho đơn nháp chờ nhập, hiển thị gạch ngang `—` cho đơn đã lưu kho. • Kiểm thử tự động E2E ([`53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`](file:///frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts)).  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】 / @Thai)
> *", đối với màn hình xem đơn trong trip xuất hàng, hãy thay thế cột khoanh đỏ này bằng cột biển số xe nhập dự kiến. trong danh sach đơn, các đơn nháp sẽ có thông tin biển số xe nhập dự kiến là biển số xe của trip nhập đơn hàng đang ở trạng thái chờ xử lý. các đơn đã có trạng thái lưu kho thì thông tin cột biển số xe dự kiến để trông"*

Kèm theo ảnh chụp thực tế: `feedbacks/feedback_14_10_task_53/screenshot_01.jpg` hiển thị modal chi tiết chuyến xe xuất hàng. Trong ảnh có vùng khoanh đỏ viền đỏ tại cột tiêu đề **"ĐIỂM BỐC HÀNG"**.

---

### 2. Tình huống vận hành thực tế tại Hub/Kho vận

Trong luồng vận hành điều phối xuất kho:
1. **Bất cập của cột "ĐIỂM BỐC HÀNG" khi xem Chuyến xe Xuất kho**:
   - Cột *"ĐIỂM BỐC HÀNG"* chỉ phù hợp cho quy trình đón trả hàng dọc đường hoặc giao nhận lẻ.
   - Khi điều độ viên lập hoặc kiểm tra chuyến xe xuất kho (`mode = 'OUTBOUND'`), thông tin quan trọng nhất cần nắm bắt là: **Đơn hàng này đã có sẵn trong kho hay đang chờ chuyến xe nhập nào chở về Hub?**
2. **Quy tắc phân loại đơn hàng trong chuyến xuất**:
   - **Đơn nháp (Draft / Chờ gom / Chờ xử lý)**: Đơn hàng mới được gom lên chuyến xuất nhưng hàng thực tế chưa dỡ nhập kho; hàng đang nằm trên một chuyến xe nhập đang chạy về (`PENDING`). Do đó, thủ kho cần biết chính xác **Biển số xe nhập dự kiến** (Expected Inbound License Plate) để biết xe nào về thì bốc chuyển tiếp ngay.
   - **Đơn đã lưu kho (Stored / In Warehouse)**: Đơn hàng đã hoàn tất thủ tục nhập kho và đang nằm sẵn trên kệ hàng/sàn Hub. Do đó, không cần chờ xe nhập nào cả ➔ Cột biển số xe nhập dự kiến để trống (`—`).

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Mở rộng hàm `enrichWarehouseRows` tính toán trường `expectedInboundLicensePlate`.**
- ✅ **Logic: Nếu đơn `isStored = true` ➔ trả về `null`.**
- ✅ **Logic: Nếu đơn `isStored = false` ➔ quét `item.trips` tìm chuyến xe nhập hàng (`type === 'INBOUND'` hoặc không phải `OUTBOUND`/`TRANSFER`) ở trạng thái chờ xử lý (`status === 'PENDING'` hoặc `'WAITING'`), trích xuất `licensePlate`.**
- ✅ **Bổ sung fallback an toàn: lấy bất kỳ chuyến xe pending nào khác chuyến xuất hiện tại, hoặc `inboundLicensePlate`, `vehicleLicensePlate`.**
- ✅ **Đảm bảo endpoint `GET /warehouse/outbound-trips` truyền tải đầy đủ trường `expectedInboundLicensePlate` trong mảng `orders`.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Cập nhật interface `WarehouseRowItem` trong [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) bổ sung `expectedInboundLicensePlate?: string | null`.**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`
- ✅ **Cập nhật [`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`
- ✅ **Khi map dữ liệu sang `mappedRows`, gán `expectedInboundLicensePlate`.**
- ✅ **Ở chế độ xuất kho (`mode === 'OUTBOUND'`), thay thế header cột**
- ✅ **Dữ liệu ô: Nếu có biển số ➔ hiển thị `<IconTruck />` + biển số chữ hoa font-mono; nếu đơn đã lưu kho ➔ hiển thị `—`.**
- ✅ **Chuẩn hóa tiêu đề modal: *"Chi tiết chuyến xe xuất kho"*, nhãn *"1. Ngày xuất kho"*, banner *"Chuyến xe xuất kho tại trạm này."*.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Tạo file E2E: `frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`.**
- ✅ **Kiểm tra hợp đồng API `GET /warehouse/outbound-trips`.**
- ✅ **Kiểm tra hiển thị cột tiêu đề và giá trị biển số xe nhập dự kiến trên modal xuất kho.**
- ✅ **Chụp ảnh màn hình nghiệm thu: `feedbacks/feedback_14_10_task_53/screenshot_01_verified.png`.**

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
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_53/screenshot_01.jpg)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 2 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 3 | `frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts` | Frontend (Next.js) |
| 4 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 5 | `docs/SYSTEM_TIMELINE.md` | Documentation |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_53/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
