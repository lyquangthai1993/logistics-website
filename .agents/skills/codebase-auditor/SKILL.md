---
name: codebase-auditor
description: >-
  Kiểm tra, tổng hợp, và cập nhật biên bản CODEBASE_AUDIT.md khi có module mới,
  tính năng mới, migration mới hoặc thay đổi nghiệp vụ trong dự án Logistics TMS.
  Dùng khi: (1) vừa hoàn thiện một feature mới, (2) cần biết hệ thống đang có gì,
  (3) chuẩn bị triển khai nghiệp vụ mới và cần cập nhật version biên bản.
---

# Codebase Auditor Skill — Logistics TMS

Skill này hướng dẫn agent thực hiện **audit source base** và **cập nhật có phiên bản**
vào file [`CODEBASE_AUDIT.md`](file:///d:/Projects/logistics-website/CODEBASE_AUDIT.md) tại root project.

---

## Khi nào dùng skill này?

- Khi user yêu cầu "hệ thống đang có gì", "tổng hợp source base", "rà soát codebase"
- Khi vừa hoàn thiện một module/feature mới và cần ghi nhận vào biên bản
- Khi chuẩn bị xây dựng nghiệp vụ mới và cần nắm trạng thái hiện tại
- Khi cần bump version trong CODEBASE_AUDIT.md sau một sprint / deployment

---

## Quy trình thực hiện

### Bước 1 — Xác định chế độ

Xác định user muốn làm gì:

| Yêu cầu | Chế độ |
|---|---|
| "Tổng hợp source base hiện tại" | **FULL AUDIT** |
| "Cập nhật biên bản vì vừa thêm module X" | **INCREMENTAL UPDATE** |
| "Xem hệ thống đang có gì trước khi làm Y" | **FULL AUDIT** |
| "Bump version sau deploy" | **INCREMENTAL UPDATE** |

---

### Bước 2 — Thu thập thông tin

#### Chế độ FULL AUDIT:
Spawn **2 research subagents song song** để quét nhanh:

**Subagent 1 — Backend Auditor:**
```
Quét d:/Projects/logistics-website/backend/src/ và trả về:
1. Danh sách tất cả modules (tên thư mục)
2. Với mỗi module: entities (DB tables + columns quan trọng), DTOs, controllers (endpoints + method + path), services (methods chính)
3. Guards/decorators custom đang dùng
4. Danh sách migrations (tên file + nội dung tóm tắt)
5. Enums đang định nghĩa
```

**Subagent 2 — Frontend Auditor:**
```
Quét d:/Projects/logistics-website/frontend/src/ và trả về:
1. Tất cả pages trong App Router (src/app/**/page.tsx)
2. Zustand stores (tên + state chính + có persist không)
3. API hooks/queries đang có (src/features/**/api.ts)
4. Middleware RBAC (src/middleware.ts): roleRouteMap hiện tại
5. Các feature chưa có page nhưng có guard trong middleware
```

#### Chế độ INCREMENTAL UPDATE:
Chỉ đọc các file liên quan đến thay đổi mới:
- Module mới: đọc entity, controller, migration tương ứng
- Page mới: đọc page.tsx và feature/api.ts tương ứ
- Đọc `CODEBASE_AUDIT.md` hiện tại để biết version cuối

---

### Bước 3 — Xác định version mới

Đọc phần `## 📌 Thông tin biên bản` trong `CODEBASE_AUDIT.md` hiện tại:

**Quy tắc bump version (Semantic Versioning):**

| Loại thay đổi | Bump |
|---|---|
| Thêm module backend mới (entity + endpoints) | `MINOR` (0.x.0 → 0.(x+1).0) |
| Thêm page frontend mới (page + API layer) | `MINOR` |
| Fix bug, cập nhật nhỏ, thêm field | `PATCH` (0.x.y → 0.x.(y+1)) |
| Hoàn thiện nghiệp vụ lớn (Orders/Trips/Warehouse) | `MAJOR` (x.0.0 → (x+1).0.0) |

---

### Bước 4 — Cập nhật CODEBASE_AUDIT.md

Cập nhật file `d:/Projects/logistics-website/CODEBASE_AUDIT.md` với các phần sau:

#### 4a. Cập nhật phần "Thông tin biên bản":
```markdown
| **Phiên bản** | v{VERSION_MỚI} |
| **Ngày audit** | {NGÀY_HÔM_NAY} |
```

#### 4b. Thêm entry vào CHANGELOG (thêm VÀO ĐẦU, không xóa entry cũ):
```markdown
### v{VERSION_MỚI} — {NGÀY_HÔM_NAY}
- ✅ {Mô tả thay đổi 1}
- ✅ {Mô tả thay đổi 2}
- [Các thay đổi khác...]
```

#### 4c. Cập nhật các bảng trạng thái:
- Bảng **"BACKEND — MODULES & DB TABLES"**: thêm row cho module mới
- Bảng **"Migrations đã chạy"**: thêm migration mới
- Bảng **"FRONTEND — PAGES"**: thêm page mới
- Bảng **"NGHIỆP VỤ CHƯA TRIỂN KHAI"**: xóa nghiệp vụ vừa hoàn thiện
- Cập nhật **Enums** nếu có thêm enum mới

#### 4d. Cập nhật Checklist nếu quy trình thay đổi

---

### Bước 5 — Xác nhận với user

Sau khi cập nhật xong, báo cáo ngắn gọn:

```markdown
## ✅ Đã cập nhật CODEBASE_AUDIT.md

**Phiên bản:** v{CŨ} → v{MỚI}
**Ngày:** {HÔM_NAY}

### Thay đổi ghi nhận:
- [Liệt kê các thay đổi]

### Nghiệp vụ chưa có (còn lại):
- [Danh sách còn thiếu]

📄 Xem file: CODEBASE_AUDIT.md
```

---

## Quy tắc bất biến (KHÔNG được vi phạm)

1. **KHÔNG xóa CHANGELOG cũ** — chỉ thêm entry mới vào đầu
2. **KHÔNG giảm version** — chỉ tăng
3. **Không ghi migration chưa chạy** vào bảng Migrations
4. **Không đánh dấu ✅ nghiệp vụ chưa hoàn thiện**
5. **Luôn cập nhật ngày audit** khi sửa file

---

## Ví dụ thực tế

### Tình huống: Vừa hoàn thiện module Orders

**Thông tin thu thập:**
- Backend: thêm `orders` module, bảng `order`, 6 endpoints, migration `CreateOrderTable`
- Frontend: thêm `/dashboard/orders` page, `src/features/orders/api.ts`

**Hành động:**
1. Bump version: `v0.3.0` → `v0.4.0`
2. Thêm CHANGELOG entry:
   ```markdown
   ### v0.4.0 — 2026-08-XX
   - ✅ Backend: module `orders` (entity Order, 6 endpoints CRUD + filter)
   - ✅ Migration `CreateOrderTable` đã chạy
   - ✅ Frontend: `/dashboard/orders` page (TanStack Table, filter tuyến/trạng thái)
   - ✅ API hooks: ordersQueryOptions, createOrderMutation, updateOrderMutation
   ```
3. Cập nhật bảng Backend Modules: thêm row `orders`
4. Cập nhật bảng Migrations: thêm row migration mới
5. Cập nhật bảng Frontend Pages: thêm row `/dashboard/orders`
6. Xóa `Orders` khỏi bảng "NGHIỆP VỤ CHƯA TRIỂN KHAI"
