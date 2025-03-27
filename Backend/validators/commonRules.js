/**
 * @file validators/commonRules.js
 * @description Règles de validation communes pour l'application
 */

const { body } = require('express-validator');

// Règles de validation pour le nom d'utilisateur
const usernameRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('Choisis un nom de joueur')
        .isLength({ min: 3, max: 30 }).withMessage('Ton nom de joueur doit avoir entre 3 et 30 caractères')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Ton nom de joueur ne peut contenir que des lettres (sans accents), des chiffres, - et _')
];

// Règles de validation pour le mot de passe
const passwordRules = [
    body('password')
        .notEmpty().withMessage('N\'oublie pas ton mot de passe !')
        .isLength({ min: 8 }).withMessage('Ton mot de passe doit avoir au moins 8 caractères')
        .matches(/[A-Za-z]/).withMessage('Ajoute au moins une lettre')
        .matches(/[0-9]/).withMessage('Ajoute au moins un chiffre')
];

// Règles de validation pour l'email
const emailRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('On a besoin de ton email')
        .isEmail().withMessage('Cet email ne semble pas valide')
        .normalizeEmail()
];

// Règles de validation pour les identifiants numériques
const idRules = (fieldName) => [
    body(fieldName)
        .notEmpty().withMessage(`L'identifiant ${fieldName} est requis`)
        .isInt({ min: 1 }).withMessage(`L'identifiant ${fieldName} doit être un nombre positif`)
];

// Règles de validation pour le rôle utilisateur
const roleRules = [
    body('role')
        .optional()
        .isIn(['USER', 'ADMIN']).withMessage('Le rôle doit être soit USER soit ADMIN')
];

// Règles de validation pour les chaînes de texte génériques
const textFieldRules = (fieldName, { min = 1, max = 255 } = {}) => [
    body(fieldName)
        .trim()
        .notEmpty().withMessage(`Le champ ${fieldName} est requis`)
        .isLength({ min, max }).withMessage(`Le champ ${fieldName} doit contenir entre ${min} et ${max} caractères`)
];

// Règles de validation pour les dates
const dateRules = (fieldName) => [
    body(fieldName)
        .optional()
        .isISO8601().withMessage(`Le champ ${fieldName} doit être une date valide`)
        .toDate()
];

module.exports = {
    usernameRules,
    passwordRules,
    emailRules,
    idRules,
    roleRules,
    textFieldRules,
    dateRules
}; 