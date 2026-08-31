# TMS Notification Matrix & Governance

> **Single Source of Truth** for notification mechanisms (In-app WebSockets & Email) in the Logistics TMS system.
> Part of the [`leader`](SKILL.md) skill.

---

## 📌 4 Core Invariant Rules

1. **SUPER_ADMIN Always Receives Alerts**: Regardless of event target role, `RoleEnum.SUPER_ADMIN` MUST always be included in the recipient list for audit and operational oversight.
2. **Dual-Channel (In-app + Email)**: Critical dispatch and operational milestones MUST be dispatched concurrently through both **In-app Notifications (DB + WebSocket)** and **Email (Nodemailer + Handlebars)**.
3. **Non-blocking Execution**: All notification triggers MUST be encapsulated within `try / catch` blocks or offloaded to a background queue (BullMQ). Notification delivery failures must NEVER abort primary business database transactions.
4. **Decoupled Architecture**: `NotificationsService` handles in-app persistence and socket emission; `MailService` handles template compilation and email transport. Do not tightly couple these services.

---

## 🔔 Event Matrix & Notification Routing

### 1. Order Lifecycle (Orders)

| Business Event | Trigger API / Method | Recipient Roles | Channels | Email Template | In-app Title & Type | Notes & Logic |
|---|---|---|---|---|---|---|
| **Create New Order** | `POST /orders` | *(None)* | — | — | — | Order is in `DRAFT` state, owned by the creating Dispatcher. |
| **Submit Order to Fleet** | `PATCH /orders/:id/submit` | **FLEET_MANAGER**, **SUPER_ADMIN** | In-app + Email | `order-pending-fleet.hbs` | `New Order Pending Fleet Assignment` (`ORDER_PENDING_FLEET`) | Status advances to `PENDING_FLEET`. Fleet Manager reviews capacity to assign trips. |
| **Fleet Reports No Vehicle** | `PATCH /orders/:id/no-vehicle` | **DISPATCHER**, **SUPER_ADMIN** | In-app + Email | `order-no-vehicle.hbs` | `No Internal Vehicle Available` (`ORDER_NO_VEHICLE`) | Status changes to `NO_VEHICLE`. Dispatcher arranges external 3PL vehicle or reschedules. |
| **Cancel Draft Order** | `DELETE /orders/:id` | *(None)* | — | — | — | Soft-deletes draft order; Fleet was never alerted. |
| **Cancel Submitted Order** | `PATCH /orders/:id/cancel` | **DISPATCHER**, **FLEET_MANAGER**, **SUPER_ADMIN** | In-app + Email | `generic-notification.hbs` | `Order Cancelled` (`ORDER_CANCELLED`) | Cancels all pending associated trips. |

---

### 2. Trip Lifecycle & Assignment (Trips)

| Business Event | Trigger API / Method | Recipient Roles | Channels | Email Template | In-app Title & Type | Notes & Logic |
|---|---|---|---|---|---|---|
| **Create Trip (Draft/Assigned)** | `POST /trips` | *(None)* | — | — | — | Fleet is assembling vehicle/driver pairings. |
| **Confirm Trip** | `PATCH /trips/:id/confirm` | **WAREHOUSE_MANAGER** *(targeted)*, **DISPATCHER**, **FLEET_MANAGER**, **SUPER_ADMIN** | In-app + Email | `trip-confirmed.hbs` | `Trip Confirmed` (`TRIP_CONFIRMED`) | **WM Targeting**: Only WMs whose `hubId` matches `order.originHubId` OR `order.destinationHubId`. If hub has no WM → DROP + alert SUPER_ADMIN (alertType: `HUB_UNASSIGNED_WM`). Legacy orders (FK null) → broadcast all WMs. |
| **Departure / In Transit** | `PATCH /trips/:id/in-transit` | **DISPATCHER**, **WAREHOUSE_MANAGER** *(targeted)*, **SUPER_ADMIN** | In-app | *(Optional Email)* | `Trip In Transit` (`TRIP_IN_TRANSIT`) | Same WM targeting rule as TRIP_CONFIRMED. |
| **Trip Delivery Completed** | `PATCH /trips/:id/complete` | **DISPATCHER**, **WAREHOUSE_MANAGER** *(targeted)*, **SUPER_ADMIN** | In-app + Email | `generic-notification.hbs` | `Trip Delivered Successfully` (`TRIP_DELIVERED`) | Same WM targeting rule. When all trips complete → order transitions to `DELIVERED`. |
| **Cancel Trip** | `DELETE /trips/:id` or `PATCH /trips/:id/cancel` | **DISPATCHER**, **FLEET_MANAGER**, **SUPER_ADMIN** | In-app + Email | `generic-notification.hbs` | `Trip Cancelled` (`TRIP_CANCELLED`) | Fleet needs to reassign vehicle/driver for order. |

---

## 🚛 External 3PL Partner Vehicle Protocol

When an order requires an external vehicle (`isExternalVehicleNeeded = true`):

1. **Email Subject**: MUST include the prefix `🚨 [EXTERNAL VEHICLE] [OrderCode] - ...` for immediate visual priority.
2. **Email Body**:
   - Explicitly display partner carrier name, contact phone, and `externalNote` (reason for outsourced vehicle).
   - Direct CTA button linking to order dispatch details.
3. **In-app Notification**:
   - Highlight with amber/warning badge.
   - Summary content: `"Order [Code] requires external vehicle: [reason]"`.
4. **Recipients**: Dispatched to all on-duty **FLEET_MANAGER** users and **SUPER_ADMIN**.

---

## 📧 Handlebars Mail Template Registry

Template directory: [`backend/src/mail/mail-templates/`](../../../backend/src/mail/mail-templates)

| Template File | Purpose | Required Context Data |
|---|---|---|
| `order-pending-fleet.hbs` | Alerts Fleet of new order awaiting assignment | `orderCode`, `senderName`, `origin`, `destination`, `weight`, `volume`, `isExternal`, `viewUrl` |
| `order-no-vehicle.hbs` | Alerts Dispatcher of fleet capacity shortage | `orderCode`, `reason`, `fleetManagerName`, `createdAt`, `actionUrl` |
| `trip-confirmed.hbs` | Alerts Warehouse & Dispatcher of locked trip schedule | `tripCode`, `orderCode`, `licensePlate`, `driverName`, `driverPhone`, `departureTime`, `estimatedArrivalTime`, `viewUrl` |
| `dispatcher-notification.hbs` | Dedicated template for Dispatcher alerts | `title`, `message`, `orderCode`, `actionUrl` |
| `fleet-notification.hbs` | Dedicated template for Fleet Manager alerts | `title`, `message`, `orderCode`, `actionUrl` |
| `warehouse-notification.hbs` | Dedicated template for Warehouse Inbound alerts | `title`, `warehouseName`, `tripCode`, `estimatedArrivalTime`, `inboundUrl` |
| `generic-notification.hbs` | General fallback alert template | `title`, `message`, `details`, `actionUrl` |

---

## 💻 Standard Implementation Pattern (NestJS)

```typescript
// 1. Fetch recipient users by Role (non-WM roles: broadcast as usual)
const otherUsers = await this.userRepository.find({
  where: [
    { role: { id: RoleEnum.FLEET_MANAGER } },
    { role: { id: RoleEnum.SUPER_ADMIN } },
  ],
});

// 2. Resolve WAREHOUSE_MANAGER recipients (targeted by hub FK — Phase 1+)
//
//   Rule A: order.originHubId is set     → include WMs where user.hubId = originHubId
//   Rule B: order.destinationHubId is set → include WMs where user.hubId = destinationHubId
//   Rule C: Hub FK set but no WM assigned → DROP WM notification, alert SUPER_ADMIN:
//              notification type: GENERIC, alertType: 'HUB_UNASSIGNED_WM'
//   Rule D: Both FKs are null (legacy order) → fallback: broadcast ALL WMs (backward compat)
//              + console.warn log for visibility
//
const warehouseUsers = await this.resolveWarehouseManagerRecipients(
  order,    // OrderEntity (must have originHubId, destinationHubId loaded)
  tripId,
  orderCode,
);

// 3. Dispatch In-app Notifications (Non-blocking)
try {
  for (const user of [...warehouseUsers, ...otherUsers]) {
    await this.notificationsService.create({
      userId: user.id,
      title: 'Trip Confirmed',
      body: `Order ${orderCode} — trip confirmed`,
      type: user.role?.id === RoleEnum.WAREHOUSE_MANAGER ? 'WAREHOUSE' : 'GENERIC',
      metadata: { tripId, orderId, orderCode, isExternal },
    });
  }
} catch (err) {
  this.logger.error(`Failed to dispatch in-app notification: ${err.message}`, err.stack);
}

// 4. Dispatch Email Notifications (Non-blocking)
try {
  for (const user of [...warehouseUsers, ...otherUsers]) {
    if (user.email) {
      await this.mailService.sendTripConfirmedNotification({ to: user.email, data: { ... } });
    }
  }
} catch (err) {
  this.logger.error(`Failed to send email notification: ${err.message}`, err.stack);
}
```

### SUPER_ADMIN alert when hub has no WM (HUB_UNASSIGNED_WM)

When `resolveWarehouseManagerRecipients` finds a hub with no assigned WM, it creates
an in-app notification for **all SUPER_ADMINs** with:

```typescript
{
  title: '⚠️ Hub chưa có Quản lý kho — <hubName>',
  body: '<hubLabel> "<hubName>" chưa được gán tài khoản Quản lý kho. Thông báo chuyến xe bị bỏ qua.',
  type: 'GENERIC',
  metadata: { hubId, hubName, tripId, orderCode, alertType: 'HUB_UNASSIGNED_WM' }
}
```

