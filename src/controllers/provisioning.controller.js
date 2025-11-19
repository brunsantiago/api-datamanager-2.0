const pool = require("../db.js");
const poolAdmin = require("../db-admin.js");
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Genera un código de activación formateado dinámicamente
 * Formato: XXXX-XXXX-XXXX-XXXX (usando primeras 4 letras del entity_name como prefijo)
 * Ejemplo: SAB5-A3F2-B7E1-C9D4, CONS-F2A3-E7B1-D9C4, HIGH-D2F3-A8E1-B7C9
 */
const generateActivationCode = (entityName) => {
    // Tomar las primeras 4 letras del entity_name y convertir a mayúsculas
    // Eliminar espacios y caracteres especiales
    const cleanName = entityName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const prefix = cleanName.substring(0, 4).padEnd(4, 'X'); // Si es menor a 4 chars, rellenar con X

    // Generar 3 bloques de 4 caracteres alfanuméricos
    const block1 = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
    const block2 = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
    const block3 = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);

    return `${prefix}-${block1}-${block2}-${block3}`;
};

/**
 * Genera un token único
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * POST /api/v2/provisioning/generate-token
 * Genera un nuevo token de provisioning para cualquier entity del sistema
 */
const generateProvisioningToken = async (req, res) => {
    try {
        const { entityId } = req.body;

        // Validar que entityId sea proporcionado
        if (!entityId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ENTITY_ID',
                    message: 'Debe proporcionar un entityId'
                }
            });
        }

        // Consultar entity desde appcontrol_admin
        const [entityRows] = await poolAdmin.query(
            `SELECT entity_id, entity_name, entity_full_name, is_active
             FROM entities
             WHERE entity_id = ?`,
            [parseInt(entityId)]
        );

        // Verificar que la entity exista y esté activa
        if (entityRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ENTITY_NOT_FOUND',
                    message: 'Entity no encontrada'
                }
            });
        }

        const entity = entityRows[0];

        if (!entity.is_active) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'ENTITY_INACTIVE',
                    message: 'La entity no está activa'
                }
            });
        }

        // Generar token y código de activación
        const token = generateToken();
        const activationCode = generateActivationCode(entity.entity_name);

        // Calcular fecha de expiración (24 horas)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Guardar en base de datos (ahora usando entity_id y entity_name)
        const [result] = await pool.query(
            `INSERT INTO provisioning_tokens
            (token, activation_code, entity_id, entity_name, expires_at)
            VALUES (?, ?, ?, ?, ?)`,
            [token, activationCode, entity.entity_id, entity.entity_name, expiresAt]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: 'Error al guardar token en base de datos'
                }
            });
        }

        // Generar QR Code como Data URL
        const deepLink = `appcontrol://configure?token=${token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(deepLink, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 400,
            margin: 2
        });

        // Respuesta exitosa
        return res.status(201).json({
            success: true,
            data: {
                token: token,
                activationCode: activationCode,
                qrCodeDataUrl: qrCodeDataUrl, // Base64 data URL
                deepLink: deepLink,
                entityId: entity.entity_id,
                entityName: entity.entity_name,
                entityFullName: entity.entity_full_name,
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error generating provisioning token:', error);

        // Error de código duplicado (poco probable pero posible)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_TOKEN',
                    message: 'Token duplicado. Intenta nuevamente'
                }
            });
        }

        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
};

/**
 * POST /api/v2/provisioning/validate-token
 * Valida un token o código de activación
 */
const validateProvisioningToken = async (req, res) => {
    try {
        const { token, activationCode } = req.body;

        // Debe venir token O activationCode
        if (!token && !activationCode) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETER',
                    message: 'Debe proporcionar token o activationCode'
                }
            });
        }

        let query;
        let params;

        if (token) {
            query = `SELECT * FROM provisioning_tokens WHERE token = ?`;
            params = [token];
        } else {
            query = `SELECT * FROM provisioning_tokens WHERE activation_code = ?`;
            params = [activationCode];
        }

        const [rows] = await pool.query(query, params);

        // Token no existe
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token o código inválido'
                }
            });
        }

        const tokenData = rows[0];

        // Verificar si ya fue usado
        if (tokenData.used) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'TOKEN_ALREADY_USED',
                    message: 'Este código ya fue utilizado'
                }
            });
        }

        // Verificar si expiró
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (now > expiresAt) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'El código ha expirado. Solicita uno nuevo'
                }
            });
        }

        // Token válido - Marcar como usado
        await pool.query(
            `UPDATE provisioning_tokens
            SET used = TRUE, used_at = NOW()
            WHERE id = ?`,
            [tokenData.id]
        );

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            data: {
                companyId: tokenData.entity_id,
                companyName: tokenData.entity_name
            }
        });

    } catch (error) {
        console.error('Error validating provisioning token:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
};

/**
 * GET /api/v2/provisioning/tokens
 * Lista todos los tokens de provisioning (admin)
 * Requiere autenticación JWT
 */
const listProvisioningTokens = async (req, res) => {
    try {
        const { status } = req.query; // ?status=active|used|expired|all

        let query = `SELECT * FROM provisioning_tokens`;
        const conditions = [];

        if (status === 'active') {
            conditions.push('used = FALSE');
            conditions.push('expires_at > NOW()');
        } else if (status === 'used') {
            conditions.push('used = TRUE');
        } else if (status === 'expired') {
            conditions.push('used = FALSE');
            conditions.push('expires_at <= NOW()');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query);

        return res.status(200).json({
            success: true,
            data: rows,
            count: rows.length
        });

    } catch (error) {
        console.error('Error listing provisioning tokens:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
};

/**
 * DELETE /api/v2/provisioning/tokens/:tokenId
 * Revoca/elimina un token (admin)
 * Requiere autenticación JWT
 */
const revokeProvisioningToken = async (req, res) => {
    try {
        const { tokenId } = req.params;

        const [result] = await pool.query(
            `DELETE FROM provisioning_tokens WHERE id = ?`,
            [tokenId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token no encontrado'
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Token revocado exitosamente'
        });

    } catch (error) {
        console.error('Error revoking provisioning token:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
};

/**
 * GET /api/v2/provisioning/entity-config/:entity_id
 * Obtiene configuración completa de una entity para provisioning de dispositivos
 * ENDPOINT PÚBLICO (no requiere autenticación)
 */
const getEntityConfig = async (req, res) => {
    try {
        const { entity_id } = req.params;

        // Validar que entity_id sea numérico
        if (!entity_id || isNaN(parseInt(entity_id))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ENTITY_ID',
                    message: 'ID de entidad inválido'
                }
            });
        }

        // Consultar entity con JOIN a account para obtener account_storage_uid
        const [rows] = await poolAdmin.query(
            `SELECT
                e.entity_id,
                e.entity_name,
                e.entity_full_name,
                e.storage_uid as entity_storage_uid,
                e.is_active,
                e.settings,
                a.storage_uid as account_storage_uid
            FROM entities e
            INNER JOIN accounts a ON e.account_id = a.account_id
            WHERE e.entity_id = ? AND e.is_active = 1`,
            [parseInt(entity_id)]
        );

        // Entity no encontrada o inactiva
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ENTITY_NOT_FOUND',
                    message: 'Entidad no encontrada o inactiva'
                }
            });
        }

        const entity = rows[0];

        // Parsear settings JSON
        let settings = {};
        try {
            settings = typeof entity.settings === 'string'
                ? JSON.parse(entity.settings)
                : entity.settings || {};
        } catch (error) {
            console.warn(`Error parsing settings for entity ${entity_id}:`, error);
        }

        // Extraer configuración de UI
        const uiConfig = settings.ui || {};
        const titlePersonal = uiConfig.title_personal || 'PERSONAL';

        // Extraer configuración de logos (nueva estructura anidada)
        const logosConfig = uiConfig.logos || {};
        const mobileLogos = logosConfig.mobile || {};
        const logoMain = mobileLogos.main || '';
        const logoMenu = mobileLogos.menu || '';

        // Construir rutas completas de logos para mobile
        const basePath = `accounts/${entity.account_storage_uid}/entities/${entity.entity_storage_uid}/logos`;
        const logoMainPath = logoMain ? `${basePath}/${logoMain}` : '';
        const logoMenuPath = logoMenu ? `${basePath}/${logoMenu}` : '';

        // Respuesta con configuración completa
        return res.status(200).json({
            success: true,
            data: {
                entity_id: entity.entity_id,
                entity_name: entity.entity_name,
                entity_full_name: entity.entity_full_name,
                storage_uid: entity.entity_storage_uid,
                account_storage_uid: entity.account_storage_uid,
                logos: {
                    main_path: logoMainPath,
                    menu_path: logoMenuPath
                },
                ui: {
                    title_personal: titlePersonal
                },
                storage_base_path: basePath
            }
        });

    } catch (error) {
        console.error('Error getting entity config:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
};

module.exports = {
    generateProvisioningToken,
    validateProvisioningToken,
    listProvisioningTokens,
    revokeProvisioningToken,
    getEntityConfig
};
