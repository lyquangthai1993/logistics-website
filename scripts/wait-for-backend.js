/**
 * wait-for-backend.js
 *
 * Polls the backend health endpoint until it responds with HTTP 2xx.
 * Used by the root package.json to delay frontend startup until the
 * NestJS backend is fully ready.
 *
 * Usage:
 *   node scripts/wait-for-backend.js [url] [timeoutMs] [intervalMs]
 *
 * Defaults:
 *   url        = http://localhost:3001/api/health  (or BACKEND_HEALTH_URL env)
 *   timeoutMs  = 120000  (2 minutes)
 *   intervalMs = 2000    (poll every 2 seconds)
 */

const http = require('http');
const https = require('https');

const HEALTH_URL =
  process.argv[2] ||
  process.env.BACKEND_HEALTH_URL ||
  'http://localhost:3001/api';

const TIMEOUT_MS = parseInt(process.argv[3] || process.env.WAIT_TIMEOUT_MS || '120000', 10);
const INTERVAL_MS = parseInt(process.argv[4] || process.env.WAIT_INTERVAL_MS || '2000', 10);

const startTime = Date.now();

function colorize(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const cyan   = (t) => colorize('36', t);
const yellow = (t) => colorize('33', t);
const green  = (t) => colorize('32', t);
const red    = (t) => colorize('31', t);

function probe(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 3000 }, (res) => {
      // Consume response to free socket
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend() {
  console.log(cyan(`\n⏳  Waiting for backend to be ready...`));
  console.log(cyan(`   URL      : ${HEALTH_URL}`));
  console.log(cyan(`   Timeout  : ${TIMEOUT_MS / 1000}s`));
  console.log(cyan(`   Interval : ${INTERVAL_MS / 1000}s\n`));

  let attempt = 0;

  while (true) {
    attempt++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (Date.now() - startTime > TIMEOUT_MS) {
      console.error(
        red(`\n✖  Backend did not become ready within ${TIMEOUT_MS / 1000}s. Aborting.\n`),
      );
      process.exit(1);
    }

    const ok = await probe(HEALTH_URL);

    if (ok) {
      console.log(
        green(`\n✔  Backend is ready! (attempt #${attempt}, elapsed ${elapsed}s)\n`),
      );
      process.exit(0);
    }

    process.stdout.write(
      yellow(`   [${elapsed}s] Attempt #${attempt} – backend not ready yet, retrying in ${INTERVAL_MS / 1000}s...\r`),
    );

    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

waitForBackend();
