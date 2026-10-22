const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.next') {
        walk(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targets = ['backend/src', 'frontend/src'];
const results = [];

for (const t of targets) {
  const fullPath = path.resolve(__dirname, '..', t);
  if (!fs.existsSync(fullPath)) continue;
  const files = walk(fullPath);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('Andromeda Hub - HCM') || line.includes('Andromeda Hub')) {
        results.push({
          file: path.relative(path.resolve(__dirname, '..'), f),
          lineNum: idx + 1,
          line: line.trim()
        });
      }
    });
  }
}

console.log(`Found ${results.length} occurrences:\n`);
results.forEach(r => console.log(`${r.file}:${r.lineNum} -> ${r.line}`));
