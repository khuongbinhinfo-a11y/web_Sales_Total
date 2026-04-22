const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

async function runMigrations(options = {}) {
  const { closePool = true } = options;
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationDir = path.join(__dirname, "..", "..", "migrations");
    const files = fs
      .readdirSync(migrationDir)
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const exists = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
      if (exists.rowCount > 0) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      transactionStarted = true;
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      transactionStarted = false;
      console.log(`Applied migration: ${file}`);
    }

    console.log("Migrations completed.");
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error("Migration failed:", error.message);
    throw error;
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations().catch(() => {
    process.exitCode = 1;
  });
}
