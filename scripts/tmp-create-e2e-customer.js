const { pool } = require("../src/db/pool");
const { hashPassword } = require("../src/modules/auth");

(async () => {
  const ts = Date.now();
  const email = `session.e2e+${ts}@example.com`;
  const id = `cus-e2e-${ts}`;
  const pass = "Aa12345678!";
  const hash = hashPassword(pass);

  await pool.query(
    "INSERT INTO customers(id, email, full_name, password_hash) VALUES ($1, $2, $3, $4)",
    [id, email, "E2E Session", hash]
  );

  process.stdout.write(JSON.stringify({ id, email, pass }));
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
