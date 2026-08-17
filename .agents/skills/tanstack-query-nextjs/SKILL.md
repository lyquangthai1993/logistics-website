---
name: tanstack-query-nextjs
description: >-
  TanStack Query v5 patterns with Next.js 15 App Router for the Logistics TMS.
  Use when implementing data fetching, caching, mutations, optimistic updates,
  or server-side prefetching. Triggers on mentions of "useQuery", "useMutation",
  "tanstack", "react-query", "prefetch", "invalidate", "cache", or data fetching tasks.
---

# TanStack Query v5 + Next.js 15 App Router

## Setup

### Provider Configuration

```typescript
// src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```typescript
// src/app/layout.tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

## Query Patterns

### Basic Query (Danh sách đơn hàng)

```typescript
// src/hooks/use-orders.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Order>>('/orders', { params: filters }),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}
```

### Infinite Query (Scroll load đơn hàng)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useOrdersInfinite(filters: OrderFilters) {
  return useInfiniteQuery({
    queryKey: orderKeys.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<Order>>('/orders', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor,
  });
}
```

## Mutation Patterns

### Create Order

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderDto) =>
      apiClient.post<Order>('/orders', data),
    onSuccess: () => {
      // Invalidate danh sách đơn → tự động refetch
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

### Optimistic Update (Cập nhật trạng thái đơn)

```typescript
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiClient.patch<Order>(`/orders/${id}/status`, { status }),

    onMutate: async ({ id, status }) => {
      // Cancel refetch đang chạy
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });

      // Snapshot data cũ
      const previousOrder = queryClient.getQueryData<Order>(orderKeys.detail(id));

      // Optimistic update
      queryClient.setQueryData<Order>(orderKeys.detail(id), (old) =>
        old ? { ...old, status } : old,
      );

      return { previousOrder };
    },

    onError: (_err, { id }, context) => {
      // Rollback nếu lỗi
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(id), context.previousOrder);
      }
    },

    onSettled: (_data, _err, { id }) => {
      // Refetch để đảm bảo sync
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

## Server-Side Prefetching (Next.js App Router)

```typescript
// src/app/dashboard/orders/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { OrdersTable } from '@/components/orders-table';

export default async function OrdersPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: orderKeys.list({ status: 'PENDING' }),
    queryFn: () => fetchOrdersServer({ status: 'PENDING' }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersTable />
    </HydrationBoundary>
  );
}
```

## Query Key Factory Pattern

Luôn dùng factory pattern cho query keys để dễ invalidate:

```typescript
// Invalidate tất cả orders
queryClient.invalidateQueries({ queryKey: orderKeys.all });

// Invalidate chỉ danh sách (giữ detail cache)
queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

// Invalidate 1 order cụ thể
queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
```

## Khi nào dùng TanStack Query vs Zustand?

| Data Type | Sử dụng | Lý do |
|-----------|---------|-------|
| Server state (Orders, Trips, Fleet) | TanStack Query | Tự động cache, refetch, sync |
| Auth state (User, Token, Role) | Zustand | Client-only, cần persist |
| UI state (sidebar, modal, filters) | Zustand | Không phải server data |
| Form state | react-hook-form | Form-specific library |

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Data không update sau mutation | Thiếu `invalidateQueries` | Thêm vào `onSuccess` |
| Component re-render liên tục | `queryFn` tạo object mới mỗi render | Dùng stable query key |
| Infinite loop refetch | `queryFn` thay đổi state trigger re-render | Tách query logic ra custom hook |
| SSR hydration mismatch | Thiếu `HydrationBoundary` | Wrap với `dehydrate` + `HydrationBoundary` |
