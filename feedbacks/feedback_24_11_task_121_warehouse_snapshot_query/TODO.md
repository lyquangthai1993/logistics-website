# Script tra cứu snapshot đơn hàng theo kho

> **Thời gian ghi nhận**: 24/11/2026
> **Phạm vi tác động**: “Tổng Hợp Đơn Hàng Tại Kho” — Hub Cấp 1 HCM, Hưng Yên, Đà Nẵng

## Script

- [x] Gọi API snapshot hiện có theo từng Hub và trạng thái `INBOUND` / `DRAFT`.
- [x] Trả số đơn, tổng kiện, kg, m³ và thời điểm snapshot; hỗ trợ một Hub hoặc cả ba.
- [x] Xác thực bằng access token hoặc thông tin đăng nhập từ biến môi trường, không lưu bí mật vào repo.

## Ghi chú

- Không chạy test hoặc gọi API thật trong task này.

