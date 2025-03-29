import { mount, flushPromises } from '@vue/test-utils';
import LeaderboardOnline from '@/components/LeaderboardOnline.vue';
import { createRouter, createWebHistory } from 'vue-router';
import api from '@/services/api';

// Mock de l'API
jest.mock('@/services/api', () => ({
  get: jest.fn()
}));

// Données de test pour le classement multijoueur
const mockLeaderboardData = [
  {
    user_id: 1,
    username: 'joueur1',
    points: 150,
    victories: 15,
    defeats: 5,
    draws: 3,
    matches_played: 23,
    win_rate: 65
  },
  {
    user_id: 2,
    username: 'joueur2',
    points: 100,
    victories: 10,
    defeats: 10,
    draws: 5,
    matches_played: 25,
    win_rate: 40
  },
  {
    user_id: 3,
    username: 'champion',
    points: 200,
    victories: 20,
    defeats: 2,
    draws: 1,
    matches_played: 23,
    win_rate: 87
  }
];

// Données de test pour les rivalités
const mockRivalriesData = [
  {
    opponent_id: 1,
    opponent_username: 'joueur1',
    game_name: 'Morpion',
    victories: 5,
    defeats: 2,
    draws: 1,
    matches_played: 8
  },
  {
    opponent_id: 2,
    opponent_username: 'joueur2',
    game_name: 'PierreFeuilleCiseaux',
    victories: 7,
    defeats: 3,
    draws: 0,
    matches_played: 10
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

describe('LeaderboardOnline.vue', () => {
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
    
    // Simuler une réponse réussie de l'API pour le classement
    api.get.mockImplementation((url) => {
      if (url === '/leaderboard/multiplayer') {
        return Promise.resolve({ data: mockLeaderboardData });
      }
      if (url.includes('/multiplayer/rivalries/')) {
        return Promise.resolve({ data: mockRivalriesData });
      }
      return Promise.reject(new Error('Invalid URL'));
    });
    
    // Monter le composant
    wrapper = mount(LeaderboardOnline, {
      global: {
        plugins: [router],
        stubs: ['router-link', 'router-view']
      }
    });
    
    // Attendre que les promesses soient résolues (appel API)
    await flushPromises();
  });

  it('appelle l\'API pour récupérer les données du classement multijoueur', () => {
    expect(api.get).toHaveBeenCalledWith('/leaderboard/multiplayer');
  });

  it('affiche correctement le tableau des joueurs', () => {
    // Vérifier le nombre de lignes dans le tableau
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
    
    // Vérifier que le champion est en première position (plus de points)
    const firstPlace = wrapper.find('.podium-spot.first .username');
    expect(firstPlace.text()).toBe('champion');
    
    // Vérifier les médailles affichées
    expect(wrapper.find('.podium-spot.first .crown').text()).toBe('👑');
    expect(wrapper.find('.podium-spot.second .crown').text()).toBe('🥈');
    expect(wrapper.find('.podium-spot.third .crown').text()).toBe('🥉');
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
    // Mock de l'API pour la sélection d'un jeu spécifique
    api.get.mockClear();
    api.get.mockResolvedValueOnce({ data: mockLeaderboardData.filter(p => p.username === 'joueur1') });
    
    // Sélectionner le jeu de morpion
    const gameFilter = wrapper.find('.game-filter select');
    await gameFilter.setValue('Morpion');
    await gameFilter.trigger('change');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que l'API a été appelée avec le bon filtre
    expect(api.get).toHaveBeenCalledWith('/leaderboard/multiplayer?game_name=Morpion');
  });

  it('trie les joueurs par différents critères', async () => {
    // Vérifier le tri par points (par défaut)
    let playerNames = wrapper.findAll('tbody tr .player-info span').map(el => el.text());
    expect(playerNames[0]).toBe('champion'); // Plus de points
    
    // Trier par ratio V/D
    await wrapper.find('th[class="sortable"]:nth-child(5)').trigger('click');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que l'ordre reste le même (champion a aussi le meilleur ratio)
    playerNames = wrapper.findAll('tbody tr .player-info span').map(el => el.text());
    expect(playerNames[0]).toBe('champion'); // Meilleur ratio
    
    // Inverser l'ordre (croissant)
    await wrapper.find('th[class="sortable"]:nth-child(5)').trigger('click');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que l'ordre est inversé
    playerNames = wrapper.findAll('tbody tr .player-info span').map(el => el.text());
    expect(playerNames[0]).toBe('joueur2'); // Pire ratio
  });

  it('affiche les barres de progression correctement', () => {
    // Trouver la ligne du champion
    const championRow = wrapper.findAll('tbody tr').at(0);
    
    const progressFill = championRow.find('.progress-fill.wins');
    // Utiliser 86.95% au lieu de 87% qui est la valeur exacte calculée
    expect(progressFill.attributes('style')).toContain('width: 86.95');
  });

  it('met en évidence l\'utilisateur courant', () => {
    // Vérifier que la ligne de l'utilisateur connecté a la classe 'current-user'
    const currentUserRow = wrapper.findAll('tbody tr').find(row => 
      row.classes().includes('current-user')
    );
    
    expect(currentUserRow).toBeDefined();
    expect(currentUserRow.find('.player-info span').text()).toBe('joueur1');
  });

  it('ouvre la modal de détails du joueur au clic', async () => {
    // Définir un mock spécifique pour cette requête
    api.get.mockImplementation((url) => {
      if (url === '/multiplayer/rivalries/1') {
        return Promise.resolve({ data: mockRivalriesData });
      }
      if (url === '/leaderboard/multiplayer') {
        return Promise.resolve({ data: mockLeaderboardData });
      }
      return Promise.resolve({ data: [] });
    });

    // Appeler directement la méthode pour afficher les détails du joueur
    const player = { user_id: 1, username: 'joueur1' };
    await wrapper.vm.showPlayerDetails(player);
    await flushPromises();
    
    // Vérifier que l'API a été appelée pour récupérer les rivalités
    expect(api.get).toHaveBeenCalledWith('/multiplayer/rivalries/1');
    
    // Vérifier que la modal est maintenant visible
    expect(wrapper.find('.player-details-modal').exists()).toBe(true);
  });

  it('ferme la modal au clic sur le bouton fermer', async () => {
    // Ouvrir la modal
    await wrapper.find('.btn-details').trigger('click');
    await flushPromises();
    
    // Vérifier que la modal est visible
    expect(wrapper.find('.player-details-modal').exists()).toBe(true);
    
    // Cliquer sur le bouton de fermeture
    await wrapper.find('.close-button').trigger('click');
    
    // Attendre que les promesses soient résolues
    await flushPromises();
    
    // Vérifier que la modal est fermée
    expect(wrapper.find('.player-details-modal').exists()).toBe(false);
  });

  it('affiche correctement les icônes des jeux dans les rivalités', async () => {
    // Ouvrir la modal
    await wrapper.find('.btn-details').trigger('click');
    await flushPromises();
    
    // Vérifier les icônes des jeux
    const gameIcons = wrapper.findAll('.rivalries-list tbody tr td:nth-child(2)').map(el => el.text());
    expect(gameIcons).toContain('⭕'); // Morpion
    expect(gameIcons).toContain('✌️'); // Pierre Feuille Ciseaux
  });

  it('calcule correctement les ratios de victoire dans les rivalités', async () => {
    // Ouvrir la modal
    await wrapper.find('.btn-details').trigger('click');
    await flushPromises();
    
    // Vérifier les ratios calculés
    // Rivalité 1: 5/8 = 63%
    // Rivalité 2: 7/10 = 70%
    const ratios = wrapper.findAll('.rivalries-list tbody tr td:nth-child(4)').map(el => el.text());
    expect(ratios).toContain('63%');
    expect(ratios).toContain('70%');
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
    expect(api.get).toHaveBeenCalledWith('/leaderboard/multiplayer');
  });
}); 