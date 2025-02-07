<template>
    <div id="app">
      <!-- En-tête ou navigation, si nécessaire -->
      <router-view />
      <!-- router-view affichera le composant correspondant à la route -->
    </div>
  </template>
  
  <script>
  export default {
    name: "App",
  };
  </script>
  
  <style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
  </style>
  