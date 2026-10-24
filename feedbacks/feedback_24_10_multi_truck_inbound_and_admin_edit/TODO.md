# 📋 TODO: Khắc Phục Lỗi Nhập Hàng Nhiều Xe (Multi-Truck Inbound), Mở Rộng Quyền Chỉnh Sửa Super Admin & Chuẩn Hóa Đơn NAV2610-0128

> **Mã công việc**: `TASK-24-10-MULTI-TRUCK-INBOUND-AND-ADMIN-EDIT`  
> **Phân hệ**: `Kho bãi (Warehouse) - Nhập kho (Inbound) & Bảng kê chuyến xe (Trip Manifest)`  
> **Chỉ đạo kiến trúc**: `/leader` & `/todo-agent`  
> **Kiểm thử**: `/e2e-test-runner` & `/e2e-code-auditor`  
> **Nhánh Git**: `fix/task-24-10-multi-truck-inbound-and-admin-edit` (Base từ `dev`)  

---

## 📌 Bối Cảnh & Vấn Đề Thực Tế

1. **Lỗi nhập hàng nhiều xe (Multi-Truck Inbound)**:
   - Đơn hàng `NAV2610-0128` (72 kiện) được chở về kho bằng 2 xe:
     - Xe 1 (`29E15245 SPIDER` - Chuyến `SD365`): Nhập 27 kiện ➔ Đơn chuyển sang trạng thái `INBOUND`.
     - Xe 2 (`75H07560 SPIDER` - Chuyến `SD328`): Chở 45 kiện còn lại.
   - Khi thủ kho nhập mã đơn `NAV2610-0128` cho Xe 2, hàm `isRowInboundLocked` trên giao diện phát hiện trạng thái đơn là `INBOUND` nên đã **khóa cứng ô Số kiện, Số kg, Số m³** (`disabled={true}`).
   - Thủ kho không thể sửa thành 45 kiện, dẫn tới Xe 2 bị chốt nhận mặc định chỉ 1 kiện.

2. **Lỗi hiển thị bảng kê chuyến xe (Modal "CHUYẾN XE")**:
   - Backend `getInboundTrips` gán nguyên đối tượng `OrderEntity` (mang `totalQuantity` toàn đơn) vào danh sách đơn của từng chuyến xe.
   - Frontend `WarehouseTripDetailModal` khi ở trạng thái Đã xử lý lại hiển thị `r.totalQuantity` của đơn thay vì `quantityAllocated` của chuyến xe đó.
   - Kết quả: Cả 2 modal của Chuyến SD365 và SD328 đều hiển thị cùng 1 con số (2 kiện), gây sai lệch và không phản ánh đúng thực tế chuyến xe chở bao nhiêu.

3. **Yêu cầu mở rộng quyền hạn Super Admin**:
   - Super Admin có đặc quyền tối cao: Được phép chỉnh sửa toàn bộ các trường (kể cả khi đơn/chuyến đã chốt sổ, mở khóa master contract, điều chỉnh số kiện, khối lượng, thông tin xe và tài xế trực tiếp).

---

## 🏗️ Kế Hoạch 6 Giai Đoạn SDLC

### 👤 Giai đoạn 1: PLAN (Lên kế hoạch)
- [x] Dump DB từ Production về Dev thành công 100% (15 bảng, 13 sequences).
- [x] Điều tra chuyên sâu RCA cho đơn `NAV2610-0128`, chuyến `SD365`, `SD328` và `SD437`.
- [x] Lập tài liệu `TODO.md` đặc tả 10 ca kiểm thử biên (Edge Cases Matrix) và kịch bản E2E.

### 👤 Giai đoạn 2: DESIGN (Thiết kế kiến trúc)
- [x] Thiết kế cơ chế phân tách:
  - Thông tin bất biến theo hợp đồng gốc khách hàng (Tên hàng, Nơi giao, Đích đến, Tỉnh/TP) ➔ Khóa đối với Thủ kho, Mở đối với Super Admin.
  - Thông tin tác nghiệp theo từng chuyến xe (Số kiện, Số kg, Số m³, Điểm lấy) ➔ Luôn MỞ cho phép nhập khi nhận chuyến mới (kể cả đơn đã có trạng thái `INBOUND`).
- [x] Thiết kế API và giao diện Modal Chuyến Xe:
  - Backend trả về `quantityAllocated`, `weightAllocated`, `volumeAllocated` riêng biệt cho từng chuyến xe.
  - Frontend hiển thị đúng số kiện thực tế của chuyến xe trong bảng và chân trang tổng kết.
- [x] Thiết kế quyền Super Admin Edit Override:
  - Cho phép Super Admin chỉnh sửa trực tiếp mọi thông số dòng hàng trong chuyến xe và lưu lại.

### 👤 Giai đoạn 3: BUILD (Xây dựng mã nguồn)
- [ ] Tạo nhánh `fix/task-24-10-multi-truck-inbound-and-admin-edit` trên `backend/` và `frontend/` từ `dev`.
- [ ] Cập nhật `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx`:
  - Mở khóa ô Số kiện, Số kg, Số m³ khi nhập đơn phân chuyến.
  - Cho phép Super Admin sửa tất cả các trường.
- [ ] Cập nhật `backend/src/orders/warehouse.service.ts`:
  - Trong `getInboundTrips`: đính kèm `quantityAllocated`, `weightAllocated`, `volumeAllocated` vào từng đơn hàng thuộc chuyến xe.
- [ ] Cập nhật `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`:
  - Hiển thị `quantityAllocated` / `expectedQuantity` cho chuyến xe thay vì `order.totalQuantity`.
  - Cho phép Super Admin chỉnh sửa và lưu trực tiếp.
- [ ] Chuẩn hóa dữ liệu đơn `NAV2610-0128` trên Dev DB:
  - Xe 1 (`SD365`): 27 kiện.
  - Xe 2 (`SD328`): 45 kiện.
  - Xóa chuyến thừa `SD437`.
  - Tổng tồn kho đơn `NAV2610-0128`: 72 kiện.
- [ ] Kiểm tra biên dịch TypeScript: `npm run build` (backend & frontend).

### 👤 Giai đoạn 4: TEST (Kiểm thử 2 Tầng)
- [ ] Viết kịch bản Playwright E2E: `frontend/e2e/39-multi-truck-inbound-and-super-admin-edit.spec.ts`.
- [ ] **Tầng 1 (Local E2E)**:
  - Chạy suite trên Local (`localhost:4000` & `localhost:4001`).
  - Chạy `node scripts/e2e-auditor.mjs` đạt $\ge 40/50$.
- [ ] **Tầng 2 (Cloud Dev Gate)**:
  - Đẩy code lên nhánh `dev`, chờ Railway Cloud deploy hoàn tất (HTTP 200).
  - Chạy lại E2E suite trực tiếp trên Domain Dev (`frontend-tms-core-dev.up.railway.app`).
  - Chụp ảnh bằng chứng nghiệm thu (`screenshot_39_multi_truck_verified.png`).

### 👤 Giai đoạn 5: DEPLOY (Triển khai)
- [ ] Tạo GitHub PR vào nhánh `dev` với audit checklist.
- [ ] Auto-merge PR vào `dev` và đồng bộ git submodule pointer.
- [ ] Kiểm tra trạng thái triển khai Railway Cloud Dev.

### 👤 Giai đoạn 6: MAINTAIN (Vận hành & Bàn giao)
- [ ] Ghi nhận `RESOLUTION.md` và cập nhật `docs/SYSTEM_TIMELINE.md`.
- [ ] Đồng bộ `CODEBASE_AUDIT.md`.
- [ ] Báo cáo kết quả nghiệm thu hoàn tất.

---

## 🎯 Ma Trận 10 Ca Kiểm Thử Biên (Edge Cases Matrix)

| STT | Tình huống kiểm thử biên | Kết quả mong đợi |
| :---: | :--- | :--- |
| **01** | Nhập đơn mới hoàn toàn (chưa từng có trong hệ thống) | Tất cả các ô đều mở cho nhập, lưu tạo đơn mới thành công. |
| **02** | Nhập đơn phân chuyến đợt 2 (đơn đã có trạng thái `INBOUND`) | Khóa tên hàng và nơi giao khách, MỞ KHÓA ô Số kiện, kg, m³ cho phép gõ số mới (ví dụ: 45). |
| **03** | Thủ kho gõ số kiện = 0 hoặc để trống khi nhập đợt 2 | Hệ thống báo lỗi hoặc tự động hồi về tối thiểu 1 kiện. |
| **04** | Nhập đợt 2 với số kiện lớn làm tăng tổng số lượng của đơn hàng | Bảng `order` tự động cập nhật `totalQuantity = sum(chuyến 1 + chuyến 2) = 72`. |
| **05** | Mở Modal chi tiết chuyến xe Xe 1 (`SD365`) đã xử lý | Cột Số kiện hiển thị chính xác **27**, chân trang tổng kiện tính đúng 27. |
| **06** | Mở Modal chi tiết chuyến xe Xe 2 (`SD328`) đã xử lý | Cột Số kiện hiển thị chính xác **45**, chân trang tổng kiện tính đúng 45. |
| **07** | Tài khoản Thủ kho mở chuyến xe Đã xử lý | Toàn bộ bảng ở chế độ Read-Only, không có nút sửa trừ khi được Admin mở lại. |
| **08** | Tài khoản Super Admin mở chuyến xe Đã xử lý | Hiển thị badge "Chế độ Quản trị viên", cho phép sửa số kiện, khối lượng, thông tin xe. |
| **09** | Super Admin sửa trực tiếp số lượng dòng hàng trong chuyến xe và lưu | Hệ thống lưu thành công, cập nhật lại sổ cái và tồn kho tương ứng. |
| **10** | Đồng thời xuất hiện đơn 1 xe và đơn nhiều xe trên cùng 1 chuyến xe | Tính toán độc lập, không bị ghi đè chéo thông số giữa các đơn hàng. |
