# TODO: Tam suất khi Super Admin điều chỉnh giao dịch kho

> **Task ID**: 127
> **Ngày tiếp nhận**: 25/11/2026
> **Phạm vi**: Màn chi tiết giao dịch kho và API Super Admin
> **Trạng thái**: Hoàn tất, đã merge vào `dev`

## Giao diện

- [x] Mở chỉnh sửa với ba trường kiện, m³ và kg.
- [x] Tính lại m³/kg sau 3 giây từ lần sửa kiện cuối, dùng số liệu gốc của giao dịch cho cả tăng và giảm.
- [x] Thông báo tại dòng khi dữ liệu gốc không hợp lệ; giữ số liệu và khóa Lưu cho đến khi kiện, kg, m³ hợp lệ.
- [x] Hủy chỉnh sửa không ghi thay đổi; dọn timer khi đóng hoặc bỏ dòng.

## Backend

- [x] API Super Admin lưu kiện, kg và m³ trong cùng transaction; giữ kiểm tra tồn kho hiện hữu.
- [x] Đồng bộ tổng kg/m³ của đơn nhập, phân bổ chuyến xe và nhật ký số liệu cũ/mới.
- [x] Không đổi schema hoặc migration.

## Kiểm thử và nghiệm thu

- [x] Backend build thành công.
- [x] Cloud Dev Playwright: 2/2 kịch bản đạt — tam suất/lưu giao dịch và dòng xuất có kg/m³ gốc bằng 0.
- [x] E2E code auditor: 50/50, không Auto-FAIL.
- [x] Railway Dev xác nhận build `SUCCESS`, cutover và commit khớp `dev`.
- [x] Ảnh bằng chứng thực tế được lưu trong thư mục này.

## Ma trận 10 trường hợp biên

| # | Trường hợp | Kỳ vọng |
|---|---|---|
| 1 | Nhập/dán kiện liên tiếp | Chỉ tính sau 3 giây từ lần sửa cuối |
| 2 | Tăng kiện | kg/m³ tăng theo tỷ lệ giao dịch gốc |
| 3 | Giảm kiện | kg/m³ giảm theo tỷ lệ giao dịch gốc |
| 4 | Sửa tay kg/m³ trong lúc chờ | Kết quả tam suất sau debounce được áp dụng |
| 5 | Số kiện gốc bằng 0 | Không tính, báo lý do, không cho lưu nếu dữ liệu chưa hợp lệ |
| 6 | Kg gốc bằng 0 | Không tính; giữ giá trị, yêu cầu nhập kg và m³ hợp lệ |
| 7 | m³ gốc bằng 0 | Không tính; giữ giá trị, yêu cầu nhập kg và m³ hợp lệ |
| 8 | Kiện mới trống, 0, âm hoặc không nguyên | Không cho lưu; tối thiểu 1 kiện |
| 9 | Kg hoặc m³ nhập tay không lớn hơn 0 | Không cho lưu |
| 10 | Tăng xuất vượt tổng nhập | API từ chối và transaction rollback, không âm tồn |

**Ghi chú kiểm thử:** Cloud Dev đã chạy hai kịch bản E2E thực tế, gồm cả dòng xuất có dữ liệu gốc không hợp lệ. E2E local không chạy vì cổng 4000/4001 đang phục vụ checkout chính thay vì feature worktree. Frontend typecheck báo lỗi có sẵn tại `e2e/119-regional-dispatch-report.spec.ts:112`, ngoài phạm vi thay đổi.
