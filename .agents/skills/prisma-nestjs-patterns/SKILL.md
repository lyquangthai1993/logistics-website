---
name: prisma-nestjs-patterns
description: >-
  Prisma ORM v6 patterns with NestJS for the Logistics TMS. Use when working with
  database schema design, migrations, queries, transactions, or Prisma Client setup
  in NestJS modules. Triggers on mentions of "prisma", "schema", "migration",
  "database", "query", "transaction", "seed", or ORM-related tasks.
---

# Prisma ORM v6 + NestJS Patterns

## PrismaService Setup

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## Schema Design Patterns

### Enums for Status Fields

```prisma
enum OrderStatus {
  PENDING
  DISPATCHED
  IN_WAREHOUSE
  SHIPPING
  DELIVERED
  CANCELLED
}

enum TripStatus {
  DRAFT
  ASSIGNED
  LOADING
  DEPARTED
  COMPLETED
}

enum UserRole {
  SUPER_ADMIN
  DISPATCHER
  FLEET_MANAGER
  WAREHOUSE_MANAGER
}
```

### Relations & Indexes

```prisma
model Order {
  id              String      @id @default(cuid())
  orderCode       String      @unique  // VD: NDA2607-0001
  status          OrderStatus @default(PENDING)
  totalWeight     Float       // Kg
  totalCbm        Float       // m³
  tripId          String?
  trip            Trip?       @relation(fields: [tripId], references: [id])
  warehouseId     String?
  warehouse       Warehouse?  @relation(fields: [warehouseId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([status])
  @@index([tripId])
  @@index([warehouseId])
  @@index([createdAt])
}
```

## Migration Workflow

```bash
# Tạo migration mới sau khi sửa schema.prisma
npx prisma migrate dev --name <descriptive_name>

# Apply migration trên production
npx prisma migrate deploy

# Reset database (DEV only)
npx prisma migrate reset

# Generate Prisma Client sau khi thay đổi schema
npx prisma generate

# Mở Prisma Studio để xem data
npx prisma studio
```

## Transaction Patterns

### Sequential Transaction (Gom đơn vào chuyến)

```typescript
async assignOrdersToTrip(tripId: string, orderIds: string[]) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Lấy thông tin trip + vehicle
    const trip = await tx.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: { vehicle: true, orders: true },
    });

    // 2. Lấy orders cần gom
    const orders = await tx.order.findMany({
      where: { id: { in: orderIds } },
    });

    // 3. Validate load capacity
    const currentWeight = trip.orders.reduce((sum, o) => sum + o.totalWeight, 0);
    const newWeight = orders.reduce((sum, o) => sum + o.totalWeight, 0);
    if (currentWeight + newWeight > trip.vehicle.maxWeight) {
      throw new BadRequestException('Vượt quá tải trọng cho phép');
    }

    // 4. Update orders
    await tx.order.updateMany({
      where: { id: { in: orderIds } },
      data: { tripId, status: 'DISPATCHED' },
    });

    return tx.trip.findUnique({
      where: { id: tripId },
      include: { orders: true },
    });
  });
}
```

## Query Optimization

### Select Only Needed Fields

```typescript
// ❌ Bad: loads entire object
const orders = await this.prisma.order.findMany();

// ✅ Good: select only needed fields
const orders = await this.prisma.order.findMany({
  select: {
    id: true,
    orderCode: true,
    status: true,
    totalWeight: true,
    totalCbm: true,
  },
});
```

### Cursor-Based Pagination

```typescript
async findMany(cursor?: string, take = 20) {
  return this.prisma.order.findMany({
    take,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: 'desc' },
  });
}
```

### Avoid N+1 with Include

```typescript
// ❌ N+1 problem
const trips = await this.prisma.trip.findMany();
for (const trip of trips) {
  trip.orders = await this.prisma.order.findMany({ where: { tripId: trip.id } });
}

// ✅ Use include
const trips = await this.prisma.trip.findMany({
  include: {
    orders: true,
    vehicle: true,
    driver: true,
  },
});
```

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  await prisma.user.upsert({
    where: { email: 'admin@spiderexpress.vn' },
    update: {},
    create: {
      email: 'admin@spiderexpress.vn',
      name: 'Super Admin',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.SUPER_ADMIN,
    },
  });

  // Seed warehouses
  const warehouses = [
    { name: 'Andromeda', address: 'Linh Trung, Thủ Đức, HCM' },
    { name: 'Hubble', address: 'Linh Trung, Thủ Đức, HCM' },
    { name: 'Magellan', address: 'KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng' },
    { name: 'Vela', address: 'Phùng Chí Kiên, Mỹ Hào, Hưng Yên' },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { name: wh.name },
      update: {},
      create: wh,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `PrismaClientInitializationError` | Missing `prisma generate` | Run `npx prisma generate` after schema change |
| Stale types after schema change | Client not regenerated | Run `npx prisma generate` |
| Transaction timeout | Long-running operations | Set `timeout` option: `$transaction(fn, { timeout: 10000 })` |
| Relation not loading | Missing `include` | Add `include: { relation: true }` |
| Unique constraint error | Duplicate data | Use `upsert` or check existence first |
