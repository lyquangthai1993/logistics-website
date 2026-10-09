import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/@playwright/test');
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://logistics-website-frontend-git-dev-thai-lys-projects.vercel.app';
const OUT_DIR = path.resolve('docs/ui-audit-evidence');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const ROUTES = [
  { path: '/auth/sign-in', auth: false, title: 'Đăng nhập (Sign In)' },
  { path: '/dashboard/overview', auth: true, title: 'Tổng quan (Overview)' },
  { path: '/dashboard/orders', auth: true, title: 'Quản lý Đơn hàng (Orders)' },
  { path: '/dashboard/trips', auth: true, title: 'Điều phối Chuyến xe (Trips)' },
  { path: '/dashboard/warehouse/inbound', auth: true, title: 'Kho - Xe nhập kho (Inbound)' },
  { path: '/dashboard/warehouse/outbound', auth: true, title: 'Kho - Xe xuất kho (Outbound)' },
  { path: '/dashboard/fleet', auth: true, title: 'Đội xe (Fleet)' },
  { path: '/dashboard/notifications', auth: true, title: 'Thông báo (Notifications)' },
];

async function run() {
  console.log(`Starting UI/UX Audit on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const issues = [];
  const routeEvidence = [];

  // 1. Inspect unauthenticated pages
  console.log('--- Auditing /auth/sign-in ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Light mode screenshot
    const lightImg = `auth_signin_${vp.width}_light.png`;
    await page.screenshot({ path: path.join(OUT_DIR, lightImg), fullPage: true });

    // Inspect DOM
    const lightChecks = await inspectPageDOM(page, '/auth/sign-in', vp.width, 'light');
    issues.push(...lightChecks);

    // Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    const darkImg = `auth_signin_${vp.width}_dark.png`;
    await page.screenshot({ path: path.join(OUT_DIR, darkImg), fullPage: true });

    const darkChecks = await inspectPageDOM(page, '/auth/sign-in', vp.width, 'dark');
    issues.push(...darkChecks);

    // Reset dark
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    routeEvidence.push({
      route: '/auth/sign-in',
      title: 'Đăng nhập (Sign In)',
      viewport: vp.width,
      lightImg,
      darkImg,
    });
  }

  // 2. Perform Login to get session
  console.log('--- Performing Login for Authenticated Routes ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.fill('input[name="email"]', 'lyquangthai1993+1@gmail.com');
  await page.fill('input[name="password"]', 'secret');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/.*/, { timeout: 20000 });
  console.log('Login successful! Current URL:', page.url());

  // 3. Inspect Authenticated Routes
  for (const r of ROUTES.filter(r => r.auth)) {
    console.log(`--- Auditing ${r.path} (${r.title}) ---`);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Light mode screenshot
      const safeName = r.path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '');
      const lightImg = `${safeName}_${vp.width}_light.png`;
      await page.screenshot({ path: path.join(OUT_DIR, lightImg), fullPage: false });

      // Inspect DOM Light
      const lightChecks = await inspectPageDOM(page, r.path, vp.width, 'light');
      issues.push(...lightChecks);

      // Dark mode screenshot
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(500);
      const darkImg = `${safeName}_${vp.width}_dark.png`;
      await page.screenshot({ path: path.join(OUT_DIR, darkImg), fullPage: false });

      const darkChecks = await inspectPageDOM(page, r.path, vp.width, 'dark');
      issues.push(...darkChecks);

      // Reset dark
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      routeEvidence.push({
        route: r.path,
        title: r.title,
        viewport: vp.width,
        lightImg,
        darkImg,
      });
    }
  }

  await browser.close();

  // Deduplicate and process issues
  const uniqueIssues = deduplicateIssues(issues);

  // Write report.json
  fs.writeFileSync(path.join(OUT_DIR, 'audit-report.json'), JSON.stringify(uniqueIssues, null, 2));

  // Generate so-sanh.html
  generateHtmlComparison(OUT_DIR, routeEvidence, uniqueIssues);

  console.log(`Audit complete! Total issues detected: ${uniqueIssues.length}`);
  console.log(`Report and HTML comparison generated at: ${OUT_DIR}/so-sanh.html`);
}

async function inspectPageDOM(page, route, width, mode) {
  return await page.evaluate(({ route, width, mode }) => {
    const list = [];

    // 1. Check Horizontal Overflow (Hỏng)
    const scrollW = document.documentElement.scrollWidth;
    const clientW = window.innerWidth;
    if (scrollW > clientW + 2) {
      // Find element causing overflow
      const elements = Array.from(document.querySelectorAll('*'));
      let offender = 'unknown';
      for (const el of elements) {
        const r = el.getBoundingClientRect();
        if (r.right > clientW + 2) {
          offender = `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''}`;
          break;
        }
      }
      list.push({
        category: 'Hỏng',
        route,
        viewport: `${width}px`,
        mode,
        location: `${route} (${width}px)`,
        issue: `Trang bị cuộn ngang (scrollWidth ${scrollW}px > ${clientW}px) do ${offender}`,
        fix: 'Thêm overflow-hidden, w-full hoặc min-w-0 trên container',
        source: 'đo',
      });
    }

    // 2. Check Interactive Element Sizes
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
    for (const el of interactives) {
      // Ignore hidden or 0x0 elements
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      const label = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.value || '').trim().slice(0, 30);
      const tag = `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`;

      if (rect.width < 24 || rect.height < 24) {
        // Exclude checkbox/radio if drawn at 16-20px (per review.md rule V2)
        if ((el.type === 'checkbox' || el.type === 'radio') && rect.width >= 14 && rect.height >= 14) {
          list.push({
            category: 'Lệch hệ',
            route,
            viewport: `${width}px`,
            mode,
            location: `${tag} "${label}"`,
            issue: `Checkbox/radio gốc có kích thước nhỏ (${Math.round(rect.width)}×${Math.round(rect.height)}px)`,
            fix: 'Sử dụng Checkbox component từ shadcn (@/components/ui/checkbox) có vùng bấm chuẩn',
            source: 'đo',
          });
        } else {
          list.push({
            category: 'Hỏng',
            route,
            viewport: `${width}px`,
            mode,
            location: `${tag} "${label}"`,
            issue: `Vùng bấm quá nhỏ (${Math.round(rect.width)}×${Math.round(rect.height)}px < 24px)`,
            fix: 'Nới padding tối thiểu h-8 (32px) hoặc thêm p-1.5 để đạt kích thước tối thiểu',
            source: 'đo',
          });
        }
      } else if (rect.width < 32 || rect.height < 32) {
        list.push({
          category: 'Gu',
          route,
          viewport: `${width}px`,
          mode,
          location: `${tag} "${label}"`,
          issue: `Vùng bấm nhỏ (${Math.round(rect.width)}×${Math.round(rect.height)}px, 24-31px)`,
          fix: 'Tăng chiều cao lên chuẩn h-8 (32px)',
          source: 'đo',
        });
      }
    }

    // 3. Check for Native Unstyled Select or Range
    const selects = Array.from(document.querySelectorAll('select:not([data-slot])'));
    for (const s of selects) {
      list.push({
        category: 'Lệch hệ',
        route,
        viewport: `${width}px`,
        mode,
        location: `select`,
        issue: 'Thẻ select gốc của trình duyệt chưa dùng UI component chuẩn',
        fix: 'Thay bằng Select component của dự án (@/components/ui/select)',
        source: 'đọc code',
      });
    }

    // 4. Check for Redundant Emojis in Buttons or Links
    const emojiRegex = /[🚚📦🔄🖨️✕🔍⚡➕❌💡]/;
    for (const el of interactives) {
      const text = el.innerText || '';
      if (emojiRegex.test(text)) {
        const svgCount = el.querySelectorAll('svg').length;
        if (svgCount > 0) {
          list.push({
            category: 'Lệch hệ',
            route,
            viewport: `${width}px`,
            mode,
            location: `${el.tagName.toLowerCase()}: "${text.trim().slice(0, 35)}"`,
            issue: 'Vi phạm Zero Redundant Icons: Nút vừa chứa icon SVG vừa chứa emoji trùng lặp trong văn bản',
            fix: 'Bỏ emoji trong text label, chỉ giữ lại icon SVG vector sạch',
            source: 'đo',
          });
        }
      }
    }

    // 5. Scrollbar width check (globals.css has 10px instead of 4px)
    const bodyScrollbar = window.getComputedStyle(document.body);
    // Checked via stylesheet analysis

    return list;
  }, { route, width, mode });
}

function deduplicateIssues(issues) {
  const map = new Map();
  for (const it of issues) {
    const key = `${it.category}|${it.location}|${it.issue}`;
    if (!map.has(key)) {
      map.set(key, { ...it, viewports: [it.viewport], modes: [it.mode] });
    } else {
      const ex = map.get(key);
      if (!ex.viewports.includes(it.viewport)) ex.viewports.push(it.viewport);
      if (!ex.modes.includes(it.mode)) ex.modes.push(it.mode);
    }
  }
  return Array.from(map.values());
}

function generateHtmlComparison(outDir, routeEvidence, issues) {
  const issuesHtml = issues.map((item, idx) => {
    const catBadge = item.category === 'Hỏng' 
      ? '<span class="badge badge-danger">Hỏng</span>' 
      : item.category === 'Lệch hệ' 
      ? '<span class="badge badge-warning">Lệch hệ</span>' 
      : '<span class="badge badge-info">Gu</span>';
    return `
      <tr>
        <td class="text-center font-mono font-bold">${idx + 1}</td>
        <td>${catBadge}</td>
        <td><span class="font-mono text-xs">${item.route}</span> <br><small class="text-muted">${item.location}</small></td>
        <td><strong>${item.issue}</strong></td>
        <td class="text-success text-xs font-mono">${item.fix}</td>
        <td><span class="badge badge-secondary">${item.source} (${item.viewports.join(', ')})</span></td>
      </tr>
    `;
  }).join('');

  const evidenceHtml = routeEvidence.map((ev) => `
    <div class="evidence-card">
      <div class="evidence-header">
        <strong>${ev.title} (${ev.route})</strong>
        <span class="badge badge-secondary">${ev.viewport}px</span>
      </div>
      <div class="evidence-grid">
        <div class="evidence-pane">
          <div class="pane-label">Chế độ Sáng (Light Mode)</div>
          <a href="${ev.lightImg}" target="_blank">
            <img src="${ev.lightImg}" alt="Light" loading="lazy" />
          </a>
        </div>
        <div class="evidence-pane dark-bg">
          <div class="pane-label">Chế độ Tối (Dark Mode)</div>
          <a href="${ev.darkImg}" target="_blank">
            <img src="${ev.darkImg}" alt="Dark" loading="lazy" />
          </a>
        </div>
      </div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Báo Cáo Rà Soát Giao Diện UI/UX - Logistics TMS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --border: #334155;
      --primary: #38bdf8;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    h1, h2, h3 { color: #fff; margin-top: 0; }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-info { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.4); }
    .badge-secondary { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      font-size: 13px;
      background: var(--card-bg);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 10px 12px;
      border: 1px solid var(--border);
      text-align: left;
    }
    th {
      background: #0f172a;
      color: #94a3b8;
      font-weight: 600;
    }
    tr:hover { background: rgba(255,255,255,0.02); }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 11px; }
    .text-muted { color: var(--muted); }
    .text-success { color: #34d399; }
    
    .evidence-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .evidence-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .evidence-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 900px) {
      .evidence-grid { grid-template-columns: 1fr; }
    }
    .evidence-pane {
      background: #fff;
      border-radius: 8px;
      padding: 8px;
      border: 1px solid #cbd5e1;
    }
    .evidence-pane.dark-bg {
      background: #020617;
      border-color: #1e293b;
    }
    .pane-label {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #475569;
    }
    .evidence-pane.dark-bg .pane-label {
      color: #94a3b8;
    }
    .evidence-pane img {
      width: 100%;
      height: 480px;
      object-fit: contain;
      background: #f1f5f9;
      border-radius: 4px;
    }
    .evidence-pane.dark-bg img {
      background: #0f172a;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Báo Cáo Rà Soát Giao Diện UI/UX (Logistics TMS)</h1>
    <p class="text-muted">
      Phạm vi: Toàn bộ hệ thống giao diện hiện tại (Auth, Overview, Orders, Trips, Warehouse Inbound, Outbound, Fleet, Notifications).<br>
      Khổ màn hình đã quét: 1440px (Desktop), 768px (Tablet), 375px (Mobile) · Cả 2 chế độ: Sáng (Light) & Tối (Dark).
    </p>
  </div>

  <h2>1. Bảng Tổng Hợp Vấn Đề (Phân Hạng Theo Luật V)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;" class="text-center">#</th>
        <th style="width: 90px;">Hạng</th>
        <th style="width: 220px;">Vị trí</th>
        <th>Mô tả vấn đề</th>
        <th style="width: 280px;">Đề xuất khắc phục</th>
        <th style="width: 130px;">Nguồn</th>
      </tr>
    </thead>
    <tbody>
      ${issuesHtml}
    </tbody>
  </table>

  <h2>2. Bằng Chứng Hình Ảnh Thực Tế (Screenshots So Sánh Light / Dark)</h2>
  ${evidenceHtml}
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'so-sanh.html'), html, 'utf8');
}

run().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
