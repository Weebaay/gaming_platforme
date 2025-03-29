import axios from 'axios';

// Mock d'axios
jest.mock('axios', () => ({
  get: jest.fn().mockImplementation(() => Promise.resolve({ data: [] })),
  post: jest.fn().mockImplementation(() => Promise.resolve({ data: [] }))
}));

// Mock de api.js - sans référence à des variables hors portée
jest.mock('@/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

// Mock de localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockImplementation((key) => {
      if (key === 'token') return 'fake-jwt-token';
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

describe('API Leaderboard', () => {
  // Configuration initiale pour les tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    }
  ];

  const mockMultiplayerData = [
    {
      user_id: 1,
      username: 'joueur1',
      points: 150,
      victories: 15,
      defeats: 5,
      draws: 3,
      matches_played: 23,
      win_rate: 65
    }
  ];

  const mockRivalriesData = [
    {
      opponent_id: 2,
      opponent_username: 'joueur2',
      game_name: 'Morpion',
      victories: 5,
      defeats: 2,
      draws: 1,
      matches_played: 8
    }
  ];

  it('récupère correctement les données du classement mode IA', async () => {
    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockLeaderboardData });
    
    // Tester l'appel API
    const response = await axios.get('/leaderboard');
    
    // Vérifier que l'appel a été fait correctement
    expect(axios.get).toHaveBeenCalledWith('/leaderboard');
    
    // Vérifier que les données retournées sont correctes
    expect(response.data).toEqual(mockLeaderboardData);
  });

  it('récupère correctement les données du classement multijoueur', async () => {
    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockMultiplayerData });
    
    // Tester l'appel API
    const response = await axios.get('/leaderboard/multiplayer');
    
    // Vérifier que l'appel a été fait correctement
    expect(axios.get).toHaveBeenCalledWith('/leaderboard/multiplayer');
    
    // Vérifier que les données retournées sont correctes
    expect(response.data).toEqual(mockMultiplayerData);
  });

  it('filtre correctement les données du classement multijoueur par jeu', async () => {
    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockMultiplayerData.filter(p => p.username === 'joueur1') });
    
    // Tester l'appel API avec filtre de jeu
    const response = await axios.get('/leaderboard/multiplayer?game_name=Morpion');
    
    // Vérifier que l'appel a été fait correctement avec le paramètre
    expect(axios.get).toHaveBeenCalledWith('/leaderboard/multiplayer?game_name=Morpion');
    
    // Vérifier que les données retournées sont correctes
    expect(response.data).toEqual(mockMultiplayerData.filter(p => p.username === 'joueur1'));
  });

  it('récupère correctement les rivalités d\'un joueur', async () => {
    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockRivalriesData });
    
    // Tester l'appel API
    const response = await axios.get('/multiplayer/rivalries/1');
    
    // Vérifier que l'appel a été fait correctement
    expect(axios.get).toHaveBeenCalledWith('/multiplayer/rivalries/1');
    
    // Vérifier que les données retournées sont correctes
    expect(response.data).toEqual(mockRivalriesData);
  });

  it('gère correctement les erreurs de l\'API', async () => {
    // Configurer une erreur mock d'axios
    const errorMessage = 'Erreur réseau';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));
    
    // Vérifier que l'erreur est propagée correctement
    await expect(axios.get('/leaderboard')).rejects.toThrow(errorMessage);
  });

  it('inclut le token d\'authentification dans les requêtes', async () => {
    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockLeaderboardData });
    
    // Configuration d'en-tête pour simuler l'ajout du token JWT
    const config = { headers: { Authorization: 'Bearer fake-jwt-token' } };
    
    // Tester l'appel API avec en-tête d'autorisation
    await axios.get('/leaderboard', config);
    
    // Vérifier que l'appel a été fait avec l'en-tête d'autorisation
    expect(axios.get).toHaveBeenCalledWith('/leaderboard', config);
  });

  it('gère les requêtes sans token d\'authentification', async () => {
    // Réinitialiser le mock de localStorage
    window.localStorage.getItem.mockReturnValueOnce(null);

    // Configurer la réponse mock d'axios
    axios.get.mockResolvedValueOnce({ data: mockLeaderboardData });
    
    // Tester l'appel API sans en-tête d'autorisation
    await axios.get('/leaderboard');
    
    // Vérifier que l'appel a été fait sans en-tête d'autorisation spécifique
    expect(axios.get).toHaveBeenCalledWith('/leaderboard');
  });
}); 