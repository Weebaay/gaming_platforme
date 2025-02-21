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

module.exports = router;