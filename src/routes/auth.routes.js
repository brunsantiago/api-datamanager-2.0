const Router = require("express").Router;
const { login, verifyToken } = require("../controllers/auth.controller.js");

const router = Router();

// Endpoints públicos de autenticación
router.post("/auth/login", login);
router.post("/auth/verify", verifyToken);

module.exports = router;
