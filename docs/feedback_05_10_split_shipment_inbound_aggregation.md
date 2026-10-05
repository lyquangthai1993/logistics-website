# 📦 Báo Cáo Phân Tích Nghiệp Vụ & Kỹ Thuật: Quản Lý Tồn Kho Đơn Phân Chuyến (Split Shipment / Multi-Truck Inbound)

> **Mã phản hồi**: `FEEDBACK-05-10-SPLIT-INBOUND`  
> **Ngày ghi nhận**: 05/10/2026  
> **Người phát hiện / Kiểm thử**: Tester / Đội ngũ Vận hành Kho  
> **Chuyên gia phân tích**: TMS Domain Lead (`/leader`)  
> **Bằng chứng thực tế**: [`feedback_05_10/split_shipment_inbound_aggregation_issue.png`](../feedback_05_10/split_shipment_inbound_aggregation_issue.png) & [`docs/feedback_evidence/05_10/05_split_shipment_inbound_aggregation_issue.png`](./feedback_evidence/05_10/05_split_shipment_inbound_aggregation_issue.png)  
> **Tài liệu nghiệp vụ tham chiếu**: [`docs/SPLIT_SHIPMENT_BUSINESS_INTERVIEW_GUIDE.md`](./SPLIT_SHIPMENT_BUSINESS_INTERVIEW_GUIDE.md), [`.agents/skills/leader/SKILL.md`](../.agents/skills/leader/SKILL.md)

---

## 📌 1. Bối Cảnh & Trích Dẫn Trao Đổi Thực Tế

### 💬 Trích đoạn hội thoại (Tin nhắn trao đổi kèm ảnh chụp màn hình):
* **Người kiểm thử (Tester / User)** *(20:44)*:
  > *"T MỚI TEST CÁI NÀY"*  
  > *"1 MÃ VẬN ĐƠN NHƯNG NHẬP 2 LẦN"*  
  > *"TRÊN 2 XE KHÁC NHAU"*  
  > *"THÌ VÔ TỒN KHO NÓ HIỆN RA 2 DÒNG CHỨ KHÔNG CỘNG DỒN LẠI"*
* **Lập trình viên (Mai Công Đức)** *(20:48)*:
  > *Quote: "THÌ VÔ TỒN KHO NÓ HIỆN RA 2 DÒNG CHỨ KHÔNG CỘNG DỒN LẠI"*  
  > *"uhm hiểu case này, chung mã đơn nhưng mấy thông tin còn lại nó lại nó khác biệt với nhau hết rồi. Tên hàng hóa, số kg, số m2, ... nên cũng khó à, làm sao để MERGE vào chung nhau"*

### 🖼️ Hiện trạng trên màn hình thực tế:
- **Màn hình**: `Tổng Hợp Đơn Hàng Tại Kho - Andromeda Hub - HCM` (`/dashboard/warehouse/orders`).
- Vùng đánh dấu viền đỏ thể hiện mã đơn hàng `MCD2610-0001`:
  - Dòng cha hiển thị mã `MCD2610-0001`, tên hàng `MAY MẶC, VẢI`.
  - Cột Tồn kho hiển thị bất thường: `200 / 100 kiện`.
  - Dưới dòng cha có 2 dòng con mở rộng:
    - **Dòng 1**: Hàng `MAY MẶC` | Chuyến xe `003 · 60-B1 15594` | Tồn kho `30 / 30 kiện` | `500 kg` | `5 m³` | Đích đến `LONG AN - TÂN KIM...` | Trạng thái `LƯU KHO`.
    - **Dòng 2**: Hàng `VẢI` | Chuyến xe `001 · 76-H720-335` | Tồn kho `...` | `1.600 kg` | `10 m³` | Đích đến `LONG AN - TÂN KIM...` | Trạng thái `LƯU KHO`.

---

## 🔍 2. Phân Tích Bản Chất Yêu Cầu Của Người Dùng & Nút Thắt Kỹ Thuật

### 2.1. Phía Người dùng (Thủ kho / Kế toán kho)
1. **Nghiệp vụ thực tế (Split Shipment / Partial Receiving)**:
   - Một đơn hàng lớn của khách hàng (cùng 1 Mã Vận Đơn - Waybill) được vận chuyển bởi **nhiều phương tiện khác nhau** do quá tải thùng xe hoặc được gom về kho thành nhiều đợt.
   - Xe 1 chở một phần hàng hóa (Ví dụ: Vải cuộn, 1.600 kg, 10 m³), Xe 2 chở phần còn lại (Ví dụ: Phụ liệu may mặc, 500 kg, 5 m³).
2. **Kỳ vọng vận hành**:
   - Khi thủ kho tra cứu trang **Tổng Hợp Đơn Hàng Tại Kho / Tồn kho**, họ cầm mã đơn `MCD2610-0001` và cần thấy ngay: **Tổng tồn thực tế của mã đơn này trong kho là bao nhiêu kiện, bao nhiêu kg, bao nhiêu m³?**
   - Khi nhìn thấy bảng hiển thị tách biệt hoặc mở rộng nhiều dòng rời rạc, người dùng lo ngại:
     - Tồn kho bị phân mảnh, phải tự lấy máy tính cộng tay.
     - Dễ nhầm lẫn thành 2 đơn hàng trùng mã hoặc bị trùng lặp dữ liệu trong hệ thống.
     - Gây khó khăn khi kiểm đếm tổng tồn và khi xuất kho trả hàng trọn gói cho khách.

### 2.2. Phía Lập trình viên (Mai Công Đức)
- **Nút thắt tư duy kỹ thuật**:
  - Dev đang tiếp cận bài toán theo hướng: *"Nếu gộp thành 1 dòng (MERGE) thì lưu vào DB kiểu gì? Tên hàng hóa thì lấy tên của xe nào? Biển số xe thì ghi xe nào? Số kg, m³ nếu cộng lại thì mất dấu vết của từng xe..."*
- **Đánh giá từ `/leader`**:
  - Nỗi lo của Dev là có cơ sở nếu hiểu "MERGE" là gộp cứng (flatten/update) các bản ghi thành 1 hàng duy nhất trong cơ sở dữ liệu.
  - Tuy nhiên, **GỘP CỨNG TRONG DATABASE LÀ SAI NGHIỆP VỤ LOGISTICS**, vì sẽ làm mất toàn bộ vết kiểm toán (Audit Trail) của từng chuyến xe, từng đợt nhập kho, từng lái xe và biên bản kiểm đếm tiếp nhận.

---

## 💡 3. Định Hướng Giải Pháp Chuẩn Nghiệp Vụ Logistics TMS

Hệ thống tuân thủ nghiêm ngặt **Mô hình Master – Detail (Dòng Tổng Hợp Hợp Nhất & Dòng Chi Tiết Theo Chuyến Xe)** theo đúng chuẩn quản lý vận tải Consignment-level (No-SKU):

```
                               ┌──► Xe 1 (76-H720-335): 70 kiện | 1.600 kg | 10 m³ (VẢI)
Mã đơn: MCD2610-0001 ──────────┤
(Tổng: 100 kiện | 2.100 kg)    └──► Xe 2 (60-B1 15594): 30 kiện |   500 kg |  5 m³ (MAY MẶC)
                                               │
                                               ▼
                              [MÀN HÌNH TỔNG HỢP TỒN KHO]
          ┌──────────────────────────────────────────────────────────────────────────┐
          │ DÒNG TỔNG HỢP (Consolidated Row - Mặc định):                             │
          │ Mã: MCD2610-0001 | Hàng: Vải, May mặc | Xe: 2 chuyến (+1) | 100/100 kiện │
          │ Tồn: 2.100 kg | 15 m³ | Đích: Long An | Trạng thái: LƯU KHO             │
          └──────────────────────────────────────────────────────────────────────────┘
                                               │ (Click xem chi tiết / Bung dòng)
                                               ▼
          ┌──────────────────────────────────────────────────────────────────────────┐
          │ CHI TIẾT TỪNG LÔ THEO XE (Drill-Down / Sub-rows):                        │
          │ ├─ Dòng 1: MAY MẶC | Xe 60-B1 15594 | 30/30 kiện | 500 kg | 5 m³        │
          │ └─ Dòng 2: VẢI     | Xe 76-H720-335 | 70/70 kiện | 1.600 kg | 10 m³     │
          └──────────────────────────────────────────────────────────────────────────┘
```

### 📊 Ma trận quy tắc hợp nhất dữ liệu (Consolidation Rules):

| Trường thông tin | Dòng Tổng Hợp (Dòng Cha hiển thị mặc định) | Dòng Chi Tiết Theo Xe (Khi bấm mở rộng) | Rationale nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Mã đơn hàng** | Giữ nguyên: `MCD2610-0001` | Đánh dấu: `Dòng 1`, `Dòng 2` (hoặc `#1`, `#2`) | Định danh duy nhất theo Vận đơn khách hàng. |
| **Tên hàng hóa** | **Gộp danh mục duy nhất**: `Vải, May mặc` | Tên cụ thể từng xe chở: `Vải` hoặc `May mặc` | Khách nhìn dòng tổng biết có những loại hàng gì; kho kiểm tra biết xe nào chở loại nào. |
| **Số kiện / Tồn kho** | **Cộng dồn đại số**: $\sum \text{kiện}$ (Ví dụ: $70 + 30 = 100$ kiện) | Số kiện thực tế của từng xe ($30$ kiện, $70$ kiện) | Phản ánh đúng 100% năng lực tồn kho tại Hub. |
| **Khối lượng (Kg)** | **Cộng dồn đại số**: $\sum \text{kg}$ ($1.600 + 500 = 2.100$ kg) | Số kg theo biên bản giao nhận của từng xe | Đảm bảo tính cước và đối soát tải trọng chính xác. |
| **Thể tích ($m^3$)** | **Cộng dồn đại số**: $\sum m^3$ ($10 + 5 = 15$ $m^3$) | Thể tích chiếm chỗ trên thùng từng xe | Đảm bảo tính toán lấp đầy kho. |
| **Chuyến xe / BKS** | Hiển thị: `001 · 76-H720-335` kèm badge **`+1 chuyến`** (hoặc `2 chuyến xe`) | Hiển thị chính xác BKS và Lái xe của từng chuyến | Giúp thủ kho biết đơn này đến từ nhiều xe, click vào để xem danh sách xe. |
| **Đích đến** | Đích đến chung của đơn (hoặc gộp các điểm trả nếu giao đa điểm) | Đích đến cụ thể của từng chuyến | Đảm bảo tuyến hành trình. |
| **Trạng thái kho** | `LƯU KHO` (Nếu còn bất kỳ dòng nào tồn kho tại Hub) | Trạng thái tiếp nhận của từng xe | Thống nhất trạng thái vòng đời. |

---

## 🛠️ 4. Các Lỗi Kỹ Thuật Đã Phát Hiện Cần Khắc Phục

1. **Lỗi hiển thị tỷ lệ Tồn kho (`TỒN KHO: 200 / 100 kiện`)**:
   - Hiện trạng trong ảnh: Tồn kho đang hiển thị `200 / 100 kiện` (Tồn 200 trên tổng 100 kiện).
   - Nguyên nhân: Trong hàm `aggregateOrderGroup` ở `backend/src/orders/warehouse.service.ts`, phép tính `hubStock` từ Sổ cái giao dịch kho (`order_inventory_transaction`) và trường `totalQuantity` bị nhân đôi hoặc sai lệch khi cộng dồn giữa các dòng hàng cùng mã đơn.
2. **Thiếu biểu tượng trực quan đa chuyến xe ở Cột Chuyến Xe**:
   - Dòng tổng hợp hiện tại chỉ hiển thị thông tin của 1 xe (`001 · 76-H720-335`), chưa làm nổi bật rõ ràng rằng đơn hàng này được tiếp nhận từ **2 phương tiện khác nhau**, khiến người dùng lúng túng.
3. **Cơ chế Xuất kho (Outbound Flow) cho đơn phân chuyến**:
   - Khi tạo phiếu xuất kho, cần hỗ trợ cả 2 chế độ:
     - **Xuất toàn bộ đơn hàng**: Tự động gom toàn bộ các dòng hàng cùng mã `MCD2610-0001` đang lưu kho vào chuyến xe xuất.
     - **Xuất từng phần**: Cho phép thủ kho chọn xuất lẻ từng dòng hàng của chuyến xe cụ thể.

---

## 📋 5. Kế Hoạch Triển Khai (Action Items) — Đã Hoàn Thành 100%

- [x] **Backend (`warehouse.service.ts`)**:
  - Chuẩn hóa lại logic `aggregateOrderGroup`: Đảm bảo `hubStock` và `totalQuantity` được tính đúng tỷ lệ $\sum \text{tồn} / \sum \text{tổng nhận}$, triệt tiêu triệt để hiện tượng `200 / 100 kiện`.
  - Tối ưu mảng `trips`: Trả về đầy đủ danh sách các chuyến xe tiếp nhận kèm thông tin BKS và lái xe.
- [x] **Frontend (`WarehouseOrdersPage`)**:
  - Cập nhật hiển thị cột Chuyến xe: Khi `trips.length > 1`, hiển thị badge `+N xe` và `+N trip` nổi bật kèm tooltip danh sách các xe tiếp nhận.
  - Tối ưu hóa UI thu gọn/mở rộng (Accordion): Mặc định hiển thị dòng cha tổng hợp rõ ràng; chỉ mở rộng dòng con khi người dùng bấm "Xem dòng".
  - Kiểm tra tính nhất quán giữa Modal in tem A4 (`PalletLabelA4Modal`) và Modal chi tiết vận đơn (`WarehouseWaybillDetailModal`).
- [x] **Kiểm thử tự động Playwright E2E**:
  - Viết kịch bản E2E tạo 1 mã vận đơn với 2 chuyến xe nhập kho khác nhau (`29-feedback-05-10-split-shipment-inbound-aggregation.spec.ts`).
  - Xác minh dòng tổng hợp cộng dồn chính xác số kiện, kg, $m^3$, và hiển thị badge đa xe trên môi trường Dev (Pass 3/3 tests).

---

## 📸 6. Bằng Chứng Nghiệm Thu Thực Tế (Visual Evidence Artifacts)

| STT | Ảnh chụp minh chứng | Ý nghĩa & Tiêu chí nghiệm thu được chứng minh |
| :---: | :--- | :--- |
| **01** | [`06_split_shipment_inbound_aggregation_master.png`](./feedback_evidence/05_10/06_split_shipment_inbound_aggregation_master.png) | **Dòng Tổng Hợp Gộp (Consolidated Master Row)**:<br>• Đơn phân chuyến 2 xe chỉ xuất hiện **duy nhất 1 dòng cha**.<br>• Huy hiệu `2 dòng hàng`, tên hàng hợp nhất `VẢI CUỘN MAY MẶC, PHỤ LIỆU MAY MẶC`.<br>• Cột chuyến xe hiển thị badge đa xe: `+1 trip` và `+1 xe`.<br>• **Tồn kho chuẩn xác tuyệt đối**: `100 / 100 kiện` (Xóa bỏ hoàn toàn lỗi tỷ lệ `200 / 100 kiện`).<br>• Khối lượng và thể tích cộng dồn đại số: `2.100 kg` và `15 m³`. |
| **02** | [`07_split_shipment_inbound_aggregation_expanded.png`](./feedback_evidence/05_10/07_split_shipment_inbound_aggregation_expanded.png) | **Bung Dòng Chi Tiết Theo Xe (Master-Detail Accordion)**:<br>• Bấm "Xem dòng" mở rộng 2 dòng con bảo lưu đầy đủ lịch sử tiếp nhận từng xe.<br>• **Dòng 1**: Xe `76-H720-335` (Tài xế Nguyễn Văn Xe 1) chở `70 / 70 kiện`, `1.600 kg`, `10 m³`.<br>• **Dòng 2**: Xe `60-B1 15594` (Tài xế Trần Văn Xe 2) chở `30 / 30 kiện`, `500 kg`, `5 m³`.<br>• Hỗ trợ in tem A4 lẻ và xem chi tiết độc lập từng dòng. |
| **03** | [`08_split_shipment_inbound_waybill_detail_modal.png`](./feedback_evidence/05_10/08_split_shipment_inbound_waybill_detail_modal.png) | **Modal Chi Tiết Vận Đơn (`WarehouseWaybillDetailModal`)**:<br>• Tổng đã nhập: `100 kiện`, Tổng đã xuất: `0 kiện`, Tồn kho khả dụng: `100 kiện`.<br>• Lưu trữ vết kiểm toán tiếp nhận từng đợt nhập kho của phương tiện.<br>• Phân định rõ ràng chế độ xem chi tiết kiểm đếm (Read-only Audit). |

