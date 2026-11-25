# Feedback 211126 — triển khai

## Phạm vi đã chốt

- [x] Dùng đúng nhãn vận hành `Gửi kho`; không dùng `Ký gửi kho`.
- [x] Bổ sung `Gửi kho` vào lựa chọn tỉnh/thành và giữ nguồn danh sách theo file Excel đã cung cấp.
- [x] Báo cáo vận hành có tiêu chí `Gửi kho`.
- [x] Bỏ report `Số mã đơn theo miền` khỏi trang báo cáo.
- [x] Tính phần trăm biểu đồ theo toàn bộ vùng thanh, tách nhãn số liệu khỏi vùng vẽ.
- [x] `Tình hình hàng hóa` live bỏ phụ thuộc khoảng ngày truyền vào API; snapshot vẫn giữ cách đọc lịch sử.
- [x] Mobile biểu đồ vận hành cuộn ngang, desktop giữ bố cục hiện tại; ẩn tooltip hover trên mobile.
- [x] Super Admin được điều chỉnh dữ liệu đơn ở trạng thái `Lưu kho` khi đã chọn đúng một kho.
- [x] Backend từ chối bộ lọc `ALL`, trạng thái khác `Lưu kho`, role khác và thay đổi `orderCode`.
- [x] Ghi audit reason và phiếu điều chỉnh cho mọi thay đổi hợp lệ.

## Kế hoạch kiểm thử

1. Typecheck/build backend và frontend.
2. Unit test chuẩn hóa `Gửi kho` và kiểm tra các trường hợp từ chối override.
3. Chạy local E2E trên dữ liệu thật: báo cáo, mobile scroll, filter `Gửi kho`, modal chi tiết đơn kho.
4. Chạy `e2e-code-auditor` để đánh giá chéo test; không dùng mock HTML hoặc ảnh bảng rỗng làm bằng chứng.

## Rủi ro cần theo dõi

- Danh sách tỉnh/thành được phục vụ từ bảng `province_reference`; nếu môi trường chưa chạy seed Excel thì cần seed dữ liệu trước khi nghiệm thu.
- Các trường địa chỉ hiển thị trong modal là dữ liệu dẫn xuất; bản override chỉ ghi các cột thực có trong bảng `order`.
