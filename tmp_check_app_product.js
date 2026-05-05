require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const appQ = await client.query("SELECT id FROM apps WHERE id = 'app-web-demo-services'");
  const productQ = await client.query("SELECT id FROM products WHERE id = 'prod-web-demo-company-basic'");
  console.log({ appExists: appQ.rowCount, productExists: productQ.rowCount });
  await client.end();
})();
