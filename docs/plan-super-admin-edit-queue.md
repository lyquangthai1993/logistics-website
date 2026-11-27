# Super Admin Edit Queue

Mục tiêu là giúp Super Admin tìm, rà soát và chỉnh sửa nhiều đơn hàng liên tục mà không phải mở từng đơn từ bảng tổng hợp. Tính năng giữ dữ liệu thật, ghi nhận đầy đủ lịch sử thay đổi và vẫn cho phép mở modal chi tiết hiện tại khi cần kiểm tra sâu.

## In scope

- Trang hoặc khu vực “Hàng đợi chỉnh sửa” dành riêng cho Super Admin.
- Tìm kiếm toàn bộ theo mã đơn hoặc tên hàng, không dùng bộ lọc khoảng ngày trong hàng đợi.
- Lọc theo trạng thái và Hub.
- Bảng mật độ cao gồm mã đơn, tên hàng, trạng thái, Hub hiện tại, thời điểm cập nhật gần nhất và thao tác.
- Mở đơn từ hàng đợi vào màn chi tiết hiện tại, nơi Super Admin có thể chỉnh sửa các trường được phép.
- Sau khi lưu, làm mới dữ liệu bảng và các báo cáo/KPI liên quan.
- Giữ audit log với người sửa, thời gian, lý do, giá trị cũ và giá trị mới.
- Kiểm tra quyền: người không phải Super Admin không nhìn thấy hàng đợi và không có nút chỉnh sửa.

## Proposed approach

### MVP: Minimum Viable Product (Sản phẩm khả dụng tối thiểu)

Trong MVP, hàng đợi là một view quản lý trên dữ liệu đơn hàng thật, không tạo thêm trạng thái giả “cần chỉnh sửa”. Super Admin dùng tìm kiếm, trạng thái và Hub để thu hẹp danh sách, sau đó mở đơn cần xử lý.

Luồng chính:

```text
Đơn hàng kho
  -> tìm kiếm mã đơn / tên hàng
  -> lọc trạng thái / Hub
  -> chọn “Mở chỉnh sửa”
  -> modal chi tiết + nút bút từng trường
  -> lưu với lý do bắt buộc
  -> cập nhật bảng, KPI, báo cáo và audit log
```

Bảng MVP hiển thị một trang giới hạn từ API thật và dùng lại modal chi tiết cùng luồng admin override hiện có. Giai đoạn sau mới cân nhắc phân công người xử lý nếu cần biến hàng đợi thành một quy trình công việc đầy đủ.

## Decisions

- **Phạm vi dữ liệu:** hiển thị tất cả đơn thật rồi cho Super Admin lọc; chưa thêm cờ hoặc trạng thái “cần chỉnh sửa” trong MVP.
- **Tìm kiếm:** tìm trên toàn bộ dữ liệu theo mã đơn hoặc tên hàng; không thêm khoảng ngày vào hàng đợi.
- **Chỉnh sửa:** mở lại modal chi tiết hiện tại, bổ sung thao tác “Mở chỉnh sửa” từ bảng và giữ nút bút cạnh từng trường.
- **An toàn:** mã vận đơn không chỉnh sửa; các trường nghiệp vụ được phép sửa phải dùng cùng validation với admin override hiện tại.
- **Theo dõi:** mọi lần lưu phải ghi audit log và làm mất cache các danh sách, KPI và báo cáo liên quan.
- **Giao diện:** giữ brand hiện tại, bố cục bảng dữ liệu compact, dùng component shadcn/Radix hiện có.

## Implementation outline

1. Tách phần bảng hàng đợi thành component Super Admin, dùng query/filter hiện có và loại bỏ khoảng ngày khỏi khu vực hàng đợi.
2. Chuẩn hóa dữ liệu hiển thị Hub, trạng thái và thời điểm cập nhật, không hardcode số liệu.
3. Nối nút mở hàng đợi với modal chi tiết và admin override hiện tại.
4. Kiểm tra invalidation sau khi lưu để bảng, KPI và báo cáo phản ánh dữ liệu mới.
5. Bổ sung kiểm thử quyền, tìm kiếm, lọc, mở chỉnh sửa, lưu lý do và audit log.
6. Chạy local E2E, chụp bằng chứng giao diện bằng dữ liệu thật và kiểm tra không có lỗi console.

## Acceptance criteria

- Super Admin nhìn thấy hàng đợi trên local với dữ liệu thật.
- Có thể tìm toàn bộ đơn theo mã đơn hoặc tên hàng mà không cần nhập khoảng ngày.
- Có thể lọc theo trạng thái và Hub.
- Nút “Mở chỉnh sửa” mở đúng đơn và đúng modal chi tiết.
- Các trường có quyền chỉnh sửa hiển thị nút bút; mã vận đơn vẫn bất biến.
- Lưu thiếu lý do bị chặn bằng thông báo tiếng Việt dễ hiểu.
- Sau khi lưu thành công, bảng và các số liệu liên quan được làm mới.
- Người không có quyền Super Admin không thấy hàng đợi và không thể gọi luồng chỉnh sửa.
- Local frontend/backend pass pre-flight; test E2E liên quan pass; không có lỗi console.

## Open questions

Không còn câu hỏi mở cho MVP.

## Deferred

- Phân công đơn cho từng Super Admin.
- Trạng thái công việc “Chưa xử lý / Đang xử lý / Hoàn tất”.
- Chỉnh sửa hàng loạt nhiều đơn.
- Drawer chuyển nhanh “Lưu và sang đơn tiếp theo”.
