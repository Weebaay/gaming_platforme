<template>
  <div class="auth-container" :style="{ backgroundImage: 'url(/images/hypocampNeon.avif)' }">
    <nav class="navbar">
      <div class="navbar-brand">HolberGames</div>
    </nav>
    <div class="auth">
      <div class="center-content">
        <h1 class="title">Holber Games</h1>
        <p class="slogan">jouez partagez gagnez</p>
      </div>
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
  </div>
</template>

<script>
export default {
  name: "AuthPage",
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.auth {
  flex: 1;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(245, 241, 241, 0.7);
  overflow: hidden;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
}

.navbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(90deg, 
      rgba(138, 43, 226, 0.9) 0%,
      rgba(0, 191, 255, 0.9) 50%,
      rgba(0, 255, 157, 0.9) 100%
  );
  box-shadow: 
      0 0 10px rgba(138, 43, 226, 0.5),
      0 0 20px rgba(0, 191, 255, 0.3),
      0 0 30px rgba(0, 255, 157, 0.2);
  position: relative;
  z-index: 1;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-shadow: 
      0 0 10px rgba(138, 43, 226, 0.8),
      0 0 20px rgba(0, 191, 255, 0.6),
      0 0 30px rgba(0, 255, 157, 0.4);
  transition: all 0.3s ease;
}

.navbar-brand:hover {
  text-shadow: 
      0 0 15px rgba(138, 43, 226, 1),
      0 0 25px rgba(0, 191, 255, 0.8),
      0 0 35px rgba(0, 255, 157, 0.6);
  transform: scale(1.05);
}

.center-content {
  width: 100%;
  height: 150px;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.title {
  font-size: 3.5rem;
  color: #8a2be2;
  margin-bottom: 1rem;
  animation: slideRight 15s linear infinite;
  white-space: nowrap;
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(0, 191, 255, 0.6),
    0 0 30px rgba(0, 255, 157, 0.4);
}

.slogan {
  font-size: 1.8rem;
  color: #00bfff;
  animation: slideLeft 15s linear infinite;
  white-space: nowrap;
  text-shadow: 
    0 0 10px rgba(0, 191, 255, 0.8),
    0 0 20px rgba(0, 255, 157, 0.6),
    0 0 30px rgba(138, 43, 226, 0.4);
}

.buttons {
  margin-top: 20px;
  display: flex;
  gap: 1.5rem;
}

button {
  padding: 0.8rem 1.8rem;
  font-size: 1rem;
  background: linear-gradient(90deg, 
    #8a2be2 0%,
    #00bfff 100%
  );
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 0 10px rgba(138, 43, 226, 0.5),
    0 0 20px rgba(0, 191, 255, 0.3);
}

button:hover {
  background: linear-gradient(90deg, 
    #00bfff 0%,
    #00ff9d 100%
  );
  transform: translateY(-2px);
  box-shadow: 
    0 0 15px rgba(0, 191, 255, 0.7),
    0 0 25px rgba(0, 255, 157, 0.5);
}

@keyframes slideRight {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes slideLeft {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

p {
  color: #1a1a1a;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
</style>
  