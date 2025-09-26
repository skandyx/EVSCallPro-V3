
const pool = require('./connection');
const bcrypt = require('bcrypt');
const { keysToCamel } = require('./utils');

const SALT_ROUNDS = 10;

// Define safe columns to be returned, excluding sensitive ones like password_hash
const SAFE_USER_COLUMNS = 'u.id, u.login_id, u.extension, u.first_name, u.last_name, u.email, u."role", u.is_active, u.site_id, u.created_at, u.updated_at, u.mobile_number, u.use_mobile_as_station';

const getUsers = async () => {
    // The query is now enriched with a LEFT JOIN and ARRAY_AGG to fetch assigned campaign IDs for each user.
    // COALESCE ensures that even users with no campaigns get an empty array instead of null.
    const query = `
        SELECT ${SAFE_USER_COLUMNS}, COALESCE(ARRAY_AGG(ca.campaign_id) FILTER (WHERE ca.campaign_id IS NOT NULL), '{}') as campaign_ids
        FROM users u
        LEFT JOIN campaign_agents ca ON u.id = ca.user_id
        GROUP BY u.id
        ORDER BY u.first_name, u.last_name;
    `;
    const res = await pool.query(query);
    return res.rows.map(keysToCamel);
};

const getUserById = async (id) => {
    // This query also needs to be enriched to provide a complete user object
     const query = `
        SELECT ${SAFE_USER_COLUMNS}, u.is_active, COALESCE(ARRAY_AGG(ca.campaign_id) FILTER (WHERE ca.campaign_id IS NOT NULL), '{}') as campaign_ids
        FROM users u
        LEFT JOIN campaign_agents ca ON u.id = ca.user_id
        WHERE u.id = $1
        GROUP BY u.id;
    `;
    const res = await pool.query(query, [id]);
    return res.rows.length > 0 ? keysToCamel(res.rows[0]) : null;
};

const handleDbError = (e) => {
    if (e.code === '23505') { // Unique violation
        if (e.constraint === 'users_login_id_key' || e.constraint === 'users_extension_key') {
            throw new Error(`L'identifiant/extension existe déjà.`);
        }
        if (e.constraint === 'users_email_key') {
            throw new Error(`L'adresse email est déjà utilisée.`);
        }
    }
    throw e;
};

const createUser = async (userData) => {
    const { groupIds, ...user } = userData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Hacher le mot de passe avant de l'insérer
        const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

        // FIX: Use a distinct placeholder for each column to avoid type deduction errors.
        // The number of placeholders now matches the number of columns (12) and parameters.
        const userQuery = `
            INSERT INTO users (id, login_id, extension, first_name, last_name, email, "role", is_active, password_hash, site_id, mobile_number, use_mobile_as_station)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, login_id, first_name, last_name, email, "role", is_active, site_id, mobile_number, use_mobile_as_station;
        `;
        const userRes = await client.query(userQuery, [
            user.id, user.loginId, user.loginId, // Pass loginId twice for both login_id and extension
            user.firstName, user.lastName, user.email || null,
            user.role, user.isActive, passwordHash, user.siteId || null, 
            user.mobileNumber || null, user.useMobileAsStation || false
        ]);

        const newUser = userRes.rows[0];
        newUser.campaign_ids = []; // Initialize with empty array

        if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
                await client.query(
                    'INSERT INTO user_group_members (user_id, group_id) VALUES ($1, $2)',
                    [newUser.id, groupId]
                );
            }
        }
        
        if (user.campaignIds && user.campaignIds.length > 0) {
            for (const campaignId of user.campaignIds) {
                await client.query('INSERT INTO campaign_agents (user_id, campaign_id) VALUES ($1, $2)', [newUser.id, campaignId]);
            }
            newUser.campaign_ids = user.campaignIds;
        }

        await client.query('COMMIT');
        return keysToCamel(newUser);
    } catch (e) {
        await client.query('ROLLBACK');
        handleDbError(e);
    } finally {
        client.release();
    }
};

const updateUser = async (userId, userData) => {
    const { groupIds, ...user } = userData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const hasPassword = user.password && user.password.trim() !== '';
        
        // FIX: Use distinct placeholders for login_id and extension and adjust the parameter array.
        const queryParams = [
            user.loginId, // $1 for login_id
            user.loginId, // $2 for extension
            user.firstName, // $3
            user.lastName, // $4
            user.email || null, // $5
            user.role, // $6
            user.isActive, // $7
            user.siteId || null, // $8
            user.mobileNumber || null, // $9
            user.useMobileAsStation || false, // $10
        ];
        
        let passwordUpdateClause = '';
        if (hasPassword) {
            const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
            passwordUpdateClause = `, password_hash = $11`;
            queryParams.push(passwordHash);
        }
        
        queryParams.push(userId);
        const userIdIndex = queryParams.length;

        const userQuery = `
            UPDATE users SET 
                login_id = $1, extension = $2, first_name = $3, last_name = $4, email = $5, 
                "role" = $6, is_active = $7, site_id = $8, mobile_number = $9, use_mobile_as_station = $10
                ${passwordUpdateClause}, updated_at = NOW()
            WHERE id = $${userIdIndex}
            RETURNING id, login_id, first_name, last_name, email, "role", is_active, site_id, mobile_number, use_mobile_as_station;
        `;

        const { rows: updatedUserRows } = await client.query(userQuery, queryParams);
        if (updatedUserRows.length === 0) {
            throw new Error('User not found for update.');
        }

        // Update group memberships
        const { rows: currentGroups } = await client.query('SELECT group_id FROM user_group_members WHERE user_id = $1', [userId]);
        const currentGroupIds = new Set(currentGroups.map(g => g.group_id));
        const desiredGroupIds = new Set(groupIds || []);
        const toAdd = [...desiredGroupIds].filter(id => !currentGroupIds.has(id));
        const toRemove = [...currentGroupIds].filter(id => !desiredGroupIds.has(id));
        if (toRemove.length > 0) await client.query(`DELETE FROM user_group_members WHERE user_id = $1 AND group_id = ANY($2::text[])`, [userId, toRemove]);
        if (toAdd.length > 0) for (const groupId of toAdd) await client.query('INSERT INTO user_group_members (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);

        // Update campaign assignments
        const { rows: currentCampaigns } = await client.query('SELECT campaign_id FROM campaign_agents WHERE user_id = $1', [userId]);
        const currentCampaignIds = new Set(currentCampaigns.map(c => c.campaign_id));
        const desiredCampaignIds = new Set(user.campaignIds || []);
        const campaignsToAdd = [...desiredCampaignIds].filter(id => !currentCampaignIds.has(id));
        const campaignsToRemove = [...currentCampaignIds].filter(id => !desiredCampaignIds.has(id));
        if (campaignsToRemove.length > 0) await client.query(`DELETE FROM campaign_agents WHERE user_id = $1 AND campaign_id = ANY($2::text[])`, [userId, campaignsToRemove]);
        if (campaignsToAdd.length > 0) for (const campaignId of campaignsToAdd) await client.query('INSERT INTO campaign_agents (user_id, campaign_id) VALUES ($1, $2)', [userId, campaignId]);
        
        await client.query('COMMIT');
        
        const finalUser = updatedUserRows[0];
        finalUser.campaign_ids = user.campaignIds || [];
        
        return keysToCamel(finalUser);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error in updateUser transaction:", e);
        handleDbError(e);
    } finally {
        client.release();
    }
};

const deleteUser = async (id) => {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

const generatePassword = () => Math.random().toString(36).slice(-8);

const createUsersBulk = async (users) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const createdUsers = [];
        for (const user of users) {
             const passwordHash = await bcrypt.hash(user.password || generatePassword(), SALT_ROUNDS);
             // FIX: Use a distinct placeholder for each column to avoid type deduction errors.
            const userQuery = `
                INSERT INTO users (id, login_id, extension, first_name, last_name, email, "role", is_active, password_hash, site_id, mobile_number, use_mobile_as_station)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, login_id, first_name, last_name, email, "role", is_active, site_id;
            `;
            const res = await client.query(userQuery, [
                user.id,
                user.loginId,
                user.loginId, // Pass loginId twice for both login_id and extension
                user.firstName,
                user.lastName,
                user.email || null,
                user.role || 'Agent',
                'isActive' in user ? user.isActive : true,
                passwordHash,
                user.siteId || null,
                user.mobileNumber || null,
                'useMobileAsStation' in user ? user.useMobileAsStation : false
            ]);
            createdUsers.push(res.rows[0]);
        }
        await client.query('COMMIT');
        return createdUsers.map(keysToCamel);
    } catch (e) {
        await client.query('ROLLBACK');
        handleDbError(e);
    } finally {
        client.release();
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    createUsersBulk,
};