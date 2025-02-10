const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

	console.log("authHeader :", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log(`[ERROR] Token manquant ou format invalide`);
        return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Token brut reçu pour vérification :", token);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        console.log("JWT_SECRET utilisé pour la vérification :", process.env.JWT_SECRET);
        console.log("Token reçu :", token);
        if (err) {
            console.log(`[ERROR] Échec de vérification du token: ${err.message}`);
            return res.status(403).json({ message: 'Token invalide' });
        }
        
        console.log(`[INFO] Token décodé avec succès : ${JSON.stringify(decoded)}`);
        req.user = decoded; // Ajoute les informations de l'utilisateur à la requête
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    // Vérification du role admin
    if (req.user && req.user.role === 'ADMIN') {
        console.log(`[INFO] Accès admin autorisé pour l'utilisateur : ${req.user.username}`);
        next(); // Si l'utilisateur est un admin, continuer
    } else {
        console.log(`Accès interdit pour l'utilisateur : ${req.user?.username || 'Inconnu'}, rôle : ${req.user?.role || 'Non défini'}`);
        return res.status(403).json({ error: 'Accès interdit, vous devez être administrateur' });
    }
};


module.exports = { verifyJWT, verifyAdmin };