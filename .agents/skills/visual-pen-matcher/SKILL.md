---
name: visual-pen-matcher
description: >-
  Visual & Design Pen Matching Inspector for the Logistics TMS. Captures web UI screenshots
  via Playwright E2E and audits them against Pencil vector canvas (.pen) design files in
  pencil-workspace/pens/. Validates dimensional proportions (no squished modals/tables),
  brand color tokens (#0F3D62 Navy), column structures, dynamic counter parity, and zero
  redundant icon cleanliness. Generates visual diff audits with embedded screenshot artifacts.
  Triggers on: "visual test", "screenshot test", "matching design pen", "so khop giao dien",
  "capture giao dien", "visual validation", "pen matching", "kiem tra giao dien voi pen".
---

# Visual & Design Pen Matching Inspector (Sub-Agent F)

> **Role**: Specialized visual validation and design-fidelity inspector that operates as **Sub-Agent F** in the E2E testing pipeline.
> Cross-checks live rendered web UI against vector design specifications in `pencil-workspace/pens/*.pen` (e.g. `WAREHOUSE_FLOWS.pen`, `UI_UX.pen`).
> Works in direct partnership with [`e2e-test-runner`](../e2e-test-runner/SKILL.md) and [`pencil-ui-designer`](../pencil-ui-designer/SKILL.md) to close the **Design → Implementation → Visual Verification** loop.

---

## 🏗️ Architecture & Position in E2E Pipeline

```
E2E Test Runner Pipeline
├── Sub-Agent D: Runtime Log Tracer          (00-runtime-log-tracer.spec.ts)
├── Sub-Agent A: Console Health Inspector    (01-console-health.spec.ts)
├── Sub-Agent B: Login Flow Tester           (02-login-flow.spec.ts)
├── Sub-Agent C: RBAC Route Guard Validator  (03-rbac-routing.spec.ts)
├── Sub-Agent E: Viewport & Table UX Suite   (11-*-no-hscroll.spec.ts)
└── Sub-Agent F: Visual & Pen Matching Agent (13-*-visual-validation.spec.ts) ← THIS AGENT
```

---

## 🎯 Core Responsibilities

1. **Automated Visual Capture (Playwright)**:
   - Orchestrates Playwright visual test suites (e.g. `e2e/13-warehouse-ui-visual-validation.spec.ts`).
   - Automatically navigates through user flows, enters editing modes, opens modals/dialogs, expands dropdowns, and triggers print previews.
   - Saves high-resolution screenshot artifacts to the session artifact screenshot directory (`screenshots/<index>_<NODE_ID>.png`).

2. **Pencil Vector Spec Extraction**:
   - Searches and parses the matching Frame / Node in `pencil-workspace/pens/*.pen` by Node ID or component name (e.g. `WH_OUTBOUND_LOOKUP_MODAL`, `WH_INBOUND_MODE1`, `WH_PALLET_LABEL_A4`).
   - Extracts design tokens:
     - **Frame Dimensions**: `width` (e.g. `1140px` for modals, `1440px` for full screen), `cornerRadius`, paddings, gaps.
     - **Color Tokens**: Header background (Navy `#0F3D62`), table head (`#F1F5F9`), toolbar (`#F8FAFC`), text colors (`#FFFFFF`, `#334155`, `#64748B`).
     - **Column Hierarchy**: Ordered list of table columns, header names, widths (`w-[180px]`, `w-[240px]`), alignments (left/right/center).
     - **State Badges & Counter Pills**: Pill backgrounds, text colors, format strings (e.g. `Tất cả (N)`, `🟡 LƯU KHO (N)`, `⚫ DRAFT (N)`).
     - **Action Buttons & Micro-copy**: Button background, hover states, labels (e.g. `Chọn đơn này ➔`), clean icon usage.

3. **5-Dimension Visual Compliance Scoring (Total: 100 Points)**:
   - Evaluates the captured UI against the design node and computes a deterministic score out of 100.

---

## 🔍 5-Dimension Visual Compliance Rubric

### 1. Structural & Dimensional Parity (20 pts)
- **Standard**: Modals, tables, cards, and containers must adhere to the designed width without unintended squishing or truncation.
- **Key Checkpoints**:
  - [ ] Modal dialog width is spacious (`1140px` / `max-w-5xl` / `max-w-6xl`), NOT squished by library defaults (e.g. Radix/Shadcn `sm:max-w-sm` 384px bug).
  - [ ] Table columns have ample space so headers do not break into ugly 3-4 line wraps (e.g. "MÃ\nĐƠN\nHÀNG").
  - [ ] Body has `overflow-x: hidden` with zero horizontal page scroll.

### 2. Brand Color & Design Token Parity (20 pts)
- **Standard**: Colors match the authoritative Logistics Hub design system.
- **Key Checkpoints**:
  - [ ] Modal / Page headers use Logistics Navy (`#0F3D62`) with clear white typography.
  - [ ] Status badges match lifecycle colors (Amber `#FEF3C7` / `#B45309` for LƯU KHO, Slate `#F1F5F9` for DRAFT, Emerald for COMPLETED).
  - [ ] Purple `IconTruck` for Xe bo (Level 2) and Blue `IconBuildingWarehouse` for Hub L1.

### 3. Field & Data Formatting Parity (20 pts)
- **Standard**: Field ordering, column counts, and number formats match the specification.
- **Key Checkpoints**:
  - [ ] Exactly matches designed column count (e.g. 7 columns in Lookup Modal, 10 columns in Inbound Grid).
  - [ ] Quantities, weights, and volumes include units and thousand separators (e.g. `10 kiện`, `1.040 kg`, `4,1 m³`).
  - [ ] Monospace bold font for Order Codes (`HCM-LTV-2609-001`).

### 4. Dynamic Counter & Metric Integrity (20 pts)
- **Standard**: Every displayed number is reactive and backed by backend data (Zero Arbitrary Numbers rule).
- **Key Checkpoints**:
  - [ ] Counter pills (e.g. `Tất cả (144)`, `LƯU KHO (0)`, `DRAFT (47)`) reflect real database state.
  - [ ] 1:1 Parity between tab counter and table rows rendered.
  - [ ] No hardcoded numbers or falsy fallbacks (`|| 52` prohibited; `?? 0` required).

### 5. Zero Redundant Icons & Visual Cleanliness (20 pts)
- **Standard**: Clean visual hierarchy with no duplicate emojis, double icons, or redundant buttons.
- **Key Checkpoints**:
  - [ ] No emoji + vector icon combinations inside button text (e.g. `<Button><IconPlus /> Tạo mới</Button>`, NEVER `<Button><IconPlus /> + Tạo mới</Button>` or `🖨️ In tem`).
  - [ ] Only 1 close button `✕` in modal headers (no duplicate overlay close button).
  - [ ] Clean badge markers for selected items (e.g. `✓ Đã ở Dòng #1`).

---

## 📊 Score Thresholds & Gate Rule

| Score | Status | Description | Action Required |
|---|---|---|---|
| **90 – 100** | ✅ **PERFECT PASS** | Pixel-perfect match with Pen canvas. | Ready for production release. |
| **80 – 89** | ⚠️ **PASS WITH WARN** | Minor cosmetic differences (slight padding/spacing delta). | Note in walkthrough; non-blocking. |
| **< 80** | ❌ **FAIL (BLOCKING)** | Squished layout, wrong colors, broken columns, or duplicate icons. | **Must fix code and re-verify before release.** |

---

## 🛠️ Step-by-Step Visual Audit Workflow

```
Step 1: Run Playwright Visual Suite
        (npx playwright test e2e/13-*-visual-validation.spec.ts)
   │
   ▼
Step 2: Inspect Generated Screenshots (.png artifacts)
   │
   ▼
Step 3: Read Matching Node in pencil-workspace/pens/*.pen
   │
   ▼
Step 4: Score 5 Dimensions & Check against Rubric
   │
   ▼
Step 5: Apply Code Fixes if Score < 80, then Re-run
   │
   ▼
Step 6: Update walkthrough.md with Visual Comparison
```

---

## 📝 Visual Validation Test File Template

When adding new visual test suites, follow this standard pattern in `frontend/e2e/13-*-visual-validation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAs, clearSession } from "./helpers/auth";
import * as path from "path";
import * as fs from "fs";

const ARTIFACT_SCREENSHOT_DIR = "C:/Users/Lenovo/.gemini/antigravity/brain/<CONVERSATION_ID>/screenshots";

test.describe("Visual & Design Pen Matching Suite", () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Screenshot XX: <NODE_ID> (<Screen Name>)", async ({ page }) => {
    await loginAs(page, TEST_USER);
    await page.goto("/dashboard/<path>");
    await page.waitForLoadState("networkidle");

    // Perform interaction if capturing modal/dropdown
    // await page.getByRole("button", { name: "..." }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.locator("text=<Expected Title>")).toBeVisible();

    await page.waitForTimeout(1000); // Allow render animations to settle

    const screenshotPath = path.join(ARTIFACT_SCREENSHOT_DIR, "<XX>_<NODE_ID>.png");
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);
  });
});
```
