/**
 * @file server.js
 * @description
 * Fichier principal de configuration et démarrage du serveur Node.js pour la plateforme de jeux.
 * - Configure Express, CORS, et le parsing JSON.
 * - Configure Swagger pour documenter l'API.
 * - Intègre les routes des modules externes (WebSocket, jeux, sessions, etc.).
 * - Fournit des mécanismes de gestion des erreurs globales.
 * - Intègre une clé secrète admin pour protéger certaines routes.
 */

require('dotenv').config();

console.log("PORT:", process.env.PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("ADMIN_SECRET:", process.env.ADMIN_SECRET);

// Importation des modules nécessaires
const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const chalk = require('chalk');
const sessions = require('express-session');
const MySQLStore = require('express-mysql-session')(sessions);
const http = require('http');
const { Server } = require("socket.io");

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de stockage des sessions en base de données
const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

// Middleware pour les sessions
app.use(
    sessions({
        key: 'session_cookie_name', // Nom du cookie
        secret: process.env.JWT_SECRET, // Utilise ton secret JWT
        store: sessionStore, // Utilise le stockage MySQL
        resave: false, // Évite de réécrire la session si elle n'est pas modifiée
        saveUninitialized: false, // Sauvegarde uniquement les sessions initialisées
        cookie: {
            maxAge: 1000 * 60 * 60, // Durée de vie du cookie : 1 heure
            httpOnly: true, // Empêche l'accès au cookie via JavaScript côté client
        },
    })
);

// Middleware pour activer CORS et parser le JSON
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

// Importer les routes
const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/users');
const gameSessionRoutes = require('./routes/gameSessions');
const leaderboardRoutes = require('./routes/leaderboard');
const progress = require('./routes/progress');

// Ajouter les routes à l'application
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', progress);

// Configuration Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Plateforme de Jeux',
            version: '1.0.0',
            description: 'Documentation de l\'API pour la plateforme de jeux',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`, // Base URL du serveur
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Inclut les fichiers avec annotations Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Route par défaut pour vérifier le fonctionnement
app.get('/', (req, res) => {
    res.send('Bienvenue sur la plateforme de jeux API !');
});

// Gestion des routes non trouvées
app.use((req, res, next) => {
    console.warn(`Route non trouvée : ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// Stockage en mémoire des sessions et des joueurs inactifs
///const sessions = {};

/**
 * Génère un code d'invitation unique pour une session.
 * @returns {string} Code unique à 6 caractères.
 */
function generateInvitationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Vérifier si un joueur a gagné
 * @param {Array} grid - Grille actuelle de la partie.
 * @returns {string|null} Symbole du gagnant ("X" ou "O"), ou null s'il n'y a pas encore de gagnant.
 */
function checkWinner(grid) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
            return grid[a]; // Retourne le symbole gagnant ("X" ou "O")
        }
    }

    return null; // Aucun gagnant
}

// Démarrer le serveur
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });

    // Créer une session
    socket.on('createSession', (callback) => {
        const sessionId = generateInvitationCode();
        sessions[sessionId] = {
            players: [{ socketId: socket.id, symbol: "X" }], // L'hôte est le joueur X
            grid: Array(9).fill(""), // Grille de Morpion vide
            currentPlayer: "X", // Premier joueur
        };
        console.log(`Session créée avec l'ID : ${sessionId}`);
        socket.join(sessionId); // Ajoute le socket à la room de la session
        callback(sessionId); // Renvoie le code au créateur
    });

    //Rejoindre une session
    socket.on('joinSession', (sessionId, callback) => {
        if (!sessions[sessionId]) {
            callback({ success: false, message: 'Session non trouvée' });
            return;
        }

        if (sessions[sessionId].players.length >= 2) {
            callback({ success: false, message: 'Session complète' });
            return;
        }
         //Attribuer O au nouveau joueur 
        sessions[sessionId].players.push({ socketId: socket.id, symbol: "O" });
        socket.join(sessionId); // Ajoute le socket à la room de la session
        console.log(`Le joueur ${socket.id} a rejoint la session ${sessionId}`);
        io.to(sessionId).emit('sessionJoined', { players: sessions[sessionId].players.length }); // Envoie un message a la sessionID pour dire que la partie est pleine 
        callback({ success: true });
    });
    // Ecoute l'evenement 'makeMove'
    socket.on('makeMove', (data) => {
        const { sessionId, index, player } = data;

        console.log(`Mouvement reçu via WebSocket - sessionId: ${sessionId}, index: ${index}, player: ${player}`);

        //Vérification de la session
        if (!sessions[sessionId]) {
            console.log(`Session non trouvée: ${sessionId}`);
            return;
        }

        const session = sessions[sessionId];

        // Vérifier si c'est au tour du joueur
        if (session.currentPlayer !== player) {
            console.log(`Ce n'est pas le tour du joueur ${player}`);
            return;
        }

        // Vérifier si la case est vide
        if (session.grid[index]) {
            console.log(`Case déjà prise à l'index ${index}`);
            return;
        }

        // Mettre à jour la grille
        session.grid[index] = player;

        // Vérifier si un joueur a gagné
        const winner = checkWinner(session.grid);
        if (winner) {
            console.log(`Le joueur ${winner} a gagné !`);
            io.to(sessionId).emit('updateGame', { grid: session.grid, winner });
            return;
        }

        // Vérifier si toutes les cases sont remplies
        if (!session.grid.includes("")) {
            console.log("Match nul !");
            io.to(sessionId).emit('updateGame', { grid: session.grid, draw: true });
            return;
        }

        // Passer au joueur suivant
        session.currentPlayer = player === "X" ? "O" : "X";
        console.log(`Prochain joueur: ${session.currentPlayer}`);
        io.to(sessionId).emit('updateGame', { grid: session.grid, currentPlayer: session.currentPlayer });

        // Envoyer une notification à tous les clients connectés à cette session
        console.log(`Grille mise à jour pour sessionId ${sessionId}: ${JSON.stringify(session.grid)}`);
    });
});

server.listen(PORT, () => {
    console.log(chalk.green(`✅ Serveur en écoute sur le port ${PORT}`));
    console.log(chalk.blue(`📄 Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`));
});

// Exporter l'application pour les tests ou autres usages
module.exports = { app };