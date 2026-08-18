# Comprehensive Investigation Report: Orders Intake & Dispatch Standardization (Milestone 3)

**Agent**: Explorer 1  
**Milestone**: Milestone 3 — Orders Intake & Dispatch Standardization  
**Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_1`  
**Date**: 2026-08-18  

---

## 1. Executive Summary

This report documents the architectural, API, and UI/UX investigation of the Orders Intake & Dispatch domain in both `backend/` (NestJS 11+) and `frontend/` (Next.js 15+ App Router).

Milestone 3 refactors `frontend/src/app/dashboard/orders/page.tsx` from a monolithic ~1,200 line client-side component into the canonical **TanStack React Table v8 + nuqs + TanStack Query v5** modular architecture established in Milestone 1 (`features/hubs/`) and Milestone 2 (`features/fleet/`).

---

## 2. Backend Orders Module (`backend/src/orders/`)

### 2.1 Architecture & Controllers
- **Controller**: `OrdersController` (`backend/src/orders/orders.controller.ts`)
  - Route prefix: `/api/v1/orders`
  - Global guards: `AuthGuard('jwt')`, `RolesGuard`
  - Swagger Tag: `Orders`
- **Service**: `OrdersService` (`backend/src/orders/orders.service.ts`)
  - Handles business logic, code generation with Vietnamese accent stripping, notifications, email dispatch, and soft deletes.
- **Module**: `OrdersModule` (`backend/src/orders/orders.module.ts`)
  - Injects `OrderEntity`, `UserEntity`, `NotificationsModule`, `MailModule`.

### 2.2 Endpoints Reference Table

| HTTP Method | Route | Controller Method | RBAC Roles | Description | Request Payload / Query | Response Structure |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/orders` | `create` | `SUPER_ADMIN`, `DISPATCHER` | Tạo mới đơn hàng (lệnh điều vận). Mầc định status = `DRAFT`. | `CreateOrderDto` (JSON body) | `OrderEntity` (HTTP 201) |
| `GET` | `/api/v1/orders` | `findAll` | Authenticated | Lấy danh sách đơn hàng có phân trang, bộ lọc, tìm k��em và quan hệ `trips`, `vehicle`, `driver`. | `QueryOrderDto` (Query params: `page`, `limit`, `status`, `search`, `originHub`, `destinationHub`, `fromDate`, `toDate`) | `{ data: OrderEntity[], meta: { total, page, limit, totalPages } }` (HTTP 200) |
| `GET` | `/api/v1/orders/stats` | `getStats` | Authenticated | Thống kê số lượng đơn theo trạng thái trong khoảng ngày (`fromDate`, `toDate`). Default: đầu tháng đến hôm nay. | `QueryOrderStatsDto` (Query params: `fromDate`, `toDate`) | `{ total, pending, assigned, inTransit, delivered, noVehicle, cancelled, fromDate, toDate }` (HTTP 200) |
| `GET` | `/api/v1/orders/generate-code` | `generateCode` | `SUPER_ADMIN`, `DISPATCHER` | T�� động sinh mã đơn hàng tạm thời định dạng `[PREFIX]-[MMYY]-[NNN]`, t�� động kiểm tra trùng lầp trong DB. | Query param: `prefix` (optional, default `ORD`) | `{ orderCode: string }` (HTTP 200) |
| `GET` | `/api/v1/orders/:id` | `findOne` | Authenticated | Xem chi tiạt đơn hàng cùng các chuyản xe điều phối (`trips`, `trips.vehicle`, `trips.driver`). | URL Param: `id` (number) | `OrderEntity` (HTTP 200) |
| `PATCH` | `/api/v1/orders/:id` | `update` | `SUPER_ADMIN`, `DISPATCHER` | Cạp n歭t thông tin đơn hàng (số lượng, khối lượng, thể tích, mô tả, cờ xe ngo�i, ghi chú). | `UpdateOrderDto` (JSON body) | `OrderEntity` (HTTP 200) |
| `PATCH` | `/api/v1/orders/:id/submit` | `submit` | `SUPER_ADMIN`, `DISPATCHER` | Gửi đơn lên Đội xe (`DRAFT` -> `PENDING_FLEET`). T�� động gửi in-app notification và email cho `FLEET_MANAGER` và `SUPER_ADMIN`. | None | `OrderEntity` (HTTP 200) |
| `PATCH` | `/api/v1/orders/:id/no-vehicle` | `markNoVehicle` | `SUPER_ADMIN`, `FLEET_MANAGER` | Đội xe báo không có xe nội bộ (`PENDING_FLEET` -> `NO_VEHICLE`). Gửi notification + email cho `DISPATCHER` và `SUPER_ADMIN`. | `{ reason?: string }` (JSON body) | `OrderEntity` (HTTP 200) |
| `DELETE` | `/api/v1/orders/:id` | `remove` | `SUPER_ADMIN`, `DISPATCHER` | Xóa mềm đơn hàng (`softRemove`). | URL Param: `id` (number) | `void` (HTTP 204 No Content) |

### 2.3 Related External Endpoints
- `GET /api/v1/hubs/active` (`HubsController.findActive`): Trả về mảng `HubEntity[]` các chi n桡nh kho đang hoạt động (`isActive = true`), dùng để populate dropdown Hub xuất phát và Hub đích trong modal tạo đơn hàng (order-create-dialog.tsx).

---

## 3. Data Contracts & Type Definitions

### 3.1 Status Enums & Vietnamese Badges
```typescript
export type OrderStatus =
  | 'DRAFT'           // N桡p (Badge secondary slate)
  | 'PENDING_FLEET'   // Chờ điều xe (Badge blue)
  | 'ASSIGNED'        // Đã phân xe (Badge emerald)
  | 'IN_TRANSIT'      // Đang vận chuyản (Badge amber)
  | 'DELIVERED'       // Đã giao hàng (Badge green)
  | 'NO_VEHICLE'      // Không có xe (Badge rose / destructive)
  | 'CANCELLED';      // Đã hữy (Badge outline)
```

### 3.2 Order Entity & Response Interfaces
```typescript
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

export interface OrderStats {
  total: number;
  pending: number;      // PENDING_FLEET
  assigned: number;     // ASSIGNED
  inTransit: number;    // IN_TRANSIT
  delivered: number;    // DELIVERED
  noVehicle: number;    // NO_VEHICLE
  cancelled: number;    // CANCELLED
  fromDate: string;     // YYYY-MM-DD
  toDate: string;       // YYYY-MM-DD
}

export interface PaginatedOrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 3.3 Create & Update Payloads
```typescript
export interface CreateOrderPayload {
  orderCode: string;                  // Required, unique
  route?: string;                     // e.g. 'Andromeda -> Centaurus'
  originHub?: string;                 // e.g. 'Andromeda Hub (Hà Nội)'
  destinationHub?: string;            // e.g. 'Centaurus Hub (TP.HCM)'
  totalQuantity?: number | null;      // Optional, min 0
  totalWeight: number;                // Required, min 0 (kg)
  totalVolume: number;                // Required, min 0 (m3)
  goodsDescription?: string;          // Optional
  isExternalVehicleNeeded?: boolean;  // Optional, default false
  externalNote?: string;              // Required if isExternalVehicleNeeded is true
  notes?: string;                    // Optional notes
}

export type UpdateOrderPayload = Partial<CreateOrderPayload>;
```

### 3.4 Query Filter Parameters
```typescript
export interface OrderFilters {
  page?: number;                     // default: 1
  limit?: number;                    // default: 10 or 20 (max 100)
  status?: string;                   // 'ALL', 'DRAFT', 'PENDING_FLEET', etc.
  search?: string;                   // searches orderCode, route, goodsDescription
  originHub?: string;
  destinationHub?: string;
  fromDate?: string;                 // 'YYYY-MM-DD'
  toDate?: string;                  // 'YYYY-MM-DD'
  sort?: string;                     // sorting JSON string
}
```

---

## 4. Existing Frontend State & Identified Gaps

### 4.1 Monolithic Architecture in `frontend/src/app/dashboard/orders/page.tsx`
- Currently 1,176 lines in a single `'use client'` file.
- Contains inline state management (`useState`, `useEffect`) rather than TanStack Query v5 + Server Component prefetching.
- Manages manual pagination (`TablePaginationBar`) instead of canonical `<DataTablePagination>`.
- Custom table markup with raw HTML `<table>` rather than `@tanstack/react-table` v8 `<DataTable>`.
- Hardcoded static `HUBS` array (`['Andromeda Hub (Hà Nội)', ...]`) instead of querying live active hubs from `GET /api/v1/hubs/active`.
- Manual `confirm()` window prompts instead of Radix/Shadcn UI Confirmation Dialogs.

### 4.2 Cross-Feature Integrations
- `frontend/src/app/dashboard/orders/[id]/page.tsx` (Order Detail Page) imports `{ ordersApi, Order, OrderStatus } from '@/features/orders/api'`.
- `frontend/src/app/dashboard/trips/page.tsx` (Trips Page) imports `{ ordersApi, Order } from '@/features/orders/api'`.
- **Constraint**: `frontend/src/features/orders/api.ts` must maintain complete backward compatibility and re-export the `ordersApi` object and TypeScript types.

### 4.3 E2E Test Suite Alignment (`06-order-dispatch-workflow.spec.ts`)
The Playwright test `06-order-dispatch-workflow.spec.ts` tests the full operational flow and requires:
1. Heading: `Lưp Lệnh Điều Vận`
2. Create button: `button:has-text("Tạo lệnh điều vận mới")`
3. Form input IDs:
  - `#order-code-input`
  - `#total-weight-input`
  - `#total-volume-input`
  - `#goods-desc-input`
4. Form submit button: `button[type="submit"]:has-text("Lưu & Tạo lệnh")`
5. Table rows: standard `<tr>` containing order code text.
6. Row submit button: `button:has-text("Gửi Fleet")`
7. Status badge text: `Chờ điều xe`

---

## 5. Target Architecture Design for Milestone 3

```
frontend/src/
%└─ app/dashboard/orders/
%│   %└─ page.tsx                           # Server Component with searchParamsCache
%│   %└─ [id]/page.tsx                      # Existing Order Detail (compatible with features/orders/api)
%└─ features/orders/
    %└─ api/
    %│   %└─ types.ts                       # Order, OrderStatus, OrderStats, OrderFilters, Payloads
    %│   %└─ service.ts                     # Axios API caller methods + backward-compat ordersApi
    %│   %└─ queries.ts                     # TanStack Query queryOptions (orders, stats, code gen)
    %│   %└─ mutations.ts                   # TanStack Query mutations (create, update, submit, delete)
    %│   %└─ index.ts                      # Barrel export
    %│  %└─ api.ts                            # Legacy re-export: export * from './api/index'
    %│  %└─ info-content.ts                   # InfobarContent metadata
    %└─ components/
        %└─ index.ts                      # Barrel export
        %│   %└─ orders-listing.tsx            # Server prefetch wrapper with HydrationBoundary
        %│   %└─ orders-kpi-cards.tsx          # 4 KPI cards + Date Preset Filter Bar (Today, 7D, Month)
        %│   %└─ order-create-dialog.tsx       # Dialog with live active hubs, code generator, validation
        %│   %└─ order-delete-dialog.tsx       # Radix AlertDialog for deleting draft orders
        %└─ orders-tables/
            %│   %└─ index.tsx                  # Client table with useDataTable, <DataTable>
            %│   %└─ columns.tsx                # ColumnDef<Order>[] with sortable headers & badges
            %│   %└─ cell-action.tsx            # Row actions: 'Gửi Fleet', 'Xe ngo�i', View, Delete
            %│   %└─ options.tsx                # ORDER_STATUS_OPTIONS, ORDER_PRESETS
            %└─ use-orders-table-filters.tsx # nuqs query states hook
```

---

## 6. Verification Checklist

1. [x] Backend Orders endpoints and DTOs fully inspected.
2. [x] Status enums and transition workflows mapped (`DRAFT` -> `PENDING_FLEET` -> `ASSIGNED`/`NO_VEHICLE` -> `IN_TRANSIT` -> `DELIVERED`).
3. [x] Active Hubs endpoint (`/api/v1/hubs/active`) identified for dynamic dropdown.
4. [x] E2E test selectors and contracts extracted from `06-order-dispatch-workflow.spec.ts`.
5. [x] Vietnamese language and toast notification conventions verified.
6. [x] Compatibility requirements for `orders/[id]/page.tsx` and `trips/page.tsx` documented.
