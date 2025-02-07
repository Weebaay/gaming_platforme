const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ajouter bcrypt pour sécuriser les mots de passe
const User = require('../models/user'); // Import direct si User n'est pas dans index.js
const { handleDBError } = require('../db');

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
    const { username, password } = req.body;

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

            // Création d'un nouvel utilisateur
            User.create({ username, password }, (err) => {
                if (err) {
                    return handleDBError(err, res);
                }

                console.log(`Utilisateur enregistré : ${username}`);
                res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
            });
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
 *       500:
 *         description: Erreur lors de la connexion
 */
router.post('/login', async (req, res) => {
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

module.exports = router;
