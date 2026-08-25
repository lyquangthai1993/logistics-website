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

## 🚀 Commands & Execution

```bash
# 0. MUST RUN FIRST: Mandatory Pre-Flight Server Check (Verifies http://localhost:3000 & http://localhost:3001 are UP)
node scripts/check-servers.mjs
# or: npm run e2e:check

# 1. Run server & network health check first
npx playwright test e2e/00-runtime-log-tracer.spec.ts

# 2. Run core auth & health suites
npx playwright test e2e/01-console-health.spec.ts
npx playwright test e2e/02-login-flow.spec.ts
npx playwright test e2e/03-rbac-routing.spec.ts

# 3. Run Viewport & Table UX Matrix
npx playwright test e2e/11-orders-table-no-hscroll.spec.ts

# Run all suites (automatically executes pre-flight check first)
npm run e2e

# View interactive HTML report with failure traces & screenshots
npx playwright show-report playwright-report
```

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
   - **ALWAYS** run `node scripts/check-servers.mjs` (or `npm run e2e:check`) before executing any Playwright spec.
   - Probes `http://localhost:3000` (Frontend Next.js) and `http://localhost:3001` (Backend NestJS).
   - If **either server is offline**, START both servers using root package.json:
     - `npm run dev` (runs `start-dev.js` orchestrator from root folder `d:\Projects\logistics-website`)
2. **Infra Gate**:
   - Run Sub-Agent D (`00-runtime-log-tracer.spec.ts`). If it fails, check backend API latency and SSR error overlays.
3. **Table UX Gate**:
   - Verify `body.scrollWidth <= viewport.width` (no global page overflow).
   - Verify table renders cleanly without truncated text or clipped action buttons.
   - Verify horizontal scrolling is enabled within the table container when content exceeds width.
4. **Capture Visual Evidence**: Always save screenshots at each breakpoint (`playwright-report/<page>-<width>px-sidebar-<state>.png`) for visual verification.
