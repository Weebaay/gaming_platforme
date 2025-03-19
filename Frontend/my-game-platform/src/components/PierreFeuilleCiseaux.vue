<template>
  <div class="pfc-container">
    <nav class="navbar">
      <div class="navbar-brand">HolberGames</div>
      <router-link to="/home" class="home-link">
        <i class="fas fa-home"></i>
      </router-link>
    </nav>

    <div class="game-area">
      <div class="hologram-particles">
        <div v-for="n in 80" :key="n" class="holo-particle"></div>
      </div>

      <h1 class="holo-title">Pierre Feuille Ciseaux</h1>

      <!-- Mode de jeu selection -->
      <div v-if="!gameStarted" class="game-mode-selection">
        <h2>Choisissez un mode de jeu</h2>
        <div class="neon-buttons">
          <button @click="startGame('solo')" class="neon-button">
            Jouer contre l'IA
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

      <!-- Contenu du jeu existant -->
      <div v-else>
        <div class="score-display">
          <div class="score-container player">
            <div class="score-hologram">
              <span class="score-value">{{ victoires }}</span>
              <span class="score-label">JOUEUR</span>
            </div>
          </div>
          <div class="vs-hologram">VS</div>
          <div class="score-container computer">
            <div class="score-hologram">
              <span class="score-value">{{ defaites }}</span>
              <span class="score-label">{{ isMultiplayer ? 'ADVERSAIRE' : 'IA' }}</span>
            </div>
          </div>
        </div>

        <button @click="mettreScoreZero" class="reset-button">
          <span class="reset-icon">↺</span>
          <span class="reset-text">Réinitialiser le score</span>
          <div class="reset-ring"></div>
            </button>

        <div class="game-state" v-if="monChoix && (isMultiplayer ? true : choixIA)">
          <div class="player-choice">
            <div class="choice-display">
              <div class="hologram-symbol player">
                <span v-if="monChoix === 'pierre'">✊</span>
                <span v-if="monChoix === 'feuille'">✋</span>
                <span v-if="monChoix === 'ciseaux'">✌️</span>
              </div>
              <span class="choice-label">Votre choix</span>
            </div>
          </div>
          <div class="vs-animation">VS</div>
          <div class="ia-choice">
            <div class="choice-display">
              <div class="hologram-symbol ia">
                <span v-if="choixIA === 'pierre'">✊</span>
                <span v-if="choixIA === 'feuille'">✋</span>
                <span v-if="choixIA === 'ciseaux'">✌️</span>
              </div>
              <span class="choice-label">{{ isMultiplayer ? 'Choix Adversaire' : 'Choix de l\'IA' }}</span>
            </div>
          </div>
        </div>

        <div class="choices-container">
          <button 
            v-for="choice in ['pierre', 'feuille', 'ciseaux']" 
            :key="choice"
            @click="jouer(choice)"
            class="choice-btn"
            :class="[choice, { 
                disabled: isMultiplayer && (
                    (playerSymbol === 'X' && gameState !== 'player1Turn') ||
                    (playerSymbol === 'O' && gameState !== 'player2Turn') ||
                    waitingForOpponent ||
                    gameState === 'waitingForPlayer2'
                )
            }]"
            :disabled="isMultiplayer && (
                (playerSymbol === 'X' && gameState !== 'player1Turn') ||
                (playerSymbol === 'O' && gameState !== 'player2Turn') ||
                waitingForOpponent ||
                gameState === 'waitingForPlayer2'
            )"
          >
            <div class="hologram-symbol">
              <span v-if="choice === 'pierre'">✊</span>
              <span v-if="choice === 'feuille'">✋</span>
              <span v-if="choice === 'ciseaux'">✌️</span>
            </div>
            <div class="hologram-ring"></div>
            </button>
        </div>

        <div v-if="waitingForOpponent && gameState !== 'complete'" class="waiting-message">
          En attente du choix de l'adversaire...
        </div>

        <div v-if="victoiresConsecutives > 2" class="streak-counter">
          Série: {{ victoiresConsecutives }} 🔥
        </div>

        <div class="result-hologram" :class="{ 
          visible: resultatVisible,
          victoire: resultatPartie === 'Victoire !',
          defaite: resultatPartie === 'Défaite !',
          egalite: resultatPartie === 'Égalité !'
        }">
          <div class="result-content">{{ resultatPartie }}</div>
        </div>

        <!-- Effet spécial pour les séries -->
        <div v-if="showSpecialEffect" class="special-effect">
          <div class="special-text">INCROYABLE !</div>
          <div class="special-stars"></div>
        </div>

        <!-- Historique des coups -->
        <div class="history-container">
          <div class="history-title">Historique</div>
          <div class="history-list">
            <div v-for="(coup, index) in historique" 
                 :key="index" 
                 class="history-item"
                 :class="coup.resultat">
              <div class="history-symbols">
                <span class="history-player">
                  <span v-if="coup.joueur === 'pierre'">✊</span>
                  <span v-if="coup.joueur === 'feuille'">✋</span>
                  <span v-if="coup.joueur === 'ciseaux'">✌️</span>
                </span>
                <span class="history-vs">VS</span>
                <span class="history-ia">
                  <span v-if="coup.ia === 'pierre'">✊</span>
                  <span v-if="coup.ia === 'feuille'">✋</span>
                  <span v-if="coup.ia === 'ciseaux'">✌️</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="gameMessage" class="game-message">
          {{ gameMessage }}
        </div>
      </div>
    </div>
    </div>
</template>
  
<script>
import { computed, ref, onMounted, onUnmounted } from "vue";
import api from "../services/api";
import { decodeJWT } from '@/util/utils';
import { io } from 'socket.io-client';

export default {
  name: "PierreFeuilleCiseaux",
  setup() {
    const victoires = ref(0);
    const defaites = ref(0);
    const egalites = ref(0);
    const victoiresConsecutives = ref(0);
    const IA_ID = 0;
    const player1Id = ref(1);

    const monChoix = ref("");
    const choixIA = ref("");
    const resultatPartie = ref("");
    const resultatVisible = ref(false);
    const winnerId = ref(null);
    const historique = ref([]);
    const showSpecialEffect = ref(false);

    const gameStarted = ref(false);
    const isMultiplayer = ref(false);
    const isHost = ref(false);
    const showJoinInput = ref(false);
    const gameCode = ref("");
    const joinCode = ref("");
    const socket = ref(null);
    const playerSymbol = ref("X");
    const sessionID = ref("");
    const gameState = ref("");
    const gameMessage = ref("");
    const waitingForOpponent = ref(false);

    const userId =  computed(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = decodeJWT(token);
            if (decodedToken && decodedToken.userId) {
                return decodedToken.userId;
            }
        }
        return null;
    });

    // génere un sessionID
    const sessionId = 'S' + Math.random().toString(36).substring(2,15);
    localStorage.setItem("sessionId", sessionId);
    console.log("Session ID créé pour la partie:", sessionId)

      // Fonction pour enregistrer le résultat de la partie
        const saveGameResult = async (result, winnerId) => {
            try {
               console.log("Envoie des résultats :", {
                  game_name: "PierreFeuilleCiseaux",
                  player1_id: userId.value,
                  player2_id: IA_ID,
                   winner_id: winnerId === IA_ID ? IA_ID : userId.value,
                  result,
                 session_id: sessionId,
              });

             const response = await api.post("/game-sessions", {
                  game_name: "PierreFeuilleCiseaux",
                    player1_id: userId.value,
                  player2_id: IA_ID,
                 winner_id: winnerId === IA_ID ? IA_ID : userId.value,
                   result: result,
                   session_id: sessionId,
              });
               console.log("Partie enregistrée avec succès:", response.data);
            } catch (error) {
              console.error("Erreur lors de l'enregistrement de la partie:", error);
            }
          };

        const saveProgress = async () => {
            try {
                const progressData = {
                    victoires: victoires.value,
                    defaites: defaites.value,
                    egalites: egalites.value,
                    victoiresConsecutives: victoiresConsecutives.value
                };

                const gameId = 28;
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
                const gameId = 28; // ID du jeu Pierre-Feuille-Ciseaux
                const response = await api.get('/progress/get', {
                    params: {
                        user_id: userId.value,
                        game_id: gameId,
                    },
                });

                if (response.data && response.data.progress_data) {
                    const progressData = response.data.progress_data;
                    victoires.value = progressData.victoires || 0;
                    defaites.value = progressData.defaites || 0;
                    egalites.value = progressData.egalites || 0;
                    victoiresConsecutives.value = progressData.victoiresConsecutives || 0;
                    console.log('Progression récuperer avec succès.');
                } else {
                    console.log('Auune progression trouvée pour ce jeu.');
                }
            } catch (error) {
                console.error('Erreur lors de la récuperation de la progression :', error);
            }
        };

        // Choix de l'IA
        const choisirIA = () => {
            const choix = ["pierre", "feuille", "ciseaux"];
            return choix[Math.floor(Math.random() * choix.length)];
        };

        // Pour l'affichage du resultat
        const afficherResultat = () => {
            resultatVisible.value = true;
            setTimeout(() => {
                resultatVisible.value = false;
            }, 2000);
        };

        // Lancement du jeu
        const jouer = async (choice) => {
            if (isMultiplayer.value) {
                // Vérifier si c'est notre tour
                const isMyTurn = (playerSymbol.value === "X" && gameState.value === "player1Turn") ||
                               (playerSymbol.value === "O" && gameState.value === "player2Turn");
                
                if (!isMyTurn) {
                    alert("Ce n'est pas votre tour !");
                    return;
                }

                socket.value.emit('makeRPTurn', {
                    sessionId: sessionID.value,
                    choice: choice,
                    player: playerSymbol.value
                }, (response) => {
                    if (response.error) {
                        console.error('Erreur:', response.error);
                        alert(response.error);
                    } else {
                        monChoix.value = choice;
                        waitingForOpponent.value = true;
                    }
                });
            } else {
                monChoix.value = choice;
            choixIA.value = choisirIA();
            let result;
            let winnerId_ = null;

            if (monChoix.value === choixIA.value) {
                resultatPartie.value = "Égalité !";
                egalites.value++;
                result = 'égalité';
                winnerId_ = null
                victoiresConsecutives.value = 0;
                saveProgress();
            } else if (
                (monChoix.value === "pierre" && choixIA.value === "ciseaux") ||
                (monChoix.value === "feuille" && choixIA.value === "pierre") ||
                (monChoix.value === "ciseaux" && choixIA.value === "feuille")
            ) {
                resultatPartie.value = "Victoire !";
                victoires.value++;
                result = 'victoire';
                winnerId_ = userId.value;
                victoiresConsecutives.value++;
                saveProgress();
            } else {
                resultatPartie.value = "Défaite !";
                defaites.value++;
                result = 'défaite';
                winnerId_ = IA_ID;
                victoiresConsecutives.value = 0;
                 saveProgress();
            }
              
                // Ajouter le coup à l'historique
                historique.value.unshift({
                  joueur: monChoix.value,
                  ia: choixIA.value,
                  resultat: result,
                  timestamp: Date.now()
                });
                
                // Garder seulement les 5 derniers coups
                if (historique.value.length > 5) {
                  historique.value.pop();
                }

                // Animation spéciale pour 5 victoires consécutives
                if (victoiresConsecutives.value >= 5) {
                  showSpecialEffect.value = true;
                  setTimeout(() => {
                    showSpecialEffect.value = false;
                  }, 3000);
                }

           saveGameResult(result, winnerId.value);
           afficherResultat();
            }
        };

     const mettreScoreZero = () => {
            victoires.value = 0;
            defaites.value = 0;
            egalites.value = 0;
            victoiresConsecutives.value = 0;
          saveProgress()
           
        };

    onMounted(() => {
        socket.value = io('http://localhost:3000');
        
        socket.value.on('connect', () => {
          console.log('Connecté au serveur WebSocket avec l\'ID:', socket.value.id);
        });

        socket.value.on('disconnect', () => {
          console.log('Déconnecté du serveur WebSocket');
        });

        socket.value.on('gameStateUpdate', (data) => {
            gameState.value = data.gameState;
            gameMessage.value = data.message;
            
            // Réinitialiser les choix et l'état d'attente si on commence un nouveau tour
            if (data.gameState === "player1Turn") {
                monChoix.value = "";
                choixIA.value = "";
                resultatVisible.value = false;
                waitingForOpponent.value = false; // Réinitialiser l'état d'attente
            }
        });

        socket.value.on('updateRPSGame', (data) => {
            console.log('Mise à jour du jeu reçue:', data);
            
            if (data.gameState === "complete" && data.choices) {
                // Afficher les choix des deux joueurs
                if (playerSymbol.value === "X") {
                    monChoix.value = data.choices.player1;
                    choixIA.value = data.choices.player2;
                } else {
                    monChoix.value = data.choices.player2;
                    choixIA.value = data.choices.player1;
                }

                // Déterminer le résultat pour ce joueur
                if (data.winner === "draw") {
                    resultatPartie.value = "Égalité !";
                    egalites.value++;
                    victoiresConsecutives.value = 0;
                } else if (
                    (playerSymbol.value === "X" && data.winner === "player1") ||
                    (playerSymbol.value === "O" && data.winner === "player2")
                ) {
                    resultatPartie.value = "Victoire !";
                    victoires.value++;
                    victoiresConsecutives.value++;
                    
                    if (victoiresConsecutives.value >= 5) {
                        showSpecialEffect.value = true;
                        setTimeout(() => {
                            showSpecialEffect.value = false;
                        }, 3000);
                    }
                } else {
                    resultatPartie.value = "Défaite !";
                    defaites.value++;
                    victoiresConsecutives.value = 0;
                }

                // Ajouter à l'historique
                historique.value.unshift({
                    joueur: monChoix.value,
                    ia: choixIA.value,
                    resultat: resultatPartie.value === "Victoire !" ? "victoire" :
                             resultatPartie.value === "Défaite !" ? "defaite" : "egalite",
                    timestamp: Date.now()
                });

                // Garder seulement les 5 derniers coups
                if (historique.value.length > 5) {
                    historique.value.pop();
                }

                resultatVisible.value = true;
                waitingForOpponent.value = false; // Réinitialiser l'état d'attente à la fin de la manche

                setTimeout(() => {
                    resultatVisible.value = false;
                }, 2000);
            }
        });
    })

    const startGame = async (mode) => {
      gameStarted.value = true;
      
      if (mode === 'solo') {
        isMultiplayer.value = false;
        const sessionId = 'S' + Math.random().toString(36).substring(2, 15);
        sessionID.value = sessionId;
      } else if (mode === 'private') {
        isMultiplayer.value = true;
        isHost.value = true;
        playerSymbol.value = "X";
        gameState.value = "waitingForPlayer2";
        socket.value.emit('createRPSession', (sessionId) => {
          gameCode.value = sessionId;
          sessionID.value = sessionId;
          console.log("Session ID stocké:", sessionId);
          alert(`Code de la partie: ${sessionId}`);
        });
      }
    };

    const toggleJoinInput = () => {
      showJoinInput.value = !showJoinInput.value;
    };

    const joinGame = () => {
      if (!joinCode.value) {
        alert("Veuillez entrer un code de partie !");
        return;
      }

      socket.value.emit('joinRPSession', joinCode.value, (response) => {
        if (response.success) {
          gameStarted.value = true;
          isMultiplayer.value = true;
          playerSymbol.value = "O";
          sessionID.value = joinCode.value;
          gameState.value = "player1Turn";
          alert("Rejoint avec succès !");
        } else {
          alert(response.message || "Impossible de rejoindre cette partie.");
        }
      });
    };

    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect();
      }
    });

    return {
      monChoix,
      choixIA,
      resultatPartie,
      resultatVisible,
      victoires,
      defaites,
      egalites,
      victoiresConsecutives,
      player1Id,
      IA_ID,
      mettreScoreZero,
      jouer,
      userId,
      historique,
      showSpecialEffect,
      gameStarted,
      isMultiplayer,
      isHost,
      showJoinInput,
      gameCode,
      joinCode,
      startGame,
      toggleJoinInput,
      joinGame,
      gameState,
      gameMessage,
      waitingForOpponent
    };
  },
};
</script>
  
<style scoped>
.pfc-container {
  min-height: 100vh;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.navbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(90deg, 
    rgba(138, 43, 226, 0.9) 0%,
    rgba(0, 191, 255, 0.9) 50%,
    rgba(0, 255, 157, 0.9) 100%
  );
  box-shadow: 
    0 0 10px rgba(138, 43, 226, 0.5),
    0 0 20px rgba(0, 191, 255, 0.3),
    0 0 30px rgba(0, 255, 157, 0.2);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.navbar-brand {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

.home-link {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.home-link:hover {
  color: #00bfff;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
}

.game-area {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.hologram-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.holo-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  opacity: 0;
  border-radius: 50%;
  bottom: -10px;
  animation: floatParticle var(--duration, 8s) linear infinite;
  animation-delay: var(--delay, 0s);
  left: var(--left, 50%);
}

.holo-particle:nth-child(n) {
  --delay: calc(random() * 8s);
  --left: calc(random() * 100%);
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

.score-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  margin: 3rem 0;
}

.score-container {
  position: relative;
  width: 150px;
  height: 150px;
}

.score-hologram {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 191, 255, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(0, 191, 255, 0.3);
  animation: hologramPulse 2s ease-in-out infinite;
  backdrop-filter: blur(5px);
}

.score-value {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
}

.score-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2px;
  margin-top: 0.5rem;
}

.vs-hologram {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

.game-state {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4rem;
  margin: 2rem 0;
  padding: 2rem;
  background: rgba(0, 191, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

.choice-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.choice-label {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
}

.vs-animation {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(0, 191, 255, 0.6);
  animation: pulseVS 1.5s ease-in-out infinite;
}

.hologram-symbol.player {
  color: rgba(138, 43, 226, 0.9);
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(138, 43, 226, 0.6),
    0 0 30px rgba(138, 43, 226, 0.4);
}

.hologram-symbol.ia {
  color: rgba(0, 255, 157, 0.9);
  text-shadow: 
    0 0 10px rgba(0, 255, 157, 0.8),
    0 0 20px rgba(0, 255, 157, 0.6),
    0 0 30px rgba(0, 255, 157, 0.4);
}

.choices-container {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 4rem 0;
}

.choice-btn {
  position: relative;
  width: 120px;
  height: 120px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hologram-symbol {
  position: relative;
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(0, 191, 255, 0.6),
    0 0 30px rgba(0, 255, 157, 0.4);
  z-index: 2;
  transition: all 0.3s ease;
  animation: appearChoice 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.hologram-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 50%;
  animation: hologramRing 2s linear infinite;
}

.choice-btn:hover .hologram-symbol {
  transform: scale(1.2);
  color: #00bfff;
  text-shadow: 
    0 0 15px rgba(138, 43, 226, 1),
    0 0 25px rgba(0, 191, 255, 0.8),
    0 0 35px rgba(0, 255, 157, 0.6);
}

.choice-btn:hover .hologram-ring {
  border-color: rgba(0, 191, 255, 0.8);
  box-shadow: 
    0 0 10px rgba(0, 191, 255, 0.3),
    0 0 20px rgba(0, 191, 255, 0.2) inset;
}

.choice-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.choice-btn.disabled:hover .hologram-symbol {
  transform: none;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: none;
}

.choice-btn.disabled:hover .hologram-ring {
  border-color: rgba(0, 191, 255, 0.3);
  box-shadow: none;
  transform: none;
}

.result-hologram {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: rgba(0, 191, 255, 0.1);
  padding: 2rem 4rem;
  border-radius: 15px;
  border: 2px solid rgba(0, 191, 255, 0.3);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 20px rgba(138, 43, 226, 0.3),
    0 0 40px rgba(0, 191, 255, 0.2),
    0 0 60px rgba(0, 255, 157, 0.1);
  --result-color: rgba(0, 191, 255, 0.8);
}

.result-hologram.visible {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.result-hologram.victoire {
  --result-color: rgba(0, 255, 157, 0.8);
}

.result-hologram.defaite {
  --result-color: rgba(255, 99, 71, 0.8);
}

.result-hologram.egalite {
  --result-color: rgba(255, 223, 0, 0.8);
}

.result-content {
  font-size: 2.5rem;
  color: var(--result-color);
  text-shadow: 
    0 0 10px var(--result-color),
    0 0 20px var(--result-color),
    0 0 30px var(--result-color);
  letter-spacing: 2px;
}

@keyframes hologramPulse {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(138, 43, 226, 0.3),
      0 0 30px rgba(0, 191, 255, 0.2),
      0 0 45px rgba(0, 255, 157, 0.1);
  }
  50% {
    box-shadow: 
      0 0 25px rgba(138, 43, 226, 0.4),
      0 0 50px rgba(0, 191, 255, 0.3),
      0 0 75px rgba(0, 255, 157, 0.2);
  }
}

@keyframes hologramRing {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

@keyframes pulseVS {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
  transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes appearChoice {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
      opacity: 1;
    transform: translateY(0);
  }
}

/* Ajustements responsifs */
@media (max-width: 768px) {
  .choices-container {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .score-display {
    flex-direction: column;
    gap: 1.5rem;
  }

  .score-container {
    width: 120px;
    height: 120px;
  }

  .score-value {
    font-size: 2.5rem;
  }

  .game-state {
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
  }

  .vs-animation {
    font-size: 2rem;
  }
}

.reset-button {
  position: relative;
  background: transparent;
  border: none;
  padding: 1rem 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  cursor: pointer;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.reset-icon {
  font-size: 1.5rem;
  animation: spin 4s linear infinite;
}

.reset-text {
  letter-spacing: 2px;
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.5),
    0 0 20px rgba(0, 191, 255, 0.3);
}

.reset-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 30px;
  transition: all 0.3s ease;
}

.reset-button:hover {
  color: #00bfff;
}

.reset-button:hover .reset-ring {
  border-color: rgba(0, 191, 255, 0.8);
  box-shadow: 
    0 0 10px rgba(138, 43, 226, 0.3),
    0 0 20px rgba(0, 191, 255, 0.2),
    0 0 30px rgba(0, 255, 157, 0.1);
  transform: scale(1.05);
}

.reset-button:hover .reset-text {
  text-shadow: 
    0 0 15px rgba(138, 43, 226, 0.8),
    0 0 25px rgba(0, 191, 255, 0.6);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Ajout à la section responsive */
@media (max-width: 768px) {
  .reset-button {
    font-size: 1rem;
    padding: 0.8rem 1.5rem;
  }
  
  .reset-icon {
    font-size: 1.2rem;
  }
}

/* Correction de l'animation des particules */
@keyframes floatParticle {
  0% {
    transform: translateY(100vh);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-10vh);
    opacity: 0;
  }
}

/* Style pour l'historique */
.history-container {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 191, 255, 0.05);
  padding: 1rem;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(0, 191, 255, 0.3);
  width: 200px;
}

.history-title {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  padding: 0.5rem;
  border-radius: 10px;
  background: rgba(0, 191, 255, 0.1);
  transition: all 0.3s ease;
}

.history-item.victoire {
  border-left: 3px solid rgba(0, 255, 157, 0.8);
}

.history-item.defaite {
  border-left: 3px solid rgba(255, 99, 71, 0.8);
}

.history-item.egalite {
  border-left: 3px solid rgba(255, 223, 0, 0.8);
}

.history-symbols {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.5rem;
}

.history-vs {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Style pour l'effet spécial */
.special-effect {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: specialEffectBg 3s ease-out forwards;
}

.special-text {
  font-size: 4rem;
  color: #fff;
  text-shadow: 
    0 0 20px rgba(138, 43, 226, 1),
    0 0 40px rgba(0, 191, 255, 1),
    0 0 60px rgba(0, 255, 157, 1);
  animation: specialTextEffect 3s ease-out forwards;
  z-index: 101;
}

.special-stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle, transparent 20%, #1a1a1a 90%),
    repeating-linear-gradient(0deg, 
      rgba(138, 43, 226, 0.2) 0%, 
      rgba(0, 191, 255, 0.2) 33%, 
      rgba(0, 255, 157, 0.2) 66%
    );
  animation: specialStars 3s ease-out forwards;
  z-index: 99;
}

@keyframes specialEffectBg {
  0% {
    background: transparent;
  }
  20% {
    background: rgba(0, 0, 0, 0.8);
  }
  80% {
    background: rgba(0, 0, 0, 0.8);
  }
  100% {
    background: transparent;
  }
}

@keyframes specialTextEffect {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  20% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  80% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
}

@keyframes specialStars {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    transform: scale(1.5) rotate(180deg);
    opacity: 1;
  }
  80% {
    transform: scale(1.5) rotate(360deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(540deg);
    opacity: 0;
  }
}

/* Ajustements responsifs */
@media (max-width: 768px) {
  .history-container {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    width: 100%;
    margin-top: 2rem;
  }

  .special-text {
    font-size: 3rem;
  }
}

/* Styles pour la sélection du mode de jeu */
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

.join-section, .host-section {
  margin-top: 2rem;
}

.code {
  font-size: 2rem;
  font-weight: bold;
  color: #8a2be2;
  text-shadow: 
      0 0 10px #8a2be2,
      0 0 20px #8a2be2;
  margin: 1rem 0;
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

.waiting-message {
  text-align: center;
  margin: 2rem 0;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
      opacity: 1;
  }
}

.game-message {
  text-align: center;
  margin: 1rem 0;
  font-size: 1.2rem;
  color: #00bfff;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
  }
</style>
  