# Canonical Fleet Management Architecture & Specification

**Milestone**: Milestone 2 — Fleet Management Standardization  
**Module**: `frontend/src/features/fleet/` & `frontend/src/app/dashboard/fleet/`  
**Date**: 2026-08-18  
**Author**: Explorer 2 (Spec Miner)  
**Target Consumer**: Worker Subagent for Fleet Management Implementation  

---

## 1. Observation & Context Analysis

### 1.1. Existing State Assessment
- **Current File**: `frontend/src/app/dashboard/fleet/page.tsx` is a monolithic 1050-line client component (`'use client'`).
- **Data Fetching**: Uses manual `useState` and raw `useEffect` calling `fleetApi.getVehicles()`, `fleetApi.getDrivers()`, and `hubsApi.getActiveHubs()`.
- **Table Rendering**: Renders raw HTML `<table>` elements with hard-coded client filtering, no server pagination, no sortable column headers (`DataTableColumnHeader`), and no URL state synchronization.
- **Dual Tab Structure**: Contains two tabs — **Vehicles ("Danh Sách Xe")** and **Drivers ("Danh Sách Tài Xế")** — toggling between the two with local `useState<'vehicles' | 'drivers'>('vehicles')`.
- **CRUD Operations**: Handled via raw dialog states (`isVehicleModalOpen`, `isDriverModalOpen`, `deletingItem`) with manual fetch re-triggers.
- **Playwright Test Dependencies** (from `e2e/04-fleet-crud-and-refresh.spec.ts` & `e2e/10-hubs-management.spec.ts`):
  - Heading: `Quản Lý Đội Xe`
  - Action buttons: `#btn-add-vehicle`, `#btn-add-driver`
  - Tab triggers: `#tab-vehicles`, `#tab-drivers`
  - Vehicle modal & form inputs: `#vehicle-form-dialog`, `#input-license-plate`, `#input-vehicle-model`, `#select-vehicle-type`, `#input-max-weight`, `#input-max-volume`, `#select-current-hub` (must contain active hub options), `#input-current-hub`, `#select-vehicle-status`, `#input-is-external`, `#input-external-provider`, `#btn-save-vehicle`
  - Vehicle table elements: `data-testid="vehicle-row-${v.id}"`, `data-testid="btn-edit-vehicle-${v.id}"`, `data-testid="btn-delete-vehicle-${v.id}"`
  - Driver modal & form inputs: `#driver-form-dialog`, `#input-driver-name`, `#input-driver-phone`, `#input-driver-license-no`, `#select-driver-license-class`, `#input-driver-exp`, `#select-driver-status`, `#btn-save-driver`
  - Driver table elements: `data-testid="driver-row-${d.id}"`, `data-testid="btn-edit-driver-${d.id}"`, `data-testid="btn-delete-driver-${d.id}"`
  - Delete dialog: `#delete-confirm-dialog`, `#btn-confirm-delete`
  - Search input: `#fleet-search-input`
- **External Dependents**: `frontend/src/app/dashboard/trips/page.tsx` imports `fleetApi`, `Vehicle`, `Driver` from `@/features/fleet/api`.

---

## 2. Logic Chain & Target Canonical Architecture

### 2.1. Architectural Strategy
To achieve 100% compliance with the project's canonical architecture (`survey_canonical.md`, `features/products/`, `features/users/`):

1. **RSC + Client Component Hybrid**:
   - `src/app/dashboard/fleet/page.tsx`: Next.js Server Component parsing URL search parameters using `searchParamsCache.parse(searchParams)`.
   - Renders `<PageContainer>` with metadata, page title `"Quản Lý Đội Xe"`, and info content.
   - Renders `<FleetListingPage />` which prefetches queries with TanStack Query and wraps children in `<HydrationBoundary state={dehydrate(queryClient)}>`.
2. **Dual-Tab URL State Synchronization via `nuqs`**:
   - The active tab is synchronized with the URL query param: `?tab=vehicles` or `?tab=drivers` (default: `'vehicles'`).
   - Pagination (`page`, `perPage`), search text (`search`), status filter (`status`), and sorting (`sort`) are managed via `nuqs` and synchronized per tab.
3. **Data Access Layer De-coupling**:
   - Split API into standard modules: `types.ts`, `service.ts`, `queries.ts`, `mutations.ts`.
   - `service.ts` uses `apiClient` to fetch `/api/v1/vehicles` and `/api/v1/drivers`, and provides filtering, sorting, and pagination abstraction.
   - Retain `frontend/src/features/fleet/api.ts` (or `api/index.ts`) as a re-export proxy for backward compatibility with `trips/page.tsx`.
4. **TanStack Table v8 Standard Tables**:
   - Separate sub-table components: `vehicles-table/` and `drivers-table/`.
   - Both utilize `useDataTable`, `DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `DataTablePagination`, and `DataTableFacetedFilter`.
5. **Toast Notification Standardization (Rule 1 & Rule 2)**:
   - 100% Vietnamese messages in all mutations and toast calls.
   - Pattern: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Fallback tiếng Việt')`.

---

## 3. Directory and File Structure Blueprint

```
frontend/src/
├── app/
│   └── dashboard/
│       └── fleet/
│           ├── page.tsx                      # Server Component (searchParamsCache, PageContainer, FleetListingPage)
│           └── loading.tsx                   # Loading Skeleton fallback
├── features/
│   └── fleet/
│       ├── api.ts                            # Re-export facade for backward compatibility
│       ├── api/
│       │   ├── types.ts                      # Vehicle, Driver, CreateVehiclePayload, Filters, Responses
│       │   ├── service.ts                    # Axios apiClient calls with filter & pagination handling
│       │   ├── queries.ts                    # vehicleKeys, driverKeys, queryOptions for React Query
│       │   ├── mutations.ts                  # Mutation options for Create, Update, Delete
│       │   └── index.ts                      # Clean barrel exports
│       ├── components/
│       │   ├── fleet-listing.tsx             # Dual-tab container, tab switching, and prefetching
│       │   ├── fleet-kpi-cards.tsx           # KPI Metric Cards (Total Vehicles, In Use, Drivers, Maintenance)
│       │   ├── vehicle-form-dialog.tsx       # Add/Edit Vehicle Modal Dialog
│       │   ├── driver-form-dialog.tsx        # Add/Edit Driver Modal Dialog
│       │   ├── vehicles-table/
│       │   │   ├── index.tsx                 # VehiclesTable (useDataTable, useSuspenseQuery, DataTable)
│       │   │   ├── columns.tsx               # ColumnDef<Vehicle>[] with meta, badges, pin, and actions
│       │   │   ├── cell-action.tsx           # Row Edit/Delete actions with E2E test IDs
│       │   │   ├── options.tsx               # VEHICLE_STATUS_OPTIONS, VEHICLE_TYPE_OPTIONS
│       │   │   └── use-vehicles-table-filters.tsx # Filter state synchronization hook
│       │   └── drivers-table/
│       │       ├── index.tsx                 # DriversTable (useDataTable, useSuspenseQuery, DataTable)
│       │       ├── columns.tsx               # ColumnDef<Driver>[] with meta, badges, pin, and actions
│       │       ├── cell-action.tsx           # Row Edit/Delete actions with E2E test IDs
│       │       ├── options.tsx               # DRIVER_STATUS_OPTIONS, DRIVER_LICENSE_CLASS_OPTIONS
│       │       └── use-drivers-table-filters.tsx  # Filter state synchronization hook
│       ├── schemas/
│       │   ├── vehicle.ts                    # Zod validation schema for Vehicle form
│       │   └── driver.ts                     # Zod validation schema for Driver form
│       └── info-content.ts                   # Fleet Infobar Guide Content
└── lib/
    └── searchparams.ts                       # Register `tab` & fleet query parameters
```

---

## 4. Code Contracts and Interfaces

### 4.1. Search Parameters Registration (`src/lib/searchparams.ts`)
```typescript
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  tab: parseAsString.withDefault('vehicles'),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString,
  licensePlate: parseAsString,
  fullName: parseAsString,
  status: parseAsString,
  type: parseAsString,
  role: parseAsString,
  category: parseAsString,
  gender: parseAsString,
  sort: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
```

---

### 4.2. API Types (`src/features/fleet/api/types.ts`)
```typescript
import type { Hub } from '@/features/hubs/api';

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';

export interface Vehicle {
  id: number;
  licensePlate: string;
  model?: string | null;
  type: string;
  maxWeight: number;
  maxVolume: number;
  currentHub?: string | null;
  hubId?: number | null;
  hub?: Hub | null;
  status: VehicleStatus;
  assignedDriverId?: number | null;
  isExternal?: boolean;
  externalProvider?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  id: number;
  fullName: string;
  phone: string;
  licenseNumber?: string | null;
  licenseClass: string;
  experienceYears: number;
  status: DriverStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiclePayload {
  licensePlate: string;
  model?: string;
  type: string;
  maxWeight: number;
  maxVolume: number;
  currentHub?: string;
  hubId?: number | null;
  status?: VehicleStatus;
  assignedDriverId?: number;
  isExternal?: boolean;
  externalProvider?: string;
}

export interface CreateDriverPayload {
  fullName: string;
  phone: string;
  licenseNumber?: string;
  licenseClass: string;
  experienceYears?: number;
  status?: DriverStatus;
}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  status?: string | null;
  type?: string | null;
  sort?: string | null;
}

export interface DriverFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  status?: string | null;
  licenseClass?: string | null;
  sort?: string | null;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  total_vehicles: number;
  all_vehicles?: Vehicle[];
}

export interface DriversResponse {
  drivers: Driver[];
  total_drivers: number;
  all_drivers?: Driver[];
}
```

---

### 4.3. API Service Layer (`src/features/fleet/api/service.ts`)
```typescript
import { apiClient } from '@/lib/api-client';
import type {
  Vehicle,
  Driver,
  CreateVehiclePayload,
  CreateDriverPayload,
  VehicleFilters,
  DriverFilters,
  VehiclesResponse,
  DriversResponse
} from './types';

export const fleetApi = {
  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await apiClient.get<Vehicle[]>('/api/v1/vehicles');
    return res.data;
  },
  getPaginatedVehicles: async (filters: VehicleFilters): Promise<VehiclesResponse> => {
    const res = await apiClient.get<Vehicle[]>('/api/v1/vehicles');
    const all = res.data;

    let filtered = [...all];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(q) ||
          (v.model && v.model.toLowerCase().includes(q)) ||
          (v.hub?.name && v.hub.name.toLowerCase().includes(q)) ||
          (v.currentHub && v.currentHub.toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'ALL') {
      const statuses = filters.status.split(',');
      filtered = filtered.filter((v) => statuses.includes(v.status));
    }
    if (filters.type && filters.type !== 'ALL') {
      const types = filters.type.split(',');
      filtered = filtered.filter((v) => types.includes(v.type));
    }

    if (filters.sort) {
      try {
        const sorting = JSON.parse(filters.sort);
        if (Array.isArray(sorting) && sorting.length > 0) {
          const { id, desc } = sorting[0];
          filtered.sort((a: any, b: any) => {
            const valA = a[id] ?? '';
            const valB = b[id] ?? '';
            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
          });
        }
      } catch (e) {
        // ignore sorting parse error
      }
    }

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      vehicles: paginated,
      total_vehicles: total,
      all_vehicles: all
    };
  },
  createVehicle: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/api/v1/vehicles', payload);
    return res.data;
  },
  updateVehicle: async (id: number, payload: Partial<CreateVehiclePayload>): Promise<Vehicle> => {
    const res = await apiClient.patch<Vehicle>(`/api/v1/vehicles/${id}`, payload);
    return res.data;
  },
  deleteVehicle: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/vehicles/${id}`);
  },

  // Drivers
  getDrivers: async (): Promise<Driver[]> => {
    const res = await apiClient.get<Driver[]>('/api/v1/drivers');
    return res.data;
  },
  getPaginatedDrivers: async (filters: DriverFilters): Promise<DriversResponse> => {
    const res = await apiClient.get<Driver[]>('/api/v1/drivers');
    const all = res.data;

    let filtered = [...all];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'ALL') {
      const statuses = filters.status.split(',');
      filtered = filtered.filter((d) => statuses.includes(d.status));
    }
    if (filters.licenseClass && filters.licenseClass !== 'ALL') {
      const classes = filters.licenseClass.split(',');
      filtered = filtered.filter((d) => classes.includes(d.licenseClass));
    }

    if (filters.sort) {
      try {
        const sorting = JSON.parse(filters.sort);
        if (Array.isArray(sorting) && sorting.length > 0) {
          const { id, desc } = sorting[0];
          filtered.sort((a: any, b: any) => {
            const valA = a[id] ?? '';
            const valB = b[id] ?? '';
            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
          });
        }
      } catch (e) {
        // ignore sorting parse error
      }
    }

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      drivers: paginated,
      total_drivers: total,
      all_drivers: all
    };
  },
  createDriver: async (payload: CreateDriverPayload): Promise<Driver> => {
    const res = await apiClient.post<Driver>('/api/v1/drivers', payload);
    return res.data;
  },
  updateDriver: async (id: number, payload: Partial<CreateDriverPayload>): Promise<Driver> => {
    const res = await apiClient.patch<Driver>(`/api/v1/drivers/${id}`, payload);
    return res.data;
  },
  deleteDriver: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/drivers/${id}`);
  }
};
```

---

### 4.4. React Query Options (`src/features/fleet/api/queries.ts`)
```typescript
import { queryOptions } from '@tanstack/react-query';
import { fleetApi } from './service';
import type { VehicleFilters, DriverFilters } from './types';

export const fleetKeys = {
  allVehicles: ['fleet', 'vehicles'] as const,
  vehiclesList: (filters: VehicleFilters) => [...fleetKeys.allVehicles, 'list', filters] as const,
  rawVehicles: () => [...fleetKeys.allVehicles, 'raw'] as const,
  vehicleDetail: (id: number) => [...fleetKeys.allVehicles, 'detail', id] as const,

  allDrivers: ['fleet', 'drivers'] as const,
  driversList: (filters: DriverFilters) => [...fleetKeys.allDrivers, 'list', filters] as const,
  rawDrivers: () => [...fleetKeys.allDrivers, 'raw'] as const,
  driverDetail: (id: number) => [...fleetKeys.allDrivers, 'detail', id] as const
};

export const vehiclesQueryOptions = (filters: VehicleFilters) =>
  queryOptions({
    queryKey: fleetKeys.vehiclesList(filters),
    queryFn: () => fleetApi.getPaginatedVehicles(filters)
  });

export const rawVehiclesQueryOptions = () =>
  queryOptions({
    queryKey: fleetKeys.rawVehicles(),
    queryFn: () => fleetApi.getVehicles()
  });

export const driversQueryOptions = (filters: DriverFilters) =>
  queryOptions({
    queryKey: fleetKeys.driversList(filters),
    queryFn: () => fleetApi.getPaginatedDrivers(filters)
  });

export const rawDriversQueryOptions = () =>
  queryOptions({
    queryKey: fleetKeys.rawDrivers(),
    queryFn: () => fleetApi.getDrivers()
  });
```

---

### 4.5. React Query Mutations (`src/features/fleet/api/mutations.ts`)
```typescript
import { fleetApi } from './service';
import { fleetKeys } from './queries';
import { getQueryClient } from '@/lib/query-client';
import type { CreateVehiclePayload, CreateDriverPayload } from './types';

export const createVehicleMutation = {
  mutationFn: (data: CreateVehiclePayload) => fleetApi.createVehicle(data),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allVehicles });
  }
};

export const updateVehicleMutation = {
  mutationFn: ({ id, data }: { id: number; data: Partial<CreateVehiclePayload> }) =>
    fleetApi.updateVehicle(id, data),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allVehicles });
  }
};

export const deleteVehicleMutation = {
  mutationFn: (id: number) => fleetApi.deleteVehicle(id),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allVehicles });
  }
};

export const createDriverMutation = {
  mutationFn: (data: CreateDriverPayload) => fleetApi.createDriver(data),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allDrivers });
  }
};

export const updateDriverMutation = {
  mutationFn: ({ id, data }: { id: number; data: Partial<CreateDriverPayload> }) =>
    fleetApi.updateDriver(id, data),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allDrivers });
  }
};

export const deleteDriverMutation = {
  mutationFn: (id: number) => fleetApi.deleteDriver(id),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: fleetKeys.allDrivers });
  }
};
```

---

### 4.6. Page Server Component (`src/app/dashboard/fleet/page.tsx`)
```typescript
import PageContainer from '@/components/layout/page-container';
import FleetListingPage from '@/features/fleet/components/fleet-listing';
import { fleetInfoContent } from '@/features/fleet/info-content';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Quản Lý Đội Xe'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function FleetPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Quản Lý Đội Xe'
      pageDescription='Theo dõi danh sách phương tiện, sức chứa tải trọng, bằng lái & tình trạng tài xế Spider Express'
      infoContent={fleetInfoContent}
    >
      <FleetListingPage />
    </PageContainer>
  );
}
```

---

### 4.7. Dual-Tab Server/Client Listing Container (`src/features/fleet/components/fleet-listing.tsx`)
```typescript
'use client';

import { HydrationBoundary, dehydrate, useQuery } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useQueryState, parseAsString } from 'nuqs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IconTruck, IconUserCheck, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { VehiclesTable } from './vehicles-table';
import { DriversTable } from './drivers-table';
import { FleetKpiCards } from './fleet-kpi-cards';
import { VehicleFormDialog } from './vehicle-form-dialog';
import { DriverFormDialog } from './driver-form-dialog';
import { rawVehiclesQueryOptions, rawDriversQueryOptions } from '../api/queries';

export default function FleetListingPage() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('vehicles'));
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const { data: rawVehicles = [] } = useQuery(rawVehiclesQueryOptions());
  const { data: rawDrivers = [] } = useQuery(rawDriversQueryOptions());

  return (
    <div className='flex-1 space-y-6'>
      {/* Header Actions */}
      <div className='flex items-center justify-end gap-3'>
        <Button
          id='btn-add-vehicle'
          onClick={() => setIsVehicleModalOpen(true)}
          className='cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all'
        >
          <IconPlus className='mr-2 h-4 w-4' />
          Thêm Xe Mới
        </Button>
        <Button
          id='btn-add-driver'
          onClick={() => setIsDriverModalOpen(true)}
          variant='outline'
          className='cursor-pointer border-primary/30 hover:bg-accent text-foreground shadow-xs transition-all'
        >
          <IconUserCheck className='mr-2 h-4 w-4 text-primary' />
          Thêm Tài Xế Mới
        </Button>
      </div>

      {/* KPI Cards */}
      <FleetKpiCards vehicles={rawVehicles} drivers={rawDrivers} />

      {/* Main Dual-Tab Workspace */}
      <Tabs
        value={tab}
        onValueChange={(val) => setTab(val as 'vehicles' | 'drivers')}
        className='space-y-4'
      >
        <TabsList className='bg-muted p-1'>
          <TabsTrigger
            value='vehicles'
            id='tab-vehicles'
            className='cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-xs px-4'
          >
            <IconTruck className='h-4 w-4 mr-2' />
            Danh Sách Xe ({rawVehicles.length})
          </TabsTrigger>
          <TabsTrigger
            value='drivers'
            id='tab-drivers'
            className='cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-xs px-4'
          >
            <IconUserCheck className='h-4 w-4 mr-2' />
            Danh Sách Tài Xế ({rawDrivers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='vehicles' className='m-0 space-y-4'>
          <VehiclesTable />
        </TabsContent>

        <TabsContent value='drivers' className='m-0 space-y-4'>
          <DriversTable />
        </TabsContent>
      </Tabs>

      {/* Add Modals */}
      <VehicleFormDialog
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        vehicle={null}
      />
      <DriverFormDialog
        open={isDriverModalOpen}
        onOpenChange={setIsDriverModalOpen}
        driver={null}
      />
    </div>
  );
}
```

---

### 4.8. Vehicle Columns Definition (`src/features/fleet/components/vehicles-table/columns.tsx`)
```typescript
'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { IconMapPin } from '@tabler/icons-react';
import type { Vehicle } from '../../api/types';
import { CellAction } from './cell-action';
import { VEHICLE_STATUS_OPTIONS, VEHICLE_TYPE_OPTIONS } from './options';

export const columns: ColumnDef<Vehicle>[] = [
  {
    id: 'licensePlate',
    accessorKey: 'licensePlate',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Biển Số Xe' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20 font-mono text-xs font-semibold'>
          {row.original.licensePlate}
        </span>
        {row.original.isExternal && (
          <span className='bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-300 whitespace-nowrap'>
            🚛 Xe thuê ngoài
          </span>
        )}
      </div>
    ),
    meta: {
      label: 'Biển số / Mẫu xe',
      placeholder: 'Tìm biển số, mẫu xe...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mẫu Xe & Loại' />
    ),
    cell: ({ row }) => (
      <div>
        <div className='font-medium text-foreground'>
          {row.original.model || 'Chưa cập nhật'}
        </div>
        <div className='text-xs text-muted-foreground font-mono'>
          {row.original.type}
          {row.original.isExternal && row.original.externalProvider && (
            <span className='ml-1.5 text-amber-700 dark:text-amber-400 font-medium'>
              ({row.original.externalProvider})
            </span>
          )}
        </div>
      </div>
    ),
    meta: {
      label: 'Loại xe',
      variant: 'select' as const,
      options: VEHICLE_TYPE_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'maxWeight',
    accessorKey: 'maxWeight',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tải Trọng Tối Đa (Kg)' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-medium'>
        {row.original.maxWeight.toLocaleString('vi-VN')} kg
      </span>
    )
  },
  {
    id: 'maxVolume',
    accessorKey: 'maxVolume',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thể Tích Tối Đa (m³)' />
    ),
    cell: ({ row }) => (
      <span className='font-mono font-medium'>{row.original.maxVolume} m³</span>
    )
  },
  {
    id: 'currentHub',
    accessorKey: 'currentHub',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Kho / Hub Trực Thuộc' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1 font-medium text-foreground'>
        <IconMapPin className='h-3.5 w-3.5 text-primary/70 shrink-0' />
        <span>
          {row.original.hub
            ? `${row.original.hub.name} (${row.original.hub.city})`
            : row.original.currentHub || 'Kho Trung Chuyển'}
        </span>
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Vehicle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Trạng Thái' />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      switch (status) {
        case 'AVAILABLE':
          return (
            <Badge className='bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 cursor-pointer'>
              Sẵn Sàng
            </Badge>
          );
        case 'IN_USE':
          return (
            <Badge className='bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20 cursor-pointer'>
              Đang Chạy Chuyến
            </Badge>
          );
        case 'MAINTENANCE':
          return (
            <Badge className='bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20 cursor-pointer'>
              Bảo Trì
            </Badge>
          );
        default:
          return <Badge variant='outline'>{status}</Badge>;
      }
    },
    meta: {
      label: 'Trạng thái',
      variant: 'select' as const,
      options: VEHICLE_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

---

### 4.9. Vehicles Table Cell Action (`src/features/fleet/components/vehicles-table/cell-action.tsx`)
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { deleteVehicleMutation } from '../../api/mutations';
import { VehicleFormDialog } from '../vehicle-form-dialog';
import type { Vehicle } from '../../api/types';

interface CellActionProps {
  data: Vehicle;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteVehicleMutation,
    onSuccess: () => {
      toast.success('Đã xóa xe thành công');
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: (err: any) => {
      const apiMessage = err?.response?.data?.message;
      toast.error(apiMessage || 'Không thể xóa xe. Vui lòng thử lại.');
    }
  });

  return (
    <>
      <VehicleFormDialog
        vehicle={data}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Dialog with E2E Test Selectors */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent id='delete-confirm-dialog'>
          <DialogHeader>
            <DialogTitle>Xác Nhận Xóa</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Bạn có chắc chắn muốn xóa xe{' '}
            <strong className='text-foreground'>{data.licensePlate}</strong>? Thao tác này sẽ đánh dấu xóa trong hệ thống.
          </p>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteOpen(false)}
              className='cursor-pointer'
            >
              Hủy
            </Button>
            <Button
              id='btn-confirm-delete'
              variant='destructive'
              onClick={() => deleteMutation.mutate(data.id)}
              disabled={deleteMutation.isPending}
              className='cursor-pointer'
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa Ngay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Buttons for Direct E2E Testing & Dropdown */}
      <div className='flex items-center justify-end gap-1'>
        <Button
          size='sm'
          variant='ghost'
          aria-label='Chỉnh sửa xe'
          data-testid={`btn-edit-vehicle-${data.id}`}
          onClick={() => setEditOpen(true)}
          className='h-8 px-2 cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10'
        >
          <IconEdit className='h-3.5 w-3.5' />
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-label='Xóa xe'
          data-testid={`btn-delete-vehicle-${data.id}`}
          onClick={() => setDeleteOpen(true)}
          className='h-8 px-2 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        >
          <IconTrash className='h-3.5 w-3.5' />
        </Button>
      </div>
    </>
  );
}
```

---

### 4.10. Driver Columns Definition (`src/features/fleet/components/drivers-table/columns.tsx`)
```typescript
'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { Driver } from '../../api/types';
import { CellAction } from './cell-action';
import { DRIVER_STATUS_OPTIONS, DRIVER_LICENSE_CLASS_OPTIONS } from './options';

export const columns: ColumnDef<Driver>[] = [
  {
    id: 'fullName',
    accessorKey: 'fullName',
    header: ({ column }: { column: Column<Driver, unknown> }) => (
      <DataTableColumnHeader column={column} title='Họ Và Tên' />
    ),
    cell: ({ row }) => (
      <span className='font-semibold text-foreground'>
        {row.original.fullName}
      </span>
    ),
    meta: {
      label: 'Tên tài xế',
      placeholder: 'Tìm họ tên, SĐT, số GPLX...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }: { column: Column<Driver, unknown> }) => (
      <DataTableColumnHeader column={column} title='Số Điện Thoại' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-muted-foreground'>{row.original.phone}</span>
    )
  },
  {
    id: 'license',
    accessorKey: 'licenseNumber',
    header: ({ column }: { column: Column<Driver, unknown> }) => (
      <DataTableColumnHeader column={column} title='Số GPLX & Hạng' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border'>
          {row.original.licenseNumber || 'N/A'}
        </span>
        <Badge
          variant='outline'
          className='bg-primary/5 text-primary border-primary/20'
        >
          Hạng {row.original.licenseClass}
        </Badge>
      </div>
    ),
    meta: {
      label: 'Hạng GPLX',
      variant: 'select' as const,
      options: DRIVER_LICENSE_CLASS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'experienceYears',
    accessorKey: 'experienceYears',
    header: ({ column }: { column: Column<Driver, unknown> }) => (
      <DataTableColumnHeader column={column} title='Kinh Nghiệm' />
    ),
    cell: ({ row }) => (
      <span className='font-medium text-muted-foreground'>
        {row.original.experienceYears} Năm
      </span>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Driver, unknown> }) => (
      <DataTableColumnHeader column={column} title='Trạng Thái' />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      switch (status) {
        case 'AVAILABLE':
          return (
            <Badge className='bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 cursor-pointer'>
              Sẵn Sàng
            </Badge>
          );
        case 'ON_TRIP':
          return (
            <Badge className='bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20 cursor-pointer'>
              Đang Đi Chuyến
            </Badge>
          );
        case 'OFF_DUTY':
          return (
            <Badge className='bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 border-gray-500/20 cursor-pointer'>
              Nghỉ Phép
            </Badge>
          );
        default:
          return <Badge variant='outline'>{status}</Badge>;
      }
    },
    meta: {
      label: 'Trạng thái',
      variant: 'select' as const,
      options: DRIVER_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

---

### 4.11. Client Table Components (`vehicles-table/index.tsx` & `drivers-table/index.tsx`)
```typescript
// src/features/fleet/components/vehicles-table/index.tsx
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { vehiclesQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function VehiclesTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    licensePlate: parseAsString,
    status: parseAsString,
    model: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    search: params.search || params.licensePlate,
    status: params.status,
    type: params.model,
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data, isLoading } = useQuery(vehiclesQueryOptions(filters));

  const pageCount = data ? Math.ceil(data.total_vehicles / params.perPage) : -1;

  const { table } = useDataTable({
    data: data?.vehicles ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 300,
    initialState: {
      columnPinning: { right: ['actions'] }
    },
    getRowId: (row) => `vehicle-row-${row.id}`
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
```

---

## 5. Step-by-Step Migration Plan for Worker

| Step | File Path | Action / Responsibility |
|---|---|---|
| **1** | `frontend/src/lib/searchparams.ts` | Add `tab`, `licensePlate`, `fullName` parameters to `searchParams`. |
| **2** | `frontend/src/features/fleet/api/types.ts` | Create TypeScript interfaces for Vehicle, Driver, Payloads, Filters, and Responses. |
| **3** | `frontend/src/features/fleet/api/service.ts` | Implement API client calls with client-side filtering and slicing fallback. |
| **4** | `frontend/src/features/fleet/api/queries.ts` | Implement `fleetKeys` and query options for React Query. |
| **5** | `frontend/src/features/fleet/api/mutations.ts` | Implement create, update, and delete mutation options with toast error handling. |
| **6** | `frontend/src/features/fleet/api.ts` & `frontend/src/features/fleet/api/index.ts` | Re-export `fleetApi`, `Vehicle`, `Driver` for backward compatibility with `trips/page.tsx`. |
| **7** | `frontend/src/features/fleet/schemas/` | Add `vehicle.ts` and `driver.ts` Zod validation schemas. |
| **8** | `frontend/src/features/fleet/components/vehicle-form-dialog.tsx` | Create Add/Edit Vehicle Dialog with active hub selector (`#select-current-hub`) and all form inputs. |
| **9** | `frontend/src/features/fleet/components/driver-form-dialog.tsx` | Create Add/Edit Driver Dialog with all form inputs. |
| **10** | `frontend/src/features/fleet/components/vehicles-table/` | Create `options.tsx`, `columns.tsx`, `cell-action.tsx`, `use-vehicles-table-filters.tsx`, and `index.tsx`. |
| **11** | `frontend/src/features/fleet/components/drivers-table/` | Create `options.tsx`, `columns.tsx`, `cell-action.tsx`, `use-drivers-table-filters.tsx`, and `index.tsx`. |
| **12** | `frontend/src/features/fleet/components/fleet-kpi-cards.tsx` | Create KPI metric cards matching original dashboard stats. |
| **13** | `frontend/src/features/fleet/components/fleet-listing.tsx` | Create Dual-Tab listing container syncing with `?tab=vehicles|drivers`. |
| **14** | `frontend/src/features/fleet/info-content.ts` | Create info drawer guidance content. |
| **15** | `frontend/src/app/dashboard/fleet/page.tsx` & `loading.tsx` | Convert `page.tsx` to Server Component with `searchParamsCache` and `PageContainer`. Add `loading.tsx`. |
| **16** | Verification | Run `npm run build` in `frontend/` and execute Playwright tests (`04-fleet-crud-and-refresh.spec.ts`). |

---

## 6. Caveats & Invalidation Conditions

1. **Dual Tab Query Key Separation**: Query keys must differentiate vehicles from drivers (`['fleet', 'vehicles', ...]` vs `['fleet', 'drivers', ...]`) so tab switches do not cause cache collisions.
2. **Selector Preservation**: Never rename or omit the DOM IDs and data attributes required by Playwright (`#btn-add-vehicle`, `#tab-drivers`, `#select-current-hub`, `data-testid="vehicle-row-${id}"`, etc.).
3. **Hubs Fetching in Modal**: Vehicle form dialog must asynchronously fetch active hubs using `hubsApi.getActiveHubs()` to populate `#select-current-hub`.

---

## 7. Verification Method

1. **TypeScript Build Check**:
   ```bash
   cd d:\Projects\logistics-website\frontend
   npm run build
   ```
2. **E2E Playwright Suite**:
   ```bash
   npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts
   ```
3. **Browser Smoke Test**:
   - Check `/dashboard/fleet?tab=vehicles` and `/dashboard/fleet?tab=drivers`.
   - Test CRUD for both Vehicle and Driver.
   - Verify pagination controls (`[10, 20, 30, 40, 50]`) and URL search params updates.
