# Feedback 21/10 (Task #94) — Đồng Bộ Xóa Dòng Đơn Hàng Trong Chuyến Nhập Kho & Triệt Tiêu Đơn Nháp Tồn Kho Ảo

## 1. Bối cảnh Nghiệp vụ Thực tế & Nguyên văn Phản hồi (Operational Context)

### Trích dẫn phản hồi vận hành (21/10/2026)
- **Người dùng phản hồi**:
  > *"DQT2610-099*  
  > *cái đơn này ban đầu lúc nháp thì có*  
  > *nhưng khi nhận xe thì không có, các bạn xóa đi*  
  > *sau đó xác nhận và in phiếu ra đúng 6 đơn*  
  > *nhưng check lại hệ thống thì nó vẫn còn đơn này nằm trong trip đã xử lý*  
  > *check trong đơn hàng kho thì đơn này nó là đơn nháp*  
  > *thực tế không có hàng"*
- **Quy chuẩn logic nghiệp vụ yêu cầu (Business Logic Invariants)**:
  > *"logic chỗ này:*  
  > *1. Khi trip nhập mới tạo mã vận đơn mới thì khi xóa đơn trong trip đơn hàng cũng sẽ mất trong trip và mất luôn trong đơn hàng kho.*  
  > *2. Nếu trip nhập hàng mà nhập vào mã vận đơn đã có lưu kho trước (hàng về nhiều đợt), khi xóa đơn hàng trong trip thì các thông tin của mã vận đơn này không thay đổi."*

---

## 2. Giải mã Bằng chứng Hình ảnh (Multimodal OCR & Hub Extraction)

1. **`image_1.png` (`Bảng kê chi tiết các dòng hàng trên chuyến xe` · 43H21203 SPIDER)**:
   - **Thông tin chuyến xe**:
     - Ngày nhập kho: `2026-10-21`
     - Biển số xe: `43H21203 SPIDER`
     - Tài xế phụ trách: `Phan Văn Tâm`
     - Tổng số dòng hiển thị: **7 dòng hàng**
   - **Danh sách vận đơn trên chuyến**:
     - `01`: `HKN2610-022` — `PALLET` — 4 kiện, 700 kg, 8 m³
     - `02`: `NDA2610-0253` — `Snack` — 276 kiện, 950 kg, 4.36 m³
     - `03`: `NDA2610-0251` — `Snack` — 150 kiện, 490 kg, 2.08 m³
     - `04`: `NDA2610-0252` — `Snack` — 100 kiện, 400 kg, 2.14 m³
     - `05`: `LKN2610-011` — `Rượu` — 1 kiện, 10 kg, 0 m³
     - `06`: `NMC26010-079` — `Thùng` — 50 kiện, 1 kg, 8 m³
     - `07`: `DQT2610-099` — `Thiết bị` — 2 kiện, 520 kg, 2.4 m³ (Điểm bốc: Kho Magellan Spider Tổng Kho Minh Hương - Đà Nẵng)
   - **Lỗi hiển thị thực tế**: Dù thủ kho đã xóa đơn `07` khỏi bảng kê khi nhận xe và in phiếu chỉ ra đúng 6 đơn, nhưng khi xem lại bảng kê chi tiết chuyến xe sau xử lý, đơn `DQT2610-099` vẫn hiển thị lù lù ở dòng số 07!

2. **`image_2.png` (`Tổng Hợp Đơn Hàng Tại Kho · Andromeda Hub - HCM`)**:
   - **Hub vận hành thực tế**: **Andromeda Hub - HCM** $\rightarrow$ Tài khoản kiểm thử định danh: `USER_WAREHOUSE_HCM` (`warehouse_hcm`).
   - **Ô tra cứu**: `DQT2610-099`
   - **Thống kê Tabs**: `Tất cả (1) | LƯU KHO (0) | ĐƠN NHÁP (1) | ĐÃ XUẤT KHO (0)`
   - **Dòng dữ liệu hiển thị**:
     - STT: `01`
     - Ngày nhập: `22:42 20/10/2026`
     - Mã vận đơn: `DQT2610-099`
     - Tên hàng hóa: `Thiết bị`
     - Số lượng: `0 / 2` kiện
     - Số kg: `520`
     - CBM: `2,4`
     - Đích đến: `HCM`
     - Trạng thái: `[Đơn nháp]`
   - **Lỗi nghiệp vụ thực tế**: Đơn hàng thực tế không có hàng trên xe, đã bị xóa khỏi chuyến nhập nhưng vẫn tồn tại dưới dạng đơn rác ảo (`Đơn nháp 0/2`) trong kho hàng Andromeda Hub!

---

## 3. Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)

1. **Khiếm khuyết cốt tử tại Backend (`backend/src/orders/warehouse.service.ts` - `confirmInbound`)**:
   - Tại dòng 2618 trong `confirmInbound`:
     ```typescript
     // When saving draft edits on a shared trip, remove any PENDING draft lines deleted by the user
     if (isKeepStatus && sharedTripCode && savedOrders.length > 0) { ... }
     ```
   - Đoạn mã đồng bộ loại bỏ các dòng hàng đã bị xóa khỏi chuyến xe **chỉ được thực thi khi `isKeepStatus === true`** (tức là khi bấm "Lưu nháp" với `targetStatus: 'KEEP'`).
   - Khi thủ kho thao tác tiếp nhận xe thực tế: Họ mở modal chuyến xe, xóa dòng đơn hàng không có thực tế (ví dụ dòng 7 `DQT2610-099`), rồi bấm **"Xác nhận kiểm đếm & Nhập kho"** (`handleConfirmInbound`). Hành động này gửi `targetStatus: 'INBOUND'`, khiến `isKeepStatus = false`.
   - Vì `isKeepStatus = false`, **toàn bộ khối lệnh dọn dẹp các dòng đã xóa bị bỏ qua hoàn toàn**!
   - Hệ quả:
     1. Bản ghi `trip` của `DQT2610-099` trong bảng `trip` liên kết với chuyến `SD212` vẫn tồn tại nguyên vẹn (`deletedAt: null`).
     2. Khi truy vấn `getTripManifest` của chuyến xe đã xử lý, hệ thống join bảng `trip` và vẫn trả về đủ 7 dòng hàng (bao gồm cả dòng 7).
     3. Bản ghi `order` của `DQT2610-099` trong bảng `order` không được xác nhận sang `INBOUND`, nên vẫn giữ nguyên `status: 'DRAFT'` với số lượng `0 / 2`.
     4. Khi xem màn hình `Tổng Hợp Đơn Hàng Tại Kho`, đơn này tiếp tục xuất hiện trong tab `ĐƠN NHÁP` gây ô nhiễm tồn kho ảo.

2. **Thiếu cơ chế phân định 2 luồng vòng đời đơn hàng khi xóa khỏi chuyến nhập**:
   - **Trường hợp 1 (Đơn tạo mới theo chuyến - New Waybill on Trip)**:
     - Đơn hàng được tạo nháp đồng thời cùng chuyến nhập này, chưa từng được tiếp nhận lưu kho trước đó (không có giao dịch `order_inventory_transaction` type `INBOUND`), đang ở trạng thái `DRAFT` / `PENDING_INBOUND`.
     - Khi xóa đơn này ra khỏi chuyến xe: Đơn hàng thực tế không tồn tại hàng hóa $\rightarrow$ Bắt buộc phải **xóa bỏ liên kết trip** VÀ **xóa mềm (soft-delete) luôn đơn hàng kho (`orderRepo.softDelete`)**, giải phóng hoàn toàn khỏi kho bãi.
   - **Trường hợp 2 (Đơn đã có lưu kho trước - Pre-existing Stored Waybill / Multi-batch Inbound)**:
     - Mã vận đơn này đã có lịch sử lưu kho từ trước (đang có trạng thái `INBOUND` hoặc đã có các giao dịch nhập kho trước đó). Chuyến xe này chỉ là đợt hàng trung chuyển bổ sung hoặc nhập thêm đợt 2, đợt 3.
     - Khi xóa đơn hàng này ra khỏi chuyến xe hiện tại: Chỉ gỡ liên kết dòng chuyến xe (`trip`), **tuyệt đối KHÔNG ĐƯỢC THAY ĐỔI** trạng thái, số lượng tồn kho, số kg, số khối hay thông tin hợp đồng gốc của mã vận đơn đã lưu kho trước đó.

---

## 4. Kiến trúc Giải pháp & Phạm vi File (Execution Blueprint)

### Phạm vi File cần chỉnh sửa
1. **Backend (`backend/src/orders/warehouse.service.ts`)**:
   - Cập nhật hàm `confirmInbound`:
     - Chuyển logic dọn dẹp các dòng hàng bị xóa ra khỏi điều kiện `isKeepStatus`, để nó **chạy cho cả hai trường hợp**: `Lưu nháp` (`targetStatus === 'KEEP'`) và `Xác nhận nhập kho` (`targetStatus === 'INBOUND'`).
     - Tự động phát hiện các dòng `trip` thuộc `sharedTripCode` và `type === 'INBOUND'` có `orderId` không nằm trong danh sách gửi lên (`keptOrderIds`).
     - Soft-delete các bản ghi `trip` bị loại bỏ khỏi chuyến xe.
     - Với từng `orderId` bị gỡ khỏi chuyến:
       - Kiểm tra lịch sử giao dịch: Đếm số lượng giao dịch nhập kho thành công (`order_inventory_transaction` với `type === 'INBOUND'`).
       - Đếm số chuyến xe khác (`trip` khác không bị soft-delete) gắn với đơn này.
       - Nếu đơn hàng **không có giao dịch nhập kho nào trước đó** VÀ **không còn chuyến xe nào khác** VÀ **đang ở trạng thái nháp (`DRAFT`, `PENDING_INBOUND`)**:
         $\rightarrow$ Thực hiện `orderRepo.softDelete(remOrder.id)` để xóa hoàn toàn đơn rác khỏi kho.
       - Nếu đơn hàng **đã có giao dịch nhập kho trước đó** hoặc **đang ở trạng thái `INBOUND`/`STORED`**:
         $\rightarrow$ Giữ nguyên trạng thái và thông tin của `order`, không thay đổi bất kỳ trường dữ liệu nào.
   - Cập nhật dữ liệu sạch cho đơn hàng hiện tại `DQT2610-099` (id 290) trên chuyến `SD212`:
     - Xóa mềm dòng `trip` của `DQT2610-099` trên `SD212`.
     - Xóa mềm đơn hàng nháp rác `DQT2610-099` khỏi bảng `order`.

2. **Frontend (`frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`)**:
   - Đảm bảo khi xóa dòng trong `WarehouseEditableGrid`, danh sách `rows` truyền vào payload của `handleConfirmInbound` và `handleSaveDraft` phản ánh đúng các dòng còn lại.
   - Đảm bảo sau khi gọi API thành công, toàn bộ query cache được invalidate chuẩn:
     `tripManifestKeys.all`, `['warehouse', 'inbound-trips']`, `['warehouse', 'orders']`, `['warehouse', 'kpi']`.

---

## 5. Danh sách Công việc Chi tiết (Task Checklist)

- [x] **Task 1 (Backend - Universal Trip Line Deletion & Draft Order Purge)**:
  - Cập nhật `confirmInbound` trong `backend/src/orders/warehouse.service.ts` để đồng bộ xóa các dòng bị loại bỏ ở cả chế độ `KEEP` (Lưu nháp) và `INBOUND` (Xác nhận nhập kho).
  - Triển khai logic phân định nghiêm ngặt: Xóa triệt để đơn nháp mới sinh khi bỏ khỏi trip; Bảo toàn 100% dữ liệu đối với đơn đã có tồn kho từ trước.
- [x] **Task 2 (Database - Data Cleanup Script for DQT2610-099 & SD212)**:
  - Chạy script xử lý chuẩn hóa dữ liệu hiện tại của chuyến `SD212` và đơn `DQT2610-099` để bảng kê chuyến phản ánh đúng 6 đơn thực nhận và kho không còn đơn nháp rác.
- [x] **Task 3 (Frontend - Modal Cache & State Invalidation Verification)**:
  - Cập nhật `WarehouseTripDetailModal` thêm `['warehouse', 'orders']` vào `queryClient.invalidateQueries` khi xác nhận nhập kho (`handleConfirmInbound`), đảm bảo bảng kê chuyến và tổng hợp đơn kho làm mới tức thì.
- [x] **Task 4 (Quality Gate 1 - Local Build & Typecheck)**:
  - Chạy `tsc --noEmit` ở cả `backend/` và `frontend/` vượt qua 100% không một lỗi biên dịch.
  - Tạo kịch bản Playwright E2E `frontend/e2e/96-feedback-21-10-task-94-delete-inbound-trip-order.spec.ts`.
- [ ] **Task 5 (Quality Gate 2 - Deploy & Dev Cloud Verification)**:
  - Push code và tạo GitHub PR vào `dev`, merge lên Railway Cloud Dev.
  - Chạy lại E2E trên Domain Dev Railway Cloud (`frontend-tms-core-dev.up.railway.app`).
  - Chụp ảnh bằng chứng thực tế `screenshot_*_verified.png`, ghi `RESOLUTION.md`, cập nhật `docs/SYSTEM_TIMELINE.md`.

---

## 6. Ma trận 10 Edge Cases Toàn diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
| :--- | :--- | :--- | :--- | :--- |
| **EC-01** | Xóa đơn tạo mới khi Lưu nháp chuyến xe | Chuyến xe Chờ xử lý có đơn mới tạo, bấm xóa dòng rồi bấm "Lưu nháp" (`targetStatus: 'KEEP'`) | Dòng trip bị xóa, đơn hàng nháp bị xóa mềm khỏi hệ thống | `trip` soft-deleted, `order` soft-deleted, không hiện trong tab Đơn nháp |
| **EC-02** | Xóa đơn tạo mới khi Xác nhận nhập kho | Chuyến xe Chờ xử lý có đơn mới tạo, bấm xóa dòng rồi bấm "Xác nhận kiểm đếm & Nhập kho" | Chuyến xe chuyển Đã xử lý chỉ gồm các đơn còn lại; đơn bị xóa mất khỏi trip và mất khỏi đơn kho | `getTripManifest` không chứa mã đơn bị xóa; `orders` không có bản ghi nháp rác |
| **EC-03** | Xóa đơn đã có lưu kho trước khỏi chuyến nhập | Đơn đã có trạng thái `INBOUND` từ đợt trước, được thêm vào chuyến xe mới nhưng bị xóa đi khi nhận xe | Dòng trip của chuyến hiện tại bị xóa; đơn hàng cũ giữ nguyên trạng thái `INBOUND` và số lượng tồn kho | `order.status === 'INBOUND'`, `order.remainingQuantity` không đổi, `order.deletedAt === null` |
| **EC-04** | In phiếu nhập kho sau khi xóa dòng | Thủ kho xóa 1 dòng trên xe 7 đơn rồi bấm xác nhận và in phiếu nhập | Phiếu in A4 hiển thị chính xác 6 dòng đơn, tổng số kiện tính đúng 6 đơn, không in dòng bị xóa | Dữ liệu in `items.length === 6`, tổng số kiện bằng tổng 6 dòng |
| **EC-05** | Xem lại bảng kê chuyến xe đã xử lý sau khi xóa dòng | Chuyến xe đã xác nhận nhập kho với 6 đơn (đã xóa đơn thứ 7), mở modal xem chi tiết chuyến xe | Bảng kê chi tiết chuyến xe hiển thị đúng 6 dòng hàng, không hiển thị dòng thứ 7 | `manifest.lines.length === 6`, không có mã `DQT2610-099` |
| **EC-06** | Tra cứu mã đơn bị xóa trong Tổng Hợp Đơn Kho | Gõ tìm kiếm mã vận đơn vừa bị xóa khỏi chuyến nhập mới trên thanh search đơn kho | Không tìm thấy đơn hàng, bảng trả về 0 kết quả hoặc tab Đơn nháp bằng 0 | Tab `ĐƠN NHÁP (0)`, kết quả bảng trống |
| **EC-07** | Đơn hàng gắn trên nhiều chuyến xe | Đơn hàng nháp được gắn vào 2 chuyến xe khác nhau, xóa ở chuyến A nhưng chuyến B vẫn còn | Chỉ xóa dòng liên kết ở chuyến A; chuyến B vẫn giữ nguyên, đơn hàng chưa bị xóa mềm | Bản ghi `trip` chuyến A soft-deleted; bản ghi `trip` chuyến B còn hiệu lực; `order` chưa xóa |
| **EC-08** | Xóa tất cả các dòng trên chuyến xe | Thủ kho xóa sạch toàn bộ dòng trong bảng kê rồi cố bấm Xác nhận hoặc Lưu | Hệ thống chặn và báo lỗi yêu cầu chuyến xe phải có ít nhất 1 dòng hàng | Toast cảnh báo lỗi, không cho gửi payload rỗng |
| **EC-09** | Rollback chuyến xe sau khi đã xóa đơn | Admin mở lại chuyến xe đã xử lý 6 đơn về Chờ xử lý | Chuyến xe quay về trạng thái Chờ xử lý với đúng 6 đơn, đơn thứ 7 đã xóa không tự ý phục hồi | Chuyến xe có 6 dòng ở trạng thái PENDING |
| **EC-10** | Đồng thời cập nhật thông tin xe và xóa đơn | Sửa biển số xe, tên tài xế và xóa 1 đơn hàng trong cùng một lần bấm xác nhận | Biển số xe và tài xế mới được cập nhật cho các đơn còn lại; đơn bị xóa không nhận cập nhật và bị xóa sạch | 6 đơn còn lại có biển số mới; đơn bị xóa không bị ảnh hưởng và bị xóa mềm |
