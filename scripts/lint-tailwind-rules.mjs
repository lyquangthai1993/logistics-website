import fs from 'node:fs';
import path from 'node:path';

// Match ANY arbitrary pixel value: e.g. h-[26px], min-w-[140px], w-[100px]
const ARBITRARY_PIXEL_REGEX = /\b((?:[a-z0-9]+:)*)(h|w|min-h|max-h|min-w|max-w|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[(\d+(?:\.\d+)?)px\]/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const suggestions = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    let match;
    const regex = new RegExp(ARBITRARY_PIXEL_REGEX);
    while ((match = regex.exec(line)) !== null) {
      const fullClass = match[0];
      const variant = match[1] || '';
      const prefix = match[2];
      const px = parseFloat(match[3]);

      // In Tailwind v4, scale = px / 4 (e.g. 26px / 4 = 6.5 -> h-6.5, 34px / 4 = 8.5 -> h-8.5)
      // Checks if px / 4 results in an integer or a single decimal (e.g. 0.5, 1.5, 2.5, 6.5, etc.)
      const scale = px / 4;
      if (Number.isInteger(scale * 2)) {
        const canonicalClass = `${variant}${prefix}-${scale}`;
        suggestions.push({
          line: lineNum,
          current: fullClass,
          canonical: canonicalClass,
          px
        });
      }
    }
  });

  return suggestions;
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
console.log(`🔍 [TAILWIND CANONICAL SCANNER] Matching suggestCanonicalClasses across: ${targetDir}`);
const allFiles = walkDir(targetDir);
let totalSuggestions = 0;

for (const file of allFiles) {
  const list = scanFile(file);
  if (list.length > 0) {
    totalSuggestions += list.length;
    console.log(`\n📄 ${path.relative(process.cwd(), file)} (${list.length} suggestions)`);
    for (const item of list.slice(0, 10)) {
      console.log(`  💡 L${item.line}: The class \`${item.current}\` can be written as \`${item.canonical}\` tailwindcss(suggestCanonicalClasses)`);
    }
    if (list.length > 10) {
      console.log(`  ... and ${list.length - 10} more in this file.`);
    }
  }
}

console.log(`\n📊 [SUMMARY] Found ${totalSuggestions} canonical class suggestions matching VS Code Tailwind extension.`);
