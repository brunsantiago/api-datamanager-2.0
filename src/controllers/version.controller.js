const pool = require("../db.js");

/**
 * Obtiene la última versión de la app por empresa
 */
const getLastVersion = async (req, res) => {
  try {
    const { idEmpresa } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM app_version WHERE ENTITY_ID = ? AND version_code = (SELECT MAX(version_code) FROM app_version WHERE ENTITY_ID = ?)",
      [idEmpresa, idEmpresa]
    );
    res.json(rows);
  } catch (error) {
    console.error("getLastVersion error:", error);
    return res.status(500).json({ message: "Something goes wrong", error: error.message });
  }
};

/**
 * Obtiene la última versión de test
 */
const getLastVersionTest = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM app_version_test WHERE version_code = (SELECT MAX(version_code) FROM app_version_test)"
    );
    res.json(rows);
  } catch (error) {
    console.error("getLastVersionTest error:", error);
    return res.status(500).json({ message: "Something goes wrong", error: error.message });
  }
};

/**
 * Verifica si hay actualización disponible (tabla app_releases)
 */
const checkForUpdate = async (req, res) => {
  try {
    const { currentVersionCode } = req.params;
    const versionCode = parseInt(currentVersionCode, 10);

    const [rows] = await pool.query(
      `SELECT * FROM app_releases
       WHERE is_active = 1 AND is_published = 1 AND release_channel = 'production'
       ORDER BY version_code DESC LIMIT 1`
    );

    if (rows.length === 0) {
      return res.json({ updateAvailable: false, message: "No hay versiones disponibles" });
    }

    const latestVersion = rows[0];
    const updateAvailable = versionCode < latestVersion.version_code;
    const mustUpdate = versionCode < latestVersion.min_supported_version;

    res.json({
      updateAvailable,
      mustUpdate,
      forceUpdate: latestVersion.force_update === 1,
      currentVersion: versionCode,
      latestVersion: {
        versionCode: latestVersion.version_code,
        versionName: latestVersion.version_name,
        releaseNotes: latestVersion.release_notes,
        distributionType: latestVersion.distribution_type,
        apkDownloadUrl: latestVersion.apk_download_url,
        playstoreUrl: latestVersion.playstore_url
      }
    });
  } catch (error) {
    console.error("checkForUpdate error:", error);
    return res.status(500).json({ message: "Error al verificar actualización", error: error.message });
  }
};

/**
 * Obtiene la última release publicada
 */
const getLatestRelease = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM app_releases
       WHERE is_active = 1 AND is_published = 1 AND release_channel = 'production'
       ORDER BY version_code DESC LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay versiones disponibles" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("getLatestRelease error:", error);
    return res.status(500).json({ message: "Error al obtener versión", error: error.message });
  }
};

module.exports = {
  getLastVersion,
  getLastVersionTest,
  checkForUpdate,
  getLatestRelease
};
