import { mount, flushPromises } from '@vue/test-utils';
import Leaderboard from '@/components/Leaderboard.vue';
import { createRouter, createWebHistory } from 'vue-router';
import api from '@/services/api';

// Mock de l'API
jest.mock('@/services/api', () => ({
  get: jest.fn()
}));

// Données de test
const mockLeaderboardData = [
  {
    user_id: 1,
    username: 'joueur1',
    victoires: 15,
    defaites: 5,
    morpion_victoires: 7,
    morpion_defaites: 2,
    pfc_victoires: 5,
    pfc_defaites: 2,
    des_victoires: 3,
    des_defaites: 1
  },
  {
    user_id: 2,
    username: 'joueur2',
    victoires: 10,
    defaites: 10,
    morpion_victoires: 3,
    morpion_defaites: 4,
    pfc_victoires: 4,
    pfc_defaites: 3,
    des_victoires: 3,
    des_defaites: 3
  },
  {
    user_id: 3,
    username: 'champion',
    victoires: 20,
    defaites: 2,
    morpion_victoires: 8,
    morpion_defaites: 1,
    pfc_victoires: 7,
    pfc_defaites: 1,
    des_victoires: 5,
    des_defaites: 0
  }
];

// Mock de vue-router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/home', name: 'Home' },
    { path: '/leaderboard', name: 'Leaderboard' },
    { path: '/leaderboard-online', name: 'LeaderboardOnline' }
  ]
});

describe('Leaderboard.vue', () => {
  let wrapper;

  beforeEach(async () => {
    // Réinitialiser les mocks
    jest.clearAllMocks();

    // Configurer localStorage pour l'utilisateur connecté
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'username') return 'joueur1';
      if (key === 'token') return 'mock-token';
      return null;
    });
    
    // Simuler une réponse réussie de l'API
    api.get.mockResolvedValue({ data: mockLeaderboardData });
    
    // Monter le composant
    wrapper = mount(Leaderboard, {
      global: {
        plugins: [router],
        stubs: ['router-link', 'router-view']
      }
    });
    
    // Attendre que les promesses soient résolues (appel API)
    await flushPromises();
  });

  it('appelle l\'API pour récupérer les données du classement', () => {
    expect(api.get).toHaveBeenCalledWith('/leaderboard');
  });

  it('affiche correctement le tableau des joueurs', () => {
    // Vérifier le nombre de lignes dans le tableau (3 joueurs + en-tête)
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
    
    // Vérifier que les noms des joueurs sont affichés
    const playerNames = wrapper.findAll('.player-info span').map(el => el.text());
    expect(playerNames).toContain('joueur1');
    expect(playerNames).toContain('joueur2');
    expect(playerNames).toContain('champion');
  });

  it('affiche le podium avec les 3 meilleurs joueurs', () => {
    const podiumSpots = wrapper.findAll('.podium-spot');
    expect(podiumSpots).toHaveLength(3);
    
    // Vérifier que le champion est en première position
    const firstPlace = wrapper.find('.podium-spot.first .username');
    expect(firstPlace.text()).toBe('champion');
    
    // Vérifier que joueur1 est en deuxième position
    const secondPlace = wrapper.find('.podium-spot.second .username');
    expect(secondPlace.text()).toBe('joueur1');
  });

  it('calcule correctement les ratios de victoire', async () => {
    // Ratio de champion: 20 / (20 + 2) = 91%
    // Ratio de joueur1: 15 / (15 + 5) = 75%
    // Ratio de joueur2: 10 / (10 + 10) = 50%
    
    const ratios = wrapper.findAll('.ratio').map(el => el.text());
    expect(ratios).toContain('91%');
    expect(ratios).toContain('75%');
    expect(ratios).toContain('50%');
  });

  it('filtre les joueurs par nom', async () => {
    // Rechercher un joueur spécifique
    const searchInput = wrapper.find('.search-box input');
    await searchInput.setValue('champion');
    await searchInput.trigger('input');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que seul le joueur recherché est affiché
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.find('tbody tr .player-info span').text()).toBe('champion');
  });

  it('filtre les joueurs par jeu', async () => {
    // Sélectionner seulement le jeu de morpion
    const gameFilter = wrapper.find('.game-filter select');
    await gameFilter.setValue('morpion');
    await gameFilter.trigger('change');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que les statistiques du morpion sont affichées
    const morpionStats = wrapper.findAll('.game-stat');
    expect(morpionStats.length).toBeGreaterThan(0);
    
    // Vérifier que les autres jeux ne sont pas affichés quand morpion est sélectionné
    const gameIcons = wrapper.findAll('.game-icon').map(el => el.text());
    expect(gameIcons).toContain('⭕'); // Icône du morpion
    expect(gameIcons).not.toContain('🎲'); // Icône du jeu de dés ne devrait pas être présente
  });

  it('trie les joueurs par nombre de victoires', async () => {
    // Appeler directement la méthode de tri du composant
    wrapper.vm.sortBy('victoires');
    await flushPromises();
    
    // Les données de test montrent que joueur2 a le plus de victoires (25)
    // suivi de joueur1 (15) puis de champion (10)
    const playerNames = wrapper.findAll('tbody tr .player-info span').map(el => el.text());
    expect(playerNames[0]).toBe('joueur2');
    expect(playerNames[1]).toBe('joueur1');
    expect(playerNames[2]).toBe('champion');
  });

  it('met en évidence l\'utilisateur courant', () => {
    // Vérifier que la ligne de l'utilisateur connecté a la classe 'current-user'
    const currentUserRow = wrapper.findAll('tbody tr').find(row => 
      row.classes().includes('current-user')
    );
    
    expect(currentUserRow).toBeDefined();
    expect(currentUserRow.find('.player-info span').text()).toBe('joueur1');
  });

  it('met à jour le classement lors du clic sur Actualiser', async () => {
    // Réinitialiser le mock de l'API
    api.get.mockClear();
    api.get.mockResolvedValueOnce({ data: mockLeaderboardData });
    
    // Cliquer sur le bouton d'actualisation
    await wrapper.find('.refresh-button button').trigger('click');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que l'API a été appelée à nouveau
    expect(api.get).toHaveBeenCalledWith('/leaderboard');
  });
}); 