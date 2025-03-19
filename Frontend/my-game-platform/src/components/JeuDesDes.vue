<template>
    <div class="jeu-des-des" :class="{ 'reactive-bg': gameStarted }">
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
        <h1 class="holo-title">Jeu des Dés</h1>

        <!-- Mode de jeu -->
        <div v-if="!gameStarted" class="game-mode-selection">
            <h2>Choisissez un mode de jeu</h2>
            <div class="neon-buttons">
                <button @click="startGame('ia')" class="neon-button">
                    Jouer contre l'IA
                    <div class="neon-border"></div>
                </button>
                <button @click="startGame('local')" class="neon-button">
                    Mode Local
                    <div class="neon-border"></div>
                </button>
                <button @click="startGame('private')" class="neon-button">
                    Créer une Partie Privée
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

        <!-- Partie en cours -->
        <div v-else class="game-in-progress">
            <div class="matrix-overlay" v-if="rolling"></div>
            <h2 v-if="winner" class="winner cyberpunk-glitch" :data-text="winner">{{ winner }}</h2>

            <!-- Joueurs -->
            <div class="players">
                <div class="player" :class="{ 'active-player': isHost ? (turn === 'X') : (turn === 'O') }">
                    <h3>{{ mode === 'ia' ? 'Joueur 1' : mode === 'local' ? 'Joueur 1' : 'Vous' }}</h3>
                    <div class="die-container">
                        <div class="matrix-numbers" v-if="rolling && (isHost ? (turn === 'X') : (turn === 'O'))">
                            <span v-for="n in 6" :key="n">{{ n }}</span>
                        </div>
                        <img :src="playerDieImage || dieFaces[0]" alt="Dé" class="die" :class="{ 'matrix-roll': rolling && (isHost ? (turn === 'X') : (turn === 'O')) }" />
                    </div>
                    <div class="score-energy">
                        <div class="energy-bar" :style="{ width: (isHost ? scores.player : scores.opponent) * 10 + '%' }"></div>
                        <p>Score: {{ isHost ? scores.player : scores.opponent }}</p>
                    </div>
                </div>
                <div class="player" :class="{ 'active-player': isHost ? (turn === 'O') : (turn === 'X') }">
                    <h3>{{ mode === 'ia' ? 'IA' : mode === 'local' ? 'Joueur 2' : 'Adversaire' }}</h3>
                    <div class="die-container">
                        <div class="matrix-numbers" v-if="rolling && (isHost ? (turn === 'O') : (turn === 'X'))">
                            <span v-for="n in 6" :key="n">{{ n }}</span>
                        </div>
                        <img :src="opponentDieImage || dieFaces[0]" alt="Dé" class="die" :class="{ 'matrix-roll': rolling && (isHost ? (turn === 'O') : (turn === 'X')) }" />
                    </div>
                    <div class="score-energy">
                        <div class="energy-bar" :style="{ width: (isHost ? scores.opponent : scores.player) * 10 + '%' }"></div>
                        <p>Score: {{ isHost ? scores.opponent : scores.player }}</p>
                    </div>
                </div>
            </div>

            <!-- Lancer de dé -->
            <button 
                @click="rollDie(turn)" 
                :disabled="(mode === 'private' && ((isHost && turn === 'O') || (!isHost && turn === 'X'))) || rolling"
                class="action-button"
            >
                {{ mode === 'ia' ? 'Lancer le dé' : 'Lancer le dé' }}
            </button>

            <!-- Afficher à qui est le tour -->
            <p v-if="!winner && mode !== 'ia'" class="turn-info">
                Tour de : {{ isHost ? (turn === 'X' ? 'Vous' : 'Adversaire') : (turn === 'O' ? 'Vous' : 'Adversaire') }}
            </p>

            <!-- Scores -->
            <div class="scores">
                <div>
                    <h3>{{ isHost ? 'Vous' : 'Adversaire' }}</h3>
                    <p>{{ isHost ? scores.player : scores.opponent }}</p>
                </div>
                <div>
                    <h3>{{ isHost ? 'Adversaire' : 'Vous' }}</h3>
                    <p>{{ isHost ? scores.opponent : scores.player }}</p>
                </div>
            </div>

            <!-- Statistiques -->
            <div class="stats">
                <h2>Statistiques</h2>
                <p>Nombre de lancers : {{ nombreLancers }}</p>
                <p>Victoires contre l'IA : {{ victoiresIA }}</p>
                <p>Victoires en mode local : {{ victoiresLocal }}</p>
                <p>Victoires consécutives : {{ victoiresConsecutives }}</p>
            </div>

            <!-- Recommencer -->
            <button @click="resetGame" class="reset-button">Recommencer</button>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from "vue";
import api from "../services/api";
import { decodeJWT } from '@/util/utils';
import { io } from 'socket.io-client';

export default {
    name: "JeuDesDes",
    components: {
    },
    setup() {
        // Variables réactives communes
        const gameStarted = ref(false);
        const mode = ref("");
        const turn = ref("X");
        const rolling = ref(false);
        const playerRoll = ref(null);
        const opponentRoll = ref(null);
        const scores = reactive({ player: 0, opponent: 0 });
        const winner = ref("");
        const isHost = ref(false);
        const showJoinInput = ref(false);
        const gameCode = ref("");
        const joinCode = ref("");
        const socket = ref(null);
        const sessionID = ref("");
        const opponentName = ref("Joueur 2");

        // Ajout des variables pour les images des dés
        const dieFaces = [
            "/images/die1.png",
            "/images/die2.png",
            "/images/die3.png",
            "/images/die4.png",
            "/images/die5.png",
            "/images/die6.png",
        ];
        const playerDieImage = ref(dieFaces[0]);
        const opponentDieImage = ref(dieFaces[0]);

        // Variables spécifiques au mode IA et local
        const nombreLancers = ref(0);
        const victoiresIA = ref(0);
        const victoiresLocal = ref(0);
        const victoiresConsecutives = ref(0);

        // Propriétés calculées
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

        const currentPlayerSymbol = computed(() => {
            return isHost.value ? "X" : "O";
        });

        // Charger la progression au montage
        onMounted(() => {
            loadProgress();
            socket.value = io('http://localhost:3000');
            
            socket.value.on('connect', () => {
                console.log('Connecté au serveur WebSocket avec l\'ID :', socket.value.id);
            });

            socket.value.on('disconnect', () => {
                console.log('Déconnecté du serveur WebSocket');
            });

            socket.value.on('diceSessionJoined', (data) => {
                console.log('État actuel - gameStarted:', gameStarted.value);
                console.log('Nombre de joueurs dans la session:', data.players);
                if (data.players === 2) {
                    console.log('Démarrage de la partie (2 joueurs présents)');
                    gameStarted.value = true;
                }
            });

            socket.value.on('updateDiceGame', (data) => {
                console.log('Reçu updateDiceGame:', data);
                if (data.rolls) {
                    setTimeout(() => {
                        if (isHost.value) {
                            playerRoll.value = data.rolls.player1;
                            opponentRoll.value = data.rolls.player2;
                            playerDieImage.value = dieFaces[data.rolls.player1 - 1];
                            opponentDieImage.value = dieFaces[data.rolls.player2 - 1];
                        } else {
                            playerRoll.value = data.rolls.player2;
                            opponentRoll.value = data.rolls.player1;
                            playerDieImage.value = dieFaces[data.rolls.player2 - 1];
                            opponentDieImage.value = dieFaces[data.rolls.player1 - 1];
                        }
                    }, 1000);
                }
                if (data.scores) {
                    if (isHost.value) {
                        scores.player = data.scores.player1;
                        scores.opponent = data.scores.player2;
                    } else {
                        scores.player = data.scores.player2;
                        scores.opponent = data.scores.player1;
                    }
                }
                turn.value = data.currentPlayer;
                console.log('Nouveau tour :', turn.value);

                if (data.winner) {
                    const currentUsername = localStorage.getItem('username');
                    const opponentUsername = data.opponentUsername;
                    
                    if (data.winner === "draw") {
                        winner.value = "Égalité !";
                    } else {
                        const isWinner = (isHost.value && data.winner === "X") || (!isHost.value && data.winner === "O");
                        if (isWinner) {
                            winner.value = `${currentUsername} a gagné !`;
                        } else {
                            winner.value = opponentUsername ? `${opponentUsername} a gagné !` : "Adversaire a gagné !";
                        }
                    }
                }
            });

            // Ajout de la gestion des noms des joueurs
            socket.value.on('playerJoined', (data) => {
                if (data.username) {
                    if (isHost.value) {
                        opponentName.value = data.username;
                    } else {
                        opponentName.value = data.hostUsername;
                    }
                }
            });
        });

        // Fonctions pour les modes IA et local
        const startGame = async (selectedMode) => {
            console.log("Mode sélectionné :", selectedMode);
            mode.value = selectedMode;
            gameStarted.value = true;
            turn.value = "X";
            playerRoll.value = null;
            opponentRoll.value = null;
            winner.value = "";
            scores.player = 0;
            scores.opponent = 0;
            playerDieImage.value = dieFaces[0];
            opponentDieImage.value = dieFaces[0];

            if (selectedMode === "private") {
                console.log("Création d'une partie privée");
                isHost.value = true;
                socket.value.emit('createDiceSession', (sessionId) => {
                    gameCode.value = sessionId;
                    sessionID.value = gameCode.value;
                    console.log("Session ID stocké :", gameCode.value);
                    alert(`Code de la partie : ${gameCode.value}`);
                });
            }
        };

        const joinGame = async () => {
            console.log("=== Début de joinGame ===");
            if (!joinCode.value) {
                console.log("Erreur: Code de partie manquant");
                alert("Veuillez entrer un code de partie !");
                return;
            }

            console.log("État actuel - isHost:", isHost.value);
            isHost.value = false;
            mode.value = "private";
            sessionID.value = joinCode.value;
            console.log("Émission de l'événement joinDiceSession avec le code:", joinCode.value);
            socket.value.emit('joinDiceSession', joinCode.value, (response) => {
                if (response && response.success) {
                    console.log("Partie rejointe avec succès");
                } else {
                    console.log("Erreur lors de la tentative de rejoindre la partie");
                    alert("Impossible de rejoindre la partie. Vérifiez le code et réessayez.");
                }
            });
        };

        const rollDie = async (player) => {
            if (rolling.value) return;
            
            rolling.value = true;
            nombreLancers.value++;

            // Animation du dé pour tous les modes
            const interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * 6);
                if (player === "X") {
                    playerDieImage.value = dieFaces[randomIndex];
                } else {
                    opponentDieImage.value = dieFaces[randomIndex];
                }
            }, 100);

            if (mode.value === "private") {
                console.log('Événement rollDice émis:', { sessionId: sessionID.value, player: turn.value });
                socket.value.emit('rollDice', { sessionId: sessionID.value, player: turn.value });
            } else {
                const roll = Math.floor(Math.random() * 6) + 1;
                
                if (mode.value === "local") {
                    setTimeout(() => {
                        if (player === "X") {
                            playerRoll.value = roll;
                            playerDieImage.value = dieFaces[roll - 1];
                        } else {
                            opponentRoll.value = roll;
                            opponentDieImage.value = dieFaces[roll - 1];
                        }
                        determineWinner();
                    }, 1000);
                } else if (mode.value === "ia") {
                    setTimeout(() => {
                        playerRoll.value = roll;
                        playerDieImage.value = dieFaces[roll - 1];
                        const iaRoll = Math.floor(Math.random() * 6) + 1;
                        opponentRoll.value = iaRoll;
                        opponentDieImage.value = dieFaces[iaRoll - 1];
                        determineWinner();
                    }, 1000);
                }
            }

            // Arrêt de l'animation après 1 seconde pour tous les modes
            setTimeout(() => {
                clearInterval(interval);
                rolling.value = false;
            }, 1000);
        };

        const determineWinner = () => {
            let result;
            let winnerId = null;
            const currentUsername = localStorage.getItem('username') || 'Joueur 1';

            // Vérifier si les deux joueurs ont lancé leurs dés
            if (mode.value === "local" && (playerRoll.value === null || opponentRoll.value === null)) {
                // Si ce n'est pas le cas, on change juste le tour
                turn.value = turn.value === "X" ? "O" : "X";
                return;
            }

            if (playerRoll.value > opponentRoll.value) {
                if (mode.value === "ia") {
                    winner.value = "Vous avez gagné !";
                    victoiresIA.value++;
                } else if (mode.value === "local") {
                    winner.value = "Le Joueur 1 a gagné !";
                    victoiresLocal.value++;
                } else {
                    winner.value = `${currentUsername} a gagné !`;
                }
                scores.player++;
                result = 'victoire';
                winnerId = userId.value;
                victoiresConsecutives.value++;
            } else if (playerRoll.value < opponentRoll.value) {
                if (mode.value === "ia") {
                    winner.value = "L'IA a gagné !";
                } else if (mode.value === "local") {
                    winner.value = "Le Joueur 2 a gagné !";
                } else {
                    winner.value = `${opponentName.value} a gagné !`;
                }
                scores.opponent++;
                result = 'défaite';
                winnerId = mode.value === "local" ? 0 : 0;
                victoiresConsecutives.value = 0;
            } else {
                winner.value = "Égalité !";
                result = 'égalité';
                victoiresConsecutives.value = 0;
            }

            // En mode local, on réinitialise les lancers après l'annonce du gagnant
            if (mode.value === "local") {
                setTimeout(() => {
                    playerRoll.value = null;
                    opponentRoll.value = null;
                    turn.value = "X";
                    winner.value = "";
                }, 2000);
            }

            if (mode.value !== "local") {
                saveGameResult(result, winnerId);
                saveProgress();
            }
        };

        const saveGameResult = async (result, winnerId) => {
            const sessionId = localStorage.getItem("sessionId");
            try {
                await api.post("/game-sessions", {
                    game_name: "JeuDesDes",
                    player1_id: userId.value,
                    player2_id: mode.value === "local" ? 0 : 0, // IA ou Joueur 2
                    winner_id: winnerId,
                    result: result,
                    session_id: sessionId,
                });
                console.log("Partie enregistrée avec succès.");
            } catch (error) {
                console.error("Erreur lors de l'enregistrement de la partie:", error);
            }
        };

        const saveProgress = async () => {
            try {
                const progressData = {
                    nombreLancers: nombreLancers.value,
                    victoiresIA: victoiresIA.value,
                    victoiresLocal: victoiresLocal.value,
                    victoiresConsecutives: victoiresConsecutives.value,
                };

                const gameId = 29; // ID du jeu dans la base de données
                await api.post('/progress/save', {
                    user_id: userId.value,
                    game_id: gameId,
                    progress_data: progressData,
                });

                console.log('Progression sauvegardée avec succès.');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde de la progression :', error);
            }
        };

        const loadProgress = async () => {
            try {
                const gameId = 29;
                const response = await api.get('/progress/get', {
                    params: {
                        user_id: userId.value,
                        game_id: gameId,
                    },
                });

                if (response.data && response.data.progress_data) {
                    const progressData = response.data.progress_data;
                    nombreLancers.value = progressData.nombreLancers || 0;
                    victoiresIA.value = progressData.victoiresIA || 0;
                    victoiresLocal.value = progressData.victoiresLocal || 0;
                    victoiresConsecutives.value = progressData.victoiresConsecutives || 0;
                    console.log('Progression récupérée avec succès.');
                } else {
                    console.log('Aucune progression trouvée pour ce jeu.');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de la progression :', error);
            }
        };

        const resetGame = () => {
            gameStarted.value = false;
            isHost.value = false;
            showJoinInput.value = false;
            gameCode.value = "";
            joinCode.value = "";
            winner.value = "";
            turn.value = "player";
            scores.player = 0;
            scores.opponent = 0;
            nombreLancers.value = 0;
            victoiresIA.value = 0;
            victoiresLocal.value = 0;
            victoiresConsecutives.value = 0;
            playerRoll.value = null;
            opponentRoll.value = null;
            playerDieImage.value = dieFaces[0];
            opponentDieImage.value = dieFaces[0];
            saveProgress();
        };

        // Ajout de la fonction toggleJoinInput
        const toggleJoinInput = () => {
            showJoinInput.value = !showJoinInput.value;
        };

        return {
            gameStarted,
            mode,
            turn,
            rolling,
            playerRoll,
            opponentRoll,
            scores,
            winner,
            isHost,
            showJoinInput,
            gameCode,
            joinCode,
            startGame,
            rollDie,
            resetGame,
            userId,
            currentPlayerSymbol,
            playerDieImage,
            opponentDieImage,
            nombreLancers,
            victoiresIA,
            victoiresLocal,
            victoiresConsecutives,
            toggleJoinInput,
            joinGame,
            dieFaces,
            opponentName
        };
    },
};
</script>

<style scoped>
.jeu-des-des {
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

.holo-title {
    font-size: 3rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    margin: 2rem 0;
    text-shadow: 
        0 0 10px rgba(0, 191, 255, 0.5),
        0 0 20px rgba(0, 191, 255, 0.3);
    letter-spacing: 2px;
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

/* Animations pour le jeu des dés */
.die {
    width: 100px;
    height: 100px;
    transition: all 0.3s ease;
    filter: drop-shadow(0 0 10px rgba(138, 43, 226, 0.5));
}

.die.rolling {
    animation: rollDie 0.5s linear infinite;
    filter: drop-shadow(0 0 15px rgba(0, 191, 255, 0.8));
}

@keyframes rollDie {
    0% {
        transform: rotate(0deg) scale(1);
    }
    50% {
        transform: rotate(180deg) scale(1.2);
    }
    100% {
        transform: rotate(360deg) scale(1);
    }
}

.players {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin: 2rem 0;
    gap: 4rem;
}

.player {
    background: rgba(138, 43, 226, 0.1);
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    position: relative;
    backdrop-filter: blur(5px);
    border: 2px solid transparent;
    animation: playerBorder 2s linear infinite;
}

@keyframes playerBorder {
    0%, 100% {
        border-color: rgba(138, 43, 226, 0.5);
        box-shadow: 
            0 0 10px rgba(138, 43, 226, 0.3),
            0 0 20px rgba(138, 43, 226, 0.2);
    }
    50% {
        border-color: rgba(0, 191, 255, 0.5);
        box-shadow: 
            0 0 10px rgba(0, 191, 255, 0.3),
            0 0 20px rgba(0, 191, 255, 0.2);
    }
}

.winner {
    font-size: 2.5rem;
    text-align: center;
    margin: 2rem 0;
    color: #00bfff;
    text-shadow: 
        0 0 10px rgba(0, 191, 255, 0.8),
        0 0 20px rgba(0, 191, 255, 0.6),
        0 0 30px rgba(0, 191, 255, 0.4);
    animation: winnerPulse 1.5s ease-in-out infinite;
}

@keyframes winnerPulse {
    0%, 100% {
        transform: scale(1);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.1);
        opacity: 1;
    }
}

/* Styles responsifs */
@media (max-width: 768px) {
    .players {
        flex-direction: column;
        gap: 2rem;
    }

    .die {
        width: 80px;
        height: 80px;
    }

    .winner {
        font-size: 2rem;
    }
}

/* Style Matrix pour le lancer de dés */
.matrix-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;
    pointer-events: none;
}

.die-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto;
}

.matrix-numbers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    color: #00ff00;
    font-family: monospace;
    font-size: 24px;
    text-shadow: 0 0 5px #00ff00;
    animation: matrixRain 0.5s linear infinite;
}

.matrix-numbers span {
    animation: matrixFade 0.5s linear infinite;
    opacity: 0;
}

.matrix-roll {
    animation: matrixDice 1s linear;
    filter: brightness(1.5) contrast(1.2) hue-rotate(90deg);
}

@keyframes matrixRain {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}

@keyframes matrixFade {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}

@keyframes matrixDice {
    0% { transform: scale(1) rotate(0deg); filter: brightness(1) hue-rotate(0deg); }
    50% { transform: scale(1.2) rotate(180deg); filter: brightness(1.5) hue-rotate(180deg); }
    100% { transform: scale(1) rotate(360deg); filter: brightness(1) hue-rotate(360deg); }
}

/* Style Cyberpunk pour l'animation de victoire */
.cyberpunk-glitch {
    position: relative;
    color: #0ff;
    text-shadow: 
        2px 2px #f0f,
        -2px -2px #0ff;
    animation: glitchText 0.5s infinite;
}

.cyberpunk-glitch::before,
.cyberpunk-glitch::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
}

.cyberpunk-glitch::before {
    left: 2px;
    text-shadow: -2px 0 #ff00de;
    animation: glitchBefore 2s infinite linear alternate-reverse;
}

.cyberpunk-glitch::after {
    left: -2px;
    text-shadow: 2px 0 #00fff9;
    animation: glitchAfter 3s infinite linear alternate-reverse;
}

@keyframes glitchText {
    0% { text-shadow: 2px 2px #f0f, -2px -2px #0ff; }
    25% { text-shadow: -2px 2px #f0f, 2px -2px #0ff; }
    50% { text-shadow: 2px -2px #f0f, -2px 2px #0ff; }
    75% { text-shadow: -2px -2px #f0f, 2px 2px #0ff; }
    100% { text-shadow: 2px 2px #f0f, -2px -2px #0ff; }
}

@keyframes glitchBefore {
    0% { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(100% 0 0 0); }
}

@keyframes glitchAfter {
    0% { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(0 0 100% 0); }
}

/* Style Réactif pour l'animation d'ambiance */
.reactive-bg {
    position: relative;
    animation: bgPulse 2s ease-in-out infinite;
}

.active-player {
    animation: playerPulse 1s ease-in-out infinite;
}

@keyframes bgPulse {
    0%, 100% { background: #1a1a1a; }
    50% { background: #1f1f1f; }
}

@keyframes playerPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

/* Style Énergétique pour l'animation des scores */
.score-energy {
    position: relative;
    width: 100%;
    height: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 1rem;
}

.energy-bar {
    height: 100%;
    background: linear-gradient(90deg, #00ff00, #00ffff);
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
}

.energy-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
    );
    animation: energyFlow 2s linear infinite;
}

@keyframes energyFlow {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* Style Onde pour les transitions */
.game-in-progress {
    animation: waveIn 0.5s ease-out;
}

@keyframes waveIn {
    0% {
        clip-path: circle(0% at 50% 50%);
        transform: scale(0.8);
    }
    100% {
        clip-path: circle(150% at 50% 50%);
        transform: scale(1);
    }
}

/* Ajustements responsifs */
@media (max-width: 768px) {
    .matrix-numbers {
        font-size: 18px;
    }

    .score-energy {
        height: 15px;
    }
}

.action-button {
    position: relative;
    padding: 1.2rem 2.5rem;
    font-size: 1.3rem;
    color: #00fff9;
    background: rgba(0, 255, 249, 0.1);
    border: 2px solid #00fff9;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 2rem auto;
    display: block;
}

.action-button::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #ff00de, #00fff9, #ff00de);
    z-index: -1;
    animation: borderRotate 2s linear infinite;
    filter: blur(10px);
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
    color: #666;
}

.action-button:not(:disabled):hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 
        0 0 20px rgba(0, 255, 249, 0.4),
        0 0 40px rgba(0, 255, 249, 0.2);
    text-shadow: 
        0 0 5px #00fff9,
        0 0 10px #00fff9;
}

@keyframes borderRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.scores {
    display: flex;
    justify-content: space-around;
    margin: 2rem auto;
    padding: 1.5rem;
    background: rgba(138, 43, 226, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(10px);
    max-width: 600px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.scores::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #8a2be2, #00bfff);
    border-radius: 16px;
    z-index: -1;
    filter: blur(8px);
    opacity: 0.5;
    animation: scoreBorderGlow 3s ease-in-out infinite;
}

.scores div {
    text-align: center;
    padding: 1rem 2rem;
    position: relative;
}

.scores h3 {
    color: #00bfff;
    font-size: 1.4rem;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px #00bfff;
}

.scores p {
    font-size: 2rem;
    color: #fff;
    text-shadow: 0 0 15px #8a2be2;
    font-weight: bold;
}

.stats {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 15px;
    padding: 1.5rem;
    margin: 2rem auto;
    max-width: 500px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stats::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
        rgba(138, 43, 226, 0.1),
        rgba(0, 191, 255, 0.1)
    );
    z-index: -1;
}

.stats h2 {
    color: #00bfff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 
        0 0 10px #00bfff,
        0 0 20px #00bfff;
}

.stats p {
    color: #fff;
    font-size: 1rem;
    margin: 0.5rem 0;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stats p:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
    box-shadow: 
        0 0 5px rgba(138, 43, 226, 0.2),
        0 0 10px rgba(0, 191, 255, 0.1);
}

@keyframes scoreBorderGlow {
    0%, 100% {
        opacity: 0.5;
        filter: blur(8px);
    }
    50% {
        opacity: 0.8;
        filter: blur(12px);
    }
}

@media (max-width: 768px) {
    .scores {
        flex-direction: column;
        gap: 1rem;
    }
    
    .stats {
        margin: 1.5rem auto;
        padding: 1rem;
        max-width: 90%;
    }
    
    .stats h2 {
        font-size: 1.2rem;
    }
    
    .stats p {
        font-size: 0.9rem;
        padding: 0.5rem;
        margin: 0.3rem 0;
    }
}
</style>