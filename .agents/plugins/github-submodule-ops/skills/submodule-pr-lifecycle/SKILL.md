---
name: submodule-pr-lifecycle
description: Execute the 4-stage GitHub Task Lifecycle (RULE-GIT-TASK-WORKFLOW-01 & RULE-GIT-HISTORY-RESUME-01) across root, backend, and frontend submodules using gh CLI and scripts/git-task-workflow.mjs. Activate when checking multi-repo status, resuming previous feature branches from git history, starting feature branches from dev, creating pull requests, or syncing submodule pointers.
---

# GitHub Submodule & PR Lifecycle (`submodule-pr-lifecycle`)

This skill orchestrates the 3-repository Git Submodule architecture (`root`, `backend/`, `frontend/`) and the 4-Stage GitHub PR Pipeline for Spider Express Logistics TMS.

## 1. Mandatory Session-Start Repo Status & Active Feature Branch Recovery (`RULE-GIT-HISTORY-RESUME-01`)

At the start of **every Antigravity chat session** (and before any Git commit/push), verify branch alignment and trace Git history across all 3 repositories:

```powershell
$env:GIT_TERMINAL_PROMPT=0
npm run repo:status
npm run repo:tracking
```

- **Strictly Forbidden**: NEVER commit or push code directly onto `dev` or `master` (`git push origin dev`, `git push origin master`).
- **Automatic Return to Previous Feature Branch**: If any repository (`root`, `backend/`, `frontend/`) is currently sitting on `dev` or `master`, immediately trace back Git history (`git reflog` + `git for-each-ref --sort=-committerdate`) and switch back to the primary feature branch:

```powershell
npm run repo:resume
# Equivalent to: node scripts/git-task-workflow.mjs resume
```

## 2. Stage 1: Start a Brand-New Feature/Fix Branch from `dev`

When starting a brand-new task (not continuing an existing feature branch), use [`scripts/git-task-workflow.mjs`](file:///d:/Projects/logistics-website/scripts/git-task-workflow.mjs) to pull latest `dev` and create matching branches in target submodules:

```powershell
# Syntax: node scripts/git-task-workflow.mjs start <task_id> <module-slug> <action> <type> <scope>
# Scope options: backend | frontend | fullstack
node scripts/git-task-workflow.mjs start 101 warehouse waybill-fix fix fullstack
```

## 3. Stage 2 & 3: Submodule Commit, PR Creation, Auto-Merge into `dev` & Return to Feature Branch

After Gate 1 Local E2E verification passes 100%:

1. Verify all repositories are on the active feature branch (`npm run repo:resume` if needed).
2. Commit inside `backend/` and/or `frontend/` first using Conventional Commits (`feat(scope): ...` or `fix(scope): ...`).
3. Push the feature branch, create GitHub PR into `dev` (`gh pr create --base dev`), merge (`gh pr merge --merge`), and automatically switch the local working tree back to the feature branch:

```powershell
$env:GIT_TERMINAL_PROMPT=0
node scripts/git-task-workflow.mjs pr 101 warehouse-waybill-fix
```

4. Update root repository submodule pointers on the feature branch (never leave `root`, `backend`, or `frontend` stranded on `dev`).

## 4. Inspecting GitHub Actions & PR Audit Trail

Use `gh` CLI with bounded output:

```powershell
$env:GIT_TERMINAL_PROMPT=0
gh pr list --state all --limit 5
gh run list --limit 5
```
