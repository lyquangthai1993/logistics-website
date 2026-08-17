---
name: git-commit-reviewer
description: >-
  Smart Git commit agent that audits staged changes before committing.
  Runs 2 parallel sub-agents: (1) Security & Rule Auditor – scans diffs for
  secrets, AGENTS.md violations, DB destructive ops, code convention issues;
  (2) Commit Message Crafter – writes a Conventional Commits message.
  Only commits after both sub-agents pass. Use whenever you need to stage,
  review, and commit code changes safely.
---

# Git Commit Reviewer – Skill Instructions

## Overview

This skill orchestrates a **safe, audited Git commit flow** using 2 sub-agents.
No commit is executed until the **Security & Rule Auditor** gives a clean signal.

---

## 🏗️ Agent Architecture

```
Orchestrator (this skill)
├── Sub-Agent A: Security & Rule Auditor   ← blocks commit on violations
└── Sub-Agent B: Commit Message Crafter    ← writes Conventional Commit msg
```

---

## 🔧 Automated Pre-commit Pipeline (Husky + lint-staged)

The following run **automatically** on every `git commit` via Husky **before** the agent audit:

| Stage | Tool | Scope | Action |
|-------|------|-------|--------|
| Format | `oxfmt --write` | `*.{js,jsx,ts,tsx,css,...}` | Auto-fix formatting in-place |
| Lint | `oxlint --fix` | `*.{js,jsx,ts,tsx}` | Auto-fix lint errors; **fails commit** on unfixable errors |

> `oxlint` is the project's ESLint-compatible linter (Rust-based, ~50× faster than ESLint).
> Rules are defined in [`frontend/.oxlintrc.json`](file:///d:/Projects/logistics-website/frontend/.oxlintrc.json).
> If `oxlint --fix` cannot auto-fix an error, the commit is **aborted** and the agent reports the violation.

---

## 🚀 Orchestrator Workflow (Step-by-Step)

### Step 0 – Collect Staged Diff
```bash
# Run from repo root
git diff --staged --stat          # summary of changed files
git diff --staged                 # full diff for audit
```
If nothing is staged → ask the user which files to `git add`.

### Step 1 – Spawn Sub-Agents Concurrently

**Sub-Agent A: Security & Rule Auditor**
> Prompt: "Audit the following `git diff --staged` output against all checklists
> in the SKILL.md Security & Convention Checklist section. Return a structured
> report: PASSED items, FAILED items (with file+line), WARNINGS. Be concise."

**Sub-Agent B: Commit Message Crafter**
> Prompt: "Read the `git diff --staged --stat` output and craft a Conventional
> Commits message (type(scope): subject + optional body). Types: feat|fix|
> refactor|chore|docs|test|style|perf|ci. Keep subject ≤ 72 chars. Return only
> the final commit message string."

### Step 2 – Gate Decision

```
If Sub-Agent A reports ANY FAILED item:
  → STOP. Present violations to user. Do NOT commit.
  → Ask: "Fix these issues first, or override? (override requires explicit confirmation)"

If Sub-Agent A reports only WARNINGS:
  → Show warnings. Ask user: "Proceed with commit? [y/N]"

If Sub-Agent A: ALL PASSED:
  → Auto-proceed to Step 3
```

### Step 3 – Execute Commit (only after gate passes)
```bash
git commit -m "<message from Sub-Agent B>"
```
Show the commit hash and summary after success.

### Step 4 – Post-Commit Report
Present a compact summary table to the user:

```
┌─────────────────────────────────────────────────────┐
│  ✅ Commit successful: abc1234                       │
│  📋 Audit: N passed | N warnings | 0 failed         │
│  📝 Message: feat(auth): add JWT refresh rotation    │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Security & Convention Checklist (Sub-Agent A Reference)

Sub-Agent A MUST scan the staged diff against ALL items below.

### 🔴 CRITICAL – Auto-block commit (FAILED)

#### Secrets & Credentials
- [ ] No `.env` file staged (`.env`, `.env.*`, `.env.local`, `.env.production`)
- [ ] No hardcoded secrets in diff: API keys, tokens, passwords, private keys
  - Patterns: `sk-`, `pk_`, `AIza`, `AKIA`, `ghp_`, `password =`, `secret =`, `Bearer <literal-token>`
- [ ] No `*.pem`, `*.key`, `*.p12` files staged
- [ ] No `id_rsa`, `id_ed25519` files staged

#### Database Safety (from AGENTS.md)
- [ ] No `DROP DATABASE` or `DROP TABLE` in any staged file
- [ ] No `TRUNCATE TABLE` statements (unless in `seeds/` folder and user confirms)
- [ ] No `synchronize: true` in TypeORM DataSource config files
- [ ] No raw `DELETE FROM` without `WHERE` clause

#### Git Safety (from AGENTS.md)
- [ ] Commit does not include `--force` push instructions in any script

#### Critical File Protection
- [ ] `AGENTS.md` modifications → flag for user review (WARNING, not block)
- [ ] Migration files (`.migration.ts`) → flag for user review (WARNING)
- [ ] `data-source.ts` modifications → flag for user review (WARNING)

---

### 🟡 WARNING – Flag but allow with user confirmation

#### Code Convention (Frontend – from CLAUDE.md & oxlintrc)
- [ ] No `console.log()` (only `console.warn` / `console.error` allowed per oxlint)
- [ ] No `@typescript-eslint/no-explicit-any` → avoid `any` type (warn)
- [ ] No unused imports or variables
- [ ] Single quotes used (not double quotes) in TS/TSX files
- [ ] No 2-space-indent violations visible in diff
- [ ] No direct imports from `@tabler/icons-react` (must import from `@/components/icons`)
- [ ] Forms use `useAppForm` / `form.AppField` pattern (not raw `useState`)
- [ ] URL params use `nuqs` (not `useState`/`useSearchParams` directly)
- [ ] No `<Heading>` imported manually (use `PageContainer` props)

#### Code Convention (Backend – from nestjs-best-practices)
- [ ] New API endpoints have DTO class with `class-validator` decorators
- [ ] No business logic in controllers (belongs in services)
- [ ] New entities have proper TypeORM decorators (`@Entity`, `@Column`, `@PrimaryGeneratedColumn`)
- [ ] No hardcoded DB connection strings (use `ConfigModule`/env vars)
- [ ] Auth-protected routes have `@UseGuards(AuthGuard('jwt'))` + `@Roles()` decorators

#### General Quality
- [ ] No debug/test `console.log` left in production code
- [ ] No `TODO:` or `FIXME:` comments added in diff (flag, not block)
- [ ] No commented-out blocks of code (>5 lines)
- [ ] No binary files accidentally staged (`.jpg`, `.png` etc. outside `public/`)

---

### 🟢 INFO – Annotate in report only

- List all new files added
- List all deleted files
- List all migration files touched
- Summarize total lines added/removed per component (frontend/backend)

---

## 📝 Commit Message Format (Sub-Agent B Reference)

Use [Conventional Commits](https://www.conventionalcommits.org/) v1.0:

```
<type>(<scope>): <subject>

[optional body – explain WHY, not WHAT]

[optional footer: BREAKING CHANGE, Closes #issue]
```

### Types & Scopes

| Type | When to use |
|------|-------------|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `refactor` | Code restructure, no behavior change |
| `chore` | Tooling, deps, config |
| `docs` | Documentation only |
| `test` | E2E or unit tests |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `db` | Migration or seed files |
| `security` | Security patch or auth change |

### Scopes (project-specific)
`auth` | `orders` | `trips` | `fleet` | `warehouse` | `admin` | `ui` | `api` | `middleware` | `e2e` | `deps`

### Examples
```
feat(auth): implement JWT refresh token rotation
fix(orders): correct weight calculation on bulk import
db(fleet): add vehicle_type column migration
security(middleware): enforce RBAC on /dashboard/admin route
test(e2e): add RBAC routing validator for WAREHOUSE_MANAGER
chore(deps): upgrade playwright to v1.62
```

---

## ⚡ Quick Command Reference

```bash
# Stage specific files
git add <file1> <file2>

# Stage all tracked changes
git add -u

# Stage all (tracked + new files)
git add .

# Review what's staged before sub-agents run
git diff --staged --stat
git diff --staged

# Unstage a file if auditor flags it
git restore --staged <file>

# After commit – verify
git log --oneline -5
```

---

## 🚨 Override Protocol

If user wants to override a FAILED audit item:
1. Agent lists the specific violation with file + line
2. Agent asks: **"Override reason?"** – user must provide explicit text
3. Agent adds override annotation to commit body:
   ```
   AUDIT-OVERRIDE: <user's reason>
   ```
4. Commit proceeds with override note logged
