const bcrypt = require('bcrypt');

const passwordEnClair = 'Arielle2525'; // Remplacez par le mot de passe que vous avez utilisé
const hashStocké = '$2b$10$lUSxnTFAEjnlJIcY0OJ/h.UYuJ5V56SzNfumW9fdHG3COdbpTWcMO'; // Remplacez par le hachage stocké

bcrypt.compare(passwordEnClair, hashStocké, (err, result) => {
  if (err) {
    console.error('Erreur lors de la vérification du mot de passe:', err);
  } else if (result) {
    console.log('Le mot de passe est correct.');
  } else {
    console.log('Le mot de passe est incorrect.');
  }
});