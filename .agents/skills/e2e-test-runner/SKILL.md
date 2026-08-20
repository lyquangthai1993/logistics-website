---
name: e2e-test-runner
description: >-
  Orchestrates E2E Playwright test sessions for the Logistics TMS frontend.
  Spawns 3–4 specialized sub-agents: Console Health Inspector, Login Flow Tester,
  RBAC Route Guard Validator, and Runtime Terminal Log Tracer. Use when checking
  browser errors, testing login/logout flows for all 4 roles, verifying middleware
  route enforcement, or tracing server-side API/SSR errors.
---

# E2E Test Runner – Orchestration Skill

## Overview

This skill orchestrates multi-agent E2E test sessions using Playwright.
The **Orchestrator Agent** spawns **3–4 Sub-Agents** for parallelized, scoped testing.

---

## 🏗️ Agent Architecture

```
Orchestrator Agent (this skill)
├── Sub-Agent D: Runtime Log Tracer         → e2e/00-runtime-log-tracer.spec.ts  ← RUN FIRST
├── Sub-Agent A: Console Health Inspector   → e2e/01-console-health.spec.ts
├── Sub-Agent B: Login Flow Tester          → e2e/02-login-flow.spec.ts
└── Sub-Agent C: RBAC Route Guard Validator → e2e/03-rbac-routing.spec.ts
```

> **Sub-Agent D runs first** — if the backend is unreachable or login credentials are wrong, D will surface this early and prevent cascading timeouts in B and C.

---

## 📁 Test File Structure

```
frontend/
├── playwright.config.ts             # E2E config (baseURL, reporter, timeout)
├── e2e/
│   ├── helpers/
│   │   ├── auth.ts                  # Shared login helpers, TEST_USERS, collectConsoleLogs()
│   │   └── runtime-logs.ts          # captureRuntimeLogs(), checkBackendHealth(), detectNextJsErrorOverlay()
│   ├── 00-runtime-log-tracer.spec.ts # Sub-Agent D ← NEW: server-side runtime error tracing
│   ├── 01-console-health.spec.ts    # Sub-Agent A
│   ├── 02-login-flow.spec.ts        # Sub-Agent B
│   └── 03-rbac-routing.spec.ts      # Sub-Agent C
└── playwright-report/               # HTML + JSON reports (after run)
```

---

## 🔍 What Each Sub-Agent Captures

| Sub-Agent | Source | What It Catches |
|-----------|--------|-----------------|
| **D — Runtime Log Tracer** | Network response interception | 4xx/5xx API errors, slow requests (>3s), Next.js SSR error overlays, NestJS backend health |
| **A — Console Health** | `page.on('console')` | JS exceptions, browser-side warnings, font issues |
| **B — Login Flow** | UI + navigation | Auth credential failures, redirect failures, JWT token storage |
| **C — RBAC Routing** | Middleware redirect behavior | Route guard enforcement per role |

> ⚠️ **Gap explained**: Browser console (`page.on('console')`) only captures client-side errors.
> Server-side errors (Next.js SSR crashes, NestJS 500s, DB failures) are **silent** in the console.
> Sub-Agent D fills this gap via **response status interception** + **DOM overlay detection**.

---

## 🚀 Running Tests

### Prerequisite
- Frontend dev server must be running on `http://localhost:3000`
- Backend (NestJS) must be running on `http://localhost:3001` (or configured `NEXT_PUBLIC_API_URL`)
- Run from `frontend/` directory

### Commands

```bash
# Run all E2E tests (recommended order — D first to catch infra issues early)
npx playwright test e2e/00-runtime-log-tracer.spec.ts
npx playwright test e2e/01-console-health.spec.ts
npx playwright test e2e/02-login-flow.spec.ts
npx playwright test e2e/03-rbac-routing.spec.ts

# Run all at once
npx playwright test e2e/00-runtime-log-tracer.spec.ts e2e/01-console-health.spec.ts e2e/02-login-flow.spec.ts e2e/03-rbac-routing.spec.ts

# Show interactive HTML report
npx playwright show-report playwright-report

# Debug mode (headed browser)
npx playwright test --headed --debug

# Inspect a failure trace
npx playwright show-trace "test-results/<folder>/trace.zip"
```

---

## 👥 Test Credentials

Credentials are resolved from environment variables (`.env.local`), falling back to seed defaults:

| Role | Env Var Prefix | Default Email |
|------|---------------|---------------|
| SUPER_ADMIN | `E2E_SUPER_ADMIN_*` | lyquangthai1993+1@gmail.com |
| DISPATCHER | `E2E_DISPATCHER_*` | lyquangthai1993+2@gmail.com |
| FLEET_MANAGER | `E2E_FLEET_MANAGER_*` | lyquangthai1993+3@gmail.com |
| WAREHOUSE_MANAGER | `E2E_WAREHOUSE_MANAGER_*` | lyquangthai1993+4@gmail.com |

Add to `frontend/.env.local` (never commit to git):
```
E2E_SUPER_ADMIN_EMAIL=lyquangthai1993+1@gmail.com
E2E_SUPER_ADMIN_PASSWORD=secret
E2E_DISPATCHER_EMAIL=lyquangthai1993+2@gmail.com
E2E_DISPATCHER_PASSWORD=secret
E2E_FLEET_MANAGER_EMAIL=lyquangthai1993+3@gmail.com
E2E_FLEET_MANAGER_PASSWORD=secret
E2E_WAREHOUSE_MANAGER_EMAIL=lyquangthai1993+4@gmail.com
E2E_WAREHOUSE_MANAGER_PASSWORD=secret
```

---

## 🤖 Orchestrator Workflow (Agent Instructions)

When a user asks to "run E2E tests" or "check the app for errors":

### Step 1 – Pre-flight Check
- Confirm `http://localhost:3000` is accessible
- Confirm `frontend/playwright.config.ts` exists
- Check that `e2e/helpers/runtime-logs.ts` exists (new helper)

### Step 2 – Spawn Sub-Agents Concurrently

**Sub-Agent D (Runtime Log Tracer)** ← Run first or in parallel, report first
- Prompt: "Run `npx playwright test e2e/00-runtime-log-tracer.spec.ts` in `frontend/` and report: (1) backend health check result + latency, (2) any 4xx/5xx API errors during login flows, (3) any Next.js SSR error overlays detected, (4) any API requests exceeding 3s. This is the server-side error tracer — distinct from browser console errors."
- Role: Detects backend unavailability, API 500s, SSR crashes, slow endpoints

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
| Test Suite          | Status | Passed | Failed | Warnings |
|---------------------|--------|--------|--------|----------|
| Runtime Log Tracer  | ✅/❌  | N      | N      | N        |
| Console Health      | ✅/❌  | N      | N      | N        |
| Login Flow          | ✅/❌  | N      | N      | -        |
| RBAC Routing        | ✅/❌  | N      | N      | -        |
```

### Step 4 – Triage & Fix

For each failure found:
1. Identify root cause (console output, screenshot, trace)
2. **Check Sub-Agent D first** — if backend is unreachable, Login + RBAC failures are cascade effects
3. Propose minimal fix
4. Ask user for approval before applying

---

## ⚠️ Known Issues (Tracked)

| Issue | File | Severity | Status |
|-------|------|----------|--------|
| `Failed to find font override values for font 'Google Sans Flex'` | `font.config.ts` | Low | Open – non-blocking |

> To fix: Replace `Google Sans Flex` with `Google Sans` (or remove from `next/font/google` import).
> `Google Sans Flex` is a variable font not yet supported by `next/font/google`.

---

## 🔬 Triage Guide: Login Timeout (Most Common Failure)

If Sub-Agent B reports `page.waitForURL timeout` for all roles:

**Step 1 — Check Sub-Agent D output first**
- Is `NestJS backend reachable`? → If NO: start backend server
- Are there 5xx errors on `POST /api/v1/auth/email/login`? → backend crash

**Step 2 — Verify credentials**
- Are the `E2E_*_EMAIL` / `E2E_*_PASSWORD` vars in `.env.local` matching seeded users?
- Test manually: `curl -X POST http://localhost:3001/api/v1/auth/email/login -d '{"email":"...","password":"..."}' -H "Content-Type: application/json"`

**Step 3 — Check Next.js API route**
- Does `frontend/src/app/api/auth/[...nextauth]` or the custom sign-in action call the correct backend URL?
- Is `NEXT_PUBLIC_API_URL` / `BACKEND_URL` set in `.env.local`?
