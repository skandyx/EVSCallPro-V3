// backend/routes/ivr.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /ivr-flows:
 *   post:
 *     summary: Crée un nouveau flux SVI.
 *     tags: [SVI]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/IvrFlow' } } }
 *     responses:
 *       201: { description: 'Flux créé', content: { application/json: { schema: { $ref: '#/components/schemas/IvrFlow' } } } }
 */
router.post('/', async (req, res) => {
    try {
        const newFlow = await db.saveIvrFlow(req.body);
        res.status(201).json(newFlow);
    } catch (error) { res.status(500).json({ error: 'Failed to save IVR flow' }); }
});

/**
 * @openapi
 * /ivr-flows/{id}:
 *   put:
 *     summary: Met à jour un flux SVI.
 *     tags: [SVI]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/IvrFlow' } } }
 *     responses:
 *       200: { description: 'Flux mis à jour', content: { application/json: { schema: { $ref: '#/components/schemas/IvrFlow' } } } }
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedFlow = await db.saveIvrFlow(req.body, req.params.id);
        res.json(updatedFlow);
    } catch (error) { res.status(500).json({ error: 'Failed to save IVR flow' }); }
});

/**
 * @openapi
 * /ivr-flows/{id}:
 *   delete:
 *     summary: Supprime un flux SVI.
 *     tags: [SVI]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Flux supprimé' }
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteIvrFlow(req.params.id);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Failed to delete IVR flow' }); }
});

/**
 * @openapi
 * /ivr-flows/{id}/duplicate:
 *   post:
 *     summary: Duplique un flux SVI.
 *     tags: [SVI]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       201: { description: 'Flux dupliqué', content: { application/json: { schema: { $ref: '#/components/schemas/IvrFlow' } } } }
 */
router.post('/:id/duplicate', async (req, res) => {
    try {
        const duplicatedFlow = await db.duplicateIvrFlow(req.params.id);
        res.status(201).json(duplicatedFlow);
    } catch (error) { res.status(500).json({ error: 'Failed to duplicate IVR flow' }); }
});

module.exports = router;