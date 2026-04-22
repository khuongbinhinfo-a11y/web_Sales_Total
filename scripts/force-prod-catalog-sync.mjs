import fs from "fs";
import path from "path";
import { Client } from "pg";

const connectionString = String(process.env.DATABASE_URL || "").trim();

if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const migrationPath = path.join(process.cwd(), "migrations", "013_sync_study_catalog_with_local_source.sql");
const sql = fs.readFileSync(migrationPath, "utf8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");

  const appResult = await client.query(
    "SELECT id, name, slug, description FROM apps WHERE id = 'app-study-12'"
  );
  const productsResult = await client.query(
    `SELECT id, name, cycle, price, credits, active
     FROM products
     WHERE app_id = 'app-study-12'
     ORDER BY id`
  );

  console.log(
    JSON.stringify(
      {
        app: appResult.rows[0] || null,
        products: productsResult.rows
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });