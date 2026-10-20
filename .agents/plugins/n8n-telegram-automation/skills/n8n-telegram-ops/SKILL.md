---
name: n8n-telegram-ops
description: Manage n8n workflows (Daily RBAC Audit M1IVf9rAsyFD5TYq, Event Router, Todo Orchestrator) and the Telegram Bot FIFO task runner (neon-worker.mjs, bot.mjs) on Railway Cloud. Activate when inspecting n8n logs, syncing workflow JSONs, checking the telegram_tasks queue, or troubleshooting Telegram task execution.
---

# n8n & Telegram Task Operations (`n8n-telegram-ops`)

This skill governs operations for the **n8n Automation Engine** (`https://n8n-automation-production-d298.up.railway.app`) and the **Telegram Task Runner** (`tools/telegram-task-runner/`).

## 1. Core Workflows & Architecture

| Component | Identifier / Path | Purpose |
| :--- | :--- | :--- |
| Daily RBAC Audit | Workflow ID `M1IVf9rAsyFD5TYq` | Runs daily at 22:00 PM to audit role permissions and send Telegram reports. |
| Todo Orchestrator | [`scripts/update-n8n-todo-orchestrator.mjs`](file:///c:/Projects/logistics-website/scripts/update-n8n-todo-orchestrator.mjs) | Routes Telegram task requests into the `telegram_tasks` PostgreSQL queue. |
| Event Router | [`tools/telegram-task-runner/update-n8n-router.mjs`](file:///c:/Projects/logistics-website/tools/telegram-task-runner/update-n8n-router.mjs) | Dispatches webhook and Telegram bot events. |
| Neon Worker | [`tools/telegram-task-runner/neon-worker.mjs`](file:///c:/Projects/logistics-website/tools/telegram-task-runner/neon-worker.mjs) | Polls `telegram_tasks` in strict FIFO order and executes the 2-Tier Quality Gate. |

## 2. Inspecting & Syncing n8n Workflows

```powershell
# Inspect n8n runtime logs on Railway
python scripts/get_n8n_logs.py

# Sync published workflow states in n8n_automation DB
node tools/telegram-task-runner/sync-n8n-published.mjs

# Update n8n Todo Orchestrator or Event Router
node scripts/update-n8n-todo-orchestrator.mjs
node tools/telegram-task-runner/update-n8n-router.mjs
```

## 3. Inspecting Telegram Task Queue (`telegram_tasks`)

Use the built-in non-blocking inspection scripts:

```powershell
# Check incomplete or pending tasks in the queue
node scripts/query-incomplete-tasks.mjs

# Generate today's task execution report
node scripts/report-today.mjs
```
