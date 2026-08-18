# Architectural Design & Specification: Hubs Management Standardization

## 1. Executive Summary & Objective

This document defines the standardized modular architecture for the Hubs Management feature (`/dashboard/admin/hubs`) in the Logistics TMS frontend (`frontend/src/features/hubs/` and `frontend/src/app/dashboard/admin/hubs/page.tsx`).

The refactoring aligns the Hubs page with the canonical `@tanstack/react-table` v8 + `nuqs` + TanStack Query v5 + Shadcn UI architecture established in `/dashboard/product` and `/dashboard/users`, while preserving:
1. **100% E2E Playwright Selectors**: `#hub-search-input`, `#btn-add-hub`, `#hub-form-dialog`, input IDs (`#input-hub-code`, `#input-hub-city`, `#input-hub-name`, `#input-hub-address`, `#input-hub-manager`, `#input-hub-phone`, `#input-hub-is-active`), and button text (`"Thêm Chi Nhánh"`, `"Lưu Thay Đổi"`).
2. **Business Domain Logic**: Live NestJS `/api/v1/hubs` API integration, soft deletion with vehicle association warning, active status toggle, KPI cards, and role-based permissions (`SUPER_ADMIN` write access, open read for dispatch/fleet dropdowns).
3. **Toast Notifications Compliance**: 100% Vietnamese messages with API-first error message extraction (`const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback');`).

---

## 2. Directory & Module Structure

```
frontend/src/features/hubs/
├── api/
│   ├── types.ts                     # TypeScript interfaces (Hub, DTOs, Filters, Responses)
│   ├── service.ts                   # Data access layer calling apiClient (/api/v1/hubs)
│   ├── queries.ts                   # queryKeys factory & queryOptions definitions
│   └── mutations.ts                 # mutationOptions with query cache invalidation
├── components/
│   ├── hubs-listing.tsx             # Server Component: prefetch + HydrationBoundary
│   ├── hubs-metrics.tsx             # 4 KPI Summary Cards (Total, Active, Inactive, Total Vehicles)
│   ├── hub-form-dialog.tsx          # Create/Edit Hub modal dialog preserving #hub-form-dialog
│   └── hubs-tables/
│       ├── index.tsx                # Client Table component with useDataTable + useSuspenseQuery
│       ├── columns.tsx              # ColumnDef<Hub>[] with DataTableColumnHeader, badges, action
│       ├── cell-action.tsx          # Row actions: Edit, Toggle Active, Soft Delete dialog
│       ├── options.tsx              # Filter options (HUB_STATUS_OPTIONS)
│       └── use-hubs-table-filters.tsx # nuqs URL search parameters hook
└── info-content.ts                  # Infobar explanation content for page heading

frontend/src/app/dashboard/admin/hubs/
└── page.tsx                         # Server Component entry point with searchParamsCache.parse
```

---

## 3. Search Params & URL Synchronization Strategy

### 3.1 Parameter Definitions (`src/lib/searchparams.ts`)
The shared `searchParams` definition is extended to include `search`, `status`, and `isActive` alongside standard pagination keys:

```typescript
export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  search: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  role: parseAsString,
  status: parseAsString,
  isActive: parseAsString,
  sort: parseAsString
};
```

### 3.2 Dual-Layer Synchronization (Server Prefetch + Client Hydration)
1. **Server Layer (`app/dashboard/admin/hubs/page.tsx` & `hubs-listing.tsx`)**:
   - `searchParamsCache.parse(await props.searchParams)` extracts initial URL state during SSR.
   - `hubs-listing.tsx` constructs `HubFilters` from `searchParamsCache.get('search')`, `page`, `perPage`, `status`.
   - `queryClient.prefetchQuery(hubsQueryOptions(filters))` pre-populates query cache on the server.
   - Dehydrated state is passed to `<HydrationBoundary state={dehydrate(queryClient)}>`.
2. **Client Layer (`components/hubs-tables/index.tsx` & `use-data-table.ts`)**:
   - `useQueryStates` reads the identical parameter state from the URL.
   - `useSuspenseQuery(hubsQueryOptions(filters))` performs an immediate cache hit without layout shifts or extra network roundtrips.
   - When the user searches (`#hub-search-input`), changes pages, or filters status, `nuqs` updates URL query parameters via `shallow: true`.
   - React Query detects the changed `filters` in `queryKey: ['hubs', 'list', filters]` and triggers a smooth background refetch.

### 3.3 Supporting Element IDs in Shared `DataTableToolbar`
To ensure `DataTableToolbarFilter` renders the exact `#hub-search-input` required by Playwright E2E test `10-hubs-management.spec.ts`, the shared components are connected seamlessly:
- `src/types/data-table.ts`: Extend `ColumnMeta` with `id?: string;`.
- `src/components/ui/table/data-table-toolbar.tsx`: In `DataTableToolbarFilter` under `case 'text'`, render `id={columnMeta.id}`.
- `src/features/hubs/components/hubs-tables/columns.tsx`: Configure `meta: { id: 'hub-search-input', label: 'Tìm kiếm', variant: 'text' }`.

---

## 4. Detailed File Specifications & Skeletons

### 4.1 `frontend/src/features/hubs/api/types.ts`
```typescript
export interface HubVehicle {
  id: number;
  plateNumber: string;
  model?: string | null;
  type?: string | null;
  status?: string | null;
}

export interface Hub {
  id: number;
  code: string;
  name: string;
  city: string;
  address?: string | null;
  contactPhone?: string | null;
  managerName?: string | null;
  isActive: boolean;
  vehicles?: HubVehicle[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface PaginatedHubsResponse {
  data: Hub[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface HubFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface CreateHubPayload {
  code: string;
  name: string;
  city: string;
  address?: string;
  contactPhone?: string;
  managerName?: string;
  isActive?: boolean;
}

export type UpdateHubPayload = Partial<CreateHubPayload>;

export interface HubMetrics {
  total: number;
  active: number;
  inactive: number;
  totalVehicles: number;
}

export interface DeleteHubResponse {
  success: boolean;
  message: string;
}
```

### 4.2 `frontend/src/features/hubs/api/service.ts`
```typescript
import { apiClient } from '@/lib/api-client';
import type {
  Hub,
  HubFilters,
  PaginatedHubsResponse,
  CreateHubPayload,
  UpdateHubPayload,
  DeleteHubResponse
} from './types';

export async function getHubs(filters: HubFilters = {}): Promise<PaginatedHubsResponse> {
  const res = await apiClient.get('/api/v1/hubs', { params: filters });
  return res.data;
}

export async function getActiveHubs(): Promise<Hub[]> {
  const res = await apiClient.get('/api/v1/hubs/active');
  return res.data;
}

export async function getHubById(id: number): Promise<Hub> {
  const res = await apiClient.get(`/api/v1/hubs/${id}`);
  return res.data;
}

export async function createHub(payload: CreateHubPayload): Promise<Hub> {
  const res = await apiClient.post('/api/v1/hubs', payload);
  return res.data;
}

export async function updateHub(id: number, payload: UpdateHubPayload): Promise<Hub> {
  const res = await apiClient.patch(`/api/v1/hubs/${id}`, payload);
  return res.data;
}

export async function toggleActiveHub(id: number): Promise<Hub> {
  const res = await apiClient.patch(`/api/v1/hubs/${id}/toggle-active`);
  return res.data;
}

export async function deleteHub(id: number): Promise<DeleteHubResponse> {
  const res = await apiClient.delete(`/api/v1/hubs/${id}`);
  return res.data;
}
```

### 4.3 `frontend/src/features/hubs/api/queries.ts`
```typescript
import { queryOptions } from '@tanstack/react-query';
import { getHubs, getActiveHubs, getHubById } from './service';
import type { HubFilters } from './types';

export const hubKeys = {
  all: ['hubs'] as const,
  lists: () => [...hubKeys.all, 'list'] as const,
  list: (filters: HubFilters) => [...hubKeys.lists(), filters] as const,
  active: () => [...hubKeys.all, 'active'] as const,
  details: () => [...hubKeys.all, 'detail'] as const,
  detail: (id: number) => [...hubKeys.details(), id] as const
};

export const hubsQueryOptions = (filters: HubFilters = {}) =>
  queryOptions({
    queryKey: hubKeys.list(filters),
    queryFn: () => getHubs(filters)
  });

export const activeHubsQueryOptions = () =>
  queryOptions({
    queryKey: hubKeys.active(),
    queryFn: () => getActiveHubs()
  });

export const hubByIdQueryOptions = (id: number) =>
  queryOptions({
    queryKey: hubKeys.detail(id),
    queryFn: () => getHubById(id)
  });
```

### 4.4 `frontend/src/features/hubs/api/mutations.ts`
```typescript
import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createHub, updateHub, toggleActiveHub, deleteHub } from './service';
import { hubKeys } from './queries';
import type { CreateHubPayload, UpdateHubPayload } from './types';

export const createHubMutation = mutationOptions({
  mutationFn: (payload: CreateHubPayload) => createHub(payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
  }
});

export const updateHubMutation = mutationOptions({
  mutationFn: ({ id, payload }: { id: number; payload: UpdateHubPayload }) =>
    updateHub(id, payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
  }
});

export const toggleActiveHubMutation = mutationOptions({
  mutationFn: (id: number) => toggleActiveHub(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
  }
});

export const deleteHubMutation = mutationOptions({
  mutationFn: (id: number) => deleteHub(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
  }
});
```

### 4.5 `frontend/src/features/hubs/components/hubs-tables/options.tsx`
```typescript
export const HUB_STATUS_OPTIONS = [
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Tạm ngưng', value: 'inactive' }
];
```

### 4.6 `frontend/src/features/hubs/components/hubs-tables/columns.tsx`
```typescript
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { HUB_STATUS_OPTIONS } from './options';
import type { Hub } from '../../api/types';

export const columns: ColumnDef<Hub>[] = [
  {
    id: 'code',
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Mã Hub' />,
    cell: ({ cell }) => (
      <span className='bg-primary/10 text-primary border-primary/20 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold'>
        {cell.getValue<string>()}
      </span>
    ),
    enableSorting: true
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tên Chi Nhánh & Tỉnh/Thành' />,
    cell: ({ row }) => (
      <div>
        <div className='text-foreground flex items-center gap-1.5 font-semibold'>
          <Icons.building className='text-primary/70 h-4 w-4 shrink-0' />
          {row.original.name}
        </div>
        <div className='text-muted-foreground mt-0.5 flex items-center gap-1 text-xs'>
          <Icons.mapPin className='h-3 w-3 shrink-0' />
          {row.original.city}
        </div>
      </div>
    ),
    meta: {
      id: 'hub-search-input',
      label: 'Tìm kiếm',
      placeholder: 'Tìm mã kho, tên kho, thành phố, quản lý...',
      variant: 'text',
      icon: Icons.search
    },
    enableColumnFilter: true,
    enableSorting: true
  },
  {
    accessorKey: 'address',
    header: 'Địa Chỉ Chi Tiết',
    cell: ({ cell }) => (
      <div className='text-muted-foreground max-w-xs truncate' title={cell.getValue<string>() || undefined}>
        {cell.getValue<string>() || 'Chưa cập nhật'}
      </div>
    )
  },
  {
    id: 'manager',
    accessorKey: 'managerName',
    header: 'Người Quản Lý & SĐT',
    cell: ({ row }) => (
      <div>
        <div className='text-foreground flex items-center gap-1 font-medium'>
          <Icons.user className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
          {row.original.managerName || 'Chưa phân công'}
        </div>
        {row.original.contactPhone && (
          <div className='text-muted-foreground mt-0.5 flex items-center gap-1 font-mono text-xs'>
            <Icons.phone className='h-3 w-3 shrink-0' />
            {row.original.contactPhone}
          </div>
        )}
      </div>
    )
  },
  {
    id: 'vehicles',
    accessorKey: 'vehicles',
    header: 'Xe Trực Thuộc',
    cell: ({ row }) => (
      <Badge variant='outline' className='bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono'>
        <Icons.truck className='mr-1 h-3 w-3' />
        {row.original.vehicles?.length || 0} xe
      </Badge>
    )
  },
  {
    id: 'status',
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Trạng Thái' />,
    cell: ({ cell }) => {
      const isActive = cell.getValue<boolean>();
      return isActive ? (
        <Badge className='bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20'>
          Hoạt Động
        </Badge>
      ) : (
        <Badge className='bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20'>
          Tạm Ngưng
        </Badge>
      );
    },
    meta: {
      label: 'Trạng thái',
      variant: 'select',
      options: HUB_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

### 4.7 `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { deleteHubMutation, toggleActiveHubMutation } from '../../api/mutations';
import { HubFormDialog } from '../hub-form-dialog';
import type { Hub } from '../../api/types';

interface CellActionProps {
  data: Hub;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const toggleMutation = useMutation({
    ...toggleActiveHubMutation,
    onSuccess: (updated) => {
      toast.success(
        updated.isActive
          ? `Đã kích hoạt hoạt động chi nhánh "${data.name}"`
          : `Đã tạm ngưng hoạt động chi nhánh "${data.name}"`
      );
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Không thể chuyển đổi trạng thái chi nhánh kho');
    }
  });

  const deleteMutation = useMutation({
    ...deleteHubMutation,
    onSuccess: (res) => {
      toast.success(res.message || `Đã xóa mềm chi nhánh "${data.name}" thành công!`);
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Có lỗi xảy ra khi xóa chi nhánh');
    }
  });

  return (
    <>
      <HubFormDialog
        hub={data}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Soft Delete Confirmation Alert Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle className='text-destructive flex items-center gap-2'>
              <Icons.warning className='h-5 w-5' />
              Xác Nhận Xóa Mềm Chi Nhánh Kho
            </DialogTitle>
          </DialogHeader>
          <div className='text-muted-foreground space-y-3 py-2 text-sm'>
            <p>
              Bạn có chắc chắn muốn xóa chi nhánh{' '}
              <strong className='text-foreground font-semibold'>
                {data.name} ({data.code})
              </strong>
              ?
            </p>
            {data.vehicles && data.vehicles.length > 0 && (
              <div className='border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg border p-3 text-xs'>
                ⚠️ <strong>Lưu ý:</strong> Hiện có{' '}
                <strong>{data.vehicles.length} phương tiện</strong> đang trực thuộc chi nhánh này.
                Sau khi xóa mềm, liên kết kho của các phương tiện này sẽ được giải phóng an toàn mà không làm mất dữ liệu lịch sử.
              </div>
            )}
            <p className='text-muted-foreground text-xs'>
              Hệ thống áp dụng chính sách <strong>Xóa Mềm (Soft Delete)</strong>. Lịch sử đơn hàng, chuyến xe và các giao dịch trước đây vẫn được bảo toàn nguyên vẹn.
            </p>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteOpen(false)}
              className='cursor-pointer'
            >
              Hủy
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(data.id)}
              className='cursor-pointer'
            >
              {deleteMutation.isPending ? 'Đang Xóa...' : 'Xác Nhận Xóa Mềm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Row Actions Trigger */}
      <div className='flex items-center justify-end gap-1'>
        <Button
          size='sm'
          variant='ghost'
          aria-label='Bật/Tắt hoạt động kho'
          onClick={() => toggleMutation.mutate(data.id)}
          disabled={toggleMutation.isPending}
          className='text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer'
          title={data.isActive ? 'Tạm ngưng hoạt động' : 'Kích hoạt hoạt động'}
        >
          {data.isActive ? (
            <Icons.circleCheck className='h-4 w-4 text-emerald-600' />
          ) : (
            <Icons.xCircle className='h-4 w-4 text-amber-600' />
          )}
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-label='Chỉnh sửa kho'
          data-testid={`btn-edit-hub-${data.id}`}
          onClick={() => setEditOpen(true)}
          className='text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2 cursor-pointer'
        >
          <Icons.edit className='h-4 w-4' />
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-label='Xóa kho'
          data-testid={`btn-delete-hub-${data.id}`}
          onClick={() => setDeleteOpen(true)}
          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 cursor-pointer'
        >
          <Icons.trash className='h-4 w-4' />
        </Button>
      </div>
    </>
  );
}
```

### 4.8 `frontend/src/features/hubs/components/hub-form-dialog.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { createHubMutation, updateHubMutation } from '../api/mutations';
import type { Hub, CreateHubPayload } from '../api/types';

interface HubFormDialogProps {
  hub?: Hub | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function HubFormDialog({
  hub,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger
}: HubFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    if (hub) {
      setFormCode(hub.code);
      setFormName(hub.name);
      setFormCity(hub.city);
      setFormAddress(hub.address || '');
      setFormPhone(hub.contactPhone || '');
      setFormManager(hub.managerName || '');
      setFormIsActive(hub.isActive);
    } else {
      setFormCode('');
      setFormName('');
      setFormCity('');
      setFormAddress('');
      setFormPhone('');
      setFormManager('');
      setFormIsActive(true);
    }
  }, [hub, open]);

  const createMutation = useMutation({
    ...createHubMutation,
    onSuccess: (res) => {
      toast.success(`Tạo mới chi nhánh "${res.name}" thành công!`);
      setOpen(false);
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Có lỗi xảy ra khi tạo mới chi nhánh');
    }
  });

  const updateMutation = useMutation({
    ...updateHubMutation,
    onSuccess: (res) => {
      toast.success(`Cập nhật chi nhánh "${res.name}" thành công!`);
      setOpen(false);
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Có lỗi xảy ra khi cập nhật chi nhánh');
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateHubPayload = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      city: formCity.trim(),
      address: formAddress.trim() || undefined,
      contactPhone: formPhone.trim() || undefined,
      managerName: formManager.trim() || undefined,
      isActive: formIsActive
    };

    if (hub) {
      updateMutation.mutate({ id: hub.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className='sm:max-w-[520px]' id='hub-form-dialog'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.building className='text-primary h-5 w-5' />
            {hub ? 'Chỉnh Sửa Chi Nhánh Kho' : 'Thêm Chi Nhánh Kho Mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label htmlFor='input-hub-code' className='text-muted-foreground text-xs font-semibold'>
                Mã Chi Nhánh (Unique) *
              </label>
              <Input
                id='input-hub-code'
                required
                placeholder='VD: HUB-HAN-01'
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className='font-mono uppercase'
              />
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='input-hub-city' className='text-muted-foreground text-xs font-semibold'>
                Tỉnh / Thành Phố *
              </label>
              <Input
                id='input-hub-city'
                required
                placeholder='VD: Hà Nội'
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='input-hub-name' className='text-muted-foreground text-xs font-semibold'>
              Tên Chi Nhánh Kho *
            </label>
            <Input
              id='input-hub-name'
              required
              placeholder='VD: Andromeda Hub (Hà Nội)'
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='input-hub-address' className='text-muted-foreground text-xs font-semibold'>
              Địa Chỉ Chi Tiết
            </label>
            <Input
              id='input-hub-address'
              placeholder='VD: KCN Bắc Thăng Long, Đông Anh, Hà Nội'
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label htmlFor='input-hub-manager' className='text-muted-foreground text-xs font-semibold'>
                Người Quản Lý Kho
              </label>
              <Input
                id='input-hub-manager'
                placeholder='VD: Nguyễn Văn Quản'
                value={formManager}
                onChange={(e) => setFormManager(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='input-hub-phone' className='text-muted-foreground text-xs font-semibold'>
                Số Điện Thoại Liên Hệ
              </label>
              <Input
                id='input-hub-phone'
                placeholder='VD: 024-3886-1234'
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <div className='flex items-center gap-2 pt-2'>
            <input
              type='checkbox'
              id='input-hub-is-active'
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className='border-input text-primary focus:ring-primary h-4 w-4 rounded cursor-pointer'
            />
            <label htmlFor='input-hub-is-active' className='text-foreground text-sm font-medium cursor-pointer'>
              Kích hoạt chi nhánh ngay (Sẵn sàng tiếp nhận đơn & phương tiện)
            </label>
          </div>

          <DialogFooter className='pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='cursor-pointer'
            >
              Hủy Bỏ
            </Button>
            <Button
              type='submit'
              disabled={isPending}
              className='bg-primary text-primary-foreground cursor-pointer'
            >
              {isPending ? 'Đang Lưu...' : hub ? 'Lưu Thay Đổi' : 'Thêm Chi Nhánh'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HubFormDialogTrigger() {
  return (
    <HubFormDialog
      trigger={
        <Button
          id='btn-add-hub'
          className='bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer transition-all duration-150'
        >
          <Icons.add className='mr-2 h-4 w-4' />
          Thêm Chi Nhánh Mới
        </Button>
      }
    />
  );
}
```

### 4.9 `frontend/src/features/hubs/components/hubs-metrics.tsx`
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { hubsQueryOptions } from '../api/queries';
import type { Hub } from '../api/types';

export function HubsMetrics() {
  // Query full active hub list for global metrics
  const { data } = useQuery(hubsQueryOptions({ limit: 100 }));
  const hubs: Hub[] = data?.data || [];
  const total = data?.meta?.total || hubs.length;
  const activeCount = hubs.filter((h) => h.isActive).length;
  const inactiveCount = Math.max(0, total - activeCount);
  const totalVehicles = hubs.reduce((sum, h) => sum + (h.vehicles?.length || 0), 0);

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card className='border-border/60 shadow-xs transition-all duration-200 hover:border-primary/40'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>
            Tổng Số Chi Nhánh
          </CardTitle>
          <Icons.building className='text-primary h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{total}</div>
          <p className='text-muted-foreground mt-1 text-xs'>Điểm trung chuyển hàng hóa</p>
        </CardContent>
      </Card>

      <Card className='border-border/60 shadow-xs transition-all duration-200 hover:border-emerald-500/40'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>
            Đang Hoạt Động
          </CardTitle>
          <Icons.circleCheck className='h-4 w-4 text-emerald-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-emerald-600'>{activeCount}</div>
          <p className='text-muted-foreground mt-1 text-xs'>Sẵn sàng tiếp nhận đơn & xe</p>
        </CardContent>
      </Card>

      <Card className='border-border/60 shadow-xs transition-all duration-200 hover:border-amber-500/40'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>
            Tạm Ngưng
          </CardTitle>
          <Icons.xCircle className='h-4 w-4 text-amber-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-amber-600'>{inactiveCount}</div>
          <p className='text-muted-foreground mt-1 text-xs'>Tạm ngừng hoặc bảo trì</p>
        </CardContent>
      </Card>

      <Card className='border-border/60 shadow-xs transition-all duration-200 hover:border-blue-500/40'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-muted-foreground text-sm font-medium'>
            Tổng Xe Trực Thuộc
          </CardTitle>
          <Icons.truck className='h-4 w-4 text-blue-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>{totalVehicles}</div>
          <p className='text-muted-foreground mt-1 text-xs'>Phương tiện phân bổ tại các kho</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.10 `frontend/src/features/hubs/components/hubs-tables/index.tsx`
```typescript
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { hubsQueryOptions } from '../../api/queries';
import { columns } from './columns';
import type { HubFilters } from '../../api/types';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function HubsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    search: parseAsString,
    status: parseAsString,
    isActive: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const search = params.name || params.search;
  let isActive: boolean | undefined = undefined;
  if (params.status === 'active' || params.isActive === 'true' || params.status === 'ACTIVE') {
    isActive = true;
  } else if (params.status === 'inactive' || params.isActive === 'false' || params.status === 'INACTIVE') {
    isActive = false;
  }

  const filters: HubFilters = {
    page: params.page,
    limit: params.perPage,
    ...(search && { search }),
    ...(isActive !== undefined && { isActive }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(hubsQueryOptions(filters));
  const pageCount = Math.ceil((data.meta?.total ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: data.data ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function HubsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
```

### 4.11 `frontend/src/features/hubs/components/hubs-listing.tsx`
```typescript
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { hubsQueryOptions } from '../api/queries';
import { HubsTable } from './hubs-tables';
import { HubsMetrics } from './hubs-metrics';
import type { HubFilters } from '../api/types';

export default async function HubsListing() {
  const page = searchParamsCache.get('page') || 1;
  const perPage = searchParamsCache.get('perPage') || 10;
  const search = searchParamsCache.get('name') || searchParamsCache.get('search');
  const status = searchParamsCache.get('status') || searchParamsCache.get('isActive');
  const sort = searchParamsCache.get('sort');

  let isActive: boolean | undefined = undefined;
  if (status === 'active' || status === 'true' || status === 'ACTIVE') {
    isActive = true;
  } else if (status === 'inactive' || status === 'false' || status === 'INACTIVE') {
    isActive = false;
  }

  const filters: HubFilters = {
    page,
    limit: perPage,
    ...(search && { search }),
    ...(isActive !== undefined && { isActive }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(hubsQueryOptions(filters));
  void queryClient.prefetchQuery(hubsQueryOptions({ limit: 100 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-6'>
        <HubsMetrics />
        <HubsTable />
      </div>
    </HydrationBoundary>
  );
}
```

### 4.12 `frontend/src/app/dashboard/admin/hubs/page.tsx`
```typescript
import PageContainer from '@/components/layout/page-container';
import HubsListing from '@/features/hubs/components/hubs-listing';
import { HubFormDialogTrigger } from '@/features/hubs/components/hub-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Quản Lý Chi Nhánh Kho (Hubs) | Logistics TMS'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function HubsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Quản Lý Chi Nhánh Kho'
      pageDescription='Quản lý mạng lưới kho bãi, chi nhánh tiếp nhận & phân phối hàng hóa trên toàn hệ thống Spider Express'
      pageHeaderAction={<HubFormDialogTrigger />}
    >
      <HubsListing />
    </PageContainer>
  );
}
```

---

## 5. Verification & Safety Verification Plan

| Verification Step | Target File / Command | Success Criteria |
|---|---|---|
| **Type Check & Compilation** | `npm run build` in `frontend/` | 0 TypeScript errors, 0 compilation warnings |
| **Playwright E2E Suite** | `npx playwright test e2e/10-hubs-management.spec.ts` | 100% test pass (Super Admin CRUD & Fleet Manager route blocking) |
| **All E2E Suites** | `npx playwright test` | 0 regressions across all 12 test specs |
| **Toast Compliance** | Manual inspection & Sonner audits | 100% Vietnamese toast messages, `err?.response?.data?.message` pattern |
| **RBAC Route Guard** | `frontend/src/proxy.ts` | Non-SUPER_ADMIN redirected to `/dashboard/overview` |
