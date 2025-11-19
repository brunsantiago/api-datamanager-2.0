const pool = require("../db.js");
const bcryptjs = require('bcryptjs');
const { generateToken } = require('../middleware/auth.js');

// TABLE USERS

const getAllUsers = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableUsers(idEmpresa);
    const [rows] = await pool.query("SELECT USER_CODI, USER_LEGA, USER_PERF, PERS_NOMB, PERS_SECT, PERS_FEGR FROM " + table_name + " JOIN personal ON " + table_name + ".USER_CODI = personal.PERS_CODI;");
    res.json(rows);
  }
  catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    let table_name = selectTableUsers(idEmpresa);
    const [result] = await pool.query("SELECT USER_PERF FROM "+table_name+" WHERE USER_CODI = ? ",
    [ persCodi ]);
    res.json({ result: result[0].USER_PERF });
  } catch (error) {
    return res.status(500).json({ result: "" });
  }
};

const userRegister = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_codi, user_lega, user_perf, user_pass } = req.body;
    let table_name = selectTableUsers(idEmpresa);
    let user_pass_encrypt = await bcryptjs.hash(user_pass, 8);
    const [result] = await pool.query(
      "INSERT INTO " + table_name + " SET USER_CODI = ?, USER_LEGA = ?,	USER_PERF = ?,	USER_PASS = ? ",
      [ user_codi, user_lega, user_perf, user_pass_encrypt ]
    );
    // result = 1 Registracion correcta
    return res.json({ result : result.affectedRows });
  } catch (error) {
    // Verificar si el error es por clave duplicada (usuario ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      // Usuario ya registrado - usar status 409 (Conflict)
      return res.status(409).json({ result: 2, message: "Usuario ya registrado" });
    }
    // Otro tipo de error - usar status 500
    console.error("Error en userRegister:", error);
    return res.status(500).json({ result: 0, message: "Error al registrar usuario" });
  }
};

const userLogin = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_lega, user_pass } = req.body;
    let user_pass_encrypt = await bcryptjs.hash(user_pass, 8);
    let table_name = selectTableUsers(idEmpresa);
    const [result] = await pool.query(
      "SELECT * FROM "+table_name+" WHERE USER_LEGA = ?",
      [ user_lega ]
    );
    if(result.length==0){
      return res.json({ result : "NOT_FOUND" });
    }else if (await bcryptjs.compare(user_pass,result[0].USER_PASS)) {
      // Crear payload para el token JWT
      const tokenPayload = {
        userCodi: result[0].USER_CODI,
        userLega: result[0].USER_LEGA,
        userPerf: result[0].USER_PERF,
        idEmpresa: idEmpresa
      };

      // Generar token JWT
      const token = generateToken(tokenPayload);

      // Devolver respuesta con token
      return res.json({
        result: "CORRECT_LOGIN",
        token: token,
        user: {
          codi: result[0].USER_CODI,
          lega: result[0].USER_LEGA,
          perf: result[0].USER_PERF
        }
      });
    }else {
      return res.json({ result : "INCORRECT_LOGIN" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ result: error.code, message: error.message });
  }
};

const userRecoveryKey = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_codi, user_pass } = req.body;
    let table_name = selectTableUsers(idEmpresa);
    let user_pass_encrypt = await bcryptjs.hash(user_pass, 8);
    const [result] = await pool.query("UPDATE " + table_name + " SET USER_PASS = ? WHERE USER_CODI = ?",
    [ user_pass_encrypt, user_codi]);
    if (result.affectedRows === 0){
      return res.status(404).json({ result: 0 }); // No se encontro Usuario
    }else{
      res.status(201).json({ result: 1 }); // Usuario Modificado
    }
  }
  catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userCodi, idEmpresa } = req.params;
    let table_name = selectTableUsers(idEmpresa);
    const [result] = await pool.query("DELETE FROM " + table_name + " WHERE USER_CODI = ?",[ userCodi ]);
    if (result.affectedRows === 0){
      res.status(404).json({ result: 0 }); // UserCodi no econtrado
    }else{
      res.status(201).json({ result: 1}); // Usuario Eliminado
    }
  } catch (error) {
    res.status(500).json({ result: 2 }); // Error en el Servidor
  }
};


// TABLE LAST_SESSION

const setLastSession = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableLastSession(idEmpresa);
    const { last_cper, last_ccli,	last_cobj,	last_fech,	last_dhor,	last_hhor,	last_usua,	last_pues,	last_npue, last_esta,	last_ncli,	last_nobj,	last_dhre, last_time, last_asid} = req.body;
    const [result] = await pool.query(
      "INSERT INTO " + table_name + " (LAST_CPER, LAST_CCLI,	LAST_COBJ,	LAST_FECH,	LAST_DHOR,	LAST_HHOR,	LAST_USUA,	LAST_PUES,	LAST_NPUE, LAST_ESTA, LAST_NCLI, LAST_NOBJ, LAST_DHRE, LAST_TIME, LAST_ASID ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE LAST_CCLI=VALUES(last_ccli),	LAST_COBJ=VALUES(last_cobj),	LAST_FECH=VALUES(last_fech),	LAST_DHOR=VALUES(last_dhor),	LAST_HHOR=VALUES(last_hhor),	LAST_USUA=VALUES(last_usua),	LAST_PUES=VALUES(last_pues),	LAST_NPUE =VALUES(last_npue ),	LAST_ESTA =VALUES(last_esta),	LAST_NCLI =VALUES(last_ncli),	LAST_NOBJ =VALUES(last_nobj),	LAST_DHRE=VALUES(last_dhre), LAST_TIME=VALUES(last_time), LAST_ASID=VALUES(last_asid)",
      [ last_cper, last_ccli,	last_cobj, last_fech,	last_dhor,	last_hhor,	last_usua,	last_pues,	last_npue, last_esta,	last_ncli,	last_nobj,	last_dhre, last_time, last_asid ]
    );
    return res.json({ result : result.affectedRows });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong"+error });
  }
};

const getLastSession = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    let table_name = selectTableLastSession(idEmpresa);
    const [rows] = await pool.query("SELECT * FROM " + table_name + " WHERE LAST_CPER = ? ",
    [ persCodi ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

const closeLastSession = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    let table_name = selectTableLastSession(idEmpresa);
    const [result] = await pool.query("UPDATE " + table_name + " SET LAST_ESTA = 0 WHERE LAST_CPER = ?",
    [ persCodi ]);
    if (result.affectedRows === 0){
      return res.status(404).json({ message: "Personal no econtrado" });
    }else{
      res.status(201).json({ message: "Estado cerrado correctamente" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

// TABLE ASIGVIGI

const setHoraEgresoVigilador = async (req, res) => {
  try {
    const { asigId } = req.params;
    const { horaEgreso } = req.body;
    const [result] = await pool.query("UPDATE asigvigi_app SET ASIG_HHOR = ? WHERE ASIG_ID = ?",
    [ horaEgreso, asigId]);
    if (result.affectedRows === 0){
      return res.status(200).json({ result: 0 });
    }else{
      res.status(200).json({ result: 1 });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

const addPuestoVigilador = async (req, res) => {
  try {
    const { asig_obje,	asig_vigi,	asig_fech,	asig_dhor,	asig_hhor,	asig_ause,	asig_deta,	asig_visa,	asig_obse,	asig_usua,	asig_time,	asig_fact,	asig_pues,	asig_bloq,	asig_esta,	asig_facm, asig_venc, asig_empr  } = req.body;
    const [result] = await pool.query(
      "INSERT INTO asigvigi_app (ASIG_OBJE,	ASIG_VIGI,	ASIG_FECH,	ASIG_DHOR,	ASIG_HHOR,	ASIG_AUSE,	ASIG_DETA,	ASIG_VISA,	ASIG_OBSE,	ASIG_USUA,	ASIG_TIME,	ASIG_FACT,	ASIG_PUES,	ASIG_BLOQ,	ASIG_ESTA,	ASIG_FACM, ASIG_VENC, ASIG_EMPR ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ asig_obje,	asig_vigi,	asig_fech,	asig_dhor,	asig_hhor,	asig_ause,	asig_deta,	asig_visa,	asig_obse,	asig_usua,	asig_time,	asig_fact,	asig_pues,	asig_bloq,	asig_esta,	asig_facm, asig_venc, asig_empr  ]
    );
    return res.status(201).json({ result : result.affectedRows,
                                  asigId : result.insertId,
                                });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong"+error });
  }
};

// TABLE ASIGVIGI + LAST_SESSION

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
    
    let table_name = selectTableLastSession(idEmpresa);
    
    // Segunda inserción - last_session
    await connection.query(
      "INSERT INTO " + table_name + " (LAST_CPER, LAST_CCLI, LAST_COBJ, LAST_FECH, LAST_DHOR, LAST_HHOR, LAST_USUA, LAST_PUES, LAST_NPUE, LAST_ESTA, LAST_NCLI, LAST_NOBJ, LAST_DHRE, LAST_TIME, LAST_ASID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE LAST_CCLI=VALUES(LAST_CCLI), LAST_COBJ=VALUES(LAST_COBJ), LAST_FECH=VALUES(LAST_FECH), LAST_DHOR=VALUES(LAST_DHOR), LAST_HHOR=VALUES(LAST_HHOR), LAST_USUA=VALUES(LAST_USUA), LAST_PUES=VALUES(LAST_PUES), LAST_NPUE=VALUES(LAST_NPUE), LAST_ESTA=VALUES(LAST_ESTA), LAST_NCLI=VALUES(LAST_NCLI), LAST_NOBJ=VALUES(LAST_NOBJ), LAST_DHRE=VALUES(LAST_DHRE), LAST_TIME=VALUES(LAST_TIME), LAST_ASID=VALUES(LAST_ASID)",
      [last_cper, last_ccli, last_cobj, last_fech, last_dhor, last_hhor, last_usua, last_pues, last_npue, true, last_ncli, last_nobj, last_dhre, last_time, asigId]
    );
    
    // Si todo fue exitoso, confirmar la transacción
    await connection.commit();
    
    return res.status(200).json({ 
      success: true, 
      result: 1, 
      asigId: asigId 
    });
    
  } catch (error) {
    // Si hay algún error, revertir la transacción
    await connection.rollback();
    
    console.error("Error en la transacción:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al registrar ingreso", 
      error: error.message 
    });
    
  } finally {
    // Siempre liberar la conexión
    connection.release();
  }
};

const registrarSalidaCompleta = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { asigId } = req.params;
    const { horaEgreso, horaEgresoReal, persCodi } = req.body;
    
    // Primera operación - actualizar asigvigi
    const [resultAsigvigi] = await connection.query(
      "UPDATE asigvigi_app SET ASIG_HHOR = ?, ASIG_VENC = ? WHERE ASIG_ID = ?",
      [horaEgreso, horaEgresoReal, asigId]
    );
    
    // Segunda operación - cerrar estado de sesión
    const [resultSesion] = await connection.query(
      "UPDATE " + selectTableLastSession(req.params.idEmpresa) + " SET LAST_ESTA = 0 WHERE LAST_CPER = ?",
      [persCodi]
    );
    
    // Si todo fue exitoso, confirmar la transacción
    await connection.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: "Salida registrada correctamente",
      asigResult: resultAsigvigi.affectedRows,
      sesionResult: resultSesion.affectedRows
    });
    
  } catch (error) {
    // Si hay algún error, revertir la transacción
    await connection.rollback();
    
    console.error("Error en la transacción:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al registrar salida", 
      error: error.message 
    });
    
  } finally {
    // Siempre liberar la conexión
    connection.release();
  }
};

// TABLE PERSONAL

const getPersonal = async (req, res) => {
  try {
    const { nroLegajo, idEmpresa } = req.params;
    const [rows] = await pool.query("SELECT PERS_CODI, TRIM(PERS_NOMB) AS PERS_NOMB, PERS_NDOC, PERS_FNAC, PERS_SECT, PERS_FEGR FROM personal WHERE PERS_EMPR = ? AND PERS_LEGA = ? ",
    [ idEmpresa, nroLegajo ]);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

const getNumberPersonal = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query("SELECT COUNT(*) AS counter FROM personal WHERE PERS_EMPR = ? AND PERS_FEGR IS NULL ",
    [ idEmpresa ]);
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

// TABLE OBJETIVOS (CLIENTES)

const getAllClientes = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query("SELECT OBJE_CODI, TRIM(OBJE_NOMB) AS OBJE_NOMB FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL ORDER BY OBJE_NOMB ASC",[ idEmpresa ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

const getNumberClientes = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query("SELECT COUNT(*) AS counter FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL",[ idEmpresa ]);
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

const getCliente = async (req, res) => {
  try {
    const { nombreCliente, idEmpresa } = req.params;
    const [rows] = await pool.query("SELECT OBJE_CODI, TRIM(OBJE_NOMB) AS OBJE_NOMB FROM objetivo WHERE OBJE_EMPR=? AND OBJE_BAJA IS NULL AND OBJE_NOMB=?",
    [ idEmpresa, nombreCliente ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

// TABLE PUESGRUP (OBJETIVOS)

const getAllObjetivos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query("SELECT DISTINCT GRUP_CODI, TRIM(o.OBJE_NOMB) AS OBJE_NOMB, TRIM(g.OBJE_TFAX) AS GRUP_NOMB FROM puesgrup g JOIN puestos p ON g.GRUP_CODI = p.PUES_GRUP JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI WHERE o.OBJE_BAJA IS NULL AND g.OBJE_BAJA IS NULL AND (g.GRUP_HABI = 1 OR g.GRUP_HABI = 2) AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?", [ idEmpresa ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

const getNumberObjetivos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query("SELECT COUNT(DISTINCT GRUP_CODI) AS counter FROM puesgrup g JOIN puestos p ON g.GRUP_CODI = p.PUES_GRUP JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI WHERE o.OBJE_BAJA IS NULL AND g.OBJE_BAJA IS NULL AND (g.GRUP_HABI = 1 OR g.GRUP_HABI = 2) AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?", [ idEmpresa ]);
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

const getObjetivos = async (req, res) => {
  try {
    const { idCliente } = req.params;
    const [rows] = await pool.query("SELECT DISTINCT GRUP_CODI, TRIM(OBJE_TFAX) AS GRUP_NOMB FROM puestos p, puesgrup WHERE PUES_GRUP=GRUP_CODI AND PUES_OBJE = ? AND OBJE_BAJA IS NULL AND PUES_TIPO != 3",
    [ idCliente ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

const requestCoordinate = async (req, res) => {
  try {
    const { idObjetivo } = req.params;
    const [result] = await pool.query("SELECT OBJE_COOR FROM puesgrup WHERE GRUP_CODI= ?",
    [ idObjetivo ]);
    res.json(result[0]);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

// TABLE DEVICES

const getDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    let table_name = selectTableDevices(idEmpresa);
    const [rows] = await pool.query("SELECT * FROM " + table_name + " WHERE DEVI_ANID = ?",
    [ androidID ]);
    res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ result: 1 });
  }
};

const addDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableDevices(idEmpresa);
    const { devi_anid,	devi_date,	devi_esta,	devi_ccli,	devi_cobj,	devi_marc,	devi_mode, devi_ncli,	devi_nobj, devi_nlin, devi_coor, devi_radi, devi_ubic, devi_vers } = req.body;
    const [result] = await pool.query(
      "INSERT INTO " + table_name + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ devi_anid,	devi_date,	devi_esta,	devi_ccli,	devi_cobj,	devi_marc,	devi_mode, devi_ncli,	devi_nobj, devi_nlin, devi_coor, devi_radi, devi_ubic, devi_vers ]
    );
    res.json({ result: 0 } );
  } catch (error) {
    res.json({ result: 1 });
  }
};

const getAllDevices = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableDevices(idEmpresa);
    const [rows] = await pool.query("SELECT * FROM " + table_name);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

const deleteDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    let table_name = selectTableDevices(idEmpresa);
    const [result] = await pool.query("DELETE FROM " + table_name + " WHERE DEVI_ANID = ?",
    [ androidID ]);
    if (result.affectedRows === 0){
      res.status(404).json({ result: 0 }); // Android ID no econtrado
    }else{
      res.status(201).json({ result: 1}); // Dispositivo Eliminado
    }
  } catch (error) {
    res.status(500).json({ result: 2 }); // Error en el Servidor
  }
};

const updateDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableDevices(idEmpresa);
    const { devi_nlin, devi_date,	devi_esta,	devi_ccli,	devi_cobj,	devi_ncli,	devi_nobj, devi_ubic, devi_coor, devi_radi, devi_anid } = req.body;
    const [result] = await pool.query("UPDATE " + table_name + " SET DEVI_NLIN=?, DEVI_DATE=?, DEVI_ESTA=?, DEVI_CCLI=?, DEVI_COBJ=?,	DEVI_NCLI=?, DEVI_NOBJ=?, DEVI_UBIC=?, DEVI_COOR=?, DEVI_RADI=? WHERE DEVI_ANID = ?",
    [ devi_nlin, devi_date,	devi_esta,	devi_ccli,	devi_cobj, devi_ncli,	devi_nobj, devi_ubic, devi_coor, devi_radi, devi_anid ]
    );
    if (result.affectedRows === 0){
      res.status(200).json({ result: 0 }); // Android ID no econtrado o sin cambios
    }else{
      res.status(201).json({ result: 1}); // Dispositivo Actualizado
    }
  } catch (error) {
    res.status(500).json({ result: 2 }); // Error en el Servidor
  }
};

const updateVersionDevice = async (req, res) => {
  try {
    const { androidId, idEmpresa } = req.params;
    const { appVersion } = req.body;
    let table_name = selectTableDevices(idEmpresa);
    // Actualizar versión y timestamp del último uso con NOW()
    const [result] = await pool.query("UPDATE " + table_name + " SET DEVI_VERS=?, DEVI_DATE=NOW() WHERE DEVI_ANID = ?",
    [ appVersion, androidId ]
    );
    if (result.affectedRows === 0){
      res.status(200).json({ result: 0 }); // Android ID no econtrado o sin cambios
    }else{
      res.status(201).json({ result: 1}); // Dispositivo Actualizado
    }
  } catch (error) {
    res.status(500).json({ result: 2 }); // Error en el Servidor
  }
};

// TABLE REQUEST DEVICES

const getRequestDevices = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [rows] = await pool.query("SELECT * FROM " + table_name);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

const countPending = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [result] = await pool.query("SELECT COUNT(*) AS counter FROM " + table_name + " WHERE RDEV_ESTA = 'pending' ");
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

const addRequestDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { rdev_anid,	rdev_date,	rdev_esta,	rdev_ccli,	rdev_cobj,	rdev_marc,	rdev_mode, rdev_vers,	rdev_nomb,	rdev_ncli,	rdev_nobj,	rdev_cper, rdev_nlin } = req.body;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [result] = await pool.query(
      "INSERT INTO "+table_name+" (RDEV_ANID, RDEV_DATE, RDEV_ESTA, RDEV_CCLI, RDEV_COBJ, RDEV_MARC, RDEV_MODE, RDEV_VERS,	RDEV_NOMB,	RDEV_NCLI,	RDEV_NOBJ,	RDEV_CPER, RDEV_NLIN ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE RDEV_DATE=VALUES(rdev_date), RDEV_ESTA=VALUES(rdev_esta), RDEV_CCLI=VALUES(rdev_ccli), RDEV_COBJ=VALUES(rdev_cobj), RDEV_MARC=VALUES(rdev_marc), RDEV_MODE=VALUES(rdev_mode),	RDEV_VERS=VALUES(rdev_vers), RDEV_NOMB=VALUES(rdev_nomb),	RDEV_NCLI=VALUES(rdev_ncli),	RDEV_NOBJ=VALUES(rdev_nobj),	RDEV_CPER=VALUES(rdev_cper),	RDEV_NLIN=VALUES(rdev_nlin)",
      [ rdev_anid,	rdev_date,	rdev_esta,	rdev_ccli,	rdev_cobj,	rdev_marc,	rdev_mode, rdev_vers,	rdev_nomb,	rdev_ncli,	rdev_nobj,	rdev_cper, rdev_nlin ]
    );
    return res.json({ result : result.affectedRows });
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong"+error });
  }
};

const statusAdded = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [result] = await pool.query("UPDATE " + table_name + " SET RDEV_ESTA = 'added' WHERE RDEV_ANID = ?",
    [ androidID ]);
    if (result.affectedRows === 0){
      return res.status(404).json({ message: "androidID no econtrado" }); // Cambiar status para que no salte como error cuando no hay modificaciones
    }else{
      return res.status(201).json({ message: "Estado de solicitud cambiada" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

const deleteRequestDevice = async (req, res) => {
  try {
    const { androidID, idEmpresa } = req.params;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [result] = await pool.query("DELETE FROM " + table_name + " WHERE RDEV_ANID = ?",
    [ androidID ]);
    if (result.affectedRows === 0){
      return res.status(404).json({ result: 0 }); //androidID no econtrado
    }else{
      res.status(201).json({ result: 1}); //Estado de solicitud cambiada
    }
  } catch (error) {
    return res.status(500).json({ result: 2 }); //Error en el Servidor
  }
};

const deleteAllRequestDevice = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableRequestDevices(idEmpresa);
    const [result] = await pool.query("DELETE FROM " + table_name);
    res.status(201).json({ result: 1}); // Todas las solicitudes eliminadas
  } catch (error) {
    res.status(500).json({ result: 2 }); //Error en el Servidor
  }
};

// TABLE PUESTOS

const getPuestos = async (req, res) => {
  try {
    const { idCliente, idObjetivo } = req.params;
    const [rows] = await pool.query("SELECT * FROM puestos WHERE PUES_OBJE = ? AND PUES_GRUP = ? AND PUES_TIPO != 3",
    [ idCliente, idObjetivo ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

const getPuestosConEstado = async (req, res) => {
  try {
    const { idCliente, idObjetivo, idEmpresa } = req.params;
    let table_name = selectTableLastSession(idEmpresa);
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
         FROM ${table_name} ls1
         INNER JOIN (
           SELECT LAST_PUES, MAX(CAST(LAST_ASID AS UNSIGNED)) as max_asid
           FROM ${table_name}
           GROUP BY LAST_PUES
         ) ls2 ON ls1.LAST_PUES = ls2.LAST_PUES
         AND CAST(ls1.LAST_ASID AS UNSIGNED) = ls2.max_asid
       ) latest_session ON p.PUES_CODI = latest_session.LAST_PUES
       WHERE p.PUES_OBJE = ? AND p.PUES_GRUP = ? AND p.PUES_TIPO != 3`,
      [ idCliente, idObjetivo ]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

const getAllPuestos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query("SELECT p.PUES_CODI, TRIM(o.OBJE_NOMB) AS OBJE_NOMB, TRIM(g.OBJE_TFAX) AS GRUP_NOMB, TRIM(p.PUES_NOMB) AS PUES_NOMB, p.PUES_DHOR, p.PUES_HHOR FROM puestos p JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI JOIN puesgrup g ON p.PUES_GRUP = g.GRUP_CODI WHERE o.OBJE_BAJA IS NULL AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",
    [ idEmpresa ]);
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong: " + error });
  }
};

const getNumberPuestos = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [result] = await pool.query("SELECT COUNT(*) AS counter FROM puestos p JOIN objetivo o ON p.PUES_OBJE = o.OBJE_CODI JOIN puesgrup g ON p.PUES_GRUP = g.GRUP_CODI WHERE o.OBJE_BAJA IS NULL AND p.PUES_TIPO != 3 AND o.OBJE_EMPR = ?",[ idEmpresa ]);
    return res.status(201).json({ counter: result[0].counter });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

// TABLE APP VERSION

const getLastVersion = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    let table_name = selectTableVersion(idEmpresa);
    //const [rows] = await pool.query("SELECT * FROM app_version WHERE version_code = (SELECT MAX(version_code) FROM app_version)");
    const [rows] = await pool.query("SELECT * FROM "+table_name+" WHERE version_code = (SELECT MAX(version_code) FROM "+table_name+" )" );
    res.json(rows);
  } catch (error) {
    console.error("getLastVersion error:", error);
    return res.status(500).json({ message: "Something goes wrong", error: error.message });
  }
};

const getLastVersionTest = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    //let table_name = selectTableVersion(idEmpresa);
    const [rows] = await pool.query("SELECT * FROM app_version_test WHERE version_code = (SELECT MAX(version_code) FROM app_version_test)");
    //const [rows] = await pool.query("SELECT * FROM "+table_name+" WHERE version_code = (SELECT MAX(version_code) FROM "+table_name+" )" );
    res.json(rows);
  } catch (error) {
    console.error("getLastVersion error:", error);
    return res.status(500).json({ message: "Something goes wrong", error: error.message });
  }
};

//TABLE feriados

const getAllHolidays = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM feriados");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Pseudo-random string generator
 * http://stackoverflow.com/a/27872144/383904
 * Default: return a random alpha-numeric string
 *
 * @param {Integer} len Desired length
 * @param {String} an Optional (alphanumeric), "a" (alpha), "n" (numeric)
 * @return {String}
 */
function randomString(len, an) {
  an = an && an.toLowerCase();
  var str = "",
    i = 0,
    min = an == "a" ? 10 : 0,
    max = an == "n" ? 10 : 62;
  for (; i++ < len;) {
    var r = Math.random() * (max - min) + min << 0;
    str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
  }
  return str;
}

function selectTableVersion(idEmpresa){
  if(idEmpresa==1){
    return "app_version"
  }else if(idEmpresa==2){
    return "app_version_consisa"
  }else if(idEmpresa==3){
    return "app_version_brouclean"
  }
}

function selectTableUsers(idEmpresa){
  if(idEmpresa==1){
    return "users"
  }else if(idEmpresa==2){
    return "users_consisa"
  }else if(idEmpresa==3){
    return "users_brouclean"
  }
}

function selectTableDevices(idEmpresa){
  if(idEmpresa==1){
    return "devices"
  }else if(idEmpresa==2){
    return "devices_consisa"
  }else if(idEmpresa==3){
    return "devices_brouclean"
  }
}

function selectTableRequestDevices(idEmpresa){
  if(idEmpresa==1){
    return "request_device"
  }else if(idEmpresa==2){
    return "request_device_consisa"
  }else if(idEmpresa==3){
    return "request_device_brouclean"
  }
}

function selectTableLastSession(idEmpresa){
  if(idEmpresa==1){
    return "last_session"
  }else if(idEmpresa==2){
    return "last_session_consisa"
  }else if(idEmpresa==3){
    return "last_session_brouclean"
  }
}

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  userRecoveryKey,
  deleteUser,
  setLastSession,
  getLastSession,
  closeLastSession,
  setHoraEgresoVigilador,
  addPuestoVigilador,
  getPersonal,
  getNumberPersonal,
  getAllClientes,
  getNumberClientes,
  getCliente,
  getAllObjetivos,
  getNumberObjetivos,
  getObjetivos,
  requestCoordinate,
  getDevice,
  addDevice,
  getAllDevices,
  deleteDevice,
  updateDevice,
  addRequestDevice,
  getRequestDevices,
  countPending,
  statusAdded,
  deleteRequestDevice,
  deleteAllRequestDevice,
  getPuestos,
  getPuestosConEstado,
  getAllPuestos,
  getNumberPuestos,
  getLastVersion,
  updateVersionDevice,
  getAllHolidays,
  registrarIngresoCompleto,
  registrarSalidaCompleta,
  getLastVersionTest
  };
