#!/usr/bin/env node
/**
 * scripts/hooks/pre-command-guard.mjs
 *
 * Antigravity PreToolUse Hook:
 * 1. Chặn các lệnh rủi ro cao (git push --no-verify, force push, hard reset, DROP/TRUNCATE DB).
 * 2. Chốt chặn Cưỡng chế Local-First (Tier-1 Gate): Chặn mọi lệnh git push submodule (backend/frontend),
 *    gh pr create, hoặc task:pr nếu máy chủ Local (port 4000 & 4001) chưa được bật!
 * 3. Chốt chặn Cưỡng chế Railway Build & Cutover (Tier-2 Gate): Chặn mọi lệnh chạy Playwright E2E
 *    nhắm vào Railway Cloud (`*.up.railway.app`) nếu bản deployment mới nhất trên Railway đang
 *    BUILDING / DEPLOYING / QUEUED, chưa khớp Commit SHA với nhánh git, chưa cutover sang active container,
 *    hoặc bị BUILD FAILED!
 * 4. Tự động gắn Hard Timeout 5 phút (300s) chống treo cho tất cả lệnh terminal không phải daemon.
 *
 * Tuân thủ RULE-ANTI-HANG-EXEC-01 và AGENTS.md.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkLocalServers } from "../ensure-local-servers.mjs";
import { checkRailwayDeploymentReady } from "../verify-railway-deployment.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIMEOUT_RUNNER_PATH = path
  .resolve(__dirname, "timeout-runner.mjs")
  .replace(/\\/g, "/");

// Hard timeout tự hủy chống treo process (RULE-ANTI-HANG-EXEC-01)
const hardTimeout = setTimeout(() => {
  console.log(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}, 8500);
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
  /\b(npm|bun|pnpm)\s+run\s+(dev|dev:ensure|dev:status|dev:stop|start|backend|frontend|telegram:bot|telegram:worker)/i,
  /\bnext\s+(dev|start)\b/i,
  /\bnest\s+(start|start:dev)\b/i,
  /\bnode\s+.*(start-dev\.js|ensure-local-servers\.mjs)\b/i,
  /\b(bot\.mjs|neon-worker\.mjs)\b/i,
  /timeout-runner\.mjs/i, // Tránh wrap đệ quy 2 lần
];

/**
 * Kiểm tra xem lệnh có phải là thao tác đẩy code submodule hoặc tạo PR lên GitHub hay không.
 * Nếu phải, bắt buộc Local Servers (port 4000 & 4001) phải đang bật (chứng minh đã bật Local để test Tầng 1).
 */
function requiresLocalServersGate(commandLine) {
  if (/--skip-local-gate\b/i.test(commandLine)) return false;
  // Cho phép đồng bộ dev -> master (chore sync)
  if (/git\s+push\s+origin\s+master\b/i.test(commandLine)) return false;

  // Chặn nếu tạo PR hoặc chạy workflow PR
  if (/\bgh\s+pr\s+(create|merge)\b/i.test(commandLine)) return true;
  if (/\bgit-task-workflow\.mjs\s+pr\b/i.test(commandLine)) return true;
  if (/\bnpm\s+run\s+task:pr\b/i.test(commandLine)) return true;

  // Chặn nếu git push trong submodule backend hoặc frontend
  if (/\bgit\s+-C\s+(backend|frontend)\s+push\b/i.test(commandLine)) return true;
  if (/\bcd\s+(backend|frontend)\b[\s\S]*?\bgit\s+push\b/i.test(commandLine)) return true;

  return false;
}

/**
 * Kiểm tra xem lệnh có phải là chạy Playwright E2E trên môi trường Railway Cloud (Tầng 2) hay không.
 * Trả về tên môi trường ('dev' hoặc 'production') nếu cần kiểm tra, hoặc null nếu không.
 */
function detectRailwayE2ETargetEnv(commandLine) {
  if (/--skip-railway-gate\b/i.test(commandLine)) return null;

  const isPlaywrightCmd =
    /\bplaywright\s+test\b/i.test(commandLine) ||
    /\bnpm\s+run\s+(test:)?e2e\b/i.test(commandLine);

  if (!isPlaywrightCmd) return null;

  if (/(frontend|backend)-tms-core-production\.up\.railway\.app/i.test(commandLine)) {
    return "production";
  }
  if (/(frontend|backend)-tms-core-dev\.up\.railway\.app/i.test(commandLine)) {
    return "dev";
  }

  return null;
}

let inputData = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", async () => {
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

    // 2. Chốt chặn Cưỡng chế Local-First (Tier-1 Gate):
    // Không cho phép push code submodule hoặc tạo PR nếu port 4000 & 4001 chưa bật!
    if (requiresLocalServersGate(commandLine)) {
      const localStatus = await checkLocalServers(2000);
      if (!localStatus.isRunning) {
        const result = {
          decision: "deny",
          reason:
            `🛡️ [LOCAL-FIRST GATE BLOCKED] Máy chủ Local chưa được khởi động ` +
            `(Backend port 4001: ${localStatus.beOk ? "UP" : "DOWN"}, Frontend port 4000: ${localStatus.feOk ? "UP" : "DOWN"})! ` +
            `Theo quy chuẩn Bắt buộc Test Local Trước (Tier-1 Quality Gate), bạn BẮT BUỘC phải:\n` +
            `1. Chạy 'npm run dev:ensure' (hoặc 'node scripts/ensure-local-servers.mjs') để bật cả port 4001 & 4000.\n` +
            `2. Chạy Playwright E2E test trên Local (http://localhost:4000 & http://localhost:4001/api/v1) đạt PASS 100%.\n` +
            `3. Sau khi Local PASS mới được phép git push hoặc tạo PR lên nhánh dev!`,
        };
        console.log(JSON.stringify(result));
        process.exit(0);
      }
    }

    // 3. Chốt chặn Cưỡng chế Railway Build & Cutover (Tier-2 Gate):
    // Không cho phép chạy Playwright E2E trên Railway nếu bản deployment mới chưa build xong (SUCCESS) hoặc chưa khớp Commit SHA!
    const railwayTargetEnv = detectRailwayE2ETargetEnv(commandLine);
    if (railwayTargetEnv) {
      const railwayCheck = await checkRailwayDeploymentReady({
        envName: railwayTargetEnv,
        timeoutMs: 5500,
      });

      if (!railwayCheck.cliError && railwayCheck.services.length > 0 && !railwayCheck.ready) {
        const detailsText = railwayCheck.services
          .map(
            (s) =>
              `- ${s.serviceName}: [${s.state}] build=${s.buildStatus}, git=${(s.latestCommit || "N/A").slice(0, 7)}/${(s.expectedCommit || "N/A").slice(0, 7)}, cutover=${s.isCutoverActive ? "YES" : "NO"} -> ${s.reason}`,
          )
          .join("\n");

        const result = {
          decision: "deny",
          reason:
            `🛡️ [RAILWAY TIER-2 BUILD GATE BLOCKED] Không thể chạy Playwright E2E trên Railway (${railwayTargetEnv.toUpperCase()}) vì bản deployment mới chưa hoàn tất build hoặc chưa cutover!\n` +
            `Chi tiết trạng thái hiện tại trên Railway:\n${detailsText}\n\n` +
            `Hành động bắt buộc:\n` +
            `1. Chạy 'npm run railway:wait' (hoặc 'node scripts/verify-railway-deployment.mjs --wait') để chờ bản build mới đạt trạng thái SUCCESS & cutover sang container mới.\n` +
            `2. Nếu trạng thái là BUILD_FAILED / CRASHED, kiểm tra log lỗi build và sửa code trước khi test lại.`,
        };
        console.log(JSON.stringify(result));
        process.exit(0);
      }
    }

    // 4. Kiểm tra nếu là daemon (dev server, background worker) -> Cho phép chạy bình thường, không bọc timeout
    const isDaemonCommand =
      isDaemonArg || DAEMON_PATTERNS.some((p) => p.test(commandLine));
    if (isDaemonCommand) {
      console.log(JSON.stringify({ decision: "allow" }));
      process.exit(0);
    }

    // 5. Tự động bọc lệnh với Hard Timeout 5 phút (300 giây) chống treo
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
