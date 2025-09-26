// backend/routes/sites.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /sites:
 *   post:
 *     summary: Crée un nouveau site.
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Site' } } }
 *     responses:
 *       201: { description: 'Site créé' }
 */
router.post('/', async (req, res) => {
    try { res.status(201).json(await db.saveSite(req.body)); }
    catch (e) { res.status(500).json({ error: 'Failed to save site' }); }
});

/**
 * @openapi
 * /sites/{id}:
 *   put:
 *     summary: Met à jour un site.
 *     tags: [Sites]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Site' } } }
 *     responses:
 *       200: { description: 'Site mis à jour' }
 */
router.put('/:id', async (req, res) => {
    try { res.json(await db.saveSite(req.body, req.params.id)); }
    catch (e) { res.status(500).json({ error: 'Failed to save site' }); }
});

/**
 * @openapi
 * /sites/{id}:
 *   delete:
 *     summary: Supprime un site.
 *     tags: [Sites]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Site supprimé' }
 */
router.delete('/:id', async (req, res) => {
    try { await db.deleteSite(req.params.id); res.status(204).send(); }
    catch (e) { res.status(500).json({ error: 'Failed to delete site' }); }
});

module.exports = router;