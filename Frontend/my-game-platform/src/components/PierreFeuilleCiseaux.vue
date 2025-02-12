<template>
    <div class="pierre-feuille-ciseaux">
        <UserProfile />
        <p>User ID: {{ userId }}</p>

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
            <div class="choice">Votre choix: {{ monChoix }}</div>
            <div class="vs">VS</div>
            <div  class="choice">Choix de l'IA: {{ choixIA }}</div>
        </div>

        <!-- Score -->
        <p class="js-score">Victoires: {{ victoires }} | Défaites: {{ defaites }} | Égalités: {{ egalites }}</p>
        <p class="js-score">Victoires consécutives: {{ victoiresConsecutives }}</p>

        <!-- Recommencer -->
        <button @click="mettreScoreZero">Recommencer</button>

        <!-- Statistiques -->
        <h2>Statistiques</h2>
        <table>
            <thead>
                <tr>
                    <th>Statistique</th>
                    <th>Valeur</th>
                </tr>
                </thead>
            <tbody>
                <tr>
                    <td>Victoires</td>
                    <td>{{ victoires }}</td>
                </tr>
                <tr>
                    <td>Défaites</td>
                    <td>{{ defaites }}</td>
                </tr>
                <tr>
                    <td>Égalités</td>
                    <td>{{ egalites }}</td>
                </tr>
                <tr>
                    <td>Victoires consécutives</td>
                    <td>{{ victoiresConsecutives }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
  
<script>
import { computed, ref, onMounted } from "vue";
import api from "../services/api";
import UserProfile from './UserProfile.vue';
import { decodeJWT } from '@/util/utils';

export default {
  name: "PierreFeuilleCiseaux",
  components: {
    UserProfile,
  },
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
                  player1_id: player1Id.value,
                  player2_id: IA_ID,
                   winner_id: winnerId,
                  result,
                 session_id: sessionId,
              });

             const response = await api.post("/game-sessions", {
                  game_name: "PierreFeuilleCiseaux",
                    player1_id: player1Id.value,
                  player2_id: IA_ID,
                 winner_id: winnerId,
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
                egalites.value++;
                result = 'égalité';
                winnerId.value = null
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
                winnerId.value = player1Id.value;
                victoiresConsecutives.value++;
                saveProgress();
            } else {
                resultatPartie.value = "Défaite !";
                defaites.value++;
                result = 'défaite';
                winnerId.value = IA_ID;
                victoiresConsecutives.value = 0;
                 saveProgress();
            }
           saveGameResult(result, winnerId.value);
           afficherResultat();
        };

     const mettreScoreZero = () => {
            victoires.value = 0;
            defaites.value = 0;
            egalites.value = 0;
            victoiresConsecutives.value = 0;
          saveProgress()
           
        };

    onMounted(() => {
        loadProgress()
    })

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
  .choice {
      opacity: 1;
      font-size: 16px;
      font-weight: bold;
      transition: opacity 0.5s, transform 0.5s;
  }

  .vs {
      opacity: 1;
      font-size: 20px;
      margin: 0 10px;
  }
</style>
  