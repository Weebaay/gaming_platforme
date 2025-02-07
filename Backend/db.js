const mysql = require('mysql');
require('dotenv').config();

// Création de la connexion à la base de données
const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données: ' + err.stack);
        return;
    }
    console.log('Connecté à la base de données MySQL avec l\'ID ' + connection.threadId);
});

/**
* @function handleDBError
* @description Fonction pour gérer les erreurs de la base de données
* @param {Error} err - L'erreur à gérer
* @param {Object} res - L'objet de réponse
* @returns {Object} - une réponse json avec un code d'erreur (500) et un message d'erreur formaté
*/
const handleDBError = (err, res) => {
    console.error('Erreur base de données :', err);
    return res.status(500).json({ error: 'Erreur serveur interne' , message : err.message});
};

module.exports = { connection, handleDBError };