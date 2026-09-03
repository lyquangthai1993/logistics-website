---
name: pencil-ui-designer
description: >-
  Dedicated agent and skill for full-lifecycle vector UI/UX design, screen creation from scratch,
  layout modifications, wireframing, component design kits, and converting existing Web UIs
  directly onto Pencil (.pen) canvas files via Pencil MCP tools.
  Manages pencil-workspace/UI_UX.pen, creates wireframes, dashboards, modals, and coordinates design tokens.
  Triggers on: "pencil", "pen", "tạo ui", "thiết kế ui", "vẽ ui mới", "sửa ui", "chỉnh sửa giao diện", "convert ui", "pencil-workspace", "ui_ux.pen", "design canvas".
---

# Pencil UI Designer Agent

This specialized skill and agent governs all **net-new UI/UX screen design**, **layout modifications & optimizations**, **interactive wireframing**, and **live web UI conversion** directly on `.pen` vector canvas files via **Pencil MCP**. It works in close tandem with [`ui-ux-flow-designer`](file:///d:/Projects/logistics-website/.agents/skills/ui-ux-flow-designer/SKILL.md) to transform operational user journeys and canonical page layouts into visual vector wireframes.

---

## 📁 Workspace Governance & Directory Rules (STRICT)

All Pencil design files and assets MUST be organized strictly inside the [`pencil-workspace/`](file:///d:/Projects/logistics-website/pencil-workspace) directory:

```text
pencil-workspace/
├── README.md               # Overview of canvas screens, component catalog, design tokens
├── assets/                 # Local images, SVG logos, textures, icons
├── pens/                   # Dedicated directory for all .pen vector canvas files
│   ├── UI_UX.pen           # Primary master canvas file (Infinite Canvas & Design System)
│   ├── SHADCN_UI.pen       # Shadcn UI Design Kit
│   ├── AUTH_FLOWS.pen      # Auth & password reset flows
│   └── DASHBOARDS.pen      # Role-based dashboard wireframes
├── scripts/                # Procedural generation scripts (clock.js, radar.js)
└── exports/                # Exported assets (PNG, SVG, PDF, HTML Tailwind)
```

> [!IMPORTANT]
> NEVER create loose `.pen` files in the repository root or pencil root. Always operate inside [`pencil-workspace/pens/`](file:///d:/Projects/logistics-website/pencil-workspace/pens) on master canvas [`pencil-workspace/pens/UI_UX.pen`](file:///d:/Projects/logistics-website/pencil-workspace/pens/UI_UX.pen) or dedicated `.pen` files.

---

## 🚀 Core Capabilities & Workflows

### 1. 🎨 Designing Brand-New UI Screens from Scratch
When asked to design a new feature, dashboard, table, or modal:
1. **Find Empty Canvas Space**: Use `FindEmptySpace({ width: 1440, height: 900, direction: "right", padding: 80 })` to ensure new screens are neatly aligned side-by-side without overlapping existing screens.
2. **Apply Design Tokens**: Inherit typography (`$font-main`), colors (`$primary`, `$text-primary`, `$bg-app`, `$border-subtle`), and spacing from `GetVariables()`.
3. **Construct Screen Hierarchy**:
   - Top-level Frame (e.g. `1440x900px`, `clip: true`, `placeholder: true`).
   - Sidebar Navigation / Header Topbar.
   - Main Content Area (Stat Cards, Filter Toolbar, Data Table / Form Layout).
4. **Follow TMS Canonical Benchmarks**:
   - For data tables: reference TanStack React Table benchmark (`DataTable`, `DataTableToolbar`, `DataTablePagination` with `[10, 20, 30, 40, 50]` rows).
   - For role status badges: use semantic colors (`DRAFT`, `PENDING_FLEET`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`).
5. **Finalize & Validate**: Clear `placeholder: false` and end with `TakeScreenshot([newScreenId])`.

---

### 2. 🔄 Converting Live Web UI to Editable Pencil Layers
When given a live URL (e.g. `http://localhost:3000/auth/sign-in`, `http://localhost:3000/dashboard/orders`):
1. **Load Page**: Call Pencil MCP `browser` tool with `action: "load-page"`, `url: "<URL>"`, `filePath: "D:/Projects/logistics-website/pencil-workspace/pens/UI_UX.pen"`.
2. **Import Layers**: Call Pencil MCP `browser` tool with `action: "import-to-canvas"`, `target: "full-page"` (or `"query"` for specific widgets).
3. **Clean Up & Polish**:
   - Remove next dev overlay badges / buttons.
   - Set meaningful node names with `Update(nodeId, { name: "..." })`.
   - Fix any `fill_container` warnings on parents with `layout: "none"` (replace with fixed pixel sizes).
4. **Validate**: End with `TakeScreenshot([importedFrameId])` to verify visual correctness.

---

### 3. 🧩 Reusable Component Library
- Create common reusable symbols (`reusable: true`) such as `Button`, `Input`, `Badge`, `MetricCard`, `TableHeaderCell`, `TableRow`.
- Instantiate them via `Insert(parent, { type: "ref", ref: componentId, descendants: { ... } })`.

---

## 🛠️ Pencil MCP Tool Reference

| Tool | Key Action / Parameter | Purpose |
|---|---|---|
| `get_app_state` | `{}` | Checks currently active `.pen` file in IDE, selected nodes, and loaded browser URL. |
| `browser` | `action: "load-page"` | Opens the integrated browser and navigates to target URL. |
| `browser` | `action: "import-to-canvas"` | Converts real DOM & computed CSS into editable vector canvas layers. |
| `browser` | `action: "return-screenshot"` | Takes a cheap screenshot of the live page for inspection. |
| `execute` | `input: "..."` | Executes JavaScript snippet (`Insert`, `Update`, `Copy`, `Replace`, `Delete`, `Get`, `FindEmptySpace`, `SetVariables`, `TakeScreenshot`, `Export`). |
| `get_style` | `name: "..."` | Loads pre-configured visual style archetypes. |

---

## 💾 Auto-Save & File Persistence Policy (STRICT)
- **Automatic Disk Sync**: Every time an edit, insertion, conversion, or layout modification is executed, the agent MUST ensure changes are committed directly to `pencil-workspace/pens/UI_UX.pen`.
- **Active Buffer Verification**: After all operations finish, verify the file timestamp and ensure all layers are flushed and saved without pending draft placeholders (`placeholder: false`).
- **Zero Loss Guarantee**: The user never needs to manually trigger save dialogs. The agent guarantees that `UI_UX.pen` on disk is 100% up-to-date and consistent with all actions taken.

---

## 🎨 Tailwind CSS Design System & Styling Rules

All UI/UX designs, component definitions, and code exports MUST follow the **Tailwind CSS v4** styling framework and standard design tokens:

### 1. Color System (Light Theme Priority for Spider Express TMS)
The primary operational theme for TMS dashboards, warehouse dispatch, and forms is **Clean Light Theme** (matching Shadcn UI & Vercel aesthetics):
- **App Background**: `#F8FAFC` (`slate-50`)
- **Card / Surface Background**: `#FFFFFF` (pure white)
- **Borders & Dividers**: `#E2E8F0` (`slate-200`) or `#CBD5E1` (`slate-300`). For physical document/scan print templates, use `#000000` borders.
- **Primary Text**: `#0F172A` / `#020618` (`slate-900`) - high contrast, crisp legibility.
- **Secondary / Muted Text**: `#64748B` (`slate-500`) / `#475569` (`slate-600`).
- **Brand / Primary Accent**: `#2563EB` (`blue-600`) / `#1D4ED8` (`blue-700`).
- **Status Colors**:
  - Success / Active / Confirmed: `#059669` (`emerald-600`) or `#10B981`
  - Pending / Warning / In-Transit: `#D97706` (`amber-600`) or `#F59E0B`
  - Error / Shortage / Cancelled: `#EF4444` (`red-500`) or `#DC2626`
- **Dark Theme (Alternative / Dark Mode Only)**:
  - When explicitly instructed to design dark mode: use `slate-950` (`#020617`), `slate-900` (`#0f172a`), with `text-primary: #f8fafc`.

### 2. Pencil JSON Schema Specifications (CRITICAL INVARIANTS)
When generating or modifying `.pen` canvas files directly:

1. **Text Nodes MUST use `"content"` (NEVER `"text"`)**:
   ```json
   {
     "type": "text",
     "id": "unique_id",
     "content": "Tiêu Đề Màn Hình",
     "fontFamily": "Inter",
     "fontSize": 14,
     "fontWeight": "bold",
     "fill": "#0F172A"
   }
   ```
   > 🚨 **FATAL ERROR TO AVOID**: Using `"text": "..."` instead of `"content": "..."` causes Pencil's canvas engine to discard the text string completely. The canvas will render completely empty, dark shapes with no readable labels or values!

2. **Icon Nodes MUST use Lucide Library**:
   ```json
   {
     "type": "icon",
     "id": "unique_ico_id",
     "width": 16,
     "height": 16,
     "icon": "warehouse",
     "library": "lucide",
     "fill": "#2563EB"
   }
   ```

3. **Frame & Flexbox Layout Mapping**:
   - Vertical container: `"layout": "vertical"`, `"gap": 8`, `"padding": 16`
   - Horizontal row: `"layout": "horizontal"` (or omitted when layout is default horizontal), `"alignItems": "center"`, `"justifyContent": "space_between"`
   - Full width child: `"width": "fill_container"`
   - Corner radius: `"cornerRadius": 8`
   - Border stroke: `"stroke": "#E2E8F0"`, `"strokeWidth": 1` (or directional: `"strokeWidth": { "bottom": 1 }`)

### 3. Scan Reference 1:1 Fidelity Rule (`docs_scan/`)
When designing screens based on scanned documents (e.g. `docs_scan/form_create_new_don.JPG`, `docs_scan/mau_phieu_nhap_kho.JPG`):
- **Exact Layout Reproduction**: Replicate the exact position of header titles, hotlines, vehicle summary boxes, column order, total/lũy kế rows, and signature boxes.
- **Strict NO-SKU Policy**: Never introduce SKU/Barcode columns unless explicitly requested in the scan or task. Cargo is managed at consignment level (Package count, Gross Weight kg, Volume CBM, General cargo description).
- **Exact Action Button Placement**: Place action buttons and toolbar controls according to the scanned workflow.

### 4. Mobile Responsiveness & Touch Target Invariants
- Minimum touch target height for buttons, tabs, and interactive controls: **44px to 50px**.
- Table handling on mobile viewports (< 640px): Render as **responsive Card lists** (`Cargo Item Cards`) with key badges, avoiding awkward horizontal full-page scrolling.
- Sticky action bars: Place primary confirmation buttons at the bottom of the mobile screen (`Sticky Bottom Bar`, height $\ge 48px$) for easy single-thumb reach.

---

## 🛡️ Anti-Patterns & Safety Rules
- ❌ **FATAL: NEVER use `"text"` property on text nodes**: ALWAYS use `"content": "..."`.
- ❌ **NO Empty Dark Blocks**: Never render pitch-black frames with invisible labels. Always apply high-contrast colors (`#0F172A` text on `#FFFFFF` / `#F8FAFC` surfaces).
- ❌ **NO Missing Text Fill**: Always supply an explicit `fill` hex color (e.g. `fill: "#0F172A"`).
- ❌ **NO Percentage Sizing**: Never use `"100%"`, `"50%"`, `"vh"`, `"calc()"` in `.pen` node dimensions. Use `"fill_container"` or explicit integer pixel values.
- ❌ **NO Arbitrary Sizing**: Snap layout dimensions, paddings, and gaps to the Tailwind 4px grid (4, 8, 12, 16, 20, 24, 32).

