---
name: ui-ux-flow-designer
description: >-
  Specialized skill for analyzing user journeys, business workflow wireframing, page architecture, and UI/UX frontend design for the Logistics TMS application.
  Use when designing frontend pages, layout wireframes, user flow diagrams, component hierarchies, or UI interactions for Next.js App Router & Tailwind CSS.
---

# UI/UX Flow & Frontend Design Skill

This skill provides a structured methodology for analyzing user roles, designing interactive business flows, and architecting modern frontend UI components for the Logistics TMS system.

## 🎯 Target Roles & Interaction Flows (Spider Express)

1. **DISPATCHER (Điều hành - VD: Đức Anh)**:
   - **Main Flow**: Tiếp nhận đơn hàng (`NDA2608-xxxx`) -> Phân loại tuyến miền (Bắc/Trung/Nam) -> Gom đơn theo Xe/Chuyến (`Trip`) -> Gán Kho trung chuyển nhập (`Inbound Hub`).
   - **Key Views**: Order Intake Table, Route Grouping Workspace, Trip Assembly Modal.

2. **FLEET_MANAGER (Quản lý xe)**:
   - **Main Flow**: Quản lý danh sách xe (`75H05121`, `43H21248`...) -> Phê duyệt chuyến xe -> So sánh Tải trọng ($Kg$) & Thể tích ($m^3$) thực tế vs Sức chứa tối đa -> Tính cước & chi phí chuyến.
   - **Key Views**: Fleet Dashboard, Trip Payload Gauge Bar, Vehicle Capacity Monitor.

3. **WAREHOUSE_MANAGER (Quản lý kho)**:
   - **Main Flow**: Tiếp nhận lệnh nhập kho trước deadline -> Quét/Xác nhận Inbound tại kho (`Andromeda`, `Hubble`, `Magellan`, `Vela`) -> Kiểm tra kiện/tải -> Đóng gói Outbound lên xe đường dài.
   - **Key Views**: Inbound Receiving Board, Barcode/Order Checker, Outbound Dispatch Station.

4. **SUPER_ADMIN**:
   - **Main Flow**: Quản lý Users, Hubs/Kho, Đội xe, Cấu hình giá chuyến & Phụ phí.
   - **Key Views**: System Admin Panel, User Role Matrix, Pricing Configuration Matrix.

---

## 🎨 UI/UX Design Principles & Guidelines

1. **Function-Driven Dashboard & Workspace**:
   - High information density with clean, modern data tables (Sort, Filter, Pagination).
   - Real-time status indicators (Badges with semantic colors: `PENDING`, `IN_TRANSIT`, `RECEIVED`, `COMPLETED`, `CANCELLED`).
2. **Visual Capacity Indicators**:
   - Interactive progress bars showing payload utilization (e.g. `85% Weight (Kg)`, `60% Volume (m³)`).
3. **Frictionless Action Flows**:
   - Quick filters for dates, hubs, and routes.
   - Modals and slide-over drawers for rapid order inspection without losing page context.
4. **Responsive & Fluid Layout**:
   - Optimized for desktop operational displays (1920x1080 / 1440x900) while supporting tablet field inspections.

---

## 🏗️ Next.js App Router Page Architecture

```text
frontend/app/
├── (auth)/
│   └── login/                       # Đăng nhập hệ thống
├── (dashboard)/
│   ├── layout.tsx                   # Sidebar navigation, Header, User Profile
│   ├── page.tsx                     # Overview Dashboard
│   ├── orders/                      # Quản lý đơn hàng (DISPATCHER & ALL)
│   │   ├── page.tsx                 # Danh sách đơn hàng & Lập lệnh
│   │   └── [id]/page.tsx            # Chi tiết đơn hàng & Lịch sử trạng thái
│   ├── trips/                       # Quản lý Chuyến xe (FLEET_MANAGER)
│   │   ├── page.tsx                 # Danh sách Chuyến xe & Tải trọng
│   │   └── [id]/page.tsx            # Phê duyệt Chuyến & Gom đơn
│   ├── warehouses/                  # Nhập/Xuất Kho (WAREHOUSE_MANAGER)
│   │   ├── inbound/page.tsx         # Xử lý Inbound Kho trung chuyển
│   │   └── outbound/page.tsx        # Xuất kho đường dài
│   └── admin/                       # Cấu hình hệ thống (SUPER_ADMIN)
│       ├── users/page.tsx
│       └── fleet/page.tsx
```
