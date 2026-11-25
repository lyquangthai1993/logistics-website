# Quy Chuẩn & Checklist Quy Trình GitHub Cho Tác Vụ (GitHub Task Lifecycle Workflow Rule)

> **Mã quy chuẩn**: `RULE-GIT-TASK-WORKFLOW-01` & `RULE-GIT-HISTORY-RESUME-01`  
> **Trạng thái**: BẮT BUỘC (MANDATORY INVARIANT) CHO TOÀN BỘ AGENT (`/leader`, Default Agent, `/todo-agent`, `/telegram-task-responder`) VÀ KỸ SƯ Ở MỖI PHIÊN SESSION CHAT VỚI ANTIGRAVITY  
> **Áp dụng cho**: Monorepo Root (`logistics-website`), Backend Submodule (`logistics-website-backend`), Frontend Submodule (`logistics-website-frontend`)

---

## 1. Mục Đích & Triết Lý Vận Hành

Quy trình này thiết lập **chuẩn mực bất biến** cho toàn bộ vòng đời xử lý một nhiệm vụ (Task / Feedback / Bugfix) trên GitHub:
1. **Tuyệt đối không code, commit hay push thẳng lên `dev` hoặc `master` (`RULE-GIT-HISTORY-RESUME-01`)**:
   - Mọi task và mọi chỉnh sửa trong các phiên chat đều phải thực hiện trên **Feature/Fix Branch** (`feat/...`, `feature/...`, `fix/...`).
   - **Điều kiện bắt buộc ở MỖI phiên session chat với Antigravity**: Khi bắt đầu phiên chat hoặc trước khi thao tác với Git, `/leader` và Default Agent BẮT BUỘC chạy `npm run repo:status` và `npm run repo:tracking`. Nếu phát hiện bất kỳ repo nào (`root`, `backend/`, `frontend/`) đang đứng ở `dev` hoặc `master`, BẮT BUỘC truy ngược Git History (`git reflog`, `git for-each-ref --sort=-committerdate`) để tìm ra branch feature chính trước đó đã push/làm việc và **quay về branch feature đó ngay lập tức** bằng lệnh `npm run repo:resume` (`node scripts/git-task-workflow.mjs resume`).
   - Chốt chặn kỹ thuật [`scripts/hooks/pre-command-guard.mjs`](file:///d:/Projects/logistics-website/scripts/hooks/pre-command-guard.mjs) tự động **BLOCK (`deny`)** mọi lệnh `git commit` hoặc `git push` trực tiếp trên `dev` và `master`.
2. **Kiểm định theo phạm vi ảnh hưởng (Risk-Based Quality Gate)**:
   - **Trước PR**: Build, typecheck/lint phù hợp và chỉ chạy các Playwright spec bao phủ hành vi thay đổi cùng hồi quy trực tiếp trên Local. Không chạy toàn bộ suite cho mỗi task.
   - **Sau merge**: Xác nhận Railway deploy/cutover; chạy smoke/spec Cloud Dev khi task cần xác nhận môi trường live hoặc nghiệm thu hình ảnh.
   - **Toàn bộ suite**: Chạy định kỳ (khuyến nghị nightly) và trước release. Repo hiện chưa có workflow nightly E2E; lỗi suite được phân loại theo khu vực bị ảnh hưởng và chỉ chặn PR nếu có bằng chứng lỗi liên quan tới thay đổi.
3. **Bằng Chứng Pháp Lý & Minh Bạch (PR Audit Trail)**: Mỗi task hoàn thành bắt buộc phải có một Pull Request / Merge Request (PR/MR) trỏ vào `dev` trên GitHub để lưu vết lịch sử, danh sách thay đổi và biên bản kiểm thử, sau đó tự động merge vào `dev` và **chuyển workspace quay lại branch feature chính** (`npm run repo:resume`).
4. **Biên Niên Sử & Báo Cáo**: Tự động ghi chép `RESOLUTION.md`, cập nhật `docs/SYSTEM_TIMELINE.md` và gửi báo cáo chuẩn mobile-first qua Telegram kèm link PR và ảnh bằng chứng.

---

## 2. Kiến Trúc Git Submodules Cần Ghi Nhớ

Hệ thống Logistics TMS gồm **3 Git repository độc lập**:
- **Root Repository** (`d:\Projects\logistics-website`): Chứa scripts, config, tài liệu `docs/`, `feedbacks/`, và `.agents/`.
- **Backend Submodule** (`backend/`): Repo `logistics-website-backend` (NestJS 11, TypeORM, PostgreSQL).
- **Frontend Submodule** (`frontend/`): Repo `logistics-website-frontend` (Next.js 15, React 19, Tailwind CSS).

> ⚠️ **NGUYÊN TẮC CỐT LÕI**:
> - Tạo branch, commit và push **BẮT BUỘC thực hiện TRỰC TIẾP bên trong thư mục submodule tương ứng** (`backend/` và/hoặc `frontend/`).
> - Tạo branch ở root **KHÔNG** làm thay đổi branch trong `backend/` hay `frontend/`.
> - Nếu task tác động cả Fullstack, bắt buộc tạo nhánh cùng tên trên cả hai submodule và root.

---

## 3. Quy Chuẩn Đặt Tên Nhánh & Suy Luận Thiết Kế (Branch Naming Taxonomy)

### 3.1. Phân Tích & Suy Luận Thiết Kế (Design Rationale)

Khi vận hành hệ thống Logistics TMS với nhiều phân hệ song song (Kho bãi, Điều phối, Đội xe, Đơn hàng) và hàng trăm tác vụ feedback được giao qua Telegram Bot, tên branch cần giải quyết đồng thời **4 bài toán cốt lõi**:

1. **Khả năng truy vết tức thì (Instant Traceability)**: Tên branch phải liên kết 1:1 với `task_id` trong cơ sở dữ liệu `telegram_tasks`, thư mục `feedbacks/feedback_MM_DD_task_<id>`, và biên bản `RESOLUTION.md`.
2. **Khớp nối chuẩn Conventional Commits**: Tiền tố của branch phải đồng bộ với chuẩn commit (`feat(...)`, `fix(...)`, `refactor(...)`), giúp tự động hóa tạo PR title và changelog.
3. **Phân vùng nghiệp vụ rõ ràng (Domain Scoping)**: Nhìn vào danh sách branch trên GitHub hoặc Git CLI là nhận biết ngay phân hệ bị tác động mà không cần mở code.
4. **An toàn Git Ref (Zero Ref Conflict)**: Tránh sử dụng quá nhiều cấp phân tầng thư mục `/` (như `feat/warehouse/task-81/...`) vì Git có cơ chế ref lock dạng file hệ thống, sẽ báo lỗi `cannot lock ref` nếu có nhánh trùng tên thư mục cha.

---

### 3.2. Cấu Trúc Đặt Tên Chuẩn 4 Thành Phần

Mọi branch tạo mới BẮT BUỘC tuân thủ công thức sau:

```
<type>/task-<id>-<module>-<action>
```

```
           ┌── 1. Type: Loại công việc (feat, fix, refactor, perf)
           │
           │      ┌── 2. Task ID: Khóa liên kết nghiệp vụ duy nhất (task-81)
           │      │
           │      │          ┌── 3. Module: Phân hệ nghiệp vụ TMS (warehouse, trip, order...)
           │      │          │
           ▼      ▼          ▼      ▼── 4. Action: Hành động kỹ thuật (2-4 từ kebab-case)
         feat/task-81-warehouse-outbound-pallet
```

#### Giải thích 4 thành phần:

| Thành phần | Ý nghĩa | Giá trị chuẩn | Ví dụ |
|---|---|---|---|
| **`<type>`** | Phân loại mục đích thay đổi | `feat` (hoặc `feature`), `fix`, `refactor`, `perf` | `feat`, `fix` |
| **`task-<id>`** | Mã số định danh của task | Bắt buộc có tiền tố `task-` kèm số ID | `task-81`, `task-80` |
| **`<module>`** | Phân hệ nghiệp vụ bị tác động | Thuộc danh mục phân hệ TMS (bảng bên dưới) | `warehouse`, `trip`, `order` |
| **`<action>`** | Tóm tắt hành động kỹ thuật | 2–4 từ tiếng Anh, viết thường, ngăn cách bằng dấu gạch ngang (`-`) | `outbound-pallet`, `driver-assign` |

---

### 3.3. Bảng Danh Mục Phân Hệ Nghiệp Vụ (`<module>`)

| Mã Module | Phân hệ tương ứng | Nghiệp vụ tiêu biểu |
|---|---|---|
| `warehouse` | Quản lý kho bãi | Nhập kho, xuất kho, tồn kho, pallet, in tem A4, kiểm đếm |
| `trip` | Quản lý chuyến xe | Tạo chuyến, gán chuyến, xếp xe, bốc dỡ, lộ trình trạm |
| `order` | Quản lý đơn hàng | Tạo đơn, gom đơn, cập nhật trọng lượng, thể tích CBM |
| `fleet` | Đội xe & Tài xế | Quản lý phương tiện, hồ sơ tài xế, bảo dưỡng, định vị |
| `hub` | Trạm & Trung chuyển | Điều phối liên Hub, luân chuyển nội bộ, trạm nhận/dỡ |
| `auth` | Xác thực & Phân quyền | Đăng nhập, JWT token, Guard, RBAC matrix |
| `report` | Báo cáo & Thống kê | KPI, đối soát, sổ cái vận hành, xuất file Excel |
| `core` | Hạ tầng & Nền tảng | Scripts, CI/CD, Railway, N8n, cấu hình hệ thống |

---

### 3.4. Các Điều Cấm Kỵ Tuyệt Đối (Anti-Patterns)

- 🚫 **CẤM tiếng Việt có dấu hoặc khoảng trắng**: `feat/task-81-xuat-kho-pallet` (phải dùng tiếng Anh không dấu).
- 🚫 **CẤM bỏ quên `task-<id>`**: `feat/warehouse-outbound` (mất dấu vết nghiệm thu).
- 🚫 **CẤM đặt tên quá dài vượt quá 50 ký tự**: Không viết cả câu văn vào tên branch.
- 🚫 **CẤM dùng ký tự đặc biệt**: `@`, `#`, `$`, `%`, `&`, `*`, `(`, `)`.
- 🚫 **CẤM tự ý commit hoặc push thẳng code lên `dev` hoặc `master`**: Nếu repo đang đứng ở `dev`/`master`, bắt buộc truy ngược Git history (`npm run repo:resume`) để quay về branch feature chính làm việc.

---

## 4. Quy Trình 5 Giai Đoạn Chuẩn Chỉ (5-Stage Standard Pipeline)

```mermaid
flowchart TD
    subgraph S1["Giai đoạn 1: Khởi Đầu Phiên Chat & Nhánh Feature"]
        A0["Kiểm tra trạng thái & Git History<br>(npm run repo:status)"] --> A1{"Tiếp tục task cũ hay<br>Làm task mới?"}
        A1 -->|Tiếp tục / Đang ở dev| A2R["Truy ngược Git History & Quay về Feature<br>(npm run repo:resume)"]
        A1 -->|Task mới hoàn toàn| A2["Đồng bộ Dev & Tạo nhánh feat/task-ID-...<br>(npm run task:branch)"]
    end

    subgraph S2["Giai đoạn 2: Build & Affected E2E Gate"]
        B1["Thực thi Code trên Feature Branch<br>(Compact density, no mock data)"] --> B2["Build & TypeCheck Local<br>(tsc --noEmit, npm run build)"]
        B2 --> B3["Playwright E2E specs bị ảnh hưởng<br>(Autonomous Self-Healing max 3 retries)"]
    end

    subgraph S3["Giai đoạn 3: Tạo PR, Merge vào Dev & Quay về Feature Branch"]
        C1["Commit & Push Feature Branch"] --> C2["Tạo PR vào dev trên GitHub<br>(Lưu vết Audit Evidence)"]
        C2 --> C3["Tự Động Merge PR vào dev &<br>Quay lại Feature Branch (npm run repo:resume)"]
    end

    subgraph S4["Giai đoạn 4: Deploy & Cloud Dev Smoke khi cần"]
        D1["Chờ Cloud Railway Deploy Dev<br>(npm run railway:wait)"] --> D2["Smoke/spec bị ảnh hưởng khi cần<br>(Nghiệm thu trên Cloud)"]
        D2 --> D3["Đánh giá chéo E2E Auditor<br>(scripts/e2e-auditor.mjs >= 40/50)"]
    end

    subgraph S5["Giai đoạn 5: Biên Niên Sử & Báo Cáo"]
        E1["Checklist [x] trong TODO.md"] --> E2["Ghi RESOLUTION.md & SYSTEM_TIMELINE.md<br>(npm run todo:record)"]
        E2 --> E3["Báo cáo Telegram Mobile-First<br>(Kèm Link PR & Ảnh Nghiệm Thu)"]
    end

    S1 --> S2 --> S3 --> S4 --> S5
```

---

### Giai Đoạn 1: Bắt Đầu Phiên Session Chat — Truy Ngược Git History Hoặc Khởi Tạo Nhánh Mới

1. **Kiểm tra trạng thái kho lưu trữ & truy vết nhánh feature gần nhất (BẮT BUỘC MỖI PHIÊN CHAT)**:
   ```bash
   npm run repo:status
   npm run repo:tracking
   ```
2. **Trường hợp A — Tiếp tục phiên làm việc hoặc phát hiện repo đang đứng ở `dev` / `master`**:
   - Tuyệt đối KHÔNG làm việc hay push thẳng lên `dev`/`master`.
   - Chạy lệnh tự động truy ngược Git History (`git reflog` + `git for-each-ref`) để quay về đúng branch feature chính trước đó đã push:
     ```bash
     npm run repo:resume
     # (Hoặc: node scripts/git-task-workflow.mjs resume)
     ```
3. **Trường hợp B — Nhận một Task hoàn toàn mới**:
   - Sử dụng script chuẩn để kéo `dev` mới nhất và tạo nhánh `<type>/task-<id>-<module>-<action>` trên cả `backend/`, `frontend/` và `root`:
     ```bash
     node scripts/git-task-workflow.mjs start <task_id> <module> <action> <type> fullstack
     ```
4. **Ghi nhận thông tin nhánh vào `feedbacks/feedback_MM_DD_task_<id>/TODO.md`**:
   - Ghi rõ branch name ở đầu file `TODO.md` để mọi agent đều nhận biết.

---

### Giai Đoạn 2: Build & Kiểm Thử Theo Phạm Vi Ảnh Hưởng

1. Chạy lint, typecheck và build phù hợp với package bị thay đổi.
2. Với thay đổi hành vi, bật local servers và chạy spec nhỏ nhất bao phủ luồng mới cùng hồi quy trực tiếp:
   ```powershell
   npm run dev:ensure
   $env:PLAYWRIGHT_BASE_URL="http://localhost:4000"
   $env:API_URL="http://localhost:4001/api/v1"
   npx --prefix frontend playwright test e2e/<affected_spec>.spec.ts
   ```
3. Mở rộng spec cho auth/RBAC, shared UI, API contract, migration hoặc thay đổi xuyên phân hệ. Ghi danh sách spec và lý do chọn vào TODO/PR. Thay đổi docs/comments hoặc không ảnh hưởng hành vi được ghi E2E: N/A kèm lý do.
4. Nếu spec liên quan fail, phân tích và tự sửa tối đa 3 lần; không publish thay đổi vẫn còn lỗi trong check bắt buộc.
5. Chạy `node scripts/e2e-auditor.mjs frontend/e2e/<spec>.spec.ts` khi có spec mới/sửa; yêu cầu >= 40/50 và 0 Auto-FAIL. Không audit spec không liên quan.
6. Toàn bộ E2E chạy định kỳ (khuyến nghị nightly) và trước release; suite fail chỉ chặn PR khi được xác nhận có liên quan tới thay đổi.

---

### Giai Đoạn 3: Đẩy Feature Branch, Tạo PR vào `dev`, Merge & Quay Về Feature Branch

1. **Đảm bảo đang đứng trên nhánh Feature (KHÔNG đứng trên `dev` hay `master`)**:
   ```powershell
   npm run repo:resume
   ```
2. **Commit code bên trong submodule tương ứng**:
   ```powershell
   # Quy tắc Conventional Commits có gắn task_id:
   git -C backend commit -am "feat(task-81): implement outbound pallet logic for warehouse"
   git -C frontend commit -am "feat(task-81): add pallet inspection modal and action flow"
   ```
3. **Đẩy nhánh tính năng lên remote GitHub (TUYỆT ĐỐI KHÔNG push thẳng vào `dev`/`master`)**:
   ```powershell
   git -C backend push -u origin feat/task-81-warehouse-outbound-pallet
   git -C frontend push -u origin feat/task-81-warehouse-outbound-pallet
   ```
4. **Tạo Pull Request (PR) trỏ vào nhánh `dev`, Tự động Merge & Quay về Feature Branch**:
   - Sử dụng script chuẩn (tự động push, tạo PR, merge vào `dev`, và checkout quay lại nhánh feature):
     ```powershell
     node scripts/git-task-workflow.mjs pr 81 warehouse outbound-pallet feat fullstack
     ```
   - Hoặc dùng connected GitHub integration để tạo và merge PR (**KHÔNG xóa branch**) để giữ nhánh feature làm việc tiếp:
     ```powershell
     npm run repo:resume
     ```

---

### Giai Đoạn 4: Xác Nhận Deploy & Cloud Dev Smoke Khi Cần

1. Khi task cần xác nhận môi trường live, chờ Railway build SUCCESS, đúng commit và cutover bằng `npm run railway:wait`.
2. Chạy smoke hoặc affected spec trên Cloud Dev; không chạy toàn bộ E2E suite cho mỗi task. Ghi N/A nếu task không cần kiểm chứng live.
3. Chạy auditor chỉ cho spec mới/sửa. Chụp ảnh evidence khi task yêu cầu nghiệm thu trực quan; ảnh phải có dữ liệu thật.

---

### Giai Đoạn 5: Biên Niên Sử Kỹ Thuật & Báo Cáo Mobile-First

1. **Đồng bộ toàn bộ Checklist trong `TODO.md` thành `- [x]`**.
2. **Ghi nhận Biên bản Nghiệm thu Kỹ thuật & Đồng bộ Biên niên sử**:
   ```bash
   npm run todo:record feedbacks/feedback_MM_DD_task_<id>
   ```
   - Sinh file `RESOLUTION.md` với đầy đủ 6 cấu phần bắt buộc.
   - Tự động ghi chép mốc son mới vào đỉnh file [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md).
3. **Phát Báo Cáo Nghiệm Thu Hoàn Tất qua Telegram Bot**:
   - Tuân thủ quy chuẩn `telegram-task-responder` (Mobile-First, Card layout, không nói thừa, không kết thúc bằng câu hỏi/slogan).

---

## 5. Bảng Checklist Tự Kiểm Soát (Mandatory Checklist Gate)

Bảng này là danh mục bắt buộc kiểm tra. Agent KHÔNG ĐƯỢC BÁO HOÀN THÀNH nếu còn bất kỳ ô nào chưa đạt:

| STT | Hạng mục kiểm tra | Tiêu chuẩn đạt yêu cầu | Trạng thái |
|:---:|---|---|:---:|
| 0 | **Truy ngược Git History mỗi phiên chat** | Đã chạy `npm run repo:status` & `npm run repo:resume` để quay về branch feature chính (không đứng ở `dev`/`master`). | `[ ]` |
| 1 | **Tách nhánh từ `dev` mới nhất** | Đã `git pull origin dev` và làm việc trên `feat/task-<id>-*` trong submodule. | `[ ]` |
| 2 | **Quy chuẩn mã nguồn** | Compact density (`p-1`, `p-2`), 0 jargon tiếng Anh trong UI, 0 mock data. | `[ ]` |
| 3 | **Local Build & TypeCheck** | `npm run build --prefix backend` & `tsc --noEmit` pass 0 lỗi. | `[ ]` |
| 4 | **Local E2E theo phạm vi ảnh hưởng** | Spec liên quan PASS; ghi `N/A` kèm lý do nếu không đổi hành vi. | `[ ]` |
| 5 | **Tạo PR làm bằng chứng** | Đã push feature branch (KHÔNG push thẳng `dev`/`master`) và tạo PR trỏ vào `dev`. | `[ ]` |
| 6 | **Merge PR & Quay về Feature Branch** | Đã merge PR vào `dev` và chạy `npm run repo:resume` để giữ workspace ở nhánh feature. | `[ ]` |
| 7 | **Cloud Dev Deploy Ready** | Domain Dev Railway build xong (`npm run railway:wait`), Health Check HTTP 200. | `[ ]` |
| 8 | **Cloud Dev smoke (khi cần)**| Smoke/spec liên quan PASS sau khi deployment SUCCESS & cutover; nếu không cần ghi `N/A`. | `[ ]` |
| 9 | **Ảnh bằng chứng (khi cần)** | Với nghiệm thu trực quan, chụp `screenshot_*_verified.png` có dữ liệu thật. | `[ ]` |
| 10| **Biên niên sử kỹ thuật** | Đã chạy `npm run todo:record` cập nhật `RESOLUTION.md` & `SYSTEM_TIMELINE.md`. | `[ ]` |
| 11| **Báo cáo Telegram đúng quy chuẩn**| Dẫn chứng PR link, mobile-first, gửi ảnh qua `sendPhoto`. | `[ ]` |

---

## 6. Lệnh Vận Hành Tóm Tắt (CLI Quick Reference)

```powershell
# 0. Bắt buộc ở đầu mỗi phiên chat (Kiểm tra & quay về branch feature chính từ Git History):
npm run repo:status
npm run repo:tracking
npm run repo:resume

# 1. Bắt đầu task mới hoàn toàn (Tạo nhánh từ dev):
node scripts/git-task-workflow.mjs start <ID> <module> <action> feat fullstack

# 2. Kiểm thử Tầng 1 (Local):
npm run dev:ensure
$env:PLAYWRIGHT_BASE_URL="http://localhost:4000"
$env:API_URL="http://localhost:4001/api/v1"
npx --prefix frontend playwright test e2e/<test_spec>.spec.ts

# 3. Đẩy nhánh feature, tạo PR, Merge vào dev & Quay lại nhánh feature:
node scripts/git-task-workflow.mjs pr <ID> <module> <action> feat fullstack

# 4. Kiểm thử Tầng 2 (Cloud Dev):
npm run railway:wait
$env:PLAYWRIGHT_BASE_URL="https://frontend-tms-core-dev.up.railway.app"
$env:API_URL="https://backend-tms-core-dev.up.railway.app/api/v1"
npx --prefix frontend playwright test e2e/<test_spec>.spec.ts

# 5. Ghi nhận biên niên sử:
npm run todo:record feedbacks/feedback_MM_DD_task_<ID>
```
