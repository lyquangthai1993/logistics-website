#!/usr/bin/env node
/**
 * Công cụ hỗ trợ nạp tồn kho Kho HCM (Andromeda Hub - Hub ID: 1)
 * TÍCH HỢP TỰ ĐỘNG SAO LƯU (AUTO-BACKUP) & PHỤC HỒI (RESTORE)
 *
 * Cách sử dụng:
 *   1. Chế độ kiểm tra file Excel (Dry-run, không sửa DB):
 *      node scripts/import-hcm-inventory.mjs "duong/dan/file.xlsx" --dry-run
 *
 *   2. Chế độ chỉ Backup cơ sở dữ liệu trước (An toàn):
 *      node scripts/import-hcm-inventory.mjs --backup-only
 *
 *   3. Chế độ Reset sạch toàn bộ Operational Data và Import (Tự động Auto-backup trước):
 *      node scripts/import-hcm-inventory.mjs "duong/dan/file.xlsx" --mode=truncate
 *
 *   4. Chế độ chỉ Xóa tồn kho cũ ở Hub HCM và Import (Tự động Auto-backup trước):
 *      node scripts/import-hcm-inventory.mjs "duong/dan/file.xlsx" --mode=scoped
 *
 *   5. Chế độ Phục hồi hoàn tác từ file Backup:
 *      node scripts/import-hcm-inventory.mjs --restore="backups/backup_tms_orders_xxx.json"
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let XLSX;
try {
  XLSX = require('../frontend/node_modules/xlsx');
} catch {
  XLSX = require('xlsx');
}

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const pgPath = path.resolve('tools/telegram-task-runner/node_modules/pg/lib/index.js');
  pg = (await import('file:///' + pgPath.replace(/\\/g, '/'))).default;
}

const { Client } = pg;

// 1. Phân tích tham số đầu vào
const args = process.argv.slice(2);
const excelPath = args.find((a) => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');
const isBackupOnly = args.includes('--backup-only');
const noBackup = args.includes('--no-backup');
const modeArg = args.find((a) => a.startsWith('--mode='));
const clearMode = modeArg ? modeArg.split('=')[1].toLowerCase() : null; // 'truncate' | 'scoped' | null
const restoreArg = args.find((a) => a.startsWith('--restore='));
const restorePath = restoreArg ? restoreArg.split('=')[1] : null;

// Tìm chuỗi kết nối Database (Ưu tiên backend/.env của hệ thống TMS Core)
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const envPaths = [
    path.resolve('backend/.env'),
    path.resolve('.env'),
    path.resolve('tools/telegram-task-runner/.env'),
  ];
  for (const ep of envPaths) {
    if (fs.existsSync(ep)) {
      const content = fs.readFileSync(ep, 'utf8');
      const match = content.match(/DATABASE_URL=([^\r\n]+)/);
      if (match) {
        dbUrl = match[1].trim();
        break;
      }
    }
  }
}

if (!dbUrl) {
  console.error('❌ LỖI: Không tìm thấy biến môi trường DATABASE_URL trong backend/.env');
  process.exit(1);
}

// Hàm trợ giúp kết nối DB
function createDbClient() {
  return new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });
}

// -------------------------------------------------------------
// CHỨC NĂNG 1: TỰ ĐỘNG SAO LƯU DỮ LIỆU (AUTO-BACKUP)
// -------------------------------------------------------------
async function performBackup(client, reason = 'auto') {
  console.log(`\n💾 [AUTO-BACKUP] Đang thực hiện sao lưu toàn bộ dữ liệu đơn hàng & vận hành...`);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFileName = `backup_tms_operational_${reason}_${ts}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  // Chạy truy vấn tuần tự trên cùng 1 kết nối pg Client
  const ordersRes = await client.query(`SELECT * FROM "order" ORDER BY id ASC`);
  const txRes = await client.query(`SELECT * FROM "order_inventory_transaction" ORDER BY id ASC`);
  const tripsRes = await client.query(`SELECT * FROM "trip" ORDER BY id ASC`);
  const tripStopsRes = await client.query(`SELECT * FROM "trip_stop" ORDER BY id ASC`);
  const counterRes = await client.query(`SELECT * FROM "order_code_counter" ORDER BY id ASC`);

  const backupData = {
    metadata: {
      createdAt: now.toISOString(),
      reason,
      counts: {
        orders: ordersRes.rows.length,
        transactions: txRes.rows.length,
        trips: tripsRes.rows.length,
        tripStops: tripStopsRes.rows.length,
        counters: counterRes.rows.length,
      },
    },
    tables: {
      order: ordersRes.rows,
      order_inventory_transaction: txRes.rows,
      trip: tripsRes.rows,
      trip_stop: tripStopsRes.rows,
      order_code_counter: counterRes.rows,
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`   ✅ SAO LƯU THÀNH CÔNG!`);
  console.log(`   📁 File lưu tại: ${backupFilePath}`);
  console.log(`   📊 Thống kê dữ liệu đã bảo vệ:`);
  console.log(`      - Đơn hàng (order): ${ordersRes.rows.length} dòng`);
  console.log(`      - Giao dịch kho (order_inventory_transaction): ${txRes.rows.length} dòng`);
  console.log(`      - Chuyến xe (trip): ${tripsRes.rows.length} dòng`);
  console.log(`      - Chặng dừng (trip_stop): ${tripStopsRes.rows.length} dòng`);
  console.log(`   🔒 Bạn hoàn toàn yên tâm: Dữ liệu cũ đã được bảo toàn 100% trước khi thực hiện thao tác tiếp theo.\n`);

  return backupFilePath;
}

// -------------------------------------------------------------
// CHỨC NĂNG 2: PHỤC HỒI DỮ LIỆU (RESTORE)
// -------------------------------------------------------------
async function performRestore(restoreTarget) {
  const filePath = path.resolve(restoreTarget);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ LỖI: Không tìm thấy file backup để phục hồi tại: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n🔄 [RESTORE] Đang đọc file backup: ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const backupData = JSON.parse(content);

  const client = createDbClient();
  await client.connect();

  try {
    await client.query('BEGIN');

    console.log(`   🧹 Đang làm sạch bảng hiện tại để chuẩn bị nạp lại...`);
    await client.query('TRUNCATE TABLE "order_inventory_transaction" CASCADE;');
    await client.query('TRUNCATE TABLE "trip_stop" CASCADE;');
    await client.query('TRUNCATE TABLE "trip" CASCADE;');
    await client.query('TRUNCATE TABLE "order" CASCADE;');
    await client.query('DELETE FROM "order_code_counter";');

    // Phục hồi order_code_counter
    const counters = backupData.tables.order_code_counter || [];
    for (const c of counters) {
      await client.query(`
        INSERT INTO "order_code_counter" ("id", "prefix", "yearMonth", "lastSequence", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("prefix", "yearMonth") DO UPDATE SET "lastSequence" = EXCLUDED."lastSequence"
      `, [c.id, c.prefix, c.yearMonth, c.lastSequence, c.createdAt, c.updatedAt]);
    }

    // Phục hồi order
    const orders = backupData.tables.order || [];
    console.log(`   📦 Đang nạp lại ${orders.length} đơn hàng...`);
    for (const o of orders) {
      const keys = Object.keys(o);
      const cols = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => o[k]);
      await client.query(`INSERT INTO "order" (${cols}) VALUES (${placeholders})`, values);
    }

    // Phục hồi trip
    const trips = backupData.tables.trip || [];
    console.log(`   🚚 Đang nạp lại ${trips.length} chuyến xe...`);
    for (const t of trips) {
      const keys = Object.keys(t);
      const cols = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => t[k]);
      await client.query(`INSERT INTO "trip" (${cols}) VALUES (${placeholders})`, values);
    }

    // Phục hồi order_inventory_transaction
    const txs = backupData.tables.order_inventory_transaction || [];
    console.log(`   📋 Đang nạp lại ${txs.length} giao dịch kho...`);
    for (const tx of txs) {
      const keys = Object.keys(tx);
      const cols = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => tx[k]);
      await client.query(`INSERT INTO "order_inventory_transaction" (${cols}) VALUES (${placeholders})`, values);
    }

    // Phục hồi trip_stop
    const stops = backupData.tables.trip_stop || [];
    for (const s of stops) {
      const keys = Object.keys(s);
      const cols = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => s[k]);
      await client.query(`INSERT INTO "trip_stop" (${cols}) VALUES (${placeholders})`, values);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 [RESTORE THÀNH CÔNG] Dữ liệu hệ thống đã được phục hồi nguyên vẹn 100% từ file backup!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ [RESTORE THẤT BẠI] Lỗi khi phục hồi dữ liệu:`, err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// -------------------------------------------------------------
// XỬ LÝ CÁC LUỒNG THỰC THI CHÍNH
// -------------------------------------------------------------

// Luồng 1: Nếu người dùng chạy --restore
if (restorePath) {
  await performRestore(restorePath);
  process.exit(0);
}

// Luồng 2: Nếu người dùng chạy --backup-only
if (isBackupOnly) {
  const client = createDbClient();
  await client.connect();
  try {
    await performBackup(client, 'manual');
  } finally {
    await client.end();
  }
  process.exit(0);
}

// Luồng 3: Hướng dẫn nếu thiếu file Excel
if (!excelPath) {
  console.log(`
=============================================================================
  CÔNG CỤ NẠP TỒN KHO ANDROMEDA HUB - HCM (SPIDER EXPRESS TMS)
=============================================================================
Cú pháp:
  node scripts/import-hcm-inventory.mjs <file_excel> [tùy chọn]

Tùy chọn:
  --dry-run          Chỉ đọc và thẩm tra file Excel, không thay đổi DB
  --backup-only      Chỉ sao lưu toàn bộ dữ liệu DB ra file JSON, không import
  --mode=truncate    TỰ ĐỘNG BACKUP, sau đó xóa sạch đơn hàng cũ rồi nạp
  --mode=scoped      TỰ ĐỘNG BACKUP, sau đó chỉ xóa dữ liệu kho HCM rồi nạp
  --no-backup        Bỏ qua bước sao lưu tự động (không khuyến khích)
  --restore=<path>   Phục hồi lại dữ liệu từ file backup JSON nếu cần hoàn tác

Ví dụ:
  1. Sao lưu dự phòng trước:
     node scripts/import-hcm-inventory.mjs --backup-only

  2. Kiểm tra thẩm định file Excel:
     node scripts/import-hcm-inventory.mjs ./ton_kho_hcm.xlsx --dry-run

  3. Thực thi an toàn (Tự động Backup + Truncate + Import):
     node scripts/import-hcm-inventory.mjs ./ton_kho_hcm.xlsx --mode=truncate
=============================================================================
`);
  process.exit(1);
}

const resolvedPath = path.resolve(excelPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ LỖI: Không tìm thấy file Excel tại: ${resolvedPath}`);
  process.exit(1);
}

// -------------------------------------------------------------
// ĐỌC VÀ THẨM ĐỊNH FILE EXCEL
// -------------------------------------------------------------
console.log(`\n📂 Đang đọc file Excel: ${resolvedPath}...`);
const fileBuffer = fs.readFileSync(resolvedPath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

if (!rawRows || rawRows.length === 0) {
  console.error('❌ LỖI: File Excel không có dữ liệu hàng nào!');
  process.exit(1);
}

const parsedRows = [];
const validationErrors = [];

for (let i = 0; i < rawRows.length; i++) {
  const row = rawRows[i];
  const keys = Object.keys(row);
  const findVal = (patterns) => {
    const matchKey = keys.find((k) =>
      patterns.some((p) => k.toLowerCase().includes(p.toLowerCase()))
    );
    return matchKey ? String(row[matchKey]).trim() : '';
  };

  const orderCodeRaw = findVal(['mã vận đơn', 'mã đơn', 'mã bill', 'tracking', 'code']);
  const isAutoCode =
    !orderCodeRaw ||
    orderCodeRaw.toUpperCase() === '(TỰ SINH KHI LƯU)' ||
    orderCodeRaw.toUpperCase().startsWith('(TỰ SINH');

  const goodsDescription = findVal(['tên hàng', 'hàng hóa', 'loại hàng', 'description', 'tên']);
  const qtyRaw = findVal(['số kiện', 'số lượng', 'kiện', 'qty', 'quantity']);
  const weightRaw = findVal(['số kg', 'khối lượng', 'trọng lượng', 'weight', 'kg']);
  const volumeRaw = findVal(['số m³', 'số m3', 'thể tích', 'volume', 'm3']);
  const deliveryAddress = findVal(['địa chỉ giao', 'nơi giao', 'đích', 'delivery', 'destination']);
  const province = findVal(['tỉnh/tp', 'tỉnh', 'thành phố', 'city', 'province']);
  const notes = findVal(['ghi chú', 'note', 'notes']);

  // Bỏ qua dòng trống hoàn toàn
  if (!orderCodeRaw && !goodsDescription && !deliveryAddress) {
    continue;
  }

  const rowIdx = i + 2;
  const rowErrors = [];

  if (!goodsDescription) {
    rowErrors.push(`Dòng ${rowIdx}: Thiếu tên hàng`);
  }

  const totalQuantity = parseInt(String(qtyRaw).replace(/\D/g, ''), 10) || 1;
  const totalWeight = parseFloat(String(weightRaw).replace(/,/g, '.')) || 0;
  const totalVolume = parseFloat(String(volumeRaw).replace(/,/g, '.')) || 0;

  if (totalQuantity < 1) {
    rowErrors.push(`Dòng ${rowIdx}: Số kiện phải >= 1 (giá trị: "${qtyRaw}")`);
  }

  if (rowErrors.length > 0) {
    validationErrors.push(...rowErrors);
  }

  parsedRows.push({
    excelRow: rowIdx,
    orderCode: isAutoCode ? null : orderCodeRaw.toUpperCase(),
    goodsDescription: goodsDescription || 'Hàng lưu kho HCM',
    totalQuantity,
    totalWeight,
    totalVolume,
    deliveryAddress: deliveryAddress || 'Kho Andromeda - Chờ điều phối',
    province: province || 'TP. Hồ Chí Minh',
    notes: notes || 'Nạp tồn kho ban đầu',
  });
}

console.log(`📊 Kết quả đọc file Excel:`);
console.log(`   - Tổng số dòng đọc được: ${parsedRows.length}`);
console.log(`   - Tổng số kiện: ${parsedRows.reduce((sum, r) => sum + r.totalQuantity, 0)} kiện`);
console.log(`   - Tổng khối lượng: ${parsedRows.reduce((sum, r) => sum + r.totalWeight, 0).toFixed(2)} kg`);
console.log(`   - Tổng thể tích: ${parsedRows.reduce((sum, r) => sum + r.totalVolume, 0).toFixed(3)} m³`);

if (validationErrors.length > 0) {
  console.log(`\n⚠️ Phát hiện ${validationErrors.length} lỗi trong file Excel:`);
  validationErrors.slice(0, 10).forEach((e) => console.log(`   ❌ ${e}`));
  if (validationErrors.length > 10) {
    console.log(`   ... và ${validationErrors.length - 10} lỗi khác.`);
  }
}

if (isDryRun) {
  console.log('\n🔎 Chế độ Dry-run kết thúc. Không có thay đổi nào trong cơ sở dữ liệu.');
  process.exit(validationErrors.length > 0 ? 1 : 0);
}

// -------------------------------------------------------------
// BƯỚC AUTO-BACKUP & NẠP DỮ LIỆU
// -------------------------------------------------------------
const client = createDbClient();
await client.connect();

try {
  // 1. Tự động Backup trước khi xóa/nạp (nếu người dùng không cố ý gắn --no-backup)
  if (!noBackup) {
    await performBackup(client, clearMode || 'before_import');
  }

  await client.query('BEGIN');

  // Lấy thông tin Hub HCM (Andromeda Hub)
  const hubRes = await client.query(`
    SELECT id, code, name, city, "orderCodePrefix"
    FROM hub
    WHERE id = 1 OR code = 'HUB-HCM-01' OR name ILIKE '%Andromeda%'
    LIMIT 1
  `);

  if (hubRes.rows.length === 0) {
    throw new Error('Không tìm thấy thông tin Hub Andromeda - HCM trong bảng hub!');
  }
  const hcmHub = hubRes.rows[0];
  const hcmHubId = hcmHub.id;
  const hcmPrefix = hcmHub.orderCodePrefix || 'HCM';

  console.log(`🏢 Hub thực thi: ${hcmHub.name} (ID: ${hcmHubId}, Prefix: ${hcmPrefix})`);

  // 2. Xử lý Clear Data nếu được yêu cầu
  if (clearMode === 'truncate') {
    console.log('\n🧹 Đang thực hiện xóa sạch toàn bộ Operational Data (Truncate)...');
    await client.query('TRUNCATE TABLE "order_inventory_transaction" CASCADE;');
    await client.query('TRUNCATE TABLE "trip_stop" CASCADE;');
    await client.query('TRUNCATE TABLE "trip" CASCADE;');
    await client.query('TRUNCATE TABLE "order" CASCADE;');
    await client.query('DELETE FROM "order_code_counter";');
    await client.query('ALTER SEQUENCE IF EXISTS trip_code_sd_seq RESTART WITH 1;');
    console.log('✅ Đã làm sạch toàn bộ dữ liệu đơn hàng và chuyến xe cũ.');
  } else if (clearMode === 'scoped') {
    console.log('\n🧹 Đang thực hiện xóa Scoped riêng cho Hub HCM (ID: 1)...');
    await client.query(`
      CREATE TEMP TABLE temp_hcm_ids AS
      SELECT id FROM "order"
      WHERE "currentHubId" = $1 OR "originHubId" = $1;

      DELETE FROM "order_inventory_transaction"
      WHERE "orderId" IN (SELECT id FROM temp_hcm_ids) OR "hubId" = $1;

      DELETE FROM "trip"
      WHERE "orderId" IN (SELECT id FROM temp_hcm_ids) OR "originHubId" = $1;

      DELETE FROM "order"
      WHERE id IN (SELECT id FROM temp_hcm_ids);

      DROP TABLE temp_hcm_ids;
    `, [hcmHubId]);
    console.log('✅ Đã làm sạch dữ liệu phụ thuộc của Hub HCM.');
  }

  // 3. Cấp mã chuyến tiếp nhận nội bộ chung
  const tripSeqRes = await client.query(`SELECT nextval('trip_code_sd_seq') AS seq`);
  const tripCode = `SD${tripSeqRes.rows[0].seq}`;

  // Chuẩn bị tháng năm cho mã đơn và phiếu nhập kho
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yymm = `${yy}${mm}`;
  const invoiceCode = `PNK-HCM-${yymm}-001`;

  console.log(`\n📦 Đang nạp ${parsedRows.length} dòng hàng vào hệ thống...`);
  console.log(`   - Mã chuyến tiếp nhận: ${tripCode}`);
  console.log(`   - Mã phiếu nhập kho: ${invoiceCode}`);

  let orderCount = 0;
  for (let idx = 0; idx < parsedRows.length; idx++) {
    const item = parsedRows[idx];

    // Tạo mã đơn tự sinh nếu chưa có
    let orderCode = item.orderCode;
    if (!orderCode) {
      const padNum = String(idx + 1).padStart(3, '0');
      orderCode = `${hcmPrefix}-${yymm}-${padNum}`;
    }

    // Insert Order
    const orderInsertRes = await client.query(`
      INSERT INTO "order" (
        "orderCode", "status", "route", "originHub", "destinationHub",
        "originHubId", "destinationHubId", "currentHubId", "currentTripCode",
        "totalQuantity", "inboundQuantity", "outboundQuantity", "remainingQuantity",
        "totalWeight", "totalVolume", "goodsDescription", "notes", "province",
        "isExternalVehicleNeeded", "createdAt", "updatedAt"
      ) VALUES (
        $1, 'STORED', $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, 0, $11,
        $12, $13, $14, $15, $16,
        false, NOW(), NOW()
      ) RETURNING id
    `, [
      orderCode,
      `${hcmHub.name} -> ${item.deliveryAddress}`,
      hcmHub.name,
      item.deliveryAddress,
      hcmHubId,
      hcmHubId,
      hcmHubId,
      null, // Đang lưu kho, không còn trên xe
      item.totalQuantity,
      item.totalQuantity,
      item.totalQuantity,
      item.totalWeight,
      item.totalVolume,
      item.goodsDescription,
      item.notes,
      item.province,
    ]);

    const orderId = orderInsertRes.rows[0].id;

    // Insert OrderInventoryTransaction (Phiếu nhập kho ban đầu)
    await client.query(`
      INSERT INTO "order_inventory_transaction" (
        "orderId", "type", "quantity", "remainingQuantity",
        "weight", "volume", "licensePlate", "driverName",
        "destination", "invoiceCode", "hubId", "tripCode",
        "expectedQuantity", "discrepancyQuantity", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, 'INBOUND', $2, $3,
        $4, $5, '59C-TON.KHO', 'Giao tồn ban đầu',
        $6, $7, $8, $9,
        $10, 0, 'Tiếp nhận tồn kho ban đầu',
        NOW(), NOW()
      )
    `, [
      orderId,
      item.totalQuantity,
      item.totalQuantity,
      item.totalWeight,
      item.totalVolume,
      hcmHub.name,
      invoiceCode,
      hcmHubId,
      tripCode,
      item.totalQuantity,
    ]);

    // Insert Trip (Chuyến xe tiếp nhận lúc vào cổng kho)
    await client.query(`
      INSERT INTO "trip" (
        "orderId", "tripCode", "licensePlate", "driverName",
        "status", "originHubId", "destinationHubId", "type",
        "weightAllocated", "volumeAllocated", "quantityAllocated",
        "sequenceNumber", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, '59C-TON.KHO', 'Giao tồn ban đầu',
        'COMPLETED', $3, $4, 'INBOUND',
        $5, $6, $7,
        1, 'Chuyến xe nhập tồn kho ban đầu',
        NOW(), NOW()
      )
    `, [
      orderId,
      tripCode,
      hcmHubId,
      hcmHubId,
      item.totalWeight,
      item.totalVolume,
      item.totalQuantity,
    ]);

    orderCount++;
  }

  // Tạo TripStop cho chuyến xe
  await client.query(`
    INSERT INTO "trip_stop" (
      "tripCode", "hubId", "stopSequence", "stopType", "status",
      "processedAt", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, 1, 'DESTINATION', 'COMPLETED',
      NOW(), NOW(), NOW()
    ) ON CONFLICT DO NOTHING
  `, [tripCode, hcmHubId]);

  // Cập nhật lại counter nếu nạp mã tự sinh
  await client.query(`
    INSERT INTO "order_code_counter" ("prefix", "yearMonth", "lastSequence", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT ("prefix", "yearMonth")
    DO UPDATE SET "lastSequence" = GREATEST("order_code_counter"."lastSequence", EXCLUDED."lastSequence"),
                  "updatedAt" = NOW()
  `, [hcmPrefix, yymm, orderCount]);

  await client.query('COMMIT');

  console.log(`\n🎉 THÀNH CÔNG! Đã nạp ${orderCount} đơn hàng vào kho Andromeda - HCM!`);
  console.log(`   - Trạng thái: STORED (Đang lưu kho)`);
  console.log(`   - Vị trí hiện tại: Andromeda Hub - HCM (hubId: ${hcmHubId})`);
  console.log(`   - Phiếu nhập kho: ${invoiceCode}`);
  console.log(`   - Chuyến tiếp nhận: ${tripCode}`);

} catch (err) {
  await client.query('ROLLBACK');
  console.error('\n❌ GẶP LỖI KHI NẠP DỮ LIỆU. ĐÃ ROLLBACK AN TOÀN!', err);
  process.exit(1);
} finally {
  await client.end();
}
