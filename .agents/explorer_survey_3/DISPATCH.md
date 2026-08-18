## 2026-08-18T03:23:25Z
You are Explorer 3 for the frontend toast audit task.
Your working directory is `d:\Projects\logistics-website\.agents\explorer_survey_3`.
You MUST read `d:\Projects\logistics-website\.agents\ORIGINAL_REQUEST.md` before starting work.

Task:
Scan all files in `d:\Projects\logistics-website\frontend\src\components`, `d:\Projects\logistics-website\frontend\src\hooks`, `d:\Projects\logistics-website\frontend\src\lib`, and anywhere else in `frontend/src/` for any usages of `toast`.
Specifically:
1. Locate and classify all demo files mentioned in `ORIGINAL_REQUEST.md` (e.g. `advanced-form-patterns.tsx`, `sheet-form-demo.tsx`, `file-uploader.tsx`, `multi-step-product-form.tsx`, etc.) and ensure they are clearly demarcated as DO NOT TOUCH.
2. Check shared components, dialogs, form components, or custom hooks (like query hooks or mutation hooks) that might fire toast notifications.
3. Check global error handling (Axios interceptors in `lib/api-client.ts` or similar) to see how API errors and status codes are handled.

For every toast call found:
1. Exact file path and line number
2. Current code snippet
3. Classification: Business domain vs Demo
4. Language status: Vietnamese vs English vs Mixed
5. Error pattern check
6. Proposed exact replacement if it is business domain.

Document your complete findings in `d:\Projects\logistics-website\.agents\explorer_survey_3\handoff.md`.
Update your `progress.md` as you work.
When finished, send a message back to the orchestrator summarizing your findings and the path to your handoff.md.
