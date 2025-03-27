<template>
  <div class="reset-password-container">
    <div class="overlay"></div>
    <div class="reset-password">
      <h1>Réinitialiser votre mot de passe</h1>
      
      <div v-if="isLoading" class="loading">
        <p>Vérification du jeton...</p>
      </div>
      
      <div v-else-if="tokenError" class="token-error">
        <h2>Lien invalide ou expiré</h2>
        <p>{{ tokenError }}</p>
        <router-link to="/forgot-password" class="btn-retry">
          Demander un nouveau lien
        </router-link>
      </div>
      
      <form v-else-if="!resetSuccess" @submit.prevent="handleResetPassword" class="reset-form">
        <p>Choisissez un nouveau mot de passe pour votre compte.</p>
        
        <div class="form-group">
          <label for="newPassword">Nouveau mot de passe</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            placeholder="Entrez votre nouveau mot de passe"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirmez votre nouveau mot de passe"
            required
            minlength="6"
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Réinitialisation en cours...' : 'Réinitialiser mon mot de passe' }}
        </button>
      </form>
      
      <div v-else class="reset-success">
        <h2>Mot de passe réinitialisé !</h2>
        <p>Votre mot de passe a été réinitialisé avec succès.</p>
        <router-link to="/login" class="btn-login">
          Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

export default {
  name: "ResetPasswordPage",
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const token = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const isLoading = ref(true);
    const tokenError = ref('');
    const errorMessage = ref('');
    const submitting = ref(false);
    const resetSuccess = ref(false);

    const verifyToken = async () => {
      try {
        isLoading.value = true;
        tokenError.value = '';
        
        // Récupérer le token depuis l'URL
        token.value = route.query.token;
        
        if (!token.value) {
          tokenError.value = "Aucun jeton de réinitialisation trouvé dans l'URL.";
          return;
        }
        
        // Vérifier la validité du token
        await api.post('/users/verify-reset-token', { token: token.value });
        
      } catch (error) {
        console.error('Erreur lors de la vérification du jeton :', error.response || error);
        
        if (error.response && error.response.status === 401) {
          tokenError.value = "Ce lien de réinitialisation est invalide ou a expiré.";
        } else {
          tokenError.value = "Une erreur est survenue lors de la vérification du lien.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    const handleResetPassword = async () => {
      // Validation des champs
      if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = "Les mots de passe ne correspondent pas.";
        return;
      }
      
      if (newPassword.value.length < 6) {
        errorMessage.value = "Le mot de passe doit contenir au moins 6 caractères.";
        return;
      }

      try {
        submitting.value = true;
        errorMessage.value = '';
        
        await api.post('/users/reset-password', {
          token: token.value,
          newPassword: newPassword.value
        });
        
        resetSuccess.value = true;
        
      } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe :', error.response || error);
        
        if (error.response && error.response.status === 401) {
          tokenError.value = "Ce lien de réinitialisation est invalide ou a expiré.";
        } else {
          errorMessage.value = "Une erreur est survenue lors de la réinitialisation du mot de passe.";
        }
      } finally {
        submitting.value = false;
      }
    };

    onMounted(() => {
      verifyToken();
    });

    return {
      newPassword,
      confirmPassword,
      isLoading,
      tokenError,
      errorMessage,
      submitting,
      resetSuccess,
      handleResetPassword
    };
  }
};
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 0;
}

.reset-password {
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

h1, h2 {
  color: #333;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.8rem;
}

h2 {
  font-size: 1.5rem;
}

p {
  color: #555;
  margin-bottom: 1.5rem;
}

.reset-form, .token-error, .reset-success {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

input {
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

button, .btn-retry, .btn-login {
  padding: 0.8rem;
  background: linear-gradient(135deg, #8a2be2, #4b0082);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  margin-top: 1rem;
}

button:hover:not(:disabled), .btn-retry:hover, .btn-login:hover {
  background: linear-gradient(135deg, #9b4dff, #6c14dc);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.loading {
  text-align: center;
  color: #4b0082;
}

.token-error, .reset-success {
  text-align: center;
}

.token-error h2 {
  color: #e74c3c;
}

.reset-success h2 {
  color: #2ecc71;
}
</style> 