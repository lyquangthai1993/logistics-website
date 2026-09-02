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

## 🔍 Audit Methodology — 5 Dimensions

For each UI screen or component being audited, evaluate across 5 dimensions:

### Dimension 1: Field & Column Compliance
- Does the UI display exactly the fields defined in the Task spec and docs_scan images?
- Are there **extra fields not in spec** (e.g., SKU, Ma san pham, Barcode)?
- Are there **missing fields** required by spec?
- Is the **column order** consistent with the scanned reference form?

### Dimension 2: State-Driven UI Logic
- Does the UI correctly **show/hide** action buttons based on `status` (from the AI Agent Actionable Matrix)?
- Does each status render the correct **data fields** as specified in the State Matrix?
- Is the **Timeline Stepper** (3-leg lifecycle visualizer) present on Order Detail screens?

### Dimension 3: Role & RBAC Compliance
- Can only `WAREHOUSE_MANAGER` (scoped to their `hubId`) access and operate this screen?
- Are unauthorized roles (DISPATCHER, FLEET_MANAGER) properly blocked or given read-only views?
- Reference: [RBAC Matrix](../../rules/rbac-matrix.md)

### Dimension 4: Business Rule Compliance
- **No-SKU Rule**: Is there any SKU / item-level product management field on screen? FAIL if yes.
- **Cargo fields**: Are `Ten hang`, `So thung`, `So kg`, `So khoi (CBM)` present and correctly labeled?
- **Hub Hierarchy**: Does "Dia chi giao hang" provide exactly 3 options (Free text / Hub L1 / Xe bo L2)?
- **Inbound Receiving Slip**: Does the Print slip follow `DDMMYY-xxxx` numbering format?
- **Excel Paste UX**: Is `Ctrl+V` paste-from-Excel supported on consolidation grids?

### Dimension 5: Mobile & UX Usability
- Are touch targets (buttons, tabs) large enough for finger interaction?
- Is horizontal scroll minimized? (No full-page horizontal scroll on mobile viewport)
- Are non-relevant data fields collapsed into a drawer on mobile?
- Are action buttons grouped logically and labeled in Vietnamese (user-facing lang)?

---

## 📊 Audit Report Format (Structured Output)

After auditing, produce a report in the following format:

```
## UI Audit Report — [Screen Name] — [Date]

**Auditor**: ui-spec-auditor
**Target**: [Component/Screen being audited]
**Spec Reference**: [Task_Warehouse_Design_UI.md | docs_scan/xxx.JPG]

### Summary Score
| Dimension | Score | Status |
|---|---|---|
| Field & Column Compliance | X/10 | PASS / WARN / FAIL |
| State-Driven UI Logic | X/10 | PASS / WARN / FAIL |
| RBAC Compliance | X/10 | PASS / WARN / FAIL |
| Business Rule Compliance | X/10 | PASS / WARN / FAIL |
| Mobile & UX Usability | X/10 | PASS / WARN / FAIL |
| **Overall** | **X/50** | **[PASS/FAIL]** |

### Passing Criteria
- [List items that pass]

### Warnings (Non-blocking, should fix)
- [List items with minor deviations]

### Failures (Blocking — must fix before approval)
- [List critical spec violations with exact spec reference]

### Recommended Fixes
1. [Actionable fix description for ui-ux-flow-designer to address]
2. ...
```

---

## 🔄 Design-Audit Feedback Loop Protocol

This agent is the **second step** in the 3-step delivery pipeline:

```
Step 1: ui-ux-flow-designer
  → Produce UI design (Pencil .pen / React components)

Step 2: ui-spec-auditor
  → Cross-check vs all spec sources
  → Generate Audit Report with scores
  → Return to designer if FAIL items exist

Step 3: ui-ux-flow-designer
  → Apply fixes from Audit Report
  → Resubmit to ui-spec-auditor
  → Loop until score >= 40/50 and 0 FAIL items
```

**Gate Rule**: A UI screen MUST achieve **>= 40/50** overall score AND **0 FAIL items** before it is cleared for frontend implementation handoff to `nextjs-best-practices`.

---

## ✅ Pre-Audit Checklist (Quick Reference)

Before submitting audit report, verify all checklist items:

- [ ] Read all `Task_*.md` files for this feature
- [ ] Viewed all relevant `docs_scan/` reference images
- [ ] Read `leader` skill for No-SKU rule and role responsibilities
- [ ] Checked RBAC matrix for role access boundaries
- [ ] Evaluated all 5 audit dimensions
- [ ] Produced structured Audit Report with scores
- [ ] Listed all FAIL items with direct spec references
- [ ] Sent report back to `ui-ux-flow-designer` for fixes (if FAIL)

---

## 🗂️ Skill Responsibility Breakdown

```
ui-spec-auditor (EVALUATE only — no design, no implementation)
  ├── Task_*.md            → Feature spec, field lists, state matrix, business rules
  ├── docs_scan/           → Ground truth scanned reference forms (JPG/PNG)
  ├── leader SKILL.md      → Role matrix, No-SKU rule, state machine validation
  ├── rbac-matrix.md       → Role access control boundary checks
  └── ui-ux-flow-designer  → Sends Audit Report back for fix iteration
```
