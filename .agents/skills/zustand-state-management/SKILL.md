---
name: zustand-state-management
description: >-
  Zustand state management patterns for the Logistics TMS frontend. Use when
  creating stores, managing auth state, UI state, or client-side state that
  doesn't belong in TanStack Query. Triggers on mentions of "zustand", "store",
  "useAuthStore", "state management", "persist", or client state tasks.
---

# Zustand State Management

## Store Creation

### Basic Store Pattern

```typescript
// src/stores/use-ui-store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

### Auth Store (JWT + RBAC)

```typescript
// src/stores/use-auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserRole = 'SUPER_ADMIN' | 'DISPATCHER' | 'FLEET_MANAGER' | 'WAREHOUSE_MANAGER';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      hasRole: (...roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

## Selector Patterns (Tránh Re-render)

```typescript
// ❌ Bad: re-render mỗi khi BẤT KỲ state nào thay đổi
const { user, sidebarOpen } = useAuthStore();

// ✅ Good: chỉ re-render khi user thay đổi
const user = useAuthStore((state) => state.user);
const role = useAuthStore((state) => state.user?.role);

// ✅ Good: multiple selectors với shallow compare
import { useShallow } from 'zustand/react/shallow';

const { user, isAuthenticated } = useAuthStore(
  useShallow((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  })),
);
```

## Slices Pattern (App Lớn)

```typescript
// src/stores/slices/auth-slice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  logout: () => set({ user: null, accessToken: null }),
});
```

```typescript
// src/stores/slices/ui-slice.ts
import { StateCreator } from 'zustand';

export interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
});
```

```typescript
// src/stores/use-app-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/auth-slice';
import { UISlice, createUISlice } from './slices/ui-slice';

type AppStore = AuthSlice & UISlice;

export const useAppStore = create<AppStore>()(
  devtools((...a) => ({
    ...createAuthSlice(...a),
    ...createUISlice(...a),
  })),
);
```

## Middleware

### Persist (Lưu state vào localStorage)

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'store-key',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ /* chỉ persist fields cần thiết */ }),
    },
  ),
);
```

### Devtools (Debug)

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({ /* state */ }),
    { name: 'StoreName' }, // Hiển thị trong Redux DevTools
  ),
);
```

### Immer (Immutable Updates)

```typescript
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    orders: [] as Order[],
    updateOrderStatus: (id: string, status: OrderStatus) =>
      set((state) => {
        const order = state.orders.find((o) => o.id === id);
        if (order) order.status = status; // Mutate trực tiếp nhờ immer
      }),
  })),
);
```

## SSR Hydration (Next.js App Router)

Zustand stores dùng `persist` middleware sẽ gặp hydration mismatch. Fix:

```typescript
// src/hooks/use-store-hydration.ts
import { useEffect, useState } from 'react';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
```

```tsx
// Component sử dụng
'use client';

import { useStoreHydration } from '@/hooks/use-store-hydration';
import { useAuthStore } from '@/stores/use-auth-store';

export function UserNav() {
  const hydrated = useStoreHydration();
  const user = useAuthStore((s) => s.user);

  if (!hydrated) return <Skeleton />;
  if (!user) return <LoginButton />;
  return <UserMenu user={user} />;
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Component re-render quá nhiều | Không dùng selector | Dùng `(state) => state.field` |
| Hydration mismatch (SSR) | `persist` load từ localStorage | Dùng `useStoreHydration` hook |
| State reset khi navigate | Store tạo trong component | Tạo store ngoài component (module level) |
| Stale state trong callback | Closure capture giá trị cũ | Dùng `get()` trong action |
