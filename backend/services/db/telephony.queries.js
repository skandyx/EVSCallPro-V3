const pool = require('./connection');
const { keysToCamel } = require('./utils');

const getTrunks = async () => (await pool.query('SELECT * FROM trunks ORDER BY name')).rows.map(keysToCamel);
const saveTrunk = async (trunk, id) => {
    const { name, domain, login, password, authType, registerString, dialPattern, inboundContext, forceCallerId } = trunk;
    if (id) {
        const res = await pool.query(
            'UPDATE trunks SET name=$1, domain=$2, login=$3, password_encrypted=$4, auth_type=$5, register_string=$6, dial_pattern=$7, inbound_context=$8, force_caller_id=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
            [name, domain, login, password, authType, registerString, dialPattern, inboundContext, forceCallerId || null, id]
        );
        return keysToCamel(res.rows[0]);
    }
    const res = await pool.query(
        'INSERT INTO trunks (id, name, domain, login, password_encrypted, auth_type, register_string, dial_pattern, inbound_context, force_caller_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [trunk.id, name, domain, login, password, authType, registerString, dialPattern, inboundContext, forceCallerId || null]
    );
    return keysToCamel(res.rows[0]);
};
const deleteTrunk = async (id) => await pool.query('DELETE FROM trunks WHERE id=$1', [id]);

const getDids = async () => (await pool.query('SELECT * FROM dids ORDER BY number')).rows.map(keysToCamel);
const saveDid = async (did, id) => {
    const { number, description, trunkId, ivrFlowId } = did;
    if (id) {
        const res = await pool.query(
            'UPDATE dids SET "number"=$1, description=$2, trunk_id=$3, ivr_flow_id=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
            [number, description, trunkId, ivrFlowId, id]
        );
        return keysToCamel(res.rows[0]);
    }
    const res = await pool.query(
        'INSERT INTO dids (id, "number", description, trunk_id, ivr_flow_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [did.id, number, description, trunkId, ivrFlowId]
    );
    return keysToCamel(res.rows[0]);
};
const deleteDid = async (id) => await pool.query('DELETE FROM dids WHERE id=$1', [id]);

module.exports = {
    getTrunks,
    saveTrunk,
    deleteTrunk,
    getDids,
    saveDid,
    deleteDid,
};