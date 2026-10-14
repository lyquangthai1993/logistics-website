# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_14_10_TASK_70] — Feedback 14/10 (Task #70) — Loại Bỏ Nút Mũi Tên Mở Rộng Dòng (Accordion Chevron `>`) và Tinh Gọn Bảng Kê Chuyến Xe Xuất Kho / Nhập Kho Chuẩn Hóa Chế Độ Xem Chi Tiết Qua Modal

> **Thời gian nghiệm thu**: 14/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (16/16 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS)  
> **Phạm vi tác động**: Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Bảng danh sách chuyến xe xuất kho ([`page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)), loại bỏ nút bấm mũi tên `>` mở rộng dòng ở cột `CHUYẾN XE / TRIP`, loại bỏ khối sub-row accordion lồng bảng và loại bỏ nút "Mở rộng tất cả / Thu gọn tất cả" trên thanh công cụ. • Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Bảng danh sách chuyến xe nhập kho ([`page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)), đồng bộ giao diện (UI/UX Parity) loại bỏ nút bấm mũi tên `>` ở cột `CHUYẾN XE / TRIP`, loại bỏ khối sub-row accordion và nút "Thu gọn / Mở rộng tất cả" trên thanh công cụ. • Modal Chi tiết Chuyến xe ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Đảm bảo duy trì và bảo toàn 100% chức năng xem chi tiết đơn hàng và in tem nhận diện khi click vào mã chuyến xe `grp.tripCode` ở chế độ Read-only an toàn. • Backend API (`backend/src/orders/warehouse.controller.ts`, `warehouse.service.ts`) ➔ Đảm bảo hợp đồng dữ liệu cho các endpoint danh sách chuyến xe và chi tiết manifest hoạt động chuẩn xác, không ảnh hưởng tới dữ liệu đơn hàng.  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"loại bỏ các phần  khoanh đỏ này"*  
*(Đính kèm ảnh chụp màn hình [`screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_70/screenshot_01.jpg) khoanh đỏ nút mũi tên `>` mở rộng dòng tại cột CHUYẾN XE / TRIP trên Màn hình Xuất kho)*

---

### 2. Bản chất nghiệp vụ & Lý do tinh gọn giao diện bảng kê chuyến xe

Trong quy trình vận hành kho vận TMS (Spider Express), các bảng điều độ chuyến xe tại **Quản lý Xuất kho** (`/dashboard/warehouse/outbound`) và **Quản lý Nhập kho** (`/dashboard/warehouse/inbound`) đóng vai trò là bảng tổng quan cấp cao (High-Level Dispatch Overview Board). Mỗi dòng trong bảng đại diện cho một thực thể chuyến xe vận chuyển (`TripGroup`), gồm các thông tin nòng cốt: Mã chuyến xe, Biển số xe & Tài xế, Tổng số kiện & Khối lượng/Thể tích, Trạng thái xử lý và Thao tác tác nghiệp (`Tiếp tục`, `Hủy nháp`, `In phiếu xuất/nhập`).

Trước đây, hệ thống tồn tại **hai cơ chế song song và chồng chéo** để người dùng xem danh sách các đơn hàng con bên trong một chuyến xe:

1. **Cơ chế cũ (Accordion inline sub-row)**:
   - Trước mỗi mã chuyến xe có một nút icon mũi tên `>` (`IconChevronRight` / `IconChevronDown`).
   - Khi người dùng bấm vào nút `>` này, bảng dữ liệu tự động chèn thêm một dòng `<tr><td colSpan={5}>` chứa một bảng con lồng ghép (nested mini-table) liệt kê các đơn hàng bên trong chuyến xe.
   - Trên thanh công cụ (Toolbar) có thêm nút `Mở rộng tất cả (N xe)` / `Thu gọn tất cả`.

2. **Cơ chế chuẩn hóa mới (Dedicated Trip Inspection Modal - Hoàn tất ở Task #46)**:
   - Người dùng click chuột trực tiếp vào **Mã chuyến xe (`grp.tripCode`, ví dụ `SD43 3 đơn`)**.
   - Hệ thống mở modal chuyên biệt [`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) ở chế độ **Xem thuần túy (Read-only)**.
   - Modal này cung cấp đầy đủ thông tin: Danh sách đơn hàng chi tiết, thông tin xe & tài xế cố định, nút in tem nhận diện hàng hóa A4 (`PalletLabelA4Modal`) cho từng đơn hoặc toàn bộ chuyến xe, đồng thời khóa cứng các nút tác nghiệp để tránh thao tác nhầm lẫn.

#### ⚠️ Hệ quả bất cập của cơ chế mở rộng dòng cũ (Lý do người dùng yêu cầu loại bỏ):
- **Gây nhiễu thị giác và chật chội cột `CHUYẾN XE / TRIP`**: Nút icon mũi tên `>` đứng chen chúc ngay trước mã chuyến xe làm giảm diện tích click, thủ kho bấm chuột thường xuyên bị bấm nhầm giữa nút mở rộng và mã chuyến xe.
- **Vỡ bố cục bảng và vi phạm Quy chuẩn Giao diện Hẹp (UI Compact Density Mandate)**: Khi một hoặc nhiều xe được mở rộng, bảng con lồng bên trong đẩy chiều cao dòng tăng vọt từ ~26px lên 300px - 500px, xáo trộn cấu trúc cột dọc, làm biến mất tính compact và khiến thủ kho phải cuộn trang liên tục để tìm các chuyến xe khác.
- **Dư thừa chức năng (Redundant UX Pattern)**: Vì thao tác click vào mã chuyến xe đã mở được toàn bộ thông tin chi tiết qua Modal chuyên dụng với đầy đủ công cụ in ấn tem nhãn, việc mở rộng dạng accordion ngay trong bảng trở nên hoàn toàn không cần thiết.
- **Nút "Mở rộng tất cả" trên Toolbar làm rối thanh điều hướng**: Chiếm dụng không gian ngang của thanh tìm kiếm và bộ lọc ngày tháng.

**👉 QUYẾT ĐỊNH NGHIỆP VỤ**: Loại bỏ hoàn toàn nút bấm mũi tên `>` (`IconChevronRight`/`IconChevronDown`) ở cột `CHUYẾN XE / TRIP`, loại bỏ khối sub-row accordion lồng bảng và loại bỏ nút "Mở rộng tất cả / Thu gọn tất cả" trên thanh công cụ. Giữ cho bảng kê chuyến xe đạt độ tinh gọn, đồng bộ tối đa, lấy thao tác click vào Mã chuyến xe làm phương thức chuẩn duy nhất để xem chi tiết đơn hàng.

---

### 3. Sơ đồ luồng tương tác chuẩn hóa sau khi tinh gọn (Simplified Interaction Flow)

```mermaid
flowchart TD
    A["Màn hình Vận hành Kho (Xuất kho / Nhập kho)"] --> B["Bảng danh sách chuyến xe (Dòng tinh gọn, không còn icon >)"]
    
    B --> C{"Người dùng muốn làm gì?"}
    
    %% Luồng 1: Xem chi tiết đơn & In tem nhận diện
    C -- "Click vào Mã chuyến xe (VD: SD43)" --> D["Mở Modal Chi Tiết Chuyến Xe (Read-Only)"]
    subgraph S1 ["CHẾ ĐỘ XEM & IN TEM NHẬN DIỆN (Task #46 Invariant)"]
        D --> D1["Hiển thị danh sách đầy đủ các đơn hàng con"]
        D --> D2["In tem nhận diện hàng hóa A4 (Từng đơn hoặc Tất cả)"]
        D --> D3["In phiếu xuất/nhập xe (nếu đã xử lý)"]
    end
    
    %% Luồng 2: Tác nghiệp Chuyến xe Chờ xử lý
    C -- "Bấm nút Tiếp tục tại cột THAO TÁC" --> E["Mở Chế độ Chỉnh sửa / Tác nghiệp chuyến xe"]
    subgraph S2 ["CHẾ ĐỘ TÁC NGHIỆP (Task #54 Invariant)"]
        E --> E1["Xuất kho: Lập kế hoạch xe, thêm/bớt đơn xuất"]
        E --> E2["Nhập kho: Kiểm đếm dỡ hàng thực tế, bốc dọc đường"]
    end
    
    %% Luồng 3: Hủy chuyến xe nháp
    C -- "Bấm nút Hủy nháp tại cột THAO TÁC" --> F["Xác nhận hủy chuyến xe nháp an toàn"]
```

---

### 4. Quy chuẩn Bất Biến Bắt Buộc Tuân Thủ (Core Invariants)

1. **Quy chuẩn Bảo toàn Chế độ Xem qua Modal (Task #46 Invariant)**:
   - Click vào mã chuyến xe `grp.tripCode` BẮT BUỘC tiếp tục mở `WarehouseTripDetailModal` ở chế độ `readOnly={true}`.
   - Toàn bộ tính năng in tem nhận diện (`PalletLabelA4Modal`) và in phiếu vận chuyển phải hoạt động nguyên vẹn 100%.
2. **Quy chuẩn Đồng bộ Giữa Nhập Kho & Xuất Kho (Inbound & Outbound Parity)**:
   - Thay đổi loại bỏ nút mở rộng `>` áp dụng triệt để cho cả Màn hình Xuất kho (`outbound/page.tsx`) và Màn hình Nhập kho (`inbound/page.tsx`).
   - Hai màn hình phải giữ sự nhất quán hoàn hảo về kích thước cột, khoảng cách và hành vi tương tác.
3. **Quy chuẩn Giao diện Hẹp & Mật độ Cao (UI Compact Density Mandate)**:
   - Chiều cao dòng bảng kê cố định ~26px (`py-1 px-2`), không còn bị kéo giãn bất thường do accordion lồng bảng.
   - Cột `CHUYẾN XE / TRIP` căn chỉnh gọn gàng, hiển thị mã `grp.tripCode` dạng `text-[11px] font-mono font-bold text-indigo-600` kèm badge số lượng đơn.
   - Tuyệt đối cấm sinh các class quá khổ: `p-4`, `p-6`, `space-y-3`, `gap-4`.
4. **Quy chuẩn Triệt tiêu Icon Trùng lặp (Zero Redundant Icons Rule)**:
   - Khi loại bỏ nút icon `IconChevronRight`/`IconChevronDown`, mã chuyến xe đứng độc lập, sạch sẽ, không còn ký tự thừa.
5. **Dữ liệu Thật 100% (Real Database Data Mandate)**:
   - Mọi truy vấn danh sách chuyến xe và chi tiết manifest kết nối trực tiếp với PostgreSQL backend. Không dùng mock data.

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
| STT | Điểm chưa đúng trên giao diện cũ | Đối chiếu ảnh chụp / Mã nguồn thực tế | Phân tích nguyên nhân & Phương án khắc phục |
|:---:|---|---|---|
| **1** | **Nút mũi tên `>` mở rộng dòng xuất hiện ở cột `CHUYẾN XE / TRIP`** | Khoanh đỏ trong [`screenshot_01.jpg`](file:///feedbacks/feedback_14_10_task_70/screenshot_01.jpg), mã nguồn [`outbound/page.tsx#L1146-L1161`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1146-L1161) và [`inbound/page.tsx#L936-L951`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx#L936-L951) | Nút bấm `<button onClick={() => toggleExpandVehicle(grp.groupKey)}...><IconChevronRight / IconChevronDown /></button>` chiếm không gian trước mã chuyến xe, gây rối mắt và bấm nhầm.<br>➔ **Khắc phục**: Loại bỏ hoàn toàn nút bấm này ở cả hai màn hình Xuất kho và Nhập kho. |
| **2** | **Bảng con lồng ghép (Nested Sub-row Table) bên trong dòng bảng** | [`outbound/page.tsx#L1254-L1402`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1254-L1402) và [`inbound/page.tsx#L1040-L1180`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx#L1040-L1180) | Đoạn code dài hơn 150 dòng render `{isExpanded && (<tr ...><td colSpan={5}>...</td></tr>)}` để hiển thị sub-table bên trong dòng bảng chính. Bảng con này vỡ layout, không hỗ trợ in tem nhận diện chuẩn như Modal và gây nặng DOM.<br>➔ **Khắc phục**: Xóa bỏ toàn bộ khối code render sub-row accordion này. Chuyển giao hoàn toàn nhiệm vụ xem danh sách đơn cho `WarehouseTripDetailModal`. |
| **3** | **Nút "Mở rộng tất cả (N xe) / Thu gọn tất cả" trên Toolbar trở nên dư thừa** | [`outbound/page.tsx#L1069-L1091`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx#L1069-L1091) và [`inbound/page.tsx#L864-L885`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx#L864-L885) | Nút bấm `toggleAllGroups` trên Toolbar phụ thuộc vào state `expandedVehicleKeys`. Khi dòng không còn accordion mở rộng, nút này trên toolbar mất ý nghĩa vận hành và gây lãng phí không gian.<br>➔ **Khắc phục**: Loại bỏ nút "Mở rộng tất cả / Thu gọn tất cả" trên thanh công cụ của cả Xuất kho và Nhập kho. |
| **4** | **Các state và hàm xử lý mở rộng xe còn tồn đọng trong mã nguồn** | Khai báo state `expandedVehicleKeys`, hàm `toggleExpandVehicle`, hàm `toggleAllGroups`, `allExpanded` | Để lại các biến state và hàm không dùng sẽ gây warning linter hoặc code rác (dead code).<br>➔ **Khắc phục**: Dọn dẹp sạch sẽ toàn bộ state và hàm liên quan đến mở rộng/thu gọn nhóm xe trong component. |

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Kiểm tra Tính Toàn Vẹn Endpoint Danh sách Chuyến xe**
- ✅ **Kiểm tra API Manifest Chuyến xe**
- ✅ **Kiểm tra Biên dịch Backend**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Loại bỏ Nút Mũi Tên Mở Rộng Dòng `>` ở cột `CHUYẾN XE / TRIP`**
- ✅ **Loại bỏ Khối Nested Sub-row Accordion**
- ✅ **Loại bỏ Nút "Mở rộng tất cả / Thu gọn tất cả" trên Toolbar**
- ✅ **Dọn dẹp State, Hàm và Icons Không Còn Sử Dụng**
- ✅ **Loại bỏ Nút Mũi Tên Mở Rộng Dòng `>` ở cột `CHUYẾN XE / TRIP`**
- ✅ **Loại bỏ Khối Nested Sub-row Accordion Nhập Kho**
- ✅ **Loại bỏ Nút "Mở rộng tất cả / Thu gọn" trên Toolbar Nhập Kho**
- ✅ **Dọn dẹp State và Hàm Liên Quan**
- ✅ **Xác nhận Thao tác Click vào Mã Chuyến Xe**
- ✅ **Xác nhận Nút Thao tác Tiếp tục & Hủy nháp**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Cập nhật các E2E Test Suite Hiện Có (nếu có tham chiếu nút mở rộng)**
- ✅ **Xây dựng Kịch bản Kiểm thử E2E Chuyên biệt cho Task #70**
- ✅ **Kiểm tra Type Check & Lint Toàn diện**

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

### Hình ảnh minh chứng đã lưu trữ (1 tệp):
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_70/screenshot_01.jpg)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Frontend (Next.js) |
| 2 | `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx` | Frontend (Next.js) |
| 4 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 5 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:////home/runner/work/logistics-website/logistics-website/feedbacks/feedback_14_10_task_70/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
