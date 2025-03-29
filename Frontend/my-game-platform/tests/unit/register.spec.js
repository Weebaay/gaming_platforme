import { mount, flushPromises } from '@vue/test-utils';
import Register from '@/components/Register.vue';
import { createRouter, createWebHistory } from 'vue-router';
import api from '@/services/api';

// Mock de vue-router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: { template: '<div>Login Page</div>' }
    }
  ]
});

// Mock de l'API
jest.mock('@/services/api', () => ({
  post: jest.fn()
}));

describe('Register.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Monter le composant avec les dépendances nécessaires
    wrapper = mount(Register, {
      global: {
        plugins: [router]
      }
    });
  });

  it('affiche le formulaire d\'inscription', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('valide les champs requis avant l\'envoi', async () => {
    // Simuler la soumission du formulaire avec des champs vides
    await wrapper.find('form').trigger('submit');
    
    // Vérifier que l'API n'a pas été appelée avec des champs vides
    expect(api.post).not.toHaveBeenCalled();
  });

  it('gère une inscription réussie', async () => {
    const mockResponse = { status: 201 };
    api.post.mockResolvedValueOnce(mockResponse);

    // Définir les valeurs des champs
    wrapper.vm.username = 'testuser';
    wrapper.vm.password = 'testpass';
    wrapper.vm.email = 'test@example.com';

    // Appeler directement la méthode de soumission
    await wrapper.vm.handleRegister();
    await flushPromises();

    // Vérifier que l'API a été appelée avec les bonnes données
    expect(api.post).toHaveBeenCalledWith('/users/register', {
      username: 'testuser',
      password: 'testpass',
      confirmPassword: 'testpass',
      email: 'test@example.com'
    });

    // Vérifier que le router a été redirigé vers la page de connexion
    expect(router.push).toHaveBeenCalledWith({ path: '/login', query: { registered: 'success' } });

    // Vérifier que les champs ont été vidés
    expect(wrapper.vm.username).toBe('');
    expect(wrapper.vm.password).toBe('');
    expect(wrapper.vm.email).toBe('');
  });

  it('gère les erreurs d\'inscription', async () => {
    api.post.mockRejectedValueOnce(new Error('Erreur d\'inscription'));

    window.alert = jest.fn();

    // Définir les valeurs des champs
    wrapper.vm.username = 'testuser';
    wrapper.vm.password = 'testpass';

    // Appeler directement la méthode de soumission
    await wrapper.vm.handleRegister();
    await flushPromises();

    // Vérifier que l'alerte d'erreur est affichée
    expect(window.alert).toHaveBeenCalledWith('Erreur d\'inscription. Réessayez.');
  });

  it('nettoie les champs après une inscription réussie', async () => {
    const mockResponse = { status: 201 };
    api.post.mockResolvedValueOnce(mockResponse);

    // Définir les valeurs des champs
    wrapper.vm.username = 'testuser';
    wrapper.vm.password = 'testpass';

    // Appeler directement la méthode de soumission
    await wrapper.vm.handleRegister();
    await flushPromises();

    // Vérifier que les champs ont été vidés
    expect(wrapper.vm.username).toBe('');
    expect(wrapper.vm.password).toBe('');
  });
}); 