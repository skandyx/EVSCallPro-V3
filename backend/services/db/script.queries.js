const pool = require('./connection');
const { parseScriptOrFlow } = require('./utils');

const getScripts = async () => {
    const res = await pool.query('SELECT * FROM scripts ORDER BY name');
    return res.rows.map(parseScriptOrFlow);
};

const saveScript = async (script, id) => {
    const { name, pages, startPageId, backgroundColor } = script;
    const pagesJson = JSON.stringify(pages);
    if (id) {
        const res = await pool.query('UPDATE scripts SET name=$1, pages=$2, start_page_id=$3, background_color=$4, updated_at=NOW() WHERE id=$5 RETURNING *', [name, pagesJson, startPageId, backgroundColor, id]);
        return parseScriptOrFlow(res.rows[0]);
    }
    const res = await pool.query('INSERT INTO scripts (id, name, pages, start_page_id, background_color) VALUES ($1, $2, $3, $4, $5) RETURNING *', [script.id, name, pagesJson, startPageId, backgroundColor]);
    return parseScriptOrFlow(res.rows[0]);
};

const deleteScript = async (id) => {
    // Check if the script is assigned to any campaign
    const checkRes = await pool.query('SELECT id FROM campaigns WHERE script_id = $1 LIMIT 1', [id]);
    if (checkRes.rows.length > 0) {
        throw new Error('Impossible de supprimer un script qui est assigné à une ou plusieurs campagnes.');
    }
    await pool.query('DELETE FROM scripts WHERE id = $1', [id]);
};


const duplicateScript = async (id) => {
    const res = await pool.query('SELECT * FROM scripts WHERE id = $1', [id]);
    if (res.rows.length === 0) {
        throw new Error('Script not found');
    }
    const originalScript = parseScriptOrFlow(res.rows[0]);
    const newScript = {
        ...originalScript,
        id: `script-${Date.now()}`,
        name: `${originalScript.name} (Copie)`,
    };
    return saveScript(newScript); 
};

module.exports = {
    getScripts,
    saveScript,
    deleteScript,
    duplicateScript,
};