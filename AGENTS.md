# Workspace Guidelines & Rules (Logistics TMS Fullstack)

## Architecture Overview
- **Backend**: NestJS 11+ located in [`backend/`](file:///d:/Projects/logistics-website/backend) (PostgreSQL on Neon, TypeORM, Custom JWT Auth, Swagger) — **Independent Git Submodule** (`logistics-website-backend`).
- **Frontend**: Next.js 15+ located in [`frontend/`](file:///d:/Projects/logistics-website/frontend) (App Router, React 19, Tailwind CSS, TanStack Query, Zustand) — **Independent Git Submodule** (`logistics-website-frontend`).
- **Git Submodules Rule**: Root repo (`logistics-website`), `backend/`, and `frontend/` are 3 independent Git repositories. When creating a feature branch or committing code, you MUST create branches and commit **directly inside the corresponding submodule** (`backend/` and/or `frontend/`), never only at the root repository.

## Safety & Governance Rules (STRICT)
- **Language Policy**: Skill and agent guideline documentation MUST be written in English to minimize token consumption and maximize context efficiency.
- **Secrets & Security**: NEVER commit/push `.env` files or credentials. Ensure secrets stay in `.env` (git-ignored).
- **MCP Config Files**: NEVER commit/push any MCP (Model Context Protocol) config files — these often contain API keys. Blocked patterns: `mcp.json`, `.mcp/`, `mcp_config.json`, `claude_desktop_config.json`, `.cursor/mcp.json`, `.gemini/mcp*.json`, `windsurf_mcp.json`, `codeium_mcp.json`, or any JSON/YAML with `"mcpServers"` key containing credentials.
- **DB Destructive Ops**: NEVER run `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, or `schema sync` (synchronize: true).
- **Schema & Migrations**: BEFORE modifying, renaming, or dropping existing DB columns/entities, analyze data impact, notify the user, and get explicit approval before generating/running migrations.
- **Git Safety**: NEVER run `git push --force` or push code without explicit user request.
- **Codebase Integrity**: DO NOT delete critical source folders or bypass error checks with silent fallbacks.
- **RBAC Compliance**: Before adding/modifying any endpoint or menu, MUST reference [`rbac-matrix.md`](file:///d:/Projects/logistics-website/.agents/rules/rbac-matrix.md) — the system's authoritative permission matrix. Ensure all 3 layers are updated: Sidebar UI, Route Guard, API Guard.

## Model Selection Strategy & Guidelines
- 💻 **Code Development & Bug Fixing**: Prefer **Claude** (Claude Sonnet) for feature coding, refactoring, and complex logic tasks on both Backend and Frontend.
- 📝 **Testing, Docs & Audit**: Prefer **Gemini** (Gemini 2.5 Pro / Flash) for E2E / Unit tests, documentation/README, codebase audits, and log summarization.

## Registered Skills & Agents

### Specialized Skills
- [`tms-domain-lead`](file:///d:/Projects/logistics-website/.agents/skills/tms-domain-lead/SKILL.md): **[READ FIRST]** Business domain Team Lead — single source of truth for dispatch flows, role permissions, and notification matrix (who gets notified when). MANDATORY activation before implementing status transitions, notifications, or any new business feature.
- [`nestjs-best-practices`](file:///d:/Projects/logistics-website/.agents/skills/nestjs-best-practices/SKILL.md): Backend architecture, NestJS patterns, TypeORM migrations, DTOs, controllers, services. Decides **how** (technical) — not **what/who** (business logic).
- [`nextjs-best-practices`](file:///d:/Projects/logistics-website/.agents/skills/nextjs-best-practices/SKILL.md): Frontend App Router structure, React 19, Zustand stores, TanStack Query v5 API integration.
- [`ui-ux-flow-designer`](file:///d:/Projects/logistics-website/.agents/skills/ui-ux-flow-designer/SKILL.md): User flow analysis, wireframing, role-based interaction design (DISPATCHER, FLEET_MANAGER, WAREHOUSE_MANAGER, SUPER_ADMIN), UI layout architecture.
- [`e2e-test-runner`](file:///d:/Projects/logistics-website/.agents/skills/e2e-test-runner/SKILL.md): Playwright E2E orchestration – spawns 3 sub-agents: Console Health Inspector, Login Flow Tester, RBAC Route Guard Validator.
- [`git-commit-reviewer`](file:///d:/Projects/logistics-website/.agents/skills/git-commit-reviewer/SKILL.md): Safe commit flow – spawns 2 sub-agents: Security & Rule Auditor (blocks on violations), Commit Message Crafter (Conventional Commits). Commit only executes after audit gate passes.
- [`codebase-auditor`](file:///d:/Projects/logistics-website/.agents/skills/codebase-auditor/SKILL.md): Audits the full source base and updates versioned entries in [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md). Use when surveying the system, after completing a new feature, or before deploying new business functionality.
- [`tanstack-optimistic-updates`](file:///d:/Projects/logistics-website/.agents/skills/tanstack-optimistic-updates/SKILL.md): Production-ready Optimistic UI Updates, direct cache mutations (`setQueriesData`), and WebSocket real-time cache injection for TanStack Query v5 + React 19.
- [`feature-branch-advisor`](file:///d:/Projects/logistics-website/.agents/skills/feature-branch-advisor/SKILL.md): Evaluates new tasks and proposes a Git feature branch (`feature/scope-name`) when impact score >= 6. Triggers on: new module, new entity, API changes, RBAC changes, 3+ files affected, or breaking changes. Presents proposal and waits for user confirmation before creating the branch.
- [`pencil-ui-converter`](file:///d:/Projects/logistics-website/.agents/skills/pencil-ui-converter/SKILL.md): Dedicated agent & skill for converting live Web / Next.js UIs and authoring vector UI/UX canvas designs directly via Pencil MCP. Operates strictly inside `pencil-workspace/pens/` with automatic file save & disk synchronization on every edit.

### Dedicated Subagents
- `ui-ux-designer`: Specialized subagent for analyzing user journeys, designing frontend UI component hierarchies, and mapping operational workflows.
- `pencil-ui-converter`: Specialized subagent for converting existing web/Next.js UIs into editable `.pen` canvas layers and designing vector UI/UX components using Pencil MCP tools strictly inside `pencil-workspace/`.
- `e2e-orchestrator`: Spawns 3 parallel sub-agents to run Playwright E2E tests (console health, login flow, RBAC routing). Read [`e2e-test-runner`](file:///d:/Projects/logistics-website/.agents/skills/e2e-test-runner/SKILL.md) SKILL.md before orchestrating.
- `git-commit-agent`: Audits staged changes (security, secrets, conventions, DB safety) via 2 sub-agents, then commits with a Conventional Commit message. Read [`git-commit-reviewer`](file:///d:/Projects/logistics-website/.agents/skills/git-commit-reviewer/SKILL.md) SKILL.md before running.
- `feature-branch-agent`: Reads [`feature-branch-advisor`](file:///d:/Projects/logistics-website/.agents/skills/feature-branch-advisor/SKILL.md) SKILL.md, scores the task impact, presents branch proposal with name suggestion, and creates the branch after user confirmation.
