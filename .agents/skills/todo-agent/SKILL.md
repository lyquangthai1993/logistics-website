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

When instructed to execute or implement a feedback plan:

1. **Workspace Health & Branch Setup**:
   - Check repo status: `npm run repo:status`.
   - Ensure submodules are on `dev` and up to date (`git pull origin dev`).
   - If impact score >= 6, create feature branch in target submodules.
2. **Submodule-First Code Modifications**:
   - Apply backend changes in `backend/` and verify compile immediately: `npm run build --prefix backend`.
   - Apply frontend changes in `frontend/` and verify TypeScript compile: `npx --prefix frontend tsc --noEmit`.
3. **Continuous Checklist Synchronization**:
   - As each task item is verified, update the task in the feedback folder's `TODO.md` from `- [ ]` to `- [x]`.
   - Use `node scripts/todo-agent.mjs toggle <folder> <lineNumber> done` or direct markdown edits.
4. **Automated Verification**:
   - Run the relevant Playwright E2E test suite in `frontend/e2e/`.
   - Ensure zero console errors, zero hydration errors, and 100% test pass.
5. **Promotion & Push Protocol**:
   - Commit code inside submodules using Conventional Commits via `git-commit-reviewer`.
   - Push to `origin/dev` only when requested by the user.

---

## 7. Operational Reporting Protocol

When reporting results to the user (especially via Telegram Bot), format the output following [`telegram-task-responder`](file:///d:/Projects/logistics-website/.agents/skills/telegram-task-responder/SKILL.md):

```markdown
🟢 [FEEDBACK RESOLVED] feedback_06_10_task_2 (8/8 tasks completed)

📋 Executive Summary:
Hoàn thiện thành công Trường hợp 3 trong quy trình vận hành xe vào trạm: Phân tách rõ ràng giữa "📍 Lấy hàng dọc đường nhập về Hub" (dỡ hàng tại kho hiện tại) và "🏢 Bốc thêm hàng từ Hub lên xe" (chở đi kho tiếp theo).

🛠️ Codebase Changes:
• [BACKEND] DTO AppendOrderToTripDto: Thêm enum AppendOrderType (ROADSIDE_PICKUP_INBOUND, HUB_TRANSFER_OUTBOUND).
• [BACKEND] WarehouseService: Xử lý gán destinationHubId và originHubId động theo loại bốc hàng.
• [FRONTEND] WarehouseAppendOrderModal: Thiết kế 2 tab nghiệp vụ rõ ràng, ghim cố định kho hiện tại, triệt tiêu lỗi ID 3.
• [FRONTEND] WarehouseTripDetailModal: Giữ duy nhất 1 nút trên toolbar bảng kê, chuẩn Compact Density.

🧪 Verification Results:
• Backend Build: PASS (0 errors)
• Frontend TypeCheck: PASS (0 errors, Next.js Turbopack)
• E2E Flow: Verified roadside pickup intake and hub-to-hub outbound transfer
• Living Checklist: feedback_06_10_task_2/TODO.md updated to 100% [x]
```
