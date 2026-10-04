# UI Compact Density & Narrow Spacing Mandate (Quy Chuẩn Giao Diện Hẹp & Khoảng Cách Tinh Gọn)

> **Phạm vi áp dụng**: Toàn bộ các màn hình giao diện (UI screens), các thành phần frontend (React/Next.js/Tailwind), bản vẽ vector (.pen canvas), Modal, Bảng dữ liệu (Tables), và Form nhập liệu trong dự án Logistics TMS (Spider Express).
> **Mục tiêu**: Tối ưu hóa tối đa mật độ thông tin (high-density enterprise TMS), giúp Quản lý kho (Warehouse Manager), Điều phối (Dispatcher) và Đội xe (Fleet Manager) quan sát và thao tác nhanh chóng trên cùng một màn hình mà không bị lãng phí diện tích hiển thị bởi khoảng trắng thừa.

---

## 1. Triết Lý Thiết Kế Mật Độ Cao (High-Density Philosophy)

- **Đặc thù nghiệp vụ kho vận**: Nhân viên kho và điều phối viên làm việc liên tục với bảng kê hàng chục dòng, đối soát số liệu xe, kiện, kg, khối ($m^3$).
- **Nguyên tắc "Zero Wasted Whitespace"**: Triệt tiêu toàn bộ padding/margin rộng thùng thình của web marketing thông thường (nghiêm cấm dùng `p-6`, `p-8`, `py-6`, `gap-6` cho các container/card tác nghiệp thông thường).
- **Giao diện hẹp & kết dính**: Các phần tử liên quan trực tiếp phải nằm sát nhau, tạo thành một thể thống nhất liền mạch.

---

## 2. Quy Chuẩn Padding Thẻ `<Card />` & Panel

| Thành phần | Chuẩn CSS / Tailwind | Chi tiết kỹ thuật |
|---|---|---|
| **Base Card Spacing** | `[--card-spacing:--spacing(1)]` (4px) | Khai báo tại [`frontend/src/components/ui/card.tsx`](file:///d:/Projects/logistics-website/frontend/src/components/ui/card.tsx). Mọi Card mặc định đều nhận 4px. |
| **Card Container** | `py-0` hoặc `py-(--card-spacing)` | Loại bỏ padding dọc dư thừa bên ngoài. |
| **CardContent** | `p-1` (4px) | Nghiêm cấm dùng `p-4`, `p-5`, `p-6` trên `<CardContent>` trong các màn hình nghiệp vụ. |
| **CardHeader** | `py-1 px-1 border-b` | Tiêu đề gọn gàng, cách nội dung bởi border kẻ mảnh. |
| **Toolbar / Filter Card** | `p-1 py-0` | Ôm sát thanh tìm kiếm, preset ngày tháng và tab trạng thái. |
| **Bảng kê / Data Card** | `p-1` | Ôm sát viền bảng dữ liệu, tránh tạo viền trắng kép. |

---

## 3. Quy Chuẩn Khoảng Cách (Gap & Margin) Giữa Các Node & Elements

1. **Khoảng cách giữa các Section / Card lớn**:
   - Sử dụng `space-y-2` (8px) hoặc tối đa `space-y-3` (12px).
   - Tuyệt đối không dùng `space-y-6` hay `space-y-8`.
2. **Khoảng cách giữa các ô nhập trong Grid / Form**:
   - Sử dụng `gap-2` (8px) hoặc `gap-3` (12px) cho grid 3-4 cột.
   - Tuyệt đối không dùng `gap-6` hay `gap-8`.
3. **Khoảng cách giữa Nhãn (Label) và Ô nhập liệu (Input)**:
   - Dùng `mb-1` (4px).
   - Label dùng `text-xs font-bold` hoặc `text-[11px] font-bold`.
4. **Kích thước các ô Input / Select / Button**:
   - Input chiều cao tinh gọn: `h-8` đến `h-9` (text-xs / text-[11px]).
   - Nút bấm (Button): `h-7` đến `h-8` (size="sm" hoặc compact).
5. **Chiều cao dòng bảng dữ liệu (Row Padding)**:
   - Dùng `py-1 px-2` hoặc `py-1 px-1.5` cho toàn bộ các ô `th` và `td` (thay vì `p-2.5` hay `py-2`). Chiều cao mỗi dòng giảm từ ~48px xuống còn ~26px - 28px, tăng gần gấp đôi số lượng item hiển thị đồng thời trên một màn hình.

---

## 4. Quy Chuẩn Cỡ Chữ Thu Gọn Nhằm Tối Đa Hóa Số Lượng Item (Compact Typography Scale)

> **Mục tiêu tối thượng**: Thu nhỏ cỡ chữ xuống mức vừa đủ đọc rõ ràng để người vận hành (Quản lý kho, Điều phối viên) xem được số lượng item nhiều nhất có thể trên một khung nhìn màn hình mà không cần cuộn trang.

| Cấp độ thành phần UI | Cỡ chữ chuẩn | Class Tailwind | Ứng dụng thực tế |
|---|---|---|---|
| **Dòng dữ liệu chi tiết trong bảng** | **10px** | `text-[10px]` | Số kiện, số kg, số khối ($m^3$), ghi chú, chứng từ, thời gian, dòng hàng trong bảng kê nhập/xuất kho và bảng con lồng ghép. |
| **Tiêu đề cột bảng (`th`) & Badge trạng thái** | **10px** | `text-[10px]` (in hoa) | Header bảng (`CHUYẾN XE`, `XE & TÀI XẾ`, `SỐ KIỆN / TẢI TRỌNG`), badge trạng thái (`LƯU KHO`, `Khách gửi`, `1 BCT`), badge số đơn (`text-[9px]`). |
| **Mã vận đơn, Mã chuyến, Biển số xe** | **11px** | `text-[11px] font-mono font-bold` | `TRIP-2609-014`, `HYN-QLKHY-2609-025`, `51D-627.99` (đảm bảo rõ nét, không bị nhòe khi đọc nhanh). |
| **Tên hàng hóa & Tên tài xế** | **10px - 11px** | `text-[11px] font-medium` / `text-[10px]` | Tên mặt hàng chính, tên tài xế hiển thị phụ dưới biển số xe. |
| **Ô nhập liệu (Input) & Nút thao tác (Button)** | **11px** | `text-[11px]` / `text-xs` | Toàn bộ các ô nhập date, text, dropdown và nút bấm bảng (`Kiểm đếm`, `In phiếu`, `Xem đơn`). |
| **Thẻ Card mặc định** | **12px** | `text-xs` | Cấu hình tại thẻ `<Card className="... text-xs" />` để mọi thành phần con kế thừa cỡ chữ thu gọn. |
| **Tiêu đề Card / Header Toolbar** | **12px - 13px** | `text-xs font-bold` / `text-sm font-bold` | Tiêu đề khối tiếp nhận, tiêu đề modal và thống kê tóm tắt. |

---

## 4. Quy Chuẩn Gắn Kết & Cố Định (Sticky & Cohesive Layout)

1. **Gắn kết trực tiếp giữa các khối nghiệp vụ**:
   - Form thông tin xe tiếp nhận và Bảng kê hàng hóa chi tiết phải gắn liền sát nhau (`gap-2` / `space-y-2`), không để khoảng cách rời rạc.
2. **Thanh thao tác cố định dưới đáy (Sticky Action Footer)**:
   - Các nút hành động chính (Lưu nháp, In phiếu, Xem trước, Xác nhận tiếp nhận & Lưu kho...) phải được ghim cố định:
     ```tsx
     <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 p-2 flex items-center justify-between z-10">
       ...
     </div>
     ```
   - Giúp người vận hành có thể thao tác ngay lập tức mà không phải cuộn chuột xuống đáy trang khi bảng có nhiều dòng hàng.
3. **Tiêu đề bảng cố định (Sticky Table Header)**:
   - Header bảng danh sách và bảng kê luôn có `sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90` khi cuộn xem danh sách dài.

---

## 5. Quy Chuẩn Hộp Thoại (Modal & Dialog)

- **Modal Header**: `p-2.5` đến `p-3`, viền phân tách mỏng.
- **Modal Body**: `p-3` đến `p-4`, `overflow-y-auto max-h-[80vh]`.
- **Modal Footer**: `p-2.5` đến `p-3`, `border-t`, gắn sát mép dưới hộp thoại.
- Loại bỏ hoàn toàn các viền padding đệm ngoài quá dày (`p-6`, `p-8`) trong các hộp thoại chi tiết chuyến xe, xem tem nhãn hay xác nhận xuất nhập.

---

## 6. Pre-Handoff Checklist (Kiểm Tra Trước Khi Bàn Giao)

Mọi agent và lập trình viên trước khi hoàn tất tính năng UI bắt buộc phải rà soát:
- [ ] Không còn thẻ `<CardContent>` nào mang `p-4`, `p-5`, `p-6`?
- [ ] Khoảng cách giữa các Section/Card không vượt quá `12px` (`gap-3` / `space-y-3`)?
- [ ] Các thanh Action Footer có áp dụng `sticky bottom-0` để gắn kết thao tác không?
- [ ] Toàn bộ font-size của bảng kê kho có đồng bộ `text-[10px]` sắc nét không?
- [ ] Giao diện có gọn gàng, chặt chẽ (compact density) theo đúng tiêu chuẩn TMS kho bãi không?
