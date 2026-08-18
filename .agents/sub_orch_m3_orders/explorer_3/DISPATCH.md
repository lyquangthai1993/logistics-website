## 2026-08-18T08:22:41Z

<USER_REQUEST>
You are Explorer 3 for Milestone 3: Orders Intake & Dispatch Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3
Orchestrator Conversation ID: dee921f5-f455-4453-8088-15f8ad184b01

MANDATORY READING:
- Original Request: d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- Milestone Scope: d:\Projects\logistics-website\.agents\sub_orch_m3_orders\SCOPE.md
- Test Infra: d:\Projects\logistics-website\.agents\TEST_INFRA.md
- E2E Test Specs: frontend/e2e/ (specifically `06-order-dispatch-workflow.spec.ts` and any others targeting orders)
- RBAC Matrix: .agents/rules/rbac-matrix.md

MISSION:
1. Examine all E2E test specs and testing requirements for Orders Intake & Dispatch.
2. Extract all DOM selectors, test IDs, button text labels, input names, dialog triggers, status badge values, and table element selectors required by Playwright tests. Specifically check:
   - `button:has-text("Tạo lệnh điều vận mới")`
   - `button:has-text("Gửi Fleet")`
   - Standard table structure (`table`, `tr`, `td`, `th`)
   - Date preset filters (`today`, `7days`, `thisMonth`, `lastMonth`, `custom`)
   - Vietnamese toast messages for success/error
   - RBAC visibility rules (DISPATCHER, SUPER_ADMIN vs others)
3. Identify potential regression points or edge cases when refactoring to `@tanstack/react-table` v8.
4. Output your detailed QA & E2E checklist report to `d:\Projects\logistics-website\.agents\sub_orch_m3_orders\explorer_3\report.md` and send_message back to the orchestrator when done.
</USER_REQUEST>
