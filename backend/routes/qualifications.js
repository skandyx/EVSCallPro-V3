// backend/routes/qualifications.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /qualifications:
 *   post:
 *     summary: Crée une nouvelle qualification.
 *     tags: [Qualifications]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Qualification' } } }
 *     responses:
 *       201: { description: 'Qualification créée', content: { application/json: { schema: { $ref: '#/components/schemas/Qualification' } } } }
 */
router.post('/', async (req, res) => {
    try {
        const newQual = await db.saveQualification(req.body);
        res.status(201).json(newQual);
    } catch (error) { res.status(500).json({ error: 'Failed to save qualification' }); }
});

/**
 * @openapi
 * /qualifications/{id}:
 *   put:
 *     summary: Met à jour une qualification.
 *     tags: [Qualifications]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Qualification' } } }
 *     responses:
 *       200: { description: 'Qualification mise à jour', content: { application/json: { schema: { $ref: '#/components/schemas/Qualification' } } } }
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedQual = await db.saveQualification(req.body, req.params.id);
        res.json(updatedQual);
    } catch (error) { res.status(500).json({ error: 'Failed to save qualification' }); }
});

/**
 * @openapi
 * /qualifications/{id}:
 *   delete:
 *     summary: Supprime une qualification.
 *     tags: [Qualifications]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Qualification supprimée.' }
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteQualification(req.params.id);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Failed to delete qualification' }); }
});

/**
 * @openapi
 * /qualification-groups:
 *   post:
 *     summary: Crée un groupe de qualifications.
 *     tags: [Qualifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/QualificationGroup'
 *               - type: object
 *                 properties:
 *                   assignedQualIds: { type: array, items: { type: 'string' } }
 *     responses:
 *       201: { description: 'Groupe créé.' }
 */
router.post('/groups', async (req, res) => {
    try {
        const { assignedQualIds, ...group } = req.body;
        const newGroup = await db.saveQualificationGroup(group, assignedQualIds);
        res.status(201).json(newGroup);
    } catch (error) { res.status(500).json({ error: 'Failed to save group' }); }
});

/**
 * @openapi
 * /qualification-groups/{id}:
 *   put:
 *     summary: Met à jour un groupe de qualifications.
 *     tags: [Qualifications]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/QualificationGroup'
 *               - type: object
 *                 properties:
 *                   assignedQualIds: { type: array, items: { type: 'string' } }
 *     responses:
 *       200: { description: 'Groupe mis à jour.' }
 */
router.put('/groups/:id', async (req, res) => {
    try {
        const { assignedQualIds, ...group } = req.body;
        const updatedGroup = await db.saveQualificationGroup(group, assignedQualIds, req.params.id);
        res.json(updatedGroup);
    } catch (error) { res.status(500).json({ error: 'Failed to save group' }); }
});

/**
 * @openapi
 * /qualification-groups/{id}:
 *   delete:
 *     summary: Supprime un groupe de qualifications.
 *     tags: [Qualifications]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Groupe supprimé.' }
 */
router.delete('/groups/:id', async (req, res) => {
    try {
        await db.deleteQualificationGroup(req.params.id);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Failed to delete group' }); }
});

module.exports = router;