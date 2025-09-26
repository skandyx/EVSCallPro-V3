// backend/routes/groups.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /user-groups:
 *   post:
 *     summary: Crée un nouveau groupe d'utilisateurs.
 *     tags: [Groupes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserGroup'
 *     responses:
 *       201:
 *         description: Groupe créé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/UserGroup' } } }
 */
router.post('/', async (req, res) => {
    try {
        const group = req.body;
        const newGroup = await db.saveUserGroup(group);
        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

/**
 * @openapi
 * /user-groups/{id}:
 *   put:
 *     summary: Met à jour un groupe d'utilisateurs.
 *     tags: [Groupes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserGroup'
 *     responses:
 *       200:
 *         description: Groupe mis à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/UserGroup' } } }
 */
router.put('/:id', async (req, res) => {
    try {
        const group = req.body;
        const updatedGroup = await db.saveUserGroup(group, req.params.id);
        res.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

/**
 * @openapi
 * /user-groups/{id}:
 *   delete:
 *     summary: Supprime un groupe d'utilisateurs.
 *     tags: [Groupes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Groupe supprimé.
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteUserGroup(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

module.exports = router;