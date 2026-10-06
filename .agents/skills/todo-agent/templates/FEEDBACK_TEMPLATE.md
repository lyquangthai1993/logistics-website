# Feedback DD/MM — [Tên tóm tắt nghiệp vụ phản hồi]

> **Thời gian ghi nhận**: DD/MM/YYYY  
> **Người báo cáo**: [Tên người báo cáo / Vai trò: Thủ kho / Điều phối / Quản lý đội xe]  
> **Màn hình liên quan**: [Đường dẫn màn hình hoặc module, VD: Quản lý Nhập kho ➔ Chi tiết chuyến xe]  
> **Tài liệu tham chiếu**: `/leader` Business Rules, `IMPLEMENT_STATUS_TRIP_AND_ORDER.md`, [`.agents/rules/ui-compact-density.md`](file:///d:/Projects/logistics-website/.agents/rules/ui-compact-density.md)  
> **Ảnh minh chứng đính kèm**: [`screenshot_01.png`](./screenshot_01.png)  

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Tình huống vận hành thực tế
- [Mô tả chi tiết câu chuyện thực tế xảy ra tại kho bãi hoặc điều phối]
- [Trích dẫn câu nói hoặc yêu cầu cụ thể của người dùng]

### 2. Quy chuẩn nghiệp vụ mới cần đạt
1. **[Quy tắc 1]**: [Mô tả quy tắc]
2. **[Quy tắc 2]**: [Mô tả quy tắc]

---

## 🔍 Tổng hợp các điểm chưa đúng trên hệ thống & Điểm nghẽn cần khắc phục

1. **[Điểm nghẽn / Lỗi 1]**:
   - Hiện trạng: [Mô tả lỗi hoặc sự bất tiện hiện tại]
   - Nguyên nhân gốc rễ (RCA): [Tại sao bị lỗi, file nào gây ra]
   - Hướng khắc phục: [Cách sửa chuẩn]

2. **[Điểm nghẽn / Lỗi 2]**:
   - Hiện trạng: ...
   - Nguyên nhân gốc rễ (RCA): ...
   - Hướng khắc phục: ...

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Phân hệ Cơ sở dữ liệu & Migrations (nếu có)
- [ ] **Tạo migration mới**: [Mô tả trường cần thêm/sửa, đảm bảo an toàn dữ liệu].

### 2. Backend (`backend/`)
- [ ] **Cập nhật DTO**: [`backend/src/.../dto/...ts`] [Mô tả trường và validation].
- [ ] **Xử lý Service Logic**: [`backend/src/.../...service.ts`] [Mô tả luồng xử lý].
- [ ] **Bổ sung Controller & Swagger**: [`backend/src/.../...controller.ts`].

### 3. Frontend (`frontend/`)
- [ ] **Cập nhật giao diện**: [`frontend/src/.../...tsx`]:
  - Đảm bảo chuẩn Compact Density: Card `p-1`, Modal `p-2`, Gap `gap-1.5` đến `gap-2`.
  - Triệt tiêu hoàn toàn biểu tượng trùng lặp và thuật ngữ kỹ thuật thừa.
- [ ] **Tối ưu Cache TanStack Query v5**: Áp dụng optimistic updates, refetch đúng query keys.

### 4. Kiểm thử & Nghiệm thu
- [ ] **Kiểm tra biên dịch & Linting**:
  - Backend: `npm run lint --prefix backend` & `npm run build --prefix backend` PASS (0 errors).
  - Frontend: `npx --prefix frontend tsc --noEmit` & `npm run build --prefix frontend` PASS (0 errors).
- [ ] **Kiểm thử hồi quy E2E Playwright**: [Chạy test suite và xác nhận pass 100%].
- [ ] **Cập nhật trạng thái**: Đánh dấu toàn bộ checklist thành `[x]`.
