const poolAdmin = require("../db-admin.js");
const { verifyFirebaseToken } = require("../config/firebase-admin.js");

/**
 * POST /api/v2/auth/login
 * Autentica un usuario con Firebase y retorna su API key
 *
 * Body esperado:
 * {
 *   "idToken": "firebase-id-token-here"
 * }
 *
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "apiKey": "xxx",
 *   "account": { account_id, billing_name, ... },
 *   "user": { firebase_uid, email, role }
 * }
 */
const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Validar que venga el token
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Token de Firebase requerido"
      });
    }

    // 1. Verificar el token con Firebase Admin
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token de Firebase inválido o expirado",
        error: error.message
      });
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    // 2. Buscar el usuario en account_users
    const [userRows] = await poolAdmin.query(
      `SELECT
        au.id,
        au.account_id,
        au.firebase_uid,
        au.email,
        au.role,
        au.is_active
      FROM account_users au
      WHERE au.firebase_uid = ? AND au.is_active = 1`,
      [firebaseUid]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado o inactivo. Contacta al administrador para obtener acceso."
      });
    }

    const user = userRows[0];
    const accountId = user.account_id;

    // 3. Obtener la API key de la cuenta
    const [accountRows] = await poolAdmin.query(
      `SELECT
        account_id,
        api_key,
        billing_name,
        billing_tax_id,
        billing_email,
        billing_phone,
        contact_email,
        contact_phone,
        is_active,
        max_entities
      FROM accounts
      WHERE account_id = ? AND is_active = 1`,
      [accountId]
    );

    if (accountRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Cuenta inactiva o no encontrada"
      });
    }

    const account = accountRows[0];

    // 4. Retornar la información completa
    res.json({
      success: true,
      apiKey: account.api_key,
      account: {
        account_id: account.account_id,
        billing_name: account.billing_name,
        billing_tax_id: account.billing_tax_id,
        billing_email: account.billing_email,
        billing_phone: account.billing_phone,
        contact_email: account.contact_email,
        contact_phone: account.contact_phone,
        max_entities: account.max_entities
      },
      user: {
        firebase_uid: user.firebase_uid,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la autenticación",
      error: error.message
    });
  }
};

/**
 * POST /api/v2/auth/verify
 * Verifica si un token de Firebase es válido y retorna info del usuario
 */
const verifyToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Token requerido"
      });
    }

    const decodedToken = await verifyFirebaseToken(idToken);

    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token inválido",
      error: error.message
    });
  }
};

module.exports = {
  login,
  verifyToken
};
