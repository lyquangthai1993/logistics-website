# Canonical Environments & Deployment Domains

## 1. Development Environment ("domain dev")
Whenever the term **"domain dev"** or "môi trường dev" is mentioned, prioritize **Railway Cloud (Primary)**:

- **Frontend Dev (Primary - Railway)**: `https://frontend-tms-core-dev.up.railway.app` (Branch `dev`)
  - Auth Sign-In: `https://frontend-tms-core-dev.up.railway.app/auth/sign-in`
  - Dashboard: `https://frontend-tms-core-dev.up.railway.app/dashboard`
- **Backend Dev (Primary - Railway)**: `https://backend-tms-core-dev.up.railway.app` (Branch `dev`)
  - Swagger API Documentation: `https://backend-tms-core-dev.up.railway.app/docs`
  - Health Check: `https://backend-tms-core-dev.up.railway.app/api/v1/health`
- *Secondary / Fallback (Vercel & Render)*:
  - Frontend Dev: `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app`
  - Backend Dev: `https://logistics-website-backend-1jho.onrender.com`

---

## 2. Production Environment ("domain pro" / "domain prod")
Whenever the term **"domain pro"**, "domain prod", or "môi trường pro / production" is mentioned, prioritize **Railway Cloud (Primary)**:

- **Frontend Pro (Primary - Railway)**: `https://frontend-tms-core-production.up.railway.app` (Branch `master`)
  - Auth Sign-In: `https://frontend-tms-core-production.up.railway.app/auth/sign-in`
  - Dashboard: `https://frontend-tms-core-production.up.railway.app/dashboard`
- **Backend Pro (Primary - Railway)**: `https://backend-tms-core-production.up.railway.app` (Branch `master`)
  - Swagger API Documentation: `https://backend-tms-core-production.up.railway.app/docs`
  - Health Check: `https://backend-tms-core-production.up.railway.app/api/v1/health`
- **Cloud Automation / Worker (Railway)**: `https://n8n-automation-production-d298.up.railway.app`
- *Secondary / Fallback (Vercel & Render)*:
  - Frontend Pro: `https://logistics-website-frontend-kappa.vercel.app`
  - Backend Pro: `https://logistics-website-backend-1.onrender.com`
