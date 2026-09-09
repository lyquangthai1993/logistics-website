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

## GPT Model Routing (MANDATORY)

Use an OpenAI GPT model for every task governed by this skill. Do not route Pencil design work to Claude or Gemini unless the user explicitly requests that override.

| Work type | Model | Reasoning | Use for |
|---|---|---|---|
| Business and visual design | `gpt-5.6-sol` | `high` | TMS workflow analysis, RBAC-aware UX, screen architecture, wireframes, design-system decisions, Pencil MCP canvas operations, scan fidelity, and visual validation. |
| Ambiguous cross-role workflow | `gpt-5.6-sol` | `xhigh` | Status transitions, multi-role handoffs, notification-sensitive screens, or conflicting business requirements. Activate `leader` and inspect `rbac-matrix.md` before drawing. |
| Frontend implementation | `gpt-5.6-terra` | `high` | Translating an approved Pencil design into Next.js/React/Tailwind code or repairing implementation-heavy UI code. |

Default to `gpt-5.6-sol` with `high` reasoning for mixed Pencil requests because business correctness and visual judgment take precedence during design. Switch or delegate to `gpt-5.6-terra` only after the workflow, permissions, and visual contract are settled and source-code implementation becomes the dominant task.

When launching a dedicated `pencil-ui-designer` agent, explicitly pass `model: "gpt-5.6-sol"` and `reasoning_effort: "high"` with only the task-relevant context. Do not spawn an agent solely to change models when the active agent is already a suitable GPT model and can complete the work directly.

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

### 4. 🧭 Multi-Step Interactive Flow & Design Handoff Standards (Agent-Oriented Design Rules)
To ensure AI coding agents can unambiguously interpret and implement multi-step flows and card/modal archetypes without visual divergence:

1. **Explicit Node Archetype Prefixes**:
   - `[PAGE] <NodeId> - <Description>`: Top-level route / workspace page (e.g. `[PAGE] dd8X5 - Nhập kho luân chuyển`).
   - `[MODAL_STEP_1] <NodeId> - <Description>`: Step 1 dialog (e.g. `[MODAL_STEP_1] WH_CASE_02B_TRIP_MODAL - Chọn chuyến xe`).
   - `[MODAL_STEP_2] <NodeId> - <Description>`: Step 2 dialog (e.g. `[MODAL_STEP_2] WH_CASE_03_MODAL - Chọn đơn hàng từ chuyến`).
   - `[STATE_LOADED] <NodeId> - <Description>`: Page state populated with selected items.

2. **Container Layout Archetype Tags**:
   - `[LAYOUT: CARD_LIST]` (or `[CARD_TEMPLATE: <NAME>]`): Designates a list of distinct card items (`layout: vertical` container containing child card frames). Signals to coding agents to render a vertical `<Card>` list, NEVER a generic `<table>`.
   - `[LAYOUT: DATA_TABLE]`: Designates structured table grids with header rows and data cells.
   - `[LAYOUT: FORM_GRID]`: Designates multi-column input forms.
   - `[ACCENT: SELECTION_LEFT_BAR]`: Designates an active/selected card with a colored left accent border (`#2563EB`).

3. **2-Tier Card Hierarchy Layering**:
   - When designing card items (e.g., `trip_modal_dialog_card`), organize child frames into two explicit tiers:
     - `tier_1_header`: Row with Code, Route, and Status Badges.
     - `tier_2_details`: Sub-row with Operator details (Driver, Plate), Cargo Metrics (KG, CBM, Packages), and Action Button (`Chọn chuyến này ➔`).

4. **Trigger Action Naming on Buttons**:
   - Name interactive button layers with clear transition targets:
     - `[TRIGGER: OPEN_MODAL -> WH_CASE_02B_TRIP_MODAL]`
     - `[TRIGGER: NEXT_STEP -> WH_CASE_03_MODAL]`
     - `[TRIGGER: CONFIRM_INTO_GRID -> dd8X5]`

5. **Unified Stepper Progression**:
   - Every frame in a multi-step workflow MUST contain a shared Stepper component indicating the active step (`1. Chọn chuyến ➔ 2. Chọn đơn ➔ 3. Xác nhận lên lưới`), signaling to coding agents that this is a cohesive State Machine (`step = 1 | 2 | 3`).

6. **Automated Visual Verification Loop**:
   - Every `.pen` design is cross-checked against live Next.js UI using [`visual-pen-matcher`](file:///d:/Projects/logistics-website/.agents/skills/visual-pen-matcher/SKILL.md) (Sub-Agent F) in Playwright E2E suites.


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
### 4. Mobile Responsiveness & Touch Target Invariants
- Minimum touch target height for buttons, tabs, and interactive controls: **44px to 50px**.
- Table handling on mobile viewports (< 640px): Render as **responsive Card lists** (`Cargo Item Cards`) with key badges, avoiding awkward horizontal full-page scrolling.
- Sticky action bars: Place primary confirmation buttons at the bottom of the mobile screen (`Sticky Bottom Bar`, height $\ge 48px$) for easy single-thumb reach.

### 5. Professional Product Microcopy & Operator Mindset (CRITICAL)
Always adopt the dual mindset of a **Senior Software Product Designer** and an **Operational Warehouse/Dispatch Practitioner**. Eliminate meta-descriptions, prompt mirroring, and tutorial-style prose from all UI components:

1. **Strictly Ban Prompt-Mirroring & Meta Prose on UI**:
   - ❌ **NEVER** copy user prompt descriptions, technical implementation notes, or agent thoughts directly into UI subtitles, badges, or labels.
   - *Bad Examples (Meta / Verbose / Prompt Copy to Avoid)*:
     - Subtitle: `"Table dạng nhập kho · Click icon kính lúp tại Mã đơn hàng để mở Modal tra cứu kho và đưa vào dòng."` ❌
     - Modal Title: `"TRA CỨU HÀNG TRONG KHO · CHỌN ĐƠN VÀO DÒNG 03"` ❌ (Prompt narrative in title)
     - Column Header: `"MÃ ĐƠN HÀNG (TRA CỨU KHO) *"` ❌ (Tutorial in parentheses)
     - Button: `"✅ Xác nhận nạp vào Dòng 03 ➔"` ❌ (Wireframe target annotation)
     - Badge: `"Màn hình laptop 1440px · Cuộn ngang"` ❌
     - Topbar Node: `lm_topbar_right: "TRA CỨU HÀNG TRONG KHO"` ❌ (Duplicate screen title on topbar right)
   - *Good Examples (Concise, Clean, Professional Production Copy)*:
     - Subtitle: `"Ghi nhận hàng rời kho Andromeda Hub và bàn giao cho khách hàng."` ✅
     - Modal Title: `"Chọn đơn hàng từ kho"` ✅
     - Column Header: `"MÃ ĐƠN HÀNG *"` ✅ (Cell contains search trigger `[ 🔍 Bấm tìm đơn... ]`)
     - Button: `"Xác nhận chọn đơn ➔"` ✅
     - Badge: `"Đã chọn 2 / 48 đơn"` ✅
     - Row Placeholder: `"—"` ✅
     - Search Input: `"Tìm mã vận đơn, tên hàng..."` ✅

2. **Context-Aware Information Hierarchy (No Blind Copying from Scans/Excel)**:
   - Understand the distinct business context of each screen (Inbound vs. Outbound vs. Audit).
   - ❌ **NEVER** blindly copy headers, cards, or titles from scanned documents into screens where they do not belong.
     - *Concrete Lesson*: Do NOT copy the `"KẾ HOẠCH ĐÓNG HÀNG / HOTLINE ĐIỀU HÀNH 3 MIỀN"` card from an outbound line-haul spreadsheet into an Inbound receiving screen (`Tạo đơn nhập kho`).
   - Strip out office-only dispatching clutter (`Điều hành`, `Khách hàng` in item rows, `Ngày cần bốc`, `Ngày cần giao`, `Đã soạn`) from physical warehouse operational grids. Keep tables focused on physical cargo metrics (`Mã đơn`, `Tên hàng`, `Số kiện`, `KG`, `M³`, `Điểm giao`, `Ghi chú`).

3. **High Data-to-Ink Ratio & Visual Affordance**:
   - Let icons and UI affordances speak rather than explanatory paragraphs:
     - A search icon `🔍` in an input indicates searchable lookup; do not add a text paragraph explaining "Click here to search".
     - Color-coded badges (`🟡 LƯU KHO`, `⚫ DRAFT`, `🟢 ĐÃ XUẤT KHO`) convey status instantly; do not write verbose explanations of status logic.
   - Every text node must be concise, crisp, action-oriented, and respect real warehouse operator workflow speed (operators scan screens in 1-2 seconds; verbose copy slows them down and creates visual noise).

4. **Topbar Architecture & Global Header Invariants (Zero Redundant Labels)**:
   - ❌ **NEVER** inject screen title text banners or state labels on the right side of Topbars (e.g. `lm_topbar_right: "TRA CỨU HÀNG TRONG KHO"`, `"PHIẾU XUẤT KHO MỚI · KHÁCH HÀNG"`, `"BƯỚC 2: CHỌN HÀNG TRONG KHO..."`).
   - *Why this is an AI Anti-Pattern*: AI agents suffer from "Diagram Labeling Syndrome" — treating screens like presentation slides where every corner must have a label to prove to the reviewer what the agent just built. In production web apps, screen identity is already conveyed by the Breadcrumb and Page Title. Putting duplicate capitalized titles on the topbar right creates clutter and screams amateur wireframing.
   - *Production Topbar Standard*:
     - **Left**: Clean Breadcrumb (e.g. `Kho  /  Xuất kho  /  Tạo phiếu xuất`) or Back button (`← Danh sách xuất kho`).
     - **Right**: Reserved strictly for global system utilities (Global Search, Notification bell, User Profile / Hub Identity) or left completely empty and clean.
     - **Modal Dialogs**: Modals sit on top of a backdrop; the underlying topbar must NEVER carry the modal's title.

5. **Zero Redundant Icons & Clean Button Microcopy Standard (Strict Anti-Duplication Rule)**:
   - ❌ **NEVER** combine a vector icon element (`type: "icon"`) with a duplicate emoji or symbol (`+`, `🚚`, `📦`, `🔄`, `🖨️`, `✕`, `🔍`, `✓`) inside the adjacent text label.
   - *Why this is an AI Anti-Pattern*: An AI agent often adds both a Lucide icon node (e.g. `package-plus`) AND writes `"+ Tạo đơn nhập mới"` or `icon: "truck"` AND `"🚚 Nhận luân chuyển"`. This results in clumsy double-icons `[ 📦 + Tạo đơn... ]` or `[ 🚚 🚚 Nhận... ]` that look amateurish.
   - *Clean Production Rules*:
     - If button has an Icon node: The text node MUST contain clean text ONLY without symbols/emojis (e.g. `icon: "package-plus"`, `content: "Tạo đơn nhập mới"`).
     - If button is text-only: Clean action verb (e.g. `content: "Tạo đơn nhập mới"` or `content: "+ Thêm"` only if no vector icon exists).
     - Table / Toolbar Action Buttons:
       - Refresh: `icon: "refresh-cw"` + `content: "Cập nhật lại thông số"` (NEVER `content: "🔄 Cập nhật..."`).
       - Print: `icon: "printer"` + `content: "In tem A4"` (NEVER `content: "🖨️ In tem..."`).
       - Close / Back: `icon: "x"` + `content: "Quay lại danh sách"` (NEVER `content: "✕ Quay lại..."`).
       - Add Row: `icon: "plus"` + `content: "Thêm dòng hàng mới"` (NEVER `content: "+ Thêm dòng..."`).

---

## 🛡️ Anti-Patterns & Safety Rules
- ❌ **FATAL: NEVER use `"text"` property on text nodes**: ALWAYS use `"content": "..."`.
- ❌ **NO Redundant / Double Icons on Buttons**: NEVER combine an icon node with an emoji or symbol (e.g., `+`, `🚚`, `📦`, `🔄`, `🖨️`, `✕`) inside the text label. Use EITHER an icon node OR clean text.
- ❌ **NO Meta/Prompt-Mirroring Copy**: NEVER dump prompt instructions, user requirements, or UI architectural notes into visible UI text, subtitles, or badges.
- ❌ **NO Topbar Right Screen Labels (`_topbar_right`)**: NEVER print duplicate screen titles, step names, or mode banners on the top-right of Topbars.
- ❌ **NO Blind Scan/Excel Cloning**: NEVER paste irrelevant headers, title cards (e.g. "Kế hoạch đóng hàng" in an Inbound screen), or office dispatch fields into warehouse operational tables without domain validation.
- ❌ **NO Warehouse Location / Bin Columns**: NEVER add "Vị trí kho" or bin/rack/shelf columns (e.g. Khu A, Kệ B). Warehouse items are tracked strictly by Hub scope and status (`LƯU KHO`, `DRAFT`), not internal slotting locations.
- ❌ **NO Verbose Instruction Prose**: Avoid tutorial paragraphs on operational screens. Use standard UI affordances, clear icons, concise placeholders, and quantitative badges instead.
- ❌ **NO Empty Dark Blocks**: Never render pitch-black frames with invisible labels. Always apply high-contrast colors (`#0F172A` text on `#FFFFFF` / `#F8FAFC` surfaces).
- ❌ **NO Missing Text Fill**: Always supply an explicit `fill` hex color (e.g. `fill: "#0F172A"`).
- ❌ **NO Percentage Sizing**: Never use `"100%"`, `"50%"`, `"vh"`, `"calc()"` in `.pen` node dimensions. Use `"fill_container"` or explicit integer pixel values.
- ❌ **NO Arbitrary Sizing**: Snap layout dimensions, paddings, and gaps to the Tailwind 4px grid (4, 8, 12, 16, 20, 24, 32).



