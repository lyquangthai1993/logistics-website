---
name: tanstack-optimistic-updates
description: >-
  TanStack Query v5 Optimistic Updates and Cache Mutation patterns for Next.js 15+ App Router & React 19.
  Covers instant UI feedback (0ms latency), rollback handling, multi-query cache synchronization (Lists,
  Pagination, Infinite Queries, Counters/Badges), and Real-time WebSocket cache injection.
---

# TanStack Query v5 — Optimistic Updates & Cache Mutation Patterns

> **Scope**: Best practices and production-ready implementation patterns for **Optimistic UI Updates**, **Direct Cache Manipulation (`setQueriesData`)**, **Query Key Factories**, and **WebSocket Real-time Injection** using TanStack Query v5 + Next.js App Router.
> **Philosophy**: Deliver instant (0ms latency) visual feedback to the user on critical interactions (Like/Favorite, Read Notification, Status Transitions, Toggle Flags), with robust error rollback and eventual consistency synchronization.

---

## 📌 Core Architectural Principles

```
User Action (Click / Toggle)
  │
  ├── 1. onMutate (0ms Optimistic Update)
  │     ├── Cancel in-flight queries (cancelQueries)
  │     ├── Snapshot previous cache state (getQueryData / getQueriesData)
  │     └── Update cache immediately (setQueryData / setQueriesData)
  │
  ├── 2. HTTP Request Execution (Background Async)
  │     ├── Success ──► onSettled / onSuccess
  │     │                 └── Invalidate queries to guarantee server alignment
  │     └── Failure ──► onError
  │                       ├── Restore snapshot data from context (Rollback)
  │                       └── Display user-friendly error notification
  │
  └── Real-time Socket Event (Optional)
        └── Direct Cache Injection (setQueriesData) + Badge Increment
```

---

## 🔑 1. Query Key Factory Pattern

Always organize query keys with a hierarchical factory. This enables granular invalidation and bulk cache updates across matching prefixes:

```typescript
// src/features/[feature]/hooks/query-keys.ts
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...entityKeys.lists(), params ?? {}] as const,
  pagination: () => [...entityKeys.all, 'pagination'] as const,
  page: (page: number) => [...entityKeys.pagination(), page] as const,
  infinite: () => [...entityKeys.all, 'infinite'] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...entityKeys.details(), id] as const,
  counters: () => [...entityKeys.all, 'counter'] as const,
};
```

---

## ⚡ 2. Optimistic Update Mutation Pattern (The 3-Phase Lifecycle)

### Pattern: Toggle Item State & Decrement/Increment Badge (e.g., Read Notification, Like Post)

```typescript
import {
  InfiniteData,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import { entityKeys } from './query-keys';
import { apiClient } from '@/lib/api-client';
import { showApiErrorToast } from '@/lib/api-error';

export function useToggleItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isDone }: { id: number; isDone: boolean }) => {
      const res = await apiClient.patch(`/api/v1/entities/${id}`, { isDone });
      return res.data;
    },

    // ── Phase 1: onMutate (Instant UI Feedback) ──
    onMutate: async ({ id, isDone }) => {
      // 1. Cancel in-flight queries to avoid overwriting our optimistic data
      await queryClient.cancelQueries({ queryKey: entityKeys.all });

      // 2. Snapshot previous state across all affected queries
      const previousLists = queryClient.getQueriesData<PaginatedResponse<Item>>({
        queryKey: entityKeys.lists()
      });
      const previousInfinite = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Item>>>({
        queryKey: entityKeys.infinite()
      });
      const previousCounter = queryClient.getQueryData<number>(entityKeys.counters());

      // Helper function to update single entity
      const applyUpdate = (item: Item): Item =>
        item.id === id ? { ...item, isDone } : item;

      // 3. Optimistic Update: Counter / Badge
      queryClient.setQueryData<number>(entityKeys.counters(), (old) => {
        if (typeof old !== 'number') return old;
        return isDone ? Math.max(0, old - 1) : old + 1;
      });

      // 4. Optimistic Update: All Paginated Lists matching key
      queryClient.setQueriesData<PaginatedResponse<Item>>(
        { queryKey: entityKeys.lists() },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData;
          return {
            ...oldData,
            data: oldData.data.map(applyUpdate)
          };
        }
      );

      // 5. Optimistic Update: Infinite Queries
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Item>>>(
        { queryKey: entityKeys.infinite() },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.pages)) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: Array.isArray(page.data) ? page.data.map(applyUpdate) : page.data
            }))
          };
        }
      );

      // Return context for rollback
      return { previousLists, previousInfinite, previousCounter };
    },

    // ── Phase 2: onError (Safe Rollback) ──
    onError: (err, _variables, context) => {
      if (context?.previousCounter !== undefined) {
        queryClient.setQueryData(entityKeys.counters(), context.previousCounter);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousInfinite) {
        context.previousInfinite.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      showApiErrorToast(err, 'Thao tác không thành công. Vui lòng thử lại.');
    },

    // ── Phase 3: onSettled (Eventual Consistency) ──
    onSettled: () => {
      // Invalidate to guarantee database alignment
      void queryClient.invalidateQueries({ queryKey: entityKeys.all });
    }
  });
}
```

---

## 📄 3. Smooth Pagination & Filtering (`placeholderData: keepPreviousData`)

Avoid flickering loading spinners when switching pages or filtering tabs (similar to MTikCode's pagination hook):

```typescript
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { entityKeys } from './query-keys';
import { apiClient } from '@/lib/api-client';

export function useEntitiesQuery(params: EntityQueryParams) {
  return useQuery({
    queryKey: entityKeys.list(params as Record<string, unknown>),
    queryFn: () => apiClient.get('/api/v1/entities', { params }).then((res) => res.data),
    placeholderData: keepPreviousData, // Keeps previous page data while fetching next page
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true
  });
}
```

---

## 📜 4. Infinite Scrolling Query Pattern (`useInfiniteQuery`)

For dropdown popovers (e.g. Header Notification Center, Feed Streams):

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { entityKeys } from './query-keys';
import { apiClient } from '@/lib/api-client';

export function useInfiniteEntitiesQuery(limit = 10) {
  return useInfiniteQuery({
    queryKey: entityKeys.infinite(),
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get('/api/v1/entities', { params: { page: pageParam, limit } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.page ?? 1;
      const total = lastPage.total ?? 0;
      const size = lastPage.limit ?? limit;
      return current * size < total ? current + 1 : undefined;
    },
    staleTime: 30 * 1000
  });
}
```

---

## 📡 5. Real-time WebSocket + TanStack Query Cache Injection

Directly insert server-pushed events into the TanStack Query cache without triggering full network refetches:

```typescript
// src/features/[feature]/hooks/use-realtime-sync.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getQueryClient } from '@/lib/query-client';
import { entityKeys } from './query-keys';

export function useRealtimeEntitySync() {
  useEffect(() => {
    const socket = io('/events');

    socket.on('entity:created', (newItem: Item) => {
      const queryClient = getQueryClient();

      // 1. Increment counter badge
      queryClient.setQueryData<number>(entityKeys.counters(), (old) => (old ?? 0) + 1);

      // 2. Prepend item to lists
      queryClient.setQueriesData<PaginatedResponse<Item>>(
        { queryKey: entityKeys.lists() },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData;
          if (oldData.data.some((i) => i.id === newItem.id)) return oldData;
          return {
            ...oldData,
            total: oldData.total + 1,
            data: [newItem, ...oldData.data]
          };
        }
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
```

---

## 🛡️ 6. Checklist for Production Quality

| Rule | Requirement | Checked |
|---|---|---|
| **Query Key Stability** | Always use Query Key Factories (`entityKeys`) rather than inline strings. | ✅ |
| **Race Condition Guard** | Always call `await queryClient.cancelQueries(...)` in `onMutate`. | ✅ |
| **Comprehensive Snapshot** | Snapshot both Lists, Infinite Queries, and Counter caches in `onMutate`. | ✅ |
| **Typed Cache Updates** | Provide explicit generic types: `setQueriesData<PaginatedResponse<T>>`. | ✅ |
| **Rollback Safety** | Only restore values that exist in context in `onError`. | ✅ |
| **Eventual Consistency** | Always invalidate queries in `onSettled` (not `onSuccess`). | ✅ |
| **Flicker-free UI** | Use `placeholderData: keepPreviousData` on paginated/filtered queries. | ✅ |
