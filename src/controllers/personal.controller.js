const pool = require("../db.js");

/**
 * Obtiene un empleado por número de legajo
 */
const getPersonal = async (req, res) => {
  try {
    const { nroLegajo, idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT PERS_CODI, TRIM(PERS_NOMB) AS PERS_NOMB, PERS_NDOC, PERS_FNAC, PERS_SECT, PERS_FEGR FROM personal WHERE PERS_EMPR = ? AND PERS_LEGA = ?",
      [idEmpresa, nroLegajo]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Cuenta el total de empleados activos
 */
const getNumberPersonal = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT COUNT(*) AS counter FROM personal WHERE PERS_EMPR = ? AND PERS_FEGR IS NULL",
      [idEmpresa]
    );
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

module.exports = {
  getPersonal,
  getNumberPersonal
};
