---
name: railway-deployment-auditor
description: Audit Spider Express Railway Dev and Production deployments by correlating merged Git commits, Railway service deployments, active cutover, and bounded HTTP health checks. Use when verifying a deploy, diagnosing a stale deployment, or deciding whether Cloud Dev E2E may start.
---

# Railway Deployment Auditor

Use this skill for deployment verification in `C:\Projects\logistics-website`. It is read-first: do not deploy, redeploy, restart, mutate variables, or modify databases while auditing unless the user explicitly requests that action.

## Canonical context

- Project ID: `32cad4c1-ce12-473c-9a5d-5b3c136d0ecb`
- Dev environment/branch: `dev`
- Production environment/branch: `master`
- Dev backend: `backend-tms-core`, health `https://backend-tms-core-dev.up.railway.app/api/v1/health`
- Dev frontend: `frontend-tms-core`, root `https://frontend-tms-core-dev.up.railway.app/`
- Production domains are documented in `.agents/rules/environments.md`.

Read `.env.railway` without printing values. Use `RAILWAY_DEV_TOKEN` for Dev and `RAILWAY_PROD_TOKEN` for Production. Never commit tokens, Railway config, or MCP credentials.

## MCP-first discovery

Use Railway MCP for platform reads when available:

1. Resolve the explicit project ID above.
2. Resolve the exact environment name.
3. List service instances and record service IDs; do not rely only on display-name matching.
4. Read latest and active deployments for backend and frontend.
5. If a named service is absent, report actual service names/IDs and stop. Do not infer absence from a stale linked project.

If MCP is unavailable, use the CLI or `scripts/verify-railway-deployment.mjs` with explicit context. A CLI/OAuth failure is `AUDIT_UNAVAILABLE`, never deploy success.

## Four readiness invariants

The verdict is `READY` only when all four hold for both app services:

1. `latestDeployment.meta.commitHash` matches the target submodule commit: `git -C backend rev-parse origin/dev` and `git -C frontend rev-parse origin/dev` for Dev, or `origin/master` for Production.
2. Latest deployment status is `SUCCESS`; `SLEEPING` is acceptable only after a bounded HTTP probe wakes it.
3. Latest deployment ID equals the active deployment ID.
4. Backend health is HTTP 200 and frontend root is HTTP 200/307, with a 15-second timeout.

HTTP 200 alone is insufficient because Railway Blue-Green can keep the old container active while the new deployment builds.

## Git and submodule correlation

Fetch target branches read-only before comparing commits. Compare Railway backend to the backend submodule SHA and Railway frontend to the frontend submodule SHA, not the root SHA. Confirm the root target branch points to those same submodule SHAs. If Git is newer than Railway, classify as `STALE_DEPLOYMENT`.

## Bounded fallback

Use `npm run railway:verify` for a single audit and `npm run railway:wait` for bounded polling. Direct probes must use `curl.exe -m 15 -sS -i`. Stop immediately on `FAILED` or `CRASHED`; do not run Cloud Dev Playwright until all four invariants pass.

## Required result

Report environment/project ID, resolved service names/IDs, expected/latest/active SHAs, deployment status/IDs, HTTP status, and one verdict: `READY`, `BUILDING`, `STALE_DEPLOYMENT`, `BUILD_FAILED`, `SERVICE_NOT_FOUND`, or `AUDIT_UNAVAILABLE`.
