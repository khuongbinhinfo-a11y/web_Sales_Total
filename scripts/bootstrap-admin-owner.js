const crypto = require("crypto");
const { Client } = require("pg");

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const entry = String(argv[index] || "").trim();
    if (!entry.startsWith("--")) {
      continue;
    }
    const [key, ...rest] = entry.slice(2).split("=");
    args[key] = rest.join("=");
  }
  return args;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const databaseUrl = String(process.env.DATABASE_URL || "").trim();
  const username = String(args.username || process.env.ADMIN_BOOTSTRAP_USERNAME || "owner_khuongbinh").trim().toLowerCase();
  const email = String(args.email || process.env.ADMIN_BOOTSTRAP_EMAIL || "khuongbinh.info@gmail.com").trim().toLowerCase();
  const password = String(args.password || process.env.ADMIN_BOOTSTRAP_PASSWORD || "").trim();
  const role = String(args.role || process.env.ADMIN_BOOTSTRAP_ROLE || "owner").trim().toLowerCase();

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!username) {
    throw new Error("Missing username");
  }
  if (!email) {
    throw new Error("Missing email");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (!['owner', 'manager', 'support'].includes(role)) {
    throw new Error("Role must be owner, manager, or support");
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=") ? { rejectUnauthorized: false } : undefined
  });

  await client.connect();

  try {
    const passwordHash = hashPassword(password);
    const result = await client.query(
      `INSERT INTO admin_users(id, username, email, password_hash, role, permissions, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, '["*"]'::jsonb, TRUE)
       ON CONFLICT (username)
       DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         permissions = EXCLUDED.permissions,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING username, email, role, is_active, last_login_at`,
      [username, email, passwordHash, role]
    );

    console.log(JSON.stringify(result.rows[0], null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});