## 2026-08-18T07:58:31Z
<USER_REQUEST>
You are Explorer 1 for Iteration 2 of Milestone 1: Hubs Management Standardization.
Your working directory is: d:\Projects\logistics-website\.agents\explorer_m1_hubs_r2_1

READ FIRST:
- d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md
- d:\Projects\logistics-website\.agents\PROJECT.md
- d:\Projects\logistics-website\.agents\sub_orch_m1_hubs\SCOPE.md
- Challenger 1 Handoff: d:\Projects\logistics-website\.agents\challenger_m1_hubs_1\handoff.md
- Challenger 2 Handoff: d:\Projects\logistics-website\.agents\challenger_m1_hubs_2\handoff.md
- Implementation files:
  - `frontend/src/features/hubs/api/mutations.ts`
  - `frontend/src/features/hubs/components/hub-form-dialog.tsx`
  - `frontend/src/features/hubs/components/hubs-tables/cell-action.tsx`

PROBLEM TO SOLVE:
In `hub-form-dialog.tsx` and `cell-action.tsx`, writing `useMutation({ ...createHubMutation, onSuccess: (res) => { toast.success(...); setOpen(false); } })` overwrites the base `onSuccess` in `mutations.ts`. As a result, `queryClient.invalidateQueries({ queryKey: hubKeys.all })` is NEVER called, and the table + KPI metrics retain stale data after Create, Edit, Toggle Active, and Soft Delete!

TASKS:
1. Analyze the exact mutation pattern across `mutations.ts`, `hub-form-dialog.tsx`, and `cell-action.tsx`.
2. Formulate the concrete fix: using `useQueryClient()` in components and explicitly calling `queryClient.invalidateQueries({ queryKey: hubKeys.all })` in the mutation `onSuccess` (or `onSettled`), or providing custom React Query hooks (`useCreateHubMutation()`, `useUpdateHubMutation()`, etc.) that cleanly handle invalidation, toasts, and callbacks.
3. Write your remediation plan and exact code changes to `d:\Projects\logistics-website\.agents\explorer_m1_hubs_r2_1\analysis.md` and `handoff.md`.
4. Send a message back to the orchestrator.
</USER_REQUEST>
