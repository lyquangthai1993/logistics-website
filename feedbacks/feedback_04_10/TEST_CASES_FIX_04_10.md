# Test Cases — Fix 04/10 (Warehouse Outbound, Lookup, Warehouse Orders, Receipt)

> Hand-off document for a testing agent. Covers every fix from
> [`FIX_SPEC_FEEDBACK_AND_CALCULATOR.md`](./FIX_SPEC_FEEDBACK_AND_CALCULATOR.md) plus the receipt follow-up fix.
> Seed/scenario data: [`mock_data_test_cases.json`](./mock_data_test_cases.json) (TC-01 … TC-05).
> UI labels are quoted in Vietnamese exactly as rendered.

## 0. Environment & Preconditions

| Item | Value |
|---|---|
| Frontend (dev) | `https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app` |
| Backend (dev) | `https://logistics-website-backend-1jho.onrender.com` (Swagger: `/docs`) |
| Local alternative | `npm run dev` at repo root — see `.agents/skills/e2e-test-runner/SKILL.md` (pre-flight `npm run e2e:check` in `frontend/`) |
| Accounts | See "Test Credentials" in `.agents/skills/e2e-test-runner/SKILL.md`. Needed: `SUPER_ADMIN`, plus one `WAREHOUSE_MANAGER` assigned to each hub: HCM (id 1), Đà Nẵng (id 2), Hưng Yên (id 3). If only one WM account exists, re-assign its hub between steps (Admin → Users) and re-login. |
| Code version | Branch `dev` = commit FE `134e8cd`, BE `358a520`. |

> [!IMPORTANT]
> **TC-R1 … TC-R3 (receipt follow-up: removed "(Xuất giao cho khách hàng)" line, "Xuất Tại Kho" source) are NOT deployed yet** — test them on local `frontend/` working tree only, or skip and mark `BLOCKED (not deployed)`.

**Data rules (AGENTS.md):** use only order codes prefixed `TEST-`. Never run `DROP` / `TRUNCATE`. Cleanup SQL (only if asked): section 5.1 of the spec.

**Seeding:** create data through the UI (`/dashboard/warehouse/inbound` → create inbound note) using the rows of each TC in `mock_data_test_cases.json`. Rows sharing one order code in the same inbound note produce separate order records (separate ids) — this is the precondition for TC-06/TC-07.

**Evidence per test case:** screenshot(s) + network response of the relevant API call + PASS/FAIL + notes. Report format at the end.

---

## 1. Sidebar (Issue 2)

### TC-S1 — SUPER_ADMIN sidebar is clean
1. Login as `SUPER_ADMIN`, open `/dashboard`.
2. **Expect:** no group "Không gian làm việc"; no Kanban / Chat / AI Chat items; Dashboard item has no "Overview" group label above it.

### TC-S2 — WAREHOUSE_MANAGER sidebar
1. Login as WM.
2. **Expect:** only warehouse pages: "Nhập kho", "Xuất kho", "Đơn hàng kho". No Dashboard, no demo items.

---

## 2. Outbound Lookup Modal (Issue 1 + Issue 6)

Page: `/dashboard/warehouse/outbound` → create outbound note → click the search/lookup icon of a row's order-code cell → modal "Tra cứu & chọn hàng trong kho".

### TC-L1 — Lookup only shows goods stored at this hub (or local drafts)
Precondition: TC-01 seeded at HCM; TC-01 outbound done (so HCM holds 5 kiện per row; Đà Nẵng has goods in transit).
1. Login WM Đà Nẵng **before** Đà Nẵng confirms receiving → open lookup.
2. **Expect:** TC-01 rows still in transit are **not** listed (no "Chờ nhập kho" rows at all).
3. Network: `GET /api/v1/warehouse/orders?...&flow=OUTBOUND_LOOKUP` is called.
4. Status pills show only "Tất cả", "Lưu kho", "Đơn nháp"; counters equal the rows rendered (Tất cả = Lưu kho + Đơn nháp for this scope).

### TC-L2 — "Tồn khả dụng" column uses hub stock
1. Login WM HCM after TC-01 outbound → open lookup, search `TEST-HCM-01`.
2. **Expect:** column header "Tồn khả dụng"; each row shows `5 / <total> kiện` (5 / 15, 5 / 12, 5 / 8, 5 / 5). Must NOT show contract quantity as available.

### TC-L3 — Out-of-stock row cannot be selected
1. Fully export one row (e.g. `TEST-HCM-01-ROW4`, 5 kiện) → open lookup again.
2. **Expect:** row absent, or shown with red stock `0` and badge "Hết tồn khả dụng" instead of button "Chọn đơn này".

### TC-L4 — Selecting fills hub stock + proportional kg/m³
1. In lookup choose `TEST-HCM-01-ROW1` (stock 5 / total 15, 75 kg, 1.2 m³).
2. **Expect grid row:** quantity `5`, kg `25` (75×5/15), m³ `0.4` (1.2×5/15). Not 15 / 75 / 1.2.

### TC-06 — Same order code, different lines are NOT co-locked (Issue 6 / TC-05 data)
Precondition: TC-05 seeded at HCM: `TEST-BAT2609-335TH` — "Sữa Tiệt Trùng Lô 1" (20 kiện) and "Sữa Tiệt Trùng Lô 2" (1 kiện) as two lines.
1. Row #1 → lookup → choose Lô 1.
2. Row #2 → lookup.
3. **Expect:** Lô 1 shows "Đã ở dòng #1"; Lô 2 still shows button "Chọn đơn này" (optionally hint "Cùng mã với dòng đã chọn"). Choose Lô 2 → grid has 2 rows with different goods.
4. Re-open lookup from Row #2 → Lô 2 shows "Đang ở dòng #2", Lô 1 shows "Đã ở dòng #1".

### TC-06b — Typing the order code picks the unused line
1. New note. Row #1: type `TEST-BAT2609-335TH` → wait for auto-search → note which line is filled.
2. Row #2: type the same code.
3. **Expect:** Row #2 is filled with the **other** line (different goods/qty); no warning "đã được chọn ở một dòng khác".

### TC-06c — Same line twice is blocked on submit
1. Use an order code that has only **one** line (e.g. `TEST-HCM-01-ROW1`). Row #1: pick it via lookup.
2. Row #2: type the same code.
3. **Expect:** warning toast "Dòng hàng … này đã được chọn ở một dòng khác trong phiếu xuất!".
4. Click confirm outbound.
5. **Expect:** toast "Dòng hàng … đang bị chọn 2 lần trên phiếu. Vui lòng gộp số lượng vào một dòng." and no `POST /outbound/confirm` call.
6. "Nhân bản dòng" (duplicate row) on a filled row → the copy has an empty code and does not show as "Đã ở dòng #N" in the lookup.

---

## 3. Refresh Metrics (Issue 4)

### TC-RM1 — "Cập nhật lại thông số" no longer crashes
1. Outbound create form with ≥1 filled row (from lookup) → click "Cập nhật lại thông số" (refresh metrics button).
2. **Expect:** no runtime error `freshData.find is not a function`; console clean; network `GET /api/v1/warehouse/orders?ids=<ids>&limit=100`.
3. Row shows current hub stock; export qty unchanged if ≤ stock.

### TC-RM2 — Export qty clamped when stock dropped
1. Fill a row with qty 5 (stock 5). In another tab/session export 3 kiện of the same line.
2. Back in first tab → "Cập nhật lại thông số".
3. **Expect:** qty becomes 2, kg/m³ recalculated proportionally.

---

## 4. Outbound Receipt After Create (Issue 7)

### TC-07 — Receipt keeps one line per grid row (TC-05 data)
1. Continue TC-06 (2 rows: Lô 1 qty 20, Lô 2 qty 1). Mode "Giao khách", fill customer + plate `29C-888.88` + driver `Nguyễn Văn Giao` → confirm.
2. **Expect receipt modal (screen + print preview landscape & portrait):**
   - Document code = backend invoice code (prefix `PGH-` for customer, `PXK-` for transfer), **not** `TEST-BAT2609-335TH`.
   - QR value = trip code `SD<n>` from the API response.
   - Table has **2 rows**: STT 1 "Sữa Tiệt Trùng Lô 1" 20 Kiện; STT 2 "Sữa Tiệt Trùng Lô 2" 1 Kiện; Tổng cộng 21.
   - Never one merged row "Sữa Tiệt Trùng Lô 1, Sữa Tiệt Trùng Lô 2".
   - Plate/driver = values entered.
3. Network: `POST /api/v1/warehouse/outbound/confirm` response contains `data.invoiceCode`, `data.tripCode`; ledger stock of both lines decreases by exported qty.

### TC-07b — Transfer receipt
1. Mode "Luân chuyển" to Đà Nẵng with 2 rows (TC-01 rows) → confirm.
2. **Expect:** code prefix `PXK-`; plate/driver from the transfer step; destination hub name shown; 2 separate rows.

---

## 5. Receipt Follow-up (NOT deployed — local only)

### TC-R1 — No mode subtitle
1. Open any outbound receipt (after create, or reprint from the board "Chuyến xe xuất kho").
2. **Expect:** under the document code there is **no** line "(Xuất giao cho khách hàng)" / "(Xuất luân chuyển nội bộ)"; screen title is just "PHIẾU XUẤT KHO".

### TC-R2 — "Xuất Tại Kho" = dispatching hub (WM)
1. Login WM HCM → board → reprint receipt of a dispatched vehicle (order pickup address is a customer address, e.g. "Phường Bến Cát, TP.HCM").
2. **Expect:** "Xuất Tại Kho" = HCM hub name (e.g. "ANDROMEDA HUB - HCM"), **never** the customer pickup address; never "HUB POLARIS" placeholder.

### TC-R3 — "Xuất Tại Kho" for SUPER_ADMIN (no hub)
1. Login SUPER_ADMIN → outbound board → reprint.
2. **Expect:** hub of the outbound ledger entry (or order origin hub); empty rather than a fake name if unknown.

---

## 6. Warehouse Orders Page (Issue 3 + Mục 5)

Page: `/dashboard/warehouse/orders`.

### TC-O1 — Grouped by order code, no "SỐ KIỆN" column
1. Login WM HCM with TC-05 data present.
2. **Expect:** columns: STT, MÃ ĐƠN HÀNG, TÊN HÀNG HÓA, CHUYẾN XE / TRIP, TỒN KHO, SỐ KG, SỐ M³, ĐÍCH ĐẾN, TRẠNG THÁI, THAO TÁC (no "SỐ KIỆN").
3. `TEST-BAT2609-335TH` appears **once** with badge "2 dòng hàng"; TỒN KHO = sum of hub stock of both lines; kg/m³ = sums (3.5 kg, 2.2 m³ before export).
4. Network: `GET /api/v1/warehouse/orders?...&groupBy=orderCode`; `meta.total` = number of distinct codes.

### TC-O2 — Expand / member actions
1. Click the grouped row → expands 2 sub-rows "Dòng 1", "Dòng 2" with their own stock/kg/m³/status.
2. Click a sub-row → detail modal of that line. Eye/print icons on sub-rows work; trash icon only on DRAFT lines.
3. Single-line codes: clicking row opens detail directly; actions shown inline.

### TC-O3 — Stock numbers across the TC-01 journey
Follow `warehouseOrdersPageExpectations` in `mock_data_test_cases.json`:
- HCM after outbound: each TC-01 row TỒN KHO `5 / total`, tab "LƯU KHO".
- Đà Nẵng after receiving: received rows show stock = received qty (10 for ROW1; Xe bo row 3).
- Hưng Yên after receiving: ROW2 stock 7.
- Fully exported line moves to tab "ĐÃ XUẤT KHO" with stock 0.
**Expect:** TỒN KHO always = ledger hub stock of the logged-in hub (not network-wide remaining, not contract qty).

### TC-O4 — Pagination & STT
1. Set page size 10, go to page 2.
2. **Expect:** STT starts at 11 (uses page size, not hard-coded 15). Tab labels: "Tất cả", "LƯU KHO", "ĐƠN NHÁP", "ĐÃ XUẤT KHO" (no raw "DRAFT").

### TC-O5 — Label print fallback
1. Print label (Tem A4) for a line with quantity 0 or missing.
2. **Expect:** shows 0, never a fake "10".

---

## 7. Waybill Detail Label (Issue 5)

### TC-X1 — Xe bo label
1. Open detail of `TEST-HCM-01-ROW3` (destination hub id 6 "Xe bo Tuyến Đà Nẵng", level 2).
2. **Expect:** route-type badge "Xe bo" (not "Hub Cấp 1").

### TC-X2 — Hub cấp 1 / Giao thẳng
- `TEST-HCM-01-ROW1` (dest hub 2, level 1) → "Hub Cấp 1".
- Order with no destination hub, mode DIRECT_CUSTOMER → "Giao thẳng".

---

## 8. Regression Checks

| ID | Check | Expect |
|---|---|---|
| RG1 | Outbound board "Chuyến xe xuất kho" still lists dispatched vehicles | Unchanged (board uses `flow=OUTBOUND`) |
| RG2 | Inbound create & confirm (TC-01 inbound) | Works; stock increases at receiving hub |
| RG3 | Backend rejects over-export | Export qty > hub stock → 422 with Vietnamese message, shown via toast (no raw error keys) |
| RG4 | Console | No React key warnings / runtime errors on the 3 warehouse pages |
| RG5 | Compact UI | Lookup modal and orders table use small paddings / `text-[10px]` rows; no emoji in badges/buttons |

## 9. Known Open Items (do NOT fail tests for these; just note if observed)
- Reprint receipt from the board shows order code instead of invoice code, contract qty instead of exported qty, and default "01 BỘ CT".
- `confirmOutbound` overwrites `order.destinationHubId` on transfer → contract destination may change after an inter-hub transfer (affects TC-O3 / TC-X1 after transfer).
- Misrouted receiving (spec E1) not implemented.

## 10. Report Template
```
| TC ID | Result (PASS/FAIL/BLOCKED) | Evidence (screenshot / network) | Notes |
|-------|----------------------------|----------------------------------|-------|
```
Summarize FAIL items first with exact repro steps, expected vs actual, and API response snippets.
