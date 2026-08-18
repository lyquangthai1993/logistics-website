---
name: nestjs-best-practices
description: >-
  Best practices, architecture patterns, and runbooks for NestJS backend development in this workspace.
  Use when creating modules, controllers, services, entities, DTOs, migrations, authentication guards, or debugging NestJS logic.
---

# NestJS Best Practices & Architecture Guide

This skill provides guidelines and patterns for developing high-quality, maintainable, and scalable NestJS backend services.

## Core Principles

1. **Modular Architecture**: Divide the application by feature modules (e.g. `users`, `auth`, `orders`, `fleet`, `hubs`).
2. **Strict Validation & DTOs**: Always use `class-validator` and `class-transformer` on incoming DTOs.
3. **Configuration & Environment**: Store all configuration in `src/config/` or module-specific `config/` using NestJS `ConfigModule` and `registerAs`.
4. **TypeORM & PostgreSQL**:
   - Keep entities cleanly defined with proper relations (`@ManyToOne`, `@OneToMany`, `@ManyToMany`).
   - Use migrations for database schema changes instead of `synchronize: true` in production environments.
5. **Security & Authentication**:
   - Use Passport JWT strategy with Guard decorators (`@UseGuards(AuthGuard('jwt'))`).
   - Support Refresh Token rotation and Role-Based Access Control (RBAC) via `@Roles()` decorator.

## Structure Pattern

```text
src/
├── config/                  # Global application configuration
├── database/                # Database migrations, seeds, typeorm config
│   ├── migrations/
│   ├── seeds/
│   └── data-source.ts
├── <feature>/               # Feature module directory
│   ├── dto/                 # Request & Response DTOs with class-validator
│   ├── entities/            # TypeORM entities
│   ├── <feature>.controller.ts
│   ├── <feature>.service.ts
│   └── <feature>.module.ts
└── main.ts                  # Application entry point with ValidationPipe & Swagger
```

## Useful Commands

- **Run Dev Server**: `npm run start:dev` (in `backend/`)
- **Run Debug Server**: `npm run start:debug` (in `backend/`)
- **Run Migrations**: `npm run migration:run`
- **Generate Migration**: `npm run migration:generate -- src/database/migrations/<MigrationName>`


