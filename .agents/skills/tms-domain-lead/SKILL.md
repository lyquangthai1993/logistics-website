---
name: tms-domain-lead
description: >-
  Agent nghiệp vụ (Team Lead) cho hệ thống Logistics TMS. Hiểu toàn bộ quy trình điều vận,
  phân công xe, phân quyền vai trò, và luồng thông báo. Kích hoạt BẮT BUỘC trước khi implement
  bất kỳ tính năng nào liên quan đến: status transition, notification, phân quyền, nghiệp vụ mới,
  hoặc khi cần cross-check code với spec. Triggers: "nghiệp vụ", "luồng", "ai được notify",
  "điều vận", "phân công xe", "lệnh", "trạng thái", "order", "trip", "warehouse", "fleet".
---

# TMS Domain Lead — Nghiệp Vụ Logistics TMS

> **Vai trò**: Team Lead hiểu toàn bộ nghiệp vụ.
> Mọi quyết định về **ai làm gì, ai được thông báo, khi nào** đều phải tra cứu skill này trước.
> Skill này **không viết code** — nó quyết định **what & why**, còn `nestjs-best-practices` / `nextjs-best-practices` quyết định **how**.

---

## 📚 Nguồn Sự Thật (Source of Truth)

Trước khi implement bất kỳ tính năng nghiệp vụ nào, agent PHẢI đọc:

| Tài liệu | Nội dung | Đường dẫn |
|---------|---------|-----------|
| Workflow Plan | Quyết định sản phẩm đã confirm, luồng chính, ngoại lệ | `docs/order-dispatch-workflow-plan.md` |
| User Manual | Hướng dẫn sử dụng từ góc nhìn người dùng | `docs/user-guide/USER_MANUAL_HUONG_DAN_SU_DUNG.md` |
| Codebase Audit | Trạng thái hiện tại của codebase | `CODEBASE_AUDIT.md` |
| Service Registry | Danh sách API endpoints đang có | `SERVICE_REGISTRY.md` |

---

## 👥 Vai Trò & Quyền Hạn

| Role | Enum | Quyền chính |
|------|------|-------------|
| **DISPATCHER** | `RoleEnum.DISPATCHER` | Tạo / sửa / hủy lệnh điều vận. Submit lên Fleet. Tạo xe ngoài khi không có xe nội bộ. |
| **FLEET_MANAGER** | `RoleEnum.FLEET_MANAGER` | Nhận đơn cần phân công. Tạo trip, chọn xe/tài xế, xác nhận chuyến. Báo không có xe. |
| **WAREHOUSE_MANAGER** | `RoleEnum.WAREHOUSE_MANAGER` | Xem Inbound Board (read-only Phase 1). Xác nhận nhận hàng (Phase 2). |
| **SUPER_ADMIN** | `RoleEnum.SUPER_ADMIN` | Toàn quyền tất cả. Luôn nhận mọi notification. |

---

## 🔄 Order Status State Machine

```
DRAFT ──(Dispatcher hủy)──► CANCELLED / DELETED
  │
  └─► PENDING_FLEET
            ├─► ASSIGNED        (tất cả trips đã CONFIRMED)
            │       └─► IN_TRANSIT
            │                └─► DELIVERED
            │
            └─► NO_VEHICLE      (Fleet báo không có xe)
                    └─► PENDING_FLEET  (sau khi Dispatcher thuê xe ngoài)

Mọi trạng thái ──► CANCELLED
```

---

## 🔔 Ma Trận Thông Báo (Notification Matrix)

Đây là **nguồn sự thật duy nhất** cho câu hỏi "ai nhận notify khi nào".
Mọi implementation phải tuân theo bảng này. Khi có thay đổi nghiệp vụ → cập nhật bảng này trước.

### Orders

| Sự kiện | Trigger API | Roles nhận thông báo | Kênh | Template / Method | Trạng thái |
|---------|------------|----------------------|------|-------------------|-----------|
| Order tạo mới | `POST /orders` | _(không ai)_ | — | — | ✅ Đúng spec |
| Order submit lên Fleet | `PATCH /orders/:id/submit` | **FLEET_MANAGER**, SUPER_ADMIN | In-app + Email | `order-pending-fleet.hbs` | ✅ Đã implement |
| Fleet báo không có xe | `PATCH /orders/:id/no-vehicle` | **DISPATCHER**, SUPER_ADMIN | In-app + Email | `order-no-vehicle.hbs` | ✅ Đã implement |
| Order bị hủy | `DELETE /orders/:id` | _(không ai — bản nháp)_ | — | — | ✅ Đúng spec (DRAFT) |

### Trips

| Sự kiện | Trigger API | Roles nhận thông báo | Kênh | Template / Method | Trạng thái |
|---------|------------|----------------------|------|-------------------|-----------|
| Trip được confirm | `PATCH /trips/:id/confirm` | **WAREHOUSE_MANAGER**, DISPATCHER, FLEET_MANAGER, SUPER_ADMIN | In-app + Email | `trip-confirmed.hbs` | ✅ Đã implement |
| Trip bị hủy | `DELETE /trips/:id` | _(chưa xác định)_ | — | _(chưa implement)_ | ❓ Cần confirm |

### Quy tắc bất biến

1. **SUPER_ADMIN** luôn nhận mọi notification — không bao giờ bỏ qua.
2. **In-app + Email** luôn đi cùng nhau theo Q2 đã xác nhận.
3. Notification **không được** làm fail business logic chính → bắt buộc `try/catch`.
4. In-app và Email phải được tạo **riêng biệt** trong code, không để một method tạo cả hai (tránh duplicate).

---

## 🏗️ Luồng Nghiệp Vụ Chính (Happy Path)

```
[DISPATCHER]                    [FLEET_MANAGER]              [WAREHOUSE_MANAGER]
     │                                │                              │
     ├─ Tạo Order mới (DRAFT)         │                              │
     ├─ Submit lên Fleet ────────────►│ ← Nhận in-app + email       │
     │   (orderCode, tuyến, KL/m³)   │                              │
     │                                ├─ Xem Orders PENDING_FLEET   │
     │                                ├─ Chọn xe + tài xế           │
     │                                ├─ Confirm Trip ─────────────►│ ← Nhận in-app + email
     │◄── Nhận in-app + email ────────┤                              │
```

## 🔀 Ngoại Lệ

### Ngoại Lệ 0 — Dispatcher hủy lệnh (DRAFT)
- Cho phép hủy/xóa khi đơn ở `DRAFT`
- Không notify ai — Fleet chưa biết đơn này tồn tại
- Thực hiện soft-delete

### Ngoại Lệ 1 — Không có xe nội bộ
```
FLEET_MANAGER báo NO_VEHICLE
    → Notify DISPATCHER + SUPER_ADMIN (In-app + Email: order-no-vehicle.hbs)
    → DISPATCHER cập nhật thông tin đối tác xe ngoài (isExternalVehicleNeeded = true, externalNote)
    → Submit lại → PENDING_FLEET (với cờ Xe ngoài)
    → FLEET_MANAGER tiếp nhận và gán xe thuê ngoài
```


### Ngoại Lệ 2 — Split Shipment (1 đơn → nhiều xe)
- Fleet Manager tạo nhiều Trip cho 1 Order
- Tất cả Trips confirm → Order = `ASSIGNED`
- Chỉ notify WAREHOUSE_MANAGER khi **tất cả** trips đã confirmed

---

## 🚛 Xe Thuê Ngoài (External Vehicle)

Khi `isExternalVehicleNeeded = true`:
- Email subject phải prefix `🚨 [XE THUÊ NGOÀI]`
- UI phải hiển thị badge amber "🚛 Xe thuê ngoài" tại mọi nơi liên quan
- Gửi email đến **tất cả** bên liên quan (không được bỏ sót)

---

## ✅ Checklist Trước Khi Implement Tính Năng Nghiệp Vụ

Agent PHẢI tự hỏi và trả lời các câu sau trước khi viết code:

```
1. Sự kiện này thuộc transition nào trong State Machine?
2. Theo Notification Matrix, ai cần được notify?
3. Kênh nào (in-app / email / cả hai)?
4. Template email đã tồn tại chưa? Nếu chưa → tạo mới riêng biệt.
5. Có phải trường hợp xe ngoài không? → Nếu có, subject + nội dung phải highlight.
6. SUPER_ADMIN có trong danh sách nhận notify chưa?
7. Notification đã được bọc try/catch chưa?
8. Có tạo duplicate in-app notification không?
```

---

## 🗂️ Phân Chia Trách Nhiệm Skill

| Câu hỏi | Skill trả lời |
|---------|-------------|
| **Ai** được notify? **Khi nào**? **Vì sao**? | ✅ **tms-domain-lead** (skill này) |
| Code notify **thế nào**? Pattern gì? | `nestjs-best-practices` |
| UI hiển thị **thế nào**? | `nextjs-best-practices`, `shadcn-ui-patterns` |
| Auth / RBAC Guard **thế nào**? | `jwt-rbac-auth` |
| Commit an toàn chưa? | `git-commit-reviewer` |
