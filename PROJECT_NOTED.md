# LOGISTICS TMS (TRANSPORTATION MANAGEMENT SYSTEM) - CORE CHEAT SHEET

## 1. TECH STACK (LATEST VERSION)
- Frontend: Next.js 15+ (App Router, React 19, Server Components, Server Actions, TanStack Query v5, Zustand, Shadcn UI / Radix UI, Tailwind CSS v4).
- Backend: NestJS 11+ (Node.js 22 LTS, TypeScript 5.6+, Prisma ORM v6, PostgreSQL 16+, Redis 7+, BullMQ / EventEmitter2).
- Auth & Security: Custom JWT (Access Token 15m + Refresh Token Rotation in HTTP-only Cookie), Role-based Access Control (RBAC).

## 2. BUSINESS DOMAIN & ACTORS (SPIDER EXPRESS)
- Trụ sở & Hệ thống Hub/Kho trung chuyển:
  * Trụ sở chính: TP. Huế
  * Kho Andromeda (Linh Trung, Thủ Đức, HCM)
  * Kho Hubble (Linh Trung, Thủ Đức, HCM)
  * Kho Magellan (KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng)
  * Kho Vela (Phùng Chí Kiên, Mỹ Hào, Hưng Yên)
- 4 Nhóm vai trò chính:
  1. SUPER_ADMIN: Toàn quyền hệ thống, quản lý Users, Hubs/Warehouses, Đội xe (Fleet), Cấu hình giá chuyến/phụ phí.
  2. DISPATCHER (Điều hành - VD: ĐỨC ANH): Tiếp nhận đơn hàng, lập mã đơn (VD: NDA2607-xxxx), gom các đơn lẻ theo tuyến/miền, gán Chuyến đi (Trip) cho xe và tài xế.
  3. FLEET_MANAGER (Quản lý xe): Quản lý danh sách xe (VD: 75H04173, 75H01137, 50E-17117), phê duyệt chuyến xe, kiểm tra tải trọng (Kg) & thể tích (m³), tính giá cước và chi phí chuyến.
  4. WAREHOUSE_MANAGER (Quản lý kho): Tiếp nhận lệnh từ Điều hành; xác nhận Inbound khi xe gom hàng về kho trung chuyển (Andromeda, Hubble, Magellan, Vela) trước deadline (17H); kiểm tra kiện/tải; xuất Outbound lên xe đường dài.

## 3. DATA SCHEMA & WORKFLOW
- Core Entities:
  * Order: Mã đơn (NDA2607-xxxx), Pickup (Kho NCC/Cảng - VD: TBS Tân Vạn, DNTN Bình Đức), Inbound Hub (Kho nhập), Dropoff (Đại lý, Gara, Kho chi nhánh), Mặt hàng (Tên hàng, Số lượng, Khối lượng Kg, Thể tích m³), Ghi chú phân loại tuyến (VD: "12 ĐƠN MIỀN BẮC").
  * Trip (Chuyến xe): Số xe, Tài xế, Danh sách Orders gom cùng tuyến, Tổng Kg, Tổng m³, Chi phí chuyến, Trạng thái chuyến.
- Business Logic Constraints:
  * Load Optimization: SUM(Order.Weight) <= Vehicle.MaxPayload && SUM(Order.CBM) <= Vehicle.MaxVolume.
  * Realtime Notification: Đơn tạo mới/hủy/cập nhật -> Bắn sự kiện tức thời cho Quản lý xe và Quản lý kho.