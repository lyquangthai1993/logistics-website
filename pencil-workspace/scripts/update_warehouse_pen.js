const fs = require('fs');
const path = require('path');

const penPath = path.resolve('pencil-workspace/pens/WAREHOUSE_FLOWS.pen');
const data = JSON.parse(fs.readFileSync(penPath, 'utf8'));

console.log('Starting precision update of WAREHOUSE_FLOWS.pen...');

function cleanTableColumns(gridNode) {
  if (!gridNode || !gridNode.children) return;

  const headerRow = gridNode.children[0];
  if (!headerRow || !headerRow.children) return;

  const unwantedNames = ['Điều hành', 'Khách hàng', 'Ngày cần bốc', 'Ngày cần giao', 'Đã soạn'];
  
  const keepIndices = [];
  headerRow.children.forEach((cell, idx) => {
    let txt = cell.content || '';
    if (!txt && cell.children) {
      const t = cell.children.find(x => x.content !== undefined);
      if (t) txt = t.content;
    }
    const isUnwanted = unwantedNames.some(u => cell.name.includes(u) || txt.includes(u));
    if (!isUnwanted) {
      keepIndices.push(idx);
    } else {
      console.log(`  Removing column index ${idx}: [${cell.name}] "${txt}"`);
    }
  });

  console.log(`  Keeping ${keepIndices.length} / ${headerRow.children.length} columns`);

  gridNode.children.forEach((row) => {
    if (row.name && (row.name.includes('Row') || row.name.includes('Cargo'))) {
      if (row.children && row.children.length >= keepIndices.length) {
        row.children = keepIndices.map(i => row.children[i]).filter(Boolean);
      }
    }
  });

  // Re-adjust widths:
  // STT, Mã đơn hàng, Địa chỉ nhận hàng, Tên hàng, Số thùng, Số kg, Số khối, Địa chỉ giao hàng, Ghi chú, [Thao tác]
  gridNode.children.forEach((row) => {
    if (row.name && (row.name.includes('Row') || row.name.includes('Cargo'))) {
      if (row.children) {
        row.children.forEach((cell, cIdx) => {
          if (cell.name.includes('STT')) cell.width = 50;
          else if (cell.name.includes('Mã đơn')) cell.width = 130;
          else if (cell.name.includes('nhận hàng')) cell.width = 220;
          else if (cell.name.includes('Tên hàng')) cell.width = 160;
          else if (cell.name.includes('Số thùng')) cell.width = 80;
          else if (cell.name.includes('Số kg')) cell.width = 90;
          else if (cell.name.includes('Số khối')) cell.width = 80;
          else if (cell.name.includes('giao hàng')) cell.width = 280;
          else if (cell.name.includes('Ghi chú')) cell.width = 140;
          else if (cell.name.includes('Thao tác') || cell.name.includes('Action')) cell.width = 80;
        });
      }
    }
  });
}

function findNode(n, pred) {
  if (pred(n)) return n;
  if (n.children) {
    for (const c of n.children) {
      const res = findNode(c, pred);
      if (res) return res;
    }
  }
  return null;
}

// 1. Clean dd8X5 Grid
const dd8 = data.children.find(c => c.id === 'dd8X5');
if (dd8) {
  console.log('\n--- Cleaning dd8X5 (Mode 2) Table Columns ---');
  const gridDd8 = findNode(dd8, n => n.name && n.name.includes('Grid'));
  if (gridDd8) {
    cleanTableColumns(gridDd8);

    // Update Delivery Address header in dd8X5
    const headerRow = gridDd8.children[0];
    const deliveryCell = headerRow.children.find(c => c.name.includes('giao hàng'));
    if (deliveryCell) {
      const textNode = deliveryCell.children ? deliveryCell.children.find(x => x.content !== undefined) : null;
      if (textNode) textNode.content = 'Địa chỉ giao hàng (3 tùy chọn ▾)';
      if (deliveryCell.content !== undefined) deliveryCell.content = 'Địa chỉ giao hàng (3 tùy chọn ▾)';
    }

    // Add a 4th cargo row in Mode 2 representing mid-transit cargo addition if not already present
    const hasRow4 = gridDd8.children.some(c => c.id === 'Cargo_Row_MidTransit_dd8');
    if (!hasRow4 && gridDd8.children.length >= 3) {
      console.log('  Adding mid-transit cargo row to Mode 2 table...');
      const sampleRow = JSON.parse(JSON.stringify(gridDd8.children[gridDd8.children.length - 1]));
      sampleRow.id = 'Cargo_Row_MidTransit_dd8';
      sampleRow.name = 'Cargo Row 4 · Nhận thêm dọc đường';
      sampleRow.fill = '#F0FDF4';

      sampleRow.children.forEach(cell => {
        if (cell.name.includes('STT')) updateCellText(cell, '04');
        else if (cell.name.includes('Mã đơn')) updateCellText(cell, 'Đơn bổ sung');
        else if (cell.name.includes('nhận hàng')) updateCellText(cell, 'Trạm dừng Long Thành');
        else if (cell.name.includes('Tên hàng')) updateCellText(cell, 'Vải dệt may (Gom thêm)');
        else if (cell.name.includes('Số thùng')) updateCellText(cell, '15');
        else if (cell.name.includes('Số kg')) updateCellText(cell, '320');
        else if (cell.name.includes('Số khối')) updateCellText(cell, '1,2');
        else if (cell.name.includes('giao hàng')) updateCellText(cell, 'Hub cấp 2 · Xe bo Long Thành ▾');
        else if (cell.name.includes('Ghi chú')) updateCellText(cell, 'Nhận bổ sung dọc đường');
      });

      gridDd8.children.push(sampleRow);
    }
  }
}

function updateCellText(cellNode, newText) {
  if (!cellNode) return;
  if (cellNode.content !== undefined) cellNode.content = newText;
  if (cellNode.children) {
    const t = cellNode.children.find(x => x.content !== undefined);
    if (t) t.content = newText;
  }
}

// Write back to WAREHOUSE_FLOWS.pen
fs.writeFileSync(penPath, JSON.stringify(data, null, 2), 'utf8');
console.log('\nSuccessfully updated dd8X5 and saved WAREHOUSE_FLOWS.pen!');
