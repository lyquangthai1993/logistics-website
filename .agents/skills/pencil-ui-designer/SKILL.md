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

### 1. Color System (Tailwind Color Palette)
- **Backgrounds**: `slate-950` (`#020617`), `slate-900` (`#0f172a`), `slate-900/60` (`#0f172b99` glassmorphic cards).
- **Accents & Highlights**: `sky-400` / `cyan-400` (`#38bdf8` / `#53eafd`), `indigo-500` (`#6366f1`), `blue-600` (`#2563eb`).
- **Status Colors**: `emerald-400` (`#34d399` Success / Active), `amber-400` (`#fbbf24` Warning / Pending), `rose-400` (`#f87171` Danger / Error).
- **Text & Borders**: `slate-50` (`#f8fafc` primary text), `slate-300`/`slate-400` (`#cbd5e1`/`#94a3b8` secondary text), `slate-800`/`slate-700` (`#1e293b`/`#334155` borders).

### 2. Spacing & Radius Scale (4px Base Grid)
- **Padding & Margins**: Strictly use Tailwind scale steps:
  - `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px).
- **Corner Radius**: Map directly to Tailwind radius tokens:
  - `rounded-sm` (2px), `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full` (9999px).

### 3. Layout Alignment & Flexbox Mapping
- Map Pencil node layout properties directly to Tailwind Flexbox utility classes:
  - `layout: "vertical"` ➔ `flex flex-col`
  - `layout: "horizontal"` ➔ `flex flex-row`
  - `alignItems: "center"` ➔ `items-center`
  - `justifyContent: "space_between"` ➔ `justify-between`
  - `gap: 8` ➔ `gap-2` | `gap: 16` ➔ `gap-4` | `gap: 24` ➔ `gap-6`

### 4. Code Generation & HTML/JSX Exports
- When converting Pencil frames to code or exporting assets, generate modern Next.js 15 / React 19 JSX code using standard Tailwind CSS classes (`className="..."`).
- Reuse [`shadcn-ui-patterns`](file:///d:/Projects/logistics-website/.agents/skills/shadcn-ui-patterns/SKILL.md) component wrappers (`Button`, `Badge`, `Card`, `Table`, `Input`, `Dialog`).

---

## 🛡️ Anti-Patterns & Safety Rules
- ❌ **NO Percentage Sizing**: Never use `"100%"`, `"50%"`, `"vh"`, `"calc()"` in `.pen` nodes.
- ❌ **NO Direct File Edits**: `.pen` files are binary/encrypted. NEVER use `replace_file_content` or `write_to_file` directly on `.pen` files. ALWAYS use Pencil MCP tools.
- ❌ **NO Unchecked Layout Warnings**: Always resolve `fill_container` layout mismatch warnings immediately.
- ❌ **NO Missing Text Fill**: Text nodes without `fill` will be invisible. Always provide a color or variable reference (`fill: "$text-primary"`).
- ❌ **NO Non-Tailwind Arbitrary Spacing**: Avoid non-standard spacing values like `17px`, `23px` unless required by raw DOM conversion. Always snap manually created elements to the Tailwind 4px grid.

