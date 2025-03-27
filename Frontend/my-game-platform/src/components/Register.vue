<template>
  <div class="register-container" :style="{ backgroundImage: 'url(/images/hypocampNeon.avif)' }">
    <nav class="navbar">
      <div class="navbar-brand">HolberGames</div>
      <router-link to="/" class="home-link">Accueil</router-link>
    </nav>
    <div class="register">
      <h2>Créer un compte</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            v-model="username"
            @input="validateUsername"
            :class="{ 'input-error': usernameError }"
            required
            placeholder="Exemple : Player123"
          />
          <div class="input-rules">
            <small>• Utilisez uniquement des lettres (sans accents), chiffres, - et _</small>
            <small>• Entre 3 et 30 caractères</small>
          </div>
          <span class="error-hint" v-if="usernameError">{{ usernameError }}</span>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            @input="validateEmail"
            :class="{ 'input-error': emailError }"
            placeholder="Pour récupérer ton compte si tu oublies ton mot de passe"
          />
          <span class="error-hint" v-if="emailError">{{ emailError }}</span>
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            v-model="password"
            @input="validatePassword"
            :class="{ 'input-error': passwordError }"
            required
            minlength="8"
            placeholder="Au moins 8 caractères, une lettre et un chiffre"
          />
          <small class="input-help">Pour un mot de passe sûr, utilisez des lettres et des chiffres</small>
          <div class="password-strength" v-if="password">
            <div class="strength-bar">
              <div :style="{ width: passwordStrength + '%' }" :class="strengthClass"></div>
            </div>
            <span>Force: {{ strengthText }}</span>
          </div>
          <span class="error-hint" v-if="passwordError">{{ passwordError }}</span>
        </div>
        <div v-if="errorMessage" class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-text">{{ errorMessage }}</div>
          <div class="error-help">
            Assurez-vous que :
            <ul>
              <li>Le nom d'utilisateur ne contient pas d'accents</li>
              <li>Seuls les caractères autorisés sont utilisés (a-z, A-Z, 0-9, -, _)</li>
              <li>La longueur est entre 3 et 30 caractères</li>
            </ul>
          </div>
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Inscription en cours...' : 'S\'inscrire' }}
        </button>
      </form>
      <div class="login-link">
        Vous avez déjà un compte ? <router-link to="/login">Connectez-vous</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: "RegisterPage",
  setup() {
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const errorMessage = ref('');
    const isLoading = ref(false);
    const router = useRouter();

    // Validation states
    const usernameError = ref('');
    const emailError = ref('');
    const passwordError = ref('');
    const usernameLength = ref(false);
    const usernameFormat = ref(false);
    const passwordLength = ref(false);
    const hasLetter = ref(false);
    const hasNumber = ref(false);

    const validateUsername = () => {
      usernameLength.value = username.value.length >= 3 && username.value.length <= 30;
      usernameFormat.value = /^[a-zA-Z0-9_-]+$/.test(username.value);

      if (!username.value) {
        usernameError.value = 'Choisis un nom de joueur';
      } else if (!usernameLength.value) {
        usernameError.value = 'Ton nom doit avoir entre 3 et 30 caractères';
      } else if (!usernameFormat.value) {
        usernameError.value = 'Utilise uniquement des lettres sans accents, chiffres, - et _';
      } else {
        usernameError.value = '';
      }
    };

    const validateEmail = () => {
      if (email.value && !isValidEmail(email.value)) {
        emailError.value = 'Cet email ne semble pas valide';
      } else {
        emailError.value = '';
      }
    };

    const validatePassword = () => {
      passwordLength.value = password.value.length >= 8 && password.value.length <= 50;
      hasLetter.value = /[A-Za-z]/.test(password.value);
      hasNumber.value = /[0-9]/.test(password.value);

      if (!password.value) {
        passwordError.value = 'N\'oublie pas ton mot de passe !';
      } else if (!passwordLength.value) {
        passwordError.value = 'Ton mot de passe doit avoir entre 8 et 50 caractères';
      } else if (!hasLetter.value || !hasNumber.value) {
        passwordError.value = 'Ton mot de passe doit contenir au moins une lettre et un chiffre';
      } else {
        passwordError.value = '';
      }
    };

    const passwordStrength = computed(() => {
      let strength = 0;
      if (passwordLength.value) strength += 30;
      if (hasLetter.value) strength += 35;
      if (hasNumber.value) strength += 35;
      return strength;
    });

    const strengthClass = computed(() => {
      if (passwordStrength.value < 30) return 'weak';
      if (passwordStrength.value < 70) return 'medium';
      return 'strong';
    });

    const strengthText = computed(() => {
      if (passwordStrength.value < 30) return 'Faible';
      if (passwordStrength.value < 70) return 'Moyen';
      return 'Fort';
    });

    const handleRegister = async () => {
      try {
        validateUsername();
        validateEmail();
        validatePassword();

        if (usernameError.value || (email.value && emailError.value) || passwordError.value) {
          return;
        }

        isLoading.value = true;
        errorMessage.value = '';

        const userData = { 
          username: username.value.trim(), 
          password: password.value.trim(),
          confirmPassword: password.value.trim()
        };

        if (email.value.trim()) {
          userData.email = email.value.trim();
        }
        
        const response = await api.post('/users/register', userData);
        
        if (response.status === 201) {
          router.push({ 
            path: '/login', 
            query: { registered: 'success' } 
          });
          username.value = '';
          email.value = '';
          password.value = '';
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'inscription :', error.response || error);
        
        if (error.response?.data?.errors) {
          const serverErrors = error.response.data.errors;
          serverErrors.forEach(err => {
            switch(err.param) {
              case 'username':
                usernameError.value = err.msg;
                break;
              case 'email':
                emailError.value = err.msg;
                break;
              case 'password':
                passwordError.value = err.msg;
                break;
              default:
                errorMessage.value = err.msg;
            }
          });
        } else if (error.response?.status === 409) {
          usernameError.value = "Ce nom d'utilisateur est déjà pris";
        } else {
          errorMessage.value = "Une erreur est survenue. Vérifie tes informations et réessaie.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    return {
      username,
      email,
      password,
      errorMessage,
      isLoading,
      handleRegister,
      // Validation states
      usernameError,
      emailError,
      passwordError,
      usernameLength,
      usernameFormat,
      passwordLength,
      hasLetter,
      hasNumber,
      // Computed properties
      passwordStrength,
      strengthClass,
      strengthText,
      // Validation methods
      validateUsername,
      validateEmail,
      validatePassword
    };
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.register {
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

.login-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.login-link a {
  color: #8a2be2;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.login-link a:hover {
  text-decoration: underline;
  color: #00bfff;
}

.input-rules {
  margin-top: 0.3rem;
  padding: 0.5rem;
  background: rgba(138, 43, 226, 0.05);
  border-radius: 4px;
}

.input-rules small {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin: 0.2rem 0;
}

.error-message {
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #ff3366;
}

.error-icon {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.error-text {
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
}

.error-help {
  font-size: 0.9rem;
  color: #666;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.8rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.error-help ul {
  margin: 0.5rem 0 0 1.2rem;
  padding: 0;
}

.error-help li {
  margin: 0.3rem 0;
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
  width: 100%;
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
  box-shadow: none;
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

.input-help {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.3rem;
  margin-left: 0.2rem;
}

input::placeholder {
  color: #999;
  font-size: 0.9rem;
}
</style>
  