/**
 * Mobile Routes - Rutas para la aplicación móvil AppControl
 * Autenticación: JWT Token
 */
const Router = require("express").Router;
const { authenticateToken, checkDeviceStatus } = require('../middleware/auth.js');

// Middleware combinado: autenticación + verificación de estado de dispositivo
const mobileAuth = [authenticateToken, checkDeviceStatus];

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

router.get("/users/:idEmpresa", mobileAuth, usersController.getAllUsers);
router.get("/users/:persCodi/:idEmpresa", mobileAuth, usersController.getUserProfile);
router.post("/register/:idEmpresa", usersController.userRegister);
router.post("/login/:idEmpresa", usersController.userLogin);
router.patch("/recovery_key/:idEmpresa", usersController.userRecoveryKey);
router.delete("/users/:userCodi/:idEmpresa", mobileAuth, usersController.deleteUser);

// ============================================================================
// SESSIONS
// ============================================================================

router.post("/last_session/:idEmpresa", mobileAuth, sessionsController.setLastSession);
router.get("/last_session/:persCodi/:idEmpresa", mobileAuth, sessionsController.getLastSession);
router.patch("/last_session/:persCodi/:idEmpresa", mobileAuth, sessionsController.closeLastSession);
router.patch("/asigvigi/:asigId", mobileAuth, sessionsController.setHoraEgresoVigilador);
router.post("/asigvigi", mobileAuth, sessionsController.addPuestoVigilador);
router.post("/registro_completo/:idEmpresa", mobileAuth, sessionsController.registrarIngresoCompleto);
router.patch("/registro_salida/:asigId/:idEmpresa", mobileAuth, sessionsController.registrarSalidaCompleta);

// ============================================================================
// PERSONAL
// ============================================================================

router.get("/personal/number/:idEmpresa", mobileAuth, personalController.getNumberPersonal);
router.get("/personal/:nroLegajo/:idEmpresa", personalController.getPersonal);
router.get("/personal/:idEmpresa", mobileAuth, personalController.getPersonal);

// ============================================================================
// CLIENTES
// ============================================================================

router.get("/clientes/:idEmpresa", mobileAuth, clientesController.getAllClientes);
router.get("/clientes/number/:idEmpresa", mobileAuth, clientesController.getNumberClientes);
router.get("/clientes/:nombreCliente/:idEmpresa", mobileAuth, clientesController.getCliente);

// ============================================================================
// OBJETIVOS
// ============================================================================

router.get("/objetivos/all/:idEmpresa", mobileAuth, objetivosController.getAllObjetivos);
router.get("/objetivos/number/:idEmpresa", mobileAuth, objetivosController.getNumberObjetivos);
router.get("/objetivos/:idCliente/:idEmpresa", mobileAuth, objetivosController.getObjetivos);
router.get("/objetivos/coordinate/:idObjetivo/:idEmpresa", mobileAuth, objetivosController.requestCoordinate);

// ============================================================================
// DEVICES
// ============================================================================

router.get("/devices/:androidID/:idEmpresa", devicesController.getDevice);
router.post("/devices/:idEmpresa", mobileAuth, devicesController.addDevice);
router.get("/devices/:idEmpresa", mobileAuth, devicesController.getAllDevices);
router.delete("/devices/:androidID/:idEmpresa", mobileAuth, devicesController.deleteDevice);
router.put("/devices/:idEmpresa", mobileAuth, devicesController.updateDevice);
router.patch("/devices/:androidId/:idEmpresa", devicesController.updateVersionDevice);

// ============================================================================
// REQUEST DEVICES
// ============================================================================

router.post("/request_device/:idEmpresa", mobileAuth, devicesController.addRequestDevice);
router.get("/request_device/:idEmpresa", mobileAuth, devicesController.getRequestDevices);
router.get("/request_device/count_pending/:idEmpresa", mobileAuth, devicesController.countPending);
router.patch("/request_device/:androidID/:idEmpresa", mobileAuth, devicesController.statusAdded);
router.delete("/request_device/:androidID/:idEmpresa", mobileAuth, devicesController.deleteRequestDevice);
router.delete("/request_device/:idEmpresa", mobileAuth, devicesController.deleteAllRequestDevice);

// ============================================================================
// PUESTOS
// ============================================================================

router.get("/puestos/all/:idEmpresa", mobileAuth, puestosController.getAllPuestos);
router.get("/puestos/number/:idEmpresa", mobileAuth, puestosController.getNumberPuestos);
router.get("/puestos/:idCliente/:idObjetivo", mobileAuth, puestosController.getPuestos);
router.get("/puestos-con-estado/:idCliente/:idObjetivo/:idEmpresa", mobileAuth, puestosController.getPuestosConEstado);

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

router.get("/feriados", mobileAuth, holidaysController.getAllHolidays);

// ============================================================================
// PANIC - Botón de pánico
// ============================================================================

router.post("/panic/:idEmpresa", mobileAuth, panicController.sendPanicAlert);
router.get("/panic/:idEmpresa", mobileAuth, panicController.getPanicAlerts);
router.get("/panic/count/:idEmpresa", mobileAuth, panicController.countActiveAlerts);
router.get("/panic/:paniId/:idEmpresa", mobileAuth, panicController.getPanicAlert);
router.patch("/panic/:paniId/:idEmpresa", mobileAuth, panicController.updatePanicStatus);
router.patch("/devices/panic/:androidId/:idEmpresa", mobileAuth, devicesController.updatePanicStatus);

module.exports = router;
