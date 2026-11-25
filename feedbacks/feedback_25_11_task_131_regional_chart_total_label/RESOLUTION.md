# Biên bản nghiệm thu — Task 131: Gộp nhãn tổng trên biểu đồ theo miền

> **Thời gian nghiệm thu**: 25/11/2026
> **Trạng thái thực thi**: ✅ Hoàn thành (5/5 mục)
> **Phạm vi tác động**: Biểu đồ báo cáo điều phối theo miền (frontend)
> **PR frontend**: [#140](https://github.com/lyquangthai1993/logistics-website-frontend/pull/140) — merge vào `dev`
> **Frontend merge SHA**: `5f304a96b3848ab7a4ae6b228f6ca7cd03d0553d`

---

## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)

Tab “Tất cả” hiển thị hai phần của cùng một tổng trên mỗi thanh xếp chồng, gây rối khi đọc. Thay đổi đặt một nhãn tổng duy nhất ở cuối mỗi thanh, gồm hàng tại kho và dự kiến nhập kho. Các tab riêng vẫn giữ nhãn theo từng nhóm.

* Tab “Tất cả”: một nhãn tổng cho khối lượng và thể tích của từng miền.
* Tab “Hàng tại kho” và “Dự kiến nhập kho”: giữ nhãn chi tiết hiện tại.

## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung

Trong tab tổng, nhãn được đặt ở cuối thanh xếp chồng để tổng vẫn hiển thị khi một trong hai nhóm có giá trị bằng 0. Các nhãn của hai tab riêng không đổi.

## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)

Không phát sinh quy tắc nghiệp vụ hoặc thay đổi API/DB. Chỉ thay đổi cách gắn nhãn của biểu đồ ở tab tổng.

---

## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)

- **Frontend typecheck**: PASS (`npm run typecheck`).
- **Kiểm tra browser local**: PASS tại `http://localhost:4000/dashboard/admin/reports`; mỗi cột trong tab tổng có một nhãn tổng.
- **Playwright**: Không chạy trong task này.
- **Railway Dev**: READY (`npm run railway:verify -- --json`, 25/11/2026).
  * Frontend `frontend-tms-core`: expected/latest/active SHA `5f304a96b3848ab7a4ae6b228f6ca7cd03d0553d`; build `SUCCESS`; latest và active deployment `0c1a9662-92c3-471f-a14c-e8fdc404c1d6`; HTTP 307.
  * Backend `backend-tms-core`: expected/latest/active SHA `6d56425a95215430ffec58fda8b73f959e9e18b0`; build `SUCCESS`; latest và active deployment `acec879c-40a7-4136-bbbf-b67435af03e1`; health HTTP 200.

---

## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)

- `frontend/src/features/admin-reports/components/super-admin-regional-dispatch-table.tsx`
- Root gitlink `frontend` cập nhật tới frontend `dev` SHA `5f304a96b3848ab7a4ae6b228f6ca7cd03d0553d`.

---

## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo

> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:
> Tài liệu này cùng với [`TODO.md`](./TODO.md) và [`docs/SYSTEM_TIMELINE.md`](../../docs/SYSTEM_TIMELINE.md) ghi nhận thay đổi và bằng chứng kiểm chứng của task. Task này không thay đổi API, cơ sở dữ liệu hoặc quy tắc nghiệp vụ.
