/**
 * @file middlewares/rateLimiter.js
 * @description Middleware pour limiter les tentatives répétées sur certaines routes, protégeant contre les attaques par force brute
 */

// Stockage des tentatives en mémoire
// Clé: IP + route, Valeur: {count: nombre de tentatives, lastAttempt: timestamp du dernier essai}
const attempts = {};

// Période de rétention des tentatives en millisecondes (1 heure)
const RETENTION_PERIOD = 60 * 60 * 1000;

// Intervalle de nettoyage du stockage en millisecondes (10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;

/**
 * Nettoie les tentatives expirées
 */
function cleanupAttempts() {
    const now = Date.now();
    for (const key in attempts) {
        if (attempts.hasOwnProperty(key)) {
            if (now - attempts[key].lastAttempt > RETENTION_PERIOD) {
                delete attempts[key];
            }
        }
    }
}

// Configurer un nettoyage périodique
setInterval(cleanupAttempts, CLEANUP_INTERVAL);

/**
 * Crée un middleware de limitation de taux pour une route spécifique
 * @param {Object} options - Options de configuration
 * @param {number} options.maxAttempts - Nombre maximum de tentatives autorisées dans la fenêtre de temps (défaut: 5)
 * @param {number} options.windowMs - Fenêtre de temps en millisecondes (défaut: 15 minutes)
 * @param {number} options.delayAfter - Nombre de tentatives après lequel un délai est appliqué (défaut: 3)
 * @param {function} options.keyGenerator - Fonction pour générer une clé unique par requête (défaut: IP + chemin)
 * @param {function} options.handler - Fonction pour gérer le dépassement de limite (défaut: réponse 429)
 * @returns {function} Middleware Express
 */
function createRateLimiter(options = {}) {
    const {
        maxAttempts = 5,
        windowMs = 15 * 60 * 1000, // 15 minutes par défaut
        delayAfter = 3,
        keyGenerator = (req) => {
            return `${req.ip}:${req.originalUrl}`;
        },
        handler = (req, res) => {
            const retryAfter = Math.ceil(windowMs / 1000); // en secondes
            res.set('Retry-After', retryAfter);
            return res.status(429).json({
                error: 'Trop de tentatives, veuillez réessayer plus tard',
                retryAfter
            });
        }
    } = options;

    return function rateLimiterMiddleware(req, res, next) {
        const key = keyGenerator(req);

        // Initialiser les tentatives si nécessaire
        if (!attempts[key]) {
            attempts[key] = {
                count: 0,
                lastAttempt: Date.now()
            };
        }

        const attempt = attempts[key];
        const now = Date.now();
        
        // Réinitialiser le compteur si la fenêtre de temps est passée
        if (now - attempt.lastAttempt > windowMs) {
            attempt.count = 0;
            attempt.lastAttempt = now;
        }

        // Incrémenter le compteur
        attempt.count++;
        attempt.lastAttempt = now;

        // Vérifier si le nombre maximum de tentatives est dépassé
        if (attempt.count > maxAttempts) {
            return handler(req, res);
        }

        // Ajouter un délai exponentiel après un certain nombre de tentatives
        if (attempt.count > delayAfter) {
            const delay = Math.pow(2, attempt.count - delayAfter) * 100; // Délai exponentiel en ms
            return setTimeout(() => {
                next();
            }, delay);
        }

        // Continuer normalement
        next();
    };
}

// Middleware spécifique pour la route de login
const loginLimiter = createRateLimiter({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 3,
    keyGenerator: (req) => {
        // Utiliser l'IP et le nom d'utilisateur pour la clé
        // Cela permet de bloquer les tentatives par utilisateur spécifique
        return `${req.ip}:${req.body.username || 'unknown'}:login`;
    },
    handler: (req, res) => {
        console.log(`[SECURITY] Trop de tentatives de connexion depuis ${req.ip}`);
        return res.status(429).json({
            error: 'Trop de tentatives de connexion échouées, veuillez réessayer plus tard',
            retryAfter: Math.ceil(15 * 60) // 15 minutes en secondes
        });
    }
});

// Middleware global pour toutes les routes
const globalLimiter = createRateLimiter({
    maxAttempts: 100,
    windowMs: 10 * 60 * 1000, // 10 minutes
    delayAfter: 80
});

module.exports = {
    createRateLimiter,
    loginLimiter,
    globalLimiter
}; 