# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_01_11_TASK_111_SUPER_ADMIN_LOGIN_AS] — 📋 TODO: Tính Năng Super Admin "Login As" — Đóng Vai Tài Khoản Người Dùng Tại Thanh Navbar & Bảng Người Dùng (Task #111)

> **Thời gian nghiệm thu**: 01/11/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (10/10 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý vận hành)  
> **Phạm vi tác động**: Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"đưa cái login as này vào thanh navbar đi, để trên header chiếm diện tích quá"*

Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Task 4 (Engineer - Triển khai Backend API `login-as`)**: Bổ sung `loginAs` trong `backend/src/auth/auth.service.ts` và endpoint `POST /api/v1/auth/login-as/:userId` + `POST /api/v1/auth/login-as` trong `backend/src/auth/auth.controller.ts` với `@Roles(RoleEnum.SUPER_ADMIN)` và `@UseGuards(AuthGuard('jwt'), RolesGuard)`.**
  * 📍 File: `backend/src/auth/auth.service.ts`
  * 📍 File: `backend/src/auth/auth.controller.ts`

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Task 5 (Engineer - Nâng cấp `useAuthStore` & `tokenManager` hỗ trợ Impersonation)**: Lưu và khôi phục phiên `impersonator` trong `frontend/src/stores/use-auth-store.ts` và `frontend/src/lib/token-manager.ts`, bổ sung API helper `loginAsUser(userId)` trong `frontend/src/features/users/api/service.ts` và hỗ trợ `Authorization` header override trong `frontend/src/lib/api-client.ts`.**
  * 📍 File: `frontend/src/stores/use-auth-store.ts`
  * 📍 File: `frontend/src/lib/token-manager.ts`
  * 📍 File: `frontend/src/features/users/api/service.ts`
  * 📍 File: `frontend/src/lib/api-client.ts`

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Task 1 (PM - Đặc tả `TODO.md`)**: Khởi tạo tài liệu `feedbacks/feedback_01_11_task_111_super_admin_login_as/TODO.md` với đầy đủ thiết kế kiến trúc, kịch bản E2E và 10 Edge Cases.**
- ✅ **Task 8 (QA - Viết & Chạy E2E Test Tầng 1 trên Localhost)**: Xây dựng và chạy `frontend/e2e/111-super-admin-login-as.spec.ts` kiểm chứng toàn trình: Super Admin đăng nhập ➔ Mở bộ chọn `Đóng vai (Login as)` trên thanh Navbar bên trái hoặc bảng `/dashboard/users` ➔ Đóng vai `warehouse_hcm` ➔ Kiểm tra chuyển sang giao diện Thủ kho HCM, hiển thị trạng thái `Đang đóng vai` trong thanh Navbar ➔ Kiểm tra non-admin không gọi được API `login-as` (403 Forbidden) ➔ Bấm `Thoát đóng vai` quay về Super Admin tức thì; chạy `node scripts/e2e-auditor.mjs frontend/e2e/111-super-admin-login-as.spec.ts` đạt 50/50 điểm.**
- ✅ **Task 10 (QA & Vận hành - Chạy E2E Test Tầng 2 trên Railway Cloud Dev & Ghi Biên niên sử)**: Kiểm tra triển khai Railway Cloud Dev, chụp ảnh bằng chứng `screenshot_01_verified.png`, và chạy `npm run todo:record feedback_01_11_task_111_super_admin_login_as`.**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).
- **Môi trường Dev Live (Primary - Railway Cloud)**:
  * Frontend: `https://frontend-tms-core-dev.up.railway.app`
  * Backend: `https://backend-tms-core-dev.up.railway.app`
  * Swagger API Docs: `https://backend-tms-core-dev.up.railway.app/docs`
- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health` -> HTTP 200 OK.

### Hình ảnh minh chứng đã lưu trữ (1 tệp):
- 📸 **screenshot_01_verified.png**: [Xem hình ảnh](./screenshot_01_verified.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/auth/auth.service.ts` | Backend (NestJS) |
| 2 | `backend/src/auth/auth.controller.ts` | Backend (NestJS) |
| 3 | `frontend/src/stores/use-auth-store.ts` | Frontend (Next.js) |
| 4 | `frontend/src/lib/token-manager.ts` | Frontend (Next.js) |
| 5 | `frontend/src/features/users/api/service.ts` | Frontend (Next.js) |
| 6 | `frontend/src/lib/api-client.ts` | Frontend (Next.js) |
| 7 | `TODO.md` | Source |
| 8 | `feedbacks/feedback_01_11_task_111_super_admin_login_as/TODO.md` | Source |
| 9 | `frontend/e2e/111-super-admin-login-as.spec.ts` | Frontend (Next.js) |
| 10 | `frontend/src/components/layout/app-sidebar.tsx` | Frontend (Next.js) |
| 11 | `frontend/src/components/layout/impersonation-control.tsx` | Frontend (Next.js) |
| 12 | `frontend/src/features/users/components/users-table/cell-action.tsx` | Frontend (Next.js) |
| 13 | `frontend/src/proxy.ts` | Frontend (Next.js) |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../../docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
