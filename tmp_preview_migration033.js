require('dotenv').config({ path: 'f:/web_Sales_Total/.env' });
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const sql = fs.readFileSync('f:/web_Sales_Total/migrations/033_migrate_app_id_hoctap_to_app_study_12.sql', 'utf8');
  console.log('Chạy migration 033...');
  try {
    await pool.query(sql);
    console.log('Migration 033 THÀNH CÔNG!');
    // Verify
    const checks = [
      { label: 'app_licenses', q: "SELECT COUNT(*) AS cnt FROM app_licenses WHERE app_id = 'hoctap-cap-01'" },
      { label: 'app_license_runtime_leases', q: "SELECT COUNT(*) AS cnt FROM app_license_runtime_leases WHERE app_id = 'hoctap-cap-01'" },
      { label: 'subscriptions', q: "SELECT COUNT(*) AS cnt FROM subscriptions WHERE app_id = 'hoctap-cap-01'" },
      { label: 'orders', q: "SELECT COUNT(*) AS cnt FROM orders WHERE app_id = 'hoctap-cap-01'" },
      { label: 'app_registry', q: "SELECT COUNT(*) AS cnt FROM app_registry WHERE app_id = 'hoctap-cap-01'" },
    ];
    console.log('\n=== Xác minh sau migration (số row còn hoctap-cap-01) ===');
    for (const { label, q } of checks) {
      const r = await pool.query(q);
      console.log(`  ${label}: ${r.rows[0].cnt} (phải = 0)`);
    }
  } catch(e) {
    console.error('Migration 033 THẤT BẠI:', e.message);
  }
  await pool.end();
})();
