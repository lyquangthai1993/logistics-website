# TODO — Task 131: Gộp nhãn tổng trên biểu đồ theo miền

## Yêu cầu

Trong tab “Tất cả” của báo cáo tình hình hàng hóa, mỗi cột biểu đồ theo miền chỉ hiển thị một nhãn là tổng của hàng tại kho và hàng dự kiến nhập kho. Hai tab riêng giữ cách hiển thị theo từng nhóm.

## Công việc

- [x] Cập nhật biểu đồ khối lượng và thể tích để hiển thị một nhãn tổng trên mỗi cột trong tab “Tất cả”.
- [x] Giữ nguyên nhãn riêng cho hai tab “Hàng tại kho” và “Dự kiến nhập kho”.
- [x] Chạy typecheck frontend và kiểm tra trực tiếp trang báo cáo tại `http://localhost:4000/dashboard/admin/reports`.
- [x] Merge thay đổi frontend vào `dev` qua PR #140.
- [x] Đồng bộ gitlink frontend và ghi nhận resolution trong root repository.

## Kiểm chứng

- `npm run typecheck`: PASS.
- Kiểm tra trực tiếp trên browser local: PASS; mỗi cột có một nhãn tổng.
- Playwright: không chạy trong task này.
