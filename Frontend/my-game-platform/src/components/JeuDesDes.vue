<template>
    <div class="jeu-des-des">
      <UserProfile />
      <h1>Jeu des Dés</h1>
  
      <!-- Mode de jeu -->
      <div v-if="!gameStarted">
        <h2>Choisissez un mode de jeu</h2>
        <button @click="startGame('ia')">Jouer contre l'IA</button>
        <button @click="startGame('local')">Mode Local</button>
      </div>
  
      <!-- Partie en cours -->
      <div v-else>
        <h2 v-if="winner">{{ winner }}</h2>
  
        <!-- Joueurs -->
        <div class="players">
          <div>
            <h3>Joueur 1</h3>
            <img :src="playerDieImage" alt="Dé" class="die" v-if="playerRoll" />
            <p v-if="playerRoll">Résultat : {{ playerRoll }}</p>
          </div>
          <div>
            <h3 v-if="mode === 'local'">Joueur 2</h3>
            <h3 v-else>IA</h3>
            <img :src="opponentDieImage" alt="Dé" class="die" v-if="opponentRoll" />
            <p v-if="opponentRoll">Résultat : {{ opponentRoll }}</p>
          </div>
        </div>
  
        <!-- Lancer de dé -->
        <button v-if="!rolling && turn === 'player'" @click="rollDie('player')">Lancer le dé</button>
        <button
          v-if="!rolling && turn === 'opponent' && mode === 'local'"
          @click="rollDie('opponent')"
        >
          Lancer pour Joueur 2
        </button>
  
        <!-- Scores -->
        <h2>Scores</h2>
        <p>Joueur 1 : {{ scores.player }}</p>
        <p>{{ mode === 'local' ? 'Joueur 2' : 'IA' }} : {{ scores.opponent }}</p>
  
        <!-- Statistiques -->
        <h2>Statistiques</h2>
        <p>Nombre de lancers : {{ nombreLancers }}</p>
        <p>Victoires contre l'IA : {{ victoiresIA }}</p>
        <p>Victoires en mode local : {{ victoiresLocal }}</p>
        <p>Victoires consécutives : {{ victoiresConsecutives }}</p>
  
        <!-- Recommencer -->
        <button @click="resetGame">Recommencer</button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, onMounted } from "vue";
  import api from "../services/api";
  import UserProfile from './UserProfile.vue';
  
  export default {
    name: "JeuDesDes",
    components: {
      UserProfile,
    },
    setup() {
      // Déclaration des variables réactives pour les statistiques
      const nombreLancers = ref(0);
      const victoiresIA = ref(0);
      const victoiresLocal = ref(0);
      const victoiresConsecutives = ref(0);
  
      // Autres variables réactives
      const gameStarted = ref(false);
      const mode = ref(""); // "ia" ou "local"
      const turn = ref("player"); // "player" ou "opponent"
      const rolling = ref(false); // Si le dé est en cours de roulement
      const playerRoll = ref(null); // Résultat pour Joueur 1
      const opponentRoll = ref(null); // Résultat pour Joueur 2 ou l'IA
      const scores = reactive({ player: 0, opponent: 0 }); // Scores des joueurs
      const winner = ref(""); // Résultat de la manche
      const player1Id = ref(1);
      const player2Id = ref(0);
      const IA_ID = null;
  
      const dieFaces = [
        "/images/die1.png",
        "/images/die2.png",
        "/images/die3.png",
        "/images/die4.png",
        "/images/die5.png",
        "/images/die6.png",
      ];
      const playerDieImage = ref(""); // Image actuelle pour Joueur 1
      const opponentDieImage = ref(""); // Image actuelle pour Joueur 2 ou l'IA
  
      onMounted(() => {
        loadProgress(); // Charger la progression au montage
      });
  
        // Fonction pour enregistrer le résultat de la partie
      const saveGameResult = async (result,winnerId) => {
          try {
             console.log("Envoie des résultats :", {
               game_name: "JeuDesDes",
               player1_id: player1Id.value,
               player2_id: IA_ID,
               winner_id: winnerId,
                result,
              });
  
            const response = await api.post("/game-sessions", {
             game_name: "JeuDesDes",
              player1_id: player1Id.value,
              player2_id: IA_ID,
              winner_id: winnerId,
              result: result,
            });
             console.log("Partie enregistrée avec succès:", response.data);
          } catch (error) {
            console.error("Erreur lors de l'enregistrement de la partie:", error);
          }
        };
  
      // Fonction pour sauvegarder la progression du joueur
      const saveProgress = async () => {
        try {
          const progressData = {
            nombreLancers: nombreLancers.value,
            victoiresIA: victoiresIA.value,
            victoiresLocal: victoiresLocal.value,
            victoiresConsecutives: victoiresConsecutives.value,
          };
  
          const gameId = 29;
          await api.post('/progress/save', {
            game_id: gameId,
            progress_data: progressData,
          });
  
          console.log('Progression sauvegardée avec succès.');
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la progression :', error);
        }
      };
  
      // Fonction pour charger la progression du joueur
      const loadProgress = async () => {
        try {
          const gameId = 29;
          const response = await api.get('/progress/get', {
            params: {
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
  
      // Démarre une nouvelle partie
      const startGame = (selectedMode) => {
        mode.value = selectedMode;
        gameStarted.value = true;
        resetGame(); // Réinitialiser les statistiques au début d'une nouvelle partie
      };
  
      // Lance le dé pour un joueur
      const rollDie = async (player) => {
        rolling.value = true;
        nombreLancers.value++; // Incrémenter le nombre de lancers
  
        // Animation du dé
        const interval = setInterval(() => {
          if (player === "player") {
            playerDieImage.value = dieFaces[Math.floor(Math.random() * 6)];
          } else {
            opponentDieImage.value = dieFaces[Math.floor(Math.random() * 6)];
          }
        }, 100);
  
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simule le roulement
  
        clearInterval(interval); // Arrête l'animation
  
        // Calculer le résultat
        const roll = Math.floor(Math.random() * 6) + 1;
        if (player === "player") {
          playerRoll.value = roll;
          playerDieImage.value = dieFaces[roll - 1];
          if (mode.value === "local") {
            turn.value = "opponent"; // Passe au Joueur 2
          } else {
            setTimeout(() => rollDie("opponent"), 2000); // L'IA joue automatiquement
          }
        } else {
          opponentRoll.value = roll;
          opponentDieImage.value = dieFaces[roll - 1];
          determineWinner(); // Détermine le gagnant après le tour de l'opponent
        }
        rolling.value = false;
        saveProgress(); // Sauvegarder la progression après chaque lancer
      };
  
       const determineWinner = () => {
              let result;
               let winnerId = null;
             if (playerRoll.value > opponentRoll.value) {
                  winner.value = "Joueur 1 gagne !";
                  scores.player++;
                  result = 'victoire';
                  winnerId = player1Id.value;
                  victoiresConsecutives.value++;
          } else if (playerRoll.value < opponentRoll.value) {
                  winner.value = mode.value === "local" ? "Joueur 2 gagne !" : "L'IA gagne !";
                  scores.opponent++;
                   result = 'défaite';
                   winnerId = IA_ID;
                   if (mode.value === 'ia') {
                      victoiresIA.value++;
                   }
                   victoiresConsecutives.value = 0;
              } else {
                  winner.value = "Égalité !";
                  result = 'égalité';
                  victoiresConsecutives.value = 0;
              }
              if (mode.value === "local" && playerRoll.value > opponentRoll.value) {
                  victoiresLocal.value++;
                }
            saveGameResult(result,winnerId);
          };
  
      // Réinitialise la partie
      const resetGame = () => {
        playerRoll.value = null;
        opponentRoll.value = null;
        playerDieImage.value = "";
        opponentDieImage.value = "";
        winner.value = "";
        turn.value = "player";
        scores.player = 0;
        scores.opponent = 0;
        nombreLancers.value = 0;
        victoiresIA.value = 0;
        victoiresLocal.value = 0;
        victoiresConsecutives.value = 0;
        saveProgress(); // Sauvegarder la progression après la réinitialisation
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
        dieFaces,
        playerDieImage,
        opponentDieImage,
        nombreLancers,
        victoiresIA,
        victoiresLocal,
        victoiresConsecutives,
          player1Id,
          IA_ID,
        startGame,
        rollDie,
        resetGame,
      };
    },
  };
  </script>
  
  <style scoped>
  .jeu-des-des {
    text-align: center;
  }
  
  .players {
    display: flex;
    justify-content: space-around;
    margin: 20px 0;
  }
  
  .die {
    width: 100px;
    height: 100px;
    animation: roll 1s linear infinite;
  }
  
  @keyframes roll {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  </style>