# Handoff Report: Reviewer 2 (Milestone 7 — RBAC & Interface Conformance Reviewer)

## 1. Observation

### 1.1 Layer 1: Sidebar UI Visibility
- In `frontend/src/config/nav-config.ts` (L19–L213):
  - Orders (`/dashboard/orders`): `access: { role: 'SUPER_ADMIN,DISPATCHER' }` (L43)
  - Trips (`/dashboard/trips`): `access: { role: 'SUPER_ADMIN,FLEET_MANAGER' }` (L52)
  - Fleet (`/dashboard/fleet`): `access: { role: 'SUPER_ADMIN,FLEET_MANAGER' }` (L61)
  - Warehouse (`/dashboard/warehouse`): `access: { role: 'SUPER_ADMIN,WAREHOUSE_MANAGER' }` (L70)
  - Hubs (`/dashboard/admin/hubs`): `access: { role: 'SUPER_ADMIN' }` (L84)
  - Users (`/dashboard/users`): `access: { role: 'SUPER_ADMIN' }` (L93)
- In `frontend/src/hooks/use-nav.ts` (L21–L109):
  - `useFilteredNavItems` parses `item.access.role.split(',')` and verifies against `user.role` from `useAuthStore`.
  - `useFilteredNavGroups` prunes groups whose items are all hidden, preventing empty group headings.
  - Used in both `frontend/src/components/layout/app-sidebar.tsx` (L45) and `frontend/src/components/kbar/index.tsx` (L13).

### 1.2 Layer 2: Next.js Route Guards
- In `frontend/src/proxy.ts` (L5–L130):
  - `roleRouteMap`:
    - `'/dashboard/admin': ['SUPER_ADMIN']` (L6)
    - `'/dashboard/users': ['SUPER_ADMIN']` (L7)
    - `'/dashboard/orders': ['SUPER_ADMIN', 'DISPATCHER']` (L8)
    - `'/dashboard/trips': ['SUPER_ADMIN', 'FLEET_MANAGER']` (L9)
    - `'/dashboard/fleet': ['SUPER_ADMIN', 'FLEET_MANAGER']` (L10)
    - `'/dashboard/warehouse': ['SUPER_ADMIN', 'WAREHOUSE_MANAGER']` (L11)
  - Unauthenticated access redirects to `/auth/sign-in` (L96).
  - Expired tokens trigger automatic refresh via `refreshAccessToken` (L84–L92).
  - Unauthorized role access redirects to `/dashboard/overview` (L111).

### 1.3 Layer 3: Action Buttons & API Controller Guard Protection
- In `backend/src/orders/orders.controller.ts`:
  - `POST /v1/orders`, `PATCH /v1/orders/:id`, `PATCH /v1/orders/:id/submit`, `DELETE /v1/orders/:id`: `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.DISPATCHER)` (L46, L136, L154, L185).
  - `PATCH /v1/orders/:id/no-vehicle`: `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.FLEET_MANAGER)` (L169).
  - `GET /v1/orders`: Open to all authenticated users with `@UseGuards(AuthGuard('jwt'), RolesGuard)` (L34).
- In `backend/src/trips/trips.controller.ts`:
  - `POST /v1/trips`, `POST /v1/trips/split`, `PATCH /v1/trips/:id`, `PATCH /v1/trips/:id/confirm`, `DELETE /v1/trips/:id`: `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.FLEET_MANAGER)` (L47, L61, L136, L154, L167).
  - `GET /v1/trips`: Open to all authenticated users.
- In `backend/src/vehicles/vehicles.controller.ts` & `backend/src/drivers/drivers.controller.ts`:
  - Class-level `@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.FLEET_MANAGER)` (L30).
- In `backend/src/hubs/hubs.controller.ts`:
  - `POST /v1/hubs`, `PATCH /v1/hubs/:id`, `PATCH /v1/hubs/:id/toggle-active`, `DELETE /v1/hubs/:id`: `@Roles(RoleEnum.SUPER_ADMIN)` (L41, L101, L119, L134).
  - `GET /v1/hubs`, `GET /v1/hubs/active`: Open to all authenticated roles.
- In `backend/src/users/users.controller.ts`:
  - Class-level `@Roles(RoleEnum.SUPER_ADMIN)` (L40).
- In `backend/src/notifications/notifications.controller.ts`:
  - All endpoints scoped strictly to `req.user.id` (L45, L56, L65, L71).

### 1.4 nuqs State Synchronization & Filter Hooks
- Verified all table filter hooks across all refactored modules:
  - `src/features/hubs/components/hubs-tables/use-hubs-table-filters.tsx` (L9–L17)
  - `src/features/fleet/components/vehicles-table/use-vehicles-table-filters.tsx` (L8–L26)
  - `src/features/fleet/components/drivers-table/use-drivers-table-filters.tsx` (L8–L26)
  - `src/features/orders/components/orders-tables/use-orders-table-filters.tsx` (L24–L37)
  - `src/features/trips/components/trips-tables/use-trips-table-filters.tsx` (L25–L37)
  - `src/features/warehouse/components/warehouse-tables/use-warehouse-table-filters.tsx` (L9–L20)
  - `src/features/notifications/hooks/use-notifications-filters.ts` (L8–L12)
- All hooks safely use `parseAsInteger.withDefault(1)` and `parseAsInteger.withDefault(10)` or `parseAsString` with default values, preventing NaN or unhandled exceptions when invalid query strings are provided.

### 1.5 Interface & Feature Folder Structure Conformance
- All feature modules strictly adhere to the canonical table architecture:
  - `hubs`: `src/features/hubs/components/hubs-tables/` + `hubs-listing.tsx`
  - `fleet`: `src/features/fleet/components/vehicles-table/` & `drivers-table/` + `fleet-listing.tsx`
  - `orders`: `src/features/orders/components/orders-tables/` + `orders-listing.tsx`
  - `trips`: `src/features/trips/components/trips-tables/` + `trips-listing.tsx`
  - `users`: `src/features/users/components/users-table/` + `user-listing.tsx`
  - `warehouse`: `src/features/warehouse/components/warehouse-tables/` + `warehouse-listing.tsx`
  - `notifications`: `src/features/notifications/components/` + `hooks/`

### 1.6 Pointer Cursor Rules & Vietnamese Toast Standardization
- All interactive triggers, buttons, checkboxes, dialog triggers, and select dropdowns contain explicit `cursor-pointer` classes.
- Disabled buttons include `cursor-not-allowed` / `disabled:opacity-60`.
- All mutation handlers follow the API-first pattern:
  `const apiMessage = err?.response?.data?.message; toast.error(apiMessage || 'fallback tiếng Việt');`
- 100% Vietnamese toast messages across business domain components.

### 1.7 Integrity & Compilation Check
- `npm run typecheck` (`tsc --noEmit`): Exited with code 0 (0 TypeScript errors).
- No dummy/facade implementations, no hardcoded bypasses, no mocked data shortcuts in source components.

---

## 2. Logic Chain

1. **Layer 1 Compliance**: Observation 1.1 establishes that `nav-config.ts` defines explicit role boundaries for every menu item, and `useFilteredNavGroups` removes unauthorized links and empty groups in real-time. This guarantees that Dispatcher, Fleet Manager, and Warehouse Manager only see their permitted menu options.
2. **Layer 2 Compliance**: Observation 1.2 proves that `proxy.ts` strictly verifies JWT tokens, manages token refreshes, and redirects unauthorized role navigation to `/dashboard/overview` while redirecting unauthenticated requests to `/auth/sign-in`.
3. **Layer 3 Compliance**: Observation 1.3 proves that backend controllers enforce role restrictions via NestJS `@Roles()` decorators and `RolesGuard`, ensuring that direct API tampering cannot bypass UI restrictions (e.g., non-Super-Admin cannot modify hubs or users; Dispatcher cannot mutate trips; Fleet Manager cannot mutate orders except `no-vehicle`).
4. **nuqs State Synchronization**: Observation 1.4 proves that all table state hooks use strongly-typed parsers with safe fallback defaults, guaranteeing seamless URL search param synchronization without NaN / runtime crashes.
5. **Architectural Conformance**: Observations 1.5, 1.6, and 1.7 verify complete adherence to the project folder layout, UI UX pointer rules, Vietnamese toast requirements, and TypeScript type safety.

---

## 3. Caveats

- Playwright tests run against live HTTP services; when Next.js dev server is running on port 3000, `npm run build` cannot run concurrently due to Next.js process lock on `.next`. TypeScript compile integrity was independently verified via `npm run typecheck` with exit code 0.

---

## 4. Conclusion

The 3-layer RBAC architecture, `nuqs` URL search params synchronization, feature folder layout, pointer cursor conventions, Vietnamese toast messages, and integrity checks across all 7 refactored modules (`hubs`, `fleet`, `orders`, `trips`, `users`, `warehouse`, `notifications`) are 100% verified, consistent, and strictly conformant to `PROJECT.md`, `ORIGINAL_REQUEST.md`, and `rbac-matrix.md` v1.3.

**Explicit Verdict: APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **TypeScript Typecheck**:
   ```bash
   cd frontend
   npm run typecheck
   ```
   *Expected output: Exits cleanly with code 0.*

2. **Inspect RBAC Matrix & Configs**:
   - Inspect `frontend/src/config/nav-config.ts` for Layer 1 menu role tags.
   - Inspect `frontend/src/proxy.ts` for Layer 2 `roleRouteMap` Next.js route protection.
   - Inspect `backend/src/**/controller.ts` for Layer 3 NestJS `@Roles` and `@UseGuards(AuthGuard('jwt'), RolesGuard)` annotations.

3. **Inspect nuqs URL Filter Hooks**:
   - Inspect `frontend/src/features/**/use-*-table-filters.tsx` and `frontend/src/hooks/use-data-table.ts` for `parseAsInteger` / `parseAsString` usage.
