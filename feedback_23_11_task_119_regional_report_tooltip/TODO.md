# Sửa bộ lọc và tooltip báo cáo tình hình hàng hóa

> **Thời gian ghi nhận**: 23/11/2026
> **Người báo cáo**: Super Admin report
> **Phạm vi tác động**: `/dashboard/admin/reports` — biểu đồ tình hình hàng hóa

## Frontend

- [x] Bỏ tab lọc “Đã xuất kho”, giữ số liệu đã xuất trong tab “Tất cả”.
- [x] Ẩn “Đã xuất kho” khỏi tooltip của cả biểu đồ Tấn và m³.
- [x] Bổ sung kiểm tra tổng số đổi theo “Lưu kho”, “Nháp”, “Tất cả” và kiểm tra tooltip của cả hai biểu đồ.

## Kiểm thử và triển khai

- [x] Local Playwright: `e2e/119-regional-dispatch-report.spec.ts` — 2/2 pass.
- [x] E2E code audit — 50/50.
- [x] Railway Dev: backend và frontend build `SUCCESS`, active deployment khớp latest, health 200/307.
- [x] Xác nhận trên phiên Super Admin Dev đang mở: tab “Đã xuất kho” không còn; tooltip chỉ có “Lưu kho” và “Nháp”.

## Ghi chú Cloud E2E

Playwright Cloud Dev không đăng nhập được vì `POST /api/v1/auth/email/login` trả HTTP 500. Backend log ghi nhận duplicate primary key trong `AuthService.validateLogin`. Chạy lại Cloud E2E sau khi lỗi đăng nhập Dev được xử lý.
