# 📋 TODO: Khắc Phục Lỗi Giao Diện Bộ Lọc Nhập Kho Bị Chồng Chéo & Co Nghẽn Trên Màn Hình Tablet (Task #109)

> **Mã công việc**: `TASK-109-INBOUND-TABLET-FILTER-OVERLAP`  
> **Phân hệ**: `Kho bãi (Warehouse) - Nhập kho (Inbound) / Thanh công cụ lọc & Tab trạng thái`  
> **Chỉ đạo kiến trúc**: `/leader` & `/todo-agent` (Vai trò PM)  
> **Kiểm thử**: `/e2e-test-runner` & `/e2e-code-auditor` (Chế độ 2 Tầng Test)  
> **Nhánh Git dự kiến**: `fix/task-109-inbound-tablet-filter-overlap` (Base từ `dev`)  

---

## 📌 Bối Cảnh & Vấn Đề Vận Hành Thực Tế

1. **Phản hồi từ người dùng (User Feedback Quote)**:
   > *"link /dashboard/warehouse/inbound ở màn hình gần như là tablet, chỗ khoanh đỏ đang có UI chồng chéo lên nhau"*
   > *(Đính kèm ảnh chụp thực tế trên production: `frontend-tms-core-production.up.railway.app/dashboard/warehouse/inbound`)*

2. **Đối tượng tác nghiệp & Nỗi đau kho bãi (Warehouse Pain Point)**:
   - **Đối tượng**: Thủ kho (`Thủ kho Andromeda Hub - HCM`, `Điều phối viên`, `Quản lý vận hành`).
   - **Thực tế tác nghiệp**: Tại các bàn cân, cầu nâng tiếp nhận xe tải, thủ kho thường dùng máy tính bảng (iPad, tablet Android độ phân giải màn hình 768px – 1024px) hoặc chia đôi cửa sổ trình duyệt trên laptop để vừa đối soát vừa nhập liệu.
   - **Hiện tượng lỗi**:
     - Thanh công cụ lọc (`Search Box` + `Date Range Filter` + `Status Tabs` + `Nút Làm mới`) bị ép cùng hiển thị trên một hàng ngang (`md:flex-row`).
     - Khi thanh Sidebar bên trái mở (chiếm ~240px), vùng nội dung chính chỉ còn khoảng 550px – 760px.
     - Ô tìm kiếm (`Search Box`) mang class `flex-1 min-w-0` bị nén nghẽn (shrink) hoàn toàn về chiều rộng **0px**, biến mất khỏi tầm mắt của thủ kho.
     - Cụm chọn ngày (`Từ: 01/10/2026 đến: 27/10/2026`) cùng nút **"Áp dụng"** bị tràn sang phải và **đè chồng chéo trực tiếp lên Tab "Tất cả (277)"**.
     - Thủ kho không thể tìm kiếm mã vận đơn / mã chuyến xe, đồng thời việc bấm nút "Áp dụng" hoặc chuyển tab bị nhấp nhầm hoặc không thao tác được.

3. **Multimodal OCR & Khớp Ngữ Cảnh Hub Thao Tác**:
   - **Hub tiếp nhận**: `Andromeda Hub – HCM` (đọc từ tiêu đề `Nhập kho · Andromeda Hub – HCM`).
   - **Tài khoản kiểm thử bắt buộc**: `USER_WAREHOUSE_HCM` (username `warehouse_hcm`) theo đúng *Multimodal Visual Context & Hub-Scoped Account Selection Mandate*.
   - **Dữ liệu thực tế quan sát trên màn hình**:
     - Chuyến xe mẫu: `SD587`
     - Biển số & tài xế: `68AC50957` - `Đạt`
     - Mã vận đơn: `LBD2610-0178TC`
     - Số lượng: `1 kiện`, `15 kg • 0,03 m³`
     - Trạng thái dòng: `Chờ xử lý`
     - Số lượng tab thống kê: `Tất cả (277)`, `Chờ xử lý (11)`, `Đã xử lý (266)`.
   - **Ảnh bằng chứng gốc**: `feedbacks/feedback_27_10_task_109_inbound_tablet_filter_overlap/screenshot_01.png`.

---

## 🔍 Phân Tích Nguyên Nhân Kỹ Thuật (Root Cause Analysis - RCA)

1. **Phân tích cấu trúc Flexbox hiện tại (`frontend/src/app/dashboard/warehouse/inbound/page.tsx`)**:
   ```tsx
   // Dòng 1008: Khung chứa tổng thể Toolbar
   <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
     {/* Khối Trái: Search Box & Date Range Filter */}
     <div className='flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0'>
       {/* 1. Ô tìm kiếm */}
       <div className='relative flex-1 min-w-0'>
         ...
       </div>
       {/* 2. Cụm chọn ngày */}
       <div className='flex flex-col sm:flex-row sm:items-center gap-1.5 ... w-full sm:w-auto'>
         ...
         <Button ...>Áp dụng</Button>
       </div>
     </div>

     {/* Khối Phải: Status Tabs & Nút Làm mới */}
     <div className='flex items-center justify-between gap-1.5 w-full md:w-auto'>
       <div className='flex items-center gap-1 bg-slate-100 ... flex-1 md:flex-initial'>
         ... (Tất cả, Chờ xử lý, Đã xử lý)
       </div>
       <Button ...>Làm mới</Button>
     </div>
   </div>
   ```

2. **Cơ chế gây lỗi (Failure Mechanics)**:
   - Breakpoint `md:` của Tailwind CSS kích hoạt từ chiều rộng màn hình **768px**.
   - Tại độ phân giải 768px – 1024px (tablet ngang/dọc, hoặc laptop mở sidebar):
     - Tổng chiều rộng cần thiết để hiển thị toàn bộ thành phần trên 1 dòng:
       - Ô Search: tối thiểu `180px`
       - Date Range: tối thiểu `340px` (2 ô input date 100px + 2 label + nút Áp dụng 65px)
       - 3 Tabs trạng thái: tối thiểu `290px`
       - Nút Làm mới: tối thiểu `80px`
       - Tổng cộng: **$180 + 340 + 290 + 80 = 890\text{px}$** (chưa tính gap và padding).
     - Trong khi đó, viewport tablet 768px (hoặc 1024px trừ sidebar 240px) chỉ cung cấp **~528px đến 784px**.
     - Khối Trái có `flex-1 min-w-0` buộc phải co lại. Do Date Range có kích thước nội tại cứng (~340px), Flexbox đẩy ô Search (`flex-1 min-w-0`) về **0px**.
     - Khi chiều rộng vẫn không đủ, khối Trái bị đẩy tràn sang phải và đè lấn trực tiếp (overlap) lên nút tab "Tất cả" của Khối Phải.

3. **Phạm vi ảnh hưởng**:
   - Màn hình Nhập kho: `frontend/src/app/dashboard/warehouse/inbound/page.tsx`
   - Màn hình Xuất kho (rà soát phòng ngừa tương tự): `frontend/src/app/dashboard/warehouse/outbound/page.tsx`
   - Tiêu đề trang Nhập kho còn tồn tại ký tự dư thừa `+` trong `+ Tạo đơn nhập mới` (vi phạm *Zero Redundant Icons Rule*).

---

## 🏗️ Kế Hoạch 6 Giai Đoạn SDLC

### 👤 Giai đoạn 1: PLAN (Lên kế hoạch — Vai trò PM)
- [x] Thu thập phản hồi, trích xuất ảnh lỗi từ người dùng, lưu vào `feedbacks/feedback_27_10_task_109_inbound_tablet_filter_overlap/screenshot_01.png`.
- [x] Thực hiện OCR giải mã ngữ cảnh Hub (`Andromeda Hub - HCM`), chỉ định tài khoản kiểm thử `USER_WAREHOUSE_HCM`.
- [x] Lập tài liệu `TODO.md` chi tiết với RCA, danh mục đầu việc nguyên tử, ma trận 10 ca kiểm thử biên và kịch bản E2E.

### 👤 Giai đoạn 2: DESIGN (Thiết kế kiến trúc — Vai trò Architect)
- [ ] Thiết kế bố cục Toolbar đáp ứng đa tầng (Responsive Multi-tier Layout):
  - **Màn hình lớn ($\ge 1280\text{px}$ - xl)**: Trải dài 1 hàng ngang cân đối (`xl:flex-row xl:items-center xl:justify-between`).
  - **Màn hình Tablet & Laptop hẹp ($768\text{px} - 1279\text{px}$)**:
    - Cho phép bẻ hàng linh hoạt (`flex-wrap gap-2`).
    - Hoặc phân tầng rõ ràng: Hàng 1 (Tìm kiếm + Khoảng ngày), Hàng 2 (Tabs trạng thái + Nút Làm mới) khi không gian hẹp, đảm bảo ô Search luôn có chiều rộng tối thiểu (`min-w-[200px]`, không bao giờ bị nén về 0).
  - **Màn hình Mobile ($< 768\text{px}$)**: Xếp dọc tự nhiên, các phần tử full-width dễ bấm ngón tay.
- [ ] Đảm bảo tiêu chuẩn *UI Compact Density Mandate* ([`.agents/rules/ui-compact-density.md`](file:///d:/Projects/logistics-website/.agents/rules/ui-compact-density.md)):
  - Card padding: `p-1`, gap `gap-1.5` đến `gap-2`.
  - Triệt tiêu hoàn toàn class thừa `p-4`, `space-y-4`.
- [ ] Rà soát loại bỏ ký tự biểu tượng trùng lặp: `<IconPlus /> Tạo đơn nhập mới` (bỏ dấu `+` trong text label).

### 👤 Giai đoạn 3: BUILD (Xây dựng mã nguồn — Vai trò Engineer)
- [ ] Kiểm tra trạng thái và nhánh Git qua `npm run repo:status` và `npm run repo:tracking`.
- [ ] Checkout nhánh `fix/task-109-inbound-tablet-filter-overlap` trên submodule `frontend/` từ nhánh `dev`.
- [ ] Cập nhật `frontend/src/app/dashboard/warehouse/inbound/page.tsx`:
  - Tái cấu trúc Toolbar với bố cục `flex-wrap` hoặc `xl:flex-row`, bảo vệ ô Search với `min-w-[180px] sm:min-w-[220px]`.
  - Cố định khoảng cách an toàn giữa Date Range và Tabs trạng thái, loại bỏ hoàn toàn hiện tượng chồng chéo tọa độ.
  - Xóa dấu `+` thừa trong nhãn nút tạo đơn nhập.
- [ ] Rà soát và áp dụng bản sửa lỗi tương thích cho `frontend/src/app/dashboard/warehouse/outbound/page.tsx`.
- [ ] Kiểm tra biên dịch TypeScript: `npx --prefix frontend tsc --noEmit` và `npm run build --prefix frontend`.

### 👤 Giai đoạn 4: TEST (Kiểm thử 2 Tầng — Vai trò QA)
- [ ] Viết kịch bản Playwright E2E: `frontend/e2e/102-inbound-tablet-filter-responsive.spec.ts`.
- [ ] **Tầng 1 (Test Localhost)**:
  - Khởi động local servers qua `npm run dev:ensure`.
  - Kiểm thử tại viewport tablet (`width: 820px, height: 1180px` - iPad Air / tablet chuẩn) và `width: 900px, height: 800px`:
    - Assert ô tìm kiếm có chiều rộng $> 150\text{px}$ và hiển thị rõ ràng.
    - Assert nút "Áp dụng" và Tab "Tất cả" không có tọa độ đè chồng (Bounding Box collision check: `right(Áp dụng) <= left(Tất cả)` hoặc nằm ở 2 dòng khác nhau).
    - Assert bảng có dữ liệu thực tế ít nhất 1 dòng (`expect(count).toBeGreaterThan(0)`).
  - Chạy `node scripts/e2e-auditor.mjs frontend/e2e/102-inbound-tablet-filter-responsive.spec.ts` đạt $\ge 40/50$ điểm.
- [ ] **Tầng 2 (Test Môi trường Development)**:
  - Chạy lại toàn bộ test E2E trên Domain Dev (`https://frontend-tms-core-dev.up.railway.app`).
  - Chụp ảnh bằng chứng nghiệm thu thực tế `screenshot_01_verified.png` tại viewport tablet.

### 👤 Giai đoạn 5: DEPLOY (Triển khai — Vai trò Release)
- [ ] Commit code chuẩn conventional commit: `fix(warehouse): responsive tablet filter toolbar and eliminate overlap (#109)`.
- [ ] Push nhánh `fix/task-109-inbound-tablet-filter-overlap` lên repository `logistics-website-frontend`.
- [ ] Tạo GitHub PR vào nhánh `dev` với checklist nghiệm thu và auto-merge.
- [ ] Kiểm tra Railway Cloud Dev deployment hoàn tất (`HTTP 200 OK`).

### 👤 Giai đoạn 6: MAINTAIN (Vận hành & Bàn giao — Vai trò Vận hành)
- [ ] Xác nhận hệ thống chạy ổn định trên Railway Cloud Dev.
- [ ] Đánh dấu hoàn tất `TODO.md` (`[x]`).
- [ ] Chạy `npm run todo:record feedback_27_10_task_109_inbound_tablet_filter_overlap` để tạo `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md`.
- [ ] Gửi báo cáo bàn giao qua Telegram với ảnh chụp nghiệm thu verified.

---

## 🎯 Ma Trận 10 Ca Kiểm Thử Biên (Edge Cases Matrix)

| STT | Mã ca | Tình huống kiểm thử biên | Kết quả mong đợi |
| :---: | :---: | :--- | :--- |
| **01** | `EC-01` | Màn hình tablet 768px (iPad dọc) mở thanh điều hướng Sidebar | Toolbar tự động bẻ hàng gọn gàng, ô Search giữ chiều rộng tối thiểu, nút Áp dụng và Tab không chồng lên nhau. |
| **02** | `EC-02` | Màn hình tablet 820px (iPad Air) đóng thanh điều hướng Sidebar | Các phần tử dàn trải đều, không có thanh cuộn ngang ngoài ý muốn trên toàn trang. |
| **03** | `EC-03` | Màn hình desktop thu nhỏ cửa sổ (split screen 900px) | Ô tìm kiếm hiển thị trọn vẹn placeholder, người dùng gõ từ khóa và ấn `Enter` tìm kiếm bình thường. |
| **04** | `EC-04` | Số lượng đếm trên tab tăng cao (ví dụ: `Tất cả (12,850)`) làm tăng chiều rộng tab | Tab tự động dãn cách hợp lý, không đẩy tràn phá vỡ layout của nút Làm mới bên cạnh. |
| **05** | `EC-05` | Người dùng chọn khoảng ngày dài và bấm "Áp dụng" | Nút Áp dụng có thể click chính xác (không bị tab che khuất), gọi API và cập nhật danh sách bảng thành công. |
| **06** | `EC-06` | Trạng thái nút "Đặt lại" ngày xuất hiện khi chọn ngày khác mặc định | Nút "Đặt lại" hiển thị cạnh nút Áp dụng mà không gây tràn khung ngày hay đè lấn tab. |
| **07** | `EC-07` | Chuyển đổi giữa 3 tab: Tất cả / Chờ xử lý / Đã xử lý trên tablet | Tab active có hiệu ứng nổi bật (font đậm, nền trắng, shadow), nội dung bảng lọc tương ứng ngay lập tức. |
| **08** | `EC-08` | Người dùng thao tác trên thiết bị cảm ứng (Touch / Tap target) | Chiều cao các nút đạt chuẩn $h-7$ đến $h-8$, vùng bấm tách biệt, không bị bấm nhầm giữa nút Áp dụng và Tab. |
| **09** | `EC-09` | Chế độ giao diện tối (Dark mode) trên tablet | Nền slate-800/900 hiển thị sắc nét, viền rõ ràng, không bị lệch màu hay mất độ tương phản. |
| **10** | `EC-10` | Chuyển sang màn hình Xuất kho (`/dashboard/warehouse/outbound`) trên tablet | Bộ lọc xuất kho cũng hiển thị thông thoáng, đồng bộ ngôn ngữ thiết kế, không bị lỗi chồng chéo tương tự. |

---

## 🧪 Kịch Bản Kiểm Thử Playwright E2E Dự Kiến

- **Tệp spec**: `frontend/e2e/102-inbound-tablet-filter-responsive.spec.ts`
- **Tài khoản**: `USER_WAREHOUSE_HCM` (`warehouse_hcm` / `Warehouse@123`)
- **Viewport**: `{ width: 820, height: 1180 }` (Tablet mode)
- **Các bước xác thực**:
  1. Đăng nhập hệ thống bằng tài khoản thủ kho HCM.
  2. Điều hướng tới `/dashboard/warehouse/inbound`.
  3. Chờ bảng dữ liệu tải xong (`tbody tr` xuất hiện, assert số lượng dòng $> 0$).
  4. Lấy bounding box của nút `Button:has-text("Áp dụng")` và tab `button:has-text("Tất cả")`.
  5. Khẳng định toán học: `boxApDung.x + boxApDung.width <= boxTatCa.x` HOẶC `boxApDung.y + boxApDung.height <= boxTatCa.y` (không giao thoa diện tích).
  6. Lấy bounding box của `Input[placeholder*="Tìm mã"]`, khẳng định `boxSearch.width >= 150`.
  7. Chụp ảnh màn hình bằng chứng nghiệm thu: `feedbacks/feedback_27_10_task_109_inbound_tablet_filter_overlap/screenshot_01_verified.png`.
