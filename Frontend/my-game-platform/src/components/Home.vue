<template>
    <div class="home">
      <h1>Bienvenue sur la Plateforme de Jeux</h1>
      <p>Sélectionnez un jeu pour commencer à jouer :</p>
      <ul>
        <li><router-link :to="{ name: 'MorpionGame' }">Morpion</router-link></li>
        <li><router-link :to="{ name: 'PierreFeuilleCiseaux' }">Pierre-Feuille-Ciseaux</router-link></li>
        <li><router-link :to="{ name: 'JeuDesDes' }">Jeu des dés</router-link></li>
        <li><router-link :to="{ name: 'PlayerLeaderboard' }">Classement des Joueurs</router-link></li>
      </ul>
    </div>
  </template>
  
  <script setup>
    // Setup script utilisé pour Vue 3
  </script>

  <script>
  export default {
  name: "HomePage", // Nouveau nom du composant
};
</script>
  
  <style scoped>
  .home {
    text-align: center;
    margin-top: 50px;
  }
  
  ul {
    list-style-type: none;
    padding: 0;
  }
  
  li {
    margin: 10px 0;
  }
  
  a {
    text-decoration: none;
    color: #42b983;
    font-size: 18px;
  }
  
  a:hover {
    text-decoration: underline;
  }
  </style>
  