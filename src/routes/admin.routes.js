const Router = require("express").Router;
const { validateFirebaseToken } = require('../middleware/auth.js');

const {
  // Accounts
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountEntities,
  // Entities
  getAllEntities,
  getEntityById,
  createEntity,
  updateEntity,
  deleteEntity,
  // Users
  getAllUsers,
  getUserByUid,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/admin.controller.js");

const router = Router();

// Todos los endpoints de admin requieren Firebase Token válido
// TODO: Agregar validación de rol super_admin o account_admin

// ==================== ACCOUNTS ====================
router.get("/admin/accounts", validateFirebaseToken, getAllAccounts);
router.get("/admin/account/:id/entities", validateFirebaseToken, getAccountEntities); // IMPORTANTE: Esta ruta debe ir ANTES de /admin/account/:id
router.get("/admin/account/:id", validateFirebaseToken, getAccountById);
router.post("/admin/accounts", validateFirebaseToken, createAccount);
router.put("/admin/account/:id", validateFirebaseToken, updateAccount);
router.delete("/admin/account/:id", validateFirebaseToken, deleteAccount);

// ==================== ENTITIES ====================
router.get("/admin/entities", validateFirebaseToken, getAllEntities);
router.get("/admin/entity/:id", validateFirebaseToken, getEntityById);
router.post("/admin/entities", validateFirebaseToken, createEntity);
router.put("/admin/entity/:id", validateFirebaseToken, updateEntity);
router.delete("/admin/entity/:id", validateFirebaseToken, deleteEntity);

// ==================== USERS ====================
router.get("/admin/users", validateFirebaseToken, getAllUsers);
router.get("/admin/user/:uid", validateFirebaseToken, getUserByUid);
router.post("/admin/users", validateFirebaseToken, createUser);
router.put("/admin/user/:uid", validateFirebaseToken, updateUser);
router.delete("/admin/user/:uid", validateFirebaseToken, deleteUser);

module.exports = router;
