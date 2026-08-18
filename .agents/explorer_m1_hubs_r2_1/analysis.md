# Deep Dive Analysis: TanStack Query Mutation Invalidation & Stale State Remediation

**Working Directory**: `d:\Projects\logistics-website\.agents\explorer_m1_hubs_r2_1`  
**Milestone**: Milestone 1 — Hubs Management Standardization (Iteration 2)  
**Author**: Explorer 1  
**Date**: 2026-08-18  

---

## 1. Problem Statement & Root Cause Analysis

### 1.1 The Bug Mechanism
In the Hubs Management feature (`frontend/src/features/hubs/`), mutations were designed using the TanStack Query v5 `mutationOptions` helper in `api/mutations.ts`:

```typescript
// frontend/src/features/hubs/api/mutations.ts (Lines 7-12)
export const createHubMutation = mutationOptions({
  mutationFn: (payload: CreateHubPayload) => createHub(payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: hubKeys.all });
  }
});
```

However, in the consuming UI components (`hub-form-dialog.tsx` and `cell-action.tsx`), developers consumed these options by object spreading into `useMutation` and providing inline component callbacks:

```typescript
// frontend/src/features/hubs/components/hub-form-dialog.tsx (Lines 63-73)
const createMutation = useMutation({
  ...createHubMutation,
  onSuccess: (res) => {
    toast.success(`Tạo mới chi nhánh "${res.name}" thành công!`);
    setOpen(false);
  },
  onError: (err: any) => { ... }
});
```

```typescript
// frontend/src/features/hubs/components/hubs-tables/cell-action.tsx (Lines 27-40)
const toggleMutation = useMutation({
  ...toggleActiveHubMutation,
  onSuccess: (updated) => {
    toast.success(
      updated.isActive
        ? `Đã kích hoạt hoạt động chi nhánh "${data.name}"`
        : `Đã tạm ngưng hoạt động chi nhánh "${data.name}"`
    );
  },
  onError: (err: any) => { ... }
});
```

### 1.2 The Root Cause
In JavaScript/TypeScript object literal syntax:
```typescript
const obj = {
  ...baseOptions, // Contains onSuccess: fnA
  onSuccess: fnB   // Overwrites fnA!
};
```
The inline `onSuccess: (res) => { ... }` completely **replaces** `createHubMutation.onSuccess`. The original callback containing `getQueryClient().invalidateQueries({ queryKey: hubKeys.all })` is discarded and **never invoked**.

### 1.3 Concrete System Impact
1. **Hub Creation (`#btn-add-hub`)**: POST succeeds on NestJS backend, but the table does not re-fetch. The new hub is missing from the table until full browser reload (F5).
2. **Hub Edition (Edit modal)**: PATCH succeeds, but table row retains stale attributes (name, manager, city).
3. **Active Status Toggle (Switch button)**: PATCH `/api/v1/hubs/:id/toggle-active` succeeds, but the `Hoạt Động` / `Tạm Ngưng` badge remains unchanged.
4. **Hub Soft Delete (Trash button)**: DELETE `/api/v1/hubs/:id` succeeds, but the row remains in the table.
5. **Global KPI Metric Cards (`HubsMetrics`)**: `useQuery(hubsQueryOptions({ limit: 100 }))` retains stale counts for Total Hubs, Active, Inactive, and Total Attached Vehicles.
6. **Cross-Feature Desynchronization**: Other features relying on `['hubs', 'active']` (such as the Hub dropdown in `VehicleFormDialog` at `/dashboard/fleet`) continue serving stale hub lists.

---

## 2. Invalidation Scope & Query Key Architecture

The query key factory in `frontend/src/features/hubs/api/queries.ts` is structured as:
```typescript
export const hubKeys = {
  all: ['hubs'] as const,
  lists: () => [...hubKeys.all, 'list'] as const,
  list: (filters: HubFilters) => [...hubKeys.lists(), filters] as const,
  active: () => [...hubKeys.all, 'active'] as const,
  details: () => [...hubKeys.all, 'detail'] as const,
  detail: (id: number) => [...hubKeys.details(), id] as const
};
```

When `queryClient.invalidateQueries({ queryKey: hubKeys.all })` is triggered, TanStack Query matches prefix `['hubs']` and invalidates:
1. `['hubs', 'list', { page, limit, search, isActive, sort }]` (Current table page query)
2. `['hubs', 'list', { limit: 100 }]` (KPI metric cards in `HubsMetrics`)
3. `['hubs', 'active']` (Active hubs dropdown for Fleet vehicle allocation)
4. `['hubs', 'detail', :id]` (Individual hub detail queries)

---

## 3. Recommended Remediation Strategy

We propose a **Defense-in-Depth pattern** aligning with TanStack Query v5 and the project skill `tanstack-query-nextjs`:

### Strategy 1: Explicit `useQueryClient` in Components (Immediate & Direct Fix)
In each component (`hub-form-dialog.tsx` and `cell-action.tsx`):
1. Import `useQueryClient` from `@tanstack/react-query` and `hubKeys` from `../api/queries`.
2. Instantiate `const queryClient = useQueryClient();`.
3. In `onSuccess` (or `onSettled`), explicitly call `queryClient.invalidateQueries({ queryKey: hubKeys.all });`.

### Strategy 2: Custom React Query Mutation Hooks in `mutations.ts`
Export dedicated hooks (`useCreateHubMutation`, `useUpdateHubMutation`, `useToggleActiveHubMutation`, `useDeleteHubMutation`) that encapsulate the invalidation logic inside `useMutation`.

### Strategy 3: E2E Test Hardening in `10-hubs-management.spec.ts`
Harden `10-hubs-management.spec.ts` so that it handles multi-test database states where seeded hubs might not be on page 1 without filtering.

---

## 4. Exact Code Remediation Proposals

### File 1: `frontend/src/features/hubs/api/mutations.ts`

```typescript
import { mutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Reusable custom mutation hooks with built-in cache invalidation
export function useCreateHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...createHubMutation,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: hubKeys.all });
    }
  });
}

export function useUpdateHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateHubMutation,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: hubKeys.all });
    }
  });
}

export function useToggleActiveHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...toggleActiveHubMutation,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: hubKeys.all });
    }
  });
}

export function useDeleteHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...deleteHubMutation,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: hubKeys.all });
    }
  });
}
```

---

### File 2: `frontend/src/features/hubs/components/hub-form-dialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { createHubMutation, updateHubMutation } from '../api/mutations';
import { hubKeys } from '../api/queries';
import type { Hub, CreateHubPayload } from '../api/types';

interface HubFormDialogProps {
  hub?: Hub | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HubFormDialog({
  hub,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: HubFormDialogProps) {
  const queryClient = useQueryClient();
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
      setFormCode(hub.code || '');
      setFormName(hub.name || '');
      setFormCity(hub.city || '');
      setFormAddress(hub.address || '');
      setFormPhone(hub.contactPhone || '');
      setFormManager(hub.managerName || '');
      setFormIsActive(hub.isActive ?? true);
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
      queryClient.invalidateQueries({ queryKey: hubKeys.all });
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
      queryClient.invalidateQueries({ queryKey: hubKeys.all });
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
      <DialogContent className='sm:max-w-[520px]' id='hub-form-dialog'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.warehouse className='text-primary h-5 w-5' />
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id='btn-add-hub'
        onClick={() => setOpen(true)}
        className='bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer transition-all duration-150'
      >
        <Icons.add className='mr-2 h-4 w-4' />
        Thêm Chi Nhánh Mới
      </Button>
      <HubFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```

---

### File 3: `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { deleteHubMutation, toggleActiveHubMutation } from '../../api/mutations';
import { hubKeys } from '../../api/queries';
import { HubFormDialog } from '../hub-form-dialog';
import type { Hub } from '../../api/types';

interface CellActionProps {
  data: Hub;
}

export function CellAction({ data }: CellActionProps) {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: hubKeys.all });
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
      queryClient.invalidateQueries({ queryKey: hubKeys.all });
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

      {/* Row Action Buttons */}
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
            <Icons.circleX className='h-4 w-4 text-amber-600' />
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

---

### File 4: `frontend/e2e/10-hubs-management.spec.ts` (Harden search / row visibility)

```typescript
// frontend/e2e/10-hubs-management.spec.ts
// Replace lines 24-27 with:
    // 4. Verify table rendered hubs
    const hanRow = page.locator('text=Andromeda Hub');
    if (!(await hanRow.first().isVisible())) {
      // In case multiple test runs shifted Andromeda Hub to page 2, search for it
      const searchInput = page.locator('#hub-search-input');
      await searchInput.fill('Andromeda');
      await page.waitForTimeout(500);
      await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
      await searchInput.fill('');
      await page.waitForTimeout(500);
    } else {
      await expect(hanRow.first()).toBeVisible({ timeout: 10_000 });
    }
```
