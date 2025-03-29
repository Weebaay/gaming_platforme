/**
 * @file routes/multiplayerMatches.js
 * @description Routes pour gérer les parties multijoueur et les statistiques associées.
 */

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * /api/multiplayer/matches:
 *   post:
 *     summary: Enregistrer une partie multijoueur
 *     tags: [Multiplayer]
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
 *         description: Partie multijoueur enregistrée avec succès
 *       400:
 *         description: Erreur de validation des données
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/matches', verifyJWT, async (req, res) => {
    console.log("Requête POST à /api/multiplayer/matches");
    const { game_name, player1_id, player2_id, winner_id, result, session_id } = req.body;
    const userId = req.user.userId;
    
    // Validation des données requises - pour une partie multijoueur, on vérifie que player2_id est présent
    if (!game_name || typeof player1_id !== 'number' || typeof player2_id !== 'number' || !result || !session_id) {
        return res.status(400).json({ error: 'Données manquantes ou invalides pour une partie multijoueur.' });
    }

    // Vérification que l'utilisateur est bien l'un des joueurs par sécurité
    if (userId !== player1_id && userId !== player2_id) {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à enregistrer cette partie.' });
    }

    // 1. Insérer la partie dans la table multiplayer_matches
    const insertQuery = `
        INSERT INTO multiplayer_matches (game_name, player1_id, player2_id, winner_id, result, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [game_name, player1_id, player2_id, winner_id || null, result, session_id];

    connection.query(insertQuery, params, (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'enregistrement de la partie multijoueur :', err.message);
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }

        console.log("Partie multijoueur enregistrée, matchId:", results.insertId);
        
        // 2. Mettre à jour les statistiques de multijoueur en appelant la procédure stockée
        const updateStatsQuery = `CALL update_multiplayer_stats(?, ?, ?, ?, ?)`;
        const updateParams = [game_name, player1_id, player2_id, winner_id || null, result];
        
        connection.query(updateStatsQuery, updateParams, (statsErr) => {
            if (statsErr) {
                console.error('Erreur lors de la mise à jour des statistiques multijoueur :', statsErr.message);
                // On continue même en cas d'erreur de stats
            }
            
            res.status(201).json({
                message: 'Partie multijoueur enregistrée avec succès.',
                matchId: results.insertId
            });
        });
    });
});

/**
 * @swagger
 * /api/multiplayer/matches:
 *   get:
 *     summary: Récupérer l'historique des parties multijoueur
 *     tags: [Multiplayer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: player_id
 *         schema:
 *           type: integer
 *         description: Filtrer par joueur
 *       - in: query
 *         name: game_name
 *         schema:
 *           type: string
 *         description: Filtrer par jeu
 *     responses:
 *       200:
 *         description: Liste des parties multijoueur
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/matches', verifyJWT, (req, res) => {
    const { player_id, game_name } = req.query;
    let query = `
        SELECT 
            mm.*,
            p1.username AS player1_username,
            p2.username AS player2_username,
            winner.username AS winner_username
        FROM multiplayer_matches mm
        JOIN users p1 ON mm.player1_id = p1.id
        JOIN users p2 ON mm.player2_id = p2.id
        LEFT JOIN users winner ON mm.winner_id = winner.id
    `;

    const queryParams = [];
    const conditions = [];

    if (player_id) {
        conditions.push("(mm.player1_id = ? OR mm.player2_id = ?)");
        queryParams.push(player_id, player_id);
    }

    if (game_name) {
        conditions.push("mm.game_name = ?");
        queryParams.push(game_name);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY mm.created_at DESC LIMIT 100";

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des parties multijoueur :', err.message);
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/multiplayer/stats/{playerId}:
 *   get:
 *     summary: Récupérer les statistiques multijoueur d'un joueur
 *     tags: [Multiplayer]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques du joueur
 *       404:
 *         description: Joueur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/stats/:playerId', (req, res) => {
    const playerId = req.params.playerId;
    
    const query = `
        SELECT 
            ms.*,
            u.username
        FROM multiplayer_stats ms
        JOIN users u ON ms.player_id = u.id
        WHERE ms.player_id = ?
    `;
    
    connection.query(query, [playerId], (err, results) => {
        if (err) return handleDBError(err, res);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Aucune statistique trouvée pour ce joueur.' });
        }
        
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/multiplayer/rivalries/{playerId}:
 *   get:
 *     summary: Récupérer les rivalités d'un joueur
 *     tags: [Multiplayer]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: game_name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des rivalités du joueur
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/rivalries/:playerId', (req, res) => {
    const playerId = req.params.playerId;
    const gameName = req.query.game_name;
    
    let query = `
        SELECT 
            pr.*,
            u.username AS opponent_username
        FROM player_rivalries pr
        JOIN users u ON pr.opponent_id = u.id
        WHERE pr.player_id = ?
    `;
    
    const queryParams = [playerId];
    
    if (gameName) {
        query += ` AND pr.game_name = ?`;
        queryParams.push(gameName);
    }
    
    query += ` ORDER BY pr.matches_played DESC`;
    
    connection.query(query, queryParams, (err, results) => {
        if (err) return handleDBError(err, res);
        res.status(200).json(results);
    });
});

module.exports = router; 