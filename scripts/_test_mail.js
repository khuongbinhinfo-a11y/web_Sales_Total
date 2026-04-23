// Temporary test script — send one email via local SMTP catcher
// Run: node scripts/_test_mail.js
"use strict";
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 2525,
  auth: { user: "local-smtp-user", pass: "local-smtp-pass" }
});

const amount = (1599000).toLocaleString("vi-VN");
const orderId = "WTG-TEST-001";
const appId = "app-study-12";
const customerDisplay = "test@gmail.com";
const keyText = "XXXX-XXXX-XXXX-ABCD";
const websiteUrl = "https://ungdungthongminh.shop";
const portalUrl = websiteUrl + "/portal";
const supportEmail = "khuongbinh.info@gmail.com";
const websiteDomain = "ungdungthongminh.shop";

function e(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:32px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09)">

<!-- HEADER -->
<tr>
  <td style="background:linear-gradient(135deg,#6c47ff 0%,#8b5cf6 100%);padding:28px 36px;text-align:center">
    <div style="font-size:32px;line-height:1;margin-bottom:8px">&#128241;</div>
    <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.4px">&#7912;ng D&#7909;ng Th&#244;ng Minh</div>
    <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:4px">${e(websiteDomain)}</div>
  </td>
</tr>

<!-- MAIN TITLE -->
<tr>
  <td style="padding:28px 36px 0">
    <div style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px">&#9989; Thanh to&#225;n th&#224;nh c&#244;ng</div>
    <div style="font-size:14px;color:#6b7280;line-height:1.65">&#272;&#417;n h&#224;ng c&#7911;a b&#7841;n &#273;&#227; &#273;&#432;&#7907;c x&#225;c nh&#7853;n v&#224; key b&#7843;n quy&#7873;n &#273;&#227; &#273;&#432;&#7907;c c&#7845;p t&#7921; &#273;&#7897;ng.</div>
  </td>
</tr>

<!-- ORDER BOX -->
<tr>
  <td style="padding:20px 36px 0">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
      <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Th&#244;ng tin &#273;&#417;n h&#224;ng</td></tr>
      <tr>
        <td style="padding:7px 16px;font-size:13px;color:#9ca3af;width:38%">M&#227; &#273;&#417;n</td>
        <td style="padding:7px 16px;font-size:13px;color:#111827;font-weight:600;font-family:'Courier New',monospace">${e(orderId)}</td>
      </tr>
      <tr style="background:#ffffff">
        <td style="padding:7px 16px;font-size:13px;color:#9ca3af">Kh&#225;ch h&#224;ng</td>
        <td style="padding:7px 16px;font-size:13px;color:#374151">${e(customerDisplay)}</td>
      </tr>
      <tr>
        <td style="padding:7px 16px;font-size:13px;color:#9ca3af">&#7912;ng d&#7909;ng</td>
        <td style="padding:7px 16px;font-size:13px;color:#111827;font-weight:600">${e(appId)}</td>
      </tr>
      <tr style="background:#ffffff">
        <td style="padding:7px 16px 13px;font-size:13px;color:#9ca3af">S&#7889; ti&#7873;n</td>
        <td style="padding:7px 16px 13px;font-size:14px;color:#059669;font-weight:700">${amount} VND</td>
      </tr>
    </table>
  </td>
</tr>

<!-- KEY BOX -->
<tr>
  <td style="padding:16px 36px 0">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf5ff;border:1.5px solid #d8b4fe;border-radius:8px">
      <tr><td style="padding:13px 16px 6px;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:1px;text-transform:uppercase">&#128273; Key b&#7843;n quy&#7873;n</td></tr>
      <tr>
        <td style="padding:4px 16px 14px">
          <div style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#4c1d95;background:#ede9fe;border-radius:6px;padding:10px 14px;word-break:break-all;letter-spacing:.5px;text-align:center">${e(keyText)}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- CTA BUTTONS -->
<tr>
  <td style="padding:24px 36px 0;text-align:center">
    <a href="${portalUrl}" style="display:inline-block;background:#6c47ff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;margin:4px 5px">M&#7903; c&#7893;ng kh&#225;ch h&#224;ng</a>
    <a href="${portalUrl}" style="display:inline-block;background:#ffffff;color:#6c47ff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;border:1.5px solid #6c47ff;margin:4px 5px">Xem chi ti&#7871;t &#273;&#417;n</a>
  </td>
</tr>

<!-- FOOTER -->
<tr>
  <td style="padding:24px 36px 28px;text-align:center">
    <div style="border-top:1px solid #f3f4f6;padding-top:20px">
      <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:5px">&#7912;ng D&#7909;ng Th&#244;ng Minh</div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:4px">
        <a href="mailto:${e(supportEmail)}" style="color:#6c47ff;text-decoration:none">${e(supportEmail)}</a>
        &nbsp;&middot;&nbsp;
        <a href="${portalUrl}" style="color:#6c47ff;text-decoration:none">${e(websiteDomain)}</a>
      </div>
      <div style="font-size:11px;color:#d1d5db;margin-top:8px">Email n&#224;y &#273;&#432;&#7907;c g&#7917;i t&#7921; &#273;&#7897;ng &#8212; vui l&#242;ng kh&#244;ng reply tr&#7921;c ti&#7871;p.</div>
    </div>
  </td>
</tr>

</table>
</td></tr>
</table>
</body></html>`;

transporter.sendMail({
  from: '"Smart App" <no-reply@local.test>',
  to: "test@local.test",
  subject: "Thanh toán thành công - WTG-TEST-001",
  html
}, (err, info) => {
  if (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  console.log("Mail sent OK:", info.messageId);
  console.log("Check output: backups/smtp-last-email.txt");
  process.exit(0);
});
