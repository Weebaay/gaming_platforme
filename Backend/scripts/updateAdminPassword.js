const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configuration de la connexion à la base de données
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mouloubs',
  database: 'db_gamming'
});

async function updateAdminPassword(username, newPassword) {
  try {
    // Générer le hash du nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe dans la base de données
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE username = ? AND role = "ADMIN"',
      [hashedPassword, username]
    );
    
    if (result.affectedRows === 0) {
      console.log('Aucun utilisateur administrateur trouvé avec ce nom d\'utilisateur');
    } else {
      console.log('Mot de passe mis à jour avec succès !');
      console.log('Nouveau mot de passe haché :', hashedPassword);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe :', error);
  } finally {
    db.end();
  }
}

// Remplacez par le nom d'utilisateur de l'administrateur et le nouveau mot de passe
updateAdminPassword('Mouloubs', 'Arielle2525'); 