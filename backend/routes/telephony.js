// backend/routes/telephony.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /trunks:
 *   post:
 *     summary: Crée un nouveau Trunk SIP.
 *     tags: [Téléphonie]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Trunk' } } }
 *     responses:
 *       201: { description: 'Trunk créé' }
 */
router.post('/trunks', async (req, res) => {
    try { res.status(201).json(await db.saveTrunk(req.body)); }
    catch (e) { res.status(500).json({ error: 'Failed to save trunk' }); }
});

/**
 * @openapi
 * /trunks/{id}:
 *   put:
 *     summary: Met à jour un Trunk SIP.
 *     tags: [Téléphonie]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Trunk' } } }
 *     responses:
 *       200: { description: 'Trunk mis à jour' }
 */
router.put('/trunks/:id', async (req, res) => {
    try { res.json(await db.saveTrunk(req.body, req.params.id)); }
    catch (e) { res.status(500).json({ error: 'Failed to save trunk' }); }
});

/**
 * @openapi
 * /trunks/{id}:
 *   delete:
 *     summary: Supprime un Trunk SIP.
 *     tags: [Téléphonie]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Trunk supprimé' }
 */
router.delete('/trunks/:id', async (req, res) => {
    try { await db.deleteTrunk(req.params.id); res.status(204).send(); }
    catch (e) { res.status(500).json({ error: 'Failed to delete trunk' }); }
});

/**
 * @openapi
 * /dids:
 *   post:
 *     summary: Crée un nouveau numéro SDA/DID.
 *     tags: [Téléphonie]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Did' } } }
 *     responses:
 *       201: { description: 'DID créé' }
 */
router.post('/dids', async (req, res) => {
    try { res.status(201).json(await db.saveDid(req.body)); }
    catch (e) { res.status(500).json({ error: 'Failed to save DID' }); }
});

/**
 * @openapi
 * /dids/{id}:
 *   put:
 *     summary: Met à jour un numéro SDA/DID.
 *     tags: [Téléphonie]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Did' } } }
 *     responses:
 *       200: { description: 'DID mis à jour' }
 */
router.put('/dids/:id', async (req, res) => {
    try { res.json(await db.saveDid(req.body, req.params.id)); }
    catch (e) { res.status(500).json({ error: 'Failed to save DID' }); }
});

/**
 * @openapi
 * /dids/{id}:
 *   delete:
 *     summary: Supprime un numéro SDA/DID.
 *     tags: [Téléphonie]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'DID supprimé' }
 */
router.delete('/dids/:id', async (req, res) => {
    try { await db.deleteDid(req.params.id); res.status(204).send(); }
    catch (e) { res.status(500).json({ error: 'Failed to delete DID' }); }
});

module.exports = router;