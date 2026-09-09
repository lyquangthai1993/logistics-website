---
name: e2e-test-runner
description: >-
  Orchestrates E2E Playwright test sessions for the Logistics TMS frontend.
  Runs 4 core suites (Runtime Tracer, Console Health, Login Flow, RBAC) plus
  an automated Viewport & Table UX suite (testing horizontal scrollability, column
  pinning, and zero body overflow across common breakpoints and sidebar states).
---

# E2E Test Runner – Orchestration Skill

## Overview

This skill orchestrates end-to-end (E2E) testing sessions for the Logistics TMS frontend using Playwright.
The frontend is architected on top of the **[next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)** baseline.

---

## 🏗️ Agent Architecture

```
Orchestrator Agent (this skill)
├── Sub-Agent D: Runtime Log Tracer         → e2e/00-runtime-log-tracer.spec.ts  ← RUN FIRST
├── Sub-Agent A: Console Health Inspector   → e2e/01-console-health.spec.ts
├── Sub-Agent B: Login Flow Tester          → e2e/02-login-flow.spec.ts (Auth & Error Sanitization)
├── Sub-Agent C: RBAC Route Guard Validator → e2e/03-rbac-routing.spec.ts
└── Sub-Agent E: Viewport & Table UX Suite  → e2e/11-*-no-hscroll.spec.ts (or responsive specs)
```

> **Sub-Agent D runs first** — surfaces backend/network issues early to prevent cascading timeouts in B, C, and E.
> **Sub-Agent B strictly validates Error Sanitization** — asserts localized Vietnamese error messages and verifies that raw technical keys/codes (e.g. `incorrectEmailOrPassword`, `notFound`, `emailNotExists`, `email:`, `password:`) are NEVER rendered in the UI.

---

## 📐 Table UX & Horizontal Scroll Philosophy (CRITICAL)

Based on the `next-shadcn-dashboard-starter` sourcebase, data tables with extensive columns (Orders, Trips, Vehicles, Fleet) must provide a flawless user experience across all screen sizes.

### ⚠️ Common Pitfalls vs. Expected Behavior

| Case | What Happened | Verdict | Expected Behavior |
|------|---------------|---------|-------------------|
| **Body Overflow** | `body.scrollWidth > window.innerWidth` | ❌ **CRITICAL BUG** | Page body must **NEVER** scroll horizontally (`overflow-x: hidden` / `max-w-full`). |
| **Squished / Clipped Table** | Table forced to 100% width, headers like "Thao tác" truncated to "Thao tá", badges cut off | ❌ **BAD UX BUG** | Table columns must maintain minimum readable widths; content must not be destructively clipped. |
| **Table Horizontal Scroll** | Table container (`data-slot="scroll-area-viewport"`) has `scrollWidth > clientWidth` with smooth horizontal scrollbar | ✅ **EXPECTED & INTENDED** | When screen width or open sidebar constrains space, the **table inside its container MUST scroll horizontally**. |
| **Column Pinning** | Action column (`actions`) stays sticky on the right while scrolling table data | ✅ **EXPECTED & INTENDED** | TanStack column pinning (`columnPinning: { right: ['actions'] }`) must stay accessible while scrolling. |

---

## 🖥️ Viewport Matrix & Sidebar Impact

When testing tables (such as `/dashboard/orders`), you **MUST** test both **Sidebar States** across **Common Breakpoints**:

| Breakpoint | Viewport Width | Sidebar State | Available Content Width | Table Scroll Expectation |
|------------|----------------|---------------|-------------------------|--------------------------|
| **Laptop S** | `1024px` | **Expanded** (16rem / 256px) | **~720px** | **MUST scroll horizontally** (7+ columns cannot fit in 720px without scroll). |
| **Laptop S** | `1024px` | **Collapsed** (3rem / 48px) | **~930px** | May scroll or fit depending on column sizes. |
| **Laptop M** | `1200px` / `1280px` | **Expanded** (16rem / 256px) | **~896px – ~976px** | **MUST scroll smoothly** without squishing text/badges. |
| **Laptop M** | `1200px` / `1280px` | **Collapsed** (3rem / 48px) | **~1102px – ~1186px** | Fits comfortably or scrolls smoothly if table is wide. |
| **Desktop** | `1440px` | **Expanded** / **Collapsed** | **~1152px – ~1342px** | Clean layout, zero clipping. |
| **Full HD** | `1920px` | **Expanded** / **Collapsed** | **~1614px – ~1822px** | Full layout visibility. |

> 💡 **Sidebar Toggle**: Click `[data-slot="sidebar-trigger"]` to switch between `expanded` (16rem) and `collapsed` (3rem icon-only).

---

## ⚠️ Critical Selector Rules for AI Agents

Shadcn UI with `@base-ui/react` (2026 version) uses specific data attributes:

```typescript
// ✅ CORRECT Selectors
const SCROLL_VIEWPORT = '[data-slot="scroll-area-viewport"]';
const SCROLLBAR_HORIZONTAL = '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]';
const SIDEBAR = '[data-slot="sidebar"]';
const SIDEBAR_TRIGGER = '[data-slot="sidebar-trigger"]';
const SIDEBAR_INSET = '[data-slot="sidebar-inset"]';

// ❌ INCORRECT / OBSOLETE Selectors (DO NOT USE)
// '[data-radix-scroll-area-viewport]'  <- Will fail (attribute does not exist)
// locator('[data-orientation="horizontal"]').evaluate(...) <- Times out if element is hidden
```

### Why `page.evaluate()` is mandatory for hidden scrollbars:
Playwright's `locator.evaluate()` waits for elements to be visible before executing. When a horizontal scrollbar is hidden (e.g. `opacity: 0`), `locator.evaluate()` **times out after 30s**. Always inspect scrollbar visibility using `page.evaluate(() => { ... })`.

---

## 📁 Test File Structure

```
frontend/
├── playwright.config.ts
├── e2e/
│   ├── helpers/
│   │   ├── auth.ts                   # loginAs(), TEST_USERS, collectConsoleLogs()
│   │   └── runtime-logs.ts           # captureRuntimeLogs(), checkBackendHealth()
│   ├── 00-runtime-log-tracer.spec.ts # Sub-Agent D (API 4xx/5xx, SSR crashes, latency)
│   ├── 01-console-health.spec.ts    # Sub-Agent A (Console errors, JS exceptions)
│   ├── 02-login-flow.spec.ts        # Sub-Agent B (Authentication for 4 roles)
│   ├── 03-rbac-routing.spec.ts      # Sub-Agent C (Route guards & role matrices)
│   └── 11-orders-table-no-hscroll.spec.ts # Sub-Agent E (Viewport x Sidebar Matrix)
└── playwright-report/                # HTML reports & screenshot artifacts
```

---

## 🚀 Step-by-Step Testing Workflow

Every E2E test session MUST follow this 4-step sequence:

```
Step 1: Start Dev Servers (Root folder: npm run dev)
   │
   ▼
Step 2: Pre-Flight Health Check (frontend/: npm run e2e:check)
   │
   ▼
Step 3: Run Playwright Test Suites (frontend/: npm run e2e or targeted specs)
   │
   ▼
Step 4: Review Reports & Teardown (frontend/: npm run e2e:report)
```

---

### Step 1: Start Dev Servers at Root Folder (`npm run dev`)

E2E tests require **BOTH** the NestJS Backend (`http://localhost:3001`) and the Next.js Frontend (`http://localhost:3000`) to be running.
Always use the root orchestrator instead of manually launching each folder:

```bash
# In ROOT folder: d:\Projects\logistics-website
npm run dev
```

#### What `npm run dev` does under the hood (`scripts/start-dev.js`):
1. **Spawns NestJS Backend** (`npm run start:dev` inside `./backend` on port `3001`).
2. **Polls Backend Health Endpoint** (`http://localhost:3001/api`) with a 2-minute timeout until active.
3. **Spawns Next.js Frontend** (`npm run dev` inside `./frontend` on port `3000`) once backend is ready.
4. **Multiplexes Logs** with color tags (`[BACKEND]` in blue, `[FRONTEND]` in magenta).
5. **Unified Lifecycle**: Sending `Ctrl+C` (SIGINT/SIGTERM) gracefully shuts down both child processes together.

> 💡 **For AI Agents / Automated Runners**:
> If servers are not already running, execute `npm run dev` from root directory as a background task (`IsDaemon: true`). Wait for logs confirming both Backend and Frontend have initialized before running tests.

---

### Step 2: Pre-Flight Server Verification

Before running Playwright, always verify both servers are responsive:

```bash
# In frontend folder: d:\Projects\logistics-website\frontend
cd frontend
npm run e2e:check
# (Runs node scripts/check-servers.mjs to verify ports 3000 & 3001)
```

- If check **FAILS**: Return to Step 1 and run `npm run dev` at the root folder.
- If check **PASSES**: Proceed to Step 3.

---

### Step 3: Run Playwright Test Suites

Execute test suites from the `frontend/` directory:

```bash
# In frontend folder: d:\Projects\logistics-website\frontend

# ── A. Run Server & Runtime Log Tracer (RUN FIRST) ──
npx playwright test e2e/00-runtime-log-tracer.spec.ts

# ── B. Run Individual Core Suites ──
npm run e2e:console      # Sub-Agent A: Console health & JS exceptions (01-console-health.spec.ts)
npm run e2e:login        # Sub-Agent B: Login flow & error sanitization (02-login-flow.spec.ts)
npm run e2e:rbac         # Sub-Agent C: RBAC routing & route guards (03-rbac-routing.spec.ts)
npm run e2e:websocket    # Real-time WebSocket notifications (06c-websocket-realtime-notification.spec.ts)
npm run e2e:multi-account# Multi-account dispatch & notification sync (06b-realtime-multi-account-notification.spec.ts)

# ── C. Run Viewport & Table UX Matrix ──
npx playwright test e2e/11-orders-table-no-hscroll.spec.ts

# ── D. Run ALL Test Suites ──
npm run e2e              # Automatically runs pre-flight check then executes all specs

# ── E. Debug / Headed Mode ──
npm run e2e:debug        # Launches Playwright Inspector in headed browser
```

---

### Step 4: View Reports & Teardown

```bash
# In frontend folder:
npm run e2e:report
# or: npx playwright show-report playwright-report
```

- **Inspect Failures**: The HTML report contains action traces, network waterfalls, console logs, and visual screenshots.
- **Teardown**: Press `Ctrl+C` in the root terminal running `npm run dev` to stop both backend and frontend servers cleanly.

---

## 👥 Test Credentials

| Role | Env Var Prefix | Default Email |
|------|---------------|---------------|
| SUPER_ADMIN | `E2E_SUPER_ADMIN_*` | lyquangthai1993+1@gmail.com |
| DISPATCHER | `E2E_DISPATCHER_*` | lyquangthai1993+2@gmail.com |
| FLEET_MANAGER | `E2E_FLEET_MANAGER_*` | lyquangthai1993+3@gmail.com |
| WAREHOUSE_MANAGER | `E2E_WAREHOUSE_MANAGER_*` | lyquangthai1993+4@gmail.com |

Default password: `secret` (configured in `.env.local`).

---

## 🤖 Orchestration & Triage Protocol

1. **Pre-flight Port Gate & Clean Restart Protocol (MANDATORY STEP 0)**:
   - **Always clean restart dev servers** whenever middleware/proxy (`src/proxy.ts`), core auth stores, or server configs are changed to avoid stale Turbopack/Next.js memory caches.
   - **Verify server status**: Run `npm run e2e:check` inside `frontend/` (or `node scripts/check-servers.mjs`).
   - If **either server is offline**:
     1. Navigate to root directory: `d:\Projects\logistics-website`.
     2. Run `npm run dev` (spawns `scripts/start-dev.js` which boots NestJS on 3001, waits for healthy state, then boots Next.js on 3000).
     3. Verify `npm run e2e:check` passes before launching test runner.
   - If a port is occupied by a zombie process on Windows:
     ```powershell
     netstat -ano | findstr :3000
     netstat -ano | findstr :3001
     taskkill /PID <PID> /F
     ```
2. **Infra Gate**:
   - Run Sub-Agent D (`00-runtime-log-tracer.spec.ts`). If it fails, check backend API latency and SSR error overlays.
3. **Table UX Gate**:
   - Verify `body.scrollWidth <= viewport.width` (no global page overflow).
   - Verify table renders cleanly without truncated text or clipped action buttons.
   - Verify horizontal scrolling is enabled within the table container when content exceeds width.
4. **Capture Visual Evidence**: Always save screenshots at each breakpoint (`playwright-report/<page>-<width>px-sidebar-<state>.png`) for visual verification.
