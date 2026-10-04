---
name: nextjs-best-practices
description: >-
  Best practices, App Router patterns, state management, and UI component guidelines for Next.js frontend development in this workspace.
  Use when building pages, components, server actions, custom hooks, TanStack Query integration, or connecting to NestJS backend.
---

# Next.js Best Practices & Architecture Guide

This skill provides guidelines and patterns for developing modern, performant Next.js applications using App Router, React 19, Server Components, and Tailwind CSS.

## Core Principles

1. **App Router Structure**: Utilize `app/` directory with Server Components as default. Use `'use client'` only for interactive UI elements.
2. **Data Fetching**:
   - Prefer Server Components or Server Actions for direct server-side data loading.
   - Use **TanStack Query (React Query v5)** for complex client-side caching, mutations, optimistic updates, and polling.
3. **State Management**:
   - URL State (`useSearchParams`, `usePathname`) for shareable filters and pagination.
   - **Zustand** for lightweight global UI states (e.g. sidebar toggle, active modal, draft forms).
4. **Styling & UI**:
   - Vanilla CSS + Tailwind CSS v4.
   - Component composition using Shadcn UI / Radix UI primitives.
5. **API Integration with NestJS**:
   - Centralize API calls in `lib/api/` or `services/` with an `axios` or `fetch` wrapper handling JWT auth tokens and error responses.
6. **API Error Handling & Sanitization (MANDATORY)**:
   - **NEVER** expose raw technical error keys or codes (e.g. `incorrectEmailOrPassword`, `notFound`, `emailNotExists`, unformatted JSON objects) directly in the UI.
   - Always use `formatApiError()` from `@/lib/api-error` or `showApiErrorToast()`.
   - Prioritize localized, human-friendly API messages (`errorData.message`) from backend over raw technical error keys.
   - Maintain `ERROR_CODE_TRANSLATIONS` in `@/lib/api-error` for any new business exception codes.
7. **Zero Redundant Icons Rule**:
   - NEVER combine vector icon components with duplicate emojis/symbols in button text (`<Button><IconPlus /> Tạo mới</Button>`, NEVER `<Button><IconPlus /> + Tạo mới</Button>`).
8. **Real Database Data Mandate (Zero Mock Data)**:
   - All UI components, tables, filters, modals, and KPI cards MUST connect directly to real backend REST endpoints. NEVER use fake mock arrays or hardcoded fallbacks in `.catch()` blocks.
9. **UI Compact Density & Narrow Spacing Mandate (MANDATORY)**:
   - To maximize information density for logistics warehouse and dispatch operations (zero wasted whitespace), all UI components must enforce compact spacing:
   - **Card & Container Padding**: Base Card spacing is strictly 4px (`[--card-spacing:--spacing(1)]` in `components/ui/card.tsx`). Use `p-1` and `py-0` for operational cards. NEVER use bloated padding (`p-4`, `p-5`, `p-6`, `p-8`).
   - **Narrow Gaps**: Section and grid gaps must be compact: `space-y-2` (8px) to `space-y-3` (12px), `gap-2` to `gap-3`. NEVER use `space-y-6` or `gap-6`.
   - **Input & Label Specs**: Input/Button heights `h-8` to `h-9`. Label margin `mb-1`.
   - **Compact Typography Scale (Max Visible Items)**: Table data cells = `text-[10px]`, headers/badges = `text-[10px]`, order/trip codes = `text-[11px] font-mono font-bold`, cell padding = `py-1 px-2` (drops row height to ~26px to maximize visible items on screen), inputs = `text-[11px] h-8 to h-9`, card base font = `text-xs`.
   - **Sticky Cohesion**: Operational action footers must use `sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t` so warehouse operators never scroll to find action triggers.
   - Reference: [`.agents/rules/ui-compact-density.md`](../../rules/ui-compact-density.md).

---

## 🎨 Pencil Vector Design-to-Code Translation Protocol (Strict 1:1 Fidelity)

To eliminate UI deviations between vector design canvas files (`pencil-workspace/pens/*.pen`) and frontend Next.js implementations, every developer and coding agent MUST adhere to this 4-phase protocol:

### Phase 1: Pre-Implementation Design Node Inspection (MANDATORY)
Before writing any React component or Tailwind code, inspect the exact `.pen` JSON nodes in `pencil-workspace/pens/` (e.g., `WAREHOUSE_FLOWS.pen`, `UI_UX.pen`):
1. **Container Dimensions & Mode**:
   - Check `width` (e.g., `1140px` for dialogs, `1440px` for workspaces).
   - Check container type: Is it a **Modal Dialog** (`[MODAL_STEP_X]`, `*_MODAL`) or a **Page Canvas** (`[PAGE]`)?
2. **Layout Direction & Child Archetypes**:
   - Inspect `"layout": "vertical"` vs `"horizontal"`.
   - Check child layer names and structure: Does it contain a list of individual Card frames (`[LAYOUT: CARD_LIST]`, `trip_modal_dialog_card`) or a tabular grid (`[LAYOUT: DATA_TABLE]`)?

### Phase 2: Semantic Archetype Mapping Rules

| Design Archetype in `.pen` | Next.js / Tailwind Component Archetype | ❌ BANNED ANTI-PATTERN |
|---|---|---|
| **Card List Container** (`layout: vertical` with child card frames, e.g. `trip_modal_dialog_card`) | **Vertical Card Stack**: `flex flex-col gap-3`, rendering individual `<Card>` components with border, shadow, hover states, and active selection styles. | ❌ **NEVER** flatten card designs into a generic HTML `<table>`. |
| **Modal / Dialog** (`*_MODAL`, `[MODAL_STEP_X]`, `dialog_card`) | **Radix / Shadcn `<Dialog>` with Backdrop Overlay**: `max-w-5xl` / `w-[1140px]`, Navy header (`bg-[#0F3D62]`), sticky footer actions. | ❌ **NEVER** render a modal as an inline page replacement or sub-route unless explicitly specified. |
| **Selection Accent Bar** (Card with left border `#2563EB` or `accent_bar`) | **Left Accent Border / Bar**: `border-l-4 border-l-blue-600 bg-blue-50/40` or an absolute accent indicator element `w-1 bg-blue-600 rounded-l`. | ❌ **NEVER** omit selection affordances or rely solely on subtle text color changes. |
| **2-Tier Card Content** (Header Row + Details Row) | **Structured Flex Sub-rows**: Top tier (`flex items-center justify-between` for Code, Route, Status Badges) + Bottom tier (`flex items-center justify-between pt-2 border-t border-slate-100` for Operator details, Metrics, Action Button). | ❌ **NEVER** cram all fields into a single unstructured text paragraph or plain table row. |
| **Data Table** (`[LAYOUT: DATA_TABLE]`, table headers + rows) | **TanStack React Table / Structured Table**: Explicit column widths, sticky header, monospace codes, clean action dropdowns. | ❌ **NEVER** miss column alignments or omit unit badges (`kg`, `m³`, `kiện`). |

### Phase 3: Micro-Styling & Token Parity Checklist
- [ ] **Navy Header Token**: Modal dialog headers and top banners must use Logistics Navy (`#0F3D62` / `bg-[#0F3D62] text-white`).
- [ ] **Monospace Typography**: All Tracking Numbers, Trip Codes, License Plates, and Container IDs must use `font-mono font-semibold` (e.g., `CX-2609-001`, `51C-889.23`).
- [ ] **Quantity & Weight Formatting**: Quantities, gross weights, and volumes must use thousand separators and explicit units (`10 kiện`, `1.040 kg`, `4,1 m³`).
- [ ] **Action Button Microcopy**: Buttons must feature clean verbs and clean icon pairing (`<Button><IconCheck /> Chọn chuyến xe này</Button>`, never `✓ Chọn...`).

### Phase 4: Post-Implementation Visual Verification Gate
1. **Run E2E Visual Suite**: Execute `npx playwright test e2e/13-*-visual-validation.spec.ts` (or relevant flow spec).
2. **Review Generated Screenshots**: Inspect captured `.png` artifacts in the artifacts screenshot directory.
3. **Score Parity with [`visual-pen-matcher`](file:///d:/Projects/logistics-website/.agents/skills/visual-pen-matcher/SKILL.md)**: Ensure 5-dimension score reaches $\ge 80/100$ before declaring the task complete.

---

## Structure Pattern

```text
frontend/
├── app/                     # App Router pages & layouts
│   ├── (auth)/              # Route group for login/register
│   ├── (dashboard)/         # Route group for authenticated workspace
│   ├── api/                 # Route handlers (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Shared UI components
│   ├── ui/                  # Basic atomic UI components (Button, Input, Modal)
│   └── forms/               # Feature-specific form components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities, API client instance, query client setup
├── services/                # API service functions talking to NestJS backend
├── store/                   # Zustand global stores
└── types/                   # TypeScript interfaces & types
```

## Useful Commands

- **Run Dev Server**: `npm run dev` (in `frontend/`)
- **Build Production**: `npm run build`
- **Start Production**: `npm run start`
- **Run Visual E2E Tests**: `npx playwright test e2e/13-warehouse-ui-visual-validation.spec.ts`

