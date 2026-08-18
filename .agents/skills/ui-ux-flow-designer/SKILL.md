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
5. **Interactive Element Cursor & Hover Guidelines**:
   - **Universal Pointer Rule**: EVERY element that is interactive or clickable (`<button>`, `[role="button"]`, `DropdownMenuTrigger`, `SelectTrigger`, `AccordionTrigger`, clickable table rows/cards, badges, tabs, pagination links, switches, checkboxes, dialog triggers/closes) MUST display `cursor: pointer` (`cursor-pointer`) on hover.
   - **Disabled State Rule**: Disabled elements (`disabled`, `aria-disabled="true"`, `data-disabled`) MUST show `cursor: not-allowed` and visual mute feedback.
   - **Hover & Focus Feedback**: All clickable elements MUST have clean, modern visual feedback on hover (`hover:bg-accent/80`, `hover:text-primary`, `transition-all duration-150`) and accessible focus rings (`focus-visible:ring-2 focus-visible:ring-primary/50`).
   - **Click Target Area**: Ensure minimum interactive target size (at least 32px / `h-8` for action buttons & icons) for seamless user interaction.

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

---

## ⚡ Async Button — Loading State & Double-Click Prevention

### Vấn đề
Button gọi API async không có loading/disabled state → user click nhiều lần → duplicate request → data corruption hoặc lỗi nghiệp vụ.

### Pattern: Per-Row Loading (dùng `Set<id>`)

Dùng `Set<number>` khi có **nhiều row**, mỗi row có button riêng. Chỉ disable button của row đang xử lý.

```tsx
// State
const [submittingIds, setSubmittingIds] = useState<Set<number>>(new Set());

// Handler
const handleAction = async (id: number) => {
  if (submittingIds.has(id)) return; // Guard double-click
  setSubmittingIds((prev) => new Set(prev).add(id));
  try {
    await api.doSomething(id);
    toast.success('Thành công!');
    reload();
  } catch (err: any) {
    const apiMessage = err.response?.data?.message;
    toast.error(apiMessage || 'Thao tác thất bại. Vui lòng thử lại.');
  } finally {
    setSubmittingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }
};

// Button JSX
<Button
  onClick={() => handleAction(item.id)}
  disabled={submittingIds.has(item.id)}
  className='... disabled:cursor-not-allowed disabled:opacity-60'
>
  {submittingIds.has(item.id) ? (
    <><IconLoader2 className='h-3.5 w-3.5 mr-1 animate-spin' />Đang gửi...</>
  ) : (
    <><IconSend className='h-3.5 w-3.5 mr-1' />Gửi Fleet</>
  )}
</Button>
```

### Pattern: Single Action (dùng `boolean`)

```tsx
const [submitting, setSubmitting] = useState(false);
// Handler: if (submitting) return; → setSubmitting(true) → try/finally setSubmitting(false)
// Button: disabled={submitting} + spinner + text "Đang xử lý..."
```

### Checklist trước khi ship
- [ ] Button có `disabled` state khi request đang chạy
- [ ] `IconLoader2 animate-spin` hiển thị trong lúc loading
- [ ] Text thay đổi: "Đang gửi..." / "Đang xử lý..." / "Đang xóa..."
- [ ] `disabled:cursor-not-allowed disabled:opacity-60` trong className
- [ ] `finally` block luôn cleanup state

---

## 🔔 Toast Notification — Language & Message Standards

### Nguyên tắc

1. **Ngôn ngữ**: Mọi toast trong business domain (`orders/`, `trips/`, `warehouses/`, `admin/`, `profile/`) **PHẢI 100% tiếng Việt**.

2. **API message first** với error toast từ API call:
```tsx
// ✅ Đúng
const apiMessage = err.response?.data?.message;
toast.error(apiMessage || 'Thao tác thất bại. Vui lòng thử lại.');

// ❌ Sai — hard-code, dùng API msg làm description phụ
toast.error('Không thể thực hiện', { description: err.response?.data?.message });
```

3. **Validation toast** (client-side): tiếng Việt, không cần API message.
4. **Success toast**: custom tiếng Việt OK.

### Template chuẩn

| Tình huống | Pattern |
|-----------|---------|
| API error | `const msg = err.response?.data?.message; toast.error(msg \|\| 'Fallback tiếng Việt.');` |
| Validation | `toast.error('Vui lòng nhập đầy đủ thông tin.');` |
| Success | `toast.success('Thao tác thành công!');` |
