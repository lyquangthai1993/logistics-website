---
name: antigravity-task-runner
description: Run tasks through Antigravity CLI (`agy`) only when the user explicitly requests Antigravity delegation. Codex controls scope, reviews changes, verifies results, and closes out the task.
---

# Antigravity Task Runner

## Overview

Use this skill only when the user explicitly asks Codex to delegate the current task to Antigravity. A task being long or complex is not sufficient authorization.

Antigravity implements within the assigned scope. Codex remains responsible for preflight, prompt quality, protection of existing work, review, verification, correction loops, and final reporting.

Communicate user-facing progress, blockers, and reports in Vietnamese. Keep project skill and agent documentation in English.

## Autonomous Closeout and Owner Challenge

Codex may close the delegated task after a deep review passes. Routine completion does not require an extra user confirmation unless the result still needs a product, security, data, credential, or scope decision.

Before closeout:

- Inspect every affected repository and the complete task diff.
- Verify acceptance criteria with appropriate tests or other concrete evidence.
- Correct review findings through the same Antigravity conversation.
- Preserve unrelated and pre-existing changes.
- Report any verification that could not be run.

Do not let Antigravity mark project tasks complete, update shared tracking documents, stage, commit, push, merge, or change branches unless those actions are expressly included in the user's request and allowed by project rules.

## Locate CLI

Prefer `agy` from `PATH`:

```powershell
Get-Command agy -ErrorAction SilentlyContinue
agy --version
```

On Windows, if it is absent from `PATH`, check the current user's local installation without hard-coding a username:

```powershell
$agyPath = Join-Path $env:LOCALAPPDATA 'agy\bin\agy.exe'
Test-Path -LiteralPath $agyPath
& $agyPath --version
```

If no executable is available, report the blocker. Do not install or update software unless the user explicitly asks.

## Required Model

Use **Gemini 3.6 Flash (High)** for every fresh, continued, retry, and refactor invocation. Confirm the exact label when availability is uncertain:

```powershell
& $agyPath models
& $agyPath --model 'Gemini 3.6 Flash (High)' --dangerously-skip-permissions --print '<prompt>' --print-timeout 20m
& $agyPath --continue --model 'Gemini 3.6 Flash (High)' --dangerously-skip-permissions --print '<follow-up>' --print-timeout 20m
```

The permission-skipping CLI flag does not widen the user's authorization or the prompt's write scope.

### Failure Handling

- Do not silently switch models when the required model is unavailable or rejected.
- Retry transient CLI failures only when doing so does not repeat external side effects.
- Stop after two failed correction loops for the same core issue.
- Stop after two attempts that modify files outside the declared write scope.
- Report the exact remaining problem and required user action when blocked.

## Session Policy

- Start one fresh Antigravity conversation per task.
- Use `--continue` only for follow-ups and corrections within that task.
- Do not reuse a completed or blocked conversation for another task.
- Run tasks sequentially by default.
- Do not delete Antigravity conversation files unless the user explicitly requests deletion.

## Run Workflow

1. Read the request and applicable project instructions.
2. Read the root `AGENTS.md` and the nearest `AGENTS.md` for each affected directory.
3. Load skills required by those instructions or by the task.
4. Determine the objective, acceptance criteria, read scope, write scope, and forbidden operations.
5. Identify decisions or credentials that require user input before implementation.
6. Capture the Git baseline for every affected repository.
7. Start a fresh Antigravity conversation with a complete task prompt.
8. Inspect the resulting diff and verification evidence.
9. Send targeted refactor prompts until the result passes, blocks, or reaches a stopping condition.
10. Perform Codex closeout and report the outcome.

The Logistics TMS workspace contains three independent Git repositories:

- Root: shared rules, documentation, and submodule pointers.
- `backend/`: NestJS backend repository.
- `frontend/`: Next.js frontend repository.

Always review each affected repository separately. Pass current `AGENTS.md` and relevant skill paths to Antigravity instead of duplicating their business, RBAC, database, frontend, backend, or Git rules in this skill.

## Token-Saving Mode

Use token-saving behavior by default:

- Inspect targeted files, diffs, and test output before reading transcripts.
- Read only relevant instruction sections and nearby code unless broader context is necessary.
- Do not dump full generated files, logs, or transcripts.
- Report command, result, and important failure detail instead of full output.
- Keep prompts precise and avoid copying large policy documents when file paths are sufficient.

Use deeper inspection for security-sensitive, migration, authentication, authorization, or cross-repository work.

## Batch Workflow

When the user explicitly delegates multiple tasks:

1. Build an ordered queue from the request and real dependency information.
2. Record repository, write scope, dependencies, verification, and status for each task.
3. Run only the first unblocked task.
4. Review and close it before starting the next task.
5. Refresh the next prompt against the updated working tree.
6. Stop dependent work when a task requires user input or fails review.

Do not invent TODO states or dependency metadata that the project does not maintain.

## Task Run Manifest

Use a compact manifest for a batch or when scope boundaries need to be explicit:

```markdown
| Task | Repository | Write scope | Depends on | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| KPI accessibility | frontend | `src/features/orders/components/orders-kpi-cards.tsx` | none | typecheck + focused lint | ready |
```

Record pre-existing dirty files separately so they are not attributed to Antigravity.

## Hard Limits

- One active Antigravity task at a time by default.
- No destructive database or filesystem operations without explicit authorization.
- No secret, `.env`, credential, or MCP configuration exposure.
- No blanket workspace write scope when a narrower scope works.
- No commit, push, merge, branch change, or submodule pointer update unless explicitly requested and governed by the applicable project workflow.
- No continuation after the correction or out-of-scope stopping limit is reached.

## Preflight Snapshot

Before every task, capture only the repositories relevant to that task:

```powershell
git -C . status --short
git -C backend status --short
git -C frontend status --short
```

Also record the expected write scope and, when useful:

```powershell
git -C <repo> diff --name-only
git -C <repo> diff --stat
```

Do not initialize a repository, create a baseline commit, configure Git identity, stage files, or clean the worktree as part of preflight. Existing changes belong to the user unless proven otherwise.

Preflight is blocked when:

- The intended change overlaps ambiguous pre-existing work.
- Required authorization, credentials, product decisions, or external access are missing.
- The task requires database schema changes covered by a project approval gate.
- The requested write scope is too narrow to meet acceptance criteria and the user has not authorized expansion.

## Weakness Mitigations

### Scope and Dependency Parsing

- Prefer explicit task metadata and user requirements.
- Infer small implementation details only when they do not broaden the task.
- Treat ambiguous dependencies as unresolved rather than silently inventing an order.
- Recheck scope before each task in a batch.

### Diff Isolation

- Compare post-run changes with the recorded baseline in each repository.
- Attribute only newly changed files inside the declared write scope to the task.
- Ignore unrelated pre-existing dirty files during review, but ensure they remain intact.
- Treat any new out-of-scope file as a review failure until reverted or the scope is explicitly expanded.

### Conflict Handling

- Do not ask Antigravity to resolve broad conflicts across unrelated work.
- Keep tasks with overlapping write scopes sequential.
- Refresh prompts after earlier tasks change shared code.
- Stop when safe isolation is no longer possible.

### Closeout Safety

- Antigravity reports implementation evidence; Codex decides pass or failure.
- Apply project-specific documentation and audit workflows only when their own triggers apply.
- Do not create generic TODO, changelog, traceability, or flow files solely for Antigravity closeout.
- Recheck repository status after verification so generated or unexpected changes are visible.

### Model and Loop Control

- Pass the required model explicitly on every invocation.
- Keep correction findings concrete: file, location, problem, expected fix, and check.
- Do not restart in a fresh conversation to evade the correction limit.
- Do not switch models to bypass repeated quality failures.

## Parallel Exception

Parallel Antigravity execution is allowed only when the user explicitly requests it for a named batch.

Before parallel execution:

- Confirm tasks are independent and unblocked.
- Confirm repositories and write scopes do not overlap.
- Exclude migrations, lockfiles, shared registries, shared project rules, and submodule pointer updates.
- Keep review and final closeout coordinated and sequential.

Stop parallel execution if conflicts, unexpected files, or shallow verification appear.

## Review Loop

Do not trust exit code or the Antigravity summary alone. Inspect the working tree:

```powershell
git -C <repo> status --short
git -C <repo> diff --stat -- <expected-files>
git -C <repo> diff -- <expected-files>
```

Review for:

- Out-of-scope edits and damage to pre-existing work.
- Violations of applicable `AGENTS.md` or skill instructions.
- Incorrect behavior, incomplete acceptance criteria, or shallow implementation.
- Secrets, unsafe operations, silent fallbacks, or security regressions.
- Missing tests or verification appropriate to the risk.
- Unintended generated files, lockfile churn, or encoding damage.

### Deep Review Checklist

For higher-risk work, also inspect:

- Negative and fail-closed behavior for auth, RBAC, validation, and permissions.
- Data impact and rollback safety for approved schema or migration changes.
- Business state transitions and notification recipients against the current domain sources.
- Frontend loading, error, empty, responsive, and accessibility states.
- Cross-repository API contracts and type consistency.
- Documentation or audit updates required by project-specific skills.

If review fails, send a compact `[REFACTOR_PROMPT]` in the same conversation. Include exact findings, allowed files, required fixes, forbidden operations, and verification commands.

## User Approval During a Run

If Antigravity discovers a need for credentials, external login, destructive action, schema approval, product choice, or write-scope expansion:

- Stop the affected implementation path.
- Preserve the current working tree.
- Do not invent the missing decision or credential.
- Report what is needed, why Codex cannot decide it safely, and the exact user action required.
- Do not continue dependent batch tasks.

## Closeout Policy

Close the task only when:

- The diff is fully reviewed in every affected repository.
- Acceptance criteria are satisfied.
- Appropriate verification passes or an explicitly acceptable alternative exists.
- No unexplained or out-of-scope changes remain.
- Any required project-specific documentation or audit step is complete.

Closeout does not imply authorization to stage, commit, push, merge, update submodule pointers, or mutate external systems.

## Post-Closeout Defect Handling

If a defect is found after closeout:

1. Classify it as a regression, review miss, missing test, or new requirement.
2. Define a focused follow-up task rather than rewriting prior evidence.
3. Record affected files, acceptance criteria, verification, and dependency impact.
4. Use the normal direct Codex workflow unless the user explicitly requests another Antigravity run.
5. Block dependent work when the defect invalidates its assumptions.

## Per-Task Audit Log

Keep a compact record when the task is complex, batched, blocked, or explicitly audited:

```markdown
| Task | Repository | Model | Loops | Result | Files | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| KPI accessibility | frontend | Gemini 3.6 Flash (High) | 1 | pass | `orders-kpi-cards.tsx` | none |
```

If `agy --print` is empty, inspect repository changes and verification first. Locate and read only narrow transcript excerpts when those sources cannot explain the result.

## Reporting

Default final report:

- Result: pass, blocked, or needs refactor.
- Repositories and files changed.
- Verification commands and outcomes.
- Closeout actions actually performed.
- Skipped checks, residual risks, or exact user action required.

Include executable path, model, conversation identifier, detailed audit tables, or transcript evidence only when requested or needed to diagnose a failure.
