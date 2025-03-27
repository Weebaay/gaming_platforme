<template>
  <div class="login-container" :style="{ backgroundImage: 'url(/images/hypocampNeon.avif)' }">
    <nav class="navbar">
      <div class="navbar-brand">HolberGames</div>
      <router-link to="/" class="home-link">Accueil</router-link>
    </nav>
    <div class="login">
      <h2>Connexion</h2>
      <div v-if="registrationSuccess" class="success-message">
        Inscription réussie ! Vous pouvez maintenant vous connecter.
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
          />
        </div>
        <div class="form-actions">
          <router-link to="/forgot-password" class="forgot-password-link">
            Mot de passe oublié ?
          </router-link>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
      <div class="register-link">
        Vous n'avez pas de compte ? <router-link to="/register">Inscrivez-vous</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../services/api';

export default {
  name: "LoginPage",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const errorMessage = ref('');
    const isLoading = ref(false);
    const registrationSuccess = ref(false);

    // Vérifier si l'utilisateur vient de s'inscrire
    onMounted(() => {
      if (route.query.registered === 'success') {
        registrationSuccess.value = true;
      }
    });

    const handleLogin = async () => {
      // Validation des champs
      if (!username.value.trim() || !password.value.trim()) {
        errorMessage.value = 'Veuillez remplir tous les champs';
        return;
      }

      try {
        isLoading.value = true;
        errorMessage.value = '';
        registrationSuccess.value = false; // Cacher le message de succès
        
        console.log("Tentative de connexion avec :", { username: username.value, password: password.value });
        const response = await api.post('/users/login', { 
          username: username.value.trim(), 
          password: password.value.trim() 
        });
        console.log("Nom d'utilisateur stocké :", username.value);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', username.value);
        router.push('/home');
      } catch (error) {
        console.error("Erreur de connexion :", error.response || error);
        if (error.response && error.response.status === 401) {
          errorMessage.value = "Nom d'utilisateur ou mot de passe incorrect.";
        } else if (error.response && error.response.status === 429) {
          errorMessage.value = "Trop de tentatives. Veuillez réessayer plus tard.";
        } else {
          errorMessage.value = "Une erreur est survenue. Veuillez réessayer.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      username,
      password,
      errorMessage,
      isLoading,
      registrationSuccess,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login {
  flex: 1;
  width: 100%;
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 10px;
  background: rgba(245, 241, 241, 0.7);
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
  position: relative;
  z-index: 1;
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

h2 {
  color: #8a2be2;
  margin-bottom: 2rem;
  text-shadow: 
    0 0 10px rgba(138, 43, 226, 0.8),
    0 0 20px rgba(0, 191, 255, 0.6),
    0 0 30px rgba(0, 255, 157, 0.4);
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  color: #1a1a1a;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #8a2be2;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.forgot-password-link {
  font-size: 0.9rem;
  color: #8a2be2;
  text-decoration: none;
  transition: all 0.3s ease;
}

.forgot-password-link:hover {
  text-decoration: underline;
  color: #00bfff;
}

.register-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.register-link a {
  color: #8a2be2;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.register-link a:hover {
  text-decoration: underline;
  color: #00bfff;
}

.error-message {
  margin-top: 1rem;
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  margin-bottom: 1.5rem;
  padding: 0.8rem;
  background-color: rgba(46, 204, 113, 0.2);
  border: 1px solid #2ecc71;
  border-radius: 5px;
  color: #2ecc71;
  font-size: 0.95rem;
  text-align: center;
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

button:hover:not(:disabled) {
  background: linear-gradient(90deg, 
    #00bfff 0%,
    #00ff9d 100%
  );
  transform: translateY(-2px);
  box-shadow: 
    0 0 15px rgba(0, 191, 255, 0.7),
    0 0 25px rgba(0, 255, 157, 0.5);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.home-link {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: white;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: linear-gradient(90deg, 
    rgba(138, 43, 226, 0.8) 0%,
    rgba(0, 191, 255, 0.8) 100%
  );
  transition: all 0.3s ease;
  text-shadow: 
    0 0 5px rgba(138, 43, 226, 0.5),
    0 0 10px rgba(0, 191, 255, 0.3);
}

.home-link:hover {
  background: linear-gradient(90deg, 
    rgba(0, 191, 255, 0.8) 0%,
    rgba(0, 255, 157, 0.8) 100%
  );
  transform: translateY(-2px);
  box-shadow: 
    0 0 10px rgba(0, 191, 255, 0.5),
    0 0 15px rgba(0, 255, 157, 0.3);
}
</style>
  