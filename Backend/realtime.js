/**
 * @file realtime.js
 * @description
 * Ce module gère les événements Server-Sent Events (SSE) pour la plateforme de jeux.
 * Il permet de connecter des clients en temps réel, de gérer leur déconnexion,
 * et d'envoyer des messages uniquement aux clients connectés à une session spécifique.
 */

module.exports = (app) => {
    // Tableau pour stocker les connexions SSE actives
    const clients = [];

    /**
     * Ajoute un client SSE à la liste des connexions actives.
     * @param {Object} req - Requête HTTP Express.
     * @param {Object} res - Réponse HTTP Express (flux SSE).
     */
    const addSSEClient = (req, res) => {
        const sessionId = req.query.sessionId; // Récupère le sessionId depuis la requête

        // Vérifie que le sessionId est fourni et valide
        if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
            res.status(400).json({ error: "sessionId invalide ou manquant dans la requête." });
            return;
        }

        // Configurer les en-têtes pour une connexion SSE
		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
		res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Ajouter le client à la liste avec un identifiant unique et le sessionId
        const clientId = Date.now();
        const client = { id: clientId, sessionId, res };
        clients.push(client);

        console.log(`Client connecté à SSE : clientId=${clientId}, sessionId=${sessionId}`);

        // Supprimer le client de la liste en cas de déconnexion
        req.on('close', () => {
            const index = clients.findIndex((c) => c.id === clientId);
            if (index !== -1) {
                clients.splice(index, 1);
                console.log(`Client déconnecté de SSE : clientId=${clientId}, sessionId=${sessionId}`);
            }
        });
    };

    /**
     * Envoie un message SSE uniquement aux clients connectés à une session spécifique.
     * @param {Object} data - Les données à envoyer sous forme d'objet.
     * @param {string} data.sessionId - L'identifiant de la session concernée.
     */
    const sendSSEMessage = (data) => {
        const { sessionId, ...payload } = data;

        // Filtrer les clients par sessionId et leur envoyer les données
        clients
            .filter((client) => client.sessionId === sessionId)
            .forEach((client) => {
                try {
                    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
                } catch (error) {
                    console.error(`Erreur lors de l'envoi SSE au clientId=${client.id} :`, error);
                }
            });

        if (process.env.NODE_ENV === 'development') {
            console.log(`Message SSE envoyé pour sessionId=${sessionId}, payload=${JSON.stringify(payload)}`);
        }
    };

    // Route pour connecter un client SSE
    app.get('/api/sse/connect', (req, res) => {
        addSSEClient(req, res);
    });

    // Route pour envoyer un message à tous les clients connectés
    app.post('/api/sse/message', (req, res) => {
        const message = req.body.message || 'Message par défaut';
        const sessionId = req.body.sessionId;

        if (!sessionId) {
            return res.status(400).json({ error: "sessionId manquant dans la requête." });
        }

        sendSSEMessage({ sessionId, message });
        res.status(200).json({ success: true, message: 'Message SSE envoyé' });
    });

    // Exporter `sendSSEMessage` pour une utilisation éventuelle dans d'autres modules
    module.exports.sendSSEMessage = sendSSEMessage;
};
