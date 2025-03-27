<template>
    <div class="leaderboard-container">
        <nav class="navbar">
            <router-link to="/home" class="home-link">
                <i class="fas fa-home"></i> Accueil
            </router-link>
            <h1>Classement des Joueurs</h1>
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
                    <option value="morpion">Morpion</option>
                    <option value="pfc">Pierre Feuille Ciseaux</option>
                    <option value="des">Jeu des Dés</option>
                </select>
            </div>
        </div>

        <div class="top-players" v-if="topPlayers.length > 0">
            <h2>Top 3 Joueurs</h2>
            <div class="podium">
                <div class="podium-spot second" v-if="topPlayers[1]">
                    <div class="crown">🥈</div>
                    <div class="avatar">{{ topPlayers[1].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[1].username }}</div>
                    <div class="score">{{ topPlayers[1].victoires }} victoires</div>
                </div>
                <div class="podium-spot first" v-if="topPlayers[0]">
                    <div class="crown">👑</div>
                    <div class="avatar">{{ topPlayers[0].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[0].username }}</div>
                    <div class="score">{{ topPlayers[0].victoires }} victoires</div>
                </div>
                <div class="podium-spot third" v-if="topPlayers[2]">
                    <div class="crown">🥉</div>
                    <div class="avatar">{{ topPlayers[2].username.charAt(0) }}</div>
                    <div class="username">{{ topPlayers[2].username }}</div>
                    <div class="score">{{ topPlayers[2].victoires }} victoires</div>
                </div>
            </div>
        </div>

        <div class="leaderboard-table" v-if="filteredLeaderboard.length > 0">
            <table>
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Joueur</th>
                        <th @click="sortBy('victoires')" class="sortable">
                            Victoires 
                            <i class="fas" :class="getSortIcon('victoires')"></i>
                        </th>
                        <th @click="sortBy('ratio')" class="sortable">
                            Ratio V/D
                            <i class="fas" :class="getSortIcon('ratio')"></i>
                        </th>
                        <th>Statistiques détaillées</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(player, index) in filteredLeaderboard" :key="player.username" 
                        :class="{ 'current-user': player.username === currentUser }">
                        <td class="rank">{{ index + 1 }}</td>
                        <td class="player-info">
                            <div class="avatar">{{ player.username.charAt(0) }}</div>
                            <span>{{ player.username }}</span>
                        </td>
                        <td class="victories">{{ player.victoires }}</td>
                        <td class="ratio">{{ calculateRatio(player) }}</td>
                        <td class="detailed-stats">
                            <div class="stats-grid">
                                <div class="game-stat" v-if="selectedGame === 'all' || selectedGame === 'morpion'">
                                    <span class="game-icon">⭕</span>
                                    <div class="stat-bar">
                                        <div class="stat-fill" 
                                             :style="{ width: calculateWinRate(player.morpion_victoires, player.morpion_defaites) + '%' }">
                                        </div>
                                    </div>
                                    <span class="stat-text">{{ player.morpion_victoires }}V/{{ player.morpion_defaites }}D</span>
                                </div>
                                <div class="game-stat" v-if="selectedGame === 'all' || selectedGame === 'pfc'">
                                    <span class="game-icon">✌️</span>
                                    <div class="stat-bar">
                                        <div class="stat-fill" 
                                             :style="{ width: calculateWinRate(player.pfc_victoires, player.pfc_defaites) + '%' }">
                                        </div>
                                    </div>
                                    <span class="stat-text">{{ player.pfc_victoires }}V/{{ player.pfc_defaites }}D</span>
                                </div>
                                <div class="game-stat" v-if="selectedGame === 'all' || selectedGame === 'des'">
                                    <span class="game-icon">🎲</span>
                                    <div class="stat-bar">
                                        <div class="stat-fill" 
                                             :style="{ width: calculateWinRate(player.des_victoires, player.des_defaites) + '%' }">
                                        </div>
                                    </div>
                                    <span class="stat-text">{{ player.des_victoires }}V/{{ player.des_defaites }}D</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="no-data">
            <p>Aucun joueur trouvé</p>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

export default {
    name: "PlayerLeaderboard",
    setup() {
        const leaderboard = ref([]);
        const searchQuery = ref('');
        const selectedGame = ref('all');
        const sortField = ref('victoires');
        const sortOrder = ref('desc');
        const isRefreshing = ref(false);
        const currentUser = ref(localStorage.getItem('username'));

        const fetchLeaderboard = async () => {
            try {
                isRefreshing.value = true;
                const response = await api.get("/leaderboard");
                leaderboard.value = response.data;
            } catch (error) {
                console.error("Erreur lors de la récupération du classement", error);
            } finally {
                isRefreshing.value = false;
            }
        };

        const calculateRatio = (player) => {
            const total = player.victoires + player.defaites;
            if (total === 0) return '0%';
            return Math.round((player.victoires / total) * 100) + '%';
        };

        const calculateWinRate = (wins, losses) => {
            const total = wins + losses;
            if (total === 0) return 0;
            return Math.round((wins / total) * 100);
        };

        const filteredLeaderboard = computed(() => {
            let filtered = [...leaderboard.value];

            if (searchQuery.value) {
                filtered = filtered.filter(player => 
                    player.username.toLowerCase().includes(searchQuery.value.toLowerCase())
                );
            }

            if (selectedGame.value !== 'all') {
                filtered = filtered.filter(player => {
                    const gameStats = {
                        morpion: player.morpion_victoires + player.morpion_defaites,
                        pfc: player.pfc_victoires + player.pfc_defaites,
                        des: player.des_victoires + player.des_defaites
                    };
                    return gameStats[selectedGame.value] > 0;
                });
            }

            return filtered.sort((a, b) => {
                if (sortField.value === 'ratio') {
                    const ratioA = calculateWinRate(a.victoires, a.defaites);
                    const ratioB = calculateWinRate(b.victoires, b.defaites);
                    return sortOrder.value === 'desc' ? ratioB - ratioA : ratioA - ratioB;
                }
                return sortOrder.value === 'desc' 
                    ? b[sortField.value] - a[sortField.value]
                    : a[sortField.value] - b[sortField.value];
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

        onMounted(fetchLeaderboard);

        return {
            leaderboard,
            filteredLeaderboard,
            topPlayers,
            searchQuery,
            selectedGame,
            isRefreshing,
            currentUser,
            fetchLeaderboard,
            calculateRatio,
            calculateWinRate,
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
    backdrop-filter: blur(5px);
}

.home-link {
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.home-link:hover {
    color: #00bfff;
    transform: scale(1.05);
}

h1 {
    font-size: 2rem;
    color: #fff;
    text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
    margin: 0;
}

.filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.search-box input, .game-filter select {
    padding: 0.8rem;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 1rem;
}

.search-box input:focus, .game-filter select:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.5);
}

.top-players {
    margin-bottom: 3rem;
}

.podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 2rem;
    margin-top: 2rem;
}

.podium-spot {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: transform 0.3s ease;
}

.podium-spot:hover {
    transform: translateY(-5px);
}

.podium-spot.first {
    height: 200px;
    background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
}

.podium-spot.second {
    height: 170px;
    background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
}

.podium-spot.third {
    height: 140px;
    background: linear-gradient(135deg, #cd7f32 0%, #a05a2c 100%);
}

.crown {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.avatar {
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.username {
    font-weight: bold;
    margin-bottom: 0.3rem;
}

.score {
    font-size: 0.9rem;
    opacity: 0.8;
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;
}

th {
    background: rgba(0, 191, 255, 0.1);
    padding: 1rem;
    text-align: left;
    font-weight: bold;
    cursor: pointer;
}

th.sortable:hover {
    background: rgba(0, 191, 255, 0.2);
}

td {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

tr:hover {
    background: rgba(255, 255, 255, 0.1);
}

.current-user {
    background: rgba(0, 191, 255, 0.1);
}

.player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.detailed-stats {
    padding: 0.5rem;
}

.stats-grid {
    display: grid;
    gap: 0.5rem;
}

.game-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.game-icon {
    font-size: 1.2rem;
    width: 30px;
}

.stat-bar {
    flex-grow: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.stat-fill {
    height: 100%;
    background: linear-gradient(90deg, #00bfff, #00ff9d);
    transition: width 0.3s ease;
}

.stat-text {
    font-size: 0.8rem;
    min-width: 80px;
    text-align: right;
}

.refresh-button button {
    background: transparent;
    border: 2px solid rgba(0, 191, 255, 0.5);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.refresh-button button:hover {
    background: rgba(0, 191, 255, 0.2);
    border-color: #00bfff;
}

.refreshing {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.no-data {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    margin-top: 2rem;
}
</style>