const Router = require("express").Router;
const { validateFirebaseToken, requireWritePermission } = require('../middleware/auth.js');

// Importar las funciones del controlador (las mismas que usa móvil)
const {
  getAllUsers,
  deleteUser,
  getNumberPersonal,
  getNumberClientes,
  getAllClientes,
  getNumberObjetivos,
  getObjetivos,
  requestCoordinate,
  getAllDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getRequestDevices,
  countPending,
  addRequestDevice,
  statusAdded,
  deleteRequestDevice,
  deleteAllRequestDevice,
  getNumberPuestos
} = require("../controllers/employees.controller.js");

const router = Router();

// ==================== RUTAS WEBADMIN ====================
// Todas las rutas tienen el prefijo /web/ para diferenciarlas de las rutas móviles
// Todas usan validateFirebaseToken para autenticación con Firebase

// ==================== CLIENTES Y OBJETIVOS ====================
// IMPORTANTE: Las rutas específicas deben ir ANTES que las genéricas

// GET Cantidad de clientes activos por empresa (ruta específica primero)
router.get("/web/clientes/number/:idEmpresa", validateFirebaseToken, getNumberClientes);

// GET Todos los clientes (ruta genérica después)
router.get("/web/clientes/:idEmpresa", validateFirebaseToken, getAllClientes);

// GET Cantidad de objetivos activos por empresa (ruta específica primero)
router.get("/web/objetivos/number/:idEmpresa", validateFirebaseToken, getNumberObjetivos);

// GET Objetivos por cliente (ruta genérica después)
router.get("/web/objetivos/:idCliente/:idEmpresa", validateFirebaseToken, getObjetivos);

// ==================== DASHBOARD ====================

// GET Cantidad de puestos activos por empresa
router.get("/web/puestos/number/:idEmpresa", validateFirebaseToken, getNumberPuestos);

// GET Cantidad de personal activo por empresa
router.get("/web/personal/number/:idEmpresa", validateFirebaseToken, getNumberPersonal);

// ==================== USERS ====================

// GET Todos los usuarios (usado en users.component)
router.get("/web/users/:idEmpresa", validateFirebaseToken, getAllUsers);

// DELETE Eliminar usuario (requiere permisos de escritura)
router.delete("/web/users/:userCodi/:idEmpresa", validateFirebaseToken, requireWritePermission, deleteUser);

// ==================== DEVICES ====================

// GET Coordinadas de un objetivo (usado en device.component y request-device.component)
router.get("/web/objetivos/coordinate/:idObjetivo/:idEmpresa", validateFirebaseToken, requestCoordinate);

// GET Todos los dispositivos
router.get("/web/devices/:idEmpresa", validateFirebaseToken, getAllDevices);

// POST Agregar dispositivo (requiere permisos de escritura)
router.post("/web/devices/:idEmpresa", validateFirebaseToken, requireWritePermission, addDevice);

// PUT Actualizar dispositivo (requiere permisos de escritura)
router.put("/web/devices/:idEmpresa", validateFirebaseToken, requireWritePermission, updateDevice);

// DELETE Eliminar dispositivo (requiere permisos de escritura)
router.delete("/web/devices/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, deleteDevice);

// ==================== REQUEST DEVICE ====================

// GET Todos los request devices
router.get("/web/request_device/:idEmpresa", validateFirebaseToken, getRequestDevices);

// GET Cantidad de request devices pendientes (usado en appheader - notificaciones)
router.get("/web/request_device/count_pending/:idEmpresa", validateFirebaseToken, countPending);

// POST Agregar request device (requiere permisos de escritura)
router.post("/web/request_device/:idEmpresa", validateFirebaseToken, requireWritePermission, addRequestDevice);

// PATCH Cambiar estado de request device (requiere permisos de escritura)
router.patch("/web/request_device/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, statusAdded);

// DELETE Eliminar un request device específico (requiere permisos de escritura)
router.delete("/web/request_device/:androidID/:idEmpresa", validateFirebaseToken, requireWritePermission, deleteRequestDevice);

// DELETE Eliminar todos los request devices (requiere permisos de escritura)
router.delete("/web/request_device/:idEmpresa", validateFirebaseToken, requireWritePermission, deleteAllRequestDevice);

module.exports = router;
