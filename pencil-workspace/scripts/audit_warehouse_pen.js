const fs = require('fs');
const path = require('path');

const filePath = path.resolve('pencil-workspace/pens/WAREHOUSE_FLOWS.pen');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('=== PENCIL CANVAS AUDIT: WAREHOUSE_FLOWS.pen ===');
console.log('Total frames:', data.children.length);

data.children.forEach(frame => {
  console.log(`\n--------------------------------------------------`);
  console.log(`FRAME: ${frame.id} | Name: "${frame.name}" | Size: ${frame.width}x${frame.height}`);
  
  // Find all text elements in frame
  const texts = [];
  function collect(node) {
    if (node.content) texts.push({ name: node.name || '', content: node.content });
    if (node.children) node.children.forEach(collect);
  }
  collect(frame);
  
  // Print some key content
  console.log(`Total text elements: ${texts.length}`);
  const sample = texts.filter(t => 
    /cột|stt|mã đơn|địa chỉ|tên hàng|thùng|kg|khối|kh|thao tác|trip|biển số|tài xế|excel|xác nhận|phiếu|tem/i.test(t.content) ||
    /header|cell|button|tab|badge/i.test(t.name)
  );
  sample.slice(0, 25).forEach(s => {
    console.log(`  - [${s.name}]: "${s.content}"`);
  });
});
