# Kế Hoạch Triển Khai: Phân Hệ Quản Lý Kho (Warehouse Hub Operations)

> **Nguồn tham chiếu**: [Task_Warehouse_Design_UI.md](./Task_Warehouse_Design_UI.md) · [leader SKILL](./.agents/skills/leader/SKILL.md) · [RBAC Matrix v1.4](./.agents/rules/rbac-matrix.md)
> **Phiên bản**: v1.1 — 2026-09-03 (cập nhật Q2/Q3)
> **Branch**: `feature/warehouse-inbound-module` (backend + frontend)

---

## 📋 Xác Nhận Các Quyết Định Thiết Kế

| # | Câu hỏi | Quyết định |
|---|---|---|
| **Q1** | DB Schema | ✅ **Phương án A**: Bảng `waybill` riêng (1 order → N waybills) |
| **Q2** | Excel Paste (Ctrl+V) | ✅ **Phase tiếp theo (P2)** — Không implement sprint này |
| **Q3** | Print templates | ✅ **Client-side React + Print CSS** cho preview/in. **Server-side PDF gen** (Puppeteer/html-pdf-node) → upload S3 Supabase → lưu link vào DB → trả về URL thật |

---

## 📊 Gap Analysis

### ✅ Những gì đã có

| Thành phần | File | Trạng thái |
|---|---|---|
| Warehouse page route | `frontend/src/app/dashboard/warehouse/page.tsx` | Stub — render WarehouseListing |
| WarehouseListing | `frontend/src/features/warehouse/components/warehouse-listing.tsx` | Chỉ prefetch Trips |
| WarehouseInboundBoard | `frontend/src/features/warehouse/components/warehouse-inbound-board.tsx` | Card view Trips — chưa đủ |
| WarehouseTable + columns | `frontend/src/features/warehouse/components/warehouse-tables/` | Đọc Trips, thiếu action kho |
| **S3 Supabase** | `backend/src/files/infrastructure/uploader/s3/` | ✅ **Đầy đủ**: S3Client + multer-s3, FILE_DRIVER=s3 |
| **FileEntity** | `backend/src/files/.../entities/file.entity.ts` | Bảng `file` (id uuid, path, createdBy) |
| **FilesS3Service** | `backend/src/files/.../uploader/s3/files.service.ts` | Có `create(multerS3File)` → lưu path vào DB |
| **S3 Config** | `.env` | Supabase S3 endpoint + bucket `logistics-media` + credentials |
| TripEntity | `backend/src/trips/.../trip.entity.ts` | Đủ dữ liệu xe/tài xế ✅ |
| RBAC Route Guard | `frontend/src/proxy.ts` | /dashboard/warehouse → WAREHOUSE_MANAGER ✅ |

### ❌ Những gì chưa có (Gap)

| Hạng mục | Ảnh hưởng |
|---|---|
| DB Schema: Bảng `waybill` + `waybill_item` | 🔴 Critical |
| Backend: `WaybillModule` (CRUD + state machine) | 🔴 Critical |
| Backend: PDF generation service (Puppeteer/html-pdf) | 🔴 Critical (Q3) |
| Backend: API gen PDF → upload S3 → lưu link DB → trả URL | 🔴 Critical (Q3) |
| Frontend: Form nhập hàng dạng Grid (Excel-like) | 🔴 Critical |
| Frontend: Trip Selection Modal (Mode 2) | 🔴 Critical |
| Frontend: Timeline Stepper 3 chặng | 🔴 Critical |
| Frontend: Print preview (React + Print CSS) + nút "Tạo PDF" | 🟡 High |
| Frontend: Mobile UX — Cargo Cards + Sticky bar | 🟡 High |
| RBAC Matrix: Waybill endpoints | 🟠 Medium |

---

## 🏗️ Sprint 1 — DB Schema & Backend WaybillModule

### 1.1 Entity: `WaybillEntity`

**File mới**: `backend/src/waybills/infrastructure/persistence/relational/entities/waybill.entity.ts`

```typescript
@Entity({ name: 'waybill' })
export class WaybillEntity extends AbstractBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String, unique: true, nullable: true })
  waybillCode: string | null;           // Format: DDMMYY-xxxx (sinh khi PENDING_INBOUND)

  @Column({ type: String, default: 'DRAFT' })
  warehouseStatus: string;             // DRAFT | PENDING_INBOUND | INBOUND | COMPLETED_INBOUND | ...

  @Column({ type: String })
  mode: string;                        // DIRECT_CUSTOMER | HUB_TRANSFER

  @Column({ type: Number })
  hubId: number;                       // FK → hub (Hub nhận hàng = currentUser.hubId)

  @Column({ type: Number, nullable: true })
  tripId: number | null;               // FK → trip (Mode 2 only)

  // Thông tin xe/tài xế
  @Column({ type: String, nullable: true })
  vehicleLicensePlate: string | null;

  @Column({ type: String, nullable: true })
  driverName: string | null;

  @Column({ type: String, nullable: true })
  driverPhone: string | null;

  @Column({ type: String, nullable: true })
  subContractor: string | null;

  @Column({ type: 'text', nullable: true })
  pickupAddress: string | null;

  @Column({ type: Number, nullable: true })
  createdByUserId: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ─── PDF Links (lưu URL S3 của từng loại phiếu) ───
  @Column({ type: 'text', nullable: true })
  pdfInboundSlipUrl: string | null;    // Phiếu Nhập Kho PDF URL (Supabase S3)

  @Column({ type: 'text', nullable: true })
  pdfOutboundSlipUrl: string | null;   // Phiếu Xuất Kho PDF URL

  @Column({ type: 'text', nullable: true })
  pdfDeliveryNoteUrl: string | null;   // Phiếu Giao Hàng / POD PDF URL

  @Column({ type: 'text', nullable: true })
  pdfCargoLabelUrl: string | null;     // Tem Nhận Diện PDF URL

  @OneToMany(() => WaybillItemEntity, (item) => item.waybill, { cascade: true })
  items: WaybillItemEntity[];
}
```

### 1.2 Entity: `WaybillItemEntity`

**File mới**: `backend/src/waybills/infrastructure/persistence/relational/entities/waybill-item.entity.ts`

```typescript
@Entity({ name: 'waybill_item' })
export class WaybillItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: Number })
  waybillId: number;

  @Column({ type: Number, default: 1 })
  rowIndex: number;                   // Thứ tự dòng trên grid

  @Column({ type: String })
  orderCode: string;                  // Mã đơn hàng (do khách/bill gửi)

  @Column({ type: 'text' })
  pickupAddress: string;              // Địa chỉ nhận hàng (Cột 3)

  @Column({ type: 'text' })
  goodsDescription: string;           // Tên hàng — NO SKU

  @Column({ type: 'int', default: 0 })
  quantity: number;                   // Số thùng/kiện

  @Column({ type: 'float', default: 0 })
  weightKg: number;                   // Số kg (Gross weight)

  @Column({ type: 'float', default: 0 })
  volumeM3: number;                   // Số m³/CBM

  // Địa chỉ giao hàng — 3-mode
  @Column({ type: String, default: 'FREE_TEXT' })
  deliveryMode: string;               // FREE_TEXT | HUB_L1 | HUB_L2_SAT

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;     // FREE_TEXT: nhập tay

  @Column({ type: Number, nullable: true })
  deliveryHubId: number | null;       // HUB_L1 / HUB_L2_SAT: FK → hub

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
```

### 1.3 Migration TypeORM

**File mới**: `backend/src/database/migrations/{timestamp}-CreateWaybillAndWaybillItem.ts`

Tạo bảng `waybill` (với cột pdf*Url) và `waybill_item`, đúng thứ tự cột.
Indexes: `waybill.waybillCode (unique)`, `waybill.hubId`, `waybill.warehouseStatus`, `waybill_item.waybillId`.

### 1.4 WaybillModule — NestJS

**Files mới**:
```
backend/src/waybills/
  domain/waybill.ts
  dto/create-waybill.dto.ts
  dto/create-waybill-item.dto.ts
  dto/query-waybill.dto.ts
  waybills.module.ts
  waybills.service.ts
  waybills.controller.ts
```

**API Endpoints**:

| Endpoint | Method | Role | Mô tả |
|---|---|---|---|
| `POST /v1/waybills` | POST | WM, SA | Tạo đơn nhập kho (Mode 1 & 2) |
| `GET /v1/waybills` | GET | All auth | Danh sách (filter: hubId, status, mode, date) |
| `GET /v1/waybills/:id` | GET | All auth | Chi tiết + items |
| `PATCH /v1/waybills/:id` | PATCH | WM, SA | Cập nhật DRAFT |
| `PATCH /v1/waybills/:id/confirm` | PATCH | WM, SA | DRAFT → PENDING_INBOUND (sinh waybillCode) |
| `PATCH /v1/waybills/:id/start-inbound` | PATCH | WM | PENDING_INBOUND → INBOUND |
| `PATCH /v1/waybills/:id/complete-inbound` | PATCH | WM | INBOUND → COMPLETED_INBOUND |
| `POST /v1/waybills/:id/generate-pdf` | POST | WM, SA | Gen PDF → S3 → lưu URL → trả link (xem Sprint 4) |
| `DELETE /v1/waybills/:id` | DELETE | WM, SA | Soft-delete DRAFT |

**Files sửa**:
- `backend/src/app.module.ts` → import WaybillsModule
- `backend/src/trips/trips.controller.ts` → thêm filter `destinationHubId`, `status=IN_TRANSIT`

---

## 🏗️ Sprint 2 — Frontend: API Layer + Form Grid Mode 1

### 2.1 API Layer (TanStack Query)

**Files mới**:
- `frontend/src/features/warehouse/api/types.ts`
- `frontend/src/features/warehouse/api/queries.ts`
- `frontend/src/features/warehouse/api/mutations.ts`

```typescript
// Key mutations
useCreateWaybill()              // POST /v1/waybills
useConfirmWaybill()             // PATCH /v1/waybills/:id/confirm
useStartInbound()               // PATCH /v1/waybills/:id/start-inbound
useCompleteInbound()            // PATCH /v1/waybills/:id/complete-inbound
useGeneratePdf()                // POST /v1/waybills/:id/generate-pdf → trả { url, type }
useDeleteWaybill()              // DELETE /v1/waybills/:id
```

### 2.2 WarehouseCreateDialog

**File mới**: `frontend/src/features/warehouse/components/warehouse-create-dialog.tsx`

Tab "Mới hoàn toàn" (Mode 1):
- Header: vehicleLicensePlate, driverName, driverPhone, subContractor, pickupAddress
- `<WaybillGridInput />` component
- Sticky Footer: [Hủy] [Lưu nháp] [Xác nhận đơn →]

Tab "Luân chuyển nội bộ" (Mode 2):
- `<TripSearchBar />` → tìm Trips IN_TRANSIT → destinationHub
- `<TripSelectionModal />` → checkbox chọn đơn
- `<WaybillGridInput readonly vehicleSection />` + nút "+ Thêm hàng bổ sung"

### 2.3 WaybillGridInput

**File mới**: `frontend/src/features/warehouse/components/waybill-grid-input.tsx`

8 cột (khớp 1:1 với `docs_scan/form_create_new_don.JPG`):

| STT | Tên cột | Control |
|---|---|---|
| 1 | STT | Auto-increment |
| 2 | Mã đơn hàng | text input |
| 3 | Địa chỉ nhận hàng | text / readonly (Mode 2) |
| 4 | Tên hàng | text input (NO SKU) |
| 5.1 | Số thùng (kiện) | number int |
| 5.2 | Số kg | number decimal |
| 5.3 | Số m³ (CBM) | number decimal |
| 6 | Địa chỉ giao hàng | **3-mode selector** |
| 7 | Ghi chú | text input |
| 8 | Thao tác | [+] [⧉] [🗑] icons |

Tab key: chuyển ô đúng thứ tự → xuống dòng mới cuối hàng.

Cột 6 — `<WaybillDeliverySelector />`:
- Segmented: [Địa chỉ tự do] [Hub cấp 1] [Hub cấp 2 / Xe bo]
- FREE_TEXT: text input
- HUB_L1: dropdown từ `/v1/hubs/active`
- HUB_L2_SAT: dropdown xe bo / tuyến vệ tinh

---

## 🏗️ Sprint 3 — Mode 2 + Detail Sheet + Timeline

### 3.1 TripSelectionModal

**File mới**: `frontend/src/features/warehouse/components/trip-selection-modal.tsx`

- Search: tripId, biển số xe, tên/SĐT tài xế
- Filter API: `GET /v1/trips?status=IN_TRANSIT&destinationHubId={currentUser.hubId}`
- Kết quả: danh sách Trips → expand → list đơn hàng trong trip
- Checkbox chọn: [Chọn tất cả] / từng đơn
- Confirm → auto-fill grid

### 3.2 WaybillDetailSheet

**File mới**: `frontend/src/features/warehouse/components/waybill-detail-sheet.tsx`

- Header: waybillCode badge, warehouseStatus badge, mode badge
- Timeline Stepper 3 chặng (xem bên dưới)
- Bảng items (readonly)
- Action buttons theo state:
  - `DRAFT`: [Chỉnh sửa] [Xóa] [Xác nhận đơn →]
  - `PENDING_INBOUND`: [Bắt đầu nhập kho] [In phiếu / Tạo PDF] [Hủy]
  - `INBOUND`: [Ghi nhận bất thường] [Hoàn tất nhập kho ✓]
  - `COMPLETED_INBOUND`: [Tạo kế hoạch xuất] [Điều chuyển Hub] [Bàn giao đi giao]

### 3.3 WaybillTimelineStepper

**File mới**: `frontend/src/features/warehouse/components/waybill-timeline-stepper.tsx`

```
Step 1: Nhập kho (Hub gốc)          Step 2: Luân chuyển (N-Hubs)      Step 3: Giao hàng cuối
  PENDING_INBOUND                       IN_TRANSIT                         OUT_FOR_DELIVERY
  → INBOUND                         → COMPLETED_INBOUND                 → COMPLETED_OUTBOUND
  → COMPLETED_INBOUND
```

---

## 🏗️ Sprint 4 — PDF Generation + S3 Upload + Print

### Kiến trúc PDF Flow

```
[Frontend: nút "Tạo PDF / Tải PDF"]
           │
           ▼
POST /v1/waybills/:id/generate-pdf?type=INBOUND_SLIP
           │
           ▼ (Backend)
[WaybillsService.generatePdf()]
   1. Fetch waybill + items từ DB
   2. Render HTML template string (Handlebars / template literals)
   3. Puppeteer: html → Buffer PDF
           │
           ▼
[S3Client.putObject()]
   - Bucket: logistics-media (Supabase S3)
   - Key: waybills/{waybillCode}/{type}-{timestamp}.pdf
   - ContentType: application/pdf
           │
           ▼
[WaybillsService: lưu URL vào DB]
   - pdfInboundSlipUrl = AWS_S3_PUBLIC_URL + "/" + key
   - PATCH waybill record
           │
           ▼
Response: { url: "https://...supabase.co/.../waybills/030926-0001/inbound-slip-xxx.pdf" }
           │
           ▼
[Frontend: mở URL trong tab mới / hiển thị download link]
```

### 4.1 Backend — PDF Generation Service

**File mới**: `backend/src/waybills/pdf/waybill-pdf.service.ts`

```typescript
// Dependencies cần cài:
// npm install puppeteer-core @sparticuz/chromium
// Hoặc nhẹ hơn: npm install html-pdf-node
// Khuyến nghị: html-pdf-node (không cần Chrome binary, dùng headless Chrome)

@Injectable()
export class WaybillPdfService {
  constructor(
    private readonly configService: ConfigService,
    // Inject S3Client trực tiếp (reuse config từ FilesS3Module)
  ) {}

  async generateAndUpload(
    waybill: WaybillEntity,
    type: 'INBOUND_SLIP' | 'OUTBOUND_SLIP' | 'DELIVERY_NOTE' | 'CARGO_LABEL',
  ): Promise<string> {
    // 1. Render HTML từ template
    const html = this.renderTemplate(waybill, type);

    // 2. Generate PDF buffer
    const pdfBuffer = await this.generatePdfBuffer(html);

    // 3. Upload lên S3 Supabase
    const key = `waybills/${waybill.waybillCode}/${type.toLowerCase()}-${Date.now()}.pdf`;
    const url = await this.uploadToS3(pdfBuffer, key);

    return url;
  }

  private renderTemplate(waybill, type): string {
    // HTML template cho từng loại phiếu:
    // - INBOUND_SLIP: mã DDMMYY-xxxx, bảng items, 2 ô ký
    // - OUTBOUND_SLIP: thông tin xuất kho
    // - DELIVERY_NOTE: POD + ô ký khách
    // - CARGO_LABEL: tem dán "... / [Tổng số kiện]"
  }

  private async generatePdfBuffer(html: string): Promise<Buffer> {
    // Dùng html-pdf-node hoặc Puppeteer
    const file = { content: html };
    const options = { format: 'A4', printBackground: true };
    return htmlPdf.generatePdf(file, options);
  }

  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    const s3Client = new S3Client({ /* reuse config từ env */ });
    await s3Client.send(new PutObjectCommand({
      Bucket: this.configService.get('file.awsDefaultS3Bucket'),
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      ACL: 'public-read',    // Supabase Storage: bucket phải public
    }));
    const publicUrl = this.configService.get('file.awsS3PublicUrl');
    return `${publicUrl}/${key}`;
  }
}
```

**File mới**: `backend/src/waybills/pdf/templates/inbound-slip.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/outbound-slip.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/delivery-note.template.ts`
**File mới**: `backend/src/waybills/pdf/templates/cargo-label.template.ts`

### Endpoint Generate PDF

```typescript
// PATCH /v1/waybills/:id/generate-pdf?type=INBOUND_SLIP
@Post(':id/generate-pdf')
@Roles(RoleEnum.WAREHOUSE_MANAGER, RoleEnum.SUPER_ADMIN)
async generatePdf(
  @Param('id') id: string,
  @Query('type') type: PdfType,
): Promise<{ url: string; type: PdfType }> {
  const url = await this.waybillsService.generatePdf(+id, type);
  return { url, type };
}
```

**Logic trong `waybillsService.generatePdf()`**:
1. Fetch waybill + items từ DB
2. Gọi `WaybillPdfService.generateAndUpload(waybill, type)`
3. Cập nhật DB: `waybill.pdfInboundSlipUrl = url` (hoặc cột tương ứng)
4. Return `{ url }`

### 4.2 Frontend — Print Preview + PDF Button

**File mới**: `frontend/src/features/warehouse/components/waybill-print-view.tsx`

```typescript
// Component này phục vụ 2 mục đích:
// 1. Preview in trực tiếp (React + @media print CSS)
// 2. Nút "Tạo PDF & Lưu" → gọi API → nhận URL → mở tab

interface WaybillPrintViewProps {
  waybill: Waybill;
  type: 'INBOUND_SLIP' | 'OUTBOUND_SLIP' | 'DELIVERY_NOTE' | 'CARGO_LABEL';
}

// Trong Dialog/Sheet chi tiết:
// [🖨️ In phiếu]       → window.print() với @media print CSS
// [📄 Tạo PDF & Lưu] → useGeneratePdf mutation → loading → toast "PDF đã tạo"
//                        → hiện link "Tải PDF ↓" hoặc mở tab mới
// [📋 Copy link PDF]  → nếu pdfUrl đã có → copy URL vào clipboard
```

**4 loại phiếu in (nội dung bắt buộc)**:

| Loại | Nội dung | Đặc biệt |
|---|---|---|
| **Phiếu Nhập Kho** | Mã `DDMMYY-xxxx`, Ngày, Xe+Tài xế, Hub nhận, Bảng items, Tổng lũy kế | **2 ô ký**: Thủ kho + Lái xe |
| **Phiếu Xuất Kho** | Thông tin xuất Hub, xe nhận, items | Ghi chú xuất kho |
| **Phiếu Giao Hàng / POD** | Người nhận, địa chỉ giao, items, COD | **Ô ký khách hàng** |
| **Tem Nhận Diện** | Mã đơn, tên hàng, điểm đến | Format: `... / [Tổng kiện]` (VD: `... / 50 kiện`) |

---

## 🏗️ Sprint 5 — Mobile UX + RBAC Update

### 5.1 Mobile UX

**File mới**: `frontend/src/features/warehouse/components/waybill-cargo-card.tsx`

- < 640px: Grid tự động chuyển sang Cargo Item Cards xếp dọc
- Mỗi card: orderCode, goodsDescription, qty/kg/m³, địa chỉ giao, ghi chú + nút xóa
- **Sticky Bottom Bar**: ghim cuối màn hình, touch target ≥ 44px
- Tất cả nút chính: height ≥ 44px

### 5.2 RBAC Matrix v1.5

**File sửa**: `.agents/rules/rbac-matrix.md`

Thêm bảng Waybills Controller:

| Endpoint | Method | SA | D | FM | WM |
|---|---|:-:|:-:|:-:|:-:|
| `POST /v1/waybills` | POST | ✅ | ❌ | ❌ | ✅ |
| `GET /v1/waybills` | GET | ✅ | ✅ | ✅ | ✅ |
| `GET /v1/waybills/:id` | GET | ✅ | ✅ | ✅ | ✅ |
| `PATCH /v1/waybills/:id` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/confirm` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/start-inbound` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `PATCH /v1/waybills/:id/complete-inbound` | PATCH | ✅ | ❌ | ❌ | ✅ |
| `POST /v1/waybills/:id/generate-pdf` | POST | ✅ | ❌ | ❌ | ✅ |
| `DELETE /v1/waybills/:id` | DELETE | ✅ | ❌ | ❌ | ✅ |

Bump RBAC v1.4 → **v1.5**

---

## ~~Sprint 6 — Excel Integration (P2 — Phase tiếp theo)~~

> ⏸️ **Đã quyết định: Để lại Phase 2**. Không implement trong feature branch này.
>
> Bao gồm: Excel Paste Ctrl+V (parse TSV từ clipboard) + Import Excel file (.xlsx) dùng SheetJS.

---

## 📁 Tổng Hợp Files Thay Đổi

### Backend — Files MỚI
```
backend/src/waybills/
├── domain/waybill.ts
├── dto/
│   ├── create-waybill.dto.ts
│   ├── create-waybill-item.dto.ts
│   └── query-waybill.dto.ts
├── infrastructure/persistence/relational/entities/
│   ├── waybill.entity.ts               ← có pdf*Url columns
│   └── waybill-item.entity.ts
├── pdf/
│   ├── waybill-pdf.service.ts          ← gen PDF + S3 upload
│   └── templates/
│       ├── inbound-slip.template.ts
│       ├── outbound-slip.template.ts
│       ├── delivery-note.template.ts
│       └── cargo-label.template.ts
├── waybills.module.ts
├── waybills.service.ts                 ← business logic + gọi PDF service
└── waybills.controller.ts

backend/src/database/migrations/
└── {timestamp}-CreateWaybillAndWaybillItem.ts
```

### Backend — Files SỬA
```
backend/src/app.module.ts              → import WaybillsModule
backend/src/trips/trips.controller.ts  → add destinationHubId filter
```

### Frontend — Files MỚI
```
frontend/src/features/warehouse/
├── api/
│   ├── types.ts
│   ├── queries.ts
│   └── mutations.ts
└── components/
    ├── warehouse-create-dialog.tsx
    ├── waybill-grid-input.tsx
    ├── waybill-delivery-selector.tsx   ← 3-mode selector (FREE_TEXT|HUB_L1|HUB_L2_SAT)
    ├── trip-selection-modal.tsx
    ├── waybill-detail-sheet.tsx
    ├── waybill-timeline-stepper.tsx
    ├── waybill-print-view.tsx          ← Print CSS + "Tạo PDF" button
    └── waybill-cargo-card.tsx          ← Mobile card view
```

### Frontend — Files SỬA
```
frontend/src/features/warehouse/components/warehouse-listing.tsx
frontend/src/features/warehouse/components/warehouse-tables/columns.tsx
frontend/src/features/warehouse/components/warehouse-tables/index.tsx
frontend/src/features/warehouse/params.ts
frontend/src/app/dashboard/warehouse/page.tsx
```

### Root — Files SỬA
```
.agents/rules/rbac-matrix.md           → v1.4 → v1.5
```

---

## 📦 Dependencies Cần Cài

### Backend
```bash
# PDF generation (chọn 1 trong 2)
npm install html-pdf-node              # Nhẹ hơn, không cần Chrome binary riêng
# hoặc:
npm install puppeteer                  # Nặng hơn nhưng render CSS đẹp hơn

# S3 upload: @aws-sdk/client-s3 đã có sẵn trong project ✅
```

### Frontend
```bash
# Không cần thêm dependency mới cho Print CSS
# Chỉ cần CSS @media print trong component
```

---

## ✅ Verification Checklist

### Backend
- [ ] Migration chạy thành công: bảng `waybill` + `waybill_item` được tạo
- [ ] `POST /v1/waybills` Mode 1: tạo đơn + 5 dòng hàng → status DRAFT
- [ ] `POST /v1/waybills` Mode 2: chọn tripId + 2 dòng bổ sung → DRAFT
- [ ] `PATCH /v1/waybills/:id/confirm` → warehouseStatus = PENDING_INBOUND, waybillCode = DDMMYY-xxxx
- [ ] `PATCH /v1/waybills/:id/start-inbound` → INBOUND
- [ ] `PATCH /v1/waybills/:id/complete-inbound` → COMPLETED_INBOUND
- [ ] `POST /v1/waybills/:id/generate-pdf?type=INBOUND_SLIP`:
  - [ ] PDF được tạo thành công
  - [ ] File được upload lên Supabase S3 bucket `logistics-media`
  - [ ] URL được lưu vào `waybill.pdfInboundSlipUrl` trong DB
  - [ ] Response trả về `{ url: "https://...supabase.co/..." }`
  - [ ] URL có thể mở được, tải về PDF đúng nội dung
- [ ] RBAC: `DISPATCHER` → `POST /v1/waybills` → 403

### Frontend
- [ ] Grid 8 cột hiển thị đúng thứ tự
- [ ] Tab key chuyển ô theo đúng thứ tự cột
- [ ] Cột 6 — 3-mode selector hoạt động (Free text / Hub L1 / Hub L2)
- [ ] Mode 2: chọn Trip IN_TRANSIT → auto-fill vehicleInfo + items
- [ ] Timeline Stepper 3 chặng: highlight đúng step theo state
- [ ] Nút "🖨️ In phiếu" → window.print() → in đúng layout phiếu nhập kho
- [ ] Nút "📄 Tạo PDF & Lưu" → loading → nhận URL → hiển thị link tải
- [ ] Nếu PDF đã gen rồi → hiện link sẵn, không gen lại
- [ ] Mobile <640px: Grid → Cargo Cards + Sticky Bottom Bar

---

## 📅 Timeline Sprint

| Sprint | Nội dung | Estimate |
|---|---|---|
| **Sprint 1** | DB Schema + Migration + WaybillModule (7 endpoints) | 1-2 ngày |
| **Sprint 2** | API Layer + WarehouseCreateDialog + WaybillGridInput (Mode 1) | 2-3 ngày |
| **Sprint 3** | Mode 2 (TripSelectionModal) + WaybillDetailSheet + Timeline | 2 ngày |
| **Sprint 4** | PDF Service + S3 Upload + Print View + PDF Button | 1-2 ngày |
| **Sprint 5** | Mobile UX + RBAC Matrix v1.5 | 1 ngày |

**Tổng**: ~7-10 ngày dev

---

> **Branch**: `feature/warehouse-inbound-module` (backend + frontend)
> **Phiên bản plan**: v1.1 (cập nhật Q2: P2, Q3: PDF → S3 Supabase)
> **S3 Bucket**: `logistics-media` tại `https://ykcuwumpelgnfgfyxepg.supabase.co/storage/v1/object/public/logistics-media`
