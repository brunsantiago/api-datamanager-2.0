const poolAdmin = require("../db-admin.js");
const { verifyFirebaseToken } = require("../config/firebase-admin.js");

/**
 * POST /api/v2/auth/login
 * Autentica un usuario con Firebase y retorna su perfil
 *
 * Header esperado:
 * Authorization: Bearer <firebase-id-token>
 *
 * O Body alternativo (retrocompatibilidad):
 * {
 *   "idToken": "firebase-id-token-here"
 * }
 *
 * Respuesta exitosa:
 * {
 *   "user": { uid, email, role, account_id, is_active, created_at, updated_at }
 * }
 */
const login = async (req, res) => {
  try {
    // Obtener token del header Authorization o del body (retrocompatibilidad)
    const authHeader = req.headers.authorization;
    let idToken = req.body.idToken;

    // Si viene en el header Authorization (formato: "Bearer token")
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7); // Remover "Bearer "
    }

    // Validar que venga el token
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Token de Firebase requerido en header Authorization o body"
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
        au.uid,
        au.name,
        au.email,
        au.role,
        au.is_active,
        au.created_at,
        au.updated_at
      FROM account_users au
      WHERE au.uid = ? AND au.is_active = 1`,
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

    // 2.1 Actualizar last_login
    await poolAdmin.query(
      'UPDATE account_users SET last_login = NOW() WHERE uid = ?',
      [firebaseUid]
    );

    // 3. Si el usuario tiene cuenta, verificar que esté activa
    let accountInfo = null;

    if (accountId !== null) {
      // Usuario con cuenta (account_admin, entity_admin, entity_user)
      const [accountRows] = await poolAdmin.query(
        `SELECT
          account_id,
          storage_uid,
          database_name,
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
      accountInfo = {
        account_id: account.account_id,
        storage_uid: account.storage_uid,
        database_name: account.database_name,
        billing_name: account.billing_name,
        billing_tax_id: account.billing_tax_id,
        billing_email: account.billing_email,
        billing_phone: account.billing_phone,
        contact_email: account.contact_email,
        contact_phone: account.contact_phone,
        max_entities: account.max_entities
      };
    }

    // 4. Retornar la información completa del usuario
    res.json({
      success: true,
      account: accountInfo,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        account_id: user.account_id,
        account_storage_id: null,
        entity_ids: [],
        permissions: user.role === 'super_admin' ? ['*'] : [],
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
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
