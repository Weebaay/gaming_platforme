// models/score.js
const { connection, handleDBError} = require('../db');
    const Score = {
    create: (scoreData, callback) => {
        const query = 'INSERT INTO scores (user_id, game_id, points) VALUES (?, ?, ?)';
        connection.query(query, [scoreData.user_id, scoreData.game_id, scoreData.points], callback);
    },

    getByUserId: (userId, callback) => {
        const query = 'SELECT * FROM scores WHERE user_id = ?';
        connection.query(query, [userId], callback);
    },

    delete: (id, callback) => {
        const query = 'DELETE FROM scores WHERE id = ?';
        connection.query(query, [id], callback);
    },
    };
    module.exports = Score;