const Router = require("express").Router;
const { validateFirebaseToken } = require('../middleware/auth.js');

const {
    generateProvisioningToken,
    validateProvisioningToken,
    listProvisioningTokens,
    revokeProvisioningToken,
    getEntityConfig
} = require("../controllers/provisioning.controller.js");

const router = Router();

// Endpoints públicos - Usados por la app Android durante provisioning
router.post("/provisioning/validate-token", validateProvisioningToken);
router.get("/provisioning/entity-config/:entity_id", getEntityConfig);

// Endpoints protegidos - Solo WebAdmin (requieren Firebase token)
router.post("/provisioning/generate-token", validateFirebaseToken, generateProvisioningToken);
router.get("/provisioning/tokens", validateFirebaseToken, listProvisioningTokens);
router.delete("/provisioning/tokens/:tokenId", validateFirebaseToken, revokeProvisioningToken);

module.exports = router;
