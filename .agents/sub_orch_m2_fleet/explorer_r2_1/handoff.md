# Investigation & Fix Formulation Report — Explorer 1 (Iteration 2)

- **Agent**: Explorer 1 (Iteration 2)
- **Role**: Explorer / Investigator / Synthesist
- **Milestone**: Milestone 2 — Fleet Management Standardization
- **Target Defects**: 
  - Defect 1: Heading Collision (`info-content.ts` vs Page Heading `<h2>Quản Lý Đội Xe</h2>`)
  - Defect 2: Form Reset Race Condition (`vehicle-form-dialog.tsx` & `driver-form-dialog.tsx`)
- **Parent Conversation ID**: `7172e926-cfe8-4b9c-8361-0f7ee6c930b0`
- **Working Directory**: `d:\Projects\logistics-website\.agents\sub_orch_m2_fleet\explorer_r2_1`
- **Date**: 2026-08-18

---

## 1. Observation

### 1.1 Direct Code Inspection & File Evidence

#### Defect 1: Heading Collision Evidence
1. **`frontend/src/features/fleet/info-content.ts` (L3-4)**:
   ```typescript
   export const fleetInfoContent: InfobarContent = {
     title: 'Quản Lý Đội Xe — TanStack Table & nuqs Pattern',
   ```
2. **`frontend/src/app/dashboard/fleet/page.tsx` (L20-24)**:
   ```tsx
   <PageContainer
     pageTitle='Quản Lý Đội Xe'
     pageDescription='Theo dõi danh sách phương tiện, sức chứa tải trọng, bằng lái & tình trạng tài xế Spider Express'
     infoContent={fleetInfoContent}
   >
   ```
3. **`frontend/src/components/ui/heading.tsx` (L13-14)**:
   ```tsx
   <div className='flex items-center gap-2'>
     <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>
   ```
4. **`frontend/src/components/layout/info-sidebar.tsx` (L40-43)**:
   ```tsx
   <InfobarHeader className='bg-sidebar sticky top-0 z-10 flex flex-row items-center justify-between gap-2 border-b px-4 py-3'>
     <div className='min-w-0 flex-1'>
       <h2 className='text-lg font-semibold wrap-break-word'>{data.title}</h2>
     </div>
   ```
5. **Comparison with Hubs (`frontend/src/features/hubs/info-content.ts` L3-4 & `frontend/src/app/dashboard/admin/hubs/page.tsx` L21-24)**:
   - Hubs info-content title: `'Chi Nhánh Kho (Hubs) — Hướng Dẫn & Kiến Trúc'`
   - Hubs page title: `'Quản Lý Chi Nhánh Kho'`
   - Result: Hubs does NOT collide because the infobar title does not contain the phrase `"Quản Lý Chi Nhánh Kho"`.
6. **Verbatim Playwright Failure Log (`e2e/04-fleet-crud-and-refresh.spec.ts:127`)**:
   ```
   Error: strict mode violation: getByRole('heading', { name: /Quản Lý Đội Xe/i }) resolved to 2 elements:
       1) <h2 class="text-3xl font-bold tracking-tight">Quản Lý Đội Xe</h2> aka getByRole('heading', { name: 'Quản Lý Đội Xe', exact: true })
       2) <h2 class="text-lg font-semibold wrap-break-word">Quản Lý Đội Xe — TanStack Table & nuqs Pattern</h2> aka getByRole('heading', { name: 'Quản Lý Đội Xe — TanStack' })
   ```

---

#### Defect 2: Form Reset Race Condition Evidence
1. **`frontend/src/features/fleet/components/vehicle-form-dialog.tsx` (L28, L42-86)**:
   - State for `hubs`: `const [hubs, setHubs] = useState<Hub[]>([]);` (L28)
   - Async Fetch in `useEffect`:
     ```typescript
     useEffect(() => {
       let isMounted = true;
       hubsApi.getActiveHubs().then((data) => {
         if (isMounted && Array.isArray(data)) setHubs(data);
       }).catch(() => {
         if (isMounted) setHubs([]);
       });
       return () => { isMounted = false; };
     }, []);
     ```
   - Form Reset/Sync `useEffect` (L60-86):
     ```typescript
     useEffect(() => {
       if (vehicle) {
         setLicensePlate(vehicle.licensePlate || '');
         // ...
       } else {
         setLicensePlate('');
         setModel('');
         setType('CONTAINER_40FT');
         setMaxWeight(25000);
         setMaxVolume(65.5);
         const defaultHub = hubs.length > 0 ? hubs[0] : null;
         setHubId(defaultHub ? defaultHub.id : null);
         setCurrentHub(defaultHub ? defaultHub.name : '');
         setStatus('AVAILABLE');
         setIsExternal(false);
         setExternalProvider('');
       }
     }, [vehicle, hubs, open]);
     ```
2. **Execution Trace during Test 2 (`04-fleet-crud-and-refresh.spec.ts:39-48`)**:
   - User/Test clicks `#btn-add-vehicle` -> `open` becomes `true`.
   - Form mounts/opens with `vehicle === null`.
   - `useEffect` executes once (due to `open=true`). Fields are initialized to empty strings.
   - Playwright test immediately begins typing:
     - `page.fill('#input-license-plate', '75H-825.99')`
     - `page.fill('#input-vehicle-model', 'Volvo FMX Heavy')`
   - Simultaneously, `hubsApi.getActiveHubs()` finishes its async HTTP request and calls `setHubs(data)`.
   - `hubs` state updates from `[]` to `[Hub1, Hub2, ...]`.
   - Because `hubs` is in the dependency array `[vehicle, hubs, open]`, the `useEffect` triggers AGAIN!
   - Since `vehicle` is `null` (Create mode), the `else` block executes and calls `setLicensePlate('')`, `setModel('')`, `setMaxWeight(25000)`, etc.
   - **Result**: The user's typed inputs are wiped out in real time while typing. The submitted payload is either empty or rejected by HTML5 input validation.

3. **`frontend/src/features/fleet/components/driver-form-dialog.tsx` (L36-52)**:
   ```typescript
   useEffect(() => {
     if (driver) {
       setFullName(driver.fullName || '');
       setPhone(driver.phone || '');
       setLicenseNumber(driver.licenseNumber || '');
       setLicenseClass(driver.licenseClass || 'FC');
       setExperienceYears(driver.experienceYears ?? 5);
       setStatus(driver.status || 'AVAILABLE');
     } else {
       setFullName('');
       setPhone('');
       setLicenseNumber('');
       setLicenseClass('FC');
       setExperienceYears(5);
       setStatus('AVAILABLE');
     }
   }, [driver, open]);
   ```
   - Lacks an `if (open)` guard, meaning any background query refetch that changes the `driver` object reference in the parent table re-executes the reset while the dialog is open.

---

## 2. Logic Chain & Root Cause Analysis

```
[Observation 1.1] fleetInfoContent.title = 'Quản Lý Đội Xe — TanStack Table & nuqs Pattern'
                 + PageContainer pageTitle = 'Quản Lý Đội Xe'
                 + Both render <h2> tags in layout
   ===> [Logic Step 1]: Playwright locator getByRole('heading', { name: /Quản Lý Đội Xe/i }) 
        finds 2 matching <h2> elements, causing strict mode failure.
   ===> [Resolution 1]: Change fleetInfoContent.title to 'Đội Xe & Phương Tiện — Hướng Dẫn & Kiến Trúc'
        (Matching Hubs' convention 'Chi Nhánh Kho (Hubs) — Hướng Dẫn & Kiến Trúc' which does not contain 'Quản Lý').

[Observation 1.2] vehicle-form-dialog.tsx has useEffect with dependency [vehicle, hubs, open]
                 + hubs is fetched asynchronously via hubsApi.getActiveHubs()
                 + Playwright starts typing in form fields immediately upon modal open
   ===> [Logic Step 2]: hubs state update triggers useEffect while modal is open.
   ===> [Logic Step 3]: else branch (vehicle=null) unconditionally resets licensePlate and model to ''.
   ===> [Logic Step 4]: In-flight user input is erased, causing form submission failure.
   ===> [Resolution 2]: 
        a. Use TanStack Query `useQuery(activeHubsQueryOptions())` from `@/features/hubs/api` for cached hub retrieval.
        b. Remove `hubs` from form reset dependency array.
        c. Guard form reset with `if (open)` and depend ONLY on `[open, vehicle?.id]`.
        d. In driver-form-dialog.tsx, guard with `if (open)` and depend on `[open, driver?.id]`.
```

---

## 3. Caveats

1. **Submodule Boundary & External API Contracts**:
   - `frontend/src/features/fleet/api.ts` exports `fleetApi`, `Vehicle`, `Driver`, etc., which are consumed by `/dashboard/trips/page.tsx`. All existing exports, parameter shapes, and return types must remain 100% backward compatible.
2. **Hub Dropdown vs Text Input Compatibility**:
   - In `VehicleFormDialog`, both `#select-current-hub` (dropdown selecting `hubId`) and `#input-current-hub` (direct text input for `currentHub`) exist. The payload resolution logic must prioritize `currentHub.trim()` or fallback to the selected hub object name so E2E test inputs (such as `page.fill('#input-current-hub', 'Andromeda Hub (Hà Nội)')`) continue to work seamlessly.
3. **No Caveats on Bug Reproduction**:
   - Both Defect 1 and Defect 2 are 100% deterministic and reproducible via static code analysis and Playwright execution logs.

---

## 4. Conclusion & Recommended Code Changes for Worker

### Change 1: Fix Heading Collision in `frontend/src/features/fleet/info-content.ts`

**Target File**: `frontend/src/features/fleet/info-content.ts`
**Lines**: 3-4

#### Before:
```typescript
export const fleetInfoContent: InfobarContent = {
  title: 'Quản Lý Đội Xe — TanStack Table & nuqs Pattern',
  sections: [
```

#### After:
```typescript
export const fleetInfoContent: InfobarContent = {
  title: 'Đội Xe & Phương Tiện — Hướng Dẫn & Kiến Trúc',
  sections: [
```

---

### Change 2: Fix Form Reset Race Condition in `frontend/src/features/fleet/components/vehicle-form-dialog.tsx`

**Target File**: `frontend/src/features/fleet/components/vehicle-form-dialog.tsx`
**Changes**:
1. Import `useQuery` and `activeHubsQueryOptions` from `@/features/hubs/api`.
2. Replace local `useState<Hub[]>` and `hubsApi.getActiveHubs()` `useEffect` with `const { data: hubs = [] } = useQuery(activeHubsQueryOptions());`.
3. Refactor form reset `useEffect` to guard with `if (open)` and depend strictly on `[open, vehicle?.id]`.

#### Code Diff:

```tsx
// Before:
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
// ...
import { hubsApi, type Hub } from '@/features/hubs/api';
// ...
export function VehicleFormDialog({ vehicle, open, onOpenChange }: VehicleFormDialogProps) {
  const queryClient = useQueryClient();
  const [hubs, setHubs] = useState<Hub[]>([]);

  // Form State
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('CONTAINER_40FT');
  const [maxWeight, setMaxWeight] = useState(25000);
  const [maxVolume, setMaxVolume] = useState(65.5);
  const [hubId, setHubId] = useState<number | null>(null);
  const [currentHub, setCurrentHub] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [isExternal, setIsExternal] = useState(false);
  const [externalProvider, setExternalProvider] = useState('');

  // Fetch active hubs for dropdown
  useEffect(() => {
    let isMounted = true;
    hubsApi
      .getActiveHubs()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setHubs(data);
        }
      })
      .catch(() => {
        if (isMounted) setHubs([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync form with vehicle prop
  useEffect(() => {
    if (vehicle) {
      setLicensePlate(vehicle.licensePlate || '');
      setModel(vehicle.model || '');
      setType(vehicle.type || 'CONTAINER_40FT');
      setMaxWeight(vehicle.maxWeight ?? 25000);
      setMaxVolume(vehicle.maxVolume ?? 65.5);
      setHubId(vehicle.hubId || vehicle.hub?.id || null);
      setCurrentHub(vehicle.hub?.name || vehicle.currentHub || '');
      setStatus(vehicle.status || 'AVAILABLE');
      setIsExternal(!!vehicle.isExternal);
      setExternalProvider(vehicle.externalProvider || '');
    } else {
      setLicensePlate('');
      setModel('');
      setType('CONTAINER_40FT');
      setMaxWeight(25000);
      setMaxVolume(65.5);
      const defaultHub = hubs.length > 0 ? hubs[0] : null;
      setHubId(defaultHub ? defaultHub.id : null);
      setCurrentHub(defaultHub ? defaultHub.name : '');
      setStatus('AVAILABLE');
      setIsExternal(false);
      setExternalProvider('');
    }
  }, [vehicle, hubs, open]);
```

```tsx
// After:
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
// ...
import { activeHubsQueryOptions } from '@/features/hubs/api';
// ...
export function VehicleFormDialog({ vehicle, open, onOpenChange }: VehicleFormDialogProps) {
  const queryClient = useQueryClient();
  const { data: hubs = [] } = useQuery(activeHubsQueryOptions());

  // Form State
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('CONTAINER_40FT');
  const [maxWeight, setMaxWeight] = useState(25000);
  const [maxVolume, setMaxVolume] = useState(65.5);
  const [hubId, setHubId] = useState<number | null>(null);
  const [currentHub, setCurrentHub] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [isExternal, setIsExternal] = useState(false);
  const [externalProvider, setExternalProvider] = useState('');

  // Sync form with vehicle prop only on open or vehicle identity change
  useEffect(() => {
    if (open) {
      if (vehicle) {
        setLicensePlate(vehicle.licensePlate || '');
        setModel(vehicle.model || '');
        setType(vehicle.type || 'CONTAINER_40FT');
        setMaxWeight(vehicle.maxWeight ?? 25000);
        setMaxVolume(vehicle.maxVolume ?? 65.5);
        setHubId(vehicle.hubId || vehicle.hub?.id || null);
        setCurrentHub(vehicle.hub?.name || vehicle.currentHub || '');
        setStatus(vehicle.status || 'AVAILABLE');
        setIsExternal(!!vehicle.isExternal);
        setExternalProvider(vehicle.externalProvider || '');
      } else {
        setLicensePlate('');
        setModel('');
        setType('CONTAINER_40FT');
        setMaxWeight(25000);
        setMaxVolume(65.5);
        setHubId(null);
        setCurrentHub('');
        setStatus('AVAILABLE');
        setIsExternal(false);
        setExternalProvider('');
      }
    }
  }, [open, vehicle?.id]);
```

---

### Change 3: Protect Form Reset in `frontend/src/features/fleet/components/driver-form-dialog.tsx`

**Target File**: `frontend/src/features/fleet/components/driver-form-dialog.tsx`
**Lines**: 36-52

#### Before:
```typescript
  useEffect(() => {
    if (driver) {
      setFullName(driver.fullName || '');
      setPhone(driver.phone || '');
      setLicenseNumber(driver.licenseNumber || '');
      setLicenseClass(driver.licenseClass || 'FC');
      setExperienceYears(driver.experienceYears ?? 5);
      setStatus(driver.status || 'AVAILABLE');
    } else {
      setFullName('');
      setPhone('');
      setLicenseNumber('');
      setLicenseClass('FC');
      setExperienceYears(5);
      setStatus('AVAILABLE');
    }
  }, [driver, open]);
```

#### After:
```typescript
  useEffect(() => {
    if (open) {
      if (driver) {
        setFullName(driver.fullName || '');
        setPhone(driver.phone || '');
        setLicenseNumber(driver.licenseNumber || '');
        setLicenseClass(driver.licenseClass || 'FC');
        setExperienceYears(driver.experienceYears ?? 5);
        setStatus(driver.status || 'AVAILABLE');
      } else {
        setFullName('');
        setPhone('');
        setLicenseNumber('');
        setLicenseClass('FC');
        setExperienceYears(5);
        setStatus('AVAILABLE');
      }
    }
  }, [open, driver?.id]);
```

---

### Change 4: Ensure Default Sort (`id DESC`) in `frontend/src/features/fleet/api/service.ts`

To guarantee newly created vehicles/drivers immediately appear on page 1 of paginated listings:

**Target File**: `frontend/src/features/fleet/api/service.ts`
**In `getPaginatedVehicles` (around L62)**:
```typescript
    if (filters.sort) {
      try {
        const sorting = JSON.parse(filters.sort);
        if (Array.isArray(sorting) && sorting.length > 0) {
          const { id, desc } = sorting[0];
          filtered.sort((a: any, b: any) => {
            const valA = a[id] ?? '';
            const valB = b[id] ?? '';
            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
          });
        }
      } catch {
        // Ignore sort JSON parse error
      }
    } else {
      filtered.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }
```

**In `getPaginatedDrivers` (around L138)**:
```typescript
    if (filters.sort) {
      try {
        const sorting = JSON.parse(filters.sort);
        if (Array.isArray(sorting) && sorting.length > 0) {
          const { id, desc } = sorting[0];
          filtered.sort((a: any, b: any) => {
            const valA = a[id] ?? '';
            const valB = b[id] ?? '';
            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
          });
        }
      } catch {
        // Ignore sort JSON parse error
      }
    } else {
      filtered.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }
```

---

## 5. Verification Method

To verify these fixes:

```powershell
# 1. Typecheck validation
cd d:\Projects\logistics-website\frontend
npx tsc --noEmit

# 2. Execute E2E Playwright tests for Fleet and Hubs
npx playwright test e2e/04-fleet-crud-and-refresh.spec.ts e2e/10-hubs-management.spec.ts --project=chromium
```

### Invalidation Conditions:
- If `page.getByRole('heading', { name: /Quản Lý Đội Xe/i })` resolves to more than 1 element.
- If form fields are reset to empty strings while typing after modal open.
- If newly created vehicles do not appear in the table.
