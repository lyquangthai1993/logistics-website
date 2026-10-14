# Feedback 14/10 (Task #76) — Bổ Sung & Chuẩn Hóa Thông Tin "Địa Chỉ Giao Hàng" Vào Phiếu Nhập Kho (Inbound Receipt)

> **Thời gian ghi nhận**: 14/10/2026 15:10:00  
> **Người báo cáo**: @User / Vận hành Kho (TMS Warehouse Operator)  
> **Phạm vi tác động**:  
> - Quản lý Nhập kho (`/warehouse/inbound`) ➔ Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx))  
> - Bảng điều phối nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx))  
> - Modal Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))  
> - Backend Quản lý Kho bãi ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))  
> **Tài liệu tham chiếu**:  
> - TMS Business Domain Lead Architecture ([`/leader SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///.agents/skills/ui-spacing-guard/SKILL.md)  
> - Quy chuẩn kiện hàng No-SKU, Consignment Level  
> **Ảnh minh chứng đính kèm trong thư mục**:  
> - [`screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_76/screenshot_01.jpg): Mẫu phiếu nhập kho thực tế (`docs_scan/mau_phieu_nhap_kho.JPG`) thể hiện cấu trúc thông tin tiếp nhận hàng và bảng kê hàng hóa tại kho.  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

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

## 🔍 Tổng hợp các điểm chưa đúng trên hệ thống hiện tại (RCA)

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

## 📋 Danh sách công việc triển khai (Action Checklist)

### 💻 1. Phân hệ Backend (`backend/`)

- [ ] **Chuẩn hóa trích xuất `deliveryAddress` trong `WarehouseService.getInboundTrips`** ([`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)):
  - [ ] Bổ sung hàm tiện ích bóc tách `deliveryAddress` từ thực thể `OrderEntity`:
    * Ưu tiên 1: Cắt chuỗi từ `order.route` (`order.route.includes('→') ? order.route.split('→')[1]?.trim() : ''`).
    * Ưu tiên 2: Trích xuất từ regex trong `order.notes` (`/\[Giao khách:\s*([^\]]+)\]/`).
    * Ưu tiên 3: Lấy từ `order.destinationHubEntity?.address` hoặc `order.destinationHub` / `order.province`.
  - [ ] Gán trường `deliveryAddress` vào từng object đơn hàng trong mảng `orders: tripOrders` trả về client.
- [ ] **Rà soát API `getTripManifest`** ([`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)):
  - [ ] Đảm bảo trường `deliveryAddress` và `originalDeliveryAddress` luôn được trích xuất chính xác và không bị đè bởi tên Hub trung chuyển nếu có địa chỉ khách lẻ.
- [ ] **Kiểm tra biên dịch Type Check Backend**:
  - [ ] Chạy `npm run build --prefix backend` và `npm run lint --prefix backend` đảm bảo 0 lỗi.

### 🎨 2. Phân hệ Frontend (`frontend/`)

- [ ] **Cập nhật Modal In Phiếu Nhập Kho** ([`frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)):
  - [ ] **Khối Thông Tin Đầu Phiếu (Header Info Grid)**:
    * Bổ sung hiển thị `Địa chỉ giao hàng` / `Nơi nhận cuối` vào bảng `info-grid-table` (cả bản xem trước React và bản in iframe HTML, hỗ trợ cả khổ ngang và khổ dọc).
    * Khi phiếu có nhiều dòng hàng khác nhau: hiển thị `Theo danh mục chi tiết bên dưới` hoặc gom nhóm Tỉnh/TP đích. Khi phiếu có 1 đơn hàng hoặc các đơn cùng đích đến: hiển thị đầy đủ địa chỉ giao hàng cụ thể.
  - [ ] **Bảng Kê Chi Tiết Hàng Hóa (Items Table)**:
    * Đảm bảo cột `Địa chỉ giao hàng` luôn render chính xác `it.deliveryAddress` (địa chỉ khách nhận hoặc Hub/trạm xe bo đích), không bị hiển thị dấu gạch ngang `—` sai lệch.
    * Đảm bảo layout bảng tuân thủ chặt chẽ quy chuẩn compact density, không vỡ layout khi in A4.
- [ ] **Sửa lỗi ưu tiên dữ liệu trong `WarehouseTripDetailModal`** ([`frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)):
  - [ ] Điều chỉnh hàm `handlePrintReceipt`:
    * Đổi thứ tự ưu tiên gán `deliveryAddress`:
      ```typescript
      deliveryAddress: l.deliveryAddress || l.originalDeliveryAddress || l.destinationHub || l.destinationHubEntity?.name || '—'
      ```
    * Ưu tiên địa chỉ giao hàng thực tế lên hàng đầu thay vì tên Hub.
- [ ] **Cập nhật hàm `handleOpenReceiptForVehicle` trong `inbound/page.tsx`** ([`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)):
  - [ ] Thêm logic fallback trích xuất thông minh từ `o.route` hoặc `o.notes` ngay tại frontend để đề phòng cache dữ liệu cũ chưa có trường từ backend.
  - [ ] Gán đúng `deliveryAddress` vào `selectedReceiptData` và từng phần tử trong `items`.
- [ ] **Kiểm tra biên dịch Frontend**:
  - [ ] Chạy `npm run build --prefix frontend` (Turbopack + TypeScript strict check) đảm bảo 0 lỗi.

### 🧪 3. Kiểm thử Tự động E2E & Bằng chứng Nghiệm thu (Playwright)

- [ ] **Khởi tạo kịch bản kiểm thử E2E Playwright**:
  - [ ] Tạo file test `frontend/e2e/76-feedback-14-10-task-76-inbound-receipt-delivery-address.spec.ts`.
  - [ ] Đăng nhập với tài khoản Thủ kho (`USER_WAREHOUSE_HCM` hoặc `USER_WAREHOUSE_DAD`).
  - [ ] Mở màn hình Quản lý Nhập kho (`/warehouse/inbound`).
  - [ ] Mở modal In Phiếu Nhập Kho từ Bảng điều phối chuyến xe và từ Chi tiết chuyến xe kiểm đếm dỡ hàng.
  - [ ] Kiểm tra xác nhận:
    1. Cột `Địa chỉ giao hàng` trên bảng kê hiển thị đúng thông tin địa chỉ giao hàng thực tế (không hiển thị `—` hoặc tên Hub đè lên sai lệch).
    2. Khối thông tin đầu phiếu (Header Info Grid) hiển thị đầy đủ thông tin địa chỉ giao hàng hợp lệ.
- [ ] **Chụp ảnh bằng chứng nghiệm thu**:
  - [ ] Xuất ảnh `screenshot_01_verified.png` lưu vào thư mục `feedbacks/feedback_14_10_task_76/`.
- [ ] **Cross-Evaluation Audit**:
  - [ ] Chạy `node scripts/e2e-auditor.mjs` đạt điểm $\ge 40/50$, 0 lỗi Auto-FAIL.

### 📜 4. Biên niên sử Kỹ thuật & Hoàn tất Quy trình

- [ ] Sinh file `RESOLUTION.md` và cập nhật `docs/SYSTEM_TIMELINE.md` thông qua lệnh `npm run todo:record feedback_14_10_task_76`.
- [ ] Báo cáo tóm tắt kế hoạch và nghiệm thu cho Quản lý nghiệp vụ.
