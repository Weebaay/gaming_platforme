/**
 * @file routes/multiplayerLeaderboard.js
 * @description Routes pour gérer le classement des joueurs en mode multijoueur.
 */

const express = require('express');
const router = express.Router();
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * /api/leaderboard/multiplayer:
 *   get:
 *     summary: Récupérer le classement multijoueur global ou par jeu
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: game_name
 *         schema:
 *           type: string
 *         description: Filtrer par jeu spécifique
 *     responses:
 *       200:
 *         description: Classement des joueurs en mode multijoueur
 *       500:
 *         description: Erreur serveur
 */
router.get('/', (req, res) => {
    const gameName = req.query.game_name;
    
    let query;
    let queryParams = [];
    
    if (gameName) {
        // Classement pour un jeu spécifique
        query = `
            SELECT 
                ms.player_id AS user_id,
                u.username,
                ms.game_name,
                ms.matches_played,
                ms.victories,
                ms.draws,
                ms.defeats,
                ms.points,
                ms.last_match_date,
                ROUND((ms.victories / NULLIF(ms.matches_played, 0)) * 100, 2) AS win_rate
            FROM multiplayer_stats ms
            JOIN users u ON ms.player_id = u.id
            WHERE ms.game_name = ?
            ORDER BY ms.points DESC, ms.victories DESC
        `;
        queryParams.push(gameName);
    } else {
        // Classement global tous jeux confondus
        query = `
            SELECT 
                ms.player_id AS user_id,
                u.username,
                SUM(ms.matches_played) AS matches_played,
                SUM(ms.victories) AS victories,
                SUM(ms.draws) AS draws,
                SUM(ms.defeats) AS defeats,
                SUM(ms.points) AS points,
                MAX(ms.last_match_date) AS last_match_date,
                ROUND((SUM(ms.victories) / NULLIF(SUM(ms.matches_played), 0)) * 100, 2) AS win_rate,
                GROUP_CONCAT(DISTINCT ms.game_name) AS games_played
            FROM multiplayer_stats ms
            JOIN users u ON ms.player_id = u.id
            GROUP BY ms.player_id, u.username
            ORDER BY points DESC, victories DESC
        `;
    }
    
    connection.query(query, queryParams, (err, results) => {
        if (err) return handleDBError(err, res);
        
        // Ajouter le rang pour tous les cas
        results = results.map((player, index) => {
            player.rank = index + 1;
            return player;
        });
        
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/leaderboard/multiplayer/best-performers:
 *   get:
 *     summary: Récupérer les meilleurs joueurs par différentes métriques
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Meilleurs joueurs par différentes métriques
 *       500:
 *         description: Erreur serveur
 */
router.get('/best-performers', (req, res) => {
    const query = `
        WITH total_stats AS (
            SELECT 
                player_id,
                SUM(matches_played) AS total_matches,
                SUM(victories) AS total_victories,
                SUM(defeats) AS total_defeats,
                SUM(draws) AS total_draws,
                SUM(points) AS total_points
            FROM multiplayer_stats
            GROUP BY player_id
        )
        SELECT 
            u.id AS user_id,
            u.username,
            ts.total_matches,
            ts.total_victories,
            ts.total_defeats,
            ts.total_draws,
            ts.total_points,
            ROUND((ts.total_victories / NULLIF(ts.total_matches, 0)) * 100, 2) AS win_rate
        FROM total_stats ts
        JOIN users u ON ts.player_id = u.id
        ORDER BY ts.total_points DESC, win_rate DESC
        LIMIT 10
    `;
    
    connection.query(query, (err, results) => {
        if (err) return handleDBError(err, res);
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/leaderboard/multiplayer/game-stats:
 *   get:
 *     summary: Récupérer les statistiques par jeu
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Statistiques par jeu
 *       500:
 *         description: Erreur serveur
 */
router.get('/game-stats', (req, res) => {
    const query = `
        SELECT 
            game_name,
            COUNT(*) AS total_matches,
            SUM(CASE WHEN result = 'victoire' THEN 1 ELSE 0 END) AS total_victories,
            SUM(CASE WHEN result = 'égalité' THEN 1 ELSE 0 END) AS total_draws,
            SUM(CASE WHEN result = 'défaite' THEN 1 ELSE 0 END) AS total_defeats,
            COUNT(DISTINCT player1_id) + COUNT(DISTINCT player2_id) AS unique_players
        FROM multiplayer_matches
        GROUP BY game_name
    `;
    
    connection.query(query, (err, results) => {
        if (err) return handleDBError(err, res);
        res.status(200).json(results);
    });
});

module.exports = router; 