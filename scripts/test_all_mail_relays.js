/**
 * test_all_mail_relays.js
 * Kiểm tra tất cả relay mail (Resend, Gmail OAuth, SMTP local) cho mọi loại email.
 *
 * Run: node scripts/test_all_mail_relays.js [--to email@test.com]
 *
 * Các bộ test:
 *  1. OTP đăng ký tài khoản       → Resend (purpose: register)
 *  2. OTP đặt lại mật khẩu        → Resend (purpose: reset_password)
 *  3. OTP đăng nhập admin          → Resend (purpose: admin_login:test)
 *  4. Thanh toán thành công — App Học (app-study-12) → Resend
 *  5. Thanh toán thành công — Web Demo               → Resend
 *  6. Gmail OAuth test (direct)
 *  7. SMTP local catcher test
 */
"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const nodemailer = require("nodemailer");
// Dùng native fetch của Node v18+ (global), không cần node-fetch

// ─── Config ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const toIdx = args.indexOf("--to");
const RECIPIENT = (toIdx !== -1 && args[toIdx + 1]) ? args[toIdx + 1] : process.env.GMAIL_NOTIFY_TO || process.env.EMAIL_FROM_DEFAULT;
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_ENABLED = process.env.RESEND_ENABLED === "true" && Boolean(RESEND_API_KEY);
const EMAIL_FROM_DEFAULT = process.env.EMAIL_FROM_DEFAULT || "";
const EMAIL_FROM_SECURITY = process.env.EMAIL_FROM_SECURITY || EMAIL_FROM_DEFAULT;
const EMAIL_FROM_SUPPORT = process.env.EMAIL_FROM_SUPPORT || EMAIL_FROM_DEFAULT;
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";
const GMAIL_ENABLED = process.env.GMAIL_NOTIFY_ENABLED === "true";
const GMAIL_FROM = process.env.GMAIL_NOTIFY_FROM || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const BRAND = "Ứng Dụng Thông Minh";
const WEBSITE = "https://ungdungthongminh.shop";
const PORTAL = WEBSITE + "/portal";
const WEB_APP = "https://hoctap-cap-01.vercel.app/";
const SUPPORT_EMAIL = EMAIL_REPLY_TO || GMAIL_FROM || "ungdungthongminh.info@gmail.com";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function e(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function log(label, result) {
  const icon = result.ok ? "✅" : (result.skipped ? "⚠️" : "❌");
  const detail = result.ok
    ? `OK | provider=${result.provider || "?"} | msgId=${result.messageId || "?"}`
    : `FAIL | provider=${result.provider || "?"} | reason=${result.reason || "?"}`;
  console.log(`  ${icon} ${label}: ${detail}`);
}

// ─── Resend sender ────────────────────────────────────────────────────────────
function senderFor(purpose) {
  if (!purpose) return `${BRAND} <${EMAIL_FROM_DEFAULT}>`;
  if (purpose.startsWith("admin_login:")) return `${BRAND} | Bảo mật <${EMAIL_FROM_SECURITY || EMAIL_FROM_DEFAULT}>`;
  if (purpose === "reset_password") return `${BRAND} | Tài khoản <${EMAIL_FROM_SECURITY || EMAIL_FROM_DEFAULT}>`;
  if (purpose === "paid_order_success") return `${BRAND} | Giao key <${EMAIL_FROM_SUPPORT || EMAIL_FROM_DEFAULT}>`;
  return `${BRAND} <${EMAIL_FROM_DEFAULT}>`;
}

async function sendViaResend({ subject, text, html, to, purpose }) {
  if (!RESEND_ENABLED) {
    return { ok: false, skipped: true, reason: "resend_disabled_or_missing_config", provider: "resend" };
  }
  const from = senderFor(purpose);
  const body = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
    ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {})
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.id) {
    return { ok: false, skipped: false, reason: payload?.message || `http_${res.status}`, provider: "resend" };
  }
  return { ok: true, messageId: payload.id, provider: "resend", recipients: body.to };
}

// ─── Gmail OAuth ──────────────────────────────────────────────────────────────
async function getGmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || `oauth_http_${res.status}`);
  }
  return payload.access_token;
}

function b64url(s) {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendViaGmail({ subject, text, html, to }) {
  if (!GMAIL_ENABLED) {
    return { ok: false, skipped: true, reason: "gmail_disabled", provider: "gmail" };
  }
  let accessToken;
  try {
    accessToken = await getGmailAccessToken();
  } catch (err) {
    return { ok: false, skipped: false, reason: `oauth_error: ${err.message}`, provider: "gmail" };
  }
  const boundary = `wst_${Date.now().toString(16)}`;
  const rawEmail = [
    `From: ${BRAND} <${GMAIL_FROM}>`,
    ...(EMAIL_REPLY_TO ? [`Reply-To: ${EMAIL_REPLY_TO}`] : []),
    `To: ${Array.isArray(to) ? to.join(", ") : to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "",
    `--${boundary}--`
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: b64url(rawEmail) })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.id) {
    return { ok: false, skipped: false, reason: payload?.error?.message || `http_${res.status}`, provider: "gmail" };
  }
  return { ok: true, messageId: payload.id, threadId: payload.threadId, provider: "gmail" };
}

// ─── SMTP local ───────────────────────────────────────────────────────────────
async function sendViaSmtpLocal({ subject, text, html, to }) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST || "127.0.0.1",
    port: SMTP_PORT,
    auth: { user: SMTP_USER || "local-smtp-user", pass: SMTP_PASS || "local-smtp-pass" }
  });
  return new Promise((resolve) => {
    transporter.sendMail(
      { from: `"${BRAND}" <no-reply@local.test>`, to, subject, text, html },
      (err, info) => {
        if (err) return resolve({ ok: false, reason: err.message, provider: "smtp_local" });
        resolve({ ok: true, messageId: info.messageId, provider: "smtp_local" });
      }
    );
  });
}

// ─── Email templates ──────────────────────────────────────────────────────────
function buildOtpEmail({ purpose, code = "123456" }) {
  const isAdmin = purpose.startsWith("admin_login:");
  const isReset = purpose === "reset_password";
  const subject = isAdmin
    ? "Mã xác minh đăng nhập quản trị - [TEST]"
    : isReset
      ? "Mã xác minh đặt lại mật khẩu - [TEST]"
      : "Mã xác minh đăng ký tài khoản - [TEST]";
  const label = isAdmin ? "đăng nhập quản trị" : isReset ? "đặt lại mật khẩu" : "đăng ký";
  const text = `Mã ${label} của bạn là: ${code}. Mã có hiệu lực trong 10 phút. (Email test)`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:32px 16px">
<tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09)">
<tr><td style="background:linear-gradient(135deg,#6c47ff 0%,#8b5cf6 100%);padding:24px 32px;text-align:center">
  <div style="color:#fff;font-size:18px;font-weight:700">${e(BRAND)}</div>
  <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:3px">🔐 Xác minh ${e(label)}</div>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="margin:0 0 16px;color:#374151;font-size:14px">Mã xác minh <strong>${e(label)}</strong> của bạn:</p>
  <div style="background:#faf5ff;border:1.5px solid #d8b4fe;border-radius:8px;padding:18px;text-align:center;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#4c1d95;letter-spacing:6px">${e(code)}</div>
  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với ai. <em>[Email test]</em></p>
</td></tr>
<tr><td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6">
  <div style="font-size:11px;color:#d1d5db">Email này được gửi tự động — vui lòng không reply trực tiếp.</div>
</td></tr>
</table></td></tr></table>
</body></html>`;
  return { subject, text, html };
}

function buildPaidOrderEmail_AppStudy({ to }) {
  const orderId = "TEST-" + Date.now().toString(36).toUpperCase();
  const keyText = "WSTL-TEST1111-AABB";
  const amount = (299000).toLocaleString("vi-VN");
  const subject = `Học Tập Cấp 01 | Thông tin sử dụng - ${orderId} [TEST]`;
  const text = [
    "[EMAIL TEST] Học Tập Cấp 01 - Thông tin sử dụng",
    `Email: ${to}`, `License key: ${keyText}`, `Web app: ${WEB_APP}`,
    "Đây là email test, không phải đơn hàng thật."
  ].join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:32px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09)">
<tr><td style="background:linear-gradient(135deg,#6c47ff 0%,#8b5cf6 100%);padding:28px 36px;text-align:center">
  <div style="color:#fff;font-size:20px;font-weight:700">Học Tập Cấp 01</div>
  <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:4px">ungdungthongminh.shop</div>
</td></tr>
<tr><td style="padding:24px 36px 0">
  <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:10px 14px;font-size:13px;color:#854d0e;margin-bottom:16px">⚠️ <strong>Email test</strong> — không phải đơn hàng thật.</div>
  <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:6px">Thông tin sử dụng của bạn đã sẵn sàng</div>
  <div style="font-size:13px;color:#6b7280">Giữ lại email này để đăng nhập web app.</div>
</td></tr>
<tr><td style="padding:16px 36px 0">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
    <tr><td colspan="2" style="padding:10px 16px 4px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Thông tin chính</td></tr>
    <tr><td style="padding:7px 16px;font-size:13px;color:#9ca3af;width:38%">Email sử dụng</td><td style="padding:7px 16px;font-size:13px;color:#111827;font-weight:600">${e(to)}</td></tr>
    <tr style="background:#fff"><td style="padding:7px 16px;font-size:13px;color:#9ca3af">Web app</td><td style="padding:7px 16px;font-size:13px"><a href="${WEB_APP}" style="color:#6c47ff">${e(WEB_APP)}</a></td></tr>
    <tr><td style="padding:7px 16px 12px;font-size:13px;color:#9ca3af">Mã đơn</td><td style="padding:7px 16px 12px;font-size:13px;font-family:monospace;color:#111827;font-weight:600">${e(orderId)}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:14px 36px 0">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf5ff;border:1.5px solid #d8b4fe;border-radius:8px">
    <tr><td style="padding:12px 16px 4px;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:1px;text-transform:uppercase">🔑 License key</td></tr>
    <tr><td style="padding:4px 16px 14px">
      <div style="font-family:monospace;font-size:16px;font-weight:700;color:#4c1d95;background:#ede9fe;border-radius:6px;padding:10px 14px;text-align:center;letter-spacing:.5px">${e(keyText)}</div>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:16px 36px 0">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px">
    <tr><td style="padding:12px 16px 4px;font-size:11px;font-weight:700;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase">Vào web app</td></tr>
    <tr><td style="padding:0 16px 14px;font-size:13px;color:#1f2937;line-height:1.7">
      Truy cập <a href="${WEB_APP}" style="color:#2563eb;font-weight:700">${e(WEB_APP)}</a>. Dùng <strong>email mua hàng</strong> + <strong>license key</strong> ở trên để đăng nhập.
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:20px 36px 0;text-align:center">
  <a href="${WEB_APP}" style="display:inline-block;background:#6c47ff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;margin:4px 5px">Mở web app</a>
  <a href="${WEBSITE}" style="display:inline-block;background:#fff;color:#6c47ff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #d8b4fe;margin:4px 5px">Vào Web Tổng</a>
</td></tr>
<tr><td style="padding:20px 36px 24px;text-align:center;border-top:1px solid #f3f4f6;margin-top:8px">
  <div style="font-size:13px;font-weight:700;color:#374151">Học Tập Cấp 01</div>
  <div style="font-size:12px;color:#9ca3af"><a href="mailto:${e(SUPPORT_EMAIL)}" style="color:#6c47ff">${e(SUPPORT_EMAIL)}</a> · <a href="${WEBSITE}" style="color:#6c47ff">ungdungthongminh.shop</a></div>
  <div style="font-size:11px;color:#d1d5db;margin-top:6px">Email này được gửi tự động — vui lòng không reply trực tiếp.</div>
</td></tr>
</table></td></tr></table>
</body></html>`;
  return { subject, text, html };
}

function buildPaidOrderEmail_WebDemo({ to }) {
  const orderId = "TEST-WDEMO-" + Date.now().toString(36).toUpperCase();
  const amount = (3500000).toLocaleString("vi-VN");
  const subject = `Xác nhận thanh toán đơn web mẫu - ${orderId} [TEST]`;
  const text = [
    "[EMAIL TEST] Xác nhận thanh toán đơn web mẫu",
    `Mã đơn: ${orderId}`, `Mẫu web: Web mẫu bất động sản`,
    `Tổng thanh toán: ${amount} VND`,
    `Email mua hàng: ${to}`,
    "Đây là email test, không phải đơn hàng thật."
  ].join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:28px 12px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="padding:22px 24px;background:linear-gradient(135deg,#0f4c81,#1d7cf8);color:#fff">
  <div style="font-size:20px;font-weight:700">Thông báo thanh toán web mẫu</div>
  <div style="margin-top:6px;font-size:13px;opacity:.9">Mã đơn ${e(orderId)}</div>
</td></tr>
<tr><td style="padding:20px 24px">
  <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:10px 14px;font-size:13px;color:#854d0e;margin-bottom:14px">⚠️ <strong>Email test</strong> — không phải đơn hàng thật.</div>
  <p style="margin:0 0 12px;color:#111827;font-size:14px">Cảm ơn bạn đã đặt mua mẫu web. Đơn hàng đã ghi nhận thanh toán thành công.</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <tr><td style="padding:10px 12px;background:#f9fafb;color:#6b7280;width:38%">Email mua hàng</td><td style="padding:10px 12px;color:#111827;font-weight:600">${e(to)}</td></tr>
    <tr><td style="padding:10px 12px;background:#f9fafb;color:#6b7280">Mẫu web</td><td style="padding:10px 12px;color:#111827;font-weight:600">Web mẫu bất động sản [TEST]</td></tr>
    <tr><td style="padding:10px 12px;background:#f9fafb;color:#6b7280">Tổng thanh toán</td><td style="padding:10px 12px;color:#0f766e;font-weight:700">${e(amount)} VND</td></tr>
    <tr><td style="padding:10px 12px;background:#f9fafb;color:#6b7280">Domain</td><td style="padding:10px 12px;color:#111827">test-domain.vn / 1 năm</td></tr>
    <tr><td style="padding:10px 12px 14px;background:#f9fafb;color:#6b7280">Hosting</td><td style="padding:10px 12px 14px;color:#111827">1 năm</td></tr>
  </table>
  <p style="margin:14px 0 0;color:#374151;font-size:13px;line-height:1.6">Email bàn giao (link/admin thông tin triển khai) sẽ được gửi tiếp theo từ trang Admin tổng ngay khi hoàn tất cấu hình bàn giao.</p>
  <p style="margin:10px 0 0;font-size:12px;color:#6b7280"><a href="mailto:${e(SUPPORT_EMAIL)}" style="color:#1d4ed8">${e(SUPPORT_EMAIL)}</a> | <a href="${WEBSITE}" style="color:#1d4ed8">${WEBSITE}</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
  return { subject, text, html };
}

// ─── Test cases ───────────────────────────────────────────────────────────────
const TESTS = [
  {
    name: "OTP - Đăng ký tài khoản",
    purpose: "register",
    build: (to) => buildOtpEmail({ purpose: "register" }),
    relays: ["resend", "gmail"]
  },
  {
    name: "OTP - Đặt lại mật khẩu",
    purpose: "reset_password",
    build: (to) => buildOtpEmail({ purpose: "reset_password" }),
    relays: ["resend", "gmail"]
  },
  {
    name: "OTP - Đăng nhập admin",
    purpose: "admin_login:test",
    build: (to) => buildOtpEmail({ purpose: "admin_login:test" }),
    relays: ["resend", "gmail"]
  },
  {
    name: "Thanh toán - App Học Tập Cấp 01 (app-study-12)",
    purpose: "paid_order_success",
    build: (to) => buildPaidOrderEmail_AppStudy({ to }),
    relays: ["resend", "gmail"]
  },
  {
    name: "Thanh toán - Web Demo (app-web-demo-services)",
    purpose: "paid_order_success",
    build: (to) => buildPaidOrderEmail_WebDemo({ to }),
    relays: ["resend", "gmail"]
  },
  {
    name: "SMTP local catcher",
    purpose: "test",
    build: (to) => ({
      subject: "[WST LOCAL] SMTP test mail",
      text: "Test qua SMTP local catcher (127.0.0.1:2525).",
      html: "<p>Test qua <strong>SMTP local catcher</strong> (127.0.0.1:2525).</p>"
    }),
    relays: ["smtp_local"]
  }
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  📧 Test toàn bộ email relay — Web Sales Total");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Gửi tới: ${RECIPIENT}`);
  console.log(`  Resend: ${RESEND_ENABLED ? "✅ enabled" : "❌ disabled"}  (from: ${EMAIL_FROM_DEFAULT})`);
  console.log(`  Gmail : ${GMAIL_ENABLED ? "✅ enabled" : "❌ disabled"}  (from: ${GMAIL_FROM})`);
  console.log(`  SMTP  : local ${SMTP_HOST}:${SMTP_PORT}`);
  console.log("═══════════════════════════════════════════════════════\n");

  if (!RECIPIENT) {
    console.error("❌ Không có địa chỉ gửi tới. Dùng --to email@example.com hoặc đặt GMAIL_NOTIFY_TO trong .env");
    process.exit(1);
  }

  const summary = { total: 0, ok: 0, fail: 0, skip: 0 };

  for (const test of TESTS) {
    console.log(`\n▶ ${test.name}`);
    const { subject, text, html } = test.build(RECIPIENT);

    for (const relay of test.relays) {
      summary.total++;
      let result;
      try {
        if (relay === "resend") {
          result = await sendViaResend({ subject, text, html, to: RECIPIENT, purpose: test.purpose });
        } else if (relay === "gmail") {
          result = await sendViaGmail({ subject, text, html, to: RECIPIENT });
        } else if (relay === "smtp_local") {
          result = await sendViaSmtpLocal({ subject, text, html, to: RECIPIENT });
        }
      } catch (err) {
        result = { ok: false, reason: err.message, provider: relay };
      }

      log(`[${relay.toUpperCase()}]`, result);
      if (result.ok) summary.ok++;
      else if (result.skipped) summary.skip++;
      else summary.fail++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  Kết quả: ✅ ${summary.ok} OK  ❌ ${summary.fail} FAIL  ⚠️ ${summary.skip} SKIP  (tổng ${summary.total})`);
  console.log("═══════════════════════════════════════════════════════\n");

  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
