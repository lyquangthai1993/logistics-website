# Zero-Hang & Non-Blocking Execution Mandate (Quy Chuẩn Chống Treo Script & Triệt Tiêu Kẹt Queue Messages)

> **Mã quy chuẩn**: `RULE-ANTI-HANG-EXEC-01`  
> **Phạm vi áp dụng**: Toàn bộ AI Agents (`/leader`, `/todo-agent`, `/n8n-expert`), scripts trong `scripts/`, `tools/`, `scratch/`, và mọi lệnh terminal thực thi qua `run_command` trong Antigravity IDE.

---

## 🚨 1. Bối Cảnh & Nguy Cơ Khóa Phiên (The Queue Deadlock)

Trong Antigravity IDE, khi AI thực thi một câu lệnh qua `run_command`:
1. **Ngưỡng chuyển Background Task**: Nếu câu lệnh chạy quá thời gian chờ đồng bộ (`WaitMsBeforeAsync`, thường là 5.000ms – 10.000ms), Antigravity sẽ tự động đẩy câu lệnh đó vào hàng đợi tiến trình chạy ngầm (**Background Task** hiển thị dạng `[>_] N Background Processes Running`).
2. **Khóa phiên (Session Lock)**: Một khi có Background Task đang chạy ngầm mà bị **treo vĩnh viễn (hang/deadlock)**, vòng lặp điều khiển của Antigravity sẽ bị khóa ở trạng thái chờ phản hồi (`await reactive wakeup`).
3. **Đóng băng tin nhắn người dùng (Queued Messages Blocked)**: Mọi tin nhắn tiếp theo người dùng nhập vào khung chat sẽ bị dồn vào `User-Queued Messages` và **hoàn toàn không được xử lý**. Người dùng buộc phải mở khay tiến trình, bấm nút `[X]` hủy tay thì phiên chat mới được giải phóng.

---

## 🛑 2. Ba Nguyên Nhân Treo Bị Cấm Tuyệt Đối (Prohibited Anti-Patterns)

1. **Node.js Active Handle / Unclosed Socket Hang**:
   - Sử dụng các thư viện mạng/DB (`pg.Client`, `fetch`, `ioredis`, `ws`, `http.createServer`) nhưng khi chạy xong hoặc khi gặp exception (`catch`) lại **không đóng socket trong khối `finally`**.
   - Socket TCP mở giữ Node.js Event Loop luôn sống, khiến process không bao giờ `exit`.

2. **Git Non-Interactive Credential / Stdin Hang**:
   - Chạy lệnh remote git (`git push`, `git fetch`, `git clone`) trong môi trường terminal ẩn (không có TTY console). Khi Git mở Git Credential Manager (GCM popup), hỏi SSH passphrase hoặc chờ mạng, tiến trình đứng im mãi mãi chờ bàn phím người dùng.
   - Nối chuỗi nhiều lệnh nặng liên tiếp bằng dấu `;` (`git add ...; git commit ...; git push ...`) làm vượt ngưỡng 10s và chắc chắn bị đẩy vào background task.

3. **Lệnh Mạng & Health Check Không Bounded Timeout**:
   - Chạy `curl` trần trên Windows PowerShell (vốn là alias của `Invoke-WebRequest` không có timeout mặc định).
   - Gọi API bên ngoài (`fetch`) không có `AbortSignal.timeout(...)`.

---

## 🛠️ 3. Quy Chuẩn Kỹ Thuật Bắt Buộc (Mandatory Specifications)

### A. Quy Chuẩn Cho Mọi Script Node.js (`scratch/*.mjs`, `scripts/*.mjs`, `tools/*.mjs`)

Mọi script chạy thử nghiệm, kiểm tra DB, hoặc script công cụ BẮT BUỘC phải tuân thủ mẫu **Non-Blocking Template** sau:

```javascript
// 1. HARD TIMEOUT AUTO-KILL: Tự sát sau tối đa 8 giây nếu xảy ra deadlock/treo mạng
const autoKillTimer = setTimeout(() => {
  console.error('❌ [ANTI-HANG] Script vượt quá thời gian tối đa (8s)! Cưỡng chế hủy tiến trình.');
  process.exit(1);
}, 8000);
autoKillTimer.unref(); // Không chặn Event Loop nếu script chạy xong sớm và bình thường

let client = null;
try {
  // 2. KHỞI TẠO VÀ CHẠY LOGIC
  client = new Client({ connectionString: dbUrl, ssl: false });
  await client.connect();
  
  const result = await client.query('...');
  console.log('Kết quả:', result.rows);
} catch (error) {
  console.error('❌ Lỗi thực thi script:', error);
  process.exit(1);
} finally {
  // 3. ĐÓNG TOÀN BỘ KẾT NỐI VÀ THOÁT TIẾN TRÌNH DỨT KHOÁT
  if (client) {
    await client.end().catch(() => {});
  }
  process.exit(0); // BẮT BUỘC: Phát tín hiệu Exit Code 0 ngay cho Antigravity
}
```

*Quy tắc*: Script PHẢI hoàn tất và `process.exit(0)` trong vòng **dưới 5 giây** để Antigravity nhận kết quả ngay trong lượt chạy đồng bộ, **TUYỆT ĐỐI KHÔNG ĐỂ BỊ ĐẨY VÀO BACKGROUND TASK**.

---

### B. Quy Chuẩn Cho Lệnh Git & Shell

1. **Tuyệt Đối Không Tự Ý `git push`**:
   - Chỉ thực hiện `git push` khi có yêu cầu rõ ràng và trực tiếp từ Người dùng.
   - Nghiêm cấm chạy `git push` chung một dòng lệnh với `git add` và `git commit`.

2. **Tách Rời Lệnh Đồng Bộ Nhanh**:
   - Chạy `git add <files>` riêng (tốn ~0.2s).
   - Chạy `git commit -m "..."` riêng (tốn ~0.3s).
   - Không nối chuỗi quá 2 lệnh bằng dấu `;` nếu có khả năng làm tăng thời gian thực thi.

3. **Chống Treo Tương Tác Git (Non-Interactive Prompt Block)**:
   - Khi bắt buộc phải chạy lệnh tương tác với remote repository, PHẢI vô hiệu hóa hoàn toàn cơ chế chờ bàn phím:
     ```powershell
     $env:GIT_TERMINAL_PROMPT=0; git push origin dev
     ```

---

### C. Quy Chuẩn Cho Agent Thực Thi `run_command`

1. **Cấu Hình `WaitMsBeforeAsync` An Toàn**:
   - Với các lệnh kiểm tra nhanh, biên dịch nhẹ, script DB scratch: Luôn truyền `WaitMsBeforeAsync: 10000` (10 giây) để cho phép script hoàn tất dứt điểm trong luồng chính thay vì bị cắt sang background task ở giây thứ 5.
   - Script bên trong bắt buộc phải có timeout < 8 giây để luôn trả về trước khi hết 10 giây.

2. **Chủ Động Dọn Dẹp Tiến Trình Treo (Active Task Hygiene)**:
   - Nếu vì lý do bất khả kháng mà một câu lệnh bị Antigravity đẩy vào Background Task, Agent KHÔNG ĐƯỢC PHÉP kết thúc lượt trò chuyện rồi bỏ mặc.
   - Agent phải kiểm tra trạng thái ngay sau đó. Nếu tiến trình không có tiến triển sau 15 giây hoặc bị treo, Agent PHẢI chủ động gọi:
     ```json
     manage_task({ "Action": "kill", "TaskId": "<task-id>" })
     ```
     để giải phóng tài nguyên và ngay lập tức mở khóa hàng đợi tin nhắn của Người dùng.
