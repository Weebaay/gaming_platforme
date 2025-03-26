// models/user.js
const { connection, handleDBError } = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * @function generatePasswordHash
 * @description Fonction pour hasher un mot de passe
 * @param {string} password - Le mot de passe à hasher
 * @returns {Promise<string>} - Le hash du mot de passe
 */
const generatePasswordHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        throw error;
    }
};

const User = {
    /**
     * @function create
     * @description Fonction pour créer un nouvel utilisateur
     * @param {Object} userData - L'objet contenant les informations de l'utilisateur
     * @param {string} userData.username - Nom d'utilisateur
     * @param {string} userData.password - Mot de passe
     * @param {string} [userData.email] - Email (optionnel)
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    create: async (userData, callback) => {
        try {
            const hashedPassword = await generatePasswordHash(userData.password);
            const query = userData.email 
                ? 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)'
                : 'INSERT INTO users (username, password) VALUES (?, ?)';
            
            const params = userData.email 
                ? [userData.username, hashedPassword, userData.email]
                : [userData.username, hashedPassword];
            
            if (typeof callback === 'function') {
                connection.query(query, params, callback);
            } else {
                throw new TypeError('Callback manquant ou invalide dans la méthode create.');
            }
        } catch (error) {
            if (typeof callback === 'function') {
                callback(error);
            } else {
                throw error;
            }
        }
    },

    /**
     * @function getByUsername
     * @description Fonction pour récupérer un utilisateur par son nom d'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    getByUsername: (username, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode getByUsername.');
        }

        const query = 'SELECT * FROM users WHERE username = ?';
        connection.query(query, [username], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results[0]); // Retourne le premier résultat ou null
        });
    },

    /**
     * @function getByEmail
     * @description Fonction pour récupérer un utilisateur par son email
     * @param {string} email - Email de l'utilisateur
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    getByEmail: (email, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode getByEmail.');
        }

        const query = 'SELECT * FROM users WHERE email = ?';
        connection.query(query, [email], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results[0]); // Retourne le premier résultat ou null
        });
    },

    /**
     * @function login
     * @description Fonction pour connecter un utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    login: (username, password, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode login.');
        }

        const query = 'SELECT * FROM users WHERE username = ?';
        connection.query(query, [username], async (err, results) => {
            if (err) {
                return callback(err);
            }
            const user = results[0];
            if (!user) {
                return callback(null, null); // Utilisateur non trouvé
            }
            try {
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    callback(null, user); // Mot de passe correct
                } else {
                    callback(null, null); // Mot de passe incorrect
                }
            } catch (error) {
                callback(error);
            }
        });
    },

    /**
     * @function getAll
     * @description Fonction pour récupérer tous les utilisateurs
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    getAll: (callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode getAll.');
        }

        const query = 'SELECT id, username FROM users';
        connection.query(query, callback);
    },

    /**
     * @function getById
     * @description Fonction pour récupérer un utilisateur par son ID
     * @param {number} id - ID de l'utilisateur
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    getById: (id, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode getById.');
        }

        const query = 'SELECT id, username, email FROM users WHERE id = ?';
        connection.query(query, [id], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results[0]); // Retourne l'utilisateur trouvé ou null
        });
    },

    /**
     * @function update
     * @description Fonction pour mettre à jour un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @param {Object} userData - Données mises à jour de l'utilisateur
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    update: async (id, userData, callback) => {
        try {
            // Construction de la requête selon les champs à mettre à jour
            let query = 'UPDATE users SET ';
            const params = [];
            const fields = [];

            // Ajouter les champs à mettre à jour
            if (userData.username) {
                fields.push('username = ?');
                params.push(userData.username);
            }
            
            if (userData.password) {
                const hashedPassword = await generatePasswordHash(userData.password);
                fields.push('password = ?');
                params.push(hashedPassword);
            }
            
            if (userData.email) {
                fields.push('email = ?');
                params.push(userData.email);
            }
            
            // S'assurer qu'il y a des champs à mettre à jour
            if (fields.length === 0) {
                return callback(new Error('Aucun champ à mettre à jour'));
            }
            
            // Compléter la requête
            query += fields.join(', ') + ' WHERE id = ?';
            params.push(id);
            
            if (typeof callback === 'function') {
                connection.query(query, params, callback);
            } else {
                throw new TypeError('Callback manquant ou invalide dans la méthode update.');
            }
        } catch (error) {
            if (typeof callback === 'function') {
                callback(error);
            } else {
                throw error;
            }
        }
    },

    /**
     * @function updatePassword
     * @description Fonction spécifique pour mettre à jour le mot de passe d'un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @param {string} newPassword - Nouveau mot de passe
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    updatePassword: async (id, newPassword, callback) => {
        try {
            const hashedPassword = await generatePasswordHash(newPassword);
            const query = 'UPDATE users SET password = ? WHERE id = ?';
            
            if (typeof callback === 'function') {
                connection.query(query, [hashedPassword, id], callback);
            } else {
                throw new TypeError('Callback manquant ou invalide dans la méthode updatePassword.');
            }
        } catch (error) {
            if (typeof callback === 'function') {
                callback(error);
            } else {
                throw error;
            }
        }
    },

    /**
     * @function updateEmail
     * @description Fonction spécifique pour mettre à jour l'email d'un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @param {string} email - Nouvel email
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    updateEmail: (id, email, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode updateEmail.');
        }

        const query = 'UPDATE users SET email = ? WHERE id = ?';
        connection.query(query, [email, id], callback);
    },

    /**
     * @function delete
     * @description Fonction pour supprimer un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @param {function} callback - Fonction de callback pour gérer le résultat
     */
    delete: (id, callback) => {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback manquant ou invalide dans la méthode delete.');
        }

        const query = 'DELETE FROM users WHERE id = ?';
        connection.query(query, [id], callback);
    },
};

module.exports = User;
