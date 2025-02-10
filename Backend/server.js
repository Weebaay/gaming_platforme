/**
 * @file server.js
 * @description
 * Fichier principal de configuration et démarrage du serveur Node.js pour la plateforme de jeux.
 * - Configure Express, CORS, et le parsing JSON.
 * - Configure Swagger pour documenter l'API.
 * - Intègre les routes des modules externes (SSE, jeux, sessions, etc.).
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
const { router: sessionRoutes } = require('./sessions');
const gameSessionRoutes = require('./routes/gameSessions');
const sseRoutes = require('./routes/sse');
const leaderboardRoutes = require('./routes/leaderboard');

// Ajouter les routes à l'application
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', require('./routes/progress'));

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

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(chalk.green(`✅ Serveur en écoute sur le port ${PORT}`));
    console.log(chalk.blue(`📄 Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`));
});

// Exporter l'application pour les tests ou autres usages
module.exports = { app };
