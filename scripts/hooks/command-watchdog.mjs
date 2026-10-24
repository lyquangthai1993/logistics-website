#!/usr/bin/env node
/**
 * scripts/hooks/command-watchdog.mjs
 *
 * Antigravity PreInvocation Hook:
 * Quét định kỳ trước mỗi lượt Agent suy luận (turn) để phát hiện và ngăn chặn các tác vụ chạy ngầm quá 5 phút.
 * Tuân thủ RULE-ANTI-HANG-EXEC-01.
 */

import fs from "node:fs";
import path from "node:path";

// Hard timeout 5s tự hủy chống treo (RULE-ANTI-HANG-EXEC-01)
const hardTimeout = setTimeout(() => {
  console.log(JSON.stringify({ injectSteps: [] }));
  process.exit(0);
}, 5000);
hardTimeout.unref();

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 phút = 300,000 ms

let inputData = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  clearTimeout(hardTimeout);

  try {
    if (!inputData.trim()) {
      console.log(JSON.stringify({ injectSteps: [] }));
      process.exit(0);
    }

    const payload = JSON.parse(inputData);
    const artifactDirectoryPath = payload?.artifactDirectoryPath;
    const transcriptPath = payload?.transcriptPath;
    const injectSteps = [];

    // Đọc danh sách các task đã hoàn thành từ transcript nếu có
    let completedTasks = new Set();
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      try {
        const transcriptContent = fs.readFileSync(transcriptPath, "utf8");
        const finishedMatches = transcriptContent.matchAll(
          /(task-\d+)[\s\S]{1,30}?(?:finished|canceled|cancelled) with result/g,
        );
        for (const match of finishedMatches) {
          completedTasks.add(match[1]);
        }
      } catch {}
    }

    // Kiểm tra các task log trong thư mục brain của phiên làm việc
    if (artifactDirectoryPath) {
      const tasksDir = path.join(
        artifactDirectoryPath,
        ".system_generated",
        "tasks",
      );
      if (fs.existsSync(tasksDir)) {
        const files = fs.readdirSync(tasksDir);
        const now = Date.now();

        for (const file of files) {
          if (!file.endsWith(".log")) continue;
          const taskIdMatch = file.match(/(task-\d+)/);
          const taskId = taskIdMatch ? taskIdMatch[1] : null;

          // Bỏ qua nếu task này đã hoàn thành trong transcript
          if (taskId && completedTasks.has(taskId)) {
            continue;
          }

          const filePath = path.join(tasksDir, file);
          try {
            const stat = fs.statSync(filePath);
            const ageMs = now - stat.birthtimeMs;

            // Nếu log file được tạo > 5 phút trước và task chưa xong
            if (ageMs > MAX_DURATION_MS) {
              injectSteps.push({
                ephemeralMessage: `⚠️ [ANTI-HANG WATCHDOG] Phát hiện tác vụ ngầm (${file}) đã chạy quá 5 phút (${Math.round(ageMs / 1000)}s) mà chưa kết thúc. Hãy sử dụng manage_task(kill) để hủy tác vụ tránh treo phiên.`,
              });
            }
          } catch {}
        }
      }
    }

    console.log(JSON.stringify({ injectSteps }));
    process.exit(0);
  } catch (err) {
    console.error("Error in command-watchdog hook:", err?.message || err);
    console.log(JSON.stringify({ injectSteps: [] }));
    process.exit(0);
  }
});
