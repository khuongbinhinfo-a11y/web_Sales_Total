// Test webhook Sepay - gửi request giả để kiểm tra endpoint
const http = require('http');

const orderCode = 'WST-MO859YM4-8901'; // order code thực từ DB
const webhookSecret = 'WKWBMQGHA1T58ZGURCDZKVF0WAIJ03LZFJBYCOJQ9KXHN2NXSX6E2ESFQL1PB7EU';

const body = JSON.stringify({
  id: 99999,
  gateway: "Sacombank",
  transactionDate: "2026-04-21 12:00:00",
  accountNumber: "49312517",
  subAccount: null,
  code: orderCode,
  content: orderCode,
  transferType: "in",
  description: "",
  transferAmount: 2000,
  referenceCode: "FT26111",
  accumulated: 2000
});

const options = {
  hostname: 'localhost',
  port: 3900,
  path: '/api/payments/webhooks/sepay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': `Apikey ${webhookSecret}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Loi: ${e.message}`);
});

req.write(body);
req.end();
