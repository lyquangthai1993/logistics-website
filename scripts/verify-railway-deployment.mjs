#!/usr/bin/env node
/**
 * scripts/verify-railway-deployment.mjs
 *
 * Bộ Kiểm Định Trạng Thái Build & Cutover Deployment Mới Trên Railway Cloud (Tier-2 Gate).
 *
 * Tại sao chỉ kiểm tra HTTP 200 (/api/v1/health) là KHÔNG ĐỦ?
 * - Railway sử dụng cơ chế Blue-Green Zero-Downtime Deployment: Trong lúc bản commit mới đang ở
 *   trạng thái QUEUED / INITIALIZING / BUILDING / DEPLOYING (mất 60s–120s), container cũ vẫn nằm trong
 *   `activeDeployments` và vẫn trả về HTTP 200 OK.
 * - Nếu chạy Playwright E2E ngay khi thấy HTTP 200 mà không kiểm tra `latestDeployment.status === 'SUCCESS'`,
 *   `latestDeployment.meta.commitHash` khớp với Git HEAD, và `activeDeployments[0].id === latestDeployment.id`,
 *   bộ test Tầng 2 sẽ test nhầm vào container cũ (chưa có code mới)!
 *
 * 4 Chốt Chặn Bắt Buộc (4 Strict Readiness Invariants):
 *   1. Commit SHA Alignment: `latestDeployment.meta.commitHash` khớp với commit mới nhất của submodule (`origin/dev` hoặc `origin/master`).
 *   2. Build Status === SUCCESS: `latestDeployment.status === 'SUCCESS'` (Chặn ngay nếu đang `BUILDING`/`DEPLOYING`/`QUEUED` hoặc báo lỗi nếu `FAILED`/`CRASHED`).
 *   3. Active Container Cutover: `activeDeployments[0].id === latestDeployment.id` (Đảm bảo traffic đã chuyển sang container mới vừa build xong).
 *   4. Live HTTP Health 200 OK: `backend /api/v1/health` (200) & `frontend /` (200/307).
 *
 * Cách dùng CLI:
 *   node scripts/verify-railway-deployment.mjs                  # Kiểm tra nhanh môi trường dev (< 8s)
 *   node scripts/verify-railway-deployment.mjs --env=production # Kiểm tra nhanh môi trường production
 *   node scripts/verify-railway-deployment.mjs --wait           # Poll có giới hạn (tối đa 5 lần x 15s) chờ build xong
 *   node scripts/verify-railway-deployment.mjs --json           # Xuất kết quả JSON chuẩn hóa
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const IN_PROGRESS_STATUSES = new Set([
  "QUEUED",
  "INITIALIZING",
  "WAITING",
  "BUILDING",
  "DEPLOYING",
]);

const FAILED_STATUSES = new Set([
  "FAILED",
  "CRASHED",
  "REMOVED",
  "SKIPPED",
]);

const SERVICE_CONFIG = {
  "backend-tms-core": {
    submoduleDir: path.join(ROOT_DIR, "backend"),
    label: "Backend (backend-tms-core)",
    healthUrl: {
      dev: "https://backend-tms-core-dev.up.railway.app/api/v1/health",
      production: "https://backend-tms-core-production.up.railway.app/api/v1/health",
    },
  },
  "frontend-tms-core": {
    submoduleDir: path.join(ROOT_DIR, "frontend"),
    label: "Frontend (frontend-tms-core)",
    healthUrl: {
      dev: "https://frontend-tms-core-dev.up.railway.app",
      production: "https://frontend-tms-core-production.up.railway.app",
    },
  },
};

/**
 * Lấy Git Commit SHA mới nhất của submodule tương ứng với nhánh môi trường (`dev` hoặc `master`).
 */
export function getExpectedSubmoduleCommit(submoduleDir, branch = "dev") {
  const refsToTry = [`origin/${branch}`, branch, "HEAD"];
  for (const ref of refsToTry) {
    try {
      const sha = execSync(`git -C "${submoduleDir}" rev-parse ${ref}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 2500,
      }).trim();
      if (sha && /^[0-9a-f]{7,40}$/i.test(sha)) {
        return sha;
      }
    } catch {}
  }
  return null;
}

/**
 * Gọi `railway status --json` an toàn với timeout chống treo, ưu tiên OAuth session trong ~/.railway/config.json.
 */
export function fetchRailwayProjectStatusJson(timeoutMs = 7000) {
  const homeConfigPath = path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".railway",
    "config.json",
  );
  const hasCliLoginSession = fs.existsSync(homeConfigPath);

  const childEnv = {
    ...process.env,
    CI: "true",
  };

  // Nếu máy trạm đã login Railway CLI (có user.accessToken trong ~/.railway/config.json),
  // xóa RAILWAY_TOKEN (vốn là Project Token chỉ dùng cho `railway up`) để `railway status --json` hoạt động chuẩn xác.
  if (hasCliLoginSession) {
    delete childEnv.RAILWAY_TOKEN;
    delete childEnv.RAILWAY_API_TOKEN;
  }

  const proc = spawnSync("railway", ["status", "--json"], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    shell: true,
    timeout: timeoutMs,
    env: childEnv,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (proc.error) {
    throw new Error(`Lỗi gọi Railway CLI: ${proc.error.message}`);
  }

  const stdout = (proc.stdout || "").trim();
  if (!stdout || !stdout.startsWith("{")) {
    const stderr = (proc.stderr || "").trim();
    throw new Error(
      `Railway CLI không trả về JSON hợp lệ (exit ${proc.status}): ${stderr || stdout || "Empty output"}`,
    );
  }

  return JSON.parse(stdout);
}

/**
 * Kiểm tra HTTP Health của từng service với AbortSignal.timeout chống treo.
 */
async function probeHttpEndpoint(url, timeoutMs = 6000) {
  if (!url) return { ok: true, statusCode: 200 };
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ok =
      (res.status >= 200 && res.status < 300) ||
      res.status === 307 ||
      res.status === 308;
    return { ok, statusCode: res.status };
  } catch (err) {
    return { ok: false, statusCode: 0, error: err?.message || String(err) };
  }
}

/**
 * Kiểm tra toàn diện trạng thái Build, Commit SHA, Active Container Cutover và HTTP Health trên Railway.
 */
export async function checkRailwayDeploymentReady({
  envName = "dev",
  services = ["backend-tms-core", "frontend-tms-core"],
  checkCommitMatch = true,
  checkHttpHealth = true,
  timeoutMs = 7000,
} = {}) {
  const normalizedEnv =
    envName === "prod" || envName === "pro" || envName === "master"
      ? "production"
      : envName;
  const targetGitBranch = normalizedEnv === "production" ? "master" : "dev";

  let projectData;
  try {
    projectData = fetchRailwayProjectStatusJson(timeoutMs);
  } catch (err) {
    return {
      ready: false,
      hasBuildFailure: false,
      isBuilding: false,
      cliError: err?.message || String(err),
      envName: normalizedEnv,
      checkedAt: new Date().toISOString(),
      services: [],
      summary: `Không thể truy vấn trạng thái Railway CLI: ${err?.message || err}`,
    };
  }

  const envEdges = projectData?.environments?.edges || [];
  const envNode = envEdges
    .map((e) => e?.node)
    .find((n) => n?.name?.toLowerCase() === normalizedEnv.toLowerCase());

  if (!envNode) {
    return {
      ready: false,
      hasBuildFailure: false,
      isBuilding: false,
      cliError: `Không tìm thấy môi trường '${normalizedEnv}' trong Railway Project.`,
      envName: normalizedEnv,
      checkedAt: new Date().toISOString(),
      services: [],
      summary: `Không tìm thấy môi trường '${normalizedEnv}' trên Railway.`,
    };
  }

  const serviceInstances = (envNode?.serviceInstances?.edges || []).map(
    (e) => e?.node,
  );

  const serviceReports = await Promise.all(
    services.map(async (serviceName) => {
      const cfg = SERVICE_CONFIG[serviceName] || {
        submoduleDir: ROOT_DIR,
        label: serviceName,
        healthUrl: {},
      };
      const instance = serviceInstances.find(
        (s) => s?.serviceName === serviceName,
      );

      const expectedCommit = getExpectedSubmoduleCommit(
        cfg.submoduleDir,
        targetGitBranch,
      );

      if (!instance) {
        return {
          serviceName,
          label: cfg.label,
          ready: false,
          state: "MISSING_SERVICE",
          buildStatus: "UNKNOWN",
          expectedCommit,
          latestCommit: null,
          activeCommit: null,
          commitMatched: false,
          isCutoverActive: false,
          httpOk: false,
          httpStatus: 0,
          reason: `Không tìm thấy service ${serviceName} trên môi trường ${normalizedEnv}`,
        };
      }

      const latest = instance.latestDeployment || null;
      const activeList = Array.isArray(instance.activeDeployments)
        ? instance.activeDeployments
        : [];
      const active = activeList[0] || null;

      const rawBuildStatus = (latest?.status || "NONE").toUpperCase();
      const rawActiveStatus = (active?.status || "NONE").toUpperCase();
      const latestDeploymentId = latest?.id || null;
      const activeDeploymentId = active?.id || null;
      const latestCommit = latest?.meta?.commitHash || null;
      const activeCommit = active?.meta?.commitHash || null;
      const commitMessage =
        (latest?.meta?.commitMessage || "").split(/\r?\n/)[0] || "";
      const createdAt = latest?.createdAt || null;

      // 1. Kiểm tra Live HTTP Health trước (đồng thời đánh thức container nếu đang ở chế độ Serverless SLEEPING)
      const healthUrl = cfg.healthUrl?.[normalizedEnv] || null;
      const httpProbe =
        checkHttpHealth && healthUrl
          ? await probeHttpEndpoint(healthUrl, Math.min(timeoutMs, 6000))
          : { ok: true, statusCode: 200 };

      // 2. Kiểm tra khớp Commit SHA (nếu deployment có đính kèm commitHash từ GitHub)
      let commitMatched = true;
      if (checkCommitMatch && expectedCommit && latestCommit) {
        commitMatched =
          latestCommit.toLowerCase().startsWith(expectedCommit.toLowerCase()) ||
          expectedCommit.toLowerCase().startsWith(latestCommit.toLowerCase());
      }

      // 3. Kiểm tra trạng thái Build của latestDeployment
      // Lưu ý: Trên Railway Serverless, một bản build đã SUCCESS khi nhàn rỗi sẽ chuyển sang SLEEPING
      // và thức dậy ngay khi có HTTP probe trả về 200 OK.
      const isWokenFromSleep =
        rawBuildStatus === "SLEEPING" &&
        Boolean(latestDeploymentId) &&
        activeDeploymentId === latestDeploymentId &&
        httpProbe.ok;
      const buildStatus = isWokenFromSleep
        ? "SUCCESS (WOKEN)"
        : rawBuildStatus;

      const isBuildSuccess =
        rawBuildStatus === "SUCCESS" || isWokenFromSleep;
      const isBuildInProgress = IN_PROGRESS_STATUSES.has(rawBuildStatus);
      const isBuildFailed = FAILED_STATUSES.has(rawBuildStatus);

      // 4. Kiểm tra Cutover sang Active Container (container mới vừa build xong phải là activeDeployment hiện hành)
      const isCutoverActive =
        Boolean(latestDeploymentId) &&
        activeDeploymentId === latestDeploymentId &&
        (rawActiveStatus === "SUCCESS" ||
          (rawActiveStatus === "SLEEPING" && httpProbe.ok));

      // Xác định trạng thái tổng hợp của service
      let state = "READY";
      let reason = "Build SUCCESS, đúng Commit SHA, đã Cutover & HTTP 200 OK";

      if (!commitMatched) {
        state = "WAITING_NEW_COMMIT_BUILD";
        reason = `Railway đang ở commit cũ (${(latestCommit || "N/A").slice(0, 7)}), chưa nhận hoặc chưa build commit mới (${(expectedCommit || "N/A").slice(0, 7)})`;
      } else if (isBuildInProgress) {
        state = "BUILDING_IN_PROGRESS";
        reason = `Deployment mới (${(latestCommit || "").slice(0, 7)}) đang ${rawBuildStatus}, chưa hoàn tất build`;
      } else if (isBuildFailed) {
        state = "BUILD_FAILED";
        reason = `Deployment mới (${(latestCommit || "").slice(0, 7)}) bị lỗi build/deploy (${rawBuildStatus})`;
      } else if (!isBuildSuccess) {
        state = `BUILD_${rawBuildStatus}`;
        reason = `Trạng thái deployment hiện tại là ${rawBuildStatus} (yêu cầu SUCCESS)`;
      } else if (!isCutoverActive) {
        state = "WAITING_CUTOVER";
        reason = `Build đã SUCCESS nhưng chưa cutover sang active container (active=${(activeDeploymentId || "none").slice(0, 8)} vs latest=${(latestDeploymentId || "none").slice(0, 8)})`;
      } else if (!httpProbe.ok) {
        state = "HTTP_UNHEALTHY";
        reason = `Container đã active nhưng HTTP Health Check chưa sẵn sàng (HTTP ${httpProbe.statusCode || "TIMEOUT"})`;
      }

      const ready =
        commitMatched &&
        isBuildSuccess &&
        isCutoverActive &&
        httpProbe.ok;

      return {
        serviceName,
        label: cfg.label,
        ready,
        state,
        buildStatus,
        rawBuildStatus,
        latestDeploymentId,
        activeDeploymentId,
        expectedCommit,
        latestCommit,
        activeCommit,
        commitMessage,
        createdAt,
        commitMatched,
        isBuildInProgress,
        isBuildFailed,
        isCutoverActive,
        httpOk: httpProbe.ok,
        httpStatus: httpProbe.statusCode,
        healthUrl,
        reason,
      };
    }),
  );

  const ready = serviceReports.every((s) => s.ready);
  const hasBuildFailure = serviceReports.some(
    (s) => s.isBuildFailed && s.commitMatched,
  );
  const isBuilding = serviceReports.some(
    (s) =>
      s.state === "BUILDING_IN_PROGRESS" ||
      s.state === "WAITING_NEW_COMMIT_BUILD" ||
      s.state === "WAITING_CUTOVER" ||
      s.state === "HTTP_UNHEALTHY",
  );

  const summaryParts = serviceReports.map((s) => {
    const expShort = (s.expectedCommit || "N/A").slice(0, 7);
    const latShort = (s.latestCommit || "N/A").slice(0, 7);
    return `${s.serviceName}: [${s.state} | build=${s.buildStatus} | git=${latShort}/${expShort} | cutover=${s.isCutoverActive ? "YES" : "NO"} | http=${s.httpStatus}]`;
  });

  return {
    ready,
    hasBuildFailure,
    isBuilding,
    envName: normalizedEnv,
    targetGitBranch,
    checkedAt: new Date().toISOString(),
    services: serviceReports,
    summary: summaryParts.join(" ; "),
  };
}

/**
 * Chờ cho tới khi toàn bộ các service trên Railway hoàn tất build bản mới (SUCCESS), khớp commit SHA,
 * cutover sang active container và trả về HTTP 200 OK.
 * Nếu phát hiện bản build mới bị FAILED / CRASHED, dừng ngay lập tức (Fail-Fast) thay vì đợi hết timeout.
 */
export async function waitForRailwayDeploymentReady({
  envName = "dev",
  services = ["backend-tms-core", "frontend-tms-core"],
  checkCommitMatch = true,
  checkHttpHealth = true,
  initialDelaySec = 0,
  pollIntervalSec = 15,
  maxAttempts = 12,
  maxWaitSec = 210,
  onProgress = null,
} = {}) {
  const startTime = Date.now();

  if (initialDelaySec > 0) {
    if (onProgress) {
      await onProgress(
        `Đang chờ GitHub webhook kích hoạt Railway Cloud build (${initialDelaySec}s)...`,
      );
    }
    await new Promise((r) => setTimeout(r, initialDelaySec * 1000));
  }

  let attempt = 0;
  let lastReport = null;

  while (
    attempt < maxAttempts &&
    Date.now() - startTime < maxWaitSec * 1000
  ) {
    attempt++;
    lastReport = await checkRailwayDeploymentReady({
      envName,
      services,
      checkCommitMatch,
      checkHttpHealth,
    });

    if (onProgress) {
      await onProgress(
        `Kiểm tra Railway Build & Cutover (Lần ${attempt}/${maxAttempts}): ${lastReport.summary}`,
        lastReport,
      );
    }

    if (lastReport.ready) {
      return {
        success: true,
        attempts: attempt,
        elapsedSec: Math.round((Date.now() - startTime) / 1000),
        report: lastReport,
      };
    }

    // Fail-Fast nếu bản build của commit mới bị FAILED hoặc CRASHED trên Railway
    if (lastReport.hasBuildFailure) {
      const failedSvcs = lastReport.services
        .filter((s) => s.isBuildFailed)
        .map(
          (s) =>
            `${s.serviceName} (buildStatus=${s.buildStatus}, commit=${(s.latestCommit || "").slice(0, 7)})`,
        )
        .join(", ");
      return {
        success: false,
        abortedOnBuildFailure: true,
        attempts: attempt,
        elapsedSec: Math.round((Date.now() - startTime) / 1000),
        error: `Railway Build thất bại (FAILED/CRASHED) tại: ${failedSvcs}`,
        report: lastReport,
      };
    }

    if (
      attempt < maxAttempts &&
      Date.now() - startTime + pollIntervalSec * 1000 <= maxWaitSec * 1000
    ) {
      await new Promise((r) => setTimeout(r, pollIntervalSec * 1000));
    } else {
      break;
    }
  }

  const pendingReasons = lastReport?.services
    ? lastReport.services
        .filter((s) => !s.ready)
        .map((s) => `${s.serviceName}: ${s.reason}`)
        .join(" | ")
    : lastReport?.summary || "Unknown";

  return {
    success: false,
    abortedOnBuildFailure: false,
    attempts: attempt,
    elapsedSec: Math.round((Date.now() - startTime) / 1000),
    error: `Chưa hoàn tất build/deploy bản mới trên Railway sau ${attempt} lần kiểm tra: ${pendingReasons}`,
    report: lastReport,
  };
}

function printHumanReport(report) {
  console.log(
    `\n================================================================================`,
  );
  console.log(
    `🚂 RAILWAY DEPLOYMENT & BUILD GATE AUDIT [Env: ${report.envName.toUpperCase()} | Branch: ${report.targetGitBranch || "dev"}]`,
  );
  console.log(
    `================================================================================`,
  );

  if (report.cliError) {
    console.error(`❌ Lỗi truy vấn Railway CLI: ${report.cliError}`);
    return;
  }

  for (const s of report.services) {
    const icon = s.ready
      ? "✅"
      : s.isBuildFailed
        ? "❌"
        : "⏳";
    console.log(`\n${icon} ${s.label} -> [${s.state}]`);
    console.log(
      `   • Git Commit (Expected vs Railway): ${(s.expectedCommit || "N/A").slice(0, 7)} vs ${(s.latestCommit || "N/A").slice(0, 7)} (${s.commitMatched ? "MATCHED ✅" : "MISMATCH ⚠️"})`,
    );
    console.log(
      `   • Latest Deployment Build Status  : ${s.buildStatus} (ID: ${s.latestDeploymentId || "N/A"})`,
    );
    console.log(
      `   • Active Container Cutover        : ${s.isCutoverActive ? "ACTIVE ✅" : "NOT CUTOVER YET ⏳"} (Active ID: ${s.activeDeploymentId || "N/A"})`,
    );
    console.log(
      `   • Live HTTP Health Probe          : ${s.httpOk ? `HTTP ${s.httpStatus} OK ✅` : `HTTP ${s.httpStatus || "ERR"} ❌`} (${s.healthUrl || "N/A"})`,
    );
    if (s.commitMessage) {
      console.log(`   • Latest Commit Message           : "${s.commitMessage}"`);
    }
    console.log(`   • Kết luận                        : ${s.reason}`);
  }

  console.log(
    `\n--------------------------------------------------------------------------------`,
  );
  if (report.ready) {
    console.log(
      `🎉 VERDICT: READY FOR TIER-2 E2E TESTING! (Tất cả bản build mới đã SUCCESS & Cutover hoàn tất)`,
    );
  } else if (report.hasBuildFailure) {
    console.error(
      `🚨 VERDICT: BUILD FAILED! Bản build mới trên Railway bị lỗi. TUYỆT ĐỐI KHÔNG chạy E2E cho tới khi sửa lỗi build!`,
    );
  } else {
    console.warn(
      `⏳ VERDICT: DEPLOYMENT IN PROGRESS! Bản mới đang build hoặc chưa cutover xong. Vui lòng chờ build SUCCESS trước khi chạy E2E!`,
    );
  }
  console.log(
    `================================================================================\n`,
  );
}

// CLI Entrypoint
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const args = process.argv.slice(2);
  const isWaitMode = args.includes("--wait") || args.includes("-w");
  const isJsonMode = args.includes("--json");
  const skipCommitCheck = args.includes("--no-commit-check");

  const envArg = args.find((a) => a.startsWith("--env="));
  const envName = envArg ? envArg.split("=")[1] : "dev";

  const maxAttemptsArg = args.find((a) => a.startsWith("--max-attempts="));
  // Tuân thủ quy chuẩn Anti-Hang: mặc định tối đa 5 lần poll x 15s khi gọi CLI trực tiếp
  const maxAttempts = maxAttemptsArg
    ? parseInt(maxAttemptsArg.split("=")[1], 10)
    : 5;

  const intervalArg = args.find((a) => a.startsWith("--interval="));
  const pollIntervalSec = intervalArg
    ? parseInt(intervalArg.split("=")[1], 10)
    : 15;

  // Hard timeout bảo vệ chống treo terminal (RULE-ANTI-HANG-EXEC-01)
  const hardTimeoutMs = isWaitMode
    ? (maxAttempts * pollIntervalSec + 25) * 1000
    : 12000;
  const hardTimer = setTimeout(() => {
    console.error(
      `❌ [verify-railway-deployment] Hard timeout (${Math.round(hardTimeoutMs / 1000)}s) reached. Exiting.`,
    );
    process.exit(1);
  }, hardTimeoutMs);
  hardTimer.unref();

  (async () => {
    if (isWaitMode) {
      const waitRes = await waitForRailwayDeploymentReady({
        envName,
        checkCommitMatch: !skipCommitCheck,
        pollIntervalSec,
        maxAttempts,
        maxWaitSec: maxAttempts * pollIntervalSec + 20,
        onProgress: (msg) => {
          if (!isJsonMode) {
            console.log(`🔄 [${new Date().toLocaleTimeString()}] ${msg}`);
          }
        },
      });

      if (isJsonMode) {
        console.log(JSON.stringify(waitRes, null, 2));
      } else if (waitRes.report) {
        printHumanReport(waitRes.report);
      }

      if (waitRes.success) process.exit(0);
      if (waitRes.abortedOnBuildFailure) process.exit(1);
      process.exit(2);
    } else {
      const report = await checkRailwayDeploymentReady({
        envName,
        checkCommitMatch: !skipCommitCheck,
      });

      if (isJsonMode) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printHumanReport(report);
      }

      if (report.ready) process.exit(0);
      if (report.hasBuildFailure) process.exit(1);
      process.exit(2);
    }
  })();
}
