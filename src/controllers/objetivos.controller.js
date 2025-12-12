const pool = require("../db.js");

/**
 * Obtiene todos los objetivos (puesgrup) activos
 */
const getAllObjetivos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT DISTINCT GRUP_CODI, TRIM(o.OBJE_NOMB) AS OBJE_NOMB, TRIM(g.OBJE_TFAX) AS GRUP_NOMB FROM puesgrup g JOIN puestos p ON g.GRUP_CODI = p.PUES_GRUP JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI WHERE o.OBJE_BAJA IS NULL AND g.OBJE_BAJA IS NULL AND (g.GRUP_HABI = 1 OR g.GRUP_HABI = 2) AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

/**
 * Cuenta el total de objetivos activos
 */
const getNumberObjetivos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT COUNT(DISTINCT GRUP_CODI) AS counter FROM puesgrup g JOIN puestos p ON g.GRUP_CODI = p.PUES_GRUP JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI WHERE o.OBJE_BAJA IS NULL AND g.OBJE_BAJA IS NULL AND (g.GRUP_HABI = 1 OR g.GRUP_HABI = 2) AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",
      [idEmpresa]
    );
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

/**
 * Obtiene objetivos por cliente
 */
const getObjetivos = async (req, res) => {
  try {
    const { idCliente } = req.params;
    const [rows] = await pool.query(
      "SELECT DISTINCT GRUP_CODI, TRIM(OBJE_TFAX) AS GRUP_NOMB FROM puestos p, puesgrup WHERE PUES_GRUP=GRUP_CODI AND PUES_OBJE = ? AND OBJE_BAJA IS NULL AND PUES_TIPO != 3",
      [idCliente]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

/**
 * Obtiene coordenadas de un objetivo
 */
const requestCoordinate = async (req, res) => {
  try {
    const { idObjetivo } = req.params;
    const [result] = await pool.query(
      "SELECT OBJE_COOR FROM puesgrup WHERE GRUP_CODI = ?",
      [idObjetivo]
    );
    res.json(result[0]);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

module.exports = {
  getAllObjetivos,
  getNumberObjetivos,
  getObjetivos,
  requestCoordinate
};
