<template>
    <div class="auth">
      <h1>Bienvenue sur la Plateforme de Jeux</h1>
      <p>Veuillez vous connecter ou créer un compte pour continuer :</p>
      <div class="buttons">
        <router-link to="/register">
          <button>Créer un compte</button>
        </router-link>
        <router-link to="/login">
          <button>Connexion</button>
        </router-link>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "AuthPage",
  };
  </script>
  
  <style scoped>
  .auth {
    text-align: center;
    margin-top: 50px;
  }
  .buttons {
    margin-top: 20px;
  }
  button {
    margin: 10px;
    padding: 10px 20px;
    font-size: 16px;
    color: #fff;
    background-color: #42b983;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:hover {
    background-color: #369f72;
  }
  </style>
  