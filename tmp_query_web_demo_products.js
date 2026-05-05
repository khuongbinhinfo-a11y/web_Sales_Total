require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const q = await client.query("SELECT id, name FROM products WHERE id LIKE 'prod-web-demo-%' ORDER BY id");
  console.log(q.rows);
  await client.end();
})();
