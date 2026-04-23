const { pool } = require("./src/db/pool");
const key = "WSTL-MOBOIF8-E18F2E";
const sql = "SELECT al.license_key, al.app_id, al.product_id, al.plan_code, al.status, al.expires_at, al.metadata, p.name AS product_name, p.cycle AS product_cycle FROM app_licenses al LEFT JOIN products p ON p.id = al.product_id WHERE al.license_key = $1";
pool.query(sql, [key]).then((r) => {
  console.log(JSON.stringify({ rowCount: r.rowCount, rows: r.rows }, null, 2));
}).catch((e) => {
  console.error('QUERY_ERROR_MESSAGE', e && e.message);
  console.error('QUERY_ERROR_CODE', e && e.code);
  process.exitCode = 1;
}).finally(async () => { try { await pool.end(); } catch {} });
