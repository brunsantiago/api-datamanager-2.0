const Router = require("express").Router;
const { validateFirebaseToken } = require('../middleware/auth.js');

const {
    getAccountInfo,
    getEntityById,
    listEntities
} = require("../controllers/account.controller.js");

const router = Router();

// Todos los endpoints requieren Firebase token válido
router.get("/account", validateFirebaseToken, getAccountInfo);
router.get("/entities", validateFirebaseToken, listEntities);
router.get("/entity/:entity_id", validateFirebaseToken, getEntityById);

module.exports = router;
