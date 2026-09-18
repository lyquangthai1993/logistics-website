menu chỉ hiển thị 3 items
card thống kê thì bỏ ra hết
địa chỉ giao hàng khi nhập kho => free text

copy excel mà có địa chỉ dạng này là bị nhảy dòng
"BreadTalk Aeon Long Biên
Cổng số 5 Aeon Mall Long Biên - 27 Cổ Linh - Phường Long Biên TP HN
liên hệ: Chị Hiền 039 9950872 - 024 32012279"

===========================================

https://logistics-website-frontend-kappa.vercel.app/dashboard/warehouse/outbound => chỉ hiển thị mã biển số xe, đơn hàng => group theo biển số xe
thanh tìm kiếm là mã đơn, biển số xe
===============================================


CLICK vào xe => ra giao diện như nhập mới hoàn toàn


=============================================
tem nhận diện: bỏ thông tin người nhập, các ô khoanh đỏ thì để trống
thêm thông tin mã QR vào nữa, ở góc trên - trái
===============================================

Đơn nháp thì có thể cho xóa
Đơn còn lại phải có sự can thiệp của admin
=================================================

 Họ tên người nhận / tài xế * => không bắt buộc
 ====================


 https://logistics-website-frontend-kappa.vercel.app/dashboard/warehouse/inbound cột thao tác thêm in phiếu nhập kho nếu trạng thái là lưu kho

 ===========================

 Mã vận đơn không bị check trùng, sau này thống kê dựa vào mã vận đơn cộng tổng lại
 Do mã vận đơn được chở trên nhiều xe, phải nhập vài lần


 =============================
 màn hình xuất kho, table chỉ đơn giản là hiển thị biển số xe, mã đơn hàng trên biển số xe, trạng thái
 =>  cột thao tác thêm in phiếu nhập kho nếu trạng thái là đã xuất kho

 https://logistics-website-frontend-kappa.vercel.app/dashboard/warehouse/outbound
 bỏ nút xuất luân chuyển nội bộ, chỉ cần nút xuất kho

 ============================
 địa chỉ giao hàng trong flow xuất kho, có 

 - xuất thẳng, lấy địa chỉ từ bên nhập đưa vào
 - trung chuyển: như hiện tại theo hub cáp 1 + xe bo

 Vẫn có nút lưu nháp | xác nhận xuất
==================================

chọn đơn hàng nhưng nhập số lượng vượt quá tồn kho thì báo lỗi và không cho xác nhận

=====================================

https://logistics-website-frontend-kappa.vercel.app/dashboard/warehouse/orders
cần click chi tiết xem đơn tồn kho
cần hiển thị những thông tin sau
- địa chỉ lấy
- địa chỉ giao hàng

===============TIMELINE====================
- xe lấy hàng: XE1, XE2, ...
- xe trung chuyển  (nếu có)
- xe giao hàng
có số lượng trong các xe này, biển số xe
========================================


TỔNG QUAN GIAO DIỆN 
- DÒNG TRONG TABLE NHỎ LẠI, THÊM ĐƯỢC NHIỀU DÒNG
-