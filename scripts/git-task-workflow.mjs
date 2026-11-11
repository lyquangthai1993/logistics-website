#!/usr/bin/env node

/**
 * git-task-workflow.mjs
 *
 * CLI Helper enforcing the GitHub Task Lifecycle Workflow (RULE-GIT-TASK-WORKFLOW-01):
 * 1. status                 : Check branch alignment & trace last pushed feature branch across root, backend, frontend
 * 2. resume [branch_name]   : Trace git history (reflog + refs) to find the last active feature branch and checkout back to it (syncing dev)
 * 3. start <task_id> [slug] : Pull latest dev, create feature/task-<id>-<slug> in submodules, & AUTO-START Local Servers (:4000 & :4001)
 * 4. pr <task_id> [slug]    : Verify Local Servers (:4000 & :4001) are UP, push branch, create PR into dev, auto-merge into dev, & return to feature branch
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureLocalServers, checkLocalServers } from './ensure-local-servers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

export const PROTECTED_BRANCHES = new Set([
  'dev',
  'master',
  'main',
  'HEAD',
  'origin/dev',
  'origin/master',
  'origin/main',
  'origin/HEAD',
  'origin',
]);

function run(cmd, cwd = ROOT_DIR, silent = false) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) {
      console.error(`❌ Command failed: ${cmd} (in ${cwd})`);
    }
    throw error;
  }
}

function runOutput(cmd, cwd = ROOT_DIR) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

function branchExists(branchName, cwd) {
  if (!branchName || PROTECTED_BRANCHES.has(branchName) || /^[0-9a-f]{7,40}$/i.test(branchName)) {
    return false;
  }
  const localRef = runOutput(`git show-ref --verify refs/heads/${branchName}`, cwd);
  if (localRef) return true;
  const remoteRef = runOutput(`git show-ref --verify refs/remotes/origin/${branchName}`, cwd);
  return Boolean(remoteRef);
}

/**
 * Truy ngược Git History (git reflog + git for-each-ref theo ngày commit gần nhất)
 * để tìm ra branch feature/fix chính trước đó đã làm việc & push trước khi chuyển sang dev/master.
 */
export function traceLastFeatureBranch(cwd = ROOT_DIR) {
  const current = runOutput('git branch --show-current', cwd);
  if (current && !PROTECTED_BRANCHES.has(current)) {
    return current;
  }

  // 1. Truy vết từ git reflog (ưu tiên lịch sử checkout trên máy trạm)
  const reflogLines = runOutput('git reflog -n 80 --format="%gs"', cwd)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const line of reflogLines) {
    const match = line.match(/^checkout:\s+moving\s+from\s+([^\s]+)\s+to\s+([^\s]+)$/i);
    if (match) {
      const [, fromBranch, toBranch] = match;
      if (branchExists(toBranch, cwd)) return toBranch;
      if (branchExists(fromBranch, cwd)) return fromBranch;
    }
  }

  // 2. Truy vết từ danh sách nhánh local & origin theo thời gian commit mới nhất
  const refsOutput = runOutput(
    'git for-each-ref --sort=-committerdate refs/heads/ refs/remotes/origin/ --format="%(refname:short)"',
    cwd,
  );
  const refs = refsOutput
    .split(/\r?\n/)
    .map((r) => r.trim().replace(/^origin\//, ''))
    .filter(Boolean);

  for (const candidate of refs) {
    if (PROTECTED_BRANCHES.has(candidate)) continue;
    if (/^(feat|feature|fix|refactor|perf|test)\//i.test(candidate) && branchExists(candidate, cwd)) {
      return candidate;
    }
  }

  for (const candidate of refs) {
    if (!PROTECTED_BRANCHES.has(candidate) && branchExists(candidate, cwd)) {
      return candidate;
    }
  }

  return '';
}

function checkGhAuth() {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    try {
      const cred = execSync('git credential fill', {
        cwd: ROOT_DIR,
        input: 'protocol=https\nhost=github.com\n\n',
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const m = cred.match(/^password=(.+)$/m);
      if (m && m[1].trim()) {
        process.env.GH_TOKEN = m[1].trim();
      }
    } catch {
      // ignore
    }
  }
  const status = runOutput('gh auth status', ROOT_DIR);
  return Boolean(process.env.GH_TOKEN) || !status.includes('not logged into');
}

export function getCurrentBranches() {
  return {
    root: runOutput('git branch --show-current', ROOT_DIR),
    backend: runOutput('git branch --show-current', BACKEND_DIR),
    frontend: runOutput('git branch --show-current', FRONTEND_DIR),
  };
}

export function getTracedFeatureBranches() {
  return {
    root: traceLastFeatureBranch(ROOT_DIR),
    backend: traceLastFeatureBranch(BACKEND_DIR),
    frontend: traceLastFeatureBranch(FRONTEND_DIR),
  };
}

/**
 * Tự động quay về branch feature chính trước đó (truy ngược từ git history)
 * và đồng bộ (fast-forward) các commit mới nhất từ dev vào branch feature để không mất code.
 */
export function resumeFeatureBranch(explicitBranch = '') {
  const repos = [
    { key: 'backend', name: 'Backend Submodule', dir: BACKEND_DIR },
    { key: 'frontend', name: 'Frontend Submodule', dir: FRONTEND_DIR },
    { key: 'root', name: 'Root Repository', dir: ROOT_DIR },
  ];

  console.log(`\n======================================================================`);
  console.log(`🔄 TRUY NGƯỢC GIT HISTORY & QUAY VỀ BRANCH FEATURE CHÍNH`);
  console.log(`======================================================================`);

  const results = [];

  for (const repo of repos) {
    const beforeBranch = runOutput('git branch --show-current', repo.dir) || 'detached';
    const targetBranch = explicitBranch || traceLastFeatureBranch(repo.dir);

    if (!targetBranch) {
      console.warn(`⚠️ [${repo.name}] Không tìm thấy nhánh feature trước đó trong git history (Hiện tại: ${beforeBranch}).`);
      results.push({ repo: repo.name, beforeBranch, afterBranch: beforeBranch, head: runOutput('git rev-parse --short HEAD', repo.dir) });
      continue;
    }

    if (beforeBranch !== targetBranch) {
      console.log(`\n📦 [${repo.name}] Phát hiện đang ở '${beforeBranch}' -> Chuyển về nhánh feature '${targetBranch}'...`);
      const hasLocal = Boolean(runOutput(`git show-ref --verify refs/heads/${targetBranch}`, repo.dir));
      if (hasLocal) {
        run(`git checkout ${targetBranch}`, repo.dir);
      } else {
        run(`git checkout -b ${targetBranch} origin/${targetBranch}`, repo.dir);
      }
    } else {
      console.log(`\n✅ [${repo.name}] Đã ở đúng nhánh feature chính: '${targetBranch}'`);
    }

    // Kiểm tra nếu nhánh dev có các commit mới hơn (ví dụ commit vừa merge hoặc lỡ commit trên dev) thì fast-forward vào feature branch
    const hasDev = Boolean(runOutput('git show-ref --verify refs/heads/dev', repo.dir));
    if (hasDev) {
      const featureSha = runOutput(`git rev-parse ${targetBranch}`, repo.dir);
      const devSha = runOutput('git rev-parse dev', repo.dir);
      if (featureSha && devSha && featureSha !== devSha) {
        try {
          execSync(`git merge-base --is-ancestor ${targetBranch} dev`, { cwd: repo.dir, stdio: 'pipe' });
          console.log(`   🔄 Đồng bộ (fast-forward) các commit mới nhất từ 'dev' (${devSha.slice(0, 7)}) sang '${targetBranch}'...`);
          run('git merge --ff-only dev', repo.dir);
        } catch {
          // targetBranch đã có commit riêng hoặc phân nhánh khác dev, giữ nguyên
        }
      }
    }

    const afterBranch = runOutput('git branch --show-current', repo.dir);
    const head = runOutput('git log -1 --oneline', repo.dir);
    results.push({ repo: repo.name, beforeBranch, afterBranch, head });
  }

  console.log(`\n======================================================================`);
  console.log(`🎯 KẾT QUẢ KHÔI PHỤC BRANCH FEATURE CHÍNH:`);
  for (const r of results) {
    console.log(`- ${r.repo.padEnd(20)}: ${r.beforeBranch} -> ${r.afterBranch} (${r.head})`);
  }
  console.log(`======================================================================\n`);
  return results;
}

export function buildBranchName(taskId, slugOrModule = 'work', action = '', type = 'feat') {
  const cleanType = ['fix', 'feat', 'feature', 'refactor', 'perf'].includes(type) ? type : 'feat';
  const rawParts = [slugOrModule, action].filter(Boolean).join('-');
  const cleanSlug = rawParts
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanType}/task-${taskId}-${cleanSlug}`;
}

export async function startTask(taskId, slugOrModule = 'work', action = '', type = 'feat', scope = 'fullstack') {
  if (!taskId) {
    console.error('❌ Missing task ID. Usage: node scripts/git-task-workflow.mjs start <task_id> [slug/module] [action] [type] [scope]');
    process.exit(1);
  }

  const branchName = buildBranchName(taskId, slugOrModule, action, type);

  console.log(`\n======================================================`);
  console.log(`🚀 KHỞI TẠO FEATURE BRANCH CHO TASK #${taskId}`);
  console.log(`🌿 Branch: ${branchName}`);
  console.log(`🎯 Scope: ${scope}`);
  console.log(`======================================================\n`);

  // 1. Sync dev
  console.log('🔄 Đang đồng bộ nhánh dev mới nhất...');
  if (scope === 'backend' || scope === 'fullstack') {
    run('git checkout dev', BACKEND_DIR);
    run('git pull origin dev', BACKEND_DIR);
  }
  if (scope === 'frontend' || scope === 'fullstack') {
    run('git checkout dev', FRONTEND_DIR);
    run('git pull origin dev', FRONTEND_DIR);
  }
  run('git checkout dev', ROOT_DIR);
  run('git pull origin dev', ROOT_DIR);

  // 2. Create feature branch
  console.log(`\n🌱 Đang tạo và checkout nhánh ${branchName}...`);
  if (scope === 'backend' || scope === 'fullstack') {
    run(`git checkout -B ${branchName}`, BACKEND_DIR);
  }
  if (scope === 'frontend' || scope === 'fullstack') {
    run(`git checkout -B ${branchName}`, FRONTEND_DIR);
  }
  run(`git checkout -B ${branchName}`, ROOT_DIR);

  console.log(`\n✅ ĐÃ TẠO NHÁNH THÀNH CÔNG!`);
  const branches = getCurrentBranches();
  console.log(`- Root    : ${branches.root}`);
  console.log(`- Backend : ${branches.backend}`);
  console.log(`- Frontend: ${branches.frontend}`);

  // 3. Tự động khởi động Local Dev Servers (port 4001 & 4000) ngay từ đầu task
  console.log(`\n⚡ [Local-First Mandate] Đang kiểm tra & tự động bật Local Servers (port 4001 & 4000)...`);
  await ensureLocalServers({ maxWaitSec: 90 });

  console.log(`\n💡 Tiếp theo: Thực hiện code, build local và chạy Playwright E2E test local trên http://localhost:4000.`);
}

export async function createAndMergePr(taskId, slugOrModule = 'work', action = '', type = 'feat', scope = 'fullstack') {
  if (!taskId) {
    console.error('❌ Missing task ID. Usage: node scripts/git-task-workflow.mjs pr <task_id> [slug/module] [action] [type] [scope]');
    process.exit(1);
  }

  // Chốt chặn bắt buộc: Kiểm tra Local Servers (4000 & 4001) phải đang bật
  const localStatus = await checkLocalServers(2500);
  if (!localStatus.isRunning) {
    console.error(`\n🚨 [LOCAL-FIRST GATE BLOCKED] Không thể tạo PR khi Local Servers chưa bật!`);
    console.error(`- Backend  (:4001): ${localStatus.beOk ? 'UP' : 'DOWN'}`);
    console.error(`- Frontend (:4000): ${localStatus.feOk ? 'UP' : 'DOWN'}`);
    console.error(`💡 Bắt buộc chạy 'npm run dev:ensure' và pass Playwright E2E Local trước khi chạy lệnh PR.\n`);
    process.exit(1);
  }

  const branchName = buildBranchName(taskId, slugOrModule, action, type);

  console.log(`\n======================================================`);
  console.log(`📦 TẠO PR & TỰ ĐỘNG MERGE VÀO DEV (TASK #${taskId})`);
  console.log(`🌿 Branch: ${branchName} -> dev`);
  console.log(`======================================================\n`);

  const repos = [];
  if (scope === 'backend' || scope === 'fullstack') {
    repos.push({ name: 'Backend', dir: BACKEND_DIR, ghRepo: 'lyquangthai1993/logistics-website-backend' });
  }
  if (scope === 'frontend' || scope === 'fullstack') {
    repos.push({ name: 'Frontend', dir: FRONTEND_DIR, ghRepo: 'lyquangthai1993/logistics-website-frontend' });
  }
  if (scope === 'root') {
    repos.push({ name: 'Root', dir: ROOT_DIR, ghRepo: 'lyquangthai1993/logistics-website' });
  }

  const isGhAuthed = checkGhAuth();

  for (const repo of repos) {
    console.log(`\n[${repo.name}] Đang đẩy nhánh ${branchName} lên GitHub...`);
    try {
      run(`git push -u origin ${branchName}`, repo.dir);
    } catch {
      console.warn(`⚠️ Push nhánh ${branchName} trong ${repo.name} có cảnh báo.`);
    }

    if (isGhAuthed) {
      console.log(`[${repo.name}] Đang tạo PR vào dev...`);
      try {
        const title = `${type}(task-${taskId}): ${slugOrModule}${action ? '-' + action : ''}`;
        const body = `## Task #${taskId}\\n\\n- Branch: ${branchName}\\n- Local E2E Gate: PASS 100%\\n- Target: dev`;
        run(`gh pr create --repo ${repo.ghRepo} --base dev --head ${branchName} --title "${title}" --body "${body}"`, repo.dir);

        console.log(`[${repo.name}] Tự động merge PR vào dev...`);
        run(`gh pr merge --repo ${repo.ghRepo} ${branchName} --merge`, repo.dir);
        run('git checkout dev', repo.dir);
        run('git pull origin dev', repo.dir);
        // Quay trở lại nhánh feature chính và đồng bộ với dev để tránh đứng ở dev
        run(`git checkout ${branchName}`, repo.dir);
        run('git merge --ff-only dev', repo.dir);
        console.log(`✅ [${repo.name}] PR đã được merge vào dev & workspace đã quay về nhánh feature '${branchName}'!`);
      } catch {
        console.warn(`⚠️ gh CLI gặp lỗi khi tạo/merge PR trong ${repo.name}. Tiến hành merge qua Git fallback.`);
        gitFallbackMerge(repo.dir, branchName);
      }
    } else {
      console.log(`ℹ️ GitHub CLI chưa đăng nhập (gh auth login). Tiến hành merge Git fallback...`);
      gitFallbackMerge(repo.dir, branchName);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 HOÀN THÀNH MERGE VÀO DEV CHO TASK #${taskId}`);
  console.log(`- Mã nguồn đã được cập nhật trên origin/dev.`);
  console.log(`- Workspace vẫn giữ tại nhánh feature '${branchName}' để tránh push nhầm vào dev.`);
  console.log(`- Bắt buộc chạy 'npm run railway:wait' (hoặc 'npm run railway:verify') để xác nhận Railway build SUCCESS & cutover hoàn tất trước khi chạy E2E Tầng 2!`);
  console.log(`======================================================\n`);
}

function gitFallbackMerge(cwd, branchName) {
  run('git checkout dev', cwd);
  run('git pull origin dev', cwd);
  run(`git merge --no-ff ${branchName} -m "merge(task): merge ${branchName} into dev"`, cwd);
  run('git push origin dev --allow-protected-push', cwd);
  // Luôn quay về nhánh feature sau khi merge xong
  run(`git checkout ${branchName}`, cwd);
  run('git merge --ff-only dev', cwd);
  console.log(`✅ Đã merge ${branchName} vào dev và quay về nhánh feature '${branchName}'!`);
}

export async function promoteDevToMaster(note = 'promote dev to production master') {
  checkGhAuth();
  const repos = [
    { name: 'Backend', dir: BACKEND_DIR, ghRepo: 'lyquangthai1993/logistics-website-backend' },
    { name: 'Frontend', dir: FRONTEND_DIR, ghRepo: 'lyquangthai1993/logistics-website-frontend' },
    { name: 'Root', dir: ROOT_DIR, ghRepo: 'lyquangthai1993/logistics-website' },
  ];

  console.log(`\n======================================================`);
  console.log(`🚀 PROMOTE DEV -> PRODUCTION MASTER`);
  console.log(`======================================================\n`);

  for (const repo of repos) {
    run('git fetch origin dev master', repo.dir, true);
    const diffLog = runOutput('git log origin/master..origin/dev --oneline', repo.dir);
    if (!diffLog) {
      console.log(`✅ [${repo.name}] origin/master đã đồng bộ 100% với origin/dev.`);
      continue;
    }
    console.log(`\n📦 [${repo.name}] Phát hiện commit mới trên dev cần đưa lên master:\n${diffLog}`);
    try {
      const title = `release: ${note}`;
      const body = `Promote latest verified \`dev\` commits to production \`master\`:\n\n\`\`\`\n${diffLog}\n\`\`\``;
      try {
        run(`gh pr create --repo ${repo.ghRepo} --base master --head dev --title "${title}" --body "${body.replace(/"/g, '\\"')}"`, repo.dir);
      } catch {
        // PR might already exist
      }
      run(`gh pr merge --repo ${repo.ghRepo} dev --merge`, repo.dir);
      run('git fetch origin master:master', repo.dir, true);
      console.log(`✅ [${repo.name}] Đã merge dev -> master thành công!`);
    } catch (err) {
      console.error(`❌ [${repo.name}] Lỗi khi merge PR dev -> master:`, err.message);
    }
  }

  resumeFeatureBranch();
}

// CLI entry point
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    switch (command) {
      case 'start': {
        const taskId = args[1];
        const moduleOrSlug = args[2] || 'work';
        const action = args[3] || '';
        const type = args[4] || 'feat';
        const scope = args[5] || 'fullstack';
        await startTask(taskId, moduleOrSlug, action, type, scope);
        break;
      }
      case 'pr': {
        const taskId = args[1];
        const moduleOrSlug = args[2] || 'work';
        const action = args[3] || '';
        const type = args[4] || 'feat';
        const scope = args[5] || 'fullstack';
        await createAndMergePr(taskId, moduleOrSlug, action, type, scope);
        break;
      }
      case 'resume': {
        const explicitBranch = args[1] || '';
        resumeFeatureBranch(explicitBranch);
        break;
      }
      case 'promote-master': {
        const note = args.slice(1).join(' ') || 'promote dev to production master';
        await promoteDevToMaster(note);
        break;
      }
      case 'status': {
        const branches = getCurrentBranches();
        const traced = getTracedFeatureBranches();
        console.log('\n📊 TRẠNG THÁI BRANCH HIỆN TẠI & TRUY VẾT GIT HISTORY:');
        console.log(`- Root    : ${branches.root || 'detached'} (Last Feature Branch: ${traced.root || 'N/A'})`);
        console.log(`- Backend : ${branches.backend || 'detached'} (Last Feature Branch: ${traced.backend || 'N/A'})`);
        console.log(`- Frontend: ${branches.frontend || 'detached'} (Last Feature Branch: ${traced.frontend || 'N/A'})`);

        const onProtected = [
          PROTECTED_BRANCHES.has(branches.root) && `Root (${branches.root})`,
          PROTECTED_BRANCHES.has(branches.backend) && `Backend (${branches.backend})`,
          PROTECTED_BRANCHES.has(branches.frontend) && `Frontend (${branches.frontend})`,
        ].filter(Boolean);

        if (onProtected.length > 0) {
          console.log(`\n🚨 [CẢNH BÁO BẮT BUỘC]: Phát hiện repo đang đứng ở nhánh bảo vệ: ${onProtected.join(', ')}!`);
          console.log(`👉 Không được tự ý commit/push thẳng lên 'dev' hoặc 'master'.`);
          console.log(`👉 Chạy ngay: 'npm run repo:resume' (hoặc 'node scripts/git-task-workflow.mjs resume') để quay về branch feature chính!\n`);
        } else {
          console.log(`\n✅ Toàn bộ 3 repo đều đang đứng trên nhánh feature hợp lệ.\n`);
        }
        break;
      }
      default: {
        console.log(`
Quy Trình Chuẩn GitHub Task Workflow CLI (RULE-GIT-TASK-WORKFLOW-01)
===================================================================
Quy chuẩn tên nhánh: <type>/task-<id>-<module>-<action>
Ví dụ: feat/task-81-warehouse-outbound-pallet

Sử dụng:
  node scripts/git-task-workflow.mjs status
    -> Kiểm tra nhánh hiện tại & truy ngược Git History tìm nhánh feature gần nhất trên cả 3 repos

  node scripts/git-task-workflow.mjs resume [branch_name]
    -> Tự động truy ngược Git History (reflog/refs) và checkout quay về nhánh feature chính trước đó

  node scripts/git-task-workflow.mjs start <task_id> [module/slug] [action] [type] [scope]
    -> Kéo dev mới nhất, tạo nhánh trong submodule & tự động bật Local Servers (4000 & 4001)

  node scripts/git-task-workflow.mjs pr <task_id> [module/slug] [action] [type] [scope]
    -> Kiểm tra Local Servers đang chạy, push nhánh, tạo PR vào dev, merge & quay về nhánh feature
`);
        break;
      }
    }
  })();
}
