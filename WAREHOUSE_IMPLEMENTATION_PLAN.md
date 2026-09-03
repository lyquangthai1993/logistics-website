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


---

## 🧪 E2E Test Specification (Dành cho `/e2e-test-runner`)

> **Hướng dẫn**: Sau khi hoàn thành mỗi Sprint, agent `e2e-test-runner` đọc section tương ứng bên dưới, tạo Playwright spec file và chạy theo thứ tự:
> 1. `node scripts/check-servers.mjs` (pre-flight gate)
> 2. Sub-Agent D: `00-runtime-log-tracer.spec.ts`
> 3. Sub-Agent A: `01-console-health.spec.ts`
> 4. Sub-Agent B: `02-login-flow.spec.ts`
> 5. Sub-Agent C: `03-rbac-routing.spec.ts`
> 6. Sub-Agent E: `11-warehouse-table-no-hscroll.spec.ts` (viewport × sidebar)
> 7. Sub-Agent W: `20-warehouse-waybill.spec.ts` ← **spec mới cho Warehouse**
>
> **Test Credentials**:
> - WAREHOUSE_MANAGER: `lyquangthai1993+4@gmail.com` / `secret`
> - DISPATCHER: `lyquangthai1993+2@gmail.com` / `secret`
> - SUPER_ADMIN: `lyquangthai1993+1@gmail.com` / `secret`
> - FLEET_MANAGER: `lyquangthai1993+3@gmail.com` / `secret`

---

### 🧪 Sprint 1 Test Suite — Backend API (WaybillModule)

**Spec file**: `backend/test/waybills.e2e-spec.ts` (NestJS supertest) hoặc qua Playwright API calls  
**Trigger**: Sau khi Sprint 1 hoàn thành (migration chạy xong, server restart)

#### ✅ Happy Path — Tạo đơn Mode 1 (Direct Customer)

| # | Test Case | Input | Expected |
|---|---|---|---|
| W-1.1 | Tạo đơn thành công Mode 1 | POST `/v1/waybills` + mode=DIRECT_CUSTOMER + 3 items | 201, warehouseStatus=DRAFT, id trả về |
| W-1.2 | Confirm đơn → sinh waybillCode | PATCH `/v1/waybills/:id/confirm` | 200, warehouseStatus=PENDING_INBOUND, waybillCode="DDMMYY-xxxx" |
| W-1.3 | waybillCode format đúng | Confirm bất kỳ đơn | waybillCode matches regex `/^\d{6}-\d{4}$/` (VD: `030926-0001`) |
| W-1.4 | Bắt đầu nhập kho | PATCH `/v1/waybills/:id/start-inbound` | 200, warehouseStatus=INBOUND |
| W-1.5 | Hoàn tất nhập kho | PATCH `/v1/waybills/:id/complete-inbound` | 200, warehouseStatus=COMPLETED_INBOUND |
| W-1.6 | Danh sách waybill | GET `/v1/waybills` | 200, array + meta pagination |
| W-1.7 | Chi tiết waybill | GET `/v1/waybills/:id` | 200, trả về items[] đúng số lượng |

#### ✅ Happy Path — Tạo đơn Mode 2 (Hub Transfer)

| # | Test Case | Input | Expected |
|---|---|---|---|
| W-1.8 | Tạo đơn Mode 2 với tripId hợp lệ | POST `/v1/waybills` + mode=HUB_TRANSFER + tripId (IN_TRANSIT) + items | 201, tripId gắn đúng |
| W-1.9 | GET chi tiết Mode 2 | GET `/v1/waybills/:id` | vehicleLicensePlate lấy từ trip đã gán |

#### ❌ Edge Cases — Validation & Business Rules

| # | Edge Case | Input | Expected Error |
|---|---|---|---|
| W-1.E1 | Tạo đơn Mode 2 với tripId không tồn tại | tripId=99999 | 422, message: "Chuyến xe không tồn tại" |
| W-1.E2 | Tạo đơn Mode 2 với trip không IN_TRANSIT | tripId của trip status=PENDING | 422, message: "Chỉ được chọn chuyến xe đang vận chuyển (IN_TRANSIT)" |
| W-1.E3 | Tạo đơn không có items | items=[] | 422, message: "Phiếu nhập kho phải có ít nhất 1 dòng hàng" |
| W-1.E4 | Items thiếu trường bắt buộc | item.goodsDescription="" | 422, message về trường bị thiếu |
| W-1.E5 | Items có weightKg < 0 | item.weightKg=-5 | 422, message: "Số kg phải >= 0" |
| W-1.E6 | Items có volumeM3 < 0 | item.volumeM3=-1 | 422 |
| W-1.E7 | Items có quantity < 1 | item.quantity=0 | 422, message: "Số thùng/kiện phải >= 1" |
| W-1.E8 | Confirm đơn không phải DRAFT | Confirm đơn đang INBOUND | 422, message: "Chỉ xác nhận được đơn ở trạng thái DRAFT" |
| W-1.E9 | start-inbound khi không phải PENDING_INBOUND | start-inbound trên DRAFT | 422, message về sai trạng thái |
| W-1.E10 | complete-inbound khi không phải INBOUND | complete-inbound trên PENDING_INBOUND | 422 |
| W-1.E11 | Xóa đơn không phải DRAFT | DELETE đơn INBOUND | 422, message: "Chỉ xóa được đơn nháp (DRAFT)" |
| W-1.E12 | Xóa đơn đã xóa (soft-delete lần 2) | DELETE id đã xóa | 404 |
| W-1.E13 | Mode 1 thiếu vehicleLicensePlate | mode=DIRECT_CUSTOMER + vehicleLicensePlate=null | Tuỳ quyết định: 422 hoặc pass (tư vấn: nên required) |
| W-1.E14 | HubId không tồn tại | hubId=99999 | 422, message: "Hub không tồn tại" |
| W-1.E15 | deliveryMode=HUB_L1 nhưng deliveryHubId null | item.deliveryMode=HUB_L1, deliveryHubId=null | 422 |

#### 🔐 RBAC Edge Cases — Phân Quyền

| # | Role | Endpoint | Expected |
|---|---|---|---|
| W-1.R1 | DISPATCHER | POST `/v1/waybills` | 403 Forbidden |
| W-1.R2 | FLEET_MANAGER | POST `/v1/waybills` | 403 Forbidden |
| W-1.R3 | DISPATCHER | PATCH `/v1/waybills/:id/confirm` | 403 |
| W-1.R4 | FLEET_MANAGER | DELETE `/v1/waybills/:id` | 403 |
| W-1.R5 | Unauthenticated | GET `/v1/waybills` | 401 |
| W-1.R6 | WAREHOUSE_MANAGER Hub A | GET `/v1/waybills` (waybill của Hub B) | 200 nhưng data rỗng (Hub Scoping) |
| W-1.R7 | SUPER_ADMIN | Toàn bộ endpoints | 200/201 (toàn quyền) |

---

### 🧪 Sprint 2 Test Suite — Frontend: Form Grid Mode 1

**Spec file**: `frontend/e2e/20-warehouse-waybill.spec.ts`  
**Trigger**: Sau khi Sprint 2 hoàn thành (WarehouseCreateDialog + WaybillGridInput live)  
**Login as**: WAREHOUSE_MANAGER

#### ✅ Happy Path — UI Interactions

| # | Test Case | Playwright Action | Expected |
|---|---|---|---|
| W-2.1 | Warehouse page load | Navigate `/dashboard/warehouse` | Page render, title "Inbound Hub & Kho Tiếp Nhận" |
| W-2.2 | Mở dialog tạo đơn | Click `[data-testid="btn-create-waybill"]` | Dialog mở, Tab "Mới hoàn toàn" active mặc định |
| W-2.3 | Tab Mode 1 active | Dialog mở | Header form xe/tài xế hiển thị, grid 8 cột hiển thị |
| W-2.4 | Thêm dòng hàng | Click `[data-testid="btn-add-row"]` | 1 dòng mới xuất hiện cuối grid |
| W-2.5 | Tab key navigation | Điền ô đầu → Tab liên tục | Focus chuyển đúng thứ tự: Mã đơn → Địa chỉ nhận → Tên hàng → Thùng → Kg → m³ → Địa chỉ giao → Ghi chú → [row mới] |
| W-2.6 | Cột Địa chỉ giao — Free text | Click Segmented "Địa chỉ tự do" | Hiện text input, user nhập được |
| W-2.7 | Cột Địa chỉ giao — Hub L1 | Click Segmented "Hub cấp 1" | Hiện dropdown danh sách Hub |
| W-2.8 | Cột Địa chỉ giao — Hub L2 | Click Segmented "Hub cấp 2 / Xe bo" | Hiện dropdown danh sách xe bo/tuyến vệ tinh |
| W-2.9 | Nhân bản dòng | Click icon ⧉ trên dòng 1 | Dòng 2 xuất hiện với data y hệt dòng 1 |
| W-2.10 | Xóa dòng | Click icon 🗑 trên dòng | Dòng bị xóa, STT tự cập nhật |
| W-2.11 | Submit Mode 1 hợp lệ | Điền đủ fields + 2 dòng hàng → Click "Xác nhận đơn" | Toast success, dialog đóng, waybill mới xuất hiện trong bảng |
| W-2.12 | Chuyển Tab Mode 2 | Click Tab "Luân chuyển nội bộ" | TripSearchBar xuất hiện, header xe/tài xế ẩn đi |

#### ❌ Edge Cases — UI Validation

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-2.E1 | Submit khi không có dòng hàng | Click "Xác nhận đơn" với grid trống | Toast error: "Phải có ít nhất 1 dòng hàng" |
| W-2.E2 | Submit khi Mã đơn trống | Để trống cột "Mã đơn hàng" | Highlight ô lỗi màu đỏ, message bắt buộc |
| W-2.E3 | Submit khi Tên hàng trống | Để trống cột "Tên hàng" | Highlight ô lỗi |
| W-2.E4 | Submit khi Số kg = 0 và Số m³ = 0 | Nhập 0 vào cả 2 cột | 422 từ API, toast error rõ ràng |
| W-2.E5 | Số lượng âm | Nhập -1 vào cột "Số thùng" | UI block hoặc validation error |
| W-2.E6 | Địa chỉ giao HUB_L1 nhưng không chọn Hub | Chọn mode HUB_L1, không chọn từ dropdown | Toast/inline error: "Vui lòng chọn Hub" |
| W-2.E7 | Mode 1 thiếu thông tin xe | Không điền vehicleLicensePlate → Submit | Validation error trên field xe (nếu bắt buộc) |
| W-2.E8 | Lỗi API 422 từ server | Server trả về lỗi | Toast hiển thị message tiếng Việt, KHÔNG hiển thị raw key kỹ thuật |
| W-2.E9 | Network timeout | API không phản hồi 30s | Loading spinner → Toast error timeout, nút không bị disabled vĩnh viễn |
| W-2.E10 | Đóng dialog giữa chừng | Click X khi đang nhập | Confirm dialog "Bạn có chắc muốn thoát? Dữ liệu chưa lưu sẽ mất." |
| W-2.E11 | Lưu nháp | Click "Lưu nháp" | POST tạo đơn status=DRAFT, toast "Đã lưu nháp", dialog đóng |

#### 📐 Viewport & Table UX (Sub-Agent E)

**File**: `frontend/e2e/11-warehouse-table-no-hscroll.spec.ts`

| Breakpoint | Sidebar | Kiểm tra |
|---|---|---|
| 1024px | Expanded (256px) | body.scrollWidth <= 1024, table container scrolls horizontally |
| 1024px | Collapsed (48px) | body không overflow, table readable |
| 1280px | Expanded | Waybill columns không bị truncated, action buttons accessible |
| 1440px | Expanded/Collapsed | Full layout clean, cột "Thao tác" không bị clip |

```typescript
// Kiểm tra bắt buộc:
const bodyOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
expect(bodyOverflow).toBe(false); // ❌ FAIL nếu true

const tableViewport = page.locator('[data-slot="scroll-area-viewport"]');
const canScroll = await page.evaluate(() => {
  const el = document.querySelector('[data-slot="scroll-area-viewport"]');
  return el ? el.scrollWidth > el.clientWidth : false;
});
// Khi có nhiều cột waybill: expect(canScroll).toBe(true)
```

---

### 🧪 Sprint 3 Test Suite — Mode 2 + Detail Sheet + Timeline

**Spec file**: `frontend/e2e/20-warehouse-waybill.spec.ts` (bổ sung thêm)  
**Trigger**: Sau Sprint 3 hoàn thành

#### ✅ Happy Path — Mode 2 (Hub Transfer)

| # | Test Case | Playwright Action | Expected |
|---|---|---|---|
| W-3.1 | Mở Tab Mode 2 | Click Tab "Luân chuyển nội bộ" | TripSearchBar hiện, vehicle info section ẩn |
| W-3.2 | Search Trip IN_TRANSIT | Nhập mã trip/biển số vào search bar | Dropdown hiện danh sách trips matching |
| W-3.3 | Chọn Trip → Modal đơn hàng | Click vào trip trong kết quả | Modal hiện danh sách đơn hàng thuộc trip |
| W-3.4 | Chọn tất cả đơn | Click "Chọn tất cả" | Tất cả checkboxes checked |
| W-3.5 | Confirm chọn đơn | Click "Xác nhận" trong modal | Modal đóng, grid được auto-fill với items từ trip |
| W-3.6 | VehicleInfo auto-fill | Sau chọn trip | Biển số xe + Tài xế hiển thị readonly, không chỉnh sửa được |
| W-3.7 | Thêm hàng bổ sung | Click "+ Thêm hàng nhận bổ sung" | Dòng trống mới xuất hiện cuối grid, có thể edit |
| W-3.8 | Submit Mode 2 | Điền xong → "Xác nhận đơn" | 201, tripId đúng, items đủ |
| W-3.9 | Mở Detail Sheet | Click vào waybill trong bảng | Sheet mở, hiện waybillCode + status + Timeline |
| W-3.10 | Timeline Stepper DRAFT | Status DRAFT | Step 1 active chờ, Step 2 & 3 grey |
| W-3.11 | Timeline Stepper PENDING_INBOUND | Status PENDING_INBOUND | Step 1 "Đang chờ nhập" highlight |
| W-3.12 | Timeline Stepper INBOUND | Status INBOUND | Step 1 pulse animation (đang xử lý) |
| W-3.13 | Timeline Stepper COMPLETED_INBOUND | Status COMPLETED_INBOUND | Step 1 checkmark ✓, Step 2 ready |
| W-3.14 | Action buttons DRAFT | Open DRAFT waybill | Hiện [Chỉnh sửa] [Xóa] [Xác nhận đơn →] |
| W-3.15 | Action buttons PENDING_INBOUND | Open PENDING_INBOUND waybill | Hiện [Bắt đầu nhập kho] [In phiếu] [Hủy] — KHÔNG hiện [Xóa] |
| W-3.16 | Action buttons INBOUND | Open INBOUND waybill | Hiện [Ghi nhận bất thường] [Hoàn tất nhập kho ✓] |
| W-3.17 | Action buttons COMPLETED_INBOUND | Open COMPLETED_INBOUND waybill | Hiện [Tạo kế hoạch xuất] [Điều chuyển Hub] [Bàn giao đi giao] |

#### ❌ Edge Cases — Mode 2 & Detail

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-3.E1 | Search Trip không IN_TRANSIT | Nhập tripId của trip PENDING | Kết quả rỗng, message "Không tìm thấy chuyến xe đang vận chuyển" |
| W-3.E2 | Search Trip của Hub khác | Trip destinationHub ≠ currentUser.hubId | Không hiển thị trong kết quả (hub scoping) |
| W-3.E3 | Submit Mode 2 không chọn trip | Không search/chọn trip → Submit | Validation: "Vui lòng chọn chuyến xe" |
| W-3.E4 | Submit Mode 2 không chọn đơn nào trong modal | Click "Xác nhận" modal khi 0 checkbox | Modal giữ nguyên, message "Chọn ít nhất 1 đơn hàng" |
| W-3.E5 | Xóa tất cả dòng hàng rồi submit | Xóa hết + Submit | Validation: "Phải có ít nhất 1 dòng hàng" |
| W-3.E6 | Action button sai state | DISPATCHER thấy detail waybill | Nút write actions (Xác nhận, Bắt đầu nhập...) bị ẩn, chỉ xem |
| W-3.E7 | Bấm "Xóa" DRAFT trong detail | Confirm xóa | Confirm dialog → xóa → redirect về danh sách |
| W-3.E8 | Bấm "Hủy đơn" PENDING_INBOUND | Confirm hủy | Waybill bị soft-delete, disappear khỏi list |
| W-3.E9 | Detail waybill không tồn tại | Navigate /dashboard/warehouse?id=99999 | 404 message, redirect về list |
| W-3.E10 | Items trong detail hiển thị đủ 8 cột | Mở detail waybill 5 items | Tất cả 5 rows hiển thị đủ: mã đơn, tên hàng, thùng, kg, m³, địa chỉ giao |

---

### 🧪 Sprint 4 Test Suite — PDF Generation + S3

**Spec file**: `frontend/e2e/21-warehouse-pdf.spec.ts`  
**Trigger**: Sau Sprint 4 hoàn thành

#### ✅ Happy Path — PDF Gen & S3

| # | Test Case | Action | Expected |
|---|---|---|---|
| W-4.1 | Gen PDF Phiếu Nhập Kho | POST `/v1/waybills/:id/generate-pdf?type=INBOUND_SLIP` | 200, response có `{ url: "https://...supabase.co/...pdf" }` |
| W-4.2 | URL trả về hợp lệ | Kiểm tra URL trong response | URL starts with `AWS_S3_PUBLIC_URL`, ends with `.pdf` |
| W-4.3 | PDF tồn tại trên S3 | GET request đến URL trả về | HTTP 200, Content-Type: application/pdf |
| W-4.4 | URL được lưu vào DB | GET `/v1/waybills/:id` sau khi gen | Field `pdfInboundSlipUrl` ≠ null |
| W-4.5 | Gen lại → URL mới | Gọi lại endpoint | URL mới (timestamp mới), DB cập nhật, file cũ có thể vẫn tồn tại trên S3 |
| W-4.6 | Gen đủ 4 loại phiếu | type=OUTBOUND_SLIP, DELIVERY_NOTE, CARGO_LABEL | 4 URL riêng biệt, 4 cột DB được cập nhật |
| W-4.7 | Frontend: Nút "Tạo PDF & Lưu" | Click trong WaybillDetailSheet | Loading spinner → Toast "PDF đã được tạo" → Hiện link "Tải PDF ↓" |
| W-4.8 | Frontend: Link PDF hoạt động | Click "Tải PDF ↓" | Mở tab mới với URL Supabase S3, PDF tải được |
| W-4.9 | PDF đã có → hiện link sẵn | Mở detail waybill đã gen PDF | Nút "Tải PDF ↓" hiện ngay, KHÔNG cần gen lại |
| W-4.10 | PDF chứa nội dung đúng | Tải PDF về | Text: waybillCode, tên hub, ngày, items table, "Thủ kho" ký tên |

#### ❌ Edge Cases — PDF

| # | Edge Case | Action | Expected |
|---|---|---|---|
| W-4.E1 | Gen PDF cho waybill DRAFT | POST generate-pdf khi status=DRAFT | 422, message: "Chỉ tạo phiếu sau khi đơn đã được xác nhận (PENDING_INBOUND trở lên)" |
| W-4.E2 | Gen PDF không hợp lệ type | type=INVALID_TYPE | 422 / 400 |
| W-4.E3 | DISPATCHER gọi gen PDF | POST generate-pdf với DISPATCHER token | 403 Forbidden |
| W-4.E4 | Puppeteer/html-pdf fail | Server lỗi render HTML | 500 với message rõ, KHÔNG để crash unhandled |
| W-4.E5 | S3 upload timeout | Giả lập S3 không phản hồi | 500 + message, waybill record KHÔNG bị cập nhật URL rác |
| W-4.E6 | Gen PDF waybill không tồn tại | generate-pdf/:id=99999 | 404 |
| W-4.E7 | Frontend: S3 URL không mở được | URL expire hoặc bucket private | Toast error: "Không thể tải file PDF. Vui lòng thử tạo lại." |
| W-4.E8 | WaybillCode null khi gen PDF | Waybill chưa confirm | 422, waybillCode là null — phiếu nhập kho cần mã |

#### 🖨️ Print View Test (Sub-Agent A — Console Health)

| # | Test | Expected |
|---|---|---|
| W-4.P1 | Mở Print Preview | Click "🖨️ In phiếu" trong detail | Print preview dialog mở, không có JS error trên console |
| W-4.P2 | Print CSS áp dụng | `@media print` | Sidebar, navbar, buttons bị ẩn; chỉ hiện nội dung phiếu |
| W-4.P3 | WaybillCode trên phiếu | In phiếu nhập kho | WaybillCode format DDMMYY-xxxx hiển thị rõ |
| W-4.P4 | 2 ô ký trên Phiếu Nhập Kho | Xem print preview | Có "Thủ kho nhận hàng (Ký tên)" và "Lái xe / Người giao (Ký tên)" |
| W-4.P5 | Tem Nhận Diện format | In tem | Format: `... / [Tổng kiện]` đúng (VD: `... / 50 kiện`) |

---

### 🧪 Sprint 5 Test Suite — Mobile UX + RBAC

**Spec file**: `frontend/e2e/11-warehouse-table-no-hscroll.spec.ts` (bổ sung mobile breakpoints)  
**Trigger**: Sau Sprint 5

#### 📱 Mobile UX — Viewport < 640px

| # | Test Case | Viewport | Expected |
|---|---|---|---|
| W-5.M1 | Grid → Cargo Cards | 375px (iPhone SE) | WaybillGridInput chuyển sang Cargo Item Cards xếp dọc |
| W-5.M2 | Cards hiển thị đủ thông tin | 375px | Mỗi card: orderCode, goodsDescription, qty/kg/m³, địa chỉ giao |
| W-5.M3 | Sticky Bottom Bar | 375px + scroll xuống | Nút "Xác nhận đơn" vẫn visible ở cuối màn hình |
| W-5.M4 | Touch target size | 375px | Tất cả buttons/tabs height ≥ 44px (check via `getBoundingClientRect`) |
| W-5.M5 | Không có horizontal overflow | 375px | body.scrollWidth <= 375 |
| W-5.M6 | Xóa Card trên mobile | 375px + Click 🗑 trên card | Card bị xóa, danh sách cập nhật |
| W-5.M7 | Form mode 1 mobile | 375px | Header fields (biển số, tài xế...) hiển thị dạng stack dọc |

#### 🔐 RBAC Route Guard (Sub-Agent C bổ sung)

| # | Role | Route | Expected |
|---|---|---|---|
| W-5.R1 | DISPATCHER | Navigate `/dashboard/warehouse` | Redirect `/dashboard/overview` (403 guard) |
| W-5.R2 | FLEET_MANAGER | Navigate `/dashboard/warehouse` | Redirect `/dashboard/overview` |
| W-5.R3 | WAREHOUSE_MANAGER | Navigate `/dashboard/warehouse` | ✅ Render bình thường |
| W-5.R4 | SUPER_ADMIN | Navigate `/dashboard/warehouse` | ✅ Render bình thường |
| W-5.R5 | WAREHOUSE_MANAGER | Navigate `/dashboard/orders` | ✅ Render (read-only) — theo RBAC matrix |
| W-5.R6 | WAREHOUSE_MANAGER | Sidebar menu | Chỉ thấy "Inbound Kho", KHÔNG thấy "Lệnh điều vận", "Phân công xe", "Quản lý đội xe" |

---

### 🧪 Regression Test Suite — Toàn Hệ Thống

**Spec file**: `frontend/e2e/03-rbac-routing.spec.ts` (cập nhật thêm warehouse routes)  
**Trigger**: Sau khi merge feature branch về `dev`

#### Cross-Module Regression

| # | Test Case | Expected |
|---|---|---|
| R-1 | Orders page vẫn hoạt động sau khi add WaybillModule | `/dashboard/orders` render đúng, không có JS error |
| R-2 | Trips page vẫn hoạt động | `/dashboard/trips` render đúng |
| R-3 | Fleet page không ảnh hưởng | `/dashboard/fleet` OK |
| R-4 | Notifications vẫn nhận được | Tạo waybill → không crash notification service |
| R-5 | DB: bảng `order` không bị thay đổi cột | Migration chỉ tạo bảng mới, không ALTER order table |
| R-6 | S3 bucket `logistics-media` vẫn upload ảnh user profile | Files module không bị break |
| R-7 | Trips GET với filter mới không break client cũ | `GET /v1/trips` không có `destinationHubId` vẫn trả về đúng |
| R-8 | Console Health toàn trang | Sub-Agent A scan tất cả pages, 0 JS error mới |

---

### 📋 Test Data Setup (Seed Data cho E2E)

Trước khi chạy E2E, cần đảm bảo DB có:

```
1. WAREHOUSE_MANAGER user (lyquangthai1993+4@gmail.com) được gán vào Hub ID = 1
2. Ít nhất 1 Trip đang IN_TRANSIT có destinationHubId = 1
3. Hubs: Hub cấp 1 (VD: Hub Hà Nội id=1, Hub HCM id=2)
4. Hubs cấp 2 / Xe bo: ít nhất 2 satellite hubs
```

```typescript
// Trong auth.ts helper:
export const TEST_USERS = {
  SUPER_ADMIN:       { email: 'lyquangthai1993+1@gmail.com', password: 'secret' },
  DISPATCHER:        { email: 'lyquangthai1993+2@gmail.com', password: 'secret' },
  FLEET_MANAGER:     { email: 'lyquangthai1993+3@gmail.com', password: 'secret' },
  WAREHOUSE_MANAGER: { email: 'lyquangthai1993+4@gmail.com', password: 'secret' },
};
```

---

## 🛡️ Dual-Layer Validation Strategy (FE + BE)

> **Nguyên tắc**: Mọi field đều được validate 2 lớp:
> - **Layer 1 — Frontend (Zod v4 + react-hook-form)**: Validate ngay lập tức trên UI, không cần round-trip mạng. Hiện lỗi inline tại ô nhập liệu.
> - **Layer 2 — Backend (class-validator NestJS)**: Validate lại server-side trước khi ghi DB. Trả về 422 với message tiếng Việt.
>
> **Stack FE xác nhận**: Frontend đang dùng `zod ^4.3.6`. Dùng Zod (KHÔNG dùng Yup) để nhất quán với codebase.
> **Form management**: Dùng `react-hook-form` + `@hookform/resolvers/zod` cho `WarehouseCreateDialog`.

---

### 📦 Zod Schema — Header Form (Waybill)

```typescript
// frontend/src/features/warehouse/schemas/waybill.schema.ts
import { z } from 'zod';

// ─── Schema cho 1 dòng hàng (WaybillItem) ───────────────────────────────────
export const waybillItemSchema = z.object({
  orderCode: z
    .string()
    .min(1, 'Mã đơn hàng không được để trống')
    .max(50, 'Mã đơn hàng tối đa 50 ký tự'),

  pickupAddress: z
    .string()
    .min(1, 'Địa chỉ nhận hàng không được để trống')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),

  goodsDescription: z
    .string()
    .min(1, 'Tên hàng không được để trống')
    .max(500, 'Tên hàng tối đa 500 ký tự')
    .refine(
      (val) => !val.match(/SKU|barcode|mã vạch/i),
      'Tên hàng không được chứa mã SKU/barcode — mô tả tổng quan mặt hàng',
    ),

  quantity: z
    .number({ invalid_type_error: 'Số thùng phải là số' })
    .int('Số thùng phải là số nguyên')
    .min(1, 'Số thùng/kiện phải ít nhất là 1'),

  weightKg: z
    .number({ invalid_type_error: 'Số kg phải là số' })
    .min(0, 'Số kg không được âm')
    .max(999999, 'Số kg quá lớn'),

  volumeM3: z
    .number({ invalid_type_error: 'Số m³ phải là số' })
    .min(0, 'Số m³ không được âm')
    .max(99999, 'Số m³ quá lớn'),

  // Địa chỉ giao hàng — 3-mode
  deliveryMode: z.enum(['FREE_TEXT', 'HUB_L1', 'HUB_L2_SAT'], {
    errorMap: () => ({ message: 'Vui lòng chọn phương thức địa chỉ giao hàng' }),
  }),

  deliveryAddress: z.string().max(255).nullable().optional(),

  deliveryHubId: z.number().int().positive().nullable().optional(),

  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
}).superRefine((item, ctx) => {
  // Cross-field: nếu deliveryMode = FREE_TEXT thì deliveryAddress bắt buộc
  if (item.deliveryMode === 'FREE_TEXT' && !item.deliveryAddress?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deliveryAddress'],
      message: 'Vui lòng nhập địa chỉ giao hàng',
    });
  }
  // Cross-field: nếu deliveryMode = HUB_L1 / HUB_L2_SAT thì deliveryHubId bắt buộc
  if ((item.deliveryMode === 'HUB_L1' || item.deliveryMode === 'HUB_L2_SAT') && !item.deliveryHubId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deliveryHubId'],
      message: 'Vui lòng chọn Hub/Tuyến vệ tinh từ danh sách',
    });
  }
  // Cảnh báo: cả weightKg và volumeM3 đều = 0
  if (item.weightKg === 0 && item.volumeM3 === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['weightKg'],
      message: 'Số kg và Số m³ không thể đồng thời bằng 0',
    });
  }
});

// ─── Schema Mode 1: Direct Customer ─────────────────────────────────────────
export const waybillMode1Schema = z.object({
  mode: z.literal('DIRECT_CUSTOMER'),

  vehicleLicensePlate: z
    .string()
    .min(1, 'Biển số xe không được để trống')
    .max(20, 'Biển số xe tối đa 20 ký tự')
    .regex(/^[A-Z0-9\-\.]+$/i, 'Biển số xe không hợp lệ'),

  driverName: z
    .string()
    .min(1, 'Tên tài xế không được để trống')
    .max(100, 'Tên tài xế tối đa 100 ký tự'),

  driverPhone: z
    .string()
    .min(9, 'Số điện thoại tối thiểu 9 số')
    .max(15, 'Số điện thoại tối đa 15 số')
    .regex(/^[0-9\+\-\s]+$/, 'Số điện thoại không hợp lệ'),

  subContractor: z
    .string()
    .max(200, 'Tên nhà thầu tối đa 200 ký tự')
    .optional(),

  pickupAddress: z
    .string()
    .min(1, 'Địa chỉ nhận hàng không được để trống')
    .max(500),

  notes: z.string().max(1000).optional(),

  items: z
    .array(waybillItemSchema)
    .min(1, 'Phiếu nhập kho phải có ít nhất 1 dòng hàng')
    .max(200, 'Tối đa 200 dòng hàng mỗi phiếu'),
});

// ─── Schema Mode 2: Hub Transfer ─────────────────────────────────────────────
export const waybillMode2Schema = z.object({
  mode: z.literal('HUB_TRANSFER'),

  tripId: z
    .number({ required_error: 'Vui lòng chọn chuyến xe' })
    .int()
    .positive('ID chuyến xe không hợp lệ'),

  // vehicleLicensePlate / driverName / driverPhone / pickupAddress: readonly, auto-fill từ Trip
  // Không cần validate trên FE vì server tự lấy từ tripId

  notes: z.string().max(1000).optional(),

  items: z
    .array(waybillItemSchema)
    .min(1, 'Phiếu nhập kho phải có ít nhất 1 dòng hàng')
    .max(200, 'Tối đa 200 dòng hàng mỗi phiếu'),
});

// ─── Union schema cho cả 2 mode ─────────────────────────────────────────────
export const createWaybillSchema = z.discriminatedUnion('mode', [
  waybillMode1Schema,
  waybillMode2Schema,
]);

export type CreateWaybillFormData = z.infer<typeof createWaybillSchema>;
export type WaybillItemFormData  = z.infer<typeof waybillItemSchema>;
```

---

### ⚙️ react-hook-form Integration

```typescript
// Trong warehouse-create-dialog.tsx
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWaybillSchema, type CreateWaybillFormData } from '../schemas/waybill.schema';

export function WarehouseCreateDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState<'DIRECT_CUSTOMER' | 'HUB_TRANSFER'>('DIRECT_CUSTOMER');

  const form = useForm<CreateWaybillFormData>({
    resolver: zodResolver(createWaybillSchema),
    defaultValues: {
      mode: 'DIRECT_CUSTOMER',
      vehicleLicensePlate: '',
      driverName: '',
      driverPhone: '',
      subContractor: '',
      pickupAddress: '',
      notes: '',
      items: [defaultItem()],  // 1 dòng trống mặc định
    },
    mode: 'onChange',          // Validate realtime khi user gõ
  });

  // FieldArray cho Grid items
  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Khi chuyển Tab mode, reset form với defaultValues tương ứng
  const handleModeChange = (newMode: 'DIRECT_CUSTOMER' | 'HUB_TRANSFER') => {
    setMode(newMode);
    form.reset({
      mode: newMode,
      items: [defaultItem()],
      ...(newMode === 'HUB_TRANSFER' ? { tripId: undefined } : {}),
    });
  };

  const onSubmit = async (data: CreateWaybillFormData) => {
    try {
      await createWaybillMutation.mutateAsync(data);
      toast.success('Đã tạo phiếu nhập kho thành công');
      onOpenChange(false);
    } catch (err) {
      // Layer 2: Server validation errors → hiện toast tiếng Việt
      const message = formatApiError(err);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... form UI ... */}
    </form>
  );
}
```

---

### 🎨 Inline Error Display Pattern cho Grid

Grid WaybillGridInput khác với form thông thường — mỗi cell có thể có lỗi riêng. Dùng pattern:

```typescript
// Trong WaybillGridInput — hiển thị lỗi inline tại ô
function GridCell({ name, rowIndex, register, errors }) {
  const error = errors?.items?.[rowIndex]?.[name];
  return (
    <td>
      <div className="relative">
        <input
          {...register(`items.${rowIndex}.${name}`)}
          className={cn(
            "w-full h-8 px-2 text-xs border rounded focus:ring-1",
            error
              ? "border-destructive bg-destructive/5 focus:ring-destructive"  // ❌ đỏ
              : "border-border focus:ring-primary"                             // normal
          )}
        />
        {error && (
          <Tooltip content={error.message}>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-destructive">
              <IconAlertCircle size={14} />
            </span>
          </Tooltip>
        )}
      </div>
    </td>
  );
}
```

---

### 🗂️ Validation Rules Matrix — FE vs BE

| Field | FE Rule (Zod) | BE Rule (class-validator) | Error Message |
|---|---|---|---|
| **Header — Mode 1** | | | |
| `vehicleLicensePlate` | required, min 1, max 20, regex biển số | `@IsNotEmpty @IsString @MaxLength(20)` | "Biển số xe không được để trống" |
| `driverName` | required, min 1, max 100 | `@IsNotEmpty @IsString @MaxLength(100)` | "Tên tài xế không được để trống" |
| `driverPhone` | regex số điện thoại, 9-15 ký tự | `@Matches(/^[0-9+\-\s]+$/)` | "Số điện thoại không hợp lệ" |
| `pickupAddress` | required, max 500 | `@IsNotEmpty @IsString` | "Địa chỉ nhận hàng không được để trống" |
| **Header — Mode 2** | | | |
| `tripId` | required, integer, positive | `@IsInt @IsPositive` | "Vui lòng chọn chuyến xe" |
| `tripId` (BE cross) | — | Trip phải tồn tại + status = IN_TRANSIT | "Chỉ được chọn chuyến xe đang vận chuyển" |
| **Items (mỗi dòng)** | | | |
| `orderCode` | required, max 50 | `@IsNotEmpty @IsString @MaxLength(50)` | "Mã đơn hàng không được để trống" |
| `pickupAddress` | required, max 255 | `@IsNotEmpty @IsString` | "Địa chỉ nhận hàng không được để trống" |
| `goodsDescription` | required, max 500, no-SKU regex warn | `@IsNotEmpty @IsString` | "Tên hàng không được để trống" |
| `quantity` | integer, min 1 | `@IsInt @Min(1)` | "Số thùng/kiện phải ít nhất là 1" |
| `weightKg` | number, min 0 | `@IsNumber @Min(0)` | "Số kg không được âm" |
| `volumeM3` | number, min 0 | `@IsNumber @Min(0)` | "Số m³ không được âm" |
| `weightKg + volumeM3` | superRefine: không đồng thời = 0 | BE: `@ValidateIf` cross-check | "Số kg và Số m³ không thể đồng thời bằng 0" |
| `deliveryMode` | enum('FREE_TEXT','HUB_L1','HUB_L2_SAT') | `@IsIn([...])` | "Vui lòng chọn phương thức địa chỉ giao" |
| `deliveryAddress` | required nếu FREE_TEXT (superRefine) | `@ValidateIf(o => o.deliveryMode === 'FREE_TEXT') @IsNotEmpty` | "Vui lòng nhập địa chỉ giao hàng" |
| `deliveryHubId` | required nếu HUB_L1/HUB_L2_SAT | `@ValidateIf(o => o.deliveryMode !== 'FREE_TEXT') @IsInt @IsPositive` | "Vui lòng chọn Hub từ danh sách" |
| **Toàn bộ items** | | | |
| `items[]` | min 1 item | Array length >= 1 check trong service | "Phiếu nhập kho phải có ít nhất 1 dòng hàng" |
| `items[]` | max 200 items | Max check trong service | "Tối đa 200 dòng hàng mỗi phiếu" |

---

### 🧪 E2E Test Cases — FE Validation (Zod Layer)

**Bổ sung vào Sprint 2 Test Suite** — test riêng phần Zod validation không cần gọi API:

| # | Test Case | Action | Expected (FE only, trước khi submit) |
|---|---|---|---|
| Z-1 | Lỗi hiện inline ngay khi blur ô trống | Focus "Mã đơn" → blur | Border đỏ + tooltip "Mã đơn hàng không được để trống" |
| Z-2 | Số thùng nhập 0 | Input quantity=0 → blur | Lỗi inline "Số thùng/kiện phải ít nhất là 1" |
| Z-3 | Số thùng nhập số âm | Input quantity=-1 | Input bị revert hoặc lỗi inline |
| Z-4 | Số thùng nhập chữ | Input quantity="abc" | Input block nhập hoặc lỗi "Số thùng phải là số" |
| Z-5 | weightKg=0 và volumeM3=0 cùng lúc | Nhập cả 2 = 0 | Lỗi cross-field: "Số kg và Số m³ không thể đồng thời bằng 0" |
| Z-6 | deliveryMode=HUB_L1, không chọn hub | Chọn HUB_L1, bỏ trống dropdown → blur | Lỗi "Vui lòng chọn Hub từ danh sách" |
| Z-7 | deliveryMode=FREE_TEXT, không nhập | Chọn FREE_TEXT, bỏ trống input → blur | Lỗi "Vui lòng nhập địa chỉ giao hàng" |
| Z-8 | Biển số xe định dạng sai | Nhập "123@##!!" → blur | Lỗi "Biển số xe không hợp lệ" |
| Z-9 | SĐT tài xế quá ngắn | Nhập "012" → blur | Lỗi "Số điện thoại tối thiểu 9 số" |
| Z-10 | Submit khi còn lỗi | Click "Xác nhận đơn" khi form invalid | Nút không gọi API, scroll đến ô lỗi đầu tiên |
| Z-11 | Mode 2: không chọn tripId | Switch sang Tab Mode 2, không chọn trip → Submit | Lỗi "Vui lòng chọn chuyến xe" hiển thị trên TripSearchBar |
| Z-12 | Form hợp lệ → nút Submit enabled | Điền đủ tất cả required fields | Nút "Xác nhận đơn" không bị disabled, cho phép click |
| Z-13 | Lỗi FE cleared khi fix | Sửa ô đang lỗi → nhập giá trị hợp lệ | Lỗi inline biến mất ngay lập tức (mode: onChange) |
| Z-14 | Error count badge | Có 3 ô lỗi trong grid | Hiện badge "3 lỗi cần sửa" trên footer hoặc header |

---

### 📁 Files Bổ Sung (Validation Layer)

```
frontend/src/features/warehouse/
└── schemas/
    └── waybill.schema.ts     [NEW] Zod schemas: waybillItemSchema, waybillMode1Schema, waybillMode2Schema, createWaybillSchema
```

**Package cần cài** (nếu chưa có):
```bash
cd frontend
npm install react-hook-form @hookform/resolvers
# zod đã có sẵn (^4.3.6) ✅
```