const bcrypt = require('bcrypt');

const password = 'Arielle2525';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erreur lors du hachage du mot de passe:', err);
  } else {
    console.log('Mot de passe haché:', hash);
  }
}); 