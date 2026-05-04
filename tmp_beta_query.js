const { pool } = require("./src/db/pool");
(async () => {
  try {
    const sql = "SELECT l.license_key, l.product_id, l.device_id, c.email FROM app_licenses l LEFT JOIN customers c ON c.id=l.customer_id WHERE lower(l.product_id)='cap01_beta_year_299' AND l.status<>'revoked' ORDER BY l.updated_at DESC LIMIT 3";
    const r = await pool.query(sql);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error("DB_QUERY_ERROR", e.message);
  } finally {
    await pool.end().catch(() => {});
  }
})();
