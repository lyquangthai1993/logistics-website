---
name: tms-ops-maintainer
description: >-
  Stage 6 Operations, Post-Deployment Verification, Living Documentation, and Site Reliability
  Specialist (Vai trò Vận hành - MAINTAIN) for the Spider Express Logistics TMS platform.
  Governs post-deploy health checks on Railway Cloud (Dev & Production), Redis/BullMQ queue
  monitoring, n8n daily RBAC audit workflows, Admin trip rollback / master contract override
  playbooks, and synchronization of RESOLUTION.md, docs/SYSTEM_TIMELINE.md, CODEBASE_AUDIT.md,
  and rbac-matrix.md. Triggers on: "maintain", "vận hành", "post-deploy", "ops", "health check",
  "rollback", "ghi biên niên sử", "bảo trì", "monitoring", "tms-ops-maintainer".
version: 1.0.0
author: Logistics TMS Architect
---

# TMS Operations & Maintenance Specialist (`MAINTAIN` — Vai trò Vận hành)

## 1. Role & Identity in the 6-Stage SDLC Pipeline

`tms-ops-maintainer` is the **6th and final stage (`6. MAINTAIN — Vận hành`)** of the Spider Express Logistics TMS software delivery pipeline:

```text
[1. PLAN (PM)] ──► 📄 TODO.md ──► [2. DESIGN (Architect)] ──► [3. BUILD (Engineer)] ──► [4. TEST (QA)] ──► [5. DEPLOY (Release)] ──► [6. MAINTAIN (Vận hành)]
```

Once a feature or bugfix has been deployed to Railway Cloud Dev (or promoted to Production) and passed Tier-2 E2E verification, `tms-ops-maintainer` takes ownership to:
1. **Verify Live Runtime Health**: Execute bounded anti-hang health checks across Backend API, Frontend SSR/Edge routes, PostgreSQL DB connectivity, and Redis/BullMQ mail queues.
2. **Synchronize Institutional Memory (Living Ledgers)**: Record immutable technical certificates (`RESOLUTION.md`), update [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md), synchronize [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md) (with [`/codebase-auditor`](../codebase-auditor/SKILL.md)), and keep [`.agents/rules/rbac-matrix.md`](file:///d:/Projects/logistics-website/.agents/rules/rbac-matrix.md) in 1:1 parity.
3. **Enforce Operational Invariants & Recovery Playbooks**: Guard against regressions in subsequent sessions, monitor scheduled n8n audits, and provide safe administrative recovery procedures (Trip Rollback, Master Contract Override).
4. **Broadcast Mobile-First Acceptance Reports**: Deliver verified visual evidence and PR audit links to stakeholders via Telegram ([`/telegram-task-responder`](../telegram-task-responder/SKILL.md)).

---

## 2. Canonical Cloud Infrastructure & Health Check Matrix

All health checks MUST obey `RULE-ANTI-HANG-EXEC-01` (always use `curl.exe -m 15 -i`, never bare `curl` in PowerShell):

| Environment | Tier | Service | Canonical URL | Health Check Command |
| :--- | :--- | :--- | :--- | :--- |
| **Domain Dev** *(Primary - Railway)* | Branch `dev` | **Backend API** | `https://backend-tms-core-dev.up.railway.app` | `curl.exe -m 15 -i https://backend-tms-core-dev.up.railway.app/api/v1/health` |
| **Domain Dev** *(Primary - Railway)* | Branch `dev` | **Frontend App** | `https://frontend-tms-core-dev.up.railway.app` | `curl.exe -m 15 -I https://frontend-tms-core-dev.up.railway.app/auth/sign-in` |
| **Domain Pro** *(Primary - Railway)* | Branch `master` | **Backend API** | `https://backend-tms-core-production.up.railway.app` | `curl.exe -m 15 -i https://backend-tms-core-production.up.railway.app/api/v1/health` |
| **Domain Pro** *(Primary - Railway)* | Branch `master` | **Frontend App** | `https://frontend-tms-core-production.up.railway.app` | `curl.exe -m 15 -I https://frontend-tms-core-production.up.railway.app/auth/sign-in` |
| **Cloud Automation** *(Railway n8n)* | Production | **n8n Worker** | `https://n8n-automation-production-d298.up.railway.app` | Daily RBAC Audit Workflow ID: `M1IVf9rAsyFD5TYq` (22:00 PM) |

---

## 3. Stage 6 (`MAINTAIN`) Standard Execution Checklist

Every completed task in `/todo-agent` MUST execute these 5 operational steps before closing:

### Step 6.1: Live Service & Queue Health Audit
- Verify Backend Dev returns `HTTP/1.1 200 OK` on `/api/v1/health`.
- Verify zero unhandled runtime exceptions or `500 Internal Server Error` in recent API calls.
- If email/notification logic was touched, verify BullMQ queue health via `GET /api/v1/mail/queue-status` (`SUPER_ADMIN`).

### Step 6.2: Living Task Checklist Synchronization
- Toggle all verified items in `feedbacks/feedback_DD_MM*/TODO.md` from `- [ ]` to `- [x]`:
  ```bash
  node scripts/todo-agent.mjs toggle <folder_name> <line_or_query> done
  ```
- Confirm `node scripts/todo-agent.mjs inspect <folder_name>` reports **100% completion (`0 pending`)**.

### Step 6.3: Technical Resolution & Evolutionary Timeline Recording
- Execute the automated historian command:
  ```bash
  npm run todo:record <folder_name>
  ```
- Verify that `feedbacks/feedback_DD_MM*/RESOLUTION.md` contains all 6 mandatory sections:
  1. Operational Context & Root Cause Analysis (RCA)
  2. Newly Introduced Capabilities (Backend, Frontend, DB, E2E)
  3. Newly Established Core System Invariants
  4. E2E Verification Evidence & 50-Point Auditor Scorecard
  5. Impacted Source Files Table
  6. Technical Guidance for Subsequent AI Agent Sessions
- Verify [`docs/SYSTEM_TIMELINE.md`](file:///d:/Projects/logistics-website/docs/SYSTEM_TIMELINE.md) has the new milestone prepended in reverse-chronological order.

### Step 6.4: Architecture & RBAC Ledger Synchronization
- **If any RBAC permission, route guard (`proxy.ts`), or sidebar menu (`nav-config.ts`) changed**:
  - Update [`.agents/rules/rbac-matrix.md`](file:///d:/Projects/logistics-website/.agents/rules/rbac-matrix.md) immediately in the same PR/commit and bump the matrix version.
- **If a new module, entity, migration, or major endpoint was introduced**:
  - Invoke [`/codebase-auditor`](../codebase-auditor/SKILL.md) to update [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md).

### Step 6.5: Mobile-First Operational Handover Report
- Format the final completion report using [`/telegram-task-responder`](../telegram-task-responder/SKILL.md) rules:
  - Send verified non-empty screenshot (`screenshot_*_verified.png`) via Telegram `sendPhoto`.
  - Send concise summary with GitHub PR link, Tier-1 (Local) + Tier-2 (Cloud Dev) E2E results, Auditor Score (`>= 40/50`), and links to `RESOLUTION.md` & `docs/SYSTEM_TIMELINE.md`.

---

## 4. Operational Recovery & Administrative Playbooks

When supporting live warehouse or dispatch operations, `tms-ops-maintainer` governs two safe administrative recovery mechanisms built into the TMS:

1. **Completed Trip Rollback & Inventory Reversion (Task #81)**:
   - *Scenario*: A warehouse operator prematurely confirmed an inbound or outbound trip (`COMPLETED`), locking the trip stop under Rule 8 (Stop Ledger Invariant).
   - *Action*: Only `SUPER_ADMIN` can execute `POST /api/v1/warehouse/trips/:tripCode/rollback` to reopen the trip to `PENDING` and atomically revert the associated inventory ledger transactions.
2. **Master Order Contract Override (Immutability Bypass)**:
   - *Scenario*: An order has already progressed past `DRAFT`, locking its contract fields (`totalQuantity`, `totalWeight`, `totalVolume`, hubs, goods description) against normal `PATCH /api/v1/orders/:id`.
   - *Action*: Only `SUPER_ADMIN` can execute `PATCH /api/v1/orders/:id/admin-override` with a mandatory `auditReason`, which records an immutable `DCH` adjustment voucher in the operational ledger.
