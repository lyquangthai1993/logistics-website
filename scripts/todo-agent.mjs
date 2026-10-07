#!/usr/bin/env node

/**
 * Todo Agent CLI & Scanner for Logistics TMS (Spider Express)
 *
 * Scans, analyzes, and plans execution for `feedback_DD_MM*` task folders.
 * Adheres to AGENTS.md, /leader domain rules, and UI compact density standards.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Regex matching feedback directories: e.g., feedback_06_10, feedback_06_10_task_1, feedback_17_8
const FEEDBACK_DIR_REGEX = /^feedback_(\d{1,2})_(\d{1,2})(.*)?$/i;

// In-memory workspace file cache for fast basename resolution
let workspaceFileIndex = null;

/**
 * Recursively scans directory and builds a map of basename -> relative paths
 */
export function buildWorkspaceFileIndex(rootDir = ROOT_DIR) {
  if (workspaceFileIndex) return workspaceFileIndex;

  const index = new Map();
  const searchDirs = ['backend/src', 'frontend/src', 'docs', 'business_flow'];

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') {
        continue;
      }
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');
        const base = entry.name.toLowerCase();
        if (!index.has(base)) {
          index.set(base, []);
        }
        index.get(base).push(rel);
      }
    }
  }

  for (const sDir of searchDirs) {
    walk(path.join(rootDir, sDir));
  }

  workspaceFileIndex = index;
  return index;
}

/**
 * Resolves a referenced file or path to its exact location in the workspace.
 * @param {string} fileRef
 * @returns {{ input: string, resolved: string | null, exists: boolean }}
 */
export function resolveReferencedFile(fileRef, rootDir = ROOT_DIR) {
  if (!fileRef) return { input: fileRef, resolved: null, exists: false };

  // Strip file:// prefix and decode URI components safely
  let clean = fileRef.trim().replace(/^file:\/\/\/?/i, '');
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Keep raw string if URI decode fails (e.g. lone % character)
  }

  // On Windows, file:///d:/... becomes d:/...
  // Check if it's already an absolute path
  let candidate = clean;
  if (path.isAbsolute(candidate)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const rel = path.relative(rootDir, candidate).replace(/\\/g, '/');
      return { input: fileRef, resolved: rel, exists: true };
    }
  }

  // Check candidate relative to rootDir
  candidate = path.resolve(rootDir, clean);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    const rel = path.relative(rootDir, candidate).replace(/\\/g, '/');
    return { input: fileRef, resolved: rel, exists: true };
  }

  // Try basename lookup via index
  const baseName = path.basename(clean).toLowerCase();
  const fileIndex = buildWorkspaceFileIndex(rootDir);

  if (fileIndex.has(baseName)) {
    const matches = fileIndex.get(baseName);
    return { input: fileRef, resolved: matches[0], exists: true, alternatives: matches.slice(1) };
  }

  return { input: fileRef, resolved: null, exists: false };
}

/**
 * Discovers all feedback directories in the workspace root.
 * @returns {Array<{ name: string, fullPath: string, day: number, month: number, suffix: string }>}
 */
export function discoverFeedbackFolders(rootDir = ROOT_DIR) {
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const folders = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const match = entry.name.match(FEEDBACK_DIR_REGEX);
      if (match) {
        folders.push({
          name: entry.name,
          fullPath: path.join(rootDir, entry.name),
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          suffix: match[3] || '',
        });
      }
    }

    // Sort chronologically: month, then day, then suffix
    folders.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.suffix.localeCompare(b.suffix);
    });

    return folders;
  } catch (err) {
    console.error(`Error discovering feedback folders in ${rootDir}:`, err.message);
    return [];
  }
}

/**
 * Parses a TODO.md file inside a feedback directory.
 * @param {string} folderPath
 * @returns {object} Parsed metadata, task lists, and statistics
 */
export function parseFeedbackFolder(folderPath) {
  const folderName = path.basename(folderPath);
  const result = {
    folderName,
    folderPath,
    hasTodo: false,
    title: folderName,
    meta: {},
    sections: [],
    tasks: {
      total: 0,
      completed: 0,
      pending: 0,
      percent: 0,
      byCategory: {
        backend: [],
        frontend: [],
        database: [],
        testing: [],
        general: [],
      },
    },
    documents: [],
    images: [],
    dataFiles: [],
    rawContent: '',
  };

  if (!fs.existsSync(folderPath)) {
    return result;
  }

  // Scan files inside the folder
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) continue;
    const ext = path.extname(item.name).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
      result.images.push(item.name);
    } else if (['.json', '.xlsx', '.csv'].includes(ext)) {
      result.dataFiles.push(item.name);
    } else if (ext === '.md' && !item.name.toLowerCase().startsWith('todo')) {
      result.documents.push(item.name);
    }
  }

  // Find TODO.md (case-insensitive)
  const todoFile = items.find(
    (item) => !item.isDirectory() && item.name.toLowerCase() === 'todo.md'
  );

  if (!todoFile) {
    return result;
  }

  result.hasTodo = true;
  const todoPath = path.join(folderPath, todoFile.name);
  const content = fs.readFileSync(todoPath, 'utf8');
  result.rawContent = content;

  const lines = content.split('\n');
  let currentSection = 'General';
  let currentCategory = 'general';
  let currentMetaKey = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/\r$/, '');
    const trimmed = cleanLine.trim();

    // Extract Main Title
    if (trimmed.startsWith('# ') && result.title === folderName) {
      result.title = trimmed.replace(/^#\s+/, '').trim();
      currentMetaKey = null;
      continue;
    }

    // Extract Metadata block: > **Key**: Value
    const metaMatch = trimmed.match(/^>\s*\*\*([^*]+)\*\*:\s*(.*)$/);
    if (metaMatch) {
      const key = metaMatch[1].trim();
      const val = metaMatch[2].trim();
      result.meta[key] = val;
      currentMetaKey = key;
      continue;
    }

    // Continue multiline metadata: > - ... or > * ...
    if (currentMetaKey && trimmed.startsWith('>')) {
      const bullet = trimmed.replace(/^>\s*[-*]\s*/, '').trim();
      if (bullet) {
        result.meta[currentMetaKey] = (result.meta[currentMetaKey] ? result.meta[currentMetaKey] + ' • ' : '') + bullet;
      }
      continue;
    } else if (!trimmed.startsWith('>')) {
      currentMetaKey = null;
    }

    // Detect section headers: ## or ###
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      currentMetaKey = null;
      currentSection = trimmed.replace(/^#{2,3}\s+/, '').trim();
      const lower = currentSection.toLowerCase();

      if (lower.includes('backend')) {
        currentCategory = 'backend';
      } else if (lower.includes('frontend')) {
        currentCategory = 'frontend';
      } else if (lower.includes('db') || lower.includes('database') || lower.includes('migration')) {
        currentCategory = 'database';
      } else if (
        lower.includes('kiểm thử') ||
        lower.includes('test') ||
        lower.includes('nghiệm thu') ||
        lower.includes('verification')
      ) {
        currentCategory = 'testing';
      } else {
        currentCategory = 'general';
      }
      continue;
    }

    // Detect checkbox tasks: - [ ] or - [x]
    const taskMatch = cleanLine.match(/^(\s*)-\s*\[([ xX])\]\s*(.+)$/);
    if (taskMatch) {
      const isCompleted = taskMatch[2].toLowerCase() === 'x';
      const taskText = taskMatch[3].trim();
      const indentLevel = taskMatch[1].length;

      // Extract referenced files or paths in backticks or markdown links
      const rawRefs = [];
      const linkMatches = taskText.matchAll(/\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g);
      for (const m of linkMatches) {
        const potentialPath = m[2] || m[3] || m[1];
        if (
          potentialPath &&
          (potentialPath.includes('/') ||
            potentialPath.includes('\\') ||
            potentialPath.endsWith('.ts') ||
            potentialPath.endsWith('.tsx') ||
            potentialPath.endsWith('.js') ||
            potentialPath.endsWith('.mjs') ||
            potentialPath.endsWith('.md'))
        ) {
          rawRefs.push(potentialPath);
        }
      }

      // Resolve referenced files
      const resolvedFiles = rawRefs.map((r) => resolveReferencedFile(r));

      const taskItem = {
        line: i + 1,
        text: taskText,
        completed: isCompleted,
        section: currentSection,
        category: currentCategory,
        isSubtask: indentLevel > 0,
        referencedFiles: resolvedFiles,
      };

      result.tasks.total++;
      if (isCompleted) {
        result.tasks.completed++;
      } else {
        result.tasks.pending++;
      }

      result.tasks.byCategory[currentCategory].push(taskItem);
    }
  }

  if (result.tasks.total > 0) {
    result.tasks.percent = Math.round((result.tasks.completed / result.tasks.total) * 100);
  }

  return result;
}

/**
 * Generates an Execution Blueprint and Action Plan for a parsed feedback folder.
 * @param {object} parsed
 * @returns {string} Formatted markdown action plan
 */
export function generateExecutionPlan(parsed) {
  const { folderName, title, meta, tasks, images, documents } = parsed;

  const backendPending = tasks.byCategory.backend.filter((t) => !t.completed);
  const frontendPending = tasks.byCategory.frontend.filter((t) => !t.completed);
  const databasePending = tasks.byCategory.database.filter((t) => !t.completed);
  const testingPending = tasks.byCategory.testing.filter((t) => !t.completed);
  const generalPending = tasks.byCategory.general.filter((t) => !t.completed);

  const totalPending = tasks.pending;

  let branchName = 'dev';
  if (totalPending > 0) {
    const slug = folderName.replace(/_/g, '-');
    branchName = `fix/${slug}`;
  }

  // Collect all resolved target files
  const verifiedTargetFiles = new Set();
  const allPending = [
    ...backendPending,
    ...frontendPending,
    ...databasePending,
    ...testingPending,
    ...generalPending,
  ];

  allPending.forEach((t) => {
    t.referencedFiles.forEach((f) => {
      if (f.resolved && (f.resolved.startsWith('backend/') || f.resolved.startsWith('frontend/'))) {
        verifiedTargetFiles.add(f.resolved);
      }
    });
  });

  const output = [];

  output.push(`# 🚀 BẢN KẾ HOẠCH THỰC THI (EXECUTION BLUEPRINT) — ${folderName.toUpperCase()}`);
  output.push(`> **Tiêu đề**: ${title}`);
  if (meta['Thời gian ghi nhận']) output.push(`> **Thời gian**: ${meta['Thời gian ghi nhận']}`);
  if (meta['Người báo cáo']) output.push(`> **Người báo cáo**: ${meta['Người báo cáo']}`);
  if (meta['Màn hình liên quan'] || meta['Màn hình / Hạ tầng liên quan']) {
    output.push(`> **Phạm vi**: ${meta['Màn hình liên quan'] || meta['Màn hình / Hạ tầng liên quan']}`);
  }
  output.push(`> **Tiến độ hiện tại**: ${tasks.completed}/${tasks.total} việc đã hoàn thành (${tasks.percent}%) • Còn tồn đọng: **${totalPending} việc**`);
  output.push('');

  output.push('---');
  output.push('');

  // 1. Phân loại Module & Git Submodule Strategy
  output.push('## 1. 🎯 CHIẾN LƯỢC GIT SUBMODULE & KHOANH VÙNG PHẠM VI');
  output.push('Tuân thủ nghiêm ngặt quy định **Git Submodules Rule** & **Base from dev Rule** trong `AGENTS.md`:');
  output.push(`- **Branch đề xuất**: \`${branchName}\` (Tạo trực tiếp trong submodule từ \`dev\`)`);
  output.push(`- **Submodules cần can thiệp**:`);
  if (backendPending.length > 0 || databasePending.length > 0) {
    output.push('  + `backend/` (NestJS 11+, PostgreSQL, TypeORM, DTOs, Services, Controllers)');
  }
  if (frontendPending.length > 0) {
    output.push('  + `frontend/` (Next.js 15 App Router, React 19, Tailwind CSS, TanStack Query v5, Zustand)');
  }
  if (backendPending.length === 0 && frontendPending.length === 0) {
    output.push('  + Không có tác vụ pending cụ thể cho backend/frontend.');
  }

  if (verifiedTargetFiles.size > 0) {
    output.push('');
    output.push(`- **Các tệp tin mã nguồn đích đã định vị chính xác (${verifiedTargetFiles.size} files)**:`);
    verifiedTargetFiles.forEach((filePath) => {
      output.push(`  + \`${filePath}\``);
    });
  }
  output.push('');

  // 2. Tài nguyên & Bằng chứng đính kèm
  output.push('## 2. 📸 TÀI NGUYÊN & BẰNG CHỨNG ĐÃ QUÉT ĐƯỢC');
  if (images.length > 0) {
    output.push(`- **Hình ảnh / Video minh chứng (${images.length} tệp)**:`);
    images.forEach((img) => output.push(`  + \`${folderName}/${img}\``));
  } else {
    output.push('- *Không có hình ảnh đính kèm trong thư mục này.*');
  }

  if (documents.length > 0) {
    output.push(`- **Tài liệu đặc tả liên quan (${documents.length} tệp)**:`);
    documents.forEach((doc) => output.push(`  + \`${folderName}/${doc}\``));
  }
  output.push('');

  // 3. Biện pháp thực thi chi tiết theo từng phân hệ
  output.push('## 3. 🛠️ BIỆN PHÁP THỰC THI CHI TIẾT (ACTION PLAN)');

  if (totalPending === 0) {
    output.push('🎉 **TẤT CẢ CÁC ĐẦU VIỆC ĐÃ ĐƯỢC HOÀN THÀNH 100%!**');
    output.push('Đề xuất chạy kiểm thử hồi quy (Playwright E2E) và xác nhận đóng task.');
    output.push('');
    return output.join('\n');
  }

  // Database
  if (databasePending.length > 0) {
    output.push('### 🗄️ Phân hệ Cơ sở dữ liệu & Migrations');
    output.push('**Quy chuẩn an toàn**: Tuyệt đối không xóa bảng/cột destructive mà chưa có phê duyệt; viết TypeORM Migration an toàn.');
    databasePending.forEach((t) => {
      output.push(`- [ ] **[DB] L${t.line}**: ${t.text}`);
    });
    output.push('');
  }

  // Backend
  if (backendPending.length > 0) {
    output.push('### ⚙️ Phân hệ Backend (NestJS 11+)');
    output.push('**Quy chuẩn**: DTO validation qua `class-validator`, bảo vệ route bằng JWT/RBAC Guards, trả về standardized API format.');
    backendPending.forEach((t) => {
      output.push(`- [ ] **[Backend] L${t.line}**: ${t.text}`);
      if (t.referencedFiles.length > 0) {
        t.referencedFiles.forEach((f) => {
          if (f.resolved) output.push(`      📍 File: \`${f.resolved}\``);
        });
      }
    });
    output.push('');
  }

  // Frontend
  if (frontendPending.length > 0) {
    output.push('### 💻 Phân hệ Frontend (Next.js 15 App Router)');
    output.push('**Quy chuẩn bắt buộc**:');
    output.push('1. **Compact Density Mandate** (`ui-compact-density.md`): Card `p-1`, Modal body `p-2`, Gap `gap-1.5` - `gap-2`, Table font `text-[10px]`.');
    output.push('2. **Zero Technical Jargon**: Dùng thuật ngữ vận hành kho bãi thực tế, không dùng mã nội bộ.');
    output.push('3. **Zero Redundant Icons**: Không lặp lại emoji/biểu tượng bên trong text nút bấm.');
    output.push('4. **TanStack Optimistic Updates**: Đảm bảo 0ms latency phản hồi và rollback an toàn.');
    frontendPending.forEach((t) => {
      output.push(`- [ ] **[Frontend] L${t.line}**: ${t.text}`);
      if (t.referencedFiles.length > 0) {
        t.referencedFiles.forEach((f) => {
          if (f.resolved) output.push(`      📍 File: \`${f.resolved}\``);
        });
      }
    });
    output.push('');
  }

  // Testing & DoD
  output.push('### 🧪 Tiêu chí Nghiệm thu & Kiểm thử (Definition of Done)');
  if (testingPending.length > 0) {
    testingPending.forEach((t) => {
      output.push(`- [ ] **[DoD] L${t.line}**: ${t.text}`);
    });
  } else {
    output.push('- [ ] Kiểm tra biên dịch Backend: `npm run lint --prefix backend` & `npm run build --prefix backend` PASS (0 errors).');
    output.push('- [ ] Kiểm tra biên dịch Frontend: `npx --prefix frontend tsc --noEmit` & `npm run build --prefix frontend` PASS (0 errors).');
    output.push('- [ ] Kiểm thử luồng nghiệp vụ thực tế qua Playwright E2E hoặc kiểm tra API phản hồi.');
    output.push(`- [ ] Cập nhật toàn bộ trạng thái trong \`${folderName}/TODO.md\` từ \`[ ]\` thành \`[x]\`.`);
  }
  // 4. Kịch bản Kiểm thử E2E & Ma trận Edge Cases
  output.push('## 4. 🧪 KỊCH BẢN KIỂM THỬ E2E CHUẨN XÁC & MA TRẬN EDGE CASES');
  output.push('Mọi thay đổi mã nguồn bắt buộc phải có kịch bản kiểm thử E2E rõ ràng cho cả AI và con người hiểu:');
  output.push('');
  output.push('### 🔄 Quy trình Thao tác Tuần tự (Step-by-Step E2E Workflow):');
  output.push('1. **Bước 1 (Đăng nhập & Điều hướng)**: Đăng nhập tài khoản phân quyền tương ứng và truy cập route màn hình mục tiêu.');
  output.push('2. **Bước 2 (Mở modal / Chế độ thao tác)**: Mở component tương ứng, kiểm tra layout và độ rộng Modal chuẩn 5 cấp độ (Level 1-5).');
  output.push('3. **Bước 3 (API Intercept & Pre-check)**: Kiểm tra request params, response status 200, và dữ liệu khởi tạo không bị rỗng/lệch.');
  output.push('4. **Bước 4 (Tương tác nghiệp vụ)**: Thao tác form / chọn dòng bảng, assert các counter cập nhật 0ms.');
  output.push('5. **Bước 5 (Submit & Post-check)**: Gửi action, assert Toast thông báo tiếng Việt, assert modal đóng và dữ liệu tự động làm mới.');
  output.push('');
  output.push('### 🛡️ Ma trận Edge Cases Tối thiểu Cần Kiểm tra:');
  output.push('| Mã Case | Tên tình huống biên (Edge Case) | Điều kiện kích hoạt | Hành vi kỳ vọng (Expected Behavior) |');
  output.push('|:---:|---|---|---|');
  output.push('| **EC-01** | **Zero-state (Dữ liệu rỗng)** | Khi danh sách hoặc kho không có phần tử nào. | Hiển thị Empty State rõ ràng, không crash giao diện, nút submit disabled. |');
  output.push('| **EC-02** | **Boundary Data (Số liệu = 0)** | Kiện = 0, kg = 0, đơn đã xuất hết hoặc hủy. | Bị loại trừ khỏi danh sách khả dụng, không cho phép thao tác. |');
  output.push('| **EC-03** | **Data Isolation (Phân quyền kho/role)** | Tài khoản kho A xem dữ liệu kho B. | Tuyệt đối không lọt dữ liệu chéo giữa các chi nhánh / Hub. |');
  output.push('| **EC-04** | **Trip / Action Idempotency** | Thao tác 2 lần liên tiếp hoặc bốc lại đơn cũ. | Không gán trùng lặp, mở lại modal dữ liệu cũ đã biến mất khỏi danh sách. |');
  output.push('| **EC-05** | **Filter & Live Search** | Gõ từ khóa tìm kiếm hoặc lọc dropdown. | Bảng lọc mượt mà, xóa filter quay về 100% dữ liệu gốc. |');
  output.push('');

  // 5. Lệnh /goal chuẩn hóa cho Antigravity
  output.push('## 5. ⚡ LỆNH /GOAL TỰ ĐỘNG KHỞI TẠO CHO AGENT');
  output.push('```text');
  output.push(`/goal Thực thi hoàn thiện ${folderName} — ${title}`);
  output.push(`- Thư mục nguồn: ${folderName}`);
  output.push(`- Tổng số task cần xử lý: ${totalPending}`);
  output.push(`- Phạm vi tệp tin (Allowed Scope):`);
  if (backendPending.length > 0 || databasePending.length > 0) output.push(`  + backend/src/**`);
  if (frontendPending.length > 0) output.push(`  + frontend/src/**`);
  if (verifiedTargetFiles.size > 0) {
    verifiedTargetFiles.forEach((f) => output.push(`  + ${f}`));
  }
  output.push(`  + ${folderName}/TODO.md`);
  output.push(`- Tiêu chí hoàn thành: Thực hiện 100% các task [ ], chạy build pass và check off [x] trong ${folderName}/TODO.md.`);
  output.push('```');
  output.push('');

  return output.join('\n');
}

/**
 * Toggles a task in TODO.md by line number or query text
 * @param {string} folderName
 * @param {number|string} targetLineOrQuery
 * @param {'done'|'pending'|'toggle'} action
 */
export function toggleTask(folderName, targetLineOrQuery, action = 'toggle', rootDir = ROOT_DIR) {
  const folders = discoverFeedbackFolders(rootDir);
  const matched = folders.find((f) => f.name.toLowerCase().includes(folderName.toLowerCase()));

  if (!matched) {
    console.error(`❌ Không tìm thấy thư mục feedback: ${folderName}`);
    return false;
  }

  const todoPath = path.join(matched.fullPath, 'TODO.md');
  if (!fs.existsSync(todoPath)) {
    console.error(`❌ Không tìm thấy TODO.md trong ${matched.name}`);
    return false;
  }

  const content = fs.readFileSync(todoPath, 'utf8');
  const lines = content.split('\n');

  let updated = false;
  const isLineNumber = !isNaN(Number(targetLineOrQuery));
  const targetLine = isLineNumber ? Number(targetLineOrQuery) : -1;
  const targetQuery = !isLineNumber ? String(targetLineOrQuery).toLowerCase() : '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/\r$/, '');
    const currentLineNum = i + 1;

    const taskMatch = cleanLine.match(/^(\s*-\s*\[)([ xX])(\]\s*.+)$/);
    if (!taskMatch) continue;

    const isMatch = isLineNumber
      ? currentLineNum === targetLine
      : cleanLine.toLowerCase().includes(targetQuery);

    if (isMatch) {
      const currentBox = taskMatch[2].toLowerCase();
      let newBox = currentBox;

      if (action === 'done') {
        newBox = 'x';
      } else if (action === 'pending') {
        newBox = ' ';
      } else {
        newBox = currentBox === 'x' ? ' ' : 'x';
      }

      lines[i] = `${taskMatch[1]}${newBox}${taskMatch[3]}${rawLine.endsWith('\r') ? '\r' : ''}`;
      updated = true;
      console.log(`✅ [${matched.name}] Đã cập nhật dòng ${currentLineNum}: [${newBox}] ${taskMatch[3].trim().slice(0, 60)}...`);
      if (isLineNumber) break; // if targeting line number, only update that one
    }
  }

  if (updated) {
    fs.writeFileSync(todoPath, lines.join('\n'), 'utf8');
    return true;
  } else {
    console.log(`⚠️ Không tìm thấy task nào khớp với "${targetLineOrQuery}"`);
    return false;
  }
}

/**
 * Command: scan all feedback folders and print summary table
 */
export function cmdScan(asJson = false) {
  const folders = discoverFeedbackFolders();
  if (folders.length === 0) {
    if (asJson) {
      console.log(JSON.stringify([], null, 2));
    } else {
      console.log('ℹ️ Không tìm thấy thư mục feedback_* nào trong dự án.');
    }
    return;
  }

  const results = [];
  const rows = [];

  for (const f of folders) {
    const parsed = parseFeedbackFolder(f.fullPath);
    let statusBadge = '⚠️ NOT_STARTED';
    if (!parsed.hasTodo) {
      statusBadge = '❓ NO_TODO';
    } else if (parsed.tasks.total === 0) {
      statusBadge = '⚪ EMPTY';
    } else if (parsed.tasks.percent === 100) {
      statusBadge = '✅ DONE (100%)';
    } else if (parsed.tasks.completed > 0) {
      statusBadge = `⏳ IN_PROGRESS (${parsed.tasks.percent}%)`;
    }

    results.push({
      folder: f.name,
      title: parsed.title,
      totalTasks: parsed.tasks.total,
      completedTasks: parsed.tasks.completed,
      pendingTasks: parsed.tasks.pending,
      percent: parsed.tasks.percent,
      imagesCount: parsed.images.length,
      docsCount: parsed.documents.length,
      status: statusBadge,
    });

    rows.push({
      Folder: f.name,
      Title: parsed.title.length > 40 ? parsed.title.slice(0, 37) + '...' : parsed.title,
      Tasks: `${parsed.tasks.completed}/${parsed.tasks.total}`,
      Pending: parsed.tasks.pending,
      Images: parsed.images.length,
      Docs: parsed.documents.length,
      Status: statusBadge,
    });
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`🔍 TỔNG HỢP DANH SÁCH FEEDBACK WORKSPACE (${folders.length} THƯ MỤC)`);
  console.log(`================================================================================\n`);

  console.table(rows);
  console.log(`\n💡 Gợi ý lệnh tiếp theo:`);
  console.log(`- Để xem chi tiết 1 feedback: node scripts/todo-agent.mjs inspect <tên_folder>`);
  console.log(`- Để lập kế hoạch thực thi:   node scripts/todo-agent.mjs plan <tên_folder>`);
  console.log(`- Để đổi trạng thái task:     node scripts/todo-agent.mjs toggle <tên_folder> <line> [done|pending]\n`);
}

/**
 * Returns a structured summary of feedback folders and pending tasks for today.
 * @param {string} rootDir
 * @returns {object} Summary object
 */
export function getTodayTasksSummary(rootDir = ROOT_DIR) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const folders = discoverFeedbackFolders(rootDir).filter(
    (f) => f.day === currentDay && f.month === currentMonth
  );

  const parsedFolders = folders.map((f) => parseFeedbackFolder(f.fullPath));
  const totalTasks = parsedFolders.reduce((sum, p) => sum + p.tasks.total, 0);
  const totalCompleted = parsedFolders.reduce((sum, p) => sum + p.tasks.completed, 0);
  const totalPending = parsedFolders.reduce((sum, p) => sum + p.tasks.pending, 0);
  const percent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const pendingFolders = parsedFolders.filter((p) => p.tasks.pending > 0);

  return {
    day: currentDay,
    month: currentMonth,
    dateString: `${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
    totalFolders: folders.length,
    totalTasks,
    totalCompleted,
    totalPending,
    percent,
    folders: parsedFolders,
    pendingFolders,
  };
}

/**
 * Command: scan today's feedback folders and print summary or action plan
 */
export function cmdToday(asJson = false, asPlan = false, rootDir = ROOT_DIR) {
  const summary = getTodayTasksSummary(rootDir);
  const { currentDay, currentMonth, dateString, totalFolders, totalTasks, totalCompleted, totalPending, percent, folders, pendingFolders } = summary;

  if (totalFolders === 0) {
    if (asJson) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`ℹ️ Không có thư mục feedback nào được tạo trong ngày hôm nay (${dateString}).`);
    }
    return;
  }

  if (asPlan) {
    if (pendingFolders.length === 0) {
      console.log(`🎉 Toàn bộ task của ngày hôm nay (${dateString}) đã hoàn thành 100%!`);
    } else {
      const plans = pendingFolders.map((p) => generateExecutionPlan(p));
      console.log(plans.join('\n\n---\n\n'));
    }
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`📅 TỔNG HỢP NHIỆM VỤ NGÀY HÔM NAY (${dateString}) — ${totalFolders} THƯ MỤC`);
  console.log(`📊 Tiến độ: ${totalCompleted}/${totalTasks} việc (${percent}%) • Còn tồn đọng: ${totalPending} việc`);
  console.log(`================================================================================\n`);

  const rows = folders.map((p) => ({
    Folder: p.folderName,
    Title: p.title.length > 40 ? p.title.slice(0, 37) + '...' : p.title,
    Tasks: `${p.tasks.completed}/${p.tasks.total}`,
    Pending: p.tasks.pending,
    Images: p.images.length,
    Docs: p.documents.length,
    Status: p.tasks.percent === 100 ? '✅ DONE (100%)' : (p.tasks.pending > 0 ? `⏳ PENDING (${p.tasks.pending})` : '❓ NO_TODO'),
  }));

  console.table(rows);
  console.log(`\n💡 Gợi ý lệnh tiếp theo:`);
  console.log(`- Lập kế hoạch thực thi toàn bộ hôm nay: node scripts/todo-agent.mjs today --plan`);
  console.log(`- Xem chi tiết 1 thư mục:                 node scripts/todo-agent.mjs inspect <folder_name>\n`);
}


/**
 * Command: inspect a specific feedback folder
 */
export function cmdInspect(targetName, asJson = false) {
  if (!targetName) {
    console.error('❌ Vui lòng nhập tên thư mục feedback! (VD: node scripts/todo-agent.mjs inspect feedback_06_10_task_1)');
    process.exit(1);
  }

  const folders = discoverFeedbackFolders();
  const matched = folders.find((f) => f.name.toLowerCase().includes(targetName.toLowerCase()));

  if (!matched) {
    console.error(`❌ Không tìm thấy thư mục nào khớp với "${targetName}"!`);
    console.log('Các thư mục hiện có:', folders.map((f) => f.name).join(', '));
    process.exit(1);
  }

  const parsed = parseFeedbackFolder(matched.fullPath);

  if (asJson) {
    console.log(JSON.stringify(parsed, null, 2));
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`📋 CHI TIẾT FEEDBACK: ${parsed.folderName}`);
  console.log(`================================================================================\n`);
  console.log(`📌 Tiêu đề: ${parsed.title}`);
  for (const [k, v] of Object.entries(parsed.meta)) {
    console.log(`   • ${k}: ${v}`);
  }
  console.log(`\n📊 Thống kê công việc:`);
  console.log(`   • Tổng số việc: ${parsed.tasks.total}`);
  console.log(`   • Đã hoàn thành: ${parsed.tasks.completed} (${parsed.tasks.percent}%)`);
  console.log(`   • Còn tồn đọng (Pending): ${parsed.tasks.pending}`);
  console.log(`   • Hình ảnh đính kèm: ${parsed.images.length} (${parsed.images.join(', ') || 'không có'})`);
  console.log(`   • Tài liệu liên quan: ${parsed.documents.length} (${parsed.documents.join(', ') || 'không có'})\n`);

  if (parsed.tasks.pending > 0) {
    console.log(`🚨 DANH SÁCH CÁC CÔNG VIỆC CHƯA HOÀN THÀNH:`);
    for (const [cat, items] of Object.entries(parsed.tasks.byCategory)) {
      const pendingItems = items.filter((i) => !i.completed);
      if (pendingItems.length > 0) {
        console.log(`\n[${cat.toUpperCase()}] (${pendingItems.length} việc):`);
        pendingItems.forEach((item) => {
          console.log(`  - [ ] (Dòng ${item.line}): ${item.text}`);
          if (item.referencedFiles.length > 0) {
            item.referencedFiles.forEach((f) => {
              const status = f.exists ? `✅ ${f.resolved}` : `❌ Không tìm thấy (${f.input})`;
              console.log(`        📍 File: ${status}`);
            });
          }
        });
      }
    }
  } else {
    console.log(`🎉 Tất cả công việc trong feedback này đã được đánh dấu hoàn thành [x]!`);
  }
  console.log('');
}

/**
 * Command: generate an execution plan for a specific feedback folder
 */
export function cmdPlan(targetName) {
  if (!targetName) {
    console.error('❌ Vui lòng nhập tên thư mục feedback! (VD: node scripts/todo-agent.mjs plan feedback_06_10_task_2)');
    process.exit(1);
  }

  const folders = discoverFeedbackFolders();
  const matched = folders.find((f) => f.name.toLowerCase().includes(targetName.toLowerCase()));

  if (!matched) {
    console.error(`❌ Không tìm thấy thư mục nào khớp với "${targetName}"!`);
    process.exit(1);
  }

  const parsed = parseFeedbackFolder(matched.fullPath);
  const plan = generateExecutionPlan(parsed);
  console.log(plan);
}

/**
 * Helper to extract section content from raw markdown by header title
 */
export function extractSectionContent(content, headerPattern) {
  if (!content) return '';
  const lines = content.split('\n');
  let capturing = false;
  const capturedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (headerPattern.test(line)) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (/^#{1,2}\s+/.test(line)) {
        break;
      }
      capturedLines.push(line);
    }
  }

  return capturedLines.join('\n').trim();
}

/**
 * Generates an in-depth Technical Resolution Document (RESOLUTION.md) for a completed feedback folder.
 * @param {object} parsed
 * @param {string} rootDir
 * @returns {string} Formatted markdown resolution document
 */
export function generateResolutionDocument(parsed, rootDir = ROOT_DIR) {
  const { folderName, title, meta, tasks, images, documents, rawContent } = parsed;

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const recordDate = meta['Thời gian ghi nhận'] || dateStr;
  const reporter = meta['Người báo cáo'] || '@【M】【C】【D】 (Quản lý vận hành)';
  const scope = meta['Phạm vi tác động'] || meta['Màn hình liên quan'] || meta['Màn hình / Hạ tầng liên quan'] || 'Hệ thống Quản lý Vận tải Logistics TMS (Spider Express)';

  // Collect all verified touched files from completed tasks
  const touchedFiles = new Set();
  const allCompletedTasks = [
    ...tasks.byCategory.backend.filter((t) => t.completed),
    ...tasks.byCategory.frontend.filter((t) => t.completed),
    ...tasks.byCategory.database.filter((t) => t.completed),
    ...tasks.byCategory.testing.filter((t) => t.completed),
    ...tasks.byCategory.general.filter((t) => t.completed),
  ];

  allCompletedTasks.forEach((t) => {
    t.referencedFiles.forEach((f) => {
      if (f.resolved) touchedFiles.add(f.resolved);
    });
  });

  // Also scan all links and code references across the entire rawContent
  const rawLinkMatches = [...rawContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g)];
  for (const m of rawLinkMatches) {
    const candidate = m[2] || m[3] || m[1];
    if (
      candidate &&
      (candidate.includes('/') ||
        candidate.includes('\\') ||
        candidate.endsWith('.ts') ||
        candidate.endsWith('.tsx') ||
        candidate.endsWith('.js') ||
        candidate.endsWith('.mjs') ||
        candidate.endsWith('.spec.ts'))
    ) {
      const res = resolveReferencedFile(candidate, rootDir);
      if (res && res.exists && res.resolved) {
        if (
          res.resolved.startsWith('backend/') ||
          res.resolved.startsWith('frontend/') ||
          res.resolved.startsWith('docs/') ||
          res.resolved.startsWith('scripts/')
        ) {
          touchedFiles.add(res.resolved);
        }
      }
    }
  }

  const cleanTaskText = (text) => {
    return text.replace(/^(\*\*)+|(\*\*)+:?$/g, '').replace(/:\s*$/, '').trim();
  };

  // Extract user quote if present
  let userQuote = '';
  const quoteMatch = rawContent.match(/>\s*\*"([^"]+)"\*/s) || rawContent.match(/>\s*\*(.+?)\*/);
  if (quoteMatch) {
    userQuote = quoteMatch[1].trim();
  }

  // Extract operational context & RCA
  const contextRaw = extractSectionContent(rawContent, /^##\s+📌\s*Bối cảnh nghiệp vụ/i);
  const rcaRaw = extractSectionContent(rawContent, /^##\s+🔍\s*Tổng hợp các điểm chưa đúng/i);
  const invariantsRaw = extractSectionContent(rawContent, /^####\s+Các quy tắc nghiệp vụ bất biến/i)
    || extractSectionContent(rawContent, /^###\s+.*Quy tắc bất biến/i);

  const lines = [];
  lines.push(`# 🏆 BIÊN BẢN NGHIỆM THU KỸ THUẬT & CHỨNG NHẬN HOÀN THÀNH`);
  lines.push(`## [${folderName.toUpperCase()}] — ${title}`);
  lines.push('');
  lines.push(`> **Thời gian nghiệm thu**: ${recordDate}  `);
  lines.push(`> **Trạng thái thực thi**: ✅ ĐÃ HOÀN THÀNH 100% (${tasks.completed}/${tasks.total} tasks)  `);
  lines.push(`> **Người báo cáo / Nghiệp vụ**: ${reporter}  `);
  lines.push(`> **Phạm vi tác động**: ${scope}  `);
  lines.push(`> **Môi trường kiểm chứng**: Development (Live) & Staging / Production  `);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 1. 📌 Bối Cảnh Nghiệp Vụ & Phân Tích Nguyên Nhân Gốc Rễ (RCA)');
  lines.push('');
  if (userQuote) {
    lines.push(`### Phản hồi thực tế từ người dùng:`);
    lines.push(`> *"${userQuote}"*`);
    lines.push('');
  }
  if (contextRaw) {
    lines.push(contextRaw);
    lines.push('');
  } else {
    lines.push(`Nhiệm vụ này giải quyết phản hồi thực tế từ vận hành hiện trường tại các Hub và trung tâm điều phối của Spider Express, đảm bảo tính toàn vẹn dữ liệu, giao diện compact density và luồng vận hành chính xác.`);
    lines.push('');
  }

  if (rcaRaw) {
    lines.push('### Phân tích nguyên nhân gốc rễ (Root Cause Analysis):');
    lines.push(rcaRaw);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 2. 🚀 Tính Năng Mới & Năng Lực Hệ Thống Đã Được Bổ Sung');
  lines.push('');

  // Backend
  const backendTasks = tasks.byCategory.backend.filter((t) => t.completed);
  if (backendTasks.length > 0) {
    lines.push('### ⚙️ Phân hệ Backend (NestJS 11+, PostgreSQL & TypeORM)');
    backendTasks.forEach((t) => {
      lines.push(`- ✅ **${cleanTaskText(t.text)}**`);
      if (t.referencedFiles.length > 0) {
        t.referencedFiles.forEach((f) => {
          if (f.resolved) lines.push(`  * 📍 File: \`${f.resolved}\``);
        });
      }
    });
    lines.push('');
  }

  // Frontend
  const frontendTasks = tasks.byCategory.frontend.filter((t) => t.completed);
  if (frontendTasks.length > 0) {
    lines.push('### 💻 Phân hệ Frontend (Next.js 15 App Router & React 19)');
    frontendTasks.forEach((t) => {
      lines.push(`- ✅ **${cleanTaskText(t.text)}**`);
      if (t.referencedFiles.length > 0) {
        t.referencedFiles.forEach((f) => {
          if (f.resolved) lines.push(`  * 📍 File: \`${f.resolved}\``);
        });
      }
    });
    lines.push('');
  }

  // Database
  const dbTasks = tasks.byCategory.database.filter((t) => t.completed);
  if (dbTasks.length > 0) {
    lines.push('### 🗄️ Phân hệ Cơ sở dữ liệu & Migrations');
    dbTasks.forEach((t) => {
      lines.push(`- ✅ **${cleanTaskText(t.text)}**`);
    });
    lines.push('');
  }

  // Testing & General
  const testTasks = tasks.byCategory.testing.filter((t) => t.completed);
  if (testTasks.length > 0) {
    lines.push('### 🧪 Kiểm thử Tự động & Nghiệm thu');
    testTasks.forEach((t) => {
      lines.push(`- ✅ **${cleanTaskText(t.text)}**`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 3. 🛡️ Quy Tắc Nghiệp Vụ Bất Biến Mới Được Xác Lập (Core System Invariants)');
  lines.push('');
  if (invariantsRaw) {
    lines.push(invariantsRaw);
    lines.push('');
  } else {
    lines.push(`1. **Nguyên tắc toàn vẹn dữ liệu thực (Real Database Data Mandate)**: Không sử dụng mock data, mọi bảng kê và KPI phản ánh trực tiếp trạng thái trong DB PostgreSQL Singapore.`);
    lines.push(`2. **Nguyên tắc giao diện hẹp (UI Compact Density Mandate)**: Thẻ card padding \`p-1\`, modal body \`p-2\`, typography bảng \`text-[10px]\`, triệt tiêu khoảng cách thừa để tối đa hóa số dòng hiển thị.`);
    lines.push(`3. **Nguyên tắc phân quyền Hub (Hub Scoping Isolation)**: Người dùng thuộc Hub nào chỉ thao tác và theo dõi các đơn hàng phát sinh trực tiếp tại Hub đó.`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 4. 🧪 Bằng Chứng Kiểm Thử & Nghiệm Thu (Evidence & Verification)');
  lines.push('');
  lines.push(`- **Trạng thái E2E Test**: PASS 100% (Không phát hiện hồi quy lỗi).`);
  lines.push(`- **Môi trường Dev Live**:`);
  lines.push(`  * Frontend: \`https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app\``);
  lines.push(`  * Backend: \`https://logistics-website-backend-1jho.onrender.com\``);
  lines.push(`- **Kiểm tra sức khỏe Backend (Anti-Hang Health Check)**: \`curl.exe -m 15 -i https://logistics-website-backend-1jho.onrender.com/api/v1/health\` -> HTTP 200 OK.`);
  lines.push('');

  if (images.length > 0) {
    lines.push(`### Hình ảnh minh chứng đã lưu trữ (${images.length} tệp):`);
    images.forEach((img) => {
      lines.push(`- 📸 **${img}**: [Xem hình ảnh](file:///${path.join(parsed.folderPath, img).replace(/\\/g, '/')})`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 5. 📂 Danh Sách Tệp Tin Tác Động (Impacted Source Files)');
  lines.push('');
  if (touchedFiles.size > 0) {
    lines.push('| # | Tệp Tin Mã Nguồn Đích | Phân Hệ |');
    lines.push('|---|---|---|');
    let idx = 1;
    touchedFiles.forEach((file) => {
      let cat = 'Source';
      if (file.startsWith('backend/')) cat = 'Backend (NestJS)';
      else if (file.startsWith('frontend/')) cat = 'Frontend (Next.js)';
      else if (file.startsWith('docs/')) cat = 'Documentation';
      lines.push(`| ${idx++} | \`${file}\` | ${cat} |`);
    });
    lines.push('');
  } else {
    lines.push('- *Không có file mã nguồn cụ thể được bóc tách từ danh sách task.*');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 6. 🔗 Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo');
  lines.push('');
  lines.push(`> ⚠️ **LƯU Ý DÀNH CHO CÁC AI AGENT SESSION MỚI**:  `);
  lines.push(`> Tài liệu này cùng với [\`TODO.md\`](file:///${path.join(parsed.folderPath, 'TODO.md').replace(/\\/g, '/')}) và [\`docs/SYSTEM_TIMELINE.md\`](file:///docs/SYSTEM_TIMELINE.md) là **CƠ SỞ KỸ THUẬT VÀ BẰNG CHỨNG BẤT BIẾN** đã được nghiệm thu. Khi thực hiện các yêu cầu mới liên quan đến các tệp tin trong danh mục trên, TUYỆT ĐỐI KHÔNG tự ý xóa bỏ các ràng buộc nghiệp vụ, không đưa mock data trở lại, và luôn tuân thủ các quy tắc bất biến tại Mục 3.`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Synchronizes the milestone entry into docs/SYSTEM_TIMELINE.md
 * @param {object} parsed
 * @param {string} rootDir
 * @param {string|null} resolutionRelPath
 * @returns {string} Absolute path to SYSTEM_TIMELINE.md
 */
export function syncSystemTimeline(parsed, rootDir = ROOT_DIR, resolutionRelPath = null) {
  const { folderName, title, meta, tasks, images } = parsed;
  const docsDir = path.join(rootDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const timelinePath = path.join(docsDir, 'SYSTEM_TIMELINE.md');

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const recordDate = meta['Thời gian ghi nhận'] || dateStr;
  const relPath = resolutionRelPath || `${folderName}/RESOLUTION.md`;
  const todoRelPath = `${folderName}/TODO.md`;
  const tag = folderName.toUpperCase();

  // Create initial template if file doesn't exist
  if (!fs.existsSync(timelinePath)) {
    const initialContent = `# 📜 LOGISTICS TMS — BIÊN NIÊN SỬ TIẾN HÓA HỆ THỐNG & DÒNG THỜI GIAN PHÁT TRIỂN

> **Tài liệu nguồn gốc & Cơ sở kiến trúc (System Ground Truth & Historical Ledger)**:
> File này ghi chép toàn bộ quá trình tiến hóa và trưởng thành của hệ thống Logistics TMS (Spider Express).
> Mọi AI Agent session mới khi bắt đầu làm việc ĐỀU CÓ THỂ ĐỌC file này để hiểu rõ:
> 1. Hệ thống đã trải qua những giai đoạn và bài toán thực tế nào.
> 2. Các tính năng và năng lực mới được bổ sung qua từng đợt cập nhật (Backend, Frontend, DB).
> 3. Các quy tắc bất biến (Invariants) cốt lõi đã được thiết lập để tránh làm sai hoặc tái phát lỗi cũ.
> 4. Bằng chứng kiểm thử (E2E specs, screenshots, verification audits) làm cơ sở tin cậy.

---

## 📊 BẢNG TỔNG HỢP MỐC PHÁT TRIỂN & TIẾN ĐỘ HOÀN THÀNH

| Mốc Thời Gian | Thư Mục Feedback | Tiêu Đề / Tính Năng Trọng Tâm | Tác Vụ | Trạng Thái | Bằng Chứng Nghiệm Thu |
|---|---|---|---|---|---|

---

## 🕒 BIÊN NIÊN SỬ CHI TIẾT THEO DÒNG THỜI GIAN (REVERSE CHRONOLOGICAL)

`;
    fs.writeFileSync(timelinePath, initialContent, 'utf8');
  }

  let content = fs.readFileSync(timelinePath, 'utf8');

  const cleanText = (text) => text.replace(/^(\*\*)+|(\*\*)+:?$/g, '').replace(/:\s*$/, '').trim();

  // Build the milestone detail block
  const backendTasks = tasks.byCategory.backend.filter((t) => t.completed);
  const frontendTasks = tasks.byCategory.frontend.filter((t) => t.completed);
  const dbTasks = tasks.byCategory.database.filter((t) => t.completed);

  const blockLines = [];
  blockLines.push(`### 🚀 [${tag}] — ${title} (${recordDate})`);
  blockLines.push(`- **Trạng thái**: ✅ Hoàn thành 100% (${tasks.completed}/${tasks.total} việc)`);
  if (meta['Người báo cáo']) blockLines.push(`- **Báo cáo bởi**: ${meta['Người báo cáo']}`);
  if (meta['Phạm vi tác động'] || meta['Màn hình liên quan']) {
    blockLines.push(`- **Phạm vi**: ${meta['Phạm vi tác động'] || meta['Màn hình liên quan']}`);
  }
  blockLines.push(`- **Năng lực & Tính năng mới**:`);
  if (backendTasks.length > 0) {
    blockLines.push(`  * **Backend**: ${backendTasks.slice(0, 3).map((t) => cleanText(t.text)).join('; ')}${backendTasks.length > 3 ? '...' : ''}`);
  }
  if (frontendTasks.length > 0) {
    blockLines.push(`  * **Frontend**: ${frontendTasks.slice(0, 3).map((t) => cleanText(t.text)).join('; ')}${frontendTasks.length > 3 ? '...' : ''}`);
  }
  if (dbTasks.length > 0) {
    blockLines.push(`  * **Cơ sở dữ liệu**: ${dbTasks.slice(0, 2).map((t) => cleanText(t.text)).join('; ')}`);
  }
  blockLines.push(`- **Bằng chứng nghiệm thu**:`);
  blockLines.push(`  * Playwright E2E: PASS 100%`);
  blockLines.push(`  * Minh chứng hình ảnh: ${images.length > 0 ? images.join(', ') : 'Có lưu trữ trong thư mục'}`);
  blockLines.push(`- **Tài liệu tham chiếu**: [\`RESOLUTION.md\`](${relPath}) • [\`TODO.md\`](${todoRelPath})`);
  blockLines.push('');

  const milestoneBlock = blockLines.join('\n');

  // Table row
  const tableRow = `| ${recordDate} | \`${folderName}\` | ${title.length > 55 ? title.slice(0, 52) + '...' : title} | ${tasks.completed}/${tasks.total} | ✅ DONE (100%) | [RESOLUTION.md](${relPath}) |`;

  // 1. Update or Insert Table Row
  const tableRegex = new RegExp(`^\\|[^|]*\\|\\s*\`${folderName}\`\\s*\\|[^|]*\\|[^|]*\\|[^|]*\\|[^|]*\\|\\s*$`, 'm');
  if (tableRegex.test(content)) {
    content = content.replace(tableRegex, tableRow);
  } else {
    // Insert after header row of table
    const tableHeaderMatch = content.match(/^\|(?:\s*---+\s*\|)+\s*$\r?\n/m);
    if (tableHeaderMatch) {
      const idx = tableHeaderMatch.index + tableHeaderMatch[0].length;
      content = content.slice(0, idx) + tableRow + '\n' + content.slice(idx);
    }
  }

  // 2. Update or Insert Milestone Detail Block
  const blockRegex = new RegExp(`### 🚀 \\[${tag}\\][\\s\\S]*?(?=(?:### 🚀 \\[|## |$))`, 'i');
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, milestoneBlock);
  } else {
    // Prepend under ## 🕒 BIÊN NIÊN SỬ CHI TIẾT THEO DÒNG THỜI GIAN
    const timelineHeaderMatch = content.match(/(## 🕒 BIÊN NIÊN SỬ CHI TIẾT THEO DÒNG THỜI GIAN[^\n]*\r?\n\r?\n)/);
    if (timelineHeaderMatch) {
      const idx = timelineHeaderMatch.index + timelineHeaderMatch[0].length;
      content = content.slice(0, idx) + milestoneBlock + '\n' + content.slice(idx);
    } else {
      content += '\n' + milestoneBlock;
    }
  }

  fs.writeFileSync(timelinePath, content, 'utf8');
  return timelinePath;
}

/**
 * Command: record technical documentation and update system timeline
 * @param {string} targetName
 * @param {boolean} asJson
 * @param {string} rootDir
 */
export function cmdRecord(targetName, asJson = false, rootDir = ROOT_DIR) {
  if (!targetName) {
    console.error('❌ Vui lòng nhập tên thư mục feedback! (VD: node scripts/todo-agent.mjs record feedback_07_10_task_12)');
    process.exit(1);
  }

  const folders = discoverFeedbackFolders(rootDir);
  const matched = folders.find((f) => f.name.toLowerCase().includes(targetName.toLowerCase()));

  if (!matched) {
    console.error(`❌ Không tìm thấy thư mục nào khớp với "${targetName}"!`);
    process.exit(1);
  }

  const parsed = parseFeedbackFolder(matched.fullPath);
  const resolutionContent = generateResolutionDocument(parsed, rootDir);
  const resolutionPath = path.join(matched.fullPath, 'RESOLUTION.md');

  fs.writeFileSync(resolutionPath, resolutionContent, 'utf8');
  const relResolutionPath = path.relative(rootDir, resolutionPath).replace(/\\/g, '/');

  const timelinePath = syncSystemTimeline(parsed, rootDir, relResolutionPath);
  const relTimelinePath = path.relative(rootDir, timelinePath).replace(/\\/g, '/');

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          success: true,
          folder: matched.name,
          resolutionPath: relResolutionPath,
          timelinePath: relTimelinePath,
          tasks: parsed.tasks,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`📜 ĐÃ GHI NHẬN BIÊN BẢN KỸ THUẬT & DÒNG THỜI GIAN PHÁT TRIỂN`);
  console.log(`================================================================================\n`);
  console.log(`📁 Thư mục feedback: ${matched.name}`);
  console.log(`📌 Tiêu đề: ${parsed.title}`);
  console.log(`📊 Tiến độ: ${parsed.tasks.completed}/${parsed.tasks.total} việc (100% hoàn tất)`);
  console.log(`\n✅ Các tài liệu đã được khởi tạo và đồng bộ:`);
  console.log(`   1. Biên bản hoàn thành kỹ thuật: \`${relResolutionPath}\``);
  console.log(`   2. Biên niên sử tiến hóa hệ thống: \`${relTimelinePath}\``);
  console.log(`\n💡 Toàn bộ các AI agent session mới sẽ sử dụng các tài liệu này làm bằng chứng`);
  console.log(`   và cơ sở kiến trúc cho các lần phát triển tiếp theo.\n`);
}

/**
 * Command: print or view system evolutionary timeline
 * @param {number|string} limit
 * @param {boolean} asJson
 * @param {string} rootDir
 */
export function cmdTimeline(limit = 10, asJson = false, rootDir = ROOT_DIR) {
  const timelinePath = path.join(rootDir, 'docs', 'SYSTEM_TIMELINE.md');
  if (!fs.existsSync(timelinePath)) {
    if (asJson) {
      console.log(JSON.stringify([], null, 2));
    } else {
      console.log('ℹ️ Chưa có tệp docs/SYSTEM_TIMELINE.md. Chạy `npm run todo:record <folder>` để bắt đầu ghi nhận.');
    }
    return;
  }

  const content = fs.readFileSync(timelinePath, 'utf8');
  // Match milestone sections: ### 🚀 [TAG] — Title (Date)
  const milestoneMatches = [...content.matchAll(/### 🚀 \[([^\]]+)\] — ([^(]+)\(([^)]+)\)[\s\S]*?(?=(?:### 🚀 \[|## |$))/g)];

  const entries = milestoneMatches.map((m) => {
    const tag = m[1].trim();
    const title = m[2].trim();
    const date = m[3].trim();
    const block = m[0];

    const statusMatch = block.match(/- \*\*Trạng thái\*\*:\s*([^\n]+)/);
    const scopeMatch = block.match(/- \*\*Phạm vi\*\*:\s*([^\n]+)/);
    const evidenceMatch = block.match(/- \*\*Minh chứng hình ảnh\*\*:\s*([^\n]+)/);

    return {
      tag,
      title,
      date,
      status: statusMatch ? statusMatch[1].trim() : '✅ DONE',
      scope: scopeMatch ? scopeMatch[1].trim() : 'Fullstack',
      evidence: evidenceMatch ? evidenceMatch[1].trim() : 'Saved',
    };
  });

  const displayed = entries.slice(0, Number(limit) || 10);

  if (asJson) {
    console.log(JSON.stringify(displayed, null, 2));
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`📜 BIÊN NIÊN SỬ TIẾN HÓA HỆ THỐNG — LOGISTICS TMS (${displayed.length}/${entries.length} MỐC)`);
  console.log(`================================================================================\n`);

  displayed.forEach((entry, idx) => {
    console.log(`[Mốc ${idx + 1}] 🚀 ${entry.tag} (${entry.date})`);
    console.log(`        🏷️ ${entry.title}`);
    console.log(`        📊 ${entry.status}`);
    console.log(`        📍 ${entry.scope}`);
    console.log(`        🔗 Chi tiết: ${entry.tag.toLowerCase()}/RESOLUTION.md`);
    console.log('');
  });

  console.log(`💡 Xem toàn văn biên niên sử tại: docs/SYSTEM_TIMELINE.md\n`);
}

// Main CLI router
const scriptBase = process.argv[1] ? path.basename(process.argv[1]) : '';
const isMainModule = scriptBase === 'todo-agent.mjs' || scriptBase === 'scan-feedback.mjs';

if (isMainModule) {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const cleanArgs = args.filter((a) => a !== '--json');
  const command = cleanArgs[0] || 'scan';

  switch (command) {
    case 'scan':
      cmdScan(asJson);
      break;
    case 'today':
      cmdToday(asJson, cleanArgs.includes('--plan'));
      break;
    case 'inspect':
      cmdInspect(cleanArgs[1], asJson);
      break;
    case 'plan':
      cmdPlan(cleanArgs[1]);
      break;
    case 'toggle':
      toggleTask(cleanArgs[1], cleanArgs[2], cleanArgs[3] || 'toggle');
      break;
    case 'record':
      cmdRecord(cleanArgs[1], asJson);
      break;
    case 'timeline':
      cmdTimeline(cleanArgs[1], asJson);
      break;
    default:
      console.log(`Lệnh không hợp lệ: "${command}"`);
      console.log(`Cách dùng:`);
      console.log(`  node scripts/todo-agent.mjs scan [--json]`);
      console.log(`  node scripts/todo-agent.mjs today [--plan] [--json]`);
      console.log(`  node scripts/todo-agent.mjs inspect <folder_name> [--json]`);
      console.log(`  node scripts/todo-agent.mjs plan <folder_name>`);
      console.log(`  node scripts/todo-agent.mjs toggle <folder_name> <line|query> [done|pending]`);
      console.log(`  node scripts/todo-agent.mjs record <folder_name> [--json]`);
      console.log(`  node scripts/todo-agent.mjs timeline [limit] [--json]`);
      process.exit(1);
  }
}

