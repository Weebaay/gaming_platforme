/**
 * @file validators/userValidator.js
 * @description Validateurs pour les opérations liées aux utilisateurs
 */

const { body } = require('express-validator');
const { 
    usernameRules, 
    passwordRules, 
    emailRules,
    roleRules
} = require('./commonRules');

// Validation pour l'inscription
const validateRegister = [
    ...usernameRules,
    ...passwordRules,
    ...emailRules.map(rule => rule.optional()), // Email optionnel pour l'inscription
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Les mots de passe ne correspondent pas');
            }
            return true;
        })
];

// Validation pour la connexion
const validateLogin = [
    ...usernameRules,
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
];

// Validation pour la demande de réinitialisation de mot de passe
const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('L\'email n\'est pas valide')
        .normalizeEmail()
];

// Validation pour la vérification du token de réinitialisation
const validateVerifyResetToken = [
    body('token')
        .notEmpty().withMessage('Le jeton de réinitialisation est requis')
        .isString().withMessage('Le jeton doit être une chaîne de caractères')
        .isLength({ min: 1 }).withMessage('Le jeton ne peut pas être vide')
];

// Validation pour la réinitialisation de mot de passe
const validateResetPassword = [
    body('token')
        .notEmpty().withMessage('Le jeton de réinitialisation est requis')
        .isString().withMessage('Le jeton doit être une chaîne de caractères'),
    ...passwordRules,
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Les mots de passe ne correspondent pas');
            }
            return true;
        })
];

// Validation pour la mise à jour du profil
const validateUpdateProfile = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('L\'email n\'est pas valide')
        .normalizeEmail(),
    ...roleRules,
    body('currentPassword')
        .if(body('newPassword').exists())
        .notEmpty().withMessage('Le mot de passe actuel est requis pour changer le mot de passe'),
    body('newPassword')
        .optional()
        .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/).withMessage('Le nouveau mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/).withMessage('Le nouveau mot de passe doit contenir au moins une minuscule')
        .matches(/[0-9]/).withMessage('Le nouveau mot de passe doit contenir au moins un chiffre')
        .matches(/[!@#$%^&*]/).withMessage('Le nouveau mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)')
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateVerifyResetToken,
    validateResetPassword,
    validateUpdateProfile
}; 