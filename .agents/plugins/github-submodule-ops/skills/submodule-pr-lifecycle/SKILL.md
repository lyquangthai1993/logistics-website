---
name: submodule-pr-lifecycle
description: Execute the 4-stage GitHub Task Lifecycle (RULE-GIT-TASK-WORKFLOW-01) across root, backend, and frontend submodules using gh CLI and scripts/git-task-workflow.mjs. Activate when checking multi-repo status, starting feature branches from dev, creating pull requests, or syncing submodule pointers.
---

# GitHub Submodule & PR Lifecycle (`submodule-pr-lifecycle`)

This skill orchestrates the 3-repository Git Submodule architecture (`root`, `backend/`, `frontend/`) and the 4-Stage GitHub PR Pipeline for Spider Express Logistics TMS.

## 1. Preflight Repo Status & Tracking

Always verify alignment across all 3 repositories before starting work:

```powershell
$env:GIT_TERMINAL_PROMPT=0
node scripts/git-task-workflow.mjs status
```

## 2. Stage 1: Start Feature/Fix Branch from `dev`

Use [`scripts/git-task-workflow.mjs`](file:///c:/Projects/logistics-website/scripts/git-task-workflow.mjs) to pull latest `dev` and create matching branches in target submodules:

```powershell
# Syntax: node scripts/git-task-workflow.mjs start <task_id> <module-slug> <action> <type> <scope>
# Scope options: backend | frontend | fullstack
node scripts/git-task-workflow.mjs start 101 warehouse waybill-fix fix fullstack
```

## 3. Stage 2 & 3: Submodule Commit, PR Creation & Auto-Merge into `dev`

After Gate 1 Local E2E verification passes 100%:

1. Commit inside `backend/` and/or `frontend/` first using Conventional Commits (`feat(scope): ...` or `fix(scope): ...`).
2. Push feature branch, create GitHub PR into `dev` (`gh pr create --base dev`), and merge (`gh pr merge --merge`):

```powershell
$env:GIT_TERMINAL_PROMPT=0
node scripts/git-task-workflow.mjs pr 101 warehouse-waybill-fix
```

3. Update root repository submodule pointers on `dev`:

```powershell
git checkout dev
git pull origin dev
git add backend frontend
git commit -m "chore(submodules): update backend and frontend pointers for task 101"
```

## 4. Inspecting GitHub Actions & PR Audit Trail

Use `gh` CLI with bounded output:

```powershell
$env:GIT_TERMINAL_PROMPT=0
gh pr list --state all --limit 5
gh run list --limit 5
```
