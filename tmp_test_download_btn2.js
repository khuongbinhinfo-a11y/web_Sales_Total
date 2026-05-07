require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SESSION_SECRET = process.env.SESSION_SIGNING_SECRET || 'dev-session-secret';
const CUSTOMER_ID = 'cus-1776765450771';
const EMAIL = 'gustavjung24@gmail.com';
const http = require('http');

async function main() {
  // Lấy session đang hoạt động của khách
  const { rows } = await pool.query(
    `SELECT session_id FROM customer_sessions
     WHERE customer_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC NULLS LAST LIMIT 1`,
    [CUSTOMER_ID]
  );
  await pool.end();

  if (!rows.length) {
    console.log('❌ Không có session nào còn hoạt động cho khách này');
    console.log('→ Cần tạo session bằng cách đăng nhập thật tại ungdungthongminh.shop/account');
    return;
  }

  const sessionId = rows[0].session_id;
  console.log(`✅ Tìm được session: ${sessionId}`);

  // Tạo token với session thật
  const payload = {
    scope: 'customer',
    customerId: CUSTOMER_ID,
    email: EMAIL,
    sessionId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedPayload).digest('hex');
  const token = `${encodedPayload}.${signature}`;
  const cookie = `wst_customer_session=${token}`;

  console.log('\n=== TEST NÚT TẢI APP ===');

  const apps = ['app-cap12', 'app-study-12', 'app-bds-website-manager', 'app-prompt-image-video', 'map-pro'];

  for (const appId of apps) {
    process.stdout.write(`[${appId}] POST /api/account/downloads/${appId} ... `);
    const result = await httpPost(`/api/account/downloads/${encodeURIComponent(appId)}`, cookie);
    const d = result.data;
    if (result.status === 200 && d.ok) {
      if (d.action === 'download') {
        console.log(`✅ action=download | href=${d.href} | file=${d.fileName}`);
        // Test thêm: GET ticket URL
        const t = await httpGet(d.href, cookie);
        console.log(`   → GET ticket: HTTP ${t.status} | Location: ${t.location || '(stream download)'}`);
      } else if (d.action === 'website') {
        console.log(`✅ action=website | href=${d.href}`);
      } else if (d.action === 'redirect') {
        console.log(`✅ action=redirect | href=${d.href}`);
      } else {
        console.log(`⚠️  action=${d.action} | ${d.message || JSON.stringify(d)}`);
      }
    } else {
      console.log(`❌ HTTP ${result.status} — ${JSON.stringify(d)}`);
    }
  }
}

function httpPost(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname:'localhost', port:3900, path, method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':0,'Cookie':cookie}
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpGet(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname:'localhost', port:3900, path, method:'GET',
      headers:{'Cookie':cookie}
    }, (res) => {
      res.resume(); // ignore response body
      resolve({ status: res.statusCode, location: res.headers['location'] || null });
    });
    req.on('error', reject);
    req.end();
  });
}

main().catch(e => { console.error(e.message); process.exit(1); });
