const pool = require("../db.js");
const bcryptjs = require('bcryptjs');
const { generateToken } = require('../middleware/auth.js');

/**
 * Obtiene todos los usuarios de una empresa
 */
const getAllUsers = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT USER_CODI, USER_LEGA, USER_PERF, PERS_NOMB, PERS_SECT, PERS_FEGR FROM users JOIN personal ON users.USER_CODI = personal.PERS_CODI WHERE users.ENTITY_ID = ?",
      [idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" });
  }
};

/**
 * Obtiene el perfil de un usuario específico
 */
const getUserProfile = async (req, res) => {
  try {
    const { persCodi, idEmpresa } = req.params;
    const [result] = await pool.query(
      "SELECT USER_PERF FROM users WHERE USER_CODI = ? AND ENTITY_ID = ?",
      [persCodi, idEmpresa]
    );
    res.json({ result: result[0].USER_PERF });
  } catch (error) {
    return res.status(500).json({ result: "" });
  }
};

/**
 * Registra un nuevo usuario
 */
const userRegister = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_codi, user_lega, user_perf, user_pass } = req.body;
    let user_pass_encrypt = await bcryptjs.hash(user_pass, 8);
    const [result] = await pool.query(
      "INSERT INTO users (USER_CODI, USER_LEGA, USER_PERF, USER_PASS, ENTITY_ID) VALUES (?, ?, ?, ?, ?)",
      [user_codi, user_lega, user_perf, user_pass_encrypt, idEmpresa]
    );
    return res.json({ result: result.affectedRows });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ result: 2, message: "Usuario ya registrado" });
    }
    console.error("Error en userRegister:", error);
    return res.status(500).json({ result: 0, message: "Error al registrar usuario" });
  }
};

/**
 * Login de usuario - Genera JWT token
 */
const userLogin = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_lega, user_pass, androidId } = req.body;
    const [result] = await pool.query(
      "SELECT * FROM users WHERE USER_LEGA = ? AND ENTITY_ID = ?",
      [user_lega, idEmpresa]
    );

    if (result.length == 0) {
      return res.json({ result: "NOT_FOUND" });
    }

    if (await bcryptjs.compare(user_pass, result[0].USER_PASS)) {
      const tokenPayload = {
        userCodi: result[0].USER_CODI,
        userLega: result[0].USER_LEGA,
        userPerf: result[0].USER_PERF,
        idEmpresa: idEmpresa,
        androidId: androidId || null
      };

      const token = generateToken(tokenPayload);

      return res.json({
        result: "CORRECT_LOGIN",
        token: token,
        user: {
          codi: result[0].USER_CODI,
          lega: result[0].USER_LEGA,
          perf: result[0].USER_PERF
        }
      });
    } else {
      return res.json({ result: "INCORRECT_LOGIN" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ result: error.code, message: error.message });
  }
};

/**
 * Recuperación de contraseña
 */
const userRecoveryKey = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const { user_codi, user_pass } = req.body;
    let user_pass_encrypt = await bcryptjs.hash(user_pass, 8);
    const [result] = await pool.query(
      "UPDATE users SET USER_PASS = ? WHERE USER_CODI = ? AND ENTITY_ID = ?",
      [user_pass_encrypt, user_codi, idEmpresa]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 0 });
    } else {
      res.status(201).json({ result: 1 });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something goes wrong" + error });
  }
};

/**
 * Elimina un usuario
 */
const deleteUser = async (req, res) => {
  try {
    const { userCodi, idEmpresa } = req.params;
    const [result] = await pool.query(
      "DELETE FROM users WHERE USER_CODI = ? AND ENTITY_ID = ?",
      [userCodi, idEmpresa]
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

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  userRecoveryKey,
  deleteUser
};
