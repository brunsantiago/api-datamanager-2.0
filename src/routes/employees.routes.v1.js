const Router = require("express").Router;

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
  registrarSalidaCompleta
  } = require("../controllers/employees.controller.js");


const router = Router();

// TABLE USERS

// GET Obtener todos los usuarios
router.get("/users/:idEmpresa", getAllUsers);

// GET Obtener perfil de usuario
router.get("/users/:persCodi/:idEmpresa", getUserProfile);

//POST Registro de usuario
router.post("/register/:idEmpresa", userRegister);

//POST Login de usuario
router.post("/login/:idEmpresa", userLogin);

//PATCH User Key
router.patch("/recovery_key/:idEmpresa", userRecoveryKey);

//DELETE User
router.delete("/users/:userCodi/:idEmpresa", deleteUser );


// TABLE LAST SESION

// POST Cargar Ultima Sesion (Hasta la version 1.3.7 - Ojo version Brouclean)
router.post("/last_session/:idEmpresa", setLastSession);

// GET Cargar Ultima Sesion
router.get("/last_session/:persCodi/:idEmpresa", getLastSession);

// PATCH Cerrar Ultima Sesion (Hasta la version 1.3.7 - Ojo version Brouclean)
router.patch("/last_session/:persCodi/:idEmpresa", closeLastSession);


// TABLE ASIGVIGI

// PATCH Cargar Hora Egreso Empleado (Hasta la version 1.3.7 - Ojo version Brouclean)
router.patch("/asigvigi/:asigId", setHoraEgresoVigilador)

// POST Cargar Hora Ingreso Empleado (Hasta la version 1.3.7 - Ojo version Brouclean)
router.post("/asigvigi", addPuestoVigilador);


// TABLE ASIGVIGI + LAST SESION

//POST Registra el Ingreso tanto en la tabla ASIGVIGI como en LAST SESION (A partir de la version 1.3.8 - Ojo version Brouclean)
router.post("/registro_completo/:idEmpresa", registrarIngresoCompleto);

//POST Registra la salida tanto en la tabla ASIGVIGI como en LAST SESION (A partir de la version 1.3.8 - Ojo version Brouclean)
router.patch("/registro_salida/:asigId/:idEmpresa", registrarSalidaCompleta);


// TABLE PERSONAL

// GET Todo el personal activo por empresa
router.get("/personal/number/:idEmpresa", getNumberPersonal);

// GET Personal
router.get("/personal/:nroLegajo/:idEmpresa", getPersonal);



// TABLE OBJETIVO (CLIENTES)

// GET all Clientes
router.get("/clientes/:idEmpresa", getAllClientes);

// GET Cantidad de clientes activos por empresa
router.get("/clientes/number/:idEmpresa", getNumberClientes);

// GET Cliente (Activo)
router.get("/clientes/:nombreCliente/:idEmpresa", getCliente);


// TABLE PUESGRUP (OBJETIVOS)

// GET all Objetivos
router.get("/objetivos/all/:idEmpresa", getAllObjetivos);

// GET Cantidad de objetivos activos por empresa
router.get("/objetivos/number/:idEmpresa", getNumberObjetivos);

// GET Objetivos from Cliente
router.get("/objetivos/:idCliente", getObjetivos)

// GET Coordinadas from Objetivo
router.get("/objetivos/coordinate/:idObjetivo", requestCoordinate)


// TABLE DEVICE

//GET Device
router.get("/devices/:androidID/:idEmpresa", getDevice);

//INSERT Device
router.post("/devices/:idEmpresa", addDevice);

//GET All Devices
router.get("/devices/:idEmpresa", getAllDevices);

//DELETE Device
router.delete("/devices/:androidID/:idEmpresa", deleteDevice );

//UPDATE Device
router.put("/devices/:idEmpresa", updateDevice );

//UPDATE Version Device
router.patch("/devices/:androidId/:idEmpresa", updateVersionDevice );


// TABLE REQUEST DEVICE

// INSERT Request Device
router.post("/request_device/:idEmpresa", addRequestDevice);

//GET All Request Devices
router.get("/request_device/:idEmpresa", getRequestDevices);

//GET All Request Devices Pending
router.get("/request_device/count_pending/:idEmpresa", countPending);

//PATCH Request Devices Change Status
router.patch("/request_device/:androidID/:idEmpresa", statusAdded );

//DELETE Request Devices
router.delete("/request_device/:androidID/:idEmpresa", deleteRequestDevice );

//DELETE Request Devices
router.delete("/request_device/:idEmpresa", deleteAllRequestDevice );


// TABLE PUESTOS

// GET Puestos Activos por empresa
router.get("/puestos/all/:idEmpresa", getAllPuestos);

// GET Cantidad de puestos activos por empresa
router.get("/puestos/number/:idEmpresa", getNumberPuestos);

// GET Puestos Activos por Cliente y Objetivo
router.get("/puestos/:idCliente/:idObjetivo", getPuestos);

// GET Puestos Activos por Cliente y Objetivo con Estado de Ocupación
router.get("/puestos-con-estado/:idCliente/:idObjetivo/:idEmpresa", getPuestosConEstado);


//TABLE APP VERSION

//GET Ultima version de la App disponible
router.get("/app_version/last_version/:idEmpresa", getLastVersion);

//TABLE FERIADOS

//GET todos los feriados
router.get("/feriados", getAllHolidays);

//export default router;
module.exports = router;
