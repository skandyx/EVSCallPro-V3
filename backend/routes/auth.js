const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const authMiddleware = require('../middleware/auth.middleware');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authentifie un utilisateur et retourne des tokens JWT.
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginId: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { type: object }
 *                 accessToken: { type: string }
 *       401:
 *         description: Identifiants invalides ou utilisateur inactif.
 */
router.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const user = await db.authenticateUser(loginId, password);
        if (!user) {
            return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
        }
        if (!user.isActive) {
            return res.status(401).json({ error: "Ce compte utilisateur est désactivé." });
        }

        const userPayload = { id: user.id, role: user.role };
        const accessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        const refreshToken = jwt.sign(userPayload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
            signed: true, // This ensures the cookie is signed
        });

        // Ne pas renvoyer le hash du mot de passe
        const { passwordHash, ...userToSend } = user;
        res.json({ user: userToSend, accessToken });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rafraîchit un access token en utilisant un refresh token.
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Nouveau access token généré.
 *       401:
 *         description: Refresh token invalide ou expiré.
 */
router.post('/refresh', (req, res) => {
    // Read the signed cookie instead of the regular one
    const refreshToken = req.signedCookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token manquant.' });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Refresh token invalide.' });
        }
        const userPayload = { id: user.id, role: user.role };
        const newAccessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
        res.json({ accessToken: newAccessToken });
    });
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Déconnecte l'utilisateur en effaçant le refresh token.
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Déconnexion réussie.
 */
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({ message: 'Déconnexion réussie.' });
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Récupère les informations de l'utilisateur actuellement authentifié.
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de l'utilisateur.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Non authentifié.
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});


module.exports = router;