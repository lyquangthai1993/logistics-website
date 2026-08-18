# Orders Feature Frontend Architecture Specification

**Milestone 3**: Orders Intake & Dispatch Standardization  
**Target Feature**: `frontend/src/features/orders/` & `frontend/src/app/dashboard/orders/`  
**Author**: Explorer 2 (Frontend Investigator & Architecture Designer)  
**Date**: 2026-08-18  

---

## 1. Executive Summary & Architectural Overview

This specification establishes the standardized, production-ready frontend architecture for the **Orders Intake & Dispatch** module (`/dashboard/orders`). It transforms the monolithic 1176-line client-rendered `OrdersPage` into a modular, high-performance architecture strictly adhering to the canonical **`@tanstack/react-table` v8 + `nuqs` v2 + TanStack React Query v5** patterns established in `frontend/src/features/hubs/` and `frontend/src/features/fleet/`.

### Key Architectural Pillars:
1. **Server Component + SSR Prefetching (`page.tsx` + `orders-listing.tsx`)**:
   - URL search parameters are parsed on the server using `nuqs/server` (`ordersSearchParamsCache.parse(searchParams)`).
   - Orders list, KPI statistics, and active hubs are prefetched on the server into `queryClient` and hydrated seamlessly via `<HydrationBoundary state={dehydrate(queryClient)}>`.
2. **TanStack React Table v8 (`columns.tsx` + `index.tsx`)**:
   - Declarative `ColumnDef<Order>[]` column definitions with sortable headers (`DataTableColumnHeader`), pinned action columns, and faceted filter metadata.
   - Standardized table markup rendered through `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`.
3. **URL State Synchronization (`use-orders-table-filters.tsx`)**:
   - `nuqs` bidirectional URL state synchronization for `page`, `perPage`, `search`, `status`, `hub`, `originHub`, `destinationHub`, `fromDate`, `toDate`, `preset`, and `sort`.
4. **Dynamic Data Integration**:
   - Replaces hardcoded hub strings with live hubs fetched from `GET /api/v1/hubs/active` (`activeHubsQueryOptions`), falling back smoothly to default hub choices.
   - Dedicated auto code generation via `GET /api/v1/orders/generate-code`.
5. **Business Domain & E2E Test Parity**:
   - 100% preservation of critical DOM selectors (`button:has-text("Tạo lệnh điều vận mới")`, `#order-code-input`, `#origin-hub-select`, `#destination-hub-select`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#notes-input`, `#isExternalNeeded`, `#external-note-input`, `button[type="submit"]:has-text("Lưu & Tạo lệnh")`, `button:has-text("Gửi Fleet")`, `text=Chờ điều xe`).
   - 100% Vietnamese toasts with API-message-first error extraction.
   - Strict RBAC compliance: Write access for `SUPER_ADMIN` and `DISPATCHER`.

---

## 2. Directory Structure & File Map

```
frontend/src/
├── app/
│   └── dashboard/
│       └── orders/
│           ├── page.tsx                             # Server Component entry point (searchParamsCache.parse)
│           ├── loading.tsx                          # Skeleton loading boundary (DataTableSkeleton + KPI skeletons)
│           └── [id]/
│               └── page.tsx                         # Order detail page (preserved & linked)
├── features/
│   └── orders/
│       ├── api/
│       │   ├── types.ts                             # Entity interfaces, DTOs, filter params, statistics types
│       │   ├── service.ts                           # Axios API client methods (getOrders, submitOrder, etc.)
│       │   ├── queries.ts                           # React Query queryKeys & queryOptions factory
│       │   ├── mutations.ts                         # React Query mutation hooks with cache invalidation
│       │   └── index.ts                             # Barrel export for API layer
│       ├── api.ts                                   # Backward-compatible re-export for external modules
│       ├── params.ts                                # nuqs search params schema, cache, and serializer
│       ├── info-content.ts                          # Guide & info drawer content for PageContainer
│       └── components/
│           ├── orders-listing.tsx                   # Server Component for prefetching & HydrationBoundary
│           ├── orders-kpi-cards.tsx                 # Metric summary cards (Total, Pending, Assigned, No Vehicle)
│           ├── orders-date-preset-bar.tsx           # Date preset selector bar (Today, 7 days, This month, etc.)
│           ├── order-create-dialog.tsx              # Create order modal with auto code generation & dynamic hubs
│           ├── order-delete-dialog.tsx              # Soft delete confirmation modal
│           ├── order-edit-dialog.tsx                # Edit draft order details modal
│           ├── order-external-dialog.tsx            # Configure external vehicle modal
│           └── orders-tables/
│               ├── index.tsx                        # Client Table Container (useDataTable + useSuspenseQuery)
│               ├── columns.tsx                      # ColumnDef<Order>[] with badges, routes, weight, cell actions
│               ├── cell-action.tsx                  # Row-level actions (Submit to Fleet, Details, Edit, Delete)
│               ├── options.tsx                      # Status and Hub filter options for faceted filters
│               └── use-orders-table-filters.tsx     # nuqs table filter & pagination hook
└── lib/
    └── searchparams.ts                              # Global searchParams registration (orders keys added)
```

---

## 3. Module Specifications & Component Wiring

### 3.1. `src/features/orders/params.ts`
Defines the `nuqs` search parameters for orders:
```typescript
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const ordersSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString, // alias for search
  status: parseAsString.withDefault('ALL'),
  hub: parseAsString.withDefault('ALL'),
  originHub: parseAsString,
  destinationHub: parseAsString,
  fromDate: parseAsString,
  toDate: parseAsString,
  preset: parseAsString.withDefault('thisMonth'),
  sort: parseAsString
};

export const ordersSearchParamsCache = createSearchParamsCache(ordersSearchParams);
export const ordersSerialize = createSerializer(ordersSearchParams);
```

---

### 3.2. `src/features/orders/api/types.ts`
```typescript
import { Trip } from '@/features/trips/api';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_FLEET'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'NO_VEHICLE'
  | 'CANCELLED';

export interface Order {
  id: number;
  orderCode: string;
  status: OrderStatus;
  route?: string | null;
  originHub?: string | null;
  destinationHub?: string | null;
  totalQuantity?: number | null;
  totalWeight: number;
  totalVolume: number;
  goodsDescription?: string | null;
  isExternalVehicleNeeded: boolean;
  externalNote?: string | null;
  createdByUserId?: number | null;
  notes?: string | null;
  trips?: Trip[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateOrderPayload {
  orderCode: string;
  route?: string;
  originHub?: string;
  destinationHub?: string;
  totalQuantity?: number | null;
  totalWeight: number;
  totalVolume: number;
  goodsDescription?: string;
  isExternalVehicleNeeded?: boolean;
  externalNote?: string;
  notes?: string;
}

export interface UpdateOrderPayload extends Partial<CreateOrderPayload> {}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type PaginatedOrdersResponse = PaginatedResult<Order>;

export interface QueryOrderParams {
  status?: string;
  search?: string;
  originHub?: string;
  destinationHub?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export type OrderFilters = QueryOrderParams;

export interface OrderStats {
  total: number;
  pending: number;
  assigned: number;
  inTransit: number;
  delivered: number;
  noVehicle: number;
  cancelled: number;
  fromDate: string;
  toDate: string;
}

export interface GenerateCodeResponse {
  orderCode: string;
}
```

---

### 3.3. `src/features/orders/api/service.ts`
```typescript
import { apiClient } from '@/lib/api-client';
import type {
  Order,
  OrderFilters,
  OrderStats,
  PaginatedOrdersResponse,
  CreateOrderPayload,
  UpdateOrderPayload,
  GenerateCodeResponse
} from './types';

export async function getOrders(filters: OrderFilters = {}): Promise<PaginatedOrdersResponse> {
  const res = await apiClient.get('/api/v1/orders', { params: filters });
  return res.data;
}

export async function getOrderStats(fromDate?: string, toDate?: string): Promise<OrderStats> {
  const res = await apiClient.get('/api/v1/orders/stats', {
    params: { fromDate, toDate }
  });
  return res.data;
}

export async function getOrderById(id: number): Promise<Order> {
  const res = await apiClient.get(`/api/v1/orders/${id}`);
  return res.data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await apiClient.post('/api/v1/orders', payload);
  return res.data;
}

export async function updateOrder(id: number, payload: UpdateOrderPayload): Promise<Order> {
  const res = await apiClient.patch(`/api/v1/orders/${id}`, payload);
  return res.data;
}

export async function submitOrder(id: number): Promise<Order> {
  const res = await apiClient.patch(`/api/v1/orders/${id}/submit`);
  return res.data;
}

export async function markNoVehicle(id: number, reason?: string): Promise<Order> {
  const res = await apiClient.patch(`/api/v1/orders/${id}/no-vehicle`, { reason });
  return res.data;
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/orders/${id}`);
}

export async function generateOrderCode(prefix?: string): Promise<GenerateCodeResponse> {
  const res = await apiClient.get('/api/v1/orders/generate-code', {
    params: prefix ? { prefix } : undefined
  });
  return res.data;
}

/**
 * Backward compatibility object matching the legacy ordersApi interface
 */
export const ordersApi = {
  getOrders,
  getOrderStats,
  getOrder: getOrderById,
  getOrderById,
  createOrder,
  updateOrder,
  submitOrder,
  markNoVehicle,
  deleteOrder,
  generateOrderCode
};
```

---

### 3.4. `src/features/orders/api/queries.ts`
```typescript
import { queryOptions, useQuery } from '@tanstack/react-query';
import { getOrders, getOrderStats, getOrderById } from './service';
import type { Order, OrderFilters } from './types';

export type { Order };

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  statsAll: () => [...orderKeys.all, 'stats'] as const,
  stats: (fromDate?: string, toDate?: string) =>
    [...orderKeys.statsAll(), { fromDate, toDate }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const
};

export const ordersQueryOptions = (filters: OrderFilters = {}) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters)
  });

export const ordersStatsQueryOptions = (fromDate?: string, toDate?: string) =>
  queryOptions({
    queryKey: orderKeys.stats(fromDate, toDate),
    queryFn: () => getOrderStats(fromDate, toDate)
  });

export const orderByIdQueryOptions = (id: number) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrderById(id)
  });

export function useOrdersQuery(filters: OrderFilters = {}) {
  return useQuery(ordersQueryOptions(filters));
}

export function useOrdersStatsQuery(fromDate?: string, toDate?: string) {
  return useQuery(ordersStatsQueryOptions(fromDate, toDate));
}

export function useOrderQuery(id: number) {
  return useQuery(orderByIdQueryOptions(id));
}
```

---

### 3.5. `src/features/orders/api/mutations.ts`
```typescript
import { mutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createOrder,
  updateOrder,
  submitOrder,
  markNoVehicle,
  deleteOrder
} from './service';
import { orderKeys } from './queries';
import type { CreateOrderPayload, UpdateOrderPayload } from './types';

export const createOrderMutation = mutationOptions({
  mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const updateOrderMutation = mutationOptions({
  mutationFn: ({ id, payload }: { id: number; payload: UpdateOrderPayload }) =>
    updateOrder(id, payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const submitOrderToFleetMutation = mutationOptions({
  mutationFn: (id: number) => submitOrder(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const markNoVehicleMutation = mutationOptions({
  mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
    markNoVehicle(id, reason),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const deleteOrderMutation = mutationOptions({
  mutationFn: (id: number) => deleteOrder(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...createOrderMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateOrderMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}

export function useSubmitOrderToFleetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...submitOrderToFleetMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}

export function useMarkNoVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...markNoVehicleMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...deleteOrderMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  });
}
```

---

### 3.6. `src/features/orders/components/orders-tables/use-orders-table-filters.tsx`
Handles date range calculation and URL state synchronization:
```typescript
'use client';

import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { useCallback, useMemo } from 'react';
import type { OrderFilters } from '../../api/types';

export type DatePreset = 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'custom';

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getThisMonthRange() {
  const now = new Date();
  return {
    from: toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toLocalDateString(now)
  };
}

export function getLastMonthRange() {
  const now = new Date();
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    from: toLocalDateString(firstOfLastMonth),
    to: toLocalDateString(lastOfLastMonth)
  };
}

export function getLast7DaysRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  return { from: toLocalDateString(from), to: toLocalDateString(now) };
}

export function getTodayRange() {
  const t = toLocalDateString(new Date());
  return { from: t, to: t };
}

export function useOrdersTableFilters(columnIds: string[] = []) {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    name: parseAsString,
    status: parseAsString.withDefault('ALL'),
    hub: parseAsString.withDefault('ALL'),
    originHub: parseAsString,
    destinationHub: parseAsString,
    fromDate: parseAsString,
    toDate: parseAsString,
    preset: parseAsString.withDefault('thisMonth'),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const search = params.name || params.search || '';

  // Calculate active date range based on preset or custom values
  const dateRange = useMemo(() => {
    if (params.preset === 'today') return getTodayRange();
    if (params.preset === '7days') return getLast7DaysRange();
    if (params.preset === 'lastMonth') return getLastMonthRange();
    if (params.preset === 'custom' && params.fromDate && params.toDate) {
      return { from: params.fromDate, to: params.toDate };
    }
    return getThisMonthRange();
  }, [params.preset, params.fromDate, params.toDate]);

  const filters: OrderFilters = useMemo(
    () => ({
      page: params.page,
      limit: params.perPage,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(params.status && params.status !== 'ALL' ? { status: params.status } : {}),
      ...(params.originHub && params.originHub !== 'ALL'
        ? { originHub: params.originHub }
        : params.hub && params.hub !== 'ALL'
        ? { originHub: params.hub }
        : {}),
      ...(params.destinationHub && params.destinationHub !== 'ALL'
        ? { destinationHub: params.destinationHub }
        : {}),
      ...(dateRange.from ? { fromDate: dateRange.from } : {}),
      ...(dateRange.to ? { toDate: dateRange.to } : {}),
      ...(params.sort && params.sort.length > 0 ? { sort: JSON.stringify(params.sort) } : {})
    }),
    [
      params.page,
      params.perPage,
      search,
      params.status,
      params.originHub,
      params.hub,
      params.destinationHub,
      dateRange,
      params.sort
    ]
  );

  const setPreset = useCallback(
    (preset: DatePreset) => {
      if (preset === 'today') {
        const range = getTodayRange();
        setParams({ preset, fromDate: range.from, toDate: range.to, page: 1 });
      } else if (preset === '7days') {
        const range = getLast7DaysRange();
        setParams({ preset, fromDate: range.from, toDate: range.to, page: 1 });
      } else if (preset === 'thisMonth') {
        const range = getThisMonthRange();
        setParams({ preset, fromDate: range.from, toDate: range.to, page: 1 });
      } else if (preset === 'lastMonth') {
        const range = getLastMonthRange();
        setParams({ preset, fromDate: range.from, toDate: range.to, page: 1 });
      } else {
        setParams({ preset: 'custom', page: 1 });
      }
    },
    [setParams]
  );

  const setCustomDate = useCallback(
    (field: 'from' | 'to', value: string) => {
      setParams((prev) => ({
        ...prev,
        preset: 'custom',
        [field === 'from' ? 'fromDate' : 'toDate']: value,
        page: 1
      }));
    },
    [setParams]
  );

  const resetFilters = useCallback(() => {
    const defaultRange = getThisMonthRange();
    setParams({
      name: null,
      search: null,
      status: 'ALL',
      hub: 'ALL',
      originHub: null,
      destinationHub: null,
      preset: 'thisMonth',
      fromDate: defaultRange.from,
      toDate: defaultRange.to,
      page: 1
    });
  }, [setParams]);

  const isAnyFilterActive = useMemo(() => {
    return Boolean(
      params.name ||
        params.search ||
        (params.status && params.status !== 'ALL') ||
        (params.hub && params.hub !== 'ALL') ||
        params.originHub ||
        params.destinationHub ||
        params.preset !== 'thisMonth'
    );
  }, [params]);

  return {
    params,
    setParams,
    search,
    dateRange,
    preset: params.preset as DatePreset,
    setPreset,
    setCustomDate,
    filters,
    resetFilters,
    isAnyFilterActive
  };
}
```

---

### 3.7. `src/features/orders/components/orders-tables/columns.tsx`
```typescript
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { ORDER_STATUS_OPTIONS } from './options';
import type { Order, OrderStatus } from '../../api/types';
import Link from 'next/link';

export function renderOrderStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'DRAFT':
      return (
        <Badge
          variant='secondary'
          className='bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        >
          Nháp
        </Badge>
      );
    case 'PENDING_FLEET':
      return (
        <Badge
          variant='secondary'
          className='bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200'
        >
          Chờ điều xe
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge
          variant='secondary'
          className='bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
        >
          Đã phân xe
        </Badge>
      );
    case 'IN_TRANSIT':
      return (
        <Badge
          variant='secondary'
          className='bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
        >
          Đang vận chuyển
        </Badge>
      );
    case 'DELIVERED':
      return (
        <Badge
          variant='secondary'
          className='bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-200'
        >
          Đã giao hàng
        </Badge>
      );
    case 'NO_VEHICLE':
      return (
        <Badge
          variant='destructive'
          className='bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
        >
          Không có xe
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant='outline' className='text-slate-400'>
          Đã hủy
        </Badge>
      );
    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
}

export const columns: ColumnDef<Order>[] = [
  {
    id: 'orderCode',
    accessorKey: 'orderCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Mã Đơn Hàng' />,
    cell: ({ row }) => {
      const order = row.original;
      const tripsCount = order.trips?.length || 0;
      const isSplit = tripsCount > 1;
      const hasExternalTrip =
        order.trips?.some((t) => t.vehicle?.isExternal) || order.isExternalVehicleNeeded;

      return (
        <div>
          <div className='flex items-center gap-2'>
            <Link
              href={`/dashboard/orders/${order.id}`}
              className='hover:underline text-blue-600 dark:text-blue-400 font-mono font-semibold'
            >
              {order.orderCode}
            </Link>
            {isSplit && (
              <Badge
                variant='outline'
                className='bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 text-[10px] px-1.5 py-0'
              >
                Split {tripsCount}x
              </Badge>
            )}
            {hasExternalTrip && (
              <Badge
                variant='outline'
                className='bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-1.5 py-0 font-bold'
              >
                Xe ngoài
              </Badge>
            )}
          </div>
          <span className='text-[11px] font-normal text-slate-400 block mt-0.5'>
            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      );
    },
    meta: {
      label: 'Mã đơn hàng',
      placeholder: 'Tìm theo mã đơn, tuyến đường, hàng hóa...',
      variant: 'text',
      icon: Icons.search
    },
    enableColumnFilter: true,
    enableSorting: true
  },
  {
    id: 'route',
    accessorKey: 'route',
    header: 'Tuyến Đường & Hub',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className='text-slate-700 dark:text-slate-300'>
          <div className='font-medium flex items-center gap-1.5'>
            <span>{order.originHub?.split(' ')[0] || 'N/A'}</span>
            <Icons.arrowRight className='h-3.5 w-3.5 text-slate-400' />
            <span>{order.destinationHub?.split(' ')[0] || 'N/A'}</span>
          </div>
          <span
            className='text-xs text-slate-400 block mt-0.5 truncate max-w-[200px]'
            title={`${order.originHub} → ${order.destinationHub}`}
          >
            {order.destinationHub}
          </span>
        </div>
      );
    }
  },
  {
    id: 'weightVolume',
    accessorKey: 'totalWeight',
    header: 'Khối Lượng / Thể Tích',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className='text-slate-700 dark:text-slate-300 font-mono'>
          <div className='font-medium'>{order.totalWeight.toLocaleString()} kg</div>
          <div className='text-xs text-slate-400 flex items-center gap-1.5'>
            <span>{order.totalVolume} m³</span>
            {order.totalQuantity != null && (
              <>
                <span>•</span>
                <span className='font-sans font-medium text-slate-600 dark:text-slate-400'>
                  {order.totalQuantity.toLocaleString()} kiện
                </span>
              </>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: 'goodsDescription',
    accessorKey: 'goodsDescription',
    header: 'Loại Hàng & Ghi Chú',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className='text-slate-600 dark:text-slate-400'>
          <span
            className='truncate block max-w-[180px]'
            title={order.goodsDescription || 'Chưa có mô tả'}
          >
            {order.goodsDescription || '—'}
          </span>
          {order.externalNote && (
            <span
              className='text-[11px] text-amber-700 dark:text-amber-300 block truncate max-w-[180px] font-medium mt-0.5'
              title={`Lý do xe ngoài: ${order.externalNote}`}
            >
              🚛 {order.externalNote}
            </span>
          )}
        </div>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Trạng Thái' />,
    cell: ({ cell }) => renderOrderStatusBadge(cell.getValue<OrderStatus>()),
    meta: {
      label: 'Trạng thái',
      variant: 'select',
      options: ORDER_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'trips',
    accessorKey: 'trips',
    header: 'Xe Phân Công',
    cell: ({ row }) => {
      const order = row.original;
      return order.trips && order.trips.length > 0 ? (
        <div className='space-y-1'>
          {order.trips.map((t, idx) => (
            <div key={t.id} className='text-xs flex items-center gap-1.5'>
              <Icons.truck className='h-3.5 w-3.5 text-slate-400' />
              <span className='font-mono font-medium'>
                {t.vehicle?.licensePlate || `Chuyến #${idx + 1}`}
              </span>
              {t.vehicle?.isExternal && (
                <span className='text-[10px] text-amber-600 font-bold'>
                  ({t.vehicle.externalProvider || 'Xe ngoài'})
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <span className='text-xs text-slate-400 italic'>Chưa gán xe</span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

---

### 3.8. `src/features/orders/components/orders-tables/cell-action.tsx`
Handles row actions: Submit to Fleet, Details link, Edit modal, Delete modal.
```typescript
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { submitOrderToFleetMutation } from '../../api/mutations';
import { orderKeys } from '../../api/queries';
import { OrderDeleteDialog } from '../order-delete-dialog';
import { OrderEditDialog } from '../order-edit-dialog';
import { OrderExternalDialog } from '../order-external-dialog';
import type { Order } from '../../api/types';
import Link from 'next/link';

interface CellActionProps {
  data: Order;
}

export function CellAction({ data }: CellActionProps) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);

  const submitMutation = useMutation({
    ...submitOrderToFleetMutation,
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều vận lên Đội xe (Fleet)!');
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Không thể gửi lệnh điều vận. Vui lòng thử lại.');
    }
  });

  return (
    <>
      <OrderDeleteDialog
        order={data}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <OrderEditDialog
        order={data}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <OrderExternalDialog
        order={data}
        open={externalOpen}
        onOpenChange={setExternalOpen}
      />

      <div className='flex items-center justify-end gap-1.5'>
        {/* View details */}
        <Link href={`/dashboard/orders/${data.id}`}>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 px-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer'
            title='Xem chi tiết đơn hàng'
          >
            <Icons.eye className='h-4 w-4' />
          </Button>
        </Link>

        {/* External vehicle setup button */}
        {data.status === 'NO_VEHICLE' && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setExternalOpen(true)}
            className='h-8 px-2.5 text-xs text-amber-700 border-amber-300 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 cursor-pointer'
            title='Xử lý thuê xe ngoài'
          >
            <Icons.truck className='h-3.5 w-3.5 mr-1 text-amber-600' />
            Xe ngoài
          </Button>
        )}

        {/* Submit to fleet button */}
        {(data.status === 'DRAFT' || data.status === 'NO_VEHICLE') && (
          <Button
            onClick={() => submitMutation.mutate(data.id)}
            variant='outline'
            size='sm'
            disabled={submitMutation.isPending}
            className='h-8 px-2.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
            title='Gửi lệnh điều vận lên Đội xe'
          >
            {submitMutation.isPending ? (
              <>
                <Icons.spinner className='h-3.5 w-3.5 mr-1 animate-spin' />
                Đang gửi...
              </>
            ) : (
              <>
                <Icons.send className='h-3.5 w-3.5 mr-1' />
                Gửi Fleet
              </>
            )}
          </Button>
        )}

        {/* Delete draft */}
        {data.status === 'DRAFT' && (
          <Button
            onClick={() => setDeleteOpen(true)}
            variant='ghost'
            size='sm'
            className='h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer'
            title='Xóa đơn nháp'
          >
            <Icons.trash className='h-4 w-4' />
          </Button>
        )}

        {/* Dropdown Menu for extra actions */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                className='h-8 w-8 p-0 cursor-pointer text-muted-foreground'
              />
            }
          >
            <span className='sr-only'>Open menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => setEditOpen(true)}
                disabled={data.status !== 'DRAFT' && data.status !== 'NO_VEHICLE'}
              >
                <Icons.edit className='mr-2 h-4 w-4' /> Chỉnh sửa đơn
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer' asChild>
                <Link href={`/dashboard/orders/${data.id}`}>
                  <Icons.fileText className='mr-2 h-4 w-4' /> Xem chi tiết
                </Link>
              </DropdownMenuItem>
              {data.status === 'DRAFT' && (
                <DropdownMenuItem
                  className='cursor-pointer text-rose-600 focus:text-rose-700'
                  onClick={() => setDeleteOpen(true)}
                >
                  <Icons.trash className='mr-2 h-4 w-4' /> Xóa đơn nháp
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
```

---

### 3.9. `src/features/orders/components/orders-tables/index.tsx`
Client Table Component:
```typescript
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ordersQueryOptions, ordersStatsQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { useOrdersTableFilters } from './use-orders-table-filters';
import { OrdersKpiCards } from '../orders-kpi-cards';
import { OrdersDatePresetBar } from '../orders-date-preset-bar';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function OrdersTable() {
  const { filters, params, dateRange, preset, setPreset, setCustomDate } =
    useOrdersTableFilters(columnIds);

  const { data: ordersData } = useSuspenseQuery(ordersQueryOptions(filters));
  const { data: statsData } = useSuspenseQuery(
    ordersStatsQueryOptions(filters.fromDate, filters.toDate)
  );

  const perPage = params.perPage || 10;
  const total = ordersData.meta?.total ?? 0;
  const pageCount = Math.ceil(total / perPage);

  const { table } = useDataTable({
    data: ordersData.data ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 300,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {/* Date Preset Filter Bar */}
      <OrdersDatePresetBar
        datePreset={preset}
        dateRange={dateRange}
        onPresetChange={setPreset}
        onCustomDateChange={setCustomDate}
        fromDate={statsData?.fromDate}
        toDate={statsData?.toDate}
      />

      {/* KPI Metric Cards */}
      <OrdersKpiCards stats={statsData} />

      {/* Orders Data Table */}
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

export function OrdersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-16 w-full rounded-lg' />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
      </div>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
```

---

### 3.10. `src/features/orders/components/orders-kpi-cards.tsx`
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { OrderStats } from '../api/types';

interface OrdersKpiCardsProps {
  stats?: OrderStats | null;
  loading?: boolean;
}

export function OrdersKpiCards({ stats, loading }: OrdersKpiCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Tổng đơn hàng */}
      <Card className='shadow-xs border-border/80'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Tổng số đơn hàng
          </CardTitle>
          <Icons.fileText className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-foreground'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-muted rounded animate-pulse' />
            ) : (
              stats?.total ?? 0
            )}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Tổng trong kỳ đã chọn</p>
        </CardContent>
      </Card>

      {/* Chờ điều xe */}
      <Card className='shadow-xs border-border/80'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-blue-600 dark:text-blue-400'>
            Chờ điều phối xe
          </CardTitle>
          <Icons.clock className='h-4 w-4 text-blue-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-blue-100 dark:bg-blue-950/50 rounded animate-pulse' />
            ) : (
              stats?.pending ?? 0
            )}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Đã gửi yêu cầu lên Fleet</p>
        </CardContent>
      </Card>

      {/* Đã phân xe */}
      <Card className='shadow-xs border-border/80'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>
            Đã phân công xe
          </CardTitle>
          <Icons.circleCheck className='h-4 w-4 text-emerald-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-emerald-100 dark:bg-emerald-950/50 rounded animate-pulse' />
            ) : (
              (stats ? stats.assigned + stats.inTransit : 0)
            )}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Đã xác nhận + Đang vận chuyển</p>
        </CardContent>
      </Card>

      {/* Không có xe */}
      <Card className='shadow-xs border-border/80'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-rose-600 dark:text-rose-400'>
            Hết / Chưa có xe
          </CardTitle>
          <Icons.warning className='h-4 w-4 text-rose-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-rose-600 dark:text-rose-400'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-rose-100 dark:bg-rose-950/50 rounded animate-pulse' />
            ) : (
              stats?.noVehicle ?? 0
            )}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Cần tìm xe thuê ngoài</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 3.11. `src/features/orders/components/orders-date-preset-bar.tsx`
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { orderKeys } from '../api/queries';
import type { DatePreset } from './orders-tables/use-orders-table-filters';

interface OrdersDatePresetBarProps {
  datePreset: DatePreset;
  dateRange: { from: string; to: string };
  onPresetChange: (preset: DatePreset) => void;
  onCustomDateChange: (field: 'from' | 'to', value: string) => void;
  fromDate?: string;
  toDate?: string;
}

export function OrdersDatePresetBar({
  datePreset,
  dateRange,
  onPresetChange,
  onCustomDateChange,
  fromDate,
  toDate
}: OrdersDatePresetBarProps) {
  const queryClient = useQueryClient();

  const formatDateVi = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.statsAll() });
    queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
  };

  return (
    <Card className='shadow-xs border-border/80'>
      <CardContent className='pt-4 pb-3'>
        <div className='flex flex-wrap items-center gap-3'>
          {/* Label */}
          <div className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground shrink-0'>
            <Icons.calendar className='h-4 w-4' />
            Thống kê theo:
          </div>

          {/* Preset buttons */}
          <div className='flex items-center gap-1.5 flex-wrap'>
            {(
              [
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: 'thisMonth', label: 'Tháng này' },
                { key: 'lastMonth', label: 'Tháng trước' }
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type='button'
                onClick={() => onPresetChange(key)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md border transition-all duration-150 cursor-pointer',
                  datePreset === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className='flex items-center gap-2 ml-auto'>
            <span className='text-xs text-muted-foreground hidden sm:inline'>Tùy chọn:</span>
            <input
              type='date'
              value={dateRange.from}
              max={dateRange.to}
              onChange={(e) => onCustomDateChange('from', e.target.value)}
              className='px-2 py-1 text-xs bg-background border border-input rounded-md focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer'
            />
            <span className='text-xs text-muted-foreground'>→</span>
            <input
              type='date'
              value={dateRange.to}
              min={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => onCustomDateChange('to', e.target.value)}
              className='px-2 py-1 text-xs bg-background border border-input rounded-md focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer'
            />
            <button
              type='button'
              onClick={handleRefresh}
              title='Làm mới thống kê'
              className='p-1.5 rounded-md border border-input hover:bg-muted transition-colors cursor-pointer'
            >
              <Icons.refresh className='h-3.5 w-3.5 text-muted-foreground' />
            </button>
          </div>
        </div>

        {/* Period label */}
        {fromDate && toDate && (
          <p className='text-[11px] text-muted-foreground mt-2 ml-0.5'>
            Kỳ thống kê: {formatDateVi(fromDate)} – {formatDateVi(toDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 3.12. `src/features/orders/components/order-create-dialog.tsx`
Create Order modal with auto code generation and dynamic active hubs dropdown.
```typescript
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/use-auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { activeHubsQueryOptions } from '@/features/hubs/api/queries';
import { ordersApi } from '../api/service';
import { useCreateOrderMutation } from '../api/mutations';

const DEFAULT_HUBS = [
  'Andromeda Hub (Hà Nội)',
  'Magellan Hub (Đà Nẵng)',
  'Centaurus Hub (TP.HCM)',
  'Pegasus Hub (Cần Thơ)',
  'Vela Hub (Hải Phòng)'
];

export function OrderCreateDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className='cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
      >
        <Icons.plus className='mr-2 h-4 w-4' />
        Tạo lệnh điều vận mới
      </Button>
      <OrderCreateDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

interface OrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderCreateDialog({ open, onOpenChange }: OrderCreateDialogProps) {
  const { user } = useAuthStore();
  const { data: activeHubs = [] } = useQuery(activeHubsQueryOptions());

  const hubOptions = useMemo(() => {
    if (activeHubs.length > 0) {
      return activeHubs.map((h) => `${h.name} (${h.city})`);
    }
    return DEFAULT_HUBS;
  }, [activeHubs]);

  const [orderCode, setOrderCode] = useState('');
  const [originHub, setOriginHub] = useState(hubOptions[0] || DEFAULT_HUBS[0]);
  const [destinationHub, setDestinationHub] = useState(hubOptions[2] || DEFAULT_HUBS[2]);
  const [totalQuantity, setTotalQuantity] = useState<number | ''>('');
  const [totalWeight, setTotalWeight] = useState<number | ''>('');
  const [totalVolume, setTotalVolume] = useState<number | ''>('');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isExternalNeeded, setIsExternalNeeded] = useState(false);
  const [externalNote, setExternalNote] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // Suggested initials
  const suggestedInitials = useMemo(() => {
    const name = (user?.firstName || '') + ' ' + (user?.lastName || '');
    const cleanName = name.trim();
    if (!cleanName) return 'ORD';

    const unaccented = cleanName
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const parts = unaccented.split(/\s+/).filter(Boolean);
    return (
      parts
        .map((p) => p[0]?.toUpperCase())
        .join('')
        .replace(/[^A-Z0-9]/gi, '')
        .slice(0, 3) || 'ORD'
    );
  }, [user]);

  const placeholderCode = useMemo(() => {
    const date = new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${suggestedInitials}-${mm}${yy}-001`;
  }, [suggestedInitials]);

  const createMutation = useCreateOrderMutation();

  const handleGenerateCode = async () => {
    if (generatingCode) return;
    setGeneratingCode(true);
    try {
      const { orderCode: generated } = await ordersApi.generateOrderCode(suggestedInitials);
      setOrderCode(generated);
      toast.success(`Đã sinh mã: ${generated}`, { duration: 2000 });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không thể sinh mã đơn hàng. Vui lòng thử lại.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const resetForm = () => {
    setOrderCode('');
    setTotalQuantity('');
    setTotalWeight('');
    setTotalVolume('');
    setGoodsDescription('');
    setNotes('');
    setIsExternalNeeded(false);
    setExternalNote('');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }
    if (originHub === destinationHub) {
      toast.error('Hub xuất phát và Hub đích không được trùng nhau');
      return;
    }
    if (!totalWeight || totalWeight <= 0) {
      toast.error('Khối lượng phải lớn hơn 0 kg');
      return;
    }
    if (!totalVolume || totalVolume <= 0) {
      toast.error('Thể tích phải lớn hơn 0 m³');
      return;
    }
    if (isExternalNeeded && !externalNote.trim()) {
      toast.error('Vui lòng nhập ghi chú / lý do điều xe ngoài');
      return;
    }

    const route = `${originHub.split(' ')[0]} → ${destinationHub.split(' ')[0]}`;

    createMutation.mutate(
      {
        orderCode: orderCode.trim().toUpperCase(),
        route,
        originHub,
        destinationHub,
        totalQuantity: totalQuantity ? Number(totalQuantity) : undefined,
        totalWeight: Number(totalWeight),
        totalVolume: Number(totalVolume),
        goodsDescription: goodsDescription.trim() || undefined,
        notes: notes.trim() || undefined,
        isExternalVehicleNeeded: isExternalNeeded,
        externalNote: isExternalNeeded ? externalNote.trim() : undefined
      },
      {
        onSuccess: () => {
          toast.success('Tạo lệnh điều vận thành công!');
          resetForm();
          onOpenChange(false);
        },
        onError: (err: any) => {
          const apiMessage = err?.response?.data?.message;
          toast.error(apiMessage || 'Lỗi tạo lệnh điều vận. Vui lòng thử lại.');
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold text-foreground flex items-center gap-2'>
            <Icons.fileText className='h-5 w-5 text-primary' />
            Tạo Lệnh Điều Vận Mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateOrder} className='space-y-4 pt-2'>
          {/* Mã đơn hàng */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label
                htmlFor='order-code-input'
                className='text-sm font-semibold text-foreground'
              >
                Mã đơn hàng <span className='text-destructive'>*</span>
              </label>
              <span className='text-xs text-muted-foreground flex items-center gap-1'>
                <Icons.info className='h-3.5 w-3.5' />
                Format gợi ý: [Tên tắt]-[MMYY]-[Số]
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Input
                id='order-code-input'
                placeholder={`VD: ${placeholderCode}`}
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                required
                className='font-mono uppercase text-base tracking-wide flex-1'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleGenerateCode}
                disabled={generatingCode || createMutation.isPending}
                title='Sinh mã đơn hàng tự động'
                className='shrink-0 h-10 w-10 border-input hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer'
              >
                {generatingCode ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <Icons.sparkles className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-[11px] text-muted-foreground'>
              Tự nhập hoặc bấm{' '}
              <Icons.sparkles className='inline h-3 w-3 text-primary' />{' '}
              để sinh mã tạm thời tự động. Hệ thống kiểm tra trùng lặp.
            </p>
          </div>

          {/* Tuyến đường: Origin & Destination Hub */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <label
                htmlFor='origin-hub-select'
                className='text-sm font-semibold text-foreground'
              >
                Hub xuất phát (Origin) <span className='text-destructive'>*</span>
              </label>
              <select
                id='origin-hub-select'
                value={originHub}
                onChange={(e) => setOriginHub(e.target.value)}
                className='w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer'
              >
                {hubOptions.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-1.5'>
              <label
                htmlFor='destination-hub-select'
                className='text-sm font-semibold text-foreground'
              >
                Hub tiếp nhận (Destination) <span className='text-destructive'>*</span>
              </label>
              <select
                id='destination-hub-select'
                value={destinationHub}
                onChange={(e) => setDestinationHub(e.target.value)}
                className='w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer'
              >
                {hubOptions.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quy cách hàng hóa: Số lượng, Trọng lượng & Thể tích */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='total-quantity-input'
                  className='text-sm font-semibold text-foreground'
                >
                  Số lượng
                </label>
                <span className='text-[10px] text-muted-foreground font-normal'>Tùy chọn</span>
              </div>
              <Input
                id='total-quantity-input'
                type='number'
                min='1'
                step='1'
                placeholder='VD: 3000 (kiện/cái)'
                value={totalQuantity}
                onChange={(e) =>
                  setTotalQuantity(e.target.value ? Number(e.target.value) : '')
                }
              />
            </div>

            <div className='space-y-1.5'>
              <label
                htmlFor='total-weight-input'
                className='text-sm font-semibold text-foreground'
              >
                Tổng khối lượng (kg) <span className='text-destructive'>*</span>
              </label>
              <Input
                id='total-weight-input'
                type='number'
                min='1'
                step='1'
                placeholder='VD: 18000'
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <label
                htmlFor='total-volume-input'
                className='text-sm font-semibold text-foreground'
              >
                Tổng thể tích (m³) <span className='text-destructive'>*</span>
              </label>
              <Input
                id='total-volume-input'
                type='number'
                min='0.01'
                step='0.01'
                placeholder='VD: 45.5'
                value={totalVolume}
                onChange={(e) => setTotalVolume(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>
          </div>
          <p className='text-[11px] text-muted-foreground -mt-2'>
            * Khối lượng & Thể tích bắt buộc. <strong>Số lượng:</strong> để trống nếu là hàng theo lô / chuyến không đếm chiếc lẻ.
          </p>

          {/* Mô tả hàng hóa */}
          <div className='space-y-1.5'>
            <label
              htmlFor='goods-desc-input'
              className='text-sm font-semibold text-foreground'
            >
              Mô tả loại hàng
            </label>
            <Textarea
              id='goods-desc-input'
              rows={3}
              placeholder='VD: 50 kiện hàng linh kiện điện tử nguyên đai nguyên kiện, hàng giá trị cao, yêu cầu bảo quản khô ráo...'
              value={goodsDescription}
              onChange={(e) => setGoodsDescription(e.target.value)}
              className='resize-y'
            />
          </div>

          {/* Ghi chú */}
          <div className='space-y-1.5'>
            <label
              htmlFor='notes-input'
              className='text-sm font-semibold text-foreground'
            >
              Ghi chú điều vận
            </label>
            <Textarea
              id='notes-input'
              rows={3}
              placeholder='VD: Cần xe thùng kín có bửng nâng, giao trước 17h00, lái xe liên hệ thủ kho trước 30 phút...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='resize-y'
            />
          </div>

          {/* Flag yêu cầu xe thuê ngoài */}
          <div className='space-y-3 p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-lg'>
            <div className='flex items-center gap-2.5'>
              <input
                type='checkbox'
                id='isExternalNeeded'
                checked={isExternalNeeded}
                onChange={(e) => setIsExternalNeeded(e.target.checked)}
                className='h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer'
              />
              <label
                htmlFor='isExternalNeeded'
                className='text-xs text-amber-950 dark:text-amber-200 font-semibold cursor-pointer'
              >
                🚛 Đơn hàng yêu cầu điều xe ngoài / thuê ngoài đối tác (External Fleet)
              </label>
            </div>

            {isExternalNeeded && (
              <div className='space-y-1.5 pt-1 border-t border-amber-200/80 dark:border-amber-900/60'>
                <label
                  htmlFor='external-note-input'
                  className='text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1'
                >
                  Ghi chú / Lý do điều xe ngoài (external_note){' '}
                  <span className='text-destructive'>* Bắt buộc</span>
                </label>
                <Textarea
                  id='external-note-input'
                  rows={2}
                  placeholder='VD: Đội xe nội bộ 15 tấn đang kín lịch trình; Cần thuê ngoài xe đầu kéo thùng kín từ đối tác Vận Tải Á Châu...'
                  value={externalNote}
                  onChange={(e) => setExternalNote(e.target.value)}
                  required={isExternalNeeded}
                  className='border-amber-300 dark:border-amber-800 bg-background text-sm resize-y'
                />
                <p className='text-[11px] text-amber-800 dark:text-amber-300'>
                  Nội dung này sẽ được chuyển trực tiếp cho Quản lý Đội xe (Fleet) để thực hiện
                  hợp đồng thuê ngoài.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className='cursor-pointer'
            >
              Hủy bỏ
            </Button>
            <Button
              type='submit'
              disabled={createMutation.isPending}
              className='bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Lưu & Tạo lệnh'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3.13. `src/features/orders/components/order-delete-dialog.tsx`
```typescript
'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { useDeleteOrderMutation } from '../api/mutations';
import type { Order } from '../api/types';

interface OrderDeleteDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDeleteDialog({ order, open, onOpenChange }: OrderDeleteDialogProps) {
  const deleteMutation = useDeleteOrderMutation();

  const handleDelete = () => {
    deleteMutation.mutate(order.id, {
      onSuccess: () => {
        toast.success(`Đã xóa đơn hàng "${order.orderCode}" thành công!`);
        onOpenChange(false);
      },
      onError: (err: any) => {
        const apiMessage = err?.response?.data?.message;
        toast.error(apiMessage || 'Không thể xóa đơn hàng. Vui lòng thử lại.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <Icons.warning className='h-5 w-5' />
            Xác Nhận Hủy / Xóa Đơn Hàng
          </DialogTitle>
        </DialogHeader>
        <div className='text-muted-foreground space-y-3 py-2 text-sm'>
          <p>
            Bạn có chắc chắn muốn hủy / xóa đơn hàng{' '}
            <strong className='text-foreground font-semibold font-mono'>
              {order.orderCode}
            </strong>
            ?
          </p>
          <p className='text-muted-foreground text-xs'>
            Hệ thống áp dụng chính sách <strong>Xóa Mềm (Soft Delete)</strong>. Lịch sử giao dịch và vết kiểm toán vẫn được bảo toàn trong cơ sở dữ liệu.
          </p>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='cursor-pointer'
          >
            Hủy
          </Button>
          <Button
            type='button'
            variant='destructive'
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            className='cursor-pointer'
          >
            {deleteMutation.isPending ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3.14. `src/features/orders/components/orders-listing.tsx`
Server Component prefetching orders, metrics, and active hubs:
```typescript
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ordersSearchParamsCache } from '../params';
import { ordersQueryOptions, ordersStatsQueryOptions } from '../api/queries';
import { activeHubsQueryOptions } from '@/features/hubs/api/queries';
import { OrdersTable } from './orders-tables';
import {
  getThisMonthRange,
  getLastMonthRange,
  getLast7DaysRange,
  getTodayRange
} from './orders-tables/use-orders-table-filters';
import type { OrderFilters } from '../api/types';

export default async function OrdersListing() {
  const page = ordersSearchParamsCache.get('page') || 1;
  const perPage = ordersSearchParamsCache.get('perPage') || 10;
  const search = ordersSearchParamsCache.get('name') || ordersSearchParamsCache.get('search');
  const status = ordersSearchParamsCache.get('status');
  const hub = ordersSearchParamsCache.get('hub');
  const originHub = ordersSearchParamsCache.get('originHub') || (hub && hub !== 'ALL' ? hub : undefined);
  const destinationHub = ordersSearchParamsCache.get('destinationHub');
  const preset = ordersSearchParamsCache.get('preset') || 'thisMonth';
  const customFrom = ordersSearchParamsCache.get('fromDate');
  const customTo = ordersSearchParamsCache.get('toDate');
  const sort = ordersSearchParamsCache.get('sort');

  let dateRange = getThisMonthRange();
  if (preset === 'today') dateRange = getTodayRange();
  else if (preset === '7days') dateRange = getLast7DaysRange();
  else if (preset === 'lastMonth') dateRange = getLastMonthRange();
  else if (preset === 'custom' && customFrom && customTo) {
    dateRange = { from: customFrom, to: customTo };
  }

  const filters: OrderFilters = {
    page,
    limit: perPage,
    ...(search && { search }),
    ...(status && status !== 'ALL' && { status }),
    ...(originHub && { originHub }),
    ...(destinationHub && { destinationHub }),
    ...(dateRange.from && { fromDate: dateRange.from }),
    ...(dateRange.to && { toDate: dateRange.to }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  // Prefetch orders list, KPI stats, and active hubs in parallel
  void queryClient.prefetchQuery(ordersQueryOptions(filters));
  void queryClient.prefetchQuery(ordersStatsQueryOptions(dateRange.from, dateRange.to));
  void queryClient.prefetchQuery(activeHubsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersTable />
    </HydrationBoundary>
  );
}
```

---

### 3.15. `src/app/dashboard/orders/page.tsx`
Clean Server Component:
```typescript
import PageContainer from '@/components/layout/page-container';
import OrdersListing from '@/features/orders/components/orders-listing';
import { OrderCreateDialogTrigger } from '@/features/orders/components/order-create-dialog';
import { ordersInfoContent } from '@/features/orders/info-content';
import { ordersSearchParamsCache } from '@/features/orders/params';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Lập Lệnh Điều Vận | Logistics TMS'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function OrdersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  ordersSearchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Lập Lệnh Điều Vận'
      pageDescription='Quản lý kế hoạch vận chuyển hàng hóa, tạo đơn hàng và gửi yêu cầu phân bổ phương tiện.'
      infoContent={ordersInfoContent}
      pageHeaderAction={<OrderCreateDialogTrigger />}
    >
      <OrdersListing />
    </PageContainer>
  );
}
```

---

## 4. Verification & Validation Strategy

1. **Type & Compilation Check**:
   - `npm run build` in `frontend/` must complete with 0 TypeScript/ESLint errors.
2. **E2E Playwright Suite Execution**:
   - `npx playwright test e2e/06-order-dispatch-workflow.spec.ts` must pass 100%.
   - `npx playwright test e2e/03-rbac-routing.spec.ts` must pass 100%.
   - `npx playwright test e2e/07-capture-user-guide-screenshots.spec.ts` must pass 100%.
3. **Selector & State Invariant Checklist**:
   - [x] Page heading: `getByRole('heading', { name: 'Lập Lệnh Điều Vận' })`
   - [x] Create button: `button:has-text("Tạo lệnh điều vận mới")`
   - [x] Create modal inputs: `#order-code-input`, `#origin-hub-select`, `#destination-hub-select`, `#total-weight-input`, `#total-volume-input`, `#goods-desc-input`, `#notes-input`, `#isExternalNeeded`, `#external-note-input`
   - [x] Submit button: `button[type="submit"]:has-text("Lưu & Tạo lệnh")`
   - [x] Row submit action: `button:has-text("Gửi Fleet")`
   - [x] Status text badge: `Chờ điều xe`
   - [x] Pagination controls: Rows per page `[10, 20, 30, 40, 50]`, First/Prev/Next/Last navigation
   - [x] 100% Vietnamese toasts with API error extraction pattern.
