const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ajouter bcrypt pour sécuriser les mots de passe
const User = require('../models/user'); // Import direct si User n'est pas dans index.js
const ResetToken = require('../models/resetToken'); // Importer le modèle des jetons de réinitialisation
const { handleDBError } = require('../db');
const { loginLimiter } = require('../middlewares/rateLimiter'); // Importer le middleware de limitation
const { sendPasswordResetEmail } = require('../services/emailService'); // Importer le service d'email
const { createRateLimiter } = require('../middlewares/rateLimiter'); // Pour créer un limiteur personnalisé

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
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur inscrit avec succès
 *       400:
 *         description: Nom d'utilisateur déjà utilisé
 *       500:
 *         description: Erreur lors de l'inscription
 */
router.post('/register', async (req, res) => {
    console.log('POST /api/register appelé');
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe manquant' });
    }

    try {
        // Appel de getByUsername avec un callback valide
        User.getByUsername(username, async (err, existingUser) => {
            if (err) {
                console.error('Erreur base de données :', err);
                return handleDBError(err, res);
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
            }

            // Vérifier si l'email est déjà utilisé (si fourni)
            if (email) {
                User.getByEmail(email, (err, existingUserEmail) => {
                    if (err) {
                        return handleDBError(err, res);
                    }

                    if (existingUserEmail) {
                        return res.status(400).json({ error: 'Email déjà utilisé' });
                    }

                    // Création d'un nouvel utilisateur avec email
                    User.create({ username, password, email }, (err) => {
                        if (err) {
                            return handleDBError(err, res);
                        }

                        console.log(`Utilisateur enregistré : ${username} avec email: ${email}`);
                        res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
                    });
                });
            } else {
                // Création d'un nouvel utilisateur sans email
                User.create({ username, password }, (err) => {
                    if (err) {
                        return handleDBError(err, res);
                    }

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
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants incorrects
 *       429:
 *         description: Trop de tentatives, veuillez réessayer plus tard
 *       500:
 *         description: Erreur lors de la connexion
 */
router.post('/login', loginLimiter, async (req, res) => {
    console.log("Tentative de connexion avec:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe manquant' });
    }

    try {
        // Appel de getByUsername avec un callback valide
        User.getByUsername(username, async (err, user) => {
            if (err) {
                return handleDBError(err, res);
            }

            if (!user) {
                return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            // Génération du token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Utilisateur connecté avec succès :', username);
            res.status(200).json({ message: 'Connexion réussie', token });
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
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé (toujours retourné pour des raisons de sécurité)
 *       429:
 *         description: Trop de tentatives, veuillez réessayer plus tard
 *       500:
 *         description: Erreur lors de l'envoi de l'email
 */
router.post('/forgot-password', resetLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email manquant' });
    }

    try {
        // Rechercher l'utilisateur par email
        User.getByEmail(email, (err, user) => {
            if (err) {
                console.error('Erreur lors de la recherche de l\'utilisateur par email:', err);
                return handleDBError(err, res);
            }

            // Pour des raisons de sécurité, nous renvoyons toujours un message de succès
            // même si l'email n'existe pas
            if (!user) {
                console.log(`Tentative de réinitialisation pour un email non existant: ${email}`);
                return res.status(200).json({ 
                    message: 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.' 
                });
            }

            // Créer un jeton de réinitialisation
            ResetToken.create(user.id, (err, token) => {
                if (err) {
                    console.error('Erreur lors de la création du jeton de réinitialisation:', err);
                    return handleDBError(err, res);
                }

                // Envoyer l'email de réinitialisation
                sendPasswordResetEmail(email, user.username, token)
                    .then(() => {
                        console.log(`Email de réinitialisation envoyé à: ${email}`);
                        res.status(200).json({ 
                            message: 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.' 
                        });
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'envoi de l\'email:', error);
                        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de réinitialisation' });
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
 *     summary: Vérifier la validité d'un jeton de réinitialisation
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jeton valide
 *       400:
 *         description: Jeton manquant
 *       401:
 *         description: Jeton invalide ou expiré
 *       500:
 *         description: Erreur lors de la vérification du jeton
 */
router.post('/verify-reset-token', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Jeton manquant' });
    }

    try {
        ResetToken.verify(token, (err, userId) => {
            if (err) {
                return handleDBError(err, res);
            }

            if (!userId) {
                return res.status(401).json({ error: 'Jeton invalide ou expiré' });
            }

            res.status(200).json({ valid: true });
        });
    } catch (error) {
        console.error('Erreur dans /verify-reset-token:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec un jeton valide
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Données manquantes
 *       401:
 *         description: Jeton invalide ou expiré
 *       500:
 *         description: Erreur lors de la réinitialisation du mot de passe
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Jeton ou nouveau mot de passe manquant' });
    }

    try {
        // Vérifier si le jeton est valide
        ResetToken.verify(token, (err, userId) => {
            if (err) {
                return handleDBError(err, res);
            }

            if (!userId) {
                return res.status(401).json({ error: 'Jeton invalide ou expiré' });
            }

            // Mettre à jour le mot de passe de l'utilisateur
            User.updatePassword(userId, newPassword, (err) => {
                if (err) {
                    return handleDBError(err, res);
                }

                // Supprimer le jeton utilisé
                ResetToken.delete(token, (err) => {
                    if (err) {
                        console.error('Erreur lors de la suppression du jeton:', err);
                        // Continuer même si la suppression échoue
                    }

                    // Nettoyer les jetons expirés
                    ResetToken.cleanExpired((err) => {
                        if (err) {
                            console.error('Erreur lors du nettoyage des jetons expirés:', err);
                            // Continuer même si le nettoyage échoue
                        }

                        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Erreur dans /reset-password:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

module.exports = router;
