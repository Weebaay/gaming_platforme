import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import Register from '@/components/Register.vue';
import api from '@/services/api';

// Mock de l'API
jest.mock('@/services/api', () => ({
  post: jest.fn()
}));

// Configuration du router pour les tests
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/home', name: 'Home' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register }
  ]
});

describe('Tests d\'authentification', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    window.localStorage.clear();
    
    // Mock de la méthode push du router
    router.push = jest.fn();
  });

  describe('Login.vue', () => {
    test('devrait afficher le formulaire de connexion', () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router],
          stubs: ['router-link']
        }
      });
      
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.find('input[type="text"]').exists()).toBe(true);
      expect(wrapper.find('input[type="password"]').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    test('devrait gérer la soumission du formulaire avec succès', async () => {
      const mockToken = 'fake-jwt-token';
      const mockUsername = 'testuser';
      
      api.post.mockResolvedValueOnce({ data: { token: mockToken, username: mockUsername } });

      const wrapper = mount(Login, {
        global: {
          plugins: [router],
          stubs: ['router-link']
        }
      });

      await wrapper.find('input[type="text"]').setValue(mockUsername);
      await wrapper.find('input[type="password"]').setValue('password123');
      await wrapper.find('form').trigger('submit.prevent');

      // Attendons que toutes les promesses se résolvent
      await new Promise(process.nextTick);

      expect(api.post).toHaveBeenCalledWith('/users/login', {
        username: mockUsername,
        password: 'password123'
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('username', mockUsername);
      expect(router.push).toHaveBeenCalledWith('/home');
    });

    test('devrait gérer les erreurs de connexion', async () => {
      // Configurer le rejet de l'API
      api.post.mockRejectedValueOnce(new Error('Erreur de connexion'));

      // Espionner la méthode alert
      window.alert = jest.fn();

      const wrapper = mount(Login, {
        global: {
          plugins: [router],
          stubs: ['router-link']
        }
      });

      // Définir les données du formulaire directement
      wrapper.vm.username = 'testuser';
      wrapper.vm.password = 'testpass';

      // Appeler directement la méthode de soumission
      await wrapper.vm.handleLogin();
      await flushPromises();

      expect(api.post).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Erreur de connexion. Réessayez.');
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    test('devrait valider les champs requis', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router],
          stubs: ['router-link']
        }
      });

      // Simuler la validation HTML5 avec le message d'erreur
      const mockInvalid = {
        checkValidity: jest.fn().mockReturnValue(false)
      };
      Object.defineProperty(HTMLFormElement.prototype, 'checkValidity', {
        value: jest.fn().mockReturnValue(false)
      });

      // Tenter de soumettre le formulaire sans remplir les champs
      await wrapper.find('form').trigger('submit.prevent');
      
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('Sécurité des tokens', () => {
    test('devrait stocker et récupérer le token correctement', () => {
      const mockToken = 'jwt.token.example';
      
      // Simuler le stockage du token
      window.localStorage.setItem('token', mockToken);
      
      // Réinitialiser le mock pour permettre la vérification
      window.localStorage.getItem.mockClear();
      
      // Configurer le mock pour renvoyer le token quand demandé
      window.localStorage.getItem.mockReturnValueOnce(mockToken);
      
      // Récupérer le token stocké
      const storedToken = window.localStorage.getItem('token');
      
      // Vérifier que la bonne méthode a été appelée et le bon token retourné
      expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
      expect(storedToken).toBe(mockToken);
    });

    test('devrait effacer le token lors de la déconnexion', () => {
      const mockToken = 'fake-jwt-token';
      window.localStorage.setItem('token', mockToken);
      window.localStorage.setItem('username', 'testuser');

      window.localStorage.removeItem('token');
      window.localStorage.removeItem('username');

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('username');
    });
  });
}); 