# 📐 QUY CHUẨN ĐỊNH DẠNG API RESPONSE & ERROR HANDLING

> **Dự án**: Logistics TMS (Fullstack System)  
> **Phiên bản chuẩn hóa**: v1.0.0  
> **Áp dụng cho**: NestJS Backend 11+ & Next.js 15+ Frontend (App Router)

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống Logistics TMS áp dụng mô hình **Unified Envelope Pattern** (Đóng gói phản hồi chuẩn hóa toàn hệ thống) thông qua 2 thành phần cốt lõi tại Backend NestJS:

1. **`ResponseTransformInterceptor`** (`src/common/interceptors/response-transform.interceptor.ts`): Bọc tất cả dữ liệu trả về từ Controllers thành cấu trúc JSON chuẩn có `statusCode`, `message`, `data`, `meta` (nếu có phân trang), và `timestamp`.
2. **`GlobalExceptionFilter`** (`src/common/filters/global-exception.filter.ts`): Bắt tất cả ngoại lệ (`HttpException`, `UnprocessableEntityException`, runtime errors) và định dạng thành cấu trúc JSON lỗi có `statusCode`, `message`, `errors`, `timestamp`, và `path`.

---

## 2. Chuẩn Phản Hồi Thành Công (Success Response Standard)

### 2.1. Cấu trúc TypeScript Interface

```typescript
export interface PaginatedMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ApiResponse<T = any> {
  statusCode: number;   // HTTP status code (200, 201)
  message: string;       // "Success" hoặc thông điệp tùy biến
  data: T;               // Dữ liệu chính (Object, Array, Primitive)
  meta?: PaginatedMeta;  // Thông tin phân trang (khi có)
  silent?: boolean;      // Khi true: tác vụ chạy ngầm, FE không hiển thị toast thông báo thành công
  timestamp: string;     // Chuỗi ISO 8601 (VD: "2026-08-20T07:30:00.000Z")
}
```

---

### 2.2. Các Trường Hợp Cụ Thể

#### Trường hợp A: Trả về một đối tượng đơn lẻ (Single Entity / Action Result)
**Endpoint**: `GET /api/v1/orders/1` hoặc `POST /api/v1/orders`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "orderCode": "NDA0826-001",
    "customerName": "Công ty TNHH Vận Tải ABC",
    "status": "PENDING",
    "totalWeight": 1500,
    "totalVolume": 4.5,
    "createdAt": "2026-08-20T07:00:00.000Z",
    "updatedAt": "2026-08-20T07:00:00.000Z"
  },
  "timestamp": "2026-08-20T07:30:00.000Z"
}
```

---

#### Trường hợp B: Danh sách có phân trang (Paginated Collection)
**Endpoint**: `GET /api/v1/orders?page=1&limit=10`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "orderCode": "NDA0826-001",
      "customerName": "Công ty ABC",
      "status": "PENDING"
    },
    {
      "id": 2,
      "orderCode": "NDA0826-002",
      "customerName": "Công ty XYZ",
      "status": "ASSIGNED"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "timestamp": "2026-08-20T07:30:00.000Z"
}
```

---

#### Trường hợp C: Danh sách phân trang vô tận (Infinity Pagination - Users)
**Endpoint**: `GET /api/v1/users?page=1&limit=10`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": { "id": 1, "name": "SUPER_ADMIN" }
    }
  ],
  "meta": {
    "hasNextPage": true
  },
  "timestamp": "2026-08-20T07:30:00.000Z"
}
```

---

#### Trường hợp D: Danh sách Lookup / Dropdown không phân trang
**Endpoint**: `GET /api/v1/hubs/active` hoặc `GET /api/v1/vehicles`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": 1, "name": "Kho Hà Nội", "code": "HAN-01" },
    { "id": 2, "name": "Kho Đà Nẵng", "code": "DAD-01" },
    { "id": 3, "name": "Kho TP.HCM", "code": "SGN-01" }
  ],
  "timestamp": "2026-08-20T07:30:00.000Z"
}
```

---

#### Trường hợp E: HTTP 204 No Content (Xóa / Đăng xuất)
**Endpoint**: `DELETE /api/v1/orders/1` hoặc `POST /api/v1/auth/logout`
- **HTTP Status Code**: `204 No Content`
- **Body**: Trống (Không có body theo chuẩn RFC).

---

## 3. Chuẩn Phản Hồi Lỗi (Unified Error Response Standard)

### 3.1. Cấu trúc TypeScript Interface

```typescript
export interface ApiErrorResponse {
  statusCode: number;   // HTTP Status Code (400, 401, 403, 404, 422, 500)
  message: string;       // Thông điệp lỗi trực quan
  errors?: Record<string, string | string[]> | string[] | null; // Lỗi chi tiết từng trường
  timestamp: string;     // Thời điểm xảy ra lỗi (ISO 8601)
  path: string;          // Đường dẫn API gây ra lỗi (VD: "/api/v1/vehicles")
}
```

---

### 3.2. Các Trường Hợp Lỗi Phổ Biến

#### Lỗi 422 Unprocessable Entity (Validation Errors)
Xảy ra khi dữ liệu gửi lên vi phạm DTO validation (`class-validator`):

```json
{
  "statusCode": 422,
  "message": "Dữ liệu không hợp lệ (Validation failed)",
  "errors": {
    "licensePlate": "Biển số xe không được để trống",
    "maxPayloadKg": "Tải trọng tối đa phải lớn hơn 0"
  },
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/vehicles"
}
```

---

#### Lỗi 400 Bad Request (Business Logic Error)
Xảy ra khi vi phạm điều kiện nghiệp vụ TMS:

```json
{
  "statusCode": 400,
  "message": "Mã đơn hàng 'NDA0826-001' đã tồn tại trong hệ thống.",
  "errors": null,
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/orders"
}
```

---

#### Lỗi 401 Unauthorized (Chưa đăng nhập / Token hết hạn)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "errors": null,
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/orders"
}
```

---

#### Lỗi 403 Forbidden (Không đủ quyền RBAC)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "errors": null,
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/admin/hubs"
}
```

---

#### Lỗi 404 Not Found (Không tìm thấy tài nguyên)
```json
{
  "statusCode": 404,
  "message": "Order with id 999 not found",
  "errors": null,
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/orders/999"
}
```

---

#### Lỗi 500 Internal Server Error (Lỗi hệ thống)
Khi xảy ra ngoại lệ server chưa bắt được (Unhandled / 500), Backend sẽ tự động ghi **Stack Trace** chi tiết vào server console/logs và đính kèm trường `stack` trong payload phản hồi (trong môi trường Development/Staging):

```json
{
  "statusCode": 500,
  "message": "Lỗi máy chủ nội bộ (Internal server error)",
  "errors": null,
  "timestamp": "2026-08-20T07:30:00.000Z",
  "path": "/api/v1/trips/split",
  "stack": "Error: Database connection lost\n    at TripsService.splitTrip (src/trips/trips.service.ts:145:11)\n    at ..."
}
```

---

## 4. Hướng Dẫn Tích Hợp Cho Frontend (Next.js App Router)

### 4.1. Bóc tách dữ liệu trong API Services

Tại `frontend/src/features/<feature>/api/service.ts`, sử dụng kiểu `ApiResponse<T>` từ `@/lib/api-error`:

```typescript
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/api-error';
import type { Order, PaginatedOrdersResponse } from './types';

// Lấy danh sách có phân trang
export async function getOrders(filters: OrderFilters = {}): Promise<PaginatedOrdersResponse> {
  const res = await apiClient.get<ApiResponse<Order[]>>('/api/v1/orders', { params: filters });
  return {
    data: res.data.data,
    meta: res.data.meta!,
  };
}

// Lấy chi tiết đơn hàng
export async function getOrderById(id: number): Promise<Order> {
  const res = await apiClient.get<ApiResponse<Order>>(`/api/v1/orders/${id}`);
  return res.data.data;
}
```

---

### 4.2. Xử lý và hiển thị Toast lỗi tập trung

Tại các UI components, form modals hoặc React Query mutations:

```typescript
import { useMutation } from '@tanstack/react-query';
import { showApiErrorToast, showApiSuccessToast } from '@/lib/api-error';
import { ordersApi } from '../api/service';

const createMutation = useMutation({
  mutationFn: ordersApi.createOrder,
  onSuccess: () => {
    showApiSuccessToast('Tạo đơn hàng mới thành công!');
    onOpenChange(false);
  },
  onError: (err) => {
    // Tự động phân tích message, validation errors tree và hiển thị Toast đẹp mắt
    showApiErrorToast(err, 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.');
  }
});
```

---

## 5. Danh Sách Quy Tắc Bắt Buộc (Governance Rules)

1. **Không bọc thủ công ở Controller**: Controllers chỉ trả về Entity, DTO, hoặc `PaginatedResult`. `ResponseTransformInterceptor` sẽ tự động đóng gói Envelope.
2. **Không ném lỗi dưới dạng string tự do**: Luôn dùng NestJS Built-in Exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnprocessableEntityException`).
3. **Frontend luôn bắt lỗi qua `formatApiError` hoặc `showApiErrorToast`**: Không tự viết regex hoặc bóc `err.response.data.errors` thủ công ở từng component để tránh bỏ sót các trường hợp lỗi lồng nhau.
