# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_14_10_EXTRA] — Feedback 14/10 (Extra) — Xây Dựng Công Cụ Chuyển Đổi & Chuẩn Hóa File Excel Nhập Kho Từ Điều Hành Sang Mẫu Chuẩn Hệ Thống (Excel Inbound Converter Tool)

> **Thời gian nghiệm thu**: 14/10/2026 18:30:00  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (16/16 tasks)  
> **Người báo cáo / Nghiệp vụ**: @User / Thủ kho Spider Express (@Thai & Đội ngũ vận hành)  
> **Phạm vi tác động**: **Công cụ Tiện ích Kho Vận (Warehouse Operational Utilities & Tools)**: • Trang công cụ chuyên dụng: [`/dashboard/warehouse/excel-converter`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/excel-converter/page.tsx) • Tích hợp trực tiếp tại Màn hình Nhập kho: Nút mở bộ chuyển đổi nhanh trên thanh công cụ [`page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx) • Cải tiến bộ phân tích tự động trong Modal Nhập Excel: [`warehouse-excel-import-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-excel-import-modal.tsx) • Khả năng tương thích cơ chế Dán thông minh (Smart TSV Clipboard Paste): [`warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) • **Phân quyền truy cập RBAC (Role-Based Access Control)**: • Cập nhật điều kiện lọc thanh điều hướng [`use-nav.ts`](file:///d:/Projects/logistics-website/frontend/src/hooks/use-nav.ts) cho vai trò `WAREHOUSE_MANAGER` và `DISPATCHER`  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi gốc từ người dùng (Ảnh trao đổi qua Zalo - `image.png`)

> **Thủ kho / Người vận hành:**
> *"t hỏi thăm cái này"*  
> *[Ảnh 1: Xem trước file Excel chuẩn 11 cột có header Phiếu Yêu Cầu Nhập Kho, Ngày, Lái xe, Số xe]*  
> *"đây là cái excel chuẩn của mình để copy vào hệ thống cho lẹ"*  
> *[Ảnh 2: Xem trước file Excel 14 cột do bộ phận điều hành gửi sang]*  
> *"còn đây là cái mà điều hành họ gửi cho kho, nó đang dư khá nhiều thông tin"*  
> *"mình có cách nào để cô đặc lại các thông tin mình cần không nhỉ? 13:33"*  
>
> **Kỹ sư hệ thống (Phản hồi giải pháp):**  
> *"vậy thì để làm 1 trang riêng dạng tool, cho ông nhập đầu vào là file excel từ điều hành"*  
> *"sau đó bấm process 1 cái, thì đầu ra là file excel chuẩn"*  
> *"ông gửi lại cho tui 2 file excel đó, để tui làm cái tool này cho 13:34"*  

---

### 2. Nỗi đau vận hành (Operator Pain Point & Inefficiency)

Hiện nay, khi bộ phận **Điều hành vận tải (Dispatchers)** lên kế hoạch gom hàng và luân chuyển hàng về kho bãi (như `Andromeda Hub - HCM`), điều hành thường gửi file Excel tổng hợp có tên dạng `NDA_PhieuYeuCauNhapKho_2026.xlsx`.
File này có đặc thù:
1. **Nhiều sheet theo ngày**: Mỗi ngày là một sheet (ví dụ `14.10`, `07.10`, `06.10`, ..., sheet tổng `Nhập` với hơn 1,100 dòng).
2. **Thừa thông tin điều hành & format không khớp**: Bảng kê của điều hành có tới 14 cột, bao gồm tên điều hành viên, giờ dự kiến về kho, tiêu đề công ty dài 7 dòng...
3. **Thủ kho mất 15-30 phút thao tác thủ công mỗi ca làm việc**:
   - Phải mở Excel bằng tay, xóa các cột thừa.
   - Sắp xếp lại thứ tự cột cho đúng với cấu trúc 11 cột chuẩn của hệ thống TMS.
   - Trích xuất tên Tỉnh/Thành phố từ địa chỉ giao hàng chi tiết (vì bảng điều hành chỉ có cột gộp địa chỉ người nhận).
   - Nếu điều hành không điền số kiện (để trống vì hàng bao bì/lốp xe), thủ kho phải dò từng dòng để điền `1` kiện hoặc đếm kiện, nếu không khi dán vào TMS sẽ bị báo lỗi thiếu số kiện.
   - Rất dễ xảy ra sai sót lệch cột khi copy-paste thủ công, dẫn tới nhập nhầm Số kg vào Số m³ hoặc nhầm Địa chỉ nhận với Địa chỉ giao.

---

### 3. Đối chiếu cấu trúc 2 định dạng Excel

#### A. File Nguồn từ Điều Hành (`NDA_PhieuYeuCauNhapKho_2026.xlsx`)
- **Dòng 1-7**: Thông tin công ty & 4 chi nhánh kho.
- **Dòng 9**: Tiêu đề `"PHIẾU YÊU CẦU NhẬP KHO "`.
- **Dòng 10**: Mã ngày tháng dạng Excel serial (ví dụ `46309` = `14/10/2026`).
- **Dòng 12 (Header bảng 14 cột)**:
  1. `Ngày tháng(*)`: Ngày giao nhận (dạng số hoặc ngày).
  2. `Mã Đơn Hàng (*)`: Mã đơn hàng (ví dụ `NDA2610-0210`).
  3. `Điều Hành`: Tên nhân sự điều hành (ví dụ `ĐỨC ANH`).
  4. `Số Xe (*)`: Biển số xe gom (ví dụ `50E-84654` hoặc trống).
  5. `Tên tài xế`: Họ tên lái xe hoặc trống.
  6. `Tên Hàng (*)`: Tên mặt hàng (ví dụ `Lốp Michelin`, `Bột giặt NET...`).
  7. `Kho Nhập (*)`: Tên kho tiếp nhận (ví dụ `Kho Andromeda`).
  8. ` Giờ Dự Kiến Về Kho`: Khung giờ xe về (ví dụ `17H`).
  9. `Địa Chỉ Lấy Hàng (*)`: Nơi lấy hàng/kho nguồn gửi.
  10. `Địa Chỉ Giao Hàng (*)`: Tên công ty nhận, địa chỉ chi tiết, tỉnh thành.
  11. `Số Lượng`: Số kiện (có thể rỗng hoặc số).
  12. `Khối lượng (Kg)`: Trọng lượng hàng hóa.
  13. `Thể Tích (m³)`: Thể tích khối hàng.
  14. `GHI CHÚ`: Ghi chú lưu ý xếp dỡ.

#### B. File Đích Chuẩn Của Phần Mềm (`mẫu chuẩn của phần mềm.xlsx`)
- **Dòng 1**: C1:G1 Merge `"PHIẾU YÊU CẦU NHẬP KHO"`, H1: `"Ngày"`, I1: `<DD/MM/YYYY>`.
- **Dòng 2**: C2: `"LÁI XE :"`, D2: `<Tên tài xế>`.
- **Dòng 3**: C3: `"SỐ XE:"`, D3: `<Biển số xe>`.
- **Dòng 4 (Header 11 cột chuẩn của hệ thống TMS)**:
  1. `STT`: Số thứ tự tăng dần từ 1.
  2. `Mã vận đơn`: Khớp từ `Mã Đơn Hàng (*)`.
  3. `Địa chỉ nhận`: Khớp từ `Địa Chỉ Lấy Hàng (*)`.
  4. `Tên hàng`: Khớp từ `Tên Hàng (*)`.
  5. `Số kiện`: Khớp từ `Số Lượng` (nếu rỗng hoặc `= 0` thì tự động chuẩn hóa thành `1`).
  6. `Số KG`: Khớp từ `Khối lượng (Kg)` (parse số float chuẩn xác).
  7. `Số m³`: Khớp từ `Thể Tích (m³)` (parse số float chuẩn xác).
  8. `Địa chỉ giao`: Khớp từ `Địa Chỉ Giao Hàng (*)`.
  9. `Tỉnh / TP`: **Tự động bóc tách từ Địa chỉ giao hàng** bằng từ điển 63 tỉnh thành Việt Nam.
  10. `Chứng từ`: Mặc định rỗng hoặc trích xuất từ ghi chú (ví dụ `1 bộ ct`, `Kèm hóa đơn`).
  11. `Ghi chú`: Khớp từ `GHI CHÚ` (có thể kèm thông tin phụ: Giờ về kho, Tên điều hành).

---

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Viết suite Playwright E2E: [`frontend/e2e/79-feedback-14-10-extra-excel-inbound-converter.spec.ts`](file:///d:/Projects/logistics-website/frontend/e2e/79-feedback-14-10-extra-excel-inbound-converter.spec.ts).**
- ✅ **Chạy kiểm thử tự động, bắt screenshot minh chứng thực tế: `feedbacks/feedback_14_10_extra/screenshot_converter_verified.png`.**
- ✅ **Chạy đánh giá chéo qua `node scripts/e2e-auditor.mjs` (đảm bảo $\ge$ 40/50 điểm).**
- ✅ **Kiểm tra biên dịch TypeScript frontend (`npx tsc --noEmit`) và build Next.js.**
- ✅ **Chạy ghi nhận biên niên sử: `npm run todo:record feedback_14_10_extra` để sinh `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md`.**

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

### Hình ảnh minh chứng đã lưu trữ (2 tệp):
- 📸 **image.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_extra/image.png)
- 📸 **screenshot_converter_verified.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_extra/screenshot_converter_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/e2e/79-feedback-14-10-extra-excel-inbound-converter.spec.ts` | Frontend (Next.js) |
| 2 | `feedbacks/feedback_14_10_extra/screenshot_converter_verified.png` | Source |
| 3 | `docs/SYSTEM_TIMELINE.md` | Documentation |
| 4 | `frontend/src/features/warehouse/lib/vietnam-provinces.ts` | Frontend (Next.js) |
| 5 | `frontend/src/features/warehouse/lib/dispatch-excel-converter.ts` | Frontend (Next.js) |
| 6 | `feedbacks/feedback_14_10_extra/mẫu chuẩn của phần mềm.xlsx` | Source |
| 7 | `frontend/src/app/dashboard/warehouse/excel-converter/page.tsx` | Frontend (Next.js) |
| 8 | `frontend/src/features/warehouse/components/warehouse-excel-import-modal.tsx` | Frontend (Next.js) |
| 9 | `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Frontend (Next.js) |
| 10 | `frontend/src/hooks/use-nav.ts` | Frontend (Next.js) |
| 11 | `frontend/src/features/warehouse/components/warehouse-editable-grid.tsx` | Frontend (Next.js) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedbacks/feedback_14_10_extra/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
