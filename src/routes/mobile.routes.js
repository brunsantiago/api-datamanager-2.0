/**
 * Mobile Routes - Rutas para la aplicación móvil AppControl
 * Autenticación: JWT Token
 */
const Router = require("express").Router;
const { authenticateToken } = require('../middleware/auth.js');

// Controllers
const usersController = require("../controllers/users.controller.js");
const devicesController = require("../controllers/devices.controller.js");
const sessionsController = require("../controllers/sessions.controller.js");
const personalController = require("../controllers/personal.controller.js");
const clientesController = require("../controllers/clientes.controller.js");
const objetivosController = require("../controllers/objetivos.controller.js");
const puestosController = require("../controllers/puestos.controller.js");
const versionController = require("../controllers/version.controller.js");
const holidaysController = require("../controllers/holidays.controller.js");
const panicController = require("../controllers/panic.controller.js");

const router = Router();

// ============================================================================
// USERS
// ============================================================================

router.get("/users/:idEmpresa", authenticateToken, usersController.getAllUsers);
router.get("/users/:persCodi/:idEmpresa", authenticateToken, usersController.getUserProfile);
router.post("/register/:idEmpresa", usersController.userRegister);
router.post("/login/:idEmpresa", usersController.userLogin);
router.patch("/recovery_key/:idEmpresa", usersController.userRecoveryKey);
router.delete("/users/:userCodi/:idEmpresa", authenticateToken, usersController.deleteUser);

// ============================================================================
// SESSIONS
// ============================================================================

router.post("/last_session/:idEmpresa", authenticateToken, sessionsController.setLastSession);
router.get("/last_session/:persCodi/:idEmpresa", authenticateToken, sessionsController.getLastSession);
router.patch("/last_session/:persCodi/:idEmpresa", authenticateToken, sessionsController.closeLastSession);
router.patch("/asigvigi/:asigId", authenticateToken, sessionsController.setHoraEgresoVigilador);
router.post("/asigvigi", authenticateToken, sessionsController.addPuestoVigilador);
router.post("/registro_completo/:idEmpresa", authenticateToken, sessionsController.registrarIngresoCompleto);
router.patch("/registro_salida/:asigId/:idEmpresa", authenticateToken, sessionsController.registrarSalidaCompleta);

// ============================================================================
// PERSONAL
// ============================================================================

router.get("/personal/number/:idEmpresa", authenticateToken, personalController.getNumberPersonal);
router.get("/personal/:nroLegajo/:idEmpresa", personalController.getPersonal);
router.get("/personal/:idEmpresa", authenticateToken, personalController.getPersonal);

// ============================================================================
// CLIENTES
// ============================================================================

router.get("/clientes/:idEmpresa", authenticateToken, clientesController.getAllClientes);
router.get("/clientes/number/:idEmpresa", authenticateToken, clientesController.getNumberClientes);
router.get("/clientes/:nombreCliente/:idEmpresa", authenticateToken, clientesController.getCliente);

// ============================================================================
// OBJETIVOS
// ============================================================================

router.get("/objetivos/all/:idEmpresa", authenticateToken, objetivosController.getAllObjetivos);
router.get("/objetivos/number/:idEmpresa", authenticateToken, objetivosController.getNumberObjetivos);
router.get("/objetivos/:idCliente/:idEmpresa", authenticateToken, objetivosController.getObjetivos);
router.get("/objetivos/coordinate/:idObjetivo/:idEmpresa", authenticateToken, objetivosController.requestCoordinate);

// ============================================================================
// DEVICES
// ============================================================================

router.get("/devices/:androidID/:idEmpresa", devicesController.getDevice);
router.post("/devices/:idEmpresa", authenticateToken, devicesController.addDevice);
router.get("/devices/:idEmpresa", authenticateToken, devicesController.getAllDevices);
router.delete("/devices/:androidID/:idEmpresa", authenticateToken, devicesController.deleteDevice);
router.put("/devices/:idEmpresa", authenticateToken, devicesController.updateDevice);
router.patch("/devices/:androidId/:idEmpresa", devicesController.updateVersionDevice);

// ============================================================================
// REQUEST DEVICES
// ============================================================================

router.post("/request_device/:idEmpresa", authenticateToken, devicesController.addRequestDevice);
router.get("/request_device/:idEmpresa", authenticateToken, devicesController.getRequestDevices);
router.get("/request_device/count_pending/:idEmpresa", authenticateToken, devicesController.countPending);
router.patch("/request_device/:androidID/:idEmpresa", authenticateToken, devicesController.statusAdded);
router.delete("/request_device/:androidID/:idEmpresa", authenticateToken, devicesController.deleteRequestDevice);
router.delete("/request_device/:idEmpresa", authenticateToken, devicesController.deleteAllRequestDevice);

// ============================================================================
// PUESTOS
// ============================================================================

router.get("/puestos/all/:idEmpresa", authenticateToken, puestosController.getAllPuestos);
router.get("/puestos/number/:idEmpresa", authenticateToken, puestosController.getNumberPuestos);
router.get("/puestos/:idCliente/:idObjetivo", authenticateToken, puestosController.getPuestos);
router.get("/puestos-con-estado/:idCliente/:idObjetivo/:idEmpresa", authenticateToken, puestosController.getPuestosConEstado);

// ============================================================================
// VERSION
// ============================================================================

router.get("/app_version/last_version/:idEmpresa", versionController.getLastVersion);
router.get("/test/app_version/last_version/:idEmpresa", versionController.getLastVersionTest);
router.get("/app_releases/check-update/:currentVersionCode", versionController.checkForUpdate);
router.get("/app_releases/latest", versionController.getLatestRelease);

// ============================================================================
// HOLIDAYS
// ============================================================================

router.get("/feriados", authenticateToken, holidaysController.getAllHolidays);

// ============================================================================
// PANIC - Botón de pánico
// ============================================================================

router.post("/panic/:idEmpresa", authenticateToken, panicController.sendPanicAlert);
router.get("/panic/:idEmpresa", authenticateToken, panicController.getPanicAlerts);
router.get("/panic/count/:idEmpresa", authenticateToken, panicController.countActiveAlerts);
router.get("/panic/:paniId/:idEmpresa", authenticateToken, panicController.getPanicAlert);
router.patch("/panic/:paniId/:idEmpresa", authenticateToken, panicController.updatePanicStatus);
router.patch("/devices/panic/:androidId/:idEmpresa", authenticateToken, devicesController.updatePanicStatus);

module.exports = router;
