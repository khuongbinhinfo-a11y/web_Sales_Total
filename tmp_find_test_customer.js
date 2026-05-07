require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`
  SELECT c.id, c.email, c.full_name, o.app_id, o.status, o.paid_at
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE o.status = 'paid'
  ORDER BY o.paid_at DESC
  LIMIT 5
`).then(r => {
  r.rows.forEach(row => console.log(JSON.stringify(row)));
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
