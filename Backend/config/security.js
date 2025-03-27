/**
 * @file config/security.js
 * @description Configuration de sécurité pour l'application
 */

require('dotenv').config();

// Configuration des sessions
const sessionConfig = {
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'session-secret-key-very-secure',
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 heure
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    },
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Nom personnalisé du cookie pour plus de sécurité
};

// Configuration JWT
const jwtConfig = {
    secret: process.env.JWT_SECRET || 'jwt-secret-key-very-secure',
    options: {
        expiresIn: '1h', // Expiration du token
        algorithm: 'HS256', // Algorithme de signature
        issuer: 'gaming-platform', // Émetteur du token
        audience: 'gaming-platform-users' // Public cible
    }
};

// Configuration du store MySQL pour les sessions
const sessionStoreConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    clearExpired: true, // Nettoyer automatiquement les sessions expirées
    checkExpirationInterval: 900000, // Vérifier toutes les 15 minutes
    expiration: 86400000, // Les sessions expirent après 24 heures
    createDatabaseTable: true, // Créer la table si elle n'existe pas
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

// Configuration CORS
const corsConfig = {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache préflight pendant 24 heures
};

module.exports = {
    sessionConfig,
    jwtConfig,
    sessionStoreConfig,
    corsConfig
}; 