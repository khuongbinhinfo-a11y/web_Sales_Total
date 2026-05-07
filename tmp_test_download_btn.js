// Test click nút tải app — gọi thực tế API POST /api/account/downloads/:appId
// Khách test: gustavjung24@gmail.com (cus-1776765450771) — paid: app-cap12, app-study-12
require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SIGNING_SECRET || 'replace-with-strong-secret';
const CUSTOMER_SESSION_DAYS = 7;
const CUSTOMER_ID = 'cus-1776765450771';
const EMAIL = 'gustavjung24@gmail.com';
const SESSION_ID = 'test-session-001';
const BASE_URL = 'http://localhost:3900';

// Tạo session token (copy từ createCustomerSessionToken trong auth.js)
function createCustomerSessionToken(customerId, email, sessionId) {
  const ttlMs = CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = {
    scope: 'customer',
    customerId,
    email,
    sessionId: sessionId || null,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedPayload).digest('hex');
  return `${encodedPayload}.${signature}`;
}

function httpPost(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3900,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0,
        'Cookie': cookie,
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = createCustomerSessionToken(CUSTOMER_ID, EMAIL, SESSION_ID);
  const cookie = `wst_customer_session=${token}`;
  
  console.log('=== TEST NÚT TẢI APP ===');
  console.log('Khách:', CUSTOMER_ID, '-', EMAIL);
  console.log('Server: http://localhost:3900\n');

  const apps = ['app-cap12', 'app-study-12', 'app-bds-website-manager', 'app-prompt-image-video'];

  for (const appId of apps) {
    process.stdout.write(`[${appId}] POST /api/account/downloads/${appId} ... `);
    try {
      const result = await httpPost(`/api/account/downloads/${encodeURIComponent(appId)}`, cookie);
      const d = result.data;
      if (result.status === 200 && d.ok) {
        if (d.action === 'download') {
          console.log(`✅ action=download | href=${d.href} | file=${d.fileName}`);
        } else if (d.action === 'website') {
          console.log(`✅ action=website | href=${d.href}`);
        } else if (d.action === 'redirect') {
          console.log(`✅ action=redirect | href=${d.href}`);
        } else {
          console.log(`⚠️  action=${d.action} | ${d.message || JSON.stringify(d)}`);
        }
      } else if (result.status === 404) {
        console.log(`🚫 404 — Khách không có entitlement hoặc app không tìm thấy`);
      } else if (result.status === 403) {
        console.log(`🔒 403 — ${d.message}`);
      } else if (result.status === 401) {
        console.log(`❌ 401 — Session không hợp lệ (SECRET mismatch?): ${d.message || d.reason}`);
      } else {
        console.log(`❌ HTTP ${result.status} — ${JSON.stringify(d)}`);
      }
    } catch (e) {
      console.log(`💥 Error: ${e.message}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
