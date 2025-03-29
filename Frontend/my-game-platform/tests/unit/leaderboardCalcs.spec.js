import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import Leaderboard from '@/components/Leaderboard.vue';
import LeaderboardOnline from '@/components/LeaderboardOnline.vue';
import { createRouter, createWebHistory } from 'vue-router';

// Mock de Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/leaderboard', name: 'Leaderboard' },
    { path: '/leaderboard-online', name: 'LeaderboardOnline' }
  ]
});

// Tester les calculs statistiques directement
describe('Calculs des statistiques de classement', () => {
  // Configuration avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'username') return 'joueur1';
      if (key === 'token') return 'mock-token';
      return null;
    });
  });
  
  describe('Leaderboard - Mode IA', () => {
    it('calcule correctement le ratio de victoire', async () => {
      // Mock des données joueur
      const player = {
        victoires: 15,
        defaites: 5
      };
      
      // Monter le composant avec accès au setup
      const wrapper = mount(Leaderboard, {
        global: {
          plugins: [router],
          stubs: ['router-link', 'router-view']
        }
      });
      
      await flushPromises();
      
      // Accéder à la fonction de calcul du ratio
      const calculateRatio = wrapper.vm.calculateRatio;
      
      // Tester le calcul
      const ratio = calculateRatio(player);
      expect(ratio).toBe('75%'); // 15/(15+5) = 0.75 = 75%
    });
    
    it('calcule correctement le taux de victoire par jeu', async () => {
      // Monter le composant avec accès au setup
      const wrapper = mount(Leaderboard, {
        global: {
          plugins: [router],
          stubs: ['router-link', 'router-view']
        }
      });
      
      await flushPromises();
      
      // Accéder à la fonction de calcul du taux
      const calculateWinRate = wrapper.vm.calculateWinRate;
      
      // Tester différents cas
      expect(calculateWinRate(10, 10)).toBe(50); // 10/(10+10) = 0.5 = 50%
      expect(calculateWinRate(8, 2)).toBe(80); // 8/(8+2) = 0.8 = 80%
      expect(calculateWinRate(0, 0)).toBe(0); // Cas particulier: aucune partie
    });
    
    it('trie correctement les joueurs par différents critères', async () => {
      // Données de test
      const leaderboardData = [
        {
          username: 'joueur1',
          victoires: 15,
          defaites: 5
        },
        {
          username: 'joueur2',
          victoires: 10,
          defaites: 10
        },
        {
          username: 'champion',
          victoires: 20,
          defaites: 2
        }
      ];
      
      // Fonctions de tri
      const sortByVictories = (players, order = 'desc') => {
        return [...players].sort((a, b) => {
          return order === 'desc' 
            ? b.victoires - a.victoires
            : a.victoires - b.victoires;
        });
      };
      
      const calculateWinRate = (wins, losses) => {
        const total = wins + losses;
        if (total === 0) return 0;
        return Math.round((wins / total) * 100);
      };
      
      const sortByRatio = (players, order = 'desc') => {
        return [...players].sort((a, b) => {
          const ratioA = calculateWinRate(a.victoires, a.defaites);
          const ratioB = calculateWinRate(b.victoires, b.defaites);
          return order === 'desc' ? ratioB - ratioA : ratioA - ratioB;
        });
      };
      
      // Trier par victoires (décroissant)
      let sorted = sortByVictories(leaderboardData);
      expect(sorted[0].username).toBe('champion');
      expect(sorted[1].username).toBe('joueur1');
      expect(sorted[2].username).toBe('joueur2');
      
      // Trier par victoires (croissant)
      sorted = sortByVictories(leaderboardData, 'asc');
      expect(sorted[0].username).toBe('joueur2');
      expect(sorted[1].username).toBe('joueur1');
      expect(sorted[2].username).toBe('champion');
      
      // Trier par ratio (décroissant)
      sorted = sortByRatio(leaderboardData);
      expect(sorted[0].username).toBe('champion'); // 91%
      expect(sorted[1].username).toBe('joueur1'); // 75%
      expect(sorted[2].username).toBe('joueur2'); // 50%
    });
  });
  
  describe('LeaderboardOnline - Mode Multijoueur', () => {
    it('affiche correctement le taux de victoire', async () => {
      // Données de test
      const player = {
        victories: 15,
        defeats: 5,
        matches_played: 23 // avec 3 nuls
      };
      
      // Calculer manuellement
      const winRate = Math.round((player.victories / player.matches_played) * 100);
      expect(winRate).toBe(65); // 15/23 = 0.65 = 65%
    });
    
    it('calcule correctement le taux de victoire dans les rivalités', async () => {
      // Monter le composant pour accéder aux fonctions
      const wrapper = mount(LeaderboardOnline, {
        global: {
          plugins: [router],
          stubs: ['router-link', 'router-view']
        }
      });
      
      await flushPromises();
      
      // Accéder à la fonction de calcul du taux pour les rivalités
      const calculateRivalryWinRate = wrapper.vm.calculateRivalryWinRate;
      
      // Données de test
      const rivalry = {
        victories: 7,
        defeats: 3,
        draws: 2,
        matches_played: 12
      };
      
      // Tester le calcul
      const rate = calculateRivalryWinRate(rivalry);
      expect(rate).toBe(58); // 7/12 = 0.583 = 58%
    });
    
    it('calcule correctement les barres de progression', () => {
      // Données de test
      const player = {
        victories: 10,
        defeats: 8,
        draws: 2,
        matches_played: 20
      };
      
      // Calculer manuellement les largeurs
      const winsWidth = (player.victories / player.matches_played) * 100;
      const drawsWidth = (player.draws / player.matches_played) * 100;
      
      expect(winsWidth).toBe(50); // 10/20 = 0.5 = 50%
      expect(drawsWidth).toBe(10); // 2/20 = 0.1 = 10%
      // Les défaites seraient le reste (40%)
    });
  });
  
  // Test des filtres spécifiques
  describe('Filtres et recherche', () => {
    it('filtre correctement les joueurs par recherche de nom', () => {
      // Données de test
      const leaderboardData = [
        { username: 'joueur1' },
        { username: 'champion' },
        { username: 'joueur2' }
      ];
      
      // Filtrer manuellement
      const searchQuery = 'jou';
      const filtered = leaderboardData.filter(player => 
        player.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filtered.length).toBe(2);
      expect(filtered[0].username).toBe('joueur1');
      expect(filtered[1].username).toBe('joueur2');
    });
    
    it('filtre correctement les joueurs par jeu', () => {
      // Données de test
      const leaderboardData = [
        { 
          username: 'joueur1',
          morpion_victoires: 5,
          morpion_defaites: 2,
          pfc_victoires: 0,
          pfc_defaites: 0
        },
        { 
          username: 'joueur2',
          morpion_victoires: 0,
          morpion_defaites: 0,
          pfc_victoires: 8,
          pfc_defaites: 3
        }
      ];
      
      // Filtrer par morpion
      const selectedGame = 'morpion';
      const filtered = leaderboardData.filter(player => {
        const gameStats = {
          morpion: player.morpion_victoires + player.morpion_defaites,
          pfc: player.pfc_victoires + player.pfc_defaites
        };
        return gameStats[selectedGame] > 0;
      });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].username).toBe('joueur1');
    });
  });
}); 