# Workspace Guidelines & Rules (Logistics TMS Fullstack)

## Architecture Overview
- **Backend**: NestJS 11+ located in [`backend/`](file:///d:/Projects/logistics-website/backend) (PostgreSQL on Neon, TypeORM, Custom JWT Auth, Swagger).
- **Frontend**: Next.js 15+ located in [`frontend/`](file:///d:/Projects/logistics-website/frontend) (App Router, React 19, Tailwind CSS, TanStack Query, Zustand).

## Safety & Governance Rules (STRICT)
- **Secrets & Security**: NEVER commit/push `.env` files or credentials. Ensure secrets stay in `.env` (git-ignored).
- **MCP Config Files**: NEVER commit/push any MCP (Model Context Protocol) config files — these often contain API keys. Blocked patterns: `mcp.json`, `.mcp/`, `mcp_config.json`, `claude_desktop_config.json`, `.cursor/mcp.json`, `.gemini/mcp*.json`, `windsurf_mcp.json`, `codeium_mcp.json`, or any JSON/YAML with `"mcpServers"` key containing credentials.
- **DB Destructive Ops**: NEVER run `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, or `schema sync` (synchronize: true).
- **Schema & Migrations**: BEFORE modifying, renaming, or dropping existing DB columns/entities, analyze data impact, notify the user, and get explicit approval before generating/running migrations.
- **Git Safety**: NEVER run `git push --force` or push code without explicit user request.
- **Codebase Integrity**: DO NOT delete critical source folders or bypass error checks with silent fallbacks.

## Registered Skills & Agents

### Specialized Skills
- [`nestjs-best-practices`](file:///d:/Projects/logistics-website/.agents/skills/nestjs-best-practices/SKILL.md): Backend architecture, NestJS patterns, TypeORM migrations, DTOs, controllers, services.
- [`nextjs-best-practices`](file:///d:/Projects/logistics-website/.agents/skills/nextjs-best-practices/SKILL.md): Frontend App Router structure, React 19, Zustand stores, TanStack Query v5 API integration.
- [`ui-ux-flow-designer`](file:///d:/Projects/logistics-website/.agents/skills/ui-ux-flow-designer/SKILL.md): User flow analysis, wireframing, role-based interaction design (DISPATCHER, FLEET_MANAGER, WAREHOUSE_MANAGER, SUPER_ADMIN), UI layout architecture.
- [`e2e-test-runner`](file:///d:/Projects/logistics-website/.agents/skills/e2e-test-runner/SKILL.md): Playwright E2E orchestration – spawns 3 sub-agents: Console Health Inspector, Login Flow Tester, RBAC Route Guard Validator.
- [`git-commit-reviewer`](file:///d:/Projects/logistics-website/.agents/skills/git-commit-reviewer/SKILL.md): Safe commit flow – spawns 2 sub-agents: Security & Rule Auditor (blocks on violations), Commit Message Crafter (Conventional Commits). Commit only executes after audit gate passes.
- [`codebase-auditor`](file:///d:/Projects/logistics-website/.agents/skills/codebase-auditor/SKILL.md): Audit toàn bộ source base và cập nhật có phiên bản vào [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md). Dùng khi: khảo sát hệ thống, vừa hoàn thiện feature mới, chuẩn bị triển khai nghiệp vụ mới.

### Dedicated Subagents
- `ui-ux-designer`: Specialized subagent for analyzing user journeys, designing frontend UI component hierarchies, and mapping operational workflows.
- `e2e-orchestrator`: Spawns 3 parallel sub-agents to run Playwright E2E tests (console health, login flow, RBAC routing). Read [`e2e-test-runner`](file:///d:/Projects/logistics-website/.agents/skills/e2e-test-runner/SKILL.md) SKILL.md before orchestrating.
- `git-commit-agent`: Audits staged changes (security, secrets, conventions, DB safety) via 2 sub-agents, then commits with a Conventional Commit message. Read [`git-commit-reviewer`](file:///d:/Projects/logistics-website/.agents/skills/git-commit-reviewer/SKILL.md) SKILL.md before running.
