const pool = require("../db.js");

// ============================================================================
// DEVICES
// ============================================================================

/**
 * Obtiene un dispositivo por Android ID
 */
const getDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM devices WHERE DEVI_ANID = ? AND ENTITY_ID = ?",
      [androidID, idEmpresa]
    );
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ result: 1 });
  }
};

/**
 * Agrega un nuevo dispositivo
 */
const addDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { devi_anid, devi_date, devi_esta, devi_ccli, devi_cobj, devi_marc, devi_mode, devi_ncli, devi_nobj, devi_nlin, devi_coor, devi_radi, devi_ubic, devi_vers } = req.body;
    const [result] = await pool.query(
      "INSERT INTO devices (DEVI_ANID, DEVI_DATE, DEVI_ESTA, DEVI_CCLI, DEVI_COBJ, DEVI_MARC, DEVI_MODE, DEVI_NCLI, DEVI_NOBJ, DEVI_NLIN, DEVI_COOR, DEVI_RADI, DEVI_UBIC, DEVI_VERS, ENTITY_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [devi_anid, devi_date, devi_esta, devi_ccli, devi_cobj, devi_marc, devi_mode, devi_ncli, devi_nobj, devi_nlin, devi_coor, devi_radi, devi_ubic, devi_vers, idEmpresa]
    );
    res.json({ result: 0 });
  } catch (error) {
    res.json({ result: 1 });
  }
};

/**
 * Obtiene todos los dispositivos de una empresa
 */
const getAllDevices = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM devices WHERE ENTITY_ID = ?",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Elimina un dispositivo
 */
const deleteDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    const [result] = await pool.query(
      "DELETE FROM devices WHERE DEVI_ANID = ? AND ENTITY_ID = ?",
      [androidID, idEmpresa]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ result: 0 });
    } else {
      res.status(201).json({ result: 1 });
    }
  } catch (error) {
    res.status(500).json({ result: 2 });
  }
};

/**
 * Actualiza un dispositivo
 */
const updateDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { devi_nlin, devi_date, devi_esta, devi_ccli, devi_cobj, devi_ncli, devi_nobj, devi_ubic, devi_coor, devi_radi, devi_pani, devi_anid } = req.body;
    const panicValue = devi_pani !== undefined ? devi_pani : 0;
    const [result] = await pool.query(
      "UPDATE devices SET DEVI_NLIN=?, DEVI_DATE=?, DEVI_ESTA=?, DEVI_CCLI=?, DEVI_COBJ=?, DEVI_NCLI=?, DEVI_NOBJ=?, DEVI_UBIC=?, DEVI_COOR=?, DEVI_RADI=?, DEVI_PANI=? WHERE DEVI_ANID = ? AND ENTITY_ID = ?",
      [devi_nlin, devi_date, devi_esta, devi_ccli, devi_cobj, devi_ncli, devi_nobj, devi_ubic, devi_coor, devi_radi, panicValue, devi_anid, idEmpresa]
    );
    if (result.affectedRows === 0) {
      res.status(200).json({ result: 0 });
    } else {
      res.status(201).json({ result: 1 });
    }
  } catch (error) {
    res.status(500).json({ result: 2 });
  }
};

/**
 * Actualiza la versión de la app en un dispositivo
 */
const updateVersionDevice = async (req, res) => {
  try {
    const { androidId, idEmpresa } = req.params;
    const { appVersion } = req.body;
    const [result] = await pool.query(
      "UPDATE devices SET DEVI_VERS=?, DEVI_DATE=NOW() WHERE DEVI_ANID = ? AND ENTITY_ID = ?",
      [appVersion, androidId, idEmpresa]
    );
    if (result.affectedRows === 0) {
      res.status(200).json({ result: 0 });
    } else {
      res.status(201).json({ result: 1 });
    }
  } catch (error) {
    res.status(500).json({ result: 2 });
  }
};

/**
 * Actualiza el estado del botón de pánico de un dispositivo
 * PATCH /devices/panic/:androidId/:idEmpresa
 */
const updatePanicStatus = async (req, res) => {
  try {
    const { androidId, idEmpresa } = req.params;
    const { enabled } = req.body; // true o false

    const panicValue = enabled ? 1 : 0;
    const [result] = await pool.query(
      "UPDATE devices SET DEVI_PANI = ? WHERE DEVI_ANID = ? AND ENTITY_ID = ?",
      [panicValue, androidId, idEmpresa]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 0, message: "Dispositivo no encontrado" });
    }

    return res.json({
      result: 1,
      message: enabled ? "Pánico habilitado" : "Pánico deshabilitado"
    });
  } catch (error) {
    console.error("Error en updatePanicStatus:", error);
    return res.status(500).json({ result: 2, message: error.message });
  }
};

// ============================================================================
// REQUEST DEVICES (Solicitudes de dispositivos)
// ============================================================================

/**
 * Obtiene todas las solicitudes de dispositivos
 */
const getRequestDevices = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM request_device WHERE ENTITY_ID = ?",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Cuenta solicitudes pendientes
 */
const countPending = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT COUNT(*) AS counter FROM request_device WHERE RDEV_ESTA = 'pending' AND ENTITY_ID = ?",
      [idEmpresa]
    );
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

/**
 * Agrega una solicitud de dispositivo
 */
const addRequestDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { rdev_anid, rdev_date, rdev_esta, rdev_ccli, rdev_cobj, rdev_marc, rdev_mode, rdev_vers, rdev_nomb, rdev_ncli, rdev_nobj, rdev_cper, rdev_nlin } = req.body;
    const [result] = await pool.query(
      "INSERT INTO request_device (RDEV_ANID, RDEV_DATE, RDEV_ESTA, RDEV_CCLI, RDEV_COBJ, RDEV_MARC, RDEV_MODE, RDEV_VERS, RDEV_NOMB, RDEV_NCLI, RDEV_NOBJ, RDEV_CPER, RDEV_NLIN, ENTITY_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE RDEV_DATE=VALUES(RDEV_DATE), RDEV_ESTA=VALUES(RDEV_ESTA), RDEV_CCLI=VALUES(RDEV_CCLI), RDEV_COBJ=VALUES(RDEV_COBJ), RDEV_MARC=VALUES(RDEV_MARC), RDEV_MODE=VALUES(RDEV_MODE), RDEV_VERS=VALUES(RDEV_VERS), RDEV_NOMB=VALUES(RDEV_NOMB), RDEV_NCLI=VALUES(RDEV_NCLI), RDEV_NOBJ=VALUES(RDEV_NOBJ), RDEV_CPER=VALUES(RDEV_CPER), RDEV_NLIN=VALUES(RDEV_NLIN)",
      [rdev_anid, rdev_date, rdev_esta, rdev_ccli, rdev_cobj, rdev_marc, rdev_mode, rdev_vers, rdev_nomb, rdev_ncli, rdev_nobj, rdev_cper, rdev_nlin, idEmpresa]
    );
    return res.json({ result: result.affectedRows });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

/**
 * Cambia estado de solicitud a 'added'
 */
const statusAdded = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    const [result] = await pool.query(
      "UPDATE request_device SET RDEV_ESTA = 'added' WHERE RDEV_ANID = ? AND ENTITY_ID = ?",
      [androidID, idEmpresa]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "androidID no encontrado" });
    } else {
      return res.status(201).json({ message: "Estado de solicitud cambiada" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

/**
 * Elimina una solicitud de dispositivo
 */
const deleteRequestDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    const [result] = await pool.query(
      "DELETE FROM request_device WHERE RDEV_ANID = ? AND ENTITY_ID = ?",
      [androidID, idEmpresa]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 0 });
    } else {
      res.status(201).json({ result: 1 });
    }
  } catch (error) {
    return res.status(500).json({ result: 2 });
  }
};

/**
 * Elimina todas las solicitudes de dispositivos
 */
const deleteAllRequestDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query(
      "DELETE FROM request_device WHERE ENTITY_ID = ?",
      [idEmpresa]
    );
    res.status(201).json({ result: 1 });
  } catch (error) {
    res.status(500).json({ result: 2 });
  }
};

module.exports = {
  // Devices
  getDevice,
  addDevice,
  getAllDevices,
  deleteDevice,
  updateDevice,
  updateVersionDevice,
  updatePanicStatus,
  // Request Devices
  getRequestDevices,
  countPending,
  addRequestDevice,
  statusAdded,
  deleteRequestDevice,
  deleteAllRequestDevice
};
