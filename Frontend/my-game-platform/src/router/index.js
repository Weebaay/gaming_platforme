/**
 * @file router/index.js
 * @description Configure les routes de l'application Vue.js pour naviguer entre les pages et les composants.
 */

import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import Auth from '../components/Auth.vue';
import Register from '../components/Register.vue';
import Login from '../components/Login.vue';
import ForgotPassword from '../components/ForgotPassword.vue';
import ResetPassword from '../components/ResetPassword.vue';
import Morpion from '../components/Morpion.vue';
import PierreFeuilleCiseaux from '../components/PierreFeuilleCiseaux.vue';
import JeuDesDes from '../components/JeuDesDes.vue';
import Leaderboard from '../components/Leaderboard.vue';
import LeaderboardOnline from '../components/LeaderboardOnline.vue';
import AdminDashboard from '../components/AdminDashboard.vue';

// Fonction pour vérifier si l'utilisateur est connecté
function isAuthenticated() {
    return !!localStorage.getItem('token'); // Vérifie la présence d'un token dans le localStorage
  }

// Fonction pour vérifier si l'utilisateur est admin
function isAdmin() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Décoder le token JWT (partie payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload && payload.role === 'ADMIN';
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle admin:', error);
    return false;
  }
}

const routes = [
  {
    path: '/',
    name: 'Auth',
    component: Auth,
    meta: { description: "Page d'authentification avec choix entre inscription et connexion." },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { description: "Page pour créer un nouveau compte utilisateur." },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { description: "Page pour se connecter à la plateforme." },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { description: "Page pour demander une réinitialisation de mot de passe." },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { description: "Page pour réinitialiser le mot de passe avec un jeton." },
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { description: "Page d'accueil avec des liens vers les jeux." },
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: Leaderboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard-online',
    name: 'LeaderboardOnline',
    component: LeaderboardOnline,
    meta: { requiresAuth: true }
  },
  {
    path: '/game/morpion',
    name: 'MorpionGame',
    component: Morpion,
    meta: { description: "Composant du jeu Morpion." },
  },
  {
    path: '/game/pierre-feuille-ciseaux',
    name: 'PierreFeuilleCiseaux',
    component: PierreFeuilleCiseaux,
    meta: { description: "Composant du jeu Pierre-Feuille-Ciseaux." },
  },
  {
    path: '/game/jeu-des-des',
    name: 'JeuDesDes',
    component: JeuDesDes,
    meta: { description: "Composant du jeu des dés." },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      description: "Dashboard d'administration pour gérer les utilisateurs et voir les statistiques."
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de navigation globale
router.beforeEach((to, from, next) => {
    // Vérification de l'authentification
    if (to.meta.requiresAuth && !isAuthenticated()) {
      console.warn(`Accès refusé à la route ${to.path} : utilisateur non authentifié.`);
      next({ name: 'Login' }); // Redirige vers la page de connexion
    } 
    // Vérification du rôle admin
    else if (to.meta.requiresAdmin && !isAdmin()) {
      console.warn(`Accès refusé à la route ${to.path} : droits d'administrateur requis.`);
      next({ name: 'Home' }); // Redirige vers la page d'accueil
    }
    else {
      next(); // Autorise la navigation
    }
  });

export default router;
