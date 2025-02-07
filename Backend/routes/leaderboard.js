const express = require('express');
const router = express.Router();
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Récupère le classement des joueurs
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Classement des joueurs
 *       500:
 *         description: Erreur serveur
 */
router.get('/', (req, res) => {
    const query = `
      SELECT 
          users.id AS user_id,
          users.username,
          COUNT(CASE WHEN game_sessions.winner_id = users.id THEN 1 END) AS victories,
          COUNT(CASE WHEN game_sessions.result = 'égalité' THEN 1 END) AS draws,
          COUNT(CASE WHEN game_sessions.winner_id != users.id AND game_sessions.winner_id IS NOT NULL THEN 1 END) AS defeats,
          COUNT(game_sessions.id) AS total,
          GROUP_CONCAT(DISTINCT game_sessions.session_id) AS session_ids,
          GROUP_CONCAT(DISTINCT game_sessions.game_name) AS game_names
       FROM users
        LEFT JOIN game_sessions ON users.id IN (game_sessions.player1_id, game_sessions.player2_id)
        GROUP BY users.id
        ORDER BY victories DESC;
    `;

    connection.query(query, (err, results) => {
        if (err) return handleDBError(err, res);
        res.status(200).json(results);
    });
});

module.exports = router;