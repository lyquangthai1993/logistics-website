# Logistics TMS Templates & Business Artifacts Catalog

Thư mục này chứa các file mẫu (Excel, PDF, CSV, Docs) thực tế đại diện cho quy trình nghiệp vụ hệ thống Logistics TMS (Spider Express). Tất cả các AI Agent và lập trình viên cần tham khảo thư mục này khi phân tích nghiệp vụ, thiết kế Data Schema, tạo Seed Data, hoặc xây dựng các API Import/Export.

---

## 📁 Cấu trúc Thư mục

```text
templates/
├── README.md                          # (File này) Chỉ mục & Hướng dẫn cho AI Agents
├── inbound/                           # Mẫu Yêu cầu Nhập kho & Gom hàng
│   └── NDA_PhieuYeuCauNhapKho_2026.xlsx # Mẫu Phiếu Yêu Cầu Nhập Kho chính thức
├── outbound/                          # Mẫu Lệnh Xuất kho & Giao hàng
├── fleet/                             # Mẫu Điều xe, Quản lý Tải trọng & Tài xế
└── pricing/                           # Mẫu Bảng giá cước & Phụ phí
```

---

## 📊 Phân tích Chi tiết File Mẫu: `inbound/NDA_PhieuYeuCauNhapKho_2026.xlsx`

### 1. Vai trò nghiệp vụ:
File này đại diện cho **Phiếu Yêu Cầu Nhập Kho & Lập Kế Hoạch Gom Hàng** được bộ phận **DISPATCHER (Điều hành)** lập ra để phân loại đơn hàng lẻ, gom theo tuyến miền, gán xe/tài xế và chuyển cho **WAREHOUSE_MANAGER (Quản lý kho)** nhập kho trung chuyển.

### 2. Các trường dữ liệu chính (Extracted Data Fields):
- **Mã Đơn Hàng (`order_code`)**: Định dạng `NDAYYMM-xxxx` (Ví dụ: `NDA2608-0009`, `NDA2608-0150`, `NDA2608-0150A`).
- **Thông tin Kho Nhập / Trung chuyển (`inbound_hub`)**: Kho Spider Warehousing, Kho Bắc Ninh, Kho DC Bách Hóa Xanh...
- **Địa điểm Giao / Điểm Trả (`dropoff_location`)**: Thông tin đại lý, đối tác nhận (Công ty Masan, Michelin Car Service, Kim Long Motor...).
- **Đội xe & Tài xế (`vehicle_number`, `driver_name`)**:
  - Biển số xe: `75H05121`, `43H21248`, `75E01712`, `75H05172`...
  - Tài xế: Trần Phi Vũ, Thái Văn Tài, Nguyễn Minh Chánh...
- **Quy cách Hàng hóa (`cargo_type`, `quantity`, `weight_kg`, `volume_cbm`)**: Lốp Michelin, Ly giữ nhiệt, Nước dừa, Balo, Thể tích m³, Khối lượng Kg.
- **Ghi chú Tuyến / Gom đơn (`route_note`)**: "17 ĐƠN MIỀN BẮC - XUẤT CHUNG MÃ NDA2608-0150", "HÀNG ĐÃ ĐỦ KHÔNG MỞ RA KIỂM LẠI".

---

## 🤖 Hướng dẫn cho AI Agent khi khai thác thư mục này

1. **Khi thiết kế Database Entity / Migration**:
   - Kiểm tra các trường thông tin trong các file mẫu để bảo đảm Entity (ví dụ: `Order`, `Trip`, `Warehouse`, `Vehicle`) chứa đủ các trường dữ liệu thực tế.
2. **Khi viết Seed Data / Test Cases**:
   - Sử dụng đúng dữ liệu mẫu thực tế trong các file Excel để tạo Mock Data sinh động và đúng chuẩn thực tế.
3. **Khi xây dựng tính năng Excel Import/Export**:
   - Tham khảo cấu trúc cột và dòng tiêu đề trong các file mẫu để định nghĩa DTO và parser phù hợp.
