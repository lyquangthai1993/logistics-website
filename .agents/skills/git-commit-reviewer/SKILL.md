---
name: git-commit-reviewer
description: >-
  Smart Git commit and push agent that audits staged changes before committing and safely manages remote pushes.
  Runs 2 parallel sub-agents: (1) Security & Rule Auditor – scans diffs for secrets, AGENTS.md violations, DB destructive ops, and code convention issues; (2) Commit Message Crafter – writes a Conventional Commits message.
  Handles Git Submodules (backend, frontend, root), enforces strict push safety rules (no force push, push only on explicit request, correct submodule-first push sequence). Use whenever staging, reviewing, committing, or pushing code.
  Triggers on mentions of "commit", "push", "git commit", "git push", "commit code", "push to git", "commit and push", "stage and commit", "save changes to git", or any Git version control actions.
---

# Git Commit & Push Reviewer – Skill Instructions

## Overview

This skill orchestrates a **safe, audited Git commit and push workflow** across the multi-repository Git Submodule architecture.
No commit is executed until the **Security & Rule Auditor** passes, and no push is performed without explicit user instruction and verified submodule push sequence.

---

## 🎯 Activation & Trigger Criteria

Activate this skill automatically whenever the user mentions or requests:
- **Commit actions**: "commit", "git commit", "commit code", "stage and commit", "create a commit", "lưu commit", "tạo commit"
- **Push actions**: "push", "git push", "push to git", "push code", "đẩy code", "push lên repo"
- **Combined workflows**: "commit and push", "commit and push to git", "commit code rồi push", "lưu và đẩy lên remote"
- **Pre-commit audits**: "review staged changes", "audit diff", "check commit safety"

---

## 🏗️ Architecture & Sub-Agents

```
Git Orchestrator (this skill)
├── Sub-Agent A: Security & Rule Auditor   ← Audits diffs, blocks commits on critical violations
├── Sub-Agent B: Commit Message Crafter    ← Generates Conventional Commits message
└── Push Safety Guard                     ← Enforces submodule-first push sequence & safety rules
```

---

## ⚠️ Core Invariant: Git Submodules Architecture

The workspace contains **3 independent Git Repositories**:

1. **Backend Submodule** (`backend/`): Repository `logistics-website-backend`
2. **Frontend Submodule** (`frontend/`): Repository `logistics-website-frontend`
3. **Root Repository** (`logistics-website`): Submodule pointers, documentation, `.agents/`, global configs

> 🚨 **CRITICAL SUBMODULE RULES**:
> 1. **Commit where the changes are**: Always `cd` into `backend/` or `frontend/` to stage and commit changes. Committing only at root does **NOT** record code changes in submodules.
> 2. **Submodule-first Push Order**: When pushing commits, **submodules MUST be pushed before the root repository**. Otherwise, remote root pointers will point to nonexistent commits on remote submodules.
> 3. **Never Force Push**: Never use `git push --force` or `git push -f`.

---

## 🔧 Automated Pre-commit Pipeline (Husky + lint-staged)

On every `git commit`, Husky and `lint-staged` run automatically before the agent audit:

| Stage | Tool | Scope | Action |
|-------|------|-------|--------|
| Format | `oxfmt --write` | `*.{js,jsx,ts,tsx,css,...}` | Auto-fix formatting in-place |
| Lint | `oxlint --fix` | `*.{js,jsx,ts,tsx}` | Auto-fix lint errors; **fails commit** on unfixable errors |

> Rules are configured in [`frontend/.oxlintrc.json`](file:///d:/Projects/logistics-website/frontend/.oxlintrc.json). If unfixable errors occur, abort and fix before re-attempting commit.

---

## 🚀 Step-by-Step Commit & Push Workflow

### Phase 1: Pre-Commit Identification & Staging

#### Step 1.1 – Identify Target Repositories
Check status across all 3 repositories:
```powershell
# Root repository
git status

# Backend submodule
cd backend; git status; cd ..

# Frontend submodule
cd frontend; git status; cd ..
```

#### Step 1.2 – Stage Changes in Appropriate Repository
- If changes belong to Backend:
  ```powershell
  cd backend
  git add <files> # or git add -u / git add .
  git diff --staged --stat
  git diff --staged
  cd ..
  ```
- If changes belong to Frontend:
  ```powershell
  cd frontend
  git add <files> # or git add -u / git add .
  git diff --staged --stat
  git diff --staged
  cd ..
  ```
- If changes belong to Root (docs, skills, configs):
  ```powershell
  git add <files>
  git diff --staged --stat
  git diff --staged
  ```
If nothing is staged → ask the user which files to stage.

---

### Phase 2: Dual Sub-Agent Audit

#### Step 2.1 – Spawn Sub-Agents Concurrently

- **Sub-Agent A: Security & Rule Auditor**
  > Prompt: "Audit the following `git diff --staged` output against all checklists in SKILL.md (Secrets, MCP configs, DB safety, Git safety, Code conventions). Return a structured report with: PASSED items, FAILED items (with file:line), and WARNINGS. Be concise and precise."

- **Sub-Agent B: Commit Message Crafter**
  > Prompt: "Read the `git diff --staged --stat` and diff context. Craft a Conventional Commits message adhering to `<type>(<scope>): <subject>` with optional body. Types: feat|fix|refactor|chore|docs|test|style|perf|ci|db|security. Max subject 72 chars. Return the exact commit message string."

#### Step 2.2 – Gate Decision Matrix

```
┌─────────────────────────┬────────────────────────────────────────────────────────┐
│ Auditor Result          │ Action                                                 │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ 🔴 ANY FAILED item      │ ⛔ STOP. Present violations to user. DO NOT COMMIT.    │
│                         │ Prompt user to fix or request explicit override.       │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ 🟡 WARNINGS only        │ ⚠️ Show warnings. Ask user: "Proceed with commit? [y/N]"│
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ 🟢 ALL PASSED           │ ✅ Proceed directly to commit execution.               │
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

#### Step 2.3 – Execute Commit
Inside the target repository directory:
```powershell
git commit -m "<message from Sub-Agent B>"
```

Display the commit confirmation:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Commit successful: <commit-hash>                 │
│  📁 Repository: [backend | frontend | root]          │
│  📋 Audit: N passed | N warnings | 0 failed         │
│  📝 Message: <type>(<scope>): <subject>              │
└─────────────────────────────────────────────────────┘
```

---

### Phase 3: Git Push Workflow (When Requested)

> 🛡️ **Push Governance Rule**: NEVER push code to remote unless:
> 1. The user explicitly requested to push (e.g. "push to git", "commit and push"), OR
> 2. The user explicitly approved a push prompt.

#### Step 3.1 – Submodule-First Push Sequence
When a push is requested, follow this strict sequence:

1. **Push Backend submodule** (if it has new commits):
   ```powershell
   cd backend
   $branch = (git branch --show-current)
   git push origin $branch
   cd ..
   ```

2. **Push Frontend submodule** (if it has new commits):
   ```powershell
   cd frontend
   $branch = (git branch --show-current)
   git push origin $branch
   cd ..
   ```

3. **Stage & Commit updated Submodule references in Root** (if submodules were committed):
   ```powershell
   git status # verify if 'backend' or 'frontend' submodule pointers changed
   git add backend frontend
   git commit -m "chore(submodules): update submodule pointers to latest commits"
   ```

4. **Push Root repository**:
   ```powershell
   $branch = (git branch --show-current)
   git push origin $branch
   ```

#### Step 3.2 – Push Verification & Reporting
After push completes, present the remote tracking status box and **a concise summary of pushed features/changes in Vietnamese** to the user:

```
┌─────────────────────────────────────────────────────┐
│  🚀 Git Push Completed Successfully                 │
├─────────────────────────────────────────────────────┤
│  📦 Backend  : origin/<branch> [Up-to-date]          │
│  🎨 Frontend : origin/<branch> [Up-to-date]          │
│  🌐 Root     : origin/<branch> [Up-to-date]          │
└─────────────────────────────────────────────────────┘
```

**Vietnamese Summary Requirement (Bắt buộc kèm theo khi báo cáo cho user)**:
The agent MUST include a concise summary written in Vietnamese detailing what was pushed:

```markdown
### 🚀 Tóm tắt các thay đổi vừa đẩy lên Git:
- **Backend**: [Tóm tắt ngắn gọn các API, Entities, Migrations, hoặc Business Logic vừa đẩy]
- **Frontend**: [Tóm tắt ngắn gọn UI, Components, Pages, Hooks hoặc tối ưu hóa vừa đẩy]
- **Root / Config**: [Cập nhật con trỏ submodule, tài liệu, rules/skills nếu có]
```

---

## 🔍 Security & Convention Checklist (Auditor Reference)

### 🔴 CRITICAL – Auto-block commit (FAILED)

#### 1. Secrets & Credentials
- [ ] No `.env` files staged (`.env`, `.env.*`, `.env.local`, `.env.production`)
- [ ] No hardcoded API keys, JWT secrets, database credentials, or tokens in diff
- [ ] Patterns to block: `sk-`, `pk_`, `AIza`, `AKIA`, `ghp_`, `password =`, `secret =`, `Bearer <literal-token>`
- [ ] No private keys or certificates (`*.pem`, `*.key`, `*.p12`, `id_rsa`, `id_ed25519`)

#### 2. MCP Configuration Files (from AGENTS.md)
- [ ] No `mcp.json`, `mcp_config.json/yaml`
- [ ] No `.mcp/` directory contents
- [ ] No `claude_desktop_config.json`, `.cursor/mcp.json`, `.gemini/mcp*.json`, `windsurf_mcp.json`
- [ ] No JSON/YAML file containing top-level `"mcpServers"` key

#### 3. Database Safety (from AGENTS.md)
- [ ] No destructive SQL: `DROP DATABASE`, `DROP TABLE`, `TRUNCATE TABLE` (unless explicit seed)
- [ ] No `synchronize: true` in TypeORM `DataSource` configuration
- [ ] No raw `DELETE FROM` queries without a `WHERE` clause

#### 4. Git Operations Safety
- [ ] No `--force` or `-f` flags in scripts or commands
- [ ] No committed git credentials or personal access tokens in git remotes/configs

---

### 🟡 WARNING – Flag for User Review

#### Frontend Conventions (Next.js 15 + oxlint)
- [ ] No leftover `console.log()` (oxlint forbids `console.log`; only `warn`/`error` allowed)
- [ ] No untyped `any` (`@typescript-eslint/no-explicit-any`)
- [ ] No unused imports or variables
- [ ] Tabler icons imported from `@/components/icons` (not directly from `@tabler/icons-react`)
- [ ] Forms use `useAppForm` / `form.AppField` pattern
- [ ] Search parameters use `nuqs` (not raw `useSearchParams`)

#### Backend Conventions (NestJS 11)
- [ ] API inputs validated with DTO classes and `class-validator`
- [ ] Business logic encapsulated in Services, not Controllers
- [ ] Entities decorated with proper TypeORM annotations
- [ ] JWT and RBAC guards present on protected routes (`@UseGuards(AuthGuard('jwt'))`, `@Roles(...)`)

#### General Cleanliness
- [ ] No lingering `TODO:` or `FIXME:` comments added without issue reference
- [ ] No commented-out code blocks (>5 lines)
- [ ] No unintended binary files outside `public/`

---

## 📝 Conventional Commits Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) v1.0 specification:

```
<type>(<scope>): <subject>

[optional body – explain WHY this change was made, not just WHAT]

[optional footer: BREAKING CHANGE, Closes #issue]
```

### Supported Types
| Type | Use Case |
|------|----------|
| `feat` | New user-facing feature, API endpoint, or UI component |
| `fix` | Bug fix or error resolution |
| `refactor` | Code refactoring without behavioral changes |
| `chore` | Dependency updates, tooling, configuration |
| `docs` | Documentation changes only |
| `test` | E2E, integration, or unit test changes |
| `style` | Code formatting, style adjustments (no logic change) |
| `perf` | Performance improvements |
| `ci` | CI/CD pipeline and automation updates |
| `db` | Database migrations, schemas, or seed files |
| `security` | Security patches, auth enforcement, CVE fixes |

### Allowed Scopes
`auth` | `orders` | `trips` | `fleet` | `warehouse` | `admin` | `ui` | `api` | `middleware` | `e2e` | `deps` | `submodules` | `config`

---

## ⚡ CLI Quick Reference (PowerShell & Bash)

```powershell
# --- SUBMODULE COMMITS ---
# Backend
cd backend
git status
git add -A
git diff --staged --stat
git commit -m "feat(orders): add bulk import endpoint"
cd ..

# Frontend
cd frontend
git status
git add -A
git diff --staged --stat
git commit -m "feat(orders): add bulk import modal UI"
cd ..

# Root (submodule updates & docs)
git add backend frontend docs/
git commit -m "chore(submodules): update backend and frontend pointers"

# --- SAFE PUSH SEQUENCE ---
# 1. Push Submodules First
cd backend; git push origin (git branch --show-current); cd ..
cd frontend; git push origin (git branch --show-current); cd ..

# 2. Push Root
git push origin (git branch --show-current)
```

---

## 🚨 Override & Rollback Protocol

### Override Protocol (When User Requests Bypass)
1. Agent outputs the exact violation with `file:line` reference.
2. Agent requests explicit confirmation and reason:
   > *"Violation: Hardcoded URL found in file.ts:15. Please confirm override reason."*
3. Agent includes the override annotation in the commit body:
   ```
   AUDIT-OVERRIDE: <user provided reason>
   ```

### Rollback / Undo Quick Reference
```powershell
# Unstage files without losing changes
git restore --staged <file>

# Undo the last commit but keep changes staged
git reset --soft HEAD~1

# Undo the last commit and unstage changes (keep working tree files)
git reset HEAD~1
```
