<template>
    <div class="morpion">
        <h1>Morpion Games 2.0</h1>
        <div v-if="!gameStarted">
            <h2>Choisissez un mode de jeu</h2>
            <button @click="startGame('solo')">Jouer en Solo contre l'IA</button>
            <button @click="startGame('private')">Créer une Partie Privée</button>
            <button @click="startGame('free')">Free Partie (Local)</button>

            <button @click="toggleJoinInput">Rejoindre une Partie</button>

            <div v-if="showJoinInput">
                <input v-model="joinCode" placeholder="Entrez le code de la partie" />
                <button @click="joinGame">Rejoindre</button>
            </div>
            <div v-if="isHost">
                <p>Partagez ce code avec votre ami pour qu'il rejoigne :</p>
                <p class="code">{{ gameCode }}</p>
            </div>
        </div>

		<div v-else>
			<p v-if="!winner && !isMultiplayer">Joueur actuel : {{ currentPlayer }}</p>
			<p v-else-if="!winner && isMultiplayer">Tour du Joueur : {{ currentPlayer }}</p>
			<p v-else>{{ winner }}</p>
            <div class="grid">
                <div v-for="(cell, index) in grid" :key="index" class="cell" :class="{ taken: cell }"
                    @click="!cell && makeMove(index)">
                    {{ cell }}
                </div>
            </div>
            <button @click="resetGame">Réinitialiser</button>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onUnmounted, onMounted } from "vue";
import api from "../services/api";

export default {
    name: "MorpionGame2",
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
        let sse = null;

        onMounted(() => {
            // recupere le nom d'utilisateur depuis le localStorage lors du montage de composant
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                currentPlayer.value = storedUsername;
				console.log("Nom d'utiisateur récuperé : ", currentPlayer.value);
            }
        });

        const listenToUpdates = (sessionId) => {
            sse = new EventSource(`http://localhost:3000/api/sse/connect?sessionId=${sessionId}`);

            sse.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("SSE message reçu :", data);

                if (data.sessionId === sessionId) {
                    for (let i = 0; i < 9; i++) {
                        grid[i] = data.grid[i];
                    }
                    if (data.winner) {
                        winner.value = `Le joueur ${data.winner} a gagné !`;
                    }
                    if (data.draw) {
                        winner.value = "Match nul !";
                    }
                    if (data.currentPlayer && data.currentPlayer !== playerSymbol.value) {
                        currentPlayer.value = data.currentPlayer;
                    }

                }
            };

            sse.onerror = () => {
                console.error("Erreur SSE : impossible de se connecter au serveur");
                sse.close();
            };
        };

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
                localStorage.setItem('sessionId', sessionId);
                console.log("session ID stocker pour le mode solo :", sessionId);
            } else if (mode === "private") {
                isMultiplayer.value = true;
                isHost.value = true;
                playerSymbol.value = "X"; // Premier Joueur commence
                try {
                    const response = await api.post("/sessions/create");
                    gameCode.value = response.data.sessionId;
                    localStorage.setItem('sessionId', gameCode.value);
                    console.log("Session ID stocké :", gameCode.value);
                    listenToUpdates(gameCode.value);
                    alert(`Code de la partie : ${gameCode.value}`);
                } catch (error) {
                    console.error("Erreur lors de la création de la session :", error);
                    alert("Impossible de créer une partie. Veuillez réessayer.");
                }
            } else if (mode === "free") {
                freeMode.value = true; // Mode local
                const sessionsId = 'F' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('sessionsId', sessionsId);
                console.log("session Id stocker pour le mode free :", sessionsId); 
            }

            if (aiEnabled.value && currentPlayer.value === "O") {
                setTimeout(makeAIMove, 500);
            }
        };

        // Rejoindre une partie via un code d'invitation
        const joinGame = async () => {
            if (!joinCode.value) {
                alert("Veuillez entrer un code de partie !");
                return;
            }
            try {
                const response = await api.post("/sessions/join", {
                    sessionId: joinCode.value,
                    username: "Player2",
                });
                if (response.data.success) {
                    gameStarted.value = true;
                    playerSymbol.value = "O"; // L'invité joue "O"
                    isMultiplayer.value = true;
                    isHost.value = false;
                    listenToUpdates(joinCode.value);
                    alert("Rejoint avec succès !");
                }
            } catch (error) {
                console.error("Erreur lors de la tentative de rejoindre la session :", error);
                alert("Impossible de rejoindre cette partie. Vérifiez le code ou l'état de la session.");
            }
        };

        // Gérer un mouvement
        const makeMove = async (index) => {
            // Vérifier que la case est vide, qu'il n'y a pas de gagnant, et que c'est au tour du joueur
            if (
                !grid[index] &&
                !winner.value &&
                (currentPlayer.value === playerSymbol.value || !isMultiplayer.value)
            ) {
                try {
                    if (isMultiplayer.value) {
                        // En mode multijoueur, envoyer la demande au backend
                        console.log("isHost:", isHost.value, "gameCode:", gameCode.value, "joinCode:", joinCode.value);
                        const response = await api.post("/sessions/move", {
                            sessionId: isHost.value ? gameCode.value : joinCode.value,
                            index,
                            player: playerSymbol.value,
                        });

                        // Attendre la résolution de la promesse avant de continuer
                        await response;

                        console.log("Mouvement envoyé au serveur, attente de la mise à jour SSE.");
                    } else {
                        // En mode solo ou local
                        grid[index] = currentPlayer.value;

                        if (checkWinner(grid, currentPlayer.value)) {
                            const winnerId = currentPlayer.value === "X"
                                ? player1Id.value
                                : aiEnabled.value
                                ? IA_ID
                                : player2Id.value;
                            winner.value = winnerId === IA_ID ? "L'IA a gagné !" : `Le joueur ${winnerId} a gagné !`;
                            const result = 'victoire';
                            // Enregistrement du résultat après que le gagnant est déterminé
                            await saveGameResult("Morpion", result, winnerId);
                            return;
                        }

                        if (!grid.includes("")) {
                            winner.value = "Match nul !";
                            // Enregistrement du résultat en cas d'égalité
                            await saveGameResult("Morpion", "égalité", null);
                            return;
                        }

                        // Passer au joueur suivant
                        currentPlayer.value = currentPlayer.value === "X" ? "O" : "X";

                        // Si l'IA est activée et c'est au tour de l'IA
                        if (aiEnabled.value && currentPlayer.value === "O") {
                            setTimeout(makeAIMove, 500); // Déclencher un mouvement IA après un court délai
                        }
                    }
                } catch (error) {
                    // Gestion des erreurs
                    console.error("Erreur lors de l'envoi du mouvement :", error);
                    if (error.response && error.response.data && error.response.data.error) {
                        alert(error.response.data.error); // Afficher le message d'erreur renvoyé par le backend
                    } else {
                        alert("Impossible d'envoyer votre mouvement. Veuillez réessayer.");
                    }
                }
            } else {
                // Alerter le joueur si ce n'est pas son tour ou si la case est déjà prise
                if (grid[index]) {
                    alert("Cette case est déjà prise !");
                } else if (winner.value) {
                    alert("La partie est terminée !");
                } else if (isMultiplayer.value && currentPlayer.value !== playerSymbol.value) {
                    alert("Ce n'est pas votre tour !")
                }
            }
        };

        const saveGameResult = async (gameName, result, winnerId) => {
            const sessionId = localStorage.getItem("sessionId");
            console.log("Session ID récupéré :", sessionId);
            try {
                console.log("Envoie des résultat :", {
                    game_name: gameName,
                    player1_id: player1Id.value,
                    player2_id: aiEnabled.value ? IA_ID : player2Id.value,
                    winner_id: winnerId,
                    result,
                    session_id: sessionId,
                });

                const response = await api.post("/game-sessions", {
                    game_name: gameName,
                    player1_id: player1Id.value,
                    player2_id: aiEnabled.value ? IA_ID : player2Id.value,
                    winner_id: winnerId,
                    result,
                    session_id: sessionId,
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
            await makeMove(availableMoves[randomIndex]);
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

        // Réinitialiser la partie
        const resetGame = () => {
            if (sse) {
                sse.close();
                sse = null;
            }
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
        };

        onUnmounted(() => {
            if (sse) sse.close();
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
            listenToUpdates,
            startGame,
            toggleJoinInput,
            joinGame,
            makeMove,
            resetGame,
            player1Id,
            player2Id,
            IA_ID,
        };
    },
};
</script>
  
<style scoped>
    .morpion {
        text-align: center;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        max-width: 300px;
        margin: 20px auto;
    }

    .cell {
        border: 1px solid #000;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
    }

    .taken {
        background: #f0f0f0;
    }

    .code {
        font-weight: bold;
        font-size: 18px;
        color: #2c3e50;
    }

    .winner {
        font-weight: bold;
        font-size: 20px;
        margin: 20px 0;
        color: #2ecc71;
    }
</style>