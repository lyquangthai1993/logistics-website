---
name: railway-ops
description: Manage, deploy, health-check, and inspect Railway Cloud services (backend-tms-core, frontend-tms-core, postgres-tms-core, redis-tms-core, n8n-automation) across Dev and Production environments for Spider Express Logistics TMS. Activate when checking cloud deployment status, triggering Railway deployments, inspecting Railway logs/variables, or verifying Gate 2 Cloud Dev readiness.
---

# Railway Cloud Operations (`railway-ops`)

This skill governs operations on the **Railway Cloud** infrastructure for Spider Express Logistics TMS (`Project ID: 32cad4c1-ce12-473c-9a5d-5b3c136d0ecb`).

## 1. Top-Priority Mandate: `.env.railway` Authoritative Token & Environment Store

> [!IMPORTANT]
> **Authoritative Environment Tokens (`.env.railway`)**:
> The `.env.railway` file located at the workspace root is the **SINGLE SOURCE OF TRUTH** for Railway authentication tokens and environment context.
> Whenever performing any Railway operation (deployments, variable inspection, proxy checks, service logs, health audits):
> 1. **Always inspect `.env.railway` first**:
>    - `RAILWAY_DEV_TOKEN`: Project token for **Dev** environment (`dev` branch, services `*-dev`).
>    - `RAILWAY_PROD_TOKEN`: Project token for **Production** environment (`master` branch, services `*-production`).
>    - `RAILWAY_AUTO_DEPLOY`: Deployment toggle (`true` / `false`).
> 2. **Never commit `.env.railway`**: Keep tokens strictly in local `.env.railway` (git-ignored).
> 3. **Environment Resolution**: Use `RAILWAY_DEV_TOKEN` when working on or verifying `dev`, and `RAILWAY_PROD_TOKEN` when verifying `production`. Deployment tooling ([`scripts/railway-deploy.mjs`](file:///d:/Projects/logistics-website/scripts/railway-deploy.mjs)) automatically reads `.env.railway`.

## 2. Service & Environment Topology

| Service Name | Role | Dev Domain / Endpoint | Production Domain / Endpoint |
| :--- | :--- | :--- | :--- |
| `frontend-tms-core` | Next.js 15 App Router UI | `https://frontend-tms-core-dev.up.railway.app` | `https://frontend-tms-core-production.up.railway.app` |
| `backend-tms-core` | NestJS 11 REST API | `https://backend-tms-core-dev.up.railway.app` | `https://backend-tms-core-production.up.railway.app` |
| `n8n-automation` | Workflow Orchestrator | `https://n8n-automation-dev.up.railway.app` | `https://n8n-automation-production-d298.up.railway.app` |
| `postgres-tms-core` | PostgreSQL 16 (`logistics_tms_core`, `n8n_automation`) | `junction.proxy.rlwy.net:31094` | `caboose.proxy.rlwy.net:59375` |
| `redis-tms-core` | Redis 7 Alpine (BullMQ/Cache) | Internal Mesh | Internal Mesh |

## 3. Tier-2 Build, Commit SHA & Cutover Gate (`verify-railway-deployment.mjs`)

> [!CAUTION]
> **Why HTTP 200 Alone is Insufficient**:
> Railway uses Blue-Green zero-downtime deployment. While a newly pushed commit is in `QUEUED` / `INITIALIZING` / `BUILDING` / `DEPLOYING` state (taking 60–120s), the **old container** stays in `activeDeployments` and continues returning `HTTP 200 OK` on `/api/v1/health`. Running Playwright E2E before checking the build status tests the **old code**!

Before running Tier-2 Playwright E2E tests on Railway (or after merging a PR into `dev` / `master`), **ALWAYS** run [`scripts/verify-railway-deployment.mjs`](file:///d:/Projects/logistics-website/scripts/verify-railway-deployment.mjs) to verify all **4 Strict Readiness Invariants**:
1. **Commit SHA Alignment**: `latestDeployment.meta.commitHash` matches `git -C <submodule> rev-parse origin/<branch>`.
2. **Build Status === `SUCCESS`**: `latestDeployment.status === 'SUCCESS'` (or woken from Serverless `SLEEPING`). Fails fast (`exit 1`) if `FAILED` / `CRASHED`.
3. **Active Container Cutover**: `activeDeployments[0].id === latestDeployment.id` (confirming traffic is routed to the newly built container).
4. **Live HTTP Health 200 OK**: Both Backend (`/api/v1/health`) and Frontend (`/`) respond with HTTP 200/307.

```powershell
# 1. Single-shot verification on Dev (< 8s)
npm run railway:verify
# or: node scripts/verify-railway-deployment.mjs

# 2. Bounded wait until new Dev build reaches SUCCESS & Cutover (up to 5 attempts x 15s)
npm run railway:wait
# or: node scripts/verify-railway-deployment.mjs --wait

# 3. Verify Production environment (master branch)
npm run railway:verify:prod
npm run railway:wait:prod
```

*Note*: The PreToolUse hook ([`scripts/hooks/pre-command-guard.mjs`](file:///d:/Projects/logistics-website/scripts/hooks/pre-command-guard.mjs)) automatically executes `checkRailwayDeploymentReady` and **BLOCKS (`deny`)** any `playwright test` command targeting `*.up.railway.app` if the new deployment on Railway is still building or has not cut over!

## 4. Fast HTTP Health Check Runbook (Bounded Timeout)

When probing HTTP endpoints directly, always use bounded 15-second timeouts (`WaitMsBeforeAsync: 10000`):

```powershell
# Check Dev Environment Health
curl.exe -m 15 -sS -i https://backend-tms-core-dev.up.railway.app/api/v1/health
curl.exe -m 15 -sS -I https://frontend-tms-core-dev.up.railway.app/vi/login

# Check Production Environment Health
curl.exe -m 15 -sS -i https://backend-tms-core-production.up.railway.app/api/v1/health
curl.exe -m 15 -sS -I https://frontend-tms-core-production.up.railway.app/vi/login
```

## 5. Triggering Railway Deployments

Use the repository's automated deployment script [`scripts/railway-deploy.mjs`](file:///d:/Projects/logistics-website/scripts/railway-deploy.mjs):

```powershell
# Auto-detect modified submodule (backend / frontend / both) and deploy
node scripts/railway-deploy.mjs auto --force

# Deploy specific service
node scripts/railway-deploy.mjs backend --force
node scripts/railway-deploy.mjs frontend --force
```

## 6. Inspecting Variables, Proxies & Service State

Use the existing Python management scripts in `scripts/` for GraphQL API inspection:
- Inspect Dev environment configuration: `python scripts/inspect_dev_env.py`
- Inspect PostgreSQL TCP proxies: `python scripts/get_pg_proxy.py`
- Sync/Update application variables: `python scripts/set_dev_variables.py` or `python scripts/set_app_variables.py`
- Full reference memory: [`docs/railway_guide/RAILWAY_DEPLOYMENT_MEMORY.md`](file:///d:/Projects/logistics-website/docs/railway_guide/RAILWAY_DEPLOYMENT_MEMORY.md)

## 7. Database Synchronization (Production -> Dev)

Use the dedicated synchronization script [`scripts/railway-db-sync.mjs`](file:///d:/Projects/logistics-website/scripts/railway-db-sync.mjs):

```powershell
# 1. Full Synchronization (Auto-backup Dev -> Dump Prod -> Restore Dev -> Realignment sequences -> Row-count Parity verify)
npm run db:sync:prod-to-dev
# hoặc: node scripts/railway-db-sync.mjs

# 2. Fast Sync (Bỏ qua bước sao lưu Dev để đồng bộ siêu tốc ~10s)
node scripts/railway-db-sync.mjs --skip-backup

# 3. Dump Only (Chỉ trích xuất bản sao Production lưu vào backups/)
npm run db:dump:prod
# hoặc: node scripts/railway-db-sync.mjs --dump-only

# 4. Partial Sync (Chỉ đồng bộ các bảng chỉ định)
node scripts/railway-db-sync.mjs --tables=order,trip,trip_stop
```
