const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Các app có paid orders
  const r = await pool.query(
    "SELECT o.app_id, COUNT(*) as cnt, MIN(c.email) as sample_email FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'paid' AND o.app_id IN ('lamviec','map-pro','hair-spa-manager','app-bds-website-manager','app-prompt-image-video','app-cap12') GROUP BY o.app_id"
  );
  console.log('paid orders by app:', r.rows);
  await pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
