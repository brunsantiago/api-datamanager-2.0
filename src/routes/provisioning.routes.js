const Router = require("express").Router;
const { authenticateToken } = require('../middleware/auth.js');

const {
    generateProvisioningToken,
    validateProvisioningToken,
    listProvisioningTokens,
    revokeProvisioningToken
} = require("../controllers/provisioning.controller.js");

const router = Router();

// Endpoint público - Validar token (usado por la app Android)
router.post("/provisioning/validate-token", validateProvisioningToken);

// Endpoints protegidos - Solo admins (requieren JWT)
router.post("/provisioning/generate-token", authenticateToken, generateProvisioningToken);
router.get("/provisioning/tokens", authenticateToken, listProvisioningTokens);
router.delete("/provisioning/tokens/:tokenId", authenticateToken, revokeProvisioningToken);

module.exports = router;
