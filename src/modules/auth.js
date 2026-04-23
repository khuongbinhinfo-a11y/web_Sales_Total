const crypto = require("crypto");
const { env } = require("../config/env");
const { findAdminById } = require("./store");

const ADMIN_AUTH_DEBUG_ENABLED = String(process.env.ADMIN_AUTH_DEBUG || "1").trim() !== "0";
const ADMIN_AUTH_TRACE_PATH_PREFIXES = [
  "/api/admin/dashboard",
  "/api/admin/me",
  "/api/admin/ai-gates"
];

const adminLoginAttempts = new Map();

function getClientIp(req) {
  const forwardedFor = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  const realIp = String(req?.headers?.["x-real-ip"] || "").trim();
  const socketIp = String(req?.socket?.remoteAddress || "").trim();
  return (forwardedFor || realIp || socketIp || "unknown").toLowerCase();
}

function shouldTraceAdminAuth(req) {
  if (!ADMIN_AUTH_DEBUG_ENABLED) {
    return false;
  }

  const path = String(req?.path || req?.originalUrl || "");
  return ADMIN_AUTH_TRACE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function summarizeCookieState(req) {
  const cookies = parseCookies(req);
  return {
    hasAdminSessionCookie: Boolean(cookies.wst_admin_session),
    hasAdminOtpCookie: Boolean(cookies.wst_admin_otp_challenge),
    cookieCount: Object.keys(cookies).length
  };
}

function logAdminAuthDebug(req, stage, details = {}) {
  if (!shouldTraceAdminAuth(req)) {
    return;
  }

  const payload = {
    stage,
    method: String(req?.method || ""),
    path: String(req?.path || req?.originalUrl || ""),
    host: getRequestHost(req),
    ip: getClientIp(req),
    ...summarizeCookieState(req),
    ...details
  };

  console.log("[admin-auth-debug]", JSON.stringify(payload));
}

function pruneAdminLoginAttempt(ip, now) {
  const record = adminLoginAttempts.get(ip);
  if (!record) {
    return null;
  }

  if (record.lockUntil && record.lockUntil > now) {
    return record;
  }

  if (record.lockUntil && record.lockUntil <= now) {
    adminLoginAttempts.delete(ip);
    return null;
  }

  if (!record.firstFailedAt || now - record.firstFailedAt > env.adminLoginWindowMs) {
    adminLoginAttempts.delete(ip);
    return null;
  }

  return record;
}

function isAdminLoginAllowed(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const record = pruneAdminLoginAttempt(ip, now);
  if (!record) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.lockUntil && record.lockUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function registerAdminLoginFailure(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = pruneAdminLoginAttempt(ip, now);

  if (!current) {
    adminLoginAttempts.set(ip, {
      failures: 1,
      firstFailedAt: now,
      lockUntil: 0
    });
    return;
  }

  const failures = Number(current.failures || 0) + 1;
  const lockUntil = failures >= env.adminLoginMaxAttempts ? now + env.adminLoginLockoutMs : 0;
  adminLoginAttempts.set(ip, {
    failures,
    firstFailedAt: current.firstFailedAt || now,
    lockUntil
  });
}

function clearAdminLoginFailures(req) {
  const ip = getClientIp(req);
  adminLoginAttempts.delete(ip);
}

const ADMIN_ROLE_PERMISSIONS = {
  owner: ["*"],
  manager: ["dashboard:read", "customers:read", "customers:write", "orders:read", "keys:read", "admins:read", "admins:write"],
  support: ["dashboard:read", "customers:read", "orders:read"]
};

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

function decodeSessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payloadRaw = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw);
    if (!payload.exp || Number(payload.exp) < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function verifySessionToken(token, expectedScope) {
  const payload = decodeSessionToken(token);
  if (!payload) {
    return false;
  }

  if (payload.scope !== expectedScope) {
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

function getRequestHost(req) {
  const forwardedHost = String(req?.headers?.["x-forwarded-host"] || "").split(",")[0].trim();
  const hostHeader = String(req?.headers?.host || "").trim();
  const host = (forwardedHost || hostHeader).toLowerCase();
  return host.replace(/:\d+$/, "");
}

function resolveCookieDomain(req) {
  const configured = String(env.sessionCookieDomain || "").trim();
  if (!configured) {
    return "";
  }

  // In production behind proxies/CDN, host headers may vary. If a cookie domain is
  // explicitly configured, always use it to keep auth cookies stable across subdomains.
  return configured;
}

function appendSetCookieHeader(res, cookieValue) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  const nextCookies = Array.isArray(existing) ? [...existing, cookieValue] : [String(existing), cookieValue];
  res.setHeader("Set-Cookie", nextCookies);
}

function setAuthCookie(res, name, token, req) {
  const secureFlag = env.nodeEnv === "production" ? " Secure;" : "";
  const resolvedDomain = resolveCookieDomain(req);
  const domainFlag = resolvedDomain ? ` Domain=${resolvedDomain};` : "";
  const maxAgeSeconds = name === "wst_customer_session"
    ? env.customerSessionDays * 24 * 60 * 60
    : name === "wst_admin_otp_challenge"
      ? Math.max(60, Math.floor(env.adminOtpTtlMs / 1000))
      : 12 * 60 * 60;
  const newCookie = `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds};${domainFlag}${secureFlag}`;
  appendSetCookieHeader(res, newCookie);

  if (name === "wst_admin_session" || name === "wst_admin_otp_challenge") {
    logAdminAuthDebug(req, "set_cookie", {
      cookieName: name,
      domain: resolvedDomain || "(host-only)",
      maxAgeSeconds
    });
  }
}

function clearAuthCookie(res, name, req) {
  const secureFlag = env.nodeEnv === "production" ? " Secure;" : "";
  const resolvedDomain = resolveCookieDomain(req);
  appendSetCookieHeader(res, `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${secureFlag}`);
  if (resolvedDomain) {
    appendSetCookieHeader(res, `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Domain=${resolvedDomain};${secureFlag}`);
  }
}

function createCustomerSessionToken(customerId, email) {
  const ttlMs = env.customerSessionDays * 24 * 60 * 60 * 1000;
  const payload = { scope: "customer", customerId, email, exp: Date.now() + ttlMs };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function getPermissionsByRole(role) {
  return ADMIN_ROLE_PERMISSIONS[role] || [];
}

function normalizeAdminPermissions(adminProfile) {
  const role = String(adminProfile?.role || "support").trim().toLowerCase() || "support";
  const configuredPermissions = Array.isArray(adminProfile?.permissions)
    ? adminProfile.permissions
        .map((permission) => String(permission || "").trim())
        .filter(Boolean)
    : [];
  return configuredPermissions.length > 0 ? [...new Set(configuredPermissions)] : getPermissionsByRole(role);
}

function buildAdminSession(adminProfile) {
  const role = String(adminProfile?.role || "support").trim().toLowerCase() || "support";
  return {
    id: adminProfile?.id || null,
    username: adminProfile?.username || "admin",
    role,
    permissions: normalizeAdminPermissions({ ...adminProfile, role })
  };
}

function createAdminSessionToken(adminProfile) {
  const session = buildAdminSession(adminProfile);
  const payload = {
    scope: "admin",
    adminUserId: session.id,
    username: session.username,
    role: session.role,
    permissions: session.permissions,
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function createAdminOtpChallengeToken(adminProfile) {
  const payload = {
    scope: "admin_otp_challenge",
    adminUserId: adminProfile.id || null,
    username: adminProfile.username || "",
    role: adminProfile.role || "support",
    exp: Date.now() + env.adminOtpTtlMs
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function getAdminOtpChallengeFromSession(req) {
  const cookies = parseCookies(req);
  const payload = decodeSessionToken(cookies.wst_admin_otp_challenge);
  if (!payload || payload.scope !== "admin_otp_challenge") {
    return null;
  }

  return {
    adminUserId: payload.adminUserId || null,
    username: payload.username || "",
    role: payload.role || "support"
  };
}

function isOtpRequiredForAdminRole(role) {
  return env.adminOtpRequiredRoles.includes(String(role || "").trim().toLowerCase());
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

function getAdminFromSession(req) {
  if (req?.adminSession) {
    return req.adminSession;
  }

  const cookies = parseCookies(req);
  const payload = decodeSessionToken(cookies.wst_admin_session);
  if (!payload || payload.scope !== "admin") {
    return null;
  }

  if (!payload.adminUserId) {
    return null;
  }

  // Reject legacy tokens that do not carry role/permission claims.
  const hasRole = typeof payload.role === "string" && payload.role.length > 0;
  const hasPermissions = Array.isArray(payload.permissions) && payload.permissions.length > 0;
  if (!hasRole && !hasPermissions) {
    return null;
  }

  return buildAdminSession({
    id: payload.adminUserId || null,
    username: payload.username || "admin",
    role: payload.role || "support",
    permissions: Array.isArray(payload.permissions) ? payload.permissions : []
  });
}

function arePermissionSetsEqual(left, right) {
  const normalizedLeft = [...new Set((Array.isArray(left) ? left : []).map((item) => String(item || "").trim()).filter(Boolean))].sort();
  const normalizedRight = [...new Set((Array.isArray(right) ? right : []).map((item) => String(item || "").trim()).filter(Boolean))].sort();
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function isSameAdminSession(left, right) {
  if (!left || !right) {
    return false;
  }

  return left.id === right.id
    && left.username === right.username
    && left.role === right.role
    && arePermissionSetsEqual(left.permissions, right.permissions);
}

async function syncAdminSessionFromRequest(req, res) {
  const currentSession = getAdminFromSession(req);
  if (!currentSession?.id) {
    const cookies = parseCookies(req);
    const hasAdminSessionCookie = Boolean(cookies.wst_admin_session);
    req.adminAuthFailReason = hasAdminSessionCookie
      ? "invalid_or_legacy_admin_session_token"
      : "missing_admin_session_cookie";
    logAdminAuthDebug(req, "session_missing", {
      reason: req.adminAuthFailReason
    });
    if (parseCookies(req).wst_admin_session) {
      clearAuthCookie(res, "wst_admin_session", req);
    }
    return null;
  }

  const admin = await findAdminById(currentSession.id);
  if (!admin || !admin.isActive) {
    req.adminAuthFailReason = !admin ? "admin_not_found" : "admin_inactive";
    logAdminAuthDebug(req, "session_invalid_db", {
      reason: req.adminAuthFailReason,
      adminId: currentSession.id
    });
    clearAuthCookie(res, "wst_admin_session", req);
    return null;
  }

  const syncedSession = buildAdminSession(admin);
  req.adminSession = syncedSession;

  if (!isSameAdminSession(currentSession, syncedSession)) {
    logAdminAuthDebug(req, "session_refresh", {
      adminId: syncedSession.id,
      role: syncedSession.role
    });
    setAuthCookie(res, "wst_admin_session", createAdminSessionToken(admin), req);
  }

  logAdminAuthDebug(req, "session_ok", {
    adminId: syncedSession.id,
    role: syncedSession.role
  });

  return syncedSession;
}

function handleAdminUnauthorized(req, res) {
  logAdminAuthDebug(req, "unauthorized", {
    reason: String(req?.adminAuthFailReason || "unknown")
  });
  if (wantsHtml(req)) {
    return res.redirect("/admin/login");
  }
  return res.status(401).json({ message: "Unauthorized" });
}

function hasAdminPermission(adminSession, permission) {
  if (!adminSession || !Array.isArray(adminSession.permissions)) {
    return false;
  }
  return adminSession.permissions.includes("*") || adminSession.permissions.includes(permission);
}

function requireAdminPermission(permission) {
  return async (req, res, next) => {
    const adminSession = await syncAdminSessionFromRequest(req, res);
    if (!adminSession) {
      return handleAdminUnauthorized(req, res);
    }

    if (!hasAdminPermission(adminSession, permission)) {
      logAdminAuthDebug(req, "forbidden", {
        reason: "missing_permission",
        requiredPermission: permission,
        role: adminSession.role,
        adminId: adminSession.id
      });
      return res.status(403).json({ message: "Forbidden", requiredPermission: permission });
    }

    logAdminAuthDebug(req, "permission_ok", {
      requiredPermission: permission,
      role: adminSession.role,
      adminId: adminSession.id
    });

    req.adminSession = adminSession;
    return next();
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const originalBuffer = Buffer.from(originalHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (originalBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(originalBuffer, computedBuffer);
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
  return getAdminFromSession(req) !== null;
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

async function requireAdminAuth(req, res, next) {
  const adminSession = await syncAdminSessionFromRequest(req, res);
  if (!adminSession) {
    return handleAdminUnauthorized(req, res);
  }

  logAdminAuthDebug(req, "auth_ok", {
    role: adminSession.role,
    adminId: adminSession.id
  });

  req.adminSession = adminSession;
  return next();
}

async function requirePortalOrAdmin(req, res, next) {
  if (isPortalAuthenticated(req)) {
    return next();
  }

  const adminSession = await syncAdminSessionFromRequest(req, res);
  if (adminSession) {
    req.adminSession = adminSession;
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

  setAuthCookie(res, "wst_portal_session", createSessionToken("portal"), req);
  return res.redirect("/portal");
}

function handleAdminLogin(req, res) {
  const { accessKey } = req.body;
  if (!env.adminOwnerKeyLoginEnabled) {
    return res.status(403).send("Owner key login is disabled");
  }

  if (!env.adminAccessKey) {
    return res.status(503).send("Owner key login is not configured");
  }

  if (!accessKey || accessKey !== env.adminAccessKey) {
    return res.status(401).send("Invalid admin key");
  }

  const token = createAdminSessionToken({
    id: null,
    username: "owner",
    role: "owner",
    permissions: ["*"]
  });
  setAuthCookie(res, "wst_admin_session", token, req);
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
      input{width:100%;padding:10px;border:1px solid #c8d2dd;border-radius:8px;margin:8px 0}
      button{border:0;background:#8b3d00;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer}
      .tip{font-size:12px;color:#64748b;margin:8px 0 0}
      .msg{font-size:13px;margin:12px 0 0;padding:10px 12px;border-radius:8px;display:none}
      .msg.show{display:block}
      .msg.info{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
      .msg.error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
      .msg.success{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
      .hintbox{width:100%;padding:10px 12px;border:1px solid #c8d2dd;border-radius:8px;margin:8px 0;background:#f8fafc;color:#475569;font-size:14px;line-height:1.4}
      .hintbox strong{color:#0f172a}
      hr{border:0;border-top:1px solid #e2e8f0;margin:16px 0}
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Admin Login</h2>
      <form id="adminLoginForm" method="post" action="/auth/admin/login">
        <label>Username</label>
        <input type="text" id="adminUsername" name="username" autocomplete="username" placeholder="manager01" required />
        <label>Password</label>
        <input type="password" id="adminPassword" name="password" autocomplete="current-password" placeholder="••••••••" required />
        <label>Email nhan OTP</label>
        <div id="adminOtpEmailHint" class="hintbox">Day la email da dang ky cua tai khoan admin. Khong nhap o day.</div>
        <label>OTP email (bat buoc cho owner/manager)</label>
        <input type="text" id="adminOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="6 so OTP" />
        <div class="tip">Buoc 1: nhap username/password va bam Login de nhan OTP qua email.</div>
        <div class="tip">Buoc 2: nhap OTP roi bam Login lai de vao trang admin.</div>
        <button id="adminLoginBtn" type="submit">Login Admin</button>
        <div id="adminLoginMsg" class="msg info"></div>
      </form>
    </div>
    <script>
      const form = document.getElementById("adminLoginForm");
      const msg = document.getElementById("adminLoginMsg");
      const submitBtn = document.getElementById("adminLoginBtn");
      const otpEmailHint = document.getElementById("adminOtpEmailHint");
      const configuredPublicBaseUrl = ${JSON.stringify(String(env.publicAppBaseUrl || env.appBaseUrl || "").trim())};

      function getAdminOrigin() {
        const currentOrigin = window.location.origin;
        const candidate = String(configuredPublicBaseUrl || "").trim();
        if (!candidate) {
          return currentOrigin;
        }

        try {
          const parsed = new URL(candidate, currentOrigin);
          const currentHost = String(window.location.hostname || "").trim().toLowerCase();
          const candidateHost = String(parsed.hostname || "").trim().toLowerCase();

          // Never switch login flow to another host. Cross-origin fetch can drop cookies
          // and cause immediate bounce back to admin login.
          if (!currentHost || !candidateHost || candidateHost !== currentHost) {
            return currentOrigin;
          }

          return parsed.origin;
        } catch {
          return currentOrigin;
        }
      }

      function buildAdminUrl(path) {
        const value = String(path || "").trim();
        if (!value) {
          return getAdminOrigin() + "/admin";
        }
        if (/^https?:\/\//i.test(value)) {
          return value;
        }
        return getAdminOrigin() + (value.startsWith("/") ? value : "/" + value);
      }

      function getAdminLoginEndpoints() {
        const pathname = window.location.pathname || "";
        const endpoints = pathname.startsWith("/api/")
          ? [buildAdminUrl("/api/auth/admin/login"), buildAdminUrl("/auth/admin/login")]
          : [buildAdminUrl("/auth/admin/login"), buildAdminUrl("/api/auth/admin/login")];
        return [...new Set(endpoints)];
      }

      function normalizeResponseText(text) {
        const value = String(text || "").trim();
        if (!value) {
          return "";
        }

        try {
          const parsed = JSON.parse(value);
          return String(parsed.message || value);
        } catch {
          return value;
        }
      }

      function parseResponsePayload(text) {
        const value = String(text || "").trim();
        if (!value) {
          return null;
        }

        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }

      function updateOtpDestination(text, maskedEmail) {
        const direct = String(maskedEmail || "").trim();
        const match = String(text || "").match(/[A-Za-z0-9._%+-]+\*+[^\s]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
        const destination = direct || (match ? match[0] : "");
        otpEmailHint.textContent = destination
          ? "OTP se gui toi: " + destination
          : "Day la email da dang ky cua tai khoan admin. Khong nhap o day.";
      }

      function setMessage(type, text) {
        msg.className = "msg show " + type;
        msg.textContent = text;
      }

      (function showTraceFromQuery() {
        try {
          const params = new URLSearchParams(window.location.search || "");
          const reason = String(params.get("reason") || "").trim();
          const failedEndpoint = String(params.get("failedEndpoint") || "").trim();
          if (reason === "admin_api_401" && failedEndpoint) {
            setMessage("error", "Phiên admin hết hạn/không hợp lệ khi gọi: " + failedEndpoint);
          }

          const username = String(params.get("username") || "").trim();
          if (username) {
            const usernameInput = document.getElementById("adminUsername");
            if (usernameInput && !usernameInput.value) {
              usernameInput.value = username;
            }
          }

          const otpFlag = String(params.get("otp") || "").trim();
          const maskedEmail = String(params.get("maskedEmail") || "").trim();
          const msgText = String(params.get("msg") || "").trim();
          const statusText = String(params.get("status") || "").trim();
          const statusCode = Number(statusText || 0);
          if (otpFlag === "1") {
            updateOtpDestination(msgText, maskedEmail);
            setMessage("success", msgText || "OTP da duoc gui vao email admin. Nhap OTP roi bam Login lai.");
            const otpInput = document.getElementById("adminOtp");
            if (otpInput) {
              otpInput.focus();
            }
            return;
          }

          if (msgText) {
            const type = statusCode >= 200 && statusCode < 300 ? "success" : "error";
            setMessage(type, msgText);
          }
        } catch {
          // ignore
        }
      })();

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        setMessage("info", "Dang xu ly dang nhap admin...");

        const body = new URLSearchParams({
          username: document.getElementById("adminUsername").value,
          password: document.getElementById("adminPassword").value,
          otp: document.getElementById("adminOtp").value
        });

        try {
          let response = null;
          let text = "";
          let payload = null;
          for (const endpoint of getAdminLoginEndpoints()) {
            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "Accept": "application/json, text/plain",
                "X-Requested-With": "fetch"
              },
              body: body.toString(),
              redirect: "follow"
            });

            const rawText = await response.text();
            payload = parseResponsePayload(rawText);
            text = payload?.message || normalizeResponseText(rawText);
            if (response.status !== 404) {
              break;
            }
          }

          if (!response) {
            setMessage("error", "Khong the ket noi toi endpoint dang nhap admin.");
            return;
          }

          updateOtpDestination(text, payload?.maskedEmail);

          if (response.status === 202) {
            setMessage("success", text || "OTP da duoc gui vao email admin. Nhap OTP roi bam Login lai.");
            document.getElementById("adminOtp").focus();
            return;
          }

          if (response.ok && payload?.redirectTo) {
            window.location.href = buildAdminUrl(payload.redirectTo);
            return;
          }

          if (response.ok) {
            window.location.href = buildAdminUrl("/admin");
            return;
          }

          setMessage("error", text || "Dang nhap admin that bai.");
        } catch (error) {
          setMessage("error", "Loi ket noi: " + error.message);
        } finally {
          submitBtn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}

module.exports = {
  requirePortalAuth: requireAuth("portal", "/portal/login"),
  requireAdminAuth,
  requirePortalOrAdmin,
  handlePortalLogin,
  handleAdminLogin,
  portalLoginPage,
  adminLoginPage,
  clearAuthCookie,
  setAuthCookie,
  createAdminSessionToken,
  createAdminOtpChallengeToken,
  getAdminOtpChallengeFromSession,
  isOtpRequiredForAdminRole,
  getAdminFromSession,
  requireAdminPermission,
  hasAdminPermission,
  hashPassword,
  verifyPassword,
  getPermissionsByRole,
  createCustomerSessionToken,
  getCustomerFromSession,
  isAdminLoginAllowed,
  registerAdminLoginFailure,
  clearAdminLoginFailures
};
