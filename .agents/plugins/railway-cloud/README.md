# Railway Cloud Infrastructure Plugin (`railway-cloud`)

Provides unified management, health checking, and deployment automation for the 5 core services hosted on **Railway Cloud** (`Logistics TMS - Spider Express`):
1. `frontend-tms-core` (Next.js 15 App Router)
2. `backend-tms-core` (NestJS 11 API + TypeORM)
3. `postgres-tms-core` (PostgreSQL `logistics_tms_core` & `n8n_automation`)
4. `redis-tms-core` (BullMQ & Cache)
5. `n8n-automation` (24/7 Workflow Engine)

## Included Components
- **Skill**: `railway-ops` (`skills/railway-ops/SKILL.md`)
- **Rules**: `rules/AGENTS.md` (Canonical Railway domains & Anti-Hang health check protocol)
