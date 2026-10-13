feedback sau đây là các lỗi tôi phát hiện được

1. xem feedback_04_10\list_order_wrong_when_create_outbound.png
màn hình khi tạo xuất kho, xem lại logic để đảm bảo danh sách mã đơn này là thuộc về kho của user đang load, còn khi filter tất cả thực ra chỉ tìm trạng thái Lưu kho, Đơn nháp, chứ tìm 'Chờ nhập kho' là cực kì sai logic

2. feedback_04_10\menu_super_admin_redundant_item.png
là menu của super admin thấy, tôi thấy chỗ mục "Không gian làm việc", "Overview" là bị dư ra, hãy check kĩ và tối ưu lại menu này

3. feedback_04_10\tong_hop_don_hang_khong_gom_ma_don_hang.png 

ở url http://localhost:4000/dashboard/warehouse/orders, hãy bỏ đi cột số kiện, và câu query phải group các đơn hàng theo 'Mã đơn hàng' sau đó gom tất cả thông tin vào cột mã đơn hàng

4. Rà soát lại xem flow tạo xuất kho
Khi thêm 1 dòng hàng xuất, bấm button 'Cập nhật lại thông số' gặp lỗi sau
## Error Type
Runtime TypeError

## Error Message
freshData.find is not a function


    at <unknown> (src/app/dashboard/warehouse/outbound/page.tsx:311:41)
    at Array.map (<anonymous>:null:null)
    at <unknown> (src/app/dashboard/warehouse/outbound/page.tsx:310:20)
    at WarehouseOutboundPage (src/app/dashboard/warehouse/outbound/page.tsx:163:45)

## Code Frame
  309 |             setMode1Rows((prev) =>
  310 |               prev.map((r) => {
> 311 |                 const fresh = freshData.find((f) => f.id === r.id);
      |                                         ^
  312 |                 return fresh
  313 |                   ? {
  314 |                       ...r,

Next.js version: 16.2.12 (Turbopack)


5. Có sự sai lệch count hàng hóa, hãy xem các bước và đánh giá lại

Flow tạo nhập kho
Kho HCM tạo nhập kho với thông số random các món hàng, tôi muốn tạo tầm 3 đến 4 dòng hàng với số lượng bạn tự nghĩ ra test case, khi đó nhớ tạo file mockdata để test case này luôn dựa vào đó



Flow tạo xuất kho
Kho HCM tạo xuất kho đi Đà Nẵng (10 kiện) và Hưng Yên (7 kiện), 1 (có 3 kiện) dòng đi xe Bo (random xe bo) trên chung 1 TRIP

=> các con số như trên, bạn theo kịch bản nhưng random số lượng để thêm 2 test case khác

Sau khi tạo đơn xuất từ kho HCM xong, vào kho Đà Nẵng check lại tổng số kiện so với thực tế, sau đó vào trang chi tiết đơn hàng Đà Nẵng xem lại thông tin xe Bo và check trong DB xem đã update đúng số kiện xe Bo chưa?

Cũng check tương tự với trường hợp xuất kho Hưng Yên, và sau cùng vào trang chi tiết đơn hàng để check lại thông tin chuyến xe và số kiện xe Bo

Thêm vài edge case khác ví dụ: Kho Đà Nẵng nhận hàng từ HCM xong, nhưng nhận thêm vài kiện khác mà được gửi đến kho Hưng Yên, => kiểm tra lại số kiện của Đà Nẵng và Hưng Yên khi đó

mục số 5 này hơi phức tạp, nên mỗi lần test, cần reset database ở các table liên quan, tránh trường hợp chạy xong test case này, làm lỗi test case khác
