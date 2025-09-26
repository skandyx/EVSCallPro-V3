const pool = require('./connection');
const { keysToCamel } = require('./utils');

/**
 * Récupère la configuration d'un PBX pour un site donné.
 * This is a mock function as pbx_configs table doesn't exist in schema.
 * It will look for site information and simulate a PBX config from it.
 * @param {string} siteId - L'ID du site.
 * @returns {Promise<object|null>} La configuration du PBX ou null si non trouvée.
 */
const getPbxConfigBySiteId = async (siteId) => {
    // In a real scenario, there would be a separate pbx_configs table.
    // For this app, the site table contains the necessary Yeastar info.
    const query = 'SELECT * FROM sites WHERE id = $1';
    const res = await pool.query(query, [siteId]);
    if (res.rows.length > 0) {
        const site = keysToCamel(res.rows[0]);
        // Adapt site data to look like a pbxConfig object for yeastarClient
        return {
            id: `pbx-${site.id}`,
            siteId: site.id,
            yeastarIp: site.yeastarIp,
            apiUser: site.apiUser,
            apiPassword: site.apiPassword,
            apiVersion: null // Let yeastarClient auto-detect
        };
    }
    return null;
};

/**
 * Met à jour la version de l'API détectée pour un PBX.
 * This is a mock function as the pbx_configs table is simulated.
 * @param {string} pbxId - L'ID de la configuration PBX.
 * @param {number} version - La version de l'API (1 ou 2).
 * @returns {Promise<void>}
 */
const updatePbxApiVersion = async (pbxId, version) => {
    // This function would update the pbx_configs table in a real implementation.
    // Since we are simulating, this function does nothing but log.
    console.log(`[Mock DB] Pretending to update API version for PBX ${pbxId} to ${version}.`);
    return Promise.resolve();
};


module.exports = {
    getPbxConfigBySiteId,
    updatePbxApiVersion,
};
