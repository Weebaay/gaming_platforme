/**
 * @file models/resetToken.js
 * @description Modèle pour gérer les jetons de réinitialisation de mot de passe
 */

const { connection, handleDBError } = require('../db');
const crypto = require('crypto');

// Durée de validité d'un jeton de réinitialisation en secondes (1 heure)
const TOKEN_EXPIRATION = 3600;

const ResetToken = {
    /**
     * Crée un nouveau jeton de réinitialisation pour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {function} callback - Fonction de callback(err, token)
     */
    create: (userId, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans ResetToken.create');
        }

        // Génération d'un jeton aléatoire
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION * 1000); // Date d'expiration (maintenant + 1h)

        // Supprimer d'abord les jetons existants pour cet utilisateur
        const deleteQuery = 'DELETE FROM reset_tokens WHERE user_id = ?';
        connection.query(deleteQuery, [userId], (err) => {
            if (err) {
                return callback(err);
            }

            // Insérer le nouveau jeton
            const insertQuery = 'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
            connection.query(insertQuery, [userId, token, expiresAt], (err) => {
                if (err) {
                    return callback(err);
                }
                callback(null, token);
            });
        });
    },

    /**
     * Vérifie si un jeton est valide et non expiré
     * @param {string} token - Jeton à vérifier
     * @param {function} callback - Fonction de callback(err, userId)
     */
    verify: (token, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans ResetToken.verify');
        }

        const query = `
            SELECT rt.user_id 
            FROM reset_tokens rt
            WHERE rt.token = ? AND rt.expires_at > NOW()
        `;

        connection.query(query, [token], (err, results) => {
            if (err) {
                return callback(err);
            }

            if (results.length === 0) {
                return callback(null, null); // Jeton invalide ou expiré
            }

            callback(null, results[0].user_id);
        });
    },

    /**
     * Supprime un jeton spécifique
     * @param {string} token - Jeton à supprimer
     * @param {function} callback - Fonction de callback(err, result)
     */
    delete: (token, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans ResetToken.delete');
        }

        const query = 'DELETE FROM reset_tokens WHERE token = ?';
        connection.query(query, [token], callback);
    },

    /**
     * Supprime tous les jetons expirés
     * @param {function} callback - Fonction de callback(err, result)
     */
    cleanExpired: (callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans ResetToken.cleanExpired');
        }

        const query = 'DELETE FROM reset_tokens WHERE expires_at <= NOW()';
        connection.query(query, callback);
    }
};

module.exports = ResetToken; 