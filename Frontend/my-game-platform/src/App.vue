<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
/* Styles globaux */
body {
  margin: 0;
  padding: 0;
  background-color: var(--secondary-dark);
  color: white;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Classes utilitaires */
.gaming-theme {
  background-color: var(--secondary-dark);
  color: white;
}

/* Styles des boutons */
button {
  background: var(--gaming-gradient);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-speed) ease;
}

button:hover {
  transform: scale(var(--hover-scale));
  box-shadow: var(--neon-glow);
}

/* Styles des liens */
a {
  color: var(--primary-orange);
  text-decoration: none;
  transition: all var(--transition-speed) ease;
}

a:hover {
  color: var(--accent-neon);
  text-shadow: var(--neon-text-shadow);
}

/* Styles des inputs */
input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--primary-orange);
  color: white;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed) ease;
}

input:focus {
  outline: none;
  border-color: var(--accent-neon);
  box-shadow: var(--neon-glow);
}

/* Container principal */
.main-container {
  flex: 1;
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Animation de fond */
.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: 0.1;
  background: 
    radial-gradient(circle at 20% 20%, var(--primary-red) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, var(--primary-orange) 0%, transparent 50%);
  animation: backgroundPulse 10s ease-in-out infinite;
}

@keyframes backgroundPulse {
  0% { transform: scale(1); opacity: 0.1; }
  50% { transform: scale(1.2); opacity: 0.15; }
  100% { transform: scale(1); opacity: 0.1; }
}
</style>
  