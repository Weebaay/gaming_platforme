<template>
    <div class="leaderboard-container">
        <nav class="navbar">
            <router-link to="/home" class="home-link">
                <i class="fas fa-home"></i> Accueil
            </router-link>
            <h1>Classement Multijoueur</h1>
            <div class="mode-selector">
                <router-link to="/leaderboard" class="mode-link">Mode IA</router-link>
                <router-link to="/leaderboard-online" class="mode-link active">Mode Multijoueur</router-link>
            </div>
            <div class="refresh-button">
                <button @click="fetchLeaderboard" :class="{ 'refreshing': isRefreshing }">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
        </nav>

        <div class="filters">
            <div class="search-box">
                <input 
                    type="text" 
                    v-model="searchQuery" 
                    placeholder="Rechercher un joueur..."
                    @input="filterLeaderboard"
                />
            </div>
            <div class="game-filter">
                <select v-model="selectedGame" @change="filterLeaderboard">
                    <option value="all">Tous les jeux</option>
                    <option value="Morpion">Morpion</option>
                    <option value="PierreFeuilleCiseaux">Pierre Feuille Ciseaux</option>
                    <option value="JeuDesDes">Jeu des Dés</option>
                </select>
            </div>
        </div>

        <div class="top-players" v-if="topPlayers.length > 0">
            <h2>Top 3 Joueurs Multijoueur</h2>
            <div class="podium">
                <div class="podium-spot second" v-if="topPlayers[1]">
                    <div class="crown">🥈</div>
                    <div class="avatar">{{ topPlayers[1].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[1].username }}</div>
                    <div class="score">{{ topPlayers[1].points }} points</div>
                    <div class="score">{{ topPlayers[1].victories }} victoires</div>
                </div>
                <div class="podium-spot first" v-if="topPlayers[0]">
                    <div class="crown">👑</div>
                    <div class="avatar">{{ topPlayers[0].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[0].username }}</div>
                    <div class="score">{{ topPlayers[0].points }} points</div>
                    <div class="score">{{ topPlayers[0].victories }} victoires</div>
                </div>
                <div class="podium-spot third" v-if="topPlayers[2]">
                    <div class="crown">🥉</div>
                    <div class="avatar">{{ topPlayers[2].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[2].username }}</div>
                    <div class="score">{{ topPlayers[2].points }} points</div>
                    <div class="score">{{ topPlayers[2].victories }} victoires</div>
                </div>
            </div>
        </div>

        <div class="leaderboard-table" v-if="filteredLeaderboard.length > 0">
            <table>
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Joueur</th>
                        <th @click="sortBy('points')" class="sortable">
                            Points 
                            <i class="fas" :class="getSortIcon('points')"></i>
                        </th>
                        <th @click="sortBy('victories')" class="sortable">
                            Victoires 
                            <i class="fas" :class="getSortIcon('victories')"></i>
                        </th>
                        <th @click="sortBy('win_rate')" class="sortable">
                            Ratio V/D
                            <i class="fas" :class="getSortIcon('win_rate')"></i>
                        </th>
                        <th>Statistiques</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="player in filteredLeaderboard" :key="player.user_id" 
                        :class="{ 'current-user': player.username === currentUser }">
                        <td class="rank">{{ player.rank }}</td>
                        <td class="player-info">
                            <div class="avatar">{{ player.username.charAt(0) }}</div>
                            <span>{{ player.username }}</span>
                        </td>
                        <td class="points">{{ player.points }}</td>
                        <td class="victories">{{ player.victories }}</td>
                        <td class="ratio">{{ player.win_rate }}%</td>
                        <td class="detailed-stats">
                            <div class="stats-grid">
                                <div class="stat-progress">
                                    <span>V/D/E: {{ player.victories }}/{{ player.defeats }}/{{ player.draws }}</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill wins" :style="{ width: (player.victories / (player.matches_played || 1) * 100) + '%' }"></div>
                                        <div class="progress-fill draws" :style="{ width: (player.draws / (player.matches_played || 1) * 100) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="actions">
                            <button class="btn-details" @click="showPlayerDetails(player)">
                                <i class="fas fa-chart-line"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else-if="isLoading" class="loading">
            <p>Chargement du classement...</p>
            <div class="loading-spinner"></div>
        </div>
        <div v-else class="no-data">
            <p>Aucun joueur trouvé dans le classement multijoueur</p>
        </div>

        <!-- Modal pour les détails du joueur -->
        <div v-if="selectedPlayer" class="player-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>{{ selectedPlayer.username }}</h2>
                    <button class="close-button" @click="selectedPlayer = null">×</button>
                </div>
                <div class="modal-body">
                    <h3>Statistiques globales</h3>
                    <div class="stats-summary">
                        <div class="stat-item">
                            <span class="stat-label">Parties jouées</span>
                            <span class="stat-value">{{ selectedPlayer.matches_played }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Points</span>
                            <span class="stat-value">{{ selectedPlayer.points }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Victoires</span>
                            <span class="stat-value">{{ selectedPlayer.victories }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Défaites</span>
                            <span class="stat-value">{{ selectedPlayer.defeats }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Égalités</span>
                            <span class="stat-value">{{ selectedPlayer.draws }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Ratio de victoire</span>
                            <span class="stat-value">{{ selectedPlayer.win_rate }}%</span>
                        </div>
                    </div>
                    
                    <h3>Historique des confrontations</h3>
                    <div v-if="playerRivalries.length > 0" class="rivalries-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Adversaire</th>
                                    <th>Jeu</th>
                                    <th>V/D/E</th>
                                    <th>Ratio</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="rivalry in playerRivalries" :key="rivalry.opponent_id">
                                    <td>{{ rivalry.opponent_username }}</td>
                                    <td>{{ getRivalryGameIcon(rivalry.game_name) }}</td>
                                    <td>{{ rivalry.victories }}/{{ rivalry.defeats }}/{{ rivalry.draws }}</td>
                                    <td>{{ calculateRivalryWinRate(rivalry) }}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="no-rivalries">
                        <p>Aucune confrontation enregistrée</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

export default {
    name: "LeaderboardOnline",
    setup() {
        const leaderboard = ref([]);
        const searchQuery = ref('');
        const selectedGame = ref('all');
        const sortField = ref('points');
        const sortOrder = ref('desc');
        const isRefreshing = ref(false);
        const isLoading = ref(true);
        const currentUser = ref(localStorage.getItem('username'));
        const selectedPlayer = ref(null);
        const playerRivalries = ref([]);
        
        const fetchLeaderboard = async () => {
            try {
                isRefreshing.value = true;
                isLoading.value = true;
                
                let endpoint = '/leaderboard/multiplayer';
                if (selectedGame.value !== 'all') {
                    endpoint += `?game_name=${selectedGame.value}`;
                }
                
                const response = await api.get(endpoint);
                leaderboard.value = response.data;
            } catch (error) {
                console.error("Erreur lors de la récupération du classement multijoueur", error);
            } finally {
                isRefreshing.value = false;
                isLoading.value = false;
            }
        };
        
        const fetchPlayerRivalries = async (playerId) => {
            try {
                const response = await api.get(`/multiplayer/rivalries/${playerId}`);
                playerRivalries.value = response.data;
            } catch (error) {
                console.error("Erreur lors de la récupération des rivalités", error);
                playerRivalries.value = [];
            }
        };
        
        const showPlayerDetails = async (player) => {
            selectedPlayer.value = player;
            await fetchPlayerRivalries(player.user_id);
        };
        
        const calculateRivalryWinRate = (rivalry) => {
            const total = rivalry.matches_played;
            if (total === 0) return 0;
            return Math.round((rivalry.victories / total) * 100);
        };
        
        const getRivalryGameIcon = (gameName) => {
            const icons = {
                'Morpion': '⭕',
                'PierreFeuilleCiseaux': '✌️',
                'JeuDesDes': '🎲'
            };
            return icons[gameName] || gameName;
        };

        const filteredLeaderboard = computed(() => {
            if (!leaderboard.value.length) return [];
            
            let filtered = [...leaderboard.value];

            if (searchQuery.value) {
                filtered = filtered.filter(player => 
                    player.username.toLowerCase().includes(searchQuery.value.toLowerCase())
                );
            }

            return filtered.sort((a, b) => {
                if (sortField.value === 'win_rate') {
                    const rateA = parseFloat(a.win_rate) || 0;
                    const rateB = parseFloat(b.win_rate) || 0;
                    return sortOrder.value === 'desc' ? rateB - rateA : rateA - rateB;
                }
                return sortOrder.value === 'desc' 
                    ? (b[sortField.value] || 0) - (a[sortField.value] || 0)
                    : (a[sortField.value] || 0) - (b[sortField.value] || 0);
            });
        });

        const topPlayers = computed(() => {
            return filteredLeaderboard.value.slice(0, 3);
        });

        const sortBy = (field) => {
            if (sortField.value === field) {
                sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
            } else {
                sortField.value = field;
                sortOrder.value = 'desc';
            }
        };

        const getSortIcon = (field) => {
            if (sortField.value !== field) return 'fa-sort';
            return sortOrder.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        };
        
        const filterLeaderboard = () => {
            fetchLeaderboard();
        };

        onMounted(fetchLeaderboard);

        return {
            leaderboard,
            filteredLeaderboard,
            topPlayers,
            searchQuery,
            selectedGame,
            isRefreshing,
            isLoading,
            currentUser,
            selectedPlayer,
            playerRivalries,
            fetchLeaderboard,
            showPlayerDetails,
            calculateRivalryWinRate,
            getRivalryGameIcon,
            filterLeaderboard,
            sortBy,
            getSortIcon
        };
    }
};
</script>

<style scoped>
.leaderboard-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 2rem;
    color: white;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mode-selector {
    display: flex;
    gap: 10px;
}

.mode-link {
    padding: 8px 15px;
    border-radius: 5px;
    color: white;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.mode-link.active, .mode-link:hover {
    background: rgba(81, 98, 231, 0.6);
}

.home-link {
    color: white;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.3s;
}

.home-link:hover {
    color: #5162e7;
}

.refresh-button button {
    background: rgba(81, 98, 231, 0.3);
    border: none;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
}

.refresh-button button:hover {
    background: rgba(81, 98, 231, 0.6);
}

.refreshing {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.filters {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
}

.search-box input, .game-filter select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    padding: 0.5rem 1rem;
    color: white;
    width: 250px;
}

.search-box input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.top-players {
    margin-bottom: 2rem;
    text-align: center;
}

.podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 1rem;
    margin-top: 1rem;
}

.podium-spot {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: transform 0.3s;
}

.podium-spot:hover {
    transform: translateY(-5px);
}

.first {
    height: 220px;
    justify-content: flex-end;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%);
    border: 1px solid rgba(255, 215, 0, 0.5);
    z-index: 3;
}

.second {
    height: 180px;
    justify-content: flex-end;
    background: linear-gradient(135deg, rgba(192, 192, 192, 0.2) 0%, rgba(192, 192, 192, 0.1) 100%);
    border: 1px solid rgba(192, 192, 192, 0.5);
    z-index: 2;
}

.third {
    height: 150px;
    justify-content: flex-end;
    background: linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(205, 127, 50, 0.1) 100%);
    border: 1px solid rgba(205, 127, 50, 0.5);
    z-index: 1;
}

.crown {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5162e7 0%, #3644b5 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.username {
    font-weight: bold;
    margin-bottom: 0.25rem;
}

.score {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
}

.leaderboard-table {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

th {
    background: rgba(81, 98, 231, 0.2);
    font-weight: bold;
}

.sortable {
    cursor: pointer;
}

.sortable:hover {
    background: rgba(81, 98, 231, 0.4);
}

.player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.player-info .avatar {
    width: 35px;
    height: 35px;
    font-size: 1rem;
}

.stat-progress {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
}

.progress-fill {
    height: 100%;
}

.wins {
    background: #4caf50;
}

.draws {
    background: #ff9800;
}

.current-user {
    background: rgba(81, 98, 231, 0.1);
}

.no-data, .loading {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    margin-top: 2rem;
}

.loading-spinner {
    margin: 20px auto;
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.2);
    border-top-color: #5162e7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.btn-details {
    background: rgba(81, 98, 231, 0.3);
    border: none;
    border-radius: 5px;
    width: 36px;
    height: 36px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-details:hover {
    background: rgba(81, 98, 231, 0.6);
}

/* Modal styles */
.player-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 10px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.modal-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
}

.modal-body {
    padding: 1.5rem;
}

.stats-summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: bold;
}

.rivalries-list {
    margin-top: 1rem;
}

.rivalries-list table {
    width: 100%;
}

.no-rivalries {
    text-align: center;
    padding: 1rem;
    color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
    .filters {
        flex-direction: column;
        gap: 1rem;
    }
    
    .search-box input, .game-filter select {
        width: 100%;
    }
    
    .podium {
        flex-direction: column;
        align-items: center;
    }
    
    .first, .second, .third {
        height: auto;
        width: 80%;
        padding: 1.5rem 1rem;
    }
    
    th, td {
        padding: 0.5rem;
    }
    
    .stats-summary {
        grid-template-columns: 1fr 1fr;
    }
}
</style> 