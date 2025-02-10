<template>
    <div class="user-profile">
      <p v-if="username">Bienvenue, {{ username }} !</p>
      <p v-else>Chargement du nom d'utilisateur...</p>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  
  export default {
    name: 'UserProfile',
    setup() {
      const username = ref('');
  
      onMounted(() => {
        // Récupérer le nom d'utilisateur depuis le localStorage
        username.value = localStorage.getItem('username');
      });
  
      return {
        username,
      };
    },
  };
  </script>
  
  <style scoped>
  .user-profile {
    text-align: left;
    margin-bottom: 10px;
  }
  </style>