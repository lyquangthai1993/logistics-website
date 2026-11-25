# Task 130 — Cộng CBM hàng còn lưu kho

## Nguyên nhân

Bảng nhóm đơn hàng đang cộng `totalVolume` gốc cho đơn còn lưu kho, trong khi giao dịch xuất đã làm giảm lượng hàng thực tế còn tại kho. Với `NMT2611-0057.G`, sổ giao dịch ghi nhận nhập 114,88 m³, xuất 102,16 m³; lượng còn lại là 12,72 m³.

## Thay đổi

- Danh sách kho ở trạng thái `ALL` / `INBOUND` và các alias lưu kho dùng `remainingWeight` / `remainingVolume` cho từng đơn và tổng.
- Đơn nháp và đơn đã xuất giữ số liệu hợp đồng ban đầu.
- Snapshot `ALL` / `INBOUND` dùng tổng còn tồn; chu kỳ cập nhật và `calculatedAt` không đổi.
- Cập nhật tài liệu quy trình snapshot và nhật ký hệ thống.
- Không đổi schema và không ghi sửa giao dịch đã lưu.

## Kiểm tra

- Backend `npm run build`: PASS.
- DB truy vấn chỉ đọc: inbound 114,88 m³; outbound 102,16 m³; phần còn lại 12,72 m³.
- Cloud Dev: commit backend `6d56425a95215430ffec58fda8b73f959e9e18b0` đạt `SUCCESS`, đã active/cutover; health HTTP 200. Frontend Dev active và trả HTTP 307.
- Smoke browser/API trực tiếp cho `NMT2611-0057.G`: cả API và ô m³ trên UI trả `12.72`.
- Playwright `e2e/120-warehouse-orders-hub-metrics-parity.spec.ts`: FAIL tại dòng 182 khi so số kiện của đơn `DTD2611-0067` (UI `0 / 1`, API tổng `2`); chưa tới assertion kg/m³. Không đánh dấu spec đạt.
- Frontend typecheck: FAIL tại lỗi có sẵn `e2e/119-regional-dispatch-report.spec.ts:112`, kiểu Hub thiếu thuộc tính `hub`.

## Merge

- Backend PR [#71](https://github.com/lyquangthai1993/logistics-website-backend/pull/71) → `dev`.
- Root submodule pointer PR [#94](https://github.com/lyquangthai1993/logistics-website/pull/94) → `dev`.
