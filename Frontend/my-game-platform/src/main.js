/**
 * @file main.js
 * @description Point d'entrée principal de l'application Vue.js. Monte l'application et connecte le routeur.
 */

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Import Bootstrap CSS et JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import des styles personnalisés
import './assets/styles/theme.css';
import './assets/styles/animations.css';

const app = createApp(App);

// Si vous avez un gestionnaire d'erreurs global
app.config.errorHandler = (err, instance, info) => {
  console.error(`Erreur capturée : ${err}`);
  console.error(`Instance :`, instance);
  console.error(`Info :`, info);
  alert("Une erreur est survenue. Veuillez réessayer.");
};

app.use(router).mount('#app');
