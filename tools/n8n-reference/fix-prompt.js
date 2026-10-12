const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const newContent = `=Bạn là Trợ lý Tuyển sinh tại King's College School. Hãy đọc dữ liệu đăng ký tham quan trường (Book-a-visit) dưới đây và xuất ra đúng một bản tóm tắt duy nhất theo KHUÔN MẪU MARKDOWN QUY CHUẨN được cung cấp.

QUY TẮC BẮT BUỘC:
- TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào mở đầu (như "Chào bạn...", "Dưới đây là...") hoặc lời chào kết thúc (như "Trân trọng...", "Kính gửi...").
- Bắt đầu ngay lập tức từ dòng tiêu đề "# 🏫 THÔNG BÁO LỊCH HẸN THAM QUAN TRƯỜNG".
- Giữ nguyên toàn bộ cấu trúc các đề mục, biểu tượng icon và định dạng in đậm.
- Tính toán chính xác độ tuổi của học sinh tại thời điểm tham quan (năm 2026) và khối lớp dự kiến theo hệ thống Anh Quốc (EYFS: Nursery/Reception, Key Stage 1: Year 1-2, Key Stage 2: Year 3-6, Key Stage 3: Year 7-9...).

DỮ LIỆU ĐẦU VÀO:
- Họ tên phụ huynh: {{ $json.body.entry.last_name || '' }} {{ $json.body.entry.first_name || '' }} {{ $json.body.entry.parents && $json.body.entry.parents[0] ? '(' + ($json.body.entry.parents[0].relationship || 'Phụ huynh') + ')' : '' }}
- SĐT: {{ $json.body.entry.phone || 'Chưa cung cấp' }}
- Email: {{ $json.body.entry.email || 'Chưa cung cấp' }}
- Học sinh: {{ $json.body.entry.students && $json.body.entry.students[0] ? ($json.body.entry.students[0].last_name + ' ' + $json.body.entry.students[0].first_name) : 'Chưa có' }}
- Ngày sinh học sinh: {{ $json.body.entry.students && $json.body.entry.students[0] ? $json.body.entry.students[0].date_of_birth : 'N/A' }}
- Giới tính & Quốc tịch: {{ $json.body.entry.students && $json.body.entry.students[0] ? ($json.body.entry.students[0].gender + ' | ' + $json.body.entry.students[0].nationality) : 'N/A' }}
- Ngày giờ hẹn: {{ $json.body.entry.metadata ? ($json.body.entry.metadata.visit_date + ' lúc ' + $json.body.entry.metadata.visit_time) : 'N/A' }}
- Hình thức: {{ $json.body.entry.metadata ? $json.body.entry.metadata.preferred_visit_type : 'Trực tiếp' }}
- Host: {{ $json.body.entry.host || ($json.body.entry.metadata ? $json.body.entry.metadata.host : 'Chưa chỉ định') }}
- Kênh biết đến trường: {{ $json.body.entry.metadata && $json.body.entry.metadata.how_did_you_hear ? $json.body.entry.metadata.how_did_you_hear.join(', ') : 'N/A' }}
- Dữ liệu chi tiết: {{ JSON.stringify($json.body.entry || {}) }}

KHUÔN MẪU BẮT BUỘC PHẢI DÙNG:
# 🏫 THÔNG BÁO LỊCH HẸN THAM QUAN TRƯỜNG

---

### 🗓️ THÔNG TIN LỊCH HẸN
* **Thời gian:** [Giờ] | [Thứ, Ngày/Tháng/Năm]
* **Hình thức:** [Hình thức tham quan]
* **Người tiếp đón (Host):** [Tên Host]
* **Kênh tiếp cận:** [Kênh biết đến trường]

### 👤 THÔNG TIN PHỤ HUYNH
* **Họ và tên:** [Họ tên phụ huynh đầy đủ và mối quan hệ]
* **Số điện thoại:** [Số điện thoại]
* **Email:** [Email]

### 🎓 THÔNG TIN HỌC SINH
* **Họ và tên:** [Họ tên học sinh đầy đủ]
* **Ngày sinh:** [Ngày/Tháng/Năm sinh] ([Tuổi tại thời điểm tham quan] tuổi - Dự kiến vào [Khối lớp dự kiến])
* **Giới tính & Quốc tịch:** [Giới tính] | [Quốc tịch]

---

### 📝 LƯU Ý CHO BỘ PHẬN TUYỂN SINH (ADMISSIONS NOTES)
1. **[Tiêu đề lưu ý 1]:** [Nội dung tư vấn, trọng tâm chương trình học phù hợp với lứa tuổi]
2. **[Tiêu đề lưu ý 2]:** [Nội dung chuẩn bị tài liệu, lộ trình tour hoặc chăm sóc khách hàng]`;

const targetModel = 'models/gemini-3-flash-preview';

// Update workflow_entity
db.get('SELECT nodes FROM workflow_entity WHERE id = ?', ['xQt4kv5ac0Q6k6lc'], (err, row) => {
  if (err) throw err;
  const nodes = JSON.parse(row.nodes);
  const gemini = nodes.find(n => n.name.includes('Gemini'));
  gemini.parameters.modelId = {
    __rl: true,
    value: targetModel,
    mode: 'list',
    cachedResultName: targetModel
  };
  gemini.parameters.messages = {
    values: [
      {
        role: 'user',
        content: newContent
      }
    ]
  };
  gemini.retryOnFail = true;
  gemini.maxTries = 3;
  gemini.waitBetweenTries = 3000;
  db.run('UPDATE workflow_entity SET nodes = ? WHERE id = ?', [JSON.stringify(nodes), 'xQt4kv5ac0Q6k6lc'], (uErr) => {
    if (uErr) throw uErr;
    console.log('workflow_entity updated with strict prompt template!');
  });
});

// Update workflow_history for latest versions
db.all('SELECT versionId, nodes FROM workflow_history WHERE workflowId = ?', ['xQt4kv5ac0Q6k6lc'], (err, rows) => {
  if (err) throw err;
  for (const r of rows) {
    const nodes = JSON.parse(r.nodes);
    const gemini = nodes.find(n => n.name.includes('Gemini'));
    if (gemini) {
      gemini.parameters.modelId = {
        __rl: true,
        value: targetModel,
        mode: 'list',
        cachedResultName: targetModel
      };
      gemini.parameters.messages = {
        values: [
          {
            role: 'user',
            content: newContent
          }
        ]
      };
      gemini.retryOnFail = true;
      gemini.maxTries = 3;
      gemini.waitBetweenTries = 3000;
      db.run('UPDATE workflow_history SET nodes = ? WHERE versionId = ?', [JSON.stringify(nodes), r.versionId], (uErr) => {
        if (uErr) throw uErr;
      });
    }
  }
  console.log('All workflow_history versions updated!');
});
