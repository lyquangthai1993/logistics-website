# Feedback 19/10 — Task 89: Cải Thiện Font Family Toàn Dự Án, Đảm Bảo Hỗ Trợ 100% Tiếng Việt Cho Tất Cả Theme

> **Thời gian ghi nhận**: 19/10/2026  
> **Người báo cáo**: Quản lý Vận hành TMS (@Thai) & Team Lead Nghiệp vụ TMS (`/leader`)  
> **Phạm vi tác động**:  
> - Toàn bộ hệ thống giao diện TMS (Toàn bộ 10 Theme: Vercel, Claude, Discord, Supabase, Mono, Notebook, Light Green, Zen, Astro Vista, WhatsApp)  
> - Cấu hình nạp Google Fonts & Next.js font loader ([`frontend/src/components/themes/font.config.ts`](frontend/src/components/themes/font.config.ts))  
> - Stylesheet điều phối font toàn cục ([`frontend/src/styles/theme.css`](frontend/src/styles/theme.css) & [`frontend/src/styles/globals.css`](frontend/src/styles/globals.css))  
> - 10 file cấu hình theme chi tiết ([`frontend/src/styles/themes/*.css`](frontend/src/styles/themes/))  
> - Root Layout & Document HTML lang attribute ([`frontend/src/app/layout.tsx`](frontend/src/app/layout.tsx))  
> - Modal in tem nhãn kho vận A4 ([`frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`](frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx))  
> - Các mẫu Email thông báo của Backend ([`backend/src/mail/mail-templates/*.hbs`](backend/src/mail/mail-templates/))  
> **Tài liệu tham chiếu**:  
> - `/leader` Business Domain Architecture ([`SKILL.md`](.agents/skills/leader/SKILL.md))  
> - Quy chế phát triển hệ thống [`AGENTS.md`](AGENTS.md)  
> - Quy chuẩn báo cáo Telegram Mobile-First ([`.agents/skills/telegram-task-responder/SKILL.md`](.agents/skills/telegram-task-responder/SKILL.md))  
> - Quy định về xác thực & kiểm thử tài khoản ([`frontend/e2e/helpers/auth.ts`](frontend/e2e/helpers/auth.ts))  
> **Màn hình & Hub liên quan**: Toàn hệ thống (Global Scope - Tất cả các Hub & Toàn bộ 10 Theme)  
> **Tài khoản test tương ứng**: `USER_ADMIN` (`admin` / `Admin@123`) & `USER_WAREHOUSE_HCM` (`warehouse_hcm` / `Warehouse@123`)  
> **Ảnh minh chứng đính kèm trong thư mục**:  
> - Task này thuần văn bản từ phản hồi Telegram của @Thai, **KHÔNG CÓ ẢNH ĐÍNH KÈM**.  
> - Tuân thủ nghiêm ngặt quy tắc **Zero Cross-Task Image Borrowing (Image Provenance Guard)**: Tuyệt đối không sao chép, copy hoặc mượn file ảnh từ bất kỳ thư mục feedback nào khác!

---

## 📌 Bối cảnh nghiệp vụ thực tế (Chốt theo phản hồi người dùng)

### 1. Phản hồi gốc từ người dùng (@Thai)
> *"cải thiện font family trong project, đảm bảo các font hỗ trợ 100% ngôn ngữ tiếng Việt"*

---

### 2. Phân tích nghiệp vụ vận hành thực tế tại hệ thống Logistics TMS
1. **Tầm quan trọng của Typography tiếng Việt trong phần mềm điều hành kho vận tải (TMS)**:
   - Hệ thống TMS (Spider Express) phục vụ điều độ xe tải, quản lý dòng hàng liên Hub, in phiếu nhập xuất kho A4, in tem nhãn Pallet và hiển thị các bảng kê đối soát với hàng nghìn ký tự tiếng Việt đặc thù có dấu thanh và dấu mũ (á, à, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩn, ẫ, ậ, đ, é, è, ẻ, ẽ, ẹ, ê, ế, ề, ể, ễ, ệ, í, ì, ỉ, ĩ, ị, ó, ò, ỏ, õ, ọ, ô, ố, ồ, ổ, ỗ, ộ, ơ, ớ, ờ, ở, ỡ, ợ, ú, ù, ủ, ũ, ụ, ư, ứ, ừ, sử, ữ, ự, ý, ỳ, ỷ, ỹ, ỵ).
   - Nếu font chữ hệ thống không hỗ trợ đầy đủ subset `vietnamese`:
     * Hiện tượng **"nhảy font" (Font jumping/mismatch)**: Các ký tự có dấu phức tạp như *ơ, ư, ệ, ặ, ỗ* sẽ bị trình duyệt thay thế bằng một font dự phòng khác (system font), khiến chữ bị méo mó, khoảng cách ký tự không đều, chân chữ bị thụt thò gây ức chế thị giác nghiêm trọng.
     * Hiện tượng **"rơi về Times New Roman"**: Khi biến CSS `--font-sans` bị lỗi cú pháp hoặc xung đột vòng lặp (circular dependency), trình duyệt không nhận diện được font và lập tức trả về font serif mặc định cổ điển.
2. **Yêu cầu đối với hệ thống đa giao diện (10 Theme)**:
   - Ứng dụng hiện cung cấp bộ chọn giao diện (`ThemeSelector`) gồm 10 theme: *Claude, Discord, Supabase, Vercel (mặc định), Mono, Notebook, Light Green, Zen, Astro Vista, WhatsApp*.
   - Người dùng có thể chuyển đổi linh hoạt giữa các theme theo sở thích cá nhân hoặc điều kiện ánh sáng. Do đó, **tất cả 10 theme bắt buộc phải hỗ trợ 100% tiếng Việt chuẩn mực**, không được để bất kỳ theme nào bị lỗi hiển thị ký tự có dấu.
   - Font **Be Vietnam Pro** (bộ font sans-serif được thiết kế chuẩn mực riêng cho ngôn ngữ tiếng Việt) cần được tận dụng làm chốt chặn vững chắc (fallback foundation) trong toàn bộ chuỗi font của dự án.

---

## 🔍 Nguyên nhân gốc rễ (Root Cause Analysis - RCA)

Sau khi rà soát toàn bộ cấu hình mã nguồn trong `frontend/src/` và `backend/src/`, phát hiện 6 nguyên nhân gốc rễ chính gây ra tình trạng font hiển thị không chuẩn tiếng Việt và lỗi cấu hình:

### 1. Vòng lặp tự tham chiếu chết người (Circular Dependency) trong Theme mặc định Vercel
- **Vị trí file**: [`frontend/src/styles/themes/vercel.css`](frontend/src/styles/themes/vercel.css) (Dòng 34, 36, 89, 91):
  ```css
  --font-sans: var(--font-sans), var(--font-inter), sans-serif;
  --font-mono: var(--font-mono), var(--font-jetbrains-mono), monospace;
  ```
- **Hậu quả kỹ thuật**: Biến CSS `--font-sans` được định nghĩa bằng chính `var(--font-sans)`. Theo đặc tả *CSS Custom Properties for Cascading Variables Module Level 1 (Section 2.7 Cycles)*: Biến số CSS tham chiếu vòng lặp sẽ bị coi là **invalid at computed-value time**.
- Vì `DEFAULT_THEME = 'vercel'` trong [`frontend/src/components/themes/theme.config.ts`](frontend/src/components/themes/theme.config.ts), mọi người dùng khi vào trang mặc định đều bị lỗi biến `--font-sans`, dẫn đến trình duyệt không thể render đúng font mong muốn mà rơi về font fallback mặc định!

### 2. Đoạn mã ghi đè sai quy cách trong Stylesheet toàn cục `theme.css`
- **Vị trí file**: [`frontend/src/styles/theme.css`](frontend/src/styles/theme.css) (Dòng 26-33):
  ```css
  [data-theme] body {
    --font-sans: initial;
    --font-mono: initial;
    --font-serif: initial;
    font-family: var(--font-sans);
  }
  ```
- **Hậu quả kỹ thuật**: Giá trị `initial` trong CSS đối với Custom Properties đặt thuộc tính về trạng thái sơ khai (không xác định), không cho phép kế thừa từ thẻ cha `html[data-theme]`. Khi kết hợp với lỗi circular ở `vercel.css`, `font-family: var(--font-sans)` trên thẻ `<body>` bị vô hiệu hóa hoàn toàn, khiến trang hiển thị font hệ thống không kiểm soát.

### 3. Cấu hình nạp Google Fonts lãng phí và không hiệu quả trong `font.config.ts`
- **Vị trí file**: [`frontend/src/components/themes/font.config.ts`](frontend/src/components/themes/font.config.ts) (Dòng 1-136):
  * Định nghĩa tới **18 instance font** thông qua `next/font/google`.
  * Trùng lặp vô ích:
    - `Inter` được gọi tới 4 lần (`fontSans`, `fontInstrument`, `fontInter`, `fontDMSans`).
    - `JetBrains_Mono` được gọi tới 3 lần (`fontMono`, `fontFiraCode`, `fontJetBrainsMono`).
    - `Playpen_Sans` được gọi 2 lần (`fontArchitectsDaughter`, `fontPlaypenSans`).
    - `Plus_Jakarta_Sans` được gọi 2 lần (`fontGoogleSansFlex`, `fontOutfit`).
  * **Đáng chú ý nhất**: Font `Be_Vietnam_Pro` (font vàng chuyên biệt hỗ trợ tiếng Việt hoàn hảo nhất) được import tại dòng 30-34 gán vào `--font-be-vietnam-pro`, nhưng **HOÀN TOÀN KHÔNG ĐƯỢC ÁP DỤNG TRONG BẤT KỲ FILE THEME CSS NÀO**!

### 4. Các Theme Claude & WhatsApp không sử dụng Web Font đảm bảo tiếng Việt
- **Vị trí file**:
  * [`frontend/src/styles/themes/claude.css`](frontend/src/styles/themes/claude.css) (Dòng 34-37): Sử dụng `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif...`
  * [`frontend/src/styles/themes/whatsapp.css`](frontend/src/styles/themes/whatsapp.css) (Dòng 34-36): Sử dụng `'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu, Cantarell, 'Fira Sans', sans-serif...`
- **Hậu quả**: Không gắn kết với Google Fonts Next.js đã nạp sẵn với subset `vietnamese`. Trên hệ điều hành Linux, Android hoặc các máy Mac cũ không có 'Segoe UI' hoặc bản dịch dấu tiếng Việt của hệ thống bị lệch, các chữ có dấu sẽ bị vỡ nét hoặc đổi font cục bộ.

### 5. Thiếu chuỗi Fallback chuẩn tiếng Việt (`Be Vietnam Pro`) trong toàn bộ theme
- Chưa có theme nào đưa `var(--font-be-vietnam-pro)` vào làm secondary fallback trong chuỗi `font-family`. Một chuẩn font vững chắc cho ứng dụng tiếng Việt phải luôn có cấu trúc:
  `var(--font-primary), var(--font-be-vietnam-pro), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`

### 6. Điểm tồn đọng tại Backend Mail Templates và In tem nhãn Pallet
- [`backend/src/mail/mail-templates/activation.hbs`](backend/src/mail/mail-templates/activation.hbs) & [`backend/src/mail/mail-templates/confirm-new-email.hbs`](backend/src/mail/mail-templates/confirm-new-email.hbs): Đang dùng `font-family:arial` đơn độc, dễ vỡ dấu trên một số email client di động.
- [`frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`](frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx) (Dòng 421, 434, 444, 465): Sử dụng inline style cố định `fontFamily: "Arial, 'Segoe UI', Tahoma, sans-serif"`, chưa tận dụng biến font toàn cục của hệ thống.

---

## 📋 Danh sách công việc triển khai (Action Checklist)

### 1. Backend (backend/)
- [x] Khảo sát và chuẩn hóa font-family trong toàn bộ các template email Handlebars tại `backend/src/mail/mail-templates/` sang chuỗi font an toàn hỗ trợ 100% tiếng Việt trên mọi email client: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`
- [x] Cập nhật mẫu email kích hoạt tài khoản tại `backend/src/mail/mail-templates/activation.hbs` (thay thế `font-family:arial` bằng chuỗi font tiếng Việt chuẩn).
- [x] Cập nhật mẫu email xác nhận đổi email tại `backend/src/mail/mail-templates/confirm-new-email.hbs` (thay thế `font-family:arial` bằng chuỗi font tiếng Việt chuẩn).
- [x] Chạy kiểm tra biên dịch backend: `npm --prefix backend run build` bảo đảm không phát sinh lỗi cú pháp hay gãy build.

### 2. Frontend (frontend/)
- [x] Tái cấu trúc và tối ưu hóa file nạp font `frontend/src/components/themes/font.config.ts`:
  * Loại bỏ hoàn toàn 10 instance font trùng lặp lãng phí (`fontInstrument`, `fontDMSans`, `fontInter` trùng, `fontFiraCode`, `fontJetBrainsMono` trùng, `fontOutfit`, `fontArchitectsDaughter` trùng).
  * Giữ lại và chuẩn hóa danh sách các font cốt lõi với cấu hình `subsets: ['latin', 'vietnamese']`:
    - `fontInter`: Inter (chính cho UI hiện đại) ➔ `--font-inter`
    - `fontJetBrainsMono`: JetBrains Mono (cho mã đơn, bảng số liệu, mono) ➔ `--font-jetbrains-mono`
    - `fontBeVietnamPro`: Be Vietnam Pro (chuẩn mực typographic tiếng Việt) ➔ `--font-be-vietnam-pro`
    - `fontPlusJakartaSans`: Plus Jakarta Sans ➔ `--font-plus-jakarta-sans`
    - `fontSourceCodePro`: Source Code Pro ➔ `--font-source-code-pro`
    - `fontPlaypenSans`: Playpen Sans ➔ `--font-playpen-sans`
    - `fontMerriweather`: Merriweather (serif) ➔ `--font-merriweather`
    - `fontPlayfairDisplay`: Playfair Display (serif trang nhã) ➔ `--font-playfair-display`
  * Đồng bộ biến tổng hợp `fontVariables` để Next.js inject đầy đủ các CSS custom properties vào thẻ `<body>`.
- [x] Sửa dứt điểm lỗi Circular Dependency và chuẩn hóa cấu hình font trong toàn bộ 10 Theme CSS:
  * `frontend/src/styles/themes/vercel.css`: Thay thế `var(--font-sans)` tự tham chiếu bằng `var(--font-inter), var(--font-be-vietnam-pro), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;` và sửa `--font-mono` thành `var(--font-jetbrains-mono), monospace;`
  * `frontend/src/styles/themes/claude.css`: Bổ sung `var(--font-inter), var(--font-be-vietnam-pro)` đứng đầu chuỗi font-sans để đảm bảo 100% tiếng Việt thay vì chỉ dựa vào font hệ thống.
  * `frontend/src/styles/themes/whatsapp.css`: Bổ sung `var(--font-plus-jakarta-sans), var(--font-be-vietnam-pro)` vào chuỗi font-sans.
  * `frontend/src/styles/themes/supabase.css`: Đảm bảo chuỗi font-sans sử dụng `var(--font-plus-jakarta-sans), var(--font-be-vietnam-pro), sans-serif;`
  * `frontend/src/styles/themes/discord.css`: Đảm bảo chuỗi font-sans sử dụng `var(--font-plus-jakarta-sans), var(--font-be-vietnam-pro), sans-serif;`
  * `frontend/src/styles/themes/mono.css`: Đảm bảo `--font-sans` và `--font-mono` sử dụng `var(--font-jetbrains-mono), monospace;` với subset tiếng Việt đầy đủ.
  * `frontend/src/styles/themes/notebook.css`: Đảm bảo sử dụng `var(--font-playpen-sans), var(--font-be-vietnam-pro), cursive, sans-serif;`
  * `frontend/src/styles/themes/light-green.css`: Đảm bảo sử dụng `var(--font-inter), var(--font-be-vietnam-pro), sans-serif;`
  * `frontend/src/styles/themes/zen.css`: Đảm bảo sử dụng `var(--font-inter), var(--font-be-vietnam-pro), sans-serif;`
  * `frontend/src/styles/themes/astro-vista.css`: Đảm bảo sử dụng `var(--font-plus-jakarta-sans), var(--font-be-vietnam-pro), sans-serif;`
- [x] Sửa lỗi ghi đè `--font-sans: initial;` trong `frontend/src/styles/theme.css`:
  * Xóa bỏ đoạn mã `--font-sans: initial; --font-mono: initial; --font-serif: initial;` gây hỏng kế thừa CSS.
  * Đảm bảo `font-family: var(--font-sans);` trên `body` kế thừa mượt mà và chính xác giá trị từ theme active (`[data-theme]`).
- [x] Cập nhật modal in ấn tem nhãn pallet kho vận tại `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx`:
  * Bổ sung `Be Vietnam Pro` và fallback stack chuẩn tiếng Việt vào thuộc tính inline style `fontFamily`.
- [x] Kiểm tra và đồng bộ thuộc tính `lang="vi"` trong `frontend/src/app/layout.tsx` đảm bảo các quy tắc phân tách từ, gạch nối và ngữ nghĩa tiếng Việt của trình duyệt hoạt động chuẩn xác nhất.
- [x] Chạy typecheck và lint trên frontend: `npm --prefix frontend run typecheck && npm --prefix frontend run lint` đảm bảo sạch lỗi 100%.

### 3. Kiểm thử & Nghiệm thu E2E (frontend/e2e/)
- [x] Xây dựng file kiểm thử tự động Playwright E2E mới: `frontend/e2e/92-feedback-19-10-task-89-vietnamese-font-family.spec.ts`:
  * Kịch bản 1: Đăng nhập với tài khoản `USER_ADMIN` (`admin`), kiểm tra font chữ mặc định của trang Dashboard (Theme Vercel) có computed style `fontFamily` chứa `Inter` hoặc `Be Vietnam Pro`, xác nhận KHÔNG bị rơi về `Times New Roman` hay font serif lỗi.
  * Kịch bản 2: Duyệt qua toàn bộ 10 Theme trong danh sách (`vercel`, `claude`, `discord`, `supabase`, `mono`, `notebook`, `light-green`, `zen`, `astro-vista`, `whatsapp`). Chuyển đổi theme và assert computed style của `document.body` luôn hợp lệ, không chứa biến CSS rỗng/invalid.
  * Kịch bản 3: Kiểm tra hiển thị bộ ký tự tiếng Việt toàn diện (đầy đủ 134 ký tự nguyên âm có dấu thanh, dấu mũ, dấu móc: ắ, ặ, ẳ, ẵ, ế, ệ, ể, ễ, ố, ộ, ổ, ỗ, ơ, ở, ờ, ớ, ợ, ư, ừ, ứ, ử, ữ, ự, đ, Đ) trên các tiêu đề (`h1`, `h2`), bảng dữ liệu kho bãi (`table`, `th`, `td`), thẻ badge trạng thái và modal.
  * Kịch bản 4: Kiểm tra màn hình Inbound (`/dashboard/warehouse/inbound`) và Outbound (`/dashboard/warehouse/outbound`) hiển thị tiếng Việt sắc nét, chuẩn độ dày nét chữ (font-weight), không bị vỡ bố cục hoặc co giật layout.
  * Kịch bản 5: Chụp ảnh bằng chứng nghiệm thu thực tế `screenshot_vietnamese_font_verified.png` lưu trong thư mục task và xuất báo cáo kiểm thử.
- [x] Chạy kiểm tra chất lượng E2E cross-audit qua `node scripts/e2e-auditor.mjs` bảo đảm đạt điểm tối đa (>= 40/50 điểm, 0 lỗi Auto-FAIL).
