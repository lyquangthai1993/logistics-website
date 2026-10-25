#!/usr/bin/env node
/**
 * scripts/ensure-local-servers.mjs
 *
 * Bộ khởi động & cưỡng chế máy chủ Local Dev (Port 4000 Frontend & Port 4001 Backend).
 * Thiết kế tương thích 100% với RULE-ANTI-HANG-EXEC-01:
 * - Gọi trực tiếp node.exe (process.execPath) chạy @nestjs/cli/bin/nest.js và next/dist/bin/next
 *   ở chế độ Detached Background Process (detached: true, windowsHide: true, stdio: logFd, unref())
 *   để hoạt động ổn định 100% trên Windows và không giữ tiến trình làm treo run_command.
 * - Poll chờ cả 2 cổng 4000 & 4001 trả về HTTP < 500 (tối đa 90s) rồi thoát đồng bộ (exit 0).
 *
 * Cách dùng CLI:
 *   node scripts/ensure-local-servers.mjs          # Tự động kiểm tra & bật cả 4001 + 4000 nếu tắt
 *   node scripts/ensure-local-servers.mjs status   # Kiểm tra nhanh (exit 0 nếu cả 2 đang chạy, exit 1 nếu tắt)
 *   node scripts/ensure-local-servers.mjs stop     # Dừng các tiến trình trên port 4000 & 4001
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const LOGS_DIR = path.join(ROOT_DIR, ".logs");

const BACKEND_PORT = 4001;
const FRONTEND_PORT = 4000;

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

export function probeHttp(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get(
        {
          hostname: u.hostname,
          port: u.port,
          path: u.pathname,
          timeout: timeoutMs,
        },
        (res) => {
          res.resume();
          resolve({
            ok: res.statusCode >= 100 && res.statusCode < 500,
            statusCode: res.statusCode,
          });
        },
      );
      req.on("error", () => resolve({ ok: false, statusCode: 0 }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, statusCode: 0 });
      });
    } catch {
      resolve({ ok: false, statusCode: 0 });
    }
  });
}

async function probePort(port, paths = ["/"], timeoutMs = 2500) {
  const hosts = ["localhost", "127.0.0.1"];
  for (const p of paths) {
    for (const host of hosts) {
      const res = await probeHttp(`http://${host}:${port}${p}`, timeoutMs);
      if (res.ok) return res;
    }
  }
  return { ok: false, statusCode: 0 };
}

export async function checkLocalServers(timeoutMs = 2500) {
  const [feRes, beRes] = await Promise.all([
    probePort(FRONTEND_PORT, ["/"], timeoutMs),
    probePort(
      BACKEND_PORT,
      ["/api/v1/health", "/docs", "/api/v1"],
      timeoutMs,
    ).then(async (r) => {
      if (r.ok) return r;
      return probePort(3001, ["/api/v1/health", "/docs", "/api/v1"], timeoutMs);
    }),
  ]);

  return {
    isRunning: feRes.ok && beRes.ok,
    feOk: feRes.ok,
    beOk: beRes.ok,
    feStatus: feRes.statusCode,
    beStatus: beRes.statusCode,
  };
}

function spawnDetachedNodeServer(
  name,
  cwd,
  scriptArgs,
  logFileName,
  pidFileName,
) {
  ensureLogsDir();
  const logFile = path.join(LOGS_DIR, logFileName);
  const pidFile = path.join(LOGS_DIR, pidFileName);

  const logFd = fs.openSync(logFile, "a");

  const child = spawn(process.execPath, scriptArgs, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env },
  });

  if (child.pid) {
    fs.writeFileSync(pidFile, String(child.pid), "utf8");
  }

  child.unref();
  try {
    fs.closeSync(logFd);
  } catch {}

  console.log(
    `🚀 [${name}] Đã kích hoạt tiến trình ngầm (PID: ${child.pid}, Log: .logs/${logFileName})`,
  );
  return child.pid;
}

export async function ensureLocalServers({
  maxWaitSec = 90,
  onProgress = null,
} = {}) {
  const initial = await checkLocalServers();
  if (initial.isRunning) {
    console.log(
      `✅ [Local Servers] Cả 2 máy chủ đã sẵn sàng: Backend (:4001 HTTP ${initial.beStatus}) & Frontend (:4000 HTTP ${initial.feStatus})`,
    );
    return {
      success: true,
      alreadyRunning: true,
      feOk: true,
      beOk: true,
    };
  }

  if (!initial.beOk) {
    console.log(
      `⚡ [Backend :4001] Đang tắt -> Khởi động NestJS Backend (nest start --watch)...`,
    );
    if (onProgress)
      await onProgress("Đang khởi động Local Backend (port 4001)...");
    const nestCli = path.join(
      BACKEND_DIR,
      "node_modules",
      "@nestjs",
      "cli",
      "bin",
      "nest.js",
    );
    spawnDetachedNodeServer(
      "BACKEND",
      BACKEND_DIR,
      [nestCli, "start", "--watch"],
      "backend-local.log",
      "backend-local.pid",
    );
  } else {
    console.log(`✅ [Backend :4001] Đang chạy (HTTP ${initial.beStatus}).`);
  }

  if (!initial.feOk) {
    console.log(
      `⚡ [Frontend :4000] Đang tắt -> Khởi động Next.js Frontend (next dev -p 4000)...`,
    );
    if (onProgress)
      await onProgress("Đang khởi động Local Frontend (port 4000)...");
    const nextCli = path.join(
      FRONTEND_DIR,
      "node_modules",
      "next",
      "dist",
      "bin",
      "next",
    );
    spawnDetachedNodeServer(
      "FRONTEND",
      FRONTEND_DIR,
      [nextCli, "dev", "-p", "4000"],
      "frontend-local.log",
      "frontend-local.pid",
    );
  } else {
    console.log(`✅ [Frontend :4000] Đang chạy (HTTP ${initial.feStatus}).`);
  }

  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < maxWaitSec * 1000) {
    attempt++;
    await new Promise((r) => setTimeout(r, 2000));
    const status = await checkLocalServers(2500);
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    if (status.isRunning) {
      console.log(
        `✅ [Local Servers] Khởi động hoàn tất sau ${elapsedSec}s! Backend (:4001 HTTP ${status.beStatus}) & Frontend (:4000 HTTP ${status.feStatus}) ĐÃ SẴN SÀNG.`,
      );
      return {
        success: true,
        alreadyRunning: false,
        elapsedSec,
        feOk: true,
        beOk: true,
      };
    }

    if (attempt % 3 === 0) {
      const msg = `Đang chờ Local Servers sẵn sàng (${elapsedSec}s/${maxWaitSec}s) — Backend :4001 [${status.beOk ? "UP" : "STARTING"}], Frontend :4000 [${status.feOk ? "UP" : "STARTING"}]...`;
      console.log(`⏳ ${msg}`);
      if (onProgress) await onProgress(msg);
    }
  }

  const finalCheck = await checkLocalServers(2500);
  console.error(
    `❌ [Local Servers] Quá thời gian chờ (${maxWaitSec}s). Backend :4001=${finalCheck.beOk ? "UP" : "DOWN"}, Frontend :4000=${finalCheck.feOk ? "UP" : "DOWN"}. Kiểm tra .logs/backend-local.log và .logs/frontend-local.log`,
  );
  return {
    success: false,
    feOk: finalCheck.feOk,
    beOk: finalCheck.beOk,
  };
}

export function stopLocalServers() {
  const ports = [BACKEND_PORT, FRONTEND_PORT];
  for (const port of ports) {
    try {
      if (process.platform === "win32") {
        const netstat = execSync(
          `netstat -ano | findstr :${port} | findstr LISTENING`,
          {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          },
        );
        const pids = new Set(
          netstat
            .split(/\r?\n/)
            .map((line) => line.trim().split(/\s+/).pop())
            .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0"),
        );
        for (const pid of pids) {
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
            console.log(
              `🛑 Đã dừng tiến trình trên port ${port} (PID: ${pid})`,
            );
          } catch {}
        }
      } else {
        execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
      }
    } catch {
      console.log(
        `ℹ️ Port ${port} hiện không có tiến trình nào đang lắng nghe.`,
      );
    }
  }
}

// CLI execution
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const hardKill = setTimeout(() => {
    console.error(
      "❌ [ensure-local-servers] Hard timeout reached (105s). Exiting.",
    );
    process.exit(1);
  }, 105000);
  hardKill.unref();

  const mode = (process.argv[2] || "ensure").replace(/^--/, "").toLowerCase();

  if (mode === "status") {
    checkLocalServers().then((res) => {
      console.log(
        `📊 Local Status -> Backend (:4001): ${res.beOk ? `UP (HTTP ${res.beStatus})` : "DOWN"} | Frontend (:4000): ${res.feOk ? `UP (HTTP ${res.feStatus})` : "DOWN"}`,
      );
      process.exit(res.isRunning ? 0 : 1);
    });
  } else if (mode === "stop") {
    stopLocalServers();
    process.exit(0);
  } else {
    ensureLocalServers({ maxWaitSec: 90 }).then((res) => {
      process.exit(res.success ? 0 : 1);
    });
  }
}
