# Feedback 19/10 (Task #92) — Xử Lý Toàn Diện 6 Edge Cases Khi Lấy & Xuất Kho Đơn Hàng Nhập Nhiều Lần (Multi-Inbound Consolidation & Outbound Dispatch Edge Cases)

## 1. Bối cảnh Nghiệp vụ Thực tế & Phân tích Kiến trúc từ `/leader` (Operational Context)

Sau khi triển khai **Task #91** (Gom 1 dòng duy nhất cho đơn hàng nhập từ 2 lần trở lên, cộng dồn Số kiện / Số kg / Số khối và khóa cứng thông tin gốc theo lần nhập đầu tiên), `/leader` và `/todo-agent` đã thực hiện rà soát toàn diện luồng **Lấy đơn hàng & Xuất kho (`/dashboard/warehouse/outbound`)** từ đầu đến cuối (Tra cứu đơn lưu kho, Dán/Import Excel xuất kho, Cập nhật thông số tồn kho, Lưu nháp chuyến xuất, Xác nhận xuất kho từng phần/toàn phần, Luân chuyển liên Hub, và Mở lại chuyến xe xuất kho).

Qua phân tích sâu mã nguồn tại `backend/src/orders/warehouse.service.ts`, `frontend/src/app/dashboard/warehouse/outbound/page.tsx` và `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`, `/leader` phát hiện **6 Edge Cases (tình huống biên) nghiêm trọng** có thể gây kẹt nghiệp vụ hoặc sai lệch số liệu khi lấy đơn hàng ra xuất kho.

---

## 2. Phân tích Nguyên nhân Gốc rễ 6 Edge Cases (Root Cause Analysis - RCA)

### 🔴 Edge Case 1: `confirmOutbound` quên lưu `quantityAllocated: qtyToExport` vào bảng `trip` (`TripEntity`)
- **Vị trí**: [`backend/src/orders/warehouse.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L3037-L3052).
- **Nguyên nhân**: Trong `saveOutboundDraft` (dòng 3356) có lưu `quantityAllocated: qty`, nhưng trong `confirmOutbound` (dòng 3037) khi tạo `TripEntity` chỉ lưu `weightAllocated` và `volumeAllocated` mà **bỏ sót `quantityAllocated: qtyToExport`** (`NULL` trong DB).
- **Hệ quả thực tế**:
  1. **Sai số lượng khi xuất luân chuyển từng phần sang Hub khác**: Khi một đơn gom 25 kiện chỉ xuất luân chuyển 10 kiện sang Hub đích, truy vấn `getInboundTrips` tại Hub đích (dòng 4183: `COALESCE(t."quantityAllocated", o."totalQuantity", 1)`) thấy `t.quantityAllocated` là `NULL` nên fallback về `o.totalQuantity = 25 kiện` thay vì `10 kiện` thực chở trên xe!
  2. **Mất sạch đơn hàng khi Admin mở lại chuyến xe xuất kho (`rollbackTrip`)**: Khi Super Admin bấm *"Mở lại chuyến xe"* cho một chuyến xuất kho đã hoàn tất, `rollbackTrip` đổi `trip.status = 'PENDING'`. Tuy nhiên `getOutboundTrips` (dòng 3805: `.andWhere('t.quantityAllocated IS NOT NULL')`) và `discardOutboundDraftLines` (dòng 3164) yêu cầu `quantityAllocated IS NOT NULL`. Do đó chuyến xe sau khi mở lại bị mất sạch dòng hàng (`0 kiện`) và không thể bấm *"Tiếp tục"* hay xác nhận xuất lại!

### 🔴 Edge Case 2: Dán từ Excel (`Dán từ Excel` / `Ctrl+V`) hoặc `Import Excel` trên màn hình Xuất kho không tự động tra cứu (`OUTBOUND_LOOKUP`) dẫn tới rơi dòng hàng (`id = undefined`)
- **Vị trí**: [`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L1736-L1880) & [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L461-L525).
- **Nguyên nhân**: Khi ở chế độ Xuất kho (`isOutboundMode = true`), thao tác `Dán từ Excel` hoặc `Import Excel` chỉ điền chuỗi `orderCode` vào dòng mà không gọi tra cứu tồn kho (`OUTBOUND_LOOKUP`), khiến `row.id === undefined` và `row.remainingQuantity === undefined`. Tương tự, nếu người vận hành gõ mã vận đơn rồi bấm thẳng nút *"Xác nhận xuất kho"* / *"Lưu nháp"* trước khi ô input kịp chạy `performSearch`, `buildOutboundRequest` lọc `.filter((r) => r.id && !isNaN(Number(r.id)))` sẽ loại bỏ các dòng này và báo lỗi `404 Không tìm thấy đơn hàng nào để xuất kho`.

### 🔴 Edge Case 3: Nút "Cập nhật lại thông số" (`handleRefreshMetrics`) trên màn hình Xuất kho bị giải nén sai cấu trúc `ResponseTransformInterceptor` và thiếu `flow=OUTBOUND_LOOKUP`
- **Vị trí**: [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L316-L345).
- **Nguyên nhân**:
  1. API `/api/v1/warehouse/orders?ids=...` được bọc bởi `ResponseTransformInterceptor` thành `{ statusCode: 200, message: 'Success', data: { data: [...], meta: {...} } }`. Tuy nhiên `handleRefreshMetrics` chỉ kiểm tra `Array.isArray(json?.data)` (luôn trả về `false` vì `json.data` là object `{ data, meta }`), khiến `freshData` luôn là mảng rỗng `[]` — nút *"Cập nhật lại thông số"* hoàn toàn không cập nhật được dòng nào!
  2. Query làm mới thông số chưa truyền `flow: 'OUTBOUND_LOOKUP'` và chỉ map theo `Number(f.id)` thay vì hỗ trợ map theo cả `orderCode`, nên nếu đơn hàng vừa được gộp từ nhiều lần nhập (`consolidateSiblingOrdersByCode`), dòng trên phiếu có thể không nhận được tồn kho tổng mới nhất.

### 🔴 Edge Case 4: Gộp dòng lịch sử (`consolidateSiblingOrdersByCode`) khi Xuất kho / Lưu nháp chuyến xe có nhiều dòng trùng `orderCode` làm mất số lượng xuất hoặc sinh bản ghi `trip` trùng lặp
- **Vị trí**: [`backend/src/orders/warehouse.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L2785-L2904) & `#L3226-L3249`.
- **Nguyên nhân**:
  1. Khi một chuyến nháp cũ (tạo trước khi gộp đơn) hoặc request gửi lên có $\ge 2$ phần tử trong `dto.items` thuộc cùng 1 `orderCode` (ứng với các `orderId` anh em cũ, ví dụ `orderId: 100` xuất 10 kiện và `orderId: 101` xuất 15 kiện), vòng lặp `consolidateSiblingOrdersByCode` gộp chúng về 1 `order.id = 100`. Nhưng ngay bên dưới, `const item = dto.items?.find((i) => i.orderId === order.id)` chỉ lấy phần tử đầu tiên (`10 kiện`) và **bỏ mất 15 kiện của dòng anh em thứ hai**!
  2. Trong `consolidateSiblingOrdersByCode`, câu lệnh `UPDATE "trip" SET "orderId" = $1 WHERE "orderId" = ANY($2)` nếu gặp 2 dòng `trip` cùng `tripCode` (cùng 1 chuyến xe chứa 2 dòng con của cùng mã vận đơn) sẽ tạo ra 2 dòng `trip` trùng `(tripCode, orderId)` thay vì cộng dồn `quantityAllocated`, `weightAllocated`, `volumeAllocated` vào 1 dòng `trip` duy nhất và xóa mềm dòng dư.

### 🔴 Edge Case 5: Gõ hoặc chọn trùng cùng 1 Mã vận đơn thành 2 dòng trên cùng Bảng kê Xuất kho (`WarehouseEditableGrid`)
- **Vị trí**: [`frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L647-L698) & `handleSelectFromLookup` (`#L1809-L1865`).
- **Nguyên nhân**: Khi mã vận đơn `T91M-...` đã được chọn ở Dòng 1 trên Phiếu Xuất Kho, nếu người vận hành gõ lại mã đó ở Dòng 2 (hoặc chọn từ Modal tra cứu), `performSearch` chỉ hiện `toast.warning` nhưng **vẫn nạp đè toàn bộ số kiện tồn kho của đơn đó vào Dòng 2**, làm tổng kiện trên thanh công cụ bị nhân đôi sai thực tế và đến lúc bấm *"Xác nhận xuất kho"* mới bị chặn lỗi.

### 🔴 Edge Case 6: Đơn hàng đã Xuất kho hết (`COMPLETED_INBOUND`, `currentHubId = null`) nhưng có Xe sau chở về nhập bổ sung cùng `orderCode` bị mất `currentHubId`
- **Vị trí**: [`backend/src/orders/warehouse.service.ts`](file:///d:/Projects/logistics-website/backend/src/orders/warehouse.service.ts#L1320-L1335) & `#L1668-L1685`.
- **Nguyên nhân**: Khi đợt 1 của đơn hàng đã xuất kho hết (`remainingQuantity = 0`, `status = 'COMPLETED_INBOUND'`, `currentHubId = null`), nếu buổi chiều có xe thứ 2 chở nốt phần hàng còn lại của cùng `orderCode` về nhập kho, `quickCreateInboundOrder` và `createBatchInbound` cộng thêm `remainingQuantity` và đổi `status = 'INBOUND'`, nhưng **quên gán lại `activeEntry.currentHubId = originHubId`**, làm đơn hàng bị khuyết `currentHubId` khi kiểm tra tồn kho và luân chuyển.

---

## 3. Kiến trúc Giải pháp & Phạm vi File (Execution Blueprint)

### Danh sách File cần sửa đổi
- **Backend (`backend/`)**:
  1. `backend/src/orders/warehouse.service.ts`:
     - **Fix Edge Case 1**: Bổ sung `quantityAllocated: qtyToExport` khi khởi tạo `TripEntity` trong `confirmOutbound` (dòng 3037). Trong `rollbackTrip` (nhánh `isOutbound`), nếu bản ghi `trip` lịch sử có `quantityAllocated IS NULL`, tự động khôi phục `quantityAllocated` từ giao dịch `OUTBOUND`/`TRANSFER` tương ứng trước khi chuyển về `PENDING`.
     - **Fix Edge Case 4**:
       - Trong `consolidateSiblingOrdersByCode`: Trước khi soft-delete `otherIds`, kiểm tra các bản ghi `trip` của cùng `tripCode` giữa `primaryOrder.id` và `otherIds`. Nếu cùng `tripCode` đã có dòng trên `primaryOrder.id`, cộng dồn `quantityAllocated`, `weightAllocated`, `volumeAllocated` vào dòng `trip` của `primaryOrder.id` và soft-delete dòng `trip` trùng của `otherIds`; các dòng `trip` khác `tripCode` mới chuyển `orderId = primaryOrder.id`.
       - Trong `confirmOutbound` và `saveOutboundDraft`: Lưu map `allSiblingIdsByOrderId` (hoặc gộp toàn bộ `dto.items` có `orderId` thuộc nhóm anh em của cùng `orderCode`) để cộng tổng `quantityToExport`, `weightToExport`, `volumeToExport` khi một phiếu/chuyến nháp cũ gửi lên nhiều dòng của cùng 1 mã đơn.
     - **Fix Edge Case 6**: Trong `quickCreateInboundOrder` và `createBatchInbound`, khi nhập bổ sung cho đơn hàng đã tồn tại (`!isDraft`), luôn đảm bảo `if (originHubId) activeEntry.currentHubId = originHubId;` và chuyển `status = 'INBOUND'` khi `remainingQuantity > 0`.
- **Frontend (`frontend/`)**:
  1. `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
     - **Fix Edge Case 2**: Khi ở chế độ Xuất kho (`isOutboundMode = true`), sau khi `Dán từ Excel` (`applyPastedRows`) hoặc `Import Excel` (`handleImportExcelRows`), tự động kích hoạt tra cứu tồn kho (`OUTBOUND_LOOKUP`) cho tất cả các dòng có `orderCode` nhưng chưa có `id` để nạp đúng `id`, `remainingQuantity` (tồn khả dụng), `goodsDescription`, `deliveryAddress`, và tỷ lệ kg/m³.
     - **Fix Edge Case 5**: Trong `performSearch` và `handleSelectFromLookup` khi `isOutboundMode = true`, nếu đơn hàng (`foundOrder.id` hoặc `foundOrder.orderCode`) đã tồn tại ở một dòng khác trên phiếu xuất, hiển thị `toast.error` báo rõ dòng đang chứa mã đơn đó và **không nạp trùng** vào dòng hiện tại (reset dòng hiện tại về rỗng).
  2. `frontend/src/app/dashboard/warehouse/outbound/page.tsx`:
     - **Fix Edge Case 2 (Fallback trước khi Submit/Save Draft)**: Trong `handleSubmitOutbound` và `handleSaveDraft`, nếu có dòng hợp lệ (`orderCode` khác rỗng) nhưng chưa có `r.id` (do người dùng gõ mã rồi bấm nút ngay lập tức mà chưa nhấn Enter/Blur), tự động gọi API `/api/v1/warehouse/orders?flow=OUTBOUND_LOOKUP&search=...` để phân giải `id` và kiểm tra tồn kho trước khi gửi request.
     - **Fix Edge Case 3**: Trong `handleRefreshMetrics`, truyền thêm `flow: 'OUTBOUND_LOOKUP'` vào query, giải nén đúng cấu trúc `const payload = json?.meta ? json : (json?.data ?? json); const freshData = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];`, và tra cứu khớp theo cả `Number(r.id)` lẫn `r.orderCode?.trim().toUpperCase()`.

---

## 4. Danh sách Công việc Chi tiết (Task Checklist)

- [x] **Task 1 (Backend - Outbound `quantityAllocated` & Rollback Integrity)**: Bổ sung `quantityAllocated: qtyToExport` vào `TripEntity` trong `confirmOutbound` và tự động đồng bộ `quantityAllocated` từ `txList` khi `rollbackTrip` mở lại chuyến xuất kho tại `backend/src/orders/warehouse.service.ts`.
- [x] **Task 2 (Backend - Sibling Trip Deduplication & Multi-Item Merge on Outbound)**: Cập nhật `consolidateSiblingOrdersByCode`, `confirmOutbound` và `saveOutboundDraft` tại `backend/src/orders/warehouse.service.ts` để gộp dòng `trip` trùng `tripCode` và cộng dồn `dto.items` nếu có nhiều dòng anh em cùng `orderCode`.
- [x] **Task 3 (Backend - Re-Inbound After Full Outbound `currentHubId` Recovery)**: Cập nhật `quickCreateInboundOrder` và `createBatchInbound` tại `backend/src/orders/warehouse.service.ts` để khôi phục `activeEntry.currentHubId = originHubId` và `status = 'INBOUND'` khi đơn hàng đã xuất hết (`COMPLETED_INBOUND`) được xe sau chở về nhập bổ sung.
- [x] **Task 4 (Frontend - Outbound Duplicate Row Prevention & Excel Paste Auto-Lookup)**: Cập nhật `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` để chặn nạp trùng mã vận đơn ở 2 dòng trên cùng phiếu xuất và tự động tra cứu `OUTBOUND_LOOKUP` khi Dán/Import Excel ở màn hình Xuất kho.
- [x] **Task 5 (Frontend - Outbound Refresh Metrics Unwrapping & Pre-Submit Lookup Resolution)**: Cập nhật `handleRefreshMetrics` và bổ sung cơ chế tự động phân giải các dòng có `orderCode` nhưng chưa kịp gắn `id` trước khi bấm Xác nhận xuất kho / Lưu nháp tại `frontend/src/app/dashboard/warehouse/outbound/page.tsx`.
- [x] **Task 6 (Verification - 2-Tier E2E Test & Visual Evidence)**: Chạy kiểm thử E2E xác minh toàn bộ 6 Edge Cases (Xuất từng phần $\rightarrow$ Nhập bổ sung lần 3 $\rightarrow$ Làm mới thông số $\rightarrow$ Chặn chọn trùng dòng $\rightarrow$ Xuất kho nốt phần còn lại $\rightarrow$ Kiểm tra phiếu xuất), chấm điểm `e2e-auditor.mjs` đạt 50/50 và ghi `RESOLUTION.md`.


---

## 5. 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### Phần 1: Chuỗi Hành Động Kiểm Thử E2E Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản kiểm thử**: `USER_WAREHOUSE_HCM` (`warehouse_hcm` — thuộc `Andromeda Hub - HCM`).
- **Bước 1 (Thiết lập đơn gộp 2 lần nhập & Xuất kho từng phần — Edge Cases #1 & #4)**:
  - Tạo đơn hàng `T92E-...` qua 2 đợt nhập kho (Đợt 1: 10 kiện, 100 kg, 1.0 m³; Đợt 2: 15 kiện, 150 kg, 1.5 m³ $\rightarrow$ Tổng 25 kiện).
  - Mở `/dashboard/warehouse/outbound`, tạo phiếu xuất kho Xe 1 (`51C-92101`), tra cứu `T92E-...` (hiển thị `Tồn: 25`), chỉnh số lượng xuất thành `10` kiện, chụp ảnh `step_01_partial_outbound_10_of_25_form.png`.
  - Bấm `Xác nhận xuất kho`, kiểm tra Modal Phiếu Xuất Kho A4 và xác nhận bản ghi `TripEntity` lưu đúng `quantityAllocated = 10`, chụp ảnh `step_02_partial_outbound_receipt_quantity_allocated.png`.
- **Bước 2 (Chặn chọn trùng mã vận đơn 2 dòng & Làm mới thông số tồn kho — Edge Cases #2, #3, #5)**:
  - Mở phiếu xuất kho mới Xe 2 (`51C-92102`), nhập `T92E-...` ở Dòng 1 (`Tồn: 15`).
  - Thêm Dòng 2, nhập lại `T92E-...` $\rightarrow$ Hệ thống báo lỗi trùng mã đơn và tự động xóa trắng Dòng 2, chụp ảnh `step_03_duplicate_order_row_blocked.png`.
  - Nhập bổ sung Đợt 3 (5 kiện) cho `T92E-...`, sau đó bấm nút `Cập nhật lại thông số` trên màn hình Xuất kho $\rightarrow$ Dòng 1 tự động cập nhật từ `Tồn: 15` lên `Tồn: 20`, chụp ảnh `step_04_refresh_metrics_updated_stock_20.png`.
- **Bước 3 (Xuất kho 100% tồn còn lại & Khôi phục tồn kho khi Xe 4 nhập bổ sung sau khi đã xuất hết — Edge Case #6)**:
  - Xuất hết 20 kiện còn lại của `T92E-...`, chụp ảnh phiếu xuất `step_05_full_outbound_20_packages_receipt.png`.
  - Nhập bổ sung Đợt 4 (8 kiện) cho mã `T92E-...` (vốn đã xuất hết `COMPLETED_INBOUND`) $\rightarrow$ Mở `/dashboard/warehouse/orders`, xác nhận đơn `T92E-...` khôi phục `currentHubId`, trạng thái `LƯU KHO` và hiển thị 1 dòng duy nhất với tồn khả dụng `8 / 38` kiện, chụp ảnh `step_06_reinbound_after_full_outbound_restored_stock.png` và `screenshot_feedback_19_10_task_92_verified.png`.

### Phần 2: Ma Trận 6 Edge Cases Kiểm Chứng (Edge Cases Matrix)
| Mã EC | Tình huống biên (Edge Case) | Kỳ vọng nghiệp vụ chuẩn |
|---|---|---|
| `EC-01` | Xuất kho từng phần đơn gộp (`confirmOutbound`) | Bản ghi `TripEntity` phải lưu `quantityAllocated = qtyToExport` (không bị `NULL`), hỗ trợ luân chuyển từng phần và `rollbackTrip`. |
| `EC-02` | Dán Excel hoặc bấm Submit nhanh khi dòng chưa gắn `id` | Tự động phân giải `id` và tồn khả dụng qua `flow=OUTBOUND_LOOKUP`. |
| `EC-03` | Bấm nút `Cập nhật lại thông số` (`handleRefreshMetrics`) | Giải nén đúng `ResponseTransformInterceptor` (`payload?.data`) kèm `flow=OUTBOUND_LOOKUP`, cập nhật ngay `Tồn: N` mới nhất. |
| `EC-04` | Gộp các dòng anh em lịch sử (`consolidateSiblingOrdersByCode`) | Cộng dồn `quantityAllocated` khi trùng `tripCode` và gộp `dto.items` cùng đơn hàng. |
| `EC-05` | Gõ hoặc chọn trùng 1 mã vận đơn ở 2 dòng trên phiếu xuất | Chặn ngay lập tức với thông báo lỗi rõ ràng và reset dòng bị trùng. |
| `EC-06` | Đơn đã xuất hết (`COMPLETED_INBOUND`) được xe sau nhập bổ sung | Tự động khôi phục `currentHubId = originHubId` và chuyển trạng thái về `INBOUND` (`LƯU KHO`). |

### Phần 3: File Kiểm Thử Playwright Mục Tiêu
- `frontend/e2e/94-feedback-19-10-task-92-outbound-edge-cases.spec.ts`
