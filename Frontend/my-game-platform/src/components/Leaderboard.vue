<template>
    <div class="leaderboard">
        <router-link to="/home" class="home-link">
            <i class="fas fa-home"></i>
        </router-link>
        <h1>Classement des Joueurs</h1>
		<button @click="fetchLeaderboard">Actualiser le classement</button>
        <table v-if="leaderboard.length > 0">
            <thead>
            <tr>
                <th>Joueur</th>
                <th>Victoires</th>
                <th>Défaites</th>
                <th>Égalités</th>
				<th>Morpion</th>
				<th>PierreFeuilleCiseaux</th>
				<th>JeuDesDes</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(player, index) in leaderboard" :key="index">
                <td>{{ player.username }}</td>
                <td>{{ player.victoires }}</td>
                <td>{{ player.defaites }}</td>
                <td>{{ player.egalites }}</td>
				<td>
					V: {{ player.morpion_victoires }} / D: {{ player.morpion_defaites }} / E:
					{{ player.morpion_egalites }}
				</td>
				<td>
					V: {{ player.pfc_victoires }} / D: {{ player.pfc_defaites }} / E:
					{{ player.pfc_egalites }}
				</td>
				<td>
					V: {{ player.des_victoires }} / D: {{ player.des_defaites }} / E:
					{{ player.des_egalites }}
				</td>
            </tr>
            </tbody>
        </table>
      <div v-else>
            <p>Aucune donnée de classement disponible pour le moment</p>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
    name: "PlayerLeaderboard",
    setup() {
        const leaderboard = ref([]);
         const fetchLeaderboard = async () => {
             try {
               const response = await api.get("/leaderboard");
               leaderboard.value = response.data;
               console.log("classement recupéré avec succès ", response.data)
             } catch (error) {
               console.error("erreur lors de la récupération du classement", error);
                 alert('Impossible de récupérer le classement pour le moment.');
             }
           };
        onMounted(fetchLeaderboard);

        return {
            leaderboard,
			fetchLeaderboard
        };
    },
};
</script>

<style scoped>
.leaderboard {
  min-height: 100vh;
  background: #1a1a1a;
  padding: 2rem;
  color: white;
  position: relative;
}

.home-link {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: white;
  font-size: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  z-index: 10;
}

.home-link:hover {
  color: #00bfff;
  transform: scale(1.1);
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
}

h1 {
  font-size: 3rem;
  text-align: center;
  color: #fff;
  margin-bottom: 2rem;
  text-shadow: 
    0 0 10px rgba(0, 191, 255, 0.5),
    0 0 20px rgba(0, 191, 255, 0.3);
  letter-spacing: 2px;
}

button {
  background: linear-gradient(90deg, 
    rgba(138, 43, 226, 0.8) 0%,
    rgba(0, 191, 255, 0.8) 100%
  );
  border: none;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 10px rgba(0, 191, 255, 0.5),
    0 0 15px rgba(0, 255, 157, 0.3);
}

button::before {
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

table {
  width: 90%;
  margin: 0 auto;
  border-collapse: separate;
  border-spacing: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 
    0 0 20px rgba(138, 43, 226, 0.2),
    0 0 40px rgba(0, 191, 255, 0.1);
  backdrop-filter: blur(5px);
}

th, td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

th {
  background: linear-gradient(90deg,
    rgba(138, 43, 226, 0.3) 0%,
    rgba(0, 191, 255, 0.3) 100%
  );
  color: #fff;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
}

tr {
  transition: all 0.3s ease;
}

tr:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.01);
}

td {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

/* Style pour les statistiques de jeu */
td:nth-child(5),
td:nth-child(6),
td:nth-child(7) {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin: 2px;
  font-size: 0.9rem;
}

/* Style pour le meilleur joueur */
tr:first-child td {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  font-weight: bold;
}

/* Animation du gradient de bordure */
@keyframes borderRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Style pour les scores */
td:nth-child(2),
td:nth-child(3),
td:nth-child(4) {
  font-weight: bold;
  font-size: 1.1rem;
  color: #00bfff;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
}

/* Responsive design */
@media (max-width: 1024px) {
  table {
    width: 95%;
    font-size: 0.9rem;
  }
  
  th, td {
    padding: 0.8rem 0.5rem;
  }
  
  h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .leaderboard {
    padding: 1rem;
  }
  
  table {
    width: 100%;
    font-size: 0.8rem;
  }
  
  th, td {
    padding: 0.6rem 0.3rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>