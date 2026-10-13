# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_05_10] — Feedback 05/10 — Checklist

> **Thời gian nghiệm thu**: 07/10/2026  
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (42/42 tasks)  
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý vận hành)  
> **Phạm vi tác động**: Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)  
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

### Phản hồi thực tế từ người dùng:
> *"*Architectural Note (Outbound Customer Info)"*

Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

### 🗄️ Phân hệ Cơ sở dữ liệu & Migrations
- ✅ **"Lưu nháp" never persisted anything: all 3 buttons (outbound note, transfer step 1, transfer step 3) only showed a success toast — no API, no DB row → a draft could never appear.**
- ✅ **Old board (before fix 1): paginated **orders** (20/page, incl. stored goods) then hid orders without an outbound trip on the client → many pages empty; date filter on order dates; token read from localStorage/cookie and errors swallowed silently (Render dev cold start → empty board without any message) → "lâu lâu mới hiện".**
- ✅ **Only dispatched trips (with a dispatch invoice) existed → board could only ever show "Đã xử lý".**
- ✅ **Fix 1 (05/10) solved the empty/intermittent part (trip-level endpoint, `tokenManager`, error toast) but not drafts.**
- ✅ **DB (additive, approved): `trip.quantityAllocated int NULL` — migration `1789040000000-AddQuantityAllocatedToTrip`.**
- ✅ **Backend: `POST /v1/warehouse/outbound/draft` (allocates/keeps SD code, planned lines on `trip` rows status `PENDING`, origin stop `PENDING`, stock checked but not deducted); `DELETE /v1/warehouse/outbound/drafts/:tripCode` ("Hủy nháp"); `POST /outbound/confirm` accepts `draftTripCode` (reuses the SD code, replaces planned lines, deducts stock → "Đã xử lý").**
- ✅ **Backend: `GET /v1/warehouse/outbound-trips` = dispatched + drafts, `status` (`PENDING`/`COMPLETED`) + `type` filters, all counters from the same query.**
- ✅ **Frontend board: tabs `Tất cả / Chờ xử lý / Đã xử lý` (Đã chốt loại bỏ hoàn toàn sub-filter `Xuất khách / Luân chuyển` theo yêu cầu người dùng); draft rows → "Tiếp tục" (reopen note) / "Hủy nháp"; batch "Xác nhận xuất" on selected drafts; printing only for dispatched trips; sub-row figures from the trip lines.**
- ✅ **Frontend: real "Lưu nháp" on the outbound note and transfer step 3 (step 1 disabled until goods are selected); inbound board ignores outbound/transfer draft trips of the same hub.**
- ✅ **Triệt tiêu sub-filter: Cập nhật cả 2 màn hình Nhập kho và Xuất kho chỉ dùng duy nhất các tab trạng thái TRIP (`Tất cả / Chờ xử lý / Đã xử lý`), loại bỏ hoàn toàn các nút `Xuất khách / Khách gửi / Luân chuyển`.**
- ✅ **RBAC matrix updated (v1.7).**
- ✅ **Verify: backend + frontend `tsc --noEmit` pass.**

### 🧪 Kiểm thử Tự động & Nghiệm thu
- ✅ **Run migration on DB**: Migration `1789040000000-AddQuantityAllocatedToTrip` confirmed executed on Neon DB (`trip.quantityAllocated integer NULL`).**
- ✅ **E2E Automation on Dev**: Playwright test suite `frontend/e2e/27-feedback-05-10-outbound-draft-and-parity.spec.ts` executed and PASSED 100% on dev domain (API counter parity, draft lifecycle create/cancel, UI board tabs, draft actions, 0 console errors).**
- ✅ **Git Workflow Completed**
- ✅ **UI Verification & E2E Testing**
- ✅ **Branch Alignment & Deployment**: Feature branches merged into `dev` and `master`, fully verified live on Dev and Production domains (`https://logistics-website-frontend-kappa.vercel.app`).**

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

### Hình ảnh minh chứng đã lưu trữ (6 tệp):
- 📸 **06_split_shipment_inbound_aggregation_master.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/06_split_shipment_inbound_aggregation_master.png)
- 📸 **07_split_shipment_inbound_aggregation_expanded.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/07_split_shipment_inbound_aggregation_expanded.png)
- 📸 **08_split_shipment_inbound_waybill_detail_modal.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/08_split_shipment_inbound_waybill_detail_modal.png)
- 📸 **filter_outbound_wrong.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/filter_outbound_wrong.png)
- 📸 **split_shipment_inbound_aggregation_issue.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/split_shipment_inbound_aggregation_issue.png)
- 📸 **tem_nhan_dien_sai_kho.png**: [Xem hình ảnh](file:///D:/Projects/logistics-website/feedback_05_10/tem_nhan_dien_sai_kho.png)

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |
|---|---|---|
| 1 | `frontend/e2e/27-feedback-05-10-outbound-draft-and-parity.spec.ts` | Frontend (Next.js) |
| 2 | `backend/src/orders/warehouse.service.ts` | Backend (NestJS) |
| 3 | `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Frontend (Next.js) |
| 4 | `frontend/e2e/29-feedback-05-10-split-shipment-inbound-aggregation.spec.ts` | Frontend (Next.js) |
| 5 | `docs/feedback_05_10_split_shipment_inbound_aggregation.md` | Documentation |
| 6 | `docs/feedback_evidence/05_10/06_split_shipment_inbound_aggregation_master.png` | Documentation |
| 7 | `docs/feedback_evidence/05_10/07_split_shipment_inbound_aggregation_expanded.png` | Documentation |
| 8 | `docs/feedback_evidence/05_10/08_split_shipment_inbound_waybill_detail_modal.png` | Documentation |

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  
> Tài liệu này cùng với [`TODO.md`](file:///D:/Projects/logistics-website/feedback_05_10/TODO.md) và [`docs/SYSTEM_TIMELINE.md`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
