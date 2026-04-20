const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Copy .env.example to .env and set DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = { pool };
