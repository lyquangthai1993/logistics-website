---
name: codebase-auditor
description: >-
  Audits, synthesizes, and updates the versioned CODEBASE_AUDIT.md report whenever
  new modules, features, migrations, or business domain changes are introduced in Logistics TMS.
  Use when: (1) completing a new feature, (2) surveying existing system capabilities,
  or (3) preparing a new business module and bumping the report version.
---

# Codebase Auditor Skill — Logistics TMS

This skill guides agents in **auditing the source base** and maintaining a **versioned audit record** in [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md) at the project root.

---

## 🎯 When to Use This Skill

- When the user asks "what does the system currently have?", "audit the codebase", or "summarize the source base"
- When a new module, endpoint, or feature has just been completed and needs documentation
- When preparing to build a new business flow and needing to verify current architecture state
- When bumping version in `CODEBASE_AUDIT.md` after a sprint, milestone, or deployment

---

## 📋 Execution Workflow

### Step 1 — Determine Audit Mode

| User Request Type | Execution Mode |
|---|---|
| "Summarize current source base", "Full system survey" | **FULL AUDIT** |
| "Update audit doc for module X", "Feature completed" | **INCREMENTAL UPDATE** |
| "Check existing capabilities before implementing Y" | **FULL AUDIT** |
| "Bump version after deployment" | **INCREMENTAL UPDATE** |

---

### Step 2 — Collect Source Information

#### Mode A: FULL AUDIT
Spawn **2 parallel research subagents**:

**Subagent 1 — Backend Auditor:**
- Scan `backend/src/` for:
  1. All modules and folder structure
  2. Entities, DB tables, key columns, DTOs, controllers, and services
  3. Custom guards, decorators, and auth strategies
  4. Migrations history (`src/database/migrations/`)
  5. Enums and domain constants

**Subagent 2 — Frontend Auditor:**
- Scan `frontend/src/` for:
  1. All App Router pages (`src/app/**/page.tsx`)
  2. Zustand stores (name, state, persistence)
  3. TanStack Query API hooks (`src/features/**/api.ts`)
  4. Middleware RBAC mapping (`src/proxy.ts` / `middleware.ts`)
  5. Navigation configuration (`src/config/nav-config.ts`)

#### Mode B: INCREMENTAL UPDATE
Inspect only the files related to the latest changes:
- New backend module: entity, DTOs, controller, service, migration
- New frontend feature: page component, API client, navigation entry
- Current `CODEBASE_AUDIT.md` to identify latest version

---

### Step 3 — Determine the New Version

Follow Semantic Versioning guidelines:

| Change Type | Version Bump |
|---|---|
| New backend module (entity + CRUD endpoints) | `MINOR` (`0.x.0` → `0.(x+1).0`) |
| New frontend page (page + API integration) | `MINOR` |
| Bug fixes, minor enhancements, field additions | `PATCH` (`0.x.y` → `0.x.(y+1)`) |
| Major business milestone (Orders + Trips + Hubs + Dispatch flow) | `MAJOR` (`x.0.0` → `(x+1).0.0`) |

---

### Step 4 — Update `CODEBASE_AUDIT.md`

1. **Header Metadata**: Update `Phiên bản` and `Ngày audit` (ISO date).
2. **Changelog**: Prepend new version entry to the top of `🗂️ CHANGELOG PHIÊN BẢN`.
3. **Module & Migration Tables**:
   - Add new backend modules to the **BACKEND — MODULES & DB TABLES** table.
   - Add newly executed migrations to the **Migrations đã chạy** table.
   - Add new frontend routes to the **FRONTEND — PAGES & FEATURES** table.
   - Remove completed items from **NGHIỆP VỤ CHƯA TRIỂN KHAI**.
4. **Enums**: Keep domain enum definitions up to date.

---

### Step 5 — Report Summary to User

Provide a concise update:
- Version transition (`vOld` → `vNew`)
- Summary of documented changes
- Remaining pending features
- Direct link to [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md)

---

## ⚠️ Invariant Rules (STRICT)

1. **NEVER delete past changelog entries** — always prepend to the top.
2. **NEVER decrement version numbers** — strictly increment.
3. **NEVER list unexecuted migrations** in the migrations table.
4. **NEVER mark incomplete features as completed (✅)**.
5. **Always update the audit date** on file modification.
