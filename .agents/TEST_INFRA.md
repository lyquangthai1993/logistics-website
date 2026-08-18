# E2E Test Infra: Logistics TMS Frontend

## Test Philosophy
- Opaque-box & E2E requirement-driven.
- Playwright runner executing against running Next.js frontend (`http://localhost:3000`) and NestJS backend.
- Covers Tiers 1-4 (Feature Coverage, Boundary/Corner Cases, Cross-Feature Combinations, Real-World Workflows) and Tier 5 (Adversarial coverage hardening).

## Feature Inventory & Test Mapping
| # | Feature | Spec File | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-----------|:------:|:------:|:------:|:------:|
| 1 | Hubs Management | `10-hubs-management.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 2 | Fleet Vehicles & Drivers | `04-fleet-crud-and-refresh.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 3 | Orders Intake & Dispatch | `06-order-dispatch-workflow.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 4 | Trips & Vehicle Capacity | `06-order-dispatch-workflow.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 5 | Users Management | `02-login-flow.spec.ts`, `03-rbac-routing.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 6 | Warehouse Inbound | `06-order-dispatch-workflow.spec.ts` | ✓ | ✓ | ✓ | ✓ |
| 7 | Notifications | `06-notification-system.spec.ts`, `07-notification-ui-visual.spec.ts` | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- Test runner: `npx playwright test`
- Base URL: `http://localhost:3000`
- Helper utilities: `frontend/e2e/helpers/auth.ts` (`loginAs`, `clearSession`, `collectConsoleLogs`)
- Test users: `admin@logistics.vn`, `dispatcher@logistics.vn`, `fleet@logistics.vn`, `warehouse@logistics.vn`

## Critical Locators & Selectors to Preserve
1. **Hubs**:
   - Search input: `#hub-search-input`
   - Add Hub button: `#btn-add-hub`
   - Hub modal: `#hub-form-dialog`
   - Table rows: `table tr`
2. **Fleet**:
   - Add Vehicle button: `#btn-add-vehicle`
   - Edit vehicle: `button[data-testid^="btn-edit-vehicle-"]`
   - Delete vehicle: `button[data-testid^="btn-delete-vehicle-"]`
   - Drivers tab trigger: `#tab-drivers`
   - Add Driver button: `#btn-add-driver`
   - Edit driver: `button[data-testid^="btn-edit-driver-"]`
   - Delete driver: `button[data-testid^="btn-delete-driver-"]`
   - Search input: `#fleet-search-input`
   - Delete confirm: `#delete-confirm-dialog`
3. **Orders**:
   - Create Order button: `button:has-text("Tạo lệnh điều vận mới")`
   - Submit to Fleet button: `button:has-text("Gửi Fleet")`
   - Table rows: `table tr`
4. **Trips**:
   - Assign Order button: `[data-testid^="btn-assign-order-"]`
   - Confirm Trip button: `button:has-text("Xác nhận Trip")`
5. **Warehouse**:
   - Heading: `getByRole('heading', { name: 'Inbound Hub & Kho Tiếp Nhận' })`
   - Search: `input[placeholder*="Tìm theo mã đơn"]`
