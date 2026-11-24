# 🏆 BIÊN BẢN KỸ THUẬT & KẾT QUẢ KIỂM CHỨNG
## [FEEDBACK_23_11_TASK_119_REGIONAL_REPORT_TOOLTIP] — Sửa bộ lọc và tooltip báo cáo tình hình hàng hóa

> **Thời gian nghiệm thu**: 23/11/2026
> **Trạng thái thực thi**: ✅ Thay đổi đã merge và deploy Dev; Cloud E2E bị chặn tại bước đăng nhập API (7/7 đầu việc trong phạm vi đã hoàn tất)
> **Người báo cáo / Nghiệp vụ**: Super Admin report
> **Phạm vi tác động**: `/dashboard/admin/reports` — biểu đồ tình hình hàng hóa
> **Môi trường kiểm chứng**: Development (Railway Dev)

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"Nhưng tooltip hover vẫn hiện 'Đã xuất kho'."*

Tab lọc đã bỏ trạng thái “Đã xuất kho”, nhưng series này vẫn được giữ trong biểu đồ “Tất cả”. Tooltip Recharts vẫn liệt kê series khi rê chuột, nên formatter cần ẩn riêng mục này ở cả biểu đồ Tấn và m³ mà không làm thay đổi dữ liệu tổng.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Bỏ tab lọc “Đã xuất kho”, giữ số liệu đã xuất trong tab “Tất cả”.**
- ✅ **Ẩn “Đã xuất kho” khỏi tooltip của cả biểu đồ Tấn và m³.**
- ✅ **Bổ sung kiểm tra tổng số đổi theo “Lưu kho”, “Nháp”, “Tất cả” và kiểm tra tooltip của cả hai biểu đồ.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Local Playwright: `e2e/119-regional-dispatch-report.spec.ts` — 2/2 pass.**
- ✅ **E2E code audit — 50/50.**
- ✅ **Railway Dev: backend và frontend build `SUCCESS`, active deployment khớp latest, health 200/307.**
- ✅ **Xác nhận trên phiên Super Admin Dev đang mở: tab “Đã xuất kho” không còn; tooltip chỉ có “Lưu kho” và “Nháp”.**

---

## 3. 🛡️ Hành Vi Được Giữ Nguyên

1. **Dữ liệu báo cáo**: Không đổi API, query, snapshot hay nghiệp vụ phân miền.
2. **Tab “Tất cả”**: Vẫn bao gồm series “Đã xuất kho” trong tổng và biểu đồ.
3. **Tooltip**: Chỉ ẩn dòng “Đã xuất kho” khỏi tooltip của hai biểu đồ; không xóa series khỏi biểu đồ hoặc chú giải.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Local Playwright**: PASS 2/2 cho `e2e/119-regional-dispatch-report.spec.ts`.
- **E2E code audit**: PASS 50/50.
- **Cloud Playwright**: Chưa xác minh được do `POST /api/v1/auth/email/login` trên backend Dev trả HTTP 500. Backend runtime log chỉ ra duplicate primary key trong `AuthService.validateLogin`; chạy lại Cloud E2E sau khi lỗi API này được xử lý.
- **Kiểm tra UI Dev bằng phiên Super Admin đang đăng nhập**: Tab lọc “Đã xuất kho” không render; hover chart hiển thị “Lưu kho” và “Nháp”, không có “Đã xuất kho”.
- **Môi trường Dev Live (Primary - Railway Cloud)**:
  * Frontend: `https://frontend-tms-core-dev.up.railway.app`
  * Backend: `https://backend-tms-core-dev.up.railway.app`
  * Swagger API Docs: `https://backend-tms-core-dev.up.railway.app/docs`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health` -> HTTP 200 OK.

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

- `frontend/src/features/admin-reports/components/super-admin-regional-dispatch-table.tsx`
- `frontend/e2e/119-regional-dispatch-report.spec.ts`
- Root submodule pointers: `backend`, `frontend`
- `feedback_23_11_task_119_regional_report_tooltip/TODO.md`
- `docs/SYSTEM_TIMELINE.md`

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
