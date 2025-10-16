const poolAdmin = require("../db-admin.js");

/**
 * GET /api/v2/account
 * Obtiene información de la cuenta autenticada
 */
const getAccountInfo = async (req, res) => {
  try {
    const accountId = req.account.accountId;

    const [rows] = await poolAdmin.query(
      `SELECT
        account_id,
        billing_name,
        billing_tax_id,
        billing_address,
        billing_country,
        billing_email,
        billing_phone,
        billing_notes,
        contact_email,
        contact_phone,
        is_active,
        max_entities,
        created_at,
        updated_at
      FROM accounts
      WHERE account_id = ?`,
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Cuenta no encontrada"
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo información de cuenta:', error);
    res.status(500).json({
      message: "Error al obtener información de la cuenta"
    });
  }
};

/**
 * GET /api/v2/entities
 * Lista todas las entidades de la cuenta autenticada
 */
const listEntities = async (req, res) => {
  try {
    const accountId = req.account.accountId;

    const [rows] = await poolAdmin.query(
      `SELECT
        entity_id,
        entity_name,
        entity_full_name,
        database_name,
        storage_path,
        is_active,
        settings,
        created_at,
        updated_at
      FROM entities
      WHERE account_id = ? AND is_active = 1
      ORDER BY entity_name`,
      [accountId]
    );

    // Parsear el campo JSON settings
    const entities = rows.map(entity => ({
      ...entity,
      settings: typeof entity.settings === 'string'
        ? JSON.parse(entity.settings)
        : entity.settings
    }));

    res.json({
      count: entities.length,
      entities: entities
    });
  } catch (error) {
    console.error('Error listando entidades:', error);
    res.status(500).json({
      message: "Error al listar entidades"
    });
  }
};

/**
 * GET /api/v2/entity/:entity_id
 * Obtiene información de una entidad específica
 */
const getEntityById = async (req, res) => {
  try {
    const accountId = req.account.accountId;
    const { entity_id } = req.params;

    const [rows] = await poolAdmin.query(
      `SELECT
        entity_id,
        entity_name,
        entity_full_name,
        database_name,
        storage_path,
        is_active,
        settings,
        created_at,
        updated_at
      FROM entities
      WHERE entity_id = ? AND account_id = ? AND is_active = 1`,
      [entity_id, accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Entidad no encontrada o no pertenece a esta cuenta"
      });
    }

    const entity = rows[0];

    // Parsear el campo JSON settings
    entity.settings = typeof entity.settings === 'string'
      ? JSON.parse(entity.settings)
      : entity.settings;

    res.json(entity);
  } catch (error) {
    console.error('Error obteniendo entidad:', error);
    res.status(500).json({
      message: "Error al obtener información de la entidad"
    });
  }
};

module.exports = {
  getAccountInfo,
  getEntityById,
  listEntities
};
