const { pool } = require("../src/db/pool");

function parseCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  return String(setCookieHeader).split(";")[0].trim();
}

function decodeJwtPayloadFromCookie(cookiePair) {
  const value = String(cookiePair || "").split("=")[1] || "";
  const token = decodeURIComponent(value);
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const raw = Buffer.from(parts[0], "base64url").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function login(baseUrl, email, password, deviceId, deviceName) {
  const res = await fetch(`${baseUrl}/api/auth/customer/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, deviceId, deviceName })
  });

  const body = await res.json().catch(() => ({}));
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const sessionCookieHeader = setCookies.find((item) => String(item).toLowerCase().startsWith("wst_customer_session=")) || "";
  const cookie = parseCookie(sessionCookieHeader);
  const tokenPayload = decodeJwtPayloadFromCookie(cookie);

  return { status: res.status, body, cookie, tokenPayload, setCookies };
}

async function authMe(baseUrl, cookie) {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    method: "GET",
    headers: cookie ? { Cookie: cookie } : {}
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

(async () => {
  const baseUrl = process.argv[2] || "http://localhost:3900";
  const customerId = process.argv[3];
  const email = process.argv[4];
  const password = process.argv[5];
  if (!customerId || !email || !password) {
    throw new Error("Usage: node tmp-e2e-session-check.js <baseUrl> <customerId> <email> <password>");
  }

  const loginA = await login(baseUrl, email, password, "device-A", "Browser A");
  const sessionsAfterA = await pool.query(
    `SELECT session_id, customer_id, device_id, app_id, revoked_at, revoke_reason, created_at, last_seen_at
     FROM customer_sessions
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customerId]
  );

  const loginB = await login(baseUrl, email, password, "device-B", "Browser B");
  const sessionsAfterB = await pool.query(
    `SELECT session_id, customer_id, device_id, app_id, revoked_at, revoke_reason, created_at, last_seen_at
     FROM customer_sessions
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customerId]
  );

  const meA = await authMe(baseUrl, loginA.cookie);
  const meB = await authMe(baseUrl, loginB.cookie);

  const result = {
    baseUrl,
    loginA: {
      status: loginA.status,
      sessionIdInToken: loginA.tokenPayload?.sessionId || null,
      customerIdInToken: loginA.tokenPayload?.customerId || null,
      bodyStatus: loginA.body?.status || null,
      cookiePresent: Boolean(loginA.cookie),
      setCookies: loginA.setCookies
    },
    loginB: {
      status: loginB.status,
      sessionIdInToken: loginB.tokenPayload?.sessionId || null,
      customerIdInToken: loginB.tokenPayload?.customerId || null,
      bodyStatus: loginB.body?.status || null,
      cookiePresent: Boolean(loginB.cookie),
      setCookies: loginB.setCookies
    },
    sessionsAfterA: sessionsAfterA.rows,
    sessionsAfterB: sessionsAfterB.rows,
    meA,
    meB
  };

  process.stdout.write(JSON.stringify(result, null, 2));
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
