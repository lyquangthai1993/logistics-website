const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const jsCodeContent = `const fs = require('fs');

// 1. Trích xuất nội dung tóm tắt từ Gemini
const item = $input.first().json;
let summaryText = '';

if (item.content && item.content.parts && Array.isArray(item.content.parts)) {
  summaryText = item.content.parts.map(p => p.text || '').join('');
} else if (item.text) {
  summaryText = item.text;
} else if (item.mergedResponse) {
  summaryText = item.mergedResponse;
} else {
  summaryText = typeof item === 'string' ? item : JSON.stringify(item, null, 2);
}

// 2. Lấy thông tin họ tên & appointment_time từ Webhook ban đầu
const entry = $('Strapi Webhook').first().json.body.entry;
const firstName = (entry.first_name || 'unknown').trim();
const lastName = (entry.last_name || '').trim();

// 3. Trích xuất và định dạng appointment_time: DD_MM_YYYY_HH_mn
let rawTime = '';
if (entry.metadata) {
  rawTime = entry.metadata.appointment_time || entry.metadata.visit_datetime || entry.metadata.appointment_datetime || '';
  if (!rawTime && entry.metadata.visit_date && entry.metadata.visit_time) {
    rawTime = \`\${entry.metadata.visit_date}T\${entry.metadata.visit_time}:00\`;
  }
}
if (!rawTime && entry.appointment_time) {
  rawTime = entry.appointment_time;
}

let formattedTime = '';
if (rawTime) {
  const match = rawTime.match(/(\\d{4})-(\\d{2})-(\\d{2})[T\\s](\\d{2}):(\\d{2})/);
  if (match) {
    const [_, yyyy, mm, dd, hh, min] = match;
    formattedTime = \`\${dd}_\${mm}_\${yyyy}_\${hh}_\${min}\`;
  } else {
    const d = new Date(rawTime);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      formattedTime = \`\${dd}_\${mm}_\${yyyy}_\${hh}_\${min}\`;
    }
  }
}

if (!formattedTime) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  formattedTime = \`\${dd}_\${mm}_\${yyyy}_\${hh}_\${min}\`;
}

// 4. Tạo tên file theo chuẩn: {first_name}_{last_name}_{appointment_time}.md
const safeFirst = firstName.replace(/[^a-zA-Z0-9_\\u00C0-\\u1EF9]/g, '_');
const safeLast = lastName.replace(/[^a-zA-Z0-9_\\u00C0-\\u1EF9]/g, '_');
const fileName = safeLast 
  ? \`\${safeFirst}_\${safeLast}_\${formattedTime}.md\` 
  : \`\${safeFirst}_\${formattedTime}.md\`;

// 5. Đường dẫn lưu file vật lý (mount tới D:\\Projects\\it-maeducation\\book-a-visit)
const targetPath = \`/data/book-a-visit/\${fileName}\`;

fs.writeFileSync(targetPath, summaryText, 'utf8');

return [{
  json: {
    success: true,
    fileName: fileName,
    savedAt: \`D:\\\\Projects\\\\it-maeducation\\\\book-a-visit\\\\\${fileName}\`,
    fileSize: summaryText.length,
    appointmentTime: formattedTime,
    content: summaryText
  }
}];`;

// Update workflow_entity
db.get('SELECT nodes FROM workflow_entity WHERE id = ?', ['xQt4kv5ac0Q6k6lc'], (err, row) => {
  if (err) throw err;
  const nodes = JSON.parse(row.nodes);
  const writeNode = nodes.find(n => n.name.includes('Ghi file'));
  if (writeNode) {
    writeNode.parameters.jsCode = jsCodeContent;
  }
  db.run('UPDATE workflow_entity SET nodes = ? WHERE id = ?', [JSON.stringify(nodes), 'xQt4kv5ac0Q6k6lc'], (uErr) => {
    if (uErr) throw uErr;
    console.log('workflow_entity updated with new filename format!');
  });
});

// Update workflow_history
db.all('SELECT versionId, nodes FROM workflow_history WHERE workflowId = ?', ['xQt4kv5ac0Q6k6lc'], (err, rows) => {
  if (err) throw err;
  for (const r of rows) {
    const nodes = JSON.parse(r.nodes);
    const writeNode = nodes.find(n => n.name.includes('Ghi file'));
    if (writeNode) {
      writeNode.parameters.jsCode = jsCodeContent;
      db.run('UPDATE workflow_history SET nodes = ? WHERE versionId = ?', [JSON.stringify(nodes), r.versionId], (uErr) => {
        if (uErr) throw uErr;
      });
    }
  }
  console.log('workflow_history versions updated with new filename format!');
});
