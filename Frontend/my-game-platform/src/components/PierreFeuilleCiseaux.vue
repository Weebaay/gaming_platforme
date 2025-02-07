<template>
    <div class="pierre-feuille-ciseaux">
      <h1>Pierre Feuille Ciseaux</h1>
  
      <!-- Boutons pour jouer -->
      <div>
        <button @click="jouer('pierre')">
          <img src="/images/point.png" alt="Pierre" width="100" height="100" />
        </button>
        <button @click="jouer('feuille')">
          <img src="/images/main(feuille).png" alt="Feuille" width="100" height="100" />
        </button>
        <button @click="jouer('ciseaux')">
          <img src="/images/_ciseaux.png" alt="Ciseaux" width="100" height="100" />
        </button>
      </div>
  
      <!-- Résultat -->
      <p :class="{ 'js-resultat': true, visible: resultatVisible }">{{ resultatPartie }}</p>
  
      <!-- Choix utilisateur et IA -->
      <div class="choice-container">
        <div :class="{ choice: true, visible: choixUtilisateurVisible }">Votre choix: {{ monChoix }}</div>
        <div :class="{ vs: true, visible: vsVisible }">VS</div>
        <div :class="{ choice: true, visible: choixIAVisible }">Choix de l'IA: {{ choixIA }}</div>
      </div>
  
      <!-- Score -->
      <p class="js-score">Victoires: {{ score.victoires }} | Défaites: {{ score.defaites }} | Égalités: {{ score.egalites }}</p>
  
      <!-- Recommencer -->
      <button @click="mettreScoreZero">Recommencer</button>
  
      <!-- Historique -->
      <h2>Historique des 10 dernières parties</h2>
      <div class="js-historique">
        <table>
          <thead>
            <tr>
              <th>Joueur</th>
              <th>IA</th>
              <th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in historique" :key="index">
              <td>{{ item.choixUtilisateur }}</td>
              <td>{{ item.choixIA }}</td>
              <td>{{ item.resultat }}</td>
            </tr>
          </tbody>
        </table>
      </div>
        <button @click="reinitialiserHistorique">Réinitialiser l'historique</button>
    </div>
  </template>
  
<script>
import { reactive, ref, onMounted } from "vue";
import api from "../services/api";

export default {
  name: "PierreFeuilleCiseaux",
  setup() {
    const score = reactive({ victoires: 0, defaites: 0, egalites: 0 });
    const historique = reactive([]);
    const player1Id = ref(1);
    const player2Id = 0;
    const IA_ID = 0;

    const monChoix = ref("");
    const choixIA = ref("");
    const resultatPartie = ref("");
    const resultatVisible = ref(false);
    const choixUtilisateurVisible = ref(false);
    const choixIAVisible = ref(false);
    const vsVisible = ref(false);

    // génere un sessionID
    const sessionId = 'S' + Math.random().toString(36).substring(2,15);
    localStorage.setItem("sessionId", sessionId);
    console.log("Session ID créé pour la partie:", sessionId)

    // Fonction pour enregistrer le résultat de la partie
    const saveGameResult = async (result, winnerId) => {
      try {
        console.log("Envoie des résultats :", {
          game_name: "PierreFeuilleCiseaux",
          player1_id: player1Id.value,
          player2_id: IA_ID.value,
          winner_id: winnerId,
          result,
          session_id: sessionId,
        });
        const response = await api.post("/game-sessions", {
          game_name: "PierreFeuilleCiseaux",
          player1_id: player1Id.value,
          player2_id: IA_ID.value,
          winner_id: winnerId,
          result: result,
          session_id: sessionId,
        });
        console.log("Partie enregistrée avec succès:", response.data);
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la partie:", error);
      }
    };

    // Récupérer les données depuis localStorage
    const chargerDonnees = () => {
      const savedScore = JSON.parse(localStorage.getItem("score"));
      if (savedScore) Object.assign(score, savedScore);

      const savedHistorique = JSON.parse(localStorage.getItem("historique"));
      if (savedHistorique) historique.splice(0, historique.length, ...savedHistorique);
    };
    // Mise à jour du score
    const miseAJourScore = () => {
      localStorage.setItem("score", JSON.stringify(score));
    };

    // Mise à zéro du score
    const mettreScoreZero = () => {
      score.victoires = 0;
      score.defaites = 0;
      score.egalites = 0;
      localStorage.removeItem("score");
    };
    // Choix de l'IA
    const choisirIA = () => {
      const choix = ["pierre", "feuille", "ciseaux"];
      return choix[Math.floor(Math.random() * choix.length)];
    };

    // Pour l'affichage du resultat
    const afficherResultat = () => {
      resultatVisible.value = false;
      void resultatPartie.value;
      resultatVisible.value = true;
    };

    // Lancement du jeu
    const jouer = (monChoix_) => {
      monChoix.value = monChoix_;
      choixIA.value = choisirIA();
       let result;

      if (monChoix.value === choixIA.value) {
        resultatPartie.value = "Égalité !";
        score.egalites++;
          result = 'égalité';
      } else if (
        (monChoix.value === "pierre" && choixIA.value === "ciseaux") ||
        (monChoix.value === "feuille" && choixIA.value === "pierre") ||
        (monChoix.value === "ciseaux" && choixIA.value === "feuille")
      ) {
        resultatPartie.value = "Victoire !";
        score.victoires++;
         result = 'victoire';
      } else {
        resultatPartie.value = "Défaite !";
        score.defaites++;
           result = 'défaite';
      }
      saveGameResult(result, winnerId);
      miseAJourScore();
      afficherResultat();
       ajouterHistorique(resultatPartie.value, monChoix.value, choixIA.value);
         // Animation des choix
            choixUtilisateurVisible.value = false;
            choixIAVisible.value = false;
            vsVisible.value = false;
        setTimeout(() => {
            choixUtilisateurVisible.value = true;
            vsVisible.value = true;
            choixIAVisible.value = true;
        }, 100);
    };

    // Ajouter l'historique de la partie
    const ajouterHistorique = (resultat, choixUtilisateur, choixIA_) => {
      historique.push({ choixUtilisateur, choixIA: choixIA_, resultat });
      if (historique.length > 10) historique.shift();
      localStorage.setItem("historique", JSON.stringify(historique));
    };
    // Réinitialiser l'historique
    const reinitialiserHistorique = () => {
      historique.splice(0, historique.length);
      localStorage.removeItem("historique");
    };

    onMounted(() => {
      chargerDonnees();
    });

    return {
      score,
      historique,
      monChoix,
      choixIA,
      resultatPartie,
      resultatVisible,
      choixUtilisateurVisible,
      choixIAVisible,
      vsVisible,
      player1Id,
      player2Id,
      IA_ID,
      miseAJourScore,
      mettreScoreZero,
      jouer,
      reinitialiserHistorique,
    };
  },
};
</script>
  
  <style scoped>
  body {
    background-color: #33e3ea;
    color: #28039a;
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  }
  
  button {
    background-color: #28039a;
    color: white;
    border: none;
    padding: 15px 32px;
    font-size: 16px;
    margin: 10px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  button:hover {
    background-color: #048e26;
    transform: scale(1.1);
  }
  
  .js-resultat {
    opacity: 0;
    font-size: 16px;
    font-weight: bold;
    transition: opacity 0.5s, transform 0.5s;
  }
  
  .js-resultat.visible {
    opacity: 1;
    font-size: 30px;
    transform: scale(1.1);
  }
  </style>
  