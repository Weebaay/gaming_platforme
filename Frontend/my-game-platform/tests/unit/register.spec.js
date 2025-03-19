import { mount } from '@vue/test-utils';
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
    // Simuler une réponse réussie de l'API
    api.post.mockResolvedValueOnce({ data: { message: 'Inscription réussie' } });

    // Mock de la méthode push du router
    const pushMock = jest.fn();
    router.push = pushMock;

    // Remplir le formulaire
    await wrapper.find('input[type="text"]').setValue('testuser');
    await wrapper.find('input[type="password"]').setValue('testpass');

    // Soumettre le formulaire
    await wrapper.find('form').trigger('submit');

    // Vérifier que l'API a été appelée avec les bonnes données
    expect(api.post).toHaveBeenCalledWith('/api/users/register', {
      username: 'testuser',
      password: 'testpass'
    });

    // Attendre que toutes les promesses soient résolues
    await new Promise(resolve => setTimeout(resolve, 0));

    // Vérifier la redirection
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('gère les erreurs d\'inscription', async () => {
    // Simuler une erreur de l'API
    const errorMessage = 'Nom d\'utilisateur déjà pris';
    api.post.mockRejectedValueOnce(new Error(errorMessage));

    // Remplir et soumettre le formulaire
    await wrapper.find('input[type="text"]').setValue('existinguser');
    await wrapper.find('input[type="password"]').setValue('testpass');
    
    // Mock de window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    await wrapper.find('form').trigger('submit');

    // Vérifier que l'alerte d'erreur est affichée
    expect(alertMock).toHaveBeenCalled();
    
    // Restaurer le mock de alert
    alertMock.mockRestore();
  });

  it('nettoie les champs après une inscription réussie', async () => {
    // Simuler une réponse réussie
    api.post.mockResolvedValueOnce({ data: { message: 'Inscription réussie' } });

    // Remplir le formulaire
    const usernameInput = wrapper.find('input[type="text"]');
    const passwordInput = wrapper.find('input[type="password"]');
    
    await usernameInput.setValue('testuser');
    await passwordInput.setValue('testpass');
    await wrapper.find('form').trigger('submit');

    // Vérifier que les champs sont vidés
    await wrapper.vm.$nextTick();
    expect(usernameInput.element.value).toBe('');
    expect(passwordInput.element.value).toBe('');
  });
}); 