# Railway Cloud Infrastructure Governance Rules

- **Authoritative Token Store Mandate (`.env.railway` Top Priority)**: The [`.env.railway`](file:///d:/Projects/logistics-website/.env.railway) file at the workspace root is the authoritative single source of truth for Railway project tokens (`RAILWAY_DEV_TOKEN` for dev, `RAILWAY_PROD_TOKEN` for production, `RAILWAY_AUTO_DEPLOY`). All agents, skills, and tools interacting with Railway MUST always inspect `.env.railway` first to determine the active project environment and authenticating credentials.
- **Primary Cloud Infrastructure Priority**: Railway Cloud (`Logistics TMS - Spider Express`, Project ID `32cad4c1-ce12-473c-9a5d-5b3c136d0ecb`) is the authoritative primary infrastructure for both `dev` and `production` environments.
- **Canonical Domains**:
  - **Dev Frontend**: `https://frontend-tms-core-dev.up.railway.app`
  - **Dev Backend**: `https://backend-tms-core-dev.up.railway.app` (`/api/v1/health`, `/docs`)
  - **Pro Frontend**: `https://frontend-tms-core-production.up.railway.app`
  - **Pro Backend**: `https://backend-tms-core-production.up.railway.app` (`/api/v1/health`, `/docs`)
  - **Automation Engine (n8n)**: `https://n8n-automation-production-d298.up.railway.app`
- **Anti-Hang Health Check Mandate**: Always use `curl.exe -m 15 -sS -i <url>` or `Invoke-WebRequest -TimeoutSec 15` when checking Railway service health. Never run unbounded network polls; cap readiness polling at a maximum of 5 attempts with 15-20s backoff.
- **Environment Variable Safety**: Never hardcode or commit `.env.railway` tokens (`RAILWAY_DEV_TOKEN`, `RAILWAY_PROD_TOKEN`) into tracked source files.
