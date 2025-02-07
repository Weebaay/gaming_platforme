/**
 * @file sessions.js
 * @description
 * Gère les fonctionnalités liées aux sessions privées de jeu sur la plateforme :
 * - Création, rejoint et gestion des sessions de jeu.
 * - Gestion des mouvements et de l'état du jeu (Morpion).
 * - Vérification des victoires, défaites, et matchs nuls.
 * - Suivi de l'inactivité des joueurs.
 */


const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sendSSEMessage } = require('./realtime'); // Import direct depuis realtime.js
const { error } = require('console');
const { connection } = require('./db');

// Stockage en mémoire des sessions et des joueurs inactifs
const sessions = {};
let inactivePlayers = {};

/**
 * Génère un code d'invitation unique pour une session.
 * @returns {string} Code unique à 6 caractères.
 */
function generateInvitationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Suivi de l'inactivité d'un joueur.
 * Déclare un joueur perdant après 4 tours d'inactivité.
 * @param {string} playerId - ID du joueur à suivre.
 */
function trackPlayerActivity(playerId) {
    if (!inactivePlayers[playerId]) {
        inactivePlayers[playerId] = 0;
    }
    inactivePlayers[playerId]++;
    if (inactivePlayers[playerId] >= 4) {
        console.log(`Le joueur ${playerId} est déclaré perdant pour inactivité.`);
        delete inactivePlayers[playerId];
    }
}

/**
 * Vérifier si un joueur a gagné
 * @param {Array} grid - Grille actuelle de la partie.
 * @returns {string|null} Symbole du gagnant ("X" ou "O"), ou null s'il n'y a pas encore de gagnant.
 */
function checkWinner(grid) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
            return grid[a]; // Retourne le symbole gagnant ("X" ou "O")
        }
    }

    return null; // Aucun gagnant
}


// Routes pour gérer les sessions

/**
 * @swagger
 * /api/sessions/create:
 *   post:
 *     summary: Créer une session privée
 *     tags: [Sessions]
 *     responses:
 *       201:
 *         description: Session créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/sessions/create', (req, res) => {
    const sessionId = generateInvitationCode();
	const hostUsuername = "Player1";
    sessions[sessionId] = {
        players: [{symbol: "X", username: hostUsuername }], // L'hôte est le joueur X
        grid: Array(9).fill(""), // Grille de Morpion vide
        currentPlayer: "X", // Premier joueur
    };
    res.status(201).json({ sessionId, message: 'Session créée avec succès' });
});

/**
 * @swagger
 * /api/sessions/join:
 *   post:
 *     summary: Rejoindre une session privée
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session rejointe avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 players:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Session non trouvée
 *       403:
 *         description: Session complète
 */
router.post('/sessions/join', (req, res) => {
	console.log("Reçu dans /sessions/join :", req.body);

    const { sessionId, username } = req.body;
	

    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (sessions[sessionId].players.length >= 2) {
        return res.status(403).json({ error: 'Session complète' });
    }

	if (sessions[sessionId].players.some(player => player.username === username)) {
		return res.status(400).json({ success: false, error: 'Vous êtes déja dans cette session'});
	}

	// Ajouter le nouveau joueur avec le symbole "O"
    sessions[sessionId].players.push({ username: username, symbol: "O"});
	
    res.status(200).json({
		success: true,
        message: 'Session rejointe avec succès',
        sessionId,
        players: sessions[sessionId].players,
    });
});

/**
 * @swagger
 * /api/sessions/move:
 *   post:
 *     summary: Gérer un mouvement dans le jeu Morpion
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               index:
 *                 type: integer
 *               player:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mouvement enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 grid:
 *                   type: array
 *                   items:
 *                     type: string
 *                 winner:
 *                   type: string
 *                 draw:
 *                   type: boolean
 *       404:
 *         description: Session non trouvée
 *       403:
 *         description: Mouvement interdit
 */
router.post('/sessions/move', (req, res) => {
    const { sessionId, index, player } = req.body;

    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessions[sessionId];

	console.log(`Requête /sessions/move - sessionId: ${sessionId}, index: ${index}, player: ${player}`);
	console.log(`session.currentPlayer: ${session.currentPlayer}`);

    // Valider le joueur
    const isPlayerAllowed = session.players.some(p => p.symbol === player);
    if (!isPlayerAllowed) {
        return res.status(403).json({ error: 'Joueur non autorisé' });
    }

    // Vérifier si c'est au tour du joueur
    if (session.currentPlayer !== player) {
        return res.status(403).json({ error: 'Ce n\'est pas votre tour' });
    }

    // Vérifier si la case est vide
    if (session.grid[index]) {
        return res.status(403).json({ error: 'Cette case est déjà prise' });
    }

    // Mettre à jour la grille
    session.grid[index] = player;

    // Vérifier si un joueur a gagné
    const winner = checkWinner(session.grid);
    if (winner) {
        sendSSEMessage({
            sessionId,
            grid: session.grid,
            winner,
        });
        return res.status(200).json({
            message: `Le joueur ${winner} a gagné !`,
            grid: session.grid,
            winner,
        });
    }

    // Vérifier si toutes les cases sont remplies
    if (!session.grid.includes("")) {
        sendSSEMessage({
            sessionId,
            grid: session.grid,
            draw: true,
        });
        return res.status(200).json({
            message: "Match nul !",
            grid: session.grid,
            draw: true,
        });
    }

    // Passer au joueur suivant
    session.currentPlayer = player === "X" ? "O" : "X";
    sendSSEMessage({
        sessionId,
        grid: session.grid,
        currentPlayer: session.currentPlayer,
    });

    console.log(`SSE envoyé pour sessionId: ${sessionId}, grille: ${JSON.stringify(session.grid)}`);

    res.status(200).json({
        message: "Mouvement enregistré",
        grid: session.grid,
        currentPlayer: session.currentPlayer,
    });
});

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   get:
 *     summary: Récupérer les informations d'une session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Informations de la session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 players:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Session non trouvée
 */
router.get('/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session non trouvée' });
    }

    res.status(200).json({ sessionId, players: sessions[sessionId].players });
});

module.exports = { router, trackPlayerActivity };
