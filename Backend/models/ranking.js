// models/ranking.js
const { connection, handleDBError} = require('../db');

const Ranking = {
create: (rankingData, callback) => {
	const query = 'INSERT INTO rankings (user_id, game_id, points) VALUES (?, ?, ?)';
	connection.query(query, [rankingData.user_id, rankingData.game_id, rankingData.points], callback);
},

getAll: (callback) => {
	const query = 'SELECT rankings.user_id, users.username, rankings.game_id, rankings.points FROM rankings JOIN users ON rankings.user_id = users.id ORDER BY points DESC';
	connection.query(query, callback);
},

getByUserId: (userId, callback) => {
	const query = 'SELECT * FROM rankings WHERE user_id = ? ORDER BY points DESC';
	connection.query(query, [userId], callback);
},
delete: (id, callback) => {
	const query = 'DELETE FROM rankings WHERE id = ?';
	connection.query(query, [id], callback);
},
};
module.exports = Ranking;