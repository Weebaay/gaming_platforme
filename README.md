# HolberGames - Plateforme de Jeux

Une plateforme de jeux moderne et interactive développée avec Vue.js, offrant une expérience de jeu immersive avec un design néon cyberpunk.

## 🎮 Fonctionnalités

- **Système d'Authentification**
  - Inscription et connexion des utilisateurs
  - Gestion des sessions avec JWT

- **Jeux Disponibles**
  - 🎲 Jeu des Dés (mode solo, multijoueur et local)
  - ⭕ Morpion (mode solo contre IA, multijoueur et local)
  - ✌️ Pierre-Feuille-Ciseaux (contre l'IA)

- **Fonctionnalités Sociales**
  - 🏆 Classement des joueurs
  - 📊 Statistiques par jeu
  - 🎯 Suivi des victoires/défaites/égalités

- **Interface Utilisateur**
  - Design moderne avec thème cyberpunk
  - Animations fluides et effets néon
  - Interface responsive

## 🛠️ Technologies Utilisées

### Frontend
- **Framework Principal**
  - Vue.js 3
  - Vue Router pour la navigation
  - Vuex pour la gestion d'état

- **Communication**
  - Axios pour les requêtes HTTP
  - Socket.io-client pour le temps réel

- **Styles**
  - CSS moderne avec variables personnalisées (custom properties)
  - Flexbox et Grid pour la mise en page
  - Animations et transitions CSS natives
  - Media queries pour le responsive design
  - Font Awesome pour les icônes
  - Effets visuels avancés (gradients, blur, néon)

- **Build & Development**
  - Vue CLI
  - Babel pour la compatibilité JavaScript
  - ESLint pour la qualité du code

### Backend
- **Framework Principal**
  - Node.js
  - Express.js pour l'API REST
  - Socket.io pour le temps réel

- **Base de données**
  - MySQL
  - Sequelize ORM

- **Sécurité**
  - JWT (jsonwebtoken)
  - Bcrypt pour le hashage
  - CORS
  - Helmet pour la sécurité HTTP

- **Validation & Logging**
  - Express-validator
  - Winston pour les logs
  - Morgan pour le logging HTTP

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone https://github.com/Weebaay/gaming_platforme
```

2. **Configuration Base de données**
```bash
# Se connecter à MySQL
mysql -h localhost -u root -p

# Créer la base de données
CREATE DATABASE db_gamming;

# Utiliser la base de données
USE db_gamming;

# Structure de la base de données
SHOW TABLES;
# Vous devriez voir les tables suivantes :
# - users
# - games
# - game_sessions
# - player_progress
# - rankings
# - sessions

# Pour quitter MySQL
exit
```

3. **Configuration Backend**
```bash
cd Backend
npm install
node server.js
```
Le serveur backend sera lancé sur http://localhost:3000

4. **Configuration Frontend**
```bash
cd Frontend/my-game-platform
npm install
```

5. **Configuration des variables d'environnement**
- Créer un fichier `.env` à la racine du dossier Frontend/my-game-platform
- Ajouter les variables d'environnement nécessaires :
```env
VUE_APP_API_URL=http://localhost:3000
```

- Créer un fichier `.env` à la racine du dossier Backend
- Ajouter les variables d'environnement nécessaires :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=db_gamming
JWT_SECRET=votre_clé_secrète
```

6. **Lancer l'application**
- Pour le développement :
```bash
npm run serve
```
L'application sera accessible sur http://localhost:8080

- Pour la production :
```bash
npm run build
```

## 📱 Compatibilité

- ✅ Desktop (Chrome, Firefox, Safari)
- ✅ Tablettes
- ✅ Mobile

## 🔒 Sécurité

- Authentification JWT
- Protection des routes
- Validation des données
- Hashage des mots de passe
- Protection CSRF
- Headers de sécurité

## 🎨 Personnalisation

Le thème de l'application peut être modifié en ajustant les variables CSS dans `App.vue`.

## 📝 Scripts Disponibles

- `npm run serve` : Lance le serveur de développement
- `npm run build` : Compile le projet pour la production
- `npm run lint` : Vérifie et corrige le style du code

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
