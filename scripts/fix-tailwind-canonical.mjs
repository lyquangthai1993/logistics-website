import fs from 'node:fs';
import path from 'node:path';

const ARBITRARY_PIXEL_REGEX = /\b((?:[a-z0-9]+:)*)(h|w|min-h|max-h|min-w|max-w|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[(\d+(?:\.\d+)?)px\]/g;

function fixCanonicalInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(ARBITRARY_PIXEL_REGEX, (match, variant, prefix, pxStr) => {
    const px = parseFloat(pxStr);
    const scale = px / 4;
    // Converts whenever scale is integer or .5 (e.g. 26px / 4 = 6.5 -> h-6.5)
    if (Number.isInteger(scale * 2) && px <= 600) {
      return `${variant || ''}${prefix}-${scale}`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(tsx|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('frontend/src');
console.log(`⚡ [TAILWIND CANONICAL FIXER] Scanning & converting .5 fractional scale across: ${targetDir}`);
const allFiles = walkDir(targetDir);
let changedCount = 0;

for (const file of allFiles) {
  if (fixCanonicalInFile(file)) {
    changedCount++;
    console.log(`  ✅ Converted canonical classes in: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\n🎉 Done! Converted canonical classes across ${changedCount} file(s).`);
