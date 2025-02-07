// models/game.js
const { connection, handleDBError} = require('../db');

const Game = {
	create: (gameData, callback) => {
	const query = 'INSERT INTO games (name, description) VALUES (?, ?)';
	connection.query(query, [gameData.name, gameData.description], callback);
	},

	getById: (id, callback) => {
	const query = 'SELECT * FROM games WHERE id = ?';
	connection.query(query, [id], (err, results) => {
		if (err) return callback(err);
		callback(null, results[0]);
	});
	},

	getAll: (callback) => {
	const query = 'SELECT * FROM games';
	connection.query(query, callback);
	},

	update: (id, gameData, callback) => {
	const query = 'UPDATE games SET name = ?, description = ? WHERE id = ?';
	connection.query(query, [gameData.name, gameData.description, id], callback);
	},

	delete: (id, callback) => {
	const query = 'DELETE FROM games WHERE id = ?';
	connection.query(query, [id], callback);
	},
};

module.exports = Game;