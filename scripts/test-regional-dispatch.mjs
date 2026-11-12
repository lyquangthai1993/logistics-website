#!/usr/bin/env node
/**
 * scripts/test-regional-dispatch.mjs
 * Test verification for Regional Dispatch Capacity Report & Cronjob
 */
import http from 'node:http';

const hardTimeout = setTimeout(() => {
  console.error('\n🚨 [TIMEOUT] Script timed out');
  process.exit(1);
}, 15000);
hardTimeout.unref();

async function main() {
  console.log('1. Logging in as SUPER_ADMIN...');
  const loginRes = await fetch('http://localhost:4001/api/v1/auth/email/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lyquangthai1993+1@gmail.com', password: 'secret' }),
    signal: AbortSignal.timeout(8000),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log('✅ Logged in successfully. Token acquired.');

  console.log('\n2. Testing GET /api/v1/admin/reports/regional-dispatch...');
  const reportRes = await fetch('http://localhost:4001/api/v1/admin/reports/regional-dispatch', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!reportRes.ok) {
    console.error('❌ Report fetch failed:', reportRes.status, await reportRes.text());
    process.exit(1);
  }

  const raw = await reportRes.json();
  const reportData = raw.data || raw;
  console.log('✅ Report fetched successfully!');
  console.log('📊 Hub:', reportData.hub.name);
  console.log('📅 Date:', reportData.reportDate);
  console.log('⏰ Cron Info:', JSON.stringify(reportData.cronInfo));
  console.log('\n--- TỔNG HỢP 3 MIỀN ---');
  console.log('🟦 MIỀN BẮC :', reportData.regions.north.totalWeightTons, 'Tấn | Sẵn kho:', reportData.regions.north.onhandWeightTons, '| Sắp về:', reportData.regions.north.incomingWeightTons, '| Đề xuất:', reportData.regions.north.recommendedVehicle);
  console.log('🟧 MIỀN TRUNG:', reportData.regions.central.totalWeightTons, 'Tấn | Sẵn kho:', reportData.regions.central.onhandWeightTons, '| Sắp về:', reportData.regions.central.incomingWeightTons, '| Đề xuất:', reportData.regions.central.recommendedVehicle);
  console.log('🟪 MIỀN NAM  :', reportData.regions.south.totalWeightTons, 'Tấn | Sẵn kho:', reportData.regions.south.onhandWeightTons, '| Sắp về:', reportData.regions.south.incomingWeightTons, '| Đề xuất:', reportData.regions.south.recommendedVehicle);
  console.log('⚠️ CHƯA PHÂN MIỀN (N/A):', reportData.regions.na.totalWeightTons, 'Tấn');

  console.log('\n📋 Quick Snippet Miền Bắc:');
  console.log(reportData.regions.north.quickSnippet);

  console.log('\n3. Testing POST /api/v1/admin/reports/regional-dispatch/sync (Manual sync / Force Cron)...');
  const syncRes = await fetch('http://localhost:4001/api/v1/admin/reports/regional-dispatch/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(8000),
  });

  if (!syncRes.ok) {
    console.error('❌ Sync failed:', syncRes.status, await syncRes.text());
    process.exit(1);
  }

  const syncData = await syncRes.json();
  console.log('✅ Sync executed successfully:', syncData);

  console.log('\n4. Testing RBAC: Calling endpoint with Non-SuperAdmin (DISPATCHER)...');
  const dispLoginRes = await fetch('http://localhost:4001/api/v1/auth/email/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lyquangthai1993+2@gmail.com', password: 'secret' }),
    signal: AbortSignal.timeout(8000),
  });

  if (dispLoginRes.ok) {
    const dispData = await dispLoginRes.json();
    const dispToken = dispData.data?.token || dispData.token;
    const forbiddenRes = await fetch('http://localhost:4001/api/v1/admin/reports/regional-dispatch', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${dispToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (forbiddenRes.status === 403) {
      console.log('✅ RBAC Guard PASSED: DISPATCHER was correctly blocked with HTTP 403 Forbidden!');
    } else {
      console.error('❌ RBAC Guard failed: Expected 403 Forbidden, got', forbiddenRes.status);
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL TESTS PASSED 100%!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in test:', err);
  process.exit(1);
});
