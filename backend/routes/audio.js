// backend/routes/audio.js
const express = require('express');
const router = express.Router();
const db = require('../services/db');

// In a real app, this would use 'multer' to handle file uploads.
// Since we can't add dependencies, we'll simulate by only handling metadata.

/**
 * @openapi
 * /audio-files:
 *   post:
 *     summary: Ajoute un nouveau fichier audio (métadonnées).
 *     tags: [Audio]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/AudioFile' } } }
 *     responses:
 *       201: { description: 'Fichier audio créé' }
 */
router.post('/', async (req, res) => {
    try {
        // Here, you would typically get the file from req.file (from multer)
        // and extract metadata. We'll use the body directly.
        const newFile = await db.saveAudioFile(req.body);
        res.status(201).json(newFile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save audio file' });
    }
});

/**
 * @openapi
 * /audio-files/{id}:
 *   put:
 *     summary: Met à jour les métadonnées d'un fichier audio.
 *     tags: [Audio]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/AudioFile' } } }
 *     responses:
 *       200: { description: 'Fichier audio mis à jour' }
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedFile = await db.saveAudioFile(req.body, req.params.id);
        res.json(updatedFile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save audio file' });
    }
});

/**
 * @openapi
 * /audio-files/{id}:
 *   delete:
 *     summary: Supprime un fichier audio.
 *     tags: [Audio]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string } } ]
 *     responses:
 *       204: { description: 'Fichier audio supprimé' }
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteAudioFile(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete audio file' });
    }
});

module.exports = router;