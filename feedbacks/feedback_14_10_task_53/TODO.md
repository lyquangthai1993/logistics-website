# Feedback 14/10 (Task #53) — Thay Thế Cột "ĐIỂM BỐC HÀNG" Bằng "BIỂN SỐ XE NHẬP DỰ KIẾN" Trong Màn Hình Xem Đơn Hàng Trip Xuất Kho

> **Thời gian ghi nhận**: 14/10/2026  
> **Người báo cáo**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**:  
> - Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Bổ sung trường `expectedInboundLicensePlate` vào DTO đơn hàng kho trong `enrichWarehouseRows` & `getOutboundTrips`.  
> - Bảng dữ liệu Kho ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Mở rộng interface `WarehouseRowItem` với trường `expectedInboundLicensePlate`.  
> - Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Thay thế header cột "ĐIỂM BỐC HÀNG" thành "BIỂN SỐ XE NHẬP DỰ KIẾN", hiển thị icon xe tải + biển số cho đơn nháp chờ nhập, hiển thị gạch ngang `—` cho đơn đã lưu kho.  
> - Kiểm thử tự động E2E ([`53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`](file:///frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts)).  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](file:///.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md) (Zero Technical Jargon, Compact Density, Real DB Data)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md)  
> - Ảnh chụp minh chứng phản hồi: [`feedbacks/feedback_14_10_task_53/screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_53/screenshot_01.jpg)  
> - Biên bản hoàn thành kỹ thuật: [`feedbacks/feedback_14_10_task_53/RESOLUTION.md`](file:///feedbacks/feedback_14_10_task_53/RESOLUTION.md)  
> - Biên niên sử tiến hóa hệ thống [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md)  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng & Ảnh screenshot_01.jpg)

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

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Backend (NestJS 11 - `backend/src/orders/warehouse.service.ts`)
- [x] Mở rộng hàm `enrichWarehouseRows` tính toán trường `expectedInboundLicensePlate`.
- [x] Logic: Nếu đơn `isStored = true` ➔ trả về `null`.
- [x] Logic: Nếu đơn `isStored = false` ➔ quét `item.trips` tìm chuyến xe nhập hàng (`type === 'INBOUND'` hoặc không phải `OUTBOUND`/`TRANSFER`) ở trạng thái chờ xử lý (`status === 'PENDING'` hoặc `'WAITING'`), trích xuất `licensePlate`.
- [x] Bổ sung fallback an toàn: lấy bất kỳ chuyến xe pending nào khác chuyến xuất hiện tại, hoặc `inboundLicensePlate`, `vehicleLicensePlate`.
- [x] Đảm bảo endpoint `GET /warehouse/outbound-trips` truyền tải đầy đủ trường `expectedInboundLicensePlate` trong mảng `orders`.

### 2. Frontend (Next.js 15 App Router - `frontend/`)
- [x] Cập nhật interface `WarehouseRowItem` trong [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) bổ sung `expectedInboundLicensePlate?: string | null`.
- [x] Cập nhật [`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx):
  - [x] Khi map dữ liệu sang `mappedRows`, gán `expectedInboundLicensePlate`.
  - [x] Ở chế độ xuất kho (`mode === 'OUTBOUND'`), thay thế header cột:
    ```tsx
    <th className="py-1 px-1.5 min-w-[140px] text-center">BIỂN SỐ XE NHẬP DỰ KIẾN</th>
    ```
  - [x] Dữ liệu ô: Nếu có biển số ➔ hiển thị `<IconTruck />` + biển số chữ hoa font-mono; nếu đơn đã lưu kho ➔ hiển thị `—`.
  - [x] Chuẩn hóa tiêu đề modal: *"Chi tiết chuyến xe xuất kho"*, nhãn *"1. Ngày xuất kho"*, banner *"Chuyến xe xuất kho tại trạm này."*.

### 3. Kiểm Thử Tự Động (Playwright E2E)
- [x] Tạo file E2E: `frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`.
- [x] Kiểm tra hợp đồng API `GET /warehouse/outbound-trips`.
- [x] Kiểm tra hiển thị cột tiêu đề và giá trị biển số xe nhập dự kiến trên modal xuất kho.
- [x] Chụp ảnh màn hình nghiệm thu: `feedbacks/feedback_14_10_task_53/screenshot_01_verified.png`.

---

## 🛡️ Nghiệm Thu & Quality Gate
- **Backend Compile**: `npm run build --prefix backend` ➔ ✅ PASS (0 lỗi).
- **Frontend Typecheck**: `npm run typecheck --prefix frontend` ➔ ✅ PASS (0 lỗi).
- **Frontend Lint**: `npx oxlint` ➔ ✅ PASS (0 lỗi).
- **Cross-Audit**: Tuân thủ triệt để quy chuẩn Compact Density (`p-1`, `p-2`), Submodule-first git workflow.
