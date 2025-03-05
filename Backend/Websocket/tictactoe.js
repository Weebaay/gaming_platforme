/**
 * @file backend/websocket/tictactoe.js
 * @description Logique WebSocket pour le jeu du Morpion (Tic-Tac-Toe).
 */

const { getSession, updateSession } = require('../utils/sessionManager');
const { checkWinner } = require('../utils/gameUtils');


module.exports = (io, socket) => {
    /**
      * Gère un mouvement dans le jeu de Morpion.
      * @param {object} data - Données du mouvement (sessionId, index, player).
      */
    const handleMakeMove = (data) => {
        const { sessionId, index, player } = data;

        console.log(`Mouvement Morpion reçu via WebSocket - sessionId: ${sessionId}, index: ${index}, player: ${player}`);

        const session = getSession(sessionId);
        if (!session) {
            console.log(`Session Morpion non trouvée: ${sessionId}`);
            return;
        }

        // Vérifier si c'est au tour du joueur
        if (session.currentPlayer !== player) {
            console.log(`Ce n'est pas le tour du joueur ${player}`);
            return;
        }

        // Vérifier si la case est vide
        if (session.grid[index]) {
            console.log(`Case déjà prise à l'index ${index}`);
            return;
        }

        // Mettre à jour la grille
        session.grid[index] = player;
        updateSession(sessionId, { grid: session.grid }); // Mise à jour via sessionManager


        // Vérifier si un joueur a gagné
        const winner = checkWinner(session.grid);
        if (winner) {
            console.log(`Le joueur ${winner} a gagné au Morpion !`);
            io.to(sessionId).emit('updateGame', { grid: session.grid, winner });
            return;
        }

        // Vérifier si match nul
        if (!session.grid.includes("")) {
            console.log("Match nul au Morpion !");
            io.to(sessionId).emit('updateGame', { grid: session.grid, draw: true });
            return;
        }

        //Changement de joueur
        const nextPlayer = player === "X" ? "O" : "X";
        updateSession(sessionId, { currentPlayer: nextPlayer });
        io.to(sessionId).emit('updateGame', { grid: session.grid, currentPlayer: nextPlayer });

    };

    socket.on('makeMove', handleMakeMove);
};