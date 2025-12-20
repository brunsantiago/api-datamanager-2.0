const jwt = require("jsonwebtoken");
const pool = require("../db.js");
const poolAdmin = require("../db-admin.js");
const { verifyFirebaseToken } = require("../config/firebase-admin.js");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Middleware para validar JWT tokens (usado por la app móvil)
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "Token de autenticación requerido (Authorization header con JWT)"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token de acceso requerido"
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Token inválido o expirado"
      });
    }

    req.user = { ...user, userType: 'mobile' };
    next();
  });
};

/**
 * Genera un JWT token para la app móvil
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

/**
 * Middleware para validar Firebase Tokens (usado por WebAdmin)
 * Verifica el token con Firebase Admin SDK y carga información del usuario desde account_users
 */
const validateFirebaseToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: "Token de autenticación requerido"
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar el token con Firebase Admin
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(token);
    } catch (error) {
      return res.status(401).json({
        message: "Token inválido o expirado",
        error: error.message
      });
    }

    const firebaseUid = decodedToken.uid;

    // Buscar el usuario en account_users
    const [userRows] = await poolAdmin.query(
      `SELECT
        au.uid,
        au.account_id,
        au.role,
        au.entity_ids,
        au.is_active,
        a.billing_name
      FROM account_users au
      LEFT JOIN accounts a ON au.account_id = a.account_id
      WHERE au.uid = ? AND au.is_active = 1`,
      [firebaseUid]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado o inactivo"
      });
    }

    const user = userRows[0];

    // Verificar si es super admin
    const isSuperAdmin = user.role === 'super_admin';

    // Establecer información en req para uso posterior
    req.account = {
      userType: 'web',
      accountId: user.account_id,
      accountName: isSuperAdmin ? 'Super Administrator' : user.billing_name,
      isSuperAdmin: isSuperAdmin
    };

    req.user = {
      uid: user.uid,
      role: user.role,
      accountId: user.account_id,
      entityIds: user.entity_ids ? JSON.parse(user.entity_ids) : []
    };

    next();
  } catch (error) {
    console.error('Error validando Firebase token:', error);
    return res.status(500).json({
      message: "Error al validar el token de autenticación"
    });
  }
};

/**
 * ============================================
 * MIDDLEWARES DE AUTORIZACIÓN (Permisos)
 * ============================================
 */

/**
 * Middleware que valida permisos de escritura
 * Permite: account_admin, entity_admin
 * Bloquea: entity_user (solo lectura)
 *
 * Usar en: Rutas POST, PUT, DELETE que modifican datos
 */
const requireWritePermission = (req, res, next) => {
  const userRole = (req.user && req.user.role);

  // Roles permitidos para operaciones de escritura
  const allowedRoles = ['account_admin', 'entity_admin'];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: "No tienes permisos para modificar datos. Solo tienes acceso de lectura.",
      requiredRoles: allowedRoles,
      yourRole: userRole
    });
  }

  next();
};

/**
 * Middleware que requiere rol de Account Admin
 * Permite: account_admin
 * Bloquea: entity_admin, entity_user
 *
 * Usar en: Operaciones críticas que solo Account Admin puede hacer
 */
const requireAccountAdmin = (req, res, next) => {
  const userRole = (req.user && req.user.role);

  if (userRole !== 'account_admin') {
    return res.status(403).json({
      message: "No tienes permisos para realizar esta acción. Se requiere rol de Account Admin.",
      requiredRole: 'account_admin',
      yourRole: userRole
    });
  }

  next();
};

/**
 * Middleware para verificar el estado del dispositivo
 * Si el dispositivo no está ACTIVO (BAJA, SUSPENDIDO, etc.), devuelve 403
 * Esto fuerza el logout automático en la app móvil
 */
const checkDeviceStatus = async (req, res, next) => {
  try {
    const androidId = req.user && req.user.androidId;
    const idEmpresa = req.user && req.user.idEmpresa;

    // Si no hay androidId, continuar (compatibilidad con tokens antiguos)
    if (!androidId || !idEmpresa) {
      return next();
    }

    const [rows] = await pool.query(
      'SELECT DEVI_ESTA FROM devices WHERE DEVI_ANID = ? AND ENTITY_ID = ?',
      [androidId, idEmpresa]
    );

    // Si el dispositivo existe y no está ACTIVO, bloquear
    // Usamos 400 en lugar de 403 porque el proxy/nginx intercepta los 403 y devuelve HTML
    if (rows.length > 0 && rows[0].DEVI_ESTA !== 'ACTIVO') {
      return res.status(400).json({
        error: 'DEVICE_INACTIVE',
        message: 'Dispositivo no activo',
        status: rows[0].DEVI_ESTA
      });
    }

    next();
  } catch (error) {
    // En caso de error de BD, no bloquear al usuario
    console.error('Error checking device status:', error);
    next();
  }
};

/**
 * ============================================
 * RESUMEN DE MIDDLEWARES DE AUTENTICACIÓN
 * ============================================
 *
 * 1. authenticateToken (App Móvil)
 *    - Usa: Header 'Authorization: Bearer {jwt}'
 *    - Para: Aplicación móvil (empleados)
 *    - Rutas: employees.routes.v2.js
 *
 * 2. validateFirebaseToken (WebAdmin y AccountManager)
 *    - Usa: Header 'Authorization: Bearer {firebase_token}'
 *    - Para: Aplicaciones web (WebAdmin y AccountManager)
 *    - Usuarios: Super Admins, Account Admins, Entity Admins, Entity Users
 *    - Rutas: web.routes.js, account.routes.js, admin.routes.js
 *
 * ============================================
 * RESUMEN DE MIDDLEWARES DE AUTORIZACIÓN
 * ============================================
 *
 * 1. requireWritePermission
 *    - Permite: account_admin, entity_admin
 *    - Bloquea: entity_user (solo lectura)
 *    - Usar en: POST, PUT, DELETE
 *
 * 2. requireAccountAdmin
 *    - Permite: account_admin
 *    - Bloquea: entity_admin, entity_user
 *    - Usar en: Operaciones críticas
 */

module.exports = {
  authenticateToken,
  validateFirebaseToken,
  generateToken,
  requireWritePermission,
  requireAccountAdmin,
  checkDeviceStatus
};