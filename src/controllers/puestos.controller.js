const pool = require("../db.js");

/**
 * Obtiene puestos por cliente y objetivo
 */
const getPuestos = async (req, res) => {
  try {
    const { idCliente, idObjetivo } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM puestos WHERE PUES_OBJE = ? AND PUES_GRUP = ? AND PUES_TIPO != 3",
      [idCliente, idObjetivo]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Obtiene puestos con estado de ocupación
 */
const getPuestosConEstado = async (req, res) => {
  try {
    const { idCliente, idObjetivo, idEmpresa } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*,
       CASE
         WHEN latest_session.LAST_ESTA = 1 AND (
           -- Turno diurno: DHOR <= HHOR (mismo día)
           (latest_session.LAST_DHOR <= latest_session.LAST_HHOR AND CONCAT(latest_session.LAST_FECH, ' ', latest_session.LAST_HHOR) > NOW())
           OR
           -- Turno nocturno: DHOR > HHOR (cruza medianoche, +1 día)
           (latest_session.LAST_DHOR > latest_session.LAST_HHOR AND CONCAT(DATE_ADD(latest_session.LAST_FECH, INTERVAL 1 DAY), ' ', latest_session.LAST_HHOR) > NOW())
         ) THEN 1
         ELSE 0
       END AS ocupado
       FROM puestos p
       LEFT JOIN (
         SELECT ls1.*
         FROM last_session ls1
         INNER JOIN (
           SELECT LAST_PUES, MAX(CAST(LAST_ASID AS UNSIGNED)) as max_asid
           FROM last_session
           WHERE ENTITY_ID = ?
           GROUP BY LAST_PUES
         ) ls2 ON ls1.LAST_PUES = ls2.LAST_PUES
         AND CAST(ls1.LAST_ASID AS UNSIGNED) = ls2.max_asid
         WHERE ls1.ENTITY_ID = ?
       ) latest_session ON p.PUES_CODI = latest_session.LAST_PUES
       WHERE p.PUES_OBJE = ? AND p.PUES_GRUP = ? AND p.PUES_TIPO != 3`,
      [idEmpresa, idEmpresa, idCliente, idObjetivo]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

/**
 * Obtiene todos los puestos de una empresa
 */
const getAllPuestos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT p.PUES_CODI, TRIM(o.OBJE_NOMB) AS OBJE_NOMB, TRIM(g.OBJE_TFAX) AS GRUP_NOMB, TRIM(p.PUES_NOMB) AS PUES_NOMB, p.PUES_DHOR, p.PUES_HHOR FROM puestos p JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI JOIN puesgrup g ON p.PUES_GRUP = g.GRUP_CODI WHERE o.OBJE_BAJA IS NULL AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

/**
 * Cuenta el total de puestos
 */
const getNumberPuestos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT COUNT(*) AS counter FROM puestos p JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI JOIN puesgrup g ON p.PUES_GRUP = g.GRUP_CODI WHERE o.OBJE_BAJA IS NULL AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",
      [idEmpresa]
    );
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

module.exports = {
  getPuestos,
  getPuestosConEstado,
  getAllPuestos,
  getNumberPuestos
};
