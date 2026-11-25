# Task 130 — Cộng CBM hàng còn lưu kho

## Phạm vi

- [x] Bảng đơn kho ở chế độ `Tất cả` và `Lưu kho` hiển thị thể tích, khối lượng còn tồn.
- [x] Snapshot `ALL` và `INBOUND` cộng số liệu còn tồn sau xuất.
- [x] Giữ số liệu hợp đồng ở đơn nháp và đơn đã xuất.
- [x] Cập nhật quy trình dữ liệu và nhật ký hệ thống.
- [x] Build backend thành công.
- [x] Đối chiếu DB chỉ đọc: nhập 114,88 m³, xuất 102,16 m³, còn 12,72 m³.
- [x] Sau deploy Dev, API và browser đều hiển thị 12,72 m³ cho `NMT2611-0057.G`.

## Nghiệm thu

- Backend PR [#71](https://github.com/lyquangthai1993/logistics-website-backend/pull/71) và root pointer PR [#94](https://github.com/lyquangthai1993/logistics-website/pull/94) đã merge vào `dev`.
- Railway Dev backend build `SUCCESS`, commit `6d56425a95215430ffec58fda8b73f959e9e18b0` đã active/cutover, health HTTP 200.
- Spec `120-warehouse-orders-hub-metrics-parity` thất bại ở assertion số kiện của `DTD2611-0067` (API `2`, UI `0 / 1`), trước khi kiểm tra thể tích. Không tính spec là đạt.
- Frontend typecheck còn lỗi có sẵn tại `e2e/119-regional-dispatch-report.spec.ts:112` (`Hub` không có thuộc tính `hub`).
- Không thay đổi schema hoặc ghi sửa dữ liệu giao dịch.
