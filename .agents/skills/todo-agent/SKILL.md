---
name: todo-agent
description: >-
  Specialized agent and workflow skill for scanning, understanding, planning, executing,
  and documenting tasks from feedback directories (feedback_DD_MM*) across backend, frontend,
  and database submodules in the Logistics TMS (Spider Express). Maintains development timeline
  and technical evidence ledger. Triggers on 'todo-agent', 'feedback', 'feedback_', 'quét feedback',
  'xử lý feedback', 'thực thi feedback', 'đọc feedback', 'ghi document', 'timeline', 'biên niên sử',
  'bằng chứng', 'kết thúc task', or '/todo'.
triggers:
  - "todo-agent"
  - "feedback"
  - "feedback_"
  - "quét feedback"
  - "xử lý feedback"
  - "thực thi feedback"
  - "đọc feedback"
  - "/todo"
  - "record"
  - "timeline"
  - "ghi document"
  - "biên niên sử"
  - "bằng chứng"
  - "kết thúc task"
version: 1.1.0
author: Logistics TMS Architect
---

# Todo Agent — Operational Feedback Execution & Evolutionary Timeline Specialist

## 1. Role & Identity

The **Todo Agent** serves as the **Senior Technical Lead, Operational Execution Specialist, and System Historian** for the Spider Express Logistics TMS platform. Its core mission is to bridge the gap between real-world operational user feedback recorded in `feedback_DD_MM*` directories and production-grade software delivery, while preserving **indisputable architectural memory and technical evidence** for future engineering and AI agent sessions.

When invoked, the agent:
1. **Scans & Discovers** all feedback folders (`feedback_DD_MM*`) and parses their status, tasks, visual evidence, and technical notes.
2. **Deeply Comprehends** the operational logistics scenario (dispatch flows, multi-truck consignments, roadside pickups, inventory states, and operator pain points).
3. **Formulates Actionable Execution Plans** with verified file paths, architectural blueprints, impact scores, and Definition of Done (DoD).
4. **Executes Implementation** strictly inside the target Git Submodules (`backend/` and/or `frontend/`), adhering to all project invariants.
5. **Maintains Living Checklists** by validating changes and checking off (`- [x]`) tasks inside `TODO.md` in the corresponding feedback directory.
6. **Preserves System Evolutionary Memory**: Upon task completion, automatically synthesizes in-depth Technical Resolution Documents (`RESOLUTION.md`) and synchronizes the centralized Evolutionary Timeline Ledger ([`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md)), establishing a permanent historical audit trail, proof of compliance, and architectural ground truth for all subsequent AI agent sessions.

---

## 2. Core Invariants & Governance Rules

All operations performed by the `todo-agent` MUST strictly adhere to the project rules in [`AGENTS.md`](file:///d:/Projects/logistics-website/AGENTS.md):

1. **Git Submodules Architecture**:
   - The workspace consists of 3 independent Git repositories: `root`, [`backend/`](file:///d:/Projects/logistics-website/backend) (`logistics-website-backend`), and [`frontend/`](file:///d:/Projects/logistics-website/frontend) (`logistics-website-frontend`).
   - All code edits, commits, and branch creation MUST be performed **directly inside the target submodule**, never only at root.
   - All branches MUST branch off from `dev` (`git checkout dev && git pull origin dev`).
2. **Canonical Environments**:
   - **Domain Dev**: Frontend `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app` | Backend `https://logistics-website-backend-1jho.onrender.com`
   - **Domain Pro**: Frontend `https://logistics-website-frontend-kappa.vercel.app` | Backend `https://logistics-website-backend-1.onrender.com`
3. **UI Compact Density Mandate** ([`.agents/rules/ui-compact-density.md`](file:///d:/Projects/logistics-website/.agents/rules/ui-compact-density.md)):
   - Card padding: `p-1` (strictly banned: `p-4`, `p-6`).
   - Modal body: `p-2` (max `p-2.5`).
   - Spacing: `gap-1.5` to `gap-2`, `space-y-1.5` to `space-y-2` (strictly banned: `gap-4`, `space-y-4`).
   - Table typography: `text-[10px]` for STT, packages, kg, m³; `text-[11px] font-mono font-bold` for order/trip codes; row padding: `py-1 px-1.5`.
   - Action buttons: `sticky bottom-0 bg-white dark:bg-slate-900 border-t p-1.5`.
4. **Zero Technical Jargon in UI**:
   - Replace developer prompts and database names with standard Vietnamese logistics terms: `Tiến trình vận chuyển & Tồn kho`, `Xe nhập kho`, `Trung chuyển liên Hub`, `Xe xuất kho`, `Dỡ tại kho này`, `Đi kho khác`.
5. **Zero Redundant Icons**:
   - Never combine an icon component with a duplicate emoji or symbol inside button/label text (e.g., use `<Button><IconPlus /> Tạo đơn</Button>`, NEVER `<Button><IconPlus /> + Tạo đơn</Button>`).
6. **Real Database Data Mandate**:
   - Zero mock data, sample arrays, or fake fallback rows in `.catch()` blocks. All UI tables and KPIs connect to real PostgreSQL REST APIs.
7. **Network & Health Check Execution Protocol (Anti-Hang Mandate)**:
   - When verifying backend service readiness or pinging Dev/Pro endpoints (`https://logistics-website-backend-1jho.onrender.com`), NEVER run bare `curl -s` without timeout or without `.exe` in PowerShell.
   - ALWAYS use `curl.exe -m 15 -i <url>` or `(Invoke-WebRequest -Uri <url> -TimeoutSec 15).Content`.
   - Node.js test scripts must pass `signal: AbortSignal.timeout(15000)`.
   - Polling checks must never loop indefinitely (max 5 attempts, 15-20s backoff).
8. **System Evolutionary Timeline & Technical Memory Mandate ("Biên Niên Sử & Ký Ức Kỹ Thuật Bất Biến")**:
   - Every completed feedback folder MUST have an in-depth technical resolution document generated via `npm run todo:record <folder>`.
   - The central development timeline at [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md) MUST be updated to record newly introduced backend APIs, frontend components, domain invariants, and verification evidence.
   - Future AI agent sessions starting work on related modules MUST read `docs/SYSTEM_TIMELINE.md` and the relevant `RESOLUTION.md` files before modifying business logic to prevent regressions and preserve established invariants.
9. **Hybrid Model Allocation Strategy (Chiến lược phân bổ Model AI tối ưu theo vòng đời feedback)**:
   - **Phase 1: Phân tích Feedback, Multimodal OCR & Lập Kế hoạch (Planning & Discovery)**:
     - *Model đề xuất*: **Gemini 2.5 Pro / Gemini 3.8 Pro**.
     - *Nhiệm vụ*: Cửa sổ ngữ cảnh khổng lồ (1M–2M tokens) nuốt trọn context dự án và tài liệu specs; khả năng native multimodal đọc ảnh chụp màn hình lỗi giao diện trong folder feedback; bóc tách RCA và sinh `TODO.md` chi tiết kèm kịch bản E2E & ma trận Edge Cases.
   - **Phase 2: Triển khai Code & Refactoring (Execution & Coding)**:
     - *Model chính (Primary)*: **Claude 3.5 Sonnet / Claude 3.7 Sonnet** — Đạt first-pass rate cao nhất cho TypeScript, NestJS 11 và Next.js 15 App Router; tuân thủ nghiêm ngặt Compact Density (`p-1`, `p-2`, cấm `p-4`), sửa code chuẩn xác từng chunk và không gây lỗi hồi quy logic.
     - *Dự phòng hết token (Fallback / Quota Exhaustion)*: Chuyển sang **Gemini 2.5 Pro / Gemini 3.8 Pro** (bắt buộc chạy `ui-spacing-guard` kiểm tra regex class cấm và `npx tsc --noEmit` trước khi merge). Với các hotfix nhỏ, thêm field entity hoặc sửa 1-2 hàm đơn giản, có thể dùng **Gemini 2.5 Flash / 3.8 Flash (Thinking)** để tiết kiệm quota.
     - *Giao thức tiết kiệm token cho Claude*: Claude không bao giờ nhận context thô hay log dài; Gemini ở Pha 1 chịu trách nhiệm tóm tắt RCA và blueprint vào `TODO.md`, Claude chỉ nhận chỉ dẫn ngắn và thao tác trực tiếp trên các file đích.
   - **Phase 3: Chạy Test, Cross-Audit & Biên Niên Sử (Verification & Timeline Recording)**:
     - *Model đề xuất*: **Gemini 2.5 Flash / Gemini 3.8 Flash (hoặc Pro)**.
     - *Nhiệm vụ*: Tốc độ cao, độ trễ thấp; giám sát chạy Playwright E2E, chạy AST static analysis với `scripts/e2e-auditor.mjs`, thu thập screenshot evidence, sinh `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md`, phát thông báo Telegram mobile-first.

10. **Database Task ID Filtering Invariant (Loại trừ task_id NULL)**:
    - Khi truy vấn các task cần làm hoặc quét hàng đợi từ database `telegram_tasks` (thông qua lệnh `npm run task:pending` hoặc script `scripts/query-incomplete-tasks.mjs`), `todo-agent` BẮT BUỘC chỉ lọc các dòng có `task_id IS NOT NULL` (`WHERE task_id IS NOT NULL AND status NOT IN ('COMPLETED', 'CANCELLED')`).
    - Các dòng có `task_id IS NULL` (như các lệnh điều khiển bot `/force`, `/force@please_choose_auto_bot`) là trigger thực thi hệ thống, KHÔNG ĐƯỢC tính là task nghiệp vụ và KHÔNG ĐƯỢC sinh thư mục feedback hay checklist `TODO.md` mới.

11. **Zero Cross-Task Image Borrowing & Strict Image Provenance Invariant (Quy chuẩn Tuyệt đối Không Mượn Ảnh và Bắt buộc Đối soát Nguồn gốc Hình ảnh)**:
    - **Cấm mượn ảnh**: Tuyệt đối không sao chép hoặc liên kết bất kỳ file ảnh nào (`screenshot_*.jpg`, `screenshot_*.png`) từ các thư mục feedback khác (`feedbacks/feedback_*`). Việc mượn ảnh cũ sẽ làm sai lệch mã chuyến xe, Hub và nghiệp vụ thực tế, dẫn tới nghiệm thu rác và bị coi là Critical Failure.
    - **Nguồn gốc duy nhất**: Mọi ảnh trong thư mục feedback phải được tải trực tiếp từ Telegram API theo đúng `image_file_ids` của chính task đó. Nếu task không có ảnh đính kèm, thư mục task tuyệt đối không được có file ảnh giao diện trước khi code.
    - **Cổng đối soát OCR (OCR & Context Parity Gate)**: Khi đọc ảnh, agent bắt buộc đối chiếu mã chuyến xe, Hub và khu vực khoanh đỏ với nội dung yêu cầu của user trong prompt. Nếu phát hiện mâu thuẫn hoặc ảnh không liên quan, dừng lại và báo lỗi `IMAGE_CONTEXT_MISMATCH`. Tham chiếu [`.agents/rules/image-provenance-guard.md`](file:///d:/Projects/logistics-website/.agents/rules/image-provenance-guard.md).

---

## 3. Feedback Directory Structure & Scanner Engine

Feedback folders are centrally organized inside the `feedbacks/` parent directory following the naming standard `feedbacks/feedback_DD_MM*` (e.g., `feedbacks/feedback_13_10`, `feedbacks/feedback_13_10_task_1`). Legacy folders located directly in the workspace root (`feedback_DD_MM*`) remain fully supported by the scanner engine for backward compatibility.

### Standard Directory Contents

```text
feedbacks/feedback_DD_MM[suffix]/ (or legacy root feedback_DD_MM[suffix]/)
├── TODO.md                         # Primary task checklist, context, and RCA
├── RESOLUTION.md                   # Post-execution technical acceptance certificate
├── screenshot_01.png / .jpg        # Visual evidence and error captures
├── [spec_file].md                  # Specialized logic, flow, or calculation specs
├── mock_data_[name].json           # Sample payloads or test data
└── test-evidence/                  # Verification screenshots and test traces
```

### Automated Scanner & Documentation CLI Tool

The workspace includes a built-in CLI engine at [`scripts/todo-agent.mjs`](file:///d:/Projects/logistics-website/scripts/todo-agent.mjs):

```bash
# 1. Scan and view matrix of all feedback folders and completion rates
npm run todo:scan
# or: node scripts/todo-agent.mjs scan

# 2. Inspect a specific feedback folder, pending tasks, and resolved file paths
npm run todo:inspect feedback_07_10_task_12
# or: node scripts/todo-agent.mjs inspect feedback_07_10_task_12

# 3. Generate a complete Execution Blueprint & /goal for Antigravity
npm run todo:plan feedback_07_10_task_12
# or: node scripts/todo-agent.mjs plan feedback_07_10_task_12

# 4. Check off or toggle a task inside TODO.md
node scripts/todo-agent.mjs toggle feedback_07_10_task_12 109 done

# 5. Record Technical Resolution Document & Sync into docs/SYSTEM_TIMELINE.md
npm run todo:record feedback_07_10_task_12
# or: node scripts/todo-agent.mjs record feedback_07_10_task_12

# 6. View the Chronological Evolutionary Timeline of all system milestones
npm run todo:timeline
# or: node scripts/todo-agent.mjs timeline

# 7. Scan pending incomplete operational tasks from queue (strictly excludes task_id IS NULL / /force commands)
npm run task:pending
# or: node scripts/query-incomplete-tasks.mjs
```

---

## 4. Operational Comprehension Protocol ("Hiểu") — *Tối ưu với Gemini Pro (Multimodal & Long-Context)*

When given a feedback directory, the `todo-agent` executes a 4-step comprehension audit before touching any code:

```mermaid
flowchart TD
    A["1. Quét Thư mục Feedback<br>(TODO.md, Screenshots, Specs)"] --> B["2. Đối chiếu Ngữ cảnh Nghiệp vụ<br>(Thủ kho, Điều phối, Tài xế)"]
    B --> C["3. Truy vết Mã nguồn Thực tế<br>(File path indexing & AST scan)"]
    C --> D["4. Phân tích Nguyên nhân Gốc rễ<br>(Root Cause Analysis - RCA)"]
    D --> E["5. Lập Kế hoạch Thực thi Nguyên tử<br>(Execution Blueprint)"]
```

### Step 4.1: Parse the Operational Context (`Bối cảnh nghiệp vụ thực tế`)
- Extract user quotes and pain points directly from the `TODO.md` header and body.
- Identify the operator persona: `Thủ kho (Warehouse Manager)`, `Điều phối viên (Dispatcher)`, `Quản lý đội xe (Fleet Manager)`, or `QA / Verification`.
- Distinguish between core operational concepts (e.g., Inbound receiving vs Outbound dispatching, direct customer delivery vs hub-to-hub transfer, roadside intake vs hub loading).

### Step 4.2: Inspect Visual Evidence & Specs (Multimodal OCR & Hub Extraction Protocol)
- **Deep Multimodal OCR Scanning**: Examine all attached screenshots (`.png`, `.jpg`, `.webp`) in the feedback folder:
  - **1. Trích xuất Hub / Kho bãi thực tế**: Đọc kỹ phần tiêu đề trang, breadcrumb, hoặc dropdown bộ lọc Hub (ví dụ: `Nhập kho • Andromeda Hub - HCM`, `Xuất kho • Polaris Hub - Hưng Yên`, `Kho • Magellan Hub - Đà Nẵng`).
  - **2. Khớp trực tiếp tài khoản kiểm thử tương ứng từ [`frontend/e2e/helpers/auth.ts`](file:///frontend/e2e/helpers/auth.ts)**:
    * `Andromeda Hub - HCM` ➔ Bắt buộc dùng `USER_WAREHOUSE_HCM` (username: `warehouse_hcm`).
    * `Polaris Hub - Hưng Yên` ➔ Dùng `USER_WAREHOUSE_HYN` (username: `warehouse_hyn`) hoặc `USER_DISPATCHER` (`dispatcher`).
    * `Magellan Hub - Đà Nẵng` ➔ Dùng `USER_WAREHOUSE_DAD` (username: `warehouse_dad`) hoặc `USER_FLEET` (`fleet`).
    * System-wide / Super Admin ➔ Dùng `USER_ADMIN` (`admin`).
    * ⚠️ **NGHIÊM CẤM TUYỆT ĐỐI**: Không bao giờ được dùng `admin` hoặc `TEST_USERS[0]` một cách mặc định cho các màn hình có phân quyền Hub Scoping, vì sẽ dẫn tới lỗi hiển thị bảng trống (0 dòng).
  - **3. Trích xuất đối tượng kiểm chứng mẫu**: Đọc mã chuyến xe (`SD49`, `SD45`), biển số xe (`51D-482.91`), mã đơn hàng hoặc vùng khoanh đỏ trong ảnh để làm anchor cho assertion trong Playwright.
- Read auxiliary spec files (`FIX_SPEC_*.md`, `LOGIC_*.md`) to understand mathematical formulas (e.g., CBM/Weight summation, stock ratios, multi-truck Master-Detail grouping).

### Step 4.3: Trace Affected Files & Architecture
- Run `node scripts/todo-agent.mjs inspect <folder>` to verify referenced file paths against the workspace index.
- Inspect current file content to detect if the feature was partially implemented, outdated, or broken.

### Step 4.4: Root Cause Analysis (RCA)
- Identify why the bug or shortcoming exists:
  - Is it a backend DTO validation failure?
  - Is it a database schema missing field / foreign key?
  - Is it an N+1 query or aggregation bottleneck?
  - Is it a frontend state desynchronization or oversized spacing?

---

## 5. Formulating Execution Measures ("Đưa ra biện pháp thực thi")

Once the problem is understood, the `todo-agent` generates a structured **Execution Blueprint**:

### 1. Submodule Impact & Branch Assessment
- Score impact using the `feature-branch-advisor` table.
- Propose feature/fix branch: `fix/<feedback-folder-slug>` (e.g., `fix/feedback-07-10-task-12`).
- Identify target submodules: `[BACKEND]`, `[FRONTEND]`, or `[FULLSTACK]`.

### 2. Scope & File Boundaries
- **Allowed Paths**: Explicit list of files permitted to be created or modified (e.g., `backend/src/orders/operational-ledger.service.ts`, `frontend/src/features/warehouse/components/warehouse-select-stored-orders-modal.tsx`).
- **Forbidden Paths**: Sensitive files that must remain untouched (e.g., `backend/src/modules/auth/**`, `frontend/src/middleware.ts`, global DB schema without approval).

### 3. Concrete Solution Architecture
- **Database / Entities**: Propose additive, safe TypeORM migrations if new columns are needed.
- **Backend (NestJS 11+)**:
  - Update DTOs with `class-validator` rules.
  - Implement business logic in Services and Controllers.
  - Enforce RBAC roles using `@Roles()` and `JwtAuthGuard`.
- **Frontend (Next.js 15 App Router & React 19)**:
  - Enforce Compact Density (`p-1`, `p-2`, `gap-1.5`, `h-8` inputs, `text-[10px]` table font).
  - Implement optimistic cache updates via TanStack Query v5 (`useMutation`, `onMutate`, `onError`, `onSettled`).
  - Eliminate redundant icons and sanitize user error messages (`formatApiError()`).

### 4. Definition of Done (DoD) & Verification Checklist
- [ ] Backend compile & lint pass: `npm run lint --prefix backend` & `npm run build --prefix backend`.
- [ ] Frontend compile & lint pass: `npx --prefix frontend tsc --noEmit` & `npm run build --prefix frontend`.
- [ ] Automated regression tests (Playwright E2E suite or API test).
- [ ] Check off all tasks (`- [x]`) in `feedback_DD_MM*/TODO.md`.

### 5. 🧪 Mandatory E2E Test Specification & Edge Cases Matrix Protocol (Quy Chuẩn Bắt Buộc Lập Kịch Bản E2E & Ma Trận Edge Cases)

> ⚠️ **BẮT BUỘC CHO MỌI FEEDBACK TASK**: Một kế hoạch thực thi (`Execution Blueprint`) hoặc tài liệu `TODO.md` chỉ được coi là hợp lệ khi có **Kịch bản kiểm thử E2E chuẩn xác** và **Ma trận Edge Cases toàn diện**. Cả AI lập trình viên lẫn người quản lý vận hành (Human Operator) phải nhìn vào là hiểu ngay:
> 1. *Sau khi sửa code xong, kịch bản chuẩn xác từng bước để test lại trên giao diện là gì?*
> 2. *Có những tình huống biên (Edge cases) nào cần phải kiểm tra để chống hồi quy (regression)?*

Mọi `TODO.md` và Execution Plan bắt buộc phải có mục:
`## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)`
Bao gồm đầy đủ 3 cấu phần cốt lõi:

#### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản & Phân quyền**: Bắt buộc chỉ định rõ `username` cụ thể từ [`frontend/e2e/helpers/auth.ts`](file:///frontend/e2e/helpers/auth.ts) tương ứng với Hub bóc tách từ ảnh chụp màn hình (ví dụ: `USER_WAREHOUSE_HCM` / `warehouse_hcm` cho Andromeda Hub - HCM, `USER_WAREHOUSE_HYN` / `warehouse_hyn` cho Polaris Hub - Hưng Yên, `USER_WAREHOUSE_DAD` / `warehouse_dad` cho Magellan Hub - Đà Nẵng, `USER_DISPATCHER` cho Điều phối, `USER_FLEET` cho Quản lý đội xe, `USER_ADMIN` cho Super Admin).
- **Tiền điều kiện dữ liệu (Pre-conditions)**: Dữ liệu DB cần có sẵn trước khi test (Mã chuyến xe nào, đang đỗ tại Hub nào, có bao nhiêu đơn hàng lưu kho khả dụng, mã đơn mẫu là gì).
- **Quy tắc ảnh nghiệm thu không được chụp bảng trống (Non-Empty Visual Evidence Gate)**: Khi kiểm thử tính năng cấp dòng (nút thao tác, badge, trạng thái hàng), test case BẮT BUỘC assert có ít nhất 1 dòng dữ liệu (`expect(targetCount).toBeGreaterThan(0)`). TUYỆT ĐỐI KHÔNG dùng cấu trúc fallback `if (count > 0) ... else { chụp bảng trống }` vì đây là hành vi che giấu sai lệch tài khoản và sinh bằng chứng giả (Fake Evidence).
- **Các bước tương tác UI & Assertion chi tiết**:
  - Bước 1: Đăng nhập bằng tài khoản Hub cụ thể (`loginAs(page, USER_WAREHOUSE_HCM)`) và mở đúng URL màn hình.
  - Bước 2: Thao tác click mở modal / dialog tương ứng.
  - Bước 3: Intercept API call (kiểm tra status `200/201`, query params, request payload, response data).
  - Bước 4: Kiểm tra trực quan UI (độ rộng Modal theo 5-Level Taxonomy, số lượng đếm $X/Y$, dropdown filters, cột bảng kê).
  - Bước 5: Thao tác form / chọn dòng bảng và kiểm tra reactive metric counters (0ms).
  - Bước 6: Submit hành động, assert toast thông báo tiếng Việt, assert modal tự đóng.
  - Bước 7: Hậu kiểm (Post-conditions): Bảng kê cập nhật, DB đổi status, sổ cái phát sinh giao dịch, mở lại modal thấy dữ liệu đã được loại trừ (Idempotency).
  - Bước 8: Chụp ảnh bằng chứng nghiệm thu thực tế với đầy đủ các phần tử đích được highlight (lưu vào `feedbacks/feedback_DD_MM*/screenshot_*_verified.png`).

#### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)
Tối thiểu từ **5 đến 10 tình huống biên**, lập bảng chuẩn 5 cột:
| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Zero-state (Kho rỗng / Dữ liệu rỗng)** | Khi kho/chuyến xe không có dữ liệu nào. | Hiển thị Empty State thân thiện, không crash React, nút submit disabled. | `expect(page.locator('text=...')).toBeVisible()` |
| `EC-02` | **Data Boundary (Tồn kho = 0 / Hết hạn)** | Kiện hàng = 0, đơn đã xuất hết, đơn hủy/giao xong. | Bị loại trừ triệt để khỏi API và bảng UI, không cho phép bốc tiếp. | API response array không chứa item đó. |
| `EC-03` | **Hub / Role Isolation (Cách ly dữ liệu)** | Đơn của kho A xem bởi thủ kho B. | Không bao giờ lọt dữ liệu chéo giữa các kho/chi nhánh. | Chỉ hiển thị dữ liệu thuộc `currentHubId`. |
| `EC-04` | **Trip Idempotency (Trùng chuyến xe)** | Đơn đã bốc lên xe trước đó. | Không hiển thị lại để tránh gán trùng chuyến (duplicate assignment). | `order.currentTripCode !== tripCode`. |
| `EC-05` | **Missing Optional Fields** | Đơn thiếu trạm nhận / chưa có ghi chú. | Giao diện vẫn render bình thường với nhãn fallback (`Chưa gán`, `Giao dọc đường`), không lỗi trắng trang. | Table row renders with fallback badge. |
| `EC-06` | **Client-side Filters & Search** | Lọc dropdown trạm dỡ, gõ tìm kiếm keyword. | Danh sách lọc realtime mượt mà, xóa filter quay về 100% dữ liệu gốc. | Table count matches filter selection. |
| `EC-07` | **Partial Actions (Thao tác một phần)** | Xuất một phần số kiện, chia tải xe. | Cập nhật số dư tồn còn lại chính xác, các chuyến sau chỉ thấy số dư này. | `remainingQuantity` giảm trừ đúng số lượng. |
| `EC-08` | **Super Admin Bypass vs Scoped WM** | Super Admin (`hubId = null`) thao tác. | Kế thừa đúng ngữ cảnh kho của chuyến xe đang đỗ (`manifest.currentHubId`). | URL query param chứa đúng `hubId`. |
| `EC-09` | **Concurrency & Conflict (Xung đột đồng thời)** | Đơn vừa bị user khác xuất đi ngay trước khi click. | Backend báo lỗi rõ ràng, frontend toast cảnh báo và reload dữ liệu. | Error toast localized, no silent failure. |
| `EC-10` | **Re-open Modal Idempotency** | Đóng modal rồi mở lại ngay sau khi xuất. | Các đơn vừa xuất biến mất khỏi modal, không cần F5 trình duyệt. | TanStack Query cache invalidation auto-refresh. |

#### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- Chỉ định rõ file test: `frontend/e2e/<spec_file_name>.spec.ts`.
- Lệnh chạy kiểm thử: `PLAYWRIGHT_BASE_URL=... API_URL=... npx playwright test e2e/<spec_file_name>.spec.ts`.
- Tiêu chí Gate: 100% test cases pass, score auditor ≥ 40/50 qua `node scripts/e2e-auditor.mjs`.

---

## 6. Execution & Implementation Protocol ("Thực thi") — *Quy trình Chuẩn GitHub PR & Kiểm định 2 Tầng*

When instructed to execute or implement a feedback plan, the `todo-agent` MUST strictly follow this standard pipeline conforming to [`.agents/rules/github-task-workflow.md`](file:///d:/Projects/logistics-website/.agents/rules/github-task-workflow.md):

```mermaid
flowchart TD
    S1["1. Tạo Nhánh từ Dev<br>(feature/task-ID-* trong Submodule)"] --> S2["2. Code & Local Build<br>(tsc --noEmit, npm run build)"]
    S2 --> S3["3. Nghiệm thu Tầng 1: Local E2E<br>(Localhost Playwright Test)"]
    S3 -- "Fail" --> S3R["Local Self-Healing Auto-Fix<br>(Tối đa 3 lần retry tại chỗ)"]
    S3R --> S3
    S3 -- "Pass 100%" --> SAUD["3.5. Chốt chặn /e2e-code-auditor<br>(node scripts/e2e-auditor.mjs >= 40/50)"]
    SAUD -- "FAIL / Shallow Test" --> S3
    SAUD -- "PASS" --> S4["4. Push & Tạo PR vào Dev<br>(Bằng chứng Audit Evidence trên GitHub)"]
    S4 --> S5["5. Tự động Merge PR vào Dev<br>(gh pr merge --merge)"]
    S5 --> S6["6. Chờ Cloud Dev Deploy<br>(Railway Health Check HTTP 200)"]
    S6 --> S7["7. Nghiệm thu Tầng 2: Cloud Dev E2E<br>(Playwright Live trên Domain Dev)"]
    S7 --> S8["8. Thẩm định chéo E2E Lần 2 & Chứng minh<br>(Bảng điểm 50đ đính kèm RESOLUTION.md)"]
    S8 --> S9["9. Ghi nhận Biên bản & Timeline<br>(npm run todo:record <folder>)"]
    S9 --> S10["10. Báo cáo Telegram Mobile-First<br>(Kèm link PR GitHub & ảnh nghiệm thu)"]
```

1. **Workspace Health & Feature Branch Creation (Bắt buộc từ `dev`)**:
   - Chạy lệnh kiểm tra: `npm run repo:status` và `npm run repo:tracking`.
   - Chuyển về `dev` và pull code mới nhất trong submodule tương ứng:
     `git -C backend checkout dev && git -C backend pull origin dev`
     `git -C frontend checkout dev && git -C frontend pull origin dev`
   - Tạo nhánh tính năng/sửa lỗi gắn với `task_id`:
     `git -C backend checkout -b feature/task-<id>-<name>`
     `git -C frontend checkout -b feature/task-<id>-<name>`
2. **Submodule-First Code Modifications**:
   - Triển khai code theo checklist `TODO.md` (tuân thủ Compact Density `p-1`, `p-2`, cấm `p-4`, 0 mock data, 0 jargon kỹ thuật).
   - Kiểm tra biên dịch tĩnh: `npm run build --prefix backend` và `npx --prefix frontend tsc --noEmit`.
3. **Nghiệm Thu Tầng 1: Điều Phối `/e2e-test-runner` (Local E2E Gate) & Chốt Chặn `/e2e-code-auditor`**:
   - **Bàn giao cho `/e2e-test-runner` chạy Round 1**:
     - Kích hoạt Playwright E2E suite trên Local (`http://localhost:4000` & `4001`):
       ```bash
       $env:PLAYWRIGHT_BASE_URL="http://localhost:4000"
       $env:API_URL="http://localhost:4001/api/v1"
       npx --prefix frontend playwright test e2e/<spec_file>.spec.ts
       ```
     - Tự động sửa lỗi cục bộ (Autonomous Local Self-Healing, tối đa 3 lần) cho đến khi 100% PASS.
   - **Thông báo & Bàn giao cho `/e2e-code-auditor` (Thẩm định chéo mã test)**:
     - Kích hoạt auditor chạy ngay: `node scripts/e2e-auditor.mjs frontend/e2e/<spec_file>.spec.ts`.
     - Điểm đánh giá bắt buộc $\ge 40/50$, **0 lỗi Auto-FAIL**.
     - **Nghiêm cấm Shallow Tests**: Tuyệt đối không cho phép test đọc chuỗi file tĩnh (`fs.readFileSync`), look-only tests (chỉ mở URL mà không click/fill), hoặc rẽ nhánh nuốt lỗi `if (isVisible) ... else { screenshot }`.
     - **ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC**: 100% test local phải PASS VÀ `/e2e-code-auditor` phải duyệt PASS ($\ge 40/50$). Nếu không đạt chuẩn, **CẤM PUSH CODE LÊN REMOTE, CẤM TẠO PR**.
4. **Đẩy Nhánh, Tạo PR vào `dev` Làm Bằng Chứng & Tự Động Merge**:
   - Commit code trong submodule (`git -C <submodule> commit -am "feat(task-<id>): ..."`).
   - Push nhánh lên remote: `git -C <submodule> push -u origin feature/task-<id>-<name>`.
   - Tạo PR vào `dev` trên GitHub làm bằng chứng kiểm toán (Audit Evidence) kèm điểm số Auditor:
     `gh pr create --repo <submodule_repo> --base dev --head feature/task-<id>-<name> --title "feat(task-<id>): ..." --body "## Task #<id>`n`n- Checklist: feedbacks/.../TODO.md`n- Local E2E: PASS 100%`n- E2E Auditor Score: PASS (>= 40/50)`n- Target: dev"`
   - Tự động merge PR vào `dev`:
     `gh pr merge --repo <submodule_repo> feature/task-<id>-<name> --merge --delete-branch`
     *(Hoặc thực hiện merge git an toàn và đẩy lên origin/dev nếu CLI chưa login)*.
5. **Chờ Deploy Lên Môi Trường Dev (Railway Cloud)**:
   - Chờ Railway Cloud hoàn tất build & deploy trên nhánh `dev`.
   - Kiểm tra Dev Backend readiness (anti-hang timeout):
     `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health`
6. **Nghiệm Thu Tầng 2: Điều Phối `/e2e-test-runner` (Cloud Dev E2E Gate - Lần Thứ Hai)**:
   - **Bàn giao cho `/e2e-test-runner` chạy Round 2**:
     - Kích hoạt Playwright E2E trực tiếp trên Domain Dev của Railway Cloud:
       ```bash
       $env:PLAYWRIGHT_BASE_URL="https://frontend-tms-core-dev.up.railway.app"
       $env:API_URL="https://backend-tms-core-dev.up.railway.app/api/v1"
       npx --prefix frontend playwright test e2e/<spec_file>.spec.ts
       ```
     - Chụp ảnh màn hình bằng chứng thực tế (`screenshot_*_verified.png`) với bảng dữ liệu thật (nghiêm cấm chụp bảng rỗng).
7. **Thẩm Định Chéo Lần 2 & Chứng Nhận Chất Lượng — `/e2e-code-auditor`**:
   - `/e2e-code-auditor` thẩm định kết quả chạy thực tế và ảnh chụp màn hình minh chứng.
   - Chạy auditor: `node scripts/e2e-auditor.mjs frontend/e2e/<spec_file>.spec.ts` (điểm $\ge$ 40/50).
   - Đính kèm bảng điểm chi tiết 5 chiều vào biên bản `RESOLUTION.md`.
8. **Checklist & Ghi Nhận Biên Niên Sử Kỹ Thuật**:
   - Chỉ được đồng bộ checklist `TODO.md` thành `- [x]` khi cả 2 tầng E2E và auditor đều PASS.
   - Chạy `npm run todo:record <folder_name>` để sinh `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md`.
9. **Báo Cáo Nghiệm Thu Mobile-First Qua Telegram**:
   - Gửi ảnh bằng chứng qua Telegram `sendPhoto`.
   - Gửi báo cáo hoàn thành chứa link PR GitHub, kết quả 2 tầng E2E test (Round 1 Local + Round 2 Cloud Dev), link `RESOLUTION.md` và `docs/SYSTEM_TIMELINE.md`.

---

## 7. Post-Execution Technical Documentation & Evolutionary Timeline Protocol ("Biên Niên Sử Kỹ Thuật & Bằng Chứng Hệ Thống")

### Why Technical Recording is Mandatory for AI Agent Session Continuity

In modern agentic software development, AI agents in new sessions enter with **stateless working memory**. Without an authoritative, centralized evolutionary ledger:
1. **Regressions Occur**: A new agent might undo a crucial bug fix or violate an operational invariant (e.g. allowing `hubStock = 0` to show in `LƯU KHO` tab) because it does not understand why the logic was written.
2. **Loss of Context**: Critical architectural choices (Hub scoping SQL, 1:1 counter parity, roadside pickup transfer transactions) become obscured in Git commit diffs.
3. **Lack of Evidence**: Stakeholders and subsequent agents have no quick reference proving that the feature was tested, verified on real DB data, and certified against regression.

To solve this permanently, `todo-agent` establishes a **2-Tier Documentation Architecture**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: ATOMIC LOCAL RESOLUTION CERTIFICATE                                           │
│ Path: feedback_DD_MM*/RESOLUTION.md                                                    │
│ Purpose: Deep technical post-mortem, exact RCA, complete list of impacted source files,│
│          embedded screenshot evidence, and immutable business rules established.       │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Synchronized automatically via
                                         │ npm run todo:record <folder>
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: CENTRALIZED SYSTEM EVOLUTIONARY TIMELINE & ARCHITECTURE LEDGER                 │
│ Path: docs/SYSTEM_TIMELINE.md                                                          │
│ Purpose: Reverse-chronological ledger of the entire TMS platform's growth. Shows all   │
│          milestones, dates, newly born capabilities, and quick links to certificates.  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The 6 Mandatory Sections of `RESOLUTION.md`

Every generated `RESOLUTION.md` MUST contain these 6 sections:
1. **📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)**: Exact user quote, operational scenario diagram, and detailed technical RCA explaining why the issue existed in code.
2. **🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung**: Grouped by Backend (NestJS), Frontend (Next.js App Router), Database (TypeORM/PostgreSQL), and Automated Testing.
3. **🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)**: Numbered immutable rules (e.g. `hubStock == 0` never shows in `LƯU KHO`, Hub Scoping isolation, UI compact density).
4. **🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)**: Test pass rate, Dev Live health check status, and embedded visual screenshot evidence (`.png`, `.jpg`).
5. **📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)**: Structured table listing all modified/created files mapped to their subsystem.
6. **🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo**: Clear cautionary guidance for future AI sessions forbidding regression of established rules.

### How Fresh AI Agent Sessions Leverage System Timeline as Ground Truth

Whenever an AI agent begins a new session or investigates existing business logic:
1. **Check System Timeline First**: Inspect [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md) to review recent milestones and discover what features are already live.
2. **Inspect Specific Resolutions**: If working on a specific module (e.g. warehouse inbound, roadside order appending, stock isolation), open the corresponding `feedback_DD_MM*/RESOLUTION.md` to study the RCA and invariants.
3. **Respect Invariants**: Treat the established invariants as non-negotiable rules. Never revert code without explicit user instruction.

---

## 8. Operational Reporting Protocol ("Thông báo đã test dev xong")

When reporting results to the user via Telegram Bot, the message MUST lead with the clear confirmation **"ĐÃ TEST DEV XONG"** and include E2E metrics, Dev links, and technical documentation links:

```markdown
🟢 THÔNG BÁO: ĐÃ TEST DEV XONG (E2E & ĐÁNH GIÁ CHÉO PASS)

📋 Hạng mục triển khai: [Tiêu đề Feedback / Hạng mục công việc]
• Thư mục mục tiêu: feedback_DD_MM*
• Trạng thái Checklist: 100% công việc đã hoàn thành [x]

🌐 Môi trường kiểm thử (Domain Dev):
• Frontend Dev: https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app
• Backend Dev: https://logistics-website-backend-1jho.onrender.com

🧪 Kết quả Kiểm thử E2E & Đánh giá chéo:
• Playwright E2E Suite: PASS (100% passed, 0 failed)
• E2E Cross-Evaluation Audit: PASS (46/50 điểm — Tuân thủ Real DB, Không mock, Chụp ảnh minh chứng)
• Backend Build & Health: OK (HTTP 200)
• Frontend Turbopack Build: OK (0 errors)

📜 Hồ sơ Nghiệm thu & Biên niên sử Hệ thống:
• Biên bản kỹ thuật: feedback_DD_MM*/RESOLUTION.md
• Biên niên sử phát triển: docs/SYSTEM_TIMELINE.md

🛠️ Các tệp tin đã cập nhật:
• [Backend]: backend/src/...
• [Frontend]: frontend/src/...
• [Tài liệu]: feedback_DD_MM*/TODO.md [x]
```
