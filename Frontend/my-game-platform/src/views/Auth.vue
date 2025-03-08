<template>
  <div class="auth-page">
    <div class="animated-background">
      <div class="neon-text">HOLBER GAMES</div>
      <div class="neon-slogan">JOUEZ PARTAGEZ GAGNEZ</div>
      <div class="neon-line top"></div>
      <div class="neon-line bottom"></div>
    </div>

    <div class="content">
      <h1 class="main-title">Holbergames</h1>
      <p class="subtitle">Veuillez vous connecter ou créer un compte pour continuer :</p>
      
      <div class="buttons-container">
        <button class="action-button" @click="() => { isLogin = false; showForm = true; }">
          Créer un compte
        </button>
        <button class="action-button" @click="() => { isLogin = true; showForm = true; }">
          Connexion
        </button>
      </div>

      <div class="auth-container" v-if="showForm">
        <div class="auth-box">
          <h2 class="auth-title">{{ isLogin ? 'Connexion' : 'Inscription' }}</h2>
          
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group" v-if="!isLogin">
              <input
                type="text"
                v-model="username"
                placeholder="Nom d'utilisateur"
                required
                class="auth-input"
              />
            </div>
            
            <div class="form-group">
              <input
                type="email"
                v-model="email"
                placeholder="Email"
                required
                class="auth-input"
              />
            </div>
            
            <div class="form-group">
              <input
                type="password"
                v-model="password"
                placeholder="Mot de passe"
                required
                class="auth-input"
              />
            </div>
            
            <button type="submit" class="auth-button">
              {{ isLogin ? 'Se connecter' : "S'inscrire" }}
            </button>
          </form>
          
          <p class="auth-switch">
            {{ isLogin ? "Pas encore de compte ?" : "Déjà un compte ?" }}
            <a href="#" @click.prevent="toggleMode" class="switch-link">
              {{ isLogin ? "S'inscrire" : "Se connecter" }}
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Auth',
  data() {
    return {
      isLogin: true,
      showForm: false,
      username: '',
      email: '',
      password: ''
    }
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin;
    },
    async handleSubmit() {
      try {
        const endpoint = this.isLogin ? '/users/login' : '/users/register';
        const data = this.isLogin
          ? { email: this.email, password: this.password }
          : { username: this.username, email: this.email, password: this.password };

        const response = await this.$http.post(endpoint, data);
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('username', response.data.username);
          this.$router.push('/');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert(error.response?.data?.message || 'Une erreur est survenue');
      }
    }
  },
  watch: {
    isLogin() {
      this.showForm = true;
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

.auth-page {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  overflow: hidden;
}

.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.neon-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 120px;
  color: rgba(255, 49, 49, 0.1);
  position: absolute;
  width: 100%;
  text-align: center;
  top: 40%;
  transform: translateY(-50%);
  animation: slideText 20s linear infinite;
  white-space: nowrap;
  text-shadow: 0 0 20px rgba(255, 49, 49, 0.2);
}

.neon-slogan {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 60px;
  color: rgba(255, 92, 49, 0.1);
  position: absolute;
  width: 100%;
  text-align: center;
  top: 60%;
  transform: translateY(-50%);
  animation: slideText 15s linear infinite reverse;
  white-space: nowrap;
  text-shadow: 0 0 20px rgba(255, 92, 49, 0.2);
}

.neon-line {
  position: absolute;
  height: 2px;
  width: 200%;
  left: -50%;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 49, 49, 0.8) 50%,
    transparent 100%);
  animation: neonPulse 3s ease-in-out infinite;
}

.neon-line.top {
  top: 30%;
}

.neon-line.bottom {
  bottom: 30%;
  animation-delay: 1.5s;
}

@keyframes slideText {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes neonPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(-10%);
  }
  50% {
    opacity: 1;
    transform: translateX(10%);
  }
}

.content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 600px;
  text-align: center;
  padding: 2rem;
}

.main-title {
  font-size: 3rem;
  color: white;
  margin-bottom: 1rem;
}

.subtitle {
  color: white;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(45deg, #ff3131, #ff5c31);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 49, 49, 0.4);
}

.auth-container {
  margin-top: 2rem;
}

.auth-box {
  background: rgba(26, 26, 26, 0.95);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 
    0 0 20px rgba(255, 49, 49, 0.3),
    0 0 40px rgba(255, 49, 49, 0.2);
  border: 1px solid rgba(255, 49, 49, 0.3);
  animation: fadeIn 0.5s ease-out;
}

.auth-title {
  font-size: 2rem;
  color: #ff3131;
  text-align: center;
  margin-bottom: 2rem;
}

.auth-input {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #ff3131;
  border-radius: 8px;
  color: white;
  margin-bottom: 1rem;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #ff3131, #ff5c31);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-button:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(255, 49, 49, 0.4);
}

.auth-switch {
  margin-top: 1.5rem;
  text-align: center;
  color: white;
}

.switch-link {
  color: #ff3131;
  text-decoration: none;
  margin-left: 0.5rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .neon-text {
    font-size: 80px;
  }
  
  .neon-slogan {
    font-size: 40px;
  }
  
  .main-title {
    font-size: 2.5rem;
  }
  
  .action-button {
    padding: 0.8rem 1.5rem;
  }
  
  .auth-box {
    margin: 0 1rem;
  }
}
</style> 