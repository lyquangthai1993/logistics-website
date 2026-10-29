import fs from 'node:fs';
import path from 'node:path';

// Exact pixels to genuine standard Tailwind utilities
const EXACT_PX_TO_TAILWIND = {
  '1px': 'px',
  '2px': '0.5',
  '4px': '1',
  '6px': '1.5',
  '8px': '2',
  '10px': '2.5',
  '12px': '3',
  '14px': '3.5',
  '16px': '4',
  '20px': '5',
  '24px': '6',
  '28px': '7',
  '32px': '8',
  '36px': '9',
  '40px': '10',
  '44px': '11',
  '48px': '12',
  '56px': '14',
  '64px': '16',
  '80px': '20',
  '96px': '24',
  '112px': '28',
  '128px': '32',
  '144px': '36',
  '160px': '40',
  '176px': '44',
  '192px': '48',
  '208px': '52',
  '224px': '56',
  '240px': '60',
  '256px': '64',
  '288px': '72',
  '320px': '80',
  '384px': '96'
};

const ARBITRARY_PIXEL_REGEX = /\b((?:[a-z0-9]+:)*)(h|w|min-h|max-h|min-w|max-w|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[(\d+px)\]/g;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Replace arbitrary pixel values that map to exact Tailwind utilities
  content = content.replace(ARBITRARY_PIXEL_REGEX, (match, variant, prefix, pxStr) => {
    if (EXACT_PX_TO_TAILWIND[pxStr]) {
      return `${variant || ''}${prefix}-${EXACT_PX_TO_TAILWIND[pxStr]}`;
    }
    return match;
  });

  // 2. Fix invalid h-8.5 -> h-8
  content = content.replace(/\bh-8\.5\b/g, 'h-8');

  // 3. For warehouse features, sanitize oversized cards & modals
  if (filePath.includes('warehouse')) {
    content = content.replace(/className='p-6 text-center text-gray-500 bg-white/g, "className='p-3 text-center text-gray-500 bg-white");
    content = content.replace(/className='p-6 text-center text-gray-400 bg-white/g, "className='p-3 text-center text-gray-400 bg-white");
  }

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

const targetDir = path.resolve('frontend/src');
console.log(`🚀 [TAILWIND AUTONOMOUS FIXER] Scanning and fixing: ${targetDir}`);
const allFiles = walkDir(targetDir);
let changedCount = 0;

for (const file of allFiles) {
  if (fixFile(file)) {
    changedCount++;
    console.log(`  ✅ Fixed: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\n🎉 Completed! Successfully standardized Tailwind classes in ${changedCount} file(s).`);
