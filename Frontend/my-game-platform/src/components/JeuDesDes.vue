<template>
    <div class="jeu-des-des">
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
  
        <!-- Historique -->
        <h2>Historique des parties</h2>
        <ul>
          <li v-for="(entry, index) in history" :key="index">{{ entry }}</li>
        </ul>
  
        <!-- Recommencer -->
        <button @click="resetGame">Recommencer</button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive } from "vue";
import api from "../services/api";

export default {
  name: "JeuDesDes",
  setup() {
    const gameStarted = ref(false);
    const mode = ref(""); // "ia" ou "local"
    const turn = ref("player"); // "player" ou "opponent"
    const rolling = ref(false); // Si le dé est en cours de roulement
    const playerRoll = ref(null); // Résultat pour Joueur 1
    const opponentRoll = ref(null); // Résultat pour Joueur 2 ou l'IA
    const scores = reactive({ player: 0, opponent: 0 }); // Scores des joueurs
    const history = reactive([]); // Historique des parties
    const winner = ref(""); // Résultat de la manche
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
      const player1Id = ref(1);
      const IA_ID = 0;

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

    const startGame = (selectedMode) => {
      mode.value = selectedMode;
      gameStarted.value = true;
      resetGame();
    };

    const rollDie = async (player) => {
      rolling.value = true;

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
    };

     const determineWinner = () => {
            let result;
             let winnerId = null;
           if (playerRoll.value > opponentRoll.value) {
                 winner.value = "Joueur 1 gagne !";
                scores.player++;
             result = 'victoire';
                 winnerId = player1Id.value;
        } else if (playerRoll.value < opponentRoll.value) {
                winner.value = mode.value === "local" ? "Joueur 2 gagne !" : "L'IA gagne !";
                scores.opponent++;
                 result = 'défaite';
                 winnerId = IA_ID;
            } else {
                 winner.value = "Égalité !";
                result = 'égalité';
            }
          saveGameResult(result,winnerId);
       history.unshift(winner.value);
      if (history.length > 10) history.pop();

         // Préparer le prochain tour
            if (mode.value === "local") {
            setTimeout(() => resetTurnForLocal(), 2000);
        }
    };
    
    const resetTurnForLocal = () => {
         playerRoll.value = null;
            opponentRoll.value = null;
            playerDieImage.value = "";
           opponentDieImage.value = "";
        winner.value = "";
      turn.value = "player";
    };


    const resetGame = () => {
        playerRoll.value = null;
        opponentRoll.value = null;
        playerDieImage.value = "";
        opponentDieImage.value = "";
      winner.value = "";
      turn.value = "player";
      scores.player = 0;
      scores.opponent = 0;
      history.length = 0;
    };

    return {
      gameStarted,
      mode,
      turn,
      rolling,
      playerRoll,
      opponentRoll,
      scores,
      history,
      winner,
      dieFaces,
      playerDieImage,
      opponentDieImage,
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
  