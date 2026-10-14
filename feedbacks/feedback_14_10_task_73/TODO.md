# Task Checklist: Feedback 14/10 (Task #73) — Hiển Thị Nội Dung Cột Tỉnh/TP Tại Ô "GIAO ĐẾN" Trên Tem Nhận Diện Hàng Hóa A4

> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】  
> **Thời gian báo cáo**: 14/10/2026 14:20:19  
> **Mục tiêu**: Khi in hoặc xem tem nhận diện hàng hóa A4 (`PalletLabelA4Modal`), ô "GIAO ĐẾN" (vùng khoanh đỏ trên tem) bắt buộc phải hiển thị nội dung cột Tỉnh/TP của đơn hàng (thay vì lấy địa chỉ chi tiết số nhà/đường phố như cũ).

---

## 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### 1. Phản hồi thực tế từ người dùng
> *"ô khoanh đỏ này sẽ là nội dung của cột tỉnh/tp của đơn hàng. sửa lại nhé"*

Kèm hình ảnh minh chứng: `feedbacks/feedback_14_10_task_73/screenshot_01.jpg` hiển thị popup modal **Xem & In Tem Nhận Diện Hàng Hóa A4**.  
Vùng khoanh đỏ tại dòng `GIAO ĐẾN :` đang hiển thị địa chỉ chi tiết: `67 NGUYỄN TẤT THÀNH, P. 13, Q. 4`.

### 2. Nguyên nhân gốc rễ (RCA)
Trong `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`:
- Biến `destinationDisplay` (hiển thị trên giao diện xem trước) và `itemDestDisplay` (khi in qua iframe HTML) hiện có logic:
  ```typescript
  const destinationDisplay = (
    currentItem?.originalDestination?.trim() ||
    currentItem?.province?.trim() ||
    currentItem?.destinationHubEntity?.city?.trim() ||
    currentItem?.destinationHub?.trim() ||
    currentItem?.deliveryAddress?.trim() ||
    '—'
  ).toUpperCase();
  ```
- Khi đơn hàng được nạp vào modal, `originalDestination` hoặc `deliveryAddress` lưu địa chỉ giao hàng chi tiết (số nhà, tên đường, phường, quận). Do `originalDestination` được đặt trước `province`, giá trị Tỉnh/Thành phố (`province`) không bao giờ được ưu tiên hiển thị.
- Thủ kho và nhân viên dán tem vận chuyển liên Hub cần nhìn thấy rõ Tỉnh/TP đến (ví dụ: `TP. HỒ CHÍ MINH`, `HÀ NỘI`, `ĐÀ NẴNG`) bằng cỡ chữ to in đậm ở ô `GIAO ĐẾN` để phân loại hàng lên đúng tuyến xe liên tỉnh, chứ không cần địa chỉ số nhà chi tiết trên tem Pallet khổ lớn.

---

## 📋 Checklist Triển Khai Thực Thi

### 💻 Phân hệ Frontend (Next.js 15 App Router)
- [x] Cập nhật file `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`:
  - [x] Đảo thứ tự ưu tiên: Ưu tiên trường `province` (hoặc `destinationCity` / `destinationProvince`) lên đầu tiên cho `destinationDisplay` và `itemDestDisplay`.
  - [x] Hỗ trợ hàm trích xuất fallback thông minh: nếu `province` trống nhưng `deliveryAddress` / `originalDestination` có chứa tên Tỉnh/TP ở cuối chuỗi địa chỉ thì trích xuất hoặc fallback an toàn.
  - [x] Kiểm tra type check: `npx --prefix frontend tsc --noEmit`.

### 🧪 Kiểm Thử Tự Động E2E & Bằng Chứng Nghiệm Thu
- [x] Tạo file test Playwright: `frontend/e2e/73-feedback-14-10-task-73-pallet-label-province.spec.ts`.
- [x] Kiểm tra modal Xem & In Tem Nhận Diện Hàng Hóa A4 hiển thị đúng Tỉnh/TP tại dòng "GIAO ĐẾN".
- [x] Chạy test và chụp ảnh bằng chứng nghiệm thu `screenshot_01_verified.png`.
- [x] Chạy đánh giá chéo qua `node scripts/e2e-auditor.mjs` (Đạt 50/50 điểm 🟢 PASS).

### 📜 Biên Niên Sử Kỹ Thuật & Cập Nhật Database
- [x] Sinh biên bản kỹ thuật `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md` qua `npm run todo:record feedback_14_10_task_73`.
- [x] Cập nhật Task #73 thành `COMPLETED` trong database `telegram_tasks`.
