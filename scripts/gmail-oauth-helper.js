#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) {
      args._.push(part);
      continue;
    }

    const eqIndex = part.indexOf("=");
    if (eqIndex >= 0) {
      const key = part.slice(2, eqIndex);
      const value = part.slice(eqIndex + 1);
      args[key] = value;
      continue;
    }

    const key = part.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function loadOAuthClientFromFile(filePath) {
  if (!filePath) {
    return { clientId: "", clientSecret: "", redirectUris: [] };
  }

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    return { clientId: "", clientSecret: "", redirectUris: [] };
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const json = JSON.parse(raw);
  const web = json.web || {};
  const installed = json.installed || {};

  const clientId = String(web.client_id || installed.client_id || "").trim();
  const clientSecret = String(web.client_secret || installed.client_secret || "").trim();
  const redirectUris = Array.isArray(web.redirect_uris)
    ? web.redirect_uris
    : Array.isArray(installed.redirect_uris)
      ? installed.redirect_uris
      : [];

  return { clientId, clientSecret, redirectUris };
}

function findAutoClientSecretFile(rootDir) {
  try {
    const items = fs.readdirSync(rootDir);
    const found = items.find((name) => /^client_secret_.*\.json$/i.test(name));
    return found ? path.join(rootDir, found) : "";
  } catch {
    return "";
  }
}

function resolveConfig(args) {
  const explicitFile = String(args["client-secret-file"] || process.env.GOOGLE_OAUTH_CLIENT_FILE || "").trim();
  const autoFile = explicitFile ? "" : findAutoClientSecretFile(process.cwd());
  const oauthFile = explicitFile || autoFile;

  const fromFile = loadOAuthClientFromFile(oauthFile);

  const clientId = String(args["client-id"] || process.env.GOOGLE_CLIENT_ID || fromFile.clientId || "").trim();
  const clientSecret = String(args["client-secret"] || process.env.GOOGLE_CLIENT_SECRET || fromFile.clientSecret || "").trim();

  const redirectUri = String(args["redirect-uri"] || process.env.GOOGLE_REDIRECT_URI || fromFile.redirectUris[0] || "").trim();

  return {
    clientId,
    clientSecret,
    redirectUri,
    oauthFile,
    redirectUris: fromFile.redirectUris
  };
}

function printUsage() {
  console.log([
    "Usage:",
    "  node scripts/gmail-oauth-helper.js auth-url [--redirect-uri <uri>] [--client-secret-file <path>]",
    "  node scripts/gmail-oauth-helper.js exchange --code <authorization_code> [--redirect-uri <uri>] [--client-secret-file <path>]",
    "",
    "Optional:",
    "  --scope <scope> (default: https://www.googleapis.com/auth/gmail.send)",
    "  --client-id <id>",
    "  --client-secret <secret>",
    "",
    "Notes:",
    "  - Refresh token only appears on first consent or when using prompt=consent.",
    "  - Redirect URI must match one URI configured in your Google OAuth client."
  ].join("\n"));
}

function buildAuthUrl({ clientId, redirectUri, scope }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode({ clientId, clientSecret, redirectUri, code }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const reason = payload?.error_description || payload?.error || `http_${response.status}`;
    throw new Error(`Token exchange failed: ${reason}`);
  }

  return payload || {};
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0] || "";
  if (!cmd || cmd === "help" || cmd === "--help") {
    printUsage();
    process.exit(0);
  }

  const config = resolveConfig(args);
  const scope = String(args.scope || "https://www.googleapis.com/auth/gmail.send").trim();

  if (!config.clientId) {
    throw new Error("Missing client id. Set GOOGLE_CLIENT_ID or pass --client-id.");
  }
  if (!config.clientSecret) {
    throw new Error("Missing client secret. Set GOOGLE_CLIENT_SECRET or pass --client-secret.");
  }
  if (!config.redirectUri) {
    throw new Error("Missing redirect URI. Set GOOGLE_REDIRECT_URI or pass --redirect-uri.");
  }

  if (cmd === "auth-url") {
    const authUrl = buildAuthUrl({ clientId: config.clientId, redirectUri: config.redirectUri, scope });
    console.log("OAuth file:", config.oauthFile || "(none)");
    console.log("Redirect URI:", config.redirectUri);
    if (Array.isArray(config.redirectUris) && config.redirectUris.length > 0) {
      console.log("Allowed redirect_uris from file:", config.redirectUris.join(", "));
    }
    console.log("\nOpen this URL in browser:\n");
    console.log(authUrl);
    return;
  }

  if (cmd === "exchange") {
    const code = String(args.code || "").trim();
    if (!code) {
      throw new Error("Missing --code from Google callback URL.");
    }

    const token = await exchangeCode({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      code
    });

    console.log("Token exchange success. Save to .env:");
    console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token || ""}`);
    console.log(`GOOGLE_CLIENT_ID=${config.clientId}`);
    console.log("GOOGLE_CLIENT_SECRET=<your-secret>");
    console.log("GMAIL_NOTIFY_ENABLED=true");
    console.log("GMAIL_NOTIFY_FROM=khuongbinh.info@gmail.com");
    console.log("GMAIL_NOTIFY_TO=khuongbinh.info@gmail.com");

    if (!token.refresh_token) {
      console.log("\nWarning: refresh_token is empty. You may have already granted consent before.");
      console.log("Use prompt=consent (already included) and remove app access at myaccount.google.com > Security > Third-party access, then retry.");
    }
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
