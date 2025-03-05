/**
 * @file backend/websocket/dicedice.js
 * @description Logique WebSocket pour le jeu des dés.
 */

const { getSession, updateSession } = require('../utils/sessionManager');

module.exports = (io, socket) => {

    /**
     * Gère un lancer de dés.
     * @param {object} data - Données du lancer (sessionId, player).
     */
    const handleRollDice = (data) => {
        console.log('Événement rollDice reçu:', data);
        const { sessionId, player } = data;

        const session = getSession(sessionId);
        if (!session) {
            console.log(`Session de dés non trouvée: ${sessionId}`);
            return;
        }
		console.log('Session de dés actuelle :', session);


        // Vérifier si c'est au tour du joueur
        if (session.currentPlayer !== player) {
            console.log(`Ce n'est pas le tour du joueur ${player}`);
            return;
        }

        // Simuler un lancer de dés
        const roll = Math.floor(Math.random() * 6) + 1;
		console.log(`Résultat du lancer pour le joueur ${player} : ${roll}`);

        // Enregistrer le résultat du lancer dans la session
        const updatedRolls = { ...session.rolls };
        if (player === "X") {
            updatedRolls.player1 = roll;
        } else {
            updatedRolls.player2 = roll;
        }
		updateSession(sessionId, { rolls: updatedRolls });

		console.log(`[BACKEND] Joueur ${player} a lancé un ${roll}`);
		console.log(`[BACKEND] Résultats après lancer :`, updatedRolls);


        // Déterminer si les deux joueurs ont lancé
        const otherPlayerRoll = (player === "X") ? updatedRolls.player2 : updatedRolls.player1;
        const bothRolled = otherPlayerRoll !== null;


        if (bothRolled) {
			// Déterminer un gagnant ou une égalité
			const winner = (
			updatedRolls.player1 === updatedRolls.player2 ? "draw" :
            updatedRolls.player1 > updatedRolls.player2 ? "X" : "O"
			);

            // Mise à jour des scores
            const updatedScores = { ...session.scores }; // copie
            if (winner !== "draw") {
                updatedScores[winner === "X" ? "player1" : "player2"]++;
                updateSession(sessionId, { scores: updatedScores }); // Met à jour la session
            }
			console.log(`[BACKEND] Résultats finaux:`, updatedRolls, `Gagnant: ${winner}`);


            io.to(sessionId).emit('updateDiceGame', {
                rolls: updatedRolls,
                scores: updatedScores,
                currentPlayer: null, // Indique la fin du tour
                winner,
            });

            // Réinitialisation après 3 secondes (comme avant)
            setTimeout(() => {
                const resetRolls = { player1: null, player2: null };
                updateSession(sessionId, { rolls: resetRolls, currentPlayer: "X" }); // Reset via sessionManager
                io.to(sessionId).emit('updateDiceGame', {
                    rolls: resetRolls,
                    scores: updatedScores,  // Conserve les scores
                    currentPlayer: "X",
                });
            }, 3000);
        } else {
           //Changement de joueur
            const nextPlayer = player === "X" ? "O" : "X";
            updateSession(sessionId, { currentPlayer: nextPlayer });
            io.to(sessionId).emit('updateDiceGame', {
                scores: session.scores, // Conserve les scores
                currentPlayer: nextPlayer,
                rolls: updatedRolls
            });
        }
    };

    socket.on('rollDice', handleRollDice);
};