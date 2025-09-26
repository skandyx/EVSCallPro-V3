const pool = require('./connection');
const { keysToCamel } = require('./utils');

const getSites = async () => (await pool.query('SELECT * FROM sites ORDER BY name')).rows.map(keysToCamel);

const saveSite = async (site, id) => {
    const { name } = site;
    if (id) {
        const res = await pool.query(
            'UPDATE sites SET name=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
            [name, id]
        );
        return keysToCamel(res.rows[0]);
    }
    const res = await pool.query(
        'INSERT INTO sites (id, name) VALUES ($1, $2) RETURNING *',
        [site.id, name]
    );
    return keysToCamel(res.rows[0]);
};

const deleteSite = async (id) => await pool.query('DELETE FROM sites WHERE id=$1', [id]);

module.exports = {
    getSites,
    saveSite,
    deleteSite,
};