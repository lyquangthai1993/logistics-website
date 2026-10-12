# Railway Deployment Technical Memory & Account Configuration
*(Biên niên sử & Ký ức kỹ thuật hạ tầng Railway — Logistics TMS)*

## 1. Thông Tin Tài Khoản Vận Hành (Authoritative Account Invariant)
- **Tài khoản chính thức triển khai**: `congduc992@gmail.com`
- **Tài khoản cá nhân / developer cũ**: `lyquangthai1993@gmail.com`
- **Trạng thái tài khoản**: Gói **Trial 30 ngày** (Tối ưu hóa trọn vẹn 5/5 services, không phát sinh chi phí).
- **Project Name**: `Logistics TMS - Spider Express` (Project ID: `32cad4c1-ce12-473c-9a5d-5b3c136d0ecb`)

---

## 2. Danh Mục 5 Dịch Vụ Chuẩn Hóa Trên Railway (10/10 Online)

| STT | Tên Dịch Vụ | Phân Loại | Trạng Thái Dev | Trạng Thái Production | Ghi Chú Kỹ Thuật |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **`postgres-tms-core`** | Database Server | 🟢 **Online** | 🟢 **Online** | Persistent Volume mounted `/var/lib/postgresql/data`. Chứa 2 database độc lập: `logistics_tms_core` và `n8n_automation`. |
| 2 | **`n8n-automation`** | Automation Engine | 🟢 **Online** | 🟢 **Online** | Docker `n8nio/n8n:latest`, kết nối trực tiếp database `n8n_automation`, chạy 24/7 không ngủ đông. |
| 3 | **`redis-tms-core`** | Cache / Queue | 🟢 **Online** | 🟢 **Online** | Redis 7 Alpine phục vụ BullMQ & Caching. |
| 4 | **`backend-tms-core`** | NestJS API | 🟢 **Online** | 🟢 **Online** | Chạy NestJS 11+, TypeORM, kết nối `logistics_tms_core`. |
| 5 | **`frontend-tms-core`** | Next.js UI | 🟢 **Online** | 🟢 **Online** | Next.js 15 Standalone App Router. |

---

## 3. Bản Đồ Môi Trường & Domain Truy Cập (Environments Mapping)

### A. Môi Trường Production (`d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff`)
* **n8n Automation Web UI**: `https://n8n-automation-production-d298.up.railway.app`
* **Frontend Production**: `https://frontend-tms-core-production.up.railway.app`
* **Backend Production**: `https://backend-tms-core-production.up.railway.app`
* **Swagger API Docs (Pro)**: `https://backend-tms-core-production.up.railway.app/docs`
* **PostgreSQL Private Mesh**: `postgres-tms-core.railway.internal:5432`
  - TMS Database: `logistics_tms_core`
  - n8n Database: `n8n_automation`
* **PostgreSQL Public TCP Proxy**: `caboose.proxy.rlwy.net:59375`
* **Project Deploy Token (CLI)**: `d091b508-858a-41e2-a65f-e0b76792e2e3`

### B. Môi Trường Development - DEV (`9ecf5f52-2312-4be3-bb0f-bab6889f94cc`)
* **n8n Automation Web UI (Dev)**: `https://n8n-automation-dev.up.railway.app`
* **Frontend Dev**: `https://frontend-tms-core-dev.up.railway.app`
* **Backend Dev**: `https://backend-tms-core-dev.up.railway.app`
* **Swagger API Docs (Dev)**: `https://backend-tms-core-dev.up.railway.app/docs`
* **PostgreSQL Private Mesh (Dev)**: `postgres-tms-core.railway.internal:5432`
* **PostgreSQL Public TCP Proxy (Dev)**: `junction.proxy.rlwy.net:31094`
* **Project Deploy Token (CLI - Dev)**: `06657e8b-b62a-4bbd-aac7-2617f85aa058`

---

## 4. Cấu Hình Telegram Bot / Worker
- **Bot Token**: `8676574641:AAGKfr1V4sZVA4DSooyIvfziggvUGS-7HyE`
- **Allowed Chat ID**: `-5509877448`
- **Database Queue Connection (Railway)**:
  `postgresql://postgres:logistics_tms_2026_pwd@caboose.proxy.rlwy.net:59375/n8n_automation`
