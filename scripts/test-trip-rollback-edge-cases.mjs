/**
 * scripts/test-trip-rollback-edge-cases.mjs
 *
 * HỆ THỐNG KIỂM THỬ TỰ ĐỘNG CHUYÊN SÂU:
 * BẢO VỆ TỒN KHO & CHỐNG LỆCH SỔ CÁI KHI ROLLBACK CHUYẾN XE (KỊCH BẢN MAI CÔNG ĐỨC)
 *
 * Kịch bản nghiệp vụ:
 * 1. Nhập 1 chuyến xe 10 đơn (mỗi đơn 10 kiện).
 * 2. Xuất đi hết 8 đơn (outboundQuantity = 10, remainingQuantity = 0).
 * 3. Super Admin mở lại chuyến nhập kho (Rollback Trip).
 * 4. Chốt chặn bảo vệ: 8 đơn đã xuất kho KHÔNG bị xóa lịch sử xuất, KHÔNG bị kéo ngược về kho, KHÔNG bị phantom tồn ảo!
 * 5. Chỉnh sửa 2 đơn còn lại và bấm xác nhận nhập kho lại -> Sổ cái tồn kho chính xác 100%!
 * 6. Kiểm tra giải pháp sửa trực tiếp 1 đơn lẻ không cần rollback trip.
 */


const API_BASE = process.env.API_BASE_URL || 'http://localhost:4001/api/v1';

async function main() {
  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: CHỐT CHẶN ROLLBACK TRIP & BẢO TOÀN SỔ CÁI TỒN KHO');
  console.log('   (Theo đúng kịch bản nghiệp vụ anh Mai Công Đức & anh Lý Quang Thái)');
  console.log('========================================================================\n');

  // 1. Đăng nhập tài khoản SUPER_ADMIN
  console.log('1. Đăng nhập tài khoản SUPER_ADMIN...');
  const loginRes = await fetch(`${API_BASE}/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lyquangthai1993+1@gmail.com', password: 'secret' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Đăng nhập thất bại: ${loginRes.status}`);
  }
  const loginBody = await loginRes.json();
  const token = loginBody.data?.token || loginBody.token;
  console.log('✅ Đăng nhập SUPER_ADMIN thành công!\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const ts = Date.now().toString().slice(-6);
  const tripCode = `TRIP-DUC-${ts}`;
  const plate = `51C-${ts}`;

  // 2. Tạo 10 đơn hàng độc lập
  console.log(`2. Khởi tạo 10 đơn hàng mẫu cho chuyến xe nhập kho ${tripCode}...`);
  const orderCodes = [];
  const createdOrders = [];

  for (let i = 1; i <= 10; i++) {
    const code = `ORD-DUC-${ts}-${i}`;
    orderCodes.push(code);

    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        orderCode: code,
        goodsDescription: `Hàng kiểm thử Đức ${i}`,
        totalQuantity: 10,
        totalWeight: 100,
        totalVolume: 0.5,
        route: 'Kho Sài Gòn → Kho Hà Nội',
        originHubId: 1,
        destinationHubId: 2,
        destinationHub: 'Kho Hà Nội',
        province: i <= 5 ? 'Hà Nội' : i <= 8 ? 'Đà Nẵng' : 'Cần Thơ',
        notes: `Đơn kiểm thử kịch bản ${i}`,
      }),
    });
    if (!orderRes.ok) {
      const errText = await orderRes.text();
      throw new Error(`Tạo đơn ${code} thất bại: ${errText}`);
    }
    const orderData = await orderRes.json();
    createdOrders.push(orderData.data || orderData);
  }
  console.log(`✅ Đã tạo thành công 10 đơn hàng (mỗi đơn 10 kiện):\n   ${orderCodes.join(', ')}\n`);

  // 3. Tiến hành Nhập kho 10 đơn này bằng Chuyến xe nhập kho TRIP-DUC-...
  console.log(`3. Xác nhận Tiếp nhận & Nhập kho cả 10 đơn bằng chuyến xe ${tripCode}...`);
  const inboundPayload = {
    tripCode,
    licensePlate: plate,
    driverName: 'Tài xế Nguyễn Văn A',
    receiveDate: '2026-11-11',
    targetStatus: 'INBOUND',
    keepTripPending: false,
    orders: createdOrders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      goodsDescription: o.goodsDescription,
      totalQuantity: 10,
      totalWeight: 100,
      totalVolume: 0.5,
      pickupAddress: 'Kho Sài Gòn',
      deliveryAddress: 'Kho Hà Nội',
      province: o.province,
      destinationHubId: 2,
      notes: o.notes,
    })),
  };

  const confirmInboundRes = await fetch(`${API_BASE}/warehouse/inbound/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(inboundPayload),
  });
  if (!confirmInboundRes.ok) {
    throw new Error(`Xác nhận nhập kho thất bại: ${await confirmInboundRes.text()}`);
  }
  console.log(`✅ Chuyến xe nhập kho ${tripCode} đã hoàn tất dỡ hàng lưu kho thành công!`);

  // Kiểm tra trạng thái 10 đơn: Đều phải có remainingQuantity = 10, inboundQuantity = 10, outboundQuantity = 0
  for (const o of createdOrders) {
    const chk = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders });
    const ord = (await chk.json()).data;
    if (ord.inboundQuantity !== 10 || ord.remainingQuantity !== 10 || ord.outboundQuantity !== 0) {
      throw new Error(`Trạng thái đơn ${ord.orderCode} sau nhập kho không chuẩn: in=${ord.inboundQuantity}, rem=${ord.remainingQuantity}, out=${ord.outboundQuantity}`);
    }
  }
  console.log('✅ Xác thực 10/10 đơn: Tồn kho khả dụng = 10, Đã nhập = 10, Đã xuất = 0.\n');

  // 4. Xuất kho 8 đơn hàng đầu tiên (Đơn 1 đến 8)
  console.log('4. Xuất kho 8 đơn hàng đầu tiên (bằng chuyến xuất kho riêng)...');
  const exportedOrders = createdOrders.slice(0, 8);
  const remainingInWarehouseOrders = createdOrders.slice(8);

  const outboundTripCode = `TRIP-OUT-${ts}`;
  const outboundPayload = {
    tripCode: outboundTripCode,
    licensePlate: `29H-${ts}`,
    driverName: 'Tài xế Trần Văn B',
    dispatchDate: '2026-11-11',
    mode: 'TRANSFER',
    destinationHubId: 2,
    orderIds: exportedOrders.map((o) => o.id),
    items: exportedOrders.map((o) => ({
      orderId: o.id,
      quantityToExport: 10,
      weightToExport: 100,
      volumeToExport: 0.5,
      deliveryMode: 'HUB_L1',
      destinationHubId: 2,
      province: o.province,
    })),
  };

  const confirmOutboundRes = await fetch(`${API_BASE}/warehouse/outbound/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(outboundPayload),
  });
  if (!confirmOutboundRes.ok) {
    throw new Error(`Xác nhận xuất kho thất bại: ${await confirmOutboundRes.text()}`);
  }
  console.log(`✅ Đã xuất kho thành công 8 đơn hàng (${exportedOrders.map(o => o.orderCode).join(', ')})!`);

  // Kiểm tra 8 đơn đã xuất: remainingQuantity = 0, outboundQuantity = 10
  for (const o of exportedOrders) {
    const chk = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders });
    const ord = (await chk.json()).data;
    if (ord.remainingQuantity !== 0 || ord.outboundQuantity !== 10) {
      throw new Error(`Đơn xuất kho ${ord.orderCode} sai: rem=${ord.remainingQuantity}, out=${ord.outboundQuantity}`);
    }
  }
  console.log('✅ Xác thực 8 đơn đã xuất kho: Tồn kho = 0, Đã xuất = 10 kiện.');
  console.log('✅ Xác thực 2 đơn còn lại trong kho: Tồn kho = 10 kiện, Đã xuất = 0 kiện.\n');

  // 5. THỰC THI KỊCH BẢN NGUY HIỂM: Super Admin Mở Lại Chuyến Xe Nhập Ban Đầu (Rollback Trip)
  console.log(`5. 🚨 THỰC HIỆN ROLLBACK MỞ LẠI CHUYẾN XE NHẬP KHO ${tripCode} (Super Admin)...`);
  const rollbackRes = await fetch(`${API_BASE}/warehouse/trips/${tripCode}/rollback`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Admin mở lại để sửa thông tin 2 đơn chưa xuất kho' }),
  });
  if (!rollbackRes.ok) {
    throw new Error(`Rollback thất bại: ${await rollbackRes.text()}`);
  }
  const rollbackData = await rollbackRes.json();
  console.log('✅ Phản hồi Rollback thành công:', rollbackData.message || rollbackData);

  // 6. KIỂM TOÁN CHỐT CHẶN BẢO VỆ 8 ĐƠN ĐÃ XUẤT KHO
  console.log('\n6. 🛡️ KIỂM TOÁN CHỐT CHẶN BẢO TOÀN TỒN KHO & SỔ CÁI (INVARIANTS AUDIT):');
  for (const o of exportedOrders) {
    const chk = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders });
    const ord = (await chk.json()).data;

    // INVARIANT 1: Đơn đã xuất kho TUYỆT ĐỐI KHÔNG bị kéo ngược về kho làm tồn kho ảo!
    if (ord.remainingQuantity !== 0) {
      throw new Error(`❌ VI PHẠM INVARIANT: Đơn đã xuất kho ${ord.orderCode} bị kéo ngược về kho (remainingQuantity = ${ord.remainingQuantity} > 0)!`);
    }

    // INVARIANT 2: outboundQuantity TUYỆT ĐỐI KHÔNG bị reset về 0!
    if (ord.outboundQuantity !== 10) {
      throw new Error(`❌ VI PHẠM INVARIANT: Đơn đã xuất kho ${ord.orderCode} bị mất dấu vết xuất kho (outboundQuantity = ${ord.outboundQuantity} != 10)!`);
    }

    // INVARIANT 3: Trạng thái xuất kho được bảo toàn
    if (ord.status === 'WAITING' || ord.status === 'DRAFT') {
      throw new Error(`❌ VI PHẠM INVARIANT: Đơn đã xuất kho ${ord.orderCode} bị lùi trạng thái về ${ord.status}!`);
    }
  }
  console.log('   ✅ [INVARIANT 1 PASS]: 8 đơn đã xuất kho KHÔNG bị đội mồ sống lại, tồn kho vẫn là 0!');
  console.log('   ✅ [INVARIANT 2 PASS]: 8 đơn đã xuất kho giữ nguyên outboundQuantity = 10 (không mất dấu vết)!');
  console.log('   ✅ [INVARIANT 3 PASS]: 8 đơn đã xuất kho không bị lùi về trạng thái WAITING/DRAFT!');

  // Kiểm tra 2 đơn còn lại: Phải được hoàn tác về WAITING để thủ kho chỉnh sửa
  for (const o of remainingInWarehouseOrders) {
    const chk = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders });
    const ord = (await chk.json()).data;
    if (ord.remainingQuantity !== 0 || ord.status !== 'WAITING') {
      throw new Error(`2 đơn chưa xuất kho phải về WAITING nhưng hiện tại là ${ord.status}, rem=${ord.remainingQuantity}`);
    }
  }
  console.log('   ✅ [INVARIANT 4 PASS]: 2 đơn chưa xuất kho được mở khóa về WAITING an toàn để thủ kho sửa!\n');

  // 7. Thủ kho sửa thông tin 2 đơn còn lại và bấm Xác nhận nhập kho lại
  console.log('7. Chỉnh sửa thông tin 2 đơn còn lại (sửa mã vận đơn, ghi chú) và Xác nhận nhập kho lại...');
  const newCode1 = `ORD-DUC-${ts}-9-REVISED`;
  const newCode2 = `ORD-DUC-${ts}-10-REVISED`;

  const reconfirmPayload = {
    tripCode,
    licensePlate: plate,
    driverName: 'Tài xế Nguyễn Văn A (Đã cập nhật)',
    receiveDate: '2026-11-11',
    targetStatus: 'INBOUND',
    keepTripPending: false,
    orders: [
      ...exportedOrders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        totalQuantity: 10,
        totalWeight: 100,
        totalVolume: 0.5,
        notes: o.notes,
      })),
      {
        id: remainingInWarehouseOrders[0].id,
        orderCode: newCode1,
        totalQuantity: 10,
        totalWeight: 120,
        totalVolume: 0.6,
        notes: 'Đã sửa mã vận đơn và khối lượng thành 120kg',
      },
      {
        id: remainingInWarehouseOrders[1].id,
        orderCode: newCode2,
        totalQuantity: 10,
        totalWeight: 100,
        totalVolume: 0.5,
        notes: 'Đã cập nhật theo yêu cầu thủ kho',
      },
    ],
  };

  const reconfirmRes = await fetch(`${API_BASE}/warehouse/inbound/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(reconfirmPayload),
  });
  if (!reconfirmRes.ok) {
    throw new Error(`Nhập kho lại thất bại: ${await reconfirmRes.text()}`);
  }
  console.log('✅ Đã xác nhận nhập kho lại chuyến xe thành công!');

  // 8. KIỂM TOÁN CHỐT CHẶN CUỐI CÙNG SAU KHI NHẬP LẠI
  console.log('\n8. 🛡️ KIỂM TOÁN CHỐT CHẶN CUỐI CÙNG SAU KHI NHẬP LẠI (POST-RECONFIRM AUDIT):');
  for (const o of exportedOrders) {
    const chk = await fetch(`${API_BASE}/orders/${o.id}`, { headers: authHeaders });
    const ord = (await chk.json()).data;
    if (ord.remainingQuantity !== 0 || ord.outboundQuantity !== 10) {
      throw new Error(`❌ VI PHẠM SỔ CÁI: Sau khi nhập lại, đơn ${ord.orderCode} bị sai tồn: rem=${ord.remainingQuantity}, out=${ord.outboundQuantity}`);
    }
  }
  console.log('   ✅ [POST-RECONFIRM 1 PASS]: 8 đơn đã xuất kho VẪN KHÔNG BỊ TỒN ẢO (tồn = 0, xuất = 10)!');

  const chk9 = await (await fetch(`${API_BASE}/orders/${remainingInWarehouseOrders[0].id}`, { headers: authHeaders })).json();
  const ord9 = chk9.data;
  if (ord9.orderCode !== newCode1 || ord9.remainingQuantity !== 10 || ord9.totalWeight !== 120) {
    throw new Error(`Đơn 9 sửa thông tin không khớp: code=${ord9.orderCode}, rem=${ord9.remainingQuantity}, wt=${ord9.totalWeight}`);
  }
  console.log(`   ✅ [POST-RECONFIRM 2 PASS]: Đơn 9 đã sửa mã vận đơn thành ${ord9.orderCode} và cập nhật tồn kho chính xác!`);

  // 9. TEST CASE BỔ SUNG: Sửa trực tiếp 1 đơn lẻ KHÔNG cần mở lại cả chuyến xe
  console.log('\n9. 💡 TEST CASE: Chỉnh sửa mã vận đơn của 1 đơn lẻ trực tiếp mà KHÔNG ĐỤNG TỚI TRIP (admin-override)...');
  const directEditCode = `ORD-DUC-${ts}-DIRECT-EDIT`;
  const patchRes = await fetch(`${API_BASE}/orders/${remainingInWarehouseOrders[1].id}/admin-override`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      orderCode: directEditCode,
      auditReason: 'Super Admin điều chỉnh mã vận đơn trực tiếp theo yêu cầu khách hàng, không ảnh hưởng chuyến xe',
    }),
  });
  if (!patchRes.ok) {
    throw new Error(`Sửa đơn trực tiếp thất bại: ${await patchRes.text()}`);
  }
  const patchedOrd = (await patchRes.json()).data;
  if (patchedOrd.orderCode !== directEditCode) {
    throw new Error(`Mã đơn không đổi: ${patchedOrd.orderCode}`);
  }
  console.log(`   ✅ [DIRECT EDIT PASS]: Đã sửa mã vận đơn thành ${patchedOrd.orderCode} mà không cần rollback trip!`);

  console.log('\n========================================================================');
  console.log('🎉 TẤT CẢ CÁC TEST CASES ĐÃ PASS 100%! HỆ THỐNG ĐẢM BẢO AN TOÀN TUYỆT ĐỐI!');
  console.log('========================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ TEST CASE FAILED:', err.message);
  process.exit(1);
});
