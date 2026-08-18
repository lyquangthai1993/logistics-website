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
and **propose creating a Git feature branch** before starting implementation.

---

## Objective

Prevent large features from being developed directly on `main`/`develop`,
ensuring each feature has its own isolated branch for:
- Easy code review (Pull Request)
- Simple rollback if issues arise
- No disruption to existing working features
- Clean CI/CD pipeline

---

## Step 1 - Analyze the Task

When receiving a new task or feature, the agent MUST **score it against the criteria table** below:

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
| < 3 | OK: Proceed on current branch - small task, no separate branch needed |
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
|  FEATURE BRANCH PROPOSAL                                         |
+------------------------------------------------------------------+
|  Branch   : feature/<scope>-<description>                        |
|  Score    : X  (threshold >= 6 = mandatory proposal)            |
|                                                                  |
|  Reasons  :                                                      |
|    - Reason 1 (e.g. 2 new DB entities added)                    |
|    - Reason 2 (e.g. API contract changes)                        |
|    - Reason 3 if applicable                                      |
|                                                                  |
|  Estimated files affected: N files                               |
|    backend/src/...                                               |
|    frontend/src/...                                              |
|                                                                  |
|  Command  :                                                      |
|    git checkout -b feature/<scope>-<description>                 |
+------------------------------------------------------------------+
```

---

## Step 4 - Wait for User Confirmation

After presenting the proposal, **STOP** and wait for the user to respond:

```
Would you like to create branch "feature/xxx" before starting?

  [A] Create branch now and start implementation
  [B] Use a different branch name (user types name)
  [C] Skip - work directly on current branch (I understand the risk)
```

> IMPORTANT: Do NOT start writing code or creating files until the user confirms their choice.

---

## Step 5 - Execute After User Confirmation

### If user selects [A] or [B]:

```bash
# 1. Check current branch
git status
git branch --show-current

# 2. Pull latest so the new branch starts from up-to-date code
git pull origin main   # or develop, depending on project

# 3. Create and switch to new branch
git checkout -b feature/<scope>-<description>

# 4. Confirm switch was successful
git branch --show-current
```

After branch creation, report to the user:

```
OK  Branch created: feature/<scope>-<description>
>>  Currently on  : feature/<scope>-<description>
>>  Starting implementation...
```

Then continue with the assigned task.

### If user selects [C]:

Acknowledge and proceed directly, but add a warning:

```
WARN: Working directly on branch: <current-branch>
      Remember to commit frequently to enable easy rollback if needed.
```

---

## Special Cases

### Hotfix - Urgent Production Bug Fix

```bash
git checkout -b hotfix/<issue-description>
# Example: hotfix/login-crash-nullpointer
```

### Release Preparation

```bash
git checkout -b release/<version>
# Example: release/v1.2.0
```

### Spike or Technical Experiment

```bash
git checkout -b spike/<topic>
# Example: spike/websocket-realtime
```

---

## Integration with Other Skills

After completing implementation on the feature branch:

1. **Run E2E tests** - use skill `e2e-test-runner`
2. **Safe commit** - use skill `git-commit-reviewer`
3. **Update audit log** - use skill `codebase-auditor`

---

## Quick Reference

```bash
# Show current branch
git branch --show-current

# List all branches
git branch -a

# Create and switch to new branch
git checkout -b feature/<name>

# Push new branch to remote (when user explicitly requests)
git push -u origin feature/<name>
```
