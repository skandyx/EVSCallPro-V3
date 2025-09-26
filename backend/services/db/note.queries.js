const pool = require('./connection');
const { keysToCamel } = require('./utils');

const getNotesForContact = async (contactId) => {
    const query = 'SELECT * FROM contact_notes WHERE contact_id = $1 ORDER BY created_at DESC';
    const res = await pool.query(query, [contactId]);
    return res.rows.map(keysToCamel);
};

const createNote = async ({ contactId, agentId, campaignId, note }) => {
    const query = `
        INSERT INTO contact_notes (id, contact_id, agent_id, campaign_id, note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const newId = `note-${Date.now()}`;
    const res = await pool.query(query, [newId, contactId, agentId, campaignId, note]);
    return keysToCamel(res.rows[0]);
};

module.exports = {
    getNotesForContact,
    createNote,
};