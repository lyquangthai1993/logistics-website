# TODO: BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN KẾ HOẠCH NÂNG CẤP VẬN HÀNH KHO (FEEDBACK 04/10)

> **Tài liệu tham chiếu**:  
> - Đánh giá hiện trạng: [`feedback_04_10/feedback_UI_and_flow_improve.md`](./feedback_UI_and_flow_improve.md)  
> - Kế hoạch triển khai AI Agent: [`feedback_04_10/plan_AI_agent_implementation.md`](./plan_AI_agent_implementation.md)  
> - Kiến trúc chuẩn TMS: [`IMPLEMENT_STATUS_TRIP_AND_ORDER.md`](../IMPLEMENT_STATUS_TRIP_AND_ORDER.md)  
> - Quy chuẩn mật độ giao diện: [`.agents/rules/ui-compact-density.md`](../.agents/rules/ui-compact-density.md)  
> **Trạng thái tổng thể**: ✅ **HOÀN THÀNH TOÀN BỘ (100% DONE)**  
> **Ngày lập**: 04/10/2026  

---

## 📊 BẢNG TỔNG HỢP TIẾN ĐỘ (PROGRESS TRACKER)

| # | Hạng mục công việc | File đích | Ưu tiên | Trạng thái |
|---|---|---|:---:|:---:|
| **1** | Bỏ nút "Nhận luân chuyển nội bộ" & bỏ cột "Loại tiếp nhận" tại Inbound | `frontend/.../warehouse/inbound/page.tsx` | Cao | [x] **Hoàn thành** |
| **2** | Bỏ cột "Loại xuất kho" tại Outbound Board (giảm `colSpan` = 6) | `frontend/.../warehouse/outbound/page.tsx` | Cao | [x] **Hoàn thành** |
| **3** | Nâng cấp "In phiếu xuất" thành Phiếu Xuất Tổng của Chuyến xe (N đơn) | `warehouse-outbound-receipt-modal.tsx` & `outbound/page.tsx` | Cốt lõi | [x] **Hoàn thành** |
| **4** | Bỏ cột "Tỉnh/TP" khi tạo mới đơn xuất kho (`isOutboundMode = true`) | `warehouse-editable-grid.tsx` | Trung bình | [x] **Hoàn thành** |
| **5** | Tái cấu trúc UX Cột "Địa chỉ giao": 2 tùy chọn + Popover Hub L1 / Xe bo | `warehouse-editable-grid.tsx` | Cốt lõi | [x] **Hoàn thành** |
| **6** | Fix xung đột Filter DRAFT vs COMPLETED_INBOUND trong Modal Tra Cứu Kho | `warehouse-lookup-modal.tsx` | Cao | [x] **Hoàn thành** |
| **7** | Kiểm thử TypeScript Build (`run build`) & nghiệm thu hiển thị | Toàn bộ Frontend | Bắt buộc | [x] **Hoàn thành (0 lỗi)** |

---

## 📝 DANH SÁCH CHI TIẾT TỪNG NHIỆM VỤ (TASK BREAKDOWN)

### 📌 TASK 1: Dọn Dẹp Bảng & Header Màn Hình Nhập Kho (Inbound)
- [x] **1.1. Xóa nút "Nhận luân chuyển nội bộ" tại Header**
  - **File**: [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)
  - **Vị trí**: Dòng ~670–674.
  - **Yêu cầu**: Xóa thẻ `<Button onClick={() => setActiveView('MODE2_TRANSFER')}>... Nhận luân chuyển nội bộ</Button>`. Chỉ giữ lại nút duy nhất: `Tạo đơn nhập mới`.
  - **Trạng thái**: [x] Hoàn thành

- [x] **1.2. Xóa cột "LOẠI TIẾP NHẬN" trong Bảng Inbound Board**
  - **File**: [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)
  - **Vị trí**:
    * Thẻ `<th>`: Dòng ~837 (`<th className='py-1.5 px-2 text-center w-[100px]'>LOẠI TIẾP NHẬN</th>`).
    * Thẻ `<td>`: Dòng ~953–964 (`Badge: Luân chuyển / Khách gửi`).
  - **Yêu cầu**: Xóa thẻ `<th>` và `<td>`; cập nhật tất cả các vị trí `colSpan={7}` (loading, empty, subrow) thành `colSpan={6}`.
  - **Trạng thái**: [x] Hoàn thành

---

### 📌 TASK 2: Dọn Dẹp Bảng Màn Hình Xuất Kho (Outbound)
- [x] **2.1. Xóa cột "LOẠI XUẤT KHO" trong Bảng Outbound Board**
  - **File**: [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)
  - **Vị trí**:
    * Thẻ `<th>`: Dòng ~923 (`<th className='py-1.5 px-2 text-center w-[100px]'>LOẠI XUẤT KHO</th>`).
    * Thẻ `<td>`: Dòng ~1039–1050 (`Badge: Luân chuyển / Xuất khách`).
  - **Yêu cầu**: Xóa thẻ `<th>` và `<td>`; cập nhật tất cả các vị trí `colSpan={7}` thành `colSpan={6}`.
  - **Trạng thái**: [x] Hoàn thành

---

### 📌 TASK 3: Nâng Cấp "In Phiếu Xuất" Thành Phiếu Xuất Tổng Của Chuyến Xe (N Đơn Hàng)
- [x] **3.1. Cập nhật Interface & Modal in Phiếu Xuất Kho A4**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx)
  - **Yêu cầu**:
    * Thêm interface `OutboundReceiptItem` (mã đơn, tên hàng, số kiện, địa chỉ giao, chứng từ, ghi chú).
    * Thêm `items?: OutboundReceiptItem[]` và `tripCode?: string` vào `OutboundReceiptData`.
    * Cập nhật template in HTML A4: duyệt qua mảng `data.items` để render toàn bộ các đơn hàng của xe; tính tổng kiện ở hàng Summary Footer.
    * Cập nhật bảng xem trước (Preview Table) trong Dialog: render động các dòng đơn hàng thay cho dòng hardcode đơn lẻ.
  - **Trạng thái**: [x] Hoàn thành

- [x] **3.2. Truyền đầy đủ danh sách đơn hàng của Chuyến xe khi in phiếu**
  - **File**: [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)
  - **Vị trí**: Hàm `handleOpenReceiptForVehicle` (dòng ~641–670).
  - **Yêu cầu**: Map toàn bộ danh sách `grp.orders` sang mảng `items: OutboundReceiptItem[]` và truyền vào `selectedReceiptData`.
  - **Trạng thái**: [x] Hoàn thành

---

### 📌 TASK 4: Loại Bỏ Cột "Tỉnh/TP" Khi Tạo Mới Đơn Xuất Kho
- [x] **4.1. Ẩn cột "TỈNH / TP" khi `isOutboundMode = true`**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)
  - **Vị trí**: Mảng định nghĩa `columns` trong `useMemo` (dòng ~1500–1615).
  - **Yêu cầu**:
    * Khi `isOutboundMode === true` (tạo mới xuất kho): **KHÔNG ĐƯA** cột `province` vào bảng (thu hồi 92px chiều ngang).
    * Khi `isOutboundMode === false` (tạo mới nhập kho): **GIỮ NGUYÊN** cột `province`.
  - **Trạng thái**: [x] Hoàn thành

---

### 📌 TASK 5: Tái Cấu Trúc UX Cột "Địa Chỉ Giao" Khi Tạo Mới Xuất Kho
- [x] **5.1. Tách bạch dữ liệu đích xuất kho (Không ghi đè hợp đồng gốc)**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)
  - **Yêu cầu**: Lưu giữ `originalDeliveryAddress` không bị ghi đè; dữ liệu thay đổi đích đến chỉ áp dụng cho đợt xuất kho hiện tại.
  - **Trạng thái**: [x] Hoàn thành

- [x] **5.2. Chuyển đổi giao diện sang 2 lựa chọn: `Địa chỉ thường` & `Thay đổi địa chỉ` (Nâng cấp Modal Dialog)**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) & [`warehouse-destination-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)
  - **Vị trí**: `DeliveryAddressCell`.
  - **Yêu cầu & Nâng cấp**:
    * `Địa chỉ thường`: Tự động nạp lại và hiển thị địa chỉ nhập kho ban đầu của đơn hàng trong textarea.
    * `Thay đổi địa chỉ (Điều chuyển)`: Nút bấm mở **Modal Dialog (`WarehouseDestinationModal`)** thay cho Popover nội dòng cũ (khắc phục triệt để lỗi Popover bé, tràn ô, bị che khuất và khó thao tác).
    * Trong Modal: Tích hợp ô live search tự động focus, bộ lọc tab nhanh (`Tất cả`, `Hub Cấp 1`, `Tuyến Xe Bo`); sắp xếp phân nhóm:
      1. **Nhóm 1 (Ưu tiên lên đầu)**: Danh sách **Hub Cấp 1** (`level = 1`) liên vùng với thẻ card rộng rãi, mã kho, tỉnh thành, địa chỉ chi tiết.
      2. **Nhóm 2 (Tiếp theo)**: Danh sách **Tuyến Xe bo Cấp 2** (`level = 2`) gom hàng nội thành / chặng cuối.
    * Khi chọn: Gán `destinationHubId`, hiển thị thẻ đích đến trực quan với nút `Đổi kho đích khác...` và `Quay lại địa chỉ thường`.
  - **Trạng thái**: [x] Hoàn thành (Nâng cấp Modal hoàn tất)

---

### 📌 TASK 6: Khắc Phục Lỗi Xung Đột Trạng Thái Filter DRAFT vs COMPLETED_INBOUND Trong Modal Tra Cứu Kho
- [x] **6.1. Đọc đúng trạng thái theo ngữ cảnh Hub (`hubStatus`)**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)
  - **Vị trí**: Dòng ~343 & dòng ~383.
  - **Yêu cầu**: Đổi sang `const displayStatus = (row as any).hubStatus ?? row.status;`. Không đọc trường toàn cục `row.status` để tránh hiển thị trạng thái của kho gửi.
  - **Trạng thái**: [x] Hoàn thành

- [x] **6.2. Khử bỏ hoàn toàn mã enum kỹ thuật, hiển thị badge tiếng Việt chuẩn**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)
  - **Vị trí**: Dòng ~374–385.
  - **Yêu cầu**: Xóa bỏ `⚫ ${row.status}`. Map sang badge tiếng Việt:
    * `INBOUND` / `STORED` / `LUU_KHO` ➔ Badge `🟡 LƯU KHO`
    * `DRAFT` ➔ Badge `⚪ Đơn nháp`
    * `WAITING` / `PENDING` ➔ Badge `🟠 Chờ nhập kho`
  - **Trạng thái**: [x] Hoàn thành

- [x] **6.3. Việt hóa Tab Filter & Đồng bộ Counter**
  - **File**: [`frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)
  - **Vị trí**: Dòng ~280.
  - **Yêu cầu**: Đổi nhãn nút từ `DRAFT ({meta.draftCount})` thành `Đơn nháp ({meta.draftCount})`.
  - **Trạng thái**: [x] Hoàn thành

---

### 📌 TASK 7: Kiểm Thử Toàn Trình, Biên Dịch Build & Nghiệm Thu (Verification Gate)
- [x] **7.1. Chạy Typecheck & Build Frontend**
  - **Lệnh thực thi**: `npm --prefix frontend run build` (hoặc `npx --prefix frontend tsc --noEmit`).
  - **Tiêu chí**: Build thành công 100%, 0 lỗi TypeScript, 0 lỗi cú pháp JSX.
  - **Trạng thái**: [x] Hoàn thành (Compiled successfully, Finished TypeScript in 11.7s, 33/33 static pages generated)

- [x] **7.2. Kiểm tra trực quan giao diện (Visual & UX Validation)**
  - **Tiêu chí**:
    * Bảng Inbound: Không còn nút luân chuyển, không còn cột Loại tiếp nhận.
    * Bảng Outbound: Không còn cột Loại xuất kho.
    * Form tạo mới xuất kho: Không còn cột Tỉnh/TP, cột địa chỉ giao hiển thị 2 lựa chọn có Popover Hub L1 / Xe bo.
    * In phiếu xuất: Chuyến xe 3 đơn in ra đúng 3 đơn và tổng số kiện chính xác.
    * Modal tra cứu kho: Chọn tab "Đơn nháp" hiển thị đúng badge "Đơn nháp", không còn `COMPLETED_INBOUND`.
  - **Trạng thái**: [x] Hoàn thành

---

## 🔒 NGUYÊN TẮC BẢO VỆ DÀNH CHO AGENT KHI TRIỂN KHAI
1. Thực hiện lần lượt từng Task từ 1 đến 6. Sau mỗi task, kiểm tra không làm vỡ các module khác.
2. Không tự ý chỉnh sửa các file ngoài danh sách File Mod Map nếu chưa có chỉ định.
3. Không thêm mock data, fake data hoặc các class spacing vượt chuẩn (`p-4`, `space-y-3`, `gap-4`).
