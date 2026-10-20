# n8n & Telegram Task Orchestration Rules

- **Zero Mid-Execution Cancellation Mandate (`RULE-ZERO-CANCEL-01`)**: Never cancel, abort, or kill in-progress tasks in `telegram_tasks` or `neon-worker.mjs`. All tasks must execute sequentially in strict FIFO order (`cancel-in-progress: false`) until reaching `COMPLETED`, `TODO_CREATED`, or `FAILED`.
- **Zero Premature Telegram Reporting**: Never send a task completion report to Telegram before passing both Gate 1 (Local E2E) and Gate 2 (Railway Cloud Dev E2E + `e2e-auditor.mjs` >= 40/50 + verified screenshot evidence).
- **Non-Blocking DB Queries**: Any Node.js script inspecting `n8n_automation` or `telegram_tasks` must include a hard timeout (`setTimeout(() => process.exit(1), 8000).unref()`) and close the client in `finally { await client.end(); }`.
