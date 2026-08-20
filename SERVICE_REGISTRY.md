# 📦 SERVICE REGISTRY — Logistics TMS
> **Version**: 1.1 | **Last Updated**: 2026-08-17 | **Maintainer**: Thai Ly (`lyquangthai1993`)
>
> Đây là **source of truth** cho toàn bộ service URLs, IDs, môi trường, và cấu hình deploy của hệ thống Logistics TMS.
> Agents và developers phải đọc file này trước khi thao tác với bất kỳ service nào.

---

## 🗺️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Push → Auto Deploy                                          │
│                                                                     │
│  [frontend] branch: dev    ──→  Vercel Preview   ──→  preview URL  │
│  [frontend] branch: master ──→  Vercel Production ──→  prod URL    │
│                                                                     │
│  [backend]  branch: dev    ──→  Render Dev env   ──→  *-1jho URL   │
│  [backend]  branch: master ──→  Render Prod env  ──→  *-1 URL      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 QUICK REFERENCE — URLs quan trọng nhất

| Môi trường | Frontend | Backend API |
|---|---|---|
| **Local Dev** | `http://localhost:3000` | `http://localhost:3001` |
| **Dev / Preview** | https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app | https://logistics-website-backend-1jho.onrender.com |
| **Production** | https://logistics-website-frontend-kappa.vercel.app | https://logistics-website-backend-1.onrender.com |

---

## 🌐 FRONTEND — Vercel

### Thông tin project

| Field | Value |
|---|---|
| **Platform** | Vercel |
| **Project Name** | `logistics-website-frontend` |
| **Project ID** | `prj_yzcThSGsAgp6Jgwoqy83cT1jG4G0` |
| **Team Slug** | `thai-lys-projects` |
| **Team ID** | `team_LcFnlhAyUwPhYBQZJeV7jNMc` |
| **Framework** | Next.js 15+ (App Router) |
| **Node Version** | 24.x |
| **Bundler** | Turbopack |
| **Build Command** | `npm run build` |

### GitHub Repository

| Field | Value |
|---|---|
| **URL** | https://github.com/lyquangthai1993/logistics-website-frontend |
| **Org** | `lyquangthai1993` |
| **Repo ID** | `1335601645` |
| **Branch Production** | `master` |
| **Branch Dev** | `dev` |

### Dashboard & Deploy Links

| Link | URL |
|---|---|
| **Vercel Project Dashboard** | https://vercel.com/thai-lys-projects/logistics-website-frontend |
| **Latest Production Deploy** | https://vercel.com/thai-lys-projects/logistics-website-frontend/G6DadHTXfz7nYyqzuR17GLe2nCky |
| **Deploy ID (latest prod)** | `dpl_G6DadHTXfz7nYyqzuR17GLe2nCky` |

### URLs theo môi trường

| Môi trường | Vercel Target | Branch | URL | Status |
|---|---|---|---|---|
| **Production** | `production` | `master` | https://logistics-website-frontend-kappa.vercel.app | ✅ READY |
| **Production** (alias 2) | `production` | `master` | https://logistics-website-frontend-thai-lys-projects.vercel.app | ✅ READY |
| **Dev / Preview** | `preview` | `dev` | https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app | ✅ Auto-deploy |

### Environment Variables (Vercel)

| Variable | `development` (local) | `preview` (branch dev) | `production` (branch master) |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://logistics-website-backend-1jho.onrender.com` | `https://logistics-website-backend-1.onrender.com` |

---

## ⚙️ BACKEND — Render

### Thông tin workspace

| Field | Value |
|---|---|
| **Platform** | Render |
| **Workspace Name** | `Thai Ly's Workspace` |
| **Workspace ID** | `tea-cspp8dd6l47c73cttps0` |
| **Owner Email** | lyquangthai1993@gmail.com |
| **Render Dashboard** | https://dashboard.render.com |

### GitHub Repository

| Field | Value |
|---|---|
| **URL** | https://github.com/lyquangthai1993/logistics-website-backend |
| **Org** | `lyquangthai1993` |
| **Branch Production** | `master` |
| **Branch Dev** | `dev` |
| **Dockerfile (dev & prod)** | `./Dockerfile.prod` |
| **Docker Context** | `.` |

---

### 🟢 Dev Environment (Render)

| Field | Value |
|---|---|
| **Render Environment** | Development |
| **Service Name** | `logistics-website-backend` |
| **Service ID** | `srv-da1ae1c9v7es73auqd40` |
| **Environment ID** | `evm-da19a07lk1mc739glr4g` |
| **Branch** | `dev` |
| **Dockerfile** | `./Dockerfile.prod` ✅ |
| **Startup Script** | `startup.prod.sh` |
| **Region** | Singapore (`sin`) |
| **Plan** | Free |
| **Auto Deploy** | Yes — on push to `dev` |
| **Status** | ✅ Deployed |

| Link | URL |
|---|---|
| **Public API URL** | https://logistics-website-backend-1jho.onrender.com |
| **API Base Path** | https://logistics-website-backend-1jho.onrender.com/api/v1 |
| **Swagger / API Docs** | https://logistics-website-backend-1jho.onrender.com/docs |
| **Render Dashboard** | https://dashboard.render.com/web/srv-da1ae1c9v7es73auqd40 |
| **SSH** | `srv-da1ae1c9v7es73auqd40@ssh.singapore.render.com` |

---

### 🔴 Production Environment (Render)

| Field | Value |
|---|---|
| **Render Environment** | Production |
| **Service Name** | `logistics-website-backend-1` |
| **Service ID** | `srv-da1db0vqj5pc73cpakr0` |
| **Environment ID** | `evm-da1d6u0jo6nc738dsttg` |
| **Branch** | `master` |
| **Dockerfile** | ⚠️ Hiện là `./Dockerfile` — **cần đổi → `./Dockerfile.prod`** |
| **Startup Script** | `startup.prod.sh` (sau khi đổi Dockerfile) |
| **Region** | Singapore (`sin`) |
| **Plan** | Free |
| **Auto Deploy** | Yes — on push to `master` |
| **Status** | ⚠️ Deploy lỗi — đang fix Dockerfile |

| Link | URL |
|---|---|
| **Public API URL** | https://logistics-website-backend-1.onrender.com |
| **API Base Path** | https://logistics-website-backend-1.onrender.com/api/v1 |
| **Swagger / API Docs** | https://logistics-website-backend-1.onrender.com/docs |
| **Render Dashboard** | https://dashboard.render.com/web/srv-da1db0vqj5pc73cpakr0 |
| **Settings (fix Dockerfile)** | https://dashboard.render.com/web/srv-da1db0vqj5pc73cpakr0/settings |
| **SSH** | `srv-da1db0vqj5pc73cpakr0@ssh.singapore.render.com` |

#### Environment Variables đã set trên Render Production

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `API_PREFIX` | `api` |
| `DATABASE_URL` | `postgresql://neondb_owner:***@ep-young-moon-aoq5qcwm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_SYNCHRONIZE` | `false` |
| `DATABASE_MAX_CONNECTIONS` | `10` |
| `DATABASE_SSL_ENABLED` | `true` |
| `DATABASE_REJECT_UNAUTHORIZED` | `false` |
| `BACKEND_DOMAIN` | `https://logistics-website-backend-1.onrender.com` |
| `FRONTEND_DOMAIN` | `https://logistics-website-frontend-kappa.vercel.app` |
| `APP_CORS_ORIGINS` | `https://logistics-website-frontend-kappa.vercel.app, https://...-git-dev-thai-lys-projects.vercel.app` |
| `FILE_DRIVER` | `s3` |
| `AWS_S3_REGION` | `ap-southeast-1` |
| `AUTH_*_EXPIRES_IN` | (theo chuẩn) |
| `AUTH_UNIFORM_ERRORS` | `true` |
| ⚠️ `AUTH_JWT_SECRET` | **Chưa set** — cần thêm thủ công |
| ⚠️ `AUTH_REFRESH_SECRET` | **Chưa set** — cần thêm thủ công |
| ⚠️ `AUTH_FORGOT_SECRET` | **Chưa set** — cần thêm thủ công |
| ⚠️ `AUTH_CONFIRM_EMAIL_SECRET` | **Chưa set** — cần thêm thủ công |
| ⚠️ `ACCESS_KEY_ID` | **Chưa set** — Supabase S3 |
| ⚠️ `SECRET_ACCESS_KEY` | **Chưa set** — Supabase S3 |
| ⚠️ `AWS_DEFAULT_S3_BUCKET` | **Chưa set** |
| ⚠️ `AWS_S3_ENDPOINT` | **Chưa set** |
| ⚠️ `AWS_S3_PUBLIC_URL` | **Chưa set** |
| ⚠️ `WORKER_HOST` | **Chưa set** — Upstash Redis URL |
| ⚠️ `RESEND_API_KEY` | **Chưa set** — Resend API Key (`re_...`) cho gửi email giao dịch |

---

## 🗄️ DATABASE — Neon PostgreSQL

| Môi trường | Host | Database | Status |
|---|---|---|---|
| **Dev** | `ep-young-moon-aoq5qcwm-pooler.c-2.ap-southeast-1.aws.neon.tech` | `neondb` | ✅ Active |
| **Production** | *(dùng chung DB dev hiện tại)* | `neondb` | ⚠️ Nên tách riêng |

> **Neon Console**: https://console.neon.tech
>
> Connection string format:
> ```
> postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require&channel_binding=require
> ```

---

## 🐳 Docker — Cấu hình quan trọng

| File | Dùng cho | CMD | DB connection |
|---|---|---|---|
| `Dockerfile` | ❌ Local Docker Compose only | `startup.relational.dev.sh` → `wait-for-it.sh postgres:5432` | Local container |
| `Dockerfile.prod` | ✅ Render (dev & prod) | `startup.prod.sh` | Qua `DATABASE_URL` env var (Neon) |

> ⚠️ **QUAN TRỌNG**: Render services phải luôn dùng `./Dockerfile.prod`. `./Dockerfile` chỉ dành cho local `docker-compose`.

---

## 📊 Trạng thái tổng hợp (2026-08-17)

| Hạng mục | Status | Ghi chú |
|---|---|---|
| GitHub backend branch `dev` | ✅ Tạo xong | Push từ `master` |
| Render Dev — branch `dev` | ✅ Done | `srv-da1ae1c9v7es73auqd40` |
| Render Dev — Deployed | ✅ Running | `https://logistics-website-backend-1jho.onrender.com` |
| Render Prod — branch `master` | ✅ Done | `srv-da1db0vqj5pc73cpakr0` |
| Render Prod — Env vars | ✅ Set | `DATABASE_URL`, `CORS`, `DOMAIN` đã có |
| Render Prod — Dockerfile | ⚠️ **Cần sửa** | Đổi `./Dockerfile` → `./Dockerfile.prod` |
| Render Prod — JWT/S3/Redis secrets | ⚠️ **Chưa set** | Cần thêm thủ công |
| Vercel env vars — tách 3 môi trường | ✅ Done | Production / Preview / Development |
| Vercel Production `NEXT_PUBLIC_API_URL` | ✅ Done | Trỏ đúng Render Prod URL |
| Vercel Preview `NEXT_PUBLIC_API_URL` | ✅ Done | Trỏ đúng Render Dev URL |
| Vercel Production — Deploy | ✅ READY | `dpl_G6DadHTXfz7nYyqzuR17GLe2nCky` |
| Vercel Preview — Auto Deploy | ✅ Active | Mỗi push vào `dev` tự trigger |

---

## 🔧 Pending Actions (còn lại)

### 1. Render Production — Đổi Dockerfile path
> Dashboard: https://dashboard.render.com/web/srv-da1db0vqj5pc73cpakr0/settings
>
> **Dockerfile Path**: `./Dockerfile` → `./Dockerfile.prod` → Save → Redeploy

### 2. Render Production — Set secrets còn thiếu
Vào **Environment** tab của service production, thêm:
```
AUTH_JWT_SECRET         = <random 64-char string>
AUTH_REFRESH_SECRET     = <random 64-char string>
AUTH_FORGOT_SECRET      = <random 64-char string>
AUTH_CONFIRM_EMAIL_SECRET = <random 64-char string>
ACCESS_KEY_ID           = <supabase s3 access key>
SECRET_ACCESS_KEY       = <supabase s3 secret key>
AWS_DEFAULT_S3_BUCKET   = logistics-media
AWS_S3_ENDPOINT         = https://<ref>.supabase.co/storage/v1/s3
AWS_S3_PUBLIC_URL       = https://<ref>.supabase.co/storage/v1/object/public/logistics-media
WORKER_HOST             = <upstash redis URL rediss://...>
```

### 3. (Optional) Tách Neon DB Production
Tạo Neon project/branch riêng cho production tại https://console.neon.tech
→ Cập nhật `DATABASE_URL` trong Render Production service

---

## 🔗 All Dashboard Links

| Service | Dashboard | Public URL |
|---|---|---|
| **Vercel Frontend** | https://vercel.com/thai-lys-projects/logistics-website-frontend | https://logistics-website-frontend-kappa.vercel.app |
| **Render Dev Backend** | https://dashboard.render.com/web/srv-da1ae1c9v7es73auqd40 | https://logistics-website-backend-1jho.onrender.com |
| **Render Prod Backend** | https://dashboard.render.com/web/srv-da1db0vqj5pc73cpakr0 | https://logistics-website-backend-1.onrender.com |
| **GitHub Frontend** | https://github.com/lyquangthai1993/logistics-website-frontend | — |
| **GitHub Backend** | https://github.com/lyquangthai1993/logistics-website-backend | — |
| **Neon Console** | https://console.neon.tech | — |
| **Supabase Storage** | https://supabase.com/dashboard | — |
| **Upstash Redis** | https://console.upstash.com | — |
