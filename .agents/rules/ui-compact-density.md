# UI Compact Density & Narrow Spacing Mandate (Quy Chuẩn Giao Diện Hẹp & Khoảng Cách Tinh Gọn)

> **Phạm vi áp dụng**: Toàn bộ các màn hình giao diện (UI screens), các thành phần frontend (React/Next.js/Tailwind), bản vẽ vector (.pen canvas), Modal, Bảng dữ liệu (Tables), và Form nhập liệu trong dự án Logistics TMS (Spider Express).
> **Mục tiêu**: Tối ưu hóa tối đa mật độ thông tin (high-density enterprise TMS), giúp Quản lý kho (Warehouse Manager), Điều phối (Dispatcher) và Đội xe (Fleet Manager) quan sát và thao tác nhanh chóng trên cùng một màn hình mà không bị lãng phí diện tích hiển thị bởi khoảng trắng thừa.

---

## 1. Triết Lý Thiết Kế Mật Độ Cao (High-Density Philosophy)

- **Đặc thù nghiệp vụ kho vận**: Nhân viên kho và điều phối viên làm việc liên tục với bảng kê hàng chục dòng, đối soát số liệu xe, kiện, kg, khối ($m^3$).
- **Nguyên tắc "Zero Bloated Spacing"**: Triệt tiêu toàn bộ padding/margin rộng thùng thình của web marketing thông thường.
- **Mục tiêu tối thượng**: Xem được số lượng item nhiều nhất có thể trên một màn hình mà không cần cuộn trang.
- **Giao diện hẹp & kết dính**: Các phần tử liên quan trực tiếp phải nằm sát nhau, tạo thành một thể thống nhất liền mạch.

---

## 2. 🚫 Danh Sách Class Bị Cấm Tuyệt Đối (Strictly Banned Classes)

Mọi agent (Claude, Gemini, subagents) khi tạo mới hoặc sửa code trong `frontend/src/` **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** sinh ra các class sau:

| Loại thuộc tính | ❌ CÁC CLASS BỊ CẤM TUYỆT ĐỐI | Lý do cấm |
|---|---|---|
| **Padding (Tất cả các hướng)** | `p-4`, `p-5`, `p-6`, `p-8`, `p-10`, `p-12`, `p-16` | Gây lãng phí từ 16px đến 64px khoảng trắng thừa xung quanh nội dung. |
| **Padding Ngang / Dọc** | `px-4`, `px-5`, `px-6`, `px-8`, `py-3.5`, `py-4`, `py-5`, `py-6`, `py-8` | Làm giãn cách biên quá mức, thu hẹp chiều rộng khả dụng của bảng 10-12 cột. |
| **Khoảng cách dọc (Stack)** | `space-y-3`, `space-y-3.5`, `space-y-4`, `space-y-5`, `space-y-6`, `space-y-8` | Đẩy các khối form và bảng ra xa nhau, làm vỡ tính kết dính (cohesive). |
| **Khoảng cách ngang (Inline)** | `space-x-3`, `space-x-4`, `space-x-6`, `space-x-8` | Làm tràn ngang container khi đặt nhiều nút hoặc filter cạnh nhau. |
| **Khoảng cách lưới (Grid/Flex Gap)** | `gap-3`, `gap-3.5`, `gap-4`, `gap-5`, `gap-6`, `gap-8` | Khiến các ô input và cột thẻ bị rời rạc, không vừa khung nhìn 1366x768 / 1920x1080. |
| **Padding ô bảng (`th`, `td`)** | `p-2.5`, `p-3`, `p-4`, `py-2`, `py-2.5`, `py-3`, `py-4` | Đội chiều cao dòng bảng lên 48px - 60px, chỉ xem được 5-8 đơn/màn hình. |

---

## 3. ✅ Bảng Quy Chuẩn Thay Thế Bắt Buộc (Mandatory Compact Palette)

| Thành phần UI | Chuẩn CSS / Tailwind | Kích thước (px) | Chi tiết kỹ thuật |
|---|---|---|---|
| **Base Card Spacing** | `[--card-spacing:--spacing(1)]` / `py-0` | **4px** | Khai báo tại [`frontend/src/components/ui/card.tsx`](file:///d:/Projects/logistics-website/frontend/src/components/ui/card.tsx). Mọi Card mặc định đều nhận 4px. |
| **CardContent** | `p-1` (hoặc `p-1.5`) | **4px - 6px** | Nghiêm cấm dùng `p-4`, `p-5`, `p-6` trên `<CardContent>` trong các màn hình nghiệp vụ. |
| **CardHeader** | `py-1 px-1 border-b` | **4px** | Tiêu đề gọn gàng, cách nội dung bởi border kẻ mảnh. |
| **Toolbar / Filter Card** | `p-1 py-0` | **4px** | Ôm sát thanh tìm kiếm, preset ngày tháng và tab trạng thái. |
| **Bảng kê / Data Card** | `p-1` | **4px** | Ôm sát viền bảng dữ liệu, tránh tạo viền trắng kép. |
| **Modal / Dialog Body** | `p-2` (tối đa `p-2.5`) | **8px - 10px** | Thay thế hoàn toàn cho `p-4` cũ. Có `overflow-y-auto max-h-[80vh]`. |
| **Modal Header & Footer** | `py-1.5 px-2` (hoặc `p-2`) | **6px - 8px** | Header và thanh nút bấm dưới chân modal sát mép, tiết kiệm diện tích. |
| **Khoảng cách giữa các Section** | `space-y-1.5` hoặc `space-y-2` | **6px - 8px** | Thay thế cho `space-y-3` / `space-y-4`. |
| **Khoảng cách trong Form Grid** | `gap-1.5` hoặc `gap-2` | **6px - 8px** | Thay thế cho `gap-3` / `gap-4`. |
| **Khoảng cách Label - Input** | `mb-1` | **4px** | Nhãn ngay trên ô input, không cách xa. |
| **Chiều cao Input / Select** | `h-8` đến `h-8.5` | **32px** | Cỡ chữ ô nhập liệu: `text-xs` hoặc `text-[11px]`. |
| **Chiều cao Button** | `h-7` hoặc `h-8` (`size="sm"`) | **28px - 32px** | Nút bấm thao tác gọn gàng, text `text-xs` hoặc `text-[11px]`. |
| **Padding ô bảng (`th`, `td`)** | `py-1 px-1.5` hoặc `py-0.5 px-1.5` | **Chiều cao dòng ~24px - 28px** | Tăng gần gấp đôi số lượng item hiển thị đồng thời trên một màn hình. |

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

## 5. Quy Chuẩn Gắn Kết & Cố Định (Sticky & Cohesive Layout)

1. **Gắn kết trực tiếp giữa các khối nghiệp vụ**:
   - Form thông tin xe tiếp nhận và Bảng kê hàng hóa chi tiết phải gắn liền sát nhau (`gap-2` / `space-y-1.5`), không để khoảng cách rời rạc.
2. **Thanh thao tác cố định dưới đáy (Sticky Action Footer)**:
   - Các nút hành động chính (Lưu nháp, In phiếu, Xem trước, Xác nhận tiếp nhận & Lưu kho...) phải được ghim cố định:
     ```tsx
     <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-between z-10">
       ...
     </div>
     ```
   - Giúp người vận hành có thể thao tác ngay lập tức mà không phải cuộn chuột xuống đáy trang khi bảng có nhiều dòng hàng.
3. **Tiêu đề bảng cố định (Sticky Table Header)**:
   - Header bảng danh sách và bảng kê luôn có `sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90` khi cuộn xem danh sách dài.

---

## 6. Pre-Handoff Checklist (Kiểm Tra Trước Khi Bàn Giao)

Mọi agent và lập trình viên trước khi hoàn tất tính năng UI bắt buộc phải rà soát:
- [ ] Không còn bất kỳ class nào trong Banned List (`p-4`, `p-5`, `p-6`, `space-y-3`, `space-y-4`, `gap-3`, `gap-4`)?
- [ ] Thẻ `<CardContent>` sử dụng `p-1` (4px)?
- [ ] Modal/Dialog Body chỉ sử dụng `p-2` (tối đa `p-2.5`)?
- [ ] Khoảng cách giữa các Section/Card là `space-y-1.5` hoặc `space-y-2` (không vượt quá 8px)?
- [ ] Khoảng cách giữa các ô nhập trong Grid là `gap-1.5` hoặc `gap-2` (không vượt quá 8px)?
- [ ] Toàn bộ font-size của bảng kê kho có đồng bộ `text-[10px]` sắc nét không?
- [ ] Các thanh Action Footer có áp dụng `sticky bottom-0` để gắn kết thao tác không?
