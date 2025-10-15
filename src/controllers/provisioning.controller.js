const pool = require("../db.js");
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Genera un código de activación formateado
 * Formato: SAB5-XXXX-XXXX-XXXX | CONS-XXXX-XXXX-XXXX | BROU-XXXX-XXXX-XXXX
 * Empresas: SAB-5 (1), CONSISA (2), BROUCLEAN (3)
 */
const generateActivationCode = (companyId) => {
    const prefixes = {
        1: 'SAB5',
        2: 'CONS',
        3: 'BROU'
    };

    const prefix = prefixes[companyId] || 'UNKN';

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
 * Genera un nuevo token de provisioning para una empresa
 */
const generateProvisioningToken = async (req, res) => {
    try {
        const { companyId } = req.body;

        // Validar companyId
        if (!companyId || ![1, 2, 3].includes(parseInt(companyId))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_COMPANY',
                    message: 'ID de empresa inválido. Debe ser 1 (SAB-5), 2 (CONSISA) o 3 (BROUCLEAN)'
                }
            });
        }

        // Mapeo de nombres de empresa
        const companyNames = {
            1: 'SAB-5',
            2: 'CONSISA',
            3: 'BROUCLEAN'
        };

        const companyName = companyNames[parseInt(companyId)];

        // Generar token y código de activación
        const token = generateToken();
        const activationCode = generateActivationCode(parseInt(companyId));

        // Calcular fecha de expiración (24 horas)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Guardar en base de datos
        const [result] = await pool.query(
            `INSERT INTO provisioning_tokens
            (token, activation_code, company_id, company_name, expires_at)
            VALUES (?, ?, ?, ?, ?)`,
            [token, activationCode, companyId, companyName, expiresAt]
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
                companyId: parseInt(companyId),
                companyName: companyName,
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
                companyId: tokenData.company_id,
                companyName: tokenData.company_name,
                displayName: getDisplayName(tokenData.company_id)
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
 * Helper: Obtiene nombre display de empresa
 */
const getDisplayName = (companyId) => {
    const displayNames = {
        1: 'SAB 5',
        2: 'CONSISA',
        3: 'BROUCLEAN'
    };
    return displayNames[companyId] || 'Empresa Desconocida';
};

module.exports = {
    generateProvisioningToken,
    validateProvisioningToken,
    listProvisioningTokens,
    revokeProvisioningToken
};
