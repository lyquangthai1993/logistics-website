#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

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
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      envVars[key] = val;
    }
  }
}

const isAutoDeployEnabled = envVars.RAILWAY_AUTO_DEPLOY !== 'false';
if (!isAutoDeployEnabled) {
  console.log('[Railway Deploy] ⏸️ Auto deploy is disabled in .env.railway (RAILWAY_AUTO_DEPLOY=false).');
  process.exit(0);
}

// 2. Determine target service
const args = process.argv.slice(2);
let target = args[0] || 'auto';
const isForce = args.includes('--force');

const currentCwd = process.cwd();
if (target === 'auto' || target === 'root') {
  if (currentCwd.endsWith('backend') || currentCwd.endsWith('backend\\') || currentCwd.endsWith('backend/')) {
    target = 'backend';
  } else if (currentCwd.endsWith('frontend') || currentCwd.endsWith('frontend\\') || currentCwd.endsWith('frontend/')) {
    target = 'frontend';
  } else {
    // In root, check which submodules changed in git
    try {
      const diffOutput = execSync('git diff --name-only HEAD~1 HEAD', { cwd: ROOT_DIR, encoding: 'utf8' });
      const hasBackend = diffOutput.includes('backend');
      const hasFrontend = diffOutput.includes('frontend');
      if (hasBackend && !hasFrontend) target = 'backend';
      else if (hasFrontend && !hasBackend) target = 'frontend';
      else target = 'both';
    } catch {
      target = 'both';
    }
  }
}

// 3. Detect current Git branch
let branch = 'dev';
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('[Railway Deploy] ⚠️ Unable to detect git branch, defaulting to dev.');
}

// 4. Check commit message for override
let commitMsg = '';
try {
  commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
} catch {
  // Ignore if no commit yet
}

const hasDeployTag = commitMsg.includes('[deploy]') || commitMsg.includes('[railway]');

// 5. Determine Environment & Token
let envName = 'dev';
let token = envVars.RAILWAY_DEV_TOKEN;

if (branch === 'master' || branch === 'main') {
  envName = 'production';
  token = envVars.RAILWAY_PROD_TOKEN;
} else if (branch === 'dev') {
  envName = 'dev';
  token = envVars.RAILWAY_DEV_TOKEN;
} else {
  // Feature or bugfix branch
  if (!isForce && !hasDeployTag) {
    console.log(`[Railway Deploy] ℹ️ Branch '${branch}' is not 'dev' or 'master'. Skipping auto-deploy.`);
    console.log(`[Railway Deploy] 💡 Tip: Add '[deploy]' to your commit message or pass '--force' to trigger deploy on dev.`);
    process.exit(0);
  }
  console.log(`[Railway Deploy] ⚡ Explicit deploy tag detected on branch '${branch}'. Deploying to DEV environment.`);
  envName = 'dev';
  token = envVars.RAILWAY_DEV_TOKEN;
}

if (!token) {
  console.warn(`[Railway Deploy] ⚠️ No token found for environment '${envName}'. Please check .env.railway.`);
  process.exit(0);
}

// 6. Deploy targets mapping
const servicesToDeploy = [];
if (target === 'backend' || target === 'both') {
  servicesToDeploy.push({
    name: 'backend',
    service: 'backend-tms-core',
    cwd: path.join(ROOT_DIR, 'backend'),
    url: envName === 'production' 
      ? 'https://backend-tms-core-production.up.railway.app' 
      : 'https://backend-tms-core-dev.up.railway.app'
  });
}
if (target === 'frontend' || target === 'both') {
  servicesToDeploy.push({
    name: 'frontend',
    service: 'frontend-tms-core',
    cwd: path.join(ROOT_DIR, 'frontend'),
    url: envName === 'production' 
      ? 'https://frontend-tms-core-production.up.railway.app' 
      : 'https://frontend-tms-core-dev.up.railway.app'
  });
}

console.log(`\n==================================================`);
console.log(`🚄 [Railway Deploy] Branch: ${branch} | Environment: ${envName.toUpperCase()}`);
console.log(`==================================================`);

for (const svc of servicesToDeploy) {
  console.log(`[Railway Deploy] 🚀 Uploading and deploying '${svc.service}' from ${path.basename(svc.cwd)}...`);
  try {
    const cmd = `railway up --service ${svc.service} --environment ${envName} --detach`;
    const res = spawnSync(cmd, {
      cwd: svc.cwd,
      env: { ...process.env, RAILWAY_TOKEN: token },
      encoding: 'utf8',
      shell: true
    });

    if (res.status === 0) {
      console.log(`[Railway Deploy] ✅ '${svc.service}' deploy triggered successfully (running in background)!`);
      console.log(`[Railway Deploy] 🔗 Live URL: ${svc.url}`);
    } else {
      console.error(`[Railway Deploy] ❌ Failed to deploy '${svc.service}':`);
      console.error(res.stderr || res.stdout);
    }
  } catch (err) {
    console.error(`[Railway Deploy] ❌ Execution error for '${svc.service}':`, err.message);
  }
}
console.log(`==================================================\n`);
