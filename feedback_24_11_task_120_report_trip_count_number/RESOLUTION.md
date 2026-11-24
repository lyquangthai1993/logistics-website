# Bỏ hậu tố “chuyến” khỏi số tổng báo cáo vận hành

> **Ngày ghi nhận**: 24/11/2026
> **Trạng thái**: Đã cập nhật giao diện; không chạy test theo yêu cầu người dùng.
> **Phạm vi**: `/dashboard/admin/reports` — KPI tổng số chuyến xe.

## Thay đổi

- KPI vẫn tính tổng số chuyến nhập kho và xuất kho như trước, nhưng chỉ hiển thị giá trị số (ví dụ `1026`), bỏ chữ “chuyến”.
- Cập nhật assertion E2E hiện có để kỳ vọng KPI chỉ có giá trị số; assertion chưa được chạy.

## Kiểm thử

- Không chạy test theo yêu cầu của người dùng.

## Tệp liên quan

- `frontend/src/features/admin-reports/components/super-admin-operational-report.tsx`
- `frontend/e2e/118-feedback-admin-reports-and-warehouse-metrics.spec.ts`
