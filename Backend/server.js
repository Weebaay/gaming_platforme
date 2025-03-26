/**
 * @file server.js
 * @description Fichier principal (simplifié).
 */

require('dotenv').config();


const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const chalk = require('chalk');
const sessions = require('express-session');
const MySQLStore = require('express-mysql-session')(sessions);
const http = require('http');
const configureWebSockets = require('./routes/WebSocket'); // Importe la configuration WebSocket
const { startPeriodicCleaning } = require('./cron/sessionCleaner'); // Importe le nettoyeur de sessions
const { globalLimiter } = require('./middlewares/rateLimiter'); // Importe le limiteur global


const app = express();
const PORT = process.env.PORT || 3000;

const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

app.use(
    sessions({
        key: 'session_cookie_name',
        secret: process.env.JWT_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
        },
    })
);

app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

// Appliquer le middleware de rate limiting global à toutes les routes
app.use(globalLimiter);
console.log(chalk.yellow('🛡️ Protection contre les attaques par force brute activée'));

const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/users');
const gameSessionRoutes = require('./routes/gameSessions');
const leaderboardRoutes = require('./routes/leaderboard');
const progress = require('./routes/progress');

app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', progress);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Plateforme de Jeux',
            version: '1.0.0',
            description: 'Documentation de l\'API',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
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
        security: [{ BearerAuth: [] }],
    },
    apis: ['./routes/*.js'], // Inclut websocket.js!
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
    res.send('Bienvenue sur la plateforme de jeux API !');
});

app.use((req, res, next) => {
    console.warn(`Route non trouvée : ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

const server = http.createServer(app);

// Configure les WebSockets (utilise le fichier websocket.js)
const webSocketHandler = configureWebSockets(server);

// Récupérer l'objet des sessions de jeu du module WebSocket
// Pour cela, nous modifierions légèrement le fichier WebSocket.js pour exposer l'objet gameSessions
// Dans cet exemple, nous supposons que webSocketHandler contient cet objet
if (webSocketHandler && webSocketHandler.gameSessions) {
    // Démarrer le nettoyage périodique des sessions expirées (toutes les 5 minutes)
    startPeriodicCleaning(webSocketHandler.gameSessions, 5);
    console.log(chalk.yellow('🧹 Nettoyage automatique des sessions configuré (toutes les 5 minutes)'));
}

server.listen(PORT, () => {
    console.log(chalk.green(`✅ Serveur en écoute sur le port ${PORT}`));
    console.log(chalk.blue(`📄 Documentation Swagger: http://localhost:${PORT}/api-docs`));
});

module.exports = { app };