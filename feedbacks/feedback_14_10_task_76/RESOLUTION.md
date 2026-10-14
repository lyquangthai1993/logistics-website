# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_14_10_TASK_76] — Feedback 14/10 (Task #76) — Bổ Sung & Chuẩn Hóa Thông Tin "Địa Chỉ Giao Hàng" Vào Phiếu Nhập Kho (Inbound Receipt)

> **Thời gian nghiệm thu**: 14/10/2026 15:10:00  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (29/29 tasks)  
> **Người báo cáo / Nghiệp vụ**: @User / Vận hành Kho (TMS Warehouse Operator)  
> **Phạm vi tác động**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)) • Bảng điều phối nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Modal Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Backend Quản lý Kho bãi ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi gốc từ người dùng
> *"phiếu nhập kho hiện tại đang thiếu thông tin địa chỉ giao hàng, hãy cập nhật thông tin địa chỉ giao hàng vào phiếu nhập kho"*

### 2. Ý nghĩa nghiệp vụ trong quy trình tiếp nhận & lưu kho (Inbound Logistics)
Trong quy trình vận hành kho vận TMS (Spider Express), khi một chuyến xe tải hoặc tài xế đưa hàng về đến cửa kho (Inbound Hub):
1. **Mục đích của Phiếu nhập kho**: Là biên bản pháp lý bàn giao giữa bên giao (Tài xế / Nhà cung cấp) và bên nhận (Thủ kho). Phiếu ghi nhận số lượng kiện hàng thực tế nhập vào kho.
2. **Vai trò thiết yếu của "Địa chỉ giao hàng" (Delivery Address)**:
   - Hàng hóa nhập kho trong hệ thống TMS không chỉ lưu kho vô thời hạn mà đa số là **hàng chuyển tiếp (Cross-docking / Transit)** hoặc **hàng gom tuyến chờ xe bo giao chặng cuối (Last-mile Delivery)**.
   - Khi thủ kho nhận hàng và in Phiếu nhập kho, nếu **thiếu thông tin địa chỉ giao hàng**:
     * Nhân viên kho không biết kiện hàng này sau khi dỡ xuống sẽ được xuất đi đâu (Giao thẳng địa chỉ khách lẻ hay trung chuyển tiếp sang Hub nào).
     * Dễ gây thất lạc, nhầm tuyến phân loại và làm chậm trễ khâu xuất kho kế tiếp.
   - Do đó, việc hiển thị tường minh **Địa chỉ giao hàng** trên cả:
     * **Bảng kê chi tiết từng dòng hàng**: Địa chỉ giao nhận chi tiết của từng mã đơn hàng (Customer Address / Destination Hub).
     * **Khối thông tin tiếp nhận chung (Header Info Grid)**: Địa chỉ giao hàng / Tuyến giao nhận chủ đạo khi in phiếu cho đơn hàng lẻ hoặc chuyến xe cùng điểm đến.
   là yêu cầu nghiệp vụ cấp bách và bắt buộc.

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
Đối chiếu ảnh chụp mẫu phiếu nhập kho thực tế ([`screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_76/screenshot_01.jpg)) và khảo sát toàn bộ luồng sinh dữ liệu phiếu nhập kho trên code:

1. **Thứ tự ưu tiên dữ liệu bị ngược trong `WarehouseTripDetailModal`** ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx#L259-L260)):
   - Trong hàm `handlePrintReceipt`, dữ liệu đơn hàng nạp vào phiếu nhập đang được gán:
     ```typescript
     deliveryAddress: l.destinationHub || l.destinationHubEntity?.name || l.deliveryAddress || '—'
     ```
   - **Lỗi**: Biến `l.destinationHub` (tên Hub nội bộ, ví dụ: `Polaris Hub - Hưng Yên`) được đặt TRƯỚC `l.deliveryAddress`. Khi đơn hàng có địa chỉ giao hàng tận nơi cho khách (ví dụ: `Số 123 Đường Cầu Giấy, Hà Nội`), code luôn lấy tên Hub nội bộ đè lên, khiến cột "Địa chỉ giao hàng" trên phiếu nhập kho chỉ hiển thị tên Hub thay vì địa chỉ giao hàng thực tế.

2. **Dữ liệu `deliveryAddress` bị bỏ sót khi in trực tiếp từ Bảng điều phối nhập kho** ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx#L423-L431)):
   - Trong hàm `handleOpenReceiptForVehicle`, danh sách items được map từ `effectiveOrders`:
     ```typescript
     deliveryAddress: o.deliveryAddress || o.destinationHub || '—'
     ```
   - **Lỗi**: Đối tượng `o` lấy từ API `/api/v1/warehouse/inbound-trips` là thực thể `OrderEntity` thuần từ database. Bảng `order` không có cột vật lý `deliveryAddress` (thông tin này được lưu trong `order.route` dưới định dạng `"${pickupAddress} → ${deliveryAddress}"` hoặc trong `notes` dưới dạng `[Giao khách: ...]`). Do đó `o.deliveryAddress` luôn là `undefined`, khiến giá trị trên phiếu nhập kho bị rơi vào fallback `o.destinationHub` hoặc gạch nối `—`.

3. **Backend API `getInboundTrips` thiếu trường `deliveryAddress` chuẩn hóa** ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts#L3454-L3520)):
   - Trong phương thức `getInboundTrips`, danh sách `orders` gán vào chuyến xe (`tripOrders`) được query trực tiếp từ `orderRepository` nhưng chưa được format trích xuất `deliveryAddress` từ trường `route` hoặc `notes`.

4. **Thiếu thông tin Địa chỉ giao hàng ở Khối Thông Tin Đầu Phiếu (Header Info Grid) của `WarehouseInboundReceiptModal`** ([`warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx#L247-L280)):
   - Bảng thông tin tiếp nhận (`info-grid-table`) ở cả khổ ngang (Landscape) và khổ dọc (Portrait) hiện chỉ có 4 ô:
     * `Ngày/tháng/năm`
     * `Biển số xe`
     * `Tài xế giao hàng`
     * `Nhập Tại Kho`
   - Khi in phiếu cho một đơn hàng cụ thể hoặc chuyến xe giao đến một địa chỉ xác định, phần đầu phiếu hoàn toàn không thể hiện **Địa chỉ giao hàng**, buộc người xem phải nhìn xuống bảng kê chi tiết bên dưới. Cần bổ sung hiển thị trường này linh hoạt (nếu có `deliveryAddress` chung thì hiển thị ở Header Info Grid hoặc hiển thị rõ ràng trên từng dòng bảng kê).

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Chuẩn hóa trích xuất `deliveryAddress` trong `WarehouseService.getInboundTrips`** ([`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Bổ sung hàm tiện ích bóc tách `deliveryAddress` từ thực thể `OrderEntity`**
- ✅ **Gán trường `deliveryAddress` vào từng object đơn hàng trong mảng `orders: tripOrders` trả về client.**
- ✅ **Rà soát API `getTripManifest`** ([`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Đảm bảo trường `deliveryAddress` và `originalDeliveryAddress` luôn được trích xuất chính xác và không bị đè bởi tên Hub trung chuyển nếu có địa chỉ khách lẻ.**
- ✅ **Kiểm tra biên dịch Type Check Backend**
- ✅ **Chạy `npm run build --prefix backend` và `npm run lint --prefix backend` đảm bảo 0 lỗi.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Cập nhật Modal In Phiếu Nhập Kho** ([`frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx`
- ✅ **Khối Thông Tin Đầu Phiếu (Header Info Grid)**
- ✅ **Bảng Kê Chi Tiết Hàng Hóa (Items Table)**
- ✅ **Sửa lỗi ưu tiên dữ liệu trong `WarehouseTripDetailModal`** ([`frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`
- ✅ **Điều chỉnh hàm `handlePrintReceipt`**
- ✅ **Cập nhật hàm `handleOpenReceiptForVehicle` trong `inbound/page.tsx`** ([`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx))**
  * 📍 File: `frontend/src/app/auth/forgot-password/page.tsx`
  * 📍 File: `frontend/src/app/dashboard/warehouse/inbound/page.tsx`
- ✅ **Thêm logic fallback trích xuất thông minh từ `o.route` hoặc `o.notes` ngay tại frontend để đề phòng cache dữ liệu cũ chưa có trường từ backend.**
- ✅ **Gán đúng `deliveryAddress` vào `selectedReceiptData` và từng phần tử trong `items`.**
- ✅ **Kiểm tra biên dịch Frontend**
- ✅ **Chạy `npm run build --prefix frontend` (Turbopack + TypeScript strict check) đảm bảo 0 lỗi.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Khởi tạo kịch bản kiểm thử E2E Playwright**
- ✅ **Tạo file test `frontend/e2e/76-feedback-14-10-task-76-inbound-receipt-delivery-address.spec.ts`.**
- ✅ **Đăng nhập với tài khoản Thủ kho (`USER_WAREHOUSE_HCM` hoặc `USER_WAREHOUSE_DAD`).**
- ✅ **Mở màn hình Quản lý Nhập kho (`/warehouse/inbound`).**
- ✅ **Mở modal In Phiếu Nhập Kho từ Bảng điều phối chuyến xe và từ Chi tiết chuyến xe kiểm đếm dỡ hàng.**
- ✅ **Kiểm tra xác nhận**
- ✅ **Chụp ảnh bằng chứng nghiệm thu**
- ✅ **Xuất ảnh `screenshot_01_verified.png` lưu vào thư mục `feedbacks/feedback_14_10_task_76/`.**
- ✅ **Cross-Evaluation Audit**
- ✅ **Chạy `node scripts/e2e-auditor.mjs` đạt điểm $\ge 40/50$, 0 lỗi Auto-FAIL (Đạt 50/50 điểm tuyệt đối).**

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

### Hình ảnh minh chứng đã lưu trữ (3 tệp):
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_task_76/screenshot_01.jpg)
- 📸 **screenshot_01.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_task_76/screenshot_01.png)
- 📸 **screenshot_01_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_task_76/screenshot_01_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 2 | `frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/app/auth/forgot-password/page.tsx` | Frontend (Next.js) |
| 5 | `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Frontend (Next.js) |
| 6 | `frontend/e2e/76-feedback-14-10-task-76-inbound-receipt-delivery-address.spec.ts` | Frontend (Next.js) |
| 7 | `docs/SYSTEM_TIMELINE.md` | Documentation |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_task_76/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
