const pool = require('./connection');
const { keysToCamel } = require('./utils');

const getUserGroups = async () => {
    // This query now correctly joins with the members table to get the full group object
    const query = `
        SELECT
            ug.id,
            ug.name,
            COALESCE(ARRAY_AGG(ugm.user_id) FILTER (WHERE ugm.user_id IS NOT NULL), '{}') as member_ids
        FROM user_groups ug
        LEFT JOIN user_group_members ugm ON ug.id = ugm.group_id
        GROUP BY ug.id
        ORDER BY ug.name;
    `;
    const res = await pool.query(query);
    return res.rows.map(keysToCamel);
};

const saveUserGroup = async (group, id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Step 1: Upsert group details
        let savedGroup;
        const groupId = id || group.id;

        if (id) {
            const res = await client.query('UPDATE user_groups SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [group.name, id]);
            if (res.rows.length === 0) throw new Error(`Group with id ${id} not found.`);
            savedGroup = res.rows[0];
        } else {
            const res = await client.query('INSERT INTO user_groups (id, name) VALUES ($1, $2) RETURNING *', [group.id, group.name]);
            savedGroup = res.rows[0];
        }
        
        // Step 2: Get current and desired members
        const { rows: currentMembers } = await client.query('SELECT user_id FROM user_group_members WHERE group_id = $1', [groupId]);
        const currentMemberIds = new Set(currentMembers.map(m => m.user_id));
        const desiredMemberIds = new Set(group.memberIds || []);

        // Step 3: Calculate and execute diff
        const toAdd = [...desiredMemberIds].filter(userId => !currentMemberIds.has(userId));
        const toRemove = [...currentMemberIds].filter(userId => !desiredMemberIds.has(userId));

        if (toRemove.length > 0) {
            await client.query(`DELETE FROM user_group_members WHERE group_id = $1 AND user_id = ANY($2::text[])`, [groupId, toRemove]);
        }

        if (toAdd.length > 0) {
            for (const userId of toAdd) {
                await client.query('INSERT INTO user_group_members (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);
            }
        }
        
        await client.query('COMMIT');
        
        const finalGroup = keysToCamel(savedGroup);
        finalGroup.memberIds = group.memberIds || [];
        
        return finalGroup;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error in saveUserGroup transaction:", e);
        throw e;
    } finally {
        client.release();
    }
};

const deleteUserGroup = async (id) => {
    await pool.query('DELETE FROM user_groups WHERE id = $1', [id]);
};

module.exports = {
    getUserGroups,
    saveUserGroup,
    deleteUserGroup,
};