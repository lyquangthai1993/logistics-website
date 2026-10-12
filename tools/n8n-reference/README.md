# Hướng dẫn quản lý n8n Local

Thư mục này chứa cấu hình triển khai **n8n** chạy qua Docker Compose.

---

## 1. Yêu cầu trước khi chạy
- Mở ứng dụng **Docker Desktop** trên Windows và đảm bảo Docker Engine đã khởi động (biểu tượng màu xanh lá ở góc dưới bên trái của Docker Desktop).

---

## 2. Các lệnh thông dụng (chạy tại thư mục `n8n`)

### Khởi chạy n8n ngầm (chạy nền)
```powershell
docker compose up -d
```

### Xem log tiến trình n8n
```powershell
docker compose logs -f
```

### Tắt n8n
```powershell
docker compose down
```

### Khởi động lại n8n
```powershell
docker compose restart
```

### Cập nhật n8n lên phiên bản mới nhất
```powershell
docker compose pull
docker compose up -d
```

---

## 3. Truy cập n8n
- Mở trình duyệt: **[http://localhost:5678](http://localhost:5678)**
- Đăng ký tài khoản Admin/Owner trong lần chạy đầu tiên.

---

## 4. Dữ liệu n8n được lưu ở đâu?
- Toàn bộ workflows, credentials và cấu hình được lưu trong Docker volume mang tên `n8n_data`.
- Dữ liệu hoàn toàn không bị mất khi bạn `docker compose down` hoặc tắt máy tính.
