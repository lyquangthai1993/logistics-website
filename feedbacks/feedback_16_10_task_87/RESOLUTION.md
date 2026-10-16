# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_16_10_TASK_87] — Feedback 16/10 — Task 87: Tính Năng Nhập Kho Tách Lẻ Từng Đơn Trong Trip Chờ Xử Lý & Xuất Kho Tức Thì

> **Thời gian nghiệm thu**: 16/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (34/34 tasks)  
> **Người báo cáo / Nghiệp vụ**: Quản lý Vận hành TMS (@Thai) & Team Lead Nghiệp vụ TMS (`/leader`)  
> **Phạm vi tác động**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết Chuyến xe Nhập kho Chờ xử lý ([`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Bảng kê chỉnh sửa dòng hàng kho vận ([`WarehouseEditableGrid`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • In Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx) & API `inbound/receipt-data`) • Quản lý Xuất kho (`/warehouse/outbound` & [`getAvailableOutboundOrders`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts)) • Backend API Tiếp nhận Kho & Sổ cái Tồn kho ([`WarehouseService.confirmInbound`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi gốc từ người dùng (@Thai)
> *"tại màn hình của trip nhập kho chờ xử lý, thay thế nút nhân bản thành nút nhập kho của đơn hàng đó. Nút này cho phép thao tác nhập riêng từng đơn trong trip để có thể xuất đơn hàng đó trước khi nhập xong toàn bộ trip nhập. khi thao tác nhập riêng đơn như vậy thì không cần in phiếu nhập kho riêng từng đơn, chỉ cần làm mờ đơn hàng đó trong trip . phiếu nhập kho sẽ in khi sau khi tao tác xác nhận nhập kho và nội dung trong phiếu nhập sẽ bao gồm tất cả các đơn trong trip ( cả đơn đã nhập riêng)"*

---

### 2. Phân tích nghiệp vụ vận hành thực tế tại kho bãi (TMS Inbound & Partial Unloading Workflow)

Trong thực tế điều hành kho bãi Logistics (Kho tổng hoặc Hub trung chuyển):
1. **Tình huống dỡ xe thực tế**:
   - Một xe tải liên tỉnh hoặc xe trung chuyển (ví dụ xe `75H04848`, Chuyến xe `SD53`) cập cảng Hub với nhiều vận đơn khác nhau (tổng tải hơn 8 tấn, 153 kiện hàng).
   - Quá trình hạ tải, dỡ hàng và kiểm đếm toàn bộ một chuyến xe có thể kéo dài từ 1 đến vài tiếng.
   - Tuy nhiên, trong chuyến xe thường có những đơn hàng đặc thù:
     * **Đơn hàng giao gấp / hẹn giờ khách nhận**: Khách hàng hoặc tài xế chặng cuối (xe bo giao hàng nội thành) đã có mặt sẵn ở cửa kho chờ nhận hàng ngay.
     * **Đơn hàng Cross-docking / Sang xe cấp tốc**: Đơn hàng cần được dỡ xuống đầu tiên và bốc ngay lên một chuyến xe trung chuyển khác sắp sửa xuất bến.
2. **Nút thắt của hệ thống cũ**:
   - Nếu hệ thống bắt buộc phải kiểm đếm và bấm "Xác nhận nhập kho" toàn bộ chuyến xe thì mới ghi nhận tồn kho: Thủ kho không thể tạo phiếu xuất kho hoặc bốc đơn hàng đó lên xe giao hàng cho đến khi dỡ xong toàn bộ các đơn khác trên xe.
   - Nếu thủ kho bấm "Xác nhận nhập kho" vội vàng để xuất đơn gấp: Chuyến xe bị đóng trạng thái thành `COMPLETED` ("Đã xử lý"), làm đứt gãy quá trình kiểm đếm các đơn hàng còn lại trên xe, mất khả năng đối soát thực nhận.
   - Mặt khác, trên bảng kê chuyến xe nhập kho hiện tại đang có nút **"Nhân bản dòng" (`IconCopy`)**: Nút này vốn sinh ra cho việc nhập mới thủ công, nhưng khi áp dụng vào một chuyến xe đã có danh sách vận đơn rõ ràng thì việc "nhân bản" là hoàn toàn vô nghĩa và tiềm ẩn rủi ro nhân bản sai số lượng hàng hóa trên xe.
3. **Quy trình chuẩn hóa mới (Partial Receiving -> Immediate Outbound -> Unified Final Receipt)**:

```mermaid
sequenceDiagram
    autonumber
    actor W as Thủ kho Hub (Warehouse Operator)
    participant UI as Modal Chuyến Xe Nhập Kho (Trip Modal)
    participant BE as Backend TMS (NestJS API)
    participant DB as PostgreSQL Database
    actor O as Thủ kho Xuất hàng (Outbound Dispatcher)

    Note over W,UI: Chuyến xe SD53 cập cảng (Trạng thái: Chờ xử lý - 4 đơn hàng)
    W->>UI: 1. Bấm nút "Nhập kho đơn hàng này" tại dòng NMC2610-125
    UI->>BE: 2. POST /api/v1/warehouse/inbound/confirm (keepTripPending: true, orders: [NMC2610-125])
    BE->>DB: 3. Cập nhật NMC2610-125: status = 'INBOUND', currentHubId = Hub hiện tại<br/>Tạo giao dịch kho INBOUND<br/>Giữ nguyên trip_stop.status = PENDING
    BE-->>UI: 4. Phản hồi thành công
    Note over UI: 5. Dòng NMC2610-125 bị LÀM MỜ (opacity-50, khóa sửa/xóa)<br/>Nút chuyển thành badge 'Đã nhập kho'<br/>TUYỆT ĐỐI KHÔNG IN PHIẾU LẺ
    
    par Tác nghiệp song song: Xuất kho tức thì
        O->>BE: 6. Truy vấn danh sách hàng sẵn sàng xuất (getAvailableOutboundOrders)
        BE-->>O: 7. Đơn NMC2610-125 đã có sẵn trong kho -> Cho phép xuất kho ngay!
    and Tiếp tục dỡ hàng trên xe
        W->>UI: 8. Thủ kho kiểm đếm xong các đơn còn lại trên xe SD53
    end

    W->>UI: 9. Bấm nút "Xác nhận nhập kho" tại chân modal (Footer)
    UI->>BE: 10. POST /api/v1/warehouse/inbound/confirm (targetStatus: 'INBOUND', keepTripPending: false)
    BE->>DB: 11. Nhập kho các đơn còn lại<br/>trip_stop chuyển COMPLETED, chuyến xe chuyển COMPLETED
    BE-->>UI: 12. Phản hồi thành công (kèm tổng kết chuyến)
    UI->>UI: 13. TỰ ĐỘNG BẬT PHIẾU NHẬP KHO TỔNG HỢP<br/>(Phiếu in bao gồm ĐẦY ĐỦ cả 4 đơn: NMC2610-125, SGN2610-132, SGN2610-325, VTX2610-384)
```

---

### 3. Quy chuẩn nghiệp vụ & Invariant bắt buộc

1. **Thay thế nút thao tác**:
   - Tại cột "THAO TÁC" của từng dòng hàng trên màn hình chuyến xe nhập kho chờ xử lý: **Thay thế hoàn toàn nút "Nhân bản dòng" (`IconCopy`) bằng nút "Nhập kho đơn hàng này"** (`IconBuildingWarehouse` hoặc `IconPackageImport`).
   - Giữ lại nút "In tem" (`IconPrinter`) và nút "Xóa dòng" (`IconTrash` - chỉ xóa được khi đơn chưa nhập kho).
2. **Quy định về luồng dữ liệu & Trạng thái**:
   - Khi bấm "Nhập kho đơn hàng này":
     * Đơn hàng đó được chuyển trạng thái sang `INBOUND` (hoặc `IN_WAREHOUSE` tại Hub thao tác).
     * Ghi nhận giao dịch kho `InventoryTransactionType.INBOUND` cho đơn hàng đó.
     * **Bảo toàn trạng thái chuyến xe (Trip Invariant)**: Chuyến xe (`tripCode`) và trạm dừng kho hiện tại (`trip_stop`) **BẮT BUỘC VẪN GIỮ TRẠNG THÁI `PENDING` ("Chờ xử lý")**. Tuyệt đối không được chuyển chuyến xe sang `COMPLETED` khi mới chỉ dỡ một phần.
     * Đơn hàng này lập tức khả dụng trong API `getAvailableOutboundOrders` và hiển thị trên màn hình Xuất kho (`/warehouse/outbound`) để thủ kho xuất hàng ngay.
3. **Quy định về hiển thị giao diện (Dimming & State Lock)**:
   - Dòng đơn đã được nhập riêng **BẮT BUỘC phải được làm mờ** trực quan:
     * CSS styling: `opacity-50 bg-slate-50/80 dark:bg-slate-800/40`.
     * Toàn bộ ô input trên dòng đó (Tên hàng, Số kiện, Kg, $m^3$, Địa chỉ...) chuyển sang trạng thái chỉ đọc / vô hiệu hóa (`disabled` / `read-only`), ngăn chặn sửa đổi hợp đồng khi hàng đã vào kho.
     * Nút "Nhập kho đơn hàng này" chuyển sang trạng thái đã hoàn tất (biểu tượng checkmark xanh `<IconCircleCheck className="text-emerald-600" />`, tooltip: *"Đơn hàng đã nhập kho"*), vô hiệu hóa click lặp lại.
     * Nút "Xóa dòng" (`IconTrash`) bị vô hiệu hóa (`disabled`) vì đơn đã nhập kho thì không thể xóa tùy tiện khỏi bảng kê chuyến xe.
4. **Quy định về in phiếu nhập kho (No Individual Receipt - Full Final Receipt)**:
   - Khi thao tác nhập riêng từng đơn: **TUYỆT ĐỐI KHÔNG mở modal hoặc popup in phiếu nhập kho riêng cho đơn đó**.
   - Phiếu nhập kho chỉ được in khi thủ kho bấm nút **"Xác nhận nhập kho"** ở thanh điều khiển chân trang (Footer Modal) để hoàn tất toàn bộ chuyến xe.
   - Nội dung trên Phiếu Nhập Kho in ra **BẮT BUỘC PHẢI BAO GỒM TẤT CẢ CÁC ĐƠN TRONG TRIP** (bao gồm cả các đơn đã thao tác nhập riêng trước đó lẫn các đơn vừa xác nhận dỡ kho).
   - Backend API khi nhận xác nhận toàn bộ chuyến xe không được ném lỗi xung đột `UnprocessableEntityException` ("Đơn đã được nhập kho") đối với các đơn đã nhập riêng trước đó, mà phải ghi nhận thành công và tổng hợp đầy đủ vào phiếu in.

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
Đối chiếu trực tiếp với [`screenshot_01.jpg`](file:///home/runner/work/logistics-website/logistics-website/feedbacks/feedback_16_10_task_87/screenshot_01.jpg):

| Vị trí trên ảnh cũ | Hiện trạng chưa đúng | Chuẩn hóa theo phản hồi thực tế |
|---|---|---|
| **Cột THAO TÁC (Nút thứ 2)** | Đang hiển thị icon 2 ô vuông chồng nhau (`IconCopy`), tooltip `"Nhân bản dòng"`. Thao tác này copy thêm 1 dòng hàng giống hệt vào bảng kê, không có ý nghĩa khi tiếp nhận chuyến xe đã có vận đơn thực tế. | **Thay thế bằng nút Nhập kho đơn hàng** (`IconBuildingWarehouse` hoặc `IconPackageImport`). Tooltip rõ ràng: *"Nhập kho đơn hàng này (Sẵn sàng để xuất kho ngay)"*. |
| **Quy trình nhập kho cấp dòng** | Chưa có chức năng nhập kho độc lập cho từng dòng hàng. Muốn hàng vào kho thì bắt buộc phải bấm nút *"Xác nhận nhập kho"* ở chân trang, làm đóng toàn bộ chuyến xe `SD53`. | Cho phép click nhập riêng từng đơn ngay tại dòng. Đơn chuyển `INBOUND` ngay, chuyến xe `SD53` vẫn tiếp tục ở trạng thái `Chờ xử lý`. |
| **Trạng thái trực quan của dòng hàng** | Các dòng hàng hiển thị bình đẳng như nhau, không có phân biệt giữa dòng chưa nhập và dòng đã nhập kho. | Dòng đơn sau khi nhập riêng phải được **làm mờ (`opacity-50`)**, khóa ô nhập, nút thao tác đổi thành checkmark xanh *"Đã nhập kho"*, khóa nút xóa. |
| **Khả năng xuất kho tức thì** | Các đơn hàng trên xe `SD53` bị kẹt ở trạng thái của chuyến xe, màn hình Xuất kho không thể tìm thấy đơn hàng để tạo chuyến xuất tiếp theo hoặc giao cho khách. | Sau khi nhập riêng, đơn hàng lập tức có mặt trong danh sách hàng lưu kho khả dụng (`getAvailableOutboundOrders`) để xuất kho ngay. |
| **Luồng in ấn chứng từ** | Nếu bấm xác nhận dỡ hàng ở màn hình cũ, hệ thống có thể mở phiếu in phân mảnh hoặc không đồng bộ lại các đơn đã nhập lẻ. | Khi nhập riêng: **Không in phiếu**. Khi bấm "Xác nhận nhập kho" ở chân trang: Tự động in Phiếu Nhập Kho tổng hợp chứa **100% các đơn của chuyến xe**. |

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Nâng cấp logic `confirmInbound` trong `WarehouseService` ([`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Bổ sung tham số `keepTripPending?: boolean` vào payload tiếp nhận kho.**
- ✅ **Khi `keepTripPending === true`**
- ✅ **Xử lý kịch bản hoàn tất chuyến xe (`keepTripPending === false` hoặc mặc định)**
- ✅ **Đảm bảo tính tương thích của API Xuất kho ([`getAvailableOutboundOrders`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Xác nhận đơn hàng sau khi nhập riêng có `status IN ('INBOUND', 'IN_WAREHOUSE', 'STORED', 'LUU_KHO')` và `currentHubId = currentHubId`.**
- ✅ **Đơn hàng lập tức được trả về trong danh sách chờ xuất mà không phụ thuộc vào trạng thái của chuyến xe nhập ban đầu (`tripCode`).**
- ✅ **Đảm bảo API dữ liệu in phiếu ([`getInboundReceiptData`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **Khi in phiếu theo `tripCode`, gom toàn bộ các đơn hàng thuộc chuyến xe cập cảng tại Hub hiện tại, **bao gồm cả đơn đã nhập riêng trước đó lẫn đơn nhập đợt cuối**.**
- ✅ **Tính toán chính xác tổng số kiện, tổng trọng lượng và tổng thể tích của toàn bộ chuyến xe trên phiếu in.**
- ✅ **Kiểm tra biên dịch & Linting Backend**
- ✅ **Chạy `npm run lint --prefix backend` đạt 0 lỗi.**
- ✅ **Chạy `npm run build --prefix backend` đạt PASS.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Nâng cấp component `WarehouseEditableGrid` ([`warehouse-editable-grid.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`
- ✅ **Mở rộng interface `WarehouseEditableGridProps`**
- ✅ **Cập nhật `TableMeta`**
- ✅ **Cập nhật cell `ActionsCell`**
- ✅ **Quy chuẩn làm mờ dòng hàng đã nhập kho**
- ✅ **Nâng cấp Modal `WarehouseTripDetailModal` ([`warehouse-trip-detail-modal.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`
- ✅ **Truyền các props mới vào `WarehouseEditableGrid`**
- ✅ **Xây dựng hàm `handleInboundSingleOrder(row: WarehouseRowItem, rowIndex: number)`**
- ✅ **Hoàn thiện hàm `handleConfirmInbound` (Nút "Xác nhận nhập kho" ở Footer)**
- ✅ **Tuân thủ nghiêm ngặt Quy chuẩn giao diện hẹp (UI Compact Density Mandate)**
- ✅ **Card padding: giữ nguyên `p-1`, Modal Body `p-2`.**
- ✅ **Table row padding: `py-1 px-1.5`, typography `text-[10px]`, mã đơn `text-[11px] font-mono font-bold`.**
- ✅ **Không sinh các class bị cấm (`p-4`, `space-y-3`, `gap-4`).**
- ✅ **Zero redundant icons: Triệt tiêu mọi icon/ký tự trùng lặp trong nhãn nút.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Kiểm tra biên dịch & Linting toàn dự án**
- ✅ **`npm run lint --prefix backend` & `npm run build --prefix backend` PASS (0 errors).**
- ✅ **`npm run build --prefix frontend` PASS (Turbopack compile PASS, 0 type errors).**
- ✅ **Kịch bản kiểm thử nghiệp vụ thực tế (Manual & E2E Verification)**
- ✅ **Kịch bản 1: Nhập riêng 1 đơn trong chuyến xe chờ xử lý**
- ✅ **Kịch bản 2: Xuất kho tức thì cho đơn hàng vừa nhập riêng**
- ✅ **Kịch bản 3: Xác nhận nhập kho toàn bộ chuyến xe & In phiếu tổng hợp**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (3/3 test scenarios).
- **Thẩm định chất lượng /e2e-code-auditor**: **50/50 điểm — 🟢 PASS (Tuyệt đối, 0 Auto-FAIL)**.
  ```text
  Dimension Scores:
    1. Business Spec & Completeness:   10/10 (3 kịch bản vận hành thực tế)
    2. Anti-Pattern & Flakiness Guard: 10/10 (Zero networkidle, Zero fragile tr click)
    3. Network & Anti-Hang Protocol:   10/10 (domcontentloaded + timeout giới hạn)
    4. Real DB & Zero-Mock Integrity:  10/10 (Tài khoản USER_WAREHOUSE_HCM, Real REST API)
    5. Visual Evidence & Assertions:   10/10 (21 assertions, đa ảnh chụp minh chứng)
  ```
- **File E2E Test Chuẩn mực**: [`frontend/e2e/90-feedback-16-10-task-87-partial-inbound-single-order.spec.ts`](file:///frontend/e2e/90-feedback-16-10-task-87-partial-inbound-single-order.spec.ts)
  * `CASE-01`: Nhập lẻ 1 đơn trong chuyến xe chờ xử lý -> Toast thành công, dòng đơn làm mờ (`opacity-50`), nút đổi checkmark xanh, nút xóa bị khóa, không popup in phiếu lẻ.
  * `CASE-02`: Đơn hàng vừa nhập lẻ lập tức khả dụng để xuất kho ngay tại `/dashboard/warehouse/outbound`.
  * `CASE-03`: Xác nhận nhập kho toàn bộ chuyến xe ở Footer -> Bật modal Phiếu Nhập Kho A4 tổng hợp.
- **Môi trường Dev Live**:
  * Frontend: `https://frontend-tms-core-dev.up.railway.app`
  * Backend: `https://backend-tms-core-dev.up.railway.app`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health` -> HTTP 200 OK.

### Hình ảnh minh chứng đã lưu trữ:
- 📸 **screenshot_01.jpg**: Ảnh gốc người dùng phản hồi.
- 📸 **screenshot_01_verified.png**: Ảnh nghiệm thu giao diện dòng mờ và nút checkmark sau khi nhập lẻ.
- 📸 **01_single_order_inbound_dimmed.png**: Minh chứng Kịch bản 1 (Modal tiếp nhận dỡ từng đơn).
- 📸 **02_available_for_outbound.png**: Minh chứng Kịch bản 2 (Xuất kho tức thì).
- 📸 **03_unified_inbound_ready.png**: Minh chứng Kịch bản 3 (Hoàn tất dỡ hàng).

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 2 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx` | Frontend (Next.js) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_16_10_task_87/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
