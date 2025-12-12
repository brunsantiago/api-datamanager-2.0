const pool = require("../db.js");

/**
 * Obtiene todos los feriados
 */
const getAllHolidays = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM feriados");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

module.exports = {
  getAllHolidays
};
