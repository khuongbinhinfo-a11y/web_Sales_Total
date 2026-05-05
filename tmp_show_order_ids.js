require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const q = await client.query("SELECT id, order_code FROM orders ORDER BY created_at DESC LIMIT 3");
  console.log(q.rows);
  await client.end();
})();
