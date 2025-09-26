const pool = require('./connection');
const bcrypt = require('bcrypt');
const { keysToCamel } = require('./utils');

const authenticateUser = async (loginId, password) => {
    // Étape 1: Récupérer l'utilisateur par son loginId, y compris le hash du mot de passe.
    const query = `
        SELECT id, login_id, first_name, last_name, email, "role", is_active, site_id, password_hash, created_at, updated_at 
        FROM users 
        WHERE login_id = $1
    `;
    const res = await pool.query(query, [loginId]);
    
    if (res.rows.length === 0) {
        return null; // L'utilisateur n'existe pas
    }

    const user = res.rows[0];

    // Étape 2: Comparer le mot de passe fourni avec le hash stocké.
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
        // Le mot de passe est correct. Renvoyer les données de l'utilisateur SANS le hash.
        const { password_hash, ...userToSend } = user;
        return keysToCamel(userToSend);
    }
    
    // Le mot de passe est incorrect.
    return null;
};

module.exports = {
    authenticateUser,
};