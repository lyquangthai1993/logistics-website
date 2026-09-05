# Kế Hoạch Triển Khai: Phân Hệ Quản Lý Kho (Warehouse Hub Operations)

> **Nguồn tham chiếu bắt buộc**: [Task_Warehouse_Design_UI.md](./Task_Warehouse_Design_UI.md) · [WAREHOUSE_FLOWS.pen](./pencil-workspace/pens/WAREHOUSE_FLOWS.pen) · [Vòng đời đơn hàng N-Hubs](./business_flow/1_vong_doi_don_hang.png) · [Tem nhận diện A4](./docs_scan/TEM%20NHẬN%20DIỆN%20HÀNG%20HÓA%20THÀNH%20A4.xlsx) · [Kế hoạch đóng hàng xe](./docs_scan/Kế%20Hoạch%20Đóng%20Hàng%20Xe%2043H30703%20Spider%203.9%20K.xlsx) · [leader SKILL](./.agents/skills/leader/SKILL.md) · [RBAC Matrix v1.4](./.agents/rules/rbac-matrix.md)
> **Phiên bản**: v2.1 — 2026-09-05 (bổ sung `leader` prerequisite sinh mã Order)
> **Trạng thái handoff**: **NOT CLEARED** — chỉ bắt đầu code sau khi đóng toàn bộ Design Gate G0 bên dưới.
> **Branch**: `feature/warehouse-inbound-module` (backend + frontend)

---

## 🚦 Kết Luận Audit 2026-09-05 — Canonical v2.1

> Phần này là hợp đồng triển khai có thẩm quyền cao nhất trong tài liệu. Mọi code sketch hoặc test case v1.x ở các phần sau nếu mâu thuẫn với phần v2.1 này phải được sửa trước khi dùng.

### UI Audit Report — Warehouse Flows — 2026-09-05

**Auditor**: `ui-spec-auditor`
**Target**: toàn bộ 18 top-level frames trong `pencil-workspace/pens/WAREHOUSE_FLOWS.pen`
**Spec References**:

- `Task_Warehouse_Design_UI.md`
- `business_flow/1_vong_doi_don_hang.png`
- `docs_scan/form_create_new_don.JPG`
- `docs_scan/required_field_border_red.png`
- `docs_scan/mau_phieu_nhap_kho.JPG`
- `docs_scan/TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx`
- `docs_scan/Kế Hoạch Đóng Hàng Xe 43H30703 Spider 3.9 K.xlsx`
- `.agents/skills/leader/SKILL.md` và `.agents/skills/leader/notifications.md`
- `.agents/rules/rbac-matrix.md`

#### Summary Score

| Dimension | Checkpoints Violated | Score | Status |
|---|---|---:|---|
| D1: Field & Column Compliance | `Địa chỉ nhận hàng` xuất hiện cả header và từng dòng nhưng chưa định nghĩa rõ nguồn sự thật; còn text node rỗng và cột `Ghi chú` của loading sheet bị clip | 7/10 | WARN |
| D2: State-Driven UI Logic | `J2W764` đặt các action của nhiều trạng thái trong cùng một panel; lỗi copy outbound trong hai modal Mode 2 đã sửa ngày 2026-09-05 | 0/10 | FAIL |
| D3: Role & RBAC Compliance | Canvas thể hiện WM + hub scope; quyền thực thi vẫn phải theo RBAC hiện hành | 10/10 | PASS |
| D4: Business Rule Compliance | Trip picker dùng `CÒN CHỖ/ĐÃ CHẤT` thay cho điều kiện inbound `remainingOrderCount > 0` | 7/10 | WARN |
| D5: Mobile & UX Usability | Có cargo cards và sticky bar; chưa có frame loading/error/offline và chưa chứng minh toàn bộ touch target ≥ 44 px | 9/10 | PASS |
| **OVERALL** |  | **33/50** | **NOT CLEARED** |

#### Auto-FAIL Triggers (Blocking — zero tolerance)

- [ ] D1: Không có SKU/item-level barcode. QR/Barcode chỉ được phép mã hóa `orderCode`/`waybillCode` để nhận diện kiện vận tải, không phải mã sản phẩm.
- [x] D2: Chưa có state-switching contract rõ ràng; frame `J2W764` đang hiển thị đồng thời action của các trạng thái tương lai.
- [ ] D3: Hub scoping chưa thể kiểm chứng chỉ bằng canvas; phải được ép tại query/command backend.
- [ ] D4: Không phát hiện trường SKU.

#### Warnings

- [WARN-D1] `WH_CASE_01`/`GcZml` có 15 cột hiển thị nhưng plan cũ gọi là “grid 8 cột”. Chuẩn đúng là **15 cột vật lý** (14 cột nghiệp vụ + thao tác), trong đó có **8 nhóm nhập liệu lõi**.
- [WARN-D1] Các text node rỗng: `Ti2Vx`, `R9kApH`, `iudrU`, `hub1_801l2`, `xebo_66bjd`.
- [WARN-D1] `LP_H14` và các cell cột 14 trong `WH_CASE_05_LOADING_PLAN` bị clip; không được coi đây là hành vi scroll chủ ý của bản in A4.
- [WARN-D4] `WH_CASE_02B_TRIP_MODAL` có ba filter pill bị fully clipped; đồng thời thiếu route/origin/remaining-order information mà spec inbound yêu cầu.
- [WARN-D5] `WH_VIEWPORT_SCROLL_VIEW` được clip có chủ ý; chỉ inner table được cuộn, `body` không được overflow.

#### Recommended Fixes (Ordered by priority)

1. [DONE 2026-09-05] Hai modal inbound đã đổi toàn bộ copy sang **chuyến đang đến hub → đơn còn trên xe → tiếp nhận vào kho**; outbound loading vẫn nằm ở màn Loading Plan riêng.
2. [BLOCKING] Vẽ hoặc đặc tả state variants cho `DRAFT`, `PENDING_INBOUND`, `INBOUND`, `COMPLETED_INBOUND`; mỗi trạng thái chỉ render action hợp lệ.
3. [BLOCKING] Chốt aggregate và quan hệ multi-order/multi-stop trước migration.
4. [WARN] Sửa clip ở trip filter pills và loading sheet; dọn text node rỗng.
5. [WARN] Bổ sung loading/error/empty/offline mobile states và kiểm tra touch target bằng bounds/E2E.

#### Clearance Decision

- Gate: score ≥ 40/50 và 0 Auto-FAIL.
- Result: **NOT CLEARED — trả về vòng Design → Audit → Fix trước implementation handoff**.

### G0 — Design & Domain Gates Phải Đóng Trước Khi Code

| Gate | Vấn đề | Quyết định chuẩn v2.1 / Điều kiện đóng |
|---|---|---|
| G0.1 ✅ | Mode 2 bị trộn inbound/outbound | **Đã đóng 2026-09-05**: `WH_CASE_02B_TRIP_MODAL` và `WH_CASE_03_MODAL` dùng “chuyến đang đến”, “đơn còn trên xe”, “dỡ/tiếp nhận”; không còn “chất hàng”, “còn chỗ”, “đã chất lên xe”, “xuất bến”. `WH_CASE_05_LOADING_PLAN` tiếp tục là màn outbound riêng. |
| G0.2 | Vòng đời N-Hubs | Dùng `business_flow/1_vong_doi_don_hang.png` làm nguồn bắt buộc: một consignment có thể qua A → B → C rồi mới đến điểm giao. Không gắn toàn bộ vòng đời này vào một `waybill`. |
| G0.3 | Aggregate chưa rõ | `Waybill` là **một lần tiếp nhận tại một Hub**, không phải Order và không phải Trip. `WaybillItem` là snapshot của consignment được nhận trong lần đó. |
| G0.4 | Trip hiện chỉ có một `orderId` | Mode 2 chỉ được mở khi đã có mô hình additive `trip_stop` + `trip_order_allocation` (hoặc tên tương đương) hỗ trợ N orders/N stops và partial unload. |
| G0.5 | Mode 1 và canonical Order | Mode 1 được lưu là ad-hoc warehouse consignment. Không tự động tạo/sửa `OrderEntity` dưới quyền WM. Action `Tạo Trip` cho dòng ad-hoc phải ẩn cho đến khi business duyệt quy trình Dispatcher chuyển đổi thành Order. |
| G0.6 | RBAC mâu thuẫn giữa Task và matrix | Tuân thủ source-of-truth hiện hành: `/dashboard/warehouse` và Waybill API chỉ `SUPER_ADMIN`, `WAREHOUSE_MANAGER`. Không cấp GET toàn bộ cho D/FM trong sprint này. Nếu cần read-only, phải thay đổi đồng bộ Sidebar + Route Guard + API Guard + RBAC matrix. |
| G0.7 | Excel bị defer trái zero-tolerance spec | Paste TSV từ clipboard và import `.xlsx` là P0 trong scope. Không được chuyển sang phase sau nếu vẫn claim UI bám bản scan/Excel. |
| G0.8 | Notification chưa có source-of-truth | Bổ sung event warehouse vào `leader/notifications.md` và được duyệt trước khi code trigger. SUPER_ADMIN luôn nhận cảnh báo; delivery phải non-blocking qua queue. |
| G0.9 | 5 mẫu in nhưng dữ liệu chưa đủ | Chỉ nghiệm thu từng mẫu khi resource nguồn đã tồn tại. Phiếu nhập + Tem A4 đi với Waybill; Loading Sheet đi với Trip/Stop; Phiếu xuất/POD đi với outbound/delivery resource, không nhét URL vào Waybill cho tiện. |
| G0.10 | DB impact | Migration đầu chỉ được **additive**. Giữ `trip.orderId` để tương thích và backfill sang allocation; không rename/drop/alter cột hiện hữu nếu chưa có phân tích dữ liệu và phê duyệt rõ ràng. |
| G0.11 | Sinh mã đơn hàng là prerequisite của `leader` | Mã canonical phải do server sinh theo `{HUB_PREFIX}-{INITIALS}-{YYMM}-{SEQ}`. Trước implementation phải có `hub.orderCodePrefix`, full name hợp lệ, atomic counter và unique constraint; client không nhập/sửa mã. |

### Traceability Từ Tài Liệu → Thiết Kế → Triển Khai

| Nguồn | Quy tắc phải trace | Canvas/UX | Backend/DB | Acceptance |
|---|---|---|---|---|
| `business_flow/1_vong_doi_don_hang.png` | Nhận từ khách → luân chuyển qua N hubs → giao cuối | Timeline phải thể hiện history theo hub/leg, không chỉ một step tĩnh | `trip_stop`, `trip_order_allocation`, warehouse receipt theo từng hub | Một order qua A→B→C tạo ba warehouse events độc lập nhưng giữ cùng order identity |
| `TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx` | 11 mục: Kho, Tên hàng, Điều hành, Mã đơn, Ngày nhập, Chứng từ, Số lượng, Palet số, Tổng palet, Người nhập, Giao đến | Tab Tem A4 + preview đúng khổ | Document record theo `waybillItemId` + `palletIndex`; QR chỉ encode order/waybill code | Golden PDF kiểm đủ 11 mục, page size A4 portrait, không lộ SKU |
| `Kế Hoạch Đóng Hàng Xe 43H30703 Spider 3.9 K.xlsx` | Header xe 5 trường, hotline 3 miền, 14 cột đúng thứ tự, subtotal | `WH_CASE_05_LOADING_PLAN`, fullscreen/print A4 ngang | Loading plan là trip-level resource; totals tính server-side từ allocations | Golden PDF A4 landscape, 14 cột không clip, totals khớp DB |

### Hợp Đồng Vòng Đời — Không Trộn Status

| Aggregate | Status được phép trong scope | Chủ thể chuyển trạng thái |
|---|---|---|
| `Order` hiện hữu | `DRAFT → PENDING_FLEET → ASSIGNED → IN_TRANSIT → DELIVERED` (+ `NO_VEHICLE`, `CANCELLED`) | Dispatcher/Fleet theo `leader` |
| `Trip` hiện hữu/mở rộng | `PENDING → CONFIRMED → IN_TRANSIT → COMPLETED` (+ `CANCELLED`) | Fleet; arrival/stop confirmation theo rule được duyệt |
| `Waybill` / Warehouse Receipt | `DRAFT → PENDING_INBOUND → INBOUND → COMPLETED_INBOUND` (+ `CANCELLED`) | WM tại đúng hub; SA có override audit |
| Outbound/POD | Không dùng `warehouseStatus`; phải thuộc loading/delivery aggregate riêng | Theo workflow outbound được duyệt |

Mỗi transition phải kiểm tra trạng thái hiện tại trong transaction, có `version`/optimistic lock hoặc row lock, ghi audit event và hỗ trợ idempotency. Không cho client gửi `hubId`, vehicle snapshot hoặc status để tự quyết định; server derive từ JWT, Trip và DB.

### Quy Tắc Sinh Mã Đơn Hàng — Leader Prerequisite

Format chuẩn: `HCM-LTV-2609-011` = `{HUB_PREFIX}-{OPERATOR_INITIALS}-{YYMM}-{SEQUENCE}`.

| Phần | Nguồn dữ liệu và rule |
|---|---|
| `HCM` | `HubEntity.orderCodePrefix` của `req.user.hubId`; uppercase, 2–5 ký tự `A-Z0-9`, unique. Không dùng lại `HubEntity.code` hiện có vì trường đó đang là mã identity kiểu `HUB-HAN-01`. |
| `LTV` | Ghép full name đã persist từ `firstName` + `lastName`, lấy chữ cái đầu của mọi từ, bỏ dấu tiếng Việt (`Đ → D`), bỏ punctuation và uppercase. `Lê Thâm Vương → LTV`. |
| `2609` | `YYMM` theo timezone nghiệp vụ `Asia/Ho_Chi_Minh`; tháng 09 năm 2026 thành `2609`, không phải `0926`. |
| `011` | Counter bắt đầu `001`, scope theo `(hubPrefix, operatorInitials, YYMM)`. Hai user cùng initials trong cùng Hub dùng chung counter. Từ 1000 tiếp tục `1000`, không quay vòng. |

Business invariants:

- Server sinh mã trong cùng transaction tạo `Order`; client không gửi prefix/initials/period/sequence/final code và không được sửa sau khi tạo.
- Dùng bảng counter có composite unique + atomic upsert/row lock; cấm `SELECT MAX(orderCode) + 1` và cấm endpoint preview không reserve mã.
- `order.orderCode` giữ unique constraint toàn cục, không tái sử dụng sau soft-delete/cancel. Nếu transaction tạo Order rollback thì counter allocation cũng rollback.
- Tạo batch N Order rows phải cấp N mã khác nhau trong một transaction; Mode 2 chỉ dùng lại mã của Order nguồn.
- Thiếu `user.hubId`, Hub inactive, thiếu/duplicate `orderCodePrefix`, hoặc full name không sinh được initials thì chặn tạo và trả message tiếng Việt qua error contract chuẩn.
- User provisioning hiện chỉ mô tả Hub assignment cho WM; implementation phải cho phép gán Hub cho mọi account vốn đã được RBAC cho phép tạo Order (`DISPATCHER`, `SUPER_ADMIN` khi dùng flow này). Đây là yêu cầu metadata, không cấp thêm quyền endpoint.
- Mã tham chiếu/chứng từ của khách phải lưu riêng, ví dụ `customerReferenceCode`; không dùng thay internal `orderCode`.
- Rule này không tự cấp quyền tạo Order cho WM. Với quyết định G0.5 hiện tại, Mode 1 ad-hoc chỉ được cấp canonical Order code khi Dispatcher chuyển đổi thành Order. Nếu muốn WM tạo Order ngay tại kho, phải có phê duyệt RBAC riêng và cập nhật đủ Sidebar + Route Guard + API Guard.

### Data Model Canonical v2.1

#### 0. Nền tảng sinh mã Order (precondition cho mọi Order creation)

- Thêm additive `hub.orderCodePrefix` nullable trong bước backfill, sau đó mới chuyển thành required theo change request riêng khi mọi Hub active đã có giá trị hợp lệ; unique index case-insensitive hoặc lưu normalized uppercase.
- Thêm `order_code_counter`: `hubId`, `operatorInitials`, `yearMonth`, `lastSequence`, timestamps; unique `(hubId, operatorInitials, yearMonth)`.
- `order.orderCode` unique hiện hữu được giữ nguyên; bổ sung immutability ở service/domain và không lọc `deletedAt` khi xét uniqueness.
- `OrderEntity.createdByUserId` là audit identity; snapshot thêm `createdByInitials`/`originOrderCodePrefix` nếu cần bảo toàn khả năng giải thích mã sau khi user đổi tên hoặc Hub đổi prefix.

Implementation touchpoints tối thiểu:

- Hub backend/admin UI: entity, create/update DTO, uniqueness validation, form `orderCodePrefix`, migration/backfill.
- User provisioning: cho phép Hub assignment với actor đã có quyền tạo Order; validate Hub active.
- Orders: bỏ client-owned `orderCode`, thay generator hiện tại bằng transaction + counter repository, khóa update code.
- Frontend Orders/Warehouse: readonly `Tự sinh khi lưu`, field customer reference riêng, hiển thị/copy code sau create.

#### A. Nền tảng multi-order/multi-stop (precondition của Mode 2)

- `trip_stop`: `id`, `tripId`, `hubId`, `sequence`, `status`, `eta`, `arrivedAt`, `departedAt`.
- `trip_order_allocation`: `id`, `tripId`, `orderId`, `unloadStopId`, planned `quantity/weightKg/volumeM3`, `unloadedAt`, `version`.
- Unique/index tối thiểu: `(tripId, sequence)`, `(tripId, orderId, unloadStopId)`, `unloadStopId`, `unloadedAt`.
- Backfill mỗi `trip.orderId` hiện hữu thành một allocation. Giữ cột cũ trong compatibility window; mọi bước loại bỏ sau này là migration riêng cần user approval.
- “Chuyến còn hàng” tại hub = còn allocation có `unloadStopId = currentStop`, `unloadedAt IS NULL`; không suy ra từ `CÒN CHỖ` hoặc chỉ từ `Trip.status`.

#### B. `waybill`

- Identity: `id`, `waybillCode` (`DDMMYY-xxxx`, nullable khi draft), `mode`, `status`, `version`.
- Scope: `hubId` FK bắt buộc và server-derived; `sourceTripId` nullable; `receivedAt` bắt buộc khi confirm.
- Snapshot xe: `contractorName`, `vehicleLicensePlate`, `receiverOrDriverName`, `driverPhone`. Mode 2 lấy từ Trip và readonly; Mode 1 nhập tay.
- Audit: `createdByUserId`, `confirmedByUserId`, `startedInboundByUserId`, `completedByUserId` và timestamps tương ứng; `cancelledBy/reason` nếu hủy.
- Không lưu năm URL PDF trên bảng này.

#### C. `waybill_item`

- Reference: `waybillId`, `orderId` nullable cho ad-hoc, `tripOrderAllocationId` nullable, `sourceType = ORDER_ALLOCATION | AD_HOC`.
- Snapshot theo scan: dispatcher, external order code, customer, pickup address/date, goods description, planned quantity/weight/volume, delivery date/mode/address/hub, target station, prepared flag, notes.
- Kiểm đếm: actual quantity/weight/volume, condition, storage location, anomaly note.
- Dùng PostgreSQL `numeric`, không dùng `float` cho kg/m³. Dates dùng `date`/`timestamptz`, không lưu string trình bày.
- Unique chống nhận trùng allocation tại cùng hub; record đã `COMPLETED_INBOUND` không được sửa snapshot.

#### D. Documents, ảnh và ký nhận

- `warehouse_document`: `id`, `documentType`, `waybillId?`, `waybillItemId?`, `tripId?`, `tripStopId?`, `fileId`, `status=PENDING|READY|FAILED`, `templateVersion`, checksum, generatedBy/At.
- `waybill_item_attachment`: liên kết `FileEntity`, loại ảnh, người tải, thời điểm; validate MIME/size.
- `warehouse_signoff`: người ký, vai trò ký, thời điểm và file/chữ ký nếu phase này thật sự số hóa. Nếu chỉ in giấy, template để ô ký trống và không giả vờ đã lưu chữ ký.
- Tem A4 có cardinality theo item/pallet; loading sheet có cardinality theo trip/stop. Không dùng một URL duy nhất trên Waybill để đại diện tất cả.

### API Contract Canonical v2.1

| API | Role/scope | Ý nghĩa |
|---|---|---|
| `GET /v1/waybills` | SA; WM forced `currentUser.hubId` | Paginated list, URL-synced filters; response `{ data, meta }` |
| `POST /v1/waybills` | SA/WM | Tạo draft; bỏ qua `hubId/status/vehicle snapshot` do client gửi |
| `GET/PATCH /v1/waybills/:id` | SA hoặc WM cùng hub | Detail/update draft; 404/403 không làm lộ dữ liệu hub khác |
| `PATCH /v1/waybills/:id/confirm` | SA/WM cùng hub | Sinh code an toàn race, `DRAFT → PENDING_INBOUND` |
| `PATCH /v1/waybills/:id/start-inbound` | WM cùng hub | `PENDING_INBOUND → INBOUND` |
| `PATCH /v1/waybills/:id/complete-inbound` | WM cùng hub | Lưu actual count/condition/bin/signoff trong một transaction |
| `PATCH /v1/waybills/:id/cancel` | Theo matrix đã duyệt | Hủy có reason; không dùng DELETE cho record đã confirm |
| `GET /v1/warehouse/inbound-trips` | WM cùng hub | Trips/stops đang đến và còn allocation chưa dỡ; search/filter/pagination server-side |
| `GET /v1/warehouse/inbound-trips/:tripId/orders` | WM cùng hub | Chỉ trả allocations đủ điều kiện nhận tại hub hiện tại |
| `POST /v1/warehouse/documents` | SA/WM cùng hub | Queue generate document; trả document job/id |
| `GET /v1/warehouse/documents/:id/download` | SA/WM cùng hub | Signed URL ngắn hạn hoặc stream có authorization |

Mọi command nhận header `Idempotency-Key`; error trả code nội bộ + `message` tiếng Việt. Frontend luôn đi qua `formatApiError()` và không render raw validation dumps.

Đối với Orders hiện hữu:

- `POST /v1/orders`: server lấy authenticated user kèm Hub, allocate code atomically và bỏ `orderCode` khỏi `CreateOrderDto`.
- `GET /v1/orders/generate-code` hiện tại phải deprecate/xóa khỏi UI vì chỉ “gợi ý” bằng `MAX+1` và không reserve; code chỉ được trả sau khi draft Order đã tạo thành công.
- `PATCH /v1/orders/:id`: loại `orderCode` khỏi `UpdateOrderDto`; request cố sửa mã bị reject.

### Frontend Contract Canonical v2.1

- Desktop operational table: 15 cột vật lý (14 theo Excel + `Thao tác`), sticky `STT` + `Mã đơn`, inner horizontal scroll, fullscreen có `Esc`/restore focus.
- Row editor không phải wizard: cho phép inline edit hoặc một dialog duy nhất cho một dòng; Tab order đúng cột; paste TSV và import `.xlsx` cùng dùng một parser/validation pipeline.
- Mode 2 inbound: trigger → modal chọn **chuyến đang đến/còn hàng** → modal chọn allocations cần dỡ → review readonly trip snapshot + actual receiving → confirm.
- Loading plan outbound là route/dialog riêng; không tái sử dụng copy hoặc mutation của inbound picker.
- `J2W764`: dùng action map theo status + role. Panel “trạng thái tiếp theo” trong canvas chỉ là annotation và không được render nguyên trạng cho người dùng.
- Mobile: cargo cards, required marker, 3-mode destination selector, sticky action bar, minimum 44 px; thêm skeleton, empty, error, offline/retry và unsaved-change guard.
- TanStack Query keys phải tách list/detail/inboundTrips/eligibleOrders/documents; mutation cập nhật detail + list + counters, chống double submit.
- UI không cho nhập internal `orderCode`: Order mới hiển thị “Tự sinh khi lưu”; sau create hiển thị code readonly/copyable. Mode 2 hiển thị code Order nguồn readonly. Customer reference, nếu có, là field riêng.

### Notification Contract (Phải cập nhật `leader/notifications.md` trước code)

| Event đề xuất | Recipients tối thiểu | Channel |
|---|---|---|
| `WAREHOUSE_ANOMALY_RECORDED` | WM đúng hub, Dispatcher của order, Fleet phụ trách source trip, SUPER_ADMIN | In-app + Email |
| `WAREHOUSE_INBOUND_COMPLETED` | Dispatcher/Fleet liên quan và SUPER_ADMIN; WM hub kế tiếp nếu đã xác định | In-app; Email cho milestone quan trọng |
| `WAREHOUSE_RECEIPT_CANCELLED` | Các actor liên quan và SUPER_ADMIN | In-app + Email |
| Save draft / sửa draft | Không gửi | — |

Notification phải enqueue sau khi transaction chính commit (outbox hoặc BullMQ), retry có giới hạn và không làm fail nghiệp vụ chính.

### Revised Sprint Order & Exit Criteria

| Sprint | Nội dung | Exit criteria |
|---|---|---|
| **Sprint 0** | Sửa canvas theo G0.1/G0.2, chốt aggregate/RBAC/notification, re-audit | UI ≥ 40/50, 0 Auto-FAIL, decision log được duyệt |
| **Sprint 1** | Additive `trip_stop` + `trip_order_allocation`, backfill và compatibility adapter | Existing Trips tests pass; multi-order/multi-stop/partial unload tests pass; chưa drop cột |
| **Sprint 2** | Waybill backend, hub scoping, transitions, audit/idempotency | Unit + API integration + concurrency tests pass |
| **Sprint 3** | Mode 1 desktop/mobile, 15-column grid, paste/import Excel | Golden parser tests + form E2E + no body overflow |
| **Sprint 4** | Mode 2 inbound picker/eligible allocations/receiving count & anomalies | Duplicate unload/race/hub-isolation tests pass |
| **Sprint 5** | Detail state variants + inbound slip + Tem A4 + document queue/storage | Golden PDF tests; private authorized download; 11 label fields |
| **Sprint 6** | Outbound loading plan, Phiếu xuất, POD sau khi resource tương ứng sẵn sàng | A4 landscape 14 columns no clip; outbound state tests pass |
| **Sprint 7** | Accessibility, mobile/offline, RBAC 3 layers, regression/E2E | Full core suites pass, audit docs updated |

Ước lượng thực tế sau khi đóng Sprint 0: **18–30 ngày dev** tùy mức độ phải mở rộng Trip multi-order/multi-stop và phạm vi chữ ký/POD; estimate cũ 8–11 ngày không còn đáng tin cậy.

### Test Gaps Bắt Buộc Bổ Sung

- Concurrency sinh `waybillCode`; confirm/cancel/complete lặp và hai request đồng thời.
- Concurrency sinh `orderCode`: ít nhất 50 request song song cùng Hub/initials/month không trùng; hai user trùng initials dùng chung counter; khác Hub/month có scope riêng.
- Normalization initials: tên nhiều khoảng trắng, dấu tiếng Việt, `Đ/đ`, dấu gạch/apostrophe; thiếu full name/hub/prefix và Hub inactive đều bị chặn.
- Time boundary tại 23:59:59 → 00:00:00 theo `Asia/Ho_Chi_Minh`; soft-deleted code không được cấp lại; batch create rollback không để lại Orders nửa chừng.
- WM không có hub bị chặn bằng thông báo Việt; WM Hub A không query/mutate/generate document của Hub B; SA override có audit.
- Trip nhiều orders, nhiều stops, partial unload; chỉ allocation của current hub được chọn; nhận trùng trả conflict.
- Paste Excel có merged/blank cells, decimal `1.280`/`1,280`/`5,0`, quá 200 dòng, sai thứ tự cột và formula injection.
- Import file kiểm MIME/size; không thực thi formula/macro; preview lỗi theo row/cell trước submit.
- State-action contract cho đủ `DRAFT/PENDING_INBOUND/INBOUND/COMPLETED_INBOUND/CANCELLED` và read-only role.
- Golden PDF/page-size/font/Unicode cho Phiếu nhập, Tem A4 và Loading Sheet; 14 cột không clip.
- Document generation retry/idempotency/stale template; signed URL hết hạn và unauthorized access.
- Mobile 320/375/390/768 px, keyboard/focus trap, `Esc`, restore focus, no body overflow, touch target ≥ 44 px.
- Notification outbox/queue failure không rollback warehouse transaction; SUPER_ADMIN luôn được include ở event đã duyệt.

### Security & Configuration Corrections

- Không ghi URL bucket cụ thể, access key, email/password test vào plan hoặc source. Dùng biến môi trường và fixtures cục bộ git-ignored.
- PDF/POD/ảnh bất thường mặc định là private object; dùng signed URL/authorized stream. Chỉ chuyển public nếu business phê duyệt rõ.
- Escape toàn bộ text từ người dùng trước khi render HTML/PDF; chặn remote URL tùy ý để tránh SSRF.
- Không dùng `ACL: public-read` mặc định. Reuse Files infrastructure hoặc tạo adapter lưu `FileEntity` + object key.
- Chọn PDF engine sau deployment spike trên môi trường đích; `html-pdf-node` vẫn phụ thuộc Chromium/Puppeteer và không được coi là “không cần Chrome”.

### Release, Migration & Rollback Contract

1. Chốt Sprint 0 và lưu audit baseline; chưa bật route/action mới nếu score còn dưới gate.
2. Deploy migration additive trước code. Chạy preflight đếm Trip hiện hữu, allocation dự kiến, orphan FK và coverage `orderCodePrefix` của mọi Hub active; tuyệt đối không dùng `synchronize: true`.
3. Backfill `trip.orderId → trip_order_allocation` bằng job idempotent có dry-run, progress log và reconciliation report. Không xóa cột cũ trong release này.
4. Deploy backend ở chế độ dual-read/compatibility; kiểm tra metrics lỗi, mismatch và hub-scope denial trước khi frontend sử dụng API mới.
5. Bật Mode 1 trước. Mode 2 nằm sau feature flag cho tới khi backfill = 100%, mismatch = 0 và test multi-stop/partial unload pass.
6. Document worker triển khai riêng với health check, retry/dead-letter visibility và smoke test font tiếng Việt/A4 trên chính runtime production.
7. Rollback ứng dụng bằng cách tắt feature flag/quay lại code dual-read; migration additive và dữ liệu backfill được giữ nguyên. Mọi kế hoạch drop cột là change request khác, cần user approval.

### Definition of Ready / Definition of Done

**Ready để bắt đầu implementation**:

- [ ] Canvas sửa xong G0.1–G0.2, loading sheet không clip, re-audit ≥ 40/50 và 0 FAIL.
- [ ] Business ký quyết định Waybill per-hub receipt, multi-order/multi-stop Trip, Mode 1 ad-hoc và ownership của 5 mẫu in.
- [ ] `leader` prerequisite về mã Order đã pass: mọi Hub active có unique `orderCodePrefix`, actor tạo Order có hub/full name, counter design và timezone `Asia/Ho_Chi_Minh` được duyệt.
- [ ] RBAC matrix + `leader/notifications.md` đã chứa contract warehouse được duyệt.
- [ ] Schema/data impact/backfill/dry-run/rollback được review; chưa có destructive migration.
- [ ] Exact column/field mapping của hai workbook được đóng băng thành fixtures/golden files.

**Done để release**:

- [ ] Sidebar, route guard và API guard nhất quán; hub isolation test pass.
- [ ] State/action matrix và mọi transition/concurrency/idempotency test pass.
- [ ] Paste TSV/import `.xlsx`, mobile/keyboard/no-overflow và error sanitization E2E pass.
- [ ] Golden PDFs pass: Tem A4 đủ 11 mục; Loading Sheet A4 ngang đủ 14 cột, subtotal đúng, không clip.
- [ ] File private, authorized download, queue retry/dead-letter và notification non-blocking được kiểm chứng.
- [ ] Backfill reconciliation = 100%, observability/runbook/rollback drill hoàn tất, `CODEBASE_AUDIT.md` được cập nhật sau implementation.

---

## 📋 Xác Nhận Các Quyết Định Thiết Kế

| # | Câu hỏi | Quyết định |
|---|---|---|
| **Q1** | DB Schema | ✅ `Waybill` là một lần tiếp nhận tại một hub; chứa N items, mỗi item có thể tham chiếu Order/allocation hoặc là ad-hoc. Không diễn giải đơn giản là `1 order → N waybills`. |
| **Q2** | Excel Paste/Import | ✅ **P0 trong scope** — paste TSV + import `.xlsx` phải hoàn thành cùng grid để đáp ứng zero-tolerance spec. |
| **Q3** | Print templates | ✅ Preview React/Print CSS và document generation có queue. Phiếu nhập + Tem A4 thuộc Waybill; Loading Sheet thuộc Trip/Stop; Phiếu xuất/POD thuộc outbound resource. File lưu qua `FileEntity`, download có authorization. |
| **Q4** | Mode 2 | ✅ Tách inbound receiving khỏi outbound loading; canvas phải sửa copy/action và audit lại trước code. |
| **Q5** | RBAC | ✅ Sprint hiện tại chỉ SA/WM; WM luôn server-side scoped theo `currentUser.hubId`. |
| **Q6** | Quản lý Xe Bo theo 34 Tỉnh Thành Việt Nam | ✅ **Quy chuẩn định danh thống nhất (`/leader`)**: Theo cơ cấu địa giới hành chính Việt Nam sau sáp nhập cấp tỉnh (chính thức từ 1/7/2025 - 2026 theo Nghị quyết của Quốc hội), Việt Nam có **34 đơn vị hành chính cấp tỉnh** (gồm 6 TP trực thuộc TW & 28 Tỉnh). Hệ thống thiết lập danh mục **34 Tuyến Xe Bo** tương ứng với 34 tỉnh thành này theo định dạng chuẩn: **`Xe bo Tuyến <Tên Tỉnh/Thành>`**. |

---

## 📊 Gap Analysis

> **Lưu ý v2.1**: Các mục Sprint 1–6 bên dưới là bản phân rã kỹ thuật chi tiết được giữ lại từ v1.x. Chỉ dùng sau khi đã áp dụng các quyết định Canonical v2.1 ở trên; các code sketch về schema, PDF và API là minh họa, không được triển khai nguyên văn.

### ✅ Những gì đã có

| Thành phần | File | Trạng thái |
|---|---|---|
| Warehouse page route | `frontend/src/app/dashboard/warehouse/page.tsx` | Stub — render WarehouseListing |
| WarehouseListing | `frontend/src/features/warehouse/components/warehouse-listing.tsx` | Chỉ prefetch Trips |
| WarehouseInboundBoard | `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx` | Card view Trips — chưa đủ |
| WarehouseTable + columns | `frontend/src/features/warehouse/components/warehouse-tables/` | Đọc Trips, thiếu action kho |
| **S3-compatible storage** | `backend/src/files/infrastructure/uploader/s3/` | ✅ Có S3Client + multer-s3; phải reuse `FileEntity` và quyền download riêng tư |
| **FileEntity** | `backend/src/files/.../entities/file.entity.ts` | Bảng `file` (id uuid, path, createdBy) |
| **FilesS3Service** | `backend/src/files/.../uploader/s3/files.service.ts` | Có `create(multerS3File)` → lưu path vào DB |
| **S3 Config** | `.env` | Supabase S3 endpoint + bucket `logistics-media` + credentials |
| TripEntity | `backend/src/trips/.../trip.entity.ts` | Có dữ liệu xe/tài xế nhưng hiện chỉ gắn một `orderId`; chưa đủ cho Mode 2 nhiều đơn/nhiều điểm dừng |
| RBAC Route Guard | `frontend/src/proxy.ts` | /dashboard/warehouse → WAREHOUSE_MANAGER ✅ |

### ❌ Những gì chưa có (Gap)

| Hạng mục | Ảnh hưởng |
|---|---|
| DB Schema: Bảng `waybill` + `waybill_item` | 🔴 Critical |
| Backend: `WaybillModule` (CRUD + state machine) | 🔴 Critical |
| Backend: document generation worker + template versioning | 🔴 Critical (Q3) |
| Backend: API queue document → `warehouse_document` + `FileEntity` → authorized download | 🔴 Critical (Q3) |
| Frontend: Form nhập hàng dạng Grid (Excel-like với viền đỏ Bắt buộc) | 🔴 Critical |
| Frontend: Trip Selection Modal (Mode 2) | 🔴 Critical |
| Frontend: Timeline Stepper 3 chặng | 🔴 Critical |
| Frontend: Print preview + Template Tem A4 + Bảng Kế Hoạch Đóng Hàng | 🟡 High |
| Frontend: Mobile UX — Cargo Cards (Red border) + Sticky bar | 🟡 High |
| RBAC Matrix: Waybill endpoints | 🟠 Medium |

---

## 🏗️ Sprint 1 — DB Schema & Backend WaybillModule (legacy sketch; canonical v2.1 wins)

### 1.1 Entity: `WaybillEntity`

**File mới**: `backend/src/waybills/infrastructure/persistence/relational/entities/waybill.entity.ts`

```typescript
@Entity({ name: 'waybill' })
export class WaybillEntity extends AbstractBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String, unique: true, nullable: true })
  waybillCode: string | null;           // Format: DDMMYY-xxxx (sinh khi PENDING_INBOUND)

  @Column({ type: String, default: 'DRAFT' })
  warehouseStatus: string;             // DRAFT | PENDING_INBOUND | INBOUND | COMPLETED_INBOUND | ...

  @Column({ type: String })
  mode: string;                        // DIRECT_CUSTOMER | HUB_TRANSFER

  @Column({ type: Number })
  hubId: number;                       // FK → hub (Hub nhận hàng = currentUser.hubId)

  @Column({ type: Number, nullable: true })
  tripId: number | null;               // FK → trip (Mode 2 only)

  // ─── Thông tin xe/tài xế/nhà thầu (Red Border Fields) ───
  @Column({ type: String, nullable: true })
  vehicleLicensePlate: string | null;  // 🔴 Biển số xe (VD: 43H30703)

  @Column({ type: String, nullable: true })
  driverName: string | null;           // 🔴 Họ tên tài xế

  @Column({ type: String, nullable: true })
  driverPhone: string | null;          // 🔴 SĐT tài xế (VD: 0964248662)

  @Column({ type: String, nullable: true })
  receiverName: string | null;         // 🔴 Họ tên người nhận/lái xe (VD: Bùi Ngọc Tân)

  @Column({ type: String, nullable: true })
  subContractor: string | null;        // 🔴 Nhà thầu vận chuyển (VD: SPIDER)

  // Địa chỉ nhận hàng là snapshot theo từng item, không lặp ở header.

  @Column({ type: String, nullable: true })
  dispatcherContact: string | null;    // Người điều hành phụ trách (VD: HCM - Minh 0363920977)

  @Column({ type: String, nullable: true })
  targetStation: string | null;        // Trạm/Tỉnh đích tóm tắt ("Đã soạn", VD: đà nẵng, hà nam)

  // ─── Thông tin Pallet (Phục vụ In Tem Nhận Diện Khổ A4) ───
  @Column({ type: Number, nullable: true })
  palletIndex: number | null;          // Palet số (VD: 1)

  @Column({ type: Number, nullable: true })
  totalPallets: number | null;         // Tổng số palet (VD: 5)

  @Column({ type: Number, nullable: true })
  createdByUserId: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Document không lưu thành các URL rời trên waybill; dùng warehouse_document + FileEntity.

  @OneToMany(() => WaybillItemEntity, (item) => item.waybill, { cascade: true })
  items: WaybillItemEntity[];
}
```

### 1.2 Entity: `WaybillItemEntity`

**File mới**: `backend/src/waybills/infrastructure/persistence/relational/entities/waybill-item.entity.ts`

```typescript
@Entity({ name: 'waybill_item' })
export class WaybillItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: Number })
  waybillId: number;

  @Column({ type: Number, default: 1 })
  rowIndex: number;                   // Thứ tự dòng trên grid

  @Column({ type: String, nullable: true })
  orderCode: string | null;           // Readonly snapshot từ canonical Order; VD: HCM-LTV-2609-011

  @Column({ type: String, nullable: true })
  customerReferenceCode: string | null; // Bill/chứng từ khách, không thay internal orderCode

  @Column({ type: String, nullable: true })
  customerCode: string | null;        // Mã & Tên khách hàng (VD: KH0124MASAN)

  @Column({ type: 'text' })
  pickupAddress: string;              // 🔴 Địa chỉ nhận hàng

  @Column({ type: String, nullable: true })
  pickupDate: string | null;          // Ngày cần bốc hàng (VD: 7H sáng 3/9/2026)

  @Column({ type: 'text' })
  goodsDescription: string;           // 🔴 Tên hàng — NO SKU (VD: Nguyên Liệu, Can thực phẩm...)

  @Column({ type: 'int', default: 0 })
  quantity: number;                   // 🔴 Số thùng/kiện

  @Column({ type: 'numeric', precision: 14, scale: 3, default: 0 })
  weightKg: number;                   // 🔴 Số kg (Gross weight)

  @Column({ type: 'numeric', precision: 14, scale: 3, default: 0 })
  volumeM3: number;                   // 🔴 Số m³/CBM

  @Column({ type: String, nullable: true })
  deliveryDate: string | null;        // Ngày cần giao hàng (VD: 13h00 ngày 05/09/2026)

  // Địa chỉ giao hàng — 3-mode (🔴 Bắt buộc)
  @Column({ type: String, default: 'FREE_TEXT' })
  deliveryMode: string;               // FREE_TEXT | HUB_L1 | HUB_L2_SAT

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;     // FREE_TEXT: nhập tay (VD: CÔNG TY TNHH MNS MEAT HÀ NAM...)

  @Column({ type: Number, nullable: true })
  deliveryHubId: number | null;       // HUB_L1 / HUB_L2_SAT: FK → hub

  @Column({ type: String, nullable: true })
  targetStation: string | null;        // Tỉnh/Trạm đích ngắn gọn ("Đã soạn", VD: ninh bình, hà nam)

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
```

### 1.3 Migration TypeORM

**File mới**: `backend/src/database/migrations/{timestamp}-CreateWaybillAndWaybillItem.ts`

Tạo additive `trip_stop`, `trip_order_allocation`, `waybill`, `waybill_item`, `warehouse_document` và các bảng attachment/signoff cần thiết. Không tạo các cột `pdf*Url` trên `waybill`.
Indexes/unique phải bao phủ hub scope, state queries, code generation và chống nhận trùng allocation theo G0.4/G0.10.

### 1.4 WaybillModule — NestJS

**Files mới**:
```
backend/src/waybills/
  domain/waybill.ts
  dto/create-waybill.dto.ts
  dto/create-waybill-item.dto.ts
  dto/query-waybill.dto.ts
  waybills.module.ts
  waybills.service.ts
  waybills.controller.ts
```

**API Endpoints**:

| Endpoint | Method | Role | Mô tả |
|---|---|---|---|
| `POST /v1/waybills` | POST | WM, SA | Tạo đơn nhập kho (Mode 1 & 2) |
| `GET /v1/waybills` | GET | WM, SA | Danh sách; WM bị ép scope theo hub trong JWT |
| `GET /v1/waybills/:id` | GET | WM, SA | Chi tiết + items; kiểm tra cùng hub |
| `PATCH /v1/waybills/:id` | PATCH | WM, SA | Cập nhật DRAFT |
| `PATCH /v1/waybills/:id/confirm` | PATCH | WM, SA | DRAFT → PENDING_INBOUND (sinh waybillCode) |
| `PATCH /v1/waybills/:id/start-inbound` | PATCH | WM | PENDING_INBOUND → INBOUND |
| `PATCH /v1/waybills/:id/complete-inbound` | PATCH | WM | INBOUND → COMPLETED_INBOUND |
| `POST /v1/warehouse/documents` | POST | WM, SA | Queue tạo tài liệu đúng resource ownership |
| `PATCH /v1/waybills/:id/cancel` | PATCH | Theo matrix duyệt | Hủy có reason; chỉ draft chưa dùng có thể soft-delete nội bộ |

**Files sửa**:
- `backend/src/app.module.ts` → import WaybillsModule
- `backend/src/trips/trips.controller.ts` → thêm filter `destinationHubId`, `status=IN_TRANSIT`

---

## 🏗️ Sprint 2 — Frontend: API Layer + Form Grid Mode 1

### 2.1 API Layer (TanStack Query)

**Files mới**:
- `frontend/src/features/warehouse/api/types.ts`
- `frontend/src/features/warehouse/api/queries.ts`
- `frontend/src/features/warehouse/api/mutations.ts`

```typescript
// Key mutations
useCreateWaybill()              // POST /v1/waybills
useConfirmWaybill()             // PATCH /v1/waybills/:id/confirm
useStartInbound()               // PATCH /v1/waybills/:id/start-inbound
useCompleteInbound()            // PATCH /v1/waybills/:id/complete-inbound
useCreateWarehouseDocument()    // POST /v1/warehouse/documents → trả document/job id
useCancelWaybill()              // PATCH /v1/waybills/:id/cancel
```

### 2.2 WarehouseCreateDialog

**File mới**: `frontend/src/features/warehouse/components/warehouse-create-dialog.tsx`

Tab "Mới hoàn toàn" (Mode 1):
- Header 5 trường theo mẫu: receivedAt, subContractor, vehicleLicensePlate, receiverOrDriverName, driverPhone
- `<WaybillGridInput />` component
- Sticky Footer: [Hủy] [Lưu nháp] [Xác nhận đơn →]

Tab "Luân chuyển nội bộ" (Mode 2):
- `<TripSearchBar />` → tìm Trips IN_TRANSIT → destinationHub
- `<TripSelectionModal />` → checkbox chọn đơn
- `<WaybillGridInput readonly vehicleSection />` + nút "+ Thêm hàng bổ sung"

### 2.3 WaybillGridInput

**File mới**: `frontend/src/features/warehouse/components/waybill-grid-input.tsx`

15 cột vật lý (14 cột nghiệp vụ + `Thao tác`), được gom thành 8 nhóm nhập liệu lõi; thứ tự chi tiết phải theo Excel loading plan và canvas đã duyệt:

| STT | Tên cột | Control |
|---|---|---|
| 1 | STT | Auto-increment |
| 2 | Mã đơn hàng | readonly; `Tự sinh khi lưu` hoặc code Order nguồn |
| 3 | Địa chỉ nhận hàng | text / readonly (Mode 2) |
| 4 | Tên hàng | text input (NO SKU) |
| 5.1 | Số thùng (kiện) | number int |
| 5.2 | Số kg | number decimal |
| 5.3 | Số m³ (CBM) | number decimal |
| 6 | Địa chỉ giao hàng | **3-mode selector** |
| 7 | Ghi chú | text input |
| 8 | Thao tác | [+] [⧉] [🗑] icons |

Tab key: chuyển ô đúng thứ tự → xuống dòng mới cuối hàng.

Cột 6 — `<WaybillDeliverySelector />`:
- Segmented: [Địa chỉ tự do] [Hub cấp 1] [Hub cấp 2 / Xe bo]
- `FREE_TEXT`: text input nhập tay địa chỉ giao tận nơi của khách lẻ
- `HUB_L1`: dropdown danh sách kho trung tâm chính từ `/v1/hubs/active` (VD: Andromeda Hub - Hà Nội, Magellan Hub - Đà Nẵng, Hubble Hub - HCM)
- `HUB_L2_SAT`: dropdown 34 tuyến xe bo vệ tinh ứng với **34 tỉnh/thành phố Việt Nam** sau sắp xếp 1/7/2025 - 2026:
  - **6 Thành phố trực thuộc TW**: `Xe bo Tuyến HCM`, `Xe bo Tuyến Hà Nội`, `Xe bo Tuyến Đà Nẵng`, `Xe bo Tuyến Hải Phòng`, `Xe bo Tuyến Cần Thơ`, `Xe bo Tuyến Huế`.
  - **28 Tỉnh thành**: `Xe bo Tuyến Hưng Yên`, `Xe bo Tuyến Bắc Ninh`, `Xe bo Tuyến Quảng Ninh`, `Xe bo Tuyến Ninh Bình`, `Xe bo Tuyến Thái Nguyên`, `Xe bo Tuyến Phú Thọ`, `Xe bo Tuyến Lào Cai`, `Xe bo Tuyến Tuyên Quang`, `Xe bo Tuyến Lạng Sơn`, `Xe bo Tuyến Cao Bằng`, `Xe bo Tuyến Lai Châu`, `Xe bo Tuyến Điện Biên`, `Xe bo Tuyến Sơn La`, `Xe bo Tuyến Thanh Hóa`, `Xe bo Tuyến Nghệ An`, `Xe bo Tuyến Hà Tĩnh`, `Xe bo Tuyến Quảng Trị`, `Xe bo Tuyến Quảng Ngãi`, `Xe bo Tuyến Gia Lai`, `Xe bo Tuyến Khánh Hòa`, `Xe bo Tuyến Lâm Đồng`, `Xe bo Tuyến Đắk Lắk`, `Xe bo Tuyến Đồng Nai`, `Xe bo Tuyến Tây Ninh`, `Xe bo Tuyến Đồng Tháp`, `Xe bo Tuyến Vĩnh Long`, `Xe bo Tuyến An Giang`, `Xe bo Tuyến Cà Mau`.
  *(Khi chọn bất kỳ tuyến xe bo nào, chứng từ xuất kho và tem Pallet A4 sẽ tự động in trường GIAO ĐẾN rõ ràng theo đúng tên tuyến xe bo tương ứng)*

### 2.4 Xử lý Cuộn Ngang Bảng & Chế Độ Toàn Màn Hình (Horizontal Scroll & Fullscreen View)

**Thành phần xử lý UX**:
- **Scroll Container**: Bọc toàn bộ bảng trong `ScrollArea` hoặc `div className="overflow-x-auto relative rounded-lg border border-slate-200"` với `min-w-[1550px]` cho thẻ `<table>`.
- **Sticky Columns**: Ghim cố định cột `STT` (left: 0) và cột `Mã đơn hàng` (left: 56px, `bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]`) để người dùng không mất dấu dòng khi cuộn ngang.
- **Scroll Indicator Badge**: Hiển thị badge nhỏ ở phía trên bảng: `"👉 Đang hiển thị 10/15 cột · Cuộn ngang ➔"` khi `scrollWidth > clientWidth`.
- **Nút Chuyển Đổi Toàn Màn Hình (Fullscreen Toggle)**:
  - Nút `[⛶ Toàn màn hình]` góc phải thanh công cụ bảng.
  - Khi kích hoạt: Mở rộng vùng làm việc chiếm trọn 100vw/100vh (hoặc ẩn Sidebar + thu gọn Header), chuyển sang giao diện tương đương frame **`WH_FULLSCREEN_TABLE`** (1920px), cho phép hiển thị trọn vẹn 15 cột mà không bị che khuất.
- **Mô phỏng Pencil Canvas**:
  - `WH_VIEWPORT_SCROLL_VIEW` (1440x1100px): Mô phỏng thực tế màn hình người dùng bị che cột 11–15, có thanh scrollbar track và indicator badge.
  - `WH_FULLSCREEN_TABLE` (1920x1100px): Màn hình mở rộng tối đa xem full table không cần cuộn.

---

## 🏗️ Sprint 3 — Mode 2 (Hành Trình 3 Bước) + Detail Sheet + Timeline

### 3.1 Quy trình 3 Bước Luân Chuyển Nội Bộ (Mode 2 Step-by-Step Flow)

Quy trình giao diện được chia thành 3 bước tương ứng với 3 frame trên Canvas Pencil:

1. **Bước 1A: Khởi tạo trên màn hình chính (Frame `dd8X5`)**:
   - Khi vào tab "Luân chuyển nội bộ", chưa chọn chuyến xe nào.
   - Stepper: `[① Chọn chuyến xe] (Active)` ➔ `[② Chọn đơn hàng] (Pending)` ➔ `[③ Kiểm tra & Nhận kho] (Pending)`.
   - Component `<TripSelectorTriggerBar />`: Thanh hiển thị "Chưa chọn chuyến hàng luân chuyển" + Nút **`[🚚 Chọn chuyến hàng ➔]`**.
   - Bấm nút ➔ Mở **Modal Chọn Chuyến Hàng (Bước 1B)**.

2. **Bước 1B: Modal Chọn Chuyến Xe Luân Chuyển (Frame `WH_CASE_02B_TRIP_MODAL`)**:
   - **File mới**: `frontend/src/features/warehouse/components/trip-picker-modal.tsx`
   - **Quy tắc cốt lõi (Leader Business Rule)**: Không quản lý trạng thái vi mô ('Tới cổng', 'Đang chạy'...). Chuyến xe chỉ kết thúc khi toàn bộ đơn hàng trên xe đã được dỡ và tiếp nhận hết (`hasRemainingOrders = true`).
   - Xử lý khi có **> 20 chuyến xe**:
     - Thanh Toolbar có Live count badge (`24 chuyến xe còn hàng`), Filter pills theo Hub xuất phát (`Tất cả còn hàng`, `Từ Andromeda HN`, `Từ Đà Nẵng`, `Từ Miền Tây`), và Live search input.
     - Bảng mini 7 cột hiển thị chuyến xe với tình trạng hàng trên xe (`Còn 5/5 đơn chưa dỡ`, badge `CÒN HÀNG`), khối lượng/kiện trên xe.
     - Phân trang gọn (`Trang 1/8`, Next/Prev, Direct pages).
   - Bấm `[Chọn chuyến này ➔ Sang Bước 2]` ➔ Mở tiếp Modal Chọn Đơn Hàng.

3. **Bước 2: Modal Chọn Đơn Hàng Trong Chuyến (Frame `WH_CASE_03_MODAL`)**:
   - **File mới**: `frontend/src/features/warehouse/components/trip-orders-modal.tsx`
   - Hiển thị danh sách các đơn hàng trên chuyến xe vừa chọn. Checkbox từng đơn hoặc `[Chọn tất cả]`.
   - Bấm `[Xác nhận nạp đơn vào bảng ➔]` ➔ Đóng modal và nạp toàn bộ vào Bước 3.

4. **Bước 3: Kiểm tra, bổ sung hàng dọc đường & Xác nhận (Frame `WH_CASE_02_TRANSFER_LOADED`)**:
   - Dữ liệu xe/tài xế tự động điền và khóa (Readonly).
   - Nạp các đơn hàng đã chọn vào `<WaybillGridInput />`.
   - Nút `[+ Thêm hàng phát sinh]` cho phép thủ kho thêm dòng hàng nhận thêm dọc đường (địa chỉ nhận = Hub hiện tại).
   - Nút `[Xác nhận tiếp nhận]` active sẵn sàng submit.

### 3.2 WaybillDetailSheet

**File mới**: `frontend/src/features/warehouse/components/waybill-detail-sheet.tsx`

- Header: waybillCode badge, warehouseStatus badge, mode badge
- Timeline Stepper 3 chặng (xem bên dưới)
- Bảng items (readonly)
- Action buttons theo state:
  - `DRAFT`: [Chỉnh sửa] [Xóa] [Xác nhận đơn →]
  - `PENDING_INBOUND`: [Bắt đầu nhập kho] [In phiếu / Tạo PDF] [Hủy]
  - `INBOUND`: [Ghi nhận bất thường] [Hoàn tất nhập kho ✓]
  - `COMPLETED_INBOUND`: [Tạo kế hoạch xuất] [Điều chuyển Hub] [Bàn giao đi giao]

### 3.3 WaybillTimelineStepper

**File mới**: `frontend/src/features/warehouse/components/waybill-timeline-stepper.tsx`

```
Step 1: Nhập kho (Hub gốc)          Step 2: Luân chuyển (N-Hubs)      Step 3: Giao hàng cuối
  PENDING_INBOUND                       IN_TRANSIT                         OUT_FOR_DELIVERY
  → INBOUND                         → COMPLETED_INBOUND                 → COMPLETED_OUTBOUND
  → COMPLETED_INBOUND
```

---

## 🏗️ Sprint 4 — PDF Generation + S3 Upload + Print

> **Thay thế theo v2.1**: Luồng đồng bộ và code `public-read` dưới đây chỉ là sơ đồ v1.x. Triển khai thật phải dùng document job, `warehouse_document`, `FileEntity` và authorized download; template phải escape dữ liệu người dùng.

### Kiến trúc PDF Flow

```
[Frontend: nút "Tạo PDF / Tải PDF"]
           │
           ▼
POST /v1/warehouse/documents { resourceType, resourceId, documentType }
           │
           ▼ (Backend)
[WarehouseDocumentWorker.generate()]
   1. Fetch waybill + items từ DB
   2. Render HTML template string (Handlebars / template literals)
   3. Puppeteer: html → Buffer PDF
           │
           ▼
[S3Client.putObject()]
   - Bucket: logistics-media (Supabase S3)
   - Key: waybills/{waybillCode}/{type}-{timestamp}.pdf
   - ContentType: application/pdf
           │
           ▼
[DocumentService: lưu object key qua FileEntity]
   - warehouse_document.fileId = file.id
   - status = READY, lưu checksum + templateVersion
           │
           ▼
Response ban đầu: { documentId, status: "PENDING" }
           │
           ▼
[Frontend: poll/query status → gọi authorized download khi READY]
```

### 4.1 Backend — PDF Generation Service

**File mới**: `backend/src/waybills/pdf/waybill-pdf.service.ts`

```typescript
// Dependencies cần cài:
// npm install puppeteer-core @sparticuz/chromium
// Chọn engine sau deployment spike; cả Puppeteer/html-pdf-node đều cần Chromium phù hợp.

@Injectable()
export class WaybillPdfService {
  constructor(
    private readonly configService: ConfigService,
    // Inject S3Client trực tiếp (reuse config từ FilesS3Module)
  ) {}

  async generateAndUpload(
    waybill: WaybillEntity,
    type: 'INBOUND_SLIP' | 'OUTBOUND_SLIP' | 'DELIVERY_NOTE' | 'CARGO_LABEL' | 'LOADING_SHEET',
  ): Promise<string> {
    // 1. Render HTML từ template
    const html = this.renderTemplate(waybill, type);

    // 2. Generate PDF buffer
    const pdfBuffer = await this.generatePdfBuffer(html, type === 'LOADING_SHEET' ? 'landscape' : 'portrait');

    // 3. Upload lên S3 Supabase
    const key = `waybills/${waybill.waybillCode}/${type.toLowerCase()}-${Date.now()}.pdf`;
    const url = await this.uploadToS3(pdfBuffer, key);

    return url;
  }

  private renderTemplate(waybill, type): string {
    // HTML template cho từng loại phiếu:
    // - INBOUND_SLIP: mã DDMMYY-xxxx, bảng items, 2 ô ký
    // - OUTBOUND_SLIP: thông tin xuất kho
    // - DELIVERY_NOTE: POD + ô ký khách
    // - CARGO_LABEL: Tem A4 Pallet chuẩn 11 mục (TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx)
    // - LOADING_SHEET: Bảng Kế Hoạch Đóng Hàng Xe Tuyến A4 ngang (14 cột + hotline 3 miền)
  }

  private async generatePdfBuffer(html: string, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<Buffer> {
    const file = { content: html };
    const options = { format: 'A4', landscape: orientation === 'landscape', printBackground: true };
    return htmlPdf.generatePdf(file, options);
  }

  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    const s3Client = new S3Client({ /* reuse config từ env */ });
    await s3Client.send(new PutObjectCommand({
      Bucket: this.configService.get('file.awsDefaultS3Bucket'),
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      // Không đặt ACL public; object mặc định private.
    }));
    return key; // lưu object key vào FileEntity; không trả public URL.
  }
}
```

**File mới**: `backend/src/waybills/pdf/templates/inbound-slip.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/outbound-slip.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/delivery-note.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/cargo-label.template.ts`       ← Tem A4 Pallet 11 mục
**File mới**: `backend/src/waybills/pdf/templates/loading-sheet.template.ts`     ← Bảng Đóng Hàng Xe A4 ngang

### Endpoint Generate PDF

```typescript
// POST /v1/waybills/:id/generate-pdf?type=INBOUND_SLIP
@Post(':id/generate-pdf')
@Roles(RoleEnum.WAREHOUSE_MANAGER, RoleEnum.SUPER_ADMIN)
async generatePdf(
  @Param('id') id: string,
  @Query('type') type: PdfType,
): Promise<{ url: string; type: PdfType }> {
  const url = await this.waybillsService.generatePdf(+id, type);
  return { url, type };
}
```

**Logic canonical thay thế**:

1. Controller xác thực role + hub scope và enqueue document job idempotent.
2. Worker fetch resource đúng ownership, render template đã escape và upload private object.
3. Tạo/cập nhật `FileEntity` + `warehouse_document` (`READY`/`FAILED`, checksum, templateVersion).
4. Frontend query trạng thái và chỉ tải qua signed URL ngắn hạn hoặc authorized stream.

### 4.2 Frontend — Print Preview + PDF Button

**File mới**: `frontend/src/features/warehouse/components/waybill-print-view.tsx`

```typescript
// Component này phục vụ 2 mục đích:
// 1. Preview in trực tiếp (React + @media print CSS)
// 2. Nút "Tạo PDF & Lưu" → gọi API → nhận URL → mở tab

interface WaybillPrintViewProps {
  waybill: Waybill;
  type: 'INBOUND_SLIP' | 'OUTBOUND_SLIP' | 'DELIVERY_NOTE' | 'CARGO_LABEL' | 'LOADING_SHEET';
}

// Trong Dialog/Sheet chi tiết:
// [🖨️ In phiếu]       → window.print() với @media print CSS
// [📄 Tạo PDF & Lưu] → useGeneratePdf mutation → loading → toast "PDF đã tạo"
//                        → hiện link "Tải PDF ↓" hoặc mở tab mới
// [📋 Copy link PDF]  → nếu pdfUrl đã có → copy URL vào clipboard
```

**5 loại biểu mẫu in (nội dung bắt buộc)**:

| Loại | Nội dung | Định dạng & Điểm đặc biệt |
|---|---|---|
| **Phiếu Nhập Kho** | Mã `DDMMYY-xxxx`, Ngày, Xe+Tài xế, Hub nhận, Bảng items, Tổng lũy kế | Khổ A4 dọc, **2 ô ký**: Thủ kho + Lái xe |
| **Phiếu Xuất Kho** | Thông tin xuất Hub, xe nhận, danh sách kiện hàng | Khổ A4 dọc, Ghi chú bốc xếp xuất kho |
| **Phiếu Giao Hàng / POD** | Người nhận, địa chỉ giao, items, COD | Khổ A4 dọc, **Ô ký khách hàng** |
| **Tem Nhận Diện Hàng Hóa (A4)** | KHO, TÊN HÀNG, NGƯỜI ĐIỀU HÀNH, MÃ ĐƠN, NGÀY NHẬP, CHỨNG TỪ, SỐ LƯỢNG, PALET SỐ, TỔNG SỐ PALET, NGƯỜI NHẬP, GIAO ĐẾN | Khổ A4 dọc dán trực tiếp Pallet/Kiện, Barcode/QR to, chuẩn theo `docs_scan/TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx` |
| **Bảng Kế Hoạch Đóng Hàng Xe** | Header xe/tài xế/nhà thầu, Bảng 14 cột, Hàng tổng `SUBTOTAL`, Hotline 3 miền | Khổ A4 ngang, chuẩn theo `docs_scan/Kế Hoạch Đóng Hàng Xe 43H30703 Spider 3.9 K.xlsx` |

---

## 🏗️ Sprint 5 — Mobile UX + RBAC Update

### 5.1 Mobile UX

**File mới**: `frontend/src/features/warehouse/components/waybill-cargo-card.tsx`

- < 640px: Grid tự động chuyển sang Cargo Item Cards xếp dọc
- Mỗi card: orderCode, goodsDescription, qty/kg/m³, địa chỉ giao, ghi chú + nút xóa
- **Sticky Bottom Bar**: ghim cuối màn hình, touch target ≥ 44px
- Tất cả nút chính: height ≥ 44px

### 5.2 RBAC Matrix v1.5

**File sửa**: `.agents/rules/rbac-matrix.md`

Thêm bảng Waybills Controller:

| Endpoint | Method | SA | D | FM | WM |
|---|---|:-:|:-:|:-:|:-:|
| `POST /v1/waybills` | POST | ✅ | ❌ | ❌ | ✅ |
| `GET /v1/waybills` | GET | ✅ | ❌ | ❌ | ✅ |
| `GET /v1/waybills/:id` | GET | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/confirm` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/start-inbound` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/complete-inbound` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `POST /v1/warehouse/documents` | POST | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/cancel` | PATCH | Theo matrix duyệt | ❌ | ❌ | Theo matrix duyệt |

Bump RBAC v1.4 → **v1.5**

---

## 🏗️ Excel Integration — P0 thuộc Sprint 3

> Bắt buộc triển khai trong feature branch: paste TSV từ clipboard + import `.xlsx`, dùng chung parser/validation pipeline, preview lỗi theo row/cell và giới hạn 200 dòng. Chỉ thêm SheetJS sau khi kiểm tra dependency/security/licensing và khả năng parse workbook mẫu.

---

## 📁 Tổng Hợp Files Thay Đổi

### Backend — Files MỚI
```
backend/src/waybills/
├── domain/waybill.ts
├── dto/
│   ├── create-waybill.dto.ts
│   ├── create-waybill-item.dto.ts
│   └── query-waybill.dto.ts
├── infrastructure/persistence/relational/entities/
│   ├── waybill.entity.ts
│   └── waybill-item.entity.ts
├── documents/
│   ├── warehouse-document.service.ts   ← enqueue/status/FileEntity
│   ├── warehouse-document.worker.ts    ← render + private S3 upload
│   └── templates/
│       ├── inbound-slip.template.ts
│       ├── outbound-slip.template.ts
│       ├── delivery-note.template.ts
│       └── cargo-label.template.ts
├── waybills.module.ts
├── waybills.service.ts                 ← business logic + gọi PDF service
└── waybills.controller.ts

backend/src/database/migrations/
└── {timestamp}-CreateWaybillAndWaybillItem.ts
```

### Backend — Files SỬA
```
backend/src/app.module.ts              → import WaybillsModule
backend/src/trips/trips.controller.ts  → add destinationHubId filter
```

### Frontend — Files MỚI
```
frontend/src/features/warehouse/
├── api/
│   ├── types.ts
│   ├── queries.ts
│   └── mutations.ts
└── components/
    ├── warehouse-create-dialog.tsx
    ├── waybill-grid-input.tsx
    ├── waybill-delivery-selector.tsx   ← 3-mode selector (FREE_TEXT|HUB_L1|HUB_L2_SAT)
    ├── inbound-trip-picker-modal.tsx
    ├── inbound-order-allocation-modal.tsx
    ├── waybill-detail-sheet.tsx
    ├── waybill-timeline-stepper.tsx
    ├── waybill-print-view.tsx          ← Print CSS + "Tạo PDF" button
    └── waybill-cargo-card.tsx          ← Mobile card view
```

### Frontend — Files SỬA
```
frontend/src/features/warehouse/components/warehouse-listing.tsx
frontend/src/features/warehouse/components/warehouse-tables/columns.tsx
frontend/src/features/warehouse/components/warehouse-tables/index.tsx
frontend/src/features/warehouse/params.ts
frontend/src/app/dashboard/warehouse/page.tsx
```

### Root — Files SỬA
```
.agents/rules/rbac-matrix.md           → v1.4 → v1.5
```

---

## 📦 Dependencies Cần Cài

### Backend
```bash
# PDF generation: chốt engine sau deployment spike; không mặc định cài package ở bước lập kế hoạch.

# S3 upload: @aws-sdk/client-s3 đã có sẵn trong project ✅
```

### Frontend
```bash
# Không cần thêm dependency mới cho Print CSS
# Chỉ cần CSS @media print trong component
```

---

## ✅ Verification Checklist (legacy; phải bổ sung các gate/test canonical v2.1)

### Backend
- [ ] Migration chạy thành công: bảng `waybill` + `waybill_item` được tạo
- [ ] `POST /v1/waybills` Mode 1: tạo đơn + 5 dòng hàng → status DRAFT
- [ ] `POST /v1/waybills` Mode 2: chọn tripId + 2 dòng bổ sung → DRAFT
- [ ] `PATCH /v1/waybills/:id/confirm` → warehouseStatus = PENDING_INBOUND, waybillCode = DDMMYY-xxxx
- [ ] `PATCH /v1/waybills/:id/start-inbound` → INBOUND
- [ ] `PATCH /v1/waybills/:id/complete-inbound` → COMPLETED_INBOUND
- [ ] `POST /v1/warehouse/documents` tạo job idempotent; worker tạo PDF, lưu `FileEntity`, chuyển document `READY`.
- [ ] Download yêu cầu authorization, không dùng public URL; WM Hub A không tải tài liệu Hub B.
- [ ] RBAC: `DISPATCHER` → `POST /v1/waybills` → 403

### Frontend
- [ ] Grid 15 cột vật lý/8 nhóm nhập liệu hiển thị đúng thứ tự, có highlight viền đỏ/dấu sao cho các trường BẮT BUỘC (`docs_scan/required_field_border_red.png`)
- [ ] Header Mode 1 đủ 5 trường viền đỏ: Biển số xe, Lái xe/Người nhận, SĐT, Nhà thầu, Ngày tạo
- [ ] Tab key chuyển ô theo đúng thứ tự cột
- [ ] Cột 6 — 3-mode selector hoạt động (Free text / Hub L1 / Hub L2)
- [ ] Mode 2: chọn Trip IN_TRANSIT → auto-fill vehicleInfo + items
- [ ] Timeline Stepper 3 chặng: highlight đúng step theo state
- [ ] Nút "🖨️ In biểu mẫu" → window.print() → in đúng layout phiếu nhập/xuất/POD/Tem A4/Bảng đóng hàng
- [ ] Template **Tem Nhận Diện Hàng Hóa Khổ A4**: Hiển thị đầy đủ 11 mục thông tin từ `docs_scan/TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx` (kèm Palet số / Tổng số palet)
- [ ] Template **Bảng Kế Hoạch Đóng Hàng Xe**: Hiển thị bảng 14 cột, dòng tổng `SUBTOTAL`, hotline 3 miền từ `docs_scan/Kế Hoạch Đóng Hàng Xe 43H30703 Spider 3.9 K.xlsx`
- [ ] Nút "📄 Tạo PDF & Lưu" → loading → nhận URL → hiển thị link tải
- [ ] Nếu PDF đã gen rồi → hiện link sẵn, không gen lại
- [ ] Mobile <640px: Grid → Cargo Cards (có viền đỏ cho trường required) + Sticky Bottom Bar

---

## 📅 Timeline Sprint v1.x (đã thay thế bởi Revised Sprint Order v2.0)

| Sprint | Nội dung & Nhiệm vụ Trọng tâm | Deliverables | Estimate |
|---|---|---|---|
| **Sprint 1** | **DB Schema & Backend WaybillModule**<br>- Entity `WaybillEntity` (thêm contractor, receiverName, pallet, loading plan url)<br>- Entity `WaybillItemEntity` (thêm customerCode, dates, targetStation)<br>- Migration + Controller + Service + DTO Validation Red-Border | Migration chạy, 7 APIs hoạt động | 1-2 ngày |
| **Sprint 2** | **Frontend Grid Mode 1 & Red-Border UI Indicators**<br>- `WarehouseCreateDialog` Tab Direct Customer<br>- `WaybillGridInput` 8 cột có viền đỏ bắt buộc theo `required_field_border_red.png`<br>- Zod Schema validation 2 lớp | Form Mode 1 submit mượt mà, validate realtime | 2-3 ngày |
| **Sprint 3** | **Mode 2 (Hub Transfer) & Bảng Kế Hoạch Đóng Hàng Xe**<br>- `TripSelectionModal` chọn chuyến IN_TRANSIT<br>- Gom chuyến & Xem bảng Kế hoạch Đóng hàng 14 cột (`Kế Hoạch Đóng Hàng Xe 43H30703 Spider 3.9 K.xlsx`)<br>- `WaybillDetailSheet` + Timeline Stepper 3 chặng | Luồng luân chuyển hoàn chỉnh | 2 ngày |
| **Sprint 4** | **PDF Service + S3 Upload + 5 Mẫu Biểu In**<br>- Backend: `WaybillPdfService` (Puppeteer/html-pdf-node + S3 Supabase)<br>- Template 1-3: Phiếu Nhập Kho, Phiếu Xuất Kho, Phiếu Giao Hàng POD<br>- Template 4: **Tem Nhận Diện Hàng Hóa Khổ A4** (11 mục chuẩn `TEM NHẬN DIỆN HÀNG HÓA THÀNH A4.xlsx`)<br>- Template 5: **Bảng Kế Hoạch Đóng Hàng Xe Tuyến** (A4 ngang + hotline 3 miền)<br>- Frontend: `WaybillPrintView` preview & nút "Tạo PDF" | In & xuất PDF 5 mẫu hoàn chỉnh | 2 ngày |
| **Sprint 5** | **Mobile UX + RBAC Matrix v1.5 + E2E Tests**<br>- Cargo Cards trên mobile có viền đỏ cảnh báo<br>- Sticky Bottom Bar, Touch target $\ge 44px$<br>- Cập nhật RBAC matrix v1.5 & chạy full suite Playwright E2E | Pass 100% E2E test suites | 1-2 ngày |

**Tổng thời gian dự kiến**: ~8-11 ngày dev

---

> **Branch**: `feature/warehouse-inbound-module` (backend + frontend)
> **Phiên bản lịch sử**: v1.2 — chỉ để truy vết; estimate và storage contract không còn hiệu lực.


---

## 🧪 E2E Test Specification v1.x (tham khảo; canonical v2.0 bổ sung và ghi đè)

> **Hướng dẫn**: Sau khi hoàn thành mỗi Sprint, agent `e2e-test-runner` đọc section tương ứng bên dưới, tạo Playwright spec file và chạy theo thứ tự:
> 1. `node scripts/check-servers.mjs` (pre-flight gate)
> 2. Sub-Agent D: `00-runtime-log-tracer.spec.ts`
> 3. Sub-Agent A: `01-console-health.spec.ts`
> 4. Sub-Agent B: `02-login-flow.spec.ts`
> 5. Sub-Agent C: `03-rbac-routing.spec.ts`
> 6. Sub-Agent E: `11-warehouse-table-no-hscroll.spec.ts` (viewport × sidebar)
> 7. Sub-Agent W: `20-warehouse-waybill.spec.ts` ← **spec mới cho Warehouse**
>
> **Test credentials**: chỉ lấy từ biến môi trường/fixture git-ignored; không ghi email/password vào tài liệu hoặc source.

---

### 🧪 Sprint 1 Test Suite — Backend API (WaybillModule)

**Spec file**: `backend/test/waybills.e2e-spec.ts` (NestJS supertest) hoặc qua Playwright API calls  
**Trigger**: Sau khi Sprint 1 hoàn thành (migration chạy xong, server restart)

#### ✅ Happy Path — Tạo đơn Mode 1 (Direct Customer)

| # | Test Case | Input | Expected |
|---|---|---|---|
| W-1.1 | Tạo đơn thành công Mode 1 | POST `/v1/waybills` + mode=DIRECT_CUSTOMER + 3 items | 201, warehouseStatus=DRAFT, id trả về |
| W-1.2 | Confirm đơn → sinh waybillCode | PATCH `/v1/waybills/:id/confirm` | 200, warehouseStatus=PENDING_INBOUND, waybillCode="DDMMYY-xxxx" |
| W-1.3 | waybillCode format đúng | Confirm bất kỳ đơn | waybillCode matches regex `/^\d{6}-\d{4}$/` (VD: `030926-0001`) |
| W-1.4 | Bắt đầu nhập kho | PATCH `/v1/waybills/:id/start-inbound` | 200, warehouseStatus=INBOUND |
| W-1.5 | Hoàn tất nhập kho | PATCH `/v1/waybills/:id/complete-inbound` | 200, warehouseStatus=COMPLETED_INBOUND |
| W-1.6 | Danh sách waybill | GET `/v1/waybills` | 200, array + meta pagination |
| W-1.7 | Chi tiết waybill | GET `/v1/waybills/:id` | 200, trả về items[] đúng số lượng |

#### ✅ Happy Path — Tạo đơn Mode 2 (Hub Transfer)

| # | Test Case | Input | Expected |
|---|---|---|---|
| W-1.8 | Tạo đơn Mode 2 với tripId hợp lệ | POST `/v1/waybills` + mode=HUB_TRANSFER + tripId (IN_TRANSIT) + items | 201, tripId gắn đúng |
| W-1.9 | GET chi tiết Mode 2 | GET `/v1/waybills/:id` | vehicleLicensePlate lấy từ trip đã gán |

#### ❌ Edge Cases — Validation & Business Rules

| # | Edge Case | Input | Expected Error |
|---|---|---|---|
| W-1.E1 | Tạo đơn Mode 2 với tripId không tồn tại | tripId=99999 | 422, message: "Chuyến xe không tồn tại" |
| W-1.E2 | Tạo đơn Mode 2 với trip không IN_TRANSIT | tripId của trip status=PENDING | 422, message: "Chỉ được chọn chuyến xe đang vận chuyển (IN_TRANSIT)" |
| W-1.E3 | Tạo đơn không có items | items=[] | 422, message: "Phiếu nhập kho phải có ít nhất 1 dòng hàng" |
| W-1.E4 | Items thiếu trường bắt buộc | item.goodsDescription="" | 422, message về trường bị thiếu |
| W-1.E5 | Items có weightKg < 0 | item.weightKg=-5 | 422, message: "Số kg phải >= 0" |
| W-1.E6 | Items có volumeM3 < 0 | item.volumeM3=-1 | 422 |
| W-1.E7 | Items có quantity < 1 | item.quantity=0 | 422, message: "Số thùng/kiện phải >= 1" |
| W-1.E8 | Confirm đơn không phải DRAFT | Confirm đơn đang INBOUND | 422, message: "Chỉ xác nhận được đơn ở trạng thái DRAFT" |
| W-1.E9 | start-inbound khi không phải PENDING_INBOUND | start-inbound trên DRAFT | 422, message về sai trạng thái |
| W-1.E10 | complete-inbound khi không phải INBOUND | complete-inbound trên PENDING_INBOUND | 422 |
| W-1.E11 | Xóa đơn không phải DRAFT | DELETE đơn INBOUND | 422, message: "Chỉ xóa được đơn nháp (DRAFT)" |
| W-1.E12 | Xóa đơn đã xóa (soft-delete lần 2) | DELETE id đã xóa | 404 |
| W-1.E13 | Mode 1 thiếu vehicleLicensePlate | mode=DIRECT_CUSTOMER + vehicleLicensePlate=null | Tuỳ quyết định: 422 hoặc pass (tư vấn: nên required) |
| W-1.E14 | HubId không tồn tại | hubId=99999 | 422, message: "Hub không tồn tại" |
| W-1.E15 | deliveryMode=HUB_L1 nhưng deliveryHubId null | item.deliveryMode=HUB_L1, deliveryHubId=null | 422 |

#### 🔐 RBAC Edge Cases — Phân Quyền

| # | Role | Endpoint | Expected |
|---|---|---|---|
| W-1.R1 | DISPATCHER | POST `/v1/waybills` | 403 Forbidden |
| W-1.R2 | FLEET_MANAGER | POST `/v1/waybills` | 403 Forbidden |
| W-1.R3 | DISPATCHER | PATCH `/v1/waybills/:id/confirm` | 403 |
| W-1.R4 | FLEET_MANAGER | DELETE `/v1/waybills/:id` | 403 |
| W-1.R5 | Unauthenticated | GET `/v1/waybills` | 401 |
| W-1.R6 | WAREHOUSE_MANAGER Hub A | GET `/v1/waybills` (waybill của Hub B) | 200 nhưng data rỗng (Hub Scoping) |
| W-1.R7 | SUPER_ADMIN | Toàn bộ endpoints | 200/201 (toàn quyền) |

---

### 🧪 Sprint 2 Test Suite — Frontend: Form Grid Mode 1

**Spec file**: `frontend/e2e/20-warehouse-waybill.spec.ts`  
**Trigger**: Sau khi Sprint 2 hoàn thành (WarehouseCreateDialog + WaybillGridInput live)  
**Login as**: WAREHOUSE_MANAGER

#### ✅ Happy Path — UI Interactions

| # | Test Case | Playwright Action | Expected |
|---|---|---|---|
| W-2.1 | Warehouse page load | Navigate `/dashboard/warehouse` | Page render, title "Inbound Hub & Kho Tiếp Nhận" |
| W-2.2 | Mở dialog tạo đơn | Click `[data-testid="btn-create-waybill"]` | Dialog mở, Tab "Mới hoàn toàn" active mặc định |
| W-2.3 | Tab Mode 1 active | Dialog mở | Header đủ 5 trường và grid 15 cột vật lý/8 nhóm nhập liệu hiển thị |
| W-2.4 | Thêm dòng hàng | Click `[data-testid="btn-add-row"]` | 1 dòng mới xuất hiện cuối grid |
| W-2.5 | Tab key navigation | Điền ô đầu → Tab liên tục | Focus chuyển đúng thứ tự: Mã đơn → Địa chỉ nhận → Tên hàng → Thùng → Kg → m³ → Địa chỉ giao → Ghi chú → [row mới] |
| W-2.6 | Cột Địa chỉ giao — Free text | Click Segmented "Địa chỉ tự do" | Hiện text input, user nhập được |
| W-2.7 | Cột Địa chỉ giao — Hub L1 | Click Segmented "Hub cấp 1" | Hiện dropdown danh sách Hub |
| W-2.8 | Cột Địa chỉ giao — Hub L2 | Click Segmented "Hub cấp 2 / Xe bo" | Hiện dropdown danh sách xe bo/tuyến vệ tinh |
| W-2.9 | Nhân bản dòng | Click icon ⧉ trên dòng 1 | Dòng 2 xuất hiện với data y hệt dòng 1 |
| W-2.10 | Xóa dòng | Click icon 🗑 trên dòng | Dòng bị xóa, STT tự cập nhật |
| W-2.11 | Submit Mode 1 hợp lệ | Điền đủ fields + 2 dòng hàng → Click "Xác nhận đơn" | Toast success, dialog đóng, waybill mới xuất hiện trong bảng |
| W-2.12 | Chuyển Tab Mode 2 | Click Tab "Luân chuyển nội bộ" | TripSearchBar xuất hiện, header xe/tài xế ẩn đi |

#### ❌ Edge Cases — UI Validation

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-2.E1 | Submit khi không có dòng hàng | Click "Xác nhận đơn" với grid trống | Toast error: "Phải có ít nhất 1 dòng hàng" |
| W-2.E2 | Internal Order code readonly | Mở dòng Order mới | Hiển thị `Tự sinh khi lưu`; không có input cho phép sửa code |
| W-2.E3 | Submit khi Tên hàng trống | Để trống cột "Tên hàng" | Highlight ô lỗi |
| W-2.E4 | Submit khi Số kg = 0 và Số m³ = 0 | Nhập 0 vào cả 2 cột | 422 từ API, toast error rõ ràng |
| W-2.E5 | Số lượng âm | Nhập -1 vào cột "Số thùng" | UI block hoặc validation error |
| W-2.E6 | Địa chỉ giao HUB_L1 nhưng không chọn Hub | Chọn mode HUB_L1, không chọn từ dropdown | Toast/inline error: "Vui lòng chọn Hub" |
| W-2.E7 | Mode 1 thiếu thông tin xe | Không điền vehicleLicensePlate → Submit | Validation error trên field xe (nếu bắt buộc) |
| W-2.E8 | Lỗi API 422 từ server | Server trả về lỗi | Toast hiển thị message tiếng Việt, KHÔNG hiển thị raw key kỹ thuật |
| W-2.E9 | Network timeout | API không phản hồi 30s | Loading spinner → Toast error timeout, nút không bị disabled vĩnh viễn |
| W-2.E10 | Đóng dialog giữa chừng | Click X khi đang nhập | Confirm dialog "Bạn có chắc muốn thoát? Dữ liệu chưa lưu sẽ mất." |
| W-2.E11 | Lưu nháp | Click "Lưu nháp" | POST tạo đơn status=DRAFT, toast "Đã lưu nháp", dialog đóng |

#### 📐 Viewport & Table UX (Sub-Agent E)

**File**: `frontend/e2e/11-warehouse-table-no-hscroll.spec.ts`

| Breakpoint | Sidebar | Kiểm tra |
|---|---|---|
| 1024px | Expanded (256px) | body.scrollWidth <= 1024, table container scrolls horizontally |
| 1024px | Collapsed (48px) | body không overflow, table readable |
| 1280px | Expanded | Waybill columns không bị truncated, action buttons accessible |
| 1440px | Expanded/Collapsed | Full layout clean, cột "Thao tác" không bị clip |

```typescript
// Kiểm tra bắt buộc:
const bodyOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
expect(bodyOverflow).toBe(false); // ❌ FAIL nếu true

const tableViewport = page.locator('[data-slot="scroll-area-viewport"]');
const canScroll = await page.evaluate(() => {
  const el = document.querySelector('[data-slot="scroll-area-viewport"]');
  return el ? el.scrollWidth > el.clientWidth : false;
});
// Khi có nhiều cột waybill: expect(canScroll).toBe(true)
```

---

### 🧪 Sprint 3 Test Suite — Mode 2 + Detail Sheet + Timeline

**Spec file**: `frontend/e2e/20-warehouse-waybill.spec.ts` (bổ sung thêm)  
**Trigger**: Sau Sprint 3 hoàn thành

#### ✅ Happy Path — Mode 2 (Hub Transfer)

| # | Test Case | Playwright Action | Expected |
|---|---|---|---|
| W-3.1 | Mở Tab Mode 2 | Click Tab "Luân chuyển nội bộ" | TripSearchBar hiện, vehicle info section ẩn |
| W-3.2 | Search Trip IN_TRANSIT | Nhập mã trip/biển số vào search bar | Dropdown hiện danh sách trips matching |
| W-3.3 | Chọn Trip → Modal đơn hàng | Click vào trip trong kết quả | Modal hiện danh sách đơn hàng thuộc trip |
| W-3.4 | Chọn tất cả đơn | Click "Chọn tất cả" | Tất cả checkboxes checked |
| W-3.5 | Confirm chọn đơn | Click "Xác nhận" trong modal | Modal đóng, grid được auto-fill với items từ trip |
| W-3.6 | VehicleInfo auto-fill | Sau chọn trip | Biển số xe + Tài xế hiển thị readonly, không chỉnh sửa được |
| W-3.7 | Thêm hàng bổ sung | Click "+ Thêm hàng nhận bổ sung" | Dòng trống mới xuất hiện cuối grid, có thể edit |
| W-3.8 | Submit Mode 2 | Điền xong → "Xác nhận đơn" | 201, tripId đúng, items đủ |
| W-3.9 | Mở Detail Sheet | Click vào waybill trong bảng | Sheet mở, hiện waybillCode + status + Timeline |
| W-3.10 | Timeline Stepper DRAFT | Status DRAFT | Step 1 active chờ, Step 2 & 3 grey |
| W-3.11 | Timeline Stepper PENDING_INBOUND | Status PENDING_INBOUND | Step 1 "Đang chờ nhập" highlight |
| W-3.12 | Timeline Stepper INBOUND | Status INBOUND | Step 1 pulse animation (đang xử lý) |
| W-3.13 | Timeline Stepper COMPLETED_INBOUND | Status COMPLETED_INBOUND | Step 1 checkmark ✓, Step 2 ready |
| W-3.14 | Action buttons DRAFT | Open DRAFT waybill | Hiện [Chỉnh sửa] [Xóa] [Xác nhận đơn →] |
| W-3.15 | Action buttons PENDING_INBOUND | Open PENDING_INBOUND waybill | Hiện [Bắt đầu nhập kho] [In phiếu] [Hủy] — KHÔNG hiện [Xóa] |
| W-3.16 | Action buttons INBOUND | Open INBOUND waybill | Hiện [Ghi nhận bất thường] [Hoàn tất nhập kho ✓] |
| W-3.17 | Action buttons COMPLETED_INBOUND | Open COMPLETED_INBOUND waybill | Hiện [Tạo kế hoạch xuất] [Điều chuyển Hub] [Bàn giao đi giao] |

#### ❌ Edge Cases — Mode 2 & Detail

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-3.E1 | Search Trip không IN_TRANSIT | Nhập tripId của trip PENDING | Kết quả rỗng, message "Không tìm thấy chuyến xe đang vận chuyển" |
| W-3.E2 | Search Trip của Hub khác | Trip destinationHub ≠ currentUser.hubId | Không hiển thị trong kết quả (hub scoping) |
| W-3.E3 | Submit Mode 2 không chọn trip | Không search/chọn trip → Submit | Validation: "Vui lòng chọn chuyến xe" |
| W-3.E4 | Submit Mode 2 không chọn đơn nào trong modal | Click "Xác nhận" modal khi 0 checkbox | Modal giữ nguyên, message "Chọn ít nhất 1 đơn hàng" |
| W-3.E5 | Xóa tất cả dòng hàng rồi submit | Xóa hết + Submit | Validation: "Phải có ít nhất 1 dòng hàng" |
| W-3.E6 | Action button sai state | DISPATCHER thấy detail waybill | Nút write actions (Xác nhận, Bắt đầu nhập...) bị ẩn, chỉ xem |
| W-3.E7 | Bấm "Xóa" DRAFT trong detail | Confirm xóa | Confirm dialog → xóa → redirect về danh sách |
| W-3.E8 | Bấm "Hủy đơn" PENDING_INBOUND | Confirm hủy | Waybill bị soft-delete, disappear khỏi list |
| W-3.E9 | Detail waybill không tồn tại | Navigate /dashboard/warehouse?id=99999 | 404 message, redirect về list |
| W-3.E10 | Items trong detail hiển thị đúng dữ liệu | Mở detail waybill 5 items | Tất cả rows hiển thị đủ các trường nghiệp vụ được phép theo state/role |

---

### 🧪 Sprint 4 Test Suite — PDF Generation + S3

**Spec file**: `frontend/e2e/21-warehouse-pdf.spec.ts`  
**Trigger**: Sau Sprint 4 hoàn thành

#### ✅ Happy Path — PDF Gen & S3

| # | Test Case | Action | Expected |
|---|---|---|---|
| W-4.1 | Queue Phiếu Nhập Kho | POST `/v1/warehouse/documents` | 202, response có `{ documentId, status: "PENDING" }` |
| W-4.2 | Worker hoàn thành | Poll/query document | Chuyển `PENDING → READY`, có `fileId`, checksum và templateVersion |
| W-4.3 | Download có quyền | GET authorized download với đúng role/hub | HTTP 200, `application/pdf`; trái hub/role trả 403/404 |
| W-4.4 | Không public object | Gọi trực tiếp object URL không chữ ký | Không truy cập được |
| W-4.5 | Idempotency | Gọi lại cùng resource/type/version/key | Không sinh document trùng |
| W-4.6 | Đúng resource owner | Tạo tem/loading sheet/POD | Tem gắn item/pallet; loading sheet gắn trip/stop; POD không gắn giả vào Waybill |
| W-4.7 | Frontend: Nút "Tạo PDF & Lưu" | Click trong WaybillDetailSheet | Loading spinner → Toast "PDF đã được tạo" → Hiện link "Tải PDF ↓" |
| W-4.8 | Frontend: Link PDF hoạt động | Click "Tải PDF ↓" | Lấy signed URL ngắn hạn/authorized stream và tải được |
| W-4.9 | PDF đã có → hiện link sẵn | Mở detail waybill đã gen PDF | Nút "Tải PDF ↓" hiện ngay, KHÔNG cần gen lại |
| W-4.10 | PDF chứa nội dung đúng | Tải PDF về | Text: waybillCode, tên hub, ngày, items table, "Thủ kho" ký tên |

#### ❌ Edge Cases — PDF

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-4.E1 | Gen PDF cho waybill DRAFT | POST generate-pdf khi status=DRAFT | 422, message: "Chỉ tạo phiếu sau khi đơn đã được xác nhận (PENDING_INBOUND trở lên)" |
| W-4.E2 | Gen PDF không hợp lệ type | type=INVALID_TYPE | 422 / 400 |
| W-4.E3 | DISPATCHER gọi gen PDF | POST generate-pdf với DISPATCHER token | 403 Forbidden |
| W-4.E4 | Puppeteer/html-pdf fail | Server lỗi render HTML | 500 với message rõ, KHÔNG để crash unhandled |
| W-4.E5 | Storage timeout | Giả lập storage không phản hồi | Job `FAILED` có retry giới hạn; không lưu `fileId` rác |
| W-4.E6 | Gen PDF waybill không tồn tại | generate-pdf/:id=99999 | 404 |
| W-4.E7 | Frontend: signed URL hết hạn | Mở link đã hết hạn | Lấy link mới nếu còn quyền; lỗi hiển thị tiếng Việt qua `formatApiError()` |
| W-4.E8 | WaybillCode null khi gen PDF | Waybill chưa confirm | 422, waybillCode là null — phiếu nhập kho cần mã |

#### 🖨️ Print View Test (Sub-Agent A — Console Health)

| # | Test | Expected |
|---|---|---|
| W-4.P1 | Mở Print Preview | Click "🖨️ In phiếu" trong detail | Print preview dialog mở, không có JS error trên console |
| W-4.P2 | Print CSS áp dụng | `@media print` | Sidebar, navbar, buttons bị ẩn; chỉ hiện nội dung phiếu |
| W-4.P3 | WaybillCode trên phiếu | In phiếu nhập kho | WaybillCode format DDMMYY-xxxx hiển thị rõ |
| W-4.P4 | 2 ô ký trên Phiếu Nhập Kho | Xem print preview | Có "Thủ kho nhận hàng (Ký tên)" và "Lái xe / Người giao (Ký tên)" |
| W-4.P5 | Tem Nhận Diện format | In tem | Format: `... / [Tổng kiện]` đúng (VD: `... / 50 kiện`) |

---

### 🧪 Sprint 5 Test Suite — Mobile UX + RBAC

**Spec file**: `frontend/e2e/11-warehouse-table-no-hscroll.spec.ts` (bổ sung mobile breakpoints)  
**Trigger**: Sau Sprint 5

#### 📱 Mobile UX — Viewport < 640px

| # | Test Case | Viewport | Expected |
|---|---|---|---|
| W-5.M1 | Grid → Cargo Cards | 375px (iPhone SE) | WaybillGridInput chuyển sang Cargo Item Cards xếp dọc |
| W-5.M2 | Cards hiển thị đủ thông tin | 375px | Mỗi card: orderCode, goodsDescription, qty/kg/m³, địa chỉ giao |
| W-5.M3 | Sticky Bottom Bar | 375px + scroll xuống | Nút "Xác nhận đơn" vẫn visible ở cuối màn hình |
| W-5.M4 | Touch target size | 375px | Tất cả buttons/tabs height ≥ 44px (check via `getBoundingClientRect`) |
| W-5.M5 | Không có horizontal overflow | 375px | body.scrollWidth <= 375 |
| W-5.M6 | Xóa Card trên mobile | 375px + Click 🗑 trên card | Card bị xóa, danh sách cập nhật |
| W-5.M7 | Form mode 1 mobile | 375px | Header fields (biển số, tài xế...) hiển thị dạng stack dọc |

#### 🔐 RBAC Route Guard (Sub-Agent C bổ sung)

| # | Role | Route | Expected |
|---|---|---|---|
| W-5.R1 | DISPATCHER | Navigate `/dashboard/warehouse` | Redirect `/dashboard/overview` (403 guard) |
| W-5.R2 | FLEET_MANAGER | Navigate `/dashboard/warehouse` | Redirect `/dashboard/overview` |
| W-5.R3 | WAREHOUSE_MANAGER | Navigate `/dashboard/warehouse` | ✅ Render bình thường |
| W-5.R4 | SUPER_ADMIN | Navigate `/dashboard/warehouse` | ✅ Render bình thường |
| W-5.R5 | WAREHOUSE_MANAGER | Navigate `/dashboard/orders` | ✅ Render (read-only) — theo RBAC matrix |
| W-5.R6 | WAREHOUSE_MANAGER | Sidebar menu | Chỉ thấy "Inbound Kho", KHÔNG thấy "Lệnh điều vận", "Phân công xe", "Quản lý đội xe" |

---

### 🧪 Regression Test Suite — Toàn Hệ Thống

**Spec file**: `frontend/e2e/03-rbac-routing.spec.ts` (cập nhật thêm warehouse routes)  
**Trigger**: Sau khi merge feature branch về `dev`

#### Cross-Module Regression

| # | Test Case | Expected |
|---|---|---|
| R-1 | Orders page vẫn hoạt động sau khi add WaybillModule | `/dashboard/orders` render đúng, không có JS error |
| R-2 | Trips page vẫn hoạt động | `/dashboard/trips` render đúng |
| R-3 | Fleet page không ảnh hưởng | `/dashboard/fleet` OK |
| R-4 | Notifications vẫn nhận được | Tạo waybill → không crash notification service |
| R-5 | DB: bảng `order` không bị thay đổi cột | Migration chỉ tạo bảng mới, không ALTER order table |
| R-6 | S3 bucket `logistics-media` vẫn upload ảnh user profile | Files module không bị break |
| R-7 | Trips GET với filter mới không break client cũ | `GET /v1/trips` không có `destinationHubId` vẫn trả về đúng |
| R-8 | Console Health toàn trang | Sub-Agent A scan tất cả pages, 0 JS error mới |

---

### 📋 Test Data Setup (Seed Data cục bộ cho E2E)

Trước khi chạy E2E, cần đảm bảo DB có:

```
1. Fixture WAREHOUSE_MANAGER được gán vào Hub A; credentials lấy từ environment/fixture git-ignored
2. Ít nhất 1 Trip đang IN_TRANSIT có destinationHubId = 1
3. Hubs: Hub cấp 1 (VD: Hub Hà Nội id=1, Hub HCM id=2)
4. Hubs cấp 2 / Xe bo: 34 tuyến xe bo ứng với 34 tỉnh/thành phố toàn quốc đã seed sẵn trong `hub-seed.service.ts`
```

Không ghi email/password thật hoặc mặc định vào plan/source. Test helper chỉ đọc biến môi trường được quản lý ngoài Git.

---

## 🛡️ Dual-Layer Validation Strategy (FE + BE)

> **Nguyên tắc**: Mọi field đều được validate 2 lớp:
> - **Layer 1 — Frontend (Zod v4 + react-hook-form)**: Validate ngay lập tức trên UI, không cần round-trip mạng. Hiện lỗi inline tại ô nhập liệu.
> - **Layer 2 — Backend (class-validator NestJS)**: Validate lại server-side trước khi ghi DB. Trả về 422 với message tiếng Việt.
>
> **Stack FE xác nhận**: Frontend đang dùng `zod ^4.3.6`. Dùng Zod (KHÔNG dùng Yup) để nhất quán với codebase.
> **Form management**: Dùng `react-hook-form` + `@hookform/resolvers/zod` cho `WarehouseCreateDialog`.

---

### 📦 Zod Schema — Header Form (Waybill)

```typescript
// frontend/src/features/warehouse/schemas/waybill.schema.ts
import { z } from 'zod';

// ─── Schema cho 1 dòng hàng (WaybillItem) ───────────────────────────────────
export const waybillItemSchema = z.object({
  // Internal orderCode không thuộc form; server sinh khi canonical Order được tạo.
  customerReferenceCode: z
    .string()
    .max(100, 'Mã tham chiếu khách hàng tối đa 100 ký tự')
    .optional(),

  pickupAddress: z
    .string()
    .min(1, 'Địa chỉ nhận hàng không được để trống')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),

  goodsDescription: z
    .string()
    .min(1, 'Tên hàng không được để trống')
    .max(500, 'Tên hàng tối đa 500 ký tự')
    .refine(
      (val) => !val.match(/SKU|barcode|mã vạch/i),
      'Tên hàng không được chứa mã SKU/barcode — mô tả tổng quan mặt hàng',
    ),

  quantity: z
    .number({ invalid_type_error: 'Số thùng phải là số' })
    .int('Số thùng phải là số nguyên')
    .min(1, 'Số thùng/kiện bắt buộc (tối thiểu là 1)'), // 🔴 Red Border

  weightKg: z
    .number({ invalid_type_error: 'Số kg phải là số' })
    .positive('Số kg bắt buộc lớn hơn 0 (Gross weight)') // 🔴 Red Border
    .max(999999, 'Số kg quá lớn'),

  volumeM3: z
    .number({ invalid_type_error: 'Số m³ phải là số' })
    .positive('Số khối (m³) bắt buộc lớn hơn 0') // 🔴 Red Border
    .max(99999, 'Số m³ quá lớn'),

  // Địa chỉ giao hàng — 3-mode (🔴 Red Border)
  deliveryMode: z.enum(['FREE_TEXT', 'HUB_L1', 'HUB_L2_SAT'], {
    errorMap: () => ({ message: 'Vui lòng chọn phương thức địa chỉ giao hàng' }),
  }),

  deliveryAddress: z.string().max(255).nullable().optional(),

  deliveryHubId: z.number().int().positive().nullable().optional(),

  targetStation: z.string().max(100).optional(), // Tỉnh/trạm "Đã soạn"

  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
}).superRefine((item, ctx) => {
  // Cross-field: nếu deliveryMode = FREE_TEXT thì deliveryAddress bắt buộc
  if (item.deliveryMode === 'FREE_TEXT' && !item.deliveryAddress?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deliveryAddress'],
      message: 'Vui lòng nhập địa chỉ giao hàng',
    });
  }
  // Cross-field: nếu deliveryMode = HUB_L1 / HUB_L2_SAT thì deliveryHubId bắt buộc
  if ((item.deliveryMode === 'HUB_L1' || item.deliveryMode === 'HUB_L2_SAT') && !item.deliveryHubId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deliveryHubId'],
      message: 'Vui lòng chọn Hub/Tuyến vệ tinh từ danh sách',
    });
  }
});

// ─── Schema Mode 1: Direct Customer ─────────────────────────────────────────
export const waybillMode1Schema = z.object({
  mode: z.literal('DIRECT_CUSTOMER'),

  receivedAt: z.coerce.date({ error: 'Ngày tiếp nhận không hợp lệ' }), // 🔴 Red Border

  vehicleLicensePlate: z // 🔴 Red Border
    .string()
    .min(1, 'Biển số xe không được để trống')
    .max(20, 'Biển số xe tối đa 20 ký tự')
    .regex(/^[A-Z0-9\-\.]+$/i, 'Biển số xe không hợp lệ'),

  receiverOrDriverName: z // 🔴 Red Border
    .string()
    .min(1, 'Họ tên người nhận/lái xe không được để trống')
    .max(100, 'Họ tên người nhận tối đa 100 ký tự'),

  driverPhone: z // 🔴 Red Border
    .string()
    .min(9, 'Số điện thoại tối thiểu 9 số')
    .max(15, 'Số điện thoại tối đa 15 số')
    .regex(/^[0-9\+\-\s]+$/, 'Số điện thoại không hợp lệ'),

  subContractor: z // 🔴 Red Border (Nhà thầu)
    .string()
    .min(1, 'Nhà thầu không được để trống')
    .max(200, 'Tên nhà thầu tối đa 200 ký tự'),

  dispatcherContact: z.string().max(200).optional(),

  notes: z.string().max(1000).optional(),

  items: z
    .array(waybillItemSchema)
    .min(1, 'Phiếu nhập kho phải có ít nhất 1 dòng hàng')
    .max(200, 'Tối đa 200 dòng hàng mỗi phiếu'),
});

// ─── Schema Mode 2: Hub Transfer ─────────────────────────────────────────────
export const waybillMode2Schema = z.object({
  mode: z.literal('HUB_TRANSFER'),

  tripId: z
    .number({ required_error: 'Vui lòng chọn chuyến xe' })
    .int()
    .positive('ID chuyến xe không hợp lệ'),

  // receivedAt do WM xác nhận; vehicle/driver/contractor readonly và server derive từ Trip.
  // Không cần validate trên FE vì server tự lấy từ tripId

  notes: z.string().max(1000).optional(),

  items: z
    .array(waybillItemSchema)
    .min(1, 'Phiếu nhập kho phải có ít nhất 1 dòng hàng')
    .max(200, 'Tối đa 200 dòng hàng mỗi phiếu'),
});

// ─── Union schema cho cả 2 mode ─────────────────────────────────────────────
export const createWaybillSchema = z.discriminatedUnion('mode', [
  waybillMode1Schema,
  waybillMode2Schema,
]);

export type CreateWaybillFormData = z.infer<typeof createWaybillSchema>;
export type WaybillItemFormData  = z.infer<typeof waybillItemSchema>;
```

---

### ⚙️ react-hook-form Integration

```typescript
// Trong warehouse-create-dialog.tsx
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWaybillSchema, type CreateWaybillFormData } from '../schemas/waybill.schema';

export function WarehouseCreateDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState<'DIRECT_CUSTOMER' | 'HUB_TRANSFER'>('DIRECT_CUSTOMER');

  const form = useForm<CreateWaybillFormData>({
    resolver: zodResolver(createWaybillSchema),
    defaultValues: {
      mode: 'DIRECT_CUSTOMER',
      receivedAt: new Date(),
      vehicleLicensePlate: '',
      receiverOrDriverName: '',
      driverPhone: '',
      subContractor: '',
      notes: '',
      items: [defaultItem()],  // 1 dòng trống mặc định
    },
    mode: 'onChange',          // Validate realtime khi user gõ
  });

  // FieldArray cho Grid items
  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Khi chuyển Tab mode, reset form với defaultValues tương ứng
  const handleModeChange = (newMode: 'DIRECT_CUSTOMER' | 'HUB_TRANSFER') => {
    setMode(newMode);
    form.reset({
      mode: newMode,
      items: [defaultItem()],
      ...(newMode === 'HUB_TRANSFER' ? { tripId: undefined } : {}),
    });
  };

  const onSubmit = async (data: CreateWaybillFormData) => {
    try {
      await createWaybillMutation.mutateAsync(data);
      toast.success('Đã tạo phiếu nhập kho thành công');
      onOpenChange(false);
    } catch (err) {
      // Layer 2: Server validation errors → hiện toast tiếng Việt
      const message = formatApiError(err);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... form UI ... */}
    </form>
  );
}
```

---

### 🎨 Inline Error Display Pattern cho Grid

Grid WaybillGridInput khác với form thông thường — mỗi cell có thể có lỗi riêng. Dùng pattern:

```typescript
// Trong WaybillGridInput — hiển thị lỗi inline tại ô
function GridCell({ name, rowIndex, register, errors }) {
  const error = errors?.items?.[rowIndex]?.[name];
  return (
    <td>
      <div className="relative">
        <input
          {...register(`items.${rowIndex}.${name}`)}
          className={cn(
            "w-full h-8 px-2 text-xs border rounded focus:ring-1",
            error
              ? "border-destructive bg-destructive/5 focus:ring-destructive"  // ❌ đỏ
              : "border-border focus:ring-primary"                             // normal
          )}
        />
        {error && (
          <Tooltip content={error.message}>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-destructive">
              <IconAlertCircle size={14} />
            </span>
          </Tooltip>
        )}
      </div>
    </td>
  );
}
```

---

### 🗂️ Validation Rules Matrix — FE vs BE

| Field | FE Rule (Zod) | BE Rule (class-validator) | Error Message |
|---|---|---|---|
| **Header — Mode 1** | | | |
| `receivedAt` | required, valid date | `@IsDateString` hoặc transform + date validation | "Ngày tiếp nhận không hợp lệ" |
| `vehicleLicensePlate` | required, min 1, max 20, regex biển số | `@IsNotEmpty @IsString @MaxLength(20)` | "Biển số xe không được để trống" |
| `receiverOrDriverName` | required, min 1, max 100 | `@IsNotEmpty @IsString @MaxLength(100)` | "Người nhận/lái xe không được để trống" |
| `driverPhone` | regex số điện thoại, 9-15 ký tự | `@Matches(/^[0-9+\-\s]+$/)` | "Số điện thoại không hợp lệ" |
| `subContractor` | required, max 200 | `@IsNotEmpty @IsString @MaxLength(200)` | "Nhà thầu không được để trống" |
| **Header — Mode 2** | | | |
| `tripId` | required, integer, positive | `@IsInt @IsPositive` | "Vui lòng chọn chuyến xe" |
| `tripId` (BE cross) | — | Trip phải tồn tại + status = IN_TRANSIT | "Chỉ được chọn chuyến xe đang vận chuyển" |
| **Items (mỗi dòng)** | | | |
| `orderCode` | Không có trong form; readonly sau create | Server derive + immutable + DB unique | "Không thể tạo mã đơn hàng do thiếu cấu hình Hub/người thao tác" |
| `customerReferenceCode` | optional, max 100 | `@IsOptional @IsString @MaxLength(100)` | "Mã tham chiếu khách hàng tối đa 100 ký tự" |
| `pickupAddress` | required, max 255 | `@IsNotEmpty @IsString` | "Địa chỉ nhận hàng không được để trống" |
| `goodsDescription` | required, max 500, no-SKU regex warn | `@IsNotEmpty @IsString` | "Tên hàng không được để trống" |
| `quantity` | integer, min 1 | `@IsInt @Min(1)` | "Số thùng/kiện phải ít nhất là 1" |
| `weightKg` | number, > 0 | `@IsNumber @IsPositive` | "Số kg phải lớn hơn 0" |
| `volumeM3` | number, > 0 | `@IsNumber @IsPositive` | "Số m³ phải lớn hơn 0" |
| `deliveryMode` | enum('FREE_TEXT','HUB_L1','HUB_L2_SAT') | `@IsIn([...])` | "Vui lòng chọn phương thức địa chỉ giao" |
| `deliveryAddress` | required nếu FREE_TEXT (superRefine) | `@ValidateIf(o => o.deliveryMode === 'FREE_TEXT') @IsNotEmpty` | "Vui lòng nhập địa chỉ giao hàng" |
| `deliveryHubId` | required nếu HUB_L1/HUB_L2_SAT | `@ValidateIf(o => o.deliveryMode !== 'FREE_TEXT') @IsInt @IsPositive` | "Vui lòng chọn Hub từ danh sách" |
| **Toàn bộ items** | | | |
| `items[]` | min 1 item | Array length >= 1 check trong service | "Phiếu nhập kho phải có ít nhất 1 dòng hàng" |
| `items[]` | max 200 items | Max check trong service | "Tối đa 200 dòng hàng mỗi phiếu" |

---

### 🧪 E2E Test Cases — FE Validation (Zod Layer)

**Bổ sung vào Sprint 2 Test Suite** — test riêng phần Zod validation không cần gọi API:

| # | Test Case | Action | Expected (FE only, trước khi submit) |
|---|---|---|---|
| Z-1 | Internal Order code không sửa được | Focus/click "Mã đơn" | Hiển thị readonly `Tự sinh khi lưu`; không có editable input |
| Z-2 | Số thùng nhập 0 | Input quantity=0 → blur | Lỗi inline "Số thùng/kiện phải ít nhất là 1" |
| Z-3 | Số thùng nhập số âm | Input quantity=-1 | Input bị revert hoặc lỗi inline |
| Z-4 | Số thùng nhập chữ | Input quantity="abc" | Input block nhập hoặc lỗi "Số thùng phải là số" |
| Z-5 | weightKg=0 và volumeM3=0 cùng lúc | Nhập cả 2 = 0 | Lỗi cross-field: "Số kg và Số m³ không thể đồng thời bằng 0" |
| Z-6 | deliveryMode=HUB_L1, không chọn hub | Chọn HUB_L1, bỏ trống dropdown → blur | Lỗi "Vui lòng chọn Hub từ danh sách" |
| Z-7 | deliveryMode=FREE_TEXT, không nhập | Chọn FREE_TEXT, bỏ trống input → blur | Lỗi "Vui lòng nhập địa chỉ giao hàng" |
| Z-8 | Biển số xe định dạng sai | Nhập "123@##!!" → blur | Lỗi "Biển số xe không hợp lệ" |
| Z-9 | SĐT tài xế quá ngắn | Nhập "012" → blur | Lỗi "Số điện thoại tối thiểu 9 số" |
| Z-10 | Submit khi còn lỗi | Click "Xác nhận đơn" khi form invalid | Nút không gọi API, scroll đến ô lỗi đầu tiên |
| Z-11 | Mode 2: không chọn tripId | Switch sang Tab Mode 2, không chọn trip → Submit | Lỗi "Vui lòng chọn chuyến xe" hiển thị trên TripSearchBar |
| Z-12 | Form hợp lệ → nút Submit enabled | Điền đủ tất cả required fields | Nút "Xác nhận đơn" không bị disabled, cho phép click |
| Z-13 | Lỗi FE cleared khi fix | Sửa ô đang lỗi → nhập giá trị hợp lệ | Lỗi inline biến mất ngay lập tức (mode: onChange) |
| Z-14 | Error count badge | Có 3 ô lỗi trong grid | Hiện badge "3 lỗi cần sửa" trên footer hoặc header |

---

### 📁 Files Bổ Sung (Validation Layer)

```
frontend/src/features/warehouse/
└── schemas/
    └── waybill.schema.ts     [NEW] Zod schemas: waybillItemSchema, waybillMode1Schema, waybillMode2Schema, createWaybillSchema
```

**Package cần cài** (nếu chưa có):
```bash
cd frontend
npm install react-hook-form @hookform/resolvers
# zod đã có sẵn (^4.3.6) ✅
```
