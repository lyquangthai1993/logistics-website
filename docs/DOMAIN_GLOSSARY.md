# 📖 Từ Điển Thuật Ngữ Nghiệp Vụ Logistics TMS (Spider Express)

> **Tài liệu tham chiếu chuẩn mực (Canonical Domain Glossary)**  
> **Áp dụng cho**: Toàn bộ UI Screens, API Endpoints, Database Entities, Vector Canvas (`.pen`), và Báo cáo Nghiệp Vụ.  
> **Quy chuẩn**: Bắt buộc tuân thủ nguyên tắc *Zero Technical Jargon* — Sử dụng 100% thuật ngữ kho vận và điều hành thực tế.

---

## 1. Bảng Đối Soát Thuật Ngữ (Terminology Mapping)

| Thuật Ngữ Kỹ Thuật (DB / DTO / Code) | Thuật Ngữ Vận Hành Chuẩn (UI / Báo Cáo / In Ấn) | Định Nghĩa Nghiệp Vụ | Biệt Ngữ Bị CẤM Hiển Thị |
| :--- | :--- | :--- | :--- |
| `InboundWaybill` / `FirstMile` | **Xe nhập kho** / **Phiếu nhập kho** | Quy trình tiếp nhận hàng từ xe chở hàng vào kho bãi/Hub để kiểm đếm và lưu kho. | `First-mile Inbound`, `Consignment In`, `TASK-ORD-...` |
| `TransferWaybill` / `MiddleMile` | **Trung chuyển liên Hub** | Luân chuyển hàng hóa giữa các Hub kho (VD: Hub Hưng Yên $\rightarrow$ Hub Đà Nẵng $\rightarrow$ Hub HCM). | `Middle-mile Transfer`, `Inter-hub Consignment` |
| `OutboundWaybill` / `LastMile` | **Xe xuất kho** / **Phiếu xuất kho** | Quy trình xuất hàng từ Hub lên xe giao hàng chặng cuối cho khách hàng hoặc đại lý. | `Last-mile Outbound`, `Consignment Out` |
| `AvailableStock` | **Tồn khả dụng** | Số lượng kiện hàng hoặc tải trọng thực tế trong kho sẵn sàng để điều phối xuất đi (không bị khóa/giữ chỗ). | `Available Qty`, `Unallocated Balance` |
| `PartialOutbound` | **Đang xuất từng phần** | Trạng thái đơn hàng lớn hoặc lô hàng chỉ mới xuất đi một phần số kiện, phần còn lại vẫn đang lưu kho Hub. | `Đang xuất nhỏ giọt`, `Partial Drip` |
| `PackageStandard` | **Quy cách đóng gói kiện** | Tiêu chuẩn đóng gói hàng hóa theo kiện vận tải (thùng carton, pallet, cuộn, kiện gỗ). | `Quy chuẩn kiện vận tải (No-SKU)` |
| `TallySheet` | **Bảng kê kiểm đếm hàng hóa** | Bảng kê chi tiết số lượng kiện thực nhận/thực xuất đối soát trực tiếp với tài xế tại sàn kho. | `Tally Audit Grid`, `Item Counter` |
| `DiscrepancyReconciliation` | **Biên bản đối soát thừa/thiếu** | Biên bản ghi nhận khi số lượng hàng thực tế lệch so với phiếu yêu cầu (thừa, thiếu, móp méo, hư hỏng). | `Discrepancy Handler`, `Diff Log` |
| `FleetDispatch` | **Điều phối xe & Chuyến vận chuyển** | Hoạt động phân bổ phương tiện, tài xế và ghép tải hàng hóa cho chuyến đi. | `Trip Engine`, `Dispatch Dispatcher` |

---

## 2. Các Hub Kho Vận Cốt Lõi (Hub-Scoped Matrix)

| Tên Hub Kho | Mã Hub | Địa Bàn Hoạt Động | Tài Khoản Kiểm Thử Chuẩn |
| :--- | :--- | :--- | :--- |
| **Andromeda Hub** | `HUB_HCM` | Miền Nam (TP. Hồ Chí Minh & các tỉnh lân cận) | `USER_WAREHOUSE_HCM` (`warehouse_hcm`) |
| **Polaris Hub** | `HUB_HYN` | Miền Bắc (Hưng Yên, Hà Nội & phụ cận) | `USER_WAREHOUSE_HYN` (`warehouse_hyn`) |
| **Magellan Hub** | `HUB_DAD` | Miền Trung (Đà Nẵng & miền Trung) | `USER_WAREHOUSE_DAD` (`warehouse_dad`) |

---

## 3. Các Bất Biến Nghiệp Vụ Cốt Tử (Operational Invariants)

1. **Không Tồn Kho Âm (Zero Negative Inventory)**:
   - Hệ thống nghiêm cấm mọi thao tác xuất kho vượt quá số kiện hoặc tải trọng khả dụng tại Hub.
   - Công thức: `Tồn Khả Dụng = Tồn Thực Tế - Hàng Đang Giữ Chỗ Chuyến Xe - Hàng Đang Xuất Từng Phần`.

2. **Khóa Phiếu Đã Xuất Hoàn Tất (Immutable Completed Waybill)**:
   - Khi một phiếu nhập/xuất kho đã chuyển sang trạng thái hoàn tất (`COMPLETED`), giao dịch sổ cái kho vật lý bị khóa vĩnh viễn. Mọi điều chỉnh sau đó bắt buộc phải tạo Biên Bản Điều Chỉnh / Bù Trừ độc lập.

3. **Chống Rò Rỉ Biệt Ngữ Kỹ Thuật (Zero Technical Jargon)**:
   - Tuyệt đối không để lộ tên trường database (snake_case, camelCase), mã task kỹ thuật, hoặc ghi chú kỹ thuật trên giao diện người dùng.
