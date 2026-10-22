# Handoff: Feedback 05/10 - Outbound Trip Board Counters & Pallet Label Warehouse Name

## Session Metadata
- Created: 2026-10-05 10:39:16
- Project: D:\Projects\logistics-website
- Branch: dev
- Session duration: ~2.5 hours

### Recent Commits (for context)
  - 8c4bc5f docs(warehouse): update feedback checklist, test cases, and logic spec
  - 14ed055 docs(warehouse): add 04/10 feedback audit specs and sync rbac matrix
  - dcf1332 chore(submodules): update backend and frontend pointers for throttler fix and debounced search
  - 51b07b1 chore(submodules): update backend and frontend pointers for flow scoping and e2e suite
  - d095c05 chore(submodules): update backend and frontend pointers for trip hub origin and outbound fix

## Handoff Chain

- **Continues from**: None (fresh start)
- **Supersedes**: None

> This is the first handoff for this task.

## Current State Summary

During this session, we resolved two critical issues reported in `feedback_05_10`: (1) Fixed the Outbound filter bar and table counter mismatch where the tabs counted orders but the board rendered trips, removing misleading labels and switching the board to query `GET /v1/warehouse/outbound-trips` with 1:1 parity between counters and paginated trip rows; (2) Corrected the warehouse identity shown on printed pallet labels (`PalletLabelA4Modal`) so that "KHO" displays the user's hub or current order hub rather than falling back to the sender pickup address. All TypeScript checks (`tsc --noEmit`) pass in both backend and frontend. The working tree has uncommitted modifications ready for review/commit.

## Architecture Overview

Logistics TMS consists of a NestJS backend and Next.js 15 App Router frontend configured as Git submodules. Warehouse outbound operations differentiate between hub-scoped order lifecycle (Cho nhap kho, Luu kho, Da xuat kho) and vehicle dispatch trips (Cho xu ly, Da xu ly). The Outbound board specifically tracks outbound trips departing from the current warehouse hub.

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `backend/src/orders/warehouse.controller.ts` | Exposes outbound trips endpoint with tab counters and paginated rows | Core API endpoint for outbound board |
| `backend/src/orders/warehouse.service.ts` | Implements SQL CTE querying trips with invoice types OUTBOUND/TRANSFER from current hub | Prevents counter and row mismatch |
| `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Next.js Outbound dashboard board rendering trips and filter counters | Replaced client-side order grouping with trip endpoint |
| `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx` | A4 pallet label print component displaying barcode and hub name | Fixed KHO warehouse field resolution |
| `feedback_05_10/TODO.md` | Verification checklist and findings for the 05/10 feedback | Tracks resolution of reported user bugs |

## Key Patterns Discovered

- Counter and table row parity must come from the same CTE / database query rather than disparate KPI endpoints.
- Pallet labels must strictly bind to warehouse entities (`currentHubEntity` or user hub), never defaulting to customer pickup address strings.
- Git submodules (`backend`, `frontend`) must have code committed inside their own repos, not just at the parent repository root.

## Work Completed

### Tasks Finished

- [x] Fixed outbound trip board: created `GET /v1/warehouse/outbound-trips` endpoint with CTE calculating counters (`all`, `customer`, `transfer`) and paginated trip rows with 100% parity.
- [x] Removed confusing `Lưu kho` tab and order-count footer from the outbound board, aligning all metrics and pagination to trip units.
- [x] Corrected pallet label print modal: replaced pickup address fallback with user hub or order `warehouseName`.
- [x] Cleaned up hardcoded mock preview data in Inbound label preview.
- [x] Updated RBAC matrix doc (`.agents/rules/rbac-matrix.md`) to version 1.6 to document `GET /v1/warehouse/outbound-trips`.
- [x] Verified TypeScript compilation (`tsc --noEmit`) for both backend and frontend.

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `backend/src/orders/warehouse.controller.ts` | Added `getOutboundTrips` endpoint | Support trip board pagination and counters |
| `backend/src/orders/warehouse.service.ts` | Added `getOutboundTrips` CTE query logic | Ensure 1:1 counter and row parity |
| `backend/src/orders/dto/confirm-outbound.dto.ts` | Added query DTO for outbound trips | Validate request parameters |
| `frontend/src/app/dashboard/warehouse/outbound/page.tsx` | Refactored outbound board to use outbound trips API | Render trips consistently |
| `frontend/src/features/warehouse/components/pallet-label-a4-modal.tsx` | Fixed KHO warehouse name resolution | Avoid showing customer pickup address |
| `frontend/src/features/warehouse/components/warehouse-waybill-detail-modal.tsx` | Updated pallet print props | Pass warehouse name properly |
| `frontend/src/app/dashboard/warehouse/inbound/page.tsx` | Updated print label props and removed hardcoded mock data | Clean operational UI |
| `frontend/src/app/dashboard/warehouse/orders/page.tsx` | Updated pallet print props | Consistency across warehouse screens |
| `.agents/rules/rbac-matrix.md` | Documented new outbound trips endpoint in RBAC matrix | Keep security spec updated |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Switched Outbound board tabs and rows to trips | Keep order grouping vs Dedicated trip API | Board shows vehicle departures (SD...); counting orders caused 8 vs 1 mismatch |
| Used user hub / currentHubEntity for pallet label KHO | Keep pickup address vs Warehouse entity | Previous fallback displayed customer pickup province instead of operating warehouse |

## Immediate Next Steps

1. Perform manual UI verification on the dev deployment after deploying changes.
2. Test printing pallet labels from both Nhap kho and Don hang kho to ensure warehouse name displays correctly.
3. Run git commit review and commit changes in `backend/` and `frontend/` submodules following AGENTS.md conventions.

## Pending Work

### Blockers/Open Questions

- [ ] Manual smoke test in browser: Verify trip board counters and pallet label print preview visually.

### Deferred Items

- Submodule git commits deferred pending explicit user confirmation as per safety rules.

## Important Context

The working tree currently has uncommitted changes across `backend/` and `frontend/` submodules. Submodules are independent repositories (`logistics-website-backend` and `logistics-website-frontend`). Do not commit only at the root repository. When making commits, always follow the submodule-first sequence and verify with `npm run repo:status` and `npm run repo:tracking`.

## Assumptions Made

- Outbound trips endpoint filters by viewer active warehouse hub ID in req.user.hubId.
- Pallet labels printed at a warehouse should represent that warehouse hub identity.

## Potential Gotchas

- Do not use client-side order-to-trip grouping in `frontend/src/app/dashboard/warehouse/outbound/page.tsx`; data is already grouped and paginated at the trip level by the backend API.
- Never put raw technical error codes in frontend UI toasts.

## Environment State

### Tools/Services Used

- Node.js / npm
- NestJS 11
- Next.js 15 App Router
- PostgreSQL on Neon (dev database)

### Active Processes

- None currently running in background

### Environment Variables

- DATABASE_URL (NestJS PostgreSQL connection)
- NEXT_PUBLIC_API_URL (Next.js backend REST API base URL)

## Related Resources

- `feedback_05_10/TODO.md`: Detailed issue checklist and test verification notes
- `.agents/rules/rbac-matrix.md`: System authoritative permissions matrix
- `IMPLEMENT_STATUS_TRIP_AND_ORDER.md`: Status lifecycle specification for trips and orders

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
