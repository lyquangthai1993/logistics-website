---
name: feature-branch-advisor
description: >-
  Evaluates incoming tasks and automatically proposes a new Git feature branch
  when the task is large enough or risks affecting existing code. Activates when
  receiving a new task, large feature, new module design, or architectural change.
  Triggers: new feature, new module, redesign, integration, breaking change,
  or tasks spanning more than 3 source files.
---

# Feature Branch Advisor - Skill Instructions

This skill guides the agent to **assess the impact** of a new task or feature
and **propose creating a Git feature branch** in the appropriate **Git Submodule(s)** before starting implementation.

---

## ⚠️ CORE INVARIANT: Git Submodules Architecture

This project consists of **3 independent Git Repositories**:

1. **Root Repository** (`d:\Projects\logistics-website`): Global configurations, `.agents/`, `docs/`, `CODEBASE_AUDIT.md`.
2. **Backend Submodule** (`backend/`): Repo `logistics-website-backend` (Base branch: `dev`).
3. **Frontend Submodule** (`frontend/`): Repo `logistics-website-frontend` (Base branch: `dev`).

> 🚨 **MANDATORY**: Feature branch creation **MUST be performed directly inside the target submodule directory** (`backend/` and/or `frontend/`).
> - Creating a branch at root does **NOT** switch branches in `backend/` or `frontend/`.
> - If task is backend-only → Create branch inside `backend/`.
> - If task is frontend-only → Create branch inside `frontend/`.
> - If task is fullstack → Create identical branch names inside BOTH `backend/` and `frontend/`.

---

## Objective

Prevent large features from being developed directly on `main`/`dev`,
ensuring each feature has its own isolated branch in its respective submodule for:
- Easy code review (Pull Request per repository)
- Simple rollback if issues arise
- No disruption to existing working features
- Clean CI/CD pipeline

---

## Step 1 - Analyze the Task & Identify Target Submodules

When receiving a new task or feature, the agent MUST:
1. **Identify the affected Submodules**:
   - `[BACKEND]` if modifying `backend/src/...`
   - `[FRONTEND]` if modifying `frontend/src/...`
   - `[FULLSTACK]` if modifying both `backend/` and `frontend/`
   - `[ROOT]` if modifying root documentation, scripts, or agents
2. **Score against the impact criteria table**:

### Impact Assessment Criteria

| Criterion | Score |
|-----------|-------|
| Changes 3 or more source files (excluding tests and docs) | +2 |
| Adds new Entity, Model, or DB Table | +3 |
| Adds or modifies DB migration | +3 |
| Adds new NestJS Module (controller + service) | +2 |
| Adds new Next.js page or route | +2 |
| Changes API contract (new endpoint or response shape) | +2 |
| Modifies Auth or RBAC logic | +3 |
| Adds or modifies shared component affecting multiple pages | +2 |
| Modifies Zustand store or global state | +2 |
| Integrates third-party service (webhook, payment, SMS) | +3 |
| Changes infrastructure config (env vars, docker, CI/CD) | +2 |
| Breaking change to API contract (frontend or backend) | +4 |
| Task only modifies 1-2 small files with no cross-module impact | -3 |

### Decision Thresholds

| Total Score | Decision |
|-------------|----------|
| < 3 | OK: Proceed on current branch (`dev`) - small task, no separate branch needed |
| 3 to 5 | WARN: Recommend creating a branch - medium task, isolation preferred |
| >= 6 | BLOCK: MUST propose feature branch creation before writing any code |

---

## Step 2 - Name the Branch

When a new branch is needed, use this naming convention:

```
feature/<scope>-<short-description>
```

### Naming Rules

- **Standard prefixes**: `feature/`, `fix/`, `refactor/`, `chore/`, `release/`
- **Scope** (project-specific): `auth`, `orders`, `trips`, `fleet`, `warehouse`, `admin`, `ui`, `api`, `notification`, `billing`, `reporting`
- **Short description**: kebab-case, English, concise - max 4 words
- **Avoid**: spaces, special characters, accented characters

### Good Branch Name Examples

```bash
feature/orders-bulk-import        # Bulk order import feature
feature/fleet-vehicle-tracking    # Real-time vehicle tracking
feature/auth-refresh-rotation     # JWT refresh token rotation
feature/warehouse-inventory-sync  # Warehouse inventory sync
feature/notification-webhook      # Webhook notification integration
feature/admin-rbac-matrix         # Admin permission matrix
refactor/api-response-schema      # Standardize API response schema
fix/orders-weight-calculation     # Fix weight calculation bug
```

---

## Step 3 - Present the Proposal

When a branch is needed, the agent MUST display this block BEFORE making any code changes:

```
+------------------------------------------------------------------+
|  FEATURE BRANCH PROPOSAL (GIT SUBMODULES)                        |
+------------------------------------------------------------------+
|  Branch Name : feature/<scope>-<description>                     |
|  Score       : X  (threshold >= 6 = mandatory proposal)          |
|  Target Repo : [backend | frontend | fullstack (both)]           |
|                                                                  |
|  Reasons     :                                                   |
|    - Reason 1 (e.g. 2 new DB entities added)                     |
|    - Reason 2 (e.g. API contract changes)                         |
|                                                                  |
|  Estimated files affected:                                       |
|    backend/src/...                                               |
|    frontend/src/...                                              |
|                                                                  |
|  Execution Commands:                                             |
|    # For Backend:                                                |
|    cd backend && git checkout -b feature/<scope>-<description>   |
|    # For Frontend (if applicable):                               |
|    cd frontend && git checkout -b feature/<scope>-<description>  |
+------------------------------------------------------------------+
```

---

## Step 4 - Wait for User Confirmation

After presenting the proposal, **STOP** and wait for the user to respond:

```
Would you like to create branch "feature/xxx" in the target submodule(s) before starting?

  [A] Create branch now in target submodule(s) and start implementation
  [B] Use a different branch name (user types name)
  [C] Skip - work directly on current branch (I understand the risk)
```

> ⚠️ **IMPORTANT**: Do NOT start writing code or creating files until the user confirms their choice.

---

## Step 5 - Execute After User Confirmation

### If user selects [A] or [B]:

#### Case 1: Backend Only Task
```powershell
cd backend
git checkout dev
git pull origin dev
git checkout -b feature/<scope>-<description>
git branch --show-current
cd ..
```

#### Case 2: Frontend Only Task
```powershell
cd frontend
git checkout dev
git pull origin dev
git checkout -b feature/<scope>-<description>
git branch --show-current
cd ..
```

#### Case 3: Fullstack Task (Both Backend & Frontend)
```powershell
# 1. Backend submodule
cd backend
git checkout dev
git pull origin dev
git checkout -b feature/<scope>-<description>
cd ..

# 2. Frontend submodule
cd frontend
git checkout dev
git pull origin dev
git checkout -b feature/<scope>-<description>
cd ..
```

After branch creation, report clearly to the user:

```
OK  Branch created: feature/<scope>-<description>
>>  Backend submodule  : on branch feature/<scope>-<description>
>>  Frontend submodule : on branch feature/<scope>-<description>
>>  Starting implementation...
```

Then continue with the assigned task.

### If user selects [C]:

Acknowledge and proceed directly, but add a warning:

```
WARN: Working directly on branch: <current-branch> in submodules.
      Remember to commit frequently to enable easy rollback if needed.
```

---

## Integration with Other Skills

After completing implementation on the feature branch:

1. **Run E2E tests** - use skill [`e2e-test-runner`](file:///d:/Projects/logistics-website/.agents/skills/e2e-test-runner/SKILL.md)
2. **Safe commit per submodule** - use skill [`git-commit-reviewer`](file:///d:/Projects/logistics-website/.agents/skills/git-commit-reviewer/SKILL.md) (commit inside `backend/` and/or `frontend/`)
3. **Update audit log** - use skill [`codebase-auditor`](file:///d:/Projects/logistics-website/.agents/skills/codebase-auditor/SKILL.md)

---

## Quick Reference for Submodules

```powershell
# Check status across all submodules
git status
cd backend; git status; cd ..
cd frontend; git status; cd ..

# Check current branch in each submodule
cd backend; git branch --show-current; cd ..
cd frontend; git branch --show-current; cd ..

# Switch submodule back to dev
cd backend; git checkout dev; git pull origin dev; cd ..
cd frontend; git checkout dev; git pull origin dev; cd ..
```
