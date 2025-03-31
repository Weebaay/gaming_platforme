const express = require('express');
const router = express.Router();
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Récupère le classement des joueurs avec les statistiques par jeu
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Classement des joueurs avec les statistiques par jeu
 *       500:
 *         description: Erreur serveur
 */
router.get('/', (req, res) => {
    const query = `
        SELECT 
            u.id AS user_id,
            u.username,
            SUM(CASE WHEN gs.game_name = 'Morpion' AND gs.winner_id = u.id THEN 1 ELSE 0 END) AS morpion_victoires,
            SUM(CASE WHEN gs.game_name = 'Morpion' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'égalité' THEN 1 ELSE 0 END) AS morpion_egalites,
            SUM(CASE WHEN gs.game_name = 'Morpion' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'défaite' AND gs.winner_id IS NULL THEN 1 ELSE 0 END) AS morpion_defaites,
            SUM(CASE WHEN gs.game_name = 'PierreFeuilleCiseaux' AND gs.winner_id = u.id THEN 1 ELSE 0 END) AS pfc_victoires,
            SUM(CASE WHEN gs.game_name = 'PierreFeuilleCiseaux' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'égalité' THEN 1 ELSE 0 END) AS pfc_egalites,
            SUM(CASE WHEN gs.game_name = 'PierreFeuilleCiseaux' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'défaite' THEN 1 ELSE 0 END) AS pfc_defaites,
            SUM(CASE WHEN gs.game_name = 'JeuDesDes' AND gs.winner_id = u.id THEN 1 ELSE 0 END) AS des_victoires,
            SUM(CASE WHEN gs.game_name = 'JeuDesDes' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'égalité' THEN 1 ELSE 0 END) AS des_egalites,
            SUM(CASE WHEN gs.game_name = 'JeuDesDes' AND (gs.player1_id = u.id OR gs.player2_id = u.id) AND gs.result = 'défaite' THEN 1 ELSE 0 END) AS des_defaites,
            u.victoires,
            u.defaites,
            u.egalites
        FROM users u
        LEFT JOIN game_sessions gs ON u.id IN (gs.player1_id, gs.player2_id)
        GROUP BY u.id, u.username
        ORDER BY u.victoires DESC;
    `;

    connection.query(query, (err, results) => {
        if (err) return handleDBError(err, res);
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/leaderboard/multiplayer:
 *   get:
 *     summary: Récupère le classement multijoueur
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: game_name
 *         schema:
 *           type: string
 *         description: Filtrer par nom de jeu
 *     responses:
 *       200:
 *         description: Classement multijoueur
 *       500:
 *         description: Erreur serveur
 */
router.get('/multiplayer', (req, res) => {
    const gameName = req.query.game_name;
    console.log(`Requête GET /api/leaderboard/multiplayer reçue (filtre jeu: ${gameName || 'aucun'})`);
    
    const query = `
        SELECT 
            u.id AS user_id,
            u.username,
            ms.matches_played,
            ms.victories,
            ms.defeats,
            ms.draws,
            ms.points,
             -- Calculer le win_rate, éviter division par zéro
            CASE 
                WHEN (ms.victories + ms.defeats) = 0 THEN 0
                ELSE ROUND((ms.victories / (ms.victories + ms.defeats)) * 100, 2) 
            END AS win_rate
        FROM multiplayer_stats ms
        JOIN users u ON ms.player_id = u.id
        ${gameName ? 'WHERE ms.game_name = ?' : ''}
        ORDER BY ms.points DESC, ms.victories DESC;
    `;

    const queryParams = [];
    if (gameName) {
        queryParams.push(gameName);
    }

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Erreur SQL leaderboard multijoueur:", err);
            return handleDBError(err, res);
        }
        
        // Ajouter le rang
        const rankedResults = results.map((player, index) => ({
            ...player,
            rank: index + 1
        }));
        
        console.log(`Envoi de ${rankedResults.length} résultats pour le leaderboard multijoueur.`);
        res.status(200).json(rankedResults);
    });
});

module.exports = router;