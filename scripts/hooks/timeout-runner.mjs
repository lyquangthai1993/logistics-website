#!/usr/bin/env node
/**
 * scripts/hooks/timeout-runner.mjs
 *
 * Bộ thực thi lệnh với Hard Timeout tự động dừng tiến trình (Anti-Hang Execution).
 * Mặc định: 300 giây (5 phút) nếu không chỉ định.
 *
 * Hỗ trợ 2 chế độ:
 * 1. Chế độ Base64 (Bảo toàn 100% dấu ngoặc kép, ký tự đặc biệt, regex, pipe):
 *    node scripts/hooks/timeout-runner.mjs --b64 <base64_command> [timeout_seconds]
 * 2. Chế độ trực tiếp:
 *    node scripts/hooks/timeout-runner.mjs [timeout_seconds] <command...>
 */

import { spawn, execSync } from "node:child_process";

const isWindows = process.platform === "win32";
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "❌ Cách dùng: node timeout-runner.mjs [timeout_in_seconds] <command...>",
  );
  process.exit(1);
}

let timeoutSec = 300; // Mặc định 5 phút = 300s
let fullCommand = "";

if (args[0] === "--b64") {
  const b64Str = args[1] || "";
  timeoutSec = parseInt(args[2], 10) || 300;
  try {
    fullCommand = Buffer.from(b64Str, "base64").toString("utf8");
  } catch (err) {
    console.error("❌ Lỗi giải mã Base64 command:", err.message);
    process.exit(1);
  }
} else {
  let cmdArgsStartIndex = 0;
  if (!isNaN(parseInt(args[0], 10)) && args.length > 1) {
    timeoutSec = parseInt(args[0], 10);
    cmdArgsStartIndex = 1;
  }
  fullCommand = args.slice(cmdArgsStartIndex).join(" ");
}

if (!fullCommand.trim()) {
  console.error("❌ Không có lệnh nào được chỉ định để chạy.");
  process.exit(1);
}

const startTime = Date.now();
const child = isWindows
  ? spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", fullCommand],
      {
        stdio: "inherit",
        windowsHide: true,
      },
    )
  : spawn(fullCommand, {
      shell: true,
      stdio: "inherit",
      windowsHide: true,
    });

let timedOut = false;

const timer = setTimeout(() => {
  timedOut = true;
  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  console.error(
    `\n\n🚨 [TIMEOUT-RUNNER] ĐÃ VƯỢT QUÁ GIỚI HẠN THỜI GIAN (${elapsedSec}s >= ${timeoutSec}s)!`,
  );
  console.error(
    `🛑 Tự động dừng tiến trình và toàn bộ tiến trình con (PID: ${child.pid})...\n`,
  );

  try {
    if (isWindows) {
      execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: "ignore" });
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
  } catch (killErr) {
    try {
      child.kill("SIGKILL");
    } catch {}
  }

  process.exit(124); // Exit code 124: Chuẩn timeout GNU coreutils
}, timeoutSec * 1000);

timer.unref();

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (timedOut) return;
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  clearTimeout(timer);
  console.error(`❌ [TIMEOUT-RUNNER] Lỗi khởi chạy lệnh:`, err.message);
  process.exit(1);
});
