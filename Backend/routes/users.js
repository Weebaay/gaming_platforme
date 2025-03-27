const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ajouter bcrypt pour sécuriser les mots de passe
const User = require('../models/user'); // Import direct si User n'est pas dans index.js
const ResetToken = require('../models/resetToken'); // Importer le modèle des jetons de réinitialisation
const { handleDBError } = require('../db');
const { loginLimiter } = require('../middlewares/rateLimiter'); // Importer le middleware de limitation
const { sendPasswordResetEmail } = require('../services/emailService'); // Importer le service d'email
const emailService = require('../services/emailService'); // Ajout de l'import complet
const { createRateLimiter } = require('../middlewares/rateLimiter');
const { jwtConfig } = require('../config/security');
const validateRequest = require('../middlewares/validateRequest');
const { 
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyResetToken,
    validateUpdateProfile
} = require('../validators/userValidator');

// Limiteur spécifique pour les demandes de réinitialisation de mot de passe
const resetLimiter = createRateLimiter({
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 heure
    keyGenerator: (req) => {
        return `${req.ip}:reset-password`;
    }
});

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Inscrire un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: ^[a-zA-Z0-9_-]+$
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial
 *               confirmPassword:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Utilisateur inscrit avec succès
 *       400:
 *         description: Erreur de validation ou nom d'utilisateur déjà utilisé
 *       500:
 *         description: Erreur lors de l'inscription
 */
router.post('/register', validateRequest(validateRegister), async (req, res) => {
    const { username, password, email } = req.body;

    try {
        User.getByUsername(username, async (err, existingUser) => {
            if (err) {
                console.error('Erreur base de données :', err);
                return handleDBError(err, res);
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
            }

            if (email) {
                User.getByEmail(email, (err, existingUserEmail) => {
                    if (err) return handleDBError(err, res);
                    if (existingUserEmail) {
                        return res.status(400).json({ error: 'Email déjà utilisé' });
                    }

                    User.create({ username, password, email }, (err) => {
                        if (err) return handleDBError(err, res);
                        console.log(`Utilisateur enregistré : ${username} avec email: ${email}`);
                        res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
                    });
                });
            } else {
                User.create({ username, password }, (err) => {
                    if (err) return handleDBError(err, res);
                    console.log(`Utilisateur enregistré : ${username}`);
                    res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
                });
            }
        });
    } catch (error) {
        console.error('Erreur dans /register :', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Identifiants incorrects
 *       429:
 *         description: Trop de tentatives
 */
router.post('/login', loginLimiter, validateRequest(validateLogin), async (req, res) => {
    const { username, password } = req.body;

    try {
        User.getByUsername(username, async (err, user) => {
            if (err) return handleDBError(err, res);
            if (!user) {
                return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                jwtConfig.secret,
                {
                    ...jwtConfig.options,
                    subject: user.id.toString()
                }
            );

            console.log('Utilisateur connecté avec succès :', username);
            res.status(200).json({ 
                message: 'Connexion réussie', 
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email
                }
            });
        });
    } catch (error) {
        handleDBError(error, res);
    }
});

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
router.post('/forgot-password', resetLimiter, validateRequest(validateForgotPassword), async (req, res) => {
    const { email } = req.body;

    try {
        User.getByEmail(email, (err, user) => {
            if (err) {
                console.error('Erreur lors de la recherche de l\'utilisateur:', err);
                return handleDBError(err, res);
            }

            if (!user) {
                return res.status(200).json({ 
                    message: 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.' 
                });
            }

            ResetToken.create(user.id, (err, token) => {
                if (err) {
                    console.error('Erreur lors de la création du token:', err);
                    return handleDBError(err, res);
                }

                sendPasswordResetEmail(email, user.username, token)
                    .then(() => {
                        console.log(`Email de réinitialisation envoyé à: ${email}`);
                        res.status(200).json({ 
                            message: 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.' 
                        });
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'envoi de l\'email:', error);
                        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
                    });
            });
        });
    } catch (error) {
        console.error('Erreur dans /forgot-password:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

/**
 * @swagger
 * /api/users/verify-reset-token:
 *   post:
 *     tags: [Users]
 *     summary: Vérifie la validité d'un token de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de réinitialisation
 *     responses:
 *       200:
 *         description: Token valide
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/verify-reset-token', validateRequest(validateVerifyResetToken), async (req, res) => {
    try {
        const { token } = req.body;
        const isValid = await emailService.verifyPasswordResetToken(token);
        
        if (!isValid) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }
        
        res.json({ message: 'Token valide' });
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        res.status(500).json({ message: 'Erreur lors de la vérification du token' });
    }
});

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 */
router.post('/reset-password', validateRequest(validateResetPassword), async (req, res) => {
    const { token, password } = req.body;

    try {
        ResetToken.verify(token, (err, userId) => {
            if (err) return handleDBError(err, res);
            if (!userId) {
                return res.status(401).json({ error: 'Jeton invalide ou expiré' });
            }

            User.updatePassword(userId, password, (err) => {
                if (err) return handleDBError(err, res);

                ResetToken.delete(token, (err) => {
                    if (err) console.error('Erreur lors de la suppression du token:', err);
                });

                ResetToken.cleanExpired((err) => {
                    if (err) console.error('Erreur lors du nettoyage des tokens:', err);
                });

                res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
            });
        });
    } catch (error) {
        console.error('Erreur dans /reset-password:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

module.exports = router;
