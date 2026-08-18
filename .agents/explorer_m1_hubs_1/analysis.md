# Milestone 1: Hubs Management Standardization — Detailed Investigation & Analysis

## Executive Summary
This document provides a comprehensive investigation of the Hubs Management feature in the Logistics TMS frontend (`frontend/src/app/dashboard/admin/hubs/page.tsx` and `frontend/src/features/hubs/api.ts`), establishing the exact specification required to refactor this monolithic page into the canonical TanStack Table v8 + `nuqs` architecture while preserving 100% action parity, UI formatting, toast notification standards, and Playwright E2E test selectors (`e2e/10-hubs-management.spec.ts`).

---

## 1. Existing Codebase Analysis

### 1.1 Target Files
- **Page File**: `frontend/src/app/dashboard/admin/hubs/page.tsx` (689 lines)
  - Current Status: Monolithic `'use client'` component combining data fetching, metrics calculation, custom HTML table, custom pagination, search/filtering, Add/Edit modal dialog, and soft delete warning dialog.
- **API Client File**: `frontend/src/features/hubs/api.ts` (83 lines)
  - Provides TypeScript interfaces (`Hub`, `PaginatedResult<T>`, `QueryHubParams`, `CreateHubPayload`, `UpdateHubPayload`) and `hubsApi` axios service methods connecting to backend `/api/v1/hubs`.
- **Backend Service & Controller**:
  - `backend/src/hubs/hubs.controller.ts` & `backend/src/hubs/hubs.service.ts`
  - Endpoints: `POST /api/v1/hubs`, `GET /api/v1/hubs`, `GET /api/v1/hubs/active`, `GET /api/v1/hubs/:id`, `PATCH /api/v1/hubs/:id`, `PATCH /api/v1/hubs/:id/toggle-active`, `DELETE /api/v1/hubs/:id`.
  - Protected with `@Roles(RoleEnum.SUPER_ADMIN)`.

---

## 2. State & Data Flow Inventory

### 2.1 State Variables
| State Variable | Type | Purpose | Migration Strategy |
|---|---|---|---|
| `hubs` | `Hub[]` | Current page hubs list | Managed by TanStack Query `useSuspenseQuery(hubsQueryOptions)` |
| `loading` | `boolean` | Loading indicator | Managed by TanStack Query / Next.js Suspense |
| `searchTerm` | `string` | Search query text | URL search param `search` via `nuqs` (bound to `#hub-search-input`) |
| `statusFilter` | `'ALL' \| 'ACTIVE' \| 'INACTIVE'` | Hub status filter | URL search param `status` or `isActive` via `nuqs` |
| `page` | `number` | 1-based page number | URL search param `page` via `useDataTable` (`nuqs`) |
| `limit` | `number` | Page limit (5, 10, 20, 50) | URL search param `perPage` via `useDataTable` (`nuqs`) |
| `total` | `number` | Total items count | Derived from `data.meta.total` |
| `totalPages` | `number` | Total pages count | Computed via `Math.ceil(data.meta.total / perPage)` |
| `metrics` | `{ total, active, inactive, totalVehicles }` | High-level KPI metrics | Dedicated query `hubsMetricsQueryOptions` or extracted from active list / all hubs |
| `isModalOpen` | `boolean` | Add/Edit modal visibility | Local state or sub-component state in `hub-modal.tsx` |
| `editingHub` | `Hub \| null` | Hub being edited | Passed to modal as prop |
| `submitting` | `boolean` | Form submission state | `useMutation().isPending` |
| `deletingHub` | `Hub \| null` | Hub targeted for soft delete | Local state in `cell-action.tsx` or `hub-delete-dialog.tsx` |
| `deleteLoading` | `boolean` | Soft delete execution state | `deleteMutation.isPending` |

### 2.2 Form States & Validation Rules
| Field | ID | Type | Required | Formatting / Validation |
|---|---|---|---|---|
| Mã Chi Nhánh | `#input-hub-code` | `string` | **Yes** | Uppercase, font-mono, unique (`ConflictException` 409 from API if duplicate). Trimmed on submit. |
| Tỉnh / Thành Phố | `#input-hub-city` | `string` | **Yes** | Trimmed on submit. |
| Tên Chi Nhánh Kho | `#input-hub-name` | `string` | **Yes** | Trimmed on submit. |
| Địa Chỉ Chi Tiết | `#input-hub-address` | `string` | No | Optional detailed address. |
| Người Quản Lý Kho | `#input-hub-manager` | `string` | No | Optional manager full name. |
| Số Điện Thoại | `#input-hub-phone` | `string` | No | Optional phone number. |
| Kích Hoạt Ngay | `#input-hub-is-active` | `boolean` | No | Checkbox default `true`. |

---

## 3. UI Components & Layout Specification

### 3.1 Page Header
- **Title**: `Quản Lý Chi Nhánh Kho (Hubs)` with `IconBuildingWarehouse` (h-7 w-7 text-primary)
- **Description**: `Quản lý mạng lưới kho bãi, chi nhánh tiếp nhận & phân phối hàng hóa trên toàn hệ thống Spider Express`
- **Action Button**: `#btn-add-hub` ("Thêm Chi Nhánh Mới") with `IconPlus`, styled with `cursor-pointer bg-primary text-primary-foreground`.

### 3.2 KPI Summary Cards (4 Cards)
1. **Tổng Số Chi Nhánh**:
   - Title: `Tổng Số Chi Nhánh`, Icon: `IconBuildingWarehouse` (text-primary)
   - Value: `metrics.total` (text-2xl font-bold)
   - Subtext: `Điểm trung chuyển hàng hóa`
2. **Đang Hoạt Động**:
   - Title: `Đang Hoạt Động`, Icon: `IconCircleCheck` (text-emerald-500)
   - Value: `metrics.active` (text-2xl font-bold text-emerald-600)
   - Subtext: `Sẵn sàng tiếp nhận đơn & xe`
3. **Tạm Ngưng**:
   - Title: `Tạm Ngưng`, Icon: `IconCircleX` (text-amber-500)
   - Value: `metrics.inactive` (text-2xl font-bold text-amber-600)
   - Subtext: `Tạm ngừng hoặc bảo trì`
4. **Tổng Xe Trực Thuộc**:
   - Title: `Tổng Xe Trực Thuộc`, Icon: `IconTruck` (text-blue-500)
   - Value: `metrics.totalVehicles` (text-2xl font-bold text-blue-600)
   - Subtext: `Phương tiện phân bổ tại các kho`

### 3.3 Toolbar, Search & Filters
- **Search Input**:
  - Selector: `#hub-search-input` (Critical for Playwright test)
  - Placeholder: `Tìm mã kho, tên kho, thành phố, quản lý...`
  - Icon: `IconSearch` (left icon)
  - State Sync: `nuqs` search param `search` (debounced 300-500ms)
- **Status Filter**:
  - Filter options: `ALL` (Tất cả), `ACTIVE` (Đang hoạt động), `INACTIVE` (Tạm ngưng).

### 3.4 Table Column Definitions (`ColumnDef<Hub>[]`)
1. **Mã Hub (`code`)**:
   - Header: Sortable `DataTableColumnHeader` ("MÃ HUB")
   - Cell: Badge with `bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20 font-mono text-xs`.
2. **Tên Chi Nhánh & Tỉnh/Thành (`name`)**:
   - Header: Sortable `DataTableColumnHeader` ("TÊN CHI NHÁNH & TỈNH/THÀNH")
   - Cell:
     - Name: `hub.name` with `IconBuildingWarehouse` (`h-4 w-4 text-primary/70 font-semibold`)
     - City: `hub.city` with `IconMapPin` (`h-3 w-3 text-muted-foreground text-xs`)
3. **Địa Chỉ Chi Tiết (`address`)**:
   - Header: "ĐỊA CHỈ CHI TIẾT"
   - Cell: `text-muted-foreground max-w-xs truncate`, fallback `'Chưa cập nhật'`.
4. **Người Quản Lý & SĐT (`managerName`)**:
   - Header: "NGƯỜI QUẢN LÝ & SĐT"
   - Cell:
     - Manager: `hub.managerName || 'Chưa phân công'` with `IconUser`
     - Phone: `hub.contactPhone` with `IconPhone` (`font-mono text-xs text-muted-foreground`)
5. **Xe Trực Thuộc (`vehicles`)**:
   - Header: "XE TRỰC THUỘC"
   - Cell: `Badge` variant `outline` (`bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono`) with `IconTruck` (`${hub.vehicles?.length || 0} xe`).
6. **Trạng Thái (`isActive`)**:
   - Header: Sortable `DataTableColumnHeader` ("TRẠNG THÁI")
   - Cell:
     - Active: `Badge` (`bg-emerald-500/15 text-emerald-600 border-emerald-500/20`) -> `Hoạt Động`
     - Inactive: `Badge` (`bg-amber-500/15 text-amber-600 border-amber-500/20`) -> `Tạm Ngưng`
7. **Thao Tác (`actions`)**:
   - Header: "THAO TÁC" (right-aligned)
   - Cell (`CellAction`):
     - Toggle Active Button: `aria-label='Bật/Tắt hoạt động kho'`, `cursor-pointer`, showing emerald `IconCircleCheck` or amber `IconCircleX`.
     - Edit Button: `data-testid={`btn-edit-hub-${hub.id}`}`, `aria-label='Chỉnh sửa kho'`, `IconEdit`.
     - Delete Button: `data-testid={`btn-delete-hub-${hub.id}`}`, `aria-label='Xóa kho'`, `IconTrash`.

---

## 4. Dialogs & Modals Specification

### 4.1 Add / Edit Hub Modal Dialog
- **Dialog Container**: `DialogContent` with `id='hub-form-dialog'` and `className='sm:max-w-[520px]'`.
- **Title**: `editingHub ? 'Chỉnh Sửa Chi Nhánh Kho' : 'Thêm Chi Nhánh Kho Mới'` with `IconBuildingWarehouse`.
- **Fields**:
  - `#input-hub-code`: Label `Mã Chi Nhánh (Unique) *`, placeholder `VD: HUB-HAN-01`.
  - `#input-hub-city`: Label `Tỉnh / Thành Phố *`, placeholder `VD: Hà Nội`.
  - `#input-hub-name`: Label `Tên Chi Nhánh Kho *`, placeholder `VD: Andromeda Hub (Hà Nội)`.
  - `#input-hub-address`: Label `Địa Chỉ Chi Tiết`, placeholder `VD: KCN Bắc Thăng Long, Đông Anh, Hà Nội`.
  - `#input-hub-manager`: Label `Người Quản Lý Kho`, placeholder `VD: Nguyễn Văn Quản`.
  - `#input-hub-phone`: Label `Số Điện Thoại Liên Hệ`, placeholder `VD: 024-3886-1234`.
  - `#input-hub-is-active`: Checkbox, Label `Kích hoạt chi nhánh ngay (Sẵn sàng tiếp nhận đơn & phương tiện)`.
- **Footer Buttons**:
  - Cancel: `Hủy Bỏ` (`variant='outline'`).
  - Submit: `button[type="submit"]` with text `submitting ? 'Đang Lưu...' : editingHub ? 'Lưu Thay Đổi' : 'Thêm Chi Nhánh'`.

### 4.2 Soft Delete Confirmation Warning Dialog
- **Dialog Container**: `DialogContent` with `sm:max-w-[450px]`.
- **Title**: `Xác Nhận Xóa Mềm Chi Nhánh Kho` with `IconAlertTriangle` (`text-destructive`).
- **Body Content**:
  - Confirmation text: `Bạn có chắc chắn muốn xóa chi nhánh {deletingHub?.name} ({deletingHub?.code})?`
  - Conditional vehicle warning box:
    ```tsx
    {deletingHub?.vehicles && deletingHub.vehicles.length > 0 && (
      <div className='p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300 text-xs'>
        ⚠️ <strong>Lưu ý:</strong> Hiện có <strong>{deletingHub.vehicles.length} phương tiện</strong> đang trực thuộc chi nhánh này. Sau khi xóa mềm, liên kết kho của các phương tiện này sẽ được giải phóng an toàn mà không làm mất dữ liệu lịch sử.
      </div>
    )}
    ```
  - Soft delete explanation text:
    `Hệ thống áp dụng chính sách Xóa Mềm (Soft Delete). Lịch sử đơn hàng, chuyến xe và các giao dịch trước đây vẫn được bảo toàn nguyên vẹn.`
- **Footer Buttons**:
  - Cancel: `Hủy` (`variant='outline'`).
  - Confirm: `variant='destructive'` with text `deleteLoading ? 'Đang Xóa...' : 'Xác Nhận Xóa Mềm'`.

---

## 5. Toast Notifications & Vietnamese Localization Rules

According to `ORIGINAL_REQUEST.md`:
- **Rule 1 (100% Vietnamese)**: All toast notifications must be in Vietnamese.
- **Rule 2 (API Message First)**: Error toasts must prioritize `err?.response?.data?.message` before falling back to Vietnamese text.

### Toast Audit for Hubs Module:
| Action | Outcome | Current Toast Pattern | Standardized Toast Pattern (Rule 1 & 2 Compliant) |
|---|---|---|---|
| Load Hubs | Error | `toast.error('Không thể tải danh sách chi nhánh kho')` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Không thể tải danh sách chi nhánh kho');` |
| Create Hub | Success | `toast.success(`Tạo mới chi nhánh "${payload.name}" thành công!`)` | `toast.success(`Tạo mới chi nhánh "${payload.name}" thành công!`);` |
| Create Hub | Error | `const msg = err?.response?.data?.message \|\| 'Có lỗi xảy ra khi lưu thông tin kho'; toast.error(msg);` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Có lỗi xảy ra khi lưu thông tin kho');` |
| Update Hub | Success | `toast.success(`Cập nhật chi nhánh "${payload.name}" thành công!`)` | `toast.success(`Cập nhật chi nhánh "${payload.name}" thành công!`);` |
| Update Hub | Error | `const msg = err?.response?.data?.message \|\| 'Có lỗi xảy ra khi lưu thông tin kho'; toast.error(msg);` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Có lỗi xảy ra khi lưu thông tin kho');` |
| Toggle Active | Success | `toast.success(updated.isActive ? `Đã kích hoạt hoạt động chi nhánh "${hub.name}"` : `Đã tạm ngưng hoạt động chi nhánh "${hub.name}"`)` | `toast.success(updated.isActive ? `Đã kích hoạt hoạt động chi nhánh "${hub.name}"` : `Đã tạm ngưng hoạt động chi nhánh "${hub.name}"`);` |
| Toggle Active | Error | `toast.error('Không thể chuyển đổi trạng thái chi nhánh kho')` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Không thể chuyển đổi trạng thái chi nhánh kho');` |
| Soft Delete | Success | `toast.success(res.message \|\| `Đã xóa mềm chi nhánh "${deletingHub.name}" thành công!`)` | `toast.success(res.message \|\| `Đã xóa mềm chi nhánh "${deletingHub.name}" thành công!`);` |
| Soft Delete | Error | `const msg = err?.response?.data?.message \|\| 'Có lỗi xảy ra khi xóa chi nhánh'; toast.error(msg);` | `const apiMessage = err?.response?.data?.message; toast.error(apiMessage \|\| 'Có lỗi xảy ra khi xóa chi nhánh');` |

---

## 6. Critical E2E Test Compatibility Requirements

Spec: `frontend/e2e/10-hubs-management.spec.ts`

### Essential Selectors & Locators:
1. `h2:has-text("Quản Lý Chi Nhánh Kho")` -> Must be rendered in the header.
2. `page.locator('text=Andromeda Hub')` -> Hub names must be rendered as text in the table.
3. `#hub-search-input` -> Search input MUST have this exact ID and filter table rows dynamically.
4. `#btn-add-hub` -> Button to open modal MUST have this exact ID.
5. `#hub-form-dialog` -> Dialog content MUST have this exact ID.
6. `#input-hub-code` -> Mã chi nhánh input ID.
7. `#input-hub-city` -> Tỉnh / thành phố input ID.
8. `#input-hub-name` -> Tên chi nhánh input ID.
9. `#input-hub-address` -> Địa chỉ chi tiết input ID.
10. `#input-hub-manager` -> Người quản lý input ID.
11. `#input-hub-phone` -> Số điện thoại input ID.
12. `button[type="submit"]:has-text("Thêm Chi Nhánh")` -> Submit button locator.
13. `[data-testid="hub-row-${hub.id}"]` -> Table row test ID.
14. `[data-testid="btn-edit-hub-${hub.id}"]` -> Edit button test ID.
15. `[data-testid="btn-delete-hub-${hub.id}"]` -> Delete button test ID.

---

## 7. Recommended File Architecture for Implementation

```
frontend/src/
├── app/dashboard/admin/hubs/
│   └── page.tsx                         # Server Component: searchParamsCache.parse, PageContainer, HubsListingPage
└── features/hubs/
    ├── api.ts                           # API client functions & TypeScript interfaces
    ├── api/
    │   ├── queries.ts                   # TanStack Query options (hubKeys, hubsQueryOptions, hubsMetricsQueryOptions)
    │   └── mutations.ts                 # TanStack Query mutation options (createHubMutation, updateHubMutation, toggleActiveMutation, deleteHubMutation)
    └── components/
        ├── hubs-listing.tsx             # Server Component prefetching queries + HydrationBoundary
        ├── hub-modal.tsx                # Add/Edit Hub modal dialog with validation & E2E IDs
        ├── hub-delete-dialog.tsx        # Soft delete warning alert modal
        └── hubs-tables/
            ├── index.tsx                # Client Component: useDataTable, KPI summary cards, DataTable, DataTableToolbar
            ├── columns.tsx              # ColumnDef<Hub>[] with DataTableColumnHeader, icons, badges
            ├── cell-action.tsx          # Row actions: toggle active, edit modal trigger, delete dialog trigger
            └── use-hubs-table-filters.tsx # nuqs search params state hook
```
