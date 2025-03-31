const express = require('express');
const router = express.Router();
const { verifyJWT, verifyAdmin } = require('../middlewares/auth');
const { connection, handleDBError } = require('../db');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Routes d'administration
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Récupère la liste de tous les utilisateurs
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       500:
 *         description: Erreur serveur
 */
// Route pour obtenir la liste des utilisateurs
router.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    connection.query('SELECT id, username, email FROM users', (err, users) => {
      if (err) return handleDBError(err, res);
      res.json(users);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
});

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Récupère les statistiques des joueurs et des jeux
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       500:
 *         description: Erreur serveur
 */
// Route pour obtenir les statistiques
router.get('/stats', verifyJWT, verifyAdmin, (req, res) => {
  // Récupérer les utilisateurs
  connection.query('SELECT id, username, email, role FROM users LIMIT 10', (err, users) => {
    if (err) return handleDBError(err, res);
    
    // Compter le nombre total d'utilisateurs
    connection.query('SELECT COUNT(*) as count FROM users', (err, countResult) => {
      if (err) return handleDBError(err, res);
      
      const usersCount = countResult[0] ? countResult[0].count : 0;
      
      res.json({ 
        recentUsers: users,
        usersCount: usersCount,
        systemInfo: {
          serverTime: new Date().toISOString(),
          uptime: process.uptime() + " secondes"
        }
      });
    });
  });
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/users/:id', verifyJWT, verifyAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Vérifier si l'utilisateur existe
  connection.query('SELECT id FROM users WHERE id = ?', [userId], (err, userCheck) => {
    if (err) return handleDBError(err, res);
    
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    connection.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
      if (err) return handleDBError(err, res);
      
      console.log(`[INFO] Utilisateur ${userId} supprimé par l'administrateur ${req.user.username}`);
      res.json({ message: 'Utilisateur supprimé avec succès' });
    });
  });
});

module.exports = router; 