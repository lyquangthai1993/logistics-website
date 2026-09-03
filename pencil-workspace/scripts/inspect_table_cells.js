const fs = require('fs');
const path = require('path');

const filePath = path.resolve('pencil-workspace/pens/WAREHOUSE_FLOWS.pen');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function findNodeById(n, id) {
  if (n.id === id) return n;
  if (n.children) {
    for (const c of n.children) {
      const res = findNodeById(c, id);
      if (res) return res;
    }
  }
  return null;
}

console.log('=== INSPECTING WH_CASE_01 TABLE CELLS ===');
const headerRow = findNodeById(data, 'VU8j1');
if (headerRow) {
  console.log('Header Row cells count:', headerRow.children.length);
  headerRow.children.forEach((c, idx) => {
    let txt = c.content || '';
    if (!txt && c.children) {
      const tNode = c.children.find(x => x.content !== undefined);
      if (tNode) txt = tNode.content;
    }
    console.log(`Cell ${idx + 1}: [${c.id}] ${c.name} (w: ${c.width}) => "${txt}"`);
  });
}

const row1 = findNodeById(data, 'PgCQf');
if (row1) {
  console.log('\nCargo Row 1 cells count:', row1.children.length);
  row1.children.forEach((c, idx) => {
    let txt = c.content || '';
    if (!txt && c.children) {
      const tNode = c.children.find(x => x.content !== undefined);
      if (tNode) txt = tNode.content;
    }
    console.log(`Cell ${idx + 1}: [${c.id}] ${c.name} (w: ${c.width}) => "${txt}"`);
  });
}
