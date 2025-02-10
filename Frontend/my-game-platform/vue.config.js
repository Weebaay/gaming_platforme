/**
 * @file vue.config.js
 * @description Configure le proxy pour rediriger les requêtes API vers le backend, sans gérer les WebSockets.
 */

const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
	transpileDependencies: true,
	devServer: {
	  proxy: {
		'/api': {
		  target: 'http://localhost:3000', // URL de votre backend
		  changeOrigin: true, // Change l'origine de l'hôte pour correspondre à celle du backend
		  ws: false, // Désactive WebSocket
		},
	  },
	},
  });
  