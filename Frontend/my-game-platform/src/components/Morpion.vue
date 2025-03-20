<template>
    <div class="morpion">
        <div class="particles-container">
            <div v-for="n in 50" :key="n" class="particle" :style="{ 
                '--delay': `${Math.random() * 5}s`,
                '--left': `${Math.random() * 100}%`,
                '--size': `${Math.random() * 10 + 5}px`,
                '--color': Math.random() > 0.5 ? '#8a2be2' : '#00bfff'
            }"></div>
        </div>
        <router-link to="/home" class="home-icon">
            <i class="fas fa-home"></i>
        </router-link>
        <h1>Morpion Games</h1>
        <div v-if="!gameStarted" class="game-mode-selection">
            <h2>Choisissez un mode de jeu</h2>
            <div class="neon-buttons">
                <button @click="startGame('solo')" class="neon-button">
                    Jouer en Solo contre l'IA
                    <div class="neon-border"></div>
                </button>
                <button @click="startGame('private')" class="neon-button">
                    Créer une Partie Privée
                    <div class="neon-border"></div>
                </button>
                <button @click="startGame('free')" class="neon-button">
                    Free Partie (Local)
                    <div class="neon-border"></div>
                </button>
                <button @click="toggleJoinInput" class="neon-button">
                    Rejoindre une Partie
                    <div class="neon-border"></div>
                </button>
            </div>

            <div v-if="showJoinInput" class="join-section">
                <input v-model="joinCode" placeholder="Entrez le code de la partie" class="neon-input" />
                <button @click="joinGame" class="neon-button">
                    Rejoindre
                    <div class="neon-border"></div>
                </button>
            </div>
            <div v-if="isHost" class="host-section">
                <p>Partagez ce code avec votre ami pour qu'il rejoigne :</p>
                <p class="code neon-text">{{ gameCode }}</p>
            </div>
        </div>

        <div v-else>
            <p v-if="!winner && !isMultiplayer">Joueur actuel : {{ currentPlayer }}</p>
            <p v-else-if="!winner && isMultiplayer">Tour du Joueur : {{ currentPlayer }}</p>
            <p v-else>{{ winner }}</p>
            <div class="grid">
                <div v-for="(cell, index) in grid" :key="index" class="cell" :class="{ taken: cell }"
                    :data-content="cell"
                    @click="!cell && makeMove(index)">
                    {{ cell }}
                </div>
            </div>
            <button @click="resetGame">Retour</button>
        </div>
    </div>
</template>

<script>
import { ref, reactive, computed, onUnmounted, onMounted } from "vue";
import api from "../services/api";
import { decodeJWT } from '@/util/utils';
import { io } from 'socket.io-client';

export default {
    name: "MorpionGame2",
    components: {
    },
    setup() {
        const grid = reactive(Array(9).fill(""));
        const currentPlayer = ref("X");
        const gameStarted = ref(false);
        const isMultiplayer = ref(false);
        const isHost = ref(false);
        const showJoinInput = ref(false);
        const gameCode = ref("");
        const joinCode = ref("");
        const aiEnabled = ref(false);
        const freeMode = ref(false);
        const winner = ref(null);
        const player1Id = ref(1);
        const player2Id = ref(2);
        const IA_ID = 0; // ID fictif pour l'IA
        const playerSymbol = ref("X");
        const gameWon = ref(0);
        const gamesLost = ref(0);
        const gamesDrawn = ref(0);
        const socket = ref(null);
        const sessionID = ref("");

        const userId = computed(() => {
            const token = localStorage.getItem('token');
            if (token) {
                const decodedToken = decodeJWT(token);
                if (decodedToken && decodedToken.userId) {
                    return decodedToken.userId;
                }
            }
            return null;
        });

        onMounted(() => {
            // recupere le nom d'utilisateur depuis le localStorage lors du montage de composant
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                currentPlayer.value = storedUsername;
                console.log("Nom d'utiisateur récuperé : ", currentPlayer.value);
            }
            if (userId.value) {
                loadProgress();
            }

            socket.value = io('http://localhost:3000');
            socket.value.on('connect', () => {
                console.log('Connecté au serveur WebSocket avec l\'ID :', socket.value.id);
            });

            socket.value.on('disconnect', () => {
                console.log('Déconnecté du serveur WebSocket');
            });
            
            // Amélioration de la gestion des mises à jour du jeu
            socket.value.on('updateGame', (data) => {
                console.log('Mise à jour du jeu reçue via WebSocket:', data);
                
                // Mise à jour de la grille
                if (data.grid) {
                    // Mise à jour directe de la grille
                    Object.assign(grid, data.grid);
                    console.log('Grille mise à jour:', grid);
                }

                // Mise à jour du gagnant
                if (data.winner) {
                    winner.value = `Le joueur ${data.winner} a gagné !`;
                }

                // Gestion du match nul
                if (data.draw) {
                    winner.value = "Match nul !";
                }

                // Mise à jour du joueur actuel
                if (data.currentPlayer) {
                    currentPlayer.value = data.currentPlayer;
                }
            });

            // Ajoutez également un écouteur pour la déconnexion des joueurs
            socket.value.on('playerDisconnected', (data) => {
                alert(data.message);
                resetGame();
            });
        });

        const toggleJoinInput = () => {
            showJoinInput.value = !showJoinInput.value;
        };

        // Démarrer une partie en fonction du mode sélectionné
        const startGame = async (mode) => {
            gameStarted.value = true;
            currentPlayer.value = "X";

            if (mode === "solo") {
                aiEnabled.value = true; // Activer le mode IA
                player2Id.value = IA_ID;
                const sessionId = 'S' + Math.random().toString(36).substring(2, 15);
                sessionID.value = sessionId;
                console.log("session ID stocker pour le mode solo :", sessionId);
            } else if (mode === "private") {
                isMultiplayer.value = true;
                isHost.value = true;
                playerSymbol.value = "X"; // Premier Joueur commence
                socket.value.emit('createSession', (sessionId) => {
                    gameCode.value = sessionId;
                    sessionID.value = gameCode.value;
                    console.log("Session ID stocké :", gameCode.value);
                    alert(`Code de la partie : ${gameCode.value}`);
                });
            } else if (mode === "free") {
                freeMode.value = true; // Mode local
                isMultiplayer.value = false;
                aiEnabled.value = false;
                const sessionsId = 'F' + Math.random().toString(36).substring(2, 15);
                sessionID.value = sessionsId;
                console.log("session Id stocker pour le mode free :", sessionsId); 
            }
        };

        // Rejoindre une partie via un code d'invitation
        const joinGame = async () => {
            if (!joinCode.value) {
                alert("Veuillez entrer un code de partie !");
                return;
            }
            
            socket.value.emit('joinSession', joinCode.value, (response) => {
                if (response.success) {
                gameStarted.value = true;
                playerSymbol.value = "O"; // L'invité joue "O"
                isMultiplayer.value = true;
                isHost.value = false;
                sessionID.value = joinCode.value;
                alert("Rejoint avec succès !");
            } else {
                alert(response.message || "Impossible de rejoindre cette partie.");
                }
            });
        };

        // Modification de la fonction makeMove pour les parties multijoueur
        const makeMove = async (index) => {
            if (!grid[index] && !winner.value) {
                try {
                    if (isMultiplayer.value) {
                        // Code existant pour le mode multijoueur
                        if (currentPlayer.value !== playerSymbol.value) {
                            alert("Ce n'est pas votre tour !");
                            return;
                        }

                        console.log("Tentative de coup:", {
                            sessionId: sessionID.value,
                            index,
                            player: playerSymbol.value
                        });

                        socket.value.emit('makeMove', {
                            sessionId: sessionID.value,
                            index,
                            player: playerSymbol.value
                        }, (response) => {
                            if (response.error) {
                                console.error('Erreur:', response.error);
                                alert(response.error);
                            }
                        });
                    } else {
                        // Mode solo ou local
                        if (freeMode.value || (!freeMode.value && !aiEnabled.value) || (aiEnabled.value && currentPlayer.value === "X")) {
                            grid[index] = currentPlayer.value;

                            if (checkWinner(grid, currentPlayer.value)) {
                                let result = currentPlayer.value === "X" ? 'victoire' : 'défaite';
                                const winnerId = result === 'victoire' ? userId.value : IA_ID;
                                winner.value = `Le joueur ${currentPlayer.value} a gagné !`;

                                if (freeMode.value) {
                                    // En mode local, pas besoin de sauvegarder les statistiques
                                    return;
                                }

                                if (result === 'victoire') {
                                    gameWon.value++;
                                } else {
                                    gamesLost.value++;
                                }
                                await saveGameResult("Morpion", result, winnerId);
                                await saveProgress();
                                return;
                            }

                            if (!grid.includes("")) {
                                winner.value = "Match nul !";
                                if (!freeMode.value) {
                                    gamesDrawn.value++;
                                    await saveGameResult("Morpion", "égalité", null);
                                    await saveProgress();
                                }
                                return;
                            }

                            currentPlayer.value = currentPlayer.value === "X" ? "O" : "X";

                            // Si l'IA est activée et c'est au tour de l'IA
                            if (aiEnabled.value && currentPlayer.value === "O") {
                                setTimeout(makeAIMove, 500);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de l'envoi du mouvement :", error);
                }
            }
        };

        const saveGameResult = async (gameName, result, winnerId) => {
            try {
                console.log("Envoie des résultat :", {
                    game_name: gameName,
                    player1_id: userId.value,
                    player2_id: aiEnabled.value ? IA_ID : player2Id.value,
                    winner_id: aiEnabled.value && winnerId === IA_ID ? IA_ID : winnerId === player1Id.value ? userId.value : winnerId,
                    result,
                    session_id: sessionID.value,
                });

                const response = await api.post("/game-sessions", {
                    game_name: gameName,
                    player1_id: userId.value,
                    player2_id: aiEnabled.value ? IA_ID : player2Id.value,
                    winner_id: aiEnabled.value && winnerId === IA_ID ? IA_ID : winnerId === player1Id.value ? userId.value : winnerId,
                    result,
                    session_id: sessionID.value,
                });

                console.log("Réponse du serveur :", response.data);
                return response.data;
            } catch (error) {
                console.error("Erreur lors de l'enregistrement des résultats :", error);
                throw error;
            }
        };
        // Logique de l'IA pour effectuer un coup
        const makeAIMove = async () => {
            if (winner.value) return;

            const availableMoves = grid
                .map((cell, index) => (cell === "" ? index : null))
                .filter((x) => x !== null);

            if (availableMoves.length === 0) return;

            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            const moveIndex = availableMoves[randomIndex];
            
            // L'IA joue directement sur la grille
            grid[moveIndex] = "O";

            // Vérifier si l'IA a gagné
            if (checkWinner(grid, "O")) {
                winner.value = "L'IA a gagné !";
                gamesLost.value++;
                await saveGameResult("Morpion", "défaite", IA_ID);
                await saveProgress();
                return;
            }

            // Vérifier le match nul
            if (!grid.includes("")) {
                winner.value = "Match nul !";
                gamesDrawn.value++;
                await saveGameResult("Morpion", "égalité", null);
                await saveProgress();
                return;
            }

            // Passer le tour au joueur
            currentPlayer.value = "X";
        };
        // Vérifier si un joueur a gagné
        const checkWinner = (board, player) => {
            const winPatterns = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [0, 3, 6],
                [1, 4, 7],
                [2, 5, 8],
                [0, 4, 8],
                [2, 4, 6],
            ];
            return winPatterns.some((pattern) =>
                pattern.every((index) => board[index] === player)
            );
        };

        const saveProgress = async () => {
            try {
                const progressData = {
                    gameWon: gameWon.value,
                    gamesLost: gamesLost.value,
                    gamesDrawn: gamesDrawn.value,
                };

                await api.post('/progress/save', {
                    user_id: userId.value,
                    game_id: 1,
                    progress_data: progressData,
                });

                console.log('Progression sauvegardée avec succès.');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde de la progression :', error);
            }
        };


        const loadProgress = async () => {
            try {
                console.log("Récupération de la progression pour le jeu Morpion (game_id = 1)...");
                const response = await api.get('/progress/get', {
                    params: {
                        user_id: userId.value,
                        game_id: 1, // ID du jeu Morpion
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log("Réponse du serveur :", response);

                if (response.data && response.data.progress_data) {
                    const progressData = response.data.progress_data;
                    gameWon.value = progressData.gameWon || 0;
                    gamesLost.value = progressData.gamesLost || 0;
                    gamesDrawn.value = progressData.gamesDrawn || 0;
                    // Récupérez d'autres données de progression si nécessaire
                    console.log('Progression récupérée avec succès.');
                } else {
                    console.log('Aucune progression trouvée pour ce jeu.');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de la progression :', error);
            }
        };

        // Réinitialiser la partie
        const resetGame = () => {
            grid.fill(""); // Réinitialiser la grille
            currentPlayer.value = "X";
            gameStarted.value = false;
            isMultiplayer.value = false;
            isHost.value = false;
            aiEnabled.value = false;
            showJoinInput.value = false;
            freeMode.value = false;
            gameCode.value = "";
            joinCode.value = "";
            winner.value = null;
            playerSymbol.value = isMultiplayer.value ? "X" : player1Id.value;
            gameWon.value = 0;
            gamesLost.value = 0;
            gamesDrawn.value = 0;
            saveProgress()
        };

        onUnmounted(() => {
            if (socket.value) {
                socket.value.disconnect();
            }
        });

        return {
            grid,
            currentPlayer,
            gameStarted,
            isMultiplayer,
            isHost,
            showJoinInput,
            gameCode,
            joinCode,
            winner,
            startGame,
            toggleJoinInput,
            joinGame,
            makeMove,
            resetGame,
            player1Id,
            player2Id,
            IA_ID,
            gameWon,
            gamesLost,
            gamesDrawn,
            userId,
            socket,
            sessionID
        };
    },
};
</script>
  
<style scoped>
    .morpion {
        min-height: 100vh;
        padding: 2rem;
        background: #1a1a1a;
        color: white;
        position: relative;
        overflow: hidden;
    }

    .particles-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    .particle {
        position: absolute;
        bottom: -20px;
        left: var(--left);
        width: var(--size);
        height: var(--size);
        background: var(--color);
        border-radius: 50%;
        animation: floatUp 10s linear infinite;
        animation-delay: var(--delay);
        opacity: 0;
        filter: blur(2px);
        box-shadow: 
            0 0 10px var(--color),
            0 0 20px var(--color),
            0 0 30px var(--color);
    }

    @keyframes floatUp {
        0% {
            transform: translateY(0) scale(1);
            opacity: 0;
        }
        10% {
            opacity: 0.8;
        }
        90% {
            opacity: 0.8;
        }
        100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
        }
    }

    .home-icon {
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 2rem;
        color: #8a2be2;
        text-decoration: none;
        transition: all 0.3s ease;
        text-shadow: 
            0 0 10px #8a2be2,
            0 0 20px #8a2be2,
            0 0 30px #8a2be2;
        z-index: 3;
    }

    .home-icon:hover {
        color: #00bfff;
        transform: scale(1.1);
        text-shadow: 
            0 0 10px #00bfff,
            0 0 20px #00bfff,
            0 0 30px #00bfff;
    }

    .game-mode-selection {
        text-align: center;
        margin: 2rem auto;
        max-width: 800px;
        position: relative;
        z-index: 2;
    }

    .neon-buttons {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin: 2rem 0;
    }

    .neon-button {
        position: relative;
        padding: 1rem 2rem;
        font-size: 1.2rem;
        color: white;
        background: rgba(138, 43, 226, 0.1);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 
            0 0 10px rgba(138, 43, 226, 0.3),
            0 0 20px rgba(138, 43, 226, 0.2),
            0 0 30px rgba(138, 43, 226, 0.1);
    }

    .neon-button:hover {
        background: rgba(0, 191, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 
            0 0 15px rgba(0, 191, 255, 0.4),
            0 0 30px rgba(0, 191, 255, 0.3),
            0 0 45px rgba(0, 191, 255, 0.2);
    }

    .neon-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        animation: neonBorder 1.5s ease-in-out infinite;
    }

    @keyframes neonBorder {
        0%, 100% {
            border-color: #8a2be2;
            box-shadow: 
                0 0 10px #8a2be2,
                0 0 20px #8a2be2;
        }
        50% {
            border-color: #00bfff;
            box-shadow: 
                0 0 10px #00bfff,
                0 0 20px #00bfff;
        }
    }

    .neon-input {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        color: white;
        background: rgba(138, 43, 226, 0.1);
        border: 2px solid #8a2be2;
        border-radius: 8px;
        margin-bottom: 1rem;
        width: 100%;
        max-width: 300px;
        transition: all 0.3s ease;
    }

    .neon-input:focus {
        outline: none;
        border-color: #00bfff;
        box-shadow: 
            0 0 10px rgba(0, 191, 255, 0.4),
            0 0 20px rgba(0, 191, 255, 0.2);
    }

    .neon-text {
        font-size: 1.5rem;
        color: #8a2be2;
        text-shadow: 
            0 0 10px #8a2be2,
            0 0 20px #8a2be2;
        animation: neonText 1.5s ease-in-out infinite;
    }

    @keyframes neonText {
        0%, 100% {
            color: #8a2be2;
            text-shadow: 
                0 0 10px #8a2be2,
                0 0 20px #8a2be2;
        }
        50% {
            color: #00bfff;
            text-shadow: 
                0 0 10px #00bfff,
                0 0 20px #00bfff;
        }
    }

    .join-section, .host-section {
        margin-top: 2rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        max-width: 400px;
        margin: 20px auto;
        padding: 15px;
        background: rgba(255, 49, 49, 0.1);
        border-radius: 15px;
        box-shadow: 
            0 0 10px rgba(255, 49, 49, 0.3),
            0 0 20px rgba(255, 92, 49, 0.2),
            inset 0 0 30px rgba(255, 49, 49, 0.1);
    }

    .cell {
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: bold;
        cursor: pointer;
        background: rgba(26, 26, 26, 0.8);
        border: 2px solid #ff3131;
        border-radius: 8px;
        transition: all 0.3s ease;
        color: white;
    }

    .cell:hover {
        transform: scale(1.05);
        box-shadow: 
            0 0 10px rgba(255, 49, 49, 0.4),
            0 0 20px rgba(255, 92, 49, 0.3);
    }

    .cell:empty {
        border-color: rgba(255, 49, 49, 0.3);
    }

    /* Style pour X */
    .cell:not(:empty) {
        animation: appearNeon 0.3s ease-out forwards;
    }

    .cell[data-content="X"], .cell:not(:empty):first-letter {
        color: #8a2be2;
        text-shadow: 
            0 0 10px #8a2be2,
            0 0 20px #8a2be2,
            0 0 30px #8a2be2;
    }

    /* Style pour O */
    .cell[data-content="O"] {
        color: #00bfff;
        text-shadow: 
            0 0 10px #00bfff,
            0 0 20px #00bfff,
            0 0 30px #00bfff;
    }

    @keyframes appearNeon {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    button[type="reset"], button[type="button"] {
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 1.2rem;
        color: white;
        background: rgba(255, 49, 49, 0.1);
        border: 2px solid #ff3131;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    button[type="reset"]:hover, button[type="button"]:hover {
        background: rgba(255, 92, 49, 0.2);
        box-shadow: 
            0 0 10px rgba(255, 49, 49, 0.4),
            0 0 20px rgba(255, 92, 49, 0.3);
    }

    .winner {
        font-size: 24px;
        margin: 20px 0;
        padding: 10px;
        text-align: center;
        color: #8a2be2;
        text-shadow: 
            0 0 10px #8a2be2,
            0 0 20px #8a2be2;
        animation: neonText 1.5s ease-in-out infinite;
    }

    /* Styles pour les messages du jeu */
    .morpion > div > p {
        font-size: 1.2rem;
        margin: 15px 0;
        text-align: center;
        color: #ff3131;
        text-shadow: 
            0 0 10px rgba(255, 49, 49, 0.4),
            0 0 20px rgba(255, 92, 49, 0.3);
    }

    /* Ajout des styles pour UserProfile et User ID */
    .morpion > p, .morpion > UserProfile {
        margin-left: 80px; /* Espace pour l'icône home */
        position: relative;
        z-index: 2;
    }
</style>