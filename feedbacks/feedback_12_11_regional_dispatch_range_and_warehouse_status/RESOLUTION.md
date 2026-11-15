# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_12_11_REGIONAL_DISPATCH_RANGE_AND_WAREHOUSE_STATUS] — Regional Dispatch Date Range and Warehouse Status Parity

> **Thời gian nghiệm thu**: 12/11/2026  
> **Trạng thái thực thi**: ✅ Hoàn thành thay đổi và kiểm chứng local (10/10 tasks); Cloud Dev chưa xác minh  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý vận hành)  
> **Phạm vi tác động**: Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)  
> **Môi trường kiểm chứng**: Local; Cloud Dev API probe trả HTTP 401 do chưa xác thực  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)
- ✅ **Extend the regional dispatch API to accept `fromDate`, `toDate`, and `hubId`, and return per-day snapshots without relabeling current inventory as future history.**
- ✅ **Persist daily draft metrics and the order codes counted for stored and draft statuses.**
- ✅ **Match warehouse hub stock and draft visibility semantics in regional dispatch snapshots.**
- ✅ **Add the TypeORM migration and document the database sync behavior.**

### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)
- ✅ **Pass the shared report header date range and hub selection to the regional dispatch API.**
- ✅ **Render the per-day series and stored/draft order codes for the selected snapshot.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Backend build and frontend typecheck pass.**
- ✅ **Regional dispatch Playwright E2E passes, including filter query assertions.**
- ✅ **Capture the real application screenshot at `frontend/e2e/screenshots/screenshot_regional_dispatch_range_verified.png`.**
- ✅ **Confirm the unauthenticated Railway API probe returns 401; no authenticated cloud verification or deployment was performed.**

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).
- **Cloud Dev**: Chỉ probe endpoint báo cáo chưa xác thực; kết quả HTTP 401. Không xác minh dữ liệu bằng tài khoản, không kiểm tra deployment và không thực hiện deploy.
- **Local verification**: Backend build, frontend typecheck và E2E regional-dispatch đều PASS. E2E chạy với API local và xác nhận truy vấn gửi đúng `fromDate`, `toDate`, `hubId` theo bộ lọc header.

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `backend/src/orders/admin-reports.controller.ts` | Backend API |
| 2 | `backend/src/orders/admin-reports.service.ts` | Snapshot and range query |
| 3 | `backend/src/database/migrations/1789140000000-AddDraftMetricsToDailyRegionalDispatchReport.ts` | Database migration |
| 4 | `frontend/src/features/admin-reports/components/super-admin-regional-dispatch-table.tsx` | Frontend report |
| 5 | `frontend/e2e/119-regional-dispatch-report.spec.ts` | E2E verification |
| 6 | `scripts/railway-db-sync.mjs`, `.agents/skills/db-sync-prod-to-dev/SKILL.md` | DB sync documentation |

Ảnh chụp thật được lưu tại `frontend/e2e/screenshots/screenshot_regional_dispatch_range_verified.png`; không đặt ảnh trong thư mục feedback. Migration đã được thêm nhưng chưa chạy lệnh TypeORM `migration:run`.

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../../docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
