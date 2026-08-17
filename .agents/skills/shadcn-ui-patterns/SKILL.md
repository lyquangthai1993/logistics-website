---
name: shadcn-ui-patterns
description: >-
  Shadcn UI, Radix UI, and Tailwind CSS v4 patterns for the Logistics TMS frontend.
  Use when building UI components, data tables, forms, layouts, or theming.
  Triggers on mentions of "shadcn", "radix", "tailwind", "data table", "form",
  "sidebar", "theme", "toast", "dialog", or UI component tasks.
---

# Shadcn UI + Radix UI + Tailwind CSS v4

## Component Installation

```bash
# Initialize shadcn (first time)
npx shadcn@latest init

# Add individual components
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add toast
npx shadcn@latest add sidebar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add tabs

# Add multiple at once
npx shadcn@latest add button table dialog form input select toast
```

## Data Table Pattern (@tanstack/react-table)

### Column Definitions

```typescript
// src/components/orders/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { OrderActions } from './order-actions';

export const orderColumns: ColumnDef<Order>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn đơn"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'orderCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mã đơn" />,
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.getValue<OrderStatus>('status');
      const variant = statusVariantMap[status];
      return <Badge variant={variant}>{statusLabelMap[status]}</Badge>;
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'totalWeight',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Khối lượng (Kg)" />,
    cell: ({ row }) => `${row.getValue<number>('totalWeight').toLocaleString()} kg`,
  },
  {
    accessorKey: 'totalCbm',
    header: 'Thể tích (m³)',
    cell: ({ row }) => `${row.getValue<number>('totalCbm')} m³`,
  },
  {
    id: 'actions',
    cell: ({ row }) => <OrderActions order={row.original} />,
  },
];
```

### Data Table Component

```typescript
// src/components/data-table/data-table.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from './pagination';
import { DataTableToolbar } from './toolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbar?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  });

  return (
    <div className="space-y-4">
      {toolbar}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Bulk Actions (Gom đơn vào chuyến)

```typescript
// Lấy selected rows từ table
const selectedOrders = table
  .getSelectedRowModel()
  .rows.map((row) => row.original);

// Bulk action button
<Button
  disabled={selectedOrders.length === 0}
  onClick={() => onAssignToTrip(selectedOrders)}
>
  Gom {selectedOrders.length} đơn vào chuyến
</Button>
```

## Form Patterns (react-hook-form + zod)

```typescript
// src/components/orders/create-order-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const createOrderSchema = z.object({
  senderName: z.string().min(1, 'Tên người gửi là bắt buộc'),
  pickupAddress: z.string().min(1, 'Địa chỉ lấy hàng là bắt buộc'),
  receiverName: z.string().min(1, 'Tên người nhận là bắt buộc'),
  deliveryAddress: z.string().min(1, 'Địa chỉ giao hàng là bắt buộc'),
  totalWeight: z.coerce.number().positive('Khối lượng phải > 0'),
  totalCbm: z.coerce.number().positive('Thể tích phải > 0'),
  warehouseId: z.string().min(1, 'Chọn kho tiếp nhận'),
  notes: z.string().optional(),
});

type CreateOrderValues = z.infer<typeof createOrderSchema>;

export function CreateOrderForm({ onSubmit }: { onSubmit: (data: CreateOrderValues) => void }) {
  const form = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      senderName: '',
      pickupAddress: '',
      receiverName: '',
      deliveryAddress: '',
      totalWeight: 0,
      totalCbm: 0,
      warehouseId: '',
      notes: '',
    },
  });

  // Auto-calculate tổng
  const weight = form.watch('totalWeight');
  const cbm = form.watch('totalCbm');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="senderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Người gửi</FormLabel>
              <FormControl>
                <Input placeholder="Tên người gửi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... other fields follow same pattern */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Tạo đơn hàng
        </Button>
      </form>
    </Form>
  );
}
```

## Theme System (Dark/Light)

```typescript
// src/providers/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

```typescript
// Theme toggle button
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

## Toast Notifications

```typescript
import { toast } from 'sonner'; // Shadcn uses sonner for toasts

// Success
toast.success('Đơn hàng đã được tạo thành công');

// Error
toast.error('Không thể tạo đơn hàng', {
  description: 'Vui lòng kiểm tra lại thông tin',
});

// Promise-based (loading → success/error)
toast.promise(createOrder(data), {
  loading: 'Đang tạo đơn hàng...',
  success: 'Đơn hàng đã được tạo',
  error: 'Lỗi khi tạo đơn hàng',
});
```

## Responsive Sidebar Layout

```typescript
// src/app/dashboard/layout.tsx
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <header className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          {/* breadcrumb, user nav */}
        </header>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Component không styled | Chưa install component | `npx shadcn@latest add <component>` |
| Tailwind class không work | Missing CSS import | Đảm bảo `@import "tailwindcss"` trong globals.css |
| Form không validate | Thiếu zodResolver | Thêm `resolver: zodResolver(schema)` |
| Dark mode không chuyển | Thiếu ThemeProvider | Wrap app với `ThemeProvider` |
| Toast không hiển thị | Thiếu Toaster component | Thêm `<Toaster />` vào root layout |
