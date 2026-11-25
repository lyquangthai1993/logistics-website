# Script tra cứu snapshot đơn hàng theo kho

> **Ngày ghi nhận**: 24/11/2026
> **Trạng thái**: Script đã tạo; không chạy API thật hoặc test trong task này.
> **Phạm vi**: Hub Cấp 1 HCM, Hưng Yên, Đà Nẵng; trạng thái Lưu kho và Đơn nháp.

## Nguồn dữ liệu

Script gọi `GET /warehouse/orders/summary` với `hubId` và trạng thái `INBOUND` hoặc `DRAFT`. Đây là snapshot theo Hub mà màn hình “Tổng Hợp Đơn Hàng Tại Kho” đang sử dụng; script không tự cộng dữ liệu đơn hàng. Backend tự làm mới snapshot này theo lịch mỗi 5 phút và không có API refresh thủ công cho riêng snapshot này, nên script đọc bản mới nhất rồi in `calculatedAt`.

Script tra mã Hub qua `GET /hubs/active?level=1`, nên không dựa vào ID cố định. Mỗi dòng kết quả gồm số đơn, tổng kiện, kg, m³ và thời điểm snapshot. Có thể chọn một Hub hoặc cả ba và xuất dạng bảng hoặc JSON.

## Cách dùng

```powershell
$env:TMS_ACCESS_TOKEN = '<super-admin-access-token>'
npm run report:warehouse-orders -- --hub hcm
npm run report:warehouse-orders -- --hub all --json
```

Thay access token bằng `TMS_USERNAME` và `TMS_PASSWORD` nếu muốn script tự đăng nhập. API đích mặc định là Railway Dev; đặt `TMS_API_BASE_URL` để đổi môi trường, ví dụ `http://localhost:4001/api/v1`.

## Kiểm thử

- Không chạy test hoặc gọi API thật theo phạm vi task này.

## Tệp liên quan

- `scripts/warehouse-order-snapshot-report.mjs`
- `package.json`
