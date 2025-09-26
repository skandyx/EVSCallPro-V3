// backend/routes/contacts.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /contacts/{id}/qualify:
 *   post:
 *     summary: Qualifie un contact après un appel.
 *     tags: [Contacts]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qualificationId: { type: string }
 *               campaignId: { type: string }
 *               agentId: { type: string }
 *     responses:
 *       200: { description: 'Contact qualifié' }
 */
router.post('/:id/qualify', async (req, res) => {
    try {
        await db.qualifyContact(req.params.id, req.body);
        res.status(200).json({ message: 'Contact qualified' });
    } catch (error) {
        console.error('Error qualifying contact:', error);
        res.status(500).json({ error: 'Failed to qualify contact' });
    }
});

/**
 * @openapi
 * /contacts/{id}/notes:
 *   post:
 *     summary: Ajoute une note à un contact.
 *     tags: [Contacts]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId: { type: string }
 *               campaignId: { type: string }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Note créée.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ContactNote' } } }
 */
router.post('/:id/notes', async (req, res) => {
    try {
        const noteData = { contactId: req.params.id, ...req.body };
        const newNote = await db.createNote(noteData);
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

module.exports = router;