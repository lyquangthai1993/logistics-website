---
name: bullmq-redis-patterns
description: >-
  BullMQ and Redis patterns with NestJS for the Logistics TMS. Use when
  implementing job queues, background processing, event-driven notifications,
  or async workflows. Triggers on mentions of "bullmq", "queue", "redis", "job",
  "worker", "event-emitter", "notification", "background", or async processing tasks.
---

# BullMQ + Redis + NestJS Patterns

## Setup

### Installation

```bash
npm install @nestjs/bullmq bullmq ioredis @nestjs/event-emitter
```

### Module Configuration

```typescript
// src/app.module.ts
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // Redis connection for BullMQ
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // In-app event bus
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),

    // Register queues
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'order-processing' },
    ),
  ],
})
export class AppModule {}
```

## Producer Pattern (Thêm Job vào Queue)

```typescript
// src/modules/orders/orders.service.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('order-processing') private orderQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({ data: dto });

    // 1. Emit in-app event (sync, instant)
    this.eventEmitter.emit('order.created', { order });

    // 2. Queue async notification job
    await this.notificationQueue.add(
      'order-created-notify',
      {
        orderId: order.id,
        orderCode: order.orderCode,
        warehouseId: order.warehouseId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100, // Giữ 100 job gần nhất
        removeOnFail: 50,
      },
    );

    return order;
  }
}
```

## Consumer/Worker Pattern (Xử lý Job)

```typescript
// src/modules/notifications/notification.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job) {
    switch (job.name) {
      case 'order-created-notify':
        return this.handleOrderCreated(job);
      case 'order-status-changed':
        return this.handleStatusChanged(job);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleOrderCreated(job: Job) {
    const { orderId, orderCode, warehouseId } = job.data;
    this.logger.log(`Notifying for new order: ${orderCode}`);

    // Notify Fleet Manager
    await this.sendNotification({
      targetRole: 'FLEET_MANAGER',
      title: 'Đơn hàng mới',
      message: `Đơn ${orderCode} cần được gán chuyến xe`,
      type: 'ORDER_CREATED',
      referenceId: orderId,
    });

    // Notify Warehouse Manager
    await this.sendNotification({
      targetRole: 'WAREHOUSE_MANAGER',
      targetWarehouseId: warehouseId,
      title: 'Đơn hàng mới về kho',
      message: `Đơn ${orderCode} sẽ nhập kho`,
      type: 'ORDER_CREATED',
      referenceId: orderId,
    });
  }

  private async sendNotification(payload: NotificationPayload) {
    // WebSocket/SSE push hoặc lưu DB
    // Implementation tùy theo notification strategy
  }
}
```

## Event-Driven Pattern (@nestjs/event-emitter)

### Define Events

```typescript
// src/common/events/order.events.ts
export class OrderCreatedEvent {
  constructor(
    public readonly order: Order,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
  ) {}
}

export class OrderCancelledEvent {
  constructor(
    public readonly order: Order,
    public readonly reason: string,
  ) {}
}
```

### Event Listeners

```typescript
// src/modules/fleet/listeners/order-event.listener.ts
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  @OnEvent('order.created')
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`New order ${event.order.orderCode} → Fleet notified`);
    // Update fleet dashboard, recalculate available capacity, etc.
  }

  @OnEvent('order.status.changed')
  handleStatusChanged(event: OrderStatusChangedEvent) {
    this.logger.log(`Order ${event.orderId}: ${event.oldStatus} → ${event.newStatus}`);
  }

  @OnEvent('order.cancelled')
  handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(`Order ${event.order.orderCode} cancelled: ${event.reason}`);
    // Free up vehicle capacity, update trip
  }
}
```

## Job Scheduling (Cron / Delayed Jobs)

```typescript
// Delayed job - gửi reminder sau 30 phút
await this.orderQueue.add(
  'order-reminder',
  { orderId: order.id },
  { delay: 30 * 60 * 1000 }, // 30 minutes
);

// Repeatable job - check deadline kho 17h mỗi ngày
await this.orderQueue.add(
  'warehouse-deadline-check',
  {},
  {
    repeat: {
      pattern: '0 17 * * *', // 17:00 mỗi ngày
      tz: 'Asia/Ho_Chi_Minh',
    },
  },
);
```

## Realtime Notification Flow

```
Order Created → EventEmitter (sync)
     ↓                ↓
  Fleet Listener   BullMQ Queue (async)
  (in-memory)          ↓
                   Worker processes
                       ↓
                  WebSocket/SSE Push
                  (to connected clients)
```

### Khi nào dùng EventEmitter vs BullMQ?

| Scenario | Dùng | Lý do |
|----------|------|-------|
| Update in-memory state | EventEmitter | Sync, instant, same process |
| Send email/SMS | BullMQ | Async, retry, không block request |
| Push notification | BullMQ | Retry + rate limiting |
| Update dashboard stats | EventEmitter | Real-time, in-process |
| Generate PDF/Excel | BullMQ | CPU-intensive, async |
| Audit logging | BullMQ | Đảm bảo không mất log |

## Redis Connection Config

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Health Check

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('health')
export class HealthController {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  @Get()
  async check() {
    const waiting = await this.notificationQueue.getWaitingCount();
    const active = await this.notificationQueue.getActiveCount();
    const failed = await this.notificationQueue.getFailedCount();

    return {
      redis: 'connected',
      queues: {
        notifications: { waiting, active, failed },
      },
    };
  }
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Job không được process | Thiếu Processor class | Đảm bảo `@Processor('queue-name')` match |
| Redis connection refused | Redis chưa start | `docker run -d -p 6379:6379 redis:7` |
| Job retry vô hạn | Không set `attempts` | Thêm `attempts: 3` trong job options |
| Memory leak | Không clean completed jobs | Set `removeOnComplete` và `removeOnFail` |
| Event listener không fire | Listener chưa được inject | Thêm vào `providers` của module |
