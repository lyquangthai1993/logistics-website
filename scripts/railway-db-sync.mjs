#!/usr/bin/env node
/**
 * scripts/railway-db-sync.mjs
 *
 * Tiện ích sao lưu & đồng bộ cơ sở dữ liệu từ Production về Dev trên Railway Cloud.
 *
 * Cách sử dụng:
 *   node scripts/railway-db-sync.mjs               # Đồng bộ toàn diện (Backup Dev -> Dump Prod -> Restore Dev -> Verify)
 *   node scripts/railway-db-sync.mjs --dump-only   # Chỉ xuất dump Prod ra thư mục backups/
 *   node scripts/railway-db-sync.mjs --skip-backup # Bỏ qua bước backup Dev để đồng bộ siêu tốc
 *   node scripts/railway-db-sync.mjs --tables=order,trip  # Chỉ đồng bộ các bảng được chọn
 *
 * Npm scripts:
 *   npm run db:sync:prod-to-dev
 *   npm run db:dump:prod
 *
 * Tuân thủ RULE-ANTI-HANG-EXEC-01 & AGENTS.md.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import https from "node:https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

// Hard timeout 120s phòng chống treo (RULE-ANTI-HANG-EXEC-01)
const hardTimeout = setTimeout(() => {
  console.error(
    "\n🚨 [TIMEOUT] railway-db-sync.mjs vượt quá giới hạn 120s. Tự động thoát.",
  );
  process.exit(1);
}, 120000);
hardTimeout.unref();

// Load pg module từ root hoặc tools/telegram-task-runner
let Client;
try {
  Client = require("pg").Client;
} catch {
  const pgToolsPath = path.resolve(
    rootDir,
    "tools/telegram-task-runner/node_modules/pg",
  );
  Client = require(pgToolsPath).Client;
}

import fs from "node:fs";

// Tự động nạp backend/.env nếu có (không phụ thuộc dotenv bên ngoài)
try {
  const envPath = path.resolve(rootDir, "backend/.env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // ignore
}

// Cấu hình Database Endpoints (Đọc từ ENV, tuyệt đối không hardcode credentials)
const PROD_DB_URL = process.env.PROD_DATABASE_URL;
const DEV_DB_URL = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;

if (!PROD_DB_URL || !DEV_DB_URL) {
  console.error(
    "🚨 [ERROR] Vui lòng cấu hình PROD_DATABASE_URL và DEV_DATABASE_URL trong environment variables hoặc backend/.env",
  );
  process.exit(1);
}

const DEV_HEALTH_URL =
  process.env.DEV_HEALTH_URL ||
  "https://backend-tms-core-dev.up.railway.app/api/v1/health";

// Toàn bộ 15 bảng theo thứ tự quan hệ khóa ngoại (Forward Order)
const ALL_TABLES = [
  "role",
  "status",
  "file",
  "hub",
  "driver",
  "vehicle",
  "user",
  "session",
  "order_code_counter",
  "order",
  "trip",
  "trip_stop",
  "order_inventory_transaction",
  "notification",
  "migrations",
];

// Danh mục 13 sequences PostgreSQL cần đồng bộ
const SEQUENCE_NAMES = [
  "migrations_id_seq",
  "user_id_seq",
  "session_id_seq",
  "vehicle_id_seq",
  "driver_id_seq",
  "notification_id_seq",
  "order_id_seq",
  "trip_id_seq",
  "hub_id_seq",
  "order_code_counter_id_seq",
  "order_inventory_transaction_id_seq",
  "trip_stop_id_seq",
  "trip_code_sd_seq",
];

// Phân tích tham số dòng lệnh CLI
const cliArgs = process.argv.slice(2);
const isHelp = cliArgs.includes("--help") || cliArgs.includes("-h");
const isDumpOnly = cliArgs.includes("--dump-only");
const isSkipBackup = cliArgs.includes("--skip-backup");
const tablesArg = cliArgs.find((a) => a.startsWith("--tables="));

if (isHelp) {
  console.log(`
Tiện ích đồng bộ Database Production về Dev (Railway Cloud)
==========================================================
Cú pháp:
  node scripts/railway-db-sync.mjs [tùy chọn]

Các tùy chọn:
  --dump-only     Chỉ trích xuất dump Prod và lưu vào backups/, không ghi đè Dev
  --skip-backup   Bỏ qua bước sao lưu Dev trước khi ghi đè (tăng tốc độ)
  --tables=a,b    Chỉ áp dụng cho danh sách bảng chỉ định (phân cách bằng dấu phẩy)
  --help, -h      Hiển thị hướng dẫn sử dụng

Lệnh tắt Npm:
  npm run db:sync:prod-to-dev
  npm run db:dump:prod
`);
  process.exit(0);
}

const targetTables = tablesArg
  ? tablesArg
      .replace("--tables=", "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => ALL_TABLES.includes(t))
  : ALL_TABLES;

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function fetchTableData(client, tableName) {
  const res = await client.query(`SELECT * FROM "${tableName}"`);
  const columns = res.fields.map((f) => f.name);
  return { rows: res.rows, columns };
}

async function fetchSequences(client) {
  const seqs = {};
  for (const seq of SEQUENCE_NAMES) {
    try {
      const res = await client.query(
        `SELECT last_value, is_called FROM "${seq}"`,
      );
      seqs[seq] = res.rows[0];
    } catch {
      // bỏ qua sequence nếu không tồn tại
    }
  }
  return seqs;
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object")
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSqlDump(dumpObj) {
  const lines = [
    "-- Spider Express Logistics TMS Database Dump",
    `-- Created at: ${dumpObj.timestamp}`,
    `-- Source: ${dumpObj.environment}`,
    "SET session_replication_role = 'replica';",
    "",
  ];

  for (const [table, data] of Object.entries(dumpObj.tables)) {
    const rows = data.rows || [];
    const columns = data.columns || [];
    if (rows.length === 0) continue;
    lines.push(`-- Table: ${table} (${rows.length} rows)`);
    const cols = columns.map((c) => `"${c}"`).join(", ");
    for (const r of rows) {
      const vals = columns.map((c) => escapeSqlValue(r[c])).join(", ");
      lines.push(`INSERT INTO "${table}" (${cols}) VALUES (${vals});`);
    }
    lines.push("");
  }

  lines.push("-- Sequences:");
  for (const [seq, meta] of Object.entries(dumpObj.sequences || {})) {
    lines.push(
      `SELECT setval('${seq}', ${meta.last_value}, ${meta.is_called ? "true" : "false"});`,
    );
  }
  lines.push("SET session_replication_role = 'origin';");
  return lines.join("\n");
}

async function insertRowsInChunks(
  client,
  tableName,
  columns,
  rows,
  chunkSize = 100,
) {
  if (!rows || rows.length === 0) return 0;

  const colNames = columns.map((c) => `"${c}"`).join(", ");
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((row, rowIdx) => {
      const rowPlaceholders = [];
      columns.forEach((col, colIdx) => {
        const paramIndex = rowIdx * columns.length + colIdx + 1;
        rowPlaceholders.push(`$${paramIndex}`);
        let val = row[col];
        if (val !== null && typeof val === "object" && !(val instanceof Date)) {
          val = JSON.stringify(val);
        }
        values.push(val);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(", ")})`);
    });

    const query = `INSERT INTO "${tableName}" (${colNames}) VALUES ${valuePlaceholders.join(", ")};`;
    await client.query(query, values);
    inserted += chunk.length;
  }
  return inserted;
}

function checkHttpHealth(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", (err) => resolve({ status: 0, error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 408, error: "Request Timeout" });
    });
  });
}

async function main() {
  const startTime = Date.now();
  const ts = getTimestamp();
  const backupsDir = path.resolve(rootDir, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  console.log("=".repeat(70));
  console.log("🚀 RAILWAY TMS DATABASE SYNC: PRODUCTION -> DEV");
  console.log(
    `⏰ Khởi chạy: ${new Date().toLocaleString("vi-VN")} | Chế độ: ${isDumpOnly ? "DUMP ONLY" : "FULL SYNC"}`,
  );
  console.log("=".repeat(70));

  const prodClient = new Client({
    connectionString: PROD_DB_URL,
    connectionTimeoutMillis: 10000,
  });
  let devClient = null;

  try {
    console.log("\n[1/5] 🔌 Kết nối cơ sở dữ liệu...");
    await prodClient.connect();
    console.log("  ✅ Đã kết nối Production DB (caboose.proxy.rlwy.net:59375)");

    if (!isDumpOnly) {
      devClient = new Client({
        connectionString: DEV_DB_URL,
        connectionTimeoutMillis: 10000,
      });
      await devClient.connect();
      console.log("  ✅ Đã kết nối Dev DB (junction.proxy.rlwy.net:31094)");
    }

    // Bước 2: Sao lưu Dev DB
    if (!isDumpOnly && !isSkipBackup) {
      console.log("\n[2/5] 💾 Sao lưu dữ liệu hiện tại của Dev DB...");
      const devDump = {
        timestamp: new Date().toISOString(),
        environment: "development",
        tables: {},
        sequences: {},
      };

      for (const table of targetTables) {
        devDump.tables[table] = await fetchTableData(devClient, table);
      }
      devDump.sequences = await fetchSequences(devClient);

      const devJsonPath = path.join(backupsDir, `dev_backup_${ts}.json`);
      const devSqlPath = path.join(backupsDir, `dev_backup_${ts}.sql`);
      fs.writeFileSync(devJsonPath, JSON.stringify(devDump, null, 2), "utf8");
      fs.writeFileSync(devSqlPath, generateSqlDump(devDump), "utf8");
      console.log(
        `  ✅ Đã lưu snapshot Dev: ${path.basename(devJsonPath)} (${(fs.statSync(devJsonPath).size / 1024).toFixed(1)} KB)`,
      );
    } else if (!isDumpOnly && isSkipBackup) {
      console.log(
        "\n[2/5] ⏭️ Bỏ qua bước sao lưu Dev DB theo tùy chọn (--skip-backup)",
      );
    } else {
      console.log("\n[2/5] ⏭️ Bỏ qua thao tác với Dev DB (Chế độ Dump Only)");
    }

    // Bước 3: Dump Production DB
    console.log("\n[3/5] 📦 Trích xuất dữ liệu từ Production DB...");
    const prodDump = {
      timestamp: new Date().toISOString(),
      environment: "production",
      tables: {},
      sequences: {},
    };

    const prodCounts = {};
    for (const table of targetTables) {
      const data = await fetchTableData(prodClient, table);
      prodDump.tables[table] = data;
      prodCounts[table] = data.rows.length;
      console.log(
        `  - Bảng "${table.padEnd(28)}": ${String(data.rows.length).padStart(4)} bản ghi`,
      );
    }
    prodDump.sequences = await fetchSequences(prodClient);

    const prodJsonPath = path.join(backupsDir, `prod_backup_${ts}.json`);
    const prodSqlPath = path.join(backupsDir, `prod_backup_${ts}.sql`);
    fs.writeFileSync(prodJsonPath, JSON.stringify(prodDump, null, 2), "utf8");
    fs.writeFileSync(prodSqlPath, generateSqlDump(prodDump), "utf8");
    console.log(
      `  ✅ Đã lưu bản dump Production: ${path.basename(prodJsonPath)} (${(fs.statSync(prodJsonPath).size / 1024).toFixed(1)} KB)`,
    );

    if (isDumpOnly) {
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `\n🎉 TRÍCH XUẤT DUMP PRODUCTION HOÀN TẤT TRONG ${elapsedSec}s!`,
      );
      return;
    }

    // Bước 4: Đồng bộ vào Dev DB
    console.log("\n[4/5] 🔄 Nạp dữ liệu Production vào Dev DB...");
    await devClient.query("BEGIN");
    await devClient.query("SET session_replication_role = 'replica';");

    // Xóa theo thứ tự ngược
    const reverseTables = [...targetTables].reverse();
    for (const table of reverseTables) {
      await devClient.query(`DELETE FROM "${table}";`);
    }
    console.log("  🧹 Đã xóa sạch dữ liệu cũ trong bảng mục tiêu trên Dev DB");

    // Chèn dữ liệu theo thứ tự xuôi
    for (const table of targetTables) {
      const { rows, columns } = prodDump.tables[table];
      if (rows && rows.length > 0) {
        const count = await insertRowsInChunks(
          devClient,
          table,
          columns,
          rows,
          100,
        );
        console.log(
          `  📥 Bảng "${table.padEnd(28)}": Đã chèn ${String(count).padStart(4)} bản ghi`,
        );
      } else {
        console.log(`  ⚪ Bảng "${table.padEnd(28)}":    0 bản ghi`);
      }
    }

    // Cập nhật lại sequences
    console.log("  🔢 Cập nhật lại toàn bộ sequences...");
    for (const [seq, meta] of Object.entries(prodDump.sequences)) {
      if (meta && meta.last_value) {
        await devClient.query(
          `SELECT setval('${seq}', ${meta.last_value}, ${meta.is_called ? "true" : "false"});`,
        );
      }
    }

    await devClient.query("SET session_replication_role = 'origin';");
    await devClient.query("COMMIT");
    console.log("  ✅ Giao dịch nạp dữ liệu vào Dev DB đã COMMIT thành công!");

    // Bước 5: Nghiệm thu đối soát
    console.log("\n[5/5] 🔎 Đối soát số lượng bản ghi giữa Prod và Dev...");
    let mismatchCount = 0;

    console.log("-".repeat(60));
    console.log(
      `| ${"Tên bảng".padEnd(30)} | ${"Prod".padStart(8)} | ${"Dev".padStart(8)} | ${"Trạng thái".padStart(8)} |`,
    );
    console.log("-".repeat(60));

    for (const table of targetTables) {
      const res = await devClient.query(
        `SELECT count(*)::int as count FROM "${table}"`,
      );
      const devCount = res.rows[0].count;
      const prodCount = prodCounts[table];
      const match = devCount === prodCount;
      if (!match) mismatchCount++;

      console.log(
        `| ${table.padEnd(30)} | ${String(prodCount).padStart(8)} | ${String(devCount).padStart(8)} | ${(match ? "PASS ✅" : "FAIL ❌").padStart(8)} |`,
      );
    }
    console.log("-".repeat(60));

    // Health check Dev Backend
    console.log("\n🩺 Kiểm tra trạng thái sức khỏe Dev Backend API...");
    const healthRes = await checkHttpHealth(DEV_HEALTH_URL);
    console.log(
      `  Backend Health: ${healthRes.status === 200 ? "HTTP 200 OK ✅" : `HTTP ${healthRes.status} ⚠️`}`,
    );

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    if (mismatchCount === 0) {
      console.log("\n" + "=".repeat(70));
      console.log(`🎉 ĐỒNG BỘ DATABASE PRODUCTION -> DEV THÀNH CÔNG 100%!`);
      console.log(`⏱️ Tổng thời gian thực hiện: ${elapsedSec}s`);
      console.log("=".repeat(70));
    } else {
      console.error(
        `\n⚠️ CẢNH BÁO: Có ${mismatchCount} bảng không khớp số lượng bản ghi!`,
      );
    }
  } catch (err) {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH THỰC THI:", err.message);
    if (devClient) {
      try {
        await devClient.query("ROLLBACK");
        console.log("  ⚠️ Đã ROLLBACK an toàn giao dịch trên Dev DB.");
      } catch {}
    }
    process.exit(1);
  } finally {
    try {
      await prodClient.end();
      if (devClient) await devClient.end();
    } catch {}
  }
}

main();
