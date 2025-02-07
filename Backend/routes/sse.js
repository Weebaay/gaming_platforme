/**
 * @file routes/sse.js
 * @description
 * Fichier de routes pour la gestion des Server-Sent Events (SSE).
 * Contient les endpoints permettant de :
 * - Connecter un client pour recevoir des mises à jour via SSE.
 * - Envoyer des messages à tous les clients connectés.
 * 
 * Routes :
 * - GET /api/sse/connect : Connecter un client pour SSE.
 * - POST /api/sse/message : Envoyer un message à tous les clients connectés.
 * 
 * Notes :
 * - SSE est utilisé pour des mises à jour en temps réel, comme des notifications de jeu.
 * - Les connexions SSE restent ouvertes jusqu'à la déconnexion explicite ou la fermeture du client.
 */

const express = require('express');
const router = express.Router();

const clients = []; // Stocke les connexions actives pour SSE

// Ajouter un client pour SSE
router.get('/sse/connect', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const client = { id: clientId, res };
    clients.push(client);

    console.log(`Client connecté à SSE : ${clientId}`);

    // Gérer la déconnexion
    req.on('close', () => {
        clients.splice(clients.findIndex(c => c.id === clientId), 1);
        console.log(`Client déconnecté de SSE : ${clientId}`);
    });
});

// Envoyer des messages à tous les clients SSE
function sendSSEMessage(data) {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

// Exemple : Endpoint pour déclencher un événement SSE
router.post('/sse/message', (req, res) => {
    const message = req.body.message;
    sendSSEMessage({ message });
    res.status(200).json({ message: 'Message SSE envoyé' });
});

module.exports = router;