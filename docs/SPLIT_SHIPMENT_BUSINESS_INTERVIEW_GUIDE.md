# 🚚 Khung Chiến Lược & Bộ Câu Hỏi Khảo Sát Nghiệp Vụ: Split Shipment (Tách Đơn Gom Hàng)
> **Tài liệu tham vấn chuyên gia điều vận Logistics (TMS Domain Lead Reference)**  
> **Dự án**: Logistics TMS — Spider Express  
> **Phiên bản**: v1.0 | **Ngày lập**: 2026-08-18  

---

## 📌 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ

Trong quy trình gom và điều phối hàng hóa thực tế (tham chiếu theo dữ liệu mẫu [`templates/inbound/NDA_PhieuYeuCauNhapKho_2026.xlsx`](file:///d:/Projects/logistics-website/templates/inbound/NDA_PhieuYeuCauNhapKho_2026.xlsx)), hệ thống thường xuyên đối mặt với các đơn hàng lớn (VD: Đơn hàng Michelin / Bóng Kun gom miền Trung – miền Bắc có khối lượng 25 – 35 tấn, thể tích 60 – 80 m³).

Một phương tiện đơn lẻ trong đội xe nội bộ thường không thể chở hết trong một chuyến (ví dụ: xe tải 15 tấn, xe tải 8 tấn). Vì vậy, quy trình **Split Shipment (Tách một đơn hàng lớn cho nhiều xe/chuyến vận chuyển)** là nghiệp vụ bắt buộc.

Tài liệu này được biên soạn để **Điều phối viên / Product Owner** mang đi làm việc trực tiếp với các **Chuyên gia Điều vận, Trưởng phòng Đội xe (Fleet Manager), và Quản lý Kho (Warehouse Manager)** nhằm thống nhất các quy tắc vận hành trước khi số hóa lên hệ thống phần mềm.

---

## ❓ 2. Bộ Câu Hỏi Tham Vấn Chuyên Gia (5 Nhóm Trọng Tâm)

```
                       ┌──► Chuyến #1: Xe 15 Tấn (Nội bộ) ──► 15.000 kg (30 m³)
Đơn hàng: 25 Tấn ─────┤
 (NDA2608-0150)        └──► Chuyến #2: Xe 10 Tấn (Xe ngoài) ──► 10.000 kg (20 m³)
```

### 🔹 Nhóm 1: Cơ Chế Đặt Mã & Chứng Từ Giao Nhận (Code & Documentation)

1. **Quy tắc định danh mã chuyến con**:
   - Khi 1 đơn hàng cha (VD: `NDA2608-0150`) tách làm 2 xe, hệ thống nên hiển thị và in mã trên phiếu vận chuyển/phiếu nhập kho như thế nào?
     - *Phương án A*: Giữ nguyên mã đơn gốc `NDA2608-0150`, phân biệt bằng số thứ tự chuyến (Chuyến #1, Chuyến #2).
     - *Phương án B (Khuyên dùng theo mẫu thực tế)*: Tự động gắn hậu tố định danh (VD: `NDA2608-0150A` và `NDA2608-0150B`).
2. **Biên bản bàn giao & Chứng từ (POD - Proof of Delivery)**:
   - In một biên bản giao nhận tổng cho toàn bộ đơn hàng, hay mỗi xe cầm một biên bản giao nhận độc lập theo đúng tải trọng và danh mục hàng xe đó chở?

---

### 🔹 Nhóm 2: Tiêu Chí Phân Bổ Tải Trọng & Dung Sai (Allocation & Tolerance)

3. **Thuật toán / Tiêu chí ưu tiên khi chia tải giữa các xe**:
   - Khi chia tải, điều phối viên ưu tiên theo nguyên tắc nào?
     - *Ưu tiên A (Tối ưu lấp đầy - Fill First)*: Điền đầy tải xe lớn nhất trước (15T đầy 100%), phần còn lại dồn cho xe nhỏ hơn?
     - *Ưu tiên B (Chia đều tải)*: Chia tải tương đương giữa các xe để cân bằng hao mòn phương tiện?
     - *Ưu tiên C (Theo chủng loại hàng)*: Tách theo kiện/loại hàng (VD: hàng nặng như Lốp Michelin đi xe tải nặng; quà tặng, bóng Kun nhẹ cồng kềnh đi xe thùng kín)?
4. **Xử lý phần dư lẻ (Tolerance / Remainder)**:
   - Đơn 25 tấn, Xe 1 nhận 15 tấn, Xe 2 nhận 9.5 tấn $\rightarrow$ còn dư 500kg (2%). Hệ thống có cho phép chốt đơn với dung sai này không (VD: cho phép sai số $\pm 3\%$), hay bắt buộc phải chia chính xác 100% mới cho xác nhận phân xe?

---

### 🔹 Nhóm 3: Quy Trình Kho Tiếp Nhận Inbound (Inbound Receiving Workflow)

5. **Cơ chế nghiệm thu và nhập hàng tại kho tiếp nhận**:
   - *Phương án A - Nhập từng phần (Partial Receiving)*: Xe 1 đến trước $\rightarrow$ Kho kiểm đếm và nhập kho 15 tấn trước $\rightarrow$ Hàng sẵn sàng trong kho. Xe 2 đến sau tiếp tục nhập phần còn lại.
   - *Phương án B - Nhập trọn gói (Full Receiving)*: Kho bắt buộc phải chờ đầy đủ tất cả các xe của đơn hàng cùng đến mới tiến hành nghiệm thu và hoàn tất đơn?
6. **Cửa sổ thời gian xuất bến & Cập bến (Time Windows)**:
   - Các xe của cùng một đơn split có bắt buộc phải xuất bến cùng lúc không, hay có thể chạy lệch nhau vài giờ hoặc khác ngày tùy theo lịch giải phóng cửa kho (Dock)?

---

### 🔹 Nhóm 4: Quản Lý Rủi Ro & Xử Lý Sự Cố Từng Chuyến (Exception Handling)

7. **Sự cố độc lập trên đường**:
   - Nếu Chuyến #1 giao an toàn đến kho, nhưng Chuyến #2 bị hỏng xe giữa đường hoặc xảy ra sự cố hư hỏng/ướt hàng thì trạng thái đơn hàng cha sẽ được xử lý ra sao?
   - Hệ thống có cần hỗ trợ nút **Chuyển tải cứu hộ (Re-assign / Rescue Trip)** để gán xe #3 cứu hộ riêng cho phần hàng bị sự cố mà không làm ảnh hưởng chuyến #1 đã giao thành công?

---

### 🔹 Nhóm 5: Tính Cước & Hạch Toán Xe Thuê Ngoài (Costing & Billing)

8. **Cơ chế hạch toán khi kết hợp Xe nội bộ + Xe thuê ngoài**:
   - Khi 1 đơn hàng split gồm: **Chuyến 1 (Xe công ty) + Chuyến 2 (Xe thuê ngoài đối tác)**:
     - Cước phí xe ngoài được thanh toán theo chuyến xe đó (Trip-based cost)?
     - Hay cước được phân bổ vào giá thành từng kg của đơn hàng tổng?
   - Quy trình nghiệm thu và ký xác nhận phiếu cước xe ngoài diễn ra tại kho xuất hay kho đích?

---

## 💡 3. Bảng Chiến Lược Khuyến Nghị Từ TMS Domain Lead

Dựa trên chuẩn vận hành thực tế của các hệ thống Logistics TMS lớn (SAP TM, Manhattan, Spider Express):

| Hạng mục | Khuyến nghị tối ưu (Best Practice) | Lợi ích vận hành |
| :--- | :--- | :--- |
| **Mã chuyến** | Hiển thị `Mã gốc + Sequence / Suffix` (VD: `NDA2608-0150 #1` & `NDA2608-0150 #2`) | Dễ dàng tra cứu trên cả phần mềm và sổ sách Excel truyền thống. |
| **Chia tải** | Cho phép chia theo bộ 3: **Số lượng (kiện) + Khối lượng (kg) + Thể tích ($m^3$)** | Ngăn chặn triệt để tình trạng vừa quá tải trọng vừa tràn thể tích thùng xe. |
| **Nhập kho** | Áp dụng **Partial Inbound (Nhập từng xe)** | Tối ưu giải phóng xe nhanh, tránh ùn ứ xe tải chờ đợi tại cổng kho. |
| **Chốt đơn cha** | Đơn cha đạt `ASSIGNED` khi **tất cả trips** đã được xác nhận | Đảm bảo 100% hàng hóa trong kế hoạch đã có phương tiện phụ trách. |
| **Xe thuê ngoài** | Tự động bật cờ cảnh báo `🚛 Xe ngoài` và gửi notify cho Kho kiểm tra hợp đồng | Đảm bảo tính pháp lý và kiểm soát chi phí thuê ngoài chặt chẽ. |

---

## 📝 4. Bảng Ghi Nhận Phỏng Vấn Chuyên Gia (Cheat-Sheet)

*Điều phối viên có thể in hoặc tích chọn trực tiếp khi phỏng vấn chuyên gia:*

```text
Họ tên chuyên gia / Chức vụ: ..............................................................
Đơn vị công tác / Đội xe:   ..............................................................
Ngày phỏng vấn:              ..............................................................

[ ] 1. Quy tắc mã đơn split:
    [ ] A. Dùng chung 1 mã gốc (NDA2608-0150) kèm số chuyến (#1, #2)
    [ ] B. Sinh mã con có hậu tố (NDA2608-0150A, NDA2608-0150B)
    [ ] C. Ý kiến khác: ................................................................

[ ] 2. Quy trình nhập kho Inbound:
    [ ] A. Nhập từng xe (Partial Inbound - Khuyên dùng)
    [ ] B. Bắt buộc gom đủ tất cả các xe mới nhập (Full Inbound)
    [ ] C. Ý kiến khác: ................................................................

[ ] 3. Kiểm soát dung sai tải trọng:
    [ ] A. Bắt buộc chia đủ 100% tải trọng & thể tích
    [ ] B. Cho phép dung sai dư lẻ (sai số ±3% - ±5%)
    [ ] C. Ý kiến khác: ................................................................

[ ] 4. Lộ trình & Thời gian xuất bến:
    [ ] A. Bắt buộc các xe phải xuất phát cùng thời điểm
    [ ] B. Được phép chạy lệch giờ / lệch ngày tự do
    [ ] C. Ý kiến khác: ................................................................

[ ] 5. Hạch toán cước xe thuê ngoài (External Vehicle):
    [ ] A. Tính cước trọn gói theo chuyến xe thuê ngoài
    [ ] B. Phân bổ chi phí theo tỷ lệ khối lượng/thể tích vào đơn hàng gốc
    [ ] C. Ý kiến khác: ................................................................

Ghi chú thêm của chuyên gia:
.........................................................................................
.........................................................................................
```
