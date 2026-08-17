---
name: e2e-test-runner
description: >-
  Orchestrates E2E Playwright test sessions for the Logistics TMS frontend.
  Spawns 2–3 specialized sub-agents: Console Health Inspector, Login Flow Tester,
  and RBAC Route Guard Validator. Use when checking browser errors, testing
  login/logout flows for all 4 roles, or verifying middleware route enforcement.
---

# E2E Test Runner – Orchestration Skill

## Overview

This skill orchestrates multi-agent E2E test sessions using Playwright.
The **Orchestrator Agent** spawns **2–3 Sub-Agents** for parallelized, scoped testing.

---

## 🏗️ Agent Architecture

```
Orchestrator Agent (this skill)
├── Sub-Agent A: Console Health Inspector   → e2e/01-console-health.spec.ts
├── Sub-Agent B: Login Flow Tester          → e2e/02-login-flow.spec.ts
└── Sub-Agent C: RBAC Route Guard Validator → e2e/03-rbac-routing.spec.ts
```

---

## 📁 Test File Structure

```
frontend/
├── playwright.config.ts          # E2E config (baseURL, reporter, timeout)
├── e2e/
│   ├── helpers/
│   │   └── auth.ts               # Shared login helpers, TEST_USERS, collectConsoleLogs()
│   ├── 01-console-health.spec.ts # Sub-Agent A
│   ├── 02-login-flow.spec.ts     # Sub-Agent B
│   └── 03-rbac-routing.spec.ts   # Sub-Agent C
└── playwright-report/            # HTML + JSON reports (after run)
```

---

## 🚀 Running Tests

### Prerequisite
- Frontend dev server must be running on `http://localhost:3000`
- Run from `frontend/` directory

### Commands

```bash
# Run all E2E tests (sequential, recommended)
npx playwright test

# Run a specific sub-agent scope
npx playwright test e2e/01-console-health.spec.ts   # Console Health only
npx playwright test e2e/02-login-flow.spec.ts        # Login Flow only
npx playwright test e2e/03-rbac-routing.spec.ts      # RBAC Routing only

# Show interactive HTML report
npx playwright show-report playwright-report

# Debug mode (headed browser)
npx playwright test --headed --debug
```

---

## 👥 Test Credentials

Credentials are resolved from environment variables (`.env.local`), falling back to seed defaults:

| Role | Env Var Prefix | Default Email |
|------|---------------|---------------|
| SUPER_ADMIN | `E2E_SUPER_ADMIN_*` | admin@spiderexpress.vn |
| DISPATCHER | `E2E_DISPATCHER_*` | ducanh@spiderexpress.vn |
| FLEET_MANAGER | `E2E_FLEET_MANAGER_*` | fleet@spiderexpress.vn |
| WAREHOUSE_MANAGER | `E2E_WAREHOUSE_MANAGER_*` | warehouse@spiderexpress.vn |

Add to `frontend/.env.local` (never commit to git):
```
E2E_SUPER_ADMIN_EMAIL=admin@spiderexpress.vn
E2E_SUPER_ADMIN_PASSWORD=Admin@123
E2E_DISPATCHER_EMAIL=ducanh@spiderexpress.vn
E2E_DISPATCHER_PASSWORD=Dispatcher@123
E2E_FLEET_MANAGER_EMAIL=fleet@spiderexpress.vn
E2E_FLEET_MANAGER_PASSWORD=Fleet@123
E2E_WAREHOUSE_MANAGER_EMAIL=warehouse@spiderexpress.vn
E2E_WAREHOUSE_MANAGER_PASSWORD=Warehouse@123
```

---

## 🤖 Orchestrator Workflow (Agent Instructions)

When a user asks to "run E2E tests" or "check the app for errors":

### Step 1 – Pre-flight Check
- Confirm `http://localhost:3000` is accessible (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`)
- Confirm `frontend/playwright.config.ts` exists

### Step 2 – Spawn Sub-Agents Concurrently

**Sub-Agent A (Console Health Inspector)**
- Prompt: "Run `npx playwright test e2e/01-console-health.spec.ts` in `frontend/` and report all browser console errors and warnings found. Identify which are known issues vs. new critical errors."
- Role: Detects browser-side runtime errors, font issues, JS exceptions

**Sub-Agent B (Login Flow Tester)**
- Prompt: "Run `npx playwright test e2e/02-login-flow.spec.ts` in `frontend/` and report per-role login results. Note which roles succeed, which fail, and any UI errors."
- Role: Validates authentication for all 4 roles

**Sub-Agent C (RBAC Route Guard Validator)**
- Prompt: "Run `npx playwright test e2e/03-rbac-routing.spec.ts` in `frontend/` and report the access matrix results. Note any routes that incorrectly allow or block access."
- Role: Verifies middleware RBAC enforcement

### Step 3 – Aggregate & Report

Orchestrator compiles a unified status table:

```
| Test Suite         | Status | Passed | Failed | Warnings |
|--------------------|--------|--------|--------|----------|
| Console Health     | ✅/❌  | N      | N      | N        |
| Login Flow         | ✅/❌  | N      | N      | -        |
| RBAC Routing       | ✅/❌  | N      | N      | -        |
```

### Step 4 – Triage & Fix

For each failure found:
1. Identify root cause (console output, screenshot, trace)
2. Propose minimal fix
3. Ask user for approval before applying

---

## ⚠️ Known Issues (Tracked)

| Issue | File | Severity | Status |
|-------|------|----------|--------|
| `Failed to find font override values for font 'Google Sans Flex'` | `font.config.ts` | Low | Open – non-blocking |

> To fix: Replace `Google Sans Flex` with `Google Sans` (or remove from `next/font/google` import).
> `Google Sans Flex` is a variable font not yet supported by `next/font/google`.
