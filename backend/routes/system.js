// backend/routes/system.js
const express = require('express');
const router = express.Router();
const os = require('os');
const pool = require('../services/db/connection');

// Middleware to check for SuperAdmin role
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'SuperAdmin') {
        next();
    } else {
        res.status(403).json({ error: 'Accès interdit. Rôle SuperAdmin requis.' });
    }
};

/**
 * @openapi
 * /system/stats:
 *   get:
 *     summary: Récupère les statistiques de santé du système.
 *     tags: [Système]
 *     responses:
 *       200:
 *         description: Statistiques du système.
 */
router.get('/stats', (req, res) => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const cpuLoad = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        acc.total += total;
        acc.idle += cpu.times.idle;
        return acc;
    }, { total: 0, idle: 0 });
    
    // This is a very basic load calculation, not perfectly accurate but fine for a dashboard
    const loadPercentage = ((cpuLoad.total - cpuLoad.idle) / cpuLoad.total * 100).toFixed(1);

    res.json({
        cpu: {
            brand: cpus[0].model,
            load: loadPercentage,
        },
        ram: {
            total: totalMem,
            used: totalMem - freeMem,
        },
        disk: { // Mocked data as `diskusage` is an external dependency
            total: 50 * 1024 * 1024 * 1024, // 50 GB
            used: 20 * 1024 * 1024 * 1024, // 20 GB
        },
        recordings: { // Mocked
            size: 1.5 * 1024 * 1024 * 1024, // 1.5 GB
            files: 1234,
        },
    });
});

/**
 * @openapi
 * /system/db-schema:
 *   get:
 *     summary: Récupère le schéma de la base de données.
 *     tags: [Système]
 *     responses:
 *       200:
 *         description: Schéma de la base de données.
 */
router.get('/db-schema', isSuperAdmin, async (req, res) => {
    try {
        const query = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `;
        const { rows } = await pool.query(query);
        const schema = rows.reduce((acc, { table_name, column_name, data_type }) => {
            if (!acc[table_name]) {
                acc[table_name] = [];
            }
            acc[table_name].push(`${column_name} (${data_type})`);
            return acc;
        }, {});
        res.json(schema);
    } catch (error) {
        console.error("Error fetching DB schema:", error);
        res.status(500).json({ error: 'Failed to fetch database schema' });
    }
});

/**
 * @openapi
 * /system/db-query:
 *   post:
 *     summary: Exécute une requête SQL sur la base de données.
 *     tags: [Système]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query: { type: string }
 *               readOnly: { type: boolean }
 *     responses:
 *       200:
 *         description: Résultats de la requête.
 */
router.post('/db-query', isSuperAdmin, async (req, res) => {
    const { query, readOnly } = req.body;
    
    if (readOnly && !/^\s*SELECT/i.test(query)) {
        return res.status(403).json({ message: "Seules les requêtes SELECT sont autorisées en mode lecture seule." });
    }

    try {
        const result = await pool.query(query);
        res.json({
            columns: result.fields.map(f => f.name),
            rows: result.rows,
            rowCount: result.rowCount,
        });
    } catch (error) {
        console.error("Error executing DB query:", error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;