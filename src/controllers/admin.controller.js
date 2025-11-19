const poolAdmin = require("../db-admin.js");
const { admin } = require("../config/firebase-admin.js");

// ==================== ACCOUNTS ====================

/**
 * GET /api/v2/admin/accounts
 * Listar todas las cuentas
 */
const getAllAccounts = async (req, res) => {
  try {
    // SEGURIDAD: Filtrar cuentas según el rol del usuario autenticado
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    let query = `SELECT
        account_id,
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_country,
        billing_tax_id,
        billing_notes,
        contact_email,
        contact_phone,
        is_active,
        max_entities,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM entities WHERE account_id = accounts.account_id) as entity_count,
        (SELECT COUNT(*) FROM account_users WHERE account_id = accounts.account_id AND role != 'super_admin') as user_count
      FROM accounts`;

    let queryParams = [];

    // Si NO es super_admin, solo mostrar su propia cuenta
    if (!isSuperAdmin && authenticatedAccountId) {
      query += ` WHERE account_id = ?`;
      queryParams.push(authenticatedAccountId);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await poolAdmin.query(query, queryParams);

    res.json({
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las cuentas",
      error: error.message
    });
  }
};

/**
 * GET /api/v2/admin/account/:id
 * Obtener una cuenta por ID
 */
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await poolAdmin.query(
      `SELECT
        account_id,
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_country,
        billing_tax_id,
        billing_notes,
        contact_email,
        contact_phone,
        is_active,
        max_entities,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM entities WHERE account_id = accounts.account_id) as entity_count,
        (SELECT COUNT(*) FROM account_users WHERE account_id = accounts.account_id AND role != 'super_admin') as user_count
      FROM accounts
      WHERE account_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada"
      });
    }

    const account = rows[0];

    // SEGURIDAD: Validar que account_admin solo pueda ver su propia cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && account.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver esta cuenta"
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la cuenta",
      error: error.message
    });
  }
};

/**
 * POST /api/v2/admin/accounts
 * Crear una nueva cuenta
 */
const createAccount = async (req, res) => {
  try {
    // SEGURIDAD: Solo super_admin puede crear cuentas
    const isSuperAdmin = req.account?.isSuperAdmin === true;

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear cuentas. Solo un Super Administrador puede realizar esta acción."
      });
    }

    const {
      billing_name,
      billing_email,
      billing_phone,
      billing_address,
      billing_country,
      billing_tax_id,
      billing_notes,
      contact_email,
      contact_phone,
      max_entities,
      is_active = true
    } = req.body;

    // Validar campos requeridos
    if (!billing_name) {
      return res.status(400).json({
        success: false,
        message: "La razón social es requerida"
      });
    }

    // Generar database_name a partir del billing_name
    const database_name = `db_${billing_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')}`;

    const [result] = await poolAdmin.query(
      `INSERT INTO accounts (
        database_name,
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_country,
        billing_tax_id,
        billing_notes,
        contact_email,
        contact_phone,
        is_active,
        max_entities,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        database_name,
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_country,
        billing_tax_id,
        billing_notes,
        contact_email,
        contact_phone,
        is_active,
        max_entities
      ]
    );

    // Obtener la cuenta recién creada
    const [newAccount] = await poolAdmin.query(
      'SELECT * FROM accounts WHERE account_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newAccount[0],
      message: "Cuenta creada exitosamente"
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear la cuenta",
      error: error.message
    });
  }
};

/**
 * PUT /api/v2/admin/account/:id
 * Actualizar una cuenta
 */
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      billing_name,
      billing_email,
      billing_phone,
      billing_address,
      billing_country,
      billing_tax_id,
      billing_notes,
      contact_email,
      contact_phone,
      max_entities,
      is_active
    } = req.body;

    // Verificar que la cuenta existe
    const [existing] = await poolAdmin.query(
      'SELECT account_id FROM accounts WHERE account_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada"
      });
    }

    // SEGURIDAD: Validar que account_admin solo pueda actualizar su propia cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && parseInt(id) !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar esta cuenta. Solo puedes actualizar tu propia cuenta."
      });
    }

    await poolAdmin.query(
      `UPDATE accounts SET
        billing_name = ?,
        billing_email = ?,
        billing_phone = ?,
        billing_address = ?,
        billing_country = ?,
        billing_tax_id = ?,
        billing_notes = ?,
        contact_email = ?,
        contact_phone = ?,
        max_entities = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE account_id = ?`,
      [
        billing_name,
        billing_email,
        billing_phone,
        billing_address,
        billing_country,
        billing_tax_id,
        billing_notes,
        contact_email,
        contact_phone,
        max_entities,
        is_active,
        id
      ]
    );

    // Obtener la cuenta actualizada
    const [updated] = await poolAdmin.query(
      'SELECT * FROM accounts WHERE account_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updated[0],
      message: "Cuenta actualizada exitosamente"
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la cuenta",
      error: error.message
    });
  }
};

/**
 * DELETE /api/v2/admin/account/:id
 * Eliminar una cuenta
 */
const deleteAccount = async (req, res) => {
  try {
    // SEGURIDAD: Solo super_admin puede eliminar cuentas
    const isSuperAdmin = req.account?.isSuperAdmin === true;

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar cuentas. Solo un Super Administrador puede realizar esta acción."
      });
    }

    const { id } = req.params;

    // Verificar que la cuenta existe
    const [existing] = await poolAdmin.query(
      'SELECT account_id FROM accounts WHERE account_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada"
      });
    }

    // Eliminar la cuenta
    await poolAdmin.query(
      'DELETE FROM accounts WHERE account_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: "Cuenta eliminada exitosamente"
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la cuenta",
      error: error.message
    });
  }
};

/**
 * GET /api/v2/admin/account/:id/entities
 * Obtener entidades de una cuenta
 */
const getAccountEntities = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await poolAdmin.query(
      `SELECT
        entity_id,
        account_id,
        entity_name,
        entity_full_name,
        is_active,
        created_at,
        updated_at
      FROM entities
      WHERE account_id = ?
      ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error getting account entities:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las entidades de la cuenta",
      error: error.message
    });
  }
};

// ==================== ENTITIES ====================

/**
 * GET /api/v2/admin/entities
 * Listar todas las entidades
 */
const getAllEntities = async (req, res) => {
  try {
    const { account_id } = req.query;

    // SEGURIDAD: Filtrar entidades según el rol del usuario autenticado
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    let query = `
      SELECT
        e.entity_id,
        e.account_id,
        e.entity_name,
        e.entity_full_name,
        e.is_active,
        e.created_at,
        e.updated_at,
        a.billing_name as account_name
      FROM entities e
      LEFT JOIN accounts a ON e.account_id = a.account_id
    `;

    const params = [];

    // Super admin: puede ver todas las entidades o filtrar por account_id
    if (isSuperAdmin) {
      if (account_id) {
        query += ' WHERE e.account_id = ?';
        params.push(account_id);
      }
    }
    // Account admin y otros: solo pueden ver entidades de su cuenta
    else if (authenticatedAccountId) {
      query += ' WHERE e.account_id = ?';
      params.push(authenticatedAccountId);
    }
    // Si no tiene cuenta asignada, no puede ver ninguna entidad
    else {
      query += ' WHERE 1 = 0'; // No retorna resultados
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await poolAdmin.query(query, params);

    res.json({
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error getting entities:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las entidades",
      error: error.message
    });
  }
};

/**
 * GET /api/v2/admin/entity/:id
 * Obtener una entidad por ID
 */
const getEntityById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await poolAdmin.query(
      `SELECT
        e.*,
        a.billing_name as account_name
      FROM entities e
      LEFT JOIN accounts a ON e.account_id = a.account_id
      WHERE e.entity_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entidad no encontrada"
      });
    }

    const entity = rows[0];

    // SEGURIDAD: Validar que solo pueda ver entidades de su cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && entity.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver esta entidad"
      });
    }

    res.json({
      success: true,
      data: entity
    });
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la entidad",
      error: error.message
    });
  }
};

/**
 * POST /api/v2/admin/entities
 * Crear una nueva entidad
 */
const createEntity = async (req, res) => {
  try {
    const {
      account_id,
      entity_name,
      entity_full_name,
      is_active = true
    } = req.body;

    // Validar campos requeridos
    if (!account_id || !entity_name) {
      return res.status(400).json({
        success: false,
        message: "El account_id y entity_name son requeridos"
      });
    }

    // SEGURIDAD: Validar que solo pueda crear entidades en su propia cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear entidades en otras cuentas. Solo puedes crear entidades en tu propia cuenta."
      });
    }

    const [result] = await poolAdmin.query(
      `INSERT INTO entities (
        account_id,
        entity_name,
        entity_full_name,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [account_id, entity_name, entity_full_name, is_active]
    );

    // Obtener la entidad recién creada
    const [newEntity] = await poolAdmin.query(
      'SELECT * FROM entities WHERE entity_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newEntity[0],
      message: "Entidad creada exitosamente"
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear la entidad",
      error: error.message
    });
  }
};

/**
 * PUT /api/v2/admin/entity/:id
 * Actualizar una entidad
 */
const updateEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      entity_name,
      entity_full_name,
      is_active
    } = req.body;

    // Verificar que la entidad existe y obtener su account_id
    const [existing] = await poolAdmin.query(
      'SELECT entity_id, account_id FROM entities WHERE entity_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entidad no encontrada"
      });
    }

    const currentEntity = existing[0];

    // SEGURIDAD: Validar que solo pueda actualizar entidades de su cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && currentEntity.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar esta entidad. Solo puedes actualizar entidades de tu propia cuenta."
      });
    }

    await poolAdmin.query(
      `UPDATE entities SET
        entity_name = ?,
        entity_full_name = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE entity_id = ?`,
      [entity_name, entity_full_name, is_active, id]
    );

    // Obtener la entidad actualizada
    const [updated] = await poolAdmin.query(
      'SELECT * FROM entities WHERE entity_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updated[0],
      message: "Entidad actualizada exitosamente"
    });
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la entidad",
      error: error.message
    });
  }
};

/**
 * DELETE /api/v2/admin/entity/:id
 * Eliminar una entidad
 */
const deleteEntity = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la entidad existe y obtener su account_id
    const [existing] = await poolAdmin.query(
      'SELECT entity_id, account_id FROM entities WHERE entity_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entidad no encontrada"
      });
    }

    const entityToDelete = existing[0];

    // SEGURIDAD: Validar que solo pueda eliminar entidades de su cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && entityToDelete.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta entidad. Solo puedes eliminar entidades de tu propia cuenta."
      });
    }

    // Eliminar la entidad
    await poolAdmin.query(
      'DELETE FROM entities WHERE entity_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: "Entidad eliminada exitosamente"
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la entidad",
      error: error.message
    });
  }
};

// ==================== USERS ====================

/**
 * GET /api/v2/admin/users
 * Listar todos los usuarios
 */
const getAllUsers = async (req, res) => {
  try {
    // SEGURIDAD: Filtrar usuarios según el rol del usuario autenticado
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    let query = `SELECT
        au.uid,
        au.email,
        au.name,
        au.role,
        au.account_id,
        au.entity_ids,
        au.is_active,
        au.created_at,
        au.updated_at,
        au.last_login,
        a.billing_name as account_name
      FROM account_users au
      LEFT JOIN accounts a ON au.account_id = a.account_id`;

    let queryParams = [];

    // Si NO es super_admin, solo mostrar usuarios de su cuenta
    if (!isSuperAdmin && authenticatedAccountId) {
      query += ` WHERE au.account_id = ?`;
      queryParams.push(authenticatedAccountId);
    }

    query += ` ORDER BY au.created_at DESC`;

    const [rows] = await poolAdmin.query(query, queryParams);

    // Transformar datos y obtener nombres de entidades
    const usersWithEntities = await Promise.all(rows.map(async (user) => {
      let entityIds = [];
      let entityNames = [];

      // Parsear entity_ids JSON
      if (user.entity_ids) {
        try {
          entityIds = JSON.parse(user.entity_ids);
        } catch (e) {
          console.error('Error parsing entity_ids for user:', user.uid, e);
          entityIds = [];
        }
      }

      // Si tiene entity_ids, obtener los nombres
      if (entityIds.length > 0) {
        const placeholders = entityIds.map(() => '?').join(',');
        const [entities] = await poolAdmin.query(
          `SELECT entity_id, entity_name FROM entities WHERE entity_id IN (${placeholders})`,
          entityIds
        );
        entityNames = entities.map(e => e.entity_name);
      }

      return {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        account_id: user.account_id,
        account_name: user.account_name,
        entity_ids: entityIds,
        entity_names: entityNames,
        is_active: Boolean(user.is_active),
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    }));

    res.json({
      count: usersWithEntities.length,
      data: usersWithEntities
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los usuarios",
      error: error.message
    });
  }
};

/**
 * GET /api/v2/admin/user/:uid
 * Obtener un usuario por UID
 */
const getUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;

    const [rows] = await poolAdmin.query(
      `SELECT
        au.uid,
        au.name,
        au.email,
        au.role,
        au.account_id,
        au.entity_ids,
        au.is_active,
        au.created_at,
        au.updated_at,
        au.last_login,
        a.billing_name as account_name
      FROM account_users au
      LEFT JOIN accounts a ON au.account_id = a.account_id
      WHERE au.uid = ?`,
      [uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const user = rows[0];

    // SEGURIDAD: Validar que account_admin solo pueda ver usuarios de su cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && user.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este usuario"
      });
    }

    // Parsear entity_ids JSON
    let entityIds = [];
    if (user.entity_ids) {
      try {
        entityIds = JSON.parse(user.entity_ids);
      } catch (e) {
        console.error('Error parsing entity_ids for user:', user.uid, e);
        entityIds = [];
      }
    }

    res.json({
      success: true,
      data: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        account_id: user.account_id,
        entity_ids: entityIds,
        is_active: Boolean(user.is_active),
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
        account_name: user.account_name
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el usuario",
      error: error.message
    });
  }
};

/**
 * POST /api/v2/admin/users
 * Crear un nuevo usuario
 * Nota: El usuario debe crearse primero en Firebase Authentication
 */
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      account_id,
      entity_ids = [],
      is_active = true
    } = req.body;

    // Validar campos requeridos
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "email, password y role son requeridos"
      });
    }

    // Validar roles válidos
    const validRoles = ['super_admin', 'account_admin', 'entity_admin', 'entity_user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol inválido"
      });
    }

    // SEGURIDAD: Validar permisos para crear usuarios según el rol
    // Obtener el usuario autenticado (del middleware de autenticación)
    const isSuperAdmin = req.account?.isSuperAdmin === true;

    // Si está intentando crear un super_admin, verificar que el usuario autenticado sea super_admin
    if (role === 'super_admin' && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear usuarios Super Administrador. Solo un Super Administrador puede crear otros Super Administradores."
      });
    }

    // SEGURIDAD: Validar que account_admin solo pueda crear usuarios en su propia cuenta
    if (!isSuperAdmin && account_id) {
      const authenticatedAccountId = req.account?.accountId;

      // Si el usuario autenticado tiene una cuenta y está intentando crear un usuario en otra cuenta
      if (authenticatedAccountId && account_id !== authenticatedAccountId) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear usuarios en otras cuentas. Solo puedes crear usuarios en tu propia cuenta."
        });
      }
    }

    // Validar que account_id sea NULL solo para super_admin
    if (role === 'super_admin' && account_id !== null) {
      return res.status(400).json({
        success: false,
        message: "Los usuarios super_admin no deben tener account_id (debe ser NULL)"
      });
    }

    // Validar que account_id NO sea NULL para otros roles
    if (role !== 'super_admin' && !account_id) {
      return res.status(400).json({
        success: false,
        message: "account_id es requerido para roles que no sean super_admin"
      });
    }

    // Crear usuario en Firebase Authentication
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name || email.split('@')[0],
        emailVerified: false
      });
    } catch (firebaseError) {
      console.error('Error creating Firebase user:', firebaseError);

      // Obtener el código de error (puede estar en errorInfo.code o code)
      const errorCode = firebaseError.errorInfo?.code || firebaseError.code;

      // Manejar errores específicos de Firebase
      if (errorCode === 'auth/email-already-exists') {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con este correo electrónico",
          error: firebaseError.message
        });
      }

      if (errorCode === 'auth/invalid-email') {
        return res.status(400).json({
          success: false,
          message: "El correo electrónico no es válido",
          error: firebaseError.message
        });
      }

      if (errorCode === 'auth/weak-password') {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
          error: firebaseError.message
        });
      }

      // Error genérico de Firebase
      return res.status(500).json({
        success: false,
        message: "Error al crear el usuario en Firebase",
        error: firebaseError.message
      });
    }

    // Guardar usuario en la base de datos con el UID de Firebase
    try {
      const entityIdsJson = entity_ids && entity_ids.length > 0 ? JSON.stringify(entity_ids) : null;

      const [result] = await poolAdmin.query(
        `INSERT INTO account_users (
          account_id,
          uid,
          name,
          email,
          role,
          entity_ids,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [account_id, firebaseUser.uid, name || email.split('@')[0], email, role, entityIdsJson, is_active]
      );

      // Obtener el usuario recién creado
      const [newUser] = await poolAdmin.query(
        'SELECT * FROM account_users WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        data: newUser[0],
        message: "Usuario creado exitosamente"
      });
    } catch (dbError) {
      // Si falla el guardado en DB, eliminar el usuario de Firebase
      console.error('Error saving user to database:', dbError);
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log('Firebase user deleted after DB error');
      } catch (deleteError) {
        console.error('Error deleting Firebase user after DB error:', deleteError);
      }

      res.status(500).json({
        success: false,
        message: "Error al guardar el usuario en la base de datos",
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
      error: error.message
    });
  }
};

/**
 * PUT /api/v2/admin/user/:uid
 * Actualizar un usuario
 */
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const {
      name,
      role,
      account_id,
      entity_ids,
      is_active
    } = req.body;

    // Verificar que el usuario existe y obtener su account_id actual
    const [existing] = await poolAdmin.query(
      'SELECT id, account_id FROM account_users WHERE uid = ?',
      [uid]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const currentUser = existing[0];

    // SEGURIDAD: Validar permisos para actualizar usuarios
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    // Validar que account_admin solo pueda editar usuarios de su propia cuenta
    if (!isSuperAdmin && authenticatedAccountId && currentUser.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para editar este usuario. Solo puedes editar usuarios de tu propia cuenta."
      });
    }

    // Si está intentando cambiar a super_admin, verificar que el usuario autenticado sea super_admin
    if (role === 'super_admin' && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para asignar el rol Super Administrador. Solo un Super Administrador puede hacerlo."
      });
    }

    // SEGURIDAD: Validar que account_admin solo pueda asignar usuarios a su propia cuenta
    if (!isSuperAdmin && account_id && authenticatedAccountId && account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para asignar usuarios a otras cuentas. Solo puedes gestionar usuarios en tu propia cuenta."
      });
    }

    const entityIdsJson = entity_ids && entity_ids.length > 0 ? JSON.stringify(entity_ids) : null;

    await poolAdmin.query(
      `UPDATE account_users SET
        name = ?,
        role = ?,
        account_id = ?,
        entity_ids = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE uid = ?`,
      [name, role, account_id, entityIdsJson, is_active, uid]
    );

    // Obtener el usuario actualizado
    const [updated] = await poolAdmin.query(
      'SELECT * FROM account_users WHERE uid = ?',
      [uid]
    );

    res.json({
      success: true,
      data: updated[0],
      message: "Usuario actualizado exitosamente"
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario",
      error: error.message
    });
  }
};

/**
 * DELETE /api/v2/admin/user/:uid
 * Eliminar un usuario
 */
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;

    // Verificar que el usuario existe y obtener su account_id
    const [existing] = await poolAdmin.query(
      'SELECT id, account_id FROM account_users WHERE uid = ?',
      [uid]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const userToDelete = existing[0];

    // SEGURIDAD: Validar que account_admin solo pueda eliminar usuarios de su cuenta
    const isSuperAdmin = req.account?.isSuperAdmin === true;
    const authenticatedAccountId = req.account?.accountId;

    if (!isSuperAdmin && authenticatedAccountId && userToDelete.account_id !== authenticatedAccountId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar este usuario. Solo puedes eliminar usuarios de tu propia cuenta."
      });
    }

    // Eliminar el usuario de la base de datos
    await poolAdmin.query(
      'DELETE FROM account_users WHERE uid = ?',
      [uid]
    );

    // Eliminar el usuario de Firebase Authentication
    try {
      await admin.auth().deleteUser(uid);
    } catch (firebaseError) {
      // Si el usuario no existe en Firebase, continuar de todas formas
      // ya que fue eliminado de la base de datos
      const errorCode = firebaseError.errorInfo?.code || firebaseError.code;
      if (errorCode !== 'auth/user-not-found') {
        console.error('Error deleting user from Firebase:', firebaseError);
        // No fallar la operación completa si Firebase falla
      }
    }

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el usuario",
      error: error.message
    });
  }
};

module.exports = {
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
};
