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
