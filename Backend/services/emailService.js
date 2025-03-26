/**
 * @file services/emailService.js
 * @description Service pour l'envoi d'emails, notamment pour la récupération de mot de passe
 */

const nodemailer = require('nodemailer');

// Configuration du transporteur d'emails
// Pour la production, vous utiliserez un service SMTP réel
// Pour le développement, nous utilisons un compte de test qui capture les emails
let transporter;

// En environnement de développement, nous utilisons Ethereal (service de test)
if (process.env.NODE_ENV !== 'production') {
    // Créer un compte de test sur Ethereal
    nodemailer.createTestAccount()
        .then(testAccount => {
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true pour 465, false pour les autres ports
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('📧 Service d\'email de test configuré. Les emails seront capturés par Ethereal.');
            console.log(`📬 Identifiants Ethereal - Email: ${testAccount.user}, Mot de passe: ${testAccount.pass}`);
        })
        .catch(err => {
            console.error('Erreur lors de la création du compte de test pour les emails:', err);
        });
} else {
    // Configuration pour la production
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    console.log('📧 Service d\'email configuré pour la production.');
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} to - Email du destinataire
 * @param {string} username - Nom d'utilisateur
 * @param {string} token - Jeton de réinitialisation
 * @returns {Promise} - Promesse résolue avec les informations d'envoi ou rejetée avec une erreur
 */
async function sendPasswordResetEmail(to, username, token) {
    const resetUrl = `http://localhost:8080/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Plateforme de Jeux" <noreply@gaming-platform.com>',
        to,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Bonjour ${username},\n\nVous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :\n\n${resetUrl}\n\nCe lien est valable pendant 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\nCordialement,\nL'équipe de la Plateforme de Jeux`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #4a4a4a;">Réinitialisation de votre mot de passe</h2>
                <p>Bonjour <strong>${username}</strong>,</p>
                <p>Vous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #4e73df; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a>
                </div>
                <p>Ce lien est valable pendant <strong>1 heure</strong>.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe de la Plateforme de Jeux</p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                    <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur : <br>${resetUrl}</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email de réinitialisation envoyé à ${to}: ${info.messageId}`);
        
        // Pour les comptes de test, afficher l'URL de prévisualisation
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📩 URL de prévisualisation: ${nodemailer.getTestMessageUrl(info)}`);
        }
        
        return info;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
        throw error;
    }
}

module.exports = {
    sendPasswordResetEmail
}; 