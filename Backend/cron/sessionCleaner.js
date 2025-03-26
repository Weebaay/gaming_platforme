/**
 * @file cron/sessionCleaner.js
 * @description Script pour nettoyer périodiquement les sessions de jeu expirées
 */

// Durée de validité d'une session en millisecondes (30 minutes)
const SESSION_EXPIRATION_TIME = 30 * 60 * 1000;

/**
 * Vérifie si une session a expiré
 * @param {Object} session - Session de jeu à vérifier
 * @param {number} currentTime - Temps actuel en millisecondes
 * @returns {boolean} True si la session a expiré, false sinon
 */
function isSessionExpired(session, currentTime) {
    if (!session || !session.createdAt) return true;
    return (currentTime - session.createdAt) > SESSION_EXPIRATION_TIME;
}

/**
 * Nettoie les sessions expirées du stockage
 * @param {Object} gameSessions - Objet contenant toutes les sessions de jeu
 * @returns {number} Nombre de sessions supprimées
 */
function cleanExpiredSessions(gameSessions) {
    const currentTime = Date.now();
    let deletedCount = 0;
    
    for (const sessionId in gameSessions) {
        if (gameSessions.hasOwnProperty(sessionId)) {
            if (isSessionExpired(gameSessions[sessionId], currentTime)) {
                delete gameSessions[sessionId];
                deletedCount++;
            }
        }
    }
    
    return deletedCount;
}

/**
 * Démarre le nettoyage périodique des sessions
 * @param {Object} gameSessions - Référence à l'objet des sessions de jeu
 * @param {number} intervalMinutes - Intervalle de nettoyage en minutes (par défaut 10)
 * @returns {Object} Référence à l'intervalle pour pouvoir l'arrêter plus tard si nécessaire
 */
function startPeriodicCleaning(gameSessions, intervalMinutes = 10) {
    const interval = setInterval(() => {
        const deletedCount = cleanExpiredSessions(gameSessions);
        if (deletedCount > 0) {
            console.log(`[${new Date().toISOString()}] Nettoyage des sessions : ${deletedCount} session(s) expirée(s) supprimée(s)`);
        }
    }, intervalMinutes * 60 * 1000);
    
    return interval;
}

module.exports = {
    cleanExpiredSessions,
    startPeriodicCleaning
}; 