[tms-domain-lead](slashCommand;tms-domain-lead) lập plan, để sắp tới sẽ thêm 1 flow mới liên quan chú trọng vào nghiệp vụ của Kho (hubs)

<!-- viết dòng bên dưới làm sao cho AI luôn ghi nhớ trong file .md -->
````tôi cũng cần bạn viết gọn gàng lại khi tôi mô tả có thể có nhiều từ ngữ dư thừa, viết plan cho chuẩn chỉnh, xúc tích, dễ hiểu, dễ thực thi````



[ui-ux-flow-designer](slashCommand;ui-ux-flow-designer) hãy tạo 1 file .pen mới nhé


**Yêu cầu về cách làm:**

- [tms-domain-lead](slashCommand;tms-domain-lead) làm việc cùng với [ui-ux-flow-designer](slashCommand;ui-ux-flow-designer) thiết kế UI flow trước mắt, UI sẽ support cơ bản cho mobile dễ thao tác nha (không nhất thiết phải thiết kế luôn mobile, nhưng phải đảm bảo mobile vẫn thao tác được nha, ví dụ như tab, nút bấm, dễ dàng điều hướng bằng ngón tay, hoặc ít cuộn ngang, zoom in/out không cần thiết)

- Khi UI đã được chốt thì tiến hành cho 2 agents phù hợp để dev frontend, backend làm việc. Yêu cầu 2 agents này phải đảm bảo UI đã hoàn thiện, UX đã ok, dễ thao tác cho mobile.

User story:
- Người quản lí Kho - Hub (có user được chỉ định là role Warehouse Manager) theo đúng hubId
cần có 1 màn hình tạo mới

**Yêu cầu chi tiết:**

1. Người quản lí Kho - Hub (có user được chỉ định là role Warehouse Manager) theo đúng hubId
cần có 1 màn hình tạo mới, khi click tạo mới sẽ có 2 mode: 

+ Mới hoàn toàn (nhập hàng từ khách hàng đưa vào kho)
+ Luân chuyển nội bộ (nhập hàng từ hub khác vào kho)

Màn hình tạo mới có UI follow theo các input, table, action button follow theo tài liệu scan ở folder docs_scan của dự án (.\docs_scan\form_create_new_don.JPG). Tuyệt đối không được thêm/bớt hoặc thay đổi vị trí các input/table/action button so với file scan. Yêu cầu tuân thủ các thông tin có trong tài liệu scan. Đây là tài liệu scan dạng ảnh, bạn UI cần dựa vào đó để thiết kế UI theo đúng yêu cầu. Yêu cầu thiết kế UI trên nền tảng web, app hỗ trợ cơ bản mobile.


**Bổ sung chi tiết:**
- Cột **"Địa chỉ giao hàng"** sẽ có 3 options:
  1. Nhập địa chỉ giao hàng thông thường (nhập free text).
  2. Chọn địa chỉ dropdown từ Hub khác (Hub cấp 1).
  3. Chọn Hub cấp 2 (Hub phân cấp thấp hơn), được gọi là "Xe bo"


### **Quy định trạng thái đơn hàng (Order Status Lifecycle)**

| Mã trạng thái (Enum) | Tên hiển thị (VN) | Tên tiếng Anh | Mã vận đơn (`waybillId`) | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| `DRAFT` | **Nháp** | Draft | ❌ Chưa có | Đơn hàng mới tạo ở dạng bản nháp, chưa xác nhận vào hệ thống. |
| `PENDING_INBOUND` | **Chờ nhập kho** | Pending Inbound | ✅ Đã sinh mã | Đơn hàng đã được xác nhận, hệ thống sinh mã vận đơn, đang chờ hàng về kho để kiểm tiếp nhận. |
| `INBOUND` | **Đang nhập kho** | Inbound | ✅ Đã sinh mã | Kho đang tiến hành kiểm đếm, quét mã và phân loại hàng tại Hub. |
| `COMPLETED_INBOUND`| **Đã nhập kho** | Completed Inbound | ✅ Đã sinh mã | Hàng đã hoàn tất nhập kho, lưu trữ an toàn trong Hub. |
| `IN_TRANSIT` | **Đang trung chuyển** | In Transit | ✅ Đã sinh mã | Hàng đã xuất kho và đang trong quá trình vận chuyển luân chuyển giữa các Hub. |
| `OUT_FOR_DELIVERY` | **Đang giao hàng** | Out for Delivery | ✅ Đã sinh mã | Hàng đã bàn giao cho tài xế/xe đi giao hàng chặng cuối cho khách hàng. |
| `COMPLETED_OUTBOUND`| **Đã xuất kho** | Completed Outbound | ✅ Đã sinh mã | Hàng đã xuất ra khỏi kho và hoàn tất giao hàng đến người nhận. |

### **Quy tắc xử lý cột "Địa chỉ nhận hàng" (Pickup Address Logic)**

- **Mode 1: Tạo mới hoàn toàn (Khách gửi hàng)**
  - **Kiểu nhập:** Free text.
  - **Mô tả:** Cho phép Warehouse Manager nhập tự do địa chỉ lấy/nhận hàng do khách hàng cung cấp.

- **Mode 2: Luân chuyển nội bộ (Hub-to-Hub Transfer)**
  - **Kiểu nhập:** Tự động điền (Auto-fill / Readonly).
  - **Logic trích xuất DB:**
    - Lấy `hubId` của user hiện tại đang đăng nhập (`currentUser.hubId` từ table `users`).
    - Query table `hubs` theo `id = currentUser.hubId`.
    - Gán giá trị cột `hubs.address` làm địa chỉ nhận hàng (kho gửi).