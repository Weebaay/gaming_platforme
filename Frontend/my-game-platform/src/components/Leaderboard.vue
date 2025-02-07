<template>
    <div class="leaderboard">
        <h1>Classement des Joueurs</h1>
        <table v-if="leaderboard.length > 0">
            <thead>
            <tr>
                <th>Joueur</th>
                <th>Victoires</th>
                <th>Défaites</th>
                <th>Égalités</th>
                 <th>Total</th>
                 <th>Jeux</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(player, index) in leaderboard" :key="index">
                <td>{{ player.username }}</td>
                <td>{{ player.victories }}</td>
                <td>{{ player.defeats }}</td>
                <td>{{ player.draws }}</td>
                <td>{{ player.total }}</td>
               <td>{{ player.game_names }}</td>
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
        };
    },
};
</script>

<style scoped>
.leaderboard {
  text-align: center;
}

table {
  width: 80%;
  margin: 20px auto;
  border-collapse: collapse;
  font-family: sans-serif;
   border: 1px solid #ddd;

}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

 th {
    background-color: #f2f2f2;
}
</style>