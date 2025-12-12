const pool = require("../db.js");

// ============================================================================
// LAST SESSION
// ============================================================================

/**
 * Guarda/actualiza la última sesión de un empleado
 */
const setLastSession = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { last_cper, last_ccli, last_cobj, last_fech, last_dhor, last_hhor, last_usua, last_pues, last_npue, last_esta, last_ncli, last_nobj, last_dhre, last_time, last_asid } = req.body;
    const [result] = await pool.query(
      "INSERT INTO last_session (LAST_CPER, LAST_CCLI, LAST_COBJ, LAST_FECH, LAST_DHOR, LAST_HHOR, LAST_USUA, LAST_PUES, LAST_NPUE, LAST_ESTA, LAST_NCLI, LAST_NOBJ, LAST_DHRE, LAST_TIME, LAST_ASID, ENTITY_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE LAST_CCLI=VALUES(LAST_CCLI), LAST_COBJ=VALUES(LAST_COBJ), LAST_FECH=VALUES(LAST_FECH), LAST_DHOR=VALUES(LAST_DHOR), LAST_HHOR=VALUES(LAST_HHOR), LAST_USUA=VALUES(LAST_USUA), LAST_PUES=VALUES(LAST_PUES), LAST_NPUE=VALUES(LAST_NPUE), LAST_ESTA=VALUES(LAST_ESTA), LAST_NCLI=VALUES(LAST_NCLI), LAST_NOBJ=VALUES(LAST_NOBJ), LAST_DHRE=VALUES(LAST_DHRE), LAST_TIME=VALUES(LAST_TIME), LAST_ASID=VALUES(LAST_ASID)",
      [last_cper, last_ccli, last_cobj, last_fech, last_dhor, last_hhor, last_usua, last_pues, last_npue, last_esta, last_ncli, last_nobj, last_dhre, last_time, last_asid, idEmpresa]
    );
    return res.json({ result: result.affectedRows });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

/**
 * Obtiene la última sesión de un empleado
 */
const getLastSession = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM last_session WHERE LAST_CPER = ? AND ENTITY_ID = ?",
      [persCodi, idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Cierra la última sesión de un empleado
 */
const closeLastSession = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    const [result] = await pool.query(
      "UPDATE last_session SET LAST_ESTA = 0 WHERE LAST_CPER = ? AND ENTITY_ID = ?",
      [persCodi, idEmpresa]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Personal no encontrado" });
    } else {
      res.status(201).json({ message: "Estado cerrado correctamente" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

// ============================================================================
// ASIGVIGI (Asignaciones de vigiladores)
// ============================================================================

/**
 * Actualiza hora de egreso de un vigilador
 */
const setHoraEgresoVigilador = async (req, res) => {
  try {
    const { asigId } = req.params;
    const { horaEgreso } = req.body;
    const [result] = await pool.query(
      "UPDATE asigvigi_app SET ASIG_HHOR = ? WHERE ASIG_ID = ?",
      [horaEgreso, asigId]
    );
    if (result.affectedRows === 0) {
      return res.status(200).json({ result: 0 });
    } else {
      res.status(200).json({ result: 1 });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

/**
 * Agrega asignación de puesto a vigilador
 */
const addPuestoVigilador = async (req, res) => {
  try {
    const { asig_obje, asig_vigi, asig_fech, asig_dhor, asig_hhor, asig_ause, asig_deta, asig_visa, asig_obse, asig_usua, asig_time, asig_fact, asig_pues, asig_bloq, asig_esta, asig_facm, asig_venc, asig_empr } = req.body;
    const [result] = await pool.query(
      "INSERT INTO asigvigi_app (ASIG_OBJE, ASIG_VIGI, ASIG_FECH, ASIG_DHOR, ASIG_HHOR, ASIG_AUSE, ASIG_DETA, ASIG_VISA, ASIG_OBSE, ASIG_USUA, ASIG_TIME, ASIG_FACT, ASIG_PUES, ASIG_BLOQ, ASIG_ESTA, ASIG_FACM, ASIG_VENC, ASIG_EMPR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [asig_obje, asig_vigi, asig_fech, asig_dhor, asig_hhor, asig_ause, asig_deta, asig_visa, asig_obse, asig_usua, asig_time, asig_fact, asig_pues, asig_bloq, asig_esta, asig_facm, asig_venc, asig_empr]
    );
    return res.status(201).json({
      result: result.affectedRows,
      asigId: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

// ============================================================================
// TRANSACCIONES (Ingreso/Egreso completo)
// ============================================================================

/**
 * Registra ingreso completo (asigvigi + last_session) en transacción
 */
const registrarIngresoCompleto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Datos para asigvigi
    const {
      asig_obje, asig_vigi, asig_fech, asig_dhor, asig_visa,
      asig_usua, asig_time, asig_pues, asig_bloq, asig_facm, asig_venc, asig_empr
    } = req.body;

    // Primer inserción - asigvigi
    const [resultAsigvigi] = await connection.query(
      "INSERT INTO asigvigi_app (ASIG_OBJE, ASIG_VIGI, ASIG_FECH, ASIG_DHOR, ASIG_HHOR, ASIG_AUSE, ASIG_DETA, ASIG_VISA, ASIG_OBSE, ASIG_USUA, ASIG_TIME, ASIG_FACT, ASIG_PUES, ASIG_BLOQ, ASIG_ESTA, ASIG_FACM, ASIG_VENC, ASIG_EMPR) VALUES (?, ?, ?, ?, '', '', '', ?, '', ?, ?, '', ?, ?, ?, ?, ?, ?)",
      [asig_obje, asig_vigi, asig_fech, asig_dhor, asig_visa, asig_usua, asig_time, asig_pues, asig_bloq, asig_bloq, asig_facm, asig_venc, asig_empr]
    );

    const asigId = resultAsigvigi.insertId;

    // Datos para last_session
    const {
      last_cper, last_ccli, last_cobj, last_fech, last_dhor, last_hhor,
      last_usua, last_time, last_pues, last_npue, last_ncli, last_nobj,
      last_dhre, idEmpresa
    } = req.body;

    // Segunda inserción - last_session con ENTITY_ID
    await connection.query(
      "INSERT INTO last_session (LAST_CPER, LAST_CCLI, LAST_COBJ, LAST_FECH, LAST_DHOR, LAST_HHOR, LAST_USUA, LAST_PUES, LAST_NPUE, LAST_ESTA, LAST_NCLI, LAST_NOBJ, LAST_DHRE, LAST_TIME, LAST_ASID, ENTITY_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE LAST_CCLI=VALUES(LAST_CCLI), LAST_COBJ=VALUES(LAST_COBJ), LAST_FECH=VALUES(LAST_FECH), LAST_DHOR=VALUES(LAST_DHOR), LAST_HHOR=VALUES(LAST_HHOR), LAST_USUA=VALUES(LAST_USUA), LAST_PUES=VALUES(LAST_PUES), LAST_NPUE=VALUES(LAST_NPUE), LAST_ESTA=VALUES(LAST_ESTA), LAST_NCLI=VALUES(LAST_NCLI), LAST_NOBJ=VALUES(LAST_NOBJ), LAST_DHRE=VALUES(LAST_DHRE), LAST_TIME=VALUES(LAST_TIME), LAST_ASID=VALUES(LAST_ASID)",
      [last_cper, last_ccli, last_cobj, last_fech, last_dhor, last_hhor, last_usua, last_pues, last_npue, true, last_ncli, last_nobj, last_dhre, last_time, asigId, idEmpresa]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      result: 1,
      asigId: asigId
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error en la transacción:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar ingreso",
      error: error.message
    });

  } finally {
    connection.release();
  }
};

/**
 * Registra salida completa (asigvigi + last_session) en transacción
 */
const registrarSalidaCompleta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { asigId, idEmpresa } = req.params;
    const { horaEgreso, horaEgresoReal, persCodi } = req.body;

    // Primera operación - actualizar asigvigi
    const [resultAsigvigi] = await connection.query(
      "UPDATE asigvigi_app SET ASIG_HHOR = ?, ASIG_VENC = ? WHERE ASIG_ID = ?",
      [horaEgreso, horaEgresoReal, asigId]
    );

    // Segunda operación - cerrar estado de sesión con ENTITY_ID
    const [resultSesion] = await connection.query(
      "UPDATE last_session SET LAST_ESTA = 0 WHERE LAST_CPER = ? AND ENTITY_ID = ?",
      [persCodi, idEmpresa]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Salida registrada correctamente",
      asigResult: resultAsigvigi.affectedRows,
      sesionResult: resultSesion.affectedRows
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error en la transacción:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar salida",
      error: error.message
    });

  } finally {
    connection.release();
  }
};

module.exports = {
  // Last Session
  setLastSession,
  getLastSession,
  closeLastSession,
  // Asigvigi
  setHoraEgresoVigilador,
  addPuestoVigilador,
  // Transacciones
  registrarIngresoCompleto,
  registrarSalidaCompleta
};
