// DEEP AUDIT — Download App + R2
// Test: UI → API → manifest → R2 → ticket → stream
require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const { Pool } = require('pg');

const SESSION_SECRET = process.env.SESSION_SIGNING_SECRET || 'dev-session-secret';
const CUSTOMER_ID = 'cus-1776765450771';
const EMAIL = 'gustavjung24@gmail.com';
const BASE = 'http://localhost:3900';

async function getActiveSession() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    `SELECT session_id FROM customer_sessions WHERE customer_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [CUSTOMER_ID]
  );
  await pool.end();
  return rows[0]?.session_id || null;
}

function makeToken(sessionId) {
  const payload = { scope: 'customer', customerId: CUSTOMER_ID, email: EMAIL, sessionId, exp: Date.now() + 7*86400*1000 };
  const enc = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(enc).digest('hex');
  return `${enc}.${sig}`;
}

function httpReq(method, path, cookie, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost', port: 3900, path, method,
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
        'Content-Length': bodyStr ? Buffer.byteLength(bodyStr) : 0
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed, rawBody: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function httpStream(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3900, path, method: 'GET',
      headers: { 'Cookie': cookie }
    }, (res) => {
      let bytes = 0;
      res.on('data', chunk => { bytes += chunk.length; });
      res.on('end', () => resolve({ status: res.statusCode, bytes, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Step 1: R2 env check
  console.log('═══ STEP 1: R2 ENV CHECK ═══');
  const R2_ENABLED = process.env.R2_PRIVATE_ARTIFACTS_ENABLED;
  const R2_ENDPOINT = process.env.R2_BUCKET_ENDPOINT;
  const R2_BUCKET = process.env.R2_BUCKET_NAME;
  const R2_KEY = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET = process.env.R2_SECRET_ACCESS_KEY;
  const R2_PREFIX = process.env.R2_PRIVATE_ARTIFACTS_PREFIX;
  console.log(`R2_PRIVATE_ARTIFACTS_ENABLED = ${R2_ENABLED}`);
  console.log(`R2_BUCKET_ENDPOINT          = ${R2_ENDPOINT || '(empty)'}`);
  console.log(`R2_BUCKET_NAME              = ${R2_BUCKET || '(empty)'}`);
  console.log(`R2_ACCESS_KEY_ID            = ${R2_KEY ? R2_KEY.slice(0,8)+'...' : '(empty)'}`);
  console.log(`R2_SECRET_ACCESS_KEY        = ${R2_SECRET ? R2_SECRET.slice(0,6)+'...' : '(empty)'}`);
  console.log(`R2_PRIVATE_ARTIFACTS_PREFIX = ${R2_PREFIX || '(empty)'}`);
  const r2Active = (R2_ENABLED === 'true' || R2_ENABLED === '1') && R2_ENDPOINT && R2_BUCKET && R2_KEY && R2_SECRET;
  console.log(`→ isR2PrivateArtifactsEnabled() = ${r2Active ? '✅ TRUE' : '❌ FALSE'}\n`);

  // Step 2: session
  console.log('═══ STEP 2: SESSION ═══');
  const sessionId = await getActiveSession();
  if (!sessionId) {
    console.log('❌ Không có session hoạt động trong DB');
    return;
  }
  console.log(`✅ session_id: ${sessionId}`);
  const cookie = `wst_customer_session=${makeToken(sessionId)}`;

  // Step 3: Test GET /api/account/overview
  console.log('\n═══ STEP 3: GET /api/account/overview ═══');
  const overview = await httpReq('GET', '/api/account/overview', cookie);
  if (overview.status !== 200) {
    console.log(`❌ HTTP ${overview.status}: ${JSON.stringify(overview.data)}`);
    return;
  }
  const apps = overview.data?.downloadableApps || [];
  console.log(`✅ downloadableApps count: ${apps.length}`);
  apps.forEach(a => {
    const actionStr = a.action?.type === 'website'
      ? `website → ${a.action.href}`
      : a.action?.type === 'account_download_api'
      ? `account_download_api (button) deliveryState=${a.deliveryState}`
      : `${a.action?.type || 'none'}`;
    console.log(`  [${a.appId}] deliveryType=${a.deliveryType} | deliveryState=${a.deliveryState} | action=${actionStr}`);
  });

  // Step 4: POST /api/account/downloads/:appId for each
  console.log('\n═══ STEP 4: POST /api/account/downloads/:appId ═══');
  const ALL_APPS = ['app-cap12', 'app-study-12', 'app-bds-website-manager', 'app-prompt-image-video', 'map-pro', 'hair-spa-manager'];
  const ticketsToTest = [];

  for (const appId of ALL_APPS) {
    process.stdout.write(`  [${appId}] → `);
    const r = await httpReq('POST', `/api/account/downloads/${encodeURIComponent(appId)}`, cookie);
    if (r.status === 404) {
      console.log(`🚫 404 — khách không có entitlement`);
    } else if (r.status === 401) {
      console.log(`❌ 401 — session invalid`);
    } else if (r.status === 403) {
      console.log(`🔒 403 — ${r.data.message}`);
    } else if (r.status === 200 && r.data.ok) {
      const d = r.data;
      if (d.action === 'website') {
        console.log(`✅ website → ${d.href}`);
      } else if (d.action === 'download') {
        console.log(`✅ download → ticket href=${d.href?.slice(0,60)}... | file=${d.fileName}`);
        ticketsToTest.push({ appId, href: d.href, fileName: d.fileName });
      } else if (d.action === 'redirect') {
        console.log(`✅ redirect → ${d.href}`);
      } else if (d.action === 'manual_delivery') {
        console.log(`❌ manual_delivery (Zalo) — ${d.message}`);
      } else {
        console.log(`⚠️  unknown action=${d.action} | ${JSON.stringify(d)}`);
      }
    } else {
      console.log(`❌ HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    }
  }

  // Step 5: Test ticket → stream
  if (ticketsToTest.length) {
    console.log('\n═══ STEP 5: GET ticket → stream ═══');
    for (const t of ticketsToTest) {
      process.stdout.write(`  [${t.appId}] GET ${t.href?.slice(0,60)}... → `);
      try {
        const s = await httpStream(t.href, cookie);
        const cd = s.headers['content-disposition'] || '';
        const ct = s.headers['content-type'] || '';
        const source = s.headers['x-artifact-source'] || 'r2';
        if (s.status === 200 && s.bytes > 0) {
          console.log(`✅ HTTP 200 | ${(s.bytes/1024/1024).toFixed(1)} MB | source=${source} | ct=${ct.split(';')[0]}`);
        } else if (s.status === 200 && s.bytes === 0) {
          console.log(`⚠️  HTTP 200 nhưng 0 bytes | cd=${cd}`);
        } else {
          console.log(`❌ HTTP ${s.status} | ${s.bytes} bytes`);
        }
      } catch (e) {
        console.log(`💥 ${e.message}`);
      }
    }
  } else {
    console.log('\n═══ STEP 5: Không có ticket nào để test stream ═══');
  }

  // Step 6: Test direct URL blocked
  console.log('\n═══ STEP 6: Direct URL /app-updates/:appId/version.json phải bị block ═══');
  const DIRECT_TEST_APPS = ['app-bds-website-manager', 'map-pro', 'app-prompt-image-video'];
  for (const appId of DIRECT_TEST_APPS) {
    const r = await httpReq('GET', `/app-updates/${appId}/version.json`, cookie);
    const blocked = r.status === 410;
    console.log(`  [${appId}] → HTTP ${r.status} ${blocked ? '✅ BLOCKED' : '⚠️  NOT BLOCKED — ' + JSON.stringify(r.data).slice(0,60)}`);
  }

  console.log('\n═══ AUDIT HOÀN THÀNH ═══');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
