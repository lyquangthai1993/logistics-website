/**
 * scripts/start-dev.js
 *
 * Orchestrates the dev workflow:
 *  1. Spawn backend  (npm run start:dev  inside ./backend)
 *  2. Wait until backend health-endpoint responds
 *  3. Spawn frontend (npm run dev        inside ./frontend)
 *  4. Forward Ctrl+C to both child processes
 *
 * No extra npm packages required – pure Node.js built-ins only.
 */

'use strict';

const { spawn } = require('child_process');
const path      = require('path');
const http      = require('http');
const https     = require('https');

// ─── Configuration ────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');
const BACKEND_DIR  = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');

const BACKEND_HEALTH_URL = process.env.BACKEND_HEALTH_URL || 'http://localhost:3001/api';
const WAIT_TIMEOUT_MS    = parseInt(process.env.WAIT_TIMEOUT_MS  || '120000', 10); // 2 min
const WAIT_INTERVAL_MS   = parseInt(process.env.WAIT_INTERVAL_MS || '2000',   10); // 2 s

// On Windows we need shell:true for .cmd scripts
const NPM = 'npm';

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const c = {
  reset  : '\x1b[0m',
  cyan   : '\x1b[36m',
  yellow : '\x1b[33m',
  green  : '\x1b[32m',
  red    : '\x1b[31m',
  blue   : '\x1b[34m',
  magenta: '\x1b[35m',
  bold   : '\x1b[1m',
};

const tag = (color, label, msg) =>
  `${color}${c.bold}[${label}]${c.reset} ${msg}`;

const log = {
  info   : (label, msg) => console.log(tag(c.cyan,    label, msg)),
  success: (label, msg) => console.log(tag(c.green,   label, msg)),
  warn   : (label, msg) => console.log(tag(c.yellow,  label, msg)),
  error  : (label, msg) => console.error(tag(c.red,   label, msg)),
  be     : (msg)        => process.stdout.write(`${c.blue}${c.bold}[BACKEND] ${c.reset}${msg}`),
  fe     : (msg)        => process.stdout.write(`${c.magenta}${c.bold}[FRONTEND]${c.reset} ${msg}`),
};

// ─── Health probe ─────────────────────────────────────────────────────────────

function probe(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 3000 }, (res) => {
      res.resume(); // drain
      // Accept any response (even 401/404) – backend is alive
      resolve(res.statusCode >= 100 && res.statusCode < 600);
    });
    req.on('error',   () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForBackend() {
  log.info('WAIT', `Polling backend at ${BACKEND_HEALTH_URL}`);
  log.info('WAIT', `Timeout: ${WAIT_TIMEOUT_MS / 1000}s  |  Interval: ${WAIT_INTERVAL_MS / 1000}s`);

  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let attempt    = 0;

  while (Date.now() < deadline) {
    attempt++;
    const ok      = await probe(BACKEND_HEALTH_URL);
    const elapsed = ((Date.now() - (deadline - WAIT_TIMEOUT_MS)) / 1000).toFixed(1);

    if (ok) {
      log.success('WAIT', `Backend ready after ${elapsed}s (attempt #${attempt}) ✔\n`);
      return;
    }

    process.stdout.write(
      `\r${c.yellow}${c.bold}[WAIT]${c.reset} [${elapsed}s] attempt #${attempt} – not ready yet...`,
    );
    await new Promise((r) => setTimeout(r, WAIT_INTERVAL_MS));
  }

  // Clear the \r line before printing the error
  process.stdout.write('\n');
  log.error('WAIT', `Backend did not become ready within ${WAIT_TIMEOUT_MS / 1000}s. Aborting.`);
  process.exit(1);
}

// ─── Process spawner ──────────────────────────────────────────────────────────

function spawnProcess(name, cmd, cwd) {
  // shell:true is required on Windows to resolve npm.cmd / .bat files
  const child = spawn(cmd, [], {
    cwd,
    stdio : 'pipe',
    shell : true,
  });

  const prefix = name === 'BACKEND' ? log.be : log.fe;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) prefix(`${line}\n`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) prefix(`${line}\n`);
    });
  });

  child.on('error', (err) => {
    log.error(name, `Process error: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      log.error(name, `Exited with code ${code}`);
    } else {
      log.warn(name, `Process ended (code=${code}, signal=${signal})`);
    }
  });

  return child;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + c.bold + c.cyan + '═'.repeat(56) + c.reset);
  console.log(c.bold + c.cyan + '  🚀  Logistics TMS – Dev Startup Orchestrator' + c.reset);
  console.log(c.bold + c.cyan + '═'.repeat(56) + c.reset + '\n');

  // 1. Start backend
  log.info('BACKEND', 'Starting NestJS backend (npm run start:dev)...\n');
  const backend = spawnProcess('BACKEND', `${NPM} run start:dev`, BACKEND_DIR);

  // 2. Wait until backend is healthy
  process.stdout.write('\n');
  await waitForBackend();

  let frontend = null;

  // 3. Start frontend
  log.info('FRONTEND', 'Starting Next.js frontend (npm run dev)...\n');
  frontend = spawnProcess('FRONTEND', `${NPM} run dev`, FRONTEND_DIR);

  // 4. Graceful shutdown
  const shutdown = (signal) => {
    console.log('\n');
    log.warn('ORCHESTRATOR', `Received ${signal} – shutting down both processes...`);

    [frontend, backend].forEach((p) => {
      if (p && !p.killed) {
        p.kill(signal);
      }
    });

    setTimeout(() => process.exit(0), 2000);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // If backend dies unexpectedly, kill frontend too
  backend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log.error('ORCHESTRATOR', 'Backend crashed – stopping frontend.');
      if (frontend && !frontend.killed) {
        frontend.kill('SIGTERM');
      }
      setTimeout(() => process.exit(1), 1000);
    }
  });
}

main().catch((err) => {
  log.error('ORCHESTRATOR', err.message);
  process.exit(1);
});
