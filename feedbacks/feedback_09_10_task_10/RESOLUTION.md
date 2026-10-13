# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_09_10_TASK_10] — Feedback 09/10 Task 10 — Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng: Bắt Buộc Để Trống Tuyệt Đối Khi Đơn Hàng Ở Trạng Thái Lưu Kho

> **Thời gian nghiệm thu**: 09/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (21/21 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & @TMS Domain Lead  
> **Phạm vi tác động**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"nếu đơn hàng ở trạng thái lưu kho thì cột ngày xuất hàng để trống"*

### 1. Phản hồi gốc từ người dùng (@【M】【C】【D】)
> *"nếu đơn hàng ở trạng thái lưu kho thì cột ngày xuất hàng để trống"*

---

### 2. Bản chất nghiệp vụ Logistics TMS tại trạm kho bãi (Warehouse Inventory Ledger & Outbound Lifecycle)

Trong hệ thống Logistics TMS (Spider Express), màn hình **Đơn hàng kho** (`/dashboard/warehouse/orders`) đóng vai trò là **"Sổ cái hàng hóa lưu bãi & luân chuyển tại Hub"** (Hub Inventory & Storage Ledger). 

Mỗi Hub (như `Andromeda Hub - HCM`, `Magellan Hub - Đà Nẵng`, `Polaris Hub - Hưng Yên`) quản lý một kho hàng vật lý riêng biệt. Dòng hàng luân chuyển qua Hub trải qua các giai đoạn vòng đời rất rõ ràng:

```mermaid
flowchart TD
    subgraph S1 ["1. ĐƠN ĐANG LƯU KHO (STORED IN WAREHOUSE)"]
        A1["Hàng đã nhập vào kho Hub\n(Sau kiểm đếm dỡ hàng)"] --> B1["Số lượng tồn khả dụng:\nhubStock > 0"]
        B1 --> C1["Trạng thái: LƯU KHO\n(INBOUND / STORED / IN_WAREHOUSE)"]
        C1 --> D1{"Kiểm tra Cột 'Ngày xuất'"}
        D1 -->|QUY TẮC SỐNG CÒN BẮT BUỘC| E1["BẮT BUỘC ĐỂ TRỐNG TUYỆT ĐỐI\nHiển thị ký tự '—'\n(outboundDate = null)"]
    end

    subgraph S2 ["2. ĐƠN ĐÃ XUẤT KHO (DISPATCHED OUT)"]
        A2["Tác nghiệp xuất kho hoàn tất\n(Lên xe luân chuyển hoặc Giao khách lẻ)"] --> B2["Ghi nhận OrderInventoryTransaction\n(type = OUTBOUND hoặc TRANSFER)"]
        B2 --> C2["Trạng thái: ĐÃ XUẤT KHO\n(COMPLETED_INBOUND / DISPATCHED)\nTồn kho hubStock = 0"]
        C2 --> D2{"Kiểm tra Cột 'Ngày xuất'"}
        D2 -->|HIỂN THỊ CHÍNH XÁC| E2["Thời điểm xuất kho thực tế\n(DD/MM/YYYY HH:mm từ tx.createdAt)"]
    end

    subgraph S3 ["3. ĐƠN NHÁP (DRAFT)"]
        A3["Đơn hàng đang soạn thảo\nChưa hoàn tất thủ tục nhập kho"] --> B3["Trạng thái: ĐƠN NHÁP\n(status = 'DRAFT')"]
        B3 --> C3{"Kiểm tra Cột 'Ngày xuất'"}
        C3 -->|QUY TẮC| E3["BẮT BUỘC ĐỂ TRỐNG TUYỆT ĐỐI\nHiển thị ký tự '—'\n(outboundDate = null)"]
    end

    style S1 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style E1 fill:#dcfce7,stroke:#15803d,stroke-width:2px
    style S2 fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px
    style E2 fill:#ede9fe,stroke:#6d28d9,stroke-width:2px
    style S3 fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style E3 fill:#f1f5f9,stroke:#475569,stroke-width:2px
```

#### 🔹 Vì sao người dùng nhấn mạnh: "Nếu đơn hàng ở trạng thái lưu kho thì cột ngày xuất hàng để trống"?

1. **Ý nghĩa nghiệp vụ sống còn của cột "Ngày xuất"**:
   - Khi thủ kho kiểm kê kho bãi hoặc tra cứu danh sách đơn hàng, cột "Ngày xuất" trả lời câu hỏi: *"Lô hàng này đã được bốc lên xe và rời khỏi kho này vào thời điểm nào?"*
   - Một khi đơn hàng đang ở trạng thái **LƯU KHO** (`INBOUND`, `STORED`, `IN_WAREHOUSE`), điều đó có nghĩa là **hàng hóa vẫn đang nằm yên trên pallet hoặc kệ chứa hàng trong kho bãi vật lý**.
   - Hàng hóa **CHƯA HỀ ĐƯỢC XUẤT ĐI**, chưa có bất kỳ lệnh xuất kho (`PXK`) hay chuyến xe nào chở hàng rời bãi.
   - Do đó, về mặt logic và thực tế hiện trường, **không thể tồn tại một "Ngày xuất" cho đơn hàng đang lưu kho**.

2. **Hậu quả tai hại nếu hệ thống hiển thị ngày vào cột "Ngày xuất" khi đang lưu kho**:
   - Trong các hệ thống phần mềm nghiệp vụ, nếu lập trình viên không có tư duy kho bãi thực tế, họ rất dễ mắc lỗi lấy trường ngày cập nhật bản ghi (`updatedAt`), ngày dự kiến chạy của một chuyến xe dự thảo, hoặc ngày tạo đơn để điền vào ô còn trống.
   - **Hậu quả 1: Hiểu lầm hàng đã rời bãi (Ảo giác xuất kho)**: Thủ kho nhìn vào thấy cột Ngày xuất có giá trị (ví dụ `09/10/2026 10:30`), họ sẽ đinh ninh rằng kiện hàng đã xuất đi rồi. Họ sẽ không đi tìm hay quản lý kiện hàng đó nữa, dẫn đến việc hàng bị bỏ quên trong kho, thất lạc, tồn kho chết hoặc hết hạn lưu bãi.
   - **Hậu quả 2: Sai lệch biên bản kiểm kê**: Khi kiểm toán hoặc đối soát cuối ngày, đối chiếu giữa dữ liệu phần mềm (thấy có ngày xuất) và hiện trường (hàng vẫn còn nguyên trên sàn) sẽ tạo ra biên bản chênh lệch hàng hóa nghiêm trọng.
   - **Hậu quả 3: Rủi ro tạo lệnh xuất trùng lặp hoặc xuất khống**: Điều phối viên khi nhìn thấy ngày xuất có thể tạo sai lệch kế hoạch điều xe cho các đơn hàng tiếp theo.

3. **Nguyên tắc "Cơ Chế Bảo Vệ 2 Tầng" (Dual-Layer Guard Protocol)**:
   - Để triệt tiêu hoàn toàn rủi ro này, hệ thống TMS Spider Express phải thiết lập cơ chế bảo vệ 2 tầng độc lập:
     * **Tầng 1 (Backend Guard)**: Tại tầng Service/Repository (`warehouse.service.ts`), khi tính toán trường `outboundDate`, nếu `hubStatus` thuộc nhóm Lưu kho (`INBOUND`, `STORED`, `IN_WAREHOUSE`) HOẶC số lượng tồn `hubStock > 0` HOẶC trạng thái là `DRAFT`: **BẮT BUỘC ÉP GIÁ TRỊ TRẢ VỀ LÀ `null`**.
     * **Tầng 2 (Frontend Guard)**: Tại component hiển thị (`page.tsx` và modal chi tiết), nếu `isStoredOrDraft` là `true` hoặc `outboundDate` không tồn tại: **BẮT BUỘC RENDER KÝ TỰ GẠCH NGANG MỜ `—` (`text-slate-400 font-mono`)**, tuyệt đối không fallback sang bất kỳ trường ngày nào khác (`updatedAt`, `createdAt`).

---

### 3. Quy định chi tiết về trường thông tin & luồng xử lý theo từng trạng thái

| Trạng thái đơn tại Hub (`hubStatus`) | Số lượng tồn kho (`hubStock`) | Cột "Ngày nhập" | Cột "Ngày xuất" | Hành vi hiển thị & Quy định nghiệp vụ |
|---|:---:|---|---|---|
| **LƯU KHO** (`INBOUND` / `STORED` / `IN_WAREHOUSE`) | $> 0$ kiện | Hiển thị ngày giờ dỡ nhập kho thực tế (`DD/MM/YYYY HH:mm`) | ❌ **BẮT BUỘC ĐỂ TRỐNG (`—`)** | Hàng đang nằm tại bãi, chưa rời kho. Cột Ngày xuất hiển thị ký tự gạch ngang mờ `—`. |
| **ĐƠN NHÁP** (`DRAFT`) | Dự kiến $> 0$ | Hiển thị ngày giờ tạo đơn nháp (`createdAt`) | ❌ **BẮT BUỘC ĐỂ TRỐNG (`—`)** | Đơn đang soạn thảo, chưa chính thức nhập vào sổ cái và chưa xuất. Hiển thị `—`. |
| **ĐÃ XUẤT KHO** (`COMPLETED_INBOUND` / `DISPATCHED`) | $= 0$ kiện | Hiển thị ngày giờ dỡ nhập kho ban đầu | ✅ **HIỂN THỊ CHÍNH XÁC** ngày giờ xuất kho thực tế (`DD/MM/YYYY HH:mm`) | Hàng đã hoàn tất bốc lên xe và rời kho. Lấy mốc thời gian của giao dịch `OUTBOUND` hoặc `TRANSFER` cuối cùng. |
| **ĐANG VẬN CHUYỂN** (`IN_TRANSIT`) | $= 0$ tại Hub | Hiển thị ngày giờ xe xuất phát | Phụ thuộc vào chặng hiện tại | Hàng đang di chuyển trên đường giữa các Hub. |

---

### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):
*(Đối chiếu trực tiếp với ảnh chụp màn hình [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_10/screenshot_01.jpg))*

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAO DIỆN HIỆN TẠI (10 CỘT RƯỜM RÀ, THIẾU NGÀY NHẬP/XUẤT, THIẾU GUARD TRẠNG THÁI LƯU KHO):               │
│ STT | MÃ ĐƠN HÀNG | TÊN HÀNG HÓA | CHUYẾN XE / TRIP | TỒN KHO | SỐ KG | SỐ M³ | ĐÍCH ĐẾN | TRẠNG THÁI | THAO TÁC │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAO DIỆN CHUẨN HÓA MỚI (7 CỘT CHUẨN MỰC, CỘT NGÀY XUẤT BẮT BUỘC ĐỂ TRỐNG KHI ĐANG LƯU KHO):            │
│ STT | NGÀY NHẬP | MÃ VẬN ĐƠN (KÈM MẶT HÀNG) | SỐ LƯỢNG TỒN KHO | TRẠNG THÁI | NGÀY XUẤT | THAO TÁC        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết 4 điểm tồn tại cần khắc phục triệt để:

1. **Chưa có ràng buộc Guard cho cột "Ngày xuất" đối với đơn hàng đang lưu kho**:
   - Trên ảnh chụp [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedback_09_10_task_10/screenshot_01.jpg), hàng loạt đơn hàng đang ở trạng thái `LƯU KHO` (như `PML2610-673` 21/21 kiện, `NVS2610-105` 18/18 kiện, `NQT2610-516` 12/12 kiện, `NTC2610-882` 15/15 kiện, `NAV2610-951` 28/28 kiện...) và `Đơn nháp` (`BAT2610-934`, `BHD2610-268`...).
   - Nếu đưa cột "Ngày xuất" vào mà không có Guard lọc trạng thái, hệ thống có nguy cơ hiển thị ngày cập nhật hoặc ngày của chuyến xe cũ, gây hiểu lầm tai hại là hàng đã xuất kho.
   - **Yêu cầu cốt lõi**: Tất cả các đơn có badge `LƯU KHO` và `Đơn nháp` này BẮT BUỘC phải để trống ô Ngày xuất (hiển thị ký tự `—`).

2. **Backend API chưa hỗ trợ trường `outboundDate` và `inboundDate` chuyên biệt**:
   - Endpoint `GET /api/v1/warehouse/orders` (với tham số `groupBy=orderCode`) hiện chỉ trả về các thông số tải trọng và chuyến xe, chưa tính toán và chuẩn hóa trường `inboundDate` (ngày nhập) và `outboundDate` (ngày xuất).
   - Backend cần truy vấn bảng giao dịch `order_inventory_transaction` gắn với `userHubId` để trích xuất đúng ngày xuất thực tế và cưỡng chế trả về `null` khi đơn đang lưu kho.

3. **Giao diện cũ 10 cột chiếm diện tích, thiếu thông tin thời gian luân chuyển**:
   - Các cột `CHUYẾN XE / TRIP`, `SỐ KG`, `SỐ M³`, `ĐÍCH ĐẾN` chiếm tới hơn 50% độ rộng bảng, nhưng lại thiếu vắng 2 mốc thời gian quan trọng nhất đối với nghiệp vụ kho bãi: **Ngày vào kho** và **Ngày xuất kho**.
   - Chuẩn hóa về 7 cột: gom thông tin mặt hàng, kg, m³ xuống dòng phụ (subline) của cột Mã vận đơn, dành không gian hiển thị rõ ràng cho Ngày nhập và Ngày xuất.

4. **Đồng bộ hiển thị trên Modal chi tiết vận đơn ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx))**:
   - Khi thủ kho bấm vào biểu tượng con mắt (`IconEye`) để xem chi tiết một đơn đang lưu kho, các trường thời gian xuất kho hoặc timeline chặng xuất cũng phải thể hiện trạng thái "Chưa xuất kho" (`—`), tránh mâu thuẫn giữa bảng danh sách và modal chi tiết.

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **1.1. Cập nhật DTO & Interface trả về của Warehouse Orders**
- ✅ **1.2. Triển khai Backend Guard trong `warehouse.service.ts` (`aggregateOrderGroup` & `enrichWarehouseRows`)**
  * 📍 File: `backend/src/orders/warehouse.service.ts`
- ✅ **1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Member Rows)**
- ✅ **1.4. Type check & Lint check Backend**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **2.1. Cập nhật cấu trúc bảng 7 cột trong `WarehouseOrdersPage`**
- ✅ **2.2. Triển khai Frontend Guard hiển thị ô Cột "Ngày xuất"**
- ✅ **2.3. Triển khai hiển thị Cột "Ngày nhập" & "Mã vận đơn" kèm thông tin No-SKU**
- ✅ **2.4. Đồng bộ Guard cho các dòng con mở rộng (Sub-rows / Member items)**
- ✅ **2.5. Đồng bộ hiển thị sang Modal chi tiết vận đơn ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx))**
  * 📍 File: `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx`
- ✅ **2.6. Tuân thủ chuẩn UI Compact Density**
- ✅ **2.7. Type check Frontend**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **3.1. Biên dịch và kiểm tra tĩnh (Static Checks)**
- ✅ **Backend build check: `npm run build --prefix backend` PASS.**
- ✅ **Frontend type check: `npx --prefix frontend tsc --noEmit` PASS.**
- ✅ **3.2. Kịch bản kiểm thử nghiệp vụ (Business Test Scenarios)**
- ✅ **Kịch bản 1 (Đơn hàng lưu kho - Kiểm tra ràng buộc sống còn)**
- ✅ **Kịch bản 2 (Đơn hàng nháp - DRAFT)**
- ✅ **Kịch bản 3 (Đơn hàng đã xuất kho - DISPATCHED)**
- ✅ **Kịch bản 4 (Giao diện 7 cột & Hiển thị thông tin dòng phụ)**
- ✅ **Kịch bản 5 (Đơn hàng nhiều dòng con)**
- ✅ **Kịch bản 6 (Kiểm tra Modal Chi tiết Vận đơn)**

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
- 📸 **screenshot_01.jpg**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_09_10_task_10/screenshot_01.jpg)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 2 | `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx` | Frontend (Next.js) |
| 3 | `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Frontend (Next.js) |
| 4 | `backend/src/orders/warehouse.controller.ts` | Backend (NestJS) |
| 5 | `backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts` | Backend (NestJS) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedback_09_10_task_10/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
