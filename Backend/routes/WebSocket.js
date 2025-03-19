/**
 * @file backend/routes/websocket.js
 * @description Gestion complète des WebSockets pour la plateforme de jeux.
 */

const { Server } = require("socket.io");

// Stockage en mémoire des sessions de jeu (comme dans le server.js original)
const gameSessions = {};

/**
 * Génère un code d'invitation unique pour une session.
 * @returns {string} Code unique à 6 caractères.
 */
function generateInvitationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Vérifier si un joueur a gagné au Morpion
 * @param {Array} grid - Grille actuelle de la partie de Morpion.
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

module.exports = function configureWebSockets(server) {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {

        socket.on("disconnect", () => {
             // Supprimer le joueur de toutes les sessions (simple iteration)
            for (const sessionId in gameSessions) {
                if (gameSessions.hasOwnProperty(sessionId)) {
                    gameSessions[sessionId].players = gameSessions[sessionId].players.filter(
                        (player) => player.socketId !== socket.id
                    );
                  //Supprimer les session vide
                  if (gameSessions[sessionId].players.length === 0 ) {
                    delete gameSessions[sessionId]
                  }
                }
            }
        });

        // Morpion
        socket.on('createSession', (callback) => {
            const sessionId = generateInvitationCode();
            gameSessions[sessionId] = {
                players: [{ socketId: socket.id, symbol: "X" }],
                grid: Array(9).fill(""),
                currentPlayer: "X",
            };
            console.log(`Session de Morpion créée avec l'ID : ${sessionId}`);
            socket.join(sessionId);
            callback(sessionId);
        });

        socket.on('joinSession', (sessionId, callback) => {
            if (!gameSessions[sessionId]) {
                callback({ success: false, message: 'Session non trouvée' });
                return;
            }
            if (gameSessions[sessionId].players.length >= 2) {
                callback({ success: false, message: 'Session complète' });
                return;
            }
            gameSessions[sessionId].players.push({ socketId: socket.id, symbol: "O" });
            socket.join(sessionId);
            console.log(`Le joueur ${socket.id} a rejoint la session de Morpion ${sessionId}`);
            io.to(sessionId).emit('sessionJoined', { players: gameSessions[sessionId].players.length });
            callback({ success: true });
        });

        socket.on('makeMove', (data, callback) => {
            const { sessionId, index, player } = data;
            if (!gameSessions[sessionId]) {
                callback({ error: 'Session non trouvée' });
                return;
            }
            
            const session = gameSessions[sessionId];
            
            // Vérifier si c'est bien le tour du joueur
            if (session.currentPlayer !== player) {
                callback({ error: 'Ce n\'est pas votre tour' });
                return;
            }
            
            // Vérifier si le joueur est bien celui qu'il prétend être
            const playerInSession = session.players.find(p => p.socketId === socket.id && p.symbol === player);
            if (!playerInSession) {
                callback({ error: 'Joueur non autorisé' });
                return;
            }
            
            // Vérifier si la case est libre
            if (session.grid[index]) {
                callback({ error: 'Case déjà occupée' });
                return;
            }
            
            // Effectuer le coup
            session.grid[index] = player;
            const winner = checkWinner(session.grid);
            
            // Envoyer la mise à jour à tous les joueurs
            if (winner) {
                io.to(sessionId).emit('updateGame', { 
                    grid: session.grid, 
                    winner,
                    currentPlayer: session.currentPlayer
                });
            } else if (!session.grid.includes("")) {
                io.to(sessionId).emit('updateGame', { 
                    grid: session.grid, 
                    draw: true,
                    currentPlayer: session.currentPlayer
                });
            } else {
                session.currentPlayer = player === "X" ? "O" : "X";
                io.to(sessionId).emit('updateGame', { 
                    grid: session.grid, 
                    currentPlayer: session.currentPlayer
                });
            }
            
            callback({ success: true });
        });

        // Jeu des Dés
        socket.on('createDiceSession', (callback) => {
            const sessionId = generateInvitationCode();
            gameSessions[sessionId] = {
                players: [{ socketId: socket.id, symbol: "X" }],
                scores: { player1: 0, player2: 0 },
                currentPlayer: "X",
                rolls: { player1: null, player2: null },
            };
            console.log(`Session de dés créée avec l'ID : ${sessionId}`);
            socket.join(sessionId);
            callback(sessionId);
        });

        socket.on('joinDiceSession', (sessionId, callback) => {
            if (!gameSessions[sessionId]) {
                callback({ success: false, message: 'Session non trouvée' });
                return;
            }
            if (gameSessions[sessionId].players.length >= 2) {
                callback({ success: false, message: 'Session complète' });
                return;
            }
            gameSessions[sessionId].players.push({ socketId: socket.id, symbol: "O" });
            socket.join(sessionId);
            console.log(`Le joueur ${socket.id} a rejoint la session de dés ${sessionId}`);
            io.to(sessionId).emit('diceSessionJoined', { players: gameSessions[sessionId].players.length });
            callback({ success: true });
        });

        socket.on('rollDice', (data) => {
            const { sessionId, player } = data;
            if (!gameSessions[sessionId]) return;
            const session = gameSessions[sessionId];
            if (session.currentPlayer !== player) return;

            const roll = Math.floor(Math.random() * 6) + 1;
            if (player === "X") {
                session.rolls.player1 = roll;
            } else {
                session.rolls.player2 = roll;
            }

            const otherPlayerRoll = player === "X" ? session.rolls.player2 : session.rolls.player1;
            const bothRolled = otherPlayerRoll !== null;

            if (bothRolled) {
                const winner = session.rolls.player1 === session.rolls.player2 ? "draw" : session.rolls.player1 > session.rolls.player2 ? "X" : "O";
                if (winner !== "draw") {
                    session.scores[winner === "X" ? "player1" : "player2"]++; // Correction ici
                }

                io.to(sessionId).emit('updateDiceGame', { rolls: session.rolls, scores: session.scores, currentPlayer: null, winner });

                setTimeout(() => {
                    session.rolls = { player1: null, player2: null };
                    session.currentPlayer = "X";
                    io.to(sessionId).emit('updateDiceGame', { rolls: session.rolls, scores: session.scores, currentPlayer: "X" });
                }, 3000);
            } else {
                session.currentPlayer = player === "X" ? "O" : "X";
                io.to(sessionId).emit('updateDiceGame', { scores: session.scores, currentPlayer: session.currentPlayer, rolls: session.rolls });
            }
        });

        // Pierre-Feuille-Ciseaux
        socket.on('createRPSession', (callback) => {
            const sessionId = generateInvitationCode();
            gameSessions[sessionId] = {
                players: [{ socketId: socket.id, symbol: "X" }],
                choices: { player1: null, player2: null },
                currentPlayer: "X",
                gameState: "waitingForPlayer2", // États possibles: waitingForPlayer2, player1Turn, player2Turn, complete
            };
            console.log(`Session de Pierre-Feuille-Ciseaux créée avec l'ID : ${sessionId}`);
            socket.join(sessionId);
            callback(sessionId);
        });

        socket.on('joinRPSession', (sessionId, callback) => {
            if (!gameSessions[sessionId]) {
                callback({ success: false, message: 'Session non trouvée' });
                return;
            }
            if (gameSessions[sessionId].players.length >= 2) {
                callback({ success: false, message: 'Session complète' });
                return;
            }
            
            gameSessions[sessionId].players.push({ socketId: socket.id, symbol: "O" });
            gameSessions[sessionId].gameState = "player1Turn";
            socket.join(sessionId);
            
            // Notifier les deux joueurs que la partie peut commencer
            io.to(sessionId).emit('gameStateUpdate', { 
                gameState: "player1Turn",
                message: "La partie commence ! Au tour du Joueur 1"
            });
            
            console.log(`Le joueur ${socket.id} a rejoint la session de Pierre-Feuille-Ciseaux ${sessionId}`);
            callback({ success: true });
        });

        socket.on('makeRPTurn', (data, callback) => {
            const { sessionId, choice, player } = data;
            if (!gameSessions[sessionId]) {
                callback({ error: 'Session non trouvée' });
                return;
            }
            
            const session = gameSessions[sessionId];
            
            // Vérifier si c'est le bon tour
            if (session.gameState === "player1Turn" && player !== "X") {
                callback({ error: 'Ce n\'est pas votre tour' });
                return;
            }
            if (session.gameState === "player2Turn" && player !== "O") {
                callback({ error: 'Ce n\'est pas votre tour' });
                return;
            }
            
            // Vérifier si le joueur est bien celui qu'il prétend être
            const playerInSession = session.players.find(p => p.socketId === socket.id && p.symbol === player);
            if (!playerInSession) {
                callback({ error: 'Joueur non autorisé' });
                return;
            }

            // Enregistrer le choix du joueur
            if (player === "X") {
                session.choices.player1 = choice;
                session.gameState = "player2Turn";
                // Notifier les joueurs du changement de tour
                io.to(sessionId).emit('gameStateUpdate', {
                    gameState: "player2Turn",
                    message: "Au tour du Joueur 2"
                });
            } else {
                session.choices.player2 = choice;
                session.gameState = "complete";
                
                // Déterminer le gagnant et envoyer les résultats
                const winner = determineRPSWinner(session.choices.player1, session.choices.player2);
                io.to(sessionId).emit('updateRPSGame', { 
                    choices: session.choices,
                    winner,
                    gameState: "complete"
                });

                // Réinitialiser pour le prochain tour
                setTimeout(() => {
                    session.choices = { player1: null, player2: null };
                    session.gameState = "player1Turn";
                    io.to(sessionId).emit('gameStateUpdate', {
                        gameState: "player1Turn",
                        message: "Nouveau tour ! Au tour du Joueur 1"
                    });
                }, 3000);
            }

            callback({ success: true });
        });

        /**
         * Détermine le gagnant du jeu Pierre-Feuille-Ciseaux
         * @param {string} choice1 - Choix du joueur 1.
         * @param {string} choice2 - Choix du joueur 2.
         * @returns {string} Symbole du gagnant ("X", "O" ou "draw").
         */
        function determineRPSWinner(choice1, choice2) {
            if (choice1 === choice2) return "draw";
            if ((choice1 === "pierre" && choice2 === "ciseaux") ||
                (choice1 === "ciseaux" && choice2 === "feuille") ||
                (choice1 === "feuille" && choice2 === "pierre")) {
                return "player1";
            }
            return "player2";
        }
    });
};