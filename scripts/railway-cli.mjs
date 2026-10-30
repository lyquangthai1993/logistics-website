#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Read .env.railway
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

const token = envVars.RAILWAY_TOKEN_PRO || envVars.RAILWAY_PROD_TOKEN || envVars.RAILWAY_DEV_TOKEN;
const args = process.argv.slice(2);

const proc = spawnSync('railway', args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    ...(token ? { RAILWAY_TOKEN: token } : {}),
  },
});

process.exit(proc.status ?? 0);
