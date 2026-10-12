#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const HOOKS = [
  {
    name: 'Backend Submodule',
    hookPath: path.join(ROOT_DIR, 'backend', '.git', 'hooks', 'post-commit'),
    content: `#!/usr/bin/env sh
# Auto Railway Deploy Hook for Backend
node ../scripts/railway-deploy.mjs backend
`
  },
  {
    name: 'Frontend Submodule',
    hookPath: path.join(ROOT_DIR, 'frontend', '.git', 'hooks', 'post-commit'),
    content: `#!/usr/bin/env sh
# Auto Railway Deploy Hook for Frontend
node ../scripts/railway-deploy.mjs frontend
`
  },
  {
    name: 'Root Repository',
    hookPath: path.join(ROOT_DIR, '.git', 'hooks', 'post-commit'),
    content: `#!/usr/bin/env sh
# Auto Railway Deploy Hook for Root
node scripts/railway-deploy.mjs root
`
  }
];

console.log('📦 Installing Railway Git Post-Commit Hooks...\n');

for (const hook of HOOKS) {
  const dir = path.dirname(hook.hookPath);
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory does not exist: ${dir} (Skipping ${hook.name})`);
    continue;
  }

  fs.writeFileSync(hook.hookPath, hook.content, { encoding: 'utf8', mode: 0o755 });
  console.log(`✅ [${hook.name}] Hook installed successfully: ${path.relative(ROOT_DIR, hook.hookPath)}`);
}

console.log('\n🎉 All Railway Git hooks installed successfully!');
console.log('💡 Note: You can toggle auto-deploy anytime in .env.railway by setting RAILWAY_AUTO_DEPLOY=false.');
