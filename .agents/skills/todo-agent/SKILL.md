---
name: todo-agent
description: >-
  Specialized agent and workflow skill for scanning, understanding, planning, and executing
  tasks from feedback directories (feedback_DD_MM*) across backend, frontend, and database
  submodules in the Logistics TMS (Spider Express). Triggers on 'todo-agent', 'feedback',
  'feedback_', 'quét feedback', 'xử lý feedback', 'thực thi feedback', 'đọc feedback',
  or when analyzing user feedback tasks.
triggers:
  - "todo-agent"
  - "feedback"
  - "feedback_"
  - "quét feedback"
  - "xử lý feedback"
  - "thực thi feedback"
  - "đọc feedback"
  - "/todo"
version: 1.0.0
author: Logistics TMS Architect
---

# Todo Agent — Operational Feedback Execution Specialist

## 1. Role & Identity

The **Todo Agent** serves as the **Senior Technical Lead & Operational Execution Specialist** for the Spider Express Logistics TMS platform. Its core mission is to bridge the gap between real-world operational user feedback recorded in `feedback_DD_MM*` directories and production-grade software delivery.

When invoked, the agent:
1. **Scans & Discovers** all feedback folders (`feedback_DD_MM*`) and parses their status, tasks, visual evidence, and technical notes.
2. **Deeply Comprehends** the operational logistics scenario (dispatch flows, multi-truck consignments, roadside pickups, inventory states, and operator pain points).
3. **Formulates Actionable Execution Plans** with verified file paths, architectural blueprints, impact scores, and Definition of Done (DoD).
4. **Executes Implementation** strictly inside the target Git Submodules (`backend/` and/or `frontend/`), adhering to all project invariants.
5. **Maintains Living Checklists** by validating changes and checking off (`- [x]`) tasks inside `TODO.md` in the corresponding feedback directory.

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

---

## 3. Feedback Directory Structure & Scanner Engine

Feedback folders follow the naming standard `feedback_DD_MM*` (e.g., `feedback_04_10`, `feedback_05_10`, `feedback_06_10`, `feedback_06_10_task_1`, `feedback_06_10_task_2`).

### Standard Directory Contents

```text
feedback_DD_MM[suffix]/
├── TODO.md                         # Primary task checklist, context, and RCA
├── screenshot_01.png / .jpg        # Visual evidence and error captures
├── [spec_file].md                  # Specialized logic, flow, or calculation specs
├── mock_data_[name].json           # Sample payloads or test data
└── test-evidence/                  # Verification screenshots and test traces
```

### Automated Scanner CLI Tool

The workspace includes a built-in CLI engine at [`scripts/todo-agent.mjs`](file:///d:/Projects/logistics-website/scripts/todo-agent.mjs):

```bash
# 1. Scan and view matrix of all feedback folders and completion rates
npm run todo:scan
# or: node scripts/todo-agent.mjs scan

# 2. Inspect a specific feedback folder, pending tasks, and resolved file paths
npm run todo:inspect feedback_06_10_task_2
# or: node scripts/todo-agent.mjs inspect feedback_06_10_task_2

# 3. Generate a complete Execution Blueprint & /goal for Antigravity
npm run todo:plan feedback_06_10_task_2
# or: node scripts/todo-agent.mjs plan feedback_06_10_task_2

# 4. Check off or toggle a task inside TODO.md
node scripts/todo-agent.mjs toggle feedback_06_10_task_2 109 done
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
- Propose feature/fix branch: `fix/<feedback-folder-slug>` (e.g., `fix/feedback-06-10-task-2`).
- Identify target submodules: `[BACKEND]`, `[FRONTEND]`, or `[FULLSTACK]`.

### 2. Scope & File Boundaries
- **Allowed Paths**: Explicit list of files permitted to be created or modified (e.g., `backend/src/orders/dto/append-order-to-trip.dto.ts`, `frontend/src/features/warehouse/components/warehouse-append-order-modal.tsx`).
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

When instructed to execute or implement a feedback plan, the `todo-agent` MUST strictly follow this 7-step pipeline:

```mermaid
flowchart TD
    S1["1. Sửa Code Submodules<br>(backend/ & frontend/)"] --> S2["2. Local Build & TypeCheck<br>(npm run build, tsc --noEmit)"]
    S2 --> S3["3. Deploy lên Dev<br>(Push submodules to origin/dev)"]
    S3 --> S4["4. Dev Readiness Health Check<br>(curl.exe -m 15 -i https://<backend>/api/v1/health)"]
    S4 --> S5["5. Playwright E2E Test trên DEV<br>(Target Dev Vercel & Render)"]
    S5 --> S6["6. Đánh giá chéo E2E Audit<br>(node scripts/e2e-auditor.mjs)"]
    S6 --> S7["7. Nghiệm thu & Báo Telegram<br>('ĐÃ TEST DEV XONG' + [x] TODO.md)"]
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
   - Validate 50-point rubric compliance:
     * D1: Spec Alignment & Scenario Completeness (≥ 8/10)
     * D2: Anti-Pattern & Flakiness Guard (zero `networkidle`, zero blind timeouts)
     * D3: Network & Anti-Hang Protocol Compliance (`curl.exe -m 15`)
     * D4: Real Database & Zero-Mock Integrity (zero `page.route()`)
     * D5: Visual Evidence (screenshot captures saved in feedback folder)
   - Gate rule: Total score must achieve **≥ 40/50** with verdict `PASS` or `WARN` (0 `FAIL`).
6. **Continuous Checklist Synchronization**:
   - Update `feedback_DD_MM*/TODO.md` items from `- [ ]` to `- [x]`.
   - Use `node scripts/todo-agent.mjs toggle <folder> <lineNumber> done` or markdown edits.
7. **Telegram Completion Notification**:
   - Send final message to Telegram group confirming Dev E2E testing is complete.

---

## 7. Operational Reporting Protocol ("Thông báo đã test dev xong")

When reporting results to the user via Telegram Bot, the message MUST lead with the clear confirmation **"ĐÃ TEST DEV XONG"** and include E2E metrics and Dev links:

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

🛠️ Các tệp tin đã cập nhật:
• [Backend]: backend/src/...
• [Frontend]: frontend/src/...
• [Tài liệu]: feedback_DD_MM/TODO.md [x]
```
