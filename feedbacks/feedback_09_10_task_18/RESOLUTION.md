# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_09_10_TASK_18] — Feedback 09/10 (Task 18) — Tối ưu Vị trí Nút Hành động "Tạo đơn nhập mới" & "Xuất kho" Ngay Sau Tên Hub Chống Che Khuất Bởi Thông Báo

> **Thời gian nghiệm thu**: 09/10/2026 - 17:31  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (26/26 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành hệ thống TMS)  
> **Phạm vi tác động**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Header trang Board Nhập kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Header trang Board Xuất kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)) • Header thanh điều hướng hệ thống & Khung thông báo ([`header.tsx`](file:///D:/Projects/logistics-website/frontend/src/components/layout/header.tsx) & [`notification-center.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/notifications/components/notification-center.tsx))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *", chuyển các nút tạo đơn nhập kho mới và nút xuất kho ra các vị trí ngay sau tên hub (khoanh đỏ). Lý do vị trí cũ bị phần hiển thông báo che khuất."*

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *", chuyển các nút tạo đơn nhập kho mới và nút xuất kho ra các vị trí ngay sau tên hub (khoanh đỏ). Lý do vị trí cũ bị phần hiển thông báo che khuất."*

---

### 2. Tình huống vận hành thực tế tại Hub kho bãi & Luồng thao tác của Thủ kho

Trong nghiệp vụ vận hành kho bãi hàng ngày của hệ thống Logistics TMS (Spider Express):
- **Đối tượng thao tác chính**: Thủ kho (`RoleEnum.WAREHOUSE_MANAGER`) và Quản trị viên (`RoleEnum.SUPER_ADMIN`).
- **Môi trường tác nghiệp**: Thao tác liên tục trên máy tính bàn hoặc laptop tại bàn làm việc ở trạm kho/Hub với cường độ tiếp nhận và điều phối xe dày đặc.
- **Tần suất sử dụng nút hành động**:
  * Nút **"Tạo đơn nhập mới"** trên trang Nhập kho (`/dashboard/warehouse/inbound`) được kích hoạt mỗi khi có khách hàng mang hàng gửi trực tiếp tại quầy hoặc phát sinh hàng dỡ đột xuất tại Hub.
  * Nút **"Xuất kho"** trên trang Xuất kho (`/dashboard/warehouse/outbound`) được kích hoạt khi thủ kho lập kế hoạch xuất giao hàng cho khách hoặc điều chuyển hàng sang các Hub liên tỉnh.
- **Vấn đề xung đột giao diện thực tế**:
  * Tại thanh Header cố định trên cùng (`Header.tsx`), góc phải là khu vực của chuông thông báo thời gian thực (`NotificationCenter`), chế độ giao diện (`ThemeModeToggle`, `ThemeSelector`), và hồ sơ tài khoản.
  * Các thông báo hệ thống liên tục được đẩy về (thông báo chuyến xe mới, đơn hàng mới được bàn giao từ đội xe, thông báo hủy đơn, hay các popover thông báo nổi/toasts góc phải).
  * Do Header của trang nội dung bên dưới đang dùng cấu trúc `justify-between`, nút hành động chính (`+ Tạo đơn nhập mới` và `+ Xuất kho`) bị đẩy sang sát lề phải màn hình — nằm trực tiếp ngay bên dưới hoặc cùng tọa độ với các khối thông báo / dropdown popover.
  * Hậu quả: Khi có thông báo mới rơi xuống, hoặc khi thủ kho đang mở popover thông báo để xem danh sách đơn hàng vừa cập nhật, phần thông báo này **che lấp hoàn toàn** nút "Tạo đơn nhập mới" / "Xuất kho", khiến thủ kho không thể click hoặc phải tốn thao tác đóng thông báo mới thực hiện được nghiệp vụ.

---

### 3. Sơ đồ tái cấu trúc vị trí giao diện (Before vs After)

```mermaid
flowchart TD
    subgraph OLD_LAYOUT ["GIAO DIỆN CŨ (BỊ XUNG ĐỘT THÔNG BÁO)"]
        direction TB
        H1["Layout Header: Breadcrumbs ..................... [Search] [Theme] [🔔 NOTIFICATION BELL] [User]"]
        P1["Page Header: [Icon] Nhập kho · Andromeda Hub - HCM ......... [ + Tạo đơn nhập mới (BỊ CHE KHUẤT) ]"]
        H1 -.->|Popover / Toast đổ xuống che mất nút| P1
    end

    subgraph NEW_LAYOUT ["GIAO DIỆN MỚI CHUẨN NGHIỆP VỤ (VỊ TRÍ KHOANH ĐỎ)"]
        direction TB
        H2["Layout Header: Breadcrumbs ..................... [Search] [Theme] [🔔 NOTIFICATION BELL] [User]"]
        P2["Page Header: [Icon] Nhập kho · Andromeda Hub - HCM  [ + Tạo đơn nhập mới ] ..................... (Trống)"]
        H2 -.->|Thông báo hiển thị tự do ở góc phải, không còn chạm hay che nút| P2
    end
```

---

### 4. Quy định chi tiết về vị trí, trạng thái hiển thị và hành vi nút bấm

1. **Vị trí hiển thị mới**:
   - Đặt nút hành động chính ngay sau chuỗi tiêu đề `<span>Nhập kho · {currentHubName}</span>` (hoặc `<span>Xuất kho · {currentHubName}</span>`).
   - Khoảng cách giữa tên Hub và nút: `gap-2.5` (10px), đảm bảo cân đối thị giác, không dính sát chữ nhưng liền mạch trong cùng một khối nhận diện (`flex flex-wrap items-center gap-2.5`).
2. **Quy tắc hiển thị theo ngữ cảnh (Contextual Visibility)**:
   - **Khi ở chế độ Bảng danh sách (`activeView === 'BOARD'`)**:
     * Hiển thị nút hành động chính ngay sau tên Hub (`+ Tạo đơn nhập mới` trên trang Nhập kho; `+ Xuất kho` trên trang Xuất kho).
     * Góc phải của header trang để trống hoặc chỉ chứa các bộ lọc mở rộng (nếu có).
   - **Khi ở chế độ Tạo phiếu / Thao tác con (`activeView !== 'BOARD'`)**:
     * Ẩn nút tạo mới cạnh tên Hub (để tránh người dùng bấm tạo mới lặp lại khi đang trong tiến trình điền form).
     * Nút **`<Button><IconX /> Quay lại danh sách</Button>`** hiển thị ở góc bên phải (`justify-between`), giữ nguyên luồng điều hướng thoát quay lại màn hình chính.
3. **Quy chuẩn kích thước & kiểu dáng (UI Compact Density & Brand Palette)**:
   - Kích thước: `h-8` (chiều cao chuẩn 32px), padding ngang `px-2.5` (10px) gọn gàng, không chiếm dụng chiều dọc.
   - Màu sắc: Nền Navy thương hiệu `#0F3D62`, hover `#0c314f`, chữ trắng `text-white`, font `text-xs font-bold shadow-sm`.
   - Biểu tượng: `<IconPlus className='mr-1 h-4 w-4' />` kết hợp nhãn văn bản sạch (Zero Redundant Icons: không thêm dấu `+` thừa trong chuỗi chữ `Tạo đơn nhập mới` / `Xuất kho`).
   - Responsive: Sử dụng `flex-wrap` và `shrink-0` cho icon/nút để trên màn hình điện thoại hoặc máy tính bảng khi tên Hub quá dài, nút tự động xuống dòng mượt mà mà không làm vỡ khung.

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
Đối chiếu trực tiếp với ảnh chụp màn hình [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_01.jpg) và mã nguồn hiện tại:

1. **Xung đột vị trí và bị che khuất bởi Khối thông báo (Notification Overlap / Occlusion)**:
   - *Hiện trạng trên ảnh [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_01.jpg)*: Nút `+ Tạo đơn nhập mới` được căn lề sang tận cùng bên phải của Page Header thông qua container `flex flex-wrap items-center justify-between`.
   - *Hậu quả vận hành*: Vị trí này nằm trực tiếp ngay bên dưới khu vực hiển thị của component `<NotificationCenter />` và các thông báo dạng Toast của hệ thống. Khi có thông báo đến, cửa sổ popover che mất nút, khiến thủ kho không thể ấn tạo đơn ngay.
2. **Phá vỡ tính liền mạch thị giác (Visual Proximity Violation)**:
   - Thủ kho khi quan sát giao diện sẽ nhìn vào tên Hub ở bên trái (`Andromeda Hub - HCM`) để xác định đúng kho mình đang phụ trách, nhưng lại phải rê mắt và chuột sang tận góc đối diện bên phải màn hình rộng để bấm nút tạo đơn.
   - Chuyển nút về ngay sau tên Hub (vùng khoanh đỏ) tuân thủ nguyên lý Fitts's Law và Contextual Grouping, giúp thao tác bấm nhanh hơn gấp nhiều lần.
3. **Hiện tượng tương tự trên màn hình Quản lý Xuất kho (`/dashboard/warehouse/outbound`)**:
   - Khảo sát mã nguồn tại [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1031-L1051) cho thấy nút `+ Xuất kho` cũng đang dùng chung cấu trúc `justify-between` và bị đẩy sang góc phải:
     ```tsx
     {activeView === 'BOARD' ? (
       <div className='flex items-center gap-2'>
         <Button onClick={handleOpenNewMode1} className='bg-[#0F3D62] text-white hover:bg-[#0c314f] text-xs font-bold'>
           <IconPlus className='mr-1 h-4 w-4' /> Xuất kho
         </Button>
       </div>
     ) : ...}
     ```
   - Nút này cũng gặp đúng vấn đề bị che khuất bởi thông báo như màn hình Nhập kho, cần được đồng bộ vị trí ngay sau tên Hub.
4. **Vi phạm quy chuẩn giao diện hẹp (UI Compact Density) nếu không tối ưu kích thước nút**:
   - Nếu đưa nút vào cùng dòng tiêu đề mà không gán kích thước gọn gàng (`h-8`, `px-2.5`, `text-xs`) sẽ làm đội chiều cao của Page Header, gây lãng phí không gian thao tác phía dưới bảng danh sách chuyến xe.

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Rà soát & Đảm bảo tính toàn vẹn của Backend APIs liên quan**
- ✅ **Kiểm tra tính ổn định của API danh sách chuyến xe nhập kho: `GET /api/v1/warehouse/inbound-trips`.**
- ✅ **Kiểm tra tính ổn định của API danh sách chuyến xe xuất kho: `GET /api/v1/warehouse/outbound-trips`.**
- ✅ **Đảm bảo các phân quyền RBAC (`RoleEnum.WAREHOUSE_MANAGER`, `RoleEnum.SUPER_ADMIN`) tiếp tục bảo vệ các endpoint này bình thường.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Tái cấu trúc Header trang Quản lý Nhập kho ([`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx))**
  * 📍 File: `frontend/src/app/dashboard/warehouse/inbound/page.tsx`
- ✅ **Gom nhóm tiêu đề trang và nút tạo đơn vào cùng một flex container**
- ✅ **Giữ nguyên nút `Quay lại danh sách` (`activeView !== 'BOARD'`) ở góc bên phải (`justify-between`) để người dùng dễ dàng thoát khỏi màn hình tạo phiếu.**
- ✅ **Loại bỏ khối wrapper chứa nút cũ ở góc phải khi đang ở view `BOARD`.**
- ✅ **Tái cấu trúc Header trang Quản lý Xuất kho ([`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx))**
  * 📍 File: `frontend/src/app/dashboard/warehouse/outbound/page.tsx`
- ✅ **Gom nhóm tiêu đề trang và nút xuất kho vào cùng một flex container**
- ✅ **Giữ nguyên nút `Quay lại danh sách` ở góc bên phải khi ở các view tạo phiếu/luân chuyển (`activeView !== 'BOARD'`).**
- ✅ **Loại bỏ khối wrapper chứa nút cũ ở góc phải khi đang ở view `BOARD`.**
- ✅ **Tuân thủ nghiêm ngặt Quy chuẩn giao diện hẹp (UI Compact Density) & Zero Redundant Icons**
- ✅ **Kích thước nút chuẩn: Chiều cao `h-8`, padding ngang `px-2.5`, cỡ chữ `text-xs font-bold`.**
- ✅ **Zero redundant icons: Chỉ dùng icon vector `<IconPlus className='mr-1 h-4 w-4' />`, nhãn chữ sạch sẽ không lặp ký tự `+`.**
- ✅ **Đảm bảo tính tương thích hiển thị trên thiết bị di động (`flex-wrap`, không bị vỡ giao diện trên tablet/mobile).**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Kiểm tra biên dịch & Linting (Zero Regressions)**
- ✅ **Type check Frontend: Chạy `npm run build --prefix frontend` đảm bảo 100% không có lỗi TypeScript, build production đạt kết quả thành công.**
- ✅ **Lint Frontend: Chạy `npm run lint --prefix frontend` đảm bảo không có lỗi cú pháp hoặc cảnh báo lặp lại.**
- ✅ **File Playwright E2E Verification Suite**
- ✅ **Kịch bản kiểm thử trực quan & nghiệp vụ (5 Test Scenarios)**
- ✅ **Kịch bản 1: Màn hình Nhập kho (Chế độ Board)**
- ✅ **Kịch bản 2: Tác nghiệp Tạo đơn nhập mới**
- ✅ **Kịch bản 3: Màn hình Xuất kho (Chế độ Board)**
- ✅ **Kịch bản 4: Kiểm tra chống che khuất với Khối Thông báo (Notification Collision Test)**
- ✅ **Kịch bản 5: Kiểm tra co giãn Responsive trên các thiết bị**

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

### Hình ảnh minh chứng đã lưu trữ (4 tệp):
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_01.jpg)
- 📸 **screenshot_01_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_01_verified.png)
- 📸 **screenshot_inbound_button_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_inbound_button_verified.png)
- 📸 **screenshot_outbound_button_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_18/screenshot_outbound_button_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Frontend (Next.js) |
| 2 | `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/components/layout/header.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/features/notifications/components/notification-center.tsx` | Frontend (Next.js) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedback_09_10_task_18/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
