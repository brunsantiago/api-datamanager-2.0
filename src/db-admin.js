const { createPool } = require("mysql2/promise");

const {
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  DB_FLAGS
} = require("./config.js");

// Pool de conexión para la base de datos de administración
const poolAdmin = createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  database: "appcontrol_admin",
  flags: DB_FLAGS
});

module.exports = poolAdmin;
