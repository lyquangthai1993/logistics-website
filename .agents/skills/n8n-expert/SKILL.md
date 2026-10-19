---
name: n8n-expert
description: >-
  Master architect and automation engineer for n8n workflows, event dispatchers, webhook pipelines,
  cron schedulers, and background integrations in the Spider Express Logistics TMS ecosystem.
  Understands all live TMS workflows, the complete 28-tool n8n MCP server suite, node lifecycle,
  Code nodes (JS/Python), database connections, GitHub Actions dispatching, and Telegram bot orchestration.
  Triggers on: "n8n", "workflow", "automation", "webhook", "cron", "orchestrator", "node", "pipeline",
  "mcp_n8n", "schedule trigger", "event router".
---

# n8n Expert & Automation Orchestrator — Logistics TMS

> **Role**: Master Automation Architect and Integration Lead for all **n8n workflows**, event streams, scheduled cron jobs, webhook routers, and CI/CD task dispatchers across the Spider Express Transportation Management System (TMS).
> Governs the full lifecycle of workflows: from node discovery, design, JSON graph authoring, and validation, to live deployment, test execution, database synchronization, and incident alerting.

---

## 🏛️ Infrastructure & Architecture Topology

```
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                      Spider Express Logistics TMS Architecture                 │
 └────────────────────────────────────────────────────────────────────────────────┘
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     ▼                                ▼                                ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     Next.js Frontend    │  │     NestJS Backend      │  │      Telegram Bot       │
│  (Railway/Vercel Cloud) │  │  (Railway/Render Cloud) │  │   (Spider TMS Worker)   │
└────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
             │                            │                            │
             │ REST / Webhooks            │ Events / DB                │ Chat Webhooks
             ▼                            ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                       n8n Cloud Automation Orchestrator                           │
│                Domain: https://n8n-automation-production-d298.up.railway.app      │
│                Database: PostgreSQL on Railway (n8n_automation)                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│ • Telegram Leader Task Orchestrator (IL2EeeayDVec4jHl)                             │
│ • Daily Todo-Agent Orchestrator 12PM, 3PM, 7PM (npbnCeqRGuBWPNjI)                 │
│ • Daily RBAC & Security Audit 22:00 PM (M1IVf9rAsyFD5TYq)                         │
│ • Events Router & Notification Hub (0194e82b-8a8f-4318-912a-0a2a4ffc0003)         │
│ • Webhook to Telegram Alert (0194e82b-8a8f-4318-912a-0a2a4ffc0001)                │
└─────────────────────────────────────┬─────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│        Neon PostgreSQL DB         │   │       GitHub Actions CI/CD        │
│   (telegram_tasks / orders / etc) │   │    (Cloud E2E / Todo Runners)     │
└───────────────────────────────────┘   └───────────────────────────────────┘
```

### Key Infrastructure Parameters
- **Railway Cloud Host**: `https://n8n-automation-production-d298.up.railway.app`
- **Internal Database**: PostgreSQL database (`n8n_automation`) hosted on Railway
- **Execution Engine**: n8n v1+ with sandboxed code execution, persistent task history, and retry policies
- **Local Reference & Sandbox Setup**: Located in [`tools/n8n-reference/`](file:///d:/Projects/logistics-website/tools/n8n-reference) (Docker Compose with `n8n-sandbox-service-api` & `n8n-sandbox-service-runner-dind`)
- **Automation Scripts**: Located in [`tools/telegram-task-runner/`](file:///d:/Projects/logistics-website/tools/telegram-task-runner) and [`scripts/`](file:///d:/Projects/logistics-website/scripts)

---

## 📋 Catalog of Live Production Workflows

The system currently operates 5 core production workflows in the n8n cluster:

| Workflow Name | Workflow ID | Status | Trigger Mechanism | Primary Nodes & Purpose |
|---|---|---|---|---|
| **Telegram Leader Task Orchestrator** | `IL2EeeayDVec4jHl` | **ACTIVE** | Webhook (Telegram updates) | `Webhook Trigger` ➔ `Filter Allowed Chat` ➔ `Format Leader Prompt` ➔ `Route Switch` ➔ `Enqueue Task to Neon DB` & `Trigger GitHub Actions` |
| **Daily 12PM, 3PM & 7PM Todo-Agent Orchestrator** | `npbnCeqRGuBWPNjI` | **ACTIVE** | Cron (`0 12,15,19 * * *`) + Manual + Webhook | `Schedule Trigger` ➔ `Query Pending Feedback` (Postgres) ➔ `Format Todo Task` ➔ `If Tasks > 0` ➔ `Enqueue Todo Task` ➔ `Notify Telegram Success` ➔ `Trigger GitHub Actions` |
| **Daily RBAC & Security Audit 22:00 PM** | `M1IVf9rAsyFD5TYq` | **ACTIVE** | Cron (`0 22 * * *`) | `Schedule: 10:00 PM Hàng Ngày` ➔ `Chuẩn Bị Payload & Lịch Trình` ➔ `Thông Báo Telegram Bắt Đầu` & `Kích Hoạt GitHub Actions Worker` (`npm run audit:rbac`) |
| **Events Router & Notification Hub** | `0194e82b-8a8f-4318-912a-0a2a4ffc0003` | Standby | Webhook (`/webhook/logistics-events`) | `Logistics Events Webhook` ➔ `Switch: Phân loại Event` (order, trip, inventory) ➔ Dedicated formatters ➔ `Bắn tin Telegram` |
| **Webhook to Telegram Alert** | `0194e82b-8a8f-4318-912a-0a2a4ffc0001` | Standby | Webhook (`/webhook/tms-alert`) | `TMS Webhook Trigger` ➔ `Format Telegram Message` ➔ `HTTP - Send to Telegram` ➔ `Respond to Webhook` |

---

## 🛠️ Complete n8n MCP Tools Reference (28 Tools)

The system is equipped with the complete `n8n` MCP server (`n8n-mcp`), exposing 28 granular tools organized into 7 functional domains:

### 1. Meta & Discovery Tools
- `tools_documentation`: Access interactive documentation for any n8n MCP tool.
  - Usage: `tools_documentation({ topic: "overview" | "<tool_name>", depth: "essentials" | "full" })`
  - Guides available: `"javascript_code_node_guide"`, `"python_code_node_guide"`
- `search_nodes`: Full-text search across all thousands of built-in n8n nodes.
  - Parameters: `query`, `category`, `mode` (`OR`, `AND`, `FUZZY`)
  - Examples: `search_nodes({ query: "postgres" })`, `search_nodes({ query: "AI langchain" })`

### 2. Configuration & Schema Inspection
- `get_node`: Unified progressive disclosure tool for any node schema:
  - `detail: "minimal"`: Quick required parameters (< 1KB).
  - `detail: "standard"`: **(Recommended starting point)** Essential inputs, parameters, and common options (~1-2KB).
  - `detail: "full"`: Comprehensive JSON schema (~50-100KB).
  - `mode: "docs"`: Human-readable Markdown documentation for the node.
  - `mode: "search_properties"`: Find specific configuration keys (e.g. `propertyQuery: "authentication"`).
  - `mode: "versions" | "compare" | "breaking" | "migrations"`: Node version lifecycle and migration diffs.

### 3. Validation & Quality Gates
- `validate_node`: Validates node configuration against its strict schema.
  - Parameters: `nodeType`, `config`, `mode` (`"minimal"` or `"full"`). Detects invalid parameter types, missing required inputs, and unsupported version combinations.
- `validate_workflow`: Validates complete workflow JSON graphs locally before deployment.
  - Checks: disconnected nodes, invalid expressions (`{{ $json... }}`), syntax errors in Code nodes, missing webhook paths.
- `n8n_validate_workflow`: Validates a deployed workflow directly on the live n8n instance by ID.
- `n8n_autofix_workflow`: Automatically detects and repairs common configuration inconsistencies, outdated node parameters, and broken connection pointers.

### 4. Workflow Template Library (2,700+ Verified Patterns)
- `search_templates`: Search the global community repository of 2,700+ pre-built n8n workflows:
  - `searchMode: "keyword"`: Query by functionality (e.g. "telegram alert", "github webhook").
  - `searchMode: "by_nodes"`: Find templates combining specific nodes (e.g. `["n8n-nodes-base.webhook", "n8n-nodes-base.postgres"]`).
  - `searchMode: "by_task"`: Curated task-based templates.
  - `searchMode: "patterns"`: Pattern design summaries.
- `get_template`: Fetch the complete, valid workflow JSON by template ID.
- `n8n_deploy_template`: Instantiate a template directly into the live n8n workspace.

### 5. Instance & Workflow Management (API Mode)
- `n8n_list_workflows`: List all workflows on the instance with status, active state, and tags.
- `n8n_get_workflow`: Inspect workflow details by ID:
  - `mode: "full"` (Draft/current edit graph)
  - `mode: "active"` (Currently executing published graph)
  - `mode: "structure"` / `mode: "minimal"`
- `n8n_create_workflow`: Programmatically deploy a new workflow graph onto the instance.
- `n8n_update_full_workflow`: Atomically replace the entire workflow nodes and connections graph.
- `n8n_update_partial_workflow`: Apply surgical, differential modifications to specific nodes or properties.
- `n8n_delete_workflow`: Safely retire and remove a workflow.

### 6. Testing & Execution Management
- `n8n_test_workflow`: Execute a workflow run directly via webhook trigger, pinned data, or direct dispatch.
- `n8n_executions`: Unified execution run tracker:
  - `action: "list"`: View recent executions, execution times, and status (`success`, `error`, `running`).
  - `action: "get"`: Inspect execution logs, node input/output payloads, and failure stack traces.
  - `action: "delete"`: Clean up execution history.
- `n8n_evaluations`: Manage evaluation test runs and golden test cases (n8n v2.30+).

### 7. Governance, Credentials & System Administration
- `n8n_health_check`: Check n8n server status, connectivity, API latency, and version health.
  - `mode: "status"` (Fast ping) or `mode: "diagnostic"` (Detailed environment and tool debugging).
- `n8n_workflow_versions`: Manage historical revisions, diff changes, and execute rollbacks.
- `n8n_manage_credentials`: Audit and manage saved credentials (`list`, `getSchema`, `create`, `update`, `delete`).
- `n8n_manage_folders`: Organize workflows into enterprise domain folders (`TMS Core`, `Auditing`, `Alerts`).
- `n8n_manage_datatable`: Manage n8n internal tabular datasets.
- `n8n_audit_instance`: Comprehensive security, RBAC, and credential hygiene audit of the instance.
- `n8n_manage_agents` & `n8n_explore_node_resources`: Agent and dynamic dropdown resolution.

---

## ⚡ Core Node Architecture & Code Node Best Practices

### 1. JavaScript Code Node Standards (`n8n-nodes-base.code`)
In n8n modern architecture (v1+), JavaScript code nodes must adhere to strict data-stream conventions:

```javascript
// ✅ Rule 1: Always access input arrays using $input.all() or $input.first()
const items = $input.all();

// ✅ Rule 2: Access JSON data through item.json
const results = [];
for (const item of items) {
  const payload = item.json.body || item.json;
  
  // Format localized timestamps (Asia/Ho_Chi_Minh)
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  // Reference other nodes safely using $('Node Name').first()
  const previousData = $('Query Pending Feedback').first()?.json || {};
  
  // ✅ Rule 3: Always return an array of objects with the 'json' key
  results.push({
    json: {
      task_id: payload.task_id || payload.id,
      prompt: payload.raw_prompt,
      sender: payload.sender_name,
      timestamp: timeStr,
      is_valid: Boolean(payload.task_id)
    }
  });
}

return results;
```

#### Forbidden Patterns in Code Nodes
- ❌ Do NOT use deprecated syntax `items[0].json` without `$input` context.
- ❌ Do NOT return raw primitives (e.g. `return "success";` or `return { a: 1 };`). It MUST be `return [{ json: { a: 1 } }];`.
- ❌ Do NOT perform blocking network calls without handling timeouts or exceptions.

### 2. Schedule Trigger Node (`n8n-nodes-base.scheduleTrigger`)
- Use standardized cron expressions in business hours (`Asia/Ho_Chi_Minh` timezone):
  - Daily RBAC Audit: `0 22 * * *` (10:00 PM every night)
  - Daily Feedback Batch: `0 12,15,19 * * *` (12:00 PM, 3:00 PM, 7:00 PM)
  - Hourly Health Monitor: `0 * * * *`

### 3. Webhook Trigger & Response Patterns
- For asynchronous background ingestion: Set `responseMode: "onReceived"`. Returns immediate HTTP 200 to caller while n8n executes the downstream pipeline.
- For synchronous verification (e.g. API validation): Set `responseMode: "responseNode"` paired with `n8n-nodes-base.respondToWebhook` at the end of the pipeline.

### 4. Telegram Notification Formatting (Mobile-First HTML)
All Telegram messages dispatched by n8n MUST follow clean, structured HTML formatting:
```html
<b>🚀 [MỤC ĐÍCH / TÊN TASK]</b>
━━━━━━━━━━━━━━━━━━━━
• <b>Trạng thái:</b> <code>COMPLETED</code>
• <b>Mã đơn / Chuyến:</b> <code>TRIP-2610-001</code>
• <b>Hub / Kho bãi:</b> Andromeda Hub - HCM
• <b>Chi tiết:</b> Mô tả ngắn gọn súc tích không spam code.

⏰ <i>Thời gian: 16/10/2026, 09:30:00</i>
```

---

## 🔄 Proven Automation Blueprints in TMS

### Blueprint 1: Webhook to Telegram Dispatcher
1. **Trigger**: `n8n-nodes-base.webhook` receiving operational events from NestJS backend (`/api/v1/notifications`).
2. **Transform**: `n8n-nodes-base.code` builds mobile-optimized HTML payload with status emoji.
3. **Dispatch**: `n8n-nodes-base.httpRequest` sends `POST https://api.telegram.org/bot<TOKEN>/sendMessage`.
4. **Ack**: `n8n-nodes-base.respondToWebhook` returns `{ "status": "success" }`.

### Blueprint 2: Neon DB Feedback Scanner & GitHub Actions Runner
1. **Schedule**: `n8n-nodes-base.scheduleTrigger` triggers at designated hours.
2. **Query**: `n8n-nodes-base.postgres` queries Neon DB for pending feedback:
   ```sql
   SELECT t.id, t.task_id, t.feedback_dir, t.raw_prompt, t.sender_name
   FROM telegram_tasks t
   WHERE t.status = 'COMPLETED' AND t.feedback_dir IS NOT NULL
     AND t.created_at >= CURRENT_DATE
   ORDER BY t.task_id DESC;
   ```
3. **Decision**: `n8n-nodes-base.if` evaluates `item.json.task_count > 0`.
4. **Action**: If tasks exist:
   - Inserts `/todo-agent` batch task into `telegram_tasks`.
   - Dispatches `repository_dispatch` to GitHub Actions:
     ```json
     {
       "event_type": "telegram-task",
       "client_payload": {
         "prompt": "npm run todo:batch",
         "task_id": "todo-batch-scheduled"
       }
     }
     ```
   - Sends Telegram broadcast with summary checklist.

### Blueprint 3: Security & RBAC Daily Audit
1. **Trigger**: Cron `0 22 * * *`.
2. **Alert**: Telegram start notification.
3. **Dispatch**: Triggers GitHub Actions workflow with `prompt: "npm run audit:rbac"`.
4. **Audit Script**: Evaluates all API endpoints dynamically, checks `SYSTEM_TIMELINE.md`, and posts audit report back to Telegram channel.

---

## 🛠️ Management & Deployment Runbook

### Updating Workflows Programmatically via Node.js Scripts
When modifying production workflows without manual UI clicks, use the established pattern in [`scripts/update-n8n-todo-orchestrator.mjs`](file:///d:/Projects/logistics-website/scripts/update-n8n-todo-orchestrator.mjs):

```javascript
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-automation-production-d298.up.railway.app';
const WORKFLOW_ID = 'npbnCeqRGuBWPNjI';

// 1. Session Login
const loginRes = await fetch(`${BASE_URL}/rest/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ emailOrLdapLoginId: process.env.N8N_EMAIL, password: process.env.N8N_PASSWORD })
});
const cookie = loginRes.headers.get('set-cookie');

// 2. Fetch Current Graph
const getRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
  headers: { 'Cookie': cookie }
});
const currentWf = (await getRes.json()).data;

// 3. Mutate Nodes or Parameters
const updatedNodes = currentWf.nodes.map(node => {
  if (node.name === 'Target Node') {
    return { ...node, parameters: { ...node.parameters, key: 'new-value' } };
  }
  return node;
});

// 4. Atomically Update
const updateRes = await fetch(`${BASE_URL}/rest/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
  body: JSON.stringify({ ...currentWf, nodes: updatedNodes })
});
```

---

## 🛡️ Operational Invariants & Governance

1. **Anti-Hang & Bounded Timeout Mandate**:
   - Every HTTP call, webhook, or external API ping to n8n MUST include an explicit timeout (`-m 15` in `curl.exe`, `{ signal: AbortSignal.timeout(15000) }` in `fetch`).
   - Indefinite polling loops are strictly prohibited.
2. **Secrets & Credentials Safety**:
   - NEVER commit `.env`, `N8N_ENCRYPTION_KEY`, `N8N_API_KEY`, or bot tokens into git repositories.
   - All credentials must be read from environment variables or encrypted credential stores.
3. **Database Idempotency**:
   - Automated workflows that enqueue tasks or mutate records in PostgreSQL must use unique transaction IDs or idempotency keys (`task_id`) to prevent duplicate task execution.
4. **Non-Blocking Error Isolation**:
   - Notifications and audit dispatches must be wrapped in `try/catch` or error branches (`Continue on Fail`) to prevent aborting primary business flows.
