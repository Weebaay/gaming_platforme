/**
 * @file validators/index.js
 * @description Point d'entrée centralisé pour tous les validateurs
 */

const validateRequest = require('../middlewares/validateRequest');
const userValidator = require('./userValidator');
const commonRules = require('./commonRules');

module.exports = {
    validateRequest,
    ...userValidator,
    ...commonRules
}; 