# Canonical TanStack Table + nuqs Architecture Specification

**Project**: Logistics TMS (`frontend/`)  
**Date**: 2026-08-18  
**Author**: Specification Miner Agent  
**Reference Source**: `src/app/dashboard/product/`, `src/features/products/`, `src/features/users/`, `src/components/ui/table/`, `src/hooks/use-data-table.ts`

---

## 1. Executive Architecture Summary

The frontend implements a high-performance **Server Component + Client Component hybrid table architecture** combining:
1. **Next.js App Router Server Component** (`page.tsx`) with `nuqs/server` search params parsing.
2. **TanStack React Query v5** server-side prefetching with `<HydrationBoundary state={dehydrate(queryClient)}>`.
3. **TanStack React Table v8** (`@tanstack/react-table`) with manual server pagination, sorting, and filtering.
4. **nuqs v2** for bidirectional URL query state synchronization (`page`, `perPage`, `sort`, and column filter states).
5. **Shared UI Components** (`src/components/ui/table/`) implementing sticky headers, horizontal scroll, column pinning, faceted popover filters, and standard pagination controls (`[10, 20, 30, 40, 50]`).

---

## 2. Detailed Component Hierarchy & Data Flow

```
app/dashboard/[feature]/page.tsx (Server Component)
  │
  ├── Parses URL search params via `searchParamsCache.parse(searchParams)`
  └── Renders PageContainer + FeatureListingPage
        │
        └── features/[feature]/components/[feature]-listing.tsx (Server Component)
              │
              ├── Extracts typed params: page, perPage, search/name, filters, sort via `searchParamsCache.get()`
              ├── Prefetches TanStack Query: `queryClient.prefetchQuery(featureQueryOptions(filters))`
              └── Wraps in `<HydrationBoundary state={dehydrate(queryClient)}>`
                    │
                    └── features/[feature]/components/[feature]-tables/index.tsx ('use client')
                          │
                          ├── Syncs client query states: `useQueryStates({ page, perPage, ... })`
                          ├── Reads data with instant cache hydration: `useSuspenseQuery(featureQueryOptions(filters))`
                          ├── Initializes TanStack Table: `useDataTable({ data, columns, pageCount, ... })`
                          └── Renders `<DataTable table={table}><DataTableToolbar table={table} /></DataTable>`
```

---

## 3. Reference Implementation Teardown

### 3.1. Page Wrapper (`src/app/dashboard/product/page.tsx`)
```typescript
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import ProductListingPage from '@/features/products/components/product-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { productInfoContent } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Products'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Products'
      pageDescription='Manage products (React Query + nuqs table pattern.)'
      infoContent={productInfoContent}
      pageHeaderAction={
        <Link href='/dashboard/product/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> Add New
        </Link>
      }
    >
      <ProductListingPage />
    </PageContainer>
  );
}
```

### 3.2. Server Listing Component (`src/features/products/components/product-listing.tsx`)
```typescript
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { productsQueryOptions } from '../api/queries';
import { ProductTable } from './product-tables';

export default function ProductListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categories }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(productsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductTable />
    </HydrationBoundary>
  );
}
```

### 3.3. Client Table Component (`src/features/products/components/product-tables/index.tsx`)
```typescript
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { productsQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function ProductTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { categories: params.category }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(productsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_products / params.perPage);

  const { table } = useDataTable({
    data: data.products,
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
```

### 3.4. Column Definitions (`src/features/products/components/product-tables/columns.tsx`)
```typescript
'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Product } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'photo_url',
    header: 'IMAGE',
    cell: ({ row }) => (
      <div className='relative aspect-square'>
        <Image
          src={row.getValue('photo_url')}
          alt={row.getValue('name')}
          fill
          sizes='80px'
          className='rounded-lg'
        />
      </div>
    )
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<Product['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search products...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    enableSorting: false,
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Product['category']>();
      const Icon = status === 'active' ? Icons.circleCheck : Icons.xCircle;
      return (
        <Badge variant='outline' className='capitalize'>
          <Icon />
          {status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'categories',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    accessorKey: 'price',
    header: 'PRICE'
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

### 3.5. Cell Action (`src/features/products/components/product-tables/cell-action.tsx`)
```typescript
'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteProductMutation } from '../../api/mutations';
import type { Product } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CellActionProps {
  data: Product;
}

export function CellAction({ data }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteMutation = useMutation({
    ...deleteProductMutation,
    onSuccess: () => {
      toast.success('Product deleted successfully');
      setOpen(false);
    },
    onError: (err: any) => {
      const apiMessage = err.response?.data?.message;
      toast.error(apiMessage || 'Failed to delete product');
    }
  });

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0 cursor-pointer' />}>
          <span className='sr-only'>Open menu</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/product/${data.id}`)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
```

---

## 4. Shared Table Components Specification (`src/components/ui/table/`)

| Component | File Path | Key Features & Props |
|---|---|---|
| `DataTable` | `src/components/ui/table/data-table.tsx` | - Sticky table header (`bg-muted sticky top-0 z-10`)<br>- Column pinning support (`getCommonPinningStyles`)<br>- `ScrollArea` with horizontal scrollbar<br>- Integrates `DataTablePagination`<br>- Optional `actionBar` for batch actions when rows selected |
| `DataTablePagination` | `src/components/ui/table/data-table-pagination.tsx` | - Row selection summary (`X of Y row(s) selected` / `Y row(s) total`)<br>- Rows per page selector (`[10, 20, 30, 40, 50]`)<br>- Current page display (`Page X of Y`)<br>- Navigation buttons (First `<<`, Prev `<`, Next `>`, Last `>>`) |
| `DataTableToolbar` | `src/components/ui/table/data-table-toolbar.tsx` | - Automatic filter rendering from `column.columnDef.meta`<br>- Filter types: `text` (Input), `number` (numeric Input), `range` (Slider), `date`/`dateRange` (Calendar popover), `select`/`multiSelect` (Faceted popover)<br>- Filter Reset button when active<br>- `DataTableViewOptions` toggle |
| `DataTableColumnHeader` | `src/components/ui/table/data-table-column-header.tsx` | - Dropdown trigger with current sort icon (`chevronUp`, `chevronDown`, `chevronsUpDown`)<br>- Menu options: `Asc`, `Desc`, `Reset`, and `Hide column` |
| `DataTableFacetedFilter` | `src/components/ui/table/data-table-faceted-filter.tsx` | - Popover + Command search list<br>- Multi-select badges with count summary<br>- Clear filters shortcut |
| `DataTableViewOptions` | `src/components/ui/table/data-table-view-options.tsx` | - Popover menu to show/hide hideable columns |
| `DataTableSkeleton` | `src/components/ui/table/data-table-skeleton.tsx` | - Configurable `columnCount`, `rowCount`, `filterCount`<br>- Matches table layout with skeleton headers, cells, and pagination bar |

---

## 5. Hook Specification: `src/hooks/use-data-table.ts`

### 5.1. Input Properties (`UseDataTableProps<TData>`)
- `columns`: `ColumnDef<TData, any>[]`
- `pageCount`: `number` (required, `-1` for unknown)
- `initialState`: `{ pagination?, sorting?, columnVisibility?, columnPinning?, rowSelection? }`
- `history`: `'push' | 'replace'` (default: `'replace'`)
- `debounceMs`: `number` (default: `300`)
- `throttleMs`: `number` (default: `50`)
- `clearOnDefault`: `boolean` (default: `false`)
- `enableAdvancedFilter`: `boolean` (default: `false`)
- `shallow`: `boolean` (default: `true` — updates URL without server reload)
- `scroll`: `boolean` (default: `false`)
- `startTransition`: `React.TransitionStartFunction`

### 5.2. Return Value
- `{ table: Table<TData>, shallow: boolean, debounceMs: number, throttleMs: number }`

### 5.3. URL State Management Mechanics
1. **Pagination**:
   - `useQueryState('page', parseAsInteger.withDefault(1))`
   - `useQueryState('perPage', parseAsInteger.withDefault(pageSize ?? 10))`
   - Converts 0-indexed TanStack pageIndex to 1-indexed URL page.
2. **Sorting**:
   - `useQueryState('sort', getSortingStateParser<TData>(columnIds).withDefault([]))`
   - Serializes sorting state as JSON array `[{ id: string, desc: boolean }]`.
3. **Column Filters**:
   - Reads all columns with `enableColumnFilter: true`.
   - If `column.meta.options` is present: uses `parseAsArrayOf(parseAsString, ',')`.
   - Otherwise uses `parseAsString`.
   - Updates triggers debounced `setPage(1)` and URL query update.

---

## 6. Canonical Standard Template for New Tables

### 6.1. File Structure Standard for Each Feature
```
src/
├── features/
│   └── [feature_name]/
│       ├── api/
│       │   ├── types.ts          # Entity interface, filter types, response types
│       │   ├── service.ts        # Axios/apiClient API calls
│       │   ├── queries.ts        # queryOptions for React Query prefetch & hook
│       │   └── mutations.ts      # create/update/delete mutation options
│       ├── components/
│       │   ├── [feature]-tables/
│       │   │   ├── index.tsx     # Client Table component (useDataTable, useSuspenseQuery)
│       │   │   ├── columns.tsx   # ColumnDef<T>[] with meta & DataTableColumnHeader
│       │   │   ├── cell-action.tsx # Row dropdown menu + action modals
│       │   │   └── options.tsx   # Filter dropdown options constants
│       │   ├── [feature]-listing.tsx # Server Component (prefetchQuery + HydrationBoundary)
│       │   └── [feature]-form.tsx   # Sheet/Dialog Form component
│       ├── schemas/
│       │   └── [feature].ts      # Zod validation schema
│       └── info-content.ts       # Infobar guide content
└── app/
    └── dashboard/
        └── [feature_name]/
            ├── page.tsx          # Server Component wrapper (searchParamsCache.parse)
            └── loading.tsx       # DataTableSkeleton fallback
```

### 6.2. Search Params Registration (`src/lib/searchparams.ts`)
Ensure all resource-specific query keys are registered:
```typescript
export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString,
  status: parseAsString,
  role: parseAsString,
  hub: parseAsString,
  sort: parseAsString
};
```

---

## 7. Migration Gap Analysis for Target Tables

### Phase 1 Priority Targets

| Route | Current Implementation | Issues / Refactoring Scope | Target Architecture |
|---|---|---|---|
| `/dashboard/admin/hubs` | Single 689-line client file; raw `<table>`; manual `useState` for pagination & search; custom modal dialogs. | - No TanStack Table<br>- No URL search params sync<br>- Missing sortable headers<br>- Needs `src/features/hubs/` decomposition. | Move to `src/features/hubs/components/hubs-table/` with `useDataTable`, `columns.tsx`, `cell-action.tsx`, `searchParamsCache`. Preserve `#hub-search-input`, `#btn-add-hub`, `#hub-form-dialog`, `#input-hub-*` for E2E tests. |
| `/dashboard/fleet` | Single 1050-line client file; 2 tabs (Vehicles & Drivers); raw `<table>`; manual `useState`. | - No TanStack Table on either tab<br>- No URL sync<br>- Large monolithic file. | Create 2 sub-tables in `src/features/fleet/components/`: `vehicles-table/` and `drivers-table/`. Use TanStack table for each tab. Preserve `#btn-add-vehicle`, `#tab-drivers`, `data-testid` attributes. |
| `/dashboard/orders` | Single 1176-line client file; KPI metrics; date filter; raw `<table>` with `TablePaginationBar`. | - Plain table without TanStack Table instance<br>- Manual state management. | Create `src/features/orders/components/orders-table/`. Keep KPI cards and Date Filter Bar above `<DataTable>`. Preserve `[data-testid="btn-assign-order-*"]`, `#order-code-input`, etc. |
| `/dashboard/trips` | Single 1688-line client file; 2 tabs (Pending Orders & All Trips); KPI metrics; raw `<table>`. | - Plain table without TanStack Table instance<br>- Monolithic state. | Create `src/features/trips/components/` with `pending-orders-table/` and `trips-table/`. Keep KPI cards and Date Filter Bar. Preserve `#select-trip-vehicle`, confirm buttons. |
| `/dashboard/users` | Refactored in `src/features/users/`. | - Already canonical! | Already follows canonical pattern (`user-listing.tsx`, `users-table/`, `columns.tsx`, `cell-action.tsx`). |

### Phase 2 Targets

| Route | Current Implementation | Refactoring Scope |
|---|---|---|
| `/dashboard/warehouse` | 331-line client component rendering card grid for Inbound Board. | Optionally add Table View toggle alongside Card View with TanStack Table + `nuqs`. |
| `/dashboard/notifications` | 135-line client component with tabs and notification cards. | Standardize pagination with `useDataTable` or keep dedicated card layout. |

---

## 8. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Table Core | `useDataTable` hook | Synchronizes TanStack React Table v8 state with `nuqs` URL search params. | `columns`, `data`, `pageCount`, `initialState`, `shallow`, `debounceMs` | `{ table, shallow, debounceMs, throttleMs }` | Falls back to defaults if URL params invalid | `src/hooks/use-data-table.ts` |
| 2 | Table Core | `DataTable` wrapper | Main table presentation with sticky header, column pinning, scroll area, and pagination. | `table: Table<TData>`, `actionBar?: ReactNode` | Rendered JSX table | Displays "No results." if empty | `src/components/ui/table/data-table.tsx` |
| 3 | Table Controls | `DataTablePagination` | Standard pagination bar with row count, rows per page selector `[10, 20, 30, 40, 50]`, and 4 navigation buttons. | `table: Table<TData>`, `pageSizeOptions` | JSX pagination bar | Buttons disabled at boundary pages | `src/components/ui/table/data-table-pagination.tsx` |
| 4 | Table Controls | `DataTableToolbar` | Dynamic toolbar rendering search, faceted select, date, range, and number filters based on column `meta`. | `table: Table<TData>`, `children?: ReactNode` | JSX toolbar with filter controls | Gracefully ignores columns without `meta.variant` | `src/components/ui/table/data-table-toolbar.tsx` |
| 5 | Table Controls | `DataTableColumnHeader` | Column header component with sort toggles (Asc, Desc, Clear) and column hide option. | `column: Column<TData, TValue>`, `title: string` | JSX header button with dropdown | Returns plain title if sorting and hiding disabled | `src/components/ui/table/data-table-column-header.tsx` |
| 6 | Table Filters | `DataTableFacetedFilter` | Popover with Command list supporting single or multi-selection with counts and badges. | `column`, `title`, `options`, `multiple` | JSX filter trigger & popover | Resets filter when cleared | `src/components/ui/table/data-table-faceted-filter.tsx` |
| 7 | Table Filters | `DataTableDateFilter` | Popover calendar supporting single date and date range filtering. | `column`, `title`, `multiple` | JSX date filter | Clears filter on reset | `src/components/ui/table/data-table-date-filter.tsx` |
| 8 | Table Filters | `DataTableSliderFilter` | Range slider with numeric inputs and unit label for numeric range filtering. | `column`, `title` | JSX slider filter | Bound within min/max facet values | `src/components/ui/table/data-table-slider-filter.tsx` |
| 9 | URL State | `searchParamsCache` | Server-side parser and cache for extracting typed query parameters in Server Components. | `SearchParams` object | Typed param getter (`.get('page')`, etc.) | Returns default values on invalid params | `src/lib/searchparams.ts` |
| 10 | URL State | `getSortingStateParser` | Zod-validated JSON parser for sorting state in URL query params. | Column ID list / set | nuqs parser object | Returns `null` on schema validation failure | `src/lib/parsers.ts` |
| 11 | Query Hydration | `HydrationBoundary` | TanStack Query v5 SSR hydration boundary for instant client rendering. | `state={dehydrate(queryClient)}` | Hydrated React subtree | Falls back to client fetch if prefetch failed | `src/features/products/components/product-listing.tsx` |
| 12 | Column Pinning | `getCommonPinningStyles` | Utility computing CSS sticky positioning and box-shadow for pinned left/right columns. | `column: Column<TData>` | `React.CSSProperties` | Returns relative positioning if not pinned | `src/lib/data-table.ts` |

---

## 9. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | `useDataTable` pagination | Negative or non-integer `page` query param | `parseAsInteger.withDefault(1)` resets `page` to 1 safely. |
| 2 | `useDataTable` perPage | Invalid `perPage` query param | Falls back to `initialState?.pagination?.pageSize ?? 10`. |
| 3 | `getSortingStateParser` | Corrupted JSON in `?sort=` or non-existent column ID | `parse` catches JSON error and Zod validation error, safely returning `null` (or empty default `[]`). |
| 4 | `DataTableToolbarFilter` | Column defined without `meta.variant` | `onFilterRender()` returns `null`; column header remains sortable but no filter input is rendered. |
| 5 | `DataTableFacetedFilter` | Multi-select with >2 selected items | Renders count badge (e.g. "3 selected") instead of individual tags to prevent toolbar overflow. |
| 6 | `DataTableFilterClear` | Click inside PopoverTrigger button | Custom `div` with button semantics and `stopPropagation` prevents nested `<button>` hydration mismatch errors. |
| 7 | Column Pinning | Pinned action column with horizontal scroll | Pinned `right: 0` with sticky position and `5px 0 5px -5px var(--border) inset` shadow remains fixed while data scrolls underneath. |
| 8 | Empty Data Table | `data = []` (0 rows returned) | Displays single row with `No results.` spanning all columns with `h-24 text-center`. |
| 9 | Multi-Tab Tables (Fleet/Trips) | Switching between tabs with active search/filters | `setActiveTab` resets `page` and adjusts status filters appropriately per tab. |
| 10 | E2E Test Selectors | Refactoring DOM elements to TanStack Table | E2E tests depend on specific IDs (`#hub-search-input`, `#btn-add-hub`, `#fleet-search-input`, `[data-testid="btn-assign-order-*"]`); these must be preserved in the refactored components. |
