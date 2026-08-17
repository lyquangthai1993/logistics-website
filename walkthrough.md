# Walkthrough - Spider Express TMS Seed Data & Role Alignment

All role definitions and seed data services in the NestJS backend have been aligned with the Spider Express business domain specified in [`PROJECT_NOTED.md`](file:///d:/Projects/logistics-website/PROJECT_NOTED.md), and executed against the PostgreSQL database.

## Changes Made

### Backend Domain Roles & Seed Services

1. **[`roles.enum.ts`](file:///d:/Projects/logistics-website/backend/src/roles/roles.enum.ts)**:
   - Defined Spider Express operational roles:
     - `SUPER_ADMIN` = 1
     - `DISPATCHER` = 2
     - `FLEET_MANAGER` = 3
     - `WAREHOUSE_MANAGER` = 4

2. **[`role-seed.service.ts`](file:///d:/Projects/logistics-website/backend/src/database/seeds/relational/role/role-seed.service.ts)**:
   - Seeded all 4 roles into PostgreSQL DB: `Super Admin`, `Dispatcher`, `Fleet Manager`, `Warehouse Manager`.

3. **[`user-seed.service.ts`](file:///d:/Projects/logistics-website/backend/src/database/seeds/relational/user/user-seed.service.ts)**:
   - Seeded active operational users matching Spider Express actors:
     - `admin@spiderexpress.vn` (SUPER_ADMIN)
     - `ducanh@spiderexpress.vn` (DISPATCHER - Đức Anh)
     - `fleet@spiderexpress.vn` (FLEET_MANAGER)
     - `warehouse@spiderexpress.vn` (WAREHOUSE_MANAGER)

4. **Updated Associated References**:
   - `auth.service.ts`: Set default registered role to `RoleEnum.DISPATCHER`.
   - `users.controller.ts`: Secured administrative routes with `@Roles(RoleEnum.SUPER_ADMIN)`.
   - `document/user/user-seed.service.ts`: Updated Mongoose seed service for consistency.

---

## Verification & Execution Results

### 1. Build Verification
- Executed `npm run build` inside `backend/`:
  - **Result**: Clean compilation with 0 errors.

### 2. Migration Check
- Executed `npm run migration:run` in `backend/`:
  - **Result**: Schema is up-to-date with 0 pending migrations.

### 3. Seed Execution
- Executed `npm run seed:run:relational` in `backend/`:
  - **Result**: Successfully created missing roles and inserted active Spider Express operational accounts:
    - Inserted `Role` #3 ("Fleet Manager") & #4 ("Warehouse Manager")
    - Inserted `User` `admin@spiderexpress.vn` (`SUPER_ADMIN`)
    - Inserted `User` `ducanh@spiderexpress.vn` (`DISPATCHER` - Đức Anh)
    - Inserted `User` `fleet@spiderexpress.vn` (`FLEET_MANAGER`)
    - Inserted `User` `warehouse@spiderexpress.vn` (`WAREHOUSE_MANAGER`)
