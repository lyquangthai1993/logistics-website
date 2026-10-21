#!/usr/bin/env node
/**
 * scripts/order-audit-agent.mjs
 *
 * Agent Điều Tra Lịch Sử & Thao Tác Đơn Hàng (Order Audit & Investigation Agent)
 *
 * Tính năng:
 *   - Quét toàn diện lịch sử biến động kho và thao tác của người dùng theo mã vận đơn (orderCode).
 *   - Đối chiếu số lượng thực tế giữa Sổ cái giao dịch (order_inventory_transaction) và Bảng đơn hàng (order).
 *   - Phát hiện các giao dịch nhập nhầm đã bị hủy / rollback (soft-delete).
 *   - Xuất timeline trực quan, chi tiết ai làm gì, khi nào, lý do gì.
 *   - Cung cấp tùy chọn tự động sửa số liệu sai lệch: --fix.
 *
 * Cách sử dụng:
 *   node scripts/order-audit-agent.mjs NDA2610-0213
 *   node scripts/order-audit-agent.mjs NDA2610-0213 --fix
 *   npm run order:audit NDA2610-0213
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const hardTimeout = setTimeout(() => {
  console.error('\n🚨 [TIMEOUT] order-audit-agent.mjs vượt quá giới hạn 15s. Tự động thoát.');
  process.exit(1);
}, 15000);
hardTimeout.unref();

let Client;
try {
  Client = require('pg').Client;
} catch {
  const pgToolsPath = path.resolve(rootDir, 'tools/telegram-task-runner/node_modules/pg');
  Client = require(pgToolsPath).Client;
}

const DEV_DB_URL =
  process.env.DEV_DATABASE_URL ||
  'postgresql://postgres:logistics_tms_2026_pwd@junction.proxy.rlwy.net:31094/logistics_tms_core';

const args = process.argv.slice(2);
const orderCode = args.find((a) => !a.startsWith('--'))?.trim();
const shouldFix = args.includes('--fix');

if (!orderCode) {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║              TMS ORDER AUDIT & INVESTIGATION AGENT                   ║
╚══════════════════════════════════════════════════════════════════════╝
Cách sử dụng:
  node scripts/order-audit-agent.mjs <orderCode> [--fix]
Ví dụ:
  node scripts/order-audit-agent.mjs NDA2610-0213
  node scripts/order-audit-agent.mjs NDA2610-0213 --fix
  `);
  process.exit(0);
}

function fmtDate(d) {
  if (!d) return '--';
  const dt = new Date(d);
  return dt.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function run() {
  const client = new Client({
    connectionString: DEV_DB_URL,
    ssl: false,
  });

  try {
    await client.connect();

    console.log(`\n🔍 [AGENT] Đang điều tra mã vận đơn: "${orderCode}" trên Database Dev...`);

    // 1. Quét thông tin đơn hàng
    const resOrders = await client.query(
      `SELECT id, "orderCode", "goodsDescription", "totalQuantity", "inboundQuantity", 
              "outboundQuantity", "remainingQuantity", status, "currentHubId", "originHubId",
              "destinationHubId", "destinationHub", "createdAt", "updatedAt", "deletedAt"
       FROM "order"
       WHERE "orderCode" ILIKE $1
       ORDER BY id ASC`,
      [`%${orderCode}%`]
    );

    if (resOrders.rows.length === 0) {
      console.log(`❌ Không tìm thấy đơn hàng nào khớp với mã "${orderCode}".`);
      return;
    }

    const activeOrder = resOrders.rows.find((r) => r.deletedAt === null) || resOrders.rows[0];
    const orderIds = resOrders.rows.map((r) => r.id);

    // 2. Quét toàn bộ giao dịch biến động kho
    const resTxs = await client.query(
      `SELECT id, "orderId", type, quantity, "remainingQuantity", "tripCode", "hubId",
              "invoiceCode", "licensePlate", "driverName", destination, notes,
              "deletedAt", "createdAt"
       FROM order_inventory_transaction
       WHERE "orderId" = ANY($1::int[])
       ORDER BY "createdAt" ASC`,
      [orderIds]
    );

    // 3. Quét nhật ký thao tác người dùng (Audit Logs)
    const resLogs = await client.query(
      `SELECT id, "orderId", "orderCode", action, "actorUserId", "actorEmail", "actorRole",
              "hubName", "tripCode", quantity, reason, "oldValues", "newValues", metadata, "createdAt"
       FROM order_activity_log
       WHERE "orderCode" ILIKE $1 OR "orderId" = ANY($2::int[])
       ORDER BY "createdAt" ASC`,
      [`%${orderCode}%`, orderIds]
    ).catch(() => ({ rows: [] }));

    // 4. Tính toán Sổ Cái Thực Tế
    const activeTxs = resTxs.rows.filter((t) => t.deletedAt === null);
    const deletedTxs = resTxs.rows.filter((t) => t.deletedAt !== null);

    const activeInbound = activeTxs
      .filter((t) => t.type === 'INBOUND')
      .reduce((s, t) => s + (Number(t.quantity) || 0), 0);

    const activeOutbound = activeTxs
      .filter((t) => t.type === 'OUTBOUND' || t.type === 'TRANSFER')
      .reduce((s, t) => s + (Number(t.quantity) || 0), 0);

    const ledgerStock = Math.max(0, activeInbound - activeOutbound);

    const dbTotal = Number(activeOrder.totalQuantity) || 0;
    const dbInbound = Number(activeOrder.inboundQuantity) || 0;
    const dbOutbound = Number(activeOrder.outboundQuantity) || 0;
    const dbRemaining = Number(activeOrder.remainingQuantity) || 0;

    const isMatch =
      dbInbound === activeInbound &&
      dbOutbound === activeOutbound &&
      dbRemaining === ledgerStock;

    // 5. In Báo Cáo
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║               KẾT QUẢ ĐIỀU TRA ĐƠN HÀNG: ${activeOrder.orderCode.padEnd(20)}        ║
╚══════════════════════════════════════════════════════════════════════════════╝

📌 THÔNG TIN ĐƠN HÀNG HIỆN TẠI (ID: ${activeOrder.id}):
  • Tên hàng          : ${activeOrder.goodsDescription || 'N/A'}
  • Trạng thái        : ${activeOrder.status}
  • Điểm đến          : ${activeOrder.destinationHub || 'N/A'}
  • Thời gian tạo     : ${fmtDate(activeOrder.createdAt)}
  • Cập nhật lần cuối : ${fmtDate(activeOrder.updatedAt)}

📊 ĐỐI SOÁT SỐ LƯỢNG (DB vs SỔ CÁI GIAO DỊCH THỰC TẾ):
  ┌───────────────────────┬──────────────┬──────────────────┬──────────────┐
  │ Chỉ Số                │ Bảng Order   │ Sổ Cái Thực Tế   │ Trạng Thái   │
  ├───────────────────────┼──────────────┼──────────────────┼──────────────┤
  │ Tổng Nhập (Kiện)      │ ${String(dbInbound).padEnd(12)} │ ${String(activeInbound).padEnd(16)} │ ${dbInbound === activeInbound ? '✅ KHỚP' : '❌ LỆCH'}       │
  │ Tổng Xuất (Kiện)      │ ${String(dbOutbound).padEnd(12)} │ ${String(activeOutbound).padEnd(16)} │ ${dbOutbound === activeOutbound ? '✅ KHỚP' : '❌ LỆCH'}       │
  │ Tồn Khả Dụng (Kiện)   │ ${String(dbRemaining).padEnd(12)} │ ${String(ledgerStock).padEnd(16)} │ ${dbRemaining === ledgerStock ? '✅ KHỚP' : '❌ LỆCH'}       │
  │ Tổng Hợp Đồng (Kiện)  │ ${String(dbTotal).padEnd(12)} │ ${String(activeInbound).padEnd(16)} │ ${dbTotal === activeInbound ? '✅ CHUẨN' : '⚠️ LỆCH'}       │
  └───────────────────────┴──────────────┴──────────────────┴──────────────┘
    `);

    // 6. Timeline Biến Động Kho & Nhật Ký Thao Tác
    console.log(`📑 LỊCH SỬ BIẾN ĐỘNG KHO (TỔNG ${resTxs.rows.length} GIAO DỊCH):`);
    let runningBalance = 0;
    resTxs.rows.forEach((tx, idx) => {
      const isDel = tx.deletedAt !== null;
      const isIn = tx.type === 'INBOUND';
      const qtyChange = isIn ? Number(tx.quantity) : -Number(tx.quantity);
      if (!isDel) {
        runningBalance += qtyChange;
      }
      const tag = isDel
        ? '❌ [ĐÃ HỦY / ROLLBACK]'
        : isIn
          ? '📥 [NHẬP KHO]'
          : '📤 [XUẤT KHO]';

      console.log(
        `  ${String(idx + 1).padStart(2, '0')}. ${tag.padEnd(24)} | Mã phiếu: ${(tx.invoiceCode || '--').padEnd(18)} | Chuyến: ${(tx.tripCode || '--').padEnd(8)} | Biển số: ${(tx.licensePlate || '--').padEnd(12)} | Số lượng: ${(isIn ? '+' : '-') + tx.quantity} kiện | Tồn luỹ kế: ${isDel ? '(Đã hủy)' : runningBalance + ' kiện'} | Thời gian: ${fmtDate(tx.createdAt)}`
      );
      if (isDel) {
        console.log(`      ↳ ⚠️ Giao dịch này đã bị hủy/rollback lúc: ${fmtDate(tx.deletedAt)}`);
      }
      if (tx.notes) {
        console.log(`      ↳ Ghi chú: ${tx.notes}`);
      }
    });

    if (resLogs.rows.length > 0) {
      console.log(`\n🛡️ NHẬT KÝ THAO TÁC CỦA NGƯỜI DÙNG (AUDIT LOGS - ${resLogs.rows.length} BẢN GHI):`);
      resLogs.rows.forEach((log, idx) => {
        console.log(
          `  ${String(idx + 1).padStart(2, '0')}. [${log.action}] | Người thực hiện: ${log.actorEmail || 'Hệ thống'} (${log.actorRole || 'N/A'}) | Thời gian: ${fmtDate(log.createdAt)}`
        );
        if (log.reason) {
          console.log(`      ↳ Lý do: ${log.reason}`);
        }
        if (log.oldValues && log.newValues) {
          console.log(
            `      ↳ Biến động số liệu: Nhập ${log.oldValues.inboundQuantity ?? '--'} → ${log.newValues.inboundQuantity ?? '--'} | Tồn ${log.oldValues.remainingQuantity ?? '--'} → ${log.newValues.remainingQuantity ?? '--'}`
          );
        }
      });
    }

    // 7. Kết luận & Đề xuất
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (isMatch) {
      console.log(`🎯 KẾT LUẬN: Số liệu tồn kho hiện tại trên hệ thống HOÀN TOÀN CHUẨN XÁC.`);
      console.log(`   Tồn kho thực tế sẵn sàng giao nhận: ${ledgerStock} kiện.`);
    } else {
      console.log(`⚠️ PHÁT HIỆN SAI LỆCH:`);
      console.log(`   Bảng Order đang lưu tồn: ${dbRemaining} kiện, nhưng thực tế sổ cái chỉ còn: ${ledgerStock} kiện.`);
      if (shouldFix) {
        console.log(`\n🔧 [TỰ ĐỘNG SỬA] Đang hiệu chỉnh bản ghi Order ID ${activeOrder.id}...`);
        await client.query(
          `UPDATE "order"
           SET "totalQuantity" = $1,
               "inboundQuantity" = $2,
               "outboundQuantity" = $3,
               "remainingQuantity" = $4,
               "status" = 'INBOUND',
               "updatedAt" = NOW()
           WHERE id = $5`,
          [activeInbound, activeInbound, activeOutbound, ledgerStock, activeOrder.id]
        );
        await client.query(
          `INSERT INTO "order_activity_log"
           ("orderId", "orderCode", "action", "actorUserId", "actorEmail", "actorRole", "hubId", "hubName", "oldValues", "newValues", "quantity", "reason")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            activeOrder.id,
            activeOrder.orderCode,
            'DATA_RECONCILED',
            1,
            'order-audit-agent@spider-express.vn',
            'CLI_AGENT',
            activeOrder.currentHubId || activeOrder.originHubId || 1,
            activeOrder.currentHubEntity?.name || activeOrder.originHub || 'N/A Hub',
            JSON.stringify({ totalQuantity: dbTotal, inboundQuantity: dbInbound, remainingQuantity: dbRemaining }),
            JSON.stringify({ totalQuantity: activeInbound, inboundQuantity: activeInbound, remainingQuantity: ledgerStock }),
            ledgerStock,
            'Agent tự động tái đồng bộ số liệu theo sổ cái giao dịch hợp lệ'
          ]
        );
        console.log(`✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG! Chạy lại lệnh không có cờ --fix để kiểm tra kết quả.`);
      } else {
        console.log(`   👉 Chạy lệnh với cờ --fix để tự động đồng bộ lại:`);
        console.log(`      node scripts/order-audit-agent.mjs ${orderCode} --fix`);
      }
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (err) {
    console.error('Lỗi khi điều tra đơn hàng:', err);
  } finally {
    await client.end();
  }
}

run();
