<template>
    <div class="login">
      <h1>Connexion</h1>
      <form @submit.prevent="handleLogin">
        <input type="text" v-model="username" placeholder="Nom d'utilisateur" required />
        <input type="password" v-model="password" placeholder="Mot de passe" required />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../services/api';
  
  export default {
  name: "LoginPage",
  setup() {
    const router = useRouter();
    const username = ref(''); // Déclare les variables avec `ref`
    const password = ref('');

    const handleLogin = async () => {
        console.log("handleLogin() a été appelé !")
      try {
        console.log("Tentative de connexion avec :", { username: username.value, password: password.value }); // Log pour déboguer
        const response = await api.post('/users/login', { username: username.value, password: password.value });
        console.log("Nom d'utilisateur stocké :", username.value);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', username.value);
        alert("Connexion réussie !");
        router.push('/home'); // Rediriger vers la page d'accueil
      } catch (error) {
        console.error("Erreur de connexion :", error.response || error); // Log détaillé pour l'erreur
        alert("Erreur de connexion. Réessayez.");
      }
    };

    return {
      username,
      password,
      handleLogin,
    };
  },
};
  </script>
  
  <style scoped>
.login {
  text-align: center;
  margin-top: 50px;
}
form {
  display: inline-block;
  text-align: left;
}
input {
  display: block;
  margin: 10px auto;
  padding: 10px;
  width: 80%;
  font-size: 16px;
}
button {
  margin-top: 20px;
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
} </style>
  