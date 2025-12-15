const Router = require("express").Router;
const { index, ping } = require("../controllers/index.controller.js")

const router = Router();

router.get("/", index);

router.get("/ping", ping);

// Test endpoint para diagnóstico
router.get("/api/v2/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development"
  });
});

//export default router;
module.exports = router;
