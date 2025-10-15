const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// API Keys por empresa para acceso desde plataforma web
const API_KEYS = {
  1: process.env.API_KEY_EMPRESA_1 || "api-key-empresa-1-change-in-production",
  2: process.env.API_KEY_EMPRESA_2 || "api-key-empresa-2-change-in-production",
  3: process.env.API_KEY_EMPRESA_3 || "api-key-empresa-3-change-in-production"
};

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const { idEmpresa } = req.params;

  if (!apiKey) {
    return res.status(401).json({
      message: "API Key requerida"
    });
  }

  if (!idEmpresa || !API_KEYS[idEmpresa]) {
    return res.status(400).json({
      message: "ID de empresa inválido"
    });
  }

  if (apiKey !== API_KEYS[idEmpresa]) {
    return res.status(403).json({
      message: "API Key inválida"
    });
  }

  // Establecer usuario tipo web para identificación
  req.user = {
    userType: 'web',
    idEmpresa: idEmpresa
  };

  next();
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