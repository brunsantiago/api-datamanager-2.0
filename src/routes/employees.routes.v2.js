const Router = require("express").Router;
const { authenticateToken } = require('../middleware/auth.js');

const {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  userRecoveryKey,
  deleteUser,
  setLastSession,
  getLastSession,
  closeLastSession,
  setHoraEgresoVigilador,
  addPuestoVigilador,
  getPersonal,
  getNumberPersonal,
  getAllClientes,
  getNumberClientes,
  getCliente,
  getAllObjetivos,
  getNumberObjetivos,
  getObjetivos,
  requestCoordinate,
  getDevice,
  addDevice,
  getAllDevices,
  deleteDevice,
  updateDevice,
  addRequestDevice,
  getRequestDevices,
  countPending,
  statusAdded,
  deleteRequestDevice,
  deleteAllRequestDevice,
  getPuestos,
  getPuestosConEstado,
  getAllPuestos,
  getNumberPuestos,
  getLastVersion,
  updateVersionDevice,
  getAllHolidays,
  registrarIngresoCompleto,
  registrarSalidaCompleta,
  getLastVersionTest
  } = require("../controllers/employees.controller.js");


const router = Router();

// TABLE USERS

// GET Obtener todos los usuarios
router.get("/users/:idEmpresa", authenticateToken, getAllUsers);

// GET Obtener perfil de usuario
router.get("/users/:persCodi/:idEmpresa", authenticateToken, getUserProfile);

//POST Registro de usuario
router.post("/register/:idEmpresa", userRegister); // No necesita token porque es el primer usuario que se crea en la empresa

//POST Login de usuario
router.post("/login/:idEmpresa", userLogin); // No necesita token porque es para obtener el token

//PATCH User Key
router.patch("/recovery_key/:idEmpresa", userRecoveryKey); // No necesita token porque es para recuperar la clave

//DELETE User
router.delete("/users/:userCodi/:idEmpresa", authenticateToken, deleteUser );


// TABLE LAST SESION

// POST Cargar Ultima Sesion (Hasta la version 1.3.7 - Ojo version Brouclean)
router.post("/last_session/:idEmpresa", authenticateToken, setLastSession);

// GET Cargar Ultima Sesion
router.get("/last_session/:persCodi/:idEmpresa", authenticateToken, getLastSession);

// PATCH Cerrar Ultima Sesion (Hasta la version 1.3.7 - Ojo version Brouclean)
router.patch("/last_session/:persCodi/:idEmpresa", authenticateToken, closeLastSession);


// TABLE ASIGVIGI

// PATCH Cargar Hora Egreso Empleado (Hasta la version 1.3.7 - Ojo version Brouclean)
router.patch("/asigvigi/:asigId", authenticateToken, setHoraEgresoVigilador)

// POST Cargar Hora Ingreso Empleado (Hasta la version 1.3.7 - Ojo version Brouclean)
router.post("/asigvigi", authenticateToken, addPuestoVigilador);


// TABLE ASIGVIGI + LAST SESION

//POST Registra el Ingreso tanto en la tabla ASIGVIGI como en LAST SESION (A partir de la version 1.3.8 - Ojo version Brouclean)
router.post("/registro_completo/:idEmpresa", authenticateToken, registrarIngresoCompleto);

//POST Registra la salida tanto en la tabla ASIGVIGI como en LAST SESION (A partir de la version 1.3.8 - Ojo version Brouclean)
router.patch("/registro_salida/:asigId/:idEmpresa", authenticateToken, registrarSalidaCompleta);


// TABLE PERSONAL

// GET Todo el personal activo por empresa
router.get("/personal/number/:idEmpresa", authenticateToken, getNumberPersonal);

// GET Personal
router.get("/personal/:nroLegajo/:idEmpresa", getPersonal); // No requiere token porque es usado para el recupero de clave

// GET Personal
router.get("/personal/:idEmpresa", authenticateToken, getPersonal); 



// TABLE OBJETIVO (CLIENTES)

// GET all Clientes
router.get("/clientes/:idEmpresa", authenticateToken, getAllClientes);

// GET Cantidad de clientes activos por empresa
router.get("/clientes/number/:idEmpresa", authenticateToken, getNumberClientes);

// GET Cliente (Activo)
router.get("/clientes/:nombreCliente/:idEmpresa", authenticateToken, getCliente);


// TABLE PUESGRUP (OBJETIVOS)

// GET all Objetivos
router.get("/objetivos/all/:idEmpresa", authenticateToken, getAllObjetivos);

// GET Cantidad de objetivos activos por empresa
router.get("/objetivos/number/:idEmpresa", authenticateToken, getNumberObjetivos);

// GET Objetivos from Cliente
router.get("/objetivos/:idCliente/:idEmpresa", authenticateToken, getObjetivos)

// GET Coordinadas from Objetivo
router.get("/objetivos/coordinate/:idObjetivo/:idEmpresa", authenticateToken, requestCoordinate)


// TABLE DEVICE

//GET Device
router.get("/devices/:androidID/:idEmpresa", getDevice);

//INSERT Device
router.post("/devices/:idEmpresa", authenticateToken, addDevice);

//GET All Devices
router.get("/devices/:idEmpresa", authenticateToken, getAllDevices);

//DELETE Device
router.delete("/devices/:androidID/:idEmpresa", authenticateToken, deleteDevice );

//UPDATE Device
router.put("/devices/:idEmpresa", authenticateToken, updateDevice );

//UPDATE Version Device
router.patch("/devices/:androidId/:idEmpresa", updateVersionDevice );


// TABLE REQUEST DEVICE

// INSERT Request Device
router.post("/request_device/:idEmpresa", authenticateToken, addRequestDevice);

//GET All Request Devices
router.get("/request_device/:idEmpresa", authenticateToken, getRequestDevices);

//GET All Request Devices Pending
router.get("/request_device/count_pending/:idEmpresa", authenticateToken, countPending);

//PATCH Request Devices Change Status
router.patch("/request_device/:androidID/:idEmpresa", authenticateToken, statusAdded );

//DELETE Request Devices
router.delete("/request_device/:androidID/:idEmpresa", authenticateToken, deleteRequestDevice );

//DELETE Request Devices
router.delete("/request_device/:idEmpresa", authenticateToken, deleteAllRequestDevice );


// TABLE PUESTOS

// GET Puestos Activos por empresa
router.get("/puestos/all/:idEmpresa", authenticateToken, getAllPuestos);

// GET Cantidad de puestos activos por empresa
router.get("/puestos/number/:idEmpresa", authenticateToken, getNumberPuestos);

// GET Puestos Activos por Cliente y Objetivo
router.get("/puestos/:idCliente/:idObjetivo", authenticateToken, getPuestos);

// GET Puestos Activos por Cliente y Objetivo con Estado de Ocupación
router.get("/puestos-con-estado/:idCliente/:idObjetivo/:idEmpresa", authenticateToken, getPuestosConEstado);


//TABLE APP VERSION

//GET Ultima version de la App disponible
router.get("/app_version/last_version/:idEmpresa", getLastVersion);

//GET Ultima version de la App disponible
router.get("/test/app_version/last_version/:idEmpresa", getLastVersionTest);

//TABLE FERIADOS

//GET todos los feriados
router.get("/feriados", authenticateToken, getAllHolidays);

//export default router;
module.exports = router;
