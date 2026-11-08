---
name: feature-branch-advisor
description: >-
  Enforces active feature branch discipline across Git submodules (RULE-GIT-HISTORY-RESUME-01).
  At the start of every session, traces Git history to switch from dev/master back to the previous
  active feature branch (npm run repo:resume), or creates a new feature branch off dev for a brand-new task.
  Triggers: new feature, new module, redesign, integration, breaking change, or any code change when on dev/master.
---

# Feature Branch Advisor - Skill Instructions

This skill ensures that **zero code is ever committed or pushed directly to `dev` or `master`**, and that every session either **resumes the previous active feature branch from Git history (`npm run repo:resume`)** or creates a dedicated feature branch in the appropriate **Git Submodule(s)** before starting implementation.

---

## ⚠️ CORE INVARIANT: Git Submodules & Active Feature Branch Recovery (`RULE-GIT-HISTORY-RESUME-01`)

This project consists of **3 independent Git Repositories**:

1. **Root Repository** (`d:\Projects\logistics-website`): Global configurations, `.agents/`, `docs/`, `CODEBASE_AUDIT.md`.
2. **Backend Submodule** (`backend/`): Repo `logistics-website-backend` (Base branch: `dev`).
3. **Frontend Submodule** (`frontend/`): Repo `logistics-website-frontend` (Base branch: `dev`).

> 🚨 **MANDATORY SESSION-START RULE**:
> 1. **Never work, commit, or push directly on `dev` or `master`** — even for 1-line fixes!
> 2. **Trace Git History First**: At the start of every Antigravity chat session, run `npm run repo:status` and `npm run repo:tracking`. If any repository (`root`, `backend/`, `frontend/`) is currently sitting on `dev` or `master`, trace back Git history (`git reflog` + `git for-each-ref --sort=-committerdate`) to find the primary feature branch worked on previously, and switch back to it immediately using:
>    ```powershell
>    npm run repo:resume
>    # (Executes: node scripts/git-task-workflow.mjs resume)
>    ```
> 3. **Submodule Isolation**: When creating a brand-new feature branch for a new task, branch creation **MUST be performed inside the target submodule directory** (`backend/` and/or `frontend/`) as well as `root`.

---

## Step 1 - Session Start: Resume Active Feature Branch OR Create New Task Branch

When starting a session or receiving a task, the agent MUST first check the current branch and Git history:

```powershell
$env:GIT_TERMINAL_PROMPT=0
npm run repo:status
```

### Case A: Continuing Ongoing Work / Follow-up Adjustments in Session
If the user is continuing work or requesting adjustments, and any repo is currently on `dev` or `master`, **immediately recover the previous feature branch from Git history**:

```powershell
npm run repo:resume
```
This automatically checks out the last pushed feature branch (e.g. `feat/task-116-...`) across `backend/`, `frontend/`, and `root`, and fast-forwards any newer `dev` commits into it.

### Case B: Starting a Brand-New Task
If the user explicitly assigns a brand-new task ID / feature, create a new branch off `dev` using the 4-part taxonomy:

```
<type>/task-<id>-<module>-<action>
```

```powershell
node scripts/git-task-workflow.mjs start <task_id> <module> <action> <type> <scope>
```

---

## Quick Reference for Submodules

```powershell
# 1. Check status & trace last active feature branch across all 3 repos
npm run repo:status
npm run repo:tracking

# 2. Automatically switch from dev/master back to the previous feature branch in Git history
npm run repo:resume

# 3. Create a brand-new feature branch from dev for a new task
node scripts/git-task-workflow.mjs start <task_id> <module> <action> feat fullstack
```
