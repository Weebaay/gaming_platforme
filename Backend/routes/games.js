/**
 * @file routes/games.js
 * @description
 * Fichier de routes pour la gestion des jeux.
 * Contient les endpoints permettant de :
 * - Créer un nouveau jeu.
 * - Récupérer la liste des jeux disponibles.
 * 
 * Middleware utilisés :
 * - verifyJWT : Pour protéger certaines routes par token JWT.
 * - verifyAdmin : Pour limiter l'accès à certaines routes aux administrateurs.
 * 
 * Routes :
 * - POST /api/games : Créer un nouveau jeu.
 * - GET /api/games : Récupérer tous les jeux.
 */

const express = require('express');
const router = express.Router();
const { Game } = require('../models');
const { handleDBError } = require('../db');
const { verifyJWT, verifyAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   - name: Games
 *     description: Gestion des jeux
 */


/**
 * @swagger
 * /api/games:
 *   post:
 *     summary: Créer un nouveau jeu
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Jeu créé avec succès
 *       500:
 *         description: Erreur lors de la création du jeu
 */
router.post('/games', (req, res) => {
    console.log('POST /api/games appelée');
    const gameData = req.body;
    Game.create(gameData, (err, result) => {
        if (err) {
            console.error('Erreur lors de la création du jeu:', err.message);
            return handleDBError(err, res);
        }
        console.log(`Jeu créé avec succès : ID ${result.insertId}`);
        res.status(201).json({ message: 'Jeu créé avec succès', gameId: result.insertId });
    });
});

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Récupérer tous les jeux
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Liste de tous les jeux
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 */
router.get('/games', (req, res) => {
    console.log('GET /api/games appelée');
    Game.getAll((err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des jeux:', err.message);
            return handleDBError(err, res);
        }
        res.status(200).json(results);
    });
});



module.exports = router;
