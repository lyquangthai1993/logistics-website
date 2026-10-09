import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/@playwright/test');
import fs from 'node:fs';
import path from 'node:path';

const DEV_URL = 'http://localhost:4000';
const OUT_DIR = path.resolve('docs/ui-audit-evidence');
const BEFORE_DIR = path.join(OUT_DIR, 'before');
const AFTER_DIR = path.join(OUT_DIR, 'after');

fs.mkdirSync(BEFORE_DIR, { recursive: true });
fs.mkdirSync(AFTER_DIR, { recursive: true });

// Copy existing root screenshots into before/ if not already done
const files = fs.readdirSync(OUT_DIR);
for (const file of files) {
  if (file.endsWith('.png') && !file.includes('_after')) {
    const src = path.join(OUT_DIR, file);
    const dest = path.join(BEFORE_DIR, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}

const SCREENS = [
  { path: '/auth/sign-in', auth: false, title: 'Màn hình Đăng nhập (Sign In)', id: 'signin' },
  { path: '/dashboard/overview', auth: true, title: 'Tổng quan Điều hành (Overview)', id: 'overview' },
  { path: '/dashboard/orders', auth: true, title: 'Quản lý Đơn hàng (Orders)', id: 'orders' },
  { path: '/dashboard/trips', auth: true, title: 'Điều phối Chuyến xe (Trips)', id: 'trips' },
  { path: '/dashboard/warehouse/inbound', auth: true, title: 'Kho - Xe nhập kho (Inbound)', id: 'inbound' },
  { path: '/dashboard/warehouse/outbound', auth: true, title: 'Kho - Xe xuất kho (Outbound)', id: 'outbound' },
  { path: '/dashboard/fleet', auth: true, title: 'Quản lý Đội xe (Fleet)', id: 'fleet' },
];

async function capture() {
  console.log(`Starting capture of new interface on ${DEV_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Capture Sign-In
  console.log('Capturing /auth/sign-in...');
  await page.goto(`${DEV_URL}/auth/sign-in`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Desktop Light
  await page.screenshot({ path: path.join(AFTER_DIR, 'auth_signin_1440_light.png'), fullPage: true });

  // Desktop Dark
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(AFTER_DIR, 'auth_signin_1440_dark.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));

  // Mobile 375 Light & Dark
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(AFTER_DIR, 'auth_signin_375_light.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(AFTER_DIR, 'auth_signin_375_dark.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));

  // 2. Perform Login
  console.log('Performing login on local server...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${DEV_URL}/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.fill('input[name="email"]', 'lyquangthai1993+1@gmail.com');
  await page.fill('input[name="password"]', 'secret');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/.*/, { timeout: 20000 });
  console.log('Logged in successfully!');

  // 3. Capture Authenticated Pages
  for (const s of SCREENS.filter(s => s.auth)) {
    console.log(`Capturing ${s.path}...`);
    const safeName = s.path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '');

    await page.goto(`${DEV_URL}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Desktop Light
    await page.screenshot({ path: path.join(AFTER_DIR, `${safeName}_1440_light.png`), fullPage: false });

    // Desktop Dark
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(AFTER_DIR, `${safeName}_1440_dark.png`), fullPage: false });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // Mobile 375 Light
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(AFTER_DIR, `${safeName}_375_light.png`), fullPage: false });
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  await browser.close();
  console.log('Finished capturing all after screenshots!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
