/**
 * @file routes/gameSessions.js
 * @description Routes pour gérer les sessions de jeu et enregistrer les résultats dans la base de données.
 */

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const { connection } = require('../db');

/**
 * @swagger
 * /api/game-sessions:
 *   post:
 *     summary: Enregistrer une session de jeu
 *     tags: [GameSessions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               game_name:
 *                 type: string
 *               player1_id:
 *                 type: integer
 *               player2_id:
 *                 type: integer
 *               winner_id:
 *                 type: integer
 *               result:
 *                 type: string
 *               session_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session de jeu enregistrée avec succès
 *       400:
 *         description: Erreur de validation des données
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', verifyJWT, async (req, res) => {
	console.log("Requête POST à /api/game-sessions")
    const { game_name, player1_id, player2_id, winner_id, result, session_id } = req.body;
	const userId = req.user.userId; // Récupérer l'ID utilisateur à partir du JWT
    console.log("USER ID :",userId);

    // Validation des données requises
    if (!game_name || typeof player1_id !== 'number' || !result || !session_id) {
        return res.status(400).json({ error: 'Données manquantes ou invalides.' });
    }

    const query = `
        INSERT INTO game_sessions (game_name, player1_id, player2_id, winner_id, result, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [game_name, player1_id, player2_id || null, winner_id || null, result, session_id];

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'enregistrement de la session de jeu :', err.message);
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
		console.log("Params :", params);
        res.status(201).json({
            message: 'Session de jeu enregistrée avec succès.',
            gameSessionId: results.insertId,
        });
    });
});

/**
 * @swagger
 * /api/game-sessions:
 *   get:
 *     summary: Récupérer toutes les sessions de jeu
 *     tags: [GameSessions]
 *     responses:
 *       200:
 *         description: Liste des sessions de jeu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   game_name:
 *                     type: string
 *                   player1_id:
 *                     type: integer
 *                   player2_id:
 *                     type: integer
 *                   winner_id:
 *                     type: integer
 *                   result:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', verifyJWT, (req, res) => {
    const query = `SELECT * FROM game_sessions`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des sessions de jeu :', err.message);
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
        res.status(200).json(results);
    });
});

module.exports = router;
