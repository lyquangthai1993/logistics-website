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

---

## 3. Feedback Directory Structure & Scanner Engine

Feedback folders follow the naming standard `feedback_DD_MM*` (e.g., `feedback_04_10`, `feedback_05_10`, `feedback_06_10`, `feedback_07_10`, `feedback_07_10_task_12`).

### Standard Directory Contents

```text
feedback_DD_MM[suffix]/
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
```

---

## 4. Operational Comprehension Protocol ("Hiểu")

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

### Step 4.2: Inspect Visual Evidence & Specs
- Examine any attached images (`.png`, `.jpg`, `.webp`) in the feedback folder.
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

---

## 6. Execution & Implementation Protocol ("Thực thi")

When instructed to execute or implement a feedback plan, the `todo-agent` MUST strictly follow this 8-step pipeline:

```mermaid
flowchart TD
    S1["1. Sửa Code Submodules<br>(backend/ & frontend/)"] --> S2["2. Local Build & TypeCheck<br>(npm run build, tsc --noEmit)"]
    S2 --> S3["3. Deploy lên Dev<br>(Push submodules to origin/dev)"]
    S3 --> S4["4. Dev Readiness Health Check<br>(curl.exe -m 15 -i https://<backend>/api/v1/health)"]
    S4 --> S5["5. Playwright E2E Test trên DEV<br>(Target Dev Vercel & Render)"]
    S5 --> S6["6. Đánh giá chéo E2E Audit<br>(node scripts/e2e-auditor.mjs)"]
    S6 --> S7["7. Ghi nhận Biên bản Kỹ thuật & Đồng bộ Timeline<br>(npm run todo:record <folder>)"]
    S7 --> S8["8. Nghiệm thu & Báo Telegram<br>('ĐÃ TEST DEV XONG' + links RESOLUTION.md & SYSTEM_TIMELINE.md)"]
```

1. **Workspace Health & Branch Setup**:
   - Check repo status: `npm run repo:status`.
   - Ensure submodules are on `dev` and up to date (`git pull origin dev`).
2. **Submodule-First Code Modifications**:
   - Apply backend changes in `backend/` and verify compile immediately: `npm run build --prefix backend`.
   - Apply frontend changes in `frontend/` and verify TypeScript compile: `npx --prefix frontend tsc --noEmit`.
   - Enforce UI Compact Density (`p-1` card padding, `p-2` modal body, `text-[10px]` table font, zero redundant icons).
3. **Deployment to Dev Environment**:
   - Commit changes inside the respective submodules with Conventional Commits (`feat(...)`, `fix(...)`).
   - Push submodules to `origin/dev`: `git -C backend push origin dev && git -C frontend push origin dev`.
   - Wait for Vercel and Render auto-deploy (usually 1-2 minutes).
   - Verify Dev Backend readiness using anti-hang protocol:
     `curl.exe -m 15 -i https://logistics-website-backend-1jho.onrender.com/api/v1/health`
4. **Automated E2E Verification on DEV Domain**:
   - Execute Playwright E2E tests directly against the Dev environment:
     ```bash
     PLAYWRIGHT_BASE_URL=https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app API_URL=https://logistics-website-backend-1jho.onrender.com/api/v1 npx playwright test e2e/<spec_file>.spec.ts
     ```
   - Ensure 100% of test cases pass with zero regressions.
5. **Cross-Evaluation Audit (Đánh giá chéo E2E)**:
   - Run the automated E2E Code Auditor against the test suite:
     ```bash
     node scripts/e2e-auditor.mjs frontend/e2e/<spec_file>.spec.ts
     ```
   - Validate 50-point rubric compliance (≥ 40/50, 0 FAIL).
6. **Continuous Checklist Synchronization**:
   - Update `feedback_DD_MM*/TODO.md` items from `- [ ]` to `- [x]`.
   - Use `node scripts/todo-agent.mjs toggle <folder> <lineNumber> done`.
7. **Post-Execution Technical Documentation & Timeline Ledger Recording**:
   - **MANDATORY MILESTONE**: Execute technical recording to generate `RESOLUTION.md` and synchronize `docs/SYSTEM_TIMELINE.md`:
     ```bash
     npm run todo:record <folder_name>
     # or: node scripts/todo-agent.mjs record <folder_name>
     ```
   - Verify that `<folder_name>/RESOLUTION.md` contains all 6 technical sections and that [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md) reflects the newly completed milestone at the top.
8. **Telegram Completion Notification**:
   - Send final message to Telegram group confirming Dev E2E testing is complete, including direct links to both `RESOLUTION.md` and `docs/SYSTEM_TIMELINE.md`.

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
