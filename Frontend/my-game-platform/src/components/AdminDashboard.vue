<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <div class="header-container">
        <h1>Dashboard Administrateur</h1>
        <div class="user-info">
          <span>Connecté en tant que : {{ username }} (Admin)</span>
          <button @click="goToHome" class="home-btn">Retour à l'accueil</button>
          <button @click="logout" class="logout-btn">Déconnexion</button>
        </div>
      </div>
    </header>

    <main class="dashboard-content">
      <div class="stats-section">
        <h2>Statistiques</h2>
        <div class="stats-cards">
          <div class="stats-card">
            <h3>Utilisateurs</h3>
            <p class="stats-number">{{ usersCount }}</p>
          </div>
          <div class="stats-card">
            <h3>Temps de fonctionnement</h3>
            <p>{{ systemInfo.uptime || 'Chargement...' }}</p>
          </div>
          <div class="stats-card">
            <h3>Heure du serveur</h3>
            <p>{{ formattedServerTime }}</p>
          </div>
        </div>
      </div>

      <div class="users-section">
        <h2>Gestion des Utilisateurs</h2>
        <div class="search-bar">
          <input type="text" v-model="searchTerm" placeholder="Rechercher un utilisateur..." />
          <button @click="loadUsers">Rafraîchir</button>
        </div>
        
        <div v-if="loading" class="loading">Chargement...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else>
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom d'utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  <button @click="confirmDelete(user)" class="delete-btn">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Confirmation de suppression</h3>
        <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete?.username }}</strong> ?</p>
        <p class="warning">Cette action est irréversible !</p>
        <div class="modal-actions">
          <button @click="deleteUser" class="confirm-btn">Confirmer</button>
          <button @click="cancelDelete" class="cancel-btn">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Configuration d'axios pour l'admin (avec un préfixe différent pour les routes admin)
const adminApi = axios.create({
  baseURL: 'http://localhost:3000'
});

// Intercepteur pour ajouter le token JWT aux requêtes
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  name: 'AdminDashboard',
  setup() {
    const router = useRouter();
    const username = ref(localStorage.getItem('username') || 'Admin');
    const users = ref([]);
    const usersCount = ref(0);
    const systemInfo = ref({});
    const loading = ref(false);
    const error = ref('');
    const searchTerm = ref('');
    const showDeleteModal = ref(false);
    const userToDelete = ref(null);

    // Formatage de l'heure du serveur
    const formattedServerTime = computed(() => {
      if (!systemInfo.value.serverTime) return 'Chargement...';
      return new Date(systemInfo.value.serverTime).toLocaleString();
    });

    // Filtrage des utilisateurs selon le terme de recherche
    const filteredUsers = computed(() => {
      if (!searchTerm.value) return users.value;
      const term = searchTerm.value.toLowerCase();
      return users.value.filter(user => 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    });

    // Charger la liste des utilisateurs
    const loadUsers = async () => {
      loading.value = true;
      error.value = '';
      try {
        const response = await adminApi.get('/admin/users');
        users.value = response.data;
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        error.value = 'Impossible de charger la liste des utilisateurs. Vérifiez vos droits d\'accès.';
      } finally {
        loading.value = false;
      }
    };

    // Charger les statistiques
    const loadStats = async () => {
      try {
        const response = await adminApi.get('/admin/stats');
        usersCount.value = response.data.usersCount;
        systemInfo.value = response.data.systemInfo;
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
      }
    };

    // Confirmer la suppression d'un utilisateur
    const confirmDelete = (user) => {
      userToDelete.value = user;
      showDeleteModal.value = true;
    };

    // Annuler la suppression
    const cancelDelete = () => {
      showDeleteModal.value = false;
      userToDelete.value = null;
    };

    // Supprimer un utilisateur
    const deleteUser = async () => {
      if (!userToDelete.value) return;
      
      try {
        await adminApi.delete(`/admin/users/${userToDelete.value.id}`);
        // Recharger la liste des utilisateurs après la suppression
        await loadUsers();
        // Recharger les statistiques
        await loadStats();
        showDeleteModal.value = false;
        userToDelete.value = null;
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', err);
        error.value = 'Erreur lors de la suppression de l\'utilisateur.';
      }
    };

    // Déconnexion
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      router.push('/login');
    };

    // Retour à la page d'accueil
    const goToHome = () => {
      router.push('/home');
    };

    // Charger les données au montage du composant
    onMounted(async () => {
      await loadUsers();
      await loadStats();
    });

    return {
      username,
      users,
      usersCount,
      systemInfo,
      loading,
      error,
      searchTerm,
      filteredUsers,
      showDeleteModal,
      userToDelete,
      formattedServerTime,
      loadUsers,
      confirmDelete,
      cancelDelete,
      deleteUser,
      logout,
      goToHome
    };
  }
};
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Arial', sans-serif;
}

.admin-header {
  background: linear-gradient(90deg, 
    rgba(138, 43, 226, 0.9) 0%,
    rgba(0, 191, 255, 0.9) 50%,
    rgba(0, 255, 157, 0.9) 100%
  );
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn, .home-btn {
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
}

.logout-btn:hover, .home-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.stats-section,
.users-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.stats-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stats-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #8a2be2;
  margin: 0.5rem 0;
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-bar button {
  padding: 0.8rem 1.5rem;
  background-color: #00bfff;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-bar button:hover {
  background-color: #00a6e6;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.users-table tr:hover {
  background-color: #f8f9fa;
}

.delete-btn {
  padding: 0.5rem 1rem;
  background-color: #ff4d4d;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #ff3333;
}

.loading, .error {
  padding: 2rem;
  text-align: center;
}

.error {
  color: #ff4d4d;
}

/* Modal de confirmation */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.warning {
  color: #ff4d4d;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.confirm-btn, .cancel-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.confirm-btn {
  background-color: #ff4d4d;
  color: white;
}

.confirm-btn:hover {
  background-color: #ff3333;
}

.cancel-btn {
  background-color: #eee;
  color: #333;
}

.cancel-btn:hover {
  background-color: #ddd;
}
</style> 