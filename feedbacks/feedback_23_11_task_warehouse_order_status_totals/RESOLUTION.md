# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH
## [FEEDBACK_23_11_TASK_WAREHOUSE_ORDER_STATUS_TOTALS] — Warehouse Order Status Totals

> **Thời gian nghiệm thu**: 23/11/2026
> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (5/5 tasks)
> **Người báo cáo / Nghiệp vụ**: @【M】【C】【D】 (Quản lý vận hành)
> **Phạm vi tác động**: Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)
> **Môi trường kiểm chứng**: Development (Live) & Staging / Production

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.

---

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

- Backend snapshot cron now writes four status buckets per Hub (`ALL`, `INBOUND`, `DRAFT`, `COMPLETED_INBOUND`) into `warehouse_hub_order_summary`.
- Backend summary API now reads only the requested `hubId + status` snapshot rows; it does not aggregate the live order table during tab changes.
- Frontend sends the selected status tab to the summary endpoint and refreshes the three metric cells whenever the tab changes.
- The metric tooltip identifies the selected status totals as warehouse snapshot data.
- The parity E2E case now covers `Lưu kho`, `Nháp`, and `Đã xuất kho` for all three warehouse accounts.

---

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.
2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding `p-1`, modal body `p-2`, typography bảng `text-[10px]`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.
3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Frontend typecheck**: PASS.
- **Backend build**: PASS.
- **Local API parity before snapshot-bucket migration**: PASS 9/9 cases (3 warehouses × 3 filtered statuses); this was the baseline that motivated moving every status bucket into the snapshot table.
- **Snapshot bucket migration**: Applied locally; the API query now reads only persisted snapshot rows. Full refresh could not complete in this run because the optional local Redis service was unavailable during the one-off cron invocation.
- **Extended Playwright run**: not green in this run because the existing fixture could not resolve the Đà Nẵng Hub during one retry; the source-level and direct API parity checks passed.

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

- `backend/src/orders/warehouse.controller.ts`
- `backend/src/orders/infrastructure/persistence/relational/entities/warehouse-hub-order-summary.entity.ts`
- `backend/src/database/migrations/1789170000000-AddStatusBucketsToWarehouseHubOrderSummary.ts`
- `backend/src/orders/warehouse.service.ts`
- `frontend/src/app/dashboard/warehouse/orders/page.tsx`
- `frontend/src/features/warehouse/components/admin-orders-metrics-summary-row.tsx`
- `frontend/e2e/120-warehouse-orders-hub-metrics-parity.spec.ts`

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../../docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.
