const { pool } = require("./src/db/pool");
const sql = "SELECT license_key, app_id, product_id, plan_code, status FROM app_licenses WHERE license_key ILIKE $1 OR license_key ILIKE $2 ORDER BY created_at DESC LIMIT 20";
pool.query(sql, ['%MOBOIF8%', '%E18F2E%']).then((r) => {
  console.log(JSON.stringify({ rowCount: r.rowCount, rows: r.rows }, null, 2));
}).catch((e) => {
  console.error('QUERY_ERROR_MESSAGE', e && e.message);
  console.error('QUERY_ERROR_CODE', e && e.code);
  process.exitCode = 1;
}).finally(async () => { try { await pool.end(); } catch {} });
