/**
 * @file routes/progress.js
 * @description
 * Ce fichier contient les routes API pour la gestion de la progression des joueurs.
 * Il permet de sauvegarder et de récupérer la progression des joueurs pour chaque jeu.
 * Les routes sont protégées par le middleware `verifyJWT` pour garantir que seuls les utilisateurs authentifiés peuvent accéder à ces données.
 */

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * tags:
 *   - name: Progression
 *     description: Gestion de la progression des joueurs
 */

/**
 * @swagger
 * /api/progress/save:
 *   post:
 *     summary: Sauvegarde la progression d'un joueur
 *     tags: [Progression]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               game_id:
 *                 type: integer
 *                 description: ID du jeu
 *               progress_data:
 *                 type: object
 *                 description: Données de progression au format JSON
 *     responses:
 *       200:
 *         description: Progression sauvegardée avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/save', verifyJWT, async (req, res) => {
  const { game_id, progress_data } = req.body;
  const user_id = req.user.userId; // Récupère l'ID de l'utilisateur depuis le token JWT

  if (!game_id || !progress_data) {
    return res.status(400).json({ error: 'Données manquantes ou invalides' });
  }

  const query = 'INSERT INTO player_progress (user_id, game_id, progress_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE progress_data = ?';
  const values = [user_id, game_id, JSON.stringify(progress_data), JSON.stringify(progress_data)]; // Convertit l'objet JSON en chaîne

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde de la progression :', err);
      return handleDBError(err, res);
    }
    res.status(200).json({ message: 'Progression sauvegardée avec succès' });
  });
});

/**
 * @swagger
 * /api/progress/get:
 *   get:
 *     summary: Récupère la progression d'un joueur pour un jeu spécifique
 *     tags: [Progression]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du jeu
 *     responses:
 *       200:
 *         description: Progression récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress_data:
 *                   type: object
 *                   description: Données de progression au format JSON
 *       400:
 *         description: ID du jeu manquant
 *       404:
 *         description: Progression non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/get', verifyJWT, async (req, res) => {
  const game_id = req.query.game_id;
  const user_id = req.user.userId; // Récupère l'ID de l'utilisateur depuis le token JWT

  if (!game_id) {
    return res.status(400).json({ error: 'ID du jeu manquant' });
  }

  const query = 'SELECT progress_data FROM player_progress WHERE user_id = ? AND game_id = ?';
  const values = [user_id, game_id];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de la progression :', err);
      return handleDBError(err, res);
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Progression non trouvée' });
    }

    try {
      const progress_data = JSON.parse(results[0].progress_data); // Convertit la chaîne JSON en objet
      res.status(200).json({ progress_data });
    } catch (error) {
      console.error('Erreur lors de l\'analyse des données JSON :', error);
      return res.status(500).json({ error: 'Erreur serveur interne' });
    }
  });
});

module.exports = router;