const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configuration de la connexion à la base de données
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mouloubs',
  database: 'db_gamming'
});

async function verifyUserPassword(username, password) {
  try {
    // Récupération de l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      console.log('Utilisateur non trouvé');
      return;
    }
    
    const user = users[0];
    console.log(`Utilisateur trouvé: ${user.username}`);
    console.log(`Rôle: ${user.role}`);
    
    // Vérification du mot de passe
    const match = await bcrypt.compare(password, user.password);
    
    if (match) {
      console.log('Le mot de passe est correct');
    } else {
      console.log('Le mot de passe est incorrect');
      console.log('Mot de passe haché stocké:', user.password);
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    db.end();
  }
}

// Remplacez par le nom d'utilisateur et le mot de passe que vous voulez vérifier
verifyUserPassword('Mouloubs', 'Arielle2525'); 