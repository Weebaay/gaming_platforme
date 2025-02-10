/**
 * @file routes/index.js
 * @description
 * Fichier principal pour regrouper toutes les routes de l'application.
 * Importe et utilise les sous-modules de routes :
 * - Jeux (games.js)
 * - Utilisateurs (users.js)
 * - Server-Sent Events (sse.js)
 * 
 * Routes regroupées :
 * - /api/games : Routes pour la gestion des jeux.
 * - /api/users : Routes pour la gestion des utilisateurs.
 * - /api/sse : Routes pour les Server-Sent Events.
 */

const express = require('express');
const router = express.Router();

router.use('/games', require('./games'));
router.use('/users', require('./users'));
router.use('/sse', require('./sse'));
router.use('/progress', require('./progress'));

module.exports = router;
