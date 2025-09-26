const express = require('express');
const router = express.Router();
const db = require('../services/db');
const asteriskRouter = require('../services/asteriskRouter');

/**
 * @openapi
 * /call/originate:
 *   post:
 *     summary: Lance un appel sortant pour un agent.
 *     tags: [Campagnes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId: { type: string }
 *               destination: { type: string }
 *     responses:
 *       200:
 *         description: Appel initié avec succès.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { callId: { type: string } } }
 *       404:
 *         description: Agent, site ou configuration PBX non trouvé.
 *       500:
 *         description: Erreur lors de l'initiation de l'appel.
 */
router.post('/originate', async (req, res) => {
    const { agentId, destination } = req.body;

    try {
        // La méthode getUserById inclut maintenant les nouveaux champs mobile
        const agent = await db.getUserById(agentId);
        if (!agent) {
            return res.status(404).json({ error: "Agent non trouvé." });
        }

        // --- NOUVELLE LOGIQUE CONDITIONNELLE ---
        const useMobile = agent.useMobileAsStation && agent.mobileNumber;

        if (useMobile) {
             // LOGIQUE "CONNECT TO PHONE" VIA MOBILE
            console.log(`[Originate] Using mobile station for agent ${agent.id} -> ${agent.mobileNumber}`);
            if (!agent.siteId) {
                return res.status(404).json({ error: "L'agent n'a pas de site configuré pour déterminer le trunk de sortie." });
            }
             // L'AMI Originate est complexe. Voici la structure de l'appel :
             // 1. On appelle le mobile de l'agent via un canal "Local".
             // 2. Quand l'agent décroche, le canal "Local" exécute une application "Dial"
             //    pour appeler le client final via le bon trunk de site.
            const callResult = await asteriskRouter.originateConnectToPhone(
                agent.mobileNumber, 
                destination, 
                agent.siteId, 
                agent.loginId, // Utilisé comme CallerID pour l'appel vers le client
                { campaignId: req.body.campaignId } // Passer des variables additionnelles
            );
            return res.json({ callId: callResult.uniqueid });

        } else {
            // --- LOGIQUE CLASSIQUE (SOFTPHONE) ---
            console.log(`[Originate] Using softphone station for agent ${agent.id} -> ${agent.extension}`);
            if (!agent.extension || !agent.siteId) {
                return res.status(404).json({ error: "L'agent n'a pas d'extension ou de site configuré." });
            }
            const callResult = await asteriskRouter.originateCall(agent.extension, destination, agent.siteId);
            return res.json({ callId: callResult.uniqueid });
        }
    } catch (error) {
        console.error('Originate call failed:', error.message);
        res.status(500).json({ error: `Erreur lors du lancement de l'appel: ${error.message}` });
    }
});

module.exports = router;