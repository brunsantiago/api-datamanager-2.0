const pool = require("../db.js");

/**
 * Obtiene todos los clientes activos
 */
const getAllClientes = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT OBJE_CODI, TRIM(OBJE_NOMB) AS OBJE_NOMB FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL ORDER BY OBJE_NOMB ASC",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Cuenta el total de clientes activos
 */
const getNumberClientes = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT COUNT(*) AS counter FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL",
      [idEmpresa]
    );
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

/**
 * Obtiene un cliente por nombre
 */
const getCliente = async (req, res) => {
  try {
    const { nombreCliente, idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT OBJE_CODI, TRIM(OBJE_NOMB) AS OBJE_NOMB FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL AND OBJE_NOMB=?",
      [idEmpresa, nombreCliente]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

module.exports = {
  getAllClientes,
  getNumberClientes,
  getCliente
};
