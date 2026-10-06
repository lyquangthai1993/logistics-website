# Todo Agent — Operational Feedback Execution Playbook

This reference document provides in-depth technical guidance for developers and autonomous agents executing tasks from `feedback_DD_MM*` directories in the Logistics TMS (Spider Express) workspace.

---

## 1. Feedback Directory Lifecycle & State Transitions

Every operational feedback cycle transitions through 4 canonical phases:

```
[DISCOVERED] ──> [ANALYZED & PLANNED] ──> [IN PROGRESS] ──> [VERIFIED & CLOSED]
      │                     │                     │                   │
  Empty / New           Blueprint             Code edits          Playwright E2E
   TODO.md              generated            in submodules         passed, 100% [x]
```

### Phase 1: Discovered (`⚠️ NOT_STARTED` / `❓ NO_TODO`)
- User or operator creates a folder like `feedback_06_10_task_1` or `feedback_07_10`.
- If `TODO.md` is missing, initialize it using `FEEDBACK_TEMPLATE.md`.
- Attached media (screenshots, logs) should be placed directly inside the folder.

### Phase 2: Analyzed & Planned (`⏳ IN_PROGRESS`)
- Run `node scripts/todo-agent.mjs plan <folder_name>` to extract:
  - Total tasks count, pending vs completed.
  - Submodule target (`backend/`, `frontend/`, or both).
  - Exact file paths resolved across the workspace.
  - DoD commands.
- Run `npm run repo:status` and `npm run repo:tracking` to ensure all 3 repos are on `dev` and clean.

### Phase 3: In Progress (Submodule Implementation)
- If impact score >= 6, create feature branch in submodules:
  ```powershell
  # Backend
  cd backend && git checkout dev && git pull origin dev && git checkout -b fix/<folder-slug> && cd ..
  # Frontend
  cd frontend && git checkout dev && git pull origin dev && git checkout -b fix/<folder-slug> && cd ..
  ```
- Make surgical code edits following:
  - `nestjs-best-practices` for backend controllers, services, DTOs.
  - `nextjs-best-practices` and `ui-compact-density` for frontend UI.
  - `tanstack-optimistic-updates` for zero-latency cache updates.

### Phase 4: Verified & Closed (`✅ DONE 100%`)
- Run verification gates:
  - Backend compile & lint: `npm run lint --prefix backend` && `npm run build --prefix backend`.
  - Frontend compile: `npx --prefix frontend tsc --noEmit` && `npm run build --prefix frontend`.
  - Playwright E2E verification on dev domain: `npm run test:e2e:check`.
- Check off all tasks in `TODO.md`:
  `node scripts/todo-agent.mjs toggle <folder> <lineNumber> done`

---

## 2. Common Operational Patterns in Feedback Tasks

### Pattern A: Multi-Truck Inbound Order Aggregation (1 Waybill on N Trucks)
- **Problem**: When 1 customer order code (`MD123`) is transported by 2 or more trucks into a hub, the system must NOT create duplicate rows that pollute inventory, nor can it silently overwrite previous truck records.
- **Solution**:
  - Keep each receiving intake line as an independent `OrderInventoryTransactionEntity` (preserving vehicle plate, driver name, received quantity, timestamp).
  - In `warehouse.service.ts` (`aggregateOrderGroup`), render a **Master Parent Row** (algebraic sum of quantities, weights, volumes) and expandable child lines for each truck intake.
  - Display multi-truck badges: `+1 xe`, `+2 xe` with tooltip.

### Pattern B: Roadside Pickup vs Hub Loading (Case 3 Inbound / Outbound Disambiguation)
- **Problem**: Inbound trucks picking up packages en route vs warehouse loading packages onto an outgoing truck.
- **Solution**:
  - DTO must include `appendType: 'ROADSIDE_PICKUP_INBOUND' | 'HUB_TRANSFER_OUTBOUND'`.
  - For `ROADSIDE_PICKUP_INBOUND`:
    - `originHub`: Free text pickup point (e.g., `Cây xăng Hòa Cầm`).
    - `originHubId`: `null`.
    - `destinationHubId`: `currentOperatingHubId` (fixed to user's hub, read-only).
    - Status: `IN_TRANSIT`, appears in the current hub manifest as `isForCurrentHub = true` (ready to unload).
  - For `HUB_TRANSFER_OUTBOUND`:
    - `originHubId`: `currentOperatingHubId`.
    - `destinationHubId`: Selected next hub on route.
    - Appears in current hub manifest as `isForCurrentHub = false` ("Đi kho khác").

### Pattern C: Partial Outbound Dispatching ("Xuất từng phần")
- **Problem**: Customer orders 100 packages, warehouse dispatches 30 packages today on truck A, and 70 packages tomorrow on truck B.
- **Solution**:
  - Never mark an order `COMPLETED_OUTBOUND` until `totalQuantityDispatched == totalQuantity`.
  - Track `availableStock = totalQuantityInbound - totalQuantityDispatched`.
  - Strict validation: Reject any dispatch where `dispatchQty > availableStock`.

---

## 3. Mandatory UI Spacing & Compact Density Checklist

When implementing frontend tasks from feedback, NEVER violate these rules:

| Element | Compact Scale (REQUIRED) | Prohibited Class (FAIL) |
|---|---|---|
| Card & CardContent | `p-1`, `[--card-spacing:--spacing(1)]` | `p-4`, `p-5`, `p-6` |
| Modal Body | `p-2` (max `p-2.5`), `max-h-[80vh] overflow-y-auto` | `p-6`, `p-8` |
| Section Gaps | `gap-1.5` to `gap-2`, `space-y-1.5` to `space-y-2` | `gap-4`, `space-y-4` |
| Input & Button Height | `h-8` to `h-8.5` | `h-10`, `h-12` |
| Table Cells (STT, Qty, kg, m³) | `text-[10px]`, `py-1 px-1.5` | `text-sm`, `py-3`, `py-4` |
| Order / Trip Codes | `text-[11px] font-mono font-bold` | `text-base` |
| Action Toolbar | `sticky bottom-0 bg-white dark:bg-slate-900 border-t p-1.5` | Floating non-sticky |
