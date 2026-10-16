#!/usr/bin/env node
/**
 * scripts/e2e-auditor.mjs
 * E2E Test Code Cross-Evaluation Auditor CLI
 * 
 * Inspects Playwright test code against the 50-point rubric defined in
 * .agents/skills/e2e-code-auditor/SKILL.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const E2E_DIR = path.join(ROOT_DIR, 'frontend', 'e2e');

export function auditE2eFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(ROOT_DIR, filePath);
  const lines = content.split('\n');

  const findings = [];
  let autoFail = false;

  // Dimension Scores
  let d1Score = 10;
  let d2Score = 10;
  let d3Score = 10;
  let d4Score = 10;
  let d5Score = 10;

  // D1: Spec Alignment & Scenario Completeness (10 pts)
  const testBlocks = content.match(/test\s*\(\s*['"`](.*?)['"`]/g) || [];
  const testCount = testBlocks.length;
  const expectCount = (content.match(/expect\s*\(/g) || []).length;

  if (testCount === 0) {
    d1Score -= 10;
    autoFail = true;
    findings.push({ dim: 'D1', severity: 'FAIL', msg: 'Không tìm thấy test case nào trong file.' });
  } else {
    const ratio = expectCount / testCount;
    if (ratio < 1.5) {
      d1Score -= 4;
      findings.push({ dim: 'D1', severity: 'WARN', msg: `Tỷ lệ assertions thấp (${expectCount} expects / ${testCount} tests). Nghi vấn kiểm thử bề mặt (shallow test).` });
    }
  }

  // Check: Static file checks masquerading as E2E assertions (e.g. fs.readFileSync in spec)
  const staticFsExpects = (content.match(/expect\s*\(\s*(?:beContent|feContent|gridContent|modalContent|fs\.readFileSync|content)\s*\)/g) || []).length;
  if (staticFsExpects > 3) {
    d1Score -= 3;
    findings.push({ dim: 'D1', severity: 'WARN', msg: `Phát hiện ${staticFsExpects} assertions kiểm tra chuỗi file tĩnh (fs.readFileSync). E2E Playwright phải kiểm thử luồng tương tác thực tế của trình duyệt chứ không chỉ đọc code tĩnh.` });
  }

  // Check: Shallow browser assertions count (at least 3 browser assertions required when page.goto exists)
  const browserExpectCount = (content.match(/(?:await\s+)?expect\s*\(\s*(?:page|locator|tripRows|pendingRow|modal|btn|action|header|count|[\w$]+(?:\.locator|\.first|\.getBy|\.count|\.isVisible))/g) || []).length;
  if (/page\.goto\s*\(/.test(content) && browserExpectCount < 3) {
    d1Score -= 4;
    d5Score -= 3;
    findings.push({ dim: 'D1', severity: 'WARN', msg: `Test giao diện chỉ có ${browserExpectCount} assertions trên UI locator/page. Quá nông để kiểm tra nghiệp vụ đầy đủ.` });
  }

  // D2: Anti-Pattern & Flakiness Prevention (10 pts)
  if (/waitForLoadState\s*\(\s*['"`]networkidle['"`]\s*\)/.test(content)) {
    d2Score -= 5;
    autoFail = true;
    findings.push({ dim: 'D2', severity: 'FAIL', msg: "Phát hiện 'networkidle' trong waitForLoadState. Gây timeout/treo lệnh do WebSocket/SSE/polling đang chạy." });
  }

  const longWaits = content.match(/waitForTimeout\s*\(\s*(\d+)\s*\)/g);
  if (longWaits) {
    for (const wait of longWaits) {
      const match = wait.match(/waitForTimeout\s*\(\s*(\d+)\s*\)/);
      if (match && parseInt(match[1], 10) > 2000) {
        d2Score -= 2;
        findings.push({ dim: 'D2', severity: 'WARN', msg: `Sử dụng waitForTimeout(${match[1]}ms) quá dài. Nên dùng locator.waitFor() hoặc expect.toBeVisible().` });
        break;
      }
    }
  }

  if (/tripRows\.first\(\)\.click\(\)/.test(content) || /trRows\.click\(\)/.test(content)) {
    d2Score -= 3;
    findings.push({ dim: 'D2', severity: 'WARN', msg: 'Nhấp trực tiếp vào tr row thay vì nút hành động cụ thể bên trong ô dữ liệu.' });
  }

  // Check: Swallow pattern via soft isVisible() check with else-fallback screenshot
  if (/if\s*\(\s*await\s+\w+.*isVisible\(.*\)\.catch\(\(\)\s*=>\s*false\)\s*\)[\s\S]*?else\s*\{[^}]*?screenshot/i.test(content)) {
    d2Score -= 3;
    findings.push({ dim: 'D2', severity: 'WARN', msg: "Phát hiện cấu trúc nuốt lỗi `if (await ...isVisible().catch(() => false)) ... else { screenshot }`. Nếu UI không mở đúng, test vẫn âm thầm chụp ảnh trang nền và pass xanh ảo." });
  }

  // D3: Network & Anti-Hang Protocol Compliance (10 pts)
  if (/curl\s+-s\s+http/.test(content) && !/curl\.exe/.test(content)) {
    d3Score -= 5;
    autoFail = true;
    findings.push({ dim: 'D3', severity: 'FAIL', msg: 'Phát hiện lệnh curl trần không có .exe và không có timeout trong script.' });
  }

  if (/\$\{.*?tripCode\}\//.test(content) && !/encodeURIComponent/.test(content)) {
    d3Score -= 2;
    findings.push({ dim: 'D3', severity: 'WARN', msg: 'Tham số URL động không được encodeURIComponent.' });
  }

  // D4: Real Database & Zero-Mock Integrity (10 pts)
  if (/page\.route\s*\(/.test(content)) {
    d4Score -= 10;
    autoFail = true;
    findings.push({ dim: 'D4', severity: 'FAIL', msg: 'Phát hiện mock backend qua page.route(). Dự án quy định 100% test trên database thực tế.' });
  }

  // D1 Hub Scoping Check: Nếu file test module kho nhưng không dùng tài khoản kho chuyên trách
  if (/(?:inbound|outbound|warehouse|inventory)/i.test(relPath) &&
      !/(?:USER_WAREHOUSE|warehouse_hyn|warehouse_dad|warehouse_hcm|TEST_USER_HCM|TEST_USERS\[[345]\])/.test(content)) {
    d1Score -= 2;
    findings.push({ dim: 'D1', severity: 'WARN', msg: 'File test kiểm thử màn hình Kho bãi (Warehouse/Inbound/Outbound) nhưng không sử dụng tài khoản Hub chuyên trách (USER_WAREHOUSE_HCM/HYN/DAD). Cần đối soát đúng Hub từ ảnh feedback để tránh lỗi bảng trống.' });
  }

  // D5: Visual Evidence & Assertion Rigor (10 pts)
  const hasBrowserTest = /page\.goto\s*\(/.test(content);
  const hasScreenshot = /screenshot\s*\(/.test(content) || /saveEvidenceScreenshot/.test(content);

  if (hasBrowserTest && !hasScreenshot) {
    d5Score -= 4;
    findings.push({ dim: 'D5', severity: 'WARN', msg: 'Test giao diện trình duyệt nhưng không chụp ảnh minh chứng (screenshot).' });
  }

  // Check: Look-only test (Zero user interaction: has page.goto and screenshot, but zero click/fill actions)
  const hasUserAction = /\.(?:click|fill|type|selectOption|check|press)\s*\(/.test(content);
  if (hasBrowserTest && !hasUserAction) {
    d1Score -= 3;
    d5Score -= 3;
    findings.push({ dim: 'D5', severity: 'WARN', msg: "Phát hiện bài test 'chỉ xem không thao tác' (Look-only test). Test chỉ mở URL bằng page.goto mà không thực hiện bất kỳ hành động click, fill hay submit nào để kiểm chứng chức năng." });
  }

  // Fake Evidence Check: if (count > 0) ... else { screenshot of empty table } mà không assert count > 0!
  if (/if\s*\(\s*\w*count\w*\s*>\s*0\s*\)/i.test(content) &&
      /else\s*\{[\s\S]*?screenshot/i.test(content) &&
      !/expect\s*\(\s*\w*count\w*\s*\)\s*\.toBeGreaterThan\s*\(\s*0\s*\)/i.test(content)) {
    d5Score -= 6;
    autoFail = true;
    findings.push({ dim: 'D5', severity: 'FAIL', msg: 'Phát hiện cấu trúc rẽ nhánh fallback chụp bảng trống khi count === 0 mà không assert số lượng item. Đây là Fake Evidence che giấu sai lệch tài khoản/dữ liệu.' });
  }

  if (/data-radix-/.test(content)) {
    d5Score -= 3;
    findings.push({ dim: 'D5', severity: 'WARN', msg: "Sử dụng attribute cũ data-radix-* thay vì chuẩn Base UI 2026 data-slot='*'." });
  }

  // Normalize scores
  d1Score = Math.max(0, d1Score);
  d2Score = Math.max(0, d2Score);
  d3Score = Math.max(0, d3Score);
  d4Score = Math.max(0, d4Score);
  d5Score = Math.max(0, d5Score);
  const totalScore = d1Score + d2Score + d3Score + d4Score + d5Score;

  let verdict = 'PASS';
  if (totalScore < 35 || autoFail) {
    verdict = 'FAIL';
  } else if (totalScore < 40) {
    verdict = 'WARN';
  }

  return {
    relPath,
    testCount,
    expectCount,
    scores: {
      d1: d1Score,
      d2: d2Score,
      d3: d3Score,
      d4: d4Score,
      d5: d5Score,
      total: totalScore,
    },
    autoFail,
    verdict,
    findings,
  };
}

function printReport(result) {
  console.log(`\n========================================================================`);
  console.log(`🛡️  E2E CODE AUDIT REPORT: ${result.relPath}`);
  console.log(`========================================================================`);
  console.log(`Tests: ${result.testCount}  |  Assertions: ${result.expectCount}  |  Score: ${result.scores.total}/50`);
  
  const badge = result.verdict === 'PASS' ? '🟢 PASS' : result.verdict === 'WARN' ? '🟡 WARN' : '🔴 FAIL';
  console.log(`Verdict: ${badge}${result.autoFail ? ' [AUTO-FAIL TRIGGERED]' : ''}\n`);

  console.log(`Dimension Scores:`);
  console.log(`  1. Business Spec & Completeness:   ${result.scores.d1}/10`);
  console.log(`  2. Anti-Pattern & Flakiness Guard: ${result.scores.d2}/10`);
  console.log(`  3. Network & Anti-Hang Protocol:   ${result.scores.d3}/10`);
  console.log(`  4. Real DB & Zero-Mock Integrity:  ${result.scores.d4}/10`);
  console.log(`  5. Visual Evidence & Assertions:   ${result.scores.d5}/10`);

  if (result.findings.length > 0) {
    console.log(`\nFindings & Issues:`);
    for (const f of result.findings) {
      const tag = f.severity === 'FAIL' ? '🔴' : '⚠️ ';
      console.log(`  ${tag} [${f.dim}] ${f.msg}`);
    }
  } else {
    console.log(`\n✨ Không phát hiện lỗi code E2E nào! File đạt chuẩn chất lượng cao.`);
  }
  console.log(`------------------------------------------------------------------------\n`);
}

function main() {
  const arg = process.argv[2];

  if (!arg || arg === '--all') {
    if (!fs.existsSync(E2E_DIR)) {
      console.error(`Thư mục E2E không tồn tại: ${E2E_DIR}`);
      process.exit(1);
    }
    const files = fs.readdirSync(E2E_DIR).filter((f) => f.endsWith('.spec.ts'));
    let hasFail = false;
    for (const file of files) {
      const fullPath = path.join(E2E_DIR, file);
      const res = auditE2eFile(fullPath);
      printReport(res);
      if (res.verdict === 'FAIL') hasFail = true;
    }
    process.exit(hasFail ? 1 : 0);
  }

  const targetPath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  if (!fs.existsSync(targetPath)) {
    console.error(`Không tìm thấy file: ${targetPath}`);
    process.exit(1);
  }

  const res = auditE2eFile(targetPath);
  printReport(res);
  process.exit(res.verdict === 'FAIL' ? 1 : 0);
}

main();
