# 📜 LOGISTICS TMS — BIÊN NIÊN SỬ TIẾN HÓA HỆ THỐNG & DÒNG THỜI GIAN PHÁT TRIỂN

> **Tài liệu nguồn gốc & Cơ sở kiến trúc (System Ground Truth & Historical Ledger)**:
> File này ghi chép toàn bộ quá trình tiến hóa và trưởng thành của hệ thống Logistics TMS (Spider Express).
> Mọi AI Agent session mới khi bắt đầu làm việc ĐỀU CÓ THỂ ĐỌC file này để hiểu rõ:
> 1. Hệ thống đã trải qua những giai đoạn và bài toán thực tế nào.
> 2. Các tính năng và năng lực mới được bổ sung qua từng đợt cập nhật (Backend, Frontend, DB).
> 3. Các quy tắc bất biến (Invariants) cốt lõi đã được thiết lập để tránh làm sai hoặc tái phát lỗi cũ.
> 4. Bằng chứng kiểm thử (E2E specs, screenshots, verification audits) làm cơ sở tin cậy.

---

## 📊 BẢNG TỔNG HỢP MỐC PHÁT TRIỂN & TIẾN ĐỘ HOÀN THÀNH

| Mốc Thời Gian | Thư Mục Feedback | Tiêu Đề / Tính Năng Trọng Tâm | Tác Vụ | Trạng Thái | Bằng Chứng Nghiệm Thu |
|---|---|---|---|---|---|
| 19/10/2026 | `feedbacks/feedback_19_10_task_89` | Feedback 19/10 — Task 89: Cải Thiện Font Family Toàn... | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_19_10_task_89/RESOLUTION.md) |
| 19/10/2026 | `feedbacks/feedback_19_10_inbound_receipt_fix` | Feedback 19/10 — Bảo Toàn Danh Sách Đơn Hàng Lịch Sử Trên Phiếu Nhập Kho & Loại Bỏ Nút "In Phiếu Xe" Thừa | 2/2 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_19_10_inbound_receipt_fix/RESOLUTION.md) |
| 17/10/2026 | `feedbacks/feedback_17_10_extra` | 📋 Kế hoạch Thực thi & Báo cáo Tiến độ: Feedback 17/... | 6/6 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_17_10_extra/RESOLUTION.md) |
| 16/10/2026 | `feedbacks/feedback_16_10_task_87` | Feedback 16/10 — Task 87: Tính Năng Nhập Kho Tách Lẻ... | 34/34 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_16_10_task_87/RESOLUTION.md) |
| 16/10/2026 | `feedbacks/feedback_16_10_task_86` | Feedback 16/10 (Task #86) — Tự Động Loại Bỏ Thông Ti... | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_16_10_task_86/RESOLUTION.md) |
| 16/10/2026 | `feedbacks/feedback_16_10_task_85` | Feedback 16/10 Task #85 — Tinh gọn Thông tin & Tối ư... | 24/24 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_16_10_task_85/RESOLUTION.md) |
| 15/10/2026 | `feedbacks/feedback_15_10_task_88` | Feedback 15/10 (Task #88) — Chặn Tuyệt Đối '/dashboa... | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_15_10_task_88/RESOLUTION.md) |
| 15/10/2026 | `feedbacks/feedback_15_10_task_87` | Feedback 15/10 (Task #87) — Chuyển Hướng Đăng Nhập T... | 15/15 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_15_10_task_87/RESOLUTION.md) |
| 15/10/2026 | `feedbacks/feedback_15_10_task_86` | Feedback 15/10 (Task #86) — Tạm Thời Ẩn Nút Kính Lúp... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_15_10_task_86/RESOLUTION.md) |
| 15/10/2026 | `feedbacks/feedback_15_10_task_83` | Feedback 15/10 (Task #83) — Ẩn Nút "In Phiếu Nhập" K... | 26/26 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_15_10_task_83/RESOLUTION.md) |
| 15/10/2026 | `feedbacks/feedback_15_10_task_85` | Feedback 15/10 (Task #85) — Quét & Kiểm Định Toàn Di... | 19/19 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_15_10_task_85/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_65` | Feedback 14/10 (Task #65) — Khảo Sát Nghiệp Vụ TMS T... | 27/27 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_65/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_80` | Feedback 14/10 (Task #80) — Khóa Chặt & Cách Ly Đơn ... | 15/15 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_80/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_81` | Feedback 14/10 (Task #81) — Cơ Chế Mở Lại Chuyến Xe & Hoàn Tồn Kho Admin | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_81/RESOLUTION.md) |
| 14/10/2026 18:30:00 | `feedbacks/feedback_14_10_extra` | Feedback 14/10 (Extra) — Xây Dựng Công Cụ Chuyển Đổi Excel Điều Hành Sang File Chuẩn Nhập Kho | 16/16 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_extra/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_67` | Feedback 14/10 - Task #67: Cải Thiện Cơ Chế Reply Telegram Cho Task Cần Hỏi Ý Kiến | 7/7 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_67/RESOLUTION.md) |
| 14/10/2026 17:15:00 | `feedbacks/feedback_14_10_task_78` | Feedback 14/10 (Task #78) — Tự Động Hiển Thị Modal P... | 24/24 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_78/RESOLUTION.md) |
| 14/10/2026 16:55:00 | `feedbacks/feedback_14_10_task_77` | Feedback 14/10 (Task #77) — Khảo Sát & Chuẩn Hóa Cơ ... | 24/24 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_77/RESOLUTION.md) |
| 14/10/2026 15:10:00 | `feedbacks/feedback_14_10_task_76` | Feedback 14/10 (Task #76) — Bổ Sung & Chuẩn Hóa Thôn... | 29/29 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_76/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_73` | Task Checklist: Feedback 14/10 (Task #73) — Hiển Thị... | 10/10 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_73/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_71` | Feedback 14/10 (Task #71) — Cố Định Cột Mã Vận Đơn K... | 14/14 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_71/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_70` | Feedback 14/10 (Task #70) — Loại Bỏ Nút Mũi Tên Mở R... | 16/16 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_70/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_53` | Feedback 14/10 (Task #53) — Thay Thế Cột "ĐIỂM BỐC H... | 15/15 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_53/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_54` | Feedback 14/10 (Task #54) — Thiết Kế Đồng Bộ 2 Nút "... | 21/21 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_54/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_52` | Feedback 14/10 (Task #52) — Loại Bỏ Tiêu Đề "Kiểm Đế... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_52/RESOLUTION.md) |
| 14/10/2026 | `feedbacks/feedback_14_10_task_51` | Feedback 14/10 (Task #51) — Cho Phép Chọn Đơn Hàng N... | 14/14 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_14_10_task_51/RESOLUTION.md) |
| 13/10/2026 | `feedbacks/feedback_13_10_task_46` | Feedback 13/10 (Task #46) — Chuẩn hóa Nút "Tiếp tục"... | 22/22 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_13_10_task_46/RESOLUTION.md) |
| 13/10/2026 | `feedbacks/feedback_13_10_task_45` | Feedback 13/10 (Task 45) — Loại Bỏ Chức Năng Chọn Nh... | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_13_10_task_45/RESOLUTION.md) |
| 13/10/2026 | `feedbacks/feedback_13_10_task_41` | Feedback 13/10 (Task 41) — Bảo Toàn Thông Tin Đích Đ... | 10/10 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_13_10_task_41/RESOLUTION.md) |
| 13/10/2026 | `feedbacks/feedback_13_10_task_38` | Feedback 13/10 (Task 38) — Chuẩn hóa Hiển thị Thông ... | 15/15 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_13_10_task_38/RESOLUTION.md) |
| 13/10/2026 | `feedbacks/feedback_13_10_task_37` | Feedback 13/10 (Task #37) — Khóa Quyền Thao Tác Đơn ... | 22/22 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_13_10_task_37/RESOLUTION.md) |
| 13/10/2026 | `feedback_13_10` | Feedback 13/10 — Chuẩn Hóa Cấu Trúc 15 Cột Báo Cáo E... | 8/8 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 12/10/2026 20:36 | `feedback_12_10_task_33` | Feedback 12/10 (Task 33) — Tối Ưu Độ Sáng & Tinh Chỉ... | 7/7 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 12/10/2026 | `feedback_12_10` | Feedback 12/10 — Chuẩn Hóa Nhận Diện Thương Hiệu Spi... | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 - 18:22 | `feedback_09_10_task_20` | Feedback 09/10 (Task 20) — Tích Hợp Nút Xuất Báo Cáo... | 18/18 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 - 17:31 | `feedback_09_10_task_18` | Feedback 09/10 (Task 18) — Tối ưu Vị trí Nút Hành độ... | 26/26 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_16` | Feedback 09/10 (Task 16) — Chuẩn Hóa Hiển Thị Tỉnh/T... | 7/7 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_13` | Feedback 09/10 (Task 13) — Tách Cột Thông Tin Hàng H... | 27/27 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_10` | Feedback 09/10 Task 10 — Ràng Buộc Nghiệp Vụ Cột Ngà... | 21/21 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_9` | Feedback 09/10 Task 9 — Chuẩn Hóa Toàn Diện Bảng Đơn... | 18/18 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_8` | Feedback 09/10 Task 8 — Hoàn Thiện Quy Chuẩn Bảng Đơ... | 16/16 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_7` | Feedback 09/10 Task 7 — Tái Cấu Trúc Bảng Dữ Liệu Đơ... | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_6` | Feedback 09/10 Task 6 — Loại bỏ Cột Trạng thái Đơn h... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 (14:12) | `feedback_09_10_task_5` | Feedback 09/10 (Task 5) — Khắc phục lỗi Tạo mới Tài ... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10` | Feedback 09/10 — Phân Định Tuyệt Đối Quy Trình Tác N... | 9/9 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 09/10/2026 | `feedback_09_10_task_4` | Feedback 09/10 (Task 4) — Loại Bỏ Nút "Xem Tài Khoản... | 3/3 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 08/10/2026 | `release_v1.0.0` | **Release v1.0.0 — Milestone Chốt Toàn Bộ Flow Nghiệp Vụ Cốt Lõi Vận Hành TMS** | 7 Flows | ✅ DONE (100%) | [RELEASE_v1.0.0_BUSINESS_FLOWS.md](RELEASE_v1.0.0_BUSINESS_FLOWS.md) |
| 07/10/2026 | `feedback_07_10_task_29` | Feedback 07/10 Task 29 — Chuẩn Hóa Logic Mặc Định Nh... | 11/11 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_27` | Feedback 07/10 Task 27 — Khắc Phục Lỗi Mặc Định Nhập... | 11/11 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_24` | Feedback 07/10 Task 24 — Tùy biến Hình thức & Địa ch... | 57/57 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_22` | Feedback 07/10 Task 22 — Mở Rộng Kích Thước & Tối Ưu... | 12/12 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 (13:49) | `feedback_07_10_task_21` | Feedback 07/10 Task 21 — Khắc phục Lỗi Không Hiển th... | 30/30 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_12` | Feedback 07/10 Task 12 — Chuẩn Hóa Quản Lý Tồn Kho &... | 19/19 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_11` | Tối ưu Giao diện Bảng Kê Xuất Kho: Loại Bỏ Cột Trạng Thái Thừa & Compact Density | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10_task_10` | Chuẩn Hóa Cột Kho Đích & Gán Đơn Lưu Kho Sẵn Có Lên Chuyến Xuất Kho | 18/18 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 07/10/2026 | `feedback_07_10` | Chuẩn Hóa Cột Kho Đích / Nơi Giao & Đồng Bộ Phiếu Xuất Kho | 32/32 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 06/10/2026 | `feedback_06_10` | Bốc Hàng Dọc Đường (Roadside Pickup) & Gán Vào Chuyến Xe Đang Chạy | 22/22 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 05/10/2026 | `feedback_05_10` | Gom Hàng Inbound, Chuyến Xe Nháp, Tái Sử Dụng Mã Chuyến & Bộ Lọc Trạng Thái | 42/42 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 04/10/2026 | `feedback_04_10` | Tách Rời Kiểm Đếm Inbound & Chuyến Xe, Excel Parser & Chuẩn Hóa UTC | 13/13 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |
| 18/08/2026 | `feedback_17_8` | Chuẩn Hóa Toàn Diện TanStack Table v8, Phân Trang, RBAC & Mail Simulation | 33/33 | ✅ DONE (100%) | [RESOLUTION.md](../feedbacks/feedback_) |

---

## 🕒 BIÊN NIÊN SỬ CHI TIẾT THEO DÒNG THỜI GIAN (REVERSE CHRONOLOGICAL)

### 🚀 [FEEDBACK_19_10_TASK_89] — Feedback 19/10 — Task 89: Cải Thiện Font Family Toàn Dự Án, Đảm Bảo Hỗ Trợ 100% Tiếng Việt Cho Tất Cả Theme (19/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: Quản lý Vận hành TMS (@Thai) & Team Lead Nghiệp vụ TMS (`/leader`)
- **Phạm vi**: Toàn bộ hệ thống giao diện TMS (Toàn bộ 10 Theme: Vercel, Claude, Discord, Supabase, Mono, Notebook, Light Green, Zen, Astro Vista, WhatsApp) • Cấu hình nạp Google Fonts & Next.js font loader ([`frontend/src/components/themes/font.config.ts`](frontend/src/components/themes/font.config.ts)) • Stylesheet điều phối font toàn cục ([`frontend/src/styles/theme.css`](frontend/src/styles/theme.css) & [`frontend/src/styles/globals.css`](frontend/src/styles/globals.css)) • 10 file cấu hình theme chi tiết ([`frontend/src/styles/themes/*.css`](frontend/src/styles/themes/)) • Root Layout & Document HTML lang attribute ([`frontend/src/app/layout.tsx`](frontend/src/app/layout.tsx)) • Modal in tem nhãn kho vận A4 ([`frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`](frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)) • Các mẫu Email thông báo của Backend ([`backend/src/mail/mail-templates/*.hbs`](backend/src/mail/mail-templates/))
- **Năng lực & Tính năng mới**:
  * **Backend**: Khảo sát và chuẩn hóa font-family trong toàn bộ các template email Handlebars tại `backend/src/mail/mail-templates/` sang chuỗi font an toàn hỗ trợ 100% tiếng Việt trên mọi email client: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`; Cập nhật mẫu email kích hoạt tài khoản tại `backend/src/mail/mail-templates/activation.hbs` (thay thế `font-family:arial` bằng chuỗi font tiếng Việt chuẩn).; Cập nhật mẫu email xác nhận đổi email tại `backend/src/mail/mail-templates/confirm-new-email.hbs` (thay thế `font-family:arial` bằng chuỗi font tiếng Việt chuẩn)....
  * **Frontend**: Tái cấu trúc và tối ưu hóa file nạp font `frontend/src/components/themes/font.config.ts`; Sửa dứt điểm lỗi Circular Dependency và chuẩn hóa cấu hình font trong toàn bộ 10 Theme CSS; Sửa lỗi ghi đè `--font-sans: initial;` trong `frontend/src/styles/theme.css`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_vietnamese_font_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_19_10_task_89/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_19_10_task_89/TODO.md)

### 🚀 [FEEDBACK_19_10_INBOUND_RECEIPT_FIX] — Feedback 19/10 — Bảo Toàn Danh Sách Đơn Hàng Lịch Sử Trên Phiếu Nhập Kho & Loại Bỏ Nút "In Phiếu Xe" Thừa (19/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (2/2 việc)
- **Báo cáo bởi**: @User / Vận hành Kho Logistics TMS Spider Express
- **Phạm vi**:
  * **Backend**: [`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts) — Nâng cấp `getInboundTrips` join quan hệ `order.inventoryTransactions` để cung cấp lịch sử số lượng kiện thực nhận tại Hub.
  * **Frontend Page**: [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx) — Bảo toàn 100% đơn hàng khi chuyến xe hoàn thành (`grp.status === 'COMPLETED'`), bổ sung hàm `getOrderTripInboundQty` đọc số lượng kiện nhập từ transaction `INBOUND`.
  * **Frontend Modal**: [`frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) — Loại bỏ hoàn toàn nút "In phiếu xe" ở footer modal chi tiết chuyến xe.
  * **Kiểm thử E2E**: [`frontend/e2e/91-feedback-19-10-inbound-receipt-historical-orders.spec.ts`](file:///frontend/e2e/91-feedback-19-10-inbound-receipt-historical-orders.spec.ts)
- **Năng lực & Tính năng mới**:
  * **Bảo toàn nguyên vẹn chứng từ Phiếu Nhập Kho (Goods Receipt Note Invariant)**: Đơn hàng sau khi nhập kho vào chuyến (ví dụ chuyến `SD62` nhập 6 đơn, 232 kiện) nếu sau đó được xuất kho trung chuyển tiếp đi nơi khác (`SD94`) thì phiếu in nhập kho của chuyến xe ban đầu vẫn giữ trọn vẹn 6 đơn (232 kiện) mà không bị mất hoặc thu hẹp theo tồn khả dụng hiện tại.
  * **Loại bỏ nút in gây hiểu nhầm**: Xóa bỏ nút "In phiếu xe" tại modal chi tiết chuyến xe, tập trung duy nhất vào nút "In phiếu nhập" trên bảng điều hành và phiếu in chuẩn A4.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% trên cả 2 môi trường Railway Cloud Dev và Production
  * Minh chứng hình ảnh: [`feedbacks/feedback_19_10_inbound_receipt_fix/screenshot_01_verified.png`](../feedbacks/feedback_19_10_inbound_receipt_fix/screenshot_01_verified.png)
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_19_10_inbound_receipt_fix/RESOLUTION.md)

### 🚀 [FEEDBACK_17_10_EXTRA] — 📋 Kế hoạch Thực thi & Báo cáo Tiến độ: Feedback 17/10 Extra (Warehouse Grid, Trip Board & Outbound Receipt) (17/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (6/6 việc)
- **Năng lực & Tính năng mới**:
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: 1.png, 2.png, 2_1.png, 2_3.png, 3.png, screenshot_01_task1_enter_tab_search_verified.png, screenshot_02_task2_inbound_trip_board_waybills_verified.png, screenshot_03_task2_outbound_trip_board_waybills_verified.png, screenshot_04_task3_outbound_receipt_destination_verified.png, screenshot_05_task6_draft_trip_save_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_17_10_extra/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_17_10_extra/TODO.md)
### 🚀 [FEEDBACK_16_10_TASK_87] — Feedback 16/10 — Task 87: Tính Năng Nhập Kho Tách Lẻ Từng Đơn Trong Trip Chờ Xử Lý & Xuất Kho Tức Thì (16/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (34/34 việc)
- **Báo cáo bởi**: Quản lý Vận hành TMS (@Thai) & Team Lead Nghiệp vụ TMS (`/leader`)
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết Chuyến xe Nhập kho Chờ xử lý ([`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Bảng kê chỉnh sửa dòng hàng kho vận ([`WarehouseEditableGrid`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • In Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx) & API `inbound/receipt-data`) • Quản lý Xuất kho (`/warehouse/outbound` & [`getAvailableOutboundOrders`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts)) • Backend API Tiếp nhận Kho & Sổ cái Tồn kho ([`WarehouseService.confirmInbound`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Nâng cấp logic `confirmInbound` trong `WarehouseService` ([`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts)); Bổ sung tham số `keepTripPending?: boolean` vào payload tiếp nhận kho.; Khi `keepTripPending === true`...
  * **Frontend**: Nâng cấp component `WarehouseEditableGrid` ([`warehouse-editable-grid.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)); Mở rộng interface `WarehouseEditableGridProps`; Cập nhật `TableMeta`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_16_10_task_87/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_16_10_task_87/TODO.md)

### 🚀 [FEEDBACK_16_10_TASK_86] — Feedback 16/10 (Task #86) — Tự Động Loại Bỏ Thông Tin Chuyến Xe (Trip) Chưa Lưu Nháp Hoặc Xác Nhận Khi Bấm "Quay Lại Danh Sách" (16/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: @User / @Thai (Quản lý nghiệp vụ / Vận hành Hệ thống Logistics TMS Spider Express)
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound` ➔ [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Quản lý Xuất kho (`/dashboard/warehouse/outbound` ➔ [`frontend/src/app/dashboard/warehouse/outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) • Lưới kiểm đếm & nhập liệu chuyến xe hàng hóa ([`WarehouseEditableGrid`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Cơ chế đồng bộ dữ liệu tạm thời Excel Converter ([`excel-converter/page.tsx`](file:///frontend/src/app/dashboard/warehouse/excel-converter/page.tsx)) • Backend Service Quản lý Kho ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra API Batch-Create & Inbound Services
  * **Frontend**: Tạo hàm chuẩn hóa `resetMode1Form()` trong Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)); Xử lý sự kiện nút `✕ Quay lại danh sách` ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)); Xử lý sự kiện nút `Tạo đơn nhập mới` trên Inbound Board ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_16_10_task_86/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_16_10_task_86/TODO.md)

### 🚀 [FEEDBACK_16_10_TASK_85] — Feedback 16/10 Task #85 — Tinh gọn Thông tin & Tối ưu Giao diện Xem Chi tiết Chuyến xe Nhập/Xuất Kho (UI Compact Density & Clean Read-only Audit View) (16/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (24/24 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành) & @Antigravity Business Team Lead
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Modal xem chi tiết chuyến xe nhập kho ([`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) với `readOnly={true}`, `mode='INBOUND'`) • Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Modal xem chi tiết chuyến xe xuất kho ([`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) với `readOnly={true}`, `mode='OUTBOUND'`) • Bảng kê kiểm đếm hàng hóa ([`WarehouseTripTallyTable`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)) • Hạ tầng Frontend TMS (Next.js 15+ App Router, Tailwind CSS, TanStack Query v5) & Backend API (NestJS 11+)
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát tính tương thích API Manifest & Chuyến xe ([`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts)); Đảm bảo API `GET /api/v1/warehouse/trips/:tripCode/manifest` và `GET /api/v1/warehouse/inbound-trips` tiếp tục phục vụ đầy đủ dữ liệu cho cả 2 chế độ xem và tác nghiệp.; Đảm bảo không có thay đổi nào làm ảnh hưởng đến dữ liệu sổ cái tồn kho và chốt trạm trung chuyển....
  * **Frontend**: Hiệu chỉnh Component [`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx); Khu vực 1 (Header Action Buttons); Khu vực 2 (Banner cảnh báo khóa sổ & Lộ trình xe)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_16_10_task_85/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_16_10_task_85/TODO.md)

### 🚀 [FEEDBACK_15_10_TASK_88] — Feedback 15/10 (Task #88) — Chặn Tuyệt Đối '/dashboard/overview' & Tự Động Chuyển Hướng Đến Màn Hình Nhập Kho (15/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @Thai / Quản trị Vận hành TMS
- **Phạm vi**: Chuyển hướng Dashboard Tổng quan ([`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx)) ➔ Chuyển hướng ngay đến Nhập kho (`/dashboard/warehouse/inbound`) • Middleware Proxy ([`proxy.ts`](file:///frontend/src/proxy.ts)) • Cấu hình Next.js Redirects ([`next.config.ts`](file:///frontend/next.config.ts)) • Chi tiết đơn hàng quay lại ([`orders/[id]/page.tsx`](file:///frontend/src/app/dashboard/orders/[id]/page.tsx))
- **Năng lực & Tính năng mới**:
  * **Frontend**: Cập nhật [`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx): Thiết lập `redirect('/dashboard/warehouse/inbound')`.; Cập nhật [`proxy.ts`](file:///frontend/src/proxy.ts): Chặn đường dẫn `/dashboard/overview` và chuyển ngay tức thì về `/dashboard/warehouse/inbound`.; Cập nhật [`next.config.ts`](file:///frontend/next.config.ts): Bổ sung `async redirects()` chuyển hướng `/dashboard/overview` về `/dashboard/warehouse/inbound`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_15_10_task_88/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_15_10_task_88/TODO.md)

### 🚀 [FEEDBACK_15_10_TASK_87] — Feedback 15/10 (Task #87) — Chuyển Hướng Đăng Nhập Thẳng Vào Màn Hình Đơn Hàng Kho & Loại Bỏ Màn Hình Dashboard Tổng Quan (15/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (15/15 việc)
- **Báo cáo bởi**: @Thai / Quản trị Vận hành TMS
- **Phạm vi**: Đăng nhập ([`login-form.tsx`](file:///frontend/src/features/auth/components/login-form.tsx), [`sign-in/page.tsx`](file:///frontend/src/app/auth/sign-in/page.tsx)) • Màn hình Tổng quan Dashboard ([`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx)) ➔ Chuyển hướng triệt để sang Đơn hàng kho • Trang Điều hướng Gốc ([`page.tsx`](file:///frontend/src/app/page.tsx), [`dashboard/page.tsx`](file:///frontend/src/app/dashboard/page.tsx)) • Quản lý Đơn hàng kho ([`warehouse/orders/page.tsx`](file:///frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Cấu hình Thanh điều hướng Navigation ([`nav-config.ts`](file:///frontend/src/config/nav-config.ts)) • Middleware Proxy ([`proxy.ts`](file:///frontend/src/proxy.ts))
- **Năng lực & Tính năng mới**:
  * **Frontend**: Cập nhật [`login-form.tsx`](file:///frontend/src/features/auth/components/login-form.tsx): Đổi đích chuyển hướng mặc định sau đăng nhập thành `/dashboard/warehouse/orders`.; Cập nhật [`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx): Thiết lập `redirect('/dashboard/warehouse/orders')` khi truy cập `/dashboard/overview`.; Cập nhật [`page.tsx`](file:///frontend/src/app/page.tsx) & [`dashboard/page.tsx`](file:///frontend/src/app/dashboard/page.tsx): Chuyển hướng người dùng đã xác thực thẳng vào `/dashboard/warehouse/orders`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.png, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_15_10_task_87/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_15_10_task_87/TODO.md)

### 🚀 [FEEDBACK_15_10_TASK_86] — Feedback 15/10 (Task #86) — Tạm Thời Ẩn Nút Kính Lúp Tra Cứu Đơn Hàng Trong Bảng Kê Xuất Kho (15/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @Thai / Quản trị Vận hành TMS
- **Phạm vi**: Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Tạo Phiếu Xuất Kho (`MODE1_CUSTOMER`) • Bảng Kê Soạn Hàng Editable Grid ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Cột `MÃ VẬN ĐƠN *` (`OrderCodeCell`)
- **Năng lực & Tính năng mới**:
  * **Frontend**: Cập nhật [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) trong component `OrderCodeCell`
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.png, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_15_10_task_86/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_15_10_task_86/TODO.md)

### 🚀 [FEEDBACK_15_10_TASK_83] — Feedback 15/10 (Task #83) — Ẩn Nút "In Phiếu Nhập" Khi Chuyến Xe Ở Trạng Thái "Chờ Xử Lý" (15/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (26/26 việc)
- **Báo cáo bởi**: @User / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) • Modal Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát API trả về trạng thái Manifest trạm dừng ([`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts)); Kiểm tra endpoint `GET /api/v1/warehouse/trips/:tripCode/manifest` đảm bảo trường `currentHubStatus` phản ánh đúng `TripStopEntity.status` (`PENDING` khi xe mới đến hoặc chuyến nháp; `COMPLETED` sau khi đã hoàn tất dỡ hàng).; Bảo vệ an toàn dữ liệu Endpoint In phiếu ([`warehouse.controller.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.controller.ts))...
  * **Frontend**: Kiểm soát hiển thị nút `In phiếu nhập` trên thanh Header của `WarehouseTripDetailModal` ([`warehouse-trip-detail-modal.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)); Khai báo biến suy luận trạng thái chuẩn hóa; Bổ sung điều kiện ẩn/hiện nút `In phiếu nhập` tại Header (Line ~1090)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_15_10_task_83/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_15_10_task_83/TODO.md)
### 🚀 [FEEDBACK_15_10_TASK_85] — Feedback 15/10 (Task #85) — Quét & Kiểm Định Toàn Diện Hệ Thống Logistics TMS (Spider Express) Theo Quy Chuẩn Todo-Agent (15/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (19/19 việc)
- **Báo cáo bởi**: @User / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Bảng điều khiển Tổng quan Vận hành ([`overview/page.tsx`](file:///frontend/src/app/dashboard/overview/page.tsx)) ➔ Kiểm soát lưu lượng vận chuyển, chỉ số KPI theo thời gian thực. • Quản lý Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Kiểm đếm dỡ hàng, quản lý chuyến xe đến, đồng bộ 2 nút "Tiếp tục" & "Hủy nháp" cho chuyến xe `Chờ xử lý`. • Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Lập phiếu xuất giao khách hàng lẻ & xuất luân chuyển liên Hub, quản lý chuyến xe nháp. • Quản lý Đơn hàng kho ([`orders/page.tsx`](file:///frontend/src/app/dashboard/warehouse/orders/page.tsx)) ➔ Bảng kê hàng hóa tồn kho, trạng thái đơn hàng (`INBOUND`, `OUT_FOR_DELIVERY`, `TRANSFERRING`). • Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Cơ chế Rollback & Mở lại chuyến xe cho Super Admin (Task #81). • Backend Service Quản lý Kho bãi ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts), [`orders.service.ts`](file:///backend/src/orders/orders.service.ts)) ➔ Toàn vẹn dữ liệu TypeORM, xử lý an toàn transaction.
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra biên dịch toàn diện mã nguồn Backend: `npm --prefix backend run build` đạt `Exit code 0`.; Xác thực toàn vẹn các Entity và Migration TypeORM không chứa thao tác phá hủy DB (`DROP`, `TRUNCATE`, `synchronize: true`).; Xác thực endpoint Rollback Chuyến xe `POST /api/v1/warehouse/trips/:tripCode/rollback` chỉ cấp quyền cho `RoleEnum.SUPER_ADMIN` (Task #81)....
  * **Frontend**: Kiểm tra biên dịch toàn diện mã nguồn Frontend: `NEXT_PUBLIC_API_URL=https://backend-tms-core-dev.up.railway.app npm --prefix frontend run build` hoàn tất thành công 34/34 routes với Turbopack.; Xác thực tuân thủ Quy chế Giao diện Hẹp (UI Compact Density Mandate): Card base `p-1`, Modal body `p-2`, table cells `text-[10px]`.; Xác thực Quy tắc Không Dùng Icon Trùng Lặp (Zero Redundant Icons): Không kết hợp emoji/ký tự với component icon vector....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_15_10_task_85/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_15_10_task_85/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_65] — Feedback 14/10 (Task #65) — Khảo Sát Nghiệp Vụ TMS Toàn Diện & Chuẩn Hóa Danh Mục Kiểm Soát Chất Lượng Sau Chuỗi Cải Tiến Vận Hành Kho Bãi (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (27/27 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành TMS) & @Antigravity Verification
- **Phạm vi**: Quản lý Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Kiểm đếm dỡ hàng, theo dõi chuyến xe đến, đồng bộ 2 nút "Tiếp tục" & "Hủy nháp" cho chuyến xe `Chờ xử lý`. • Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Lập phiếu xuất giao khách hàng lẻ & xuất luân chuyển liên Hub, quản lý chuyến xe nháp. • Modal Chi tiết Chuyến xe & Xem đơn hàng ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Hiển thị cột "BIỂN SỐ XE NHẬP DỰ KIẾN" cho đơn nháp chuyến xuất, ẩn tiêu đề dỡ hàng & nút bốc dọc đường khi xem chuyến tạo mới từ Hub nội bộ. • Lưới nhập & Chỉnh sửa đơn hàng kho ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) & Modal Tra cứu đơn hàng ([`warehouse-lookup-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)) ➔ Cho phép chọn đơn nháp `DRAFT` khi lập chuyến xuất, tính toán tồn khả dụng. • Backend Controller & Service ([`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`orders.service.ts`](file:///backend/src/orders/orders.service.ts)) ➔ Xử lý soft-delete draft trip an toàn, tính toán `expectedInboundLicensePlate`, bảo vệ chống lỗi join ảo TypeORM. • Bộ định tuyến Tác vụ Tự động n8n & Telegram Bot ([`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs), [`bot.mjs`](file:///tools/telegram-task-runner/bot.mjs), [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml)) ➔ Tiếp nhận lệnh `/feedback`, định tuyến sang vai trò `/leader` và tự động lập checklist.
- **Năng lực & Tính năng mới**:
  * **Backend**: Xác thực API Hủy chuyến nháp Nhập kho (`warehouse.controller.ts` & `warehouse.service.ts`); Endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` được bảo vệ bằng `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.WAREHOUSE_MANAGER)`.; Logic `cancelInboundDraft`: Sử dụng transaction soft-delete bản ghi `trip_stop` tương ứng trạng thái `PENDING`, soft-delete các đơn `order` nháp gắn với chuyến xe, và soft-delete `trip` nháp....
  * **Frontend**: Đồng bộ giao diện Màn hình Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)); Cột THAO TÁC cho chuyến `Chờ xử lý` hiển thị cặp nút; Hàm `handleCancelDraft` có hộp thoại xác nhận `window.confirm` và gọi API `DELETE /warehouse/inbound/drafts/:tripCode`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_65/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_65/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_80] — Feedback 14/10 (Task #80) — Khóa Chặt & Cách Ly Đơn Hàng Đã Xếp Vào Chuyến Xe Xuất Kho Chờ Xử Lý (Pending Trip Outbound Order Allocation & Isolation) (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (15/15 việc)
- **Báo cáo bởi**: @Thai / @User (Quản lý nghiệp vụ / Vận hành TMS) & Antigravity Lead Engine
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho Mode 1 (Giao khách hàng) & Mode 2 (Trung chuyển liên Hub), Bảng điều phối chuyến xe xuất kho ([`page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) • Modal Tra cứu & Chọn đơn hàng trong kho ([`WarehouseLookupModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)) • Lưới nhập & Chỉnh sửa đơn hàng xuất kho ([`WarehouseEditableGrid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Modal Chọn đơn lưu kho bốc lên chuyến xe ([`WarehouseSelectStoredOrdersModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Luồng xuất kho luân chuyển ([`WarehouseOutboundTransferFlow.tsx`](file:///frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx)) • Modal Chi tiết Chuyến xe & Bước 2 Xuất hàng lên xe ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Backend Service Quản lý Kho bãi & Sổ cái vận hành ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`operational-ledger.service.ts`](file:///backend/src/orders/operational-ledger.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1. Mở rộng tính toán Tồn kho khả dụng trong `OperationalLedgerService` ([`operational-ledger.service.ts`](file:///backend/src/orders/operational-ledger.service.ts)); 2. Cập nhật `enrichWarehouseRows` trong `WarehouseService` ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)); 3. Siết chặt Chốt chặn Nghiệp vụ trong `saveOutboundDraft` ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))...
  * **Frontend**: 1. Nâng cấp Helper `availableOutboundStock` trong [`outbound-stock.ts`](file:///frontend/src/features/warehouse/lib/outbound-stock.ts); 2. Cập nhật Modal Tra cứu Đơn hàng [`WarehouseLookupModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx); 3. Cập nhật Lưới nhập liệu xuất kho [`WarehouseEditableGrid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_80/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_80/TODO.md)
### 🚀 [FEEDBACK_14_10_TASK_67] — Feedback 14/10 - Task #67: Cải Thiện Cơ Chế Reply Telegram (Chia Nhỏ / Tinh Gọn) & Quét Hàng Đợi Task DB (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (7/7 việc)
- **Năng lực & Tính năng mới**:
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: Có lưu trữ trong thư mục
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_67/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_67/TODO.md)
=======
### 🚀 [FEEDBACK_14_10_TASK_81] — Feedback 14/10 (Task #81) — Cơ Chế Mở Lại Chuyến Xe & Hoàn Tác (Rollback) Tồn Kho Đơn Hàng Dành Cho Quản Trị Viên (Admin Reopen Trip & Inventory Rollback Invariant) (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: @Mai Công Đức / @Thai / @User (Quản lý nghiệp vụ / Vận hành TMS) & Antigravity Lead Engine
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Bảng điều phối chuyến xe nhập kho, Modal Chi tiết Phiếu nhập kho & Tiếp nhận ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Quản lý Xuất kho (`/warehouse/outbound`) ➔ Bảng điều phối chuyến xe xuất kho, Modal Chi tiết Chuyến xe xuất & Bước 2 Xuất hàng ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)), Chi tiết Phiếu xuất kho ([`WarehouseWaybillDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Bảng kê hàng hóa tồn kho, trạng thái đơn hàng (`INBOUND`, `OUT_FOR_DELIVERY`, `TRANSFERRING`) • Backend Service Quản lý Kho bãi & Sổ cái vận hành ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts), [`operational-ledger.service.ts`](file:///backend/src/orders/operational-ledger.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1. Bổ sung Endpoint Rollback Chuyến xe trong [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts); 2. Cài đặt Hàm Nghiệp vụ `rollbackTrip` trong [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts); 3. Cập nhật Sổ cái Vận hành [`operational-ledger.service.ts`](file:///backend/src/orders/operational-ledger.service.ts)**....
  * **Frontend**: 1. Bổ sung API Client Method trong `frontend/src/features/warehouse/api/trip-manifest.ts`; 2. Tinh chỉnh Logic `effectiveReadOnly` trong [`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx); 3. Thiết kế Nút Bấm & Modal Xác Nhận Hoàn Tác (Rollback Confirmation Modal)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_81/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_81/TODO.md)

### 🚀 [FEEDBACK_14_10_EXTRA] — Feedback 14/10 (Extra) — Xây Dựng Công Cụ Chuyển Đổi & Chuẩn Hóa File Excel Nhập Kho Từ Điều Hành Sang Mẫu Chuẩn Hệ Thống (Excel Inbound Converter Tool) (14/10/2026 18:30:00)
- **Trạng thái**: ✅ Hoàn thành 100% (16/16 việc)
- **Báo cáo bởi**: @User / Thủ kho Spider Express (@Thai & Đội ngũ vận hành)
- **Phạm vi**: **Công cụ Tiện ích Kho Vận (Warehouse Operational Utilities & Tools)**: • Trang công cụ chuyên dụng: [`/dashboard/warehouse/excel-converter`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/excel-converter/page.tsx) • Tích hợp trực tiếp tại Màn hình Nhập kho: Nút mở bộ chuyển đổi nhanh trên thanh công cụ [`page.tsx`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx) • Cải tiến bộ phân tích tự động trong Modal Nhập Excel: [`warehouse-excel-import-modal.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-excel-import-modal.tsx) • Khả năng tương thích cơ chế Dán thông minh (Smart TSV Clipboard Paste): [`warehouse-editable-grid.tsx`](file:///d:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) • **Phân quyền truy cập RBAC (Role-Based Access Control)**: • Cập nhật điều kiện lọc thanh điều hướng [`use-nav.ts`](file:///d:/Projects/logistics-website/frontend/src/hooks/use-nav.ts) cho vai trò `WAREHOUSE_MANAGER` và `DISPATCHER`
- **Năng lực & Tính năng mới**:
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: image.png, screenshot_converter_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_extra/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_extra/TODO.md)
>>>>>>> fix/warehouse-task-81-admin-trip-rollback-reopen

### 🚀 [FEEDBACK_14_10_TASK_78] — Feedback 14/10 (Task #78) — Tự Động Hiển Thị Modal Phiếu Nhập Kho Khi Bấm Xác Nhận Nhập Kho (Đồng Bộ Trải Nghiệm In Ấn Với Luồng Xuất Kho) (14/10/2026 17:15:00)
- **Trạng thái**: ✅ Hoàn thành 100% (24/24 việc)
- **Báo cáo bởi**: @User / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: **Phân hệ Quản lý Nhập kho TMS (Inbound Dock Management)**: • Bảng điều phối nhập kho ([`page.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Màn hình tạo mới nhập kho trực tiếp từ xe đến / khách gửi (`activeView === 'MODE1_CUSTOMER'`) • Luồng luân chuyển nội bộ nhập kho ([`warehouse-inbound-transfer-flow.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-inbound-transfer-flow.tsx)) • Modal kiểm đếm dỡ hàng chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • **Phân hệ In ấn Chứng từ Kho Vận (Warehouse Vouchers & Invoices)**: • Modal Phiếu Nhập Kho A4 Khổ ngang & Khổ dọc ([`warehouse-inbound-receipt-modal.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)) • Đối chiếu tính nhất quán trải nghiệm với Phiếu Xuất Kho A4 ([`warehouse-outbound-receipt-modal.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx)) • **Backend API Quản lý Kho bãi & Tiếp nhận chuyến xe** ([`warehouse.controller.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát endpoint `POST /api/v1/warehouse/inbound/batch-create` trong [`warehouse.controller.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.controller.ts) và phương thức `batchCreateInboundOrders` trong [`warehouse.service.ts`](file:///home/runner/work/logistics-website/logistics-website/backend/src/orders/warehouse.service.ts); Đảm bảo response trả về đầy đủ contract: `{ tripCode, licensePlate, driverName, count, orders, invoiceCode }`.; Đảm bảo các `orders` trả về có nạp đầy đủ thông tin địa chỉ giao hàng (`deliveryAddress`), loại hàng, số kiện....
  * **Frontend**: Cập nhật màn hình Nhập kho chính [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///home/runner/work/logistics-website/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx); Chuẩn hóa nhãn nút bấm tại chân trang Mode 1 từ `Xác nhận tiếp nhận & Lưu kho` thành `<Button><IconCircleCheck /> Xác nhận nhập kho</Button>`.; Trong hàm `handleSubmitMode1`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: mau_phieu_nhap_kho.JPG, screenshot_01_verified.png, tham_chieu_modal_phieu_nhap_kho_hien_tai.png, tham_chieu_phieu_xuat_kho_sau_khi_tao.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_78/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_78/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_77] — Feedback 14/10 (Task #77) — Khảo Sát & Chuẩn Hóa Cơ Chế Tiếp Nhận Phản Hồi Nghiệp Vụ TMS Qua Telegram Bot (@please_choose_auto_bot) (14/10/2026 16:55:00)
- **Trạng thái**: ✅ Hoàn thành 100% (24/24 việc)
- **Báo cáo bởi**: @【M】【C】【D】 / @User (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: **Kênh Tự động hóa Điều hành & Tiếp nhận Yêu cầu**: Telegram Task Runner ([`bot.mjs`](file:///tools/telegram-task-runner/bot.mjs), [`neon-worker.mjs`](file:///tools/telegram-task-runner/neon-worker.mjs), n8n Routing Workflow [`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs)) • **Phân hệ Quản lý Kho bãi TMS (Warehouse Management)**: Bảng điều phối nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)), Bảng điều phối xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)), Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • **Phân hệ In ấn Chứng từ Vận tải (Vouchers & Labels)**: Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)), Phiếu Xuất Kho A4 ([`WarehouseOutboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx)), Tem Pallet Nhận Diện A4 ([`WarehouseWaybillA4Modal`](file:///frontend/src/features/warehouse/components/warehouse-waybill-a4-modal.tsx)) • **Backend Quản lý Kho & Điều vận API** ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts), [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát service quản lý kho bãi [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts); Đảm bảo phương thức `getInboundTrips` trích xuất chính xác `deliveryAddress` cho mọi trạng thái đơn hàng.; Đảm bảo endpoint in ấn phiếu nhập kho `GET /api/v1/warehouse/inbound/receipt-data` trả về đầy đủ các trường: `tripCode`, `licensePlate`, `driverName`, `destinationHubName`, `deliveryAddress`, `items`....
  * **Frontend**: Rà soát các component giao diện kho bãi; [`warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx): Kiểm tra hiển thị địa chỉ giao hàng trên cả Header Info Grid và Data Table, định dạng in ấn `@media print` khổ A4 chuẩn mực.; [`warehouse-outbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-outbound-receipt-modal.tsx): Kiểm tra tính nhất quán với phiếu nhập kho....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_77/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_77/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_76] — Feedback 14/10 (Task #76) — Bổ Sung & Chuẩn Hóa Thông Tin "Địa Chỉ Giao Hàng" Vào Phiếu Nhập Kho (Inbound Receipt) (14/10/2026 15:10:00)
- **Trạng thái**: ✅ Hoàn thành 100% (29/29 việc)
- **Báo cáo bởi**: @User / Vận hành Kho (TMS Warehouse Operator)
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Phiếu Nhập Kho A4 ([`WarehouseInboundReceiptModal`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)) • Bảng điều phối nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Modal Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Backend Quản lý Kho bãi ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Chuẩn hóa trích xuất `deliveryAddress` trong `WarehouseService.getInboundTrips`** ([`backend/src/orders/warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)); Bổ sung hàm tiện ích bóc tách `deliveryAddress` từ thực thể `OrderEntity`; Gán trường `deliveryAddress` vào từng object đơn hàng trong mảng `orders: tripOrders` trả về client....
  * **Frontend**: Cập nhật Modal In Phiếu Nhập Kho** ([`frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-receipt-modal.tsx)); Khối Thông Tin Đầu Phiếu (Header Info Grid); Bảng Kê Chi Tiết Hàng Hóa (Items Table)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01.png, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_76/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_76/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_73] — Task Checklist: Feedback 14/10 (Task #73) — Hiển Thị Nội Dung Cột Tỉnh/TP Tại Ô "GIAO ĐẾN" Trên Tem Nhận Diện Hàng Hóa A4 (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (10/10 việc)
- **Năng lực & Tính năng mới**:
  * **Frontend**: Cập nhật file `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`; Đảo thứ tự ưu tiên: Ưu tiên trường `province` (hoặc `destinationCity` / `destinationProvince`) lên đầu tiên cho `destinationDisplay` và `itemDestDisplay`.; Hỗ trợ hàm trích xuất fallback thông minh: nếu `province` trống nhưng `deliveryAddress` / `originalDestination` có chứa tên Tỉnh/TP ở cuối chuỗi địa chỉ thì trích xuất hoặc fallback an toàn....
  * **Cơ sở dữ liệu**: Sinh biên bản kỹ thuật `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md` qua `npm run todo:record feedback_14_10_task_73`.; Cập nhật Task #73 thành `COMPLETED` trong database `telegram_tasks`.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_73/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_73/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_71] — Feedback 14/10 (Task #71) — Cố Định Cột Mã Vận Đơn Khi Cuộn Ngang (Sticky Column) và Khóa Chặt Nghiệp Vụ Mobile (Chỉ Xem & In Tem Nhận Diện, Loại Bỏ Chỉnh Sửa, Thêm, Xóa Trong Trip Nhập/Xuất Kho) (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (14/14 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & User Feedback
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Chi tiết Chuyến xe Nhập kho ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)), Bảng kiểm đếm dỡ hàng ([`WarehouseTripTallyTable.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)), Luồng nhập luân chuyển ([`WarehouseInboundTransferFlow.tsx`](file:///frontend/src/features/warehouse/components/warehouse-inbound-transfer-flow.tsx)). • Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Chi tiết Chuyến xe Xuất kho ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)), Bước 2 Xuất hàng mới lên xe, Luồng xuất luân chuyển ([`WarehouseOutboundTransferFlow.tsx`](file:///frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx)). • Các thành phần bảng & tương tác dữ liệu hàng hóa trên Mobile: Khóa chỉnh sửa dữ liệu, ẩn nút thêm đơn, ẩn nút xóa đơn, cố định cột Mã vận đơn (`orderCode`) khi cuộn ngang (`overflow-x-auto`). • Backend API (`backend/src/orders/warehouse.controller.ts`, `warehouse.service.ts`) ➔ Đảm bảo các API Manifest chuyến xe (`/trips/:tripCode/manifest`), dữ liệu tem nhận diện Pallet A4 và danh sách chuyến xe hoạt động an toàn, chính xác.
- **Năng lực & Tính năng mới**:
  * **Backend**: Xác Nhận API Manifest Chuyến Xe; Xác Nhận Dữ Liệu In Tem Pallet A4; Kiểm Tra Build Backend
  * **Frontend**: Bảng Đơn Hàng Bước 1 (Nhập kho) trong [`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx); Bảng Đơn Hàng Bước 2 (Xuất kho) trong [`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx); Bảng Kiểm Đếm Nhập Kho trong [`WarehouseTripTallyTable.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (2/2 mobile suites verified)
  * Minh chứng hình ảnh gốc & nghiệm thu: `screenshot_01.png` (Nhập kho SD42), `screenshot_02.png` (Xuất kho SD43), `screenshot_01_mobile_sticky_readonly_verified.png`, `screenshot_02_mobile_outbound_modal_verified.png`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_71/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_71/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_70] — Feedback 14/10 (Task #70) — Loại Bỏ Nút Mũi Tên Mở Rộng Dòng (Accordion Chevron `>`) và Tinh Gọn Bảng Kê Chuyến Xe Xuất Kho / Nhập Kho Chuẩn Hóa Chế Độ Xem Chi Tiết Qua Modal (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (16/16 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Bảng danh sách chuyến xe xuất kho ([`page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)), loại bỏ nút bấm mũi tên `>` mở rộng dòng ở cột `CHUYẾN XE / TRIP`, loại bỏ khối sub-row accordion lồng bảng và loại bỏ nút "Mở rộng tất cả / Thu gọn tất cả" trên thanh công cụ. • Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Bảng danh sách chuyến xe nhập kho ([`page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)), đồng bộ giao diện (UI/UX Parity) loại bỏ nút bấm mũi tên `>` ở cột `CHUYẾN XE / TRIP`, loại bỏ khối sub-row accordion và nút "Thu gọn / Mở rộng tất cả" trên thanh công cụ. • Modal Chi tiết Chuyến xe ([`WarehouseTripDetailModal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Đảm bảo duy trì và bảo toàn 100% chức năng xem chi tiết đơn hàng và in tem nhận diện khi click vào mã chuyến xe `grp.tripCode` ở chế độ Read-only an toàn. • Backend API (`backend/src/orders/warehouse.controller.ts`, `warehouse.service.ts`) ➔ Đảm bảo hợp đồng dữ liệu cho các endpoint danh sách chuyến xe và chi tiết manifest hoạt động chuẩn xác, không ảnh hưởng tới dữ liệu đơn hàng.
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra Tính Toàn Vẹn Endpoint Danh sách Chuyến xe; Kiểm tra API Manifest Chuyến xe; Kiểm tra Biên dịch Backend
  * **Frontend**: Loại bỏ Nút Mũi Tên Mở Rộng Dòng `>` ở cột `CHUYẾN XE / TRIP`; Loại bỏ Khối Nested Sub-row Accordion; Loại bỏ Nút "Mở rộng tất cả / Thu gọn tất cả" trên Toolbar...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_70/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_70/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_53] — Feedback 14/10 (Task #53) — Thay Thế Cột "ĐIỂM BỐC HÀNG" Bằng "BIỂN SỐ XE NHẬP DỰ KIẾN" Trong Màn Hình Xem Đơn Hàng Trip Xuất Kho (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (15/15 việc)
- **Báo cáo bởi**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Bổ sung trường `expectedInboundLicensePlate` vào DTO đơn hàng kho trong `enrichWarehouseRows` & `getOutboundTrips`. • Bảng dữ liệu Kho ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Mở rộng interface `WarehouseRowItem` với trường `expectedInboundLicensePlate`. • Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Thay thế header cột "ĐIỂM BỐC HÀNG" thành "BIỂN SỐ XE NHẬP DỰ KIẾN", hiển thị icon xe tải + biển số cho đơn nháp chờ nhập, hiển thị gạch ngang `—` cho đơn đã lưu kho. • Kiểm thử tự động E2E ([`53-feedback-14-10-task-53-expected-inbound-plate.spec.ts`](file:///frontend/e2e/53-feedback-14-10-task-53-expected-inbound-plate.spec.ts)).
- **Năng lực & Tính năng mới**:
  * **Backend**: Mở rộng hàm `enrichWarehouseRows` tính toán trường `expectedInboundLicensePlate`.; Logic: Nếu đơn `isStored = true` ➔ trả về `null`.; Logic: Nếu đơn `isStored = false` ➔ quét `item.trips` tìm chuyến xe nhập hàng (`type === 'INBOUND'` hoặc không phải `OUTBOUND`/`TRANSFER`) ở trạng thái chờ xử lý (`status === 'PENDING'` hoặc `'WAITING'`), trích xuất `licensePlate`....
  * **Frontend**: Cập nhật interface `WarehouseRowItem` trong [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) bổ sung `expectedInboundLicensePlate?: string | null`.; Cập nhật [`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx); Khi map dữ liệu sang `mappedRows`, gán `expectedInboundLicensePlate`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_53/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_53/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_54] — Feedback 14/10 (Task #54) — Thiết Kế Đồng Bộ 2 Nút "Tiếp tục" & "Hủy nháp" Trên Màn Hình Nhập Kho Tương Tự Màn Hình Xuất Kho (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (21/21 việc)
- **Báo cáo bởi**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Frontend ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Bổ sung nút "Hủy nháp" (variant outline đỏ, icon `IconTrash`, kích thước `h-7`, `text-[11px]`) đứng cạnh nút "Tiếp tục" cho các chuyến xe trạng thái `Chờ xử lý` (`isPending`). • Backend Controller ([`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts)) ➔ Thêm endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` cho phép thủ kho / Super Admin hủy chuyến xe nhập nháp chưa xử lý. • Backend Service ([`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts)) ➔ Cài đặt phương thức `cancelInboundDraft` xử lý transaction soft-delete `trip_stop`, `order` nháp và `trip` nháp an toàn. • Kiểm thử tự động E2E ([`54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts`](file:///frontend/e2e/54-feedback-14-10-task-54-inbound-draft-cancel-buttons.spec.ts)) ➔ Xác nhận API 404 cho mã giả định, cấu trúc hiển thị 2 nút bấm trên bảng Nhập kho, chụp ảnh bằng chứng nghiệm thu. • N8N Task Router & GitHub Actions CI/CD ([`update-n8n-router.mjs`](file:///tools/telegram-task-runner/update-n8n-router.mjs), [`.github/workflows/telegram-agy-worker.yml`](file:///.github/workflows/telegram-agy-worker.yml)) ➔ Sửa lỗi đường dẫn tương đối và siết chặt Quality Gate ngăn báo cáo hoàn thành khống khi 0 file bị sửa.
- **Năng lực & Tính năng mới**:
  * **Backend**: Tạo endpoint `DELETE /api/v1/warehouse/inbound/drafts/:tripCode` trong [`warehouse.controller.ts`](file:///backend/src/orders/warehouse.controller.ts) với quyền `SUPER_ADMIN, WAREHOUSE_MANAGER`.; Triển khai hàm `cancelInboundDraft` trong [`warehouse.service.ts`](file:///backend/src/orders/warehouse.service.ts) với transaction an toàn; Soft-delete bản ghi trạm dừng `trip_stop` tương ứng trạng thái `PENDING` tại Hub....
  * **Frontend**: Bổ sung import `IconTrash` trong [`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx).; Thêm state `cancellingDraftCode` quản lý trạng thái loading khi đang xóa chuyến nháp.; Cài đặt hàm `handleCancelDraft(tripCode: string)`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png, screenshot_inbound_board_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_54/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_54/TODO.md)
### 🚀 [FEEDBACK_14_10_TASK_52] — Feedback 14/10 (Task #52) — Loại Bỏ Tiêu Đề "Kiểm Đếm Dỡ Hàng & Nhập Kho" Và Nút "Bốc Thêm Đơn Dọc Đường" Ở Màn Hình Xem Đơn Hàng Trong Trip Xuất, Nhập Tạo Mới Từ Hub Của Account (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Modal Chi tiết Chuyến xe & Xem đơn hàng ([`warehouse-trip-detail-modal.tsx`](file:///frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Quản lý hiển thị Header Bar, ẩn khối tiêu đề dỡ hàng và ẩn nút bốc thêm đơn dọc đường khi xem đơn hoặc chuyến xe xuất phát từ Hub hiện tại. • Màn hình Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Mở modal xem đơn hàng trong chuyến xe xuất kho (`mode='OUTBOUND'`, `readOnly={true}`). • Màn hình Quản lý Nhập kho ([`inbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/inbound/page.tsx)) ➔ Mở modal xem chi tiết đơn hàng chuyến xe nhập kho tạo mới trực tiếp tại Hub (`mode='INBOUND'`, `readOnly={true}`). • Kiểm thử tự động E2E ([`52-trip-detail-view-clean-header-and-no-roadside.spec.ts`](file:///frontend/e2e/52-trip-detail-view-clean-header-and-no-roadside.spec.ts)).
- **Năng lực & Tính năng mới**:
  * **Frontend**: Bổ sung computed helper nhận diện Chuyến xe tạo mới từ Hub hiện tại (`isTripOriginHere`); Loại bỏ khối tiêu đề phụ `Kiểm đếm dỡ hàng & Nhập kho` (Phần khoanh đỏ 1); Loại bỏ triệt để nút `+ Bốc thêm đơn dọc đường về Hub` (Phần khoanh đỏ 2)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_52/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_52/TODO.md)

### 🚀 [FEEDBACK_14_10_TASK_51] — Feedback 14/10 (Task #51) — Cho Phép Chọn Đơn Hàng Nháp (DRAFT) Khi Lập Trip Xuất Kho & Ràng Buộc Khóa Trạng Thái Chuyến Xe Chỉ Ở "Chờ Xử Lý" (PENDING) (14/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (14/14 việc)
- **Báo cáo bởi**: @【M】【C】【D】 / @Thai (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Tạo phiếu xuất kho Mode 1 (Giao khách hàng) & Mode 2 (Trung chuyển liên Hub), bảng điều độ chuyến xe ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)). • Modal Tra cứu & Chọn đơn hàng xuất kho ([`WarehouseLookupModal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)) ➔ Mở khóa đơn hàng nháp (`DRAFT`), hiển thị số kiện kế hoạch thay vì "Hết tồn khả dụng", kích hoạt nút `[Chọn đơn này]`. • Lưới nhập & Chỉnh sửa đơn hàng xuất kho ([`WarehouseEditableGrid.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Cho phép tìm kiếm, nhập mã và gán đơn hàng nháp lên lưới xuất kho, gán số lượng xuất theo `totalQuantity`. • Helper tính toán Tồn kho khả dụng ([`outbound-stock.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/lib/outbound-stock.ts)) ➔ Chuẩn hóa hàm `availableOutboundStock` đối với các đơn hàng ở trạng thái `DRAFT` / `PENDING` / `WAITING`. • Luồng xuất kho luân chuyển ([`WarehouseOutboundTransferFlow.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx)) ➔ Tab DRAFT và logic chặn xác nhận xuất kho khi có đơn nháp. • Modal Chọn đơn lưu kho bốc lên chuyến xe ([`WarehouseSelectStoredOrdersModal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)). • Backend API (`backend/src/orders/warehouse.controller.ts`, `warehouse.service.ts`, `operational-ledger.service.ts`) ➔ Chốt chặn nghiệp vụ nghiêm ngặt trong `confirmOutbound`, `saveOutboundDraft`, `updateTransitStep` và `getAvailableOutboundOrders`.
- **Năng lực & Tính năng mới**:
  * **Backend**: Bổ sung chốt chặn nghiệp vụ trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Chuẩn hóa tính toán tồn kho trong `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Rà soát `updateTransitStep` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))...
  * **Frontend**: Nâng cấp hàm `availableOutboundStock`; Mở khóa hoàn toàn cho Đơn nháp (`DRAFT`); Hỗ trợ gõ mã và tự động điền đơn nháp...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_lookup_modal_draft_selectable_verified.png, screenshot_02_outbound_draft_banner_and_pending_guard_verified.png, screenshot_03_draft_trip_saved_pending_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_14_10_task_51/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_14_10_task_51/TODO.md)

### 🚀 [FEEDBACK_13_10_TASK_46] — Feedback 13/10 (Task #46) — Chuẩn hóa Nút "Tiếp tục" Nhập kho & Phân định Rạch ròi Chế độ Xem / In Tem Nhận Diện với Chế độ Chỉnh sửa Chuyến xe (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (22/22 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Bảng danh sách chuyến xe nhập kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)), bổ sung nút "Tiếp tục" ở cột THAO TÁC, chuẩn hóa hành vi click vào mã chuyến xe. • Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Bảng danh sách chuyến xe xuất kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)), chuẩn hóa hành vi click vào mã chuyến xe. • Modal Chi tiết Chuyến xe ([`WarehouseTripDetailModal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Phân định triệt để giữa Chế độ Xem thuần túy (Read-only inspection) và Chế độ Chỉnh sửa/Tác nghiệp (Edit/Action workflow); tích hợp trực tiếp tính năng In Tem Nhận Diện Hàng Hóa. • Modal In Tem Nhận Diện Hàng Hóa ([`PalletLabelA4Modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)) ➔ Kết nối in tem nhận diện A4 / Pallet label cho từng đơn hàng hoặc toàn bộ đơn trong chuyến xe. • Backend API (`backend/src/orders/warehouse.controller.ts`, `warehouse.service.ts`) ➔ Đảm bảo dữ liệu manifest, trạng thái stop của trip và các thao tác cập nhật chuyến xe đáp ứng 100% nghiệp vụ.
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra & Chuẩn hóa API `inbound-trips` ([`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Kiểm tra API `trips/:tripCode/manifest` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Bảo đảm quyền hạn RBAC ([`rbac-matrix.md`](file:///D:/Projects/logistics-website/.agents/rules/rbac-matrix.md))
  * **Frontend**: Thêm nút `[✏️ Tiếp tục]` vào cột THAO TÁC cho các chuyến xe `Chờ xử lý` (`grp.status === 'PENDING'`); Giữ nút `[🖨️ In phiếu nhập]` cho các chuyến xe `Đã xử lý` (`grp.status === 'COMPLETED'`); Loại bỏ nút "Xem đơn" thừa thãi ở cột THAO TÁC...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_13_10_task_46/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_13_10_task_46/TODO.md)

### 🚀 [FEEDBACK_13_10_TASK_45] — Feedback 13/10 (Task 45) — Loại Bỏ Chức Năng Chọn Nhiều Trip & Nút Xác Nhận Nhập/Xuất Kho Hàng Loạt Ngoài Màn Hình Danh Sách (Chuyển Giao Trọn Vẹn Sang Tác Nghiệp Theo Chuyến Xe & Kiểm Đếm Thực Tế) (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Chủ quản vận hành / Vận hành TMS)
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Bảng điều độ chuyến xe đến & Thanh tác vụ chọn hàng loạt ([`WarehouseInboundPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Quản lý Xuất kho (`/warehouse/outbound`) ➔ Bảng điều độ chuyến xe đi & Thanh tác vụ chọn hàng loạt ([`WarehouseOutboundPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)) • Tác nghiệp Kiểm đếm & Dỡ hàng theo Chuyến xe ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Tác nghiệp Lập phiếu xuất & Điều độ chuyến xe xuất kho ([`WarehouseOutboundTransferFlow`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx) & Form Xuất kho Mode 1 / Mode 2)
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & Bảo toàn Endpoints xác nhận kho trong `WarehouseController` & `WarehouseService`
  * **Frontend**: Xóa bỏ State & Logic chọn nhiều đơn hàng; Xóa bỏ Thanh tác vụ hàng loạt nổi (Batch Action Bar); Xóa bỏ Cột Checkbox trong Bảng Chuyến xe Nhập kho...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_13_10_task_45/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_13_10_task_45/TODO.md)

### 🚀 [FEEDBACK_13_10_TASK_41] — Feedback 13/10 (Task 41) — Bảo Toàn Thông Tin Đích Đến Ban Đầu Của Đơn Hàng (Master Contract Destination Invariance) & Tách Biệt Hoàn Toàn Với Địa Chỉ Giao Khi Xuất Kho (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (10/10 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Chủ quản vận hành / Vận hành TMS)
- **Phạm vi**: Quản lý Đơn hàng tại kho (`/warehouse/orders`) ➔ Bảng tổng hợp đơn hàng & Cột "ĐÍCH ĐẾN" ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Tác nghiệp Xuất kho & Chuyến xe luân chuyển ([`WarehouseOutboundTransferFlow`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx) & [`confirmOutbound`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Cập nhật hình thức giao & đích đến trên chuyến xe ([`updateTripOrderDestination`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) & [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Chi tiết Vận đơn & Lịch sử hành trình ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • In tem nhận diện A4 Pallet ([`PalletLabelA4Modal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)) • Báo cáo xuất dữ liệu Excel đơn hàng lưu kho và xuất kho ([`handleExportStoredOrdersExcel`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx))
- **Năng lực & Tính năng mới**:
  * **Backend**: Chấm dứt triệt để việc ghi đè Master Contract trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Tách biệt phạm vi cập nhật trong `updateTripOrderDestination` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Bổ sung / Chuẩn hóa cấu trúc dữ liệu trả về cho API `GET /api/v1/warehouse/orders`...
  * **Frontend**: Chuẩn hóa hiển thị cột ĐÍCH ĐẾN tại trang Tổng Hợp Đơn Hàng Kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)); Chuẩn hóa Báo cáo xuất file Excel ([`handleExportStoredOrdersExcel`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)); Đồng bộ hiển thị trên các Modal liên quan...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_orders_table_verified.png, screenshot_task_41_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_13_10_task_41/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_13_10_task_41/TODO.md)

### 🚀 [FEEDBACK_13_10_TASK_38] — Feedback 13/10 (Task 38) — Chuẩn hóa Hiển thị Thông tin Chi tiết Hub Cấp 1 & Tuyến Xe Bo tại Cột "Địa Chỉ Giao" Màn hình Xuất Kho (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (15/15 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity Verification
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho (`activeView === 'MODE1_CUSTOMER'`) • Lưới nhập & chỉnh sửa dữ liệu hàng hóa xuất kho ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Cột `ĐỊA CHỈ GIAO *` ([`DeliveryAddressCell`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx#L1073-L1208)) • Modal chọn đích điều chuyển Hub / Tuyến Xe Bo ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Quản lý Chuyến xe trung chuyển ghé trạm ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) ➔ Bước 2: Bảng kê xuất hàng mới lên xe tại Hub • Tra cứu tồn kho ([`WarehouseLookupModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx)) & API xác nhận xuất kho ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra và chuẩn hóa Endpoint Tra cứu Danh bạ Hub (`/api/v1/hubs/active`); Kiểm tra Quan hệ Thực thể trong `getOrders` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Rà soát DTO Xuất kho & Lưu nháp ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts))
  * **Frontend**: Xây dựng Helper / Component Card Đích Đến Chuẩn Hóa (`DestinationHubInfoCard`); Hoàn thiện Logic Phân giải Hub (`resolveHubOption`) trong `DeliveryAddressCell`; Đồng bộ hóa vào Tra cứu Hàng Tồn Kho (`WarehouseLookupModal`)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_hub_l1_verified.png, screenshot_02_xe_bo_verified.png, screenshot_03_revert_verified.png, screenshot_task_38_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_13_10_task_38/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_13_10_task_38/TODO.md)
### 🚀 [FEEDBACK_13_10_TASK_37] — Feedback 13/10 (Task #37) — Khóa Quyền Thao Tác Đơn Hàng Đối Với Chuyến Xe Đã Xử Lý Tại Hub & Phân Quyền Đặc Quyền Admin (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (22/22 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity Verification
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) & Xuất kho (`/warehouse/outbound`) • Modal Chi tiết & Kiểm đếm chuyến xe ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Popup Bốc thêm đơn dọc đường về Hub ([`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx)) • Popup Chọn đơn lưu kho xuất tiếp lên xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Popup Điều chuyển đích đến đơn hàng ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Lưới chỉnh sửa bảng kê hàng hóa ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Backend Warehouse Module ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts) & [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts)) • Hệ thống phân quyền RBAC & Cơ chế bảo vệ bất biến sổ cái trạm dừng ([`TripStopEntity`](file:///D:/Projects/logistics-website/backend/src/trips/entities/trip-stop.entity.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Xây dựng hàm kiểm tra quyền tập trung `validateTripStopEditPermission`; Gắn chốt chặn kiểm tra vào API Bốc thêm đơn dọc đường (`appendOrderToTrip`); Gắn chốt chặn kiểm tra vào API Bốc đơn lưu kho xuất tiếp (`appendStoredOrdersToTrip`)...
  * **Frontend**: Khai báo và tính toán chuẩn xác các cờ phân quyền theo phản hồi người dùng; Xử lý triệt để nút `+ Bốc thêm đơn dọc đường về Hub` (Khắc phục lỗi trực quan trên [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg)); Xử lý cụm nút Footer góc dưới bên phải (Khắc phục vùng khoanh đỏ trong [`screenshot_01.jpg`](file:///D:/Projects/logistics-website/feedbacks/feedback_13_10_task_37/screenshot_01.jpg))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png, screenshot_02_admin_override_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedbacks/feedback_13_10_task_37/RESOLUTION.md) • [`TODO.md`](../feedbacks/feedback_13_10_task_37/TODO.md)
### 🚀 [FEEDBACK_13_10] — Feedback 13/10 — Chuẩn Hóa Cấu Trúc 15 Cột Báo Cáo Excel Đơn Hàng Kho & Bóc Tách Chuyến Xe Nhập - Xuất (13/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (8/8 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý vận hành kho bãi Logistics TMS)
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Nút xuất báo cáo Excel ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Timeline biến động hàng hóa ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Warehouse Orders API: Controller ([`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts)) & Service ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu thực thể biến động kho: [`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts) & [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts)
- **Năng lực & Tính năng mới**:
  * **Backend**: Nâng cấp `enrichWarehouseRows` trong `WarehouseService` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Cập nhật hàm gom nhóm `aggregateOrderGroup` trong `WarehouseService` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Bảo đảm tính toàn vẹn của API `GET /api/v1/warehouse/orders` với cờ `isExport=true`
  * **Frontend**: Tái cấu trúc hàm `handleExportStoredOrdersExcel` trong [`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx); Tuân thủ nghiêm ngặt Quy chuẩn giao diện hẹp (UI Compact Density & Zero Banned Classes)
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_verified.png, screenshot_02_export_download_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_13_10/RESOLUTION.md) • [`TODO.md`](../feedback_13_10/TODO.md)

### 🚀 [FEEDBACK_12_10_TASK_33] — Feedback 12/10 (Task 33) — Tối Ưu Độ Sáng & Tinh Chỉnh Div Overlay Banner Đăng Nhập (Login Hero) (12/10/2026 20:36)
- **Trạng thái**: ✅ Hoàn thành 100% (7/7 việc)
- **Báo cáo bởi**: @Thai Ly (Quản lý nghiệp vụ / Vận hành)
- **Phạm vi**: Giao diện Đăng nhập hệ thống (`/auth/sign-in`) ➔ Hero Visual Banner bên trái ([`AuthHeroBanner`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/auth-hero-banner.tsx)) • Các màn hình xác thực đồng bộ: Quên mật khẩu (`/auth/forgot-password`) & Đặt lại mật khẩu (`/auth/reset-password`) • Khối thẻ nội dung nổi (Floating Tech Card) & Khối trích dẫn định vị thương hiệu (Testimonial Quote Block) • Frontend TMS Core (Next.js 15+ App Router, Tailwind CSS, TypeScript) & Kiểm thử tự động Playwright E2E
- **Năng lực & Tính năng mới**:
  * **Backend**: Kiểm tra tính sẵn sàng của API Xác thực (`/api/v1/auth/email/login`); Bảo đảm tính toàn vẹn của Endpoint Health Check (`/api/v1/health`)
  * **Frontend**: Tái cấu trúc và làm sáng Hero Banner trong [`auth-hero-banner.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/auth-hero-banner.tsx); Đồng bộ trên toàn bộ các màn hình Xác thực liên quan; Tuân thủ nghiêm ngặt Quy chuẩn giao diện hẹp (UI Compact Density & Responsive Guard)
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_12_10_task_33/RESOLUTION.md) • [`TODO.md`](../feedback_12_10_task_33/TODO.md)

### 🚀 [FEEDBACK_12_10] — Feedback 12/10 — Chuẩn Hóa Nhận Diện Thương Hiệu Spider Express & Thay Đổi Hình Ảnh Banner Trang Đăng Nhập (Login Hero) (12/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @Thai Ly (Chủ sở hữu sản phẩm & Quản lý vận hành TMS) & @Antigravity Verification
- **Phạm vi**: Màn hình Đăng nhập hệ thống (`/auth/sign-in` & [`sign-in-view.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/sign-in-view.tsx)) • Các màn hình xác thực tài khoản phụ trợ (`/auth/forgot-password` & [`forgot-password-view.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/forgot-password-view.tsx), `/auth/reset-password` & [`reset-password-view.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/reset-password-view.tsx)) • Nhận diện thương hiệu hệ thống: Logo vector SVG ([`brand-logo.tsx`](file:///D:/Projects/logistics-website/frontend/src/components/brand-logo.tsx)) & Logo Spider Express ([`logo_phieu_xuat_nhap_kho.jpg`](file:///D:/Projects/logistics-website/frontend/public/images/logo_phieu_xuat_nhap_kho.jpg)) • Thiết kế Vector Canvas trên Pencil ([`AUTH_FLOWS.pen`](file:///D:/Projects/logistics-website/pencil-workspace/pens/AUTH_FLOWS.pen)) • Thư mục tài nguyên ảnh tĩnh ([`frontend/public/images/`](file:///D:/Projects/logistics-website/frontend/public/images/))
- **Năng lực & Tính năng mới**:
  * **Backend**: Khảo sát & Đánh giá nhu cầu cấu hình ảnh Banner động qua System Settings; Bảo toàn tính ổn định của API Đăng nhập cốt lõi
  * **Frontend**: Thiết kế & Lựa chọn Hình ảnh Banner Thay Thế Đạt Chuẩn; Tối ưu Hóa Dung Lượng & Định Dạng (Performance Optimization); Tạo Component Banner Dùng Chung (`AuthHeroBanner`) hoặc Hằng Số Cấu Hình Tập Trung...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: current_auth_hero.jpg, current_login_screen.png, new_auth_hero.jpg, screenshot_01_verified.png, screenshot_verified_login.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_12_10/RESOLUTION.md) • [`TODO.md`](../feedback_12_10/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_20] — Feedback 09/10 (Task 20) — Tích Hợp Nút Xuất Báo Cáo Excel Đơn Hàng Lưu Kho Tại Màn Hình Đơn Hàng Kho Phục Vụ Kiểm Kê & Báo Cáo Vận Hành (09/10/2026 - 18:22)
- **Trạng thái**: ✅ Hoàn thành 100% (18/18 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành hệ thống Logistics TMS)
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Header trang Đơn hàng kho & Bảng kê dữ liệu ([`WarehouseOrdersPage`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Backend API Đơn hàng kho ➔ Controller & Service xử lý trích xuất dữ liệu không giới hạn phân trang ([`WarehouseController`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///c:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Công cụ kết xuất bảng tính Excel ([`xlsx`](https://docs.sheetjs.com/)) chuẩn nhận diện thương hiệu Logistics TMS (Spider Express)
- **Năng lực & Tính năng mới**:
  * **Backend**: Mở rộng API `GET /api/v1/warehouse/orders` hỗ trợ chế độ trích xuất toàn bộ (Export Mode); Tối ưu hóa câu truy vấn trích xuất dữ liệu không gây khóa bảng (Performance Indexing & No-Lock Query); Đảm bảo tính tuân thủ RBAC Matrix
  * **Frontend**: Nâng cấp Component `WarehouseOrdersPage` ([`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///c:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)); Khai báo State & Import thư viện; Hiện thực hóa hàm trích xuất và tạo file Excel `handleExportStoredOrdersExcel`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png, screenshot_02_export_download_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_20/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_20/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_18] — Feedback 09/10 (Task 18) — Tối ưu Vị trí Nút Hành động "Tạo đơn nhập mới" & "Xuất kho" Ngay Sau Tên Hub Chống Che Khuất Bởi Thông Báo (09/10/2026 - 17:31)
- **Trạng thái**: ✅ Hoàn thành 100% (26/26 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành hệ thống TMS)
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Header trang Board Nhập kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Quản lý Xuất kho (`/dashboard/warehouse/outbound`) ➔ Header trang Board Xuất kho ([`page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx)) • Header thanh điều hướng hệ thống & Khung thông báo ([`header.tsx`](file:///D:/Projects/logistics-website/frontend/src/components/layout/header.tsx) & [`notification-center.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/notifications/components/notification-center.tsx))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & Đảm bảo tính toàn vẹn của Backend APIs liên quan; Kiểm tra tính ổn định của API danh sách chuyến xe nhập kho: `GET /api/v1/warehouse/inbound-trips`.; Kiểm tra tính ổn định của API danh sách chuyến xe xuất kho: `GET /api/v1/warehouse/outbound-trips`....
  * **Frontend**: Tái cấu trúc Header trang Quản lý Nhập kho ([`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)); Gom nhóm tiêu đề trang và nút tạo đơn vào cùng một flex container; Giữ nguyên nút `Quay lại danh sách` (`activeView !== 'BOARD'`) ở góc bên phải (`justify-between`) để người dùng dễ dàng thoát khỏi màn hình tạo phiếu....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_verified.png, screenshot_inbound_button_verified.png, screenshot_outbound_button_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_18/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_18/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_16] — Feedback 09/10 (Task 16) — Chuẩn Hóa Hiển Thị Tỉnh/Thành Phố Đích Trên Tem Nhận Diện Hàng Hóa A4 (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (7/7 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Phản hồi & Yêu cầu vận hành trực tiếp)
- **Phạm vi**: Modal Xem & In Tem Nhận Diện Hàng Hóa A4 ([`PalletLabelA4Modal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)) • Quản lý Nhập kho (`/warehouse/inbound`) ➔ Danh sách đơn hàng con, Tác nghiệp Kiểm đếm ([`WarehouseTallyModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-tally-modal.tsx)) & Chi tiết Vận đơn ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Bảng kê Nhập kho dạng lưới ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Quản lý Hàng hóa trong kho (`/warehouse/orders`) ➔ Nút in tem trên từng dòng vận đơn & Modal chi tiết vận đơn • Quản lý Xuất kho & Chuyển giao ([`WarehouseOutboundTransferFlow`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-outbound-transfer-flow.tsx)) • Backend API Logistics TMS (NestJS 11+ / PostgreSQL trên Neon)
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & đảm bảo quan hệ `destinationHubEntity` kèm cột `city` trong các truy vấn; Kiểm tra biên dịch & Linting Backend
  * **Frontend**: Nâng cấp Component `PalletLabelA4Modal` ([`pallet-label-a4-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx)); Cập nhật dữ liệu truyền vào `PalletLabelA4Modal` tại tất cả 5 màn hình vận hành; Tuân thủ quy chuẩn Compact Density & Cleanliness
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_16/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_16/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_13] — Feedback 09/10 (Task 13) — Tách Cột Thông Tin Hàng Hóa & Chuẩn Hóa Thuật Ngữ (Số Lượng, CBM) Tại Màn Hình Tổng Hợp Đơn Hàng Kho (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (27/27 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành kho)
- **Phạm vi**: Phân hệ Quản lý Kho (`/dashboard/warehouse/orders`) ➔ Trang **Tổng Hợp Đơn Hàng Tại Kho** ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Modal Chi tiết Vận đơn Kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Bảng tra cứu & chọn hàng hóa kho liên quan ([`WarehouseLookupModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-lookup-modal.tsx), [`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Backend REST API Quản lý Đơn hàng Kho ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & Đảm bảo Tính Toàn vẹn Dữ liệu tại API `GET /api/v1/warehouse/orders`; Cập nhật Swagger & DTO API Documentation; Kiểm tra tính toàn vẹn câu truy vấn tìm kiếm Freetext
  * **Frontend**: Tái cấu trúc Bảng Dữ liệu tại [`frontend/src/app/dashboard/warehouse/orders/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx); Cập nhật hằng số tổng số cột (`COLUMN_COUNT`); Tái thiết kế hàng tiêu đề bảng (`<thead>`) với 11 cột độc lập chuẩn Compact Density...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_13/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_13/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_10] — Feedback 09/10 Task 10 — Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng: Bắt Buộc Để Trống Tuyệt Đối Khi Đơn Hàng Ở Trạng Thái Lưu Kho (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (21/21 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Triển khai Backend Guard trong `warehouse.service.ts` (`aggregateOrderGroup` & `enrichWarehouseRows`); 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Member Rows)...
  * **Frontend**: 2.1. Cập nhật cấu trúc bảng 7 cột trong `WarehouseOrdersPage`; 2.2. Triển khai Frontend Guard hiển thị ô Cột "Ngày xuất"; 2.3. Triển khai hiển thị Cột "Ngày nhập" & "Mã vận đơn" kèm thông tin No-SKU...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_10/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_10/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_9] — Feedback 09/10 Task 9 — Chuẩn Hóa Toàn Diện Bảng Đơn Hàng Kho 7 Cột & Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng (Để Trống Tuyệt Đối Khi Đang Lưu Kho) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (18/18 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Nâng cấp logic tổng hợp trong `aggregateOrderGroup` & `enrichWarehouseRows`; 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Non-Grouped)...
  * **Frontend**: 2.1. Cập nhật cấu trúc bảng trong `WarehouseOrdersPage`; 2.2. Triển khai render nội dung các ô dữ liệu (Table Cells); 2.3. Cập nhật bảng con mở rộng (Expanded Row)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_9/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_9/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_8] — Feedback 09/10 Task 8 — Hoàn Thiện Quy Chuẩn Bảng Đơn Hàng Kho 7 Cột & Ràng Buộc Nghiệp Vụ Cột Ngày Xuất Hàng (Để Trống Khi Lưu Kho) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (16/16 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Chi tiết vận đơn & Sổ cái kho ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Bảng dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO & Interface trả về của Warehouse Orders; 1.2. Nâng cấp logic tổng hợp trong `aggregateOrderGroup` & `enrichWarehouseRows`; 1.3. Đảm bảo tính nhất quán cho cả 2 chế độ xem (Grouped & Non-Grouped)...
  * **Frontend**: 2.1. Tái cấu trúc cấu trúc bảng 7 cột tại Trang Đơn Hàng Kho; 2.2. Render Cột 2 — "Ngày nhập"; 2.3. Render Cột 3 — "Mã vận đơn" (Tích hợp thông tin kiện No-SKU)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_8/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_8/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_7] — Feedback 09/10 Task 7 — Tái Cấu Trúc Bảng Dữ Liệu Đơn Hàng Kho Theo Chuẩn Nghiệp Vụ Vận Hành (7 Cột Chuẩn Mực) (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Đơn hàng kho (`/warehouse/orders`) ➔ Trang tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Backend Phân hệ Kho vận (`backend/src/orders/`) ➔ Controller & Service xử lý sổ cái hàng hóa ([`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts) & [`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Dữ liệu Giao dịch Kho bãi ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts)) • Modal Chi tiết Vận đơn & Sổ cái ([`WarehouseWaybillDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật `WarehouseService.enrichWarehouseRows`; 1.2. Cập nhật `WarehouseService.aggregateOrderGroup` (Chế độ Gom nhóm `groupBy=orderCode`); 1.3. Cập nhật Type Definitions & Interface trong Backend...
  * **Frontend**: 2.1. Cập nhật hằng số & tiêu đề cột tại `frontend/src/app/dashboard/warehouse/orders/page.tsx`; 2.2. Xây dựng hàm định dạng Ngày/Giờ chuẩn Việt Nam; 2.3. Tái cấu trúc Render dòng dữ liệu cha (`row`)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_7/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_7/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_6] — Feedback 09/10 Task 6 — Loại bỏ Cột Trạng thái Đơn hàng tại Màn hình Nhập kho & Tinh gọn Giao diện Bảng kê (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @TMS Domain Lead
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Bảng kê danh sách chuyến xe và bảng con chi tiết đơn hàng trực thuộc chuyến xe ([`WarehouseInboundPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx)) • Bảng kê kiểm đếm & Phân hệ vận hành kho bãi ([`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx) & [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Quy chuẩn giao diện hẹp ([`.agents/rules/ui-compact-density.md`](file:///D:/Projects/logistics-website/.agents/rules/ui-compact-density.md) & [`ui-spacing-guard`](file:///D:/Projects/logistics-website/.agents/skills/ui-spacing-guard/SKILL.md)) • Backend API `/api/v1/warehouse/inbound-trips` & Type check toàn dự án
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát API Contract `inbound-trips` trong `WarehouseService` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Bảo toàn Cơ sở dữ liệu & Entity; Kiểm tra biên dịch & Linting Backend
  * **Frontend**: Chỉnh sửa Bảng con Đơn hàng trong [`frontend/src/app/dashboard/warehouse/inbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/inbound/page.tsx); Bảo toàn tuyệt đối Cột `TRẠNG THÁI` của Bảng cha; Rà soát các Component liên quan trong Phân hệ Kho bãi...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_6/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_6/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_5] — Feedback 09/10 (Task 5) — Khắc phục lỗi Tạo mới Tài khoản Người dùng (Internal Server Error 500 do xung đột Soft-Delete & Ràng buộc Unique Database) (09/10/2026 (14:12))
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Người dùng / Vận hành) & TMS Domain Lead Verification
- **Phạm vi**: Quản lý Người dùng (`/dashboard/users`) ➔ Popup Thêm Người Dùng Mới ([`UserFormDialog`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-dialog.tsx)) & Form Sheet ([`UserFormSheet`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-sheet.tsx)) • Backend Users Module: Controller, Service, DTO, TypeORM Repository, Mapper & Entity ([`users.controller.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.controller.ts), [`users.service.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.service.ts), [`user.repository.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/repositories/user.repository.ts), [`user.mapper.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/mappers/user.mapper.ts), [`user.entity.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/entities/user.entity.ts)) • Cơ sở dữ liệu Neon PostgreSQL (Singapore `ap-southeast-1`): Bảng `"user"`, các chỉ mục & ràng buộc unique `UQ_e12875dfb3b1d92d7d7c5377e22` (`UNIQUE (email)`), `UQ_user_username` (`UNIQUE (username)`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Tạo Migration PostgreSQL chuyển đổi sang Partial Unique Index (`WHERE "deletedAt" IS NULL`); Nâng cấp `UsersRelationalRepository` ([`user.repository.ts`](file:///D:/Projects/logistics-website/backend/src/users/infrastructure/persistence/relational/repositories/user.repository.ts)); Tái cấu trúc Logic Nghiệp vụ `UsersService.create()` ([`users.service.ts`](file:///D:/Projects/logistics-website/backend/src/users/users.service.ts))
  * **Frontend**: Chuẩn hóa Giao diện Hẹp theo Quy chuẩn UI Compact Density ([`user-form-dialog.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-dialog.tsx) & [`user-form-sheet.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/users/components/user-form-sheet.tsx)); Chống xung đột Trình quản lý Mật khẩu Browser AutoFill; Nâng cấp Từ điển Lỗi & Hiển thị Thông báo Thân thiện ([`api-error.ts`](file:///D:/Projects/logistics-website/frontend/src/lib/api-error.ts))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_5/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_5/TODO.md)

### 🚀 [FEEDBACK_09_10] — Feedback 09/10 — Phân Định Tuyệt Đối Quy Trình Tác Nghiệp: Chuyến Xe Nhập Trực Tiếp (Khách Gửi) vs. Chuyến Xe Trung Chuyển Liên Hub (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (9/9 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS) & @TMS Domain Lead
- **Phạm vi**: Quản lý Nhập kho (`/dashboard/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • API Quản lý Manifest Chuyến xe ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts) & [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Giao diện thanh tiến trình tác nghiệp trạm (Stepper Bar) & Cụm nút hành động chân modal (Modal Action Footer) • Bốc thêm đơn dọc đường ([`WarehouseAppendOrderModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx))
- **Năng lực & Tính năng mới**:
  * **Backend**: Chuẩn hóa loại chuyến xe trong `WarehouseService.appendOrderToTrip` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); Kiểm tra tính toàn vẹn của cờ `isTransfer` trong `getTripManifest`; Rà soát API `GET /api/v1/warehouse/inbound-trips`
  * **Frontend**: Tái cấu trúc điều kiện hiển thị trong [`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10/RESOLUTION.md) • [`TODO.md`](../feedback_09_10/TODO.md)

### 🚀 [FEEDBACK_09_10_TASK_4] — Feedback 09/10 (Task 4) — Loại Bỏ Nút "Xem Tài Khoản Demo" & Cụm Banner Thử Nghiệm Tại Màn Hình Đăng Nhập (09/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (3/3 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS — Spider Express)
- **Phạm vi**: Frontend Authentication UI: Trang Đăng nhập (`/auth/sign-in`) ➔ Form Đăng nhập ([`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx)) • E2E Testing Suite: Cập nhật kịch bản kiểm thử giao diện đăng nhập ([`08-check-vercel-vs-local-signin.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/08-check-vercel-vs-local-signin.spec.ts) và tạo mới suite kiểm định [`40-feedback-09-10-task-4-remove-demo-accounts.spec.ts`](file:///D:/Projects/logistics-website/frontend/e2e/40-feedback-09-10-task-4-remove-demo-accounts.spec.ts))
- **Năng lực & Tính năng mới**:
  * **Frontend**: 1.1. Loại bỏ khối Demo Accounts trong [`login-form.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/auth/components/login-form.tsx); 1.2. Kiểm tra biên dịch TypeScript & Next.js App Router; 2.1. Cập nhật và bổ sung E2E Spec
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_09_10_task_4/RESOLUTION.md) • [`TODO.md`](../feedback_09_10_task_4/TODO.md)

### 🏆 [RELEASE_V1.0.0] — Milestone Release v1.0.0: Chuẩn Hóa Toàn Bộ 7 Flow Nghiệp Vụ Vận Hành Cốt Lõi TMS Spider Express (08/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (7 Flow nghiệp vụ cốt lõi)
- **Báo cáo bởi**: @Thai (Owner / Operator) & Antigravity TMS Multi-Agent Team
- **Phạm vi**: Toàn bộ hệ thống fullstack: Orders, Fleet, Inbound, Outbound, Inventory Ledger, Hubs Network, Real-time Notifications, RBAC 3 lớp.
- **Năng lực & Tính năng mới**:
  * Chuẩn hóa mã đơn Enterprise `{HUB}-{INITIALS}-{YYMM}-{SEQ}` & hỗ trợ mã vận đơn tự do kiểm tra trùng lặp DB thời gian thực.
  * Phân tầng 3 hình thức giao nhận `DIRECT_CUSTOMER`, `HUB_L1`, `XE_BO` với cách ly tuyệt đối hàng khách lẻ tại trạm trung chuyển.
  * Bốc đơn lưu kho lên chuyến xe trung chuyển (Bước 2 Inbound) qua Modal 10 cột dữ liệu tối ưu hiển thị.
  * Kiểm đếm dỡ hàng Tally Sheet, bốc hàng dọc đường Roadside Pickup, in tem nhãn Pallet/Barcode.
  * Sổ cái giao dịch kho bất biến `OrderInventoryTransactionEntity`, Zero Stock Auto-Clear triệt tiêu nhãn `LƯU KHO` khi hết tồn.
  * Token Manager đồng bộ 0ms đa tab với Proactive Silent Heartbeat, bảo đảm phiên làm việc liên tục.
- **Bằng chứng nghiệm thu**:
  * Backend NestJS 11 build: PASS (0 lỗi)
  * Frontend Next.js 16 typecheck & build: PASS (33/33 routes)
  * Playwright E2E: 37/37 suites PASS 100%
  * Production & Dev Cloud deployments (Render & Vercel) LIVE & Health Check 200 OK
- **Tài liệu tham chiếu**: [`docs/RELEASE_v1.0.0_BUSINESS_FLOWS.md`](RELEASE_v1.0.0_BUSINESS_FLOWS.md) • [`CODEBASE_AUDIT.md`](../CODEBASE_AUDIT.md)

### 🚀 [FEEDBACK_07_10_TASK_29] — Feedback 07/10 Task 29 — Chuẩn Hóa Logic Mặc Định Nhập Kho Hub Cấp 1 & Bảo Toàn Thông Tin Đơn Hàng Giữ Nguyên Địa Chỉ Giao Ban Đầu (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (11/11 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành TMS — Spider Express)
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho & Bảng kê xuất hàng ([`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) & [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm dỡ hàng ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) & [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)) • Backend Service & Controller: Điều phối Chuyến xe, Xuất kho, Bảng kê lộ trình Manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)) • Khế ước dữ liệu & Luồng chuyển tiếp trạng thái vòng đời chuyến xe đa chặng (Multi-Stop Inter-Hub Linehaul Journey)
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật DTO xuất kho ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)); 1.2. Triệt tiêu hoàn toàn logic ghi đè dữ liệu đơn hàng trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); 1.3. Áp dụng chuẩn hóa tương tự cho `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))...
  * **Frontend**: 2.1. Chuẩn hóa luồng gửi dữ liệu xuất kho tại [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx); 2.2. Nâng cấp Bảng kê Tally Nhập kho ([`warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)); 2.3. Cập nhật Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01_origin_hub_dest_logic_verified.png, screenshot_02_switch_filtered_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_29/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_29/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_27] — Feedback 07/10 Task 27 — Khắc Phục Lỗi Mặc Định Nhập Kho Nhầm Đơn Giao Thẳng Cho Khách (DIRECT_CUSTOMER) Tại Trạm Trung Chuyển (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (11/11 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành TMS)
- **Phạm vi**: Quản lý Xuất kho (`/warehouse/outbound`) ➔ Tạo phiếu xuất kho Mode 1 (`activeView === 'MODE1_CUSTOMER'`) & Bảng kê xuất hàng ([`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx) & [`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe, Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx) & [`WarehouseTripTallyTable`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)) • Backend Service & Controller: Logic điều phối chuyến xe, xuất kho và bảng kê lộ trình manifest ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: 1.1. Cập nhật `ConfirmOutboundDto` & `OutboundItemDto` ([`confirm-outbound.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/confirm-outbound.dto.ts)); 1.2. Sửa lỗi ghi đè dữ liệu trong `confirmOutbound` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)); 1.3. Sửa lỗi ghi đè dữ liệu trong `saveOutboundDraft` ([`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts))...
  * **Frontend**: 2.1. Cập nhật `buildOutboundRequest` trong [`outbound/page.tsx`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/outbound/page.tsx); 2.2. Nâng cấp Bảng kê Tally Nhập kho ([`warehouse-trip-tally-table.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-tally-table.tsx)); 2.3. Cập nhật Modal Chi tiết Chuyến xe ([`warehouse-trip-detail-modal.tsx`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx))...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_01_tally_direct_customer_isolation_verified.png, screenshot_02_switch_hide_other_hubs_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_27/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_27/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_24] — Feedback 07/10 Task 24 — Tùy biến Hình thức & Địa chỉ Giao nhận (Khách / Hub Cấp 1 / Tuyến Xe Bo) Cho Đơn Hàng Xuất Mới Lên Chuyến Xe Tại Trạm Trung Chuyển (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (57/57 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ & Vận hành Logistics TMS)
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Điều phối trung chuyển ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) — **Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp (`OUTBOUND STAGE`)** • Popup Chọn đơn lưu kho xuất lên chuyến xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Modal Chọn đích xuất kho điều chuyển ([`WarehouseDestinationModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-destination-modal.tsx)) • Lưới xuất kho chuẩn tham chiếu ([`WarehouseEditableGrid`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) • Backend Quản lý Kho vận & Điều phối Chuyến xe ([`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts), [`WarehouseController`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts), [`TripEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip.entity.ts), [`TripStopEntity`](file:///D:/Projects/logistics-website/backend/src/trips/infrastructure/persistence/relational/entities/trip-stop.entity.ts))
- **Năng lực & Tính năng mới**:
  * **Backend**: Tạo DTO `UpdateTripOrderDestinationDto`** ([`backend/src/orders/dto/update-trip-order-destination.dto.ts`](file:///D:/Projects/logistics-website/backend/src/orders/dto/update-trip-order-destination.dto.ts)); Khai báo `deliveryMode`: Enum `'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO'` (Bắt buộc).; Khai báo `destinationHubId`: `number | null` (Bắt buộc khi `HUB_L1` hoặc `XE_BO`; gán `null` khi `DIRECT_CUSTOMER`)....
  * **Frontend**: Mở rộng API Client & Types trong `trip-manifest.ts`** ([`frontend/src/features/warehouse/api/trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts)); Bổ sung trường `deliveryMode?: 'DIRECT_CUSTOMER' | 'HUB_L1' | 'XE_BO' | string` vào interface `TripManifestLine`.; Bổ sung trường `originalDeliveryAddress?: string` vào interface `TripManifestLine`....
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: 01_step2_interactive_destination_cell.png, screenshot_01.jpg, screenshot_01_step2_interactive_destination_cell_verified.png, screenshot_02_destination_selection_modal_verified.png, screenshot_03_destination_updated_hub_l1_verified.png, screenshot_04_reset_to_original_customer_address_verified.png, screenshot_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_24/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_24/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_22] — Feedback 07/10 Task 22 — Mở Rộng Kích Thước & Tối Ưu Giao Diện Modal "Chọn Đơn Lưu Kho Bốc Lên Chuyến Xe" (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (12/12 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Domain Lead Verification
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Bước 2: Xuất hàng mới lên xe đi trạm kế tiếp ➔ Modal Chọn đơn lưu kho bốc lên chuyến xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • Cấu hình Base UI Dialog Component ([`dialog.tsx`](file:///D:/Projects/logistics-website/frontend/src/components/ui/dialog.tsx)) • API Bảng kê chuyến xe & Đơn xuất khả dụng ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts), [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Cơ sở dữ liệu PostgreSQL trên Neon Singapore (`ap-southeast-1.aws.neon.tech`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Rà soát & bảo đảm tính toàn vẹn của Endpoint `GET /api/v1/warehouse/trips/:tripCode/available-outbound-orders`; Kiểm tra tính nhất quán của API `POST /api/v1/warehouse/trips/:tripCode/append-stored-orders`
  * **Frontend**: Nâng cấp toàn diện kích thước Modal trong `WarehouseSelectStoredOrdersModal`; Mở rộng chiều cao vùng hiển thị danh sách (Table Container Viewport); Tái cấu trúc và phân bổ độ rộng chuẩn cho 10 cột dữ liệu (Table Columns)...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_02_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_22/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_22/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_21] — Feedback 07/10 Task 21 — Khắc phục Lỗi Không Hiển thị Danh sách Đơn Lưu kho khi Xuất thêm Lên Trip (07/10/2026 (13:49))
- **Trạng thái**: ✅ Hoàn thành 100% (30/30 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Domain Lead Verification
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`) ➔ Chi tiết chuyến xe & Kiểm đếm hàng hóa ([`WarehouseTripDetailModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-trip-detail-modal.tsx)) • Popup Chọn đơn lưu kho bốc lên xe ([`WarehouseSelectStoredOrdersModal`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx)) • API Bảng kê chuyến xe & Đơn xuất khả dụng ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts), [`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts), [`warehouse.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Sổ cái giao dịch kho & Quản lý vị trí Hub ([`operational-ledger.service.ts`](file:///D:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts), thực thể `OrderEntity`, `TripStopEntity`, `OrderInventoryTransactionEntity`) • Cơ sở dữ liệu PostgreSQL trên Neon Singapore (`ap-southeast-1.aws.neon.tech`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Nâng cấp Controller `WarehouseController` ([`warehouse.controller.ts`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.controller.ts)); Bổ sung `@Query('hubId') hubId?: number` vào endpoint `@Get('trips/:tripCode/available-outbound-orders')`.; Cập nhật Swagger documentation `@ApiQuery({ name: 'hubId', required: false, type: Number, description: 'ID kho xuất của tài khoản đang thao tác' })`....
  * **Frontend**: Cập nhật API Client & TanStack Query Hook ([`trip-manifest.ts`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/api/trip-manifest.ts)); Cập nhật hàm `getAvailableOutboundOrders(tripCode: string, hubId?: number | null)`; Cập nhật hook `useAvailableOutboundOrdersQuery(tripCode, hubId, enabled)`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: screenshot_01.jpg, screenshot_02_verified.png
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_21/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_21/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_12] — Feedback 07/10 Task 12 — Chuẩn Hóa Quản Lý Tồn Kho & Khắc Phục Lỗi Trạng Thái "LƯU KHO" Khi Số Lượng Tồn Bằng 0 (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (19/19 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Quản lý nghiệp vụ / Vận hành) & @Antigravity Verification
- **Phạm vi**: Quản lý Đơn hàng kho (`/dashboard/warehouse/orders`) ➔ Danh sách & Bảng tổng hợp đơn hàng tại kho ([`WarehouseOrdersPage`](file:///D:/Projects/logistics-website/frontend/src/app/dashboard/warehouse/orders/page.tsx)) • Bảng trạng thái & Huy hiệu đơn kho ([`renderWarehouseOrderStatusBadge`](file:///D:/Projects/logistics-website/frontend/src/features/warehouse/components/warehouse-tables/columns.tsx)) • Sổ cái vận hành kho & Phân quyền dữ liệu Hub ([`OperationalLedgerService`](file:///D:/Projects/logistics-website/backend/src/orders/operational-ledger.service.ts)) • Dịch vụ xử lý kho & Vòng đời đơn hàng ([`WarehouseService`](file:///D:/Projects/logistics-website/backend/src/orders/warehouse.service.ts)) • Giao dịch kho & Thực thể liên kết ([`OrderInventoryTransactionEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order-inventory-transaction.entity.ts), [`OrderEntity`](file:///D:/Projects/logistics-website/backend/src/orders/infrastructure/persistence/relational/entities/order.entity.ts)) • Cơ sở dữ liệu Neon PostgreSQL Singapore (`ap-southeast-1`)
- **Năng lực & Tính năng mới**:
  * **Backend**: Sửa đổi `hubScopeSql()`; Sửa đổi `hubStatusSql()` triệt tiêu trạng thái "LƯU KHO" khi tồn kho bằng 0; Sửa đổi `applyStatusFilter()`...
  * **Frontend**: Đồng bộ hóa Tab Filter & Dữ liệu hiển thị; Bảo vệ hiển thị trạng thái tại cột `TRẠNG THÁI`; Kiểm tra `renderWarehouseOrderStatusBadge()`...
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: 01_e2e_warehouse_orders_clean_stored_tab.png, screenshot_01.jpg
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_12/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_12/TODO.md)
### 🚀 [FEEDBACK_07_10_TASK_11] — Tối ưu Giao diện Bảng Kê Xuất Kho: Loại Bỏ Cột Trạng Thái Thừa (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @【M】【C】【D】 (Bộ phận Vận hành & Nghiệp vụ Kho Vận TMS)
- **Phạm vi**: Modal Chọn đơn lưu kho xuất xe (`WarehouseSelectStoredOrdersModal`), Bảng danh sách đơn hàng xuất luân chuyển Mode 2 (`WarehouseOutboundTransferFlow`), Trang xuất kho (`/dashboard/warehouse/outbound/page.tsx`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Bảo đảm tính toàn vẹn của tập dữ liệu đơn xuất kho (`getAvailableOutboundOrders`), 100% đơn hiển thị thuộc tập hợp lưu kho khả dụng.
  * **Frontend**: Loại bỏ hoàn toàn cột "Trạng thái đơn hàng" thừa thãi khỏi bảng kê chọn đơn xuất kho; Tái phân bổ độ rộng cột (Column Width Layout) cho Mã đơn, Kiện, Trọng lượng, Thể tích, Kho đích; Áp dụng triệt để Compact Density (`p-1`, `text-[10px]`, `py-1 px-1.5`).
- **Quy tắc bất biến mới**:
  * Mọi đơn hàng xuất hiện trong modal chọn đơn xuất kho đều mặc định là đơn đang lưu kho khả dụng, không hiển thị cột trạng thái gây chật chội và thừa thãi thông tin.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10_task_11/screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_11/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_11/TODO.md)

### 🚀 [FEEDBACK_07_10_TASK_10] — Chuẩn Hóa Cột Kho Đích & Gán Đơn Lưu Kho Lên Chuyến Xe (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (18/18 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ) & @Antigravity Team
- **Phạm vi**: Chi tiết Chuyến xe & Tác nghiệp Trạm trung chuyển Bước 2 (`WarehouseTripDetailModal`), Modal Chọn đơn lưu kho (`WarehouseSelectStoredOrdersModal`), Batch Append API (`append-stored-orders.dto.ts`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Endpoint gán hàng loạt đơn lưu kho lên chuyến xe (`POST /api/v1/warehouse/trips/:tripCode/orders/batch-stored`); Cập nhật `destinationHubId` và sinh giao dịch sổ cái kho; Tự động tính toán lại tải trọng và thể tích xe.
  * **Frontend**: Xây dựng Modal chọn đơn lưu kho đa chọn với checkbox, tìm kiếm mã đơn thời gian thực, hiển thị khối lượng và thể tích cộng dồn tức thời; Hiển thị chuẩn xác tên Kho đích.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10_task_10/screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10_task_10/RESOLUTION.md) • [`TODO.md`](../feedback_07_10_task_10/TODO.md)

### 🚀 [FEEDBACK_07_10] — Chuẩn Hóa Cột Kho Đích / Nơi Giao & Đồng Bộ Phiếu Xuất Kho (07/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (32/32 việc)
- **Báo cáo bởi**: @Thai (Quản lý nghiệp vụ / Vận hành) & @Antigravity TMS Lead
- **Phạm vi**: Phiếu Xuất Kho in ấn (`WarehouseOutboundReceiptModal`), Chi tiết Chuyến xe Bước 2 (`WarehouseTripDetailModal`), Bảng Quản lý Xuất kho (`/dashboard/warehouse/outbound`), Bảng kê Editable Grid (`WarehouseEditableGrid`).
- **Năng lực & Tính năng mới**:
  * **Backend**: Chuẩn hóa DTO và dữ liệu trả về của `getTripManifest()` và `getWarehouseOrdersForHub`; Join quan hệ `destinationHub` để lấy tên tiếng Việt của Hub nhận.
  * **Frontend**: Phiếu in xuất kho hiển thị chính xác tên Hub đích thay vì địa chỉ giao hàng cuối của khách; Đồng bộ hóa giao diện điều xe xuất kho với 2 luồng: Mode 1 (Tạo mới) & Mode 2 (Luân chuyển nội bộ).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_07_10/02_e2e_select_stored_orders_clean_columns.png`, `screenshot_01.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_07_10/RESOLUTION.md) • [`TODO.md`](../feedback_07_10/TODO.md)

### 🚀 [FEEDBACK_06_10] — Bốc Hàng Dọc Đường (Roadside Pickup) & Gán Vào Chuyến Xe Đang Chạy (06/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (22/22 việc)
- **Báo cáo bởi**: @Thai & Đội ngũ Điều phối Hiện trường
- **Phạm vi**: Quản lý Nhập kho (`/warehouse/inbound`), Chi tiết chuyến xe (`WarehouseTripDetailModal`), Modal Bốc thêm đơn (`WarehouseAppendOrderModal`), In phiếu kho, Sổ cái luân chuyển.
- **Năng lực & Tính năng mới**:
  * **Backend**: Hỗ trợ bốc đơn hàng dọc đường khi xe đang chạy trên lộ trình (`IN_TRANSIT`); Tự động gán điểm dừng phát sinh và trạm nhận hàng bàn giao; Tạo giao dịch luân chuyển an toàn không làm âm tồn kho kho nhận.
  * **Frontend**: Redesign Modal bốc hàng dọc đường với giao diện compact gọn gàng; Loại bỏ nút bấm thừa trên header bảng; Phân biệt rõ đơn nhập từ kho trung chuyển và đơn lấy dọc đường.
- **Quy tắc bất biến mới**:
  * Đơn bốc dọc đường không có kho xuất phát vật lý (`originHubId = null`) chỉ ghi nhận vào sổ cái khi thực nhận tại Hub bàn giao hoặc Hub đích.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`33-feedback-06-10.spec.ts`)
  * Minh chứng hình ảnh: `feedback_06_10/screenshot_01.jpg` đến `screenshot_07.jpg`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_06_10/RESOLUTION.md) • [`TODO.md`](../feedback_06_10/TODO.md)

### 🚀 [FEEDBACK_05_10] — Gom Hàng Inbound, Chuyến Xe Nháp, Tái Sử Dụng Mã Chuyến (05/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (42/42 việc)
- **Báo cáo bởi**: @【M】【C】【D】 & Dispatch Lead
- **Phạm vi**: Bảng điều khiển Xuất kho (`/warehouse/outbound`), Bảng Nhập kho (`/warehouse/inbound`), API Chuyến xe kho (`WarehouseController`), Phân quyền RBAC v1.6.
- **Năng lực & Tính năng mới**:
  * **Backend**: Endpoint `GET /v1/warehouse/outbound-trips` trả về danh sách chuyến xe kèm bộ đếm 1:1 Parity từ cùng CTE; Cho phép lưu chuyến xe ở trạng thái Nháp (`DRAFT`); Hỗ trợ tái sử dụng mã chuyến xe khi chuyến cũ bị hủy; Tự động kết nối đơn hàng phân tách (Split Shipments).
  * **Frontend**: Chuẩn hóa đơn vị hiển thị thành `chuyến xe` đồng bộ giữa các Tab và Footer; Tái cấu trúc các Tab trạng thái xuất kho (`Tất cả`, `Xuất khách`, `Luân chuyển`); Đổi nhãn pallet kho rõ ràng; Tích hợp TanStack React Table v8.
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`32-feedback-05-10.spec.ts`)
  * Minh chứng hình ảnh: `feedback_05_10/filter_outbound_wrong.png`
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_05_10/RESOLUTION.md) • [`TODO.md`](../feedback_05_10/TODO.md)

### 🚀 [FEEDBACK_04_10] — Tách Rời Kiểm Đếm Inbound & Chuyến Xe, Excel Parser & Chuẩn Hóa UTC (04/10/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (13/13 việc)
- **Báo cáo bởi**: @Thai & Thủ kho Andromeda
- **Phạm vi**: Quản lý Nhập kho Inbound Tally, Import Excel, Chuẩn hóa múi giờ PostgreSQL Neon.
- **Năng lực & Tính năng mới**:
  * **Backend**: Tách rời quy trình kiểm đếm hàng về kho khỏi chuyến xe vận tải (Decoupling Tally & Trip); Xử lý múi giờ UTC trong pg driver PostgreSQL đối với `TIMESTAMP WITHOUT TIME ZONE` tránh lệch ngày giờ giao nhận.
  * **Frontend**: Xóa bỏ cột `Hình thức giao hàng (deliveryMode)` khỏi file mẫu Excel và form nhập liệu; Mặc định parse sang `DIRECT_CUSTOMER`; Tối ưu UX kiểm đếm thực nhận theo kiện vận tải (Consignment No-SKU).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100%
  * Minh chứng hình ảnh: `feedback_04_10/` screenshots
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_04_10/RESOLUTION.md) • [`TODO.md`](../feedback_04_10/TODO.md)

### 🚀 [FEEDBACK_17_8] — Chuẩn Hóa Toàn Diện TanStack Table v8, Phân Trang & RBAC (18/08/2026)
- **Trạng thái**: ✅ Hoàn thành 100% (33/33 việc)
- **Báo cáo bởi**: @Thai & Team Lead
- **Phạm vi**: 7 màn hình danh sách TMS (`orders`, `trips`, `fleet`, `warehouse`, `hubs`, `users`, `notifications`), Middleware RBAC 3 lớp, Mail Simulation.
- **Năng lực & Tính năng mới**:
  * **Backend**: Cơ chế `MAIL_SIMULATE=true` giả lập email trong dev/test tránh cạn quota SMTP; Giải quyết triệt để Circular Dependency TypeORM bằng `Relation<T>`; Chuẩn hóa quan hệ Hubs và Vehicles.
  * **Frontend**: Tái cấu trúc toàn bộ 7 trang danh sách dữ liệu sang TanStack React Table v8 + URL Search Params sync (`nuqs`); Chuẩn hóa phân trang và thanh điều khiển; Phân quyền menu sidebar theo RBAC 3 lớp (Super Admin, Dispatcher, Fleet Manager, Warehouse Manager).
- **Bằng chứng nghiệm thu**:
  * Playwright E2E: PASS 100% (`06-order-dispatch-workflow.spec.ts`)
  * TypeScript & Lint: 0 lỗi
- **Tài liệu tham chiếu**: [`RESOLUTION.md`](../feedback_17_8/RESOLUTION.md) • [`TODO.md`](../feedback_17_8/TODO.md)
