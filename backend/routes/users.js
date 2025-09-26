// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /users/bulk:
 *   post:
 *     summary: Crée plusieurs utilisateurs en masse.
 *     tags: [Utilisateurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               users:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/User' }
 *     responses:
 *       201:
 *         description: Utilisateurs créés.
 */
router.post('/bulk', async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Un tableau d\'utilisateurs est requis.' });
        }
        const createdUsers = await db.createUsersBulk(users);
        res.status(201).json(createdUsers);
    } catch (error) {
        console.error('Error creating users in bulk:', error);
        res.status(500).json({ error: error.message || 'Échec de la création des utilisateurs en masse.' });
    }
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Crée un nouvel utilisateur.
 *     tags: [Utilisateurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupIds: { type: array, items: { type: 'string' } }
 *               user: { $ref: '#/components/schemas/User' }
 *     responses:
 *       201:
 *         description: Utilisateur créé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 */
router.post('/', async (req, res) => {
    try {
        // Simplification : on passe le corps de la requête directement à la fonction de la base de données.
        const newUser = await db.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Met à jour un utilisateur existant.
 *     tags: [Utilisateurs]
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
 *             type: object
 *             properties:
 *               groupIds: { type: array, items: { type: 'string' } }
 *               user: { $ref: '#/components/schemas/User' }
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 */
router.put('/:id', async (req, res) => {
    try {
        // Simplification : on passe le corps de la requête directement à la fonction de la base de données.
        const updatedUser = await db.updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Utilisateur supprimé.
 */
router.delete('/:id', async (req, res) => {
    try {
        // SECURITY FIX: Add server-side validation before deleting.
        const user = await db.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        if (user.isActive) {
            return res.status(400).json({ error: 'Impossible de supprimer un utilisateur actif. Veuillez le désactiver d\'abord.' });
        }
        
        await db.deleteUser(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;