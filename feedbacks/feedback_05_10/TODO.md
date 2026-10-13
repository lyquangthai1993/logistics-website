# Feedback 05/10 — Checklist

> Repo tracking (root / backend / frontend): all on `dev`, clean, in sync with `origin/dev` at start. Changes left uncommitted.

## 1. Outbound filter bar counters (`filter_outbound_wrong.png`)
Spec reference: `IMPLEMENT_STATUS_TRIP_AND_ORDER.md` (hub-scoped order status `Chờ nhập kho / Lưu kho / Đã xuất kho`; trip status at a hub only `Chờ xử lý / Đã xử lý`).

**Findings (root cause)**
- [x] Tabs counted **orders** (`/warehouse/kpi`), but the board renders **trips (SD...)** and hid orders without an outbound trip → `Tất cả (8)` showed 1 row (SD6), `Lưu kho (7)` / `Xuất khách (7)` rendered an empty board.
- [x] `Xuất khách` + `Luân chuyển` were a sub-split of `Lưu kho` (stock not yet dispatched) — misleading labels.
- [x] Filter/counter parity broken: KPI `customerOutbound`/`transferOutbound` counted only `Lưu kho`, list filter `CUSTOMER`/`TRANSFER` also included `Chờ nhập kho`.
- [x] Footer said `1–8 / 8 đơn hàng` while the table showed 1 trip.
- [x] Every outbound trip at the origin hub is `Đã xử lý` (origin stop created `COMPLETED` on confirm).

**Fix (agreed model: trip board, tabs count trips)**
- [x] Agreed tab model with user: `Tất cả / Xuất khách / Luân chuyển` counted in trips; `Lưu kho` removed from this board.
- [x] Backend: `GET /v1/warehouse/outbound-trips` — trips dispatched from the viewer hub (dispatch invoices `OUTBOUND`/`TRANSFER`), counters + rows from the same CTE (1:1 parity), paginated by trip.
- [x] Frontend: tabs, rows and footer (`… chuyến xe`) use the same unit; client-side order→trip grouping removed.
- [x] RBAC matrix updated (v1.6).
- [x] Verify: backend + frontend `tsc --noEmit` pass; new code lint-clean; read-only SQL check on dev DB (Andromeda Hub, 01–05/10): 4 trips = 3 customer + 1 transfer.

## 2. Pallet label "KHO" shows wrong warehouse (`tem_nhan_dien_sai_kho.png`)
**Findings (root cause)**
- [x] `PalletLabelA4Modal` printed `KHO : ${data.originHub || user.hub.name}`.
- [x] Callers fill `originHub` with `pickupAddress` first (customer pickup address, e.g. `Đồng Tháp`) → label showed the sender's pickup location instead of the warehouse.

**Fix**
- [x] `KHO` = printing user's hub → order `currentHubEntity.name` (new `warehouseName` field) → `—`. Never the pickup address.
- [x] Callers updated (inbound page, orders page, waybill detail modal).
- [x] Removed hardcoded sample values in the inbound "Xem trước" label preview (`LTV2609-0025`, `Vải cuộn`, `50`).
- [x] Verify: frontend `tsc --noEmit` passes.

## 3. User feedback: board shows no trips / only "Đã xử lý", drafts never appear
**Findings (root cause)**
- [x] "Lưu nháp" never persisted anything: all 3 buttons (outbound note, transfer step 1, transfer step 3) only showed a success toast — no API, no DB row → a draft could never appear.
- [x] Old board (before fix 1): paginated **orders** (20/page, incl. stored goods) then hid orders without an outbound trip on the client → many pages empty; date filter on order dates; token read from localStorage/cookie and errors swallowed silently (Render dev cold start → empty board without any message) → "lâu lâu mới hiện".
- [x] Only dispatched trips (with a dispatch invoice) existed → board could only ever show "Đã xử lý".
- [x] Fix 1 (05/10) solved the empty/intermittent part (trip-level endpoint, `tokenManager`, error toast) but not drafts.

**Fix (agreed: draft = SD trip "Chờ xử lý", no stock deduction)**
- [x] DB (additive, approved): `trip.quantityAllocated int NULL` — migration `1789040000000-AddQuantityAllocatedToTrip`.
- [x] Backend: `POST /v1/warehouse/outbound/draft` (allocates/keeps SD code, planned lines on `trip` rows status `PENDING`, origin stop `PENDING`, stock checked but not deducted); `DELETE /v1/warehouse/outbound/drafts/:tripCode` ("Hủy nháp"); `POST /outbound/confirm` accepts `draftTripCode` (reuses the SD code, replaces planned lines, deducts stock → "Đã xử lý").
- [x] Backend: `GET /v1/warehouse/outbound-trips` = dispatched + drafts, `status` (`PENDING`/`COMPLETED`) + `type` filters, all counters from the same query.
- [x] Frontend board: tabs `Tất cả / Chờ xử lý / Đã xử lý` (Đã chốt loại bỏ hoàn toàn sub-filter `Xuất khách / Luân chuyển` theo yêu cầu người dùng); draft rows → "Tiếp tục" (reopen note) / "Hủy nháp"; batch "Xác nhận xuất" on selected drafts; printing only for dispatched trips; sub-row figures from the trip lines.
- [x] Frontend: real "Lưu nháp" on the outbound note and transfer step 3 (step 1 disabled until goods are selected); inbound board ignores outbound/transfer draft trips of the same hub.
- [x] Triệt tiêu sub-filter: Cập nhật cả 2 màn hình Nhập kho và Xuất kho chỉ dùng duy nhất các tab trạng thái TRIP (`Tất cả / Chờ xử lý / Đã xử lý`), loại bỏ hoàn toàn các nút `Xuất khách / Khách gửi / Luân chuyển`.
- [x] RBAC matrix updated (v1.7).
- [x] Verify: backend + frontend `tsc --noEmit` pass.

## 4. Multi-truck inbound order aggregation in warehouse inventory (`split_shipment_inbound_aggregation_issue.png`)
Spec & Analysis reference: [`docs/feedback_05_10_split_shipment_inbound_aggregation.md`](../docs/feedback_05_10_split_shipment_inbound_aggregation.md)

**Findings (root cause & business questions)**
- [x] User tested: 1 waybill/order code (`MCD2610-0001`) received on 2 different trucks (`76-H720-335` & `60-B1 15594`).
- [x] User feedback: In inventory summary, it showed 2 rows instead of aggregating into 1 consolidated view.
- [x] Dev question: Same order code but cargo name, kg, m3 differ between trucks — how to merge?
- [x] Business rule (/leader): NEVER hard-merge DB records (destroys audit trail of vehicles/receipts). Use **Master - Detail model**: Consolidated parent row (algebraic sum of quantities, weights, volumes; distinct list of goods; vehicle count badge) + expandable line items per truck.
- [x] Bug identified: Ratio discrepancy on parent row (`200 / 100 kiện` where stock > total packages received) in `aggregateOrderGroup`.
- [x] UI gap: Parent row trip column only displayed 1 vehicle without a clear `+1 xe` badge indicating multi-truck consignment.

**Fix & Standardization (Master-Detail aggregation, ratio parity, multi-vehicle badge)**
- [x] Backend (`backend/src/orders/warehouse.service.ts`):
  - In `aggregateOrderGroup`: Standardized stock ratio calculation where `normalizedTotalQty = Math.max(rawTotalQty, totalInbound, rawStock)` and `normalizedHubStock = Math.max(0, Math.min(rawStock, normalizedTotalQty))` to mathematically guarantee `hubStock <= totalQuantity` (permanently eliminating `200 / 100 kiện` bug).
  - Also normalized individual child items so each line item strictly respects `stock <= totalQuantity`.
  - Consolidated multi-vehicle tracking across `it.trips`, `it.vehicleLicensePlate`, and `it.inventoryTransactions`.
- [x] Frontend (`frontend/src/app/dashboard/warehouse/orders/page.tsx`):
  - In `renderStock`: Sanitized stock ratio formatting ensuring `stock <= total` with defensive clamp `Math.min(stock, total)`.
  - In `renderTripCell`: Rendered prominent multi-vehicle badges (`+{multiTruckCount - 1} xe` and `+{multiTruckCount - 1} trip`) with detailed multi-line hover tooltip listing all intake vehicles, drivers, and trip codes.
  - Action triggers: Provided dual triggers on consolidated rows (accordion "Xem dòng / Thu gọn" + modal inspect eye icon).
- [x] E2E Automated Verification (`frontend/e2e/29-feedback-05-10-split-shipment-inbound-aggregation.spec.ts`):
  - API ratio parity test: Verified `hubStock <= totalQuantity` across all grouped warehouse orders (Passed 100%).
  - Multi-truck receiving test: Verified 2-truck intake (`76-H720-335` & `60-B1 15594`) consolidates into 1 parent row with algebraic sums (100 pkgs, 2.100 kg, 15 m³) and 2 distinct vehicle trips preserved (Passed 100%).
  - Browser UI test: Validates multi-vehicle badge (`+1 trip`, `+1 xe`) and Master-Detail line expansion (Passed 100%).
  - **Visual Evidence Screenshots Generated & Verified**:
    - [`06_split_shipment_inbound_aggregation_master.png`](../docs/feedback_evidence/05_10/06_split_shipment_inbound_aggregation_master.png): Consolidated master row (1 row, `2 dòng hàng`, `+1 trip`/`+1 xe`, `100 / 100 kiện`, `2.100 kg`, `15 m³`).
    - [`07_split_shipment_inbound_aggregation_expanded.png`](../docs/feedback_evidence/05_10/07_split_shipment_inbound_aggregation_expanded.png): Expanded child lines (`Dòng 1`: 70 pkgs / 1.600 kg on `76-H720-335`; `Dòng 2`: 30 pkgs / 500 kg on `60-B1 15594`).
    - [`08_split_shipment_inbound_waybill_detail_modal.png`](../docs/feedback_evidence/05_10/08_split_shipment_inbound_waybill_detail_modal.png): Waybill inspection modal displaying full audit history and inventory balance.

## Follow-up & Verification Status
- [x] **Run migration on DB**: Migration `1789040000000-AddQuantityAllocatedToTrip` confirmed executed on Neon DB (`trip.quantityAllocated integer NULL`).
- [x] **E2E Automation on Dev**: Playwright test suite `frontend/e2e/27-feedback-05-10-outbound-draft-and-parity.spec.ts` executed and PASSED 100% on dev domain (API counter parity, draft lifecycle create/cancel, UI board tabs, draft actions, 0 console errors).
- [x] **Git Workflow Completed**:
  - Feature branch `fix/feedback-05-10` created, committed, and pushed across all 3 repositories (`backend/`, `frontend/`, and root).
  - Merged into `dev` across all 3 repos and pushed to `origin/dev`.
  - Merged into `master` across all 3 repos and pushed to `origin/master`.
  - All 3 repositories cleanly tracking `dev` in sync with remote.
- [x] **UI Verification & E2E Testing**:
  - Outbound board tabs (`Tất cả / Chờ xử lý / Đã xử lý`), draft lifecycle (Lưu nháp / Tiếp tục / Hủy nháp) verified & passed 100% via Playwright Suite 27.
  - Inbound board tabs & 1:1 counter parity verified & passed 100% via Playwright Suite 28.
  - Sub-filter elimination (`Xuất khách / Khách gửi / Luân chuyển`) verified 0 occurrences on both Dev and Production.
  - Pallet A4 label printing (`PalletLabelA4Modal`) verified with operator hub name / order hub entity (`warehouseName`), zero customer pickup address mislabeling.
- [x] **Branch Alignment & Deployment**: Feature branches merged into `dev` and `master`, fully verified live on Dev and Production domains (`https://logistics-website-frontend-kappa.vercel.app`).

> [!NOTE]
> **Architectural Note (Outbound Customer Info)**: On direct customer dispatch (`CUSTOMER`), recipient details and delivery addresses originate from the Order Master Contract (`order.customerName`, `order.deliveryAddress`). Dispatch invoices and trip records track transportation operations (`licensePlate`, `driverName`, origin hub, destination hub, and allocated package quantities).
