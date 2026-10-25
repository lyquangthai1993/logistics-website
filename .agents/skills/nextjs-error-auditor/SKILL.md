---
name: nextjs-error-auditor
description: >-
  Audits, intercepts, and self-heals Next.js Development Error Overlays, Turbopack Redbox dialogs,
  SSR dehydration rejections, and Telemetry Error Feedback (https://nextjs.org/telemetry#error-feedback)
  using Playwright E2E testing and isomorphic module safety in Spider Express Logistics TMS.
---

# Next.js Error Auditor & Dev Overlay Guard Skill

## Overview

In Next.js (App Router, React 19, and Turbopack dev mode), runtime exceptions during Server-Side Rendering (SSR), Server Component execution, React hydration, or TanStack Query dehydration do not silently fail. Next.js intercepts them and mounts a prominent development error modal into the DOM via the custom element `<nextjs-portal>`, accompanied by telemetry error feedback links (`https://nextjs.org/telemetry#error-feedback`).

This skill provides the authoritative protocol and automated Playwright tooling to detect, intercept, diagnose, and eliminate Next.js dev error overlays across all routes.

---

## 🔍 The Next.js Error Feedback & Overlay Mechanism

### 1. Anatomy of the Error Overlay
When an error triggers in development, Next.js injects:
- **Root Container**: Custom DOM element `<nextjs-portal>`
- **Dialog & Backdrop**: `[data-nextjs-dialog]`, `[data-nextjs-dialog-overlay]`
- **Error Badges & Stack**: `Console Error`, `Server`, `Turbopack`, `#nextjs__container_errors_desc`
- **Telemetry Feedback Section**: "Was this helpful? 👍 👎" linking to `https://nextjs.org/telemetry#error-feedback`

```
┌────────────────────────────────────────────────────────────────────────┐
│  < 1/3 >                                       ● Next.js (Turbopack) ⛶ │
│  [Console Error] [Server]                                              │
│                                                                        │
│  A query that was dehydrated as pending ended up rejecting. [...]     │
│  TypeError: tokenManager.getAccessToken is not a function              │
│                                                                        │
│  src/app/dashboard/orders/page.tsx (30:9) @ OrdersPage                 │
│  > 30 | <OrdersListing />                                              │
│                                                                        │
│  Was this helpful? 👍 👎 (https://nextjs.org/telemetry#error-feedback) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Root Causes & Architecture Invariants

### 1. The "Dehydrated Query Rejected" Anti-Pattern
- **Symptom**: `A query that was dehydrated as pending ended up rejecting. [["orders", "list", ...]]`.
- **Cause**: In Server Components (`OrdersListing`, `TripsListing`), calling `queryClient.prefetchQuery(...)` with `void` (fire and forget) begins an async query. When `dehydrate(queryClient)` is called, TanStack Query waits for or includes pending queries. If the query rejects (e.g. unauthorized, backend 404, or network timeout), Next.js bubbles the rejection as a fatal SSR hydration crash.
- **Rule & Fix**:
  1. Always await prefetch calls safely with `Promise.allSettled([...])`:
     ```typescript
     // ✅ CORRECT: Safe parallel prefetch
     await Promise.allSettled([
       queryClient.prefetchQuery(ordersQueryOptions(filters)),
       queryClient.prefetchQuery(ordersStatsQueryOptions(from, to)),
       queryClient.prefetchQuery(activeHubsQueryOptions())
     ]);
     ```
  2. Ensure the underlying fetch logic handles server-side execution gracefully without throwing unhandled rejections into the hydration boundary.

### 2. The Client-Server Module Boundary Breach (`'use client'` on utility classes)
- **Symptom**: `TypeError: {imported module ...}.tokenManager.getAccessToken is not a function`.
- **Cause**: Placing `'use client';` on pure TypeScript utility singletons (like `src/lib/token-manager.ts`). When a Server Component (or server prefetch) imports from a `'use client'` file, Next.js Turbopack transforms exports into **React Client Reference proxies** (`$$typeof: Symbol.for('react.client.reference')`). These proxies do not carry instantiated methods on the server!
- **Rule & Fix**:
  1. **NEVER** put `'use client';` on utility classes, API clients, or token managers that need to run in isomorphic/server environments.
  2. In `api-client.ts`, dynamically branch token acquisition based on the execution context:
     ```typescript
     if (typeof window === 'undefined') {
       // Server-side (Server Components, SSR) -> read from cookies()
       try {
         const { cookies } = await import('next/headers');
         const cookieStore = await cookies();
         token = cookieStore.get('access_token')?.value;
       } catch {
         // Outside request context
       }
     } else {
       // Client-side -> read from tokenManager
       token = typeof tokenManager?.getAccessToken === 'function' ? tokenManager.getAccessToken() : undefined;
     }
     ```

---

## 🛡️ Playwright Error Guard Integration

The workspace includes a dedicated Playwright guard in `frontend/e2e/helpers/nextjs-error-guard.ts`.

### 1. Usage in Playwright Tests
```typescript
import { test, expect } from '@playwright/test';
import { assertNoNextJsErrors, attachNextJsErrorCollector } from './helpers/nextjs-error-guard';
import { loginAs, USER_ADMIN } from './helpers/auth';

test('Orders listing has zero Next.js error overlays', async ({ page }) => {
  const errorCollector = attachNextJsErrorCollector(page);
  await loginAs(page, USER_ADMIN);

  await page.goto('/dashboard/orders');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Asserts <nextjs-portal>, [data-nextjs-dialog], pageerror, and critical console errors
  await assertNoNextJsErrors(page, errorCollector);
});
```

### 2. Execution Command
To run the full Next.js Dev Overlay and Console Health suite:
```powershell
npx playwright test e2e/01-console-health.spec.ts
```

---

## 📋 Checklist for Verifying Next.js Dev Health
- [ ] Run `npm run typecheck --prefix frontend` (ensure zero TypeScript compilation issues).
- [ ] Run `npx playwright test e2e/01-console-health.spec.ts` (verifies public and authenticated dashboard pages).
- [ ] Confirm `<nextjs-portal>` count is 0 on all tested routes.
- [ ] Confirm no unhandled promise rejections or dehydrated query failures in console.
