/**
 * Panic Controller - Gestión de alertas de pánico
 * Endpoints para el botón de pánico de la app móvil
 */
const pool = require("../db.js");

/**
 * Enviar alerta de pánico (App móvil)
 * POST /panic/:idEmpresa
 */
const sendPanicAlert = async (req, res) => {
    try {
        const { idEmpresa } = req.params;
        const {
            pers_nomb,
            pers_lega,
            ncli,
            nobj,
            coor,
            anid
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO panic_alerts
            (PANI_DATE, PANI_PERS_NOMB, PANI_PERS_LEGA, PANI_NCLI, PANI_NOBJ, PANI_COOR, PANI_ANID, PANI_ESTA, ENTITY_ID)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [pers_nomb, pers_lega, ncli, nobj, coor, anid, idEmpresa]
        );

        if (result.affectedRows > 0) {
            return res.status(201).json({
                result: 1,
                message: "Alerta de pánico registrada",
                alertId: result.insertId
            });
        }

        return res.status(500).json({ result: 0, message: "Error al registrar alerta" });
    } catch (error) {
        console.error("Error en sendPanicAlert:", error);
        return res.status(500).json({ result: 0, message: error.message });
    }
};

/**
 * Obtener alertas de pánico (WebAdmin)
 * GET /panic/:idEmpresa
 * Query params opcionales: status, limit, offset
 */
const getPanicAlerts = async (req, res) => {
    try {
        const { idEmpresa } = req.params;
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `SELECT * FROM panic_alerts WHERE ENTITY_ID = ?`;
        const params = [idEmpresa];

        if (status) {
            query += ` AND PANI_ESTA = ?`;
            params.push(status);
        }

        query += ` ORDER BY PANI_DATE DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (error) {
        console.error("Error en getPanicAlerts:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Obtener una alerta específica
 * GET /panic/:paniId/:idEmpresa
 */
const getPanicAlert = async (req, res) => {
    try {
        const { paniId, idEmpresa } = req.params;

        const [rows] = await pool.query(
            `SELECT * FROM panic_alerts WHERE PANI_ID = ? AND ENTITY_ID = ?`,
            [paniId, idEmpresa]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Alerta no encontrada" });
        }

        return res.json(rows[0]);
    } catch (error) {
        console.error("Error en getPanicAlert:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Actualizar estado de alerta (WebAdmin)
 * PATCH /panic/:paniId/:idEmpresa
 * Body: { status: 'active' | 'reviewed' | 'resolved' }
 */
const updatePanicStatus = async (req, res) => {
    try {
        const { paniId, idEmpresa } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'reviewed', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Estado inválido. Use: active, reviewed, resolved"
            });
        }

        const [result] = await pool.query(
            `UPDATE panic_alerts SET PANI_ESTA = ? WHERE PANI_ID = ? AND ENTITY_ID = ?`,
            [status, paniId, idEmpresa]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: 0, message: "Alerta no encontrada" });
        }

        return res.json({ result: 1, message: "Estado actualizado" });
    } catch (error) {
        console.error("Error en updatePanicStatus:", error);
        return res.status(500).json({ result: 0, message: error.message });
    }
};

/**
 * Contar alertas activas (WebAdmin)
 * GET /panic/count/:idEmpresa
 */
const countActiveAlerts = async (req, res) => {
    try {
        const { idEmpresa } = req.params;

        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM panic_alerts WHERE ENTITY_ID = ? AND PANI_ESTA = 'active'`,
            [idEmpresa]
        );

        return res.json({ count: rows[0].count });
    } catch (error) {
        console.error("Error en countActiveAlerts:", error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendPanicAlert,
    getPanicAlerts,
    getPanicAlert,
    updatePanicStatus,
    countActiveAlerts
};
