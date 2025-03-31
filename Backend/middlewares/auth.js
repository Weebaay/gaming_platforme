const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/security');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log(`[ERROR] Token manquant ou format invalide: ${authHeader}`);
        return res.status(401).json({ error: 'Authentification requise' });
    }

    const token = authHeader.split(' ')[1];
    console.log(`[DEBUG] Token reçu: ${token.substring(0, 15)}...`);

    try {
        const decoded = jwt.verify(token, jwtConfig.secret, {
            algorithms: [jwtConfig.options.algorithm],
            issuer: jwtConfig.options.issuer,
            audience: jwtConfig.options.audience
        });

        console.log(`[INFO] Token décodé avec succès pour l'utilisateur : ${decoded.username}, rôle: ${decoded.role}`);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(`[ERROR] Échec de vérification du token: ${err.message}`);
        return res.status(403).json({ 
            error: 'Token invalide',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
};

const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        console.log(`[ERROR] Utilisateur non authentifié`);
        return res.status(401).json({ error: 'Authentification requise' });
    }

    if (req.user.role === 'ADMIN') {
        console.log(`[INFO] Accès admin autorisé pour l'utilisateur : ${req.user.username}`);
        next();
    } else {
        console.log(`[ERROR] Accès interdit pour l'utilisateur : ${req.user.username}, rôle : ${req.user.role}`);
        return res.status(403).json({ error: 'Accès interdit, vous devez être administrateur' });
    }
};

module.exports = { verifyJWT, verifyAdmin };