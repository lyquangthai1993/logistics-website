---
name: e2e-test-runner
description: >-
  Orchestrates E2E Playwright test sessions for the Logistics TMS frontend.
  Runs 4 core suites (Runtime Tracer, Console Health, Login Flow, RBAC) plus
  an automated Viewport & Table UX suite (testing horizontal scrollability, column
  pinning, and zero body overflow across common breakpoints and sidebar states).
  Includes the Fast Pagination-Aware Trip/Order Lookup Protocol (findTripFast / readTablePagination).
---

# E2E Test Runner – Orchestration Skill

## Overview

This skill orchestrates end-to-end (E2E) testing sessions for the Logistics TMS frontend using Playwright.
The frontend is architected on top of the **[next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)** baseline.

---

## 🏗️ Agent Architecture

```
Orchestrator Agent (this skill)
├── Sub-Agent D: Runtime Log Tracer          → e2e/00-runtime-log-tracer.spec.ts  ← RUN FIRST
├── Sub-Agent A: Console & Next.js Error Guard → e2e/01-console-health.spec.ts (Next.js Dev Overlay & Telemetry Guard)
├── Sub-Agent B: Login Flow Tester           → e2e/02-login-flow.spec.ts (Auth & Error Sanitization)
├── Sub-Agent C: RBAC Route Guard Validator  → e2e/03-rbac-routing.spec.ts
├── Sub-Agent E: Viewport & Table UX Suite   → e2e/11-*-no-hscroll.spec.ts (or responsive specs)
└── Sub-Agent F: Visual & Pen Matching Agent → e2e/13-*-visual-validation.spec.ts (Pencil .pen Matcher)
```

> **Sub-Agent D runs first** — surfaces backend/network issues early to prevent cascading timeouts in B, C, and E.
> **Sub-Agent A strictly validates Next.js Dev Health** — intercepts Next.js `<nextjs-portal>` dev error overlays, Turbopack redbox dialogs, and dehydrated query rejections (see [`nextjs-error-auditor`](../nextjs-error-auditor/SKILL.md)).
> **Sub-Agent B strictly validates Error Sanitization** — asserts localized Vietnamese error messages and verifies that raw technical keys/codes (e.g. `incorrectEmailOrPassword`, `notFound`, `emailNotExists`, `email:`, `password:`) are NEVER rendered in the UI.
> **Sub-Agent F strictly validates Visual & Design Pen Matching** — captures screenshots of all screens/modals and cross-checks them against vector design specs in `pencil-workspace/pens/*.pen` (evaluating width constraints, #0F3D62 Navy headers, column layouts, dynamic counter pills, and zero redundant icons). Read [`visual-pen-matcher`](../visual-pen-matcher/SKILL.md) for the 5-dimension rubric.

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

## ⚡ Fast Trip & Order Lookup in Paginated Tables (Zero-Stuck Pagination Protocol)

### Why `/e2e-gate` & E2E Tests Get Stuck Looking for a `TRIP` Code (`SD...` / `TRIP-...`)
1. **All operational list views are paginated**: `/dashboard/warehouse/inbound` (`15/page`), `/dashboard/warehouse/outbound` (`20/page`), `/dashboard/warehouse/orders` (`15/page`), and `/dashboard/trips` (`10/page`).
2. **`PENDING` trips sort ahead of `COMPLETED` trips**: Completed trips (e.g., `SD365`, `SD328`, `SD49`) are frequently pushed to **Page 2, 3, or 4**. Calling `await page.locator('text=SD365').click()` blindly on Page 1 will hang until timeout (15s–30s).
3. **Search inputs require `Enter` or clicking the Search button**: Calling `await searchInput.fill('SD365')` alone only updates local state; `appliedSearch` is only sent to the backend when pressing `Enter` (`await searchInput.press('Enter')`) or clicking `button[title="Nhấn để tìm kiếm"]`.

### Mandatory Fast Lookup Helpers (`e2e/helpers/auth.ts` & `e2e/helpers/pagination.ts`)
Whenever a test needs to locate or click a `TRIP` code (`SD...`) or `Order` code (`NMT...`), **NEVER** write a raw Page-1-only locator wait. Always use the built-in fast pagination helpers:

```typescript
import {
  loginAs,
  findTripFast,
  findTripInPaginatedTable,
  openTripFromPaginatedTable,
  findOrderInPaginatedTable,
  readTablePagination
} from './helpers/auth';

// 1. Find a TRIP fast (< 1s) and click it:
const tripLoc = await findTripFast(page, 'SD365');
await tripLoc.click();

// 2. Or find + click + wait for the Trip Detail Modal in one call:
const dialog = await openTripFromPaginatedTable(page, 'SD365');

// 3. Inspect current pagination bar ("Trang X / Y", total items) directly:
const pag = await readTablePagination(page);
console.log(`Current page: ${pag.currentPage}/${pag.totalPages} (total=${pag.totalItems})`);
```

### How `findTripFast` / `findTripInPaginatedTable` Works Under the Hood (4-Step Fast Path)
1. **Step 1 — Instant Page 1 Check (0ms overhead)**: Waits for table load (`waitForTableLoaded`) and checks if `tripCode` is already visible on the current page.
2. **Step 2 — Read Bottom Pagination Bar (`Trang X / Y`)**: Calls `readTablePagination(page)` to parse `Trang X / Y` (or `Page X of Y`) and total item count (`1–15 / N chuyến xe`) at the bottom of the table.
3. **Step 3 — Fast Path A ($O(1)$ Search + `Enter`)**: Fills `input[placeholder*="Tìm"]` with `tripCode`, presses `Enter`, and clicks `button[title="Nhấn để tìm kiếm"]` to bring the target trip directly to Page 1 Row 1 in a single request.
4. **Step 4 — Fast Path B (Pagination Walk `Trang 1 -> Trang Y`) & Date Filter Expansion**:
   - If searching for a second trip after a previous search, automatically clears stale search (`button[title="Xóa tìm kiếm"]`) and resets to Page 1 (`button[title="Trang đầu"]`).
   - Reads `totalPages` (`Y`) from `Trang X / Y` at the bottom of the table and steps through `Trang 1 .. min(totalPages, 10)` via `button[title="Trang sau"]` (`›`).
   - If still not found, clicks the `Tất cả` date filter button to include older trips.

---

## 📁 Test File Structure

```
frontend/
├── playwright.config.ts
├── e2e/
│   ├── helpers/
│   │   ├── auth.ts                   # loginAs(), TEST_USERS, collectConsoleLogs(), re-exports pagination helpers
│   │   ├── pagination.ts             # findTripFast(), findTripInPaginatedTable(), openTripFromPaginatedTable(), readTablePagination()
│   │   └── runtime-logs.ts           # captureRuntimeLogs(), checkBackendHealth()
│   ├── 00-runtime-log-tracer.spec.ts # Sub-Agent D (API 4xx/5xx, SSR crashes, latency)
│   ├── 01-console-health.spec.ts    # Sub-Agent A (Console errors, JS exceptions)
│   ├── 02-login-flow.spec.ts        # Sub-Agent B (Authentication for 4 roles)
│   ├── 03-rbac-routing.spec.ts      # Sub-Agent C (Route guards & role matrices)
│   ├── 11-orders-table-no-hscroll.spec.ts # Sub-Agent E (Viewport x Sidebar Matrix)
│   └── 13-warehouse-ui-visual-validation.spec.ts # Sub-Agent F (Visual & Pen Canvas Matching)
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

### Step 1: Dev Servers & Environment Selection (2-Round Testing Architecture)

Logistics TMS enforces a mandatory **2-Tier Quality Gate (2-Round Testing Protocol)**:
- **Round 1 (Local Gate)**: Executed against local dev servers (`http://localhost:4000` & `http://localhost:4001`) before code is committed to GitHub.
- **Round 2 (Cloud Dev Gate)**: Executed against live Railway Cloud Dev (`https://frontend-tms-core-dev.up.railway.app` & `https://backend-tms-core-dev.up.railway.app`) after PR is merged into `dev`.

#### Local Dev Servers at Root Folder (`npm run dev`)
E2E tests in Round 1 require **BOTH** the NestJS Backend (`http://localhost:4001`) and the Next.js Frontend (`http://localhost:4000`) to be running.
Always use the root orchestrator instead of manually launching each folder:

```bash
# In ROOT folder: d:\Projects\logistics-website
npm run dev
```

#### What `npm run dev` does under the hood (`scripts/start-dev.js`):
1. **Spawns NestJS Backend** (`npm run start:dev` inside `./backend` on port `4001`).
2. **Polls Backend Health Endpoint** (`http://localhost:4001/api`) with a 2-minute timeout until active.
3. **Spawns Next.js Frontend** (`npm run dev` inside `./frontend` on port `4000`) once backend is ready.
4. **Multiplexes Logs** with color tags (`[BACKEND]` in blue, `[FRONTEND]` in magenta).
5. **Unified Lifecycle**: Sending `Ctrl+C` (SIGINT/SIGTERM) gracefully shuts down both child processes together.

> 💡 **For AI Agents / Automated Runners**:
> If servers are not already running, execute `npm run dev` from root directory as a background task (`IsDaemon: true`). Wait for logs confirming both Backend and Frontend have initialized before running tests.

---

### Step 2: Pre-Flight Server Verification (Local Round 1)

Before running Playwright locally, always verify both servers are responsive:

```bash
# In frontend folder: d:\Projects\logistics-website\frontend
cd frontend
npm run e2e:check
# (Runs node scripts/check-servers.mjs to verify ports 4000 & 4001)
```

- If check **FAILS**: Return to Step 1 and run `npm run dev` at the root folder.
- If check **PASSES**: Proceed to Step 3.

---

### Step 3: Run Playwright Test Suites (Dual-Round Execution)

#### 🔄 ROUND 1: Local E2E Gate (Pre-PR Verification)
```bash
# In frontend folder: d:\Projects\logistics-website\frontend
$env:PLAYWRIGHT_BASE_URL="http://localhost:4000"
$env:API_URL="http://localhost:4001/api/v1"

# Run target spec for the task:
npx playwright test e2e/<task_spec>.spec.ts

# Autonomous Self-Healing: If failed, fix code locally (up to 3 retries) until 100% PASS.
# Hand off to /e2e-code-auditor for Round 1 static inspection:
node ../scripts/e2e-auditor.mjs e2e/<task_spec>.spec.ts
```

#### 🌐 ROUND 2: Cloud Dev Gate (Post-PR Merge & Railway Deploy)
Triggered once PR is merged into `dev` and Railway Cloud Dev is healthy (HTTP 200):
```bash
# In frontend folder: d:\Projects\logistics-website\frontend
$env:PLAYWRIGHT_BASE_URL="https://frontend-tms-core-dev.up.railway.app"
$env:API_URL="https://backend-tms-core-dev.up.railway.app/api/v1"

# Run test on live cloud environment:
npx playwright test e2e/<task_spec>.spec.ts

# Capture non-empty visual evidence:
# Must save to feedbacks/feedback_DD_MM*/screenshot_*_verified.png

# Hand off to /e2e-code-auditor for Round 2 evidence certification:
node ../scripts/e2e-auditor.mjs e2e/<task_spec>.spec.ts
```

---

#### ── General Core Test Commands ──
```bash
# In frontend folder:
npm run e2e:console      # Sub-Agent A: Console health & JS exceptions (01-console-health.spec.ts)
npm run e2e:login        # Sub-Agent B: Login flow & error sanitization (02-login-flow.spec.ts)
npm run e2e:rbac         # Sub-Agent C: RBAC routing & route guards (03-rbac-routing.spec.ts)
npm run e2e:websocket    # Real-time WebSocket notifications (06c-websocket-realtime-notification.spec.ts)
npm run e2e:multi-account# Multi-account dispatch & notification sync (06b-realtime-multi-account-notification.spec.ts)
npx playwright test e2e/11-orders-table-no-hscroll.spec.ts # Viewport & Table UX Matrix
npx playwright test e2e/13-warehouse-ui-visual-validation.spec.ts # Visual & Pen Canvas Matching
npm run e2e              # Run all test specs
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
4. **Capture Visual Evidence**: Always save screenshots at each breakpoint (`playwright-report/<page>-<width>px-sidebar-<state>.png` or `feedbacks/feedback_DD_MM*/screenshot_*_verified.png`) for visual verification.
5. **Dev Domain & Cloud Endpoint Anti-Hang Rule (Primary: Railway Cloud)**:
   - Primary Dev Backend: `https://backend-tms-core-dev.up.railway.app`
   - Primary Dev Frontend: `https://frontend-tms-core-dev.up.railway.app`
   - Secondary / Fallback: `https://logistics-website-backend-1jho.onrender.com`
   - NEVER ping or check health using bare `curl -s` without timeout.
   - Always use `curl.exe -m 15 -i <url>` or pass `{ signal: AbortSignal.timeout(15000) }` in Node/Playwright.
   - Polling capped at max 5 attempts (15-20s backoff). NEVER loop indefinitely.
6. **Collaboration Protocol with /todo-agent & /e2e-code-auditor**:
   - **Hand-off From `/todo-agent` (Round 1 - Local Gate)**:
     - `/todo-agent` completes code changes -> calls `/e2e-test-runner` with local params.
     - Runs Playwright tests against `http://localhost:4000` & `http://localhost:4001/api/v1`.
     - Autonomous Self-Healing loop runs up to 3 times if errors occur.
     - Upon 100% PASS, notifies `/e2e-code-auditor` to audit test code (`node scripts/e2e-auditor.mjs`).
   - **Hand-off From `/todo-agent` (Round 2 - Cloud Dev Gate)**:
     - PR is auto-merged into `dev` and Railway deployment is ready (HTTP 200).
     - `/todo-agent` calls `/e2e-test-runner` with Cloud Dev domains.
     - Executes Playwright test suite against live Railway Cloud.
     - Saves non-empty verified screenshot `screenshot_*_verified.png`.
     - Hands off to `/e2e-code-auditor` for final audit score & evidence validation before `/todo-agent` generates `RESOLUTION.md`.
7. **Model Role Allocation in Test Execution & Autonomous Self-Healing**:
   - ⚡ **Orchestration, Execution & Log Tracing**: Sử dụng **Gemini 2.5 Flash / Gemini 3.8 Flash** để điều phối lệnh test, theo dõi console log, kiểm tra server readiness (`npm run e2e:check`) và trích xuất trace lỗi với tốc độ phản hồi nhanh nhất.
   - 🛠️ **Autonomous Self-Healing Loop (AI Auto-Fix)**: Khi test thất bại và kích hoạt vòng lặp tự sửa lỗi (`runAgyAutoFixSession`), bàn giao việc sửa code ứng dụng trong `frontend/` hoặc `backend/` cho **Claude 3.5 Sonnet / Claude 3.7 Sonnet** để đảm bảo sửa đúng nguyên nhân gốc rễ (RCA), chuẩn TypeScript và không gây lỗi hồi quy trước khi retry test.
