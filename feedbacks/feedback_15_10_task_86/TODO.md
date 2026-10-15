# Feedback 15/10 (Task #86) — Tạm Thời Ẩn Nút Kính Lúp Tra Cứu Đơn Hàng Trong Bảng Kê Xuất Kho

> **Thời gian ghi nhận**: 15/10/2026  
> **Người báo cáo**: @Thai / Quản trị Vận hành TMS  
> **Mã Task Database**: `Task #86`  
> **Màn hình liên quan**:  
> - Quản lý Xuất kho ([`outbound/page.tsx`](file:///frontend/src/app/dashboard/warehouse/outbound/page.tsx)) ➔ Tạo Phiếu Xuất Kho (`MODE1_CUSTOMER`)  
> - Bảng Kê Soạn Hàng Editable Grid ([`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx)) ➔ Cột `MÃ VẬN ĐƠN *` (`OrderCodeCell`)  
> **Ảnh minh chứng gốc**: [`screenshot_01.png`](file:///feedbacks/feedback_15_10_task_86/screenshot_01.png) (Khoanh đỏ cột chứa các nút kính lúp cạnh ô nhập mã vận đơn)  
> **Tài liệu tham chiếu**:  
> - Quy chế phát triển hệ thống [`AGENTS.md`](file:///AGENTS.md) (Compact Density, Zero Redundant Icons, Zero Mock Data)  
> - Quy chuẩn giao diện hẹp [`.agents/rules/ui-compact-density.md`](file:///.agents/rules/ui-compact-density.md)  
> - Kỹ năng Todo Agent ([`todo-agent/SKILL.md`](file:///.agents/skills/todo-agent/SKILL.md))  

---

## 📌 Bối cảnh nghiệp vụ & Phân tích nguyên nhân gốc rễ (RCA)

### 1. Bối cảnh nghiệp vụ thực tế
- Tại màn hình **Xuất kho • Andromeda Hub - HCM** (`/dashboard/warehouse/outbound`), khi thủ kho bấm tạo phiếu xuất kho mới (`MODE1_CUSTOMER`), hệ thống hiển thị bảng kê danh sách kiện hàng cần xuất với các cột: `STT`, `MÃ VẬN ĐƠN *`, `ĐỊA CHỈ NHẬN *`, `TÊN HÀNG *`, `SỐ KIỆN *`, `SỐ KG *`, `SỐ M³ *`, `ĐỊA CHỈ GIAO *`, `CHỨNG TỪ`, `GHI CHÚ`, `THAO TÁC`.
- Trước đây, trong ô `OrderCodeCell`, khi ở chế độ xuất kho (`isOutbound = true`), bên cạnh ô `Input` mã vận đơn có đặt một nút bấm nhỏ chứa icon kính lúp (`IconSearch`) nhằm mở modal tra cứu tồn kho (`WarehouseLookupModal`).
- **Phản hồi từ người dùng vận hành**: Nút kính lúp này hiện gây rối mắt trên từng dòng bảng kê, làm thu hẹp không gian hiển thị mã vận đơn trên màn hình hẹp, đồng thời quy trình vận hành xuất kho thực tế ưu tiên nhập trực tiếp mã vận đơn (hệ thống tự động debounce tra cứu sau 1.2s hoặc khi ấn Enter) hoặc xuất theo kế hoạch luân chuyển. Do đó, người dùng yêu cầu:
  > *"tạm thời ẩn đi mấy icon kính lúp này trong flow xuất kho"* (kèm ảnh chụp khoanh đỏ cột icon kính lúp).

### 2. Phân tích nguyên nhân kỹ thuật (RCA)
- Trong tệp [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) tại hàm `OrderCodeCell` (dòng ~853-884):
  ```tsx
  if (isOutbound) {
    return (
      <div className='flex items-center gap-1 relative'>
        <div className='relative flex-1 min-w-0'>
          <Input ... />
          {isSearching && <IconLoader2 ... />}
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => meta?.openLookup?.(idx)}
          className='h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 shrink-0'
          title='Tra cứu kho để gán mã đơn'
        >
          <IconSearch className='h-3.5 w-3.5' />
        </Button>
      </div>
    );
  }
  ```
- Nút `<Button>` với `<IconSearch>` được cố định hiển thị trong từng dòng `OrderCodeCell` của chế độ xuất kho.
- **Giải pháp**: Tạm thời ẩn nút kính lúp này đi, cho phép thẻ `<Input>` tận dụng trọn vẹn bề rộng của cột `MÃ VẬN ĐƠN` mà không bị nút `h-7 w-7` chiếm diện tích. Quy trình tự động nhận diện mã vận đơn khi nhập/Enter vẫn giữ nguyên 100% hoạt động hoàn hảo.

---

## 📋 Danh Sách Công Việc Triển Khai (Action Checklist)

### 1. Phân Tích & Quản Trị Nhánh
- [x] Tạo nhánh `feature/task-86-hide-outbound-order-lookup-icon` từ `dev` trên repository frontend và root.
- [x] Thu thập và đối soát ảnh chụp màn hình gốc của task vào `feedbacks/feedback_15_10_task_86/screenshot_01.png`.

### 2. Triển Khai Mã Nguồn Giao Diện (Frontend)
- [x] Cập nhật [`warehouse-editable-grid.tsx`](file:///frontend/src/features/warehouse/components/warehouse-editable-grid.tsx) trong component `OrderCodeCell`:
  - Tạm thời loại bỏ / ẩn nút `<Button>` chứa `<IconSearch>`.
  - Giữ lại đầy đủ cấu trúc container `relative` và ô `<Input>` mã vận đơn với logic tìm kiếm tự động (debounce 1.2s & Enter).
  - Tối ưu không gian hiển thị cột mã vận đơn, chống co cụm ký tự trên màn hình compact.

### 3. Kiểm Định & Xác Minh Chất Lượng
- [x] Kiểm tra lỗi kiểu TypeScript: `npx --prefix frontend tsc --noEmit` đạt 0 lỗi và Next.js build 34/34 routes pass.
- [x] Xây dựng test suite Playwright E2E chuyên biệt: `frontend/e2e/86-feedback-15-10-task-86-hide-outbound-lookup-icon.spec.ts`.
- [x] Thực thi test suite E2E và ghi lại ảnh chụp màn hình bằng chứng thực tế: `feedbacks/feedback_15_10_task_86/screenshot_01_verified.png`.
- [x] Đánh giá chéo chất lượng test qua `node scripts/e2e-auditor.mjs` đạt điểm tối đa 50/50.

### 4. Báo Cáo & Biên Niên Sử Kỹ Thuật
- [x] Tạo tài liệu nghiệm thu kỹ thuật `RESOLUTION.md` và đồng bộ `docs/SYSTEM_TIMELINE.md` qua `npm run todo:record feedback_15_10_task_86`.
- [x] Merge nhánh tính năng vào `dev` và cập nhật báo cáo nghiệm thu mobile-first.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases (E2E Test Spec & Edge Cases)

### Cấu phần 1: Luồng Thao Tác Tuần Tự Từng Bước (Step-by-Step E2E Action Sequence)
- **Tài khoản kiểm thử**: `USER_WAREHOUSE_HCM` (username `warehouse_hcm`) — Thủ kho phụ trách Andromeda Hub - HCM (khớp chuẩn xác 100% với tiêu đề trang trong ảnh chụp `Xuất kho • Andromeda Hub - HCM`).
- **Màn hình**: `/dashboard/warehouse/outbound`.
- **Các bước thực hiện**:
  1. Đăng nhập hệ thống bằng tài khoản `USER_WAREHOUSE_HCM`.
  2. Điều hướng tới `/dashboard/warehouse/outbound`.
  3. Bấm nút **Tạo phiếu xuất** để chuyển sang màn hình `MODE1_CUSTOMER` ("Tạo Phiếu Xuất Kho").
  4. Đợi bảng kê soạn hàng `WarehouseEditableGrid` xuất hiện đầy đủ các dòng.
  5. **Assertion 1**: Kiểm tra số lượng dòng bảng kê ít nhất 1 dòng (`rows.length > 0`).
  6. **Assertion 2 (Trọng tâm Task #86)**: Kiểm tra trong từng dòng của cột `MÃ VẬN ĐƠN`, KHÔNG còn tồn tại nút bấm chứa icon kính lúp `IconSearch` (`title='Tra cứu kho để gán mã đơn'` hoặc selector button search trong cell).
  7. **Assertion 3**: Kiểm tra ô `Input` mã vận đơn vẫn hiển thị bình thường, cho phép nhập liệu và tương tác tự động tra cứu.
  8. Chụp ảnh màn hình nghiệm thu thực tế lưu vào `feedbacks/feedback_15_10_task_86/screenshot_01_verified.png`.

### Cấu phần 2: Bảng Ma Trận Edge Cases Toàn Diện (Edge Cases Matrix)

| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt (Trigger Condition) | Hành vi kỳ vọng (Expected Behavior) | Assertion kiểm tra chính xác |
|:---:|---|---|---|---|
| `EC-01` | **Ẩn Kính Lúp Tại Mọi Dòng Xuất Kho** | Tạo phiếu xuất kho với nhiều dòng hàng. | Không dòng nào xuất hiện nút kính lúp cạnh mã đơn. | `expect(page.locator('button[title*="Tra cứu kho"]')).toHaveCount(0)` |
| `EC-02` | **Nhập Mã Đơn Thủ Công Vẫn Hoạt Động** | Thủ kho gõ trực tiếp mã đơn hàng vào ô Input. | Ký tự hoa chuẩn xác, hệ thống tự động tìm kiếm sau debounce hoặc ấn Enter. | `expect(input).toHaveValue('LTV...')` |
| `EC-03` | **Thêm Dòng Mới Không Sinh Kính Lúp** | Thủ kho bấm "+ Thêm 1 dòng mới". | Dòng mới sinh ra có ô nhập mã đơn sạch, không có nút kính lúp. | Dòng mới có `input` nhưng 0 nút `IconSearch`. |
| `EC-04` | **Không Ảnh Hưởng Đến Quy Trình Nhập Kho** | Điều hướng sang `/dashboard/warehouse/inbound`. | Luồng nhập kho vẫn hoạt động bình thường theo quy chuẩn độc lập. | Trang inbound tải thành công, không lỗi layout. |
| `EC-05` | **Độ Rộng Cột Gọn Gàng (Compact Density)** | Mở phiếu xuất trên các độ phân giải màn hình. | Ô nhập mã đơn hiển thị trọn vẹn, không bị che khuất hay đè tràn cột lân cận. | Không tràn thanh cuộn ngang ngoài ý muốn. |

### Cấu phần 3: Định Danh Tệp Playwright E2E Test Suite
- **Tệp kiểm thử**: `frontend/e2e/warehouse-task-86-hide-outbound-lookup-icon.spec.ts`
- **Lệnh thực thi**: `npx playwright test e2e/warehouse-task-86-hide-outbound-lookup-icon.spec.ts`
