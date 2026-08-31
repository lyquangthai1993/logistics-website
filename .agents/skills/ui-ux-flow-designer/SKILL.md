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
   - Call Pencil MCP tools (`get_app_state`, `execute`, `browser`, `get_style`) inside `pencil-workspace/pens/`.
   - Layout screens on the 4px Tailwind grid using `FindEmptySpace({ width: 1440, height: 900, direction: "right" })`.
   - Apply design variables (`$font-main`, `$primary`, `$bg-app`, `$text-primary`) and verify visual output with `TakeScreenshot()`.
3. **Step 3: Component Implementation (`ui-ux-flow-designer` + `nextjs-best-practices`)**:
   - Translate verified `.pen` canvas designs into Next.js 15 App Router JSX code.
   - Use standard Shadcn UI components, Tailwind CSS v4 classes, and TanStack Table patterns (`useDataTable`).
   - Implement loading guards, per-row async spinners, and Vietnamese Toast feedback.

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
