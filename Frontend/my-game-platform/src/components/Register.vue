<template>
    <div class="register">
      <h1>Créer un compte</h1>
      <form @submit.prevent="handleRegister">
        <input type="text" v-model="username" placeholder="Nom d'utilisateur" required />
        <input type="password" v-model="password" placeholder="Mot de passe" required />
        <button type="submit">S'inscrire</button>
      </form>
    </div>
  </template>
  
  <script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: "RegisterPage",
  setup() {
    const username = ref('');
    const password = ref('');
    const router = useRouter();

    const handleRegister = async () => {
      try {
        console.log('Données envoyées :', { username: username.value, password: password.value });
        await api.post('/register', { username: username.value, password: password.value });
        alert("Inscription réussie !");
        router.push('/login');
      } catch (error) {
        console.error('Erreur lors de l\'inscription :', error.response || error);
        alert("Erreur lors de l'inscription. Réessayez.");
      }
    };

    return { username, password, handleRegister };
  },
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
  