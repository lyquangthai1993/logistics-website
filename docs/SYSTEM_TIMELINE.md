# 📜 LOGISTICS TMS — BIÊN NIÊN SỬ TIẾN HÓA HỆ THỐNG & DÒNG THỜI GIAN PHÁT TRIỂN

> **Tài liệu nguồn gốc & Cơ sở kiến trúc (System Ground Truth & Historical Ledger)**:
> File này ghi chép toàn bộ quá trình tiến hóa và trưởng thành của hệ thống Logistics TMS (Spider Express).
> Mọi AI Agent session mới khi bắt đầu làm việc ĐỀU CÓ THỂ ĐỌC file này để hiểu rõ:
> 1. Hệ thống đã trải qua những giai đoạn và bài toán thực tế nào.
> 2. Các tính năng và năng lực mới được bổ sung qua từng đợt cập nhật (Backend, Frontend, DB).
> 3. Các quy tắc bất biến (Invariants) cốt lõi đã được thiết lập để tránh làm sai hoặc tái phát lỗi cũ.
> 4. Bằng chứng kiểm thử (E2E specs, screenshots, verification audits) làm cơ sở tin cậy.

---

## 📊 BẢNG TỔNG HỢP MỐC PHÁT TRIỂN & TIẾN ĐỘ HOÀN THÀNH

| Mốc Thời Gian | Thư Mục Feedback | Tiêu Đề / Tính Năng Trọng Tâm | Tác Vụ | Trạng Thái | Bằng Chứng Nghiệm Thu |
|---|---|---|---|---|---|
| 09/10/2026 | `feedback_09_10_task_13` | Feedback 09/10 (Task 13) — Tách Cột Thông Tin Hàng H... | 27/27 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_13/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_10` | Feedback 09/10 Task 10 — Ràng Buộc Nghiệp Vụ Cột Ngà... | 21/21 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_10/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_9` | Feedback 09/10 Task 9 — Chuẩn Hóa Toàn Diện Bảng Đơn... | 18/18 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_9/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_8` | Feedback 09/10 Task 8 — Hoàn Thiện Quy Chuẩn Bảng Đơ... | 16/16 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_8/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_7` | Feedback 09/10 Task 7 — Tái Cấu Trúc Bảng Dữ Liệu Đơ... | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_7/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_6` | Feedback 09/10 Task 6 — Loại bỏ Cột Trạng thái Đơn h... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_6/RESOLUTION.md) |
| 09/10/2026 (14:12) | `feedback_09_10_task_5` | Feedback 09/10 (Task 5) — Khắc phục lỗi Tạo mới Tài ... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_5/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10` | Feedback 09/10 — Phân Định Tuyệt Đối Quy Trình Tác N... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10/RESOLUTION.md) |
| 09/10/2026 | `feedback_09_10_task_4` | Feedback 09/10 (Task 4) — Loại Bỏ Nút "Xem Tài Khoản... | 3/3 | ✅ DONE (100%) | [RESOLUTION.md](feedback_09_10_task_4/RESOLUTION.md) |
| 08/10/2026 | `release_v1.0.0` | **Release v1.0.0 — Milestone Chốt Toàn Bộ Flow Nghiệp Vụ Cốt Lõi Vận Hành TMS** | 7 Flows | ✅ DONE (100%) | [RELEASE_v1.0.0_BUSINESS_FLOWS.md](RELEASE_v1.0.0_BUSINESS_FLOWS.md) |
| 07/10/2026 | `feedback_07_10_task_29` | Feedback 07/10 Task 29 — Chuẩn Hóa Logic Mặc Định Nh... | 11/11 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_29/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_27` | Feedback 07/10 Task 27 — Khắc Phục Lỗi Mặc Định Nhập... | 11/11 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_27/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_24` | Feedback 07/10 Task 24 — Tùy biến Hình thức & Địa ch... | 57/57 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_24/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_22` | Feedback 07/10 Task 22 — Mở Rộng Kích Thước & Tối Ưu... | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_22/RESOLUTION.md) |
| 07/10/2026 (13:49) | `feedback_07_10_task_21` | Feedback 07/10 Task 21 — Khắc phục Lỗi Không Hiển th... | 30/30 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_21/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_12` | Feedback 07/10 Task 12 — Chuẩn Hóa Quản Lý Tồn Kho &... | 19/19 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_12/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_11` | Tối ưu Giao diện Bảng Kê Xuất Kho: Loại Bỏ Cột Trạng Thái Thừa & Compact Density | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_11/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10_task_10` | Chuẩn Hóa Cột Kho Đích & Gán Đơn Lưu Kho Sẵn Có Lên Chuyến Xuất Kho | 18/18 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10_task_10/RESOLUTION.md) |
| 07/10/2026 | `feedback_07_10` | Chuẩn Hóa Cột Kho Đích / Nơi Giao & Đồng Bộ Phiếu Xuất Kho | 32/32 | ✅ DONE (100%) | [RESOLUTION.md](feedback_07_10/RESOLUTION.md) |
| 06/10/2026 | `feedback_06_10` | Bốc Hàng Dọc Đường (Roadside Pickup) & Gán Vào Chuyến Xe Đang Chạy | 22/22 | ✅ DONE (100%) | [RESOLUTION.md](feedback_06_10/RESOLUTION.md) |
| 05/10/2026 | `feedback_05_10` | Gom Hàng Inbound, Chuyến Xe Nháp, Tái Sử Dụng Mã Chuyến & Bộ Lọc Trạng Thái | 42/42 | ✅ DONE (100%) | [RESOLUTION.md](feedback_05_10/RESOLUTION.md) |
| 04/10/2026 | `feedback_04_10` | Tách Rời Kiểm Đếm Inbound & Chuyến Xe, Excel Parser & Chuẩn Hóa UTC | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](feedback_04_10/RESOLUTION.md) |
| 18/08/2026 | `feedback_17_8` | Chuẩn Hóa Toàn Diện TanStack Table v8, Phân Trang, RBAC & Mail Simulation | 33/33 | ✅ DONE (100%) | [RESOLUTION.md](feedback_17_8/RESOLUTION.md) |

---

## 🕒 BIÊN NIÊN SỬ CHI TIẾT THEO DÒNG THỜI GIAN (REVERSE CHRONOLOGICAL)

### 🚀 [FEEDBACK_09_10_TASK_13] — Feedback 09/10 (Task 13) — Tách Cột Thông Tin Hàng Hóa & Chuẩn Hóa Thuật Ngữ (Số Lượng, CBM) Tại Màn Hình Tổng Hợp Đơn Hàng Kho (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (27/27 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành kho)
- **Phạm vi**: Phân hệ Quản lý Kho (`/dashboard/warehouse/orders`) ➔ Trang **Tổng Hợp Đơn Hàng Tại Kho** ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Modal Chi tiết Vận đơn Kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Bảng tra cứu & chọn hàng hóa kho liên quan ([`WarehouseLookupModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx), [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Backend REST API Quản lý Đơn hàng Kho ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & Đảm bảo Tính Toàn vẹn Dữ liệu tại API `GET /api/v1/warehouse/orders`; Cập nhật Swagger & DTO API Documentation; Kiểm tra tính toàn vẹn câu truy vấn tìm kiếm Freetext
  * **Frontend**: Tái cấu trúc Bảng Dữ liệu tại [`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx); Cập nhật hằng số tổng số cột (`COLUMN_COUNT`); Tái thiết kế hàng tiêu đề bảng (`<thead>`) với 11 cột độc lập chuẩn Compact Density...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_13/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_13/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_10] — Feedback 09/10 Task 10 — Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng: Bắt Buộc Để Trống Tuyệt Đối Khi Đơn Hàng Ở Trạng Thái Lưu Kho (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (21/21 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Triển khai Backend Guard trong `warehouse.service.ts` (`aggregateOrderGroup` & `enrichWarehouseRows`); 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Member Rows)...
  * **Frontend**: 2.1. Cập nhật cấu trúc bảng 7 cột trong `WarehouseOrdersPage`; 2.2. Triển khai Frontend Guard hiển thị ô Cột "Ngày xuất"; 2.3. Triển khai hiển thị Cột "Ngày nhập" & "Mã vận đơn" kèm thông tin No-SKU...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_10/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_10/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_9] — Feedback 09/10 Task 9 — Chuẩn Hóa Toàn Diện Bảng Đơn Hàng Kho 7 Cột & Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng (Để Trống Tuyệt Đối Khi Đang Lưu Kho) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (18/18 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Nâng cấp logic tổng hợp trong `aggregateOrderGroup` & `enrichWarehouseRows`; 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Non-Grouped)...
  * **Frontend**: 2.1. Cập nhật cấu trúc bảng trong `WarehouseOrdersPage`; 2.2. Triển khai render nội dung các ô dữ liệu (Table Cells); 2.3. Cập nhật bảng con mở rộng (Expanded Row)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_9/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_9/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_8] — Feedback 09/10 Task 8 — Hoàn Thiện Quy Chuẩn Bảng Đơn Hàng Kho 7 Cột & Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng (Để Trống Khi Lưu Kho) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (16/16 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Nâng cấp logic tổng hợp trong `aggregateOrderGroup` & `enrichWarehouseRows`; 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Non-Grouped)...
  * **Frontend**: 2.1. Tái cấu trúc cấu trúc bảng 7 cột tại Trang Đơn Hàng Kho; 2.2. Render Cột 2 — "Ngày nhập"; 2.3. Render Cột 3 — "Mã vận đơn" (Tích hợp thông tin kiện No-SKU)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_8/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_8/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_7] — Feedback 09/10 Task 7 — Tái Cấu Trúc Bảng Dữ Liệu Đơn Hàng Kho Theo Chuẩn Nghiệp Vụ Vận Hành (7 Cột Chuẩn Mực) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Modal Chi tiết Vận đơn & Sổ cái ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật `WarehouseService.enrichWarehouseRows`; 1.2. Cập nhật `WarehouseService.aggregateOrderGroup` (Chế độ Gom nhóm `groupBy=orderCode`); 1.3. Cập nhật Type Definitions & Interface trong Backend...
  * **Frontend**: 2.1. Cập nhật hằng số & tiêu đề cột tại `frontend/src/app/dashboard/warehouse/orders/page.tsx`; 2.2. Xây dựng hàm định dạng Ngày/Giờ chuẩn Việt Nam; 2.3. Tái cấu trúc Render dòng dữ liệu cha (`row`)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_7/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_7/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_6] — Feedback 09/10 Task 6 — Loại bỏ Cột Trạng thái Đơn hàng tại Màn hình Nhập kho & Tinh gọn Giao diện Bảng kê (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Bảng kê danh sách chuyến xe và bảng con chi tiết đơn hàng trực thuộc chuyến xe ([`WarehouseInboundPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Bảng kê kiểm đếm & Phân hệ vận hành kho bãi ([`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx) & [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md)) • Backend API `/api/v1/warehouse/inbound-trips` & Type check toàn dự án
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát API Contract `inbound-trips` trong `WarehouseService` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Bảo toàn Cơ sở dữ liệu & Entity; Kiểm tra biên dịch & Linting Backend
  * **Frontend**: Chỉnh sửa Bảng con Đơn hàng trong [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx); Bảo toàn tuyệt đối Cột `TRẠNG THÁI` của Bảng cha; Rà soát các Component liên quan trong Phân hệ Kho bãi...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_6/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_6/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_5] — Feedback 09/10 (Task 5) — Khắc phục lỗi Tạo mới Tài khoản Người dùng (Internal Server Error 500 do xung đột Soft-Delete & Ràng buộc Unique Database) (09/10/2026 (14:12))
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Người dùng / Vận hành) & TMS Domain Lead Verification
- **Phạm vi**: Quản lý Người dùng (`/dashboard/users`) ➔ Popup Thêm Người Dùng Mới ([`UserFormDialog`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-dialog.tsx)) & Form Sheet ([`UserFormSheet`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-sheet.tsx)) • Backend Users Module: Controller, Service, DTO, TypeORM Repository, Mapper & Entity ([`users.controller.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.controller.ts), [`users.service.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.service.ts), [`user.repository.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/repositories/user.repository.ts), [`user.mapper.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/mappers/user.mapper.ts), [`user.entity.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/entities/user.entity.ts)) • Cơ sở dữ liệu Neon PostgreSQL (Singapore `ap-southeast-1`): Bảng `"user"`, các chỉ mục & ràng buộc unique `UQ_e12875dfb3b1d92d7d7c5377e22` (`UNIQUE (email)`), `UQ_user_username` (`UNIQUE (username)`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Tạo Migration PostgreSQL chuyển đổi sang Partial Unique Index (`WHERE "deletedAt" IS NULL`); Nâng cấp `UsersRelationalRepository` ([`user.repository.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/repositories/user.repository.ts)); Tái cấu trúc Logic Nghiệp vụ `UsersService.create()` ([`users.service.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.service.ts))
  * **Frontend**: Chuẩn hóa Giao diện Hẹp theo Quy chuẩn UI Compact Density ([`user-form-dialog.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-dialog.tsx) & [`user-form-sheet.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-sheet.tsx)); Chống xung đột Trình quản lý Mật khẩu Browser AutoFill; Nâng cấp Từ điển Lỗi & Hiển thị Thông báo Thân thiện ([`api-error.ts`](file:///D:/Projects/logistics-website/frontend/src/lib/api-error.ts))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_5/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_5/TODO.md)

### 🚀 [FEEDBACK_09_10] — Feedback 09/10 — Phân Định Tuyệt Đối Quy Trình Tác Nghiệp: Chuyến Xe Nhập Trực Tiếp (Khách Gửi) vs. Chuyến Xe Trung Chuyển Liên Hub (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & @TMS Domain Lead
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • API Quản lý Manifest Chuyến xe ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts) & [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Giao diện thanh tiến trình tác nghiệp trạm (Stepper Bar) & Cụm nút hành động chân modal (Modal Action Footer) • Bốc thêm đơn dọc đường ([`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx))
- **Năng lực & Tính năng mới**:
  * **Backend**: Chuẩn hóa loại chuyến xe trong `WarehouseService.appendOrderToTrip` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Kiểm tra tính toàn vẹn của cờ `isTransfer` trong `getTripManifest`; Rà soát API `GET /api/v1/warehouse/inbound-trips`
  * **Frontend**: Tái cấu trúc điều kiện hiển thị trong [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10/RESOLUTION.md) • [`TODO.md`](feedback_09_10/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_4] — Feedback 09/10 (Task 4) — Loại Bỏ Nút "Xem Tài Khoản Demo" & Cụm Banner Thử Nghiệm Tại Màn Hình Đăng Nhập (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (3/3 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS — Spider Express)
- **Phạm vi**: Frontend Authentication UI: Trang Đăng nhập (`/auth/sign-in`) ➔ Form Đăng nhập ([`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx)) • E2E Testing Suite: Cập nhật kịch bản kiểm thử giao diện đăng nhập ([`08-check-vercel-vs-local-signin.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/08-check-vercel-vs-local-signin.spec.ts) và tạo mới suite kiểm định [`40-feedback-09-10-task-4-remove-demo-accounts.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts))
- **Năng lực & Tính năng mới**:
  * **Frontend**: 1.1. Loại bỏ khối Demo Accounts trong [`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx); 1.2. Kiểm tra biên dịch TypeScript & Next.js App Router; 2.1. Cập nhật và bổ sung E2E Spec
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_09_10_task_4/RESOLUTION.md) • [`TODO.md`](feedback_09_10_task_4/TODO.md)

### 🏆 [RELEASE_V1.0.0] — Milestone Release v1.0.0: Chuẩn Hóa Toàn Bộ 7 Flow Nghiệp Vụ Vận Hành Cốt Lõi TMS Spider Express (08/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (7 Flow nghiệp vụ cốt lõi)
- **Báo cáo bởi**: @Thai (Owner / Operator) & Antigravity TMS Multi-Agent Team
- **Phạm vi**: Toàn bộ hệ thống fullstack: Orders, Fleet, Inbound, Outbound, Inventory Ledger, Hubs Network, Real-time Notifications, RBAC 3 lớp.
- **Năng lực & Tính năng mới**:
  * Chuẩn hóa mã đơn Enterprise `{HUB}-{INITIALS}-{YYMM}-{SEQ}` & hỗ trợ mã vận đơn tự do kiểm tra trùng lặp DB thời gian thực.
  * Phân tầng 3 hình thức giao nhận `DIRECT_CUSTOMER`, `HUB_L1`, `XE_BO` với cách ly tuyệt đối hàng khách lẻ tại trạm trung chuyển.
  * Bốc đơn lưu kho lên chuyến xe trung chuyển (Bước 2 Inbound) qua Modal 10 cột dữ liệu tối ưu hiển thị.
  * Kiểm đếm dỡ hàng Tally Sheet, bốc hàng dọc đường Roadside Pickup, in tem nhãn Pallet/Barcode.
  * Sổ cái giao dịch kho bất biến `OrderInventoryTransactionEntity`, Zero Stock Auto-Clear triệt tiêu nhãn `LƯU KHO` khi hết tồn.
  * Token Manager đồng bộ 0ms đa tab với Proactive Silent Heartbeat, bảo đảm phiên làm việc liên tục.
- **Bằng chứng nghiệm thu**:
  * Backend NestJS 11 build: PASS (0 lỗi)
  * Frontend Next.js 16 typecheck & build: PASS (33/33 routes)
  * Playwright E2E: 37/37 suites PASS 100%
  * Production & Dev Cloud deployments (Render & Vercel) LIVE & Health Check 200 OK
- **Tài liệu tham chiếu**: [`docs/RELEASE_v1.0.0_BUSINESS_FLOWS.md`](RELEASE_v1.0.0_BUSINESS_FLOWS.md) • [`CODEBASE_AUDIT.md`](../CODEBASE_AUDIT.md)

### 🚀 [FEEDBACK_07_10_TASK_29] — Feedback 07/10 Task 29 — Chuẩn Hóa Logic Mặc Định Nhập Kho Hub Cấp 1 & Bảo Toàn Thông Tin Đơn Hàng Giữ Nguyên Địa Chỉ Giao Ban Đầu (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (11/11 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành TMS — Spider Express)
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho & Bảng kê xuất hàng ([`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) & [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) & [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)) • Backend Service & Controller: Điều phối Chuyến xe, Xuất kho, Bảng kê lộ trình Manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)) • Khế ước dữ liệu & Luồng chuyển tiếp trạng thái vòng đời chuyến xe đa chặng (Multi-Stop Inter-Hub Linehaul Journey)
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO xuất kho ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)); 1.2. Triệt tiêu hoàn toàn logic ghi đè dữ liệu đơn hàng trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); 1.3. Áp dụng chuẩn hóa tương tự cho `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))...
  * **Frontend**: 2.1. Chuẩn hóa luồng gửi dữ liệu xuất kho tại [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx); 2.2. Nâng cấp Bảng kê Tally Nhập kho ([`warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)); 2.3. Cập nhật Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_origin_hub_dest_logic_verified.png, screenshot_02_switch_filtered_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_29/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_29/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_27] — Feedback 07/10 Task 27 — Khắc Phục Lỗi Mặc Định Nhập Kho Nhầm Đơn Giao Thẳng Cho Khách (DIRECT_CUSTOMER) Tại Trạm Trung Chuyển (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (11/11 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho Mode 1 (`activeView === 'MODE1_CUSTOMER'`) & Bảng kê xuất hàng ([`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) & [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe, Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) & [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)) • Backend Service & Controller: Logic điều phối chuyến xe, xuất kho và bảng kê lộ trình manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật `ConfirmOutboundDto` & `OutboundItemDto` ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)); 1.2. Sửa lỗi ghi đè dữ liệu trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); 1.3. Sửa lỗi ghi đè dữ liệu trong `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))...
  * **Frontend**: 2.1. Cập nhật `buildOutboundRequest` trong [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx); 2.2. Nâng cấp Bảng kê Tally Nhập kho ([`warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)); 2.3. Cập nhật Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_tally_direct_customer_isolation_verified.png, screenshot_02_switch_hide_other_hubs_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_27/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_27/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_24] — Feedback 07/10 Task 24 — Tùy biến Hình thức & Địa chỉ Giao nhận (Khách / Hub Cấp 1 / Tuyến Xe Bo) Cho Đơn Hàng Xuất Mới Lên Chuyến Xe Tại Trạm Trung Chuyển (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (57/57 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành Logistics TMS)
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Điều phối trung chuyển ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) — **Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp (`OUTBOUND STAGE`)** • Popup Chọn đơn lưu kho xuất lên chuyến xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Modal Chọn đích xuất kho điều chuyển ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Lưới xuất kho chuẩn tham chiếu ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Backend Quản lý Kho vận & Điều phối Chuyến xe ([`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts), [`TripEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts), [`TripStopEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip-stop.entity.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Tạo DTO `UpdateTripOrderDestinationDto`** ([`backend/src/orders/dto/update-trip-order-destination.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/update-trip-order-destination.dto.ts)); Khai báo `deliveryMode`: Enum `'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO'` (Bắt buộc).; Khai báo `destinationHubId`: `number | null` (Bắt buộc khi `HUB_L1` hoặc `XE_BO`; gán `null` khi `DIRECT_CUSTOMER`)....
  * **Frontend**: Mở rộng API Client & Types trong `trip-manifest.ts`** ([`frontend/src/features/warehouse/api/trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts)); Bổ sung trường `deliveryMode?: 'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO' | string` vào interface `TripManifestLine`.; Bổ sung trường `originalDeliveryAddress?: string` vào interface `TripManifestLine`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: 01_step2_interactive_destination_cell.png, screenshot_01.jpg, screenshot_01_step2_interactive_destination_cell_verified.png, screenshot_02_destination_selection_modal_verified.png, screenshot_03_destination_updated_hub_l1_verified.png, screenshot_04_reset_to_original_customer_address_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_24/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_24/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_22] — Feedback 07/10 Task 22 — Mở Rộng Kích Thước & Tối Ưu Giao Diện Modal "Chọn Đơn Lưu Kho Bốc Lên Chuyến Xe" (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Domain Lead Verification
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp ➔ Modal Chọn đơn lưu kho bốc lên chuyến xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Cấu hình Base UI Dialog Component ([`dialog.tsx`](file:///D:/Projects/logistics-website/frontend/src/components/ui/dialog.tsx)) • API Bảng kê chuyến xe & Đơn xuất khả dụng ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts), [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Cơ sở dữ liệu PostgreSQL trên Neon Singapore (`ap-southeast-1.aws.neon.tech`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & bảo đảm tính toàn vẹn của Endpoint `GET /api/v1/warehouse/trips/:tripCode/available-outbound-orders`; Kiểm tra tính nhất quán của API `POST /api/v1/warehouse/trips/:tripCode/append-stored-orders`
  * **Frontend**: Nâng cấp toàn diện kích thước Modal trong `WarehouseSelectStoredOrdersModal`; Mở rộng chiều cao vùng hiển thị danh sách (Table Container Viewport); Tái cấu trúc và phân bổ độ rộng chuẩn cho 10 cột dữ liệu (Table Columns)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_02_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_22/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_22/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_21] — Feedback 07/10 Task 21 — Khắc phục Lỗi Không Hiển thị Danh sách Đơn Lưu kho khi Xuất thêm Lên Trip (07/10/2026 (13:49))
- **Trạng thái**: ✅ Hoàn thành 100% (30/30 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Domain Lead Verification
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Popup Chọn đơn lưu kho bốc lên xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • API Bảng kê chuyến xe & Đơn xuất khả dụng ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts), [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Sổ cái giao dịch kho & Quản lý vị trí Hub ([`operational-ledger.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts), thực thể `OrderEntity`, `TripStopEntity`, `OrderInventoryTransactionEntity`) • Cơ sở dữ liệu PostgreSQL trên Neon Singapore (`ap-southeast-1.aws.neon.tech`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Nâng cấp Controller `WarehouseController` ([`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts)); Bổ sung `@Query('hubId') hubId?: number` vào endpoint `@Get('trips/:tripCode/available-outbound-orders')`.; Cập nhật Swagger documentation `@ApiQuery({ name: 'hubId', required: false, type: Number, description: 'ID kho xuất của tài khoản đang thao tác' })`....
  * **Frontend**: Cập nhật API Client & TanStack Query Hook ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts)); Cập nhật hàm `getAvailableOutboundOrders(tripCode: string, hubId?: number | null)`; Cập nhật hook `useAvailableOutboundOrdersQuery(tripCode, hubId, enabled)`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_02_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_21/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_21/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_12] — Feedback 07/10 Task 12 — Chuẩn Hóa Quản Lý Tồn Kho & Khắc Phục Lỗi Trạng Thái "LƯU KHO" Khi Số Lượng Tồn Bằng 0 (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (19/19 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity Verification
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Danh sách & Bảng tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Bảng trạng thái & Huy hiệu đơn kho ([`renderWarehouseOrderStatusBadge`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-tables/columns.tsx)) • Sổ cái vận hành kho & Phân quyền dữ liệu Hub ([`OperationalLedgerService`](file:///D:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts)) • Dịch vụ xử lý kho & Vòng đời đơn hàng ([`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Giao dịch kho & Thực thể liên kết ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts), [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts)) • Cơ sở dữ liệu Neon PostgreSQL Singapore (`ap-southeast-1`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Sửa đổi `hubScopeSql()`; Sửa đổi `hubStatusSql()` triệt tiêu trạng thái "LƯU KHO" khi tồn kho bằng 0; Sửa đổi `applyStatusFilter()`...
  * **Frontend**: Đồng bộ hóa Tab Filter & Dữ liệu hiển thị; Bảo vệ hiển thị trạng thái tại cột `TRẠNG THÁI`; Kiểm tra `renderWarehouseOrderStatusBadge()`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: 01_e2e_warehouse_orders_clean_stored_tab.png, screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_12/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_12/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_11] — Tối ưu Giao diện Bảng Kê Xuất Kho: Loại Bỏ Cột Trạng Thái Thừa (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Bộ phận Vận hành & Nghiệp vụ Kho Vận TMS)
- **Phạm vi**: Modal Chọn đơn lưu kho xuất xe (`WarehouseSelectStoredOrdersModal`), Bảng danh sách đơn hàng xuất luân chuyển Mode 2 (`WarehouseOutboundTransferFlow`), Trang xuất kho (`/dashboard/warehouse/outbound/page.tsx`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Bảo đảm tính toàn vẹn của tập dữ liệu đơn xuất kho (`getAvailableOutboundOrders`), 100% đơn hiển thị thuộc tập hợp lưu kho khả dụng.
  * **Frontend**: Loại bỏ hoàn toàn cột "Trạng thái đơn hàng" thừa thãi khỏi bảng kê chọn đơn xuất kho; Tái phân bổ độ rộng cột (Column Width Layout) cho Mã đơn, Kiện, Trọng lượng, Thể tích, Kho đích; Áp dụng triệt để Compact Density (`p-1`, `text-[10px]`, `py-1 px-1.5`).
- **Quy tắc bất biến mới**:
  * Mọi đơn hàng xuất hiện trong modal chọn đơn xuất kho đều mặc định là đơn đang lưu kho khả dụng, không hiển thị cột trạng thái gây chật chội và thừa thãi thông tin.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10_task_11/screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_11/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_11/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_10] — Chuẩn Hóa Cột Kho Đích & Gán Đơn Lưu Kho Lên Chuyến Xe (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (18/18 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ) & @Antigravity Team
- **Phạm vi**: Chi tiết Chuyến xe & Tác nghiệp Trạm trung chuyển Bước 2 (`WarehouseTripDetailModal`), Modal Chọn đơn lưu kho (`WarehouseSelectStoredOrdersModal`), Batch Append API (`append-stored-orders.dto.ts`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Endpoint gán hàng loạt đơn lưu kho lên chuyến xe (`POST /api/v1/warehouse/trips/:tripCode/orders/batch-stored`); Cập nhật `destinationHubId` và sinh giao dịch sổ cái kho; Tự động tính toán lại tải trọng và thể tích xe.
  * **Frontend**: Xây dựng Modal chọn đơn lưu kho đa chọn với checkbox, tìm kiếm mã đơn thời gian thực, hiển thị khối lượng và thể tích cộng dồn tức thời; Hiển thị chuẩn xác tên Kho đích.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10_task_10/screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10_task_10/RESOLUTION.md) • [`TODO.md`](feedback_07_10_task_10/TODO.md)

### 🚀 [FEEDBACK_07_10] — Chuẩn Hóa Cột Kho Đích / Nơi Giao & Đồng Bộ Phiếu Xuất Kho (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (32/32 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Lead
- **Phạm vi**: Phiếu Xuất Kho in ấn (`WarehouseOutboundReceiptModal`), Chi tiết Chuyến xe Bước 2 (`WarehouseTripDetailModal`), Bảng Quản lý Xuất kho (`/dashboard/warehouse/outbound`), Bảng kê Editable Grid (`WarehouseEditableGrid`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Chuẩn hóa DTO và dữ liệu trả về của `getTripManifest()` và `getWarehouseOrdersForHub`; Join quan hệ `destinationHub` để lấy tên tiếng Việt của Hub nhận.
  * **Frontend**: Phiếu in xuất kho hiển thị chính xác tên Hub đích thay vì địa chỉ giao hàng cuối của khách; Đồng bộ hóa giao diện điều xe xuất kho với 2 luồng: Mode 1 (Tạo mới) & Mode 2 (Luân chuyển nội bộ).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10/02_e2e_select_stored_orders_clean_columns.png`, `screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_07_10/RESOLUTION.md) • [`TODO.md`](feedback_07_10/TODO.md)

### 🚀 [FEEDBACK_06_10] — Bốc Hàng Dọc Đường (Roadside Pickup) & Gán Vào Chuyến Xe Đang Chạy (06/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (22/22 việc)
- **Báo cáo bởi**: @Thai & Đội ngũ Điều phối Hiện trường
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`), Chi tiết chuyến xe (`WarehouseTripDetailModal`), Modal Bốc thêm đơn (`WarehouseAppendOrderModal`), In phiếu kho, Sổ cái luân chuyển.
- **Năng lực & Tính năng mới**:
  * **Backend**: Hỗ trợ bốc đơn hàng dọc đường khi xe đang chạy trên lộ trình (`IN_TRANSIT`); Tự động gán điểm dừng phát sinh và trạm nhận hàng bàn giao; Tạo giao dịch luân chuyển an toàn không làm âm tồn kho kho nhận.
  * **Frontend**: Redesign Modal bốc hàng dọc đường với giao diện compact gọn gàng; Loại bỏ nút bấm thừa trên header bảng; Phân biệt rõ đơn nhập từ kho trung chuyển và đơn lấy dọc đường.
- **Quy tắc bất biến mới**:
  * Đơn bốc dọc đường không có kho xuất phát vật lý (`originHubId = null`) chỉ ghi nhận vào sổ cái khi thực nhận tại Hub bàn giao hoặc Hub đích.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`33-feedback-06-10.spec.ts`)
  * Minh chứng hình ảnh: `feedback_06_10/screenshot_01.jpg` đến `screenshot_07.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_06_10/RESOLUTION.md) • [`TODO.md`](feedback_06_10/TODO.md)

### 🚀 [FEEDBACK_05_10] — Gom Hàng Inbound, Chuyến Xe Nháp, Tái Sử Dụng Mã Chuyến (05/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (42/42 việc)
- **Báo cáo bởi**: @【M】【C】【D】 & Dispatch Lead
- **Phạm vi**: Bảng điều khiển Xuất kho (`/warehouse/outbound`), Bảng Nhập kho (`/warehouse/inbound`), API Chuyến xe kho (`WarehouseController`), Phân quyền RBAC v1.6.
- **Năng lực & Tính năng mới**:
  * **Backend**: Endpoint `GET /v1/warehouse/outbound-trips` trả về danh sách chuyến xe kèm bộ đếm 1:1 Parity từ cùng CTE; Cho phép lưu chuyến xe ở trạng thái Nháp (`DRAFT`); Hỗ trợ tái sử dụng mã chuyến xe khi chuyến cũ bị hủy; Tự động kết nối đơn hàng phân tách (Split Shipments).
  * **Frontend**: Chuẩn hóa đơn vị hiển thị thành `chuyến xe` đồng bộ giữa các Tab và Footer; Tái cấu trúc các Tab trạng thái xuất kho (`Tất cả`, `Xuất khách`, `Luân chuyển`); Đổi nhãn pallet kho rõ ràng; Tích hợp TanStack React Table v8.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`32-feedback-05-10.spec.ts`)
  * Minh chứng hình ảnh: `feedback_05_10/filter_outbound_wrong.png`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_05_10/RESOLUTION.md) • [`TODO.md`](feedback_05_10/TODO.md)

### 🚀 [FEEDBACK_04_10] — Tách Rời Kiểm Đếm Inbound & Chuyến Xe, Excel Parser & Chuẩn Hóa UTC (04/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @Thai & Thủ kho Andromeda
- **Phạm vi**: Quản lý Nhập kho Inbound Tally, Import Excel, Chuẩn hóa múi giờ PostgreSQL Neon.
- **Năng lực & Tính năng mới**:
  * **Backend**: Tách rời quy trình kiểm đếm hàng về kho khỏi chuyến xe vận tải (Decoupling Tally & Trip); Xử lý múi giờ UTC trong pg driver PostgreSQL đối với `TIMESTAMP WITHOUT TIME ZONE` tránh lệch ngày giờ giao nhận.
  * **Frontend**: Xóa bỏ cột `Hình thức giao hàng (deliveryMode)` khỏi file mẫu Excel và form nhập liệu; Mặc định parse sang `DIRECT_CUSTOMER`; Tối ưu UX kiểm đếm thực nhận theo kiện vận tải (Consignment No-SKU).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_04_10/` screenshots
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_04_10/RESOLUTION.md) • [`TODO.md`](feedback_04_10/TODO.md)

### 🚀 [FEEDBACK_17_8] — Chuẩn Hóa Toàn Diện TanStack Table v8, Phân Trang & RBAC (18/08/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (33/33 việc)
- **Báo cáo bởi**: @Thai & Team Lead
- **Phạm vi**: 7 màn hình danh sách TMS (`orders`, `trips`, `fleet`, `warehouse`, `hubs`, `users`, `notifications`), Middleware RBAC 3 lớp, Mail Simulation.
- **Năng lực & Tính năng mới**:
  * **Backend**: Cơ chế `MAIL_SIMULATE=true` giả lập email trong dev/test tránh cạn quota SMTP; Giải quyết triệt để Circular Dependency TypeORM bằng `Relation<T>`; Chuẩn hóa quan hệ Hubs và Vehicles.
  * **Frontend**: Tái cấu trúc toàn bộ 7 trang danh sách dữ liệu sang TanStack React Table v8 + URL Search Params sync (`nuqs`); Chuẩn hóa phân trang và thanh điều khiển; Phân quyền menu sidebar theo RBAC 3 lớp (Super Admin, Dispatcher, Fleet Manager, Warehouse Manager).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`06-order-dispatch-workflow.spec.ts`)
  * TypeScript & Lint: 0 lỗi
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](feedback_17_8/RESOLUTION.md) • [`TODO.md`](feedback_17_8/TODO.md)
