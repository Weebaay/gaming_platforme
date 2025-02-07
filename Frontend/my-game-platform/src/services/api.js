/**
 * @file services/api.js
 * @description Configure Axios pour interagir avec l'API backend.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Base URL pour les appels API
});

// Intercepteur pour ajouter le token JWT aux requêtes si disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Récupère le token depuis le localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Ajoute le token dans les en-têtes
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirection vers la page de connexion si non autorisé (401)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
