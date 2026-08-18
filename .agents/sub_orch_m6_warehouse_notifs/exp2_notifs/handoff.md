# Handoff Report: Milestone 6 — Notifications Feature Standardization

**Explorer**: Explorer 2 (Notifications Feature Analyst)  
**Target Feature**: `frontend/src/features/notifications/` & `frontend/src/app/dashboard/notifications/`  
**Date**: 2026-08-18  
**Status**: Ready for Worker Implementation  

---

## 1. Observation

### 1.1 Existing Architecture & File Inventory
The existing Notifications implementation is located in `frontend/src/features/notifications/` and `frontend/src/app/dashboard/notifications/`:
- `frontend/src/app/dashboard/notifications/page.tsx`:
  Renders `<NotificationsPage />` directly without `Suspense` boundary, `searchParams` parsing, or `infoContent`.
- `frontend/src/features/notifications/components/notifications-page.tsx`:
  - L23: `const [page, setPage] = useState(1);` — Local React state, not synced to URL via `nuqs`.
  - L89: `<Tabs defaultValue='all'>` — Uncontrolled tab state, not synced with `?tab=all|unread|read`.
  - L28-34: Fetches single page (`limit: 20`) and filters in-memory for `unreadNotifications` and `readNotifications`.
  - L81-83: Calls `markAllAsRead.mutate()` without toast notification.
  - L65: Calls `markAsRead.mutate(Number(id))` without toast notification.
- `frontend/src/features/notifications/components/notification-center.tsx`:
  - L23: `const { data, isLoading } = useNotificationsQuery(1, MAX_VISIBLE);`
  - L28: `const unreadCount = notifications.filter((n) => !n.isRead).length;` — Only counts unread items among the first 5 visible notifications rather than using `useUnreadCountQuery()`.
  - L58: `onClick={() => markAllAsRead.mutate()}` — No feedback toasts.
- `frontend/src/features/notifications/hooks/use-notifications-query.ts`:
  - L61-69 (`useMarkAsReadMutation`):
    ```typescript
    export function useMarkAsReadMutation() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: number) => apiClient.patch(`/api/v1/notifications/${id}/read`),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      });
    }
    ```
    Lacks Vietnamese success toast and API-first error message extraction.
  - L72-80 (`useMarkAllAsReadMutation`):
    ```typescript
    export function useMarkAllAsReadMutation() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: () => apiClient.patch('/api/v1/notifications/read-all'),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      });
    }
    ```
    Lacks Vietnamese success toast and API-first error message extraction.
  - L51-58: `useUnreadCountQuery()` queries `GET /api/v1/notifications/unread-count` with query key `['notifications', 'unread-count']`.
- `frontend/src/features/notifications/hooks/use-notification-socket.ts`:
  - L12-13: Singleton socket instance (`sharedSocket`, `mountCount`).
  - L48-68: Listens to `'notification:new'`, invalidates `['notifications']` queries on query client, and triggers Sonner toast `toast(notification.title, { description: notification.body, duration: 5000 })`.
- `frontend/src/components/ui/notification-card.tsx`:
  - Supports types `DISPATCHER`, `FLEET`, `WAREHOUSE`, `GENERIC`.
  - L180-192: Checkmark button with `aria-label='Mark as read'` for marking single notification as read.
  - Formats relative dates (`formatDate`).
  - Implements theme-aware color accent via CSS variables (`var(--chart-1)`, `var(--chart-2)`, `var(--chart-3)`, `var(--muted-foreground)`).

### 1.2 E2E Test Constraints & Selectors
From `frontend/e2e/06-notification-system.spec.ts` & `frontend/e2e/07-notification-ui-visual.spec.ts`:
1. Header Bell Icon & Popover:
   - Button selector: `page.getByRole('button', { name: /notifications/i })`
   - Badge locator: `page.locator('header').getByText(/^[1-9]\d*$/).or(page.locator('span').filter({ hasText: /^[1-9]$|^[1-9]\+$/ }))`
   - Popover heading: `text=Notifications` or `text=No notifications yet`
   - Mark all as read button: `page.getByRole('button', { name: /mark all as read/i })`
2. Notifications Page:
   - Route: `/dashboard/notifications`
   - Tab triggers:
     - All tab: `page.getByRole('tab', { name: /all/i })`
     - Unread tab: `page.getByRole('tab', { name: /unread/i })`
     - Read tab: `page.getByRole('tab', { name: /read/i })` or `page.getByRole('tab', { name: 'Read', exact: false })`
   - Mark as read button on card: `page.getByRole('button', { name: /mark as read/i })`
   - Mark all as read button in page header action: `page.getByRole('button', { name: /mark all as read/i })`

---

## 2. Logic Chain

1. **State Synchronization via `nuqs`**:
   - In M1-M5, listing views synchronize tab and pagination states directly into URL search parameters (`tab`, `page`, `perPage`) using `nuqs`.
   - Notifications currently maintains `useState(1)` for `page` and uncontrolled `<Tabs defaultValue='all'>`.
   - By introducing `useNotificationsFilters()` using `useQueryStates` (`tab: parseAsStringLiteral(['all', 'unread', 'read']).withDefault('all')`, `page: parseAsInteger.withDefault(1)`, `perPage: parseAsInteger.withDefault(20)`), URL state is synchronized bi-directionally.
   - When switching tabs, `page` automatically resets to 1.
   - Deep-linking (`/dashboard/notifications?tab=unread&page=2`) restores exact UI state immediately.

2. **Accurate Global Badge in Notification Center**:
   - `NotificationCenter` in `header.tsx` should use `useUnreadCountQuery()` so the badge accurately displays the user's total unread count (even if there are >5 notifications total).
   - When `useNotificationSocket` invalidates `['notifications']`, both the list queries and `['notifications', 'unread-count']` are refreshed automatically.

3. **100% Vietnamese Toast & API-First Error Pattern**:
   - Following `ORIGINAL_REQUEST.md` (Rules 1 & 2):
     - `useMarkAsReadMutation`:
       - Success: `toast.success('Đã đánh dấu thông báo là đã đọc')`
       - Error:
         ```typescript
         const apiMessage = err?.response?.data?.message;
         toast.error(apiMessage || 'Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.');
         ```
     - `useMarkAllAsReadMutation`:
       - Success: `toast.success('Đã đánh dấu tất cả thông báo là đã đọc')`
       - Error:
         ```typescript
         const apiMessage = err?.response?.data?.message;
         toast.error(apiMessage || 'Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại.');
         ```

4. **Consistency & Accessibility Alignment**:
   - Add `info-content.ts` providing standard Infobar documentation for Notifications (`notificationsInfoContent`).
   - Add `params.ts` containing `notificationsSearchParams`, `notificationsSearchParamsCache`, and `notificationsSerialize`.
   - Wrap `/dashboard/notifications/page.tsx` with `<PageContainer>` and `<Suspense>`.
   - Ensure all buttons and tab triggers have `cursor-pointer` (or `cursor-not-allowed` when disabled).

---

## 3. Concrete Implementation Blueprints for Worker

### Blueprint 1: `frontend/src/features/notifications/params.ts` (New File)
```typescript
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/server';

export const NOTIFICATION_TABS = ['all', 'unread', 'read'] as const;
export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

export const notificationsSearchParams = {
  tab: parseAsStringLiteral(NOTIFICATION_TABS).withDefault('all'),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20)
};

export const notificationsSearchParamsCache = createSearchParamsCache(notificationsSearchParams);
export const notificationsSerialize = createSerializer(notificationsSearchParams);
```

---

### Blueprint 2: `frontend/src/features/notifications/info-content.ts` (New File)
```typescript
import type { InfobarContent } from '@/components/ui/infobar';

export const notificationsInfoContent: InfobarContent = {
  title: 'Trung Tâm Thông Báo — Hướng Dẫn & Tính Năng',
  sections: [
    {
      title: 'Quản Lý Thông Báo Hệ Thống',
      description:
        'Xem và quản lý thông báo điều phối, cảnh báo đội xe, nhập xuất kho bãi theo thời gian thực với kết nối WebSocket hai chiều và bộ lọc phân loại.',
      links: []
    },
    {
      title: 'Đồng Bộ Trạng Thái URL (nuqs)',
      description:
        'Trạng thái chuyển tab (Tất cả / Chưa đọc / Đã đọc) và phân trang được đồng bộ trực tiếp vào URL (?tab=all|unread|read&page=1).',
      links: [
        {
          title: 'nuqs Documentation',
          url: 'https://nuqs.47ng.com'
        }
      ]
    },
    {
      title: 'Chuẩn Hóa Thông Báo Sonner',
      description:
        'Toàn bộ phản hồi đánh dấu đã đọc tuân thủ 100% tiếng Việt và cơ chế bắt lỗi ưu tiên API message first.',
      links: []
    }
  ]
};
```

---

### Blueprint 3: `frontend/src/features/notifications/hooks/use-notifications-filters.ts` (New File)
```typescript
'use client';

import { useQueryStates, parseAsInteger, parseAsStringLiteral } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { NOTIFICATION_TABS, type NotificationTab } from '../params';

export function useNotificationsFilters() {
  const [params, setParams] = useQueryStates({
    tab: parseAsStringLiteral(NOTIFICATION_TABS).withDefault('all'),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20)
  });

  const setTab = useCallback(
    (newTab: NotificationTab) => {
      setParams({ tab: newTab, page: 1 });
    },
    [setParams]
  );

  const setPage = useCallback(
    (newPage: number | ((prev: number) => number)) => {
      if (typeof newPage === 'function') {
        setParams((prev) => ({
          page: Math.max(1, newPage(prev.page ?? 1))
        }));
      } else {
        setParams({ page: Math.max(1, newPage) });
      }
    },
    [setParams]
  );

  const resetFilters = useCallback(() => {
    setParams({
      tab: 'all',
      page: 1,
      perPage: 20
    });
  }, [setParams]);

  const isAnyFilterActive = useMemo(() => {
    return params.tab !== 'all' || params.page > 1;
  }, [params]);

  return {
    tab: params.tab,
    page: params.page,
    perPage: params.perPage,
    setTab,
    setPage,
    setParams,
    resetFilters,
    isAnyFilterActive
  };
}
```

---

### Blueprint 4: `frontend/src/features/notifications/hooks/use-notifications-query.ts` (Updated)
```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export type NotificationType = 'WAREHOUSE' | 'FLEET' | 'DISPATCHER' | 'GENERIC';

export type NotificationItem = {
  id: number;
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResponse = {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
};

async function fetchNotifications(page: number, limit: number): Promise<NotificationsResponse> {
  const res = await apiClient.get<NotificationsResponse>('/api/v1/notifications', {
    params: { page, limit }
  });
  return res.data;
}

async function fetchUnreadCount(): Promise<number> {
  const res = await apiClient.get<number>('/api/v1/notifications/unread-count');
  return res.data;
}

/**
 * Fetch paginated notification list.
 * staleTime: 30s → backup nếu WebSocket disconnect, data vẫn refresh khi user focus lại tab
 */
export function useNotificationsQuery(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['notifications', { page, limit }],
    queryFn: () => fetchNotifications(page, limit),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true
  });
}

/** Count unread — dùng cho badge */
export function useUnreadCountQuery() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true
  });
}

/** Mark single notification as read */
export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.patch(`/api/v1/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu thông báo là đã đọc');
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.');
    }
  });
}

/** Mark all notifications as read */
export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch('/api/v1/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Không thể đánh dấu tất cả thông báo là đã đọc. Vui lòng thử lại.');
    }
  });
}
```

---

### Blueprint 5: `frontend/src/features/notifications/components/notifications-page.tsx` (Updated)
```tsx
'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationSocket } from '../hooks/use-notification-socket';
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type NotificationItem
} from '../hooks/use-notifications-query';
import { useNotificationsFilters } from '../hooks/use-notifications-filters';
import { notificationsInfoContent } from '../info-content';
import type { NotificationTab } from '../params';

export default function NotificationsPage() {
  // Kết nối WebSocket real-time (singleton)
  useNotificationSocket();

  const { tab, page, perPage, setTab, setPage } = useNotificationsFilters();
  const { data, isLoading, isFetching } = useNotificationsQuery(page, perPage);
  const { data: unreadCountData } = useUnreadCountQuery();
  const markAsRead = useMarkAsReadMutation();
  const markAllAsRead = useMarkAllAsReadMutation();

  const notifications = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage) || 1;

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);
  const unreadCount = typeof unreadCountData === 'number' ? unreadCountData : unreadNotifications.length;
  const readCount = Math.max(0, total - unreadCount);

  const renderList = (items: NotificationItem[]) => {
    if (isLoading) {
      return (
        <div className='flex items-center justify-center py-16'>
          <Icons.spinner className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>No notifications</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={String(notification.id)}
            title={notification.title}
            body={notification.body}
            type={notification.type}
            status={notification.isRead ? 'read' : 'unread'}
            createdAt={notification.createdAt}
            onMarkAsRead={(id) => markAsRead.mutate(Number(id))}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Notifications'
      pageDescription='View and manage all your notifications.'
      infoContent={notificationsInfoContent}
      pageHeaderAction={
        unreadCount > 0 ? (
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer'
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as NotificationTab)}>
        <TabsList>
          <TabsTrigger value='all' className='cursor-pointer'>
            All ({total})
          </TabsTrigger>
          <TabsTrigger value='unread' className='cursor-pointer'>
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value='read' className='cursor-pointer'>
            Read ({readCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {renderList(notifications)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {renderList(unreadNotifications)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {renderList(readNotifications)}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-6 flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer disabled:cursor-not-allowed'
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icons.chevronLeft className='h-4 w-4' />
            Prev
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page} / {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer disabled:cursor-not-allowed'
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <Icons.chevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
```

---

### Blueprint 6: `frontend/src/features/notifications/components/notification-center.tsx` (Updated)
```tsx
'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NotificationCard } from '@/components/ui/notification-card';
import { useNotificationSocket } from '../hooks/use-notification-socket';
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation
} from '../hooks/use-notifications-query';

const MAX_VISIBLE = 5;

export function NotificationCenter() {
  // Kết nối WebSocket real-time (singleton — chỉ tạo 1 socket dù gọi nhiều lần)
  useNotificationSocket();

  const { data, isLoading } = useNotificationsQuery(1, MAX_VISIBLE);
  const { data: unreadCountData } = useUnreadCountQuery();
  const markAsRead = useMarkAsReadMutation();
  const markAllAsRead = useMarkAllAsReadMutation();

  const notifications = data?.data ?? [];
  const unreadCount = typeof unreadCountData === 'number' ? unreadCountData : notifications.filter((n) => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='ghost' size='icon' className='relative h-8 w-8 cursor-pointer' />}>
        <Icons.notification className='h-4 w-4' />
        {unreadCount > 0 && (
          <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className='sr-only'>Notifications</span>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between px-4 pt-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1 cursor-pointer'>
            <h4 className='text-sm font-semibold group-hover:underline'>Notifications</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                {unreadCount} new
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs cursor-pointer'
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Icons.spinner className='text-muted-foreground h-5 w-5 animate-spin' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>No notifications yet</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={String(notification.id)}
                  title={notification.title}
                  body={notification.body}
                  type={notification.type}
                  status={notification.isRead ? 'read' : 'unread'}
                  createdAt={notification.createdAt}
                  onMarkAsRead={(id) => markAsRead.mutate(Number(id))}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

---

### Blueprint 7: `frontend/src/app/dashboard/notifications/page.tsx` (Updated)
```tsx
import { Suspense } from 'react';
import NotificationsPage from '@/features/notifications/components/notifications-page';
import { notificationsSearchParamsCache } from '@/features/notifications/params';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Notifications'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  notificationsSearchParamsCache.parse(searchParams);

  return (
    <Suspense>
      <NotificationsPage />
    </Suspense>
  );
}
```

---

### Blueprint 8: `frontend/src/features/notifications/index.ts` (New Entry Point)
```typescript
export * from './params';
export * from './info-content';
export * from './hooks/use-notifications-query';
export * from './hooks/use-notifications-filters';
export * from './hooks/use-notification-socket';
export { default as NotificationsPage } from './components/notifications-page';
export { NotificationCenter } from './components/notification-center';
```

---

## 4. Caveats

1. **Backend Contract**:
   - Backend endpoint `GET /api/v1/notifications` accepts `{ page, limit }` and returns paginated items ordered by `createdAt: DESC`.
   - The backend does not currently have a query param filter for `isRead=true|false`. The frontend tab views ('unread' and 'read') filter items in the current page. Total unread count is retrieved via `GET /api/v1/notifications/unread-count`.
2. **E2E Text Matching**:
   - E2E tests `06-notification-system.spec.ts` and `07-notification-ui-visual.spec.ts` look for specific text strings:
     - Heading & empty states: `Notifications`, `No notifications yet`, `No notifications`.
     - Tabs: `/all/i`, `/unread/i`, `/read/i`.
     - Action buttons: `/mark all as read/i`, `/mark as read/i`.
   - The blueprints strictly preserve these labels in English while keeping 100% of toast messages in Vietnamese with API-first error message extraction.

---

## 5. Conclusion

- The Notifications feature has been thoroughly analyzed across both client and server contracts, WebSocket push mechanism, query state synchronization, and E2E test specs.
- The Worker can execute the implementation by creating `params.ts`, `info-content.ts`, `hooks/use-notifications-filters.ts`, and updating `use-notifications-query.ts`, `notifications-page.tsx`, `notification-center.tsx`, and `/app/dashboard/notifications/page.tsx` directly without architectural friction.

---

## 6. Verification Method

1. **Type Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

2. **Lint Check**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npm run lint
   ```

3. **E2E Test Execution**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/06-notification-system.spec.ts
   npx playwright test e2e/07-notification-ui-visual.spec.ts
   ```
