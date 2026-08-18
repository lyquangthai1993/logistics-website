# Handoff Report: Milestone 6 — Warehouse Standardization Analysis & Blueprint

## 1. Observation

### Existing Warehouse Inbound Implementation
- **Target File**: `frontend/src/app/dashboard/warehouse/page.tsx` (331 lines)
- **Architecture**: Monolithic client component (`'use client'`) with un-synchronized raw React state (`useState`, `useEffect`).
- **Data Fetching**: Calls `tripsApi.getTrips({ limit: 100 })` directly inside `useEffect` (L39) and filters client-side for `status === 'CONFIRMED' || status === 'IN_TRANSIT'` (L41).
- **Filtering & Search**:
  - Hardcoded Hub list (L22-28):
    ```typescript
    const HUBS = [
      'Andromeda Hub (Hà Nội)',
      'Magellan Hub (Đà Nẵng)',
      'Centaurus Hub (TP.HCM)',
      'Pegasus Hub (Cần Thơ)',
      'Vela Hub (Hải Phòng)'
    ];
    ```
  - Client-side text matching on `order.orderCode`, `vehicle.licensePlate`, `driver.fullName`, `vehicle.externalProvider` (L55-72).
  - Hub filter via `<select id="warehouse-hub-filter">` (L188-206).
  - Search input via `<Input placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe...">` (L178-184).
- **KPI Metrics Calculation** (L75-83):
  - `totalTrips`: `filteredTrips.length`
  - `externalTrips`: `filteredTrips.filter((t) => t.vehicle?.isExternal).length`
  - `totalWeight`: `filteredTrips.reduce((acc, t) => acc + (t.weightAllocated || 0), 0)`
  - `totalVolume`: `filteredTrips.reduce((acc, t) => acc + (t.volumeAllocated || 0), 0)`
- **UI Layout**:
  - Header: `IconBuildingWarehouse` + `Inbound Hub & Kho Tiếp Nhận` (L90-93).
  - 4 Metric Cards: Tổng chuyến sắp đến (Blue), Xe thuê ngoài (Amber), Tổng tải trọng dự kiến (Emerald), Tổng thể tích hàng (Purple) (L111-171).
  - Inbound Cards Grid: 3-column card grid rendering trip status, route, vehicle/driver details, cargo weights, and ETA (L224-327).

### E2E Test Constraints Observed
- `frontend/e2e/06-order-dispatch-workflow.spec.ts` (L103-114):
  - Requires heading: `page.getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
  - Requires search input: `page.fill('input[placeholder*="Tìm theo mã đơn"]', testOrderCode)`
  - Requires text assertion: `expect(page.locator(\`text=\${testOrderCode}\`).first()).toBeVisible()`
- `frontend/e2e/03-rbac-routing.spec.ts` (L22):
  - Route `/dashboard/warehouse` accessible to roles `SUPER_ADMIN` and `WAREHOUSE_MANAGER`.

### Canonical Table Patterns Observed in Reference Features
- `src/features/hubs/`: Modular structure with `hubs-listing.tsx`, `hubs-metrics.tsx`, `hubs-tables/` (`index.tsx`, `columns.tsx`, `cell-action.tsx`, `options.tsx`, `use-hubs-table-filters.tsx`), `params.ts`, `info-content.ts`.
- `src/features/trips/`: Server prefetch with `tripsQueryOptions`, `HydrationBoundary`, `DataTableToolbar`, `DataTablePagination`, sortable `DataTableColumnHeader`, `useTripsTableFilters` with `nuqs`.
- `src/features/orders/`: Date range preset bar, KPI cards, table with server pagination and faceted filters.
- `src/components/ui/table/`: Shared primitive components (`DataTable`, `DataTablePagination`, `DataTableToolbar`, `DataTableColumnHeader`, `DataTableFacetedFilter`).

---

## 2. Logic Chain

1. **State Synchronization Necessity**: The legacy warehouse page manages search and filter state via local React state (`useState`), meaning URL bookmarking, deep-linking, and browser back/forward navigation do not persist filter states. Adopting `nuqs` URL query parameters (`page`, `perPage`, `search`, `hub`, `status`, `view`, `sort`) aligns `/dashboard/warehouse` with the rest of the application.
2. **Canonical Table Standardization**: The project specification (`ORIGINAL_REQUEST.md` R1/R2) requires all listing pages to utilize `@tanstack/react-table` v8 wrapped in `@/components/ui/table/data-table` and `@/components/ui/table/data-table-pagination`.
3. **Dual View Capability (Table & Card Board)**: While the canonical `DataTable` must be the core standardized listing component, warehouse operators benefit from visual card representations during dock receiving. Providing a seamless view toggle (`view=table` vs `view=cards`) within `DataTableToolbar` satisfies both strict compliance with `DataTable` requirements and preservation of the operational Inbound Card Board layout.
4. **Data Layer Reuse**: The existing `tripsQueryOptions`, `getTrips` API service (`@/features/trips/api`), and `activeHubsQueryOptions` (`@/features/hubs/api`) already support pagination, search, status filtering, and hub filtering. Reusing these tested queries prevents duplicate API code and guarantees schema consistency across features.
5. **E2E Compatibility**: By configuring `PageContainer` with `pageTitle="Inbound Hub & Kho Tiếp Nhận"`, setting column filter metadata `placeholder="Tìm theo mã đơn, biển số, tài xế, nhà xe..."`, and displaying the order code prominently in both table and card views, all existing E2E specs will pass without modification.

---

## 3. Caveats

- **Status Scope**: By default, warehouse inbound focuses on active inbound trips (`CONFIRMED`, `IN_TRANSIT`). The status filter in `options.ts` supports `ALL`, `CONFIRMED`, `IN_TRANSIT`, and `COMPLETED`.
- **Backend Hub Filter**: In `trips.service.ts` (L295-299), `hub` parameter queries `(order.originHub = :hub OR order.destinationHub = :hub OR vehicle.currentHub = :hub)`.
- **RBAC**: Handled at middleware/proxy level (`src/proxy.ts` allows `SUPER_ADMIN` and `WAREHOUSE_MANAGER`).

---

## 4. Conclusion & Implementation Blueprint for Worker

The Worker will implement the modular `src/features/warehouse/` package and refactor `src/app/dashboard/warehouse/page.tsx` according to the following concrete specifications:

### Target Directory Structure
```
frontend/src/
├── app/dashboard/warehouse/
│   └── page.tsx                               # Server page with PageContainer & metadata
└── features/warehouse/
    ├── api/                                    # (Optional) Re-export or custom query hooks
    ├── info-content.ts                         # Warehouse Inbound operating guide
    ├── params.ts                               # nuqs search params cache & serializer
    └── components/
        ├── index.ts                            # Barrel exports
        ├── warehouse-listing.tsx               # Async Server component with prefetching
        ├── warehouse-kpi-cards.tsx             # 4 Metric KPI summary cards
        ├── warehouse-inbound-board.tsx         # Card Grid visual inbound board
        └── warehouse-tables/
            ├── index.tsx                       # Client DataTable with useDataTable
            ├── columns.tsx                     # ColumnDef<Trip>[] with badges & headers
            ├── cell-action.tsx                 # Action menu (view order, complete, copy)
            ├── options.ts                      # Hubs, status, view options
            └── use-warehouse-table-filters.tsx # Nuqs search params hook
```

---

### Exact File Specifications

#### 1. `frontend/src/features/warehouse/params.ts`
```typescript
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const warehouseSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString,
  hub: parseAsString,
  hubId: parseAsString,
  destinationHub: parseAsString,
  status: parseAsString.withDefault('ALL'),
  view: parseAsString.withDefault('table'), // 'table' | 'cards'
  sort: parseAsString
};

export const warehouseSearchParamsCache = createSearchParamsCache(warehouseSearchParams);
export const warehouseSerialize = createSerializer(warehouseSearchParams);
```

#### 2. `frontend/src/features/warehouse/info-content.ts`
```typescript
import type { InfobarContent } from '@/components/ui/infobar';

export const warehouseInfoContent: InfobarContent = {
  title: 'Quy Trình Quản Lý Kho & Tiếp Nhận Hàng (Warehouse Inbound)',
  sections: [
    {
      title: 'Tổng Quan & Vai Trò',
      description:
        'Màn hình Inbound Board dành riêng cho Thủ kho (WAREHOUSE_MANAGER) và Quản trị viên (SUPER_ADMIN) để theo dõi các chuyến xe vận chuyển hàng hóa sắp cập bến Hub. Hệ thống tự động cập nhật danh sách xe sau khi Quản lý Đội xe xác nhận điều phối.',
      links: []
    },
    {
      title: 'Quy Trình Kiểm Tra & Tiếp Nhận',
      description:
        '1. Đối soát Thông Tin: Kiểm tra biển số xe, tài xế và mã vận đơn đối chiếu với thông tin chuyến xe trên hệ thống.\n2. Xe Thuê Ngoài (Đối tác): Với các chuyến xe có nhãn "Xe ngoài", thủ kho cần kiểm tra hợp đồng vận chuyển và giấy tờ tùy thân của tài xế đối tác.\n3. Kiểm Đếm Tải Trọng & Thể Tích: Đối chiếu khối lượng (kg) và thể tích (m³) thực nhận so với phiếu điều vận.\n4. Đánh Dấu Hoàn Thành: Khi hàng hóa đã dỡ an toàn vào kho, chọn "Đánh dấu hoàn thành" để cập nhật trạng thái đơn hàng.',
      links: []
    },
    {
      title: 'Chế Độ Hiển Thị Linh Hoạt',
      description:
        'Thủ kho có thể chuyển đổi linh hoạt giữa Dạng Bảng (Data Table chuẩn với phân trang, lọc nâng cao) và Dạng Thẻ (Card Board trực quan theo từng chuyến xe) trên thanh công cụ.',
      links: [
        {
          title: 'Quản lý Chi Nhánh Kho (Hubs)',
          url: '/dashboard/admin/hubs'
        }
      ]
    }
  ]
};
```

#### 3. `frontend/src/features/warehouse/components/warehouse-tables/options.ts`
```typescript
export const DEFAULT_HUBS = [
  'Andromeda Hub (Hà Nội)',
  'Magellan Hub (Đà Nẵng)',
  'Centaurus Hub (TP.HCM)',
  'Pegasus Hub (Cần Thơ)',
  'Vela Hub (Hải Phòng)'
];

export const WAREHOUSE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'CONFIRMED', label: 'Đã xác nhận (Sắp đến)' },
  { value: 'IN_TRANSIT', label: 'Đang chạy (Trên đường)' },
  { value: 'COMPLETED', label: 'Hoàn thành (Đã nhận)' }
];

export const WAREHOUSE_VIEW_OPTIONS = [
  { value: 'table', label: 'Dạng Bảng (Table)' },
  { value: 'cards', label: 'Dạng Thẻ (Cards)' }
];
```

#### 4. `frontend/src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx`
```typescript
'use client';

import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { useCallback, useMemo } from 'react';
import type { QueryTripParams } from '@/features/trips/api/types';

export function useWarehouseTableFilters(columnIds: string[] = []) {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    name: parseAsString,
    hub: parseAsString,
    hubId: parseAsString,
    destinationHub: parseAsString,
    status: parseAsString.withDefault('ALL'),
    view: parseAsString.withDefault('table'),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const search = params.name || params.search || '';
  const selectedHub = params.hub || params.destinationHub || params.hubId || 'ALL';
  const selectedStatus = params.status || 'ALL';
  const currentView = (params.view as 'table' | 'cards') || 'table';

  const filters: QueryTripParams = useMemo(
    () => ({
      page: params.page,
      limit: params.perPage,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(selectedHub !== 'ALL' ? { hub: selectedHub } : {}),
      ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
      ...(params.sort && params.sort.length > 0 ? { sort: JSON.stringify(params.sort) } : {})
    }),
    [params.page, params.perPage, search, selectedHub, selectedStatus, params.sort]
  );

  const resetFilters = useCallback(() => {
    setParams({
      search: null,
      name: null,
      hub: null,
      hubId: null,
      destinationHub: null,
      status: 'ALL',
      page: 1
    });
  }, [setParams]);

  const isAnyFilterActive = useMemo(() => {
    return Boolean(
      params.search ||
      params.name ||
      (params.hub && params.hub !== 'ALL') ||
      (params.destinationHub && params.destinationHub !== 'ALL') ||
      (params.status && params.status !== 'ALL')
    );
  }, [params]);

  const setView = useCallback(
    (view: 'table' | 'cards') => {
      setParams({ view });
    },
    [setParams]
  );

  const setSelectedHub = useCallback(
    (hub: string) => {
      setParams({ hub: hub === 'ALL' ? null : hub, page: 1 });
    },
    [setParams]
  );

  const setSelectedStatus = useCallback(
    (status: string) => {
      setParams({ status: status === 'ALL' ? null : status, page: 1 });
    },
    [setParams]
  );

  return {
    params,
    setParams,
    search,
    selectedHub,
    selectedStatus,
    currentView,
    setView,
    setSelectedHub,
    setSelectedStatus,
    filters,
    resetFilters,
    isAnyFilterActive
  };
}
```

#### 5. `frontend/src/features/warehouse/components/warehouse-tables/columns.tsx`
```typescript
'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { WAREHOUSE_STATUS_OPTIONS } from './options';
import type { Trip, TripStatus } from '@/features/trips/api/types';

export function renderTripStatusBadge(status: TripStatus) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge
          variant='secondary'
          className='bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
        >
          Đã xác nhận
        </Badge>
      );
    case 'IN_TRANSIT':
      return (
        <Badge
          variant='secondary'
          className='bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 font-semibold'
        >
          Đang chạy
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge
          variant='secondary'
          className='bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 font-semibold'
        >
          Hoàn thành
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge
          variant='secondary'
          className='bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
        >
          Chờ xác nhận
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

export const columns: ColumnDef<Trip>[] = [
  {
    id: 'tripSequence',
    accessorKey: 'sequenceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Chuyến Xe / Mã Đơn' />,
    meta: {
      id: 'warehouse-search-input',
      label: 'Tìm kiếm',
      placeholder: 'Tìm theo mã đơn, biển số, tài xế, nhà xe...',
      variant: 'text',
      icon: Icons.search
    },
    cell: ({ row }) => {
      const trip = row.original;
      const isExternal = trip.vehicle?.isExternal;
      const orderCode = trip.order?.orderCode || `Đơn #${trip.orderId}`;

      return (
        <div className='space-y-0.5'>
          <div className='font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5'>
            <span>Chuyến #{trip.sequenceNumber || trip.id}</span>
            {isExternal && (
              <Badge className='bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold'>
                🚛 Xe ngoài
              </Badge>
            )}
          </div>
          {trip.orderId ? (
            <Link
              href={`/dashboard/orders/${trip.orderId}`}
              className='text-xs font-mono text-blue-600 hover:underline dark:text-blue-400 block cursor-pointer'
            >
              {orderCode}
            </Link>
          ) : (
            <span className='text-xs font-mono text-slate-400 block'>{orderCode}</span>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    enableSorting: true
  },
  {
    id: 'route',
    header: 'Tuyến Đường (Gửi &rarr; Nhận)',
    cell: ({ row }) => {
      const order = row.original.order;
      const origin = order?.originHub?.split(' ')[0] || 'Kho gửi';
      const dest = order?.destinationHub || 'Kho nhận';

      return (
        <div className='space-y-1 text-xs'>
          <div className='flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium'>
            <Icons.mapPin className='h-3.5 w-3.5 text-blue-500 shrink-0' />
            <span>{origin}</span>
            <span>&rarr;</span>
            <strong className='text-slate-900 dark:text-slate-100'>{dest}</strong>
          </div>
        </div>
      );
    }
  },
  {
    id: 'vehicle',
    accessorFn: (row) => row.vehicle?.licensePlate || '',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Phương Tiện' />,
    cell: ({ row }) => {
      const trip = row.original;
      const isExternal = trip.vehicle?.isExternal;

      return (
        <div className='text-slate-800 dark:text-slate-200 text-xs'>
          <div className='font-mono font-bold text-sm'>
            {trip.vehicle?.licensePlate || '—'}
          </div>
          <span className='text-muted-foreground block mt-0.5'>
            {isExternal ? (
              <span className='text-amber-700 dark:text-amber-300 font-medium'>
                Đối tác: {trip.vehicle?.externalProvider || 'Thuê ngoài'}
              </span>
            ) : (
              trip.vehicle?.type || 'Xe nội bộ'
            )}
          </span>
        </div>
      );
    },
    enableSorting: true
  },
  {
    id: 'driver',
    accessorFn: (row) => row.driver?.fullName || '',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tài Xế & SĐT' />,
    cell: ({ row }) => {
      const trip = row.original;
      return (
        <div className='text-slate-800 dark:text-slate-200 text-xs'>
          <div className='font-medium text-sm flex items-center gap-1'>
            <Icons.user className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
            {trip.driver?.fullName || 'Chưa gán'}
          </div>
          {trip.driver?.phone && (
            <div className='text-muted-foreground mt-0.5 flex items-center gap-1 font-mono text-[11px]'>
              <Icons.phone className='h-3 w-3 shrink-0' />
              {trip.driver.phone}
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'cargo',
    accessorKey: 'weightAllocated',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tải Trọng / Thể Tích' />,
    cell: ({ row }) => {
      const trip = row.original;
      return (
        <div className='font-mono text-slate-800 dark:text-slate-200 text-xs'>
          <div className='font-bold text-sm'>
            {trip.weightAllocated?.toLocaleString() ?? 0} kg
          </div>
          <span className='text-muted-foreground text-[11px] block'>
            {trip.volumeAllocated ?? 0} m³
          </span>
        </div>
      );
    },
    enableSorting: true
  },
  {
    id: 'schedule',
    header: 'Dự Kiến Đến (ETA)',
    cell: ({ row }) => {
      const trip = row.original;
      return (
        <div className='text-xs text-slate-600 dark:text-slate-400 space-y-0.5'>
          <div className='flex items-center gap-1'>
            <Icons.calendar className='h-3.5 w-3.5 text-slate-400 shrink-0' />
            <span>
              Đến:{' '}
              <strong className='text-slate-900 dark:text-slate-100'>
                {trip.estimatedDeliveryDate || 'Hôm nay'}
              </strong>
            </span>
          </div>
          {trip.pickupDate && (
            <div className='text-[11px] text-muted-foreground pl-4.5'>
              Đi: {trip.pickupDate} {trip.pickupTime || ''}
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Trạng Thái' />,
    meta: {
      label: 'Trạng thái',
      variant: 'select',
      options: WAREHOUSE_STATUS_OPTIONS
    },
    cell: ({ row }) => renderTripStatusBadge(row.original.status),
    enableColumnFilter: true,
    enableSorting: true
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Thao tác</div>,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

#### 6. `frontend/src/features/warehouse/components/warehouse-tables/cell-action.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useUpdateTripMutation } from '@/features/trips/api/mutations';
import type { Trip } from '@/features/trips/api/types';

interface CellActionProps {
  data: Trip;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const updateTripMutation = useUpdateTripMutation();

  const handleCompleteTrip = async () => {
    try {
      await updateTripMutation.mutateAsync({
        id: data.id,
        payload: { status: 'COMPLETED' }
      });
      toast.success('Đã xác nhận tiếp nhận hàng và hoàn thành chuyến xe!');
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(apiMessage || 'Không thể cập nhật trạng thái chuyến xe. Vui lòng thử lại.');
    }
  };

  const handleCopyOrderCode = () => {
    const code = data.order?.orderCode || `Đơn #${data.orderId}`;
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã đơn: ${code}`);
  };

  return (
    <div className='flex items-center justify-end gap-2'>
      {data.status === 'IN_TRANSIT' && (
        <Button
          size='sm'
          onClick={handleCompleteTrip}
          disabled={updateTripMutation.isPending}
          className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5 cursor-pointer shadow-2xs'
        >
          <Icons.check className='h-3.5 w-3.5 mr-1' />
          Nhận Hàng
        </Button>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className='h-8 w-8 p-0 cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            />
          }
        >
          <span className='sr-only'>Mở menu</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Thao tác Inbound</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {data.orderId ? (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/orders/${data.orderId}`)}
                className='cursor-pointer'
              >
                <Icons.eye className='mr-2 h-4 w-4 text-blue-500' />
                Xem chi tiết đơn hàng
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onClick={handleCopyOrderCode} className='cursor-pointer'>
              <Icons.copy className='mr-2 h-4 w-4 text-slate-500' />
              Sao chép mã đơn
            </DropdownMenuItem>

            {data.status !== 'COMPLETED' && (
              <DropdownMenuItem
                onClick={handleCompleteTrip}
                disabled={updateTripMutation.isPending}
                className='cursor-pointer text-emerald-600 focus:text-emerald-600'
              >
                <Icons.circleCheck className='mr-2 h-4 w-4 text-emerald-600' />
                Đánh dấu đã nhận hàng
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

#### 7. `frontend/src/features/warehouse/components/warehouse-kpi-cards.tsx`
```typescript
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { Trip } from '@/features/trips/api/types';

interface WarehouseKpiCardsProps {
  trips?: Trip[];
  loading?: boolean;
}

export function WarehouseKpiCards({ trips = [], loading = false }: WarehouseKpiCardsProps) {
  const metrics = useMemo(() => {
    const totalTrips = trips.length;
    const externalTrips = trips.filter((t) => t.vehicle?.isExternal).length;
    const totalWeight = trips.reduce((acc, t) => acc + (t.weightAllocated || 0), 0);
    const totalVolume = Number(
      trips.reduce((acc, t) => acc + (t.volumeAllocated || 0), 0).toFixed(1)
    );
    return { totalTrips, externalTrips, totalWeight, totalVolume };
  }, [trips]);

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      {/* 1. Tổng chuyến sắp đến */}
      <Card className='shadow-xs border-slate-200/80 dark:border-slate-800'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
            Tổng chuyến sắp đến
          </CardTitle>
          <Icons.truck className='h-4 w-4 text-blue-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-blue-100 dark:bg-blue-950/50 rounded animate-pulse' />
            ) : (
              metrics.totalTrips
            )}
          </div>
          <p className='text-xs text-slate-500 mt-1'>Chuyến xe đã xác nhận / đang chạy</p>
        </CardContent>
      </Card>

      {/* 2. Xe thuê ngoài (Đối tác) */}
      <Card className='shadow-xs border-slate-200/80 dark:border-slate-800'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium text-amber-600 dark:text-amber-400'>
            Xe thuê ngoài (Đối tác)
          </CardTitle>
          <Icons.alertCircle className='h-4 w-4 text-amber-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
            {loading ? (
              <span className='inline-block h-8 w-12 bg-amber-100 dark:bg-amber-950/50 rounded animate-pulse' />
            ) : (
              metrics.externalTrips
            )}
          </div>
          <p className='text-xs text-slate-500 mt-1'>Cần kiểm tra giấy tờ đối tác</p>
        </CardContent>
      </Card>

      {/* 3. Tổng tải trọng dự kiến */}
      <Card className='shadow-xs border-slate-200/80 dark:border-slate-800'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>
            Tổng tải trọng dự kiến
          </CardTitle>
          <Icons.box className='h-4 w-4 text-emerald-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono'>
            {loading ? (
              <span className='inline-block h-8 w-24 bg-emerald-100 dark:bg-emerald-950/50 rounded animate-pulse' />
            ) : (
              `${metrics.totalWeight.toLocaleString()} kg`
            )}
          </div>
          <p className='text-xs text-slate-500 mt-1'>Khối lượng hàng tiếp nhận</p>
        </CardContent>
      </Card>

      {/* 4. Tổng thể tích hàng */}
      <Card className='shadow-xs border-slate-200/80 dark:border-slate-800'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium text-purple-600 dark:text-purple-400'>
            Tổng thể tích hàng
          </CardTitle>
          <Icons.box className='h-4 w-4 text-purple-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono'>
            {loading ? (
              <span className='inline-block h-8 w-20 bg-purple-100 dark:bg-purple-950/50 rounded animate-pulse' />
            ) : (
              `${metrics.totalVolume} m³`
            )}
          </div>
          <p className='text-xs text-slate-500 mt-1'>Thể tích kho cần chuẩn bị</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 8. `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx`
```typescript
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { renderTripStatusBadge } from './warehouse-tables/columns';
import { CellAction } from './warehouse-tables/cell-action';
import type { Trip } from '@/features/trips/api/types';

interface WarehouseInboundBoardProps {
  trips: Trip[];
  loading?: boolean;
}

export function WarehouseInboundBoard({ trips, loading = false }: WarehouseInboundBoardProps) {
  if (loading) {
    return (
      <div className='p-12 text-center text-muted-foreground'>
        Đang tải lịch trình tiếp nhận hàng...
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <Card className='p-12 text-center border-dashed'>
        <Icons.circleCheck className='h-10 w-10 text-emerald-500 mx-auto mb-2' />
        <p className='font-semibold text-foreground'>
          Không có chuyến xe nào đang đến Hub đã chọn.
        </p>
        <p className='text-xs text-muted-foreground mt-1'>
          Các chuyến xe được Fleet Manager xác nhận sẽ xuất hiện tại đây.
        </p>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {trips.map((trip) => {
        const isExternal = trip.vehicle?.isExternal;
        const orderCode = trip.order?.orderCode || `Đơn #${trip.orderId}`;

        return (
          <Card
            key={trip.id}
            className={`shadow-xs transition-all hover:shadow-md border ${
              isExternal
                ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <CardHeader className='pb-3 border-b border-border/60 flex flex-row items-center justify-between'>
              <div>
                {trip.orderId ? (
                  <Link
                    href={`/dashboard/orders/${trip.orderId}`}
                    className='font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block cursor-pointer'
                  >
                    {orderCode}
                  </Link>
                ) : (
                  <span className='font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block'>
                    {orderCode}
                  </span>
                )}
                <CardTitle className='text-base font-bold text-foreground flex items-center gap-1.5 mt-0.5'>
                  <span>Chuyến #{trip.sequenceNumber || trip.id}</span>
                  {isExternal && (
                    <Badge className='bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 font-bold text-[10px]'>
                      🚛 Xe ngoài
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <div className='flex items-center gap-2'>
                {renderTripStatusBadge(trip.status)}
                <CellAction data={trip} />
              </div>
            </CardHeader>

            <CardContent className='p-4 space-y-3'>
              {/* Route & Hub */}
              <div className='space-y-1 text-xs'>
                <div className='flex items-center gap-1.5 text-muted-foreground font-medium'>
                  <Icons.mapPin className='h-3.5 w-3.5 text-blue-500 shrink-0' />
                  <span>{trip.order?.originHub?.split(' ')[0] || 'Kho gửi'}</span>
                  <span>&rarr;</span>
                  <strong className='text-foreground'>{trip.order?.destinationHub || 'Kho nhận'}</strong>
                </div>
              </div>

              {/* Vehicle & Driver Details */}
              <div className='p-2.5 bg-muted/50 rounded-lg text-xs space-y-1.5 border border-border/60'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Phương tiện:</span>
                  <span className='font-mono font-bold text-foreground'>
                    {trip.vehicle?.licensePlate || '—'}
                  </span>
                </div>

                {isExternal && (
                  <div className='flex items-center justify-between text-amber-700 dark:text-amber-300 font-medium'>
                    <span>Nhà xe đối tác:</span>
                    <span className='font-bold'>
                      {trip.vehicle?.externalProvider || 'Thuê ngoài'}
                    </span>
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Tài xế & SĐT:</span>
                  <span className='font-medium text-foreground'>
                    {trip.driver?.fullName || 'Chưa gán'} ({trip.driver?.phone || 'N/A'})
                  </span>
                </div>
              </div>

              {/* Cargo Payload */}
              <div className='grid grid-cols-2 gap-2 text-xs pt-1'>
                <div>
                  <span className='text-muted-foreground block'>Khối lượng nhận</span>
                  <span className='font-mono font-bold text-foreground'>
                    {trip.weightAllocated?.toLocaleString() ?? 0} kg
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground block'>Thể tích</span>
                  <span className='font-mono font-bold text-foreground'>
                    {trip.volumeAllocated ?? 0} m³
                  </span>
                </div>
              </div>

              {/* Schedule */}
              <div className='pt-2 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between'>
                <div className='flex items-center gap-1'>
                  <Icons.calendar className='h-3.5 w-3.5 text-muted-foreground' />
                  <span>
                    Dự kiến đến:{' '}
                    <strong className='text-foreground'>
                      {trip.estimatedDeliveryDate || 'Hôm nay'}
                    </strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

#### 9. `frontend/src/features/warehouse/components/warehouse-tables/index.tsx`
```typescript
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { tripsQueryOptions } from '@/features/trips/api/queries';
import { activeHubsQueryOptions } from '@/features/hubs/api/queries';
import { columns } from './columns';
import { useWarehouseTableFilters } from './use-warehouse-table-filters';
import { WarehouseKpiCards } from '../warehouse-kpi-cards';
import { WarehouseInboundBoard } from '../warehouse-inbound-board';
import { DEFAULT_HUBS } from './options';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function WarehouseTable() {
  const {
    filters,
    params,
    selectedHub,
    selectedStatus,
    currentView,
    setView,
    setSelectedHub,
    setSelectedStatus
  } = useWarehouseTableFilters(columnIds);

  const { data: tripsResponse, isLoading: isTripsLoading, refetch } = useQuery(
    tripsQueryOptions(filters)
  );
  const { data: allInboundTripsResponse } = useQuery(
    tripsQueryOptions({ limit: 100 })
  );
  const { data: activeHubs = [] } = useQuery(activeHubsQueryOptions());

  const hubOptions = activeHubs.length > 0
    ? activeHubs.map((h) => h.name)
    : DEFAULT_HUBS;

  const trips = tripsResponse?.data ?? [];
  const total = tripsResponse?.meta?.total ?? 0;
  const perPage = params.perPage || 10;
  const pageCount = Math.ceil(total / perPage);

  const { table } = useDataTable({
    data: trips,
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
      {/* KPI Cards */}
      <WarehouseKpiCards
        trips={allInboundTripsResponse?.data ?? trips}
        loading={isTripsLoading}
      />

      {/* View Switcher & Hub Selector Bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/70 shadow-2xs'>
        <div className='flex items-center gap-3'>
          <label
            htmlFor='warehouse-hub-filter'
            className='text-xs font-semibold text-muted-foreground whitespace-nowrap'
          >
            Lọc theo Hub đích:
          </label>
          <select
            id='warehouse-hub-filter'
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className='px-3 py-1.5 text-xs sm:text-sm bg-background border border-border rounded-md focus:outline-none cursor-pointer'
          >
            <option value='ALL'>Tất cả các Hub tiếp nhận</option>
            {hubOptions.map((hub) => (
              <option key={hub} value={hub}>
                {hub}
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center gap-2 self-end sm:self-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            className='h-8 text-xs cursor-pointer'
          >
            <Icons.refresh className='mr-1.5 h-3.5 w-3.5' />
            Làm mới
          </Button>

          <div className='flex items-center rounded-md border border-border bg-muted p-0.5'>
            <Button
              variant={currentView === 'table' ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setView('table')}
              className='h-7 px-2.5 text-xs cursor-pointer'
              title='Chế độ bảng'
            >
              <Icons.table className='h-3.5 w-3.5 mr-1' />
              Bảng
            </Button>
            <Button
              variant={currentView === 'cards' ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setView('cards')}
              className='h-7 px-2.5 text-xs cursor-pointer'
              title='Chế độ thẻ'
            >
              <Icons.layoutGrid className='h-3.5 w-3.5 mr-1' />
              Thẻ
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Card Board */}
      {currentView === 'table' ? (
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      ) : (
        <div className='space-y-4'>
          <WarehouseInboundBoard trips={trips} loading={isTripsLoading} />
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}

export function WarehouseTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='grid gap-4 md:grid-cols-4'>
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
        <div className='bg-muted h-28 rounded-lg' />
      </div>
      <div className='bg-muted h-12 w-full rounded-lg' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
```

#### 10. `frontend/src/features/warehouse/components/warehouse-listing.tsx`
```typescript
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { warehouseSearchParamsCache } from '../params';
import { tripsQueryOptions } from '@/features/trips/api/queries';
import { activeHubsQueryOptions } from '@/features/hubs/api/queries';
import { WarehouseTable } from './warehouse-tables';
import type { QueryTripParams } from '@/features/trips/api/types';

export default async function WarehouseListing() {
  const page = warehouseSearchParamsCache.get('page') || 1;
  const perPage = warehouseSearchParamsCache.get('perPage') || 10;
  const search =
    warehouseSearchParamsCache.get('name') || warehouseSearchParamsCache.get('search');
  const hub =
    warehouseSearchParamsCache.get('hub') ||
    warehouseSearchParamsCache.get('destinationHub') ||
    warehouseSearchParamsCache.get('hubId');
  const status = warehouseSearchParamsCache.get('status');
  const sort = warehouseSearchParamsCache.get('sort');

  const filters: QueryTripParams = {
    page,
    limit: perPage,
    ...(search && { search }),
    ...(hub && hub !== 'ALL' && { hub }),
    ...(status && status !== 'ALL' && { status }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  // Prefetch trips list, total dataset for metrics, and active hubs in parallel
  void queryClient.prefetchQuery(tripsQueryOptions(filters));
  void queryClient.prefetchQuery(tripsQueryOptions({ limit: 100 }));
  void queryClient.prefetchQuery(activeHubsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WarehouseTable />
    </HydrationBoundary>
  );
}
```

#### 11. `frontend/src/features/warehouse/components/index.ts`
```typescript
export { default as WarehouseListing } from './warehouse-listing';
export { WarehouseTable, WarehouseTableSkeleton } from './warehouse-tables';
export { WarehouseKpiCards } from './warehouse-kpi-cards';
export { WarehouseInboundBoard } from './warehouse-inbound-board';
```

#### 12. `frontend/src/app/dashboard/warehouse/page.tsx`
```typescript
import PageContainer from '@/components/layout/page-container';
import WarehouseListing from '@/features/warehouse/components/warehouse-listing';
import { warehouseInfoContent } from '@/features/warehouse/info-content';
import { warehouseSearchParamsCache } from '@/features/warehouse/params';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Inbound Hub & Kho Tiếp Nhận | Logistics TMS'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function WarehouseInboundPage(props: PageProps) {
  const searchParams = await props.searchParams;
  warehouseSearchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Inbound Hub & Kho Tiếp Nhận'
      pageDescription='Bảng theo dõi các chuyến xe vận chuyển hàng hóa sắp cập bến Hub và kho lưu trữ (Inbound Board)'
      infoContent={warehouseInfoContent}
    >
      <WarehouseListing />
    </PageContainer>
  );
}
```

---

## 5. Verification Method

### 1. Build Verification
```powershell
cd d:\Projects\logistics-website\frontend
npm run build
```
*Expected Result*: Build compiles successfully with 0 TypeScript and 0 linting errors.

### 2. E2E Test Suite Verification
```powershell
cd d:\Projects\logistics-website\frontend
npx playwright test e2e/06-order-dispatch-workflow.spec.ts
npx playwright test e2e/03-rbac-routing.spec.ts
```
*Expected Result*:
- `06-order-dispatch-workflow.spec.ts` Step 3 verifies `/dashboard/warehouse` heading, fills `input[placeholder*="Tìm theo mã đơn"]`, and validates order code card visibility.
- `03-rbac-routing.spec.ts` confirms route accessibility for `SUPER_ADMIN` and `WAREHOUSE_MANAGER`.

### 3. Visual & Interactive Checkpoints
- Verify URL synchronization with `nuqs` when changing search input, hub filter, status filter, and pagination.
- Verify view toggle between Table view and Inbound Cards Grid view.
- Verify KPI summary cards render accurate calculations for total trips, external trips, total payload weight, and total volume.
