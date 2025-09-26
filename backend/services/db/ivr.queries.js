const pool = require('./connection');
const { keysToCamel, parseScriptOrFlow } = require('./utils');

const getIvrFlows = async () => {
    const res = await pool.query('SELECT * FROM ivr_flows ORDER BY name');
    return res.rows.map(parseScriptOrFlow);
};

const saveIvrFlow = async (flow, id) => {
     const { name, nodes, connections } = flow;
    const nodesJson = JSON.stringify(nodes);
    const connectionsJson = JSON.stringify(connections);
    if (id) {
        const res = await pool.query('UPDATE ivr_flows SET name=$1, nodes=$2, connections=$3, updated_at=NOW() WHERE id=$4 RETURNING *', [name, nodesJson, connectionsJson, id]);
        return parseScriptOrFlow(res.rows[0]);
    }
    const res = await pool.query('INSERT INTO ivr_flows (id, name, nodes, connections) VALUES ($1, $2, $3, $4) RETURNING *', [flow.id, name, nodesJson, connectionsJson]);
    return parseScriptOrFlow(res.rows[0]);
};

const deleteIvrFlow = async (id) => await pool.query('DELETE FROM ivr_flows WHERE id=$1', [id]);

const duplicateIvrFlow = async (id) => {
    const res = await pool.query('SELECT * FROM ivr_flows WHERE id = $1', [id]);
    if (res.rows.length === 0) {
        throw new Error('IVR Flow not found');
    }
    const originalFlow = parseScriptOrFlow(res.rows[0]);
    const newFlow = {
        ...originalFlow,
        id: `ivr-flow-${Date.now()}`,
        name: `${originalFlow.name} (Copie)`,
    };
    return saveIvrFlow(newFlow);
};

const getIvrFlowByDnid = async (dnid) => {
    const query = `
        SELECT ivr.* 
        FROM ivr_flows ivr
        JOIN dids d ON d.ivr_flow_id = ivr.id
        WHERE d.number = $1
    `;
    const res = await pool.query(query, [dnid]);
    if (res.rows.length > 0) {
        let flow = keysToCamel(res.rows[0]);
        // PG driver can auto-parse JSON, but if not, ensure it's parsed
        if (typeof flow.nodes === 'string') flow.nodes = JSON.parse(flow.nodes);
        if (typeof flow.connections === 'string') flow.connections = JSON.parse(flow.connections);
        return flow;
    }
    return null;
};

module.exports = {
    getIvrFlows,
    saveIvrFlow,
    deleteIvrFlow,
    duplicateIvrFlow,
    getIvrFlowByDnid,
};
