# Hướng dẫn hàng đợi chỉnh sửa đơn hàng cho Super Admin

Tài liệu này hướng dẫn người dùng lần đầu sử dụng tính năng **Hàng đợi chỉnh sửa** trên hệ thống Logistics TMS.

Tính năng cho phép Super Admin tìm tất cả đơn hàng, kiểm tra thông tin và chỉnh sửa các trường nghiệp vụ cần thiết. Mọi thay đổi đều yêu cầu nhập lý do và được ghi vào nhật ký hoạt động.

## Quyền sử dụng

Chỉ tài khoản **Super Admin** nhìn thấy hàng đợi chỉnh sửa và các nút chỉnh sửa trong modal chi tiết đơn hàng.

## Quy trình nhanh

```text
Quản trị hệ thống > Hàng đợi chỉnh sửa
  -> Hàng đợi chỉnh sửa
  -> Tìm mã đơn hoặc tên hàng
  -> Mở chỉnh sửa
  -> Kiểm tra chi tiết
  -> Điều chỉnh thông tin
  -> Nhập lý do
  -> Lưu thay đổi
```

## Bước 1: Mở trang Hàng đợi chỉnh sửa

1. Đăng nhập bằng tài khoản Super Admin.
2. Mở nhóm menu **Quản trị hệ thống**.
3. Chọn **Hàng đợi chỉnh sửa**.

Bạn cũng có thể mở trực tiếp route:

```text
/dashboard/admin/edit-queue
```

Đây là màn hình riêng cho Super Admin, không nằm chung với màn hình tác nghiệp **Đơn hàng kho** của thủ kho. Hàng đợi sử dụng dữ liệu đơn hàng thật và hiển thị các thông tin:

- Mã đơn
- Tên hàng hóa
- Trạng thái đơn
- Hub hiện tại
- Ngày cập nhật gần nhất
- Nút **Mở chỉnh sửa**

## Bước 2: Tìm đơn hàng

1. Nhập mã đơn hoặc tên hàng vào ô tìm kiếm.
2. Nhấn **Tìm kiếm** hoặc nhấn **Enter**.
3. Có thể lọc thêm theo **Trạng thái** hoặc **Hub**.
4. Kiểm tra số lượng đơn phù hợp và nội dung trong hàng đợi.

Ví dụ:

```text
LTL2612-0006
```

Hàng đợi không sử dụng bộ lọc khoảng ngày; tìm kiếm được thực hiện trên toàn bộ đơn hàng.

## Bước 3: Mở đơn cần chỉnh sửa

1. Kiểm tra mã đơn, tên hàng, trạng thái và Hub hiện tại.
2. Bấm **Mở chỉnh sửa** ở dòng đơn cần xử lý.

Hệ thống mở modal **Chi tiết đơn hàng tiếp nhận kho**.

## Bước 4: Kiểm tra chi tiết đơn

Trong modal chi tiết, kiểm tra:

- Lịch sử hàng hóa và biến động kho.
- Tổng đã nhập, tổng đã xuất và tồn kho khả dụng.
- Nhật ký thao tác và thay đổi dữ liệu.
- Danh mục hàng hóa vận đơn.

Không chỉnh sửa ngay nếu chưa đối chiếu đủ thông tin với chứng từ hoặc yêu cầu vận hành.

## Bước 5: Mở form chỉnh sửa

Có hai cách mở form:

### Cách 1: Chỉnh sửa toàn bộ thông tin đơn

Bấm nút **Điều chỉnh** ở phần đầu modal chi tiết.

### Cách 2: Chỉnh sửa nhanh một trường

Bấm biểu tượng bút cạnh trường cần sửa trong danh mục hàng hóa vận đơn.

Các vị trí có thể có biểu tượng bút gồm:

- Địa chỉ nhận hàng
- Tên hàng hóa
- Số kiện
- Khối lượng
- Thể tích
- Địa chỉ giao hàng
- Tỉnh/thành
- Chứng từ
- Hình thức giao

## Bước 6: Nhập thông tin mới

Form chỉnh sửa có thể cập nhật:

- Số kiện
- Khối lượng (kg)
- Thể tích (m³)
- Địa chỉ nhận hàng
- Địa chỉ giao hàng
- Kho gửi
- Kho nhận
- Mô tả hàng hóa
- Tỉnh/thành
- Chứng từ
- Ghi chú điều vận
- Thông tin xe ngoài nếu có

Mã vận đơn là thông tin định danh và không được thay đổi trong form này.

## Bước 7: Nhập lý do điều chỉnh

1. Kéo xuống cuối form.
2. Nhập lý do vào trường **Lý do điều chỉnh**.
3. Nêu ngắn gọn nguyên nhân, ví dụ:

```text
Nhân viên nhập sai số kiện theo phiếu xác nhận của khách hàng.
```

Không thể lưu nếu bỏ trống lý do điều chỉnh.

## Bước 8: Kiểm tra và lưu

1. Đối chiếu lại các giá trị mới.
2. Kiểm tra lý do điều chỉnh.
3. Bấm **Lưu thay đổi**.
4. Chờ thông báo lưu thành công.

Sau khi lưu, hệ thống cập nhật lại:

- Thông tin đơn hàng.
- Tồn kho và giao dịch liên quan.
- Bảng đơn hàng.
- Các KPI hoặc báo cáo sử dụng dữ liệu đơn.
- Nhật ký thao tác và thay đổi dữ liệu.

## Lưu ý quan trọng

- Không bấm **Lưu thay đổi** nếu chưa kiểm tra giá trị mới.
- Không thay đổi mã vận đơn để tránh mất liên kết dữ liệu.
- Đơn đã xuất kho vẫn có thể được Super Admin điều chỉnh khi có lý do hợp lệ.
- Mọi lần điều chỉnh đều được ghi nhận người sửa, thời gian và lý do.
- Nếu không thấy hàng đợi chỉnh sửa, hãy kiểm tra lại tài khoản có đúng quyền Super Admin hay không.

## Checklist trước khi hoàn tất

- [ ] Đúng mã đơn cần chỉnh sửa.
- [ ] Đúng Hub và trạng thái đơn.
- [ ] Đã đối chiếu thông tin cũ với chứng từ.
- [ ] Đã nhập giá trị mới chính xác.
- [ ] Đã nhập lý do điều chỉnh.
- [ ] Đã kiểm tra lại trước khi bấm **Lưu thay đổi**.
- [ ] Đã xác nhận nhật ký thao tác sau khi lưu.
