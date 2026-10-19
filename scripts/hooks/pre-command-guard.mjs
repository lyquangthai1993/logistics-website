#!/usr/bin/env node
/**
 * scripts/hooks/pre-command-guard.mjs
 *
 * Antigravity PreToolUse Hook:
 * 1. Chặn các lệnh rủi ro cao (git push --no-verify, force push, hard reset, DROP/TRUNCATE DB).
 * 2. Tự động gắn Hard Timeout 5 phút (300s) chống treo cho tất cả lệnh terminal không phải daemon.
 *
 * Tuân thủ RULE-ANTI-HANG-EXEC-01 và AGENTS.md.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIMEOUT_RUNNER_PATH = path
  .resolve(__dirname, "timeout-runner.mjs")
  .replace(/\\/g, "/");

// Hard timeout tự hủy chống treo process (RULE-ANTI-HANG-EXEC-01)
const hardTimeout = setTimeout(() => {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}, 8000);
hardTimeout.unref();

// Danh sách các mẫu lệnh rủi ro cao bị cấm hoặc cần ngăn chặn
const RISKY_PATTERNS = [
  {
    regex: /git\s+push\b.*--no-verify\b/i,
    name: "git push --no-verify",
    description: "Bỏ qua kiểm tra an toàn pre-push/lint/test bằng --no-verify",
  },
  {
    regex: /git\s+push\b.*(\s+-f\b|\s+--force\b|\s+\+[a-zA-Z0-9_\-\/]+)/i,
    name: "git push --force",
    description: "Force push ghi đè lịch sử Git trên remote repo",
  },
  {
    regex: /git\s+reset\b.*--hard\b/i,
    name: "git reset --hard",
    description: "Xóa sạch các thay đổi chưa commit mà không thể khôi phục",
  },
  {
    regex: /git\s+clean\b.*-[a-zA-Z]*f/i,
    name: "git clean -f",
    description: "Xóa vĩnh viễn các file chưa theo dõi (untracked files)",
  },
  {
    regex: /git\s+checkout\b\s+--\s+\./i,
    name: "git checkout -- .",
    description: "Hủy toàn bộ thay đổi trong working directory",
  },
  {
    regex: /git\s+restore\b\s+\./i,
    name: "git restore .",
    description: "Khôi phục hàng loạt toàn bộ file làm mất code hiện tại",
  },
  {
    regex: /git\s+branch\b.*-D\b/i,
    name: "git branch -D",
    description: "Xóa nhánh cưỡng bức khi chưa kiểm tra trạng thái merge",
  },
  {
    regex: /\b(DROP\s+DATABASE|DROP\s+TABLE)\b/i,
    name: "DROP DATABASE / DROP TABLE",
    description:
      "Phá hủy cấu trúc cơ sở dữ liệu (Vi phạm nghiêm trọng AGENTS.md)",
  },
  {
    regex: /\bTRUNCATE\s+(TABLE\s+)?[a-zA-Z0-9_]+/i,
    name: "TRUNCATE TABLE",
    description: "Xóa sạch toàn bộ dữ liệu bảng cơ sở dữ liệu",
  },
];

// Danh sách các lệnh nền / daemon không áp dụng timeout 5 phút (được phép chạy liên tục)
const DAEMON_PATTERNS = [
  /\b(npm|bun|pnpm)\s+run\s+(dev|start|backend|frontend|telegram:bot|telegram:worker)/i,
  /\bnext\s+(dev|start)\b/i,
  /\bnest\s+(start|start:dev)\b/i,
  /\bnode\s+.*start-dev\.js\b/i,
  /\b(bot\.mjs|neon-worker\.mjs)\b/i,
  /timeout-runner\.mjs/i, // Tránh wrap đệ quy 2 lần
];

let inputData = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  clearTimeout(hardTimeout);

  try {
    if (!inputData.trim()) {
      console.log(JSON.stringify({ decision: "allow" }));
      process.exit(0);
    }

    const payload = JSON.parse(inputData);
    const commandLine = payload?.toolCall?.args?.CommandLine || "";
    const isDaemonArg = payload?.toolCall?.args?.IsDaemon === true;

    if (!commandLine) {
      console.log(JSON.stringify({ decision: "allow" }));
      process.exit(0);
    }

    // 1. Kiểm tra các mẫu lệnh rủi ro cao
    for (const rule of RISKY_PATTERNS) {
      if (rule.regex.test(commandLine)) {
        const result = {
          decision: "deny",
          reason: `🛡️ [ANTIGRAVITY HOOK BLOCKED] Lệnh bị chặn: '${rule.name}'. Lí do: ${rule.description} (Quy định tại AGENTS.md).`,
        };
        console.log(JSON.stringify(result));
        process.exit(0);
      }
    }

    // 2. Kiểm tra nếu là daemon (dev server, background worker) -> Cho phép chạy bình thường, không bọc timeout
    const isDaemonCommand =
      isDaemonArg || DAEMON_PATTERNS.some((p) => p.test(commandLine));
    if (isDaemonCommand) {
      console.log(JSON.stringify({ decision: "allow" }));
      process.exit(0);
    }

    // 3. Tự động bọc lệnh với Hard Timeout 5 phút (300 giây) chống treo
    const b64Cmd = Buffer.from(commandLine).toString("base64");
    const wrappedCommandLine = `node "${TIMEOUT_RUNNER_PATH}" --b64 ${b64Cmd} 300`;

    const result = {
      decision: "allow",
      overwrite: {
        CommandLine: wrappedCommandLine,
      },
    };

    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error("Error in pre-command-guard hook:", err?.message || err);
    console.log(JSON.stringify({ decision: "allow" }));
    process.exit(0);
  }
});
