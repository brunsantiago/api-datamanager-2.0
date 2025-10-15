const pool = require("../db.js");

const index = (req, res) => res.json({ message: "welcome to my api" });

const ping = async (req, res) => {
  const [result] = await pool.query('SELECT 1 as result');
  res.json(result[0]);
};

module.exports = { index, ping };
