const pool = require('./connection');
const { keysToCamel } = require('./utils');

const getPlanningEvents = async () => (await pool.query('SELECT * FROM planning_events')).rows.map(keysToCamel);

const savePlanningEvent = async (event, id) => {
    const { agentId, activityId, startDate, endDate } = event;
    if (id) {
        const res = await pool.query(
            'UPDATE planning_events SET agent_id=$1, activity_id=$2, start_date=$3, end_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
            [agentId, activityId, startDate, endDate, id]
        );
        return keysToCamel(res.rows[0]);
    }
    const res = await pool.query(
        'INSERT INTO planning_events (id, agent_id, activity_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [event.id, agentId, activityId, startDate, endDate]
    );
    return keysToCamel(res.rows[0]);
};

const deletePlanningEvent = async (id) => await pool.query('DELETE FROM planning_events WHERE id=$1', [id]);

const getActivityTypes = async () => (await pool.query('SELECT * FROM activity_types ORDER BY name')).rows.map(keysToCamel);
const getPersonalCallbacks = async () => (await pool.query('SELECT * FROM personal_callbacks')).rows.map(keysToCamel);

module.exports = {
    getPlanningEvents,
    savePlanningEvent,
    deletePlanningEvent,
    getActivityTypes,
    getPersonalCallbacks,
};