#!/bin/bash

# Script pour exécuter les tests unitaires du projet

echo "🧪 Exécution des tests unitaires du système de classement 🧪"
echo "=========================================================="

# Aller au répertoire du projet
cd /home/weebaay/gaming_platforme/Frontend/my-game-platform

# Nettoyer la couverture précédente
echo "🧹 Nettoyage des rapports précédents..."
rm -rf coverage

# Exécuter les tests individuellement pour plus de détails
echo -e "\n📊 Test du composant Leaderboard (Mode IA)..."
npm run test:unit -- tests/unit/leaderboard.spec.js

echo -e "\n🏆 Test du composant LeaderboardOnline (Mode Multijoueur)..."
npm run test:unit -- tests/unit/leaderboardOnline.spec.js

echo -e "\n🔄 Test des communications API..."
npm run test:unit -- tests/unit/leaderboardApi.spec.js

echo -e "\n🧮 Test des calculs statistiques..."
npm run test:unit -- tests/unit/leaderboardCalcs.spec.js

# Exécuter tous les tests avec couverture
echo -e "\n📈 Exécution de tous les tests avec rapport de couverture..."
npm run test:unit -- --coverage

echo -e "\n✅ Tests terminés!"
echo "Pour voir le rapport de couverture détaillé, ouvrez coverage/lcov-report/index.html" 