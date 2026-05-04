#!/usr/bin/env node
/**
 * Test single-session enforcement:
 * 1. Create 2 sessions for same customer (different deviceIds)
 * 2. Verify first session is revoked
 * 3. Verify second session is active
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5052';
const TEST_EMAIL = 'test-session@example.com';
const TEST_PASSWORD = 'password123';
const TEST_DEVICE_A = 'TEST-DEVICE-A';
const TEST_DEVICE_B = 'TEST-DEVICE-B';

let sessionIdA = null;
let sessionIdB = null;
let tokenA = null;
let tokenB = null;

async function fetchUrl(path, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET';
    const url = new URL(path, BASE_URL);
    const https_module = url.protocol === 'https:' ? https : http;
    
    const req = https_module.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function test() {
  console.log('\n=== Testing Single-Session Enforcement ===\n');

  try {
    // Step 1: Login Device A
    console.log('📱 [A] Logging in from Device A...');
    const resA = await fetchUrl('/api/auth/customer/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_A,
        deviceName: 'TEST-DEVICE-A'
      }
    });
    
    if (resA.status !== 200) {
      console.error('❌ Device A login failed:', resA.data);
      process.exit(1);
    }
    
    tokenA = resA.data.data?.bridgeToken || resA.data.data?.token;
    console.log('✅ Device A logged in. Token:', tokenA?.slice(0, 20) + '...');
    
    // Step 2: Check Device A can access /api/auth/me
    console.log('\n🔍 [A] Checking /api/auth/me with Device A token...');
    const resCheckA1 = await fetchUrl('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('  Status:', resCheckA1.status);
    if (resCheckA1.status === 200) {
      console.log('✅ Device A session is active');
    } else if (resCheckA1.status === 401) {
      console.error('❌ Device A session revoked unexpectedly:', resCheckA1.data);
      process.exit(1);
    }
    
    // Step 3: Login Device B (should revoke A)
    console.log('\n📱 [B] Logging in from Device B (same customer)...');
    const resB = await fetchUrl('/api/auth/customer/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_B,
        deviceName: 'TEST-DEVICE-B'
      }
    });
    
    if (resB.status !== 200) {
      console.error('❌ Device B login failed:', resB.data);
      process.exit(1);
    }
    
    tokenB = resB.data.data?.bridgeToken || resB.data.data?.token;
    console.log('✅ Device B logged in. Token:', tokenB?.slice(0, 20) + '...');
    
    // Step 4: Check Device B can access /api/auth/me (should work)
    console.log('\n🔍 [B] Checking /api/auth/me with Device B token...');
    const resCheckB = await fetchUrl('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log('  Status:', resCheckB.status);
    if (resCheckB.status === 200) {
      console.log('✅ Device B session is active');
    } else {
      console.error('❌ Device B session should be active:', resCheckB.data);
      process.exit(1);
    }
    
    // Step 5: Check Device A is now revoked
    console.log('\n🔍 [A] Checking /api/auth/me with Device A token (should be revoked)...');
    const resCheckA2 = await fetchUrl('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('  Status:', resCheckA2.status);
    console.log('  Response:', resCheckA2.data);
    
    if (resCheckA2.status === 401 && (resCheckA2.data?.status === 'session_revoked' || resCheckA2.data?.reason === 'session_revoked')) {
      console.log('✅ Device A session correctly revoked');
    } else if (resCheckA2.status === 401) {
      console.log('⚠️  Device A got 401 but may not be session_revoked. Response:', resCheckA2.data);
    } else {
      console.error('❌ Device A should be revoked but got status:', resCheckA2.status);
      process.exit(1);
    }
    
    console.log('\n=== ✅ ALL TESTS PASSED ===\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

test();
