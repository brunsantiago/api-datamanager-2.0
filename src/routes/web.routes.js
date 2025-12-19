const Router = require("express").Router;
const { validateFirebaseToken, requireWritePermission } = require('../middleware/auth.js');

// Controllers
const usersController = require("../controllers/users.controller.js");
const personalController = require("../controllers/personal.controller.js");
const clientesController = require("../controllers/clientes.controller.js");
const objetivosController = require("../controllers/objetivos.controller.js");
const devicesController = require("../controllers/devices.controller.js");
const puestosController = require("../controllers/puestos.controller.js");
const panicController = require("../controllers/panic.controller.js");

const router = Router();

// ==================== RUTAS WEBADMIN ====================
// Todas las rutas tienen el prefijo /web/ para diferenciarlas de las rutas móviles
// Todas usan validateFirebaseToken para autenticación con Firebase

// ==================== CLIENTES Y OBJETIVOS ====================
// IMPORTANTE: Las rutas específicas deben ir ANTES que las genéricas

// GET Cantidad de clientes activos por empresa (ruta específica primero)
router.get("/web/clientes/number/:idEmpresa", validateFirebaseToken, clientesController.getNumberClientes);

// GET Todos los clientes (ruta genérica después)
router.get("/web/clientes/:idEmpresa", validateFirebaseToken, clientesController.getAllClientes);

// GET Cantidad de objetivos activos por empresa (ruta específica primero)
router.get("/web/objetivos/number/:idEmpresa", validateFirebaseToken, objetivosController.getNumberObjetivos);

// GET Objetivos por cliente (ruta genérica después)
router.get("/web/objetivos/:idCliente/:idEmpresa", validateFirebaseToken, objetivosController.getObjetivos);

// ==================== DASHBOARD ====================

// GET Cantidad de puestos activos por empresa
router.get("/web/puestos/number/:idEmpresa", validateFirebaseToken, puestosController.getNumberPuestos);

// GET Cantidad de personal activo por empresa
router.get("/web/personal/number/:idEmpresa", validateFirebaseToken, personalController.getNumberPersonal);

// ==================== USERS ====================

// GET Todos los usuarios (usado en users.component)
router.get("/web/users/:idEmpresa", validateFirebaseToken, usersController.getAllUsers);

// DELETE Eliminar usuario (requiere permisos de escritura)
router.delete("/web/users/:userCodi/:idEmpresa", validateFirebaseToken, requireWritePermission, usersController.deleteUser);

// ==================== DEVICES ====================

// GET Coordinadas de un objetivo (usado en device.component y request-device.component)
router.get("/web/objetivos/coordinate/:idObjetivo/:idEmpresa", validateFirebaseToken, objetivosController.requestCoordinate);

// GET Todos los dispositivos
router.get("/web/devices/:idEmpresa", validateFirebaseToken, devicesController.getAllDevices);

// POST Agregar dispositivo (requiere permisos de escritura)
router.post("/web/devices/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.addDevice);

// PUT Actualizar dispositivo (requiere permisos de escritura)
router.put("/web/devices/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.updateDevice);

// DELETE Eliminar dispositivo (requiere permisos de escritura)
router.delete("/web/devices/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.deleteDevice);

// ==================== REQUEST DEVICE ====================

// GET Todos los request devices
router.get("/web/request_device/:idEmpresa", validateFirebaseToken, devicesController.getRequestDevices);

// GET Cantidad de request devices pendientes (usado en appheader - notificaciones)
router.get("/web/request_device/count_pending/:idEmpresa", validateFirebaseToken, devicesController.countPending);

// POST Agregar request device (requiere permisos de escritura)
router.post("/web/request_device/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.addRequestDevice);

// PATCH Cambiar estado de request device (requiere permisos de escritura)
router.patch("/web/request_device/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.statusAdded);

// DELETE Eliminar un request device específico (requiere permisos de escritura)
router.delete("/web/request_device/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.deleteRequestDevice);

// DELETE Eliminar todos los request devices (requiere permisos de escritura)
router.delete("/web/request_device/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.deleteAllRequestDevice);

// ==================== PANIC - Alertas de Pánico ====================

// GET Cantidad de alertas activas (ruta específica primero)
router.get("/web/panic/count/:idEmpresa", validateFirebaseToken, panicController.countActiveAlerts);

// GET Todas las alertas de pánico
router.get("/web/panic/:idEmpresa", validateFirebaseToken, panicController.getPanicAlerts);

// GET Una alerta específica
router.get("/web/panic/:paniId/:idEmpresa", validateFirebaseToken, panicController.getPanicAlert);

// PATCH Actualizar estado de alerta (requiere permisos de escritura)
router.patch("/web/panic/:paniId/:idEmpresa", validateFirebaseToken, requireWritePermission, panicController.updatePanicStatus);

// PATCH Toggle pánico en dispositivo (requiere permisos de escritura)
router.patch("/web/devices/panic/:androidId/:idEmpresa", validateFirebaseToken, requireWritePermission, devicesController.updatePanicStatus);

module.exports = router;
