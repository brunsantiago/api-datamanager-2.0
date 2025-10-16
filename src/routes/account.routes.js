const Router = require("express").Router;
const { validateApiKey } = require('../middleware/auth.js');

const {
    getAccountInfo,
    getEntityById,
    listEntities
} = require("../controllers/account.controller.js");

const router = Router();

// Todos los endpoints requieren API Key válida
router.get("/account", validateApiKey, getAccountInfo);
router.get("/entities", validateApiKey, listEntities);
router.get("/entity/:entity_id", validateApiKey, getEntityById);

module.exports = router;
