// Test API trực tiếp để kiểm tra R2 download flow
const https = require('https');

async function callApi(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { ...options }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  const BASE = 'www.ungdungthongminh.shop';

  // Step 1: Login
  const loginRes = await callApi(`https://${BASE}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gustavjung24@gmail.com', password: 'Test1234!' })
  });
  console.log('LOGIN:', loginRes.status, JSON.stringify(loginRes.body));

  const cookie = loginRes.headers['set-cookie']?.join('; ') || '';
  if (loginRes.status !== 200) {
    console.log('Login failed - cannot continue');
    return;
  }

  // Step 2: Call downloads API for BDS app
  const dlRes = await callApi(`https://${BASE}/api/account/downloads/app-bds-website-manager`, {
    method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' }
  });
  console.log('DOWNLOAD BDS:', dlRes.status, JSON.stringify(dlRes.body));
}

main().catch(console.error);
