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
- `📋 KẾ HOẠCH (TODO.MD SẴN SÀNG): <mục tiêu & checklist>` (Dành riêng cho Pha 1: Khảo sát, bóc tách RCA và tạo `TODO.md`. NGHIÊM CẤM dùng `🟢 HOÀN THÀNH / COMPLETED` ở pha này vì code chưa được sửa và chưa qua kiểm thử).
- `🟢 HOÀN THÀNH (DEV VERIFIED): <hành động & nghiệm thu>` (CHỈ DÙNG cho Pha 2: Đã sửa code, vượt qua 2-Tier Quality Gate và E2E pass 100% trên Dev).
- `🔴 THẤT BẠI: <root cause>` (e.g. `🔴 THẤT BẠI: Endpoint /auth trả về 401 Unauthorized do thiếu Bearer token`)
- `🟡 CẢNH BÁO: <partial status>` (e.g. `🟡 CẢNH BÁO: Đã sửa code nhưng Playwright E2E test 3/4 pass`)
- `ℹ️ TRẠNG THÁI: <informational outcome>` (e.g. `ℹ️ TRẠNG THÁI: Các service Dev trên Render và Vercel đều đang LIVE`)

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
- Always refer to canonical environments from `AGENTS.md` (Railway Cloud is PRIMARY):
  - **Dev Frontend (Primary)**: `https://frontend-tms-core-dev.up.railway.app` (branch `dev`)
  - **Dev Backend (Primary)**: `https://backend-tms-core-dev.up.railway.app` (branch `dev`)
  - **Pro Frontend (Primary)**: `https://frontend-tms-core-production.up.railway.app` (branch `master`)
  - **Pro Backend (Primary)**: `https://backend-tms-core-production.up.railway.app` (branch `master`)
  - *Secondary / Fallback*: Vercel (`logistics-website-frontend-git-dev-thai-lys-projects.vercel.app`) & Render (`logistics-website-backend-1jho.onrender.com`)
- Report Git status cleanly across the 3 independent repositories (`root`, `backend/`, `frontend/`):
  - Mention current active branch (`dev` / `feature/...`).
  - Mention commit short hash (`git rev-parse --short HEAD`).
  - State whether working trees are clean.

### Rule 6: Task Intent Handling (/feedback vs /fix vs /task vs /continue)
- **`/feedback` hoặc Lập Kế Hoạch (Analysis & TODO.md Generation - Pha 1)**:
  - Khảo sát mã nguồn, phân tích ảnh chụp màn hình feedback, bóc tách nguyên nhân gốc (RCA), và sinh file `feedbacks/feedback_DD_MM_task_<id>/TODO.md`.
  - **Trạng thái hệ thống (DB)**: `TODO_CREATED` (hoặc `PLANNED`).
  - **Quy tắc nghiêm ngặt**: TUYỆT ĐỐI KHÔNG dùng `COMPLETED` hoặc `🟢 HOÀN THÀNH` vì mã nguồn chưa được chỉnh sửa và chưa qua kiểm thử.
  - Verdict format: `📋 KẾ HOẠCH (TODO.MD SẴN SÀNG): <mục tiêu và phạm vi đã lập checklist>`.
- **`/fix` (Bug Fix & Error Repair - Đã chạy nhưng lỗi - Pha 2)**:
  - Dedicated mode for existing features that crash, throw errors, display incorrect data, or break layout.
  - **Strict Constraint**: Surgical fix only. Identify the root cause, repair the broken code, and verify. **NEVER** rewrite unaffected architectures, change overall business rules, or introduce unsolicited features.
  - **Trạng thái hệ thống (DB)**: `COMPLETED` (sau khi E2E Dev Pass 100%).
  - Verdict format: `🟢 HOÀN THÀNH (SỬA LỖI): <tóm tắt lỗi và nguyên nhân đã fix>`.
- **`/task` hoặc `/force` (General Tasks / New Features / Thực thi Checklist - Pha 2)**:
  - Standard mode for implementing new features, creating new modules, adding endpoints, or implementing an existing `TODO.md` checklist.
  - **Trạng thái hệ thống (DB)**: `COMPLETED` (sau khi E2E Dev Pass 100%).
  - Verdict format: `🟢 HOÀN THÀNH (DEV VERIFIED): <tóm tắt tính năng/checklist đã hoàn tất>`.
- **`/continue` (Session Iteration)**:
  - Resumes the previous context to adjust, refine, or add incremental details.

### Rule 7: Model Selection & Task Routing Strategy (Chiến lược phân bổ Model AI tối ưu)
- 🧠 **Phân tích Feedback, Multimodal OCR & Lập Kế hoạch (`/plan`, `/feedback`)**:
  - *Model tối ưu*: **Gemini 2.5 Pro / Gemini 3.8 Pro**.
  - *Đặc tính*: Cửa sổ ngữ cảnh 1M–2M tokens, phân tích ảnh chụp màn hình lỗi giao diện, bóc tách RCA và sinh checklist nguyên tử `TODO.md` kèm kịch bản E2E & Edge Cases.
- 💻 **Triển khai Code, Hotfix (`/fix`), Tính năng mới (`/task`, `/force`)**:
  - *Model chính (Primary)*: **Claude 3.5 Sonnet / Claude 3.7 Sonnet** (First-pass pass rate cao nhất, tuân thủ strict TypeScript và Compact Density `p-1`, `p-2`, cấm `p-4`).
  - *Dự phòng khi hết token/quota*: Tự động fallback sang **Gemini 2.5 Pro / 3.8 Pro** (chạy `ui-spacing-guard` kiểm tra class cấm) hoặc **Gemini 2.5 Flash / 3.8 Flash** đối với các hotfix nhỏ để tiết kiệm token tối đa.
  - *Tiết kiệm token*: Không nạp log dài cho Claude, chỉ gửi blueprint tóm tắt từ Pha 1 và mã nguồn file đích.
- ⚡ **Chạy Test, Cross-Audit, Giám sát Health Check & Báo cáo Telegram**:
  - *Model tối ưu*: **Gemini 2.5 Flash / Gemini 3.8 Flash**.
  - *Đặc tính*: Tốc độ siêu tốc, độ trễ thấp, định dạng mobile-first ngắn gọn không thừa thãi, tổng hợp kết quả test và đồng bộ timeline tức thì.

---

## 3. Recommended Output Templates for Telegram

### Mẫu 1: Pha 1 - Khảo sát & Lập Kế Hoạch (`TODO_CREATED` / `PLANNED`)
```markdown
📋 KẾ HOẠCH (TODO.MD SẴN SÀNG): [Tóm tắt 1 câu mục tiêu và phạm vi]

### 1. Bối cảnh & Nguyên nhân gốc (RCA)
• [Màn hình / Luồng]: [Mô tả ngắn bối cảnh thực tế]
• [Điểm chưa chuẩn]: [Đối chiếu ảnh chụp & mã nguồn hiện tại]

### 2. Kế hoạch triển khai (Action Checklist)
• Backend: [DTO, Service, Controller cần sửa]
• Frontend: [Component, Modal, Table cần sửa]
• Kiểm thử: [Kịch bản Playwright E2E cần bổ sung]

### 3. Tài liệu & Bằng chứng
▫️ Checklist TODO: [TODO.md](file:///d:/Projects/logistics-website/feedbacks/feedback_DD_MM_task_id/TODO.md)
▫️ Trạng thái: Sẵn sàng thực thi qua /force hoặc lịch trình tự động
```

### Mẫu 2: Pha 2 - Thực thi & Nghiệm thu Dev (`COMPLETED` / `DEV VERIFIED`)
```markdown
🟢 HOÀN THÀNH (DEV VERIFIED): [Tóm tắt 1 câu việc đã sửa và nghiệm thu]

### 1. Thay đổi chính
• [File/Component 1]: [Mô tả ngắn thay đổi]
• [File/Component 2]: [Mô tả ngắn thay đổi]

### 2. Kết quả kiểm tra
▫️ Backend: [LIVE / Test passed / API response time]
▫️ Frontend: [READY / Build passed / E2E verified]
▫️ Git Submodules: [Branch name, Commit hash, Clean status]
```
