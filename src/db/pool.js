const { Pool } = require("pg");
const { env } = require("../config/env");

function createMissingDatabaseError() {
  const error = new Error("Missing DATABASE_URL. Configure DATABASE_URL before using database-backed routes.");
  error.code = "MISSING_DATABASE_URL";
  error.statusCode = 503;
  return error;
}

const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false
    })
  : {
      async query() {
        throw createMissingDatabaseError();
      },
      async connect() {
        throw createMissingDatabaseError();
      },
      async end() {
        return undefined;
      }
    };

module.exports = { pool };
