# Dispatch: reviewer_m7_1

## Objective
Objective and adversarial code quality review focusing on UI/UX standards, pointer cursor adherence, Vietnamese toasts, and canonical table architecture.

## Mandatory Files to Read First
- `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md`
- `d:\Projects\logistics-website\.agents\PROJECT.md`
- `d:\Projects\logistics-website\.agents\TEST_READY.md`
- `d:\Projects\logistics-website\.agents\TEST_INFRA.md`
- `d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md`

## Audit Criteria
1. **Canonical Table Architecture**:
   - Verify all 7 standardized modules (`hubs`, `fleet`, `orders`, `trips`, `users`, `warehouse`, `notifications`) use `@/components/ui/table/data-table` and `DataTablePagination`.
   - Verify `ColumnDef<T>[]` and `DataTableColumnHeader` sortable headers.
2. **Pointer Cursor Adherence**:
   - Check interactive elements: table headers, pagination buttons, action dropdowns, modal triggers, checkboxes.
   - Must have `cursor-pointer` (or `cursor-not-allowed` when disabled).
3. **Vietnamese Toast Messages**:
   - Verify 100% Vietnamese toasts across all business features (`orders`, `trips`, `warehouse`, `admin/users`, `profile`, `fleet`).
   - Verify API message first pattern: `const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'fallback')`.
   - No hardcoded English error toasts in business domain files.

## Verdict Requirement
Write `handoff.md` in `d:\Projects\logistics-website\.agents\reviewer_m7_1` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**, complete with verified evidence.

## 2026-08-18T10:25:48Z
You are Reviewer 1 for Milestone 7 (UI/UX & Code Standards Reviewer).
Your working directory is: d:\Projects\logistics-website\.agents\reviewer_m7_1
Read your instructions in d:\Projects\logistics-website\.agents\reviewer_m7_1\DISPATCH.md.

Mandatory read:
- d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- d:\Projects\logistics-website\.agents\PROJECT.md
- d:\Projects\logistics-website\.agents\TEST_READY.md
- d:\Projects\logistics-website\.agents\TEST_INFRA.md
- d:\Projects\logistics-website\.agents\sub_orch_m7_e2e_hardening\SCOPE.md

Tasks:
1. Review all refactored tables across `frontend/src/features/` (`hubs`, `fleet`, `orders`, `trips`, `users`, `warehouse`, `notifications`):
   - Canonical table uniformity: `@/components/ui/table/data-table` and `DataTablePagination`.
   - Pointer cursor adherence: `cursor-pointer` on clickable table headers, action buttons, tabs, pagination; `cursor-not-allowed` when disabled.
   - Vietnamese toast messages: 100% Vietnamese toasts across all business domain features, API message first pattern (`err.response?.data?.message`).
2. Write your findings and explicit verdict (**APPROVE** or **REQUEST_CHANGES**) in `handoff.md` in your working directory.
3. Send message to your parent with your completion status and verdict.
