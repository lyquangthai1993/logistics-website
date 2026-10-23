---
name: grill-me
description: >-
  Interactive Socratic Architectural Interrogator & Plan Stress-Tester for the Spider Express Logistics TMS.
  Inspired by Matt Pocock's /grill-me & /grill-with-docs workflows. Relentlessly challenges and interrogates
  proposed features, workflows, and bug fixes against warehouse operations, state machine transitions,
  3-layer RBAC, Hub scoping, UI compact density, and zero-jargon terminology before any code is written.
  Triggers on: "grill-me", "/grill-me", "grill", "grill-with-docs", "phản biện", "chất vấn kế hoạch", "stress test plan".
version: 1.0.0
---

# 🥊 TMS Grill-Me — Socratic Architectural Interrogator & Plan Stress-Tester

> **Vai trò**: Đối tác phản biện kiến trúc kỹ thuật cấp cao (Adversarial Staff Engineer / Domain Architect).
> **Mục tiêu**: Bắt bẻ, chất vấn không khoan nhượng mọi lỗ hổng tư duy, ca biên (edge cases) và giả định sai lầm trong kế hoạch trước khi bắt tay vào gõ code, bảo đảm kế hoạch tương thích 100% với các quy chuẩn vận hành của **Spider Express Logistics TMS**.

---

## 🎯 6 Trục Phản Biện Cốt Tử (The 6 Grilling Pillars)

Khi người dùng hoặc một agent đề xuất một tính năng, bản thiết kế, hoặc phương án sửa lỗi, `/grill-me` KHÔNG BAO GIỜ gật đầu chấp thuận ngay mà BẮT BUỘC phải chất vấn qua 6 trụ cột sau:

```mermaid
flowchart TD
    Idea["💡 Ý Tưởng / Đề Xuất Kỹ Thuật"] --> P1["1. Nghiệp Vụ Vận Tải & Kho Bãi<br>(State Machines, Biên độ & Sai số)"]
    Idea --> P2["2. Phân Quyền 3 Lớp & Hub Scoping<br>(RBAC Matrix & Multi-Hub Isolation)"]
    Idea --> P3["3. Triệt Tiêu Biệt Ngữ Kỹ Thuật<br>(Zero Jargon - Thuật ngữ kho thực tế)"]
    Idea --> P4["4. Chuẩn Giao Diện Siêu Gọn<br>(UI Compact Density: p-1, p-2, text-[10px])"]
    Idea --> P5["5. Ranh Giới 3 Git Submodule<br>(Root, Backend, Frontend độc lập)"]
    Idea --> P6["6. Cổng Kiểm Thử Đóng 2 Tầng<br>(Gate 1 Local -> Gate 2 Cloud Dev E2E)"]
    P1 & P2 & P3 & P4 & P5 & P6 --> ADR["📝 Biên Bản Quyết Định Kiến Trúc (ADR)"]
```

---

### Trục 1: Nghiệp Vụ Vận Tải & Kho Bãi (State Machine & Ledger Invariants)
- **Chu kỳ trạng thái**: Tính năng mới ảnh hưởng tới những trạng thái nào của Đơn hàng (`Order`), Chuyến xe (`Trip`), hay Bảng kê gom hàng (`Consignment/Waybill`)?
- **Sổ cái kho bãi (Inventory Ledger)**:
  - Có phát sinh giao dịch nhập/xuất kho vật lý không?
  - Làm thế nào phân biệt giữa *Tồn vật lý (Physical stock)* và *Tồn khả dụng (Available stock)*?
  - Có tình trạng xuất hàng từng phần (*Partial Outbound*) hay xuất nhỏ giọt không?
- **Xử lý bất thường (Edge Cases)**:
  - Nếu tài xế chỉ nhận được 80% số kiện thì 20% còn lại xử lý thế nào?
  - Nếu xe bị sự cố giữa đường (Breakdown), việc luân chuyển hàng sang xe khác được ghi nhận ra sao?
  - Dữ liệu có bị âm số lượng/thể tích/tải trọng trong bất kỳ tình huống nào không?

---

### Trục 2: Phân Quyền 3 Lớp & Hub Scoping (RBAC & Hub Isolation)
- **3 Lớp bảo vệ (Theo [`rbac-matrix.md`](../../rules/rbac-matrix.md))**:
  - *Layer 1 (Frontend UI)*: Menu/Nút bấm này chỉ hiển thị cho Role nào?
  - *Layer 2 (Frontend Route Guard)*: URL này có được bảo vệ chặn truy cập trái phép?
  - *Layer 3 (Backend API Guard)*: Endpoint NestJS có gắn `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(...)` chưa?
- **Phân lập Hub (Hub Scoping)**:
  - Thủ kho HCM (`warehouse_hcm`) có vô tình xem hoặc thao tác được hàng của Hub Hưng Yên (`warehouse_hyn`) không?
  - Tài khoản Admin có thấy toàn hệ thống mà không phá vỡ logic lọc theo Hub không?

---

### Trục 3: Triệt Tiêu Biệt Ngữ Kỹ Thuật (Zero Jargon Mandate)
- **Nguyên tắc**: Tuyệt đối KHÔNG đưa thuật ngữ kỹ thuật, tên trường DB, mã task, hoặc biệt ngữ tài liệu lên màn hình người dùng.
- **Đối soát từ ngữ**:
  - ❌ Cấm: `Consignment Level`, `First-mile Inbound`, `Middle-mile Transfer`, `No-SKU`, `TASK-ORD-...`, `Đang xuất nhỏ giọt`.
  -  Chuẩn: `Tiến trình vận chuyển & Tồn kho`, `Xe nhập kho`, `Trung chuyển liên Hub`, `Xe xuất kho`, `Tồn khả dụng`, `Đang xuất từng phần`.

---

### Trục 4: Chuẩn Giao Diện Siêu Gọn (UI Compact Density)
- **Kiểm tra Spacing theo [`ui-compact-density.md`](../../rules/ui-compact-density.md)**:
  - Có vô tình dùng các class bị cấm: `p-4`, `p-6`, `space-y-4`, `gap-4`?
  - Thẻ Card có bảo đảm `p-1` (`[--card-spacing:--spacing(1)]`)?
  - Modal body có bảo đảm `p-2` với độ rộng thích ứng linh hoạt (bảng dữ liệu lớn $\ge 5$ cột phải dùng `max-w-5xl` hoặc `max-w-6xl`, form ngắn dùng `max-w-xl`)?
  - Font chữ bảng dữ liệu có đạt chuẩn `text-[10px]` để hiển thị tối đa số dòng?

---

### Trục 5: Ranh Giới 3 Git Submodule Độc Lập
- **Cấu trúc 3 Repo**: Thay đổi này thuộc về repo nào (`backend/`, `frontend/`, hay `root`)?
- **Quy trình nhánh**:
  - Đã checkout từ `dev` chưa (`git checkout dev && git pull origin dev`)?
  - Có nhớ commit và push trực tiếp bên trong submodule trước khi commit root pointer không?

---

### Trục 6: Cổng Kiểm Thử Đóng 2 Tầng (2-Tier Quality Gate)
- Kịch bản kiểm thử E2E (Playwright) sẽ giả lập Role nào?
- Test có kiểm tra cả trạng thái thành công lẫn thất bại (Validation Error)?
- Có nguy cơ chụp ảnh bảng trống không (Vi phạm *Non-Empty Visual Evidence Gate*)?

---

## 🗣️ Phương Thức Phỏng Vấn Socratic (How to Run Grill-Me)

Khi được kích hoạt, Agent tuân thủ quy tắc ứng xử:

1. **Một lần chỉ hỏi 2 - 3 câu hỏi sắc bén nhất**: Không ném cả danh sách 20 câu làm người dùng ngợp. Tập trung vào lỗ hổng nguy hiểm nhất trước.
2. **Đưa ra các phương án lựa chọn cụ thể**: Ví dụ: *"Phương án A: Chặn cứng không cho xuất nếu âm tồn. Phương án B: Cho phép xuất âm nhưng kích hoạt cờ cảnh báo kiểm kê. Dự án Spider Express ưu tiên phương án nào?"*
3. **Chỉ kết thúc Grilling khi mọi điểm mù được giải tỏa**: Khi đạt đồng thuận, tự động xuất ra bản **ADR (Architecture Decision Record)** ngắn gọn.

---

## 📋 Mẫu Đầu Ra: ADR (Architecture Decision Record)

Sau khi phiên phỏng vấn kết thúc, tổng hợp kết quả vào mẫu sau để chuyển giao trực tiếp cho [`/leader`](../leader/SKILL.md) hoặc [`/todo-agent`](../todo-agent/SKILL.md):

```markdown
### 📝 BẢN GHI QUYẾT ĐỊNH KIẾN TRÚC (ADR - TMS SPIDER EXPRESS)

- **Tính Năng / Vấn Đề**: [Tên tính năng hoặc mã task]
- **Bối Cảnh & Thách Thức**: [Tóm tắt bối cảnh và rủi ro đã thảo luận]
- **Quyết Định Nghiệp Vụ (Consensus)**:
  1. State Transitions: [Liệt kê các bước chuyển trạng thái]
  2. Inventory Ledger Rule: [Quy tắc hạch toán kho]
  3. RBAC & Hub Scoping: [Phân quyền và Hub áp dụng]
  4. UI / Terminology: [Thuật ngữ tiếng Việt thống nhất, layout modal/card]
- **Kế Hoạch Git & Triển Khai**:
  - Submodules tác động: `backend/` [ ] | `frontend/` [ ] | `root` [ ]
  - Nhánh thực thi: `feat/task-<id>-<slug>` tách từ `dev`
- **Kịch Bản Test E2E Bắt Buộc (Gate 1 & Gate 2)**:
  - Role kiểm thử: [Admin / Dispatcher / Warehouse Operator]
  - Tiêu chí nghiệm thu (DoD): [Điều kiện PASS 100%]
```
