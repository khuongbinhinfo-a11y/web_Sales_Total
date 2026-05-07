const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const o = await pool.query("SELECT COUNT(*) as cnt FROM orders WHERE app_id='lamviec'");
  const l = await pool.query("SELECT COUNT(*) as cnt FROM app_licenses WHERE app_id='lamviec'");
  console.log('orders with lamviec:', o.rows[0].cnt);
  console.log('licenses with lamviec:', l.rows[0].cnt);
  await pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
