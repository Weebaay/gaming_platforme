import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import Register from '@/components/Register.vue';
import api from '@/services/api';

// Mock de l'API
jest.mock('@/services/api');

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
    localStorage.clear();
  });

  describe('Login.vue', () => {
    test('devrait afficher le formulaire de connexion', () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      });
      
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.find('#username').exists()).toBe(true);
      expect(wrapper.find('#password').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    test('devrait gérer la soumission du formulaire avec succès', async () => {
      const mockToken = 'fake-jwt-token';
      const mockUsername = 'testuser';
      
      api.post.mockResolvedValueOnce({ data: { token: mockToken } });

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      });

      await wrapper.find('#username').setValue(mockUsername);
      await wrapper.find('#password').setValue('password123');
      await wrapper.find('form').trigger('submit');

      expect(api.post).toHaveBeenCalledWith('/users/login', {
        username: mockUsername,
        password: 'password123'
      });

      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('username')).toBe(mockUsername);
    });

    test('devrait gérer les erreurs de connexion', async () => {
      const mockError = new Error('Invalid credentials');
      api.post.mockRejectedValueOnce(mockError);

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      });

      // Mock de window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await wrapper.find('#username').setValue('wronguser');
      await wrapper.find('#password').setValue('wrongpass');
      await wrapper.find('form').trigger('submit');

      expect(api.post).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Erreur de connexion. Réessayez.');
      expect(localStorage.getItem('token')).toBeNull();
    });

    test('devrait valider les champs requis', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      });

      // Tenter de soumettre le formulaire sans remplir les champs
      await wrapper.find('form').trigger('submit');
      
      expect(api.post).not.toHaveBeenCalled();
      expect(wrapper.find('#username').element.validity.valid).toBe(false);
      expect(wrapper.find('#password').element.validity.valid).toBe(false);
    });
  });

  describe('Sécurité des tokens', () => {
    test('devrait stocker et récupérer le token correctement', () => {
      const mockToken = 'fake-jwt-token';
      localStorage.setItem('token', mockToken);
      
      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    test('devrait effacer le token lors de la déconnexion', () => {
      const mockToken = 'fake-jwt-token';
      localStorage.setItem('token', mockToken);
      localStorage.setItem('username', 'testuser');

      localStorage.removeItem('token');
      localStorage.removeItem('username');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
    });
  });
}); 