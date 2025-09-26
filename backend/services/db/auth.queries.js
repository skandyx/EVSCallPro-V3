const pool = require('./connection');
const { keysToCamel } = require('./utils');

const authenticateUser = async (loginId, password) => {
    // In a real app, 'password' would be hashed before comparison
    // IMPORTANT: Never select password_hash to send back to client
    const query = `
        SELECT id, login_id, first_name, last_name, email, "role", is_active, site_id, created_at, updated_at 
        FROM users 
        WHERE login_id = $1 AND password_hash = $2
    `;
    const res = await pool.query(query, [loginId, password]);
    
    if (res.rows.length > 0) {
        return keysToCamel(res.rows[0]);
    }
    return null;
};

module.exports = {
    authenticateUser,
};