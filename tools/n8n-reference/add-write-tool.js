const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const writeNode = {
  parameters: {
    jsCode: `const fs = require('fs');

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

// 2. Lấy thông tin họ tên từ Webhook ban đầu
const entry = $('Strapi Webhook').first().json.body.entry;
const firstName = (entry.first_name || 'unknown').trim();
const lastName = (entry.last_name || '').trim();

// 3. Tạo tên file dạng first_name+last_name+'.md'
const safeFirst = firstName.replace(/[^a-zA-Z0-9_\\u00C0-\\u1EF9]/g, '_');
const safeLast = lastName.replace(/[^a-zA-Z0-9_\\u00C0-\\u1EF9]/g, '_');
const fileName = safeLast ? \`\${safeFirst}_\${safeLast}.md\` : \`\${safeFirst}.md\`;

// 4. Đường dẫn lưu file vật lý (được mount tới D:\\Projects\\it-maeducation\\book-a-visit)
const targetPath = \`/data/book-a-visit/\${fileName}\`;

fs.writeFileSync(targetPath, summaryText, 'utf8');

return [{
  json: {
    success: true,
    fileName: fileName,
    savedAt: \`D:\\\\Projects\\\\it-maeducation\\\\book-a-visit\\\\\${fileName}\`,
    fileSize: summaryText.length,
    content: summaryText
  }
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [840, -100],
  id: '0194e82b-8a8f-4318-912a-0a2a4ffc0005',
  name: 'Ghi file vật lý (.md)'
};

function updateNodesAndConnections(nodes, connections) {
  nodes = nodes.filter(n => !n.name.includes('Ghi file'));
  nodes.push(writeNode);

  if (!connections['Google Gemini: Tóm tắt tuyển sinh']) {
    connections['Google Gemini: Tóm tắt tuyển sinh'] = { main: [] };
  }
  connections['Google Gemini: Tóm tắt tuyển sinh'].main = [
    [
      {
        node: 'Ghi file vật lý (.md)',
        type: 'main',
        index: 0
      }
    ]
  ];
  return { nodes, connections };
}

// 1. Update workflow_entity
db.get('SELECT nodes, connections FROM workflow_entity WHERE id = ?', ['xQt4kv5ac0Q6k6lc'], (err, row) => {
  if (err) throw err;
  const nodes = JSON.parse(row.nodes);
  const connections = JSON.parse(row.connections);
  const updated = updateNodesAndConnections(nodes, connections);

  db.run('UPDATE workflow_entity SET nodes = ?, connections = ? WHERE id = ?', 
    [JSON.stringify(updated.nodes), JSON.stringify(updated.connections), 'xQt4kv5ac0Q6k6lc'], 
    (uErr) => {
      if (uErr) throw uErr;
      console.log('workflow_entity updated with .md file writing tool!');
    }
  );
});

// 2. Update workflow_history
db.all('SELECT versionId, nodes, connections FROM workflow_history WHERE workflowId = ?', ['xQt4kv5ac0Q6k6lc'], (err, rows) => {
  if (err) throw err;
  for (const r of rows) {
    const nodes = JSON.parse(r.nodes);
    const connections = JSON.parse(r.connections);
    const updated = updateNodesAndConnections(nodes, connections);
    db.run('UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?',
      [JSON.stringify(updated.nodes), JSON.stringify(updated.connections), r.versionId],
      (uErr) => {
        if (uErr) throw uErr;
      }
    );
  }
  console.log('workflow_history versions updated!');
});
