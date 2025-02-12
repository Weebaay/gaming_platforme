/**
 * @file src/util/utils.js
 * Décode un jeton JWT (JSON Web Token) et retourne un objet JSON contenant les informations décodées.
 *
 * @param {string} token Le jeton JWT à décoder.
 * @returns {object|null} Un objet JSON contenant les informations décodées du jeton, ou null en cas d'erreur.
 */
export function decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du jeton JWT :', error);
      return null;
    }
  }
  