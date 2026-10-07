---
name: ui-spacing-guard
description: >-
  Strict compact density and spacing guard for Logistics TMS frontend UI. Prevents code generation
  of oversized spacing (p-4, space-y-3, gap-4, etc.) and enforces high-density enterprise operational scales
  (p-1 card padding, p-2 modal body, space-y-1.5/space-y-2 section gaps, gap-1.5/gap-2 grid gaps, and text-[10px] table typography).
  Use whenever creating or modifying UI components, pages, modals, cards, forms, tables, or layouts.
  Triggers on: "spacing", "padding", "margin", "gap", "compact density", "giao diện hẹp", "giảm khoảng cách", "p-4", "space-y-3", "thu nhỏ font", "tối đa hóa item".
---

# UI Spacing & Compact Density Guard (Quy Chuẩn Chặn Spacing Thừa & Ép Mật Độ Cao)

## 1. Mục Tiêu & Triết Lý Vận Hành Kho (High-Density Warehouse TMS)

Hệ thống Logistics TMS (Spider Express) là công cụ tác nghiệp thời gian thực cho Quản lý kho (Warehouse Manager), Điều phối viên (Dispatcher) và Đội xe (Fleet Manager).
- **Mục tiêu tối thượng**: Hiển thị **số lượng item nhiều nhất có thể** trên một khung nhìn màn hình (viewport) mà không phải cuộn trang.
- **Vấn đề cốt lõi**: Các template web marketing hoặc dashboard thông thường sinh ra padding/margin rất lớn (`p-4` = 16px, `p-6` = 24px, `space-y-4` = 16px, `gap-4` = 16px), khiến màn hình bị "rỗng", phung phí diện tích hiển thị và giảm một nửa số lượng đơn/chuyến mà thủ kho có thể theo dõi.
- **Nguyên tắc "Zero Bloated Spacing"**: Mọi agent (Claude, Gemini, subagents) khi tạo mới hoặc sửa mã nguồn UI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** sinh ra các class Tailwind kích thước lớn.

---

## 2. 🚫 BẢNG DANH SÁCH BỊ CẤM TUYỆT ĐỐI (STRICTLY BANNED CLASSES)

Khi generate hoặc edit code trong `frontend/src/`, **NGHIÊM CẤM** sử dụng các class sau trong các component giao diện tác nghiệp, card, modal, form, hoặc bảng dữ liệu:

| Loại thuộc tính | ❌ CÁC CLASS BỊ CẤM TUYỆT ĐỐI | Lý do cấm |
|---|---|---|
| **Padding (Tất cả các hướng)** | `p-4`, `p-5`, `p-6`, `p-8`, `p-10`, `p-12`, `p-16` | Gây lãng phí từ 16px đến 64px khoảng trắng thừa xung quanh nội dung. |
| **Padding Ngang / Dọc** | `px-4`, `px-5`, `px-6`, `px-8`, `py-3.5`, `py-4`, `py-5`, `py-6`, `py-8` | Làm giãn cách biên quá mức, thu hẹp chiều rộng khả dụng của bảng 10-12 cột. |
| **Khoảng cách dọc (Stack)** | `space-y-3`, `space-y-3.5`, `space-y-4`, `space-y-5`, `space-y-6`, `space-y-8` | Đẩy các khối form và bảng ra xa nhau, làm vỡ tính kết dính (cohesive). |
| **Khoảng cách ngang (Inline)** | `space-x-3`, `space-x-4`, `space-x-6`, `space-x-8` | Làm tràn ngang container khi đặt nhiều nút hoặc filter cạnh nhau. |
| **Khoảng cách lưới (Grid/Flex Gap)** | `gap-3`, `gap-3.5`, `gap-4`, `gap-5`, `gap-6`, `gap-8` | Khiến các ô input và cột thẻ bị rời rạc, không vừa khung nhìn 1366x768 / 1920x1080. |
| **Padding ô bảng (`th`, `td`)** | `p-2.5`, `p-3`, `p-4`, `py-2`, `py-2.5`, `py-3`, `py-4` | Đội chiều cao dòng bảng lên 48px - 60px, chỉ xem được 5-8 đơn/màn hình. |

---

## 3. ✅ BẢNG QUY CHUẨN THAY THẾ BẮT BUỘC (MANDATORY COMPACT PALETTE)

Mọi agent khi sinh code bắt buộc phải map sang bảng kích thước chuẩn sau:

| Thành phần UI | Class chuẩn bắt buộc | Kích thước (px) | Mô tả chi tiết & Ứng dụng |
|---|---|---|---|
| **Thẻ `<Card />` (Container)** | `[--card-spacing:--spacing(1)]` / `py-0` | **4px** | Thẻ card mặc định ôm sát nội dung, không có viền thừa. |
| **Nội dung thẻ `<CardContent />`** | `p-1` (hoặc `p-1.5`) | **4px - 6px** | Mặc định tuyệt đối dùng `p-1`. Không bao giờ dùng `p-4`. |
| **Nội dung Modal / Dialog Body** | `p-2` (tối đa `p-2.5`) | **8px - 10px** | Thay thế hoàn toàn cho `p-4` / `p-6` cũ. Có `overflow-y-auto`. |
| **Header / Footer của Modal** | `py-1.5 px-2` (hoặc `p-2`) | **6px - 8px** | Tiêu đề và thanh nút bấm dưới chân modal sát mép, tiết kiệm diện tích. |
| **Khoảng cách giữa các Section/Khối** | `space-y-1.5` hoặc `space-y-2` | **6px - 8px** | Giữ các khối nghiệp vụ (xe + bảng hàng hóa) dính liền nhau. |
| **Khoảng cách trong Flex/Grid** | `gap-1.5` hoặc `gap-2` | **6px - 8px** | Khoảng cách giữa các ô Input trong Form 3-4 cột. |
| **Khoảng cách Label - Input** | `mb-1` | **4px** | Nhãn nằm ngay trên đầu ô input, không cách xa. |
| **Chiều cao ô Input / Select** | `h-8` (tối đa `h-8.5`) | **32px** | Cỡ chữ ô nhập liệu: `text-xs` hoặc `text-[11px]`. |
| **Chiều cao nút bấm (Button)** | `h-7` hoặc `h-8` (`size="sm"`) | **28px - 32px** | Nút bấm thao tác gọn gàng, text `text-xs` hoặc `text-[11px]`. |
| **Padding ô bảng dữ liệu (`th`, `td`)** | `py-1 px-1.5` hoặc `py-0.5 px-1.5` | **Chiều cao dòng ~24px - 28px** | Cho phép hiển thị đồng thời 20 - 30 đơn hàng trên 1 màn hình. |

### 3.1 ⚠️ CẢNH BÁO QUAN TRỌNG: MẬT ĐỘ GỌN BÊN TRONG vs. ĐỘ RỘNG KHUNG NGOÀI (MODAL WIDTH)
- **Compact Density**: Áp dụng triệt để cho **padding, margin, gap và font-size nội bộ** (`p-1`, `p-2`, `gap-2`, `text-[10px]`) để gom gọn không gian và tăng số lượng item nhìn thấy.
- **Modal Container Width**: **TUYỆT ĐỐI KHÔNG ĐƯỢC BÓP HẸP CHIỀU RỘNG MODAL**. Độ rộng của Modal phải tỷ lệ thuận với nội dung bên trong (tham chiếu `ui-ux-flow-designer` & `ui-spec-auditor`):
  - **Level 1** (`sm:max-w-md`): Alert / Confirm xác nhận thao tác (1-3 dòng text).
  - **Level 2** (`sm:max-w-xl` đến `sm:max-w-2xl`): Form 1 cột (3-6 ô input).
  - **Level 3** (`sm:max-w-3xl` đến `sm:max-w-4xl`): Form 2 cột song song (>= 8 inputs), Master-Detail.
  - **Level 4** (`w-[92vw] sm:max-w-5xl xl:max-w-6xl`): **BẮT BUỘC khi chứa Bảng dữ liệu (`<table>`) từ 5 cột trở lên**, kiểm đếm, đối soát hàng hóa.
  - **Level 5** (`w-[96vw] max-w-7xl`): Bảng đối soát nhiều cột, xem trước bản in A4 Landscape, mapping cột Excel.
- **Quy tắc cấm kỵ**: Nghiêm cấm đặt một bảng dữ liệu 6-10 cột vào Modal `max-w-sm`, `max-w-md` hoặc `max-w-xl`. Bảng bị bóp nát là vi phạm quy chuẩn nghiêm trọng!

---

## 4. 🔤 QUY CHUẨN CỠ CHỮ THU GỌN (COMPACT TYPOGRAPHY SCALE)

Nhằm phục vụ mục tiêu **tối đa hóa số lượng item**, phân cấp font-size được áp dụng triệt để:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ text-[10px]             : Toàn bộ dữ liệu ô bảng (STT, Kiện, Kg, m³,        │
│                           Địa chỉ, Tỉnh thành, Chứng từ, Ghi chú, Header)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ text-[11px] font-mono   : Mã vận đơn (ORD-...), Mã chuyến (TRIP-...),       │
│ font-bold               : Biển số xe (29C-123.45)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ text-[11px] / text-xs   : Nhãn Form (Label), Nút bấm (Button), Input text   │
├─────────────────────────────────────────────────────────────────────────────┤
│ text-xs (12px)          : Tiêu đề khối (CardTitle), Badge trạng thái lớn    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 🛡️ QUY TRÌNH KIỂM SOÁT AGENT CODE GENERATION (AGENT ENFORCEMENT LOOP)

Khi bất kỳ agent nào (bao gồm chính bạn) thực hiện code generation:

1. **Pre-generation Scan**: Kiểm tra prompt và thiết kế. Xác định các layout container. Mặc định gán `p-1`, `space-y-1.5`, `gap-2`.
2. **Code Edit / Replace**: Khi viết JSX/TSX, **tuyệt đối không gõ** `p-4`, `p-6`, `space-y-3`, `gap-4`. Nếu thấy code cũ có các class này, chủ động thay thế ngay lập tức sang `p-1`, `space-y-1.5`, `gap-2`.
3. **Post-generation Audit**: Chạy lệnh grep kiểm tra các file vừa sửa:
   ```powershell
   git diff --staged | Select-String -Pattern '\b(p-4|p-5|p-6|p-8|space-y-3|space-y-4|gap-3|gap-4)\b'
   ```
   Nếu phát hiện còn sót class thuộc Banned List, phải sửa lại ngay trước khi commit hoặc bàn giao.
