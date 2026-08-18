# Investigation Report — Defect 3: Pointer Events Interception & Layout Collapse

- **Agent**: Explorer 2 (Iteration 2)
- **Role**: Explorer / Investigator
- **Milestone**: Milestone 2 — Fleet Management Standardization
- **Target Files**: `frontend/src/components/ui/table/data-table.tsx`, `frontend/src/features/fleet/components/fleet-listing.tsx`
- **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_r2_2`
- **Parent Conversation ID**: `7172e926-cfe8-4b9c-8361-0f7ee6c930b0`
- **Date**: 2026-08-18

---

## 1. Observation

### 1.1 Verbatim Error Logs from Iteration 1 E2E Run
In `frontend/e2e/04-fleet-crud-and-refresh.spec.ts` (Test 2: Vehicle CRUD and Test 3: Driver CRUD), Playwright failed with timeout 60000ms attempting to click row action buttons:
```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('tr').filter({ hasText: '75H-825.99' }).locator('button[data-testid^="btn-edit-vehicle-"]')
    - locator resolved to <button tabindex="0" type="button" data-slot="button" aria-label="Chỉnh sửa xe" data-testid="btn-edit-vehicle-10" ...>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - scrolling into view if needed
    - <div class="absolute inset-0 flex overflow-hidden rounded-lg border">…</div> intercepts pointer events
    - <div class="flex flex-1 flex-col space-y-4">…</div> intercepts pointer events
    - <div class="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8">…</div> from <div class="flex flex-col gap-2.5">…</div> subtree intercepts pointer events
```

### 1.2 Layout Code Inspection in `data-table.tsx`
In `frontend/src/components/ui/table/data-table.tsx` (L21–83):
```tsx
export function DataTable<TData>({ table, actionBar, children }: DataTableProps<TData>) {
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {children}
      <div className='relative flex flex-1'>
        <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
          <ScrollArea className='h-full w-full'>
            <Table>
              ...
            </Table>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </div>
      </div>
      <div className='flex flex-col gap-2.5'>
        <DataTablePagination table={table} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}
```

### 1.3 Page Structure in `fleet-listing.tsx`
In `frontend/src/features/fleet/components/fleet-listing.tsx` (L24–83):
- The page container is `<div className='flex-1 space-y-6'>` inside `PageContainer` (`flex flex-1 flex-col px-4 pt-2 pb-4`).
- It contains Header Actions (L27), KPI Cards (`FleetKpiCards`, L48), and `<Tabs>` (L51).
- `<TabsContent value='vehicles' className='m-0 space-y-4'>` (L75) mounts `<VehiclesTable />`, which renders `<DataTable>`.
- Neither `PageContainer`, `fleet-listing.tsx`, nor `TabsContent` has a fixed CSS viewport height constraint (such as `h-[calc(100vh-...)]`). The page is in normal document flow.

### 1.4 Comparison with Other Data Tables
1. In `frontend/src/components/ui/table/data-table-skeleton.tsx` (L51):
   ```tsx
   <div className='flex-1 rounded-md border'>
     <Table>...</Table>
   </div>
   ```
   The skeleton uses an in-flow container rather than `relative flex flex-1` + `absolute inset-0`.
2. In `frontend/src/features/products/components/product-tables/index.tsx`, `frontend/src/features/users/components/users-table/index.tsx`, and `frontend/src/features/hubs/components/hubs-tables/index.tsx`:
   All table wrappers invoke `<DataTable table={table}>`. None of the previous tests clicked row action buttons inside the table body (e.g. `03b-users-rbac.spec.ts` only checked page navigation and heading visibility), which masked the layout bug until `04-fleet-crud-and-refresh.spec.ts` performed interactive row button clicks.

---

## 2. Logic Chain

1. **CSS Box Sizing & Layout Tree**:
   - `PageContainer` and `TabsContent` have `height: auto` (content-driven height).
   - In `DataTable` (`data-table.tsx` L25–26), the table wrapper is configured as `<div className='relative flex flex-1'>` with `<div className='absolute inset-0 flex overflow-hidden rounded-lg border'>`.
   - By CSS specification (CSS 2.2 §10.6.3 & CSS Flexible Box Layout Level 1 §9.8), an out-of-flow element (`position: absolute`) is completely removed from document flow and contributes **0px** to the intrinsic height calculation of its parent.
   - When the parent flex container does not have an explicit fixed height constraint, the computed height of `<div className='relative flex flex-1'>` is **0px**.

2. **Absolute Child Collapse**:
   - The child `<div className='absolute inset-0'>` computes its dimensions from the `0px` relative parent (`top: 0; bottom: 0;` => computed height `0px`).
   - `<ScrollArea className='h-full w-full'>` computes `h-full` (100%) against `0px`, resulting in a `0px` viewport.

3. **Subsequent Sibling Collision & Pointer Interception**:
   - In normal document flow, `<div className='flex flex-col gap-2.5'>` (which contains `DataTablePagination`) is rendered immediately after the `0px` height table container.
   - This places the pagination footer at the exact vertical top of the table area, directly overlaying the table rows.
   - When Playwright or a user attempts to click `button[data-testid^="btn-edit-vehicle-"]` or `button[data-testid^="btn-delete-vehicle-"]`, the browser hit-test detects the pagination wrapper (`<div class="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8">…</div> from <div class="flex flex-col gap-2.5">…</div> subtree`) covering the button, intercepting the click and causing a 60s timeout.

4. **Remediation Rationale**:
   - Replacing `relative flex flex-1` + `absolute inset-0` with an in-flow container `<div className='overflow-hidden rounded-lg border'><ScrollArea className='w-full'>` allows the table container height to expand naturally to fit its rows (e.g. ~450px for 10 rows, ~150px for empty state).
   - `DataTablePagination` naturally follows in document flow below the table container with zero coordinate overlap.
   - `<ScrollArea className='w-full'>` continues to handle horizontal scrolling (`<ScrollBar orientation='horizontal' />`) for responsive multi-column layouts without collapsing vertically.

---

## 3. Caveats

- **No Caveats**: The issue was reproduced and isolated through exact Playwright DOM hit-testing logs, CSS layout mechanics, and component hierarchy verification.

---

## 4. Conclusion & Actionable Recommendations for Worker

### Recommended Changes

#### Primary Change: `frontend/src/components/ui/table/data-table.tsx`
Update `data-table.tsx` to use an in-flow table wrapper and support `className` and standard HTML div props:

```tsx
// frontend/src/components/ui/table/data-table.tsx
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import type * as React from 'react';

import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/lib/data-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <div className={cn('flex flex-1 flex-col space-y-4', className)} {...props}>
      {children}
      <div className='overflow-hidden rounded-lg border'>
        <ScrollArea className='w-full'>
          <Table>
            <TableHeader className='bg-muted sticky top-0 z-10'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        ...getCommonPinningStyles({ column: header.column })
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...getCommonPinningStyles({ column: cell.column })
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className='h-24 text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </div>
      <div className='flex flex-col gap-2.5'>
        <DataTablePagination table={table} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}
```

---

## 5. Verification Method

1. **Static Analysis**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx tsc --noEmit
   ```
   *Expected Result*: Exit Code 0 (0 TypeScript errors).

2. **Playwright E2E Test Execution**:
   ```powershell
   cd d:\Projects\logistics-website\frontend
   npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts --project=chromium
   ```
   *Expected Result*: Tests 2 (`Vehicle CRUD: Create, Edit, Delete`) and 3 (`Driver CRUD: Create, Edit, Delete`) click `button[data-testid^="btn-edit-vehicle-"]` and `button[data-testid^="btn-edit-driver-"]` without pointer event interception, passing cleanly.
