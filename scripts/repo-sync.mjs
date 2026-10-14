import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const rootDir = process.cwd();
const repos = [
  { name: 'Root Repository', dir: '.' },
  { name: 'Backend Submodule', dir: 'backend' },
  { name: 'Frontend Submodule', dir: 'frontend' },
];

console.log('🔄 Đang đồng bộ toàn bộ 3 repository (Root, Backend, Frontend) theo chuẩn Stash & Rebase...\n');

for (const repo of repos) {
  const fullPath = path.resolve(rootDir, repo.dir);
  if (!fs.existsSync(fullPath)) continue;

  console.log(`========================================`);
  console.log(`📦 Đang xử lý: ${repo.name} (${repo.dir})`);
  console.log(`========================================`);

  const exec = (cmd) => {
    return execSync(cmd, { cwd: fullPath, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  };

  try {
    // 1. Kiểm tra trạng thái dirty
    const status = exec('git status --porcelain');
    let hasStash = false;

    if (status) {
      console.log('  ⚠️ Phát hiện thay đổi chưa commit. Đang tạm cất vào Git Stash...');
      exec('git stash push -u -m "auto-sync-wip"');
      hasStash = true;
    }

    // 2. Chuyển sang nhánh dev
    console.log('  🌿 Đang chuyển sang nhánh dev...');
    try {
      exec('git checkout dev');
    } catch {
      exec('git checkout -B dev origin/dev');
    }

    // 3. Pull rebase từ origin/dev
    console.log('  ⬇️ Đang kéo code mới từ origin/dev (Rebase)...');
    exec('git pull --rebase origin dev');

    // 4. Khôi phục stash nếu có
    if (hasStash) {
      console.log('  📤 Đang khôi phục thay đổi từ Git Stash...');
      try {
        exec('git stash pop');
      } catch (stashErr) {
        console.warn('  ⚠️ Cảnh báo: Có xung đột khi pop stash, file xung đột được giữ nguyên để bạn xử lý:');
        console.warn(stashErr.message);
      }
    }

    const currentBranch = exec('git rev-parse --abbrev-ref HEAD');
    const lastCommit = exec('git log -1 --oneline');
    console.log(`  ✅ Hoàn tất: [${currentBranch}] ${lastCommit}\n`);
  } catch (err) {
    console.error(`  ❌ Lỗi khi đồng bộ tại ${repo.name}:`, err.message, '\n');
  }
}

console.log('🏁 Hoàn tất đồng bộ toàn bộ repository!');
