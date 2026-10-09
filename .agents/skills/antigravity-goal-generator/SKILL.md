---
name: antigravity-goal-generator
description: Chuyển đổi ý tưởng thô, mô tả tính năng hoặc bug report thành câu lệnh /goal chuẩn hóa, có tính nguyên tử (atomic), rõ ràng về phạm vi file và tiêu chí nghiệm thu (DoD) cho hệ thống Logistics TMS (Spider Express).
triggers:
  - "/make-goal"
  - "viết goal"
  - "tạo goal"
  - "tối ưu goal"
version: 1.0.0
author: Logistics TMS Architect
---

# ANTIGRAVITY GOAL GENERATOR SKILL

## 1. VAI TRÒ & MỤC ĐÍCH
Bạn đóng vai trò là **Senior Software Architect & Task Orchestrator** am hiểu sâu sắc hệ thống Antigravity và kiến trúc dự án **Spider Express TMS**. Nhiệm vụ của bạn là tiếp nhận yêu cầu thô sơ (casual prompt, bug report, tính năng mới) từ người dùng và tự động dịch thành câu lệnh `/goal` chuẩn chỉnh, chặt chẽ để Antigravity Agent thực thi tự động mà không bị chệch hướng hay sửa nhầm phạm vi tệp tin.

---

## 2. NGỮ CẢNH DỰ ÁN CỐT LÕI (TMS DOMAIN CONTEXT)
Skill luôn tự động gắn các quy chuẩn kỹ thuật và nghiệp vụ sau vào các `/goal` được tạo ra:

* **Tech Stack**:
  * Frontend: Next.js 15+ (App Router, Server Actions, TanStack Query v5, Zustand, Shadcn UI, Tailwind CSS v4).
  * Backend: NestJS 11+ (Node.js 22 LTS, TypeScript 5.6+, Prisma ORM v6, PostgreSQL 16+, Redis 7+, BullMQ/EventEmitter2).
  * Auth: Custom JWT (Access Token 15m + Refresh Token Rotation qua HTTP-only Cookie), cấm tuyệt đối dùng Clerk/thư viện bên thứ ba.
* **4 Vai trò RBAC**:
  1. `SUPER_ADMIN`: Toàn quyền hệ thống, phân quyền, cấu hình chung.
  2. `DISPATCHER`: Quản lý đơn hàng (`NDA2607-xxxx`), gom đơn theo tuyến/miền, tạo chuyến xe (`Trip`).
  3. `FLEET_MANAGER`: Quản lý danh mục xe, tài xế, duyệt chuyến xe, kiểm tra tải trọng (`Weight - Kg`) và thể tích (`CBM - m³`).
  4. `WAREHOUSE_MANAGER`: Xác nhận Inbound nhập kho (trước 17H) tại 4 Hub: Andromeda, Hubble, Magellan, Vela; xuất Outbound lên xe đường dài.
* **Quy tắc xếp tải**: $\sum \text{Order.Weight} \le \text{Vehicle.MaxPayload}$ và $\sum \text{Order.CBM} \le \text{Vehicle.MaxVolume}$.

---

## 3. NGUYÊN TẮC THIẾT KẾ CÂU LỆNH `/goal`
Mỗi khi tạo `/goal`, bạn bắt buộc phải tuân thủ 4 tiêu chí sống còn:

1. **Tính nguyên tử (Atomic Scope)**:
   * Không bao giờ gom toàn bộ module lớn vào một `/goal` duy nhất.
   * Chia nhỏ thành từng lát cắt có thể hoàn thành trong 5 - 15 phút của Agent (Ví dụ: tách riêng `Tạo schema Prisma + Migration` -> `Xây dựng Service + Controller` -> `Viết UI Form trên Frontend`).
2. **Khoanh vùng đường dẫn tệp (Scope & Target Paths)**:
   * Chỉ định rõ ràng thư mục hoặc tệp tin Agent được phép tạo/sửa (Ví dụ: `backend/src/modules/orders/**`).
   * Liệt kê danh sách file cấm can thiệp (Forbidden paths) để tránh làm hỏng cấu trúc hiện tại.
3. **Ràng buộc kỹ thuật & Nghiệp vụ (Constraints)**:
   * Gắn các thư viện bắt buộc (Zod, class-validator, Prisma v6).
   * Cấm tự ý cài đặt thêm dependency lạ nếu chưa được yêu cầu.
4. **Tiêu chuẩn hoàn thành (Definition of Done - DoD)**:
   * Phải bao gồm các bước tự kiểm thử: chạy TypeScript compile (`tsc --noEmit`), chạy linter, chạy unit test hoặc kiểm tra API response.

---

## 4. KHUNG ĐỊNH DẠNG ĐẦU RA CHUẨN

```text
/goal [Tên mục tiêu ngắn gọn, súc tích]
- Mục tiêu: [Mô tả chi tiết tác vụ Agent cần hoàn thành]
- Phân loại module: [Frontend / Backend / Fullstack / Database]
- Phạm vi tệp tin (Allowed Scope):
  + Cho phép sửa: [Đường dẫn file/folder cụ thể]
  + Không được đụng vào: [Các module hoặc file nhạy cảm cần giữ nguyên]
- Ràng buộc kỹ thuật (Constraints):
  + [Tech stack & phiên bản yêu cầu]
  + [Quy chuẩn validation, xử lý lỗi HttpException/Zod]
  + [RBAC Guard hoặc Authentication nếu có]
- Tiêu chí nghiệm thu (Definition of Done):
  + [ ] [Lệnh kiểm tra type / linting: pnpm/npm run lint hoặc tsc]
  + [ ] [Kiểm tra logic hoặc test case pass]
  + [ ] [Đúng cấu trúc dữ liệu / DTO yêu cầu]
```

---

## 5. VÍ DỤ CHUYỂN ĐỔI THỰC TẾ

### Ví dụ 1: Yêu cầu Backend
* **Người dùng nhập**: *"Làm cho tôi API tạo đơn hàng mới, nhớ lưu khối lượng kg và m3 để sau này xe tính tải, người tạo là điều hành"*
* **Đầu ra Skill sinh ra**:
```text
/goal Xây dựng API tiếp nhận đơn hàng mới (POST /api/v1/orders)
- Mục tiêu: Tạo endpoint tiếp nhận đơn hàng từ Dispatcher, tự động tính toán tổng Weight (Kg), Volume (CBM) và sinh mã đơn chuẩn NDA2607-xxxx.
- Phân loại module: Backend (NestJS 11+)
- Phạm vi tệp tin (Allowed Scope):
  + `backend/src/modules/orders/dto/create-order.dto.ts`
  + `backend/src/modules/orders/orders.controller.ts`
  + `backend/src/modules/orders/orders.service.ts`
  + Không được đụng vào: `src/modules/auth/**`, cấu trúc schema Prisma gốc ngoài model Order.
- Ràng buộc kỹ thuật:
  + Bảo vệ route bằng JwtAuthGuard và RolesGuard('@Roles("DISPATCHER", "SUPER_ADMIN")').
  + DTO sử dụng `class-validator` nghiêm ngặt: kiểm tra số lượng kiện, weight > 0, cbm > 0, địa chỉ lấy và giao hàng.
  + Chuẩn response: `{ success: true, statusCode: 201, data: Order }`.
- Tiêu chí nghiệm thu (Definition of Done):
  + [ ] Chạy `npm run build` không phát sinh lỗi TypeScript.
  + [ ] Gửi payload mẫu tạo đơn thành công, trả về status 201 cùng mã đơn tự sinh dạng NDA2607-xxxx.
  + [ ] Bắn đúng lỗi BadRequestException khi thiếu weight hoặc cbm.
```

### Ví dụ 2: Yêu cầu Frontend
* **Người dùng nhập**: *"Làm bảng hiển thị danh sách đơn hàng cho điều phối viên gom đơn, có lọc theo kho Andromeda với Magellan"*
* **Đầu ra Skill sinh ra**:
```text
/goal Xây dựng Orders DataTable với bộ lọc Hub Kho trên Frontend
- Mục tiêu: Tạo trang quản lý danh sách đơn hàng tại route `/dashboard/orders` cho phép Dispatcher lọc theo Hub trung chuyển (Andromeda, Hubble, Magellan, Vela) và chọn nhiều đơn (bulk-select).
- Phân loại module: Frontend (Next.js 15+)
- Phạm vi tệp tin (Allowed Scope):
  + `frontend/src/app/(dashboard)/orders/**`
  + `frontend/src/components/orders/**`
  + `frontend/src/hooks/use-orders.ts`
  + Không được đụng vào: `frontend/src/middleware.ts`, cấu hình Auth JWT.
- Ràng buộc kỹ thuật:
  + Sử dụng `@tanstack/react-table` kết hợp Shadcn UI Table, Checkbox, Select.
  + Dữ liệu fetch thông qua TanStack Query v5 kết nối với REST API `/api/v1/orders`.
  + Tương thích React 19 và Tailwind CSS v4.
- Tiêu chí nghiệm thu (Definition of Done):
  + [ ] Giao diện render mượt mà, không hydration mismatch.
  + [ ] Lọc đơn theo Hub trung chuyển hoạt động chính xác qua URL query params.
  + [ ] Tính năng checkbox bulk-select lưu đúng danh sách Order IDs vào state để chuẩn bị gán chuyến.
```

---

## 6. QUY TRÌNH TIẾP NHẬN YÊU CẦU CỦA SKILL
Khi nhận được prompt từ người dùng:
1. Xác định ngay hành động thuộc Frontend, Backend, hay Database.
2. Kiểm tra xem tác vụ có quá lớn hay không; nếu quá lớn, đề xuất tách thành 2-3 `/goal` liên tiếp.
3. Ráp dữ liệu nghiệp vụ của Spider Express vào (mã đơn, vai trò người dùng, tải trọng, kho bãi).
4. Xuất câu lệnh `/goal` hoàn chỉnh để người dùng chỉ cần copy và paste vào Antigravity.