# Báo Cáo Rà Soát Dữ Liệu Đối Chiếu 3 Chiều Toàn Hệ Thống

> **Thời gian quét**: 16:38:33 29/10/2026  
> **Môi trường đối chiếu**: Production Database (PostgreSQL / Railway Cloud)  
> **Cơ chế đối chiếu 3 chiều**:  
> 1. **Bảng `order`**: Các trường lưu số lượng nghiệp vụ (`totalQuantity`, `inboundQuantity`, `outboundQuantity`, `remainingQuantity`, `status`).  
> 2. **Sổ cái thực tế `order_inventory_transaction`**: Tổng các dòng nhập kho (`type = INBOUND`) và xuất kho (`type = OUTBOUND`) hợp lệ.  
> 3. **Lịch sử chuyến xe `trip`**: Các chuyến nháp/chuyến gán đã bị hủy/xóa (`deletedAt IS NOT NULL`).

---

## 📊 Tổng Hợp Kết Quả Rà Soát

| Chỉ số | Số lượng | Ghi chú |
| :--- | :---: | :--- |
| **Tổng số đơn phát hiện có sai lệch** | **264 đơn** | Cần theo dõi và xử lý theo từng nhóm |
| **Nhóm 1: Thực tế ĐÃ XUẤT HẾT nhưng kẹt tồn ảo** | **6 đơn** | **ĐÃ ĐỒNG BỘ XONG 100% TRÊN CẢ DEV & PROD** (Tồn thực tế = 0, trạng thái: COMPLETED_INBOUND) |
| **Nhóm 2: Ảnh hưởng trực tiếp do chuyến xe bị xóa** | **6 đơn** | Có chuyến xe bị hủy khiến `inboundQuantity` lớn hơn thực tế trong sổ cái |
| **Nhóm 3: Lệch số lượng khác giữa bảng `order` & sổ cái** | **252 đơn** | Phát sinh từ giai đoạn hệ thống sơ khởi trước khi có sổ cái chuẩn |

---

## 🚨 NHÓM 1: Đã Xuất Hết Thực Tế (Tồn = 0) Nhưng Bị Kẹt Tồn Ảo (6 đơn)
*(Các đơn này kho đã giao sạch 100% nhưng ngoài màn hình vẫn hiển thị "LƯU KHO" hoặc báo còn tồn)*

| STT | Mã vận đơn | ID | Trạng thái hiện tại | Bảng `order` (Tổng/Nhập/Xuất/Tồn) | Sổ cái thực tế (Nhập / Xuất) | Tồn thực tế | Tồn ảo bị treo | Chuyến xóa liên quan |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **`HVP2610-280`** | 824 | `INBOUND` | 1641 / 1641 / 887 / **754** | 887 / 887 | **0** | <span style="color:red;font-weight:bold">+754</span> | SD654 |
| 2 | **`NTC2610-006`** | 787 | `INBOUND` | 367 / 367 / 142 / **225** | 142 / 142 | **0** | <span style="color:red;font-weight:bold">+225</span> | SD638, SD663 |
| 3 | **`NDA2611-0050`** | 681 | `INBOUND` | 348 / 348 / 307 / **41** | 307 / 307 | **0** | <span style="color:red;font-weight:bold">+41</span> | SD663 |
| 4 | **`NKT2610-121`** | 556 | `INBOUND` | 597 / 597 / 524 / **73** | 524 / 524 | **0** | <span style="color:red;font-weight:bold">+73</span> | SD496, SD498, SD565 |
| 5 | **`NKT2610-122`** | 449 | `INBOUND` | 266 / 266 / 229 / **37** | 229 / 229 | **0** | <span style="color:red;font-weight:bold">+37</span> | SD542, SD543 |
| 6 | **`NDA2610-0213`** | 19 | `INBOUND` | 1405 / 809 / 462 / **347** | 462 / 462 | **0** | <span style="color:red;font-weight:bold">+347</span> | SD144, SD146, SD148, SD160, SD164, SD203, SD204, SD205, SD206, SD296, SD564, SD568 |

---

## ⚠️ NHÓM 2: Bị Đội Số Lượng Do Chuyến Xe Nháp Bị Hủy (6 đơn)
*(Đang lưu kho hoặc xuất từng phần, `inboundQuantity` bị cao hơn sổ cái do chuyến xe nháp bị xóa không được hoàn tác)*

| STT | Mã vận đơn | ID | Trạng thái | Bảng `order` (Nhập/Xuất/Tồn) | Sổ cái thực nhập | Lượng nhập ảo bị thừa | Chuyến xe đã xóa gây lỗi | Hàng hóa / Tuyến |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | **`NKT2610-125`** | 937 | `DRAFT` | 283 / 0 / 283 | **0** | <span style="color:orange;font-weight:bold">+283</span> | `SD703` (2 chuyến) | MAY MẶC |
| 2 | **`NDA2611-0058`** | 828 | `DRAFT` | 1 / 0 / 1 | **0** | <span style="color:orange;font-weight:bold">+1</span> | `SD650` (1 chuyến) | KIỆN HÀNG |
| 3 | **`NDA2611-0063`** | 740 | `INBOUND` | 125 / 115 / 10 | **115** | <span style="color:orange;font-weight:bold">+10</span> | `SD607` (2 chuyến) | KM Michelin |
| 4 | **`NDA2611-0062`** | 739 | `INBOUND` | 170 / 160 / 10 | **160** | <span style="color:orange;font-weight:bold">+10</span> | `SD607` (2 chuyến) | KM Michelin |
| 5 | **`NKT2611-004`** | 458 | `INBOUND` | 501 / 335 / 166 | **335** | <span style="color:orange;font-weight:bold">+166</span> | `SD464` (1 chuyến) | Kiện hàng |
| 6 | **`NMT2610-332`** | 277 | `DRAFT` | 80 / 0 / 80 | **0** | <span style="color:orange;font-weight:bold">+80</span> | `SD392` (1 chuyến) | Kệ nước giặt xả Homey (150x85x30)cm |

---

## 📋 NHÓM 3: Chi Tiết Các Đơn Có Sai Lệch Khác (252 đơn)

| STT | Mã vận đơn | ID | Trạng thái | Bảng `order` (Nhập/Xuất/Tồn) | Sổ cái (Nhập/Xuất/Tồn) | Chênh lệch tồn | Mô tả hàng hóa |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | **`NDA2611-0079`** | 864 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | Lốp Michelin |
| 2 | **`NDA2611-0078`** | 863 | `COMPLETED_INBOUND` | 14 / 14 / 0 | 14 / 0 / 14 | -14 | Lốp Michelin |
| 3 | **`NDA2611-0075`** | 862 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Lốp Michelin |
| 4 | **`NDA2611-0074`** | 861 | `COMPLETED_INBOUND` | 23 / 23 / 0 | 23 / 0 / 23 | -23 | Lốp Michelin |
| 5 | **`NDA2611-0073`** | 860 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Lốp Michelin |
| 6 | **`NDA2611-0086`** | 827 | `COMPLETED_INBOUND` | 37 / 37 / 0 | 37 / 0 / 37 | -37 | Nước dừa VicoFresh |
| 7 | **`NDA2611-0077`** | 815 | `COMPLETED_INBOUND` | 52 / 52 / 0 | 52 / 0 / 52 | -52 | Lốp Michelin |
| 8 | **`NDA2611-0076`** | 814 | `COMPLETED_INBOUND` | 38 / 38 / 0 | 38 / 0 / 38 | -38 | Lốp Michelin |
| 9 | **`NMT2611-0016.A`** | 808 | `INBOUND` | 414 / 0 / 414 | 357 / 0 / 357 | +57 | Bộ quà tặng sinh nhật RTLs 2026 (ly giữ nhiệt Kokomi cá hề, sổ tay) |
| 10 | **`DTD2611-003`** | 807 | `COMPLETED_INBOUND` | 23 / 23 / 0 | 23 / 0 / 23 | -23 | SỮA |
| 11 | **`LTL2611-0028`** | 804 | `COMPLETED_INBOUND` | 25 / 25 / 0 | 25 / 0 / 25 | -25 | Hàng vải cuộn |
| 12 | **`NTC2611-005`** | 801 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | KIỆN PALLET |
| 13 | **`LTL2610-0396`** | 799 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | Lốp Kumho 203295419 |
| 14 | **`NTC2610NTF-220`** | 792 | `COMPLETED_INBOUND` | 1009 / 1009 / 0 | 1009 / 0 / 1009 | -1009 | SỮA + 8 LẺ |
| 15 | **`NTC2610NTF-226`** | 791 | `COMPLETED_INBOUND` | 523 / 523 / 0 | 523 / 0 / 523 | -523 | SỮA |
| 16 | **`NAV2611-0010`** | 786 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | PP 1.2*1*1.1 |
| 17 | **`NMT2611-0016.C`** | 777 | `COMPLETED_INBOUND` | 138 / 138 / 0 | 138 / 0 / 138 | -138 | Bộ quà tặng sinh nhật RTLs 2026 (ly giữ nhiệt Kokomi cá hề, sổ tay) |
| 18 | **`LTV2610-0480`** | 776 | `COMPLETED_INBOUND` | 14 / 14 / 0 | 14 / 0 / 14 | -14 | Vải cuộn vico |
| 19 | **`TTH2611-0005`** | 749 | `COMPLETED_INBOUND` | 102 / 102 / 0 | 102 / 0 / 102 | -102 | Rượu Bình Tây |
| 20 | **`NDA2611-0068`** | 745 | `COMPLETED_INBOUND` | 55 / 55 / 0 | 55 / 0 / 55 | -55 | KM Got IT |
| 21 | **`NDA2611-0067`** | 744 | `COMPLETED_INBOUND` | 90 / 90 / 0 | 90 / 0 / 90 | -90 | KM Got IT |
| 22 | **`NDA2611-0066`** | 743 | `COMPLETED_INBOUND` | 25 / 25 / 0 | 25 / 0 / 25 | -25 | KM Got IT |
| 23 | **`NDA2611-0065`** | 742 | `COMPLETED_INBOUND` | 8 / 8 / 0 | 8 / 0 / 8 | -8 | KM Michelin |
| 24 | **`NDA2611-0064`** | 741 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | KM Michelin |
| 25 | **`NDA2611-0061`** | 738 | `COMPLETED_INBOUND` | 9 / 9 / 0 | 9 / 0 / 9 | -9 | KM Michelin |
| 26 | **`NKT2611-009`** | 731 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Kiện hàng |
| 27 | **`NAV2611-0009`** | 729 | `COMPLETED_INBOUND` | 85 / 85 / 0 | 85 / 0 / 85 | -85 | BỈM |
| 28 | **`NAV2611-0005`** | 725 | `COMPLETED_INBOUND` | 29 / 29 / 0 | 29 / 0 / 29 | -29 | BAO CỦI |
| 29 | **`NAV2611-0001`** | 718 | `COMPLETED_INBOUND` | 24 / 31 / 0 | 31 / 31 / 0 | 0 | Vải carton |
| 30 | **`LTV2610-0465`** | 711 | `COMPLETED_INBOUND` | 16 / 16 / 0 | 16 / 0 / 16 | -16 | Vải cuộn vico |
| 31 | **`LTV2610-0467`** | 710 | `COMPLETED_INBOUND` | 129 / 129 / 0 | 129 / 0 / 129 | -129 | Vải cuộn vico |
| 32 | **`NTC2610NTF-207`** | 706 | `COMPLETED_INBOUND` | 205 / 205 / 0 | 205 / 0 / 205 | -205 | SỮA |
| 33 | **`NMT2611-0011`** | 704 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | Pallet hạt nhựa |
| 34 | **`PML2610-310`** | 702 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | KIỆN HÀNG |
| 35 | **`PML2610-309`** | 701 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 36 | **`LTV2610-0466`** | 696 | `COMPLETED_INBOUND` | 94 / 94 / 0 | 94 / 0 / 94 | -94 | VẢI VICO |
| 37 | **`HQA2610-0100`** | 695 | `COMPLETED_INBOUND` | 133 / 133 / 0 | 133 / 0 / 133 | -133 | cốc kem |
| 38 | **`LTV2610-0461`** | 693 | `COMPLETED_INBOUND` | 25 / 25 / 0 | 25 / 0 / 25 | -25 | VẢI VICO |
| 39 | **`TTH2611-0003`** | 691 | `COMPLETED_INBOUND` | 8 / 8 / 0 | 8 / 0 / 8 | -8 | Rượu Bình Tây |
| 40 | **`NDA2611-0054`** | 684 | `COMPLETED_INBOUND` | 45 / 45 / 0 | 45 / 0 / 45 | -45 | KM Got IT |
| 41 | **`NDA2611-0052`** | 683 | `COMPLETED_INBOUND` | 25 / 25 / 0 | 25 / 0 / 25 | -25 | KM Got IT |
| 42 | **`NDA2611-0046`** | 678 | `COMPLETED_INBOUND` | 54 / 54 / 0 | 54 / 0 / 54 | -54 | KM Got IT |
| 43 | **`NDA2611-0039`** | 675 | `COMPLETED_INBOUND` | 35 / 35 / 0 | 35 / 0 / 35 | -35 | KM Got IT |
| 44 | **`NDA2611-0038`** | 674 | `COMPLETED_INBOUND` | 47 / 47 / 0 | 47 / 0 / 47 | -47 | KM Got IT |
| 45 | **`NDA2611-0037`** | 673 | `COMPLETED_INBOUND` | 129 / 129 / 0 | 129 / 0 / 129 | -129 | Lốp Michelin |
| 46 | **`NMT2610-0155`** | 670 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Kiện 120x100x120cm |
| 47 | **`NKT2610-124`** | 669 | `COMPLETED_INBOUND` | 14 / 14 / 0 | 14 / 0 / 14 | -14 | May mặc |
| 48 | **`TTH2611-0002`** | 667 | `COMPLETED_INBOUND` | 28 / 28 / 0 | 28 / 0 / 28 | -28 | Rượu Bình Tây |
| 49 | **`LTL2611-0008`** | 665 | `COMPLETED_INBOUND` | 47 / 47 / 0 | 47 / 0 / 47 | -47 | Hàng vải cuộn |
| 50 | **`LTL2611-0006`** | 664 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | Hàng hạt nhựa  Dim 1.3 * 1.1 * 1.5m/pallet |
| 51 | **`PML2610-297`** | 655 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | CAMPLAS HP |
| 52 | **`LTV2610-0449`** | 653 | `COMPLETED_INBOUND` | 267 / 267 / 0 | 267 / 0 / 267 | -267 | Vải cuộn vico |
| 53 | **`HKN2610-040`** | 614 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KHUÔN |
| 54 | **`NDA2610-0323`** | 611 | `COMPLETED_INBOUND` | 57 / 57 / 0 | 57 / 0 / 57 | -57 | LY THỦY TINH STING |
| 55 | **`HQA2610-0099`** | 610 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | NGUYÊN LIỆU |
| 56 | **`LBD2610-0165TC`** | 600 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 0 / 4 | -4 | RƯỢU |
| 57 | **`NTC2610-095`** | 599 | `COMPLETED_INBOUND` | 75 / 75 / 0 | 75 / 0 / 75 | -75 | HÓA CHẤT |
| 58 | **`NTC2610-096.6`** | 598 | `COMPLETED_INBOUND` | 30 / 30 / 0 | 30 / 0 / 30 | -30 | MÁY ẢNH |
| 59 | **`NTC2610-096.5`** | 597 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | MÁY ẢNH |
| 60 | **`NTC2610-096.4`** | 596 | `COMPLETED_INBOUND` | 45 / 45 / 0 | 45 / 0 / 45 | -45 | MÁY ẢNH |
| 61 | **`NTC2610-096.3`** | 595 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | MÁY ẢNH |
| 62 | **`NTC2610-096.2`** | 594 | `COMPLETED_INBOUND` | 168 / 168 / 0 | 168 / 0 / 168 | -168 | MÁY ẢNH |
| 63 | **`NTC2610-096.1`** | 593 | `COMPLETED_INBOUND` | 23 / 23 / 0 | 23 / 0 / 23 | -23 | MÁY ẢNH |
| 64 | **`HVP2610-265.11`** | 590 | `COMPLETED_INBOUND` | 70 / 70 / 0 | 70 / 0 / 70 | -70 | NƯỚC MẮM |
| 65 | **`HVP2610-265.10`** | 589 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | NƯỚC MẮM |
| 66 | **`HVP2610-265.7`** | 587 | `COMPLETED_INBOUND` | 8 / 8 / 0 | 8 / 0 / 8 | -8 | NƯỚC MẮM |
| 67 | **`HVP2610-265.4`** | 585 | `COMPLETED_INBOUND` | 70 / 70 / 0 | 70 / 0 / 70 | -70 | NƯỚC MẮM |
| 68 | **`HVP2610-265.3`** | 584 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | NƯỚC MẮM |
| 69 | **`HVP2610-265.9`** | 579 | `COMPLETED_INBOUND` | 70 / 70 / 0 | 70 / 0 / 70 | -70 | Nước mắm |
| 70 | **`HVP2610-265.2`** | 577 | `COMPLETED_INBOUND` | 70 / 70 / 0 | 70 / 0 / 70 | -70 | Nước mắm |
| 71 | **`NDA2610-0322`** | 575 | `COMPLETED_INBOUND` | 15 / 15 / 0 | 15 / 0 / 15 | -15 | Lốp Michelin |
| 72 | **`NDA2611-0020`** | 568 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 0 / 4 | -4 | KM MICHELIN |
| 73 | **`HKN2610-039`** | 567 | `COMPLETED_INBOUND` | 72 / 72 / 0 | 72 / 0 / 72 | -72 | VẢI ĐÓNG THÙNG |
| 74 | **`DQT2610-123`** | 565 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Thiết bị |
| 75 | **`NTC2610NTF-206`** | 562 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | SỮA |
| 76 | **`NTC2610NTF-196`** | 560 | `COMPLETED_INBOUND` | 203 / 203 / 0 | 203 / 0 / 203 | -203 | SỮA |
| 77 | **`PML2610-294`** | 557 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 78 | **`LTV2610-0431`** | 555 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Rượu Bình Tây |
| 79 | **`LTV2610-0429`** | 553 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Hạt nhựa Samyang |
| 80 | **`NDA2611-0009`** | 549 | `COMPLETED_INBOUND` | 6121 / 6121 / 0 | 6121 / 0 / 6121 | -6121 | KM 24 ĐƠN MIỀN BẮC |
| 81 | **`NDA2611-0008`** | 548 | `COMPLETED_INBOUND` | 44 / 44 / 0 | 44 / 0 / 44 | -44 | KM MICHELIN |
| 82 | **`NDA2611-0007`** | 547 | `COMPLETED_INBOUND` | 178 / 178 / 0 | 178 / 0 / 178 | -178 | KM MICHELIN |
| 83 | **`NDA2611-0006`** | 546 | `COMPLETED_INBOUND` | 27 / 27 / 0 | 27 / 0 / 27 | -27 | KM MICHELIN |
| 84 | **`NDA2611-0005`** | 545 | `COMPLETED_INBOUND` | 34 / 34 / 0 | 34 / 0 / 34 | -34 | KM MICHELIN |
| 85 | **`NDA2611-0004`** | 544 | `COMPLETED_INBOUND` | 13 / 13 / 0 | 13 / 0 / 13 | -13 | KM MICHELIN |
| 86 | **`NDA2611-0003`** | 543 | `COMPLETED_INBOUND` | 32 / 32 / 0 | 32 / 0 / 32 | -32 | KM MICHELIN |
| 87 | **`NDA2611-0002`** | 542 | `COMPLETED_INBOUND` | 87 / 87 / 0 | 87 / 0 / 87 | -87 | KM MICHELIN |
| 88 | **`NDA2611-0001`** | 541 | `COMPLETED_INBOUND` | 48 / 48 / 0 | 48 / 0 / 48 | -48 | KM MICHELIN |
| 89 | **`NMT2610-362`** | 540 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Robot hút bụi lau nhà Roborock |
| 90 | **`NMT2610-361`** | 539 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Robot hút bụi lau nhà Roborock |
| 91 | **`NMT2610-360`** | 538 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Robot hút bụi lau nhà Roborock |
| 92 | **`NMT2610-358`** | 536 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | Nồi áp suất điện đa năng Elmich 6L |
| 93 | **`NMT2610-357`** | 535 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Nồi áp suất điện đa năng Elmich 6L |
| 94 | **`NMT2610-356`** | 534 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Nồi áp suất điện đa năng Elmich 6L |
| 95 | **`NMT2610-355`** | 533 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | Nồi áp suất điện đa năng Elmich 6L |
| 96 | **`NMT2610-354`** | 532 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Nồi áp suất điện đa năng Elmich 6L |
| 97 | **`NMT2610-351`** | 529 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Nồi lẩu hấp 2 tầng |
| 98 | **`NMT2610-350`** | 528 | `COMPLETED_INBOUND` | 76 / 76 / 0 | 76 / 0 / 76 | -76 | Nồi lẩu hấp 2 tầng |
| 99 | **`NMT2610-349`** | 527 | `COMPLETED_INBOUND` | 29 / 29 / 0 | 29 / 0 / 29 | -29 | Nồi lẩu hấp 2 tầng |
| 100 | **`NMT2610-348`** | 526 | `COMPLETED_INBOUND` | 42 / 42 / 0 | 42 / 0 / 42 | -42 | Nồi lẩu hấp 2 tầng |
| 101 | **`NMT2610-347`** | 525 | `COMPLETED_INBOUND` | 85 / 85 / 0 | 85 / 0 / 85 | -85 | Nồi lẩu hấp 2 tầng |
| 102 | **`NMT2610-344`** | 522 | `COMPLETED_INBOUND` | 75 / 75 / 0 | 75 / 0 / 75 | -75 | Chảo inox nguyên khối Elmich 26cm |
| 103 | **`NMT2610-343`** | 521 | `COMPLETED_INBOUND` | 403 / 403 / 0 | 403 / 0 / 403 | -403 | Chảo inox nguyên khối Elmich 26cm |
| 104 | **`NMT2610-342`** | 520 | `COMPLETED_INBOUND` | 143 / 143 / 0 | 143 / 0 / 143 | -143 | Chảo inox nguyên khối Elmich 26cm |
| 105 | **`NMT2610-341`** | 519 | `COMPLETED_INBOUND` | 294 / 294 / 0 | 294 / 0 / 294 | -294 | Chảo inox nguyên khối Elmich 26cm |
| 106 | **`NMT2610-340`** | 518 | `COMPLETED_INBOUND` | 434 / 868 / 0 | 868 / 434 / 434 | -434 | Chảo inox nguyên khối Elmich 26cm |
| 107 | **`NAV2610-0138`** | 490 | `COMPLETED_INBOUND` | 147 / 147 / 0 | 147 / 0 / 147 | -147 | Bỉm Ngăn rõ các lô vì hàng giống nhau dễ lẫn Không ghép với hàng VLXD, hàng có mùi |
| 108 | **`NAV2610-0137`** | 489 | `COMPLETED_INBOUND` | 324 / 324 / 0 | 324 / 0 / 324 | -324 | Bỉm Ngăn rõ các lô vì hàng giống nhau dễ lẫn Không ghép với hàng VLXD, hàng có mùi |
| 109 | **`HQA2610-0091`** | 488 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | Nguyên liệu thực phẩm |
| 110 | **`LBD2610-0146`** | 484 | `COMPLETED_INBOUND` | 24 / 24 / 0 | 24 / 0 / 24 | -24 | RƯỢU |
| 111 | **`LBD2610-0145`** | 482 | `COMPLETED_INBOUND` | 26 / 26 / 0 | 26 / 0 / 26 | -26 | RƯỢU |
| 112 | **`NTC2610NTF-203`** | 480 | `COMPLETED_INBOUND` | 4751 / 4751 / 0 | 4751 / 4276 / 475 | -475 | SỮA |
| 113 | **`NTC2610NTF-201`** | 479 | `COMPLETED_INBOUND` | 304 / 304 / 0 | 304 / 0 / 304 | -304 | SỮA |
| 114 | **`NTC2610-092`** | 471 | `COMPLETED_INBOUND` | 94 / 94 / 0 | 94 / 0 / 94 | -94 | SCAN |
| 115 | **`NMC2610-087`** | 470 | `COMPLETED_INBOUND` | 36 / 36 / 0 | 36 / 0 / 36 | -36 | pallet |
| 116 | **`DQT2610-122`** | 467 | `COMPLETED_INBOUND` | 58 / 58 / 0 | 58 / 0 / 58 | -58 | Vải cuộn |
| 117 | **`LTV2610-0375B`** | 428 | `COMPLETED_INBOUND` | 643 / 643 / 0 | 643 / 0 / 643 | -643 | Decal |
| 118 | **`LTV2610-0375`** | 426 | `COMPLETED_INBOUND` | 373 / 373 / 0 | 373 / 0 / 373 | -373 | Decal |
| 119 | **`LTL2610-0363`** | 423 | `COMPLETED_INBOUND` | 34 / 34 / 0 | 34 / 0 / 34 | -34 | Lốp Kumho 203273404 |
| 120 | **`PML2610-261`** | 413 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | ABCD |
| 121 | **`NKT2611-003`** | 402 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | Kiện hàng |
| 122 | **`NKT2611-002`** | 401 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | Kiện hàng |
| 123 | **`PML2610-276`** | 400 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | YAZAKI |
| 124 | **`HVP2610-249`** | 399 | `COMPLETED_INBOUND` | 455 / 455 / 0 | 455 / 250 / 205 | -205 | KHAY NHỰA |
| 125 | **`HVP2610-247`** | 397 | `COMPLETED_INBOUND` | 69 / 69 / 0 | 69 / 0 / 69 | -69 | 03NT00611 Nước tương -  03NT00609 Nước tương |
| 126 | **`HQA2610-0085`** | 392 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Nguyên liệu |
| 127 | **`PML2610-274`** | 390 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Kiện hàng VNSTAR |
| 128 | **`PML2610-273`** | 389 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Kiện hàng HAI ANH JSC |
| 129 | **`LTV2610-0399`** | 388 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Hạt nhựa Samyang |
| 130 | **`LTV2610-0389`** | 387 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | Sungju+ 1PL RỖNG |
| 131 | **`HKN2610-033`** | 381 | `COMPLETED_INBOUND` | 11 / 11 / 0 | 11 / 0 / 11 | -11 | THÉP TẤM |
| 132 | **`NDA2610-0293`** | 377 | `COMPLETED_INBOUND` | 3139 / 3139 / 0 | 3139 / 0 / 3139 | -3139 | KHUYẾN MÃI MICHELIN |
| 133 | **`LTL2610-0331`** | 375 | `COMPLETED_INBOUND` | 22 / 22 / 0 | 22 / 0 / 22 | -22 | "Hàng linh kiện Hàng của khách chồng lên nhau được Không cho chồng hàng khác lên" |
| 134 | **`LTL2610-0350`** | 374 | `COMPLETED_INBOUND` | 21 / 21 / 0 | 21 / 0 / 21 | -21 | Lốp Kumho 203267769 |
| 135 | **`LTL2610-0349`** | 373 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | Lốp Kumho 203258728 |
| 136 | **`LTL2610-0348`** | 372 | `COMPLETED_INBOUND` | 100 / 100 / 0 | 100 / 0 / 100 | -100 | Lốp Kumho 203266230 |
| 137 | **`NKT2611-001.1`** | 370 | `COMPLETED_INBOUND` | 19 / 19 / 0 | 19 / 0 / 19 | -19 | Kiện hàng |
| 138 | **`NDA2610-0302`** | 364 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 0 / 4 | -4 | KHUYẾN MÃI MICHELIN |
| 139 | **`NDA2610-0301`** | 363 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | KHUYẾN MÃI MICHELIN |
| 140 | **`NDA2610-0300`** | 362 | `COMPLETED_INBOUND` | 622 / 622 / 0 | 622 / 0 / 622 | -622 | KHUYẾN MÃI MICHELIN |
| 141 | **`NDA2610-0290`** | 359 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | LỐP MICHELIN+ 45 |
| 142 | **`NDA2610-0289`** | 358 | `COMPLETED_INBOUND` | 33 / 33 / 0 | 33 / 0 / 33 | -33 | LỐP Lốp MichelinMICHELIN |
| 143 | **`NDA2610-0288`** | 357 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | Lốp Michelin |
| 144 | **`NDA2610-0287`** | 356 | `COMPLETED_INBOUND` | 84 / 84 / 0 | 84 / 0 / 84 | -84 | LỐP MICHELIN |
| 145 | **`LTL2610-0338`** | 353 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | LỐP KUMHO 203261019 |
| 146 | **`PML2610-260`** | 340 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | Thùng carton |
| 147 | **`NAV2610-0125`** | 333 | `COMPLETED_INBOUND` | 30 / 30 / 0 | 30 / 0 / 30 | -30 | Bao củi |
| 148 | **`HVP2610-245`** | 332 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | MASAN |
| 149 | **`NAV2610-0121`** | 331 | `COMPLETED_INBOUND` | 75 / 75 / 0 | 75 / 0 / 75 | -75 | CARTON |
| 150 | **`NMT2610-337.9`** | 329 | `COMPLETED_INBOUND` | 300 / 300 / 0 | 300 / 0 / 300 | -300 | Giỏ đựng quần áo Santoso |
| 151 | **`NMT2610-337.8`** | 328 | `COMPLETED_INBOUND` | 140 / 140 / 0 | 140 / 0 / 140 | -140 | Giỏ đựng quần áo Santoso |
| 152 | **`NMT2610-337.7`** | 327 | `COMPLETED_INBOUND` | 120 / 120 / 0 | 120 / 0 / 120 | -120 | Giỏ đựng quần áo Santoso |
| 153 | **`NMT2610-337.6`** | 326 | `COMPLETED_INBOUND` | 510 / 510 / 0 | 510 / 0 / 510 | -510 | Giỏ đựng quần áo Santoso |
| 154 | **`NMT2610-337.5`** | 325 | `COMPLETED_INBOUND` | 180 / 180 / 0 | 180 / 0 / 180 | -180 | Giỏ đựng quần áo Santoso |
| 155 | **`NMT2610-337.4`** | 324 | `COMPLETED_INBOUND` | 180 / 180 / 0 | 180 / 10 / 170 | -170 | Giỏ đựng quần áo Santoso |
| 156 | **`NMT2610-337.3`** | 323 | `COMPLETED_INBOUND` | 180 / 180 / 0 | 180 / 0 / 180 | -180 | Giỏ đựng quần áo Santoso |
| 157 | **`NMT2610-337.2`** | 322 | `COMPLETED_INBOUND` | 600 / 600 / 0 | 600 / 0 / 600 | -600 | Giỏ đựng quần áo Santoso |
| 158 | **`NKT26111-001`** | 321 | `COMPLETED_INBOUND` | 7 / 7 / 0 | 7 / 0 / 7 | -7 | KIỆN HÀNG |
| 159 | **`NMT2610-0140`** | 315 | `COMPLETED_INBOUND` | 24 / 24 / 0 | 24 / 0 / 24 | -24 | Sợi |
| 160 | **`LTV2610-0377`** | 295 | `COMPLETED_INBOUND` | 259 / 259 / 0 | 259 / 0 / 259 | -259 | Rượu Bình tây |
| 161 | **`LTV2610-0376`** | 294 | `COMPLETED_INBOUND` | 59 / 59 / 0 | 59 / 0 / 59 | -59 | VẢI CUỘN VICO |
| 162 | **`LTV2610-0371`** | 293 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 0 / 4 | -4 | Màu Caramel |
| 163 | **`NDA2610-0259`** | 281 | `COMPLETED_INBOUND` | 168 / 168 / 0 | 168 / 0 / 168 | -168 | Bóng Kun |
| 164 | **`NDA2610-0271`** | 280 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN |
| 165 | **`NDA2610-0270`** | 279 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN |
| 166 | **`NDA2610-0258`** | 278 | `COMPLETED_INBOUND` | 84 / 84 / 0 | 84 / 0 / 84 | -84 | Bóng Kun |
| 167 | **`NMT2610-331`** | 276 | `COMPLETED_INBOUND` | 30 / 30 / 0 | 30 / 0 / 30 | -30 | Kệ nước giặt xả Homey (150x85x30)cm |
| 168 | **`HQA2610-0075`** | 275 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 169 | **`NDA2610-0280`** | 272 | `COMPLETED_INBOUND` | 78 / 78 / 0 | 78 / 0 / 78 | -78 | Nước dừa VicoFresh |
| 170 | **`NDA2610-0279`** | 271 | `COMPLETED_INBOUND` | 96 / 96 / 0 | 96 / 0 / 96 | -96 | Nước dừa VicoFresh |
| 171 | **`NDA2610-0275`** | 268 | `COMPLETED_INBOUND` | 80 / 80 / 0 | 80 / 0 / 80 | -80 | Nước dừa VicoFresh |
| 172 | **`LBD2610-0120`** | 267 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | Rượu |
| 173 | **`LBD2610-0119`** | 266 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Rượu |
| 174 | **`LBD2610-0118`** | 265 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 0 / 4 | -4 | Rượu |
| 175 | **`LBD2610-0117`** | 264 | `COMPLETED_INBOUND` | 78 / 78 / 0 | 78 / 0 / 78 | -78 | Rượu |
| 176 | **`HVP2610-229`** | 259 | `COMPLETED_INBOUND` | 60 / 60 / 0 | 60 / 0 / 60 | -60 | Nước chấm Nam Ngư pha sẵn tinh tế chấm chiên-nướng 12chai x 300ml Nước chấm Nam Ngư pha sẵn tinh tế chấm lẩu-hấp 12chai x 300ml |
| 177 | **`NTC2610NTF-161`** | 257 | `COMPLETED_INBOUND` | 575 / 575 / 0 | 575 / 0 / 575 | -575 | SỮA + 43 lẻ |
| 178 | **`NAV2610-0120`** | 256 | `COMPLETED_INBOUND` | 95 / 95 / 0 | 95 / 0 / 95 | -95 | BỈM |
| 179 | **`NAV2610-0119`** | 255 | `COMPLETED_INBOUND` | 161 / 161 / 0 | 161 / 0 / 161 | -161 | BỈM |
| 180 | **`NAV2610-0118`** | 254 | `COMPLETED_INBOUND` | 219 / 219 / 0 | 219 / 0 / 219 | -219 | BỈM |
| 181 | **`NAV2610-0117`** | 253 | `COMPLETED_INBOUND` | 146 / 146 / 0 | 146 / 0 / 146 | -146 | BỈM |
| 182 | **`NAV2610-0115`** | 252 | `COMPLETED_INBOUND` | 318 / 318 / 0 | 318 / 0 / 318 | -318 | Carton |
| 183 | **`PML2610-253`** | 251 | `COMPLETED_INBOUND` | 44 / 44 / 0 | 44 / 0 / 44 | -44 | CARTON |
| 184 | **`DTD2610-031`** | 249 | `COMPLETED_INBOUND` | 89 / 89 / 0 | 89 / 0 / 89 | -89 | CARTON |
| 185 | **`DTD2610-035`** | 238 | `COMPLETED_INBOUND` | 250 / 250 / 0 | 250 / 0 / 250 | -250 | SỮA |
| 186 | **`NDA2610-0273`** | 237 | `COMPLETED_INBOUND` | 18 / 18 / 0 | 18 / 0 / 18 | -18 | Lốp Michelin |
| 187 | **`NMT2610-320`** | 231 | `COMPLETED_INBOUND` | 155 / 155 / 0 | 155 / 0 / 155 | -155 | Vỉ treo xốt CHIN-SU mỹ vị (72.5x28.2)cm |
| 188 | **`NMT2610-318`** | 229 | `COMPLETED_INBOUND` | 440 / 440 / 0 | 440 / 0 / 440 | -440 | Vỉ treo xốt CHIN-SU mỹ vị (72.5x28.2)cm |
| 189 | **`NMT2610-317`** | 228 | `COMPLETED_INBOUND` | 660 / 660 / 0 | 660 / 0 / 660 | -660 | Vỉ treo xốt CHIN-SU mỹ vị (72.5x28.2)cm |
| 190 | **`NDA2610-0269`** | 226 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | LINH KIỆN |
| 191 | **`NMC2610-082`** | 225 | `COMPLETED_INBOUND` | 30 / 30 / 0 | 30 / 0 / 30 | -30 | LỐP |
| 192 | **`NMT2610-329`** | 224 | `COMPLETED_INBOUND` | 33 / 33 / 0 | 33 / 0 / 33 | -33 | CHÉN SỨ + ĐĨA SỨ |
| 193 | **`NMT2611-0001`** | 223 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 194 | **`PML2610-247`** | 218 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | CAMPLAS QN |
| 195 | **`PML2610-246`** | 217 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | CAMPLAS HP |
| 196 | **`NTC2610NTF-155`** | 214 | `COMPLETED_INBOUND` | 184 / 184 / 0 | 184 / 0 / 184 | -184 | SỮA |
| 197 | **`LTV2610-0357`** | 203 | `COMPLETED_INBOUND` | 30 / 30 / 0 | 30 / 0 / 30 | -30 | Vải cuộn vico |
| 198 | **`LTV2610-0356`** | 202 | `COMPLETED_INBOUND` | 49 / 49 / 0 | 49 / 0 / 49 | -49 | VẢI VICO |
| 199 | **`LTV2610-0355`** | 201 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | HẠT NHỰA |
| 200 | **`NMT2610-328`** | 199 | `COMPLETED_INBOUND` | 81 / 81 / 0 | 81 / 35 / 46 | -46 | MASAN |
| 201 | **`HQA2610-0067`** | 196 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | CARTON |
| 202 | **`LKN2610-012`** | 192 | `COMPLETED_INBOUND` | 16 / 16 / 0 | 16 / 0 / 16 | -16 | HÀNG DA |
| 203 | **`LTV2610-0346`** | 189 | `COMPLETED_INBOUND` | 4 / 4 / 0 | 4 / 2 / 2 | -2 | HẠT NHỰA |
| 204 | **`DTD2610-030`** | 176 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | KIỆN PALLET |
| 205 | **`NDA2610-0256`** | 169 | `COMPLETED_INBOUND` | 14 / 14 / 0 | 14 / 0 / 14 | -14 | LỐP MICHELIN |
| 206 | **`NDA2610-0255A`** | 168 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 207 | **`NDA2610-0255`** | 167 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 208 | **`LBD2610-0102`** | 127 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | Rượu |
| 209 | **`LBD2610-0100`** | 125 | `COMPLETED_INBOUND` | 13 / 13 / 0 | 13 / 0 / 13 | -13 | Rượu |
| 210 | **`LBD2610-0099`** | 124 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Rượu |
| 211 | **`LTL2610-0317`** | 123 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | HÀNG HẠT NHỰA |
| 212 | **`HKN2610-017`** | 121 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | PALLET |
| 213 | **`NTC2610-074.4`** | 112 | `COMPLETED_INBOUND` | 34 / 34 / 0 | 34 / 0 / 34 | -34 | MÁY ẢNH |
| 214 | **`NTC2610-074.3`** | 111 | `COMPLETED_INBOUND` | 3 / 3 / 0 | 3 / 0 / 3 | -3 | MÁY ẢNH |
| 215 | **`NTC2610-074.2`** | 110 | `COMPLETED_INBOUND` | 31 / 31 / 0 | 31 / 0 / 31 | -31 | MÁY ẢNH |
| 216 | **`NTC2610-074.1`** | 109 | `COMPLETED_INBOUND` | 7 / 7 / 0 | 7 / 0 / 7 | -7 | MÁY ẢNH |
| 217 | **`NTC2610-073.2`** | 108 | `COMPLETED_INBOUND` | 168 / 168 / 0 | 168 / 17 / 151 | -151 | MÁY ẢNH |
| 218 | **`NTC2610-073.1`** | 107 | `COMPLETED_INBOUND` | 82 / 82 / 0 | 82 / 0 / 82 | -82 | MÁY ẢNH |
| 219 | **`HQA2610-0064`** | 105 | `COMPLETED_INBOUND` | 64 / 64 / 0 | 64 / 0 / 64 | -64 | NGUYÊN LIỆU |
| 220 | **`NKT2610-107`** | 103 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 221 | **`NKT2610-105`** | 102 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN HÀNG |
| 222 | **`NKT2610-104.1`** | 101 | `COMPLETED_INBOUND` | 6 / 6 / 0 | 6 / 0 / 6 | -6 | KIỆN HÀNG |
| 223 | **`NKT2610-104`** | 100 | `COMPLETED_INBOUND` | 88 / 88 / 0 | 88 / 0 / 88 | -88 | KIỆN HÀNG |
| 224 | **`NKT2610-106`** | 99 | `COMPLETED_INBOUND` | 20 / 20 / 0 | 20 / 0 / 20 | -20 | BAO BÌ |
| 225 | **`LKN2610-009`** | 96 | `COMPLETED_INBOUND` | 15 / 15 / 0 | 15 / 0 / 15 | -15 | HÀNG GIA |
| 226 | **`NTC2610NTF-132`** | 94 | `COMPLETED_INBOUND` | 379 / 379 / 0 | 379 / 0 / 379 | -379 | SỮA |
| 227 | **`NTC2610-072`** | 93 | `COMPLETED_INBOUND` | 70 / 70 / 0 | 70 / 0 / 70 | -70 | GẠO |
| 228 | **`NTC2610-071`** | 92 | `COMPLETED_INBOUND` | 68 / 68 / 0 | 68 / 0 / 68 | -68 | GẠO |
| 229 | **`LTV2610-0332`** | 91 | `COMPLETED_INBOUND` | 146 / 146 / 0 | 146 / 0 / 146 | -146 | Rượu Bình tây |
| 230 | **`HKN2610-014`** | 89 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | PALLET |
| 231 | **`HKN2610-016`** | 88 | `COMPLETED_INBOUND` | 5 / 5 / 0 | 5 / 0 / 5 | -5 | PALLET |
| 232 | **`NDA2610-0244`** | 87 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | Lốp Michelin |
| 233 | **`LTV2610-0324`** | 86 | `COMPLETED_INBOUND` | 34 / 34 / 0 | 34 / 0 / 34 | -34 | Rượu Bình tây |
| 234 | **`LTV2610-0323`** | 85 | `COMPLETED_INBOUND` | 12 / 12 / 0 | 12 / 0 / 12 | -12 | Rượu Bình tây |
| 235 | **`DQT2610-093`** | 75 | `COMPLETED_INBOUND` | 84 / 84 / 0 | 84 / 0 / 84 | -84 | Vải cuộn |
| 236 | **`LTV2610-0304.5`** | 74 | `COMPLETED_INBOUND` | 233 / 233 / 0 | 233 / 0 / 233 | -233 | Vải cuộn vico |
| 237 | **`LTV2610-0304.2`** | 72 | `COMPLETED_INBOUND` | 23 / 23 / 0 | 23 / 0 / 23 | -23 | Vải cuộn vico |
| 238 | **`NMT2610-310`** | 58 | `COMPLETED_INBOUND` | 10 / 10 / 0 | 10 / 0 / 10 | -10 | Dù đứng Nam Ngư thêm hạnh phúc |
| 239 | **`NTC2610-057`** | 54 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | RIKEN |
| 240 | **`NTC2610NTF-126`** | 49 | `COMPLETED_INBOUND` | 448 / 448 / 0 | 448 / 0 / 448 | -448 | Sữa Nutifood |
| 241 | **`NKT2610-099`** | 48 | `COMPLETED_INBOUND` | 41 / 41 / 0 | 41 / 0 / 41 | -41 | Kiện hàng 2 pallet + 39 kiện |
| 242 | **`HKN2610-015`** | 47 | `COMPLETED_INBOUND` | 75 / 75 / 0 | 75 / 0 / 75 | -75 | SỢI ĐÓNG THÙNG |
| 243 | **`PML2610-211`** | 44 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | KIỆN PALLET |
| 244 | **`NMT2610-0120`** | 43 | `COMPLETED_INBOUND` | 2 / 2 / 0 | 2 / 0 / 2 | -2 | LINH KIỆN |
| 245 | **`NQT2610-067`** | 28 | `COMPLETED_INBOUND` | 293 / 293 / 0 | 293 / 0 / 293 | -293 | LEVIS |
| 246 | **`NMT2610-0119`** | 27 | `COMPLETED_INBOUND` | 14 / 14 / 0 | 14 / 0 / 14 | -14 | LINH KIỆN |
| 247 | **`NDA2610-0185`** | 15 | `COMPLETED_INBOUND` | 162 / 162 / 0 | 162 / 0 / 162 | -162 | SNACK |
| 248 | **`HVP2609-154.3`** | 12 | `INBOUND` | 997 / 824 / 173 | 997 / 0 / 997 | -824 | NGUYÊN LIỆU |
| 249 | **`NMT2609-013LF`** | 7 | `COMPLETED_INBOUND` | 9 / 9 / 0 | 9 / 0 / 9 | -9 | Leaflet chương trình BW Omachi thần ớt (1 KIỆN) |
| 250 | **`NMT2609-013KQ`** | 6 | `COMPLETED_INBOUND` | 9 / 9 / 0 | 9 / 0 / 9 | -9 | Gấu mền khổ qua |
| 251 | **`NMT2609-013LY`** | 5 | `COMPLETED_INBOUND` | 1 / 1 / 0 | 1 / 0 / 1 | -1 | LY GIỮ NHIỆT (1 THÙNG LẺ) |
| 252 | **`NMT2609-013TO`** | 4 | `COMPLETED_INBOUND` | 16 / 16 / 0 | 16 / 0 / 16 | -16 | GẤU MỀN THẦN ỚT (16 BAO + 2 LẺ) |

---

## 🛠️ Đề Xuất Hướng Xử Lý & Câu Lệnh SQL An Toàn

### 1. Đồng bộ cho Nhóm 1 (Đã xuất hết thực tế -> chuyển về COMPLETED_INBOUND, Tồn = 0):
```sql
-- Cập nhật đồng bộ các đơn thực tế đã xuất sạch 100% kho
UPDATE "order" o
SET "totalQuantity" = sub.ledger_inbound,
    "inboundQuantity" = sub.ledger_inbound,
    "outboundQuantity" = sub.ledger_outbound,
    "remainingQuantity" = 0,
    status = 'COMPLETED_INBOUND',
    "updatedAt" = NOW()
FROM (
  SELECT 
    "orderId",
    COALESCE(SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE 0 END), 0) AS ledger_inbound,
    COALESCE(SUM(CASE WHEN type = 'OUTBOUND' THEN quantity ELSE 0 END), 0) AS ledger_outbound
  FROM order_inventory_transaction
  WHERE "deletedAt" IS NULL
  GROUP BY "orderId"
) sub
WHERE o.id = sub."orderId"
  AND sub.ledger_inbound > 0
  AND sub.ledger_inbound = sub.ledger_outbound
  AND o."remainingQuantity" > 0;
```

### 2. Đồng bộ cho Nhóm 2 (Cân chỉnh lại số lượng nhập theo đúng sổ cái):
```sql
-- Cân chỉnh lại inboundQuantity theo đúng sổ cái kho, không làm thay đổi các chuyến xuất thực tế
UPDATE "order" o
SET "totalQuantity" = sub.ledger_inbound,
    "inboundQuantity" = sub.ledger_inbound,
    "remainingQuantity" = GREATEST(0, sub.ledger_inbound - o."outboundQuantity"),
    status = CASE 
      WHEN (sub.ledger_inbound - o."outboundQuantity") <= 0 AND o."outboundQuantity" > 0 THEN 'COMPLETED_INBOUND'
      ELSE o.status
    END,
    "updatedAt" = NOW()
FROM (
  SELECT 
    "orderId",
    COALESCE(SUM(quantity), 0) AS ledger_inbound
  FROM order_inventory_transaction
  WHERE type = 'INBOUND' AND "deletedAt" IS NULL
  GROUP BY "orderId"
) sub
WHERE o.id = sub."orderId"
  AND o."inboundQuantity" > sub.ledger_inbound
  AND o.id IN (937, 828, 740, 739, 458, 277);
```
