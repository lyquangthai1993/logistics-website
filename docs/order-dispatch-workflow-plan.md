# Implementation Plan: Lập Lệnh Điều Vận & Phân Công Xe

> **Trạng thái**: ✅ Product đã xác nhận — Sẵn sàng build  
> **Ngày tạo**: 2026-08-17  
> **Ngày confirm**: 2026-08-17  
> **Tác giả**: Antigravity AI Agent  

---

## ✅ Product Decisions (Đã Xác Nhận)

### Q1 – Order Code Format ✅ ĐÃ CONFIRM

**Quyết định**: User tự định nghĩa mã đơn hàng, hệ thống chỉ check duplicate.

**Logic mã**: `{3 chữ viết tắt tên Dispatcher}{MMYY}-{số thứ tự}`  
**Ví dụ**: Dispatcher "Nguyễn Anh Đức" → `NDA2608-0126`  
- `NDA` = viết tắt tên  
- `2608` = tháng 8 năm 2026  
- `0126` = số thứ tự đơn

**Yêu cầu kỹ thuật**:
- Input field `orderCode` là **free-text**, user tự nhập
- UI có **placeholder** gợi ý format: `VD: NDA2608-0126`
- Tooltip/hint giải thích cách đặt mã (3 chữ tắt tên + MMYY + số thứ tự)
- Backend **validation**: check UNIQUE, không tự generate
- Hiển thị lỗi rõ ràng nếu trùng: _"Mã đơn hàng đã tồn tại, vui lòng chọn mã khác"_

---

### Q2 – Notification Channel ✅ ĐÃ CONFIRM

**Quyết định**: **Cả in-app lẫn email**

**Trigger**: Khi Fleet Manager xác nhận Trip → gửi đồng thời:
1. **In-app notification** (bell icon, badge count, `/dashboard/notifications`)
2. **Email notification** đến Warehouse Manager

---

### Q3 – Xe Thuê Ngoài (External Vehicle) ✅ ĐÃ CONFIRM

**Quyết định**: Lưu chung bảng `vehicle` với flag `isExternal = true`, nhưng **phải nổi bật về mặt UI & thông báo**.

**Yêu cầu chi tiết**:

#### UI/Visual (bắt buộc)
- Badge label **"🚛 Xe thuê ngoài"** màu amber/orange, **in đậm**, hiển thị ở:
  - Danh sách xe trong Fleet page
  - Card Trip assignment (Fleet Manager)
  - Order detail page
  - Inbound Board (Warehouse Manager)
- Không được để UI hiển thị như xe nội bộ bình thường — phải luôn phân biệt rõ

#### Email Thông Báo (bắt buộc)
- Khi Trip dùng xe thuê ngoài được confirm, email gửi đến **tất cả các bên liên quan**:
  - DISPATCHER (người tạo đơn)
  - FLEET_MANAGER (người phân công)
  - WAREHOUSE_MANAGER (người nhận hàng)
- Nội dung email phải **highlight rõ** thông tin xe thuê ngoài (tên nhà cung cấp, biển số, tài xế)

#### DB
- Thêm column `isExternal BOOLEAN NOT NULL DEFAULT false`
- Thêm column `externalProvider VARCHAR` (tên công ty xe ngoài)
- Trip dùng xe ngoài → `order.isExternalVehicleNeeded = true`

---

### Q4 – Phê Duyệt Schema DB ✅ ĐÃ CONFIRM

**Quyết định**: **Đồng ý** — Tiến hành tạo migration cho bảng `order` và `trip`.

---

### Q5 – Email Trip Confirm (Non-External) ✅ ĐÃ CONFIRM

**Quyết định**: Gửi email đến **tất cả các bên liên quan**:
- DISPATCHER (người tạo đơn)
- FLEET_MANAGER (người phân công)
- WAREHOUSE_MANAGER (người nhận hàng)

---

### Q6 – Số Thứ Tự Order Code ✅ ĐÃ CONFIRM

**Quyết định**: Số thứ tự chỉ là **gợi ý theo Dispatcher & theo tháng**, không có auto-generate. User nhập tự do.

**Yêu cầu kỹ thuật**:
- Hệ thống **không tự đủm số thứ tự**, chỉ validate UNIQUE
- Placeholder gợi ý pattern dựa trên Dispatcher đang đăng nhập:
  - Như Nguyễn Anh Đức đăng nhập → placeholder hiển thị `NDA2608-xxxx`
  - `xxxx` để trống để user tự nhập
- Tooltip nhắc nhở format: _"Gợi ý: Initials + MMYY + số thứ tự, VD: NDA2608-0126"_

---

### Q7 – Split Shipment — Phân Bổ KL/m³ ✅ ĐÃ CONFIRM

**Quyết định**: Fleet Manager **khai báo chi tiết từng xe**, giao diện phải **dễ thao tác** cho người không có kinh nghiệm.

**Yêu cầu giao diện Split Shipment**:
- Khi bật split mode: hiển thị dạng **bảng** (từng dòng = 1 xe)
- Mỗi dòng: chọn xe, chọn tài xế, nhập KL (kg), nhập m³
- Hiển thị **tổng KL đã chia / tổng KL đơn hàng** realtime (VD: `18.000 / 25.000 kg`)
- Cảnh báo nếu tổng vượt mức hoặc dư sót quá nhiều
- Nút `+ Thêm xe` để thêm dòng mới (tối đa 5 xe / đơn)
- UX phải đơn giản: tối thiểu click, label tiếng Việt rõ ràng

---

### Q8 – Warehouse Confirm Nhận Hàng ✅ ĐÃ CONFIRM

**Quyết định**: Có, nhưng để **Phase 2**.
- **Phase 1**: Warehouse Manager chỉ xem Inbound Board (read-only)
- **Phase 2**: Thêm nút "Đã nhận hàng" → cập nhật Order status `IN_TRANSIT` / `DELIVERED`

---

### Q9 – Hủy Lệnh Điều Vận Trước Khi Gửi Đội Xe ✅ ĐÃ CONFIRM

**Quyết định**: Người điều phối (Dispatcher) có toàn quyền **hủy hoặc xóa lệnh điều vận trước khi gửi cho Đội xe** (khi đơn hàng ở trạng thái `DRAFT` - Nháp).

**Chi tiết nghiệp vụ & kỹ thuật**:
- **Thời điểm cho phép**: Khi đơn hàng vừa tạo xong và đang ở trạng thái `DRAFT` (chưa bấm nút gửi duyệt sang Đội xe `PENDING_FLEET`).
- **Giao diện thao tác**:
  - Tại bảng danh sách đơn hàng (`/dashboard/orders`): Cung cấp nút thao tác nhanh `Xóa / Hủy đơn` (nút icon thùng rác màu đỏ) chỉ hiển thị cho các dòng đơn `DRAFT`.
  - Tại trang chi tiết đơn hàng (`/dashboard/orders/[id]`): Cung cấp nút `Hủy lệnh điều vận` khi đơn đang ở trạng thái `DRAFT`.
- **Hiệu lực dữ liệu & phân quyền**:
  - Thực hiện soft-delete hoặc chuyển trạng thái sang `CANCELLED`.
  - Đơn bị hủy sẽ không chuyển tiếp sang bảng chờ tiếp nhận phân xe của Đội xe (`FLEET_MANAGER`).
  - Giải phóng mã đơn hàng và không làm phát sinh chuyến xe (trip).

---

### Luồng Chính (Happy Path)

```
[DISPATCHER]                    [FLEET_MANAGER]              [WAREHOUSE_MANAGER]
     │                                │                              │
     ├─ Tạo Order mới (DRAFT)         │                              │
     ├─ Gửi lên Fleet (PENDING) ─────►│                              │
     │   (mã, tuyến, KL/m³, hàng)    │                              │
     │                                ├─ Xem Orders cần phân công   │
     │                                ├─ Chọn xe + tài xế           │
     │                                ├─ Đặt ngày/giờ lấy hàng     │
     │                                ├─ Xác nhận Trip ────────────►│
     │◄── Notify: Trip confirmed ──── │               Inbound Board │
```

### Ngoại Lệ 0 – Người điều phối hủy lệnh trước khi gửi Đội xe

```
[DISPATCHER] Tạo đơn hàng mới (DRAFT)
    → Phát hiện sai thông tin / Khách hàng thay đổi yêu cầu
    → Bấm "Hủy / Xóa đơn nháp" (trước khi gửi Fleet)
    → Đơn bị hủy / xóa khỏi hệ thống
    → Hoàn toàn không chuyển sang Đội xe (Fleet Manager không thấy đơn này)
```

### Ngoại Lệ 1 – Không có xe nội bộ (Fleet báo hết xe → Hoàn trả Điều phối)

```
FLEET_MANAGER bấm "Báo không có xe" (kèm lý do: bận xe, quá tải, bảo dưỡng...)
    → Order status chuyển sang NO_VEHICLE
    → Hệ thống tự động gửi In-app Notification + Email tới DISPATCHER (và SUPER_ADMIN)
    → Đơn hàng hiển thị cảnh báo hết xe tại trang chi tiết đơn (/dashboard/orders/:id)
    → DISPATCHER liên hệ đối tác vận tải ngoài, bấm "Thuê xe bên ngoài"
    → Cập nhật thông tin nhà xe, số điện thoại, ghi chú xe ngoài (isExternalVehicleNeeded = true)
    → Gửi lại lệnh điều vận lên Đội xe (status → PENDING_FLEET với cờ "Yêu cầu xe ngoài")
    → FLEET_MANAGER tiếp nhận và gán xe ngoài / xác nhận chuyến xe
```


### Ngoại Lệ 2 – Split Shipment (1 đơn → 2-3 xe)

```
FLEET_MANAGER tạo nhiều Trip cho cùng 1 Order
    → Mỗi Trip: 1 xe + 1 tài xế + phần KL/m³ được chia
    → Tất cả Trips confirm xong → Order status = FULLY_ASSIGNED
    → Notify WAREHOUSE_MANAGER
```

---

## Order Status State Machine

```
DRAFT ──(Dispatcher hủy lệnh trước khi gửi Fleet)──► CANCELLED / DELETED
  │
  └─► PENDING_FLEET
            ├─► ASSIGNED (tất cả trips đã confirmed)
            │       └─► IN_TRANSIT
            │                └─► DELIVERED
            │
            └─► NO_VEHICLE (Fleet báo không có xe)
                    └─► PENDING_FLEET (sau khi Dispatcher thuê xe ngoài)

Mọi trạng thái ──► CANCELLED
```


---

## Hiện Trạng Codebase (Audit 2026-08-17)

### Đã có ✅
| Item | Chi tiết |
|------|---------|
| RBAC middleware | Guard sẵn cho `/orders`, `/trips`, `/warehouse` — **không cần động** |
| `vehicle` table | id, licensePlate, model, type, maxWeight, maxVolume, currentHub, status, assignedDriverId |
| `driver` table | id, fullName, phone, licenseNumber, licenseClass, experienceYears, status |
| Fleet page | `/dashboard/fleet` — CRUD xe + tài xế hoàn chỉnh (36KB) |
| Notifications page | `/dashboard/notifications` — UI có sẵn, chỉ cần feed data |

### Chưa có ❌
| Item | Ghi chú |
|------|---------|
| `order` table | Chưa có entity, chưa có migration |
| `trip` table | Chưa có entity, chưa có migration |
| `orders` NestJS module | Chưa có |
| `trips` NestJS module | Chưa có |
| `/dashboard/orders` page | Chưa có (guard đã có) |
| `/dashboard/trips` page | Chưa có (guard đã có) |
| `/dashboard/warehouse` page | Chưa có (guard đã có) |

---

## Proposed Changes

### Phase 1 – Core Workflow _(ưu tiên xây dựng trước)_

#### 1.1 Database Migrations

**Bảng `order` mới:**
```sql
id               SERIAL PK
orderCode        VARCHAR UNIQUE NOT NULL        -- "NDA260817-0001"
status           VARCHAR NOT NULL               -- DRAFT|PENDING_FLEET|ASSIGNED|IN_TRANSIT|DELIVERED|CANCELLED
route            VARCHAR                        -- "HCM → HN"
originHub        VARCHAR
destinationHub   VARCHAR
totalWeight      FLOAT NOT NULL DEFAULT 0       -- kg
totalVolume      FLOAT NOT NULL DEFAULT 0       -- m³
goodsDescription TEXT
isExternalVehicleNeeded BOOLEAN DEFAULT false
createdByUserId  INT FK → user.id
notes            TEXT
createdAt, updatedAt, deletedAt
```

**Bảng `trip` mới:**
```sql
id               SERIAL PK
orderId          INT FK → order.id NOT NULL
vehicleId        INT FK → vehicle.id
driverId         INT FK → driver.id
status           VARCHAR NOT NULL               -- PENDING|CONFIRMED|IN_TRANSIT|COMPLETED|CANCELLED
pickupDate       DATE
pickupTime       TIME
estimatedDeliveryDate DATE
weightAllocated  FLOAT                          -- kg phần xe này chở
volumeAllocated  FLOAT                          -- m³ phần xe này chở
sequenceNumber   INT DEFAULT 1                  -- 1, 2, 3 cho split shipment
assignedByUserId INT FK → user.id
notes            TEXT
createdAt, updatedAt, deletedAt
```

**Thêm vào bảng `vehicle` hiện có:**
```sql
ALTER TABLE vehicle
  ADD COLUMN isExternal        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN externalProvider  VARCHAR;
```

---

#### 1.2 Backend – `orders` Module (NestJS)

**Endpoint:**

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/v1/orders` | DISPATCHER, SUPER_ADMIN |
| `GET` | `/api/v1/orders` | ALL |
| `GET` | `/api/v1/orders/:id` | ALL |
| `PATCH` | `/api/v1/orders/:id` | DISPATCHER, SUPER_ADMIN |
| `PATCH` | `/api/v1/orders/:id/submit` | DISPATCHER |
| `PATCH` | `/api/v1/orders/:id/no-vehicle` | FLEET_MANAGER |
| `DELETE` | `/api/v1/orders/:id` | DISPATCHER, SUPER_ADMIN |

**Service methods:**
```typescript
createOrder(dto, userId)       // Tạo đơn, status = DRAFT
submitOrder(id)                // Gửi lên Fleet → PENDING_FLEET
markNoVehicle(id)              // Fleet báo không có xe → NO_VEHICLE
getOrdersPendingFleet()        // Fleet xem danh sách cần phân công
cancelOrder(id)
```

---

#### 1.3 Backend – `trips` Module (NestJS)

**Endpoint:**

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/v1/trips` | FLEET_MANAGER, DISPATCHER, SUPER_ADMIN |
| `POST` | `/api/v1/trips/split` | FLEET_MANAGER, SUPER_ADMIN |
| `GET` | `/api/v1/trips` | ALL |
| `PATCH` | `/api/v1/trips/:id/confirm` | FLEET_MANAGER, SUPER_ADMIN |
| `DELETE` | `/api/v1/trips/:id` | FLEET_MANAGER, SUPER_ADMIN |

**Service methods:**
```typescript
createTrip(dto)                    // 1 trip cho 1 order
createSplitTrips(orderId, trips[]) // 2-3 trips cho 1 order
confirmTrip(id)                    // → auto check: nếu all trips confirmed → order = ASSIGNED + notify WM
cancelTrip(id)
```

---

#### 1.4 Frontend – Orders Page (Dispatcher)

**Files mới:**
- `frontend/src/app/dashboard/orders/page.tsx`
  - `OrdersTable`: Filter status / tuyến / ngày
  - `CreateOrderSheet`: Slide-over drawer tạo đơn
  - `OrderStatusBadge`: Badge màu theo status
  - `SplitShipmentIndicator`: Badge "Split 2x" khi order có >1 trip

- `frontend/src/app/dashboard/orders/[id]/page.tsx`
  - Order info card
  - Trip assignments list
  - Status timeline

- `frontend/src/features/orders/api.ts`
  - `useOrders(filters)`, `useCreateOrder()`, `useSubmitOrder()`, `useMarkNoVehicle()`

---

#### 1.5 Frontend – Trips Page (Fleet Manager)

**Files mới:**
- `frontend/src/app/dashboard/trips/page.tsx`
  - `PendingOrdersPanel`: Orders cần phân công
  - `TripAssignmentForm`: Chọn xe / tài xế / ngày giờ
  - `CapacityGauge`: Progress bar `KL: 85% (21250/25000 kg)` + `m³: 60%`
  - `SplitShipmentToggle`: Tạo 2-3 trips cho 1 order

- `frontend/src/app/dashboard/trips/[id]/page.tsx`
  - Trip detail + Confirm button

- `frontend/src/features/trips/api.ts`
  - `useTrips(filters)`, `useCreateTrip()`, `useCreateSplitTrips()`, `useConfirmTrip()`

---

### Phase 2 – Exception Handling

**External Vehicle (xe thuê ngoài):**
- Sửa `fleet/page.tsx`: thêm toggle `isExternal` + field `externalProvider`
- Sửa `vehicle.entity.ts`: thêm `isExternal`, `externalProvider`
- Badge "Xe ngoài" màu amber trên danh sách xe

**Split Shipment UI:**
- Khi Fleet Manager bật split mode: N forms trip song song
- Validation: tổng `weightAllocated` ≤ `order.totalWeight`

---

### Phase 3 – Warehouse Integration

**Backend:**
- Khi `confirmTrip()` → tất cả trips confirmed → tạo notification record cho WAREHOUSE_MANAGER users

**Frontend:**
- `frontend/src/app/dashboard/warehouse/inbound/page.tsx`
  - `InboundReceivingBoard`: Danh sách trips CONFIRMED sắp đến hub
  - Filter theo Hub + ngày lấy hàng
- `frontend/src/features/warehouse/api.ts`

---

## Verification – Acceptance Criteria

| # | Actor | Hành động | Kết quả |
|---|-------|-----------|---------|
| 1 | DISPATCHER | Tạo đơn hàng mới | Order status = `DRAFT` |
| 2 | DISPATCHER | Bấm "Gửi lên Fleet" | Status → `PENDING_FLEET` |
| 3 | FLEET_MANAGER | Vào Trips page | Thấy order trong panel "Cần phân công" |
| 4 | FLEET_MANAGER | Chọn xe + tài xế + ngày giờ | Trip tạo thành công |
| 5 | FLEET_MANAGER | Bấm "Xác nhận Trip" | Status trip → `CONFIRMED`, order → `ASSIGNED` |
| 6 | WAREHOUSE_MANAGER | Vào Inbound Board | Thấy trip mới |
| 7 | DISPATCHER | Đơn không có xe → tạo External Vehicle | Assign thành công |
| 8 | FLEET_MANAGER | Split 2 xe cho 1 đơn | 2 trips tồn tại, order hiển thị "Split 2x" |
| 9 | FLEET_MANAGER | Confirm cả 2 trips | Order → `ASSIGNED` |
| 10 | DISPATCHER | Hủy đơn hàng ở trạng thái `DRAFT` | Đơn bị xóa/hủy, không gửi sang Đội xe |

---

## Tổng Hợp Files

| Phase | Số files mới | Số files sửa |
|-------|-------------|-------------|
| Phase 1 – Core | ~18 files | 0 |
| Phase 2 – Exceptions | 0 | ~3 files |
| Phase 3 – Warehouse | ~4 files | 1 (trips service) |
| **Tổng** | **~22 files** | **~4 files** |

> **Cam kết an toàn**: Không xóa file nào. Không ảnh hưởng dữ liệu cũ. Migrations chỉ tạo thêm bảng/cột mới.
