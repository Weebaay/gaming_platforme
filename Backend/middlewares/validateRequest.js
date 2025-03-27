/**
 * @file middlewares/validateRequest.js
 * @description Middleware de validation générique utilisant express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Formatte les erreurs de validation dans un format standard
 * @param {Object} errors - Objet d'erreurs de express-validator
 * @returns {Object} Erreurs formatées
 */
const formatErrors = (errors) => {
    return {
        status: 'error',
        errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }))
    };
};

/**
 * Middleware de validation qui vérifie les règles définies
 * @param {Array} validations - Tableau de règles de validation
 * @returns {Function} Middleware Express
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Exécute toutes les validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Vérifie s'il y a des erreurs
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(formatErrors(errors));
        }

        next();
    };
};

module.exports = validateRequest; 