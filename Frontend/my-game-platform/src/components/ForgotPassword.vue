<template>
  <div class="forgot-password-container">
    <div class="overlay"></div>
    <div class="forgot-password">
      <h1>Réinitialisation de mot de passe</h1>
      <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
      
      <form @submit.prevent="handleForgotPassword" class="forgot-password-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Votre adresse email"
            required
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Envoi en cours...' : 'Envoyer le lien' }}
        </button>
      </form>
      
      <div class="links">
        <router-link to="/login">Retour à la connexion</router-link>
        <router-link to="/register">Créer un compte</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import api from '@/services/api';

export default {
  name: "ForgotPasswordPage",
  setup() {
    const email = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');

    const handleForgotPassword = async () => {
      // Validation de l'email
      if (!email.value.trim()) {
        errorMessage.value = "Veuillez entrer votre adresse email";
        return;
      }

      try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';
        
        await api.post('/users/forgot-password', { email: email.value.trim() });
        
        // Afficher un message de succès (même si l'email n'existe pas, pour des raisons de sécurité)
        successMessage.value = "Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.";
        email.value = ''; // Réinitialiser le champ
      } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation :', error.response || error);
        if (error.response && error.response.status === 429) {
          errorMessage.value = "Trop de tentatives. Veuillez réessayer plus tard.";
        } else {
          errorMessage.value = "Une erreur est survenue. Veuillez réessayer.";
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      isLoading,
      errorMessage,
      successMessage,
      handleForgotPassword
    };
  }
};
</script>

<style scoped>
.forgot-password-container {
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

.forgot-password {
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

h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

p {
  color: #555;
  margin-bottom: 1.5rem;
}

.forgot-password-form {
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

button {
  padding: 0.8rem;
  background: linear-gradient(135deg, #8a2be2, #4b0082);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 1rem;
}

button:hover:not(:disabled) {
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

.success-message {
  color: #2ecc71;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.links {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
}

.links a {
  color: #8a2be2;
  text-decoration: none;
  font-size: 0.9rem;
}

.links a:hover {
  text-decoration: underline;
}
</style> 