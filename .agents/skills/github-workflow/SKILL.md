---
name: github-workflow
description: >-
  Expert GitHub Actions & CI/CD workflow automation engineer for the Spider Express Logistics TMS monorepo.
  Governs the 4-stage GitHub Task Lifecycle (RULE-GIT-TASK-WORKFLOW-01), submodule feature branching (<type>/task-<id>-<module>-<action>),
  PR creation and audit trail, 2-tier quality gates (local E2E -> cloud dev E2E), GitHub Actions pipelines (telegram-agy-worker.yml,
  railway-deploy.yml, daily-rbac-audit.yml), repository_dispatch events, and concurrency governance.
  Triggers on: "github workflow", "github actions", "ci/cd", "pull request", "pr", "branching", "git workflow",
  "gh pr", "workflow_dispatch", "repository_dispatch", "gh actions", "pipeline".
---

# GitHub Workflow & CI/CD Orchestration — Logistics TMS

> **Role**: Master Architect and Governance Specialist for **GitHub Workflows**, CI/CD pipelines, Git submodules branching lifecycles, Pull Request (PR) audit evidence, and automated cloud deployments across the Spider Express Transportation Management System (TMS).
> Authoritative reference for [`RULE-GIT-TASK-WORKFLOW-01`](file:///d:/Projects/logistics-website/.agents/rules/github-task-workflow.md), GitHub Actions workflows in `.github/workflows/`, and lifecycle automation scripts in `scripts/`.

---

## 🏛️ Repository Architecture & Submodule Golden Rules

The Spider Express TMS system consists of **3 independent Git repositories**:

```text
d:\Projects\logistics-website/                 (Root Monorepo: scripts, docs, .agents, feedbacks)
├── backend/                                   (Submodule: logistics-website-backend — NestJS 11)
└── frontend/                                  (Submodule: logistics-website-frontend — Next.js 15)
```

### Mandatory Invariants:
1. **Never Commit Directly to `dev` or `master`**: All development and bugfixes MUST happen on dedicated feature/fix branches.
2. **Submodule Isolation**:
   - Creating a branch or committing at the root does NOT branch or commit inside `backend/` or `frontend/`.
   - Branching, committing, and pushing MUST be executed **directly inside the target submodule** (`backend/` and/or `frontend/`).
   - If a task touches both submodules, create identical branch names in both submodules and commit directly within each.
3. **Submodule-First Push Order**:
   - When pushing changes to remote, ALWAYS push `backend/` and `frontend/` submodules first.
   - Only AFTER submodule commits are safely pushed to remote, commit the updated submodule pointers in the root repository and push root.
4. **Mandatory Base Branch (`dev`)**:
   - All feature and fix branches MUST branch off from `dev` (after running `git checkout dev && git pull origin dev`).
   - NEVER branch directly from `master` (except emergency production hotfix branches: `hotfix/<name>`).

---

## 🔄 The 4-Stage GitHub Task Lifecycle Pipeline

Every task received (from Telegram Bot, user prompts, or feature requests) MUST strictly follow the 4-stage pipeline:

```mermaid
flowchart TD
    A["Stage 1: Intake & Feature Branch<br>Branch from dev in submodules"] --> B["Stage 2: Tier-1 Quality Gate<br>Local E2E Playwright (:4000 & :4001)"]
    B -->|Autonomous Self-Healing up to 3x| C{"Tier-1 PASS?"}
    C -->|Yes| D["Stage 3: GitHub PR & Auto-Merge<br>gh pr create -> Audit Evidence -> gh pr merge"]
    C -->|No| B
    D --> E["Cloud Deployment (Railway)<br>Wait for HTTP 200 Health"]
    E --> F["Stage 4: Tier-2 Quality Gate<br>Cloud Dev E2E Playwright against Railway"]
    F --> G["Visual Evidence Screenshot & RESOLUTION.md<br>Report via Telegram"]
```

---

### Stage 1: Task Intake & Branch Creation
Use the standardized 4-part branch taxonomy:
```text
<type>/task-<id>-<module>-<action>
```

#### Taxonomy Breakdown:
- **`<type>`**: `feat` (new feature), `fix` (bug fix), `refactor` (cleanup/restructure), `perf` (performance).
- **`task-<id>`**: Linked Telegram task identifier (e.g. `task-81`, `task-88`).
- **`<module>`**: TMS domain module:
  - `warehouse`: Storage, inbound/outbound receiving, pallets, tally sheets, A4 print.
  - `trip`: Fleet trip planning, assignment, en-route roadside pickup, rollback.
  - `order`: Consignment freight payloads (Kg, m³, packages), routes, status.
  - `fleet`: Vehicles, internal vs external 3PL capacity, driver profiles.
  - `hub`: Level 1 regional linehaul hubs vs Level 2 feeder stations (xe bo).
  - `auth`: JWT token rotation, roles guards, RBAC matrices, password reset.
  - `report`: Operational ledgers, KPI aggregations, Excel export/import.
  - `core`: Infrastructure, CI/CD, n8n, Railway configuration.
- **`<action>`**: 2–4 lowercase words in kebab-case describing the technical change.

#### Automated Execution:
```bash
# Using helper CLI:
npm run task:branch -- <task_id> <module> <action> [type]
# Example:
node scripts/git-task-workflow.mjs start 89 warehouse outbound-tally feat
```

---

### Stage 2: Tier-1 Quality Gate (Local E2E Verification)
- Run tests on workstation (`http://localhost:4000` & `http://localhost:4001/api/v1`).
- Autonomous self-healing loop: Analyze failure, fix code locally, re-verify (up to 3 retries).
- **Never push failing code to GitHub**. Code must achieve 100% PASS before leaving the local workstation.

---

### Stage 3: GitHub PR Creation, Audit Evidence & Auto-Merge
Once local tests pass, publish the branch and create an immutable audit trail on GitHub:

```bash
# Using helper CLI:
npm run task:pr -- <task_id> <module> <action>
# Example:
node scripts/git-task-workflow.mjs pr 89 warehouse outbound-tally
```

#### Standard PR Checklist Template:
```markdown
## 📋 Task Details
- **Task ID**: `TASK-89`
- **Module**: `warehouse`
- **Description**: Add outbound tally sheet confirmation

## 🛡️ Pre-Merge Verification (Tier-1 Local Gate)
- [x] Compilation: `npm run build` PASS
- [x] Typecheck: `tsc --noEmit` PASS
- [x] Local Playwright E2E: 100% PASS (0 failures)
- [x] Submodule-first push sequence verified

## 🚀 Target Branch
- Base: `dev`
```

#### Auto-Merge Command:
```bash
gh pr create --base dev --title "feat(warehouse): task #89 outbound tally confirmation" --body-file pr_body.md
gh pr merge --merge --auto --delete-branch=false
```

---

### Stage 4: Tier-2 Quality Gate (Cloud Dev Verification)
1. Monitor Railway Cloud Dev deployment until status is READY:
   - Frontend: `https://frontend-tms-core-dev.up.railway.app`
   - Backend: `https://backend-tms-core-dev.up.railway.app`
   - Health check: `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health`
2. Run Playwright E2E suite against Cloud Dev domain:
   ```bash
   PLAYWRIGHT_BASE_URL=https://frontend-tms-core-dev.up.railway.app \
   API_URL=https://backend-tms-core-dev.up.railway.app/api/v1 \
   npm run test:e2e
   ```
3. Run cross-evaluation auditor: `node scripts/e2e-auditor.mjs` (Score >= 40/50, 0 Auto-FAILs).
4. Capture visual screenshot evidence (`screenshot_*_verified.png`).
5. Update technical documentation: `npm run todo:record <folder>` to generate `RESOLUTION.md` and append to `docs/SYSTEM_TIMELINE.md`.
6. Dispatch mobile-first completion report to Telegram channel.

---

## ⚙️ GitHub Actions Workflow Catalog (`.github/workflows/`)

The repository operates 3 primary GitHub Actions workflows:

### 1. `telegram-agy-worker.yml` (Autonomous AI Coding Worker)
- **File**: [`.github/workflows/telegram-agy-worker.yml`](file:///d:/Projects/logistics-website/.github/workflows/telegram-agy-worker.yml) (1202 lines)
- **Triggers**:
  - `repository_dispatch: types: [telegram-task]`
  - `workflow_dispatch: inputs: [prompt, task_id, sender_name, mode]`
- **Concurrency**:
  ```yaml
  concurrency:
    group: agy-worker-${{ github.ref }}
    cancel-in-progress: false # Zero Cancellation Invariant
  ```
- **Lifecycle Stages**:
  1. `intake-task`: Claims task from PostgreSQL `telegram_tasks` on Neon DB and sets status to `IN_PROGRESS`.
  2. `preflight`: Prepares submodules, caches node modules, runs `repo:status` and `repo:tracking`.
  3. `agent-exec`: Launches Antigravity Agent, runs autonomous implementation loop with build validation.
  4. `test-gate`: Runs Playwright E2E test suite.
  5. `resolution`: Records `RESOLUTION.md`, pushes feature branch, creates GitHub PR, merges into `dev`, sends Telegram report with diff summary.

### 2. `railway-deploy.yml` (Railway Cloud Deployment Pipeline)
- **File**: [`.github/workflows/railway-deploy.yml`](file:///d:/Projects/logistics-website/.github/workflows/railway-deploy.yml)
- **Triggers**:
  - `push: branches: [dev, master, main]` with path filtering (`backend/**`, `frontend/**`)
  - `workflow_dispatch: inputs: [target, environment]`
- **Concurrency**:
  ```yaml
  concurrency:
    group: railway-root-${{ github.ref }}
    cancel-in-progress: false
  ```
- **Key Functions**:
  - Determines environment (`dev` for branch `dev`, `production` for `master`/`main`).
  - Triggers Railway deployment hooks via GraphQL API.
  - Performs bounded health-check polling with timeout (`curl.exe -m 15`).

### 3. `daily-rbac-audit.yml` (Scheduled RBAC & Security Audit)
- **File**: [`.github/workflows/daily-rbac-audit.yml`](file:///d:/Projects/logistics-website/.github/workflows/daily-rbac-audit.yml)
- **Triggers**:
  - `schedule: - cron: '0 15 * * *'` (15:00 UTC = 22:00 GMT+7 Hanoi/Ho Chi Minh)
  - `repository_dispatch: types: [rbac-audit]`
  - `workflow_dispatch`
- **Key Functions**:
  - Executes `node scripts/audit-rbac-daily.mjs`.
  - Scans last 7 days of milestones in `docs/SYSTEM_TIMELINE.md`.
  - Audits controller decorators against [`.agents/rules/rbac-matrix.md`](file:///d:/Projects/logistics-website/.agents/rules/rbac-matrix.md).
  - Automatically commits and pushes doc updates back to `dev` if parity discrepancies are resolved.

---

## 🛠️ CLI Automation Runbook

| Operation | Command | Purpose |
|---|---|---|
| **Check Submodules Status** | `npm run repo:status` | Shows status across root, backend, frontend |
| **Check Submodules Tracking** | `npm run repo:tracking` | Shows upstream tracking `[ahead N, behind M]` |
| **Synchronize Submodules** | `npm run repo:sync` | Aligns branches and pulls latest upstream |
| **Start Feature Branch** | `npm run task:branch -- <id> <module> <action>` | Creates `<type>/task-<id>-<module>-<action>` in target submodules |
| **Create PR & Auto-Merge** | `npm run task:pr -- <id> <module> <action>` | Pushes branch, creates PR to `dev`, auto-merges |
| **Trigger Daily RBAC Audit** | `gh workflow run daily-rbac-audit.yml` | Manually triggers the 22:00 PM security audit |
| **Monitor Workflow Run** | `gh run list --limit 5` | Lists recent GitHub Actions workflow runs |
| **Watch Live Run Logs** | `gh run watch <run_id>` | Streams live console logs from GitHub runner |

---

## 🛡️ Critical Governance Rules & Anti-Patterns

1. **Zero Mid-Execution Cancellation Mandate**:
   - `cancel-in-progress: false` MUST be enforced on all workflow concurrency groups.
   - Never kill or abort running GitHub Actions jobs midway; preserve FIFO queue execution to maintain PostgreSQL state consistency.
2. **Submodule Pointer Drift Prevention**:
   - Never commit root pointers when submodule working trees are dirty or on unpushed commits.
   - Run `npm run repo:status` and `npm run repo:tracking` before every commit operation.
3. **Anti-Hang Network Protocol**:
   - All network calls inside GitHub Actions steps or scripts MUST specify an explicit timeout (`curl.exe -m 15`, `fetch(url, { signal: AbortSignal.timeout(15000) })`).
   - Never use bare unbounded `curl` or infinite retry loops.
4. **Secrets & Security Invariants**:
   - Secrets (`GH_PAT_TOKEN`, `TELEGRAM_BOT_TOKEN`, `RAILWAY_API_TOKEN`) MUST only be injected via GitHub Secrets.
   - NEVER commit `.env` files, credentials, or MCP configurations to GitHub.
