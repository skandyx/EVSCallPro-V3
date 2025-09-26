// backend/routes/planning.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /planning-events:
 *   post:
 *     summary: Crée un nouvel événement de planning.
 *     tags: [Planning]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/PlanningEvent' } } }
 *     responses:
 *       201: { description: 'Événement créé' }
 */
router.post('/', async (req, res) => {
    try { res.status(201).json(await db.savePlanningEvent(req.body)); }
    catch (e) { res.status(500).json({ error: 'Failed to save event' }); }
});

/**
 * @openapi
 * /planning-events/{id}:
 *   put:
 *     summary: Met à jour un événement de planning.
 *     tags: [Planning]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/PlanningEvent' } } }
 *     responses:
 *       200: { description: 'Événement mis à jour' }
 */
router.put('/:id', async (req, res) => {
    try { res.json(await db.savePlanningEvent(req.body, req.params.id)); }
    catch (e) { res.status(500).json({ error: 'Failed to save event' }); }
});

/**
 * @openapi
 * /planning-events/{id}:
 *   delete:
 *     summary: Supprime un événement de planning.
 *     tags: [Planning]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Événement supprimé' }
 */
router.delete('/:id', async (req, res) => {
    try { await db.deletePlanningEvent(req.params.id); res.status(204).send(); }
    catch (e) { res.status(500).json({ error: 'Failed to delete event' }); }
});

module.exports = router;