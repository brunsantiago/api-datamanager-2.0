const jwt = require("jsonwebtoken");
const poolAdmin = require("../db-admin.js");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      message: "API Key requerida"
    });
  }

  try {
    // Consultar la cuenta asociada al API Key
    const [rows] = await poolAdmin.query(
      'SELECT account_id, billing_name, is_active FROM accounts WHERE api_key = ? AND is_active = 1',
      [apiKey]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "API Key inválida o cuenta inactiva"
      });
    }

    const account = rows[0];

    // Establecer información de la cuenta en req para uso posterior
    req.account = {
      userType: 'web',
      accountId: account.account_id,
      accountName: account.billing_name
    };

    next();
  } catch (error) {
    console.error('Error validando API Key:', error);
    return res.status(500).json({
      message: "Error al validar API Key"
    });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const apiKey = req.headers['x-api-key'];

  // Prioridad: si viene API Key, validar como web
  if (apiKey) {
    return validateApiKey(req, res, next);
  }

  // Si viene Authorization header, validar como móvil (JWT)
  if (authHeader) {
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
  } else {
    // No viene ni API Key ni JWT
    return res.status(401).json({
      message: "Autenticación requerida: proporciona JWT (Authorization) o API Key (X-API-Key)"
    });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

module.exports = {
  authenticateToken,
  validateApiKey,
  generateToken
};