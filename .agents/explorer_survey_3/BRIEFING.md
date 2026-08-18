# BRIEFING — 2026-08-18T10:28:00+07:00

## Mission
Frontend toast audit across `frontend/src/components`, `frontend/src/hooks`, `frontend/src/lib`, and anywhere else in `frontend/src/` to classify demo vs business domain usages, language status, error handling patterns, and propose standardized Vietnamese replacements.

## 🔒 My Identity
- Archetype: explorer
- Roles: [explorer, investigator, analyst]
- Working directory: d:\Projects\logistics-website\.agents\explorer_survey_3
- Original parent: e9a00261-a1cd-4d49-bbf7-521804fa1979
- Milestone: frontend-toast-survey-part-3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / do NOT modify source code
- Demarcate demo files as DO NOT TOUCH
- Check shared components, dialogs, form components, custom hooks, global error handling (Axios interceptors)
- Output structured findings with 5-component handoff report

## Current Parent
- Conversation ID: e9a00261-a1cd-4d49-bbf7-521804fa1979
- Updated: 2026-08-18T10:28:00+07:00

## Investigation State
- **Explored paths**:
  - `frontend/src/components/` (all 135 files, including `file-uploader.tsx`, `ui/sonner.tsx`, `ui/toast.tsx`)
  - `frontend/src/hooks/` (12 files)
  - `frontend/src/lib/` (11 files, including `api-client.ts`, `query-client.ts`)
  - `frontend/src/features/` (15 modules: `auth`, `forms`, `notifications`, `products`, `profile`, `users`, `fleet`, `orders`, `trips`, `overview`, `kanban`, `chat`, `ai-chat`, `elements`, `react-query-demo`)
  - `frontend/src/app/` (all route handlers and pages)
- **Key findings**:
  - Found 45 total toast calls across 17 files.
  - 8 demo/infrastructure files demarcated as DO NOT TOUCH (19 toast calls).
  - 18 toast calls in business domain require modifications (7 English → Vietnamese, 11 error toasts violating Rule 2 API Message First).
  - `api-client.ts` Axios interceptor does not throw global toasts; caller-level error handling is mandatory.
- **Unexplored areas**: None across frontend/src.

## Key Decisions Made
- Fully documented all 18 proposed replacements with exact file paths and line numbers in handoff.md.
- Classified `src/features/products` as Demo / Mock Template (DO NOT TOUCH) while `src/features/users` is classified as Business Domain Admin.

## Artifact Index
- `d:\Projects\logistics-website\.agents\explorer_survey_3\handoff.md` — Main analysis and survey handoff
- `d:\Projects\logistics-website\.agents\explorer_survey_3\progress.md` — Liveness and progress heartbeat
- `d:\Projects\logistics-website\.agents\explorer_survey_3\DISPATCH.md` — Log of initial dispatch
