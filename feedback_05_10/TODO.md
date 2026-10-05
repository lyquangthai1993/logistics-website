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
- [x] Frontend board: tabs `Tất cả / Chờ xử lý / Đã xử lý` + sub-filter `Tất cả loại / Xuất khách / Luân chuyển`; draft rows → "Tiếp tục" (reopen note) / "Hủy nháp"; batch "Xác nhận xuất" on selected drafts; printing only for dispatched trips; sub-row figures from the trip lines.
- [x] Frontend: real "Lưu nháp" on the outbound note and transfer step 3 (step 1 disabled until goods are selected); inbound board ignores outbound/transfer draft trips of the same hub.
- [x] RBAC matrix updated (v1.7).
- [x] Verify: backend + frontend `tsc --noEmit` pass.

## Follow-up & Verification Status
- [x] **Run migration on DB**: Migration `1789040000000-AddQuantityAllocatedToTrip` confirmed executed on Neon DB (`trip.quantityAllocated integer NULL`).
- [x] **E2E Automation on Dev**: Playwright test suite `frontend/e2e/27-feedback-05-10-outbound-draft-and-parity.spec.ts` executed and PASSED 100% on dev domain (API counter parity, draft lifecycle create/cancel, UI board tabs, draft actions, 0 console errors).
- [x] **Git Workflow Completed**:
  - Feature branch `fix/feedback-05-10` created, committed, and pushed across all 3 repositories (`backend/`, `frontend/`, and root).
  - Merged into `dev` across all 3 repos and pushed to `origin/dev`.
  - Merged into `master` across all 3 repos and pushed to `origin/master`.
  - All 3 repositories cleanly tracking `dev` in sync with remote.
- [ ] Manual check on the UI (Xuất kho tabs + Lưu nháp/Tiếp tục/Hủy nháp + in tem from Nhập kho / Đơn hàng kho).
- [ ] Known limitation: customer name/phone/address on the outbound note are not stored (neither by confirm nor by draft).
