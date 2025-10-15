const { createPool } = require("mysql2/promise");

const {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  DB_FLAGS
} = require("./config.js");

const pool = createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  database: DB_DATABASE,
  flags: DB_FLAGS
});


module.exports = pool;
