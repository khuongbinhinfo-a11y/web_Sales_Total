const crypto = require("crypto");
const { env } = require("../config/env");

function signValue(value) {
  return crypto.createHmac("sha256", env.sessionSigningSecret).update(value).digest("hex");
}

function createSessionToken(scope) {
  const payload = {
    scope,
    exp: Date.now() + 12 * 60 * 60 * 1000
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token, expectedScope) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signValue(encodedPayload);
  if (signature !== expectedSignature) {
    return false;
  }

  const payloadRaw = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const payload = JSON.parse(payloadRaw);

  if (payload.scope !== expectedScope) {
    return false;
  }

  if (!payload.exp || Number(payload.exp) < Date.now()) {
    return false;
  }

  return true;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return {};
  }

  const pairs = cookieHeader.split(";");
  const cookies = {};
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split("=");
    if (!name) {
      continue;
    }
    cookies[name] = decodeURIComponent(rest.join("=") || "");
  }
  return cookies;
}

function setAuthCookie(res, name, token) {
  const secureFlag = env.nodeEnv === "production" ? " Secure;" : "";
  res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200;${secureFlag}`);
}

function clearAuthCookie(res, name) {
  const secureFlag = env.nodeEnv === "production" ? " Secure;" : "";
  res.setHeader("Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${secureFlag}`);
}

function createCustomerSessionToken(customerId, email) {
  const payload = { scope: "customer", customerId, email, exp: Date.now() + 12 * 60 * 60 * 1000 };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function getCustomerFromSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.wst_customer_session;
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (signature !== signValue(encodedPayload)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.scope !== "customer" || !payload.exp || Number(payload.exp) < Date.now()) return null;
    return { customerId: payload.customerId, email: payload.email };
  } catch { return null; }
}

function wantsHtml(req) {
  const accept = (req.headers.accept || "").toLowerCase();
  return accept.includes("text/html");
}

function isPortalAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies.wst_portal_session, "portal");
}

function isAdminAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies.wst_admin_session, "admin");
}

function requireAuth(scope, loginPath) {
  return (req, res, next) => {
    const isAllowed = scope === "admin" ? isAdminAuthenticated(req) : isPortalAuthenticated(req);
    if (isAllowed) {
      return next();
    }

    if (wantsHtml(req)) {
      return res.redirect(loginPath);
    }

    return res.status(401).json({ message: "Unauthorized" });
  };
}

function requirePortalOrAdmin(req, res, next) {
  if (isPortalAuthenticated(req) || isAdminAuthenticated(req)) {
    return next();
  }

  if (wantsHtml(req)) {
    return res.redirect("/portal/login");
  }

  return res.status(401).json({ message: "Unauthorized" });
}

function handlePortalLogin(req, res) {
  const { accessKey } = req.body;
  if (!accessKey || accessKey !== env.portalAccessKey) {
    return res.status(401).send("Invalid portal key");
  }

  setAuthCookie(res, "wst_portal_session", createSessionToken("portal"));
  return res.redirect("/portal");
}

function handleAdminLogin(req, res) {
  const { accessKey } = req.body;
  if (!accessKey || accessKey !== env.adminAccessKey) {
    return res.status(401).send("Invalid admin key");
  }

  setAuthCookie(res, "wst_admin_session", createSessionToken("admin"));
  return res.redirect("/admin");
}

function portalLoginPage() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portal Login</title>
    <style>
      body{font-family:Segoe UI,sans-serif;background:#f5f7fa;padding:24px}
      .card{max-width:420px;margin:40px auto;background:#fff;padding:20px;border-radius:12px;border:1px solid #dce3ea}
      input{width:100%;padding:10px;border:1px solid #c8d2dd;border-radius:8px;margin:10px 0}
      button{border:0;background:#1864ab;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer}
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Portal Login</h2>
      <form method="post" action="/auth/portal/login">
        <label>Portal access key</label>
        <input type="password" name="accessKey" autocomplete="off" required />
        <button type="submit">Login Portal</button>
      </form>
    </div>
  </body>
</html>`;
}

function adminLoginPage() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Login</title>
    <style>
      body{font-family:Segoe UI,sans-serif;background:#f5f7fa;padding:24px}
      .card{max-width:420px;margin:40px auto;background:#fff;padding:20px;border-radius:12px;border:1px solid #dce3ea}
      input{width:100%;padding:10px;border:1px solid #c8d2dd;border-radius:8px;margin:10px 0}
      button{border:0;background:#8b3d00;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer}
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Admin Login</h2>
      <form method="post" action="/auth/admin/login">
        <label>Admin access key</label>
        <input type="password" name="accessKey" autocomplete="off" required />
        <button type="submit">Login Admin</button>
      </form>
    </div>
  </body>
</html>`;
}

module.exports = {
  requirePortalAuth: requireAuth("portal", "/portal/login"),
  requireAdminAuth: requireAuth("admin", "/admin/login"),
  requirePortalOrAdmin,
  handlePortalLogin,
  handleAdminLogin,
  portalLoginPage,
  adminLoginPage,
  clearAuthCookie,
  setAuthCookie,
  createCustomerSessionToken,
  getCustomerFromSession
};
