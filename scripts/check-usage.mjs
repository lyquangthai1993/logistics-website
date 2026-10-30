#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Read .env.railway
const envPath = path.join(ROOT_DIR, '.env.railway');
const envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
}

const token = envVars.RAILWAY_TOKEN_PRO || envVars.RAILWAY_PROD_TOKEN || envVars.RAILWAY_DEV_TOKEN;

console.log('='.repeat(64));
console.log('         RAILWAY QUICK USAGE & RESOURCE MONITOR         ');
console.log('='.repeat(64));

// 2. Billing Period calculation
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const totalDays = new Date(year, month + 1, 0).getDate();
const elapsedDays = now.getDate();
const remainingDays = totalDays - elapsedDays;
const percentElapsed = ((elapsedDays / totalDays) * 100).toFixed(1);

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const currentMonthStr = `${monthNames[month]} 01 - ${monthNames[(month + 1) % 12]} 01, ${year}`;

console.log(`\n📅 Chu kỳ thanh toán   : ${currentMonthStr}`);
console.log(`⏱️  Tiến độ chu kỳ      : Ngày ${elapsedDays}/${totalDays} (${percentElapsed}% đã qua, còn ${remainingDays} ngày)`);

// 3. Try running `railway usage`
console.log(`\n🔍 Tra cứu dữ liệu Usage từ Railway CLI...`);
let usageOutput = null;

try {
  const raw = execSync('railway usage', {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(token ? { RAILWAY_TOKEN: token } : {}),
    },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (raw && !raw.includes('Unauthorized')) {
    usageOutput = raw.trim();
  }
} catch {
  // Ignored
}

if (usageOutput) {
  console.log('\n📊 Bảng tổng hợp chi phí từ Railway:');
  console.log(usageOutput);
} else {
  console.log('ℹ️  Thông tin quyền truy cập:');
  console.log('   Dự án đang dùng Project Token từ .env.railway (phục vụ Deploy/Infra).');
  console.log('   Theo chính sách của Railway, API Usage/Billing chỉ mở cho Workspace Owner.');
  console.log('   👉 Xem biểu đồ chi tiết realtime tại: https://railway.com/workspace/usage');
}

// 4. Live Health & Endpoint Ping
console.log('\n🩺 Kiểm tra phản hồi dịch vụ (Live Health Ping):');
const endpoints = [
  { name: 'Backend Production ', url: 'https://backend-tms-core-production.up.railway.app/api/v1/health' },
  { name: 'Frontend Production', url: 'https://frontend-tms-core-production.up.railway.app' },
];

for (const ep of endpoints) {
  try {
    const start = Date.now();
    const res = await fetch(ep.url, { signal: AbortSignal.timeout(6000) });
    const latency = Date.now() - start;
    const statusIcon = res.status < 400 ? '🟢 200 OK' : `🔴 ${res.status}`;
    console.log(`   ${ep.name} : ${statusIcon} (${latency}ms)`);
  } catch (err) {
    console.log(`   ${ep.name} : 🔴 OFFLINE (${err.message})`);
  }
}

// 5. Live Services & Status Check via Railway CLI
console.log('\n🚀 Trạng thái tài nguyên (Railway Resources):');
try {
  const rawStatus = execSync('railway status', {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(token ? { RAILWAY_TOKEN: token } : {}),
    },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (rawStatus) {
    const lines = rawStatus.split('\n');
    let printing = false;
    for (const line of lines) {
      if (line.includes('Project:') || line.includes('Environment:') || line.includes('All resources')) {
        printing = true;
      }
      if (printing) {
        console.log('   ' + line);
      }
    }
  }
} catch (e) {
  console.log('   Không thể kết nối Railway CLI:', e.message);
}

console.log('='.repeat(64) + '\n');
