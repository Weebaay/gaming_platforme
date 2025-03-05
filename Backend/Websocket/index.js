/**
 * @file backend/websocket/index.js
 * @description Gestion centrale des WebSockets.
 */

const tictactoe = require('./tictactoe');
const dicedice = require('./dicedice');
const { createSession, joinSession, removePlayerFromSession, getSession } = require('../utils/sessionManager');


module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        // Gestionnaire centralisé pour la création de sessions (RESTAURATION à l'original)
        socket.on('createSession', (gameType, callback) => { // Retour à la structure d'origine
           let initialData;
            switch (gameType) {
                case 'tictactoe':
                    initialData = {
                        players: [{ socketId: socket.id, symbol: "X" }],
                        grid: Array(9).fill(""),
                        currentPlayer: "X",
                    };
                    break;
                case 'dicedice':
                    initialData = {
                        players: [{ socketId: socket.id, symbol: "X" }],
                        scores: { player1: 0, player2: 0 },
                        currentPlayer: "X",
                        rolls: { player1: null, player2: null },
                    };
                    break;
                default:
                    // CORRECTION : On renvoie un objet avec success: false
                    callback({ success: false, message: 'Type de jeu inconnu' });
                    return;
            }

            const sessionId = createSession(gameType, initialData);
            socket.join(sessionId);
            // CORRECTION : On renvoie l'objet complet
            callback({success: true, sessionId});
            console.log(`Session de type ${gameType} créée avec l'ID : ${sessionId}`);

        });

        // Gestionnaire centralisé pour rejoindre une session (RESTAURATION à l'original)
       socket.on('joinSession', (data, callback) => { // data contient sessionId et gameType
            const { sessionId, gameType } = data;

            if (!sessionId || !getSession(sessionId)) {
                callback({ success: false, message: 'Session non trouvée' });
                return;
            }

            const session = getSession(sessionId);

            if (session.gameType !== gameType) {
                callback({ success: false, message: 'Type de jeu incompatible' });
                return;
            }
          const playerData = { socketId: socket.id, symbol: session.players.length === 0 ? "X" : "O" };
          const success = joinSession(sessionId, playerData);

          if (success) {
              socket.join(sessionId);
              console.log(`Le joueur ${socket.id} a rejoint la session ${sessionId}`);
              io.to(sessionId).emit('sessionJoined', { gameType, players: getSession(sessionId).players.length });
              callback({ success: true });  // <---  Callback simple, comme dans le code d'origine
          } else {
                callback({ success: false, message: 'Impossible de rejoindre la session' });
          }
        });

        // Déconnexion
        socket.on('disconnect', () => {
            console.log("User Disconnected", socket.id);
            // Parcourir toutes les sessions pour supprimer le joueur
            for (const sessionId in io.sockets.adapter.rooms) {
                if (io.sockets.adapter.rooms.hasOwnProperty(sessionId)) {
                   removePlayerFromSession(sessionId, socket.id);
                }
            }
        });

        // Attache les handlers spécifiques
        tictactoe(io, socket);
        dicedice(io, socket);
    });
};