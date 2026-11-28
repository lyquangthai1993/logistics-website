# Task 128 — Hub nhận chỉ thấy trip sau khi Hub nguồn xác nhận

**Branch:** `fix/task-128-warehouse-interhub-draft-visibility`

## Bối cảnh vận hành

Hub HCM tạo trip xuất luân chuyển sang Hub Hưng Yên và lưu nháp. Trip nháp không được xuất hiện trên màn hình Nhập kho của Hub nhận; sau khi Hub HCM xác nhận xuất, Hub Hưng Yên cần thấy trip để tiếp nhận.

## Hub và tài khoản kiểm thử

- Hub nguồn: Andromeda Hub - HCM, `USER_WAREHOUSE_HCM`.
- Hub nhận: Polaris Hub - Hưng Yên, `USER_WAREHOUSE_HYN`.
- E2E dùng dữ liệu PostgreSQL thật, tạo fixture duy nhất theo lần chạy và dọn fixture sau test.

## Phân tích nguyên nhân

`getInboundTrips()` lấy các điểm dừng nhận hàng đã được tạo ngay lúc lưu trip nháp. Do chưa loại trip `TRANSFER` có trạng thái `PENDING`, điểm dừng Hưng Yên bị hiển thị trước khi Hub nguồn xác nhận. Bổ sung điều kiện loại các trip nháp; khi xác nhận, trip chuyển trạng thái và tiếp tục xuất hiện như trước.

## Thiết kế và phạm vi

- Chỉ thay đổi điều kiện truy vấn danh sách trip Nhập kho.
- Không thay đổi schema, API contract, RBAC hoặc giao diện.
- E2E kiểm tra cả trạng thái vắng mặt trước xác nhận và hiện diện sau xác nhận qua API và giao diện.

## Checklist

- [x] Chặn trip luân chuyển nháp khỏi danh sách nhập kho Hub nhận.
- [x] Thêm E2E HCM → Hưng Yên với thao tác lưu nháp, xác nhận xuất, kiểm tra API/UI và dọn dữ liệu.
- [x] Local E2E trước merge: 1 passed; build backend và TypeScript frontend passed.
- [x] E2E auditor: 43/50, 0 Auto-Fails.
- [x] Merge backend PR #78, frontend PR #150 và root PR #106 vào `dev`.
- [x] Chạy lại local E2E sau merge: 1 passed.
- [x] Xác minh Railway Dev build/cutover/health; Cloud Dev E2E: 1 passed.

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### Các bước kiểm thử

1. Đăng nhập Hub HCM bằng `USER_WAREHOUSE_HCM`.
2. Tạo dữ liệu hàng tồn thật và lưu trip xuất luân chuyển tới Hub Hưng Yên ở trạng thái nháp.
3. Gọi API danh sách trip nhập kho dưới ngữ cảnh Hub Hưng Yên; xác nhận trip chưa xuất hiện.
4. Xác nhận xuất trip tại Hub HCM.
5. Gọi lại API danh sách nhập kho; xác nhận trip xuất hiện với trạng thái chờ tiếp nhận.
6. Đăng nhập `USER_WAREHOUSE_HYN`, tìm trip bằng ô tìm kiếm trên màn Nhập kho và xác nhận có đúng một dòng trip.
7. Chụp ảnh trực tiếp từ UI thật; rollback trip và xóa fixture.

Ảnh: `feedbacks/feedback_11_28_task_128_interhub_draft_visibility/screenshot_01_hyn_sees_confirmed_transfer_verified.png`

Spec: `frontend/e2e/128-interhub-transfer-draft-visibility.spec.ts`.

### Edge cases

| ID | Trường hợp | Kỳ vọng |
|---|---|---|
| EC-01 | Trip luân chuyển còn nháp | Hub nhận không thấy trip |
| EC-02 | Trip đã xác nhận xuất | Hub nhận thấy trip chờ tiếp nhận |
| EC-03 | Hub không nằm trong địa chỉ giao | Không lộ trip ở hub đó |
| EC-04 | Trip xuất thường, không phải luân chuyển | Giữ nguyên quy tắc hiển thị hiện hành |
| EC-05 | Trip bị xóa mềm | Không xuất hiện |
| EC-06 | Trip đã hoàn tất/đã nhận | Giữ nguyên quy tắc trạng thái hiện hành |
| EC-07 | Nhiều điểm dừng nhận trong cùng trip | Chỉ các hub được giao thấy trip sau xác nhận |
| EC-08 | Hub nguồn mở lại danh sách nháp | Vẫn chỉnh sửa được trước khi xác nhận |
| EC-09 | Tải lại trang Hub nhận sau xác nhận | Trip vẫn xuất hiện từ dữ liệu backend |
| EC-10 | Dọn fixture sau kiểm thử | Trip và dữ liệu thử không còn gây nhiễu |
