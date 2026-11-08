import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { traceLastFeatureBranch, PROTECTED_BRANCHES } from './git-task-workflow.mjs';

const rootDir = process.cwd();
const repos = [
  { name: 'Backend Submodule', dir: 'backend' },
  { name: 'Frontend Submodule', dir: 'frontend' },
  { name: 'Root Repository', dir: '.' },
];

console.log('🔄 Đang đồng bộ toàn bộ 3 repository (Backend, Frontend, Root) và khôi phục về nhánh Feature chính...\n');

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
    // 0. Xác định nhánh hiện tại & truy ngược Git History tìm nhánh feature gần nhất
    const currentBefore = exec('git branch --show-current');
    const targetFeatureBranch =
      currentBefore && !PROTECTED_BRANCHES.has(currentBefore)
        ? currentBefore
        : traceLastFeatureBranch(fullPath);

    // 1. Kiểm tra trạng thái dirty
    const status = exec('git status --porcelain');
    let hasStash = false;

    if (status) {
      console.log('  ⚠️ Phát hiện thay đổi chưa commit. Đang tạm cất vào Git Stash...');
      exec('git stash push -u -m "auto-sync-wip"');
      hasStash = true;
    }

    // 2. Cập nhật nhánh dev từ origin/dev
    console.log('  ⬇️ Đang cập nhật nhánh dev từ origin/dev...');
    try {
      exec('git checkout dev');
    } catch {
      exec('git checkout -B dev origin/dev');
    }
    exec('git pull --rebase origin dev');

    // 3. Quay trở lại nhánh feature chính (KHÔNG đứng lại ở dev)
    if (targetFeatureBranch && !PROTECTED_BRANCHES.has(targetFeatureBranch)) {
      console.log(`  🌿 Quay về nhánh feature chính: ${targetFeatureBranch}...`);
      try {
        exec(`git checkout ${targetFeatureBranch}`);
      } catch {
        exec(`git checkout -b ${targetFeatureBranch} origin/${targetFeatureBranch}`);
      }
      try {
        exec('git merge --ff-only dev');
        console.log(`  🔄 Đã fast-forward '${targetFeatureBranch}' đồng bộ với 'dev' mới nhất.`);
      } catch {
        // Nhánh feature có commit riêng, giữ nguyên
      }
    }

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

console.log('🏁 Hoàn tất đồng bộ toàn bộ repository và đảm bảo đứng trên nhánh Feature chính!');
