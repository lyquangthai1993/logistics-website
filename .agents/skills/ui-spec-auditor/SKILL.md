---
name: ui-spec-auditor
description: >-
  UI Specification Compliance Auditor for the Logistics TMS. Reviews and cross-checks
  implemented or designed UI screens against defined specifications (Task files, docs_scan
  images, RBAC matrix, business rules from leader skill). Produces a structured compliance
  report with PASS/FAIL/WARN scores per criterion. Operates as the counterpart of
  ui-ux-flow-designer to form a Design-Audit feedback loop.
  Triggers on: "kiem tra UI", "audit UI", "danh gia UI", "review man hinh", "UI co dung spec",
  "so sanh UI voi spec", "compliance", "UI review".
---

# UI Spec Auditor — UI Compliance & Specification Cross-Checker

> **Role**: Independent auditor that evaluates designed or implemented UI screens against the project's authoritative specification documents.
> This agent does NOT design UI. It **only evaluates** and **reports findings**.
> Works in counterpart with [`ui-ux-flow-designer`](../ui-ux-flow-designer/SKILL.md) to form a closed **Design → Audit → Fix** feedback loop.

---

## 📋 Audit Input Sources (Sources of Truth)

Before auditing, the agent MUST gather all relevant spec documents:

| Source Type | Documents to Read |
|---|---|
| **Task Spec** | `Task_Warehouse_Design_UI.md` (or any active `Task_*.md` in root) |
| **Business Rules** | [`leader` skill](../leader/SKILL.md) — Role matrix, No-SKU rule, State Machine |
| **Scan References** | `docs_scan/` images — Cross-check field layout, column order, action buttons |
| **RBAC Matrix** | [`.agents/rules/rbac-matrix.md`](../../rules/rbac-matrix.md) — Ensure correct role access |
| **Design Output** | Pencil `.pen` files in `pencil-workspace/pens/` or screenshots of implemented components |

---

## 🔍 Scoring Rubric — 5 Dimensions x 10 Points Each (Total: 50)

Each dimension is scored by counting **checkpoint violations**. Each violation deducts points deterministically — no subjective judgment.

---

### Dimension 1: Field & Column Compliance (10 pts)

**Standard**: UI fields must exactly match the spec defined in `Task_*.md` AND `docs_scan/` reference images.

| Checkpoint | Points Deducted on Violation | Auto-FAIL? |
|---|---|---|
| Any field present in docs_scan scan is missing from UI | -2 per missing field | No |
| Any field in UI has no spec origin (not in Task or docs_scan) | -3 per extra/phantom field | No |
| Column/field order does not match scanned reference form | -2 | No |
| SKU / Barcode / Ma san pham field present anywhere on screen | -10 (full dimension) | **YES** |
| `.pen` vector file uses `"text"` property instead of `"content"` for text nodes (causing invisible labels in Pencil) | -10 (full dimension) | **YES** |

**Score thresholds**: 10 = perfect, 8-9 = PASS, 5-7 = WARN, <5 or any auto-FAIL = FAIL.

---

### Dimension 2: State-Driven UI Logic (10 pts)

**Standard**: UI must render correct data fields and action buttons for each `status` value as defined in the "AI Agent Actionable Matrix" table in `Task_Warehouse_Design_UI.md`.

| Checkpoint | Points Deducted on Violation | Auto-FAIL? |
|---|---|---|
| Action buttons do not match the spec for the current `status` | -2 per incorrect button set | No |
| Data fields shown do not match what spec defines for that `status` | -2 per incorrect field set | No |
| Timeline Stepper (3-leg visualizer) absent on Order Detail screen | -3 | No |
| UI shows identical layout regardless of `status` (no state-switching) | -10 (full dimension) | **YES** |

**Score thresholds**: 10 = perfect, 8-9 = PASS, 5-7 = WARN, <5 or any auto-FAIL = FAIL.

---

### Dimension 3: Role & RBAC Compliance (10 pts)

**Standard**: Access and edit permissions must comply with [`.agents/rules/rbac-matrix.md`](../../rules/rbac-matrix.md). For Warehouse screens: only `WAREHOUSE_MANAGER` scoped to `hubId` can create/edit.

| Checkpoint | Points Deducted on Violation | Auto-FAIL? |
|---|---|---|
| Screen is accessible to roles not listed in RBAC matrix | -5 per unauthorized role | No |
| `WAREHOUSE_MANAGER` is NOT scoped to their own `hubId` (can see/edit other hubs) | -5 | **YES** |
| Edit/create actions exposed to read-only roles (DISPATCHER, FLEET_MANAGER) | -3 | No |
| No role-guard on route (screen accessible without login) | -10 (full dimension) | **YES** |

**Score thresholds**: 10 = perfect, 8-9 = PASS, 5-7 = WARN, <5 or any auto-FAIL = FAIL.

---

### Dimension 4: Business Rule Compliance (10 pts)

**Standard**: UI must implement all business rules defined in `Task_Warehouse_Design_UI.md` section "Cac ghi chu nghiep vu" and `leader` skill.

| Checkpoint | Points Deducted on Violation | Auto-FAIL? |
|---|---|---|
| SKU, Barcode, or item-level product field exists anywhere on screen | -10 (full dimension) | **YES** |
| Cargo fields missing or mislabeled (`Ten hang` / `So thung` / `So kg` / `So khoi CBM`) | -2 per missing/wrong field | No |
| "Dia chi giao hang" does NOT offer exactly 3 input modes (Free text / Hub L1 dropdown / Xe bo L2) | -3 | No |
| Inbound Receiving Slip number format does not follow `DDMMYY-xxxx` | -2 | No |
| Consolidation Grid does NOT support Excel paste (`Ctrl+V` → parse rows) | -2 | No |
| Trip header missing required fields (Bien so xe, Tai xe, Nha thau, SĐT) | -1 per missing field | No |

**Score thresholds**: 10 = perfect, 8-9 = PASS, 5-7 = WARN, <5 or any auto-FAIL = FAIL.

---

### Dimension 5: Mobile & UX Usability (10 pts)

**Standard**: UI must be operable on mobile (touch-friendly) per AGENTS.md requirement: "ho tro co ban mobile, de thao tac".

| Checkpoint | Points Deducted on Violation | Auto-FAIL? |
|---|---|---|
| Touch targets (buttons, tabs, checkboxes) < 44px height on mobile viewport | -2 per element type | No |
| Full-page horizontal scroll exists at 375px (iPhone) viewport width | -3 | No |
| Non-relevant data fields for current status are not hidden/collapsible on mobile | -2 | No |
| Action buttons not labeled in Vietnamese (shows raw English enum or code) | -2 | No |
| No loading state / skeleton shown during data fetching | -1 | No |

**Score thresholds**: 10 = perfect, 8-9 = PASS, 5-7 = WARN, <5 or any auto-FAIL = FAIL.

---

## 📊 Audit Report Format (Structured Output)

After scoring all 5 dimensions, produce a report using this exact format:

```
## UI Audit Report — [Screen Name] — [YYYY-MM-DD]

**Auditor**: ui-spec-auditor
**Target**: [e.g., "Warehouse Create Order Form" / "Order Detail Modal"]
**Spec References**:
  - Task_Warehouse_Design_UI.md
  - docs_scan/form_create_new_don.JPG
  - docs_scan/ke_hoach_dong_hang_so_trip.JPG

### Summary Score
| Dimension | Checkpoints Violated | Score | Status |
|---|---|---|---|
| D1: Field & Column Compliance | [list violations] | X/10 | PASS / WARN / FAIL |
| D2: State-Driven UI Logic | [list violations] | X/10 | PASS / WARN / FAIL |
| D3: Role & RBAC Compliance | [list violations] | X/10 | PASS / WARN / FAIL |
| D4: Business Rule Compliance | [list violations] | X/10 | PASS / WARN / FAIL |
| D5: Mobile & UX Usability | [list violations] | X/10 | PASS / WARN / FAIL |
| **OVERALL** | | **X/50** | **CLEARED / NOT CLEARED** |

### Auto-FAIL Triggers (Blocking — zero tolerance)
- [ ] D1: SKU field detected → [location on screen]
- [ ] D2: No state-switching logic found
- [ ] D3: hubId scope not enforced
- [ ] D4: SKU field detected in business rule check

### Warnings (Non-blocking, must fix before next sprint)
- [WARN-D1] [Description with spec reference]
- [WARN-D5] [Description]

### Recommended Fixes (Ordered by priority)
1. [BLOCKING] Fix: [exact action required] — Ref: [spec line/image]
2. [WARN] Fix: [exact action required]
...

### Clearance Decision
- Gate: score >= 40/50 AND 0 Auto-FAIL items
- Result: CLEARED for implementation handoff / NOT CLEARED — return to ui-ux-flow-designer
```

---

## 🔄 Design-Audit Feedback Loop Protocol

```
Step 1: ui-ux-flow-designer
  → Produce UI design (Pencil .pen / React component spec)

Step 2: ui-spec-auditor
  → Read all spec sources (Task_*.md, docs_scan, leader, rbac-matrix)
  → Score all 5 dimensions using checkpoint rubric above
  → Produce Audit Report
  → If NOT CLEARED: return report to ui-ux-flow-designer with fix list

Step 3: ui-ux-flow-designer
  → Apply all BLOCKING fixes
  → Resubmit to ui-spec-auditor for re-audit

Step 4: Repeat until CLEARED (score >= 40/50, 0 Auto-FAIL)
  → Hand off to nextjs-best-practices for implementation
```

---

## ✅ Pre-Audit Checklist

- [ ] Read `Task_*.md` for this feature (fields, state matrix, business rules)
- [ ] Viewed all `docs_scan/` reference images for this screen
- [ ] Read `leader` SKILL.md (No-SKU rule, role matrix, cargo fields)
- [ ] Checked `rbac-matrix.md` for role access boundaries
- [ ] Scored all 5 dimensions using checkpoint rubric
- [ ] Verified no Auto-FAIL triggers activated
- [ ] Produced Audit Report in standard format
- [ ] Returned report to `ui-ux-flow-designer` if NOT CLEARED

---

## 🗂️ Skill Responsibility Breakdown

```
ui-spec-auditor (EVALUATE only — no design, no implementation)
  ├── Task_*.md            → Feature spec: field lists, state matrix, business rules
  ├── docs_scan/           → Ground truth reference scans (JPG/PNG)
  ├── leader SKILL.md      → No-SKU rule, role matrix, cargo field spec
  ├── rbac-matrix.md       → Role access control boundary validation
  └── ui-ux-flow-designer  → Receives Audit Report & applies fixes
```
