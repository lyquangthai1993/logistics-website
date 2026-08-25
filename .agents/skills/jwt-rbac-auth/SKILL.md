---
name: jwt-rbac-auth
description: >-
  Custom JWT Authentication and Role-Based Access Control (RBAC) patterns for the
  Logistics TMS. Covers both NestJS backend (Guards, Decorators, Token Rotation)
  and Next.js frontend (Middleware, Interceptors, Auth Store). Use when implementing
  login, token refresh, role protection, or auth-related features. Triggers on mentions
  of "jwt", "auth", "login", "token", "refresh", "rbac", "role", "guard", "middleware",
  "permission", or security tasks.
---

# Custom JWT Authentication + RBAC

## Overview

- **Access Token**: 15 phút, gửi qua `Authorization: Bearer <token>`
- **Refresh Token**: Rotation, lưu trong HTTP-only Cookie
- **4 Roles**: `SUPER_ADMIN`, `DISPATCHER`, `FLEET_MANAGER`, `WAREHOUSE_MANAGER`

---

## Backend (NestJS)

### JWT Module Setup

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
```

### Auth Service (Login + Token Rotation)

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = { sub: user.id, role: user.role, warehouseId: user.warehouseId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    // Lưu refresh token (hashed) vào DB
    await this.prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(refreshToken, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        warehouseId: user.warehouseId,
      },
    };
  }

  async refreshTokens(oldRefreshToken: string) {
    // Tìm refresh token trong DB
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
        revoked: false,
      },
      include: { user: true },
    });

    let matchedToken = null;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(oldRefreshToken, stored.token)) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Revoke old token (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revoked: true },
    });

    // Issue new tokens
    const user = matchedToken.user;
    const payload = { sub: user.id, role: user.role, warehouseId: user.warehouseId };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = uuidv4();

    await this.prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(newRefreshToken, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}
```

### Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);

    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    return {
      success: true,
      data: {
        access_token: result.access_token,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return { success: true, data: { access_token: tokens.access_token } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { success: true, message: 'Logged out' };
  }
}
```

### JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      role: payload.role,
      warehouseId: payload.warehouseId,
    };
  }
}
```

### Guards & Decorators

```typescript
// src/modules/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

```typescript
// src/modules/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }

    return true;
  }
}
```

```typescript
// src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// src/modules/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Usage in Controllers

```typescript
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  @Post()
  @Roles('SUPER_ADMIN', 'DISPATCHER')
  create(@Body() dto: CreateOrderDto) { /* ... */ }

  @Get()
  @Roles('SUPER_ADMIN', 'DISPATCHER', 'FLEET_MANAGER', 'WAREHOUSE_MANAGER')
  findAll() { /* ... */ }

  @Patch(':id/assign-trip')
  @Roles('DISPATCHER')
  assignTrip(@Param('id') id: string, @Body() dto: AssignTripDto) { /* ... */ }
}
```

### Global Guard Registration

```typescript
// src/main.ts or app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

---

## Frontend (Next.js)

### API Client with Token Refresh Interceptor

```typescript
// src/lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/use-auth-store';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true, // Send cookies (refresh token)
});

// Attach access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = data.data.access_token;
        useAuthStore.getState().setAccessToken(newToken);

        failedQueue.forEach(({ resolve }) => resolve(newToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
```

### Next.js Proxy (Route Protection - Next.js 16)

```typescript
// proxy.ts (Next.js 16 replaces middleware.ts with proxy.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/forgot-password'];
const roleRouteMap: Record<string, string[]> = {
  '/dashboard/admin': ['SUPER_ADMIN'],
  '/dashboard/orders': ['SUPER_ADMIN', 'DISPATCHER'],
  '/dashboard/trips': ['SUPER_ADMIN', 'DISPATCHER', 'FLEET_MANAGER'],
  '/dashboard/fleet': ['SUPER_ADMIN', 'FLEET_MANAGER'],
  '/dashboard/warehouse': ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check auth token from cookie/header
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode JWT payload (without verification - verification happens on API)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check token expiration
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based route access
    for (const [route, roles] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(route) && !roles.includes(payload.role)) {
        return NextResponse.redirect(new URL('/dashboard/overview', request.url));
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### RBAC Hook

```typescript
// src/hooks/use-rbac.ts
import { useAuthStore } from '@/stores/use-auth-store';

type UserRole = 'SUPER_ADMIN' | 'DISPATCHER' | 'FLEET_MANAGER' | 'WAREHOUSE_MANAGER';

export function useRBAC() {
  const user = useAuthStore((s) => s.user);

  const hasRole = (...roles: UserRole[]) =>
    user ? roles.includes(user.role) : false;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDispatcher = hasRole('SUPER_ADMIN', 'DISPATCHER');
  const isFleetManager = hasRole('SUPER_ADMIN', 'FLEET_MANAGER');
  const isWarehouseManager = hasRole('SUPER_ADMIN', 'WAREHOUSE_MANAGER');

  return { user, hasRole, isSuperAdmin, isDispatcher, isFleetManager, isWarehouseManager };
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 loop | Refresh endpoint cũng bị guard chặn | Đánh dấu `@Public()` cho refresh endpoint |
| Cookie không gửi | Missing `withCredentials` | Set `withCredentials: true` trên axios |
| CORS block cookie | Backend chưa cho phép credentials | Set `credentials: true` trong CORS config |
| Token expired ngay | Server/Client timezone khác | Dùng UTC, check `exp` claim |
| Role guard không work | Guard order sai | `JwtAuthGuard` phải chạy TRƯỚC `RolesGuard` |
| Lộ error code kỹ thuật | Render raw `errors` object trên FE | Dùng `formatApiError()` từ `@/lib/api-error`, ưu tiên `errorData.message` và dịch `incorrectEmailOrPassword` |

## Auth Error Handling & Sanitization

- Backend trả về uniform error codes (vd: `incorrectEmailOrPassword`) hoặc localized `message`.
- Frontend **bắt buộc** dùng `formatApiError(err)` thay vì in trực tiếp `err.response.data.errors`.
- Tuyệt đối không hiển thị dạng `email: incorrectEmailOrPassword | password: ...` cho người dùng.
