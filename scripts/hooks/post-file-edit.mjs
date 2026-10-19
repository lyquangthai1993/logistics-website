#!/usr/bin/env node
/**
 * scripts/hooks/post-file-edit.mjs
 * 
 * Antigravity PostToolUse Hook: Tự động Format và Lint code sau mỗi lần Agent chỉnh sửa/ghi file.
 * Hỗ trợ các công cụ: write_to_file, replace_file_content, multi_replace_file_content.
 * Tuân thủ RULE-ANTI-HANG-EXEC-01.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// Hard timeout 12s tự hủy phòng ngừa treo tiến trình (RULE-ANTI-HANG-EXEC-01)
const hardTimeout = setTimeout(() => {
  console.log(JSON.stringify({}));
  process.exit(0);
}, 12000);
hardTimeout.unref();

function safeExec(cmd, cwd) {
  try {
    execSync(cmd, { cwd, timeout: 6000, stdio: 'ignore' });
  } catch {
    // Không ném lỗi làm crash hook
  }
}

function extractTargetFile(payload) {
  // 1. Thử lấy từ args trực tiếp của toolCall trong payload
  const directArg = payload?.toolCall?.args?.TargetFile || payload?.toolCall?.args?.filePath;
  if (directArg) return directArg;

  // 2. Thử đọc từ transcriptPath nếu có
  const transcriptPath = payload?.transcriptPath;
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      const lines = content.trim().split('\n');
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
        const line = lines[i];
        if (!line.includes('TargetFile')) continue;
        const entry = JSON.parse(line);
        const calls = entry?.tool_calls || [];
        for (const call of calls) {
          if (call?.args?.TargetFile) {
            return call.args.TargetFile;
          }
        }
      }
    } catch {
      // Bỏ qua lỗi đọc transcript
    }
  }

  return null;
}

let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  clearTimeout(hardTimeout);

  try {
    if (!inputData.trim()) {
      console.log(JSON.stringify({}));
      process.exit(0);
    }

    const payload = JSON.parse(inputData);
    const targetFile = extractTargetFile(payload);

    if (!targetFile || !fs.existsSync(targetFile)) {
      console.log(JSON.stringify({}));
      process.exit(0);
    }

    const resolvedFile = path.resolve(targetFile);
    const ext = path.extname(resolvedFile).toLowerCase();

    // 1. Xử lý file Frontend (.ts, .tsx, .js, .jsx, .json, .css)
    if (resolvedFile.startsWith(FRONTEND_DIR)) {
      const relPath = path.relative(FRONTEND_DIR, resolvedFile).replace(/\\/g, '/');

      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.css'].includes(ext)) {
        // Chạy oxfmt để format siêu tốc
        safeExec(`npx oxfmt --write "${relPath}"`, FRONTEND_DIR);
        // Chạy oxlint để kiểm tra và sửa lỗi lint
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          safeExec(`npx oxlint --fix "${relPath}"`, FRONTEND_DIR);
        }
      }
    }
    // 2. Xử lý file Backend (.ts, .js, .json)
    else if (resolvedFile.startsWith(BACKEND_DIR)) {
      const relPath = path.relative(BACKEND_DIR, resolvedFile).replace(/\\/g, '/');

      if (['.ts', '.js', '.json'].includes(ext)) {
        // Chạy Prettier
        safeExec(`npx prettier --write "${relPath}"`, BACKEND_DIR);
        // Chạy ESLint nếu là source TypeScript
        if (ext === '.ts') {
          safeExec(`npx eslint --fix "${relPath}"`, BACKEND_DIR);
        }
      }
    }
    // 3. Xử lý file Root hoặc Scripts
    else if (resolvedFile.startsWith(ROOT_DIR)) {
      const relPath = path.relative(ROOT_DIR, resolvedFile).replace(/\\/g, '/');
      if (['.ts', '.js', '.mjs', '.json'].includes(ext)) {
        safeExec(`npx prettier --write "${relPath}"`, ROOT_DIR);
      }
    }

    // Luôn trả về {} hợp lệ cho PostToolUse
    console.log(JSON.stringify({}));
    process.exit(0);
  } catch (err) {
    console.error('Error in post-file-edit hook:', err?.message || err);
    console.log(JSON.stringify({}));
    process.exit(0);
  }
});
