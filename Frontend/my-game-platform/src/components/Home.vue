<template>
  <div class="home-container">
    <nav class="navbar">
      <div class="navbar-brand">HolberGames</div>
      <div class="navbar-items">
        <div class="user-info">
          <i class="fas fa-user"></i>
          <span>{{ username }}</span>
        </div>
        <button class="ranking-btn" @click="goToRanking">
          <i class="fas fa-trophy"></i>
          Classement
        </button>
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          Déconnexion
        </button>
      </div>
    </nav>

    <div class="center-content">
      <h1 class="title">Bienvenue à Holber Games</h1>
      <p class="slogan">jouez partagez gagnez</p>
    </div>

    <div class="particles">
      <div v-for="n in 60" :key="n" class="particle"></div>
    </div>

    <div class="game-cards">
      <router-link :to="{ name: 'MorpionGame' }" class="game-card">
        <img src="/images/tictactoe.avif" alt="Morpion" />
        <div class="card-content">
          <h3>Morpion</h3>
          <p>Alignez trois symboles pour gagner !</p>
        </div>
      </router-link>

      <router-link :to="{ name: 'PierreFeuilleCiseaux' }" class="game-card">
        <img src="/images/PFCgame.jpg" alt="Pierre-Feuille-Ciseaux" />
        <div class="card-content">
          <h3>Pierre-Feuille-Ciseaux</h3>
          <p>Le classique revisité !</p>
        </div>
      </router-link>

      <router-link :to="{ name: 'JeuDesDes' }" class="game-card">
        <img src="/images/DiceDice.avif" alt="Jeu des dés" />
        <div class="card-content">
          <h3>Jeu des dés</h3>
          <p>Tentez votre chance aux dés !</p>
        </div>
      </router-link>

      <div class="feature-card">
        <div class="feature-icon"><i class="fas fa-trophy"></i></div>
        <div class="feature-content">
          <h3>Classement</h3>
          <p>Découvrez le classement des joueurs et comparez vos performances</p>
          <div class="feature-links">
            <router-link to="/leaderboard" class="feature-link">
              <i class="fas fa-robot"></i> Classement IA
            </router-link>
            <router-link to="/leaderboard-online" class="feature-link">
              <i class="fas fa-users"></i> Classement Multijoueur
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();
    const username = ref(localStorage.getItem('username') || '');

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      router.push('/');
    };

    const goToRanking = () => {
      router.push('/leaderboard-online');
    };

    return {
      username,
      handleLogout,
      goToRanking
    };
  }
};
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #1a1a1a;
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
  z-index: 10;
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

.navbar-items {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

.user-info i {
  font-size: 1.2rem;
}

.ranking-btn, .logout-btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ranking-btn {
  background: linear-gradient(90deg, 
    rgba(138, 43, 226, 0.8) 0%,
    rgba(0, 191, 255, 0.8) 100%
  );
}

.logout-btn {
  background: linear-gradient(90deg, 
    rgba(255, 51, 102, 0.8) 0%,
    rgba(255, 102, 102, 0.8) 100%
  );
}

.ranking-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
}

.ranking-btn:hover {
  background: linear-gradient(90deg, 
    rgba(0, 191, 255, 0.8) 0%,
    rgba(0, 255, 157, 0.8) 100%
  );
  box-shadow: 
    0 0 10px rgba(0, 191, 255, 0.5),
    0 0 15px rgba(0, 255, 157, 0.3);
}

.logout-btn:hover {
  background: linear-gradient(90deg, 
    rgba(255, 102, 102, 0.8) 0%,
    rgba(255, 51, 102, 0.8) 100%
  );
  box-shadow: 
    0 0 10px rgba(255, 51, 102, 0.5),
    0 0 15px rgba(255, 51, 102, 0.3);
}

.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  position: relative;
  z-index: 2;
  text-align: center;
}

.title {
  font-size: 3.5rem;
  color: #8a2be2;
  margin-bottom: 1rem;
  text-shadow: 
    0 0 5px rgba(138, 43, 226, 0.5),
    0 0 10px rgba(0, 191, 255, 0.3),
    0 0 15px rgba(0, 255, 157, 0.2);
}

.slogan {
  font-size: 1.8rem;
  color: #00bfff;
  white-space: nowrap;
  animation: scrollText 15s linear infinite;
  text-shadow: 
    0 0 10px rgba(0, 191, 255, 0.8),
    0 0 20px rgba(0, 255, 157, 0.6),
    0 0 30px rgba(138, 43, 226, 0.4);
}

@keyframes scrollText {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  animation: float 12s infinite linear;
  opacity: 0;
  transform-origin: center;
}

@keyframes float {
  0% {
    transform: translateY(100vh) translateX(var(--x-offset)) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-20vh) translateX(calc(var(--x-offset) + 50px)) scale(1);
    opacity: 0;
  }
}

.particles .particle:nth-child(3n) {
  background: linear-gradient(45deg, #8a2be2, #4b0082);
  box-shadow: 0 0 8px #8a2be2;
  width: 3px;
  height: 3px;
  animation-duration: 15s;
  --x-offset: calc(random() * 100vw);
  left: calc(random() * 100vw);
}

.particles .particle:nth-child(3n + 1) {
  background: linear-gradient(45deg, #00bfff, #1e90ff);
  box-shadow: 0 0 8px #00bfff;
  width: 4px;
  height: 4px;
  animation-duration: 20s;
  --x-offset: calc(random() * 100vw);
  left: calc(random() * 100vw);
}

.particles .particle:nth-child(3n + 2) {
  background: linear-gradient(45deg, #00ff9d, #00ff9d);
  box-shadow: 0 0 8px #00ff9d;
  width: 3.5px;
  height: 3.5px;
  animation-duration: 18s;
  --x-offset: calc(random() * 100vw);
  left: calc(random() * 100vw);
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.game-card {
  position: relative;
  border-radius: 15px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.5s ease;
  text-decoration: none;
  color: white;
  box-shadow: 
    0 0 10px rgba(138, 43, 226, 0.3),
    0 0 20px rgba(0, 191, 255, 0.2),
    0 0 30px rgba(0, 255, 157, 0.1);
  transform: scale(1);
  height: 300px;
}

.game-card:hover {
  transform: scale(1.1);
  box-shadow: 
    0 0 15px rgba(138, 43, 226, 0.5),
    0 0 25px rgba(0, 191, 255, 0.4),
    0 0 35px rgba(0, 255, 157, 0.3);
  z-index: 1;
}

.game-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.game-card:hover img {
  transform: scale(1.2);
}

.card-content {
  padding: 1.5rem;
  background: linear-gradient(to top, 
    rgba(138, 43, 226, 0.9),
    rgba(0, 191, 255, 0.7),
    rgba(0, 255, 157, 0.5),
    transparent
  );
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.game-card:hover .card-content {
  transform: translateY(0);
}

.card-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: white;
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(0, 191, 255, 0.6);
}

.card-content p {
  font-size: 1rem;
  color: #ffffff;
  margin: 0;
}

@media (max-width: 1024px) {
  .game-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .game-cards {
    grid-template-columns: 1fr;
  }
  
  .game-card {
    height: 250px;
  }
}
</style>
  