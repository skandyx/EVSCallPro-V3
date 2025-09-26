// backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * @openapi
 * /campaigns:
 *   post:
 *     summary: Crée une nouvelle campagne.
 *     tags: [Campagnes]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Campaign' } } }
 *     responses:
 *       201: { description: 'Campagne créée', content: { application/json: { schema: { $ref: '#/components/schemas/Campaign' } } } }
 */
router.post('/', async (req, res) => {
    try {
        const newCampaign = await db.saveCampaign(req.body);
        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

/**
 * @openapi
 * /campaigns/{id}:
 *   put:
 *     summary: Met à jour une campagne.
 *     tags: [Campagnes]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/Campaign' } } }
 *     responses:
 *       200: { description: 'Campagne mise à jour', content: { application/json: { schema: { $ref: '#/components/schemas/Campaign' } } } }
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedCampaign = await db.saveCampaign(req.body, req.params.id);
        res.json(updatedCampaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

/**
 * @openapi
 * /campaigns/{id}:
 *   delete:
 *     summary: Supprime une campagne.
 *     tags: [Campagnes]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Campagne supprimée' }
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteCampaign(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

/**
 * @openapi
 * /campaigns/{id}/contacts:
 *   post:
 *     summary: Importe des contacts dans une campagne.
 *     tags: [Campagnes]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contacts: { type: array, items: { $ref: '#/components/schemas/Contact' } }
 *               deduplicationConfig: { type: object }
 *     responses:
 *       201: { description: 'Contacts importés' }
 */
router.post('/:id/contacts', async (req, res) => {
    try {
        const { contacts, deduplicationConfig } = req.body;
        await db.importContacts(req.params.id, contacts, deduplicationConfig);
        res.status(201).json({ message: 'Contacts imported successfully' });
    } catch (error) {
        console.error('Error importing contacts:', error);
        res.status(500).json({ error: 'Failed to import contacts' });
    }
});

/**
 * @openapi
 * /campaigns/next-contact:
 *   post:
 *     summary: Récupère le prochain contact disponible pour un agent.
 *     tags: [Campagnes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId: { type: string }
 *     responses:
 *       200:
 *         description: Contact et campagne retournés.
 */
router.post('/next-contact', async (req, res) => {
    try {
        const { agentId } = req.body;
        const result = await db.getNextContactForCampaign(agentId);
        res.json(result);
    } catch (error) {
        console.error('Error getting next contact:', error);
        res.status(500).json({ error: 'Failed to get next contact' });
    }
});

module.exports = router;