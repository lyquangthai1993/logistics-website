---
name: telegram-task-responder
description: >-
  Mobile-first reporting and response standards for tasks received via Telegram Bot. Enforces
  concise executive summaries, badge-first verdicts, structured card lists over wide tables,
  zero code dumps (>30 lines), zero fluff/pleasantries, and zero trailing conversation prompts.
  Triggers on: "telegram", "telegram bot", "báo cáo qua telegram", "tin nhắn telegram", "giao task telegram".
---

# Telegram Task Responder & Mobile-First Reporting Guidelines

## 1. Core Purpose
Tasks received through the Telegram Bot (`tools/telegram-task-runner/bot.mjs`) are executed on mobile devices (smartphones, tablets). Standard LLM responses that produce multi-page essays, large code dumps, or wide markdown tables create friction on narrow screens.
This skill enforces **high-signal, compact, mobile-first reporting**.

---

## 2. Five Mandatory Rules for Telegram Responses

### Rule 1: Executive Verdict First (Badge + Outcome)
Every response must open with a direct status badge and a 1-sentence verdict on line 1:
- `🟢 SUCCESS: <action completed>` (e.g. `🟢 HOÀN THÀNH: Đã sửa lỗi tràn bảng xe và cập nhật padding p-1`)
- `🔴 FAILED: <root cause>` (e.g. `🔴 THẤT BẠI: Endpoint /auth trả về 401 Unauthorized do thiếu Bearer token`)
- `🟡 WARNING: <partial status>` (e.g. `🟡 CẢNH BÁO: Đã sửa code nhưng Playwright E2E test 3/4 pass`)
- `ℹ️ STATUS: <informational outcome>` (e.g. `ℹ️ TRẠNG THÁI: Các service Dev trên Render và Vercel đều đang LIVE`)

### Rule 2: Mobile Information Hierarchy (No Wall of Text)
- Telegram is read on a ~400px wide screen. Paragraphs must NOT exceed 3 lines.
- Group information under clear bold headers (`### 1. ...`, `### 2. ...`).
- Use structured bullet points with emojis (`▫️`, `•`, `🔹`, `⚡`).
- Avoid wide markdown tables with 5+ columns. Instead, format tabular data as concise key-value cards:
  ```markdown
  🔹 **Tên dịch vụ / đối tượng**
    ▫️ Thuộc tính 1: Giá trị 1
    ▫️ Thuộc tính 2: Giá trị 2
  ```

### Rule 3: Zero Code Dumps (Max 15-20 Lines per Snippet)
- **DO NOT** dump entire source files into Telegram messages.
- For code changes, only show the critical lines changed (unified diff or minimal snippet):
  ```typescript
  // frontend/src/components/card.tsx
  - className="p-4 space-y-4"
  + className="p-1 space-y-1.5"
  ```
- Always cite the exact clickable file link: `[path/to/file](file:///c:/Projects/logistics-website/path/to/file)`.

### Rule 4: Strict Zero-Fluff & Zero Ending Slogans
- **Strictly Banned Openings**:
  - `Tôi đã tiếp nhận yêu cầu...`
  - `Chào bạn, tôi sẽ giúp bạn...`
  - `Dưới đây là kết quả chi tiết...`
- **Strictly Banned Closings**:
  - `Hệ thống đã sẵn sàng...`
  - `Hệ thống đã được tối ưu hóa...`
  - `Bạn muốn tôi thực hiện bước nào tiếp theo?`
  - `Nếu bạn cần hỗ trợ thêm, hãy cho tôi biết!`
- **Enforcement**: State the facts, present the evidence, and **STOP IMMEDIATELY**.

### Rule 5: Domain & Git Context Awareness
- Always refer to canonical environments from `AGENTS.md`:
  - **Dev Frontend**: `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app` (branch `dev`)
  - **Dev Backend**: `https://logistics-website-backend-1jho.onrender.com` (branch `dev`)
- Report Git status cleanly across the 3 independent repositories (`root`, `backend/`, `frontend/`):
  - Mention current active branch (`dev` / `feature/...`).
  - Mention commit short hash (`git rev-parse --short HEAD`).
  - State whether working trees are clean.

### Rule 6: Task Intent Handling (/fix vs /task vs /continue)
- **`/fix` (Bug Fix & Error Repair - Đã chạy nhưng lỗi)**:
  - Dedicated mode for existing features that crash, throw errors, display incorrect data, or break layout.
  - **Strict Constraint**: Surgical fix only. Identify the root cause, repair the broken code, and verify. **NEVER** rewrite unaffected architectures, change overall business rules, or introduce unsolicited features.
  - Verdict format: `🟢 HOÀN THÀNH (SỬA LỖI): <tóm tắt lỗi và nguyên nhân đã fix>`.
- **`/task` (General Tasks / New Features / Enhancements)**:
  - Standard mode for implementing new features, creating new modules, adding endpoints, or enhancing existing workflows.
- **`/continue` (Session Iteration)**:
  - Resumes the previous context to adjust, refine, or add incremental details.

---

## 3. Recommended Output Template for Telegram

```markdown
🟢 HOÀN THÀNH: [Tóm tắt 1 câu việc đã làm]

### 1. Thay đổi chính
• [File/Component 1]: [Mô tả ngắn thay đổi]
• [File/Component 2]: [Mô tả ngắn thay đổi]

### 2. Kết quả kiểm tra
▫️ Backend: [LIVE / Test passed / API response time]
▫️ Frontend: [READY / Build passed / E2E verified]
▫️ Git Submodules: [Branch name, Commit hash, Clean status]
```
