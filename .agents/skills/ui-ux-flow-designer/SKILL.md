---
name: ui-ux-flow-designer
description: >-
  Specialized skill for analyzing user journeys, business workflow wireframing, page architecture,
  and UI/UX frontend design for the Logistics TMS application. Works in direct collaboration with
  /pencil-ui-designer for visual vector canvas prototyping via Pencil MCP.
  Use when designing frontend pages, layout wireframes, user flow diagrams, component hierarchies,
  or UI interactions for Next.js App Router & Tailwind CSS.
---

# UI/UX Flow & Frontend Design Skill

This skill provides a structured methodology for analyzing user roles, designing interactive business flows, and architecting modern frontend UI components for the Logistics TMS system. It collaborates closely with [`pencil-ui-designer`](file:///d:/Projects/logistics-website/.agents/skills/pencil-ui-designer/SKILL.md) to bridge operational logic with visual vector prototyping on Pencil MCP.

---

## 🤝 Pencil MCP & Vector Canvas Collaboration (with `pencil-ui-designer`)

> 💡 **Mandatory Co-Design Protocol**: `/ui-ux-flow-designer` and `/pencil-ui-designer` operate as a unified UI/UX tandem. Whenever UI wireframes, visual mockups, or screen redesigns are required, `/ui-ux-flow-designer` establishes the operational journey and structure, then collaborates directly with `/pencil-ui-designer` to draw, prototype, or import UI screens into [`pencil-workspace/pens/UI_UX.pen`](file:///d:/Projects/logistics-website/pencil-workspace/pens/UI_UX.pen) via Pencil MCP.

### Unified 3-Step UI/UX Delivery Pipeline:
1. **Step 1: Journey & Requirements Mapping (`ui-ux-flow-designer`)**:
   - Identify target roles (DISPATCHER, FLEET_MANAGER, WAREHOUSE_MANAGER, SUPER_ADMIN).
   - Define user goals, data fields, action triggers, and operational status transitions.
   - Select canonical layout archetype (TanStack Table, Multi-step Stepper, Sheet drawer, KPI Dashboard).
2. **Step 2: Vector Wireframing & Prototyping (`pencil-ui-designer` via Pencil MCP)**:
   - Call Pencil MCP tools (`get_app_state`, `execute`, `browser`, `get_style`) or author JSON directly inside `pencil-workspace/pens/`.
   - Layout screens on the 4px Tailwind grid using `FindEmptySpace({ width: 1440, height: 900, direction: "right" })`.
   - **Strict Theme Standard**: Primary operational theme is **Clean Light Theme** (`#F8FAFC` app bg, `#FFFFFF` cards, `#0F172A` text, `#2563EB` blue accent).
   - **Fatal Schema Rule**: Text nodes in `.pen` files MUST use `"content": "..."` (NEVER `"text"`). Using `"text"` causes silent render drops in Pencil.
   - **Scan 1:1 Reproduction**: When designing based on `docs_scan/*.JPG`, replicate exact header layout, hotlines, vehicle boxes, column order, total rows, and signature blocks.
   - Apply design variables (`$font-main`, `$primary`, `$bg-app`, `$text-primary`) and verify visual output with `TakeScreenshot()`.
3. **Step 3: Component Implementation (`ui-ux-flow-designer` + `nextjs-best-practices`)**:
   - Translate verified `.pen` canvas designs into Next.js 15 App Router JSX code.
   - Use standard Shadcn UI components, Tailwind CSS v4 classes, and TanStack Table patterns (`useDataTable`).
   - Implement loading guards, per-row async spinners, and Vietnamese Toast feedback.

---

## 🏷️ Mandatory Operational Terminology & Zero Document Jargon Rule (STRICT)

> ⚠️ **Zero Document Jargon Mandate**: When designing UI screens, wireframes, and component mockups, designers and agents MUST strictly eliminate internal technical/document jargon and developer prompt notes from all user-facing labels. All UI copy MUST use natural, professional Vietnamese logistics warehouse operational terminology (`thuật ngữ vận hành kho bãi thực tế`).

### 1. Prohibited Internal Spec Jargon vs. Real Operational Equivalents:
| ❌ Prohibited Technical/Doc Jargon | ✅ Required Operational Terminology | Operational Context |
|---|---|---|
| `Quy chuẩn kiện vận tải (No-SKU)` / `No-SKU` | `Kiện hàng vận tải` / `Danh sách kiện hàng` / `Thông tin hàng hóa` | Cargo item table & consignment headers |
| `(First-mile Inbound)` | `Xe nhập kho` / `Chặng 1: Nhập kho` | First-mile leg in Timeline Stepper |
| `(Middle-mile Transfer)` | `Trung chuyển liên Hub` / `Chặng 2: Trung chuyển` | Linehaul / Middle-mile transfer leg |
| `(Last-mile Outbound)` | `Xe xuất kho` / `Chặng 3: Xuất kho` | Last-mile delivery leg |
| `Đang xuất nhỏ giọt` | `Đang xuất từng phần` | Partial outbound stock status |
| `Consignment Level` | `Theo lô hàng` / `Theo đơn vận chuyển` | Aggregated waybill level |
| `(TASK-ORD-...)` / Code IDs | Omit entirely from UI copy | Developer tracking references |

### 2. Strict Separation: Create View vs. Detail/Inspection View:
- **Create View** (`/warehouse/inbound` create mode): Renders creation mode switch tabs (`Mới hoàn toàn` vs `Luân chuyển nội bộ`), receipt inputs (license plate, driver, date), editable grid (`WarehouseEditableGrid`), Excel paste, and `+ Thêm dòng` buttons.
- **Detail View** (`WarehouseWaybillDetailModal`, slide-over viewers): Is an **audit and tracking inspection window**. NEVER render creation tabs, receipt form inputs, or editable grids. Must only present clean, read-only static tables, dynamic inventory summary cards (`Tổng nhập`, `Đã xuất`, `Tồn khả dụng`), and the 3-leg progress timeline.

---

## 📐 Content-Driven Modal & Drawer Width Reasoning Framework (Quy Chuẩn Suy Luận Độ Rộng Modal / Drawer Theo Nội Dung)

> ⚠️ **Triệt Tiêu Sai Lầm Cũ (CRITICAL RULE)**: Trước đây các agent thường nhầm lẫn giữa **Compact Density** (mật độ tinh gọn bên trong: `p-2`, `gap-2`, font `text-[10px]`) với **Modal Width** (chiều rộng khung ngoài), dẫn tới việc ép các Modal chứa Bảng dữ liệu hoặc Form phức tạp vào kích thước nhỏ hẹp (`max-w-sm`, `max-w-md`, 400px - 500px). Điều này làm **bóp nghẹt dữ liệu (squished)**, cắt cụt chữ, gây tràn ngang và làm hỏng trải nghiệm người dùng!
>
> 💡 **Nguyên Tắc Bất Biến**: **"NỘI DUNG QUYẾT ĐỊNH ĐỘ RỘNG — PADDING QUYẾT ĐỊNH MẬT ĐỘ"**.
> Độ rộng Modal (Width) BẮT BUỘC phải được suy luận logic dựa trên khối lượng thông tin và số lượng cột dữ liệu hiển thị.

### 1. Ma Trận Phân Cấp 5 Cấp Độ Độ Rộng Modal (5-Level Width Hierarchy):

| Cấp độ | Tên gọi chuẩn | Độ rộng Tailwind | Độ rộng Pencil (.pen) | Đặc tính nội dung UI (Content Characteristics) | Ví dụ màn hình thực tế |
|---|---|---|---|---|---|
| **Level 1** | **Compact / Alert** (Hẹp) | `sm:max-w-md` (~448px) | `420px - 480px` | - Hộp thoại xác nhận hành động (Xóa xe, hủy đơn, đăng xuất).<br>- Chỉ có 1-3 dòng text thông báo + 2 nút (Hủy, Xác nhận).<br>- **Tuyệt đối không có bảng dữ liệu hay form dài**. | `DeleteConfirmDialog`, `AlertModal`, `OrderDeleteDialog` |
| **Level 2** | **Standard Form** (Vừa) | `sm:max-w-xl` đến `sm:max-w-2xl` (~576px - 672px) | `560px - 660px` | - Biểu mẫu nhập liệu **1 cột** tuần tự (3 đến 6 fields).<br>- Ô nhập text/select cần không gian thoáng nhưng không quá dài.<br>- Đổi mật khẩu, tạo nhanh tài xế, nhập lý do từ chối. | `DriverFormDialog`, `UserFormDialog`, `NoVehicleDialog` |
| **Level 3** | **Large Form** (Rộng) | `sm:max-w-3xl` đến `sm:max-w-4xl` (~768px - 896px) | `800px - 920px` | - Biểu mẫu **2 cột song song** (8 đến 15 fields).<br>- Form chia nhánh: Phân công xe + tài xế + chia chuyến (Split).<br>- Cấu hình nâng cao trạm Hub kèm bản đồ/tọa độ, bảng tổng hợp phụ phí. | `AssignVehicleDialog`, `OrderEditDialog`, `OrderCreateDialog` |
| **Level 4** | **Tabular & Inspection** (Rất Rộng) | `w-[92vw] sm:max-w-5xl xl:max-w-6xl` (~1024px - 1152px) | `1100px - 1280px` | - **BẮT BUỘC khi chứa Bảng dữ liệu (`<table>`) từ 5 cột trở lên**.<br>- Bảng kê hàng hóa, kiểm đếm kiện hàng, danh sách đơn lưu kho.<br>- Master-Detail kết hợp Timeline Stepper 3 chặng + Thẻ kho + Bảng chi tiết kiện hàng. | `WarehouseSelectStoredOrdersModal`, `WarehouseTallyModal`, `WarehouseLookupModal`, `WarehouseWaybillDetailModal` |
| **Level 5** | **Super Wide / Fluid** (Cực Rộng) | `w-[96vw] max-w-7xl` hoặc `max-w-[1440px]` (~1280px - 1440px) | `1360px - 1440px` | - Bảng đối soát nhiều cột (>= 8-10 cột) hoặc nhiều sub-table lồng ghép.<br>- **Xem trước bản in A4 Landscape** (Phiếu nhập kho, Phiếu xuất kho).<br>- Giao diện Import file Excel của khách hàng: preview lưới dữ liệu thô và mapping cột. | `WarehouseTripDetailModal`, `WarehouseExcelImportModal`, `WarehouseOutboundReceiptModal` (Landscape), `PalletLabelA4Modal` |

### 2. Quy Trình Suy Luận Tự Động (Autonomous Width Deduction Flowchart):

Trước khi vẽ Frame Modal trên Pencil MCP hoặc viết component Dialog trong code Next.js, agent bắt buộc phải trả lời 4 câu hỏi suy luận sau:

```text
                             [BẮT ĐẦU THIẾT KẾ MODAL]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
      Có chứa Bảng dữ liệu (Table)?              Không có Bảng dữ liệu
                   │                                           │
         ┌─────────┴─────────┐                       ┌─────────┴─────────┐
         ▼                   ▼                       ▼                   ▼
  Table >= 5 cột      Table Excel / A4        Chỉ có Form nhập     Chỉ có Alert / Confirm
         │             hoặc >= 8 cột                 │                   │
         │                   │             ┌─────────┴─────────┐         ▼
         │                   │             ▼                   ▼      LEVEL 1
         │                   │         Form 2 cột         Form 1 cột  (sm:max-w-md
         │                   │       (>= 8 fields)       (3-6 fields)  420-480px)
         │                   │             │                   │
         ▼                   ▼             ▼                   ▼
      LEVEL 4             LEVEL 5       LEVEL 3             LEVEL 2
 (sm:max-w-5xl/6xl)     (max-w-7xl/     (sm:max-w-3xl/4xl)  (sm:max-w-xl/2xl
  1100px - 1280px        w-[96vw])       800px - 920px)      560px - 660px)
                      1360px - 1440px
```

### 3. Quy Tắc Kỹ Thuật Khi Triển Khai (Tailwind & Pencil Code Rules):

1. **Quy tắc độ rộng cho Bảng dữ liệu (Table Column Protection Rule)**:
   - Nghiêm cấm tuyệt đối nhét bảng từ 5 cột trở lên vào modal `max-w-md`, `max-w-lg` hoặc `max-w-xl`.
   - Mỗi cột dữ liệu số liệu (Kiện, Kg, m³) cần tối thiểu 60-80px; cột mã đơn cần 110px; cột tên hàng hóa cần 180-220px; cột địa chỉ cần 200-260px. Một bảng 7 cột cần tối thiểu `900px` chiều rộng nội dung hữu ích.
2. **Quy tắc Form 2 cột (Split Form Rule)**:
   - Form 2 cột cần tối thiểu 360px cho mỗi cột để các ô Select, DatePicker và Input hiển thị rõ ràng cả Label lẫn placeholder mà không bị co kéo. Do đó tổng chiều rộng modal tối thiểu là `sm:max-w-3xl` (768px).
3. **Cú pháp Tailwind chuẩn trong React/Next.js**:
   - Để tránh xung đột với class mặc định và đảm bảo hiển thị đúng trên mọi thiết bị:
     ```tsx
     // ✅ Đúng cho Modal Bảng dữ liệu Level 4:
     <DialogContent className="w-[95vw] sm:max-w-5xl xl:max-w-6xl max-h-[90vh] p-2 flex flex-col gap-2">
     
     // ✅ Đúng cho Modal Chi tiết chuyến / Bản in A4 Level 5:
     <DialogContent className="w-[96vw] max-w-7xl max-h-[92vh] p-0 flex flex-col overflow-hidden">
     
     // ✅ Đúng cho Form 2 cột Level 3:
     <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] p-3 overflow-y-auto">
     
     // ✅ Đúng cho Alert Confirm Level 1:
     <DialogContent className="sm:max-w-md p-4">
     ```
4. **Quy chuẩn kích thước trên Pencil Canvas (`.pen`)**:
   - Khi tạo Frame Modal trên canvas Pencil:
     - Level 4 (Table Modal): Đặt thuộc tính `width: 1120`, `height: 720`.
     - Level 5 (Super Wide): Đặt thuộc tính `width: 1380`, `height: 840`.
     - Level 3 (2-Col Form): Đặt thuộc tính `width: 860`, `height: 640`.
     - Level 2 (1-Col Form): Đặt thuộc tính `width: 600`, `height: 520`.
     - Level 1 (Confirm): Đặt thuộc tính `width: 440`, `height: 240`.

---

## 🎯 Target Roles & Operational Journeys (Spider Express)

1. **DISPATCHER (Operational Coordinator)**:
   - **Main Flow**: Intake cargo orders (`NDA2608-xxxx`) -> Classify regional route (North/Central/South) -> Group orders into Trips -> Assign Inbound Hubs.
   - **Key Views**: Order Intake Table, Route Grouping Workspace, Trip Assembly Modal.

2. **FLEET_MANAGER (Fleet & Vehicle Manager)**:
   - **Main Flow**: Manage fleet vehicles (`75H05121`, `43H21248`...) -> Approve/confirm trips -> Monitor actual payload weight ($Kg$) & volume ($m^3$) vs max vehicle capacity -> Calculate trip freight costs.
   - **Key Views**: Fleet Dashboard, Trip Payload Gauge Bar, Vehicle Capacity Monitor.

3. **WAREHOUSE_MANAGER (Hub Supervisor)**:
   - **Main Flow**: Monitor inbound schedule board -> Scan/confirm inbound cargo at hubs (`Andromeda`, `Hubble`, `Magellan`, `Vela`) -> Inspect item integrity -> Dispatch outbound long-haul shipments.
   - **Key Views**: Inbound Receiving Board, Barcode/Order Checker, Outbound Dispatch Station.

4. **SUPER_ADMIN (System Administrator)**:
   - **Main Flow**: Manage Users, Hubs (CRUD & Soft Delete), Fleet master data, Pricing & Surcharge matrix.
   - **Key Views**: System Admin Panel, User Role Matrix, Hubs Management Table.

---

## 📊 Standard Data Table & Pagination Architecture (Canonical Benchmark)

> 🌟 **Canonical Benchmark**: All data listing tables in the system MUST align with the architecture implemented at [`/dashboard/product`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/product/page.tsx) and [`ProductTable`](file:///d:/Projects/logistics-website/frontend/src/features/products/components/product-tables/index.tsx).

### 🧩 Canonical Element & Form Blueprints (hidden from Sidebar, preserved for reference)

When architecting or building new pages, forms, or UI layouts, agents and `/ui-ux-flow-designer` MUST strictly follow the design standards and component structures established in these reference page routes:

1. **Data Table Benchmark**: [`/dashboard/product`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/product/page.tsx) — TanStack Table v8, sticky headers, column pinning, shallow routing & URL synced search/pagination.
2. **Basic Form Standard**: [`/dashboard/forms/basic`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/forms/basic/page.tsx) — Standard form layout with React Hook Form, Zod schema validation, and inline field error states.
3. **Multi-Step Form Wizard**: [`/dashboard/forms/multi-step`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/forms/multi-step/page.tsx) — Multi-stage stepper flow for complex data entry (order dispatch setup, driver onboarding).
4. **Sheet & Dialog Forms**: [`/dashboard/forms/sheet-form`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/forms/sheet-form/page.tsx) — Contextual slide-over Sheet drawers and Modal Dialogs for fast inspection/editing.
5. **Advanced Patterns**: [`/dashboard/forms/advanced`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/forms/advanced/page.tsx) — Dynamic field arrays, multi-select dropdowns, and complex form controls.
6. **React Query Patterns**: [`/dashboard/react-query`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/react-query/page.tsx) — Async data fetching, skeleton loaders, mutation handlers, and refetching.
7. **System Icon Gallery**: [`/dashboard/elements/icons`](file:///d:/Projects/logistics-website/frontend/src/app/dashboard/elements/icons/page.tsx) — Authoritative Lucide / system icon set reference.

### 1. Architectural Stack & Shared Components
- **Core Library**: TanStack React Table (`@tanstack/react-table` v8)
- **URL Search Params Synchronization**: `nuqs` (`useQueryStates`, `parseAsInteger`, `parseAsString`, `getSortingStateParser`)
- **Shared UI Components** (located in `src/components/ui/table/`):
  - `DataTable`: Shared container with Sticky Header, Column Pinning, and integrated Pagination (`src/components/ui/table/data-table.tsx`)
  - `DataTablePagination`: Standardized pagination bar with page size dropdown (`[10, 20, 30, 40, 50]`), total row counts, and First/Prev/Next/Last page navigation (`src/components/ui/table/data-table-pagination.tsx`)
  - `DataTableToolbar`: Search inputs, faceted filters, and column view options (`src/components/ui/table/data-table-toolbar.tsx`)
  - `DataTableColumnHeader`: Sortable header with ascending/descending/hide toggles (`src/components/ui/table/data-table-column-header.tsx`)
  - `useDataTable`: Custom hook encapsulating table state, debounced search, shallow routing, and column pinning (`src/hooks/use-data-table.ts`)

### 2. Standard Implementation Pattern
```tsx
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function FeatureTable({ data, totalCount, columns }: FeatureTableProps) {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
  });

  const pageCount = Math.ceil(totalCount / params.perPage);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
```

---

## 🎨 UI/UX Design Principles & Guidelines

1. **Function-Driven Dashboard & Workspace**:
   - High information density with clean, modern data tables (Sort, Filter, Pagination).
   - Real-time status indicators (Badges with semantic colors: `PENDING`, `IN_TRANSIT`, `RECEIVED`, `COMPLETED`, `CANCELLED`).
2. **Visual Capacity Indicators**:
   - Interactive progress bars showing payload utilization (e.g. `85% Weight (Kg)`, `60% Volume (m³)`).
3. **Frictionless Action Flows**:
   - Quick filters for dates, hubs, and routes.
   - Modals and slide-over drawers for rapid order inspection without losing page context.
4. **Responsive & Fluid Layout**:
   - Optimized for desktop operational displays (1920x1080 / 1440x900) while supporting tablet field inspections.
5. **Interactive Element Cursor & Hover Guidelines**:
   - **Universal Pointer Rule**: EVERY interactive/clickable element (`<button>`, `[role="button"]`, `DropdownMenuTrigger`, `SelectTrigger`, `AccordionTrigger`, clickable table rows/cards, badges, tabs, pagination links, switches, checkboxes, dialog triggers/closes) MUST display `cursor: pointer` (`cursor-pointer`) on hover.
   - **Disabled State Rule**: Disabled elements (`disabled`, `aria-disabled="true"`, `data-disabled`) MUST display `cursor: not-allowed` and visual muted opacity.
   - **Hover & Focus Feedback**: All clickable elements MUST provide crisp hover feedback (`hover:bg-accent/80`, `hover:text-primary`, `transition-all duration-150`) and accessible focus rings (`focus-visible:ring-2 focus-visible:ring-primary/50`).
   - **Click Target Area**: Ensure minimum interactive target size (at least 32px / `h-8` for action buttons & icons).

---

## 🏗️ Next.js App Router Page Architecture

```text
frontend/src/app/
├── (auth)/
│   └── auth/sign-in/page.tsx        # System Authentication
├── (dashboard)/
│   ├── layout.tsx                   # Sidebar navigation, Header, User Profile
│   ├── overview/page.tsx            # Executive KPI Overview
│   ├── product/                     # Standard Reference Implementation (TanStack DataTable)
│   ├── orders/                      # Order Management (DISPATCHER & ALL)
│   │   ├── page.tsx                 # Order collection & dispatch intake
│   │   └── [id]/page.tsx            # Order detail & lifecycle timeline
│   ├── trips/                       # Trip & Dispatch Operations (FLEET_MANAGER)
│   │   └── page.tsx                 # Trip collection & vehicle payload manager
│   ├── fleet/                       # Vehicles & Drivers Management (FLEET_MANAGER)
│   │   └── page.tsx                 # Fleet directory with Hub relational badge
│   ├── warehouse/                   # Hub Inbound/Outbound Board (WAREHOUSE_MANAGER)
│   │   └── page.tsx                 # Inbound receiving & schedule monitor
│   └── admin/                       # System Administration (SUPER_ADMIN)
│       ├── users/page.tsx           # User accounts & roles
│       └── hubs/page.tsx            # Branch Warehouses (Hubs) CRUD & Soft-Delete
```

---

## ⚡ Async Action — Loading State & Double-Click Guard

### Pattern: Per-Row Loading State (using `Set<number>`)

Use `Set<number>` for multi-row data tables to avoid disabling unrelated rows:

```tsx
const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());

const handleAction = async (id: number) => {
  if (submittingIds.has(id)) return; // Guard double-click
  setSubmittingIds((prev) => new Set(prev).add(id));
  try {
    await api.doSomething(id);
    toast.success('Thao tác thành công!');
    reload();
  } catch (err: any) {
    const apiMessage = err.response?.data?.message;
    toast.error(apiMessage || 'Thao tác thất bại. Vui lòng thử lại.');
  } finally {
    setSubmittingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
};
```

---

## 🔔 Toast Notification Standards (Vietnamese UI Copy for End Users)

1. **User Facing Language**: User-facing Toast messages in business domains MUST be in natural Vietnamese for local operators.
2. **API Error Precedence**:
```tsx
// ✅ Correct: Prioritize backend message
const apiMessage = err.response?.data?.message;
toast.error(apiMessage || 'Thao tác thất bại. Vui lòng thử lại.');
```

---

## 🎨 Button Microcopy & Zero Redundant Icons Standard

When designing or implementing interactive buttons, tabs, and badges:
1. **Strict Ban on Double Icons**: NEVER place both an Icon component (`<IconPlus />`, `<IconTruck />`, etc.) AND an emoji or symbol (`+`, `🚚`, `📦`, `🔄`, `🖨️`, `✕`, `🔍`, `✓`) inside the text label of the same button.
2. **Clean Component Composition**:
   - ✅ `<Button><IconPlus className="h-4 w-4 mr-1" /> Tạo đơn nhập mới</Button>` (Clean, modern)
   - ❌ `<Button><IconPlus className="h-4 w-4 mr-1" /> + Tạo đơn nhập mới</Button>` (Double `+` icon)
   - ✅ `<Button><IconTruck className="h-4 w-4 mr-1" /> Nhận luân chuyển nội bộ</Button>` (Clean)
   - ❌ `<Button><IconTruck className="h-4 w-4 mr-1" /> 🚚 Nhận luân chuyển nội bộ</Button>` (Double truck icon)
   - ✅ `<Button variant="outline"><IconRefresh className="h-4 w-4 mr-1" /> Cập nhật lại thông số</Button>`
   - ❌ `<Button variant="outline"><IconRefresh className="h-4 w-4 mr-1" /> 🔄 Cập nhật lại thông số</Button>`
3. **Modal Close / Back Buttons**:
   - ✅ `<Button variant="outline"><IconX className="h-4 w-4 mr-1" /> Quay lại danh sách</Button>`
   - ❌ `<Button variant="outline"><IconX className="h-4 w-4 mr-1" /> ✕ Quay lại danh sách</Button>`

