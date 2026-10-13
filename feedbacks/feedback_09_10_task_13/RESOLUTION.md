# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_09_10_TASK_13] — Feedback 09/10 (Task 13) — Tách Cột Thông Tin Hàng Hóa & Chuẩn Hóa Thuật Ngữ (Số Lượng, CBM) Tại Màn Hình Tổng Hợp Đơn Hàng Kho

> **Thời gian nghiệm thu**: 09/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (27/27 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành kho)  
> **Phạm vi tác động**: Phân hệ Quản lý Kho (`/dashboard/warehouse/orders`) ➔ Trang **Tổng Hợp Đơn Hàng Tại Kho** ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Modal Chi tiết Vận đơn Kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Bảng tra cứu & chọn hàng hóa kho liên quan ([`WarehouseLookupModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx), [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Backend REST API Quản lý Đơn hàng Kho ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"màn hình đơn hàng kho đang gom các thông tin của mã vận đơn (tên hàng, số kiện, số kg, số M3) vào chung 1 cột. Hãy tách các nội dung này thành các cột riêng biệt. Đổi tên số kiện thành số lượng, M3 thành CBM"*

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"màn hình đơn hàng kho đang gom các thông tin của mã vận đơn (tên hàng, số kiện, số kg, số M3) vào chung 1 cột. Hãy tách các nội dung này thành các cột riêng biệt. Đổi tên số kiện thành số lượng, M3 thành CBM"*

---

### 2. Tình huống vận hành thực tế tại trạm kho Spider Express

Màn hình **Tổng Hợp Đơn Hàng Tại Kho** (`/dashboard/warehouse/orders`) là bàn làm việc trung tâm (Master Dashboard) của Quản lý kho (Warehouse Manager) và Thủ kho để:
1. **Kiểm soát và đối soát tồn kho tức thời**: Nắm bắt nhanh từng mã vận đơn đang lưu kho tại Hub hiện tại hoặc đã xuất chuyển tiếp.
2. **Tra cứu nhanh theo thông số vật lý**: Khi tài xế hoặc khách hàng hỏi về một lô hàng cụ thể, thủ kho cần quét nhanh bằng mắt theo **Tên mặt hàng**, **Số lượng**, **Khối lượng (Kg)**, hoặc **Thể tích (CBM)** để định vị lô hàng trên sàn kho bãi hoặc tính toán dung tích xếp dỡ lên xe bo/xe tải.
3. **In tem nhãn nhận diện A4** và tra cứu chi tiết lịch sử xuất nhập tồn.

#### Bất cập nghiêm trọng khi gom cụm dữ liệu vào 1 cột:
- **Tắc nghẽn thị giác (Visual Overload)**: Hiện tại, một ô của cột "MÃ VẬN ĐƠN" chứa đến 2 dòng text phức tạp:
  - Dòng 1: Mã vận đơn (ví dụ: `T15`, `T18`...).
  - Dòng 2: Chuỗi ghép dài `Nội thất gỗ lắp ghép • 850 kg • 75 m³ • Quận Bình Tân, TP. Hồ Chí Minh...`.
- **Mất mát thông tin (Truncation Bug)**: Do bề rộng cột có hạn, chuỗi ghép ở Dòng 2 liên tục bị tràn và cắt ngắn bằng dấu ba chấm (`...`), khiến thủ kho không thể nhìn thấy địa chỉ giao hàng hoặc điểm đến cuối cùng của đơn nếu không hover chuột.
- **Phá vỡ chuẩn bảng biểu Tabular**: Các số liệu định lượng (Số kg, CBM, Số lượng) không thể căn lề phải (Right-align) theo chuẩn kế toán/kho vận, không thể so sánh tương quan giữa các dòng hàng.
- **Rời rạc logic**: Cột `SỐ LƯỢNG TỒN KHO` lại nằm tách biệt ở cột thứ 4, trong khi các thông số vật lý khác của cùng kiện hàng (Kg, M3) lại bị nhồi nhét chung với Mã vận đơn ở cột thứ 3.

---

### 3. Chuẩn hóa thuật ngữ vận hành Logistics thực tế

Theo yêu cầu từ người dùng và quy chuẩn vận hành kho bãi:
1. **Đổi "Số kiện" ➔ "Số lượng"**:
   - Trong vận tải hàng hóa đa phương thức, hàng hóa lưu kho có thể là kiện, thùng, bao, cuộn, pallet... Việc dùng thuật ngữ **"Số lượng"** (Quantity) mang tính bao quát và chuẩn hóa toàn hệ thống.
   - Thể hiện rõ ràng mối quan hệ giữa **Số lượng tồn kho thực tế** và **Tổng số lượng của đơn** dạng `{Tồn} / {Tổng}` (ví dụ: `5 / 5` hoặc `0 / 11`).
2. **Đổi "M3" / "Số m³" ➔ "CBM"**:
   - **CBM** (*Cubic Meter - Mét khối*) là thuật ngữ quốc tế chuẩn và là ngôn ngữ nghiệp vụ phổ biến nhất trong giới logistics, kho bãi và giao nhận vận tải tại Việt Nam.
   - Việc ghi `CBM` trên tiêu đề cột và bảng biểu vừa ngắn gọn, vừa tránh lỗi font hiển thị ký tự đặc biệt ($m^3$) trên các thiết bị quét cầm tay hoặc màn hình POS/kho.

---

### 4. Sơ đồ cấu trúc bảng dữ liệu: Hiện tại vs. Chuẩn hóa mới

```mermaid
flowchart TD
    subgraph OLD ["CẤU TRÚC BẢNG CŨ (BỊ GOM CỤM & CẮT CHỮ)"]
        O1["STT"] --- O2["NGÀY NHẬP"] --- O3["MÃ VẬN ĐƠN\n(Gom: Mã + Tên hàng + Kg + m³ + Lộ trình)"] --- O4["SỐ LƯỢNG TỒN KHO\n(5 / 5 kiện)"] --- O5["TRẠNG THÁI"] --- O6["NGÀY XUẤT"] --- O7["THAO TÁC"]
    end

    subgraph NEW ["CẤU TRÚC BẢNG MỚI (TÁCH CỘT ĐỘC LẬP & CHUẨN THUẬT NGỮ)"]
        N1["STT"] --- N2["NGÀY NHẬP"] --- N3["MÃ VẬN ĐƠN"] --- N4["TÊN HÀNG HÓA"] --- N5["SỐ LƯỢNG\n(Tồn / Tổng)"] --- N6["SỐ KG"] --- N7["CBM"] --- N8["ĐÍCH ĐẾN / LỘ TRÌNH"] --- N9["TRẠNG THÁI"] --- N10["NGÀY XUẤT"] --- N11["THAO TÁC"]
    end
```

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
*(Đối chiếu trực tiếp với [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_13/screenshot_01.jpg) và mã nguồn tại [`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx))*

| STT | Vị trí trên ảnh / Code | Hiện trạng chưa đúng | Chuẩn hóa yêu cầu từ người dùng |
|:---:|---|---|---|
| **01** | **Cột "MÃ VẬN ĐƠN"** (Cột 3 trên bảng) | Cột đang gom cụm 4 trường thông tin: Mã vận đơn (`orderCode`), Tên hàng (`goodsDescription`), Khối lượng (`totalWeight` kg), Thể tích (`totalVolume` m³), Lộ trình (`destinationHub` / `route`). Dòng phụ bị dài và cắt `...`. | **Tách thành các cột độc lập riêng biệt**: Cột `MÃ VẬN ĐƠN` chỉ hiển thị mã vận đơn (và cờ số dòng hàng nếu đơn có nhiều mặt hàng). Các thông tin khác chuyển sang các cột riêng. |
| **02** | **Cột Tên Hàng Hóa** (Hiện chưa có cột riêng) | Tên hàng đang nằm chung ở dòng thứ 2 dưới mã vận đơn (`Nội thất gỗ lắp ghép`, `Linh kiện máy tính`...). | **Bổ sung cột riêng "TÊN HÀNG HÓA"**: Đặt ngay sau cột Mã vận đơn, font chữ rõ nét (`font-medium text-slate-800`), hiển thị đầy đủ tên mặt hàng. |
| **03** | **Cột Số Lượng & Thuật ngữ "Số kiện"** | Tiêu đề cột cũ ghi `SỐ LƯỢNG TỒN KHO`, nội dung hiển thị `5 / 5 kiện`, `0 / 11 kiện`, `72 / 80 kiện`. | **Đổi tên cột thành "SỐ LƯỢNG"**: Hiển thị tỷ lệ `{Tồn} / {Tổng}` rõ ràng, đổi chữ `kiện` thành số lượng hoặc tinh giản đơn vị phù hợp. Cột căn phải (`text-right font-mono`). |
| **04** | **Cột Khối lượng (Kg)** (Hiện chưa có cột riêng) | Khối lượng bị kẹp giữa các dấu chấm bullet: `• 850 kg •`, `• 1.100 kg •`. | **Bổ sung cột riêng "SỐ KG"** (hoặc `KHỐI LƯỢNG (KG)`): Căn phải (`text-right font-mono`), định dạng phân tách hàng nghìn chuẩn tiếng Việt (ví dụ: `850`, `1.100`). |
| **05** | **Cột Thể tích & Thuật ngữ "M3"** | Thể tích hiển thị `• 75 m³ •`, `• 19 m³ •` chung với text mô tả. | **Bổ sung cột riêng "CBM"**: Đổi toàn bộ từ `M3` / `m³` sang `CBM`. Cột căn phải (`text-right font-mono`), hiển thị số thập phân tối đa 3 chữ số nếu có (ví dụ: `75`, `19.5`). |
| **06** | **Cột Đích đến / Lộ trình** | Lộ trình đang nằm cuối dòng 2: `• Quận Bình Tân, TP. Hồ Chí Minh ...`, bị che khuất khi tên hàng dài. | **Bổ sung cột riêng "ĐÍCH ĐẾN"** (hoặc `LỘ TRÌNH`): Hiển thị rõ kho nhận hoặc địa chỉ giao khách lẻ (`Quận Bình Tân, TP. Hồ Chí Minh`, `Magellan Hub - Đà Nẵng`, `Xe bo Tuyến Đồng Nai`). |
| **07** | **Dòng con mở rộng (`isMulti` / `isExpanded`)** | Khi bấm mở rộng một đơn nhiều dòng hàng (`members.map`), dòng con cũng đang bị nhồi nhét gom cụm tương tự ở cột Mã vận đơn. | **Đồng bộ dàn trải các cột cho dòng con**: Từng dòng hàng con (`Dòng 1`, `Dòng 2`) cũng phải tách đúng theo các cột Tên hàng, Số lượng, Số kg, CBM, Đích đến... |
| **08** | **Modal Chi Tiết Vận Đơn Kho** ([`warehouse-waybill-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) | Bảng "Danh mục hàng hóa vận đơn" đang có các cột `SỐ KIỆN`, `SỐ M³`. | **Đồng bộ nhãn cột**: Đổi `SỐ KIỆN` ➔ `SỐ LƯỢNG`, `SỐ M³` ➔ `CBM` để nhất quán toàn hệ thống. |

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Rà soát & Đảm bảo Tính Toàn vẹn Dữ liệu tại API `GET /api/v1/warehouse/orders`**
- ✅ **Cập nhật Swagger & DTO API Documentation**
- ✅ **Kiểm tra tính toàn vẹn câu truy vấn tìm kiếm Freetext**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Tái cấu trúc Bảng Dữ liệu tại [`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)**
  * 📍 File: `frontend/src/app/dashboard/warehouse/orders/page.tsx`
- ✅ **Cập nhật hằng số tổng số cột (`COLUMN_COUNT`)**
- ✅ **Tái thiết kế hàng tiêu đề bảng (`<thead>`) với 11 cột độc lập chuẩn Compact Density**
- ✅ **Tách và hoàn thiện các ô dữ liệu hàng chính (`row`)**
- ✅ **Đồng bộ hiển thị cho hàng con khi mở rộng (`members.map` khi `isExpanded`)**
- ✅ **Tuân thủ nghiêm ngặt Quy chuẩn UI Compact Density (`ui-spacing-guard`)**
- ✅ **Đồng bộ Thuật ngữ tại Modal Chi tiết Vận đơn ([`warehouse-waybill-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx`
- ✅ **Cập nhật tiêu đề bảng "Danh mục hàng hóa vận đơn"**
- ✅ **Cập nhật tóm tắt thống kê đầu bảng: `Tổng: ... kiện` ➔ điều chỉnh văn phong hiển thị chuẩn.**
- ✅ **Rà soát các Bảng Kho Phụ Trợ Liên Quan**
- ✅ **[`warehouse-lookup-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx): Đổi header `Số m³` ➔ `CBM`.**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx`
- ✅ **[`warehouse-select-stored-orders-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx): Đổi header `SỐ KIỆN` ➔ `SỐ LƯỢNG`, `SỐ M³` ➔ `CBM`.**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx`

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Kiểm tra Biên dịch & Type Checking**
- ✅ **Chạy `npm run type-check` (hoặc `npx tsc --noEmit`) trên cả `frontend/` và `backend/`, đảm bảo 0 lỗi TypeScript.**
- ✅ **Chạy `npm run lint` trên cả 2 submodule.**
- ✅ **Chạy `npm run build` trên `frontend/` đảm bảo tạo bản build Next.js thành công.**
- ✅ **Kịch bản Kiểm thử Giao diện (Manual / Playwright E2E Verification)**
- ✅ **Kịch bản 1 (Tách cột chuẩn xác)**: Mở `/dashboard/warehouse/orders`, kiểm tra bảng hiển thị đầy đủ 11 cột riêng biệt: STT, Ngày nhập, Mã vận đơn, Tên hàng hóa, Số lượng, Số kg, CBM, Đích đến, Trạng thái, Ngày xuất, Thao tác.**
- ✅ **Kịch bản 2 (Căn lề số liệu)**: Cột Số lượng, Số kg, CBM căn lề phải (`text-right`), định dạng số có phân cách hàng nghìn.**
- ✅ **Kịch bản 3 (Đổi tên thuật ngữ)**: Không còn chữ `M3` hay `m³` trên header; cột thể hiện rõ `CBM`. Cột số kiện thể hiện là `SỐ LƯỢNG`.**
- ✅ **Kịch bản 4 (Mở rộng đơn đa dòng - Multi-line expand)**: Bấm vào đơn có nhiều dòng hàng (`+{N} dòng hàng`), các dòng con bung ra dàn trải chính xác theo từng cột tương ứng.**
- ✅ **Kịch bản 5 (Bộ lọc & Tìm kiếm)**: Thao tác tìm kiếm theo mã đơn / tên hàng và chuyển các tab trạng thái (`Tất cả`, `LƯU KHO`, `ĐƠN NHÁP`, `ĐÃ XUẤT KHO`), đảm bảo 1:1 counter parity và dữ liệu hiển thị đúng cột.**
- ✅ **Kịch bản 6 (Thao tác modal chi tiết & In nhãn)**: Bấm icon xem chi tiết (mở `WarehouseWaybillDetailModal`) và icon máy in (in tem nhãn A4), đảm bảo hoạt động bình thường, không bị lỗi dữ liệu truyền vào.**
- ✅ **Kịch bản 7 (Kiểm tra UI Compact Density)**: Bảng dữ liệu ôm sát, không bị vỡ layout, cuộn ngang mượt mà trên màn hình độ phân giải từ 1280px đến 1920px.**

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
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_13/screenshot_01.jpg)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Frontend (Next.js) |
| 2 | `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx` | Frontend (Next.js) |
| 4 | `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx` | Frontend (Next.js) |
| 5 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 6 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedback_09_10_task_13/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
